import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { faqPageQuery } from '@/sanity/lib/queries';
import { FaqPage, type FaqCategory } from '@/components/FaqPage';
import { buildStaticMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faq' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/faq',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lc = locale as Locale;

  const categories: FaqCategory[] = await client.fetch(faqPageQuery(lc));

  return <FaqPage locale={lc} categories={categories} />;
}
