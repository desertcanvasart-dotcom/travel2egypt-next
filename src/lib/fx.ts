import { CURRENCIES, type Rates } from './currency';

/**
 * Live exchange rates (2026-11-09): the European Central Bank's daily
 * reference rates, read through Frankfurter (free, no key, serves the ECB
 * figures as JSON). Prices are stored in EUR, so these are exactly the
 * multipliers the site needs.
 *
 * - Fetched on the server and cached for a day (Next data cache). Visitors
 *   never call the feed.
 * - On any failure (network/HTTP error, missing currency, or a rate more than
 *   20% away from its fallback — a guard against a broken payload) the fixed
 *   fallback rates in currency.ts are used. They are a recent ECB snapshot,
 *   so a fallback day still shows near-current prices; the daily GitHub check
 *   (fx-check.yml) reports it.
 * - MARGIN_PCT can add a safety buffer on top of the market rate (0 = exact).
 */
export const FX_URL = 'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,GBP,AUD,CAD,JPY';
export const MARGIN_PCT = 0;
const MAX_DRIFT = 0.2;

export interface FxResult {
  rates: Rates;
  /** 'ecb' = live rates; 'fallback' = the fixed rates in currency.ts. */
  source: 'ecb' | 'fallback';
  /** ECB reference date (YYYY-MM-DD) for live rates. */
  date: string | null;
  /** Why the fallback was used, when it was. */
  reason?: string;
}

const CODES = Object.keys(CURRENCIES).filter((c) => c !== 'EUR');

function fallback(reason: string): FxResult {
  return { rates: Object.fromEntries(CODES.map((c) => [c, CURRENCIES[c].rate])), source: 'fallback', date: null, reason };
}

export async function getRates(): Promise<FxResult> {
  try {
    const res = await fetch(FX_URL, { next: { revalidate: 86400, tags: ['fx-rates'] } });
    if (!res.ok) return fallback(`HTTP ${res.status}`);
    const body = (await res.json()) as { base?: string; date?: string; rates?: Record<string, unknown> };
    if (body.base !== 'EUR' || !body.rates) return fallback('unexpected payload');
    const rates: Rates = {};
    for (const code of CODES) {
      const v = body.rates[code];
      const ref = CURRENCIES[code].rate;
      if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return fallback(`missing ${code}`);
      if (Math.abs(v - ref) / ref > MAX_DRIFT) return fallback(`${code} ${v} is more than ${MAX_DRIFT * 100}% from ${ref}`);
      rates[code] = v * (1 + MARGIN_PCT / 100);
    }
    return { rates, source: 'ecb', date: typeof body.date === 'string' ? body.date : null };
  } catch (err) {
    return fallback(err instanceof Error ? err.message : 'fetch failed');
  }
}
