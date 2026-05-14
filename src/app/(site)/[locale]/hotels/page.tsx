import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { allHotelsQuery } from '@/sanity/lib/queries';
import { HotelCard, type HotelCardData } from '@/components/HotelCard';
import { buildStaticMetadata } from '@/lib/seo';
import { HotelsFilter } from './HotelsFilter';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hotels' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/hotels',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string; category?: string }>;
}

export default async function HotelsLandingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { city, category } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('hotels');

  const hotels: HotelCardData[] = await client.fetch(allHotelsQuery(locale as Locale));

  const cityOptions = Array.from(
    new Map(
      hotels
        .map((h) => h.city)
        .filter((c): c is NonNullable<HotelCardData['city']> => Boolean(c?.slug))
        .map((c) => [c!.slug, { slug: c!.slug, name: c!.name }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const categoryOptions = [
    { value: 'luxury', label: t('categoryLuxury') },
    { value: 'deluxe', label: t('categoryDeluxe') },
    { value: 'boutique', label: t('categoryBoutique') },
    { value: 'standard', label: t('categoryStandard') },
  ];

  const filtered = hotels.filter((hotel) => {
    if (city && city !== 'all') {
      if (hotel.city?.slug !== city) return false;
    }
    if (category && category !== 'all') {
      if (hotel.category !== category) return false;
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

      <HotelsFilter
        cityOptions={cityOptions}
        categoryOptions={categoryOptions}
        labels={{
          filterCity: t('filterCity'),
          filterCategory: t('filterCategory'),
          filterAll: t('filterAll'),
        }}
      />

      {filtered.length === 0 ? (
        <p className="mt-12 font-serif text-lg italic text-ink-muted">
          {t('noResults')}
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((hotel) => (
            <HotelCard key={hotel._id} hotel={hotel} />
          ))}
        </div>
      )}
    </div>
  );
}
