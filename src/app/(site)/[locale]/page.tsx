import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { buildStaticMetadata } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { homePageQuery, siteSettingsQuery } from '@/sanity/lib/queries';
import { HomeView, type HomePageData } from '@/components/tour-system/HomeView';
import { JsonLd } from '@/components/JsonLd';
import { buildWebSiteSchema } from '@/lib/structured-data';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  // The `home` namespace has no metaTitle/metaDescription keys; the site
  // name + tagline (matching the root layout's static metadata) are used
  // directly so the homepage emits its canonical, OG, and hreflang tags.
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

  const [data, siteSettings] = await Promise.all([
    client.fetch<HomePageData | null>(homePageQuery(locale as Locale)),
    client.fetch<{ siteName?: string; tagline?: string } | null>(
      siteSettingsQuery(locale as Locale),
    ),
  ]);

  // The site-wide Organization JSON-LD is already rendered by the root
  // layout. WebSite is homepage-only: it identifies the canonical site
  // entity for Knowledge Panel and AI-search citation, joining the
  // entity graph via publisher → #organization.
  const websiteSchema = buildWebSiteSchema(
    {
      siteName: siteSettings?.siteName,
      tagline: siteSettings?.tagline,
    },
    locale as Locale,
  );

  return (
    <>
      <JsonLd data={websiteSchema} />
      <HomeView data={data} locale={locale as Locale} />
    </>
  );
}
