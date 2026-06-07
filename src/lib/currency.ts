/**
 * THE single source of truth for currency on the site.
 *
 * Prices are stored as plain EUR numbers in Sanity (no symbol, no per-doc
 * currency field). Every price that renders — anywhere — must go through
 * `formatPrice`, which is the only place a currency symbol or conversion exists.
 *
 * Display currency is per-locale:
 *   en → USD ($)   es → EUR (€, the base)   ja → JPY (¥)
 * EN/JA amounts are converted from the stored EUR figure using the FIXED manual
 * rates below and rounded to clean "from"-price figures. EUR (the base) is shown
 * exactly as entered.
 */

export interface CurrencyConf {
  /** ISO 4217 code (used for schema.org priceCurrency). */
  code: string;
  /** Display symbol. */
  symbol: string;
  /** EUR → this currency multiplier. EUR is the base (1). */
  rate: number;
  /** Round converted amounts to the nearest this many units (0/1 = no rounding). */
  roundTo: number;
}

/**
 * ⚠️ MANUAL EXCHANGE RATES — update these two figures when rates move.
 * Prices are authored in EUR in Sanity; these convert them for the EN/JA pages.
 */
const LOCALE_CURRENCY: Record<string, CurrencyConf> = {
  en: { code: 'USD', symbol: '$', rate: 1.08, roundTo: 10 },   // €1 ≈ $1.08
  es: { code: 'EUR', symbol: '€', rate: 1, roundTo: 0 },       // base — exact
  ja: { code: 'JPY', symbol: '¥', rate: 170, roundTo: 1000 },  // €1 ≈ ¥170
};

/** EUR base, also the fallback when no/unknown locale is supplied. */
export const CURRENCY = LOCALE_CURRENCY.es;

/** Currency config for a locale (falls back to EUR for unknown locales). */
export function currencyFor(locale?: string | null): CurrencyConf {
  return (locale && LOCALE_CURRENCY[locale]) || CURRENCY;
}

/**
 * Convert a stored EUR amount to the locale's display currency, rounded to a
 * clean figure. Returns the EUR amount unchanged for the base currency.
 */
export function convertPrice(amountEur: number, locale?: string | null): number {
  const c = currencyFor(locale);
  const raw = amountEur * c.rate;
  if (c.roundTo > 1) return Math.round(raw / c.roundTo) * c.roundTo;
  return Math.round(raw);
}

/**
 * Format a stored EUR price for the given locale.
 *   formatPrice(2350, 'en')        → "$2,540"
 *   formatPrice(2350, 'ja')        → "¥400,000"
 *   formatPrice(2350, 'es')        → "€2,350"
 *   formatPrice(2350, 'en', 'pp')  → "$2,540 pp"
 * Returns '' for non-finite input so callers can omit empty prices cleanly.
 */
export function formatPrice(
  amount: number | null | undefined,
  locale?: string | null,
  unit?: string | null,
): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '';
  const c = currencyFor(locale);
  const figure = `${c.symbol}${convertPrice(amount, locale).toLocaleString('en-US')}`;
  return unit ? `${figure} ${unit}` : figure;
}
