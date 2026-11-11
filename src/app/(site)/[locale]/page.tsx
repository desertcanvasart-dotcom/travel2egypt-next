import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { buildStaticMetadata } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { siteSettingsQuery } from '@/sanity/lib/queries';
import { SalesHomeView } from '@/components/home-sales/SalesHomeView';
import { getJourneyCardPrices, getJourneysLive } from '@/lib/journeys/data';
import { FEATURED_TOURS, allHomeSlugs } from '@/components/home-sales/config';
import { salesHomeQuery, type SalesHomeData } from '@/components/home-sales/query';
import { HOME_COPY, homeLocale, type HomeLocale } from '@/components/home-sales/copy';
import { defaultCurrencyForLocale, formatPrice, type Rates } from '@/lib/currency';
import { getRates } from '@/lib/fx';
import { JsonLd } from '@/components/JsonLd';
import { buildWebSiteSchema } from '@/lib/structured-data';
import { siteUrlBase } from '@/lib/path-from-doc';

interface Props {
  params: Promise<{ locale: string }>;
}

const SITE = siteUrlBase().replace(/\/$/, '');

async function fetchSalesHome(locale: HomeLocale): Promise<SalesHomeData> {
  const data = await client.fetch<SalesHomeData>(salesHomeQuery, { slugs: allHomeSlugs(), locale });
  return {
    home: data?.home ?? null,
    products: data?.products ?? [],
    dahabiya: data?.dahabiya ?? null,
    accreditations: data?.accreditations ?? null,
    responseTime: data?.responseTime ?? null,
  };
}

/** SSR display currency per language (en→USD, es→EUR, ja→JPY), at today's rates, as on the cards. */
function metaPrice(eur: number, locale: HomeLocale, rates: Rates): string {
  return formatPrice(eur, defaultCurrencyForLocale(locale), null, locale, rates);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = homeLocale(raw);
  // Query-matched title + description (owner spec, 2026-11-08; ES/JA from the
  // owner's translations). The prices quoted are the live lowest of what the
  // page features, in the language's default display currency.
  const [data, fx] = await Promise.all([fetchSalesHome(locale), getRates()]);
  const featured = new Set(FEATURED_TOURS.map((f) => f.slug));
  const min = (xs: Array<number | null | undefined>) => {
    const v = xs.filter((n): n is number => typeof n === 'number' && n > 0);
    return v.length ? Math.min(...v) : null;
  };
  const tourFrom = min(data.products.filter((p) => featured.has(p.slug)).map((p) => p.priceFrom));
  const dayFrom = min(data.products.filter((p) => p.type === 'dayTour').map((p) => p.priceFrom));
  const c = HOME_COPY[locale];
  return buildStaticMetadata({
    locale,
    path: '/',
    title: c.metaTitle,
    description: c.metaDescription(
      tourFrom ? metaPrice(tourFrom, locale, fx.rates) : null,
      dayFrom ? metaPrice(dayFrom, locale, fx.rates) : null,
    ),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const siteSettings = await client.fetch<{ siteName?: string; tagline?: string } | null>(
    siteSettingsQuery(locale as Locale),
  );
  // WebSite is homepage-only: it identifies the canonical site entity for
  // Knowledge Panel and AI-search citation (publisher → #organization).
  const websiteSchema = buildWebSiteSchema(
    { siteName: siteSettings?.siteName, tagline: siteSettings?.tagline },
    locale as Locale,
  );

  const hl = homeLocale(locale);
  const data = await fetchSalesHome(hl);
  const prefix = hl === 'en' ? '' : `/${hl}`;
  const bySlug = new Map(data.products.map((p) => [p.slug, p]));
  // ItemList of the featured tours as TouristTrip with a "from" offer.
  // No aggregateRating anywhere (owner spec: self-served ratings on an
  // organisation are ignored by Google and read as manipulative).
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: HOME_COPY[hl].itemListName,
    itemListElement: FEATURED_TOURS.map((f) => bySlug.get(f.slug))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'TouristTrip',
          name: p.title,
          url: `${SITE}${prefix}/${p.href}`,
          provider: { '@id': `${siteUrlBase()}#organization` },
          ...(p.priceFrom
            ? {
                offers: {
                  '@type': 'Offer',
                  price: p.priceFrom,
                  priceCurrency: 'EUR',
                  availability: 'https://schema.org/InStock',
                  url: `${SITE}${prefix}/${p.href}`,
                },
              }
            : {}),
        },
      })),
  };
  return (
    <>
      <JsonLd data={[websiteSchema, itemList]} />
      <SalesHomeView data={data} locale={hl} journeys={{ live: await getJourneysLive(hl), prices: await getJourneyCardPrices(hl) }} />
    </>
  );
}
