import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { allDayToursQuery } from '@/sanity/lib/queries';
import { TourCard, type TourCardData } from '@/components/TourCard';
import { buildStaticMetadata } from '@/lib/seo';
import { ToursFilter } from './ToursFilter';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tours' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/tours',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string; city?: string }>;
}

export default async function ToursLandingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { mode, city } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('tours');

  const tours: TourCardData[] = await client.fetch(allDayToursQuery(locale as Locale));

  const cityOptions = Array.from(
    new Map(
      tours
        .flatMap((t) => t.cities ?? [])
        .filter((c): c is NonNullable<typeof c> => Boolean(c?.slug))
        .map((c) => [c.slug, { slug: c.slug, name: c.name }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filtered = tours.filter((tour) => {
    if (mode && mode !== 'all' && tour.dayTourMode !== mode) return false;
    if (city && city !== 'all') {
      const slugs = (tour.cities ?? []).map((c) => c.slug);
      if (!slugs.includes(city)) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-12 max-w-3xl">
        <h1 className="mb-4 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
          {t('landingTitle')}
        </h1>
        <p className="font-serif text-xl italic leading-relaxed text-ink-soft">
          {t('landingDeck')}
        </p>
      </header>

      <ToursFilter
        cityOptions={cityOptions}
        labels={{
          filterMode: t('filterMode'),
          filterCity: t('filterCity'),
          filterAll: t('filterAll'),
          filterPrivate: t('filterPrivate'),
          filterGroup: t('filterGroup'),
        }}
      />

      {filtered.length === 0 ? (
        <p className="mt-12 font-serif text-lg italic text-ink-muted">
          {t('noResults')}
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tour) => (
            <TourCard key={tour._id} tour={tour} />
          ))}
        </div>
      )}
    </div>
  );
}
