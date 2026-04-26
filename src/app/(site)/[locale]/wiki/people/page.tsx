import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { allPeopleQuery } from '@/sanity/lib/queries';
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
    path: '/wiki/people',
    title: t('browsePeople'),
    description: t('landingDeck'),
  });
}

const ROLE_ORDER = [
  'pharaoh',
  'queen',
  'consort',
  'vizier',
  'priest',
  'noble',
  'foreign-ruler',
  'artisan',
];

export default async function PeopleListPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('wiki');
  const people = await client.fetch<WikiCardData[]>(allPeopleQuery(locale as Locale));

  const grouped = new Map<string, WikiCardData[]>();
  for (const p of people) {
    const k = p.role ?? 'other';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(p);
  }

  const orderedRoles = ROLE_ORDER.filter((r) => grouped.has(r));

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-16 max-w-3xl">
        <h1 className="mb-4 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
          {t('browsePeople')}
        </h1>
      </header>

      <div className="space-y-16">
        {orderedRoles.map((role) => {
          const items = grouped.get(role)!;
          return (
            <section key={role}>
              <h2 className="mb-8 border-b border-line pb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
                {t(`roles.${role}` as any)}
              </h2>
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <WikiCard key={p._id} item={p} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
