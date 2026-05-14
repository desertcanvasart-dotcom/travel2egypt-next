import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { allCruisesQuery } from '@/sanity/lib/queries';
import { CruiseCard, type CruiseCardData } from '@/components/CruiseCard';
import { buildStaticMetadata } from '@/lib/seo';
import { CruisesFilter } from './CruisesFilter';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cruises' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/cruises',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; tier?: string }>;
}

export default async function CruisesLandingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { type, tier } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('cruises');

  const cruises: CruiseCardData[] = await client.fetch(
    allCruisesQuery(locale as Locale)
  );

  const typeOptions = [
    { value: 'cruise-ship', label: t('typeCruiseShip') },
    { value: 'dahabiya', label: t('typeDahabiya') },
    { value: 'felucca', label: t('typeFelucca') },
  ];

  const tierOptions = [
    { value: 'luxury', label: t('tierLuxury') },
    { value: 'deluxe', label: t('tierDeluxe') },
    { value: 'boutique', label: t('tierBoutique') },
    { value: 'standard', label: t('tierStandard') },
  ];

  const filtered = cruises.filter((cruise) => {
    if (type && type !== 'all') {
      if (cruise.type !== type) return false;
    }
    if (tier && tier !== 'all') {
      if (cruise.tier !== tier) return false;
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

      <CruisesFilter
        typeOptions={typeOptions}
        tierOptions={tierOptions}
        labels={{
          filterType: t('filterType'),
          filterTier: t('filterTier'),
          filterAll: t('filterAll'),
        }}
      />

      {filtered.length === 0 ? (
        <p className="mt-12 font-serif text-lg italic text-ink-muted">
          {t('noResults')}
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cruise) => (
            <CruiseCard key={cruise._id} cruise={cruise} />
          ))}
        </div>
      )}
    </div>
  );
}
