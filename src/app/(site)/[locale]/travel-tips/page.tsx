import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import {
  travelTipsArchiveQuery,
  travelTipsForArchiveQuery,
  articlesByLanguageQuery,
} from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ConciergeCTA } from '@/components/ConciergeCTA';
import { ArticleFootBand, type WeaveItem } from '@/components/ArticleConnective';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import { buildStaticMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}
interface Tip {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  chars?: number;
  category?: Category | null;
}
interface ArchiveDoc {
  kicker?: string;
  title?: string;
  tagline?: string;
  essayHeading?: string;
  essay?: unknown;
  cornerstone?: {
    dek?: string;
    tip?: {
      _id: string;
      title: string;
      slug: string;
      summary?: string;
      category?: { name?: string; slug?: string } | null;
      heroImage?: { asset?: unknown; alt?: string } | null;
    } | null;
  } | null;
  departments?: Array<{ intro?: string; category?: Category | null }>;
}

/** Read-time from a flattened-body character count (~200 wpm; ja by chars). */
function readMinutes(chars: number | undefined, locale: string): number {
  if (!chars) return 1;
  return Math.max(1, Math.ceil(chars / (locale === 'ja' ? 500 : 1100)));
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

export default async function TravelTipsArchivePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('travelTips');
  const tNav = await getTranslations('nav');

  const [archive, tips, recentArticles] = await Promise.all([
    client.fetch<ArchiveDoc | null>(travelTipsArchiveQuery(locale as Locale)),
    client.fetch<Tip[]>(travelTipsForArchiveQuery(locale as Locale)),
    client.fetch<
      Array<{ _id: string; title: string; slug: string; category?: { name?: string } | null }>
    >(articlesByLanguageQuery, { locale }),
  ]);

  // Group tips by category id.
  const byCategory = new Map<string, Tip[]>();
  for (const tip of tips) {
    const id = tip.category?._id;
    if (!id) continue;
    const list = byCategory.get(id);
    if (list) list.push(tip);
    else byCategory.set(id, [tip]);
  }

  const cornerstoneTip = archive?.cornerstone?.tip ?? null;
  const cornerstoneId = cornerstoneTip?._id;
  const cornerImg = cornerstoneTip?.heroImage?.asset
    ? urlFor(cornerstoneTip.heroImage).width(1100).height(1375).quality(82).url()
    : null;

  // Departments in the doc's order; tips by category, cornerstone excluded.
  const departments = (archive?.departments ?? [])
    .filter((d) => d.category?._id)
    .map((d) => ({
      category: d.category!,
      intro: d.intro,
      tips: (byCategory.get(d.category!._id) ?? []).filter((tip) => tip._id !== cornerstoneId),
    }))
    .filter((d) => d.tips.length > 0);

  // Contents index: every category that has tips, departments first then any
  // not listed in the doc (orphan-safe). Includes the cornerstone tip.
  const deptCatIds = new Set(departments.map((d) => d.category._id));
  const indexCategories: Array<{ category: Category; tips: Tip[] }> = [];
  for (const d of departments) {
    indexCategories.push({ category: d.category, tips: byCategory.get(d.category._id) ?? [] });
  }
  for (const [id, list] of byCategory) {
    if (deptCatIds.has(id)) continue;
    const cat = list[0]?.category;
    if (cat) indexCategories.push({ category: cat, tips: list });
  }

  const journalItems: WeaveItem[] = recentArticles.slice(0, 3).map((a) => ({
    id: a._id,
    title: a.title,
    kicker: a.category?.name,
    href: `/blog/${a.slug}`,
  }));

  const hasEssay = Array.isArray(archive?.essay) && archive.essay.length > 0;

  return (
    <>
      <div className="mx-auto max-w-7xl px-6">
        <Breadcrumb
          items={[{ label: tNav('home'), href: '/' }, { label: t('breadcrumb') }]}
          className="pt-8"
        />

        {/* Type-led header */}
        <header className="border-b border-rule py-14 md:py-16">
          {archive?.kicker && (
            <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.2em] text-sand-warm">
              {archive.kicker}
            </p>
          )}
          <h1 className="max-w-[16ch] font-serif text-[clamp(2.75rem,6vw,5rem)] font-normal leading-[1.0] tracking-[-0.01em] text-faience">
            {archive?.title ?? t('landingTitle')}
          </h1>
          <p className="mt-7 max-w-[680px] font-serif text-[clamp(1.375rem,2.3vw,1.8rem)] italic leading-snug text-night-soft">
            {archive?.tagline ?? t('landingDeck')}
          </p>
        </header>

        {/* Essay */}
        {hasEssay && (
          <section className="grid grid-cols-1 gap-12 border-b border-rule py-16 md:py-20 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-20">
            {archive?.essayHeading && (
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <h2 className="font-serif text-3xl font-normal leading-[1.05] text-faience">
                  {archive.essayHeading}
                </h2>
              </aside>
            )}
            <div className="prose-editorial max-w-[680px]">
              <Body value={archive!.essay} locale={locale as Locale} />
            </div>
          </section>
        )}

        {/* Cornerstone "Start here" */}
        {cornerstoneTip && (
          <section className="border-b border-rule py-16 md:py-20">
            <p className="mb-8 font-sans text-xs font-medium uppercase tracking-[0.2em] text-sand-warm">
              {t('cornerstoneKicker')}
            </p>
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
              <div>
                <h2 className="font-serif text-[clamp(2rem,3.6vw,3rem)] font-normal leading-[1.05] tracking-[-0.01em] text-faience">
                  {cornerstoneTip.title}
                </h2>
                {(archive?.cornerstone?.dek || cornerstoneTip.summary) && (
                  <p className="mt-5 max-w-[520px] font-serif text-[1.3rem] italic leading-snug text-night-soft">
                    {archive?.cornerstone?.dek || cornerstoneTip.summary}
                  </p>
                )}
                <Link
                  href={`/travel-tips/${cornerstoneTip.slug}`}
                  className="group mt-7 inline-flex items-center gap-2.5 border-b border-night pb-1 font-sans text-sm text-night transition-colors hover:border-sand hover:text-sand-warm"
                >
                  {t('cornerstoneLink')}
                  <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden bg-limestone-deep lg:order-first">
                {cornerImg && (
                  <Image
                    src={cornerImg}
                    alt={cornerstoneTip.heroImage?.alt || cornerstoneTip.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover"
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Departments — light editorial rows, no facets/cards */}
        <div className="py-16 md:py-20">
          {departments.map((dept) => (
            <section
              key={dept.category._id}
              id={`category-${dept.category.slug}`}
              className="mb-16 scroll-mt-24 md:mb-20"
            >
              <div className="mb-8 border-b border-rule-strong pb-5">
                <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-tight text-faience">
                  {dept.category.name}
                </h2>
                {dept.intro && (
                  <p className="mt-2 max-w-[560px] font-serif text-lg italic text-night-soft">
                    {dept.intro}
                  </p>
                )}
              </div>
              <div>
                {dept.tips.map((tip) => (
                  <Link
                    key={tip._id}
                    href={`/travel-tips/${tip.slug}`}
                    className="group block border-b border-rule py-6 transition-[padding] duration-200 last:border-0 hover:pl-2"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className="font-serif text-2xl font-normal leading-tight text-night transition-colors group-hover:text-faience">
                        {tip.title}
                      </h3>
                      <span className="shrink-0 font-sans text-xs uppercase tracking-[0.12em] text-night-soft">
                        {t('readingTime', { count: readMinutes(tip.chars, locale) })}
                      </span>
                    </div>
                    {tip.summary && (
                      <p className="mt-2 max-w-[680px] font-serif text-lg italic leading-snug text-night-soft">
                        {tip.summary}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contents index — every tip, plain links, no filter bar */}
        {indexCategories.length > 0 && (
          <section className="border-t border-rule py-16 md:py-20">
            <div className="mb-10">
              <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.2em] text-sand-warm">
                {t('contentsKicker')}
              </p>
              <h2 className="font-serif text-[clamp(2rem,4vw,2.75rem)] font-normal leading-none text-faience">
                {t('contentsTitle')}
              </h2>
              <p className="mt-3 max-w-[460px] font-serif text-lg italic text-night-soft">
                {t('contentsIntro')}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {indexCategories.map(({ category, tips: catTips }) => (
                <div key={category._id}>
                  <h3 className="mb-4 border-b border-rule pb-3 font-sans text-xs font-medium uppercase tracking-[0.14em] text-night-soft">
                    {category.name}
                  </h3>
                  <ul className="space-y-2.5">
                    {catTips.map((tip) => (
                      <li key={tip._id}>
                        <Link
                          href={`/travel-tips/${tip.slug}`}
                          className="font-serif text-lg leading-snug text-night transition-colors hover:text-faience"
                        >
                          {tip.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ConciergeCTA variant="compact" contextLabel={t('conciergeAboutTips')} />
      <ArticleFootBand
        inSeasonLabel={t('footInSeasonLabel')}
        inSeasonBody={t('footInSeasonBody')}
        journalLabel={t('footJournalLabel')}
        journalItems={journalItems}
        practicalLabel={t('footPracticalLabel')}
        practicalBody={t('footPracticalBody')}
      />
      <FloatingConcierge />
    </>
  );
}
