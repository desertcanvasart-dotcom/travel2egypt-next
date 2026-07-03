import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { FirstTimeInEgypt } from '@/components/journeys/FirstTimeInEgypt';
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
  // EN copy for all locales this phase (ES/JA content deferred); the route is
  // i18n-wired, so buildStaticMetadata still emits correct per-locale canonical
  // + hreflang alternates.
  return buildStaticMetadata({
    locale: locale as Locale,
    path: PATH,
    title: firstTimeContent.meta.title,
    description: firstTimeContent.meta.description,
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
      <FirstTimeInEgypt locale={lc} />
    </>
  );
}
