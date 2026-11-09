import { NextResponse } from 'next/server';

import { getRates } from '@/lib/fx';

/**
 * GET /api/fx — the exchange rates the site is using right now: source
 * ('ecb' live or 'fallback' fixed), the ECB reference date and the rates.
 * Public and read-only (the ECB rates are public). The daily GitHub check
 * (.github/workflows/fx-check.yml) fails — and GitHub emails the owner —
 * when this reports the fallback or a stale date.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const fx = await getRates();
  return NextResponse.json(fx, { headers: { 'cache-control': 'no-store' } });
}
