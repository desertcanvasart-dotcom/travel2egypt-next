import { cache } from 'react';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import {
  foodArticleBySlugQuery,
  allFoodArticleSlugsQuery,
  recentFoodQuery,
} from '@/sanity/lib/queries';
import { FoodArticleBody } from '@/components/food/FoodArticleBody';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ConciergeCTA } from '@/components/ConciergeCTA';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import { ArticleFootBand, type WeaveItem } from '@/components/ArticleConnective';
import { readingTimeMinutes } from '@/lib/portable-text';
import { fetchTranslationSlugs } from '@/sanity/lib/translations';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildArticleSchema, buildBreadcrumbList } from '@/lib/structured-data';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

interface TourRef {
  _id: string;
  type?: string;
  title?: string;
  slug?: string;
  summary?: string;
}
interface FoodArticleDoc {
  _id: string;
  language: string;
  title: string;
  slug: string;
  deck?: string;
  format: string;
  region: string;
  publishedAt?: string;
  updatedAt?: string;
  lastVerified?: string;
  heroImage?: { asset?: unknown; alt?: string; caption?: string; credit?: string } | null;
  author?: { _id: string; name: string; slug?: { current: string }; role?: string } | null;
  tour?: TourRef | null;
  body?: unknown;
  seo?: unknown;
}

/**
 * Resolve the article for (locale, slug). If the requested locale has no doc
 * but EN does, fall back to the EN doc (never a 404 mid-stagger). `fellBack`
 * lets the page flag the English edition and the metadata self-canonicalize.
 */
const resolveFood = cache(
  async (locale: string, slug: string): Promise<{ doc: FoodArticleDoc | null; fellBack: boolean }> => {
    let doc = (await client.fetch(foodArticleBySlugQuery, { locale, slug })) as FoodArticleDoc | null;
    if (!doc && locale !== 'en') {
      doc = (await client.fetch(foodArticleBySlugQuery, { locale: 'en', slug })) as FoodArticleDoc | null;
      if (doc) return { doc, fellBack: true };
    }
    return { doc, fellBack: false };
  },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const { doc } = await resolveFood(locale, slug);
  if (!doc) return {};

  // Doc-per-locale: hreflang points at each sibling's real slug; the doc's own
  // locale (EN when we fell back) drives the canonical, so a JA-url fallback
  // page honestly presents itself as the English edition rather than a JA URL.
  const siblings = await fetchTranslationSlugs(doc._id);
  const pathByLocale: Partial<Record<Locale, string>> = {};
  for (const loc of routing.locales) {
    const sib = loc === doc.language ? doc.slug : siblings[loc as Locale];
    if (sib) pathByLocale[loc as Locale] = `/food/${sib}`;
  }

  return buildMetadata(
    { title: doc.title, summary: doc.deck, heroImage: doc.heroImage, seo: doc.seo as never },
    { locale: doc.language as Locale, path: `/food/${doc.slug}`, pathByLocale },
  );
}

export async function generateStaticParams() {
  const all: Array<{ language: string; slug: string }> = await client.fetch(allFoodArticleSlugsQuery);
  const params: Array<{ locale: string; slug: string }> = [];
  for (const a of all) {
    if (!a.slug || !a.language) continue;
    if (!routing.locales.includes(a.language as Locale)) continue;
    params.push({ locale: a.language, slug: a.slug });
  }
  return params;
}

function formatDate(value: string | undefined, locale: string): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString(
    locale === 'ja' ? 'ja-JP' : locale === 'es' ? 'es-ES' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
}
function formatMonthYear(value: string | undefined, locale: string): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString(
    locale === 'ja' ? 'ja-JP' : locale === 'es' ? 'es-ES' : 'en-US',
    { year: 'numeric', month: 'long' },
  );
}

export default async function FoodArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('food');
  const tNav = await getTranslations('nav');
  const { doc, fellBack } = await resolveFood(locale, slug);
  if (!doc) notFound();

  const recent = (await client.fetch(recentFoodQuery, {
    locale: fellBack ? 'en' : locale,
    excludeSlug: slug,
  })) as Array<{ _id: string; title: string; slug: string; format: string }>;

  const minutes = readingTimeMinutes(doc.body, locale as Locale);
  const dateLabel = formatDate(doc.updatedAt ?? doc.publishedAt, locale);
  const dropCap = minutes >= 2;
  // Bake the 16:8 crop through Sanity so the image's hotspot/crop drive the
  // framing (width-only would ignore them and leave a CSS centre-crop).
  const featureUrl = doc.heroImage?.asset
    ? urlFor(doc.heroImage).width(1600).height(800).fit('crop').quality(85).url()
    : null;

  const formatLabel = (f: string): string =>
    ({
      biography: t('formatBiography'),
      generations: t('formatGenerations'),
      route: t('formatRoute'),
      practical: t('formatPractical'),
    })[f] ?? f;

  // A missing-locale doc falls back to EN content — render it as EN (no JA
  // presentation layer on English prose), and only show 最終更新 for genuine JA.
  const contentLocale = (fellBack ? 'en' : locale) as Locale;
  const jaUpdated = contentLocale === 'ja' ? formatMonthYear(doc.updatedAt ?? doc.publishedAt, 'ja') : null;

  const isRoute = doc.format === 'route';
  const tour = doc.tour ?? null;
  const tourHref = tour?.slug ? (tour.type === 'package' ? `/packages/${tour.slug}` : `/${tour.slug}`) : null;

  // ── Structured data (Article + BreadcrumbList) ──
  const articleSchema = buildArticleSchema(
    {
      title: doc.title,
      slug: doc.slug,
      deck: doc.deck,
      publishedAt: doc.publishedAt,
      updatedAt: doc.updatedAt,
      heroImage: doc.heroImage,
      author: doc.author ? { name: doc.author.name, slug: doc.author.slug } : null,
      category: { name: t('breadcrumb') },
    },
    (fellBack ? 'en' : locale) as Locale,
  );
  const trail = [
    { name: tNav('home'), path: '/' },
    { name: t('breadcrumb'), path: '/food' },
    { name: doc.title, path: `/food/${doc.slug}` },
  ];
  const breadcrumbItems = [
    { label: tNav('home'), href: '/' },
    { label: t('breadcrumb'), href: '/food' },
    { label: doc.title },
  ];
  const breadcrumbSchema = buildBreadcrumbList(trail, (fellBack ? 'en' : locale) as Locale);

  const journalItems: WeaveItem[] = recent.map((a) => ({
    id: a._id,
    title: a.title,
    kicker: formatLabel(a.format),
    href: `/food/${a.slug}`,
  }));

  const CONTAINER = 'mx-auto max-w-7xl px-6';

  return (
    <article>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />

      <div className={CONTAINER}>
        <Breadcrumb items={breadcrumbItems} className="pt-8" />

        <header className="max-w-[820px] pt-12">
          <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.2em] text-gold-ink">
            {formatLabel(doc.format)}
          </p>
          <h1 className="font-serif text-[clamp(2.75rem,6vw,5rem)] font-normal leading-[1.02] tracking-[-0.01em] text-faience">
            {doc.title}
          </h1>
          {doc.deck && (
            <p className="mt-7 max-w-[680px] font-serif text-[clamp(1.375rem,2.3vw,1.8rem)] italic leading-snug text-night-soft">
              {doc.deck}
            </p>
          )}
          <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-rule py-5 font-sans text-xs uppercase tracking-[0.08em] text-night-soft">
            {doc.author && (
              <span className="text-night">
                <span className="text-night-soft">{t('byLabel')}</span> {doc.author.name}
              </span>
            )}
            {doc.author && dateLabel && <span aria-hidden className="text-rule-strong">·</span>}
            {dateLabel && <span>{dateLabel}</span>}
            <span aria-hidden className="text-rule-strong">·</span>
            <span>{t('readingTime', { count: minutes })}</span>
          </div>
          {fellBack && (
            <p className="mt-5 max-w-[680px] font-sans text-xs uppercase tracking-[0.12em] text-gold-ink">
              {t('enFallbackNote')}
            </p>
          )}
        </header>
      </div>

      {featureUrl && (
        <div className="mx-auto mt-12 max-w-7xl px-6">
          <figure>
            <div className="relative aspect-[16/8] overflow-hidden bg-limestone-deep">
              <Image
                src={featureUrl}
                alt={doc.heroImage?.alt ?? ''}
                fill
                sizes="(max-width: 1280px) 100vw, 1216px"
                className="object-cover"
                priority
              />
            </div>
            {(doc.heroImage?.caption || doc.heroImage?.credit) && (
              <figcaption className="mt-3 font-sans text-xs text-night-soft">
                {doc.heroImage?.caption && (
                  <span className="uppercase tracking-[0.08em]">{doc.heroImage.caption}</span>
                )}
                {doc.heroImage?.credit && (
                  <span className="mt-1 block text-[0.7rem] tracking-[0.04em] text-night-soft/70">
                    {doc.heroImage.credit}
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        </div>
      )}

      <div className={CONTAINER}>
        <div className="py-16">
          {doc.body ? (
            <div
              className={`prose-editorial max-w-[680px] ${dropCap ? 'article-dropcap' : ''} ${
                contentLocale === 'ja' ? 'food-body-ja' : ''
              }`}
            >
              <FoodArticleBody value={doc.body} locale={contentLocale} />
            </div>
          ) : null}

          {/* ── Route only: bookable-twin cross-link + quiet verification line ── */}
          {isRoute && tour && tourHref && (
            <aside className="mt-14 max-w-[680px] border-t border-rule pt-8">
              <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-gold-ink">
                {t('planThis')}
              </p>
              <p className="mt-3 font-serif text-lg italic leading-snug text-night-soft">
                {tour.summary || t('planThisBody')}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-6">
                <Link
                  href={`/plan-your-tour?tour=${encodeURIComponent(tour.slug ?? '')}`}
                  className="inline-flex items-center gap-2 bg-night px-6 py-3 font-sans text-xs font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-night-soft"
                >
                  {t('planThis')} →
                </Link>
                <Link
                  href={tourHref}
                  className="font-sans text-xs font-medium uppercase tracking-[0.16em] text-night-soft underline-offset-4 transition-colors hover:text-night hover:underline"
                >
                  {t('viewTour')}
                </Link>
              </div>
            </aside>
          )}

          {isRoute && doc.lastVerified && (
            <p className="mt-8 max-w-[680px] font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-night-soft">
              {t('lastVerifiedLabel')}: {formatMonthYear(doc.lastVerified, locale)}
            </p>
          )}

          {/* JA corpus convention: a closing 最終更新 line, derived from the doc. */}
          {jaUpdated && (
            <p className="mt-12 max-w-[680px] border-t border-rule pt-6 font-sans text-sm text-night-soft">
              最終更新：{jaUpdated}
            </p>
          )}
        </div>
      </div>

      <ConciergeCTA chatEnabled={isChatEnabled()} variant="compact" contextLabel={t('conciergeAboutFood')} />
      <ArticleFootBand
        inSeasonLabel={t('footInSeasonLabel')}
        inSeasonBody={t('footInSeasonBody')}
        journalLabel={t('footJournalLabel')}
        journalItems={journalItems}
        practicalLabel={t('footPracticalLabel')}
        practicalBody={t('footPracticalBody')}
      />
      <FloatingConcierge />
    </article>
  );
}
