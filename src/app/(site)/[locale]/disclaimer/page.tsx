import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';
import { LegalPageView, legalMetadata } from '@/components/LegalPageView';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata(locale as Locale, 'disclaimer', `/${locale}/disclaimer`);
}

export default async function DisclaimerPage({ params }: Props) {
  const { locale } = await params;
  return <LegalPageView locale={locale as Locale} kind="disclaimer" />;
}
