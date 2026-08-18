import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { routing } from './i18n/routing';
import { isProductionHost } from './lib/site';
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

  // Geo currency default: NO COOKIE IS SET HERE anymore (owner decision,
  // s47 compliance audit 2026-08-18). The previous behaviour — persisting
  // `t2e_ccy` for a year from Cloudflare's `cf-ipcountry` on first visit,
  // before any user action — contradicted the consent banner's "only
  // essential cookies" and the cookie policy's exhaustive list (ePrivacy
  // Art. 5(3): a geo-derived preference is not "explicitly requested").
  // The geo suggestion now flows cookie-free: the client CurrencyProvider
  // fetches /api/geo-currency once per load and applies it IN MEMORY; the
  // cookie is written only when the visitor explicitly picks a currency
  // (CurrencyProvider.setCurrency).

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
