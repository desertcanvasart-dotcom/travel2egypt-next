/**
 * THE single source of truth for currency on the site.
 *
 * Prices are stored as plain numbers in Sanity (no symbol, no per-doc currency
 * field). Every price that renders — anywhere — must go through `formatPrice`,
 * which is the only place the currency symbol exists. This makes it impossible
 * for any code or data path to render a non-EUR symbol.
 */
export const CURRENCY = { code: 'EUR', symbol: '€' } as const;

/**
 * Format a numeric price as a localized euro string.
 *   formatPrice(2350)        → "€2,350"
 *   formatPrice(2350, 'pp')  → "€2,350 pp"
 * Returns '' for non-finite input so callers can omit empty prices cleanly.
 */
export function formatPrice(amount: number | null | undefined, unit?: string | null): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '';
  const figure = `${CURRENCY.symbol}${amount.toLocaleString('en-US')}`;
  return unit ? `${figure} ${unit}` : figure;
}
