import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Hero } from '@/components/home/Hero';

/**
 * Isolated preview of the homepage redesign (built section by section for
 * review). The live homepage at `/` is untouched until this is approved and
 * swapped in. Kept out of search results.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePreviewPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-paper text-night">
      <Hero />
    </div>
  );
}
