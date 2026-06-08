import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { editorialPageByKindQuery } from '@/sanity/lib/queries';
import { EditorialPageView, type EditorialDoc } from '@/components/EditorialPageView';
import { buildStaticMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/structured-data';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/contact',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lc = locale as Locale;

  const doc: EditorialDoc | null = await client.fetch(
    editorialPageByKindQuery(lc),
    { kind: 'contact' }
  );
  if (!doc) notFound();

  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: tNav('contact'), path: '/contact' },
    ],
    lc,
  );

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <EditorialPageView locale={lc} doc={doc} />
    </>
  );
}
