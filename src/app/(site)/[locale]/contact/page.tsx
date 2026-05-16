import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { editorialPageByKindQuery } from '@/sanity/lib/queries';
import { EditorialPageView, type EditorialDoc } from '@/components/EditorialPageView';
import { buildStaticMetadata } from '@/lib/seo';

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

  return <EditorialPageView locale={lc} doc={doc} />;
}
