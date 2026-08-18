import { NextResponse, type NextRequest } from 'next/server';

import { currencyForCountry } from '@/lib/geo-currency';

/**
 * Cookie-free geo currency suggestion (s47 compliance, 2026-08-18).
 *
 * Replaces the middleware's former first-visit `t2e_ccy` Set-Cookie, which
 * persisted a geo-derived preference for a year before any user action —
 * contradicting the "only essential cookies" consent banner. The client
 * CurrencyProvider calls this once per hard load when no explicit currency
 * cookie exists and applies the suggestion IN MEMORY only; the cookie is
 * written solely on an explicit currency pick.
 *
 * Reads Cloudflare's `cf-ipcountry` from THIS request's headers — present on
 * the production edge, absent locally/pre-Cloudflare, in which case the
 * response is `{ currency: null }` and the per-locale default stands.
 * `no-store` so no cache ever pins one visitor's country to another.
 */
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const currency = currencyForCountry(req.headers.get('cf-ipcountry'));
  return NextResponse.json(
    { currency: currency ?? null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
