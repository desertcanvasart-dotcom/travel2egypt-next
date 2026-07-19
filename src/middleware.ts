import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { routing } from './i18n/routing';
import { isProductionHost } from './lib/site';
import { CURRENCY_COOKIE } from './lib/currency';
import { currencyForCountry } from './lib/geo-currency';
import { buildCookieValue } from './lib/concierge/cookie';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS } from './lib/concierge/constants';
import { verifyResumeToken } from './lib/concierge/resumeToken';

const intlMiddleware = createMiddleware(routing);

/**
 * Resume-link handler (Session 4). A Server Component can't set cookies
 * during render, so the `/plan-your-tour?resume=<token>` link (sent by the
 * "save my conversation" email) is consumed here in middleware: verify the
 * HMAC token, set the signed session cookie, and redirect to the clean URL.
 * Web Crypto only — runs on the Edge runtime. On an invalid/expired token we
 * still redirect clean, with `?resume_error=1` for the page to surface a
 * gentle notice.
 */
async function handleResume(request: NextRequest): Promise<NextResponse | null> {
  const token = request.nextUrl.searchParams.get('resume');
  if (!token) return null;

  const clean = request.nextUrl.clone();
  clean.searchParams.delete('resume');

  const cookieId = await verifyResumeToken(token);
  if (!cookieId) {
    clean.searchParams.set('resume_error', '1');
    return NextResponse.redirect(clean);
  }

  const host = request.headers.get('host')?.split(':')[0].toLowerCase() ?? '';
  const onSiteDomain = host === 'travel2egypt.org' || host.endsWith('.travel2egypt.org');
  const response = NextResponse.redirect(clean);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: await buildCookieValue(cookieId),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    ...(onSiteDomain ? { domain: '.travel2egypt.org' } : {}),
  });
  return response;
}

export default async function middleware(request: NextRequest) {
  const resumeResponse = await handleResume(request);
  if (resumeResponse) return resumeResponse;

  const response = intlMiddleware(request);

  // Geo currency default (Phase 2, cache-safe). On first visit only — never
  // overriding a manual selection — set the display-currency cookie from
  // Cloudflare's `cf-ipcountry` header. The SSR HTML still renders the per-locale
  // default (deterministic/cacheable); the client CurrencyProvider reads this
  // cookie and swaps after hydration. No-op when the header is absent (e.g. the
  // Railway URL not yet behind Cloudflare), so behaviour is unchanged until then.
  if (!request.cookies.get(CURRENCY_COOKIE)) {
    const ccy = currencyForCountry(request.headers.get('cf-ipcountry'));
    if (ccy) {
      response.cookies.set({
        name: CURRENCY_COOKIE,
        value: ccy,
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      });
    }
  }

  // Keep non-production hosts (the Railway deployment URL pre-cutover)
  // out of search results. Runtime host check — lifts automatically once
  // the request host becomes travel2egypt.org at DNS cutover, no redeploy.
  if (!isProductionHost(request.headers.get('host'))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  // Match all paths except:
  //  - /api
  //  - /studio (Sanity Studio)
  //  - /admin  (S10 admin reviewer panel — must not be locale-prefixed)
  //  - Next.js internals (_next, _vercel)
  //  - Files with extensions (favicon.ico, etc.)
  matcher: ['/((?!api|studio|admin|_next|_vercel|.*\\..*).*)'],
};
