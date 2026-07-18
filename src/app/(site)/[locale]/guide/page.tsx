import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { JsonLd } from '@/components/JsonLd';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { guideArchiveQuery } from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import { buildBreadcrumbList } from '@/lib/structured-data';
import {
  GuideArchiveView,
  type GuideArchiveSettings,
  type GuideCity,
} from '@/components/tour-system/GuideArchiveView';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guide' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/guide',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

export default async function GuideLandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tNav = await getTranslations('nav');
  const [{ settings, cities }, guideCount] = await Promise.all([
    client.fetch<{
      settings: GuideArchiveSettings | null;
      cities: GuideCity[];
    }>(guideArchiveQuery(locale as Locale)),
    client.fetch<number>(`count(*[_type=="guideArticle" && !(_id in path("drafts.**"))])`),
  ]);

  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: tNav('guide'), path: '/guide' },
    ],
    locale as Locale,
  );

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <GuideArchiveView settings={settings} cities={cities ?? []} guideCount={guideCount} locale={locale as Locale} />
    </>
  );
}
