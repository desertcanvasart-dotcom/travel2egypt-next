import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { JourneyPage } from '@/components/journeys/JourneyPage';
import { firstTimeContent } from '@/components/journeys/firstTimeContent';
import { JsonLd } from '@/components/JsonLd';
import { buildStaticMetadata } from '@/lib/seo';
import { buildBreadcrumbList } from '@/lib/structured-data';

import '@/styles/journeys.css';

const PATH = '/journeys/first-time-in-egypt';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lc = locale as Locale;
  const c = firstTimeContent[lc] ?? firstTimeContent.en;
  return buildStaticMetadata({
    locale: lc,
    path: PATH,
    title: c.meta.title,
    description: c.meta.description,
    availableLocales: Object.keys(firstTimeContent) as Locale[],
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lc = locale as Locale;

  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: tNav('journeyFirstTime'), path: PATH },
    ],
    lc,
  );

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JourneyPage content={firstTimeContent[lc] ?? firstTimeContent.en} locale={lc} />
    </>
  );
}
