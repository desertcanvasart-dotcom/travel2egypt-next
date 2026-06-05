import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { buildStaticMetadata } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { homePageQuery } from '@/sanity/lib/queries';
import { HomeView, type HomePageData } from '@/components/tour-system/HomeView';

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
    description: 'Egypt travel, with judgment. An Egyptian operator since 2003.',
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await client.fetch<HomePageData | null>(homePageQuery(locale as Locale));

  return <HomeView data={data} locale={locale as Locale} />;
}
