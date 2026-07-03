import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { JourneyPage } from '@/components/journeys/JourneyPage';
import { comingBackContent } from '@/components/journeys/comingBackContent';
import { JsonLd } from '@/components/JsonLd';
import { buildStaticMetadata } from '@/lib/seo';
import { buildBreadcrumbList } from '@/lib/structured-data';

import '@/styles/journeys.css';

const PATH = '/journeys/coming-back';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildStaticMetadata({
    locale: locale as Locale,
    path: PATH,
    title: comingBackContent.meta.title,
    description: comingBackContent.meta.description,
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
      { name: tNav('journeyReturning'), path: PATH },
    ],
    lc,
  );

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JourneyPage content={comingBackContent} locale={lc} />
    </>
  );
}
