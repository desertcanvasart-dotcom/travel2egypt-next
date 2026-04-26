import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  allDynastiesQuery,
  allPeopleQuery,
  allMonumentsQuery,
  allDeitiesQuery,
} from '@/sanity/lib/queries';
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
    path: '/wiki',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

export default async function WikiLandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('wiki');

  const [dynasties, people, monuments, deities] = await Promise.all([
    client.fetch<WikiCardData[]>(allDynastiesQuery(locale as Locale)),
    client.fetch<WikiCardData[]>(allPeopleQuery(locale as Locale)),
    client.fetch<WikiCardData[]>(allMonumentsQuery(locale as Locale)),
    client.fetch<WikiCardData[]>(allDeitiesQuery(locale as Locale)),
  ]);

  const sections: Array<{
    title: string;
    href: string;
    items: WikiCardData[];
  }> = [
    { title: t('browseDynasties'), href: '/wiki/dynasties', items: dynasties.slice(0, 3) },
    { title: t('browsePeople'), href: '/wiki/people', items: people.slice(0, 3) },
    { title: t('browseMonuments'), href: '/wiki/monuments', items: monuments.slice(0, 3) },
    { title: t('browseDeities'), href: '/wiki/deities', items: deities.slice(0, 3) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-16 max-w-3xl">
        <h1 className="mb-4 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
          {t('landingTitle')}
        </h1>
        <p className="font-serif text-xl italic leading-relaxed text-ink-soft">
          {t('landingDeck')}
        </p>
      </header>

      <div className="space-y-20">
        {sections.map((section) => (
          <section key={section.title}>
            <header className="mb-8 flex items-end justify-between border-b border-line pb-4">
              <h2 className="font-serif text-3xl font-medium text-ink">
                {section.title}
              </h2>
              <Link
                href={section.href}
                className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-orange-deep transition-colors hover:text-ink"
              >
                {t('seeAll')} →
              </Link>
            </header>
            {section.items.length === 0 ? (
              <p className="font-serif text-base italic text-ink-muted">—</p>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <WikiCard key={item._id} item={item} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
