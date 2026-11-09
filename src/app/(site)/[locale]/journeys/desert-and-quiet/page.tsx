import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { JourneyPage } from '@/components/journeys/JourneyPage';
import { desertAndQuietContent } from '@/components/journeys/desertAndQuietContent';
import { JsonLd } from '@/components/JsonLd';
import { buildStaticMetadata } from '@/lib/seo';
import { buildBreadcrumbList, buildPageArticleSchema } from '@/lib/structured-data';

import '@/styles/journeys.css';

const PATH = '/journeys/desert-and-quiet';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lc = locale as Locale;
  const c = desertAndQuietContent[lc] ?? desertAndQuietContent.en;
  return buildStaticMetadata({
    locale: lc,
    path: PATH,
    title: c.meta.title,
    description: c.meta.description,
    availableLocales: Object.keys(desertAndQuietContent) as Locale[],
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
      { name: tNav('journeyDesert'), path: PATH },
    ],
    lc,
  );

  return (
    <>
      <JsonLd
        data={[
          buildPageArticleSchema(
            {
              title: (desertAndQuietContent[lc] ?? desertAndQuietContent.en).meta.title,
              description: (desertAndQuietContent[lc] ?? desertAndQuietContent.en).meta.description,
              path: PATH,
            },
            lc,
          ),
          breadcrumbSchema,
        ]}
      />
      <JourneyPage content={desertAndQuietContent[lc] ?? desertAndQuietContent.en} locale={lc} />
    </>
  );
}
