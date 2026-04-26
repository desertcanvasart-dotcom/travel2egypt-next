import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { allMonumentsQuery } from '@/sanity/lib/queries';
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
    path: '/wiki/monuments',
    title: t('browseMonuments'),
    description: t('landingDeck'),
  });
}

export default async function MonumentsListPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('wiki');
  const monuments = await client.fetch<WikiCardData[]>(allMonumentsQuery(locale as Locale));

  const grouped = new Map<string, WikiCardData[]>();
  for (const m of monuments) {
    const k = m.city?.name ?? 'Other';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(m);
  }

  const orderedCities = Array.from(grouped.keys()).sort();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-16 max-w-3xl">
        <h1 className="mb-4 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
          {t('browseMonuments')}
        </h1>
      </header>

      <div className="space-y-16">
        {orderedCities.map((city) => {
          const items = grouped.get(city)!;
          return (
            <section key={city}>
              <h2 className="mb-8 border-b border-line pb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
                {city}
              </h2>
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => (
                  <WikiCard key={m._id} item={m} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
