import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  editorialPageByKindQuery,
  hotelsForGradeConceptQuery,
  cruisesForGradeConceptQuery,
} from '@/sanity/lib/queries';
import { HotelGradeConceptPage } from '@/components/HotelGradeConceptPage';
import { buildStaticMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hotelGradeConcept' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/hotel-grade-concept',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('hotelGradeConcept');
  const lc = locale as Locale;

  const [editorial, hotels, cruises] = await Promise.all([
    client.fetch(editorialPageByKindQuery(lc), { kind: 'hotel-grade-concept' }),
    client.fetch(hotelsForGradeConceptQuery(lc)),
    client.fetch(cruisesForGradeConceptQuery(lc)),
  ]);

  return (
    <HotelGradeConceptPage
      locale={lc}
      editorial={editorial}
      hotels={hotels ?? []}
      cruises={cruises ?? []}
      labels={{
        tiers: {
          standard: { heading: t('tiers.standard.heading'), tagline: t('tiers.standard.tagline') },
          deluxe: { heading: t('tiers.deluxe.heading'), tagline: t('tiers.deluxe.tagline') },
          luxury: { heading: t('tiers.luxury.heading'), tagline: t('tiers.luxury.tagline') },
        },
        hotelsLabel: t('hotelsLabel'),
        cruisesLabel: t('cruisesLabel'),
        nileCruisesLabel: t('nileCruisesLabel'),
        lakeNasserCruisesLabel: t('lakeNasserCruisesLabel'),
        emptyTierState: t('emptyTierState'),
        jumpTo: t('jumpTo'),
      }}
    />
  );
}
