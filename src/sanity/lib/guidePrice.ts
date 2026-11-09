/**
 * Guide-language pricing (owner decision 2026-11-09). A tour's `priceFrom`
 * is the price with an English-speaking guide; `guideLanguagePrices.es/.ja`
 * hold the price with a Spanish / Japanese-speaking guide. Every query that
 * shows a price reads it through these expressions, so ES/JA pages show
 * their own price everywhere at once and fall back to `priceFrom` when the
 * language price is empty.
 *
 * Currency conversion is unchanged: whichever EUR figure is picked here is
 * converted by <Price> / formatPrice as before.
 */
import type { Locale } from '@/i18n/routing';

/** "from" price for a fixed locale, e.g. `"priceFrom": ${guidePrice('es')}`. */
export function guidePrice(locale: Locale | string, base = ''): string {
  const p = base ? `${base}.` : '';
  return locale === 'es' || locale === 'ja'
    ? `coalesce(${p}guideLanguagePrices.${locale}, ${p}priceFrom)`
    : `${p}priceFrom`;
}

/** True when the page shows a guide-language price (drives the price note). */
export function guidePriced(locale: Locale | string, base = ''): string {
  const p = base ? `${base}.` : '';
  return locale === 'es' || locale === 'ja' ? `defined(${p}guideLanguagePrices.${locale})` : 'false';
}

/**
 * The same difference applied to a price tier, inside `priceTiers[]{…}`:
 * tier price + (language price − priceFrom). `^` is the tour.
 */
export function guideTierPrice(locale: Locale | string): string {
  return locale === 'es' || locale === 'ja'
    ? `price + coalesce(^.guideLanguagePrices.${locale} - ^.priceFrom, 0)`
    : 'price';
}

/** For queries with a $locale parameter instead of a baked-in locale. */
export const guidePriceParam = `select(
    $locale == "es" => coalesce(guideLanguagePrices.es, priceFrom),
    $locale == "ja" => coalesce(guideLanguagePrices.ja, priceFrom),
    priceFrom
  )`;
export const guidePricedParam = `select(
    $locale == "es" => defined(guideLanguagePrices.es),
    $locale == "ja" => defined(guideLanguagePrices.ja),
    false
  )`;
