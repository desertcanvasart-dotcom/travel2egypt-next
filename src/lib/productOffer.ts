import type { Locale } from '@/i18n/routing';

import { convertPrice, defaultCurrencyForLocale } from './currency';
import { getRates } from './fx';
import { absoluteUrl } from './structured-data';

/**
 * The TouristTrip offer exactly as the product page displays it (product
 * template, 2026-11-09): the page's default currency (EN USD, ES EUR, JA JPY)
 * at today's rate and rounding, the locale's canonical URL, and validFrom =
 * the date the product was last edited (there is no separate price-change
 * date; the price was valid at least from then). No price → no offer.
 */
export async function buildProductOffer(
  eur: number | null | undefined,
  slug: string,
  locale: Locale,
  updatedAt?: string | null,
): Promise<{ price: number; priceCurrency: string; url: string; validFrom?: string } | null> {
  if (typeof eur !== 'number' || !(eur > 0)) return null;
  const currency = defaultCurrencyForLocale(locale);
  const { rates } = await getRates();
  return {
    price: convertPrice(eur, currency, rates),
    priceCurrency: currency,
    url: absoluteUrl(`/${slug}`, locale),
    ...(updatedAt ? { validFrom: updatedAt.slice(0, 10) } : {}),
  };
}
