import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { allDayToursQuery, dayToursArchiveQuery } from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import { CategoryView, type CategoryArchiveDoc } from '@/components/tour-system/CategoryView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dayTours' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/private-day-tours',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

interface RawTour {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  durationDays?: number;
  durationHours?: number;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: Array<{ _id: string; name: string; slug: string }>;
}

export default async function PrivateDayToursPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [archive, tours] = await Promise.all([
    client.fetch<CategoryArchiveDoc | null>(dayToursArchiveQuery(locale as Locale)),
    client.fetch<RawTour[]>(allDayToursQuery(locale as Locale)),
  ]);

  return <CategoryView archive={archive} tours={tours} locale={locale as Locale} />;
}
