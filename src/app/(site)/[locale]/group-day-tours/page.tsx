import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { groupDayToursQuery, groupDayLandingsQuery } from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import {
  CategoryView,
  type CategoryNavLanding,
} from '@/components/tour-system/CategoryView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ts = await getTranslations({ locale, namespace: 'tourSystem' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/group-day-tours',
    title: ts('grpDayCatTitle'),
    description: ts('grpDayCatDeck'),
  });
}

interface RawTour {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  tourMode?: string;
  durationDays?: number;
  durationHours?: number;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: Array<{ _id: string; name: string; slug: string }>;
}

export default async function GroupDayToursPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The {dayTour × group} bucket has no dayToursArchive singleton (that doc is
  // private-curated), so the navigator is built from the group city landings and
  // the editorial copy resolves to the `grpDayCat*` i18n set inside CategoryView.
  const [tours, navLandings] = await Promise.all([
    client.fetch<RawTour[]>(groupDayToursQuery(locale as Locale)),
    client.fetch<CategoryNavLanding[]>(groupDayLandingsQuery(locale as Locale)),
  ]);

  return (
    <CategoryView
      archive={null}
      tours={tours}
      navLandings={navLandings}
      mode="group"
      locale={locale as Locale}
    />
  );
}
