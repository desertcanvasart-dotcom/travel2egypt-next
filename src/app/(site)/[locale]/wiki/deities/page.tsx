import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { allDeitiesQuery } from '@/sanity/lib/queries';
import { WikiCard, type WikiCardData } from '@/components/WikiCard';
import { buildStaticMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'wiki' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/wiki/deities',
    title: t('browseDeities'),
    description: t('landingDeck'),
  });
}

export default async function DeitiesListPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('wiki');
  const deities = await client.fetch<WikiCardData[]>(allDeitiesQuery(locale as Locale));

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-16 max-w-3xl">
        <h1 className="mb-4 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
          {t('browseDeities')}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {deities.map((d) => (
          <WikiCard key={d._id} item={d} />
        ))}
      </div>
    </div>
  );
}
