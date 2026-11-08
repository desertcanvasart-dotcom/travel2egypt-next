import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { buildStaticMetadata } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { homePageQuery, siteSettingsQuery } from '@/sanity/lib/queries';
import { HomeView, type HomePageData } from '@/components/tour-system/HomeView';
import { SalesHomeView } from '@/components/home-sales/SalesHomeView';
import { FEATURED_TOURS, allHomeSlugs } from '@/components/home-sales/config';
import { salesHomeQuery, type SalesHomeData } from '@/components/home-sales/query';
import { JsonLd } from '@/components/JsonLd';
import { buildWebSiteSchema } from '@/lib/structured-data';
import { siteUrlBase } from '@/lib/path-from-doc';

interface Props {
  params: Promise<{ locale: string }>;
}

const SITE = siteUrlBase().replace(/\/$/, '');

async function fetchSalesHome(): Promise<SalesHomeData> {
  const data = await client.fetch<SalesHomeData>(salesHomeQuery, { slugs: allHomeSlugs() });
  return {
    home: data?.home ?? null,
    products: data?.products ?? [],
    dahabiya: data?.dahabiya ?? null,
    accreditations: data?.accreditations ?? null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale === 'en') {
    // Query-matched title + description (owner spec, 2026-11-08). The prices
    // quoted here are the live lowest of what the page features; USD at the
    // site's display rate (formatPrice: EUR × 1.08, rounded to 10).
    const data = await fetchSalesHome();
    const featured = new Set(FEATURED_TOURS.map((f) => f.slug));
    const usd = (eur: number) => `$${(Math.round((eur * 1.08) / 10) * 10).toLocaleString('en-US')}`;
    const min = (xs: Array<number | null | undefined>) => {
      const v = xs.filter((n): n is number => typeof n === 'number' && n > 0);
      return v.length ? Math.min(...v) : null;
    };
    const tourFrom = min(data.products.filter((p) => featured.has(p.slug)).map((p) => p.priceFrom));
    const dayFrom = min(data.products.filter((p) => p.type === 'dayTour').map((p) => p.priceFrom));
    const prices =
      tourFrom && dayFrom ? `Private Egypt tours from ${usd(tourFrom)} and day tours from ${usd(dayFrom)}, ` : 'Private Egypt tours and day tours, ';
    return buildStaticMetadata({
      locale: 'en',
      path: '/',
      title: 'Egypt Tours & Nile Cruises — Private, Priced Openly | Travel2Egypt',
      description: `${prices}run by a Cairo operator guiding since 1993. Cairo, the Nile, Luxor, Aswan and Abu Simbel, customised to your dates. We reply the same day.`,
    });
  }
  // ES/JA keep the editorial homepage until the translation pass.
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/',
    title: 'Travel2Egypt',
    description: 'Egypt travel, with judgment. An Egyptian operator since 1993.',
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

  if (locale === 'en') {
    const data = await fetchSalesHome();
    const bySlug = new Map(data.products.map((p) => [p.slug, p]));
    // ItemList of the featured tours as TouristTrip with a "from" offer.
    // No aggregateRating anywhere (owner spec: self-served ratings on an
    // organisation are ignored by Google and read as manipulative).
    const itemList = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Egypt tours to start with',
      itemListElement: FEATURED_TOURS.map((f) => bySlug.get(f.slug))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'TouristTrip',
            name: p.title,
            url: `${SITE}/${p.slug}`,
            provider: { '@id': `${siteUrlBase()}#organization` },
            ...(p.priceFrom
              ? {
                  offers: {
                    '@type': 'Offer',
                    price: p.priceFrom,
                    priceCurrency: 'EUR',
                    availability: 'https://schema.org/InStock',
                    url: `${SITE}/${p.slug}`,
                  },
                }
              : {}),
          },
        })),
    };
    return (
      <>
        <JsonLd data={[websiteSchema, itemList]} />
        <SalesHomeView data={data} />
      </>
    );
  }

  const data = await client.fetch<HomePageData | null>(homePageQuery(locale as Locale));
  return (
    <>
      <JsonLd data={websiteSchema} />
      <HomeView data={data} locale={locale as Locale} />
    </>
  );
}
