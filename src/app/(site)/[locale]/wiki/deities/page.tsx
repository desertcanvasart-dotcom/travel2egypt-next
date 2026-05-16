import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';
import { WikiComingSoon, wikiComingSoonMetadata } from '@/components/WikiComingSoon';

export const metadata: Metadata = wikiComingSoonMetadata;

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function DeitiesPlaceholderPage({ params }: Props) {
  const { locale } = await params;
  return <WikiComingSoon locale={locale as Locale} section="deities" />;
}
