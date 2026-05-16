import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';
import { WikiComingSoon, wikiComingSoonMetadata } from '@/components/WikiComingSoon';

export const metadata: Metadata = wikiComingSoonMetadata;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function PersonDetailPlaceholderPage({ params }: Props) {
  const { locale } = await params;
  return <WikiComingSoon locale={locale as Locale} section="people" />;
}
