import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  allTravelTipCategoriesQuery,
  allTravelTipsQuery,
  featuredTravelTipsQuery,
} from '@/sanity/lib/queries';
import { TravelTipCard, type TravelTipCardData } from '@/components/TravelTipCard';
import { SectionHeader } from '@/components/SectionHeader';
import { ConciergeCTA } from '@/components/ConciergeCTA';
import { buildStaticMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

interface CategoryRow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  orderRank?: number;
  tipCount?: number;
}

interface TipRow extends TravelTipCardData {
  featured?: boolean;
  category?: { _id?: string; name?: string; slug?: string } | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'travelTips' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/travel-tips',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

export default async function TravelTipsLandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('travelTips');

  const [categories, featured, allTips] = await Promise.all([
    client.fetch<CategoryRow[]>(allTravelTipCategoriesQuery(locale as Locale)),
    client.fetch<TipRow[]>(featuredTravelTipsQuery(locale as Locale)),
    client.fetch<TipRow[]>(allTravelTipsQuery(locale as Locale)),
  ]);

  // Group all tips by category._id for the per-category anchor sections.
  const tipsByCategory = new Map<string, TipRow[]>();
  for (const tip of allTips) {
    const catId = tip.category?._id;
    if (!catId) continue;
    const list = tipsByCategory.get(catId) ?? [];
    list.push(tip);
    tipsByCategory.set(catId, list);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      {/* Editorial header */}
      <header className="mb-16 max-w-3xl">
        <h1 className="mb-6 font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-night">
          {t('landingTitle')}
        </h1>
        <p className="font-serif text-[clamp(1.25rem,2vw,1.5rem)] italic leading-[1.45] text-night-soft">
          {t('landingDeck')}
        </p>
      </header>

      {/* Featured strip */}
      {featured.length > 0 && (
        <section className="mb-20">
          <SectionHeader num="i" title={<>{t('featuredLabel')}</>} />
          <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((tip) => (
              <TravelTipCard
                key={tip._id}
                tip={tip}
                variant="featured"
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category navigation cards */}
      {categories.length > 0 && (
        <section className="mb-20">
          <SectionHeader num="ii" title={<>{t('categoryNavLabel')}</>} />
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/travel-tips#category-${cat.slug}`}
                className="group block border-t border-rule pt-5 transition-colors"
              >
                <h3 className="mb-2 font-serif text-2xl font-medium leading-tight text-night transition-colors group-hover:text-faience">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="mb-3 line-clamp-3 text-[0.9375rem] leading-relaxed text-night-soft">
                    {cat.description}
                  </p>
                )}
                {typeof cat.tipCount === 'number' && cat.tipCount > 0 && (
                  <p className="font-sans text-xs italic text-night-soft">
                    {t('tipsInCategory', { count: cat.tipCount })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Per-category anchor sections */}
      {categories.map((cat) => {
        const tips = tipsByCategory.get(cat._id) ?? [];
        if (tips.length === 0) return null;
        return (
          <section
            key={cat._id}
            id={`category-${cat.slug}`}
            className="mb-20 scroll-mt-24"
          >
            <SectionHeader
              num="iii"
              title={<>{cat.name}</>}
              subtitle={cat.description}
            />
            <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {tips.map((tip) => (
                <TravelTipCard
                  key={tip._id}
                  tip={tip}
                  variant="default"
                  locale={locale}
                />
              ))}
            </div>
          </section>
        );
      })}

      {allTips.length === 0 && (
        <p className="mt-12 font-serif text-lg italic text-night-soft">
          {t('allTipsLabel')} —
        </p>
      )}

      <ConciergeCTA variant="compact" />
    </div>
  );
}
