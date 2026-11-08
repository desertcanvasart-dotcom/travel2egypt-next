import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';
import { LegalPageView, legalMetadata } from '@/components/LegalPageView';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata(locale as Locale, 'privacy', '/privacy-policy');
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  return <LegalPageView locale={locale as Locale} kind="privacy" />;
}
