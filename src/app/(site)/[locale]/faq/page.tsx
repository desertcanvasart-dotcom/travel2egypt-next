import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { toPlainText } from '@portabletext/toolkit';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { faqPageQuery } from '@/sanity/lib/queries';
import { FaqPage, type FaqCategory } from '@/components/FaqPage';
import { buildStaticMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import {
  buildBreadcrumbList,
  buildFAQSchema,
  type FAQItem,
} from '@/lib/structured-data';

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

/**
 * Flatten the portable-text answer into a plain string for FAQPage JSON-LD.
 * Google's FAQ rich result documentation allows HTML inside acceptedAnswer.text,
 * but plain text is the safer wire format — it avoids accidental schema
 * rejection when an editor inserts a block we haven't accounted for, and AI
 * agents tend to consume the plain text either way.
 */
function answerToPlain(answer: unknown): string {
  if (!answer) return '';
  if (typeof answer === 'string') return answer;
  if (Array.isArray(answer)) {
    return toPlainText(answer as Parameters<typeof toPlainText>[0]).trim();
  }
  return '';
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lc = locale as Locale;

  const categories: FaqCategory[] = await client.fetch(faqPageQuery(lc));
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  // Flatten every category's entries into a single FAQPage. schema.org's
  // FAQPage doesn't model categories — it's a flat list of Q&A pairs. We
  // preserve category structure for the visible page; structured data sees
  // the merged list, which is what AI agents and rich-result parsers expect.
  const faqItems: FAQItem[] = categories
    .flatMap((cat) => cat.entries ?? [])
    .map((entry) => ({
      question: entry.question ?? '',
      answer: answerToPlain(entry.answer),
    }))
    .filter((item) => item.question && item.answer);

  const faqSchema = buildFAQSchema(faqItems);

  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: tNav('faqLabel'), path: '/faq' },
    ],
    lc,
  );

  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema]} />
      <FaqPage locale={lc} categories={categories} />
    </>
  );
}
