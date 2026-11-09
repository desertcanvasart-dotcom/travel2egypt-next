/**
 * THE single source of truth for currency on the site.
 *
 * Prices are stored as plain EUR numbers in Sanity (no symbol, no per-doc
 * currency field). Every price that renders — anywhere — goes through
 * `formatPrice`, keyed by an ISO currency CODE.
 *
 * Display currency is chosen by the viewer (CurrencyProvider / CurrencySwitcher,
 * cookie `t2e_ccy`). The SSR default is per-locale (en→USD, es→EUR, ja→JPY) so
 * the statically-cached HTML is deterministic; the client swaps to the viewer's
 * chosen currency after hydration. Converted figures are INDICATIVE — the base
 * price is EUR.
 *
 * Rates (2026-11-09): the live European Central Bank reference rates, fetched
 * once a day on the server (lib/fx.ts) and handed to every converter as
 * `rates`. The `rate` values below are only the FALLBACK when the feed is
 * unavailable or returns something implausible.
 */

/** EUR → currency multipliers, e.g. { USD: 1.1165, JPY: 176.77 }. */
export type Rates = Partial<Record<string, number>>;

export interface CurrencyConf {
  /** ISO 4217 code. */
  code: string;
  /** Display symbol. */
  symbol: string;
  /** FALLBACK EUR → this currency multiplier (live ECB rates override). EUR is the base (1). */
  rate: number;
  /** Round converted amounts to the nearest this many units (0/1 = no rounding). */
  roundTo: number;
}

/**
 * Fallback exchange rates — used only when the live ECB rates can't be had
 * (lib/fx.ts). Prices are authored in EUR in Sanity.
 */
export const CURRENCIES: Record<string, CurrencyConf> = {
  EUR: { code: 'EUR', symbol: '€', rate: 1, roundTo: 0 },
  // Fallback rates = ECB reference rates of 2026-11-06 (refresh occasionally).
  USD: { code: 'USD', symbol: '$', rate: 1.1165, roundTo: 10 },
  GBP: { code: 'GBP', symbol: '£', rate: 0.83415, roundTo: 10 },
  AUD: { code: 'AUD', symbol: 'A$', rate: 1.625, roundTo: 10 },
  CAD: { code: 'CAD', symbol: 'C$', rate: 1.5705, roundTo: 10 },
  JPY: { code: 'JPY', symbol: '¥', rate: 176.77, roundTo: 1000 },
};

/** Display order for the currency switcher. */
export const CURRENCY_ORDER = ['EUR', 'USD', 'GBP', 'AUD', 'CAD', 'JPY'];

/** EUR base — the fallback when no/unknown currency is supplied. */
export const DEFAULT_CURRENCY = 'EUR';

/** Cookie the viewer's chosen (or geo-defaulted) currency is stored under. */
export const CURRENCY_COOKIE = 't2e_ccy';

/** Initial display currency per locale (matches the pre-selector behaviour). */
const LOCALE_DEFAULT: Record<string, string> = { en: 'USD', es: 'EUR', ja: 'JPY' };
export function defaultCurrencyForLocale(locale?: string | null): string {
  return (locale && LOCALE_DEFAULT[locale]) || DEFAULT_CURRENCY;
}

/** Currency config for a code (falls back to EUR for unknown codes). */
export function currencyConf(code?: string | null): CurrencyConf {
  return (code && CURRENCIES[code]) || CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Convert a stored EUR amount to the given currency, rounded to a clean figure.
 * Returns the EUR amount unchanged for the base currency.
 */
export function convertPrice(amountEur: number, currency?: string | null, rates?: Rates | null): number {
  const c = currencyConf(currency);
  const live = c.code === 'EUR' ? 1 : rates?.[c.code];
  const raw = amountEur * (typeof live === 'number' && live > 0 ? live : c.rate);
  if (c.roundTo > 1) return Math.round(raw / c.roundTo) * c.roundTo;
  return Math.round(raw);
}

/**
 * Format a stored EUR price in the given currency code.
 *   formatPrice(2350, 'USD')              → "$2,540"
 *   formatPrice(2350, 'JPY')              → "¥400,000"
 *   formatPrice(2350, 'AUD', 'pp')        → "A$3,880 pp"
 *   formatPrice(1290, 'EUR', null, 'es')  → "1290 €"   (Spanish convention:
 *     symbol after the number, "." grouping from five digits — "12.900 €")
 * Returns '' for non-finite input so callers can omit empty prices cleanly.
 */
export function formatPrice(
  amount: number | null | undefined,
  currency?: string | null,
  unit?: string | null,
  locale?: string | null,
  rates?: Rates | null,
): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '';
  const figure = formatConverted(convertPrice(amount, currency, rates), currency, locale);
  return unit ? `${figure} ${unit}` : figure;
}

/** Format an amount ALREADY in `currency` (no conversion) — e.g. an estimate total. */
export function formatConverted(n: number, currency?: string | null, locale?: string | null): string {
  const c = currencyConf(currency);
  return locale === 'es'
    ? `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n)}\u00a0${c.symbol}`
    : `${c.symbol}${n.toLocaleString('en-US')}`;
}
