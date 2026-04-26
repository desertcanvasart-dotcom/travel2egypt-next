import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { allDynastiesQuery } from '@/sanity/lib/queries';
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
    path: '/wiki/dynasties',
    title: t('browseDynasties'),
    description: t('landingDeck'),
  });
}

const KINGDOM_ORDER = [
  'predynastic',
  'old',
  'first-intermediate',
  'middle',
  'second-intermediate',
  'new',
  'third-intermediate',
  'late',
  'ptolemaic',
  'roman',
];

export default async function DynastiesListPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('wiki');
  const dynasties = await client.fetch<WikiCardData[]>(allDynastiesQuery(locale as Locale));

  const grouped = new Map<string, WikiCardData[]>();
  for (const d of dynasties) {
    const k = d.kingdom ?? 'other';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(d);
  }

  const orderedKingdoms = KINGDOM_ORDER.filter((k) => grouped.has(k));

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-16 max-w-3xl">
        <h1 className="mb-4 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
          {t('browseDynasties')}
        </h1>
      </header>

      <div className="space-y-16">
        {orderedKingdoms.map((kingdom) => {
          const items = grouped.get(kingdom)!;
          return (
            <section key={kingdom}>
              <h2 className="mb-8 border-b border-line pb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
                {t(`kingdoms.${kingdom}` as any)}
              </h2>
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((d) => (
                  <WikiCard key={d._id} item={d} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
