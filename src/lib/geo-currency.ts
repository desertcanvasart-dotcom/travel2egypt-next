/**
 * Country (ISO 3166-1 alpha-2) → display currency, for the geo-default set in
 * middleware from Cloudflare's `cf-ipcountry` header. Only confidently-mapped
 * countries get a default; everything else falls through to the per-locale
 * default (so the behaviour is unchanged where we have no strong signal).
 *
 * All target codes must exist in CURRENCIES (currency.ts).
 */
const COUNTRY_CURRENCY: Record<string, string> = {
  // AUD — Australia & Oceania
  AU: 'AUD', NZ: 'AUD', FJ: 'AUD', PG: 'AUD', NC: 'AUD', VU: 'AUD', SB: 'AUD', WS: 'AUD', TO: 'AUD',
  // GBP
  GB: 'GBP', IM: 'GBP', JE: 'GBP', GG: 'GBP',
  // USD
  US: 'USD',
  // CAD
  CA: 'CAD',
  // JPY
  JP: 'JPY',
  // EUR — eurozone
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR', GR: 'EUR',
  IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR',
  SK: 'EUR', SI: 'EUR', ES: 'EUR', HR: 'EUR',
};

/**
 * Currency code for a Cloudflare country code, or null when unmapped/unknown
 * (Cloudflare uses "XX"/"T1" for unknown/anonymised) so callers leave the
 * locale default in place.
 */
export function currencyForCountry(country?: string | null): string | null {
  if (!country) return null;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? null;
}
