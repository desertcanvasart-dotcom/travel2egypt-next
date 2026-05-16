import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { DistanceMatrix } from '@/components/DistanceMatrix';
import { buildStaticMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'distances' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/distance-between-egyptian-cities',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function DistanceBetweenCitiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('distances');

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-12 max-w-3xl">
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
          {t('eyebrow')}
        </p>
        <h1 className="mb-4 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
          {t('heading')}
        </h1>
        <p className="font-serif text-xl italic leading-relaxed text-ink-soft">
          {t('subheading')}
        </p>
      </header>

      <DistanceMatrix
        labels={{
          search: t('search'),
          searchPlaceholder: t('searchPlaceholder'),
          unitLabel: t('unitLabel'),
          speedLabel: t('speedLabel'),
          fromLabel: t('fromLabel'),
          toLabel: t('toLabel'),
          regionLabel: t('regionLabel'),
          any: t('any'),
          reset: t('reset'),
          resultsCount: t('resultsCount'),
          emptyState: t('emptyState'),
          colFrom: t('colFrom'),
          colTo: t('colTo'),
          colDistance: t('colDistance'),
          colDriveTime: t('colDriveTime'),
          colRegion: t('colRegion'),
          planMyTransfer: t('planMyTransfer'),
          disclaimer: t('disclaimer'),
          regions: {
            'Nile Valley': t('regions.nileValley'),
            'Eastern Desert': t('regions.easternDesert'),
            'Sinai Peninsula': t('regions.sinaiPeninsula'),
          },
        }}
      />
    </div>
  );
}
