import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

import { routing } from './i18n/routing';
import { isProductionHost } from './lib/site';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

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
  //  - Next.js internals (_next, _vercel)
  //  - Files with extensions (favicon.ico, etc.)
  matcher: ['/((?!api|studio|_next|_vercel|.*\\..*).*)'],
};
