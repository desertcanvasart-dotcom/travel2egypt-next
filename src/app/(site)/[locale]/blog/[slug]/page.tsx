import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import {
  articleBySlugQuery,
  articleRelatedWeaveQuery,
  allArticleSlugsQuery,
} from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ArticleSidebar } from '@/components/ArticleSidebar';
import { ConciergeCTA } from '@/components/ConciergeCTA';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import {
  ArticleRelatedWeave,
  ArticleFootBand,
  type WeaveColumn,
  type WeaveItem,
} from '@/components/ArticleConnective';
import { extractHeadings, readingTimeMinutes } from '@/lib/portable-text';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import {
  buildArticleSchema,
  buildBreadcrumbList,
} from '@/lib/structured-data';
import {
  buildBlogTrail,
  toVisibleCrumbs,
  toSchemaCrumbs,
} from '@/lib/blog-breadcrumb';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await client.fetch(articleBySlugQuery, { locale, slug });
  if (!article) return {};
  return buildMetadata(
    {
      title: article.title,
      summary: article.deck,
      heroImage: article.heroImage,
      seo: article.seo,
    },
    {
      locale: locale as Locale,
      path: `/blog/${slug}`,
    }
  );
}

export async function generateStaticParams() {
  const all: Array<{ language: string; slug: string }> = await client.fetch(
    allArticleSlugsQuery
  );
  const params: Array<{ locale: string; slug: string }> = [];
  for (const article of all) {
    if (!article.slug || !article.language) continue;
    if (!routing.locales.includes(article.language as Locale)) continue;
    params.push({ locale: article.language, slug: article.slug });
  }
  return params;
}

interface CityRef {
  _id: string;
  name?: string;
  slug?: string;
}

interface ArticleDoc {
  _id: string;
  title: string;
  slug: string;
  deck?: string;
  body?: unknown;
  publishedAt?: string;
  updatedAt?: string;
  heroImage?: {
    asset?: unknown;
    alt?: string;
    caption?: string;
    credit?: string;
  } | null;
  category?: { name: string; slug: string } | null;
  categoryId?: string | null;
  categoryTrail?: {
    name: string;
    slug: string;
    parent?: { name: string; slug: string } | null;
  } | null;
  author?: {
    _id: string;
    name: string;
    slug?: { current: string };
    role?: string;
    photo?: { asset?: unknown } | null;
  } | null;
  authorBio?: { bio?: unknown } | null;
  relatedCities?: CityRef[];
  primaryCity?: CityRef | null;
}

interface WeaveData {
  readNext: Array<{ _id: string; title: string; slug: string; category?: { name?: string } | null }>;
  recent: Array<{ _id: string; title: string; slug: string; category?: { name?: string } | null }>;
  tours: Array<{ _id: string; type?: string; title: string; slug: string; summary?: string }>;
  city: { _id: string; name?: string; slug?: string; summary?: string } | null;
  guideArticles: Array<{
    _id: string;
    title: string;
    slug: string;
    parentCitySlug?: string;
    summary?: string;
  }>;
}

function formatDate(value: string | undefined, locale: string): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString(
    locale === 'ja' ? 'ja-JP' : locale === 'es' ? 'es-ES' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('blog');
  const tNav = await getTranslations('nav');
  const article = (await client.fetch(articleBySlugQuery, {
    locale,
    slug,
  })) as ArticleDoc | null;
  if (!article) notFound();

  const primaryCity = article.primaryCity ?? null;

  const weave = (await client.fetch(articleRelatedWeaveQuery, {
    locale,
    excludeId: article._id,
    categoryId: article.categoryId ?? null,
    cityId: primaryCity?._id ?? null,
  })) as WeaveData;

  const headings = extractHeadings(article.body);
  const minutes = readingTimeMinutes(article.body, locale as Locale);
  const dateLabel = formatDate(article.updatedAt ?? article.publishedAt, locale);

  const authorPhotoUrl = article.author?.photo?.asset
    ? urlFor(article.author.photo).width(96).height(96).quality(85).url()
    : null;

  const isArchive = (article.author?.name ?? '').toLowerCase().includes('archive');

  // Drop cap reads well on substantial pieces; suppress it on short field
  // notes where a giant initial would overwhelm a couple of paragraphs.
  const dropCap = minutes >= 2;

  const featureUrl = article.heroImage?.asset
    ? urlFor(article.heroImage).width(1600).quality(85).url()
    : null;

  // ── Filed-under: category, then any related cities ──────────────────
  const filedUnder = [
    article.category?.name,
    ...(article.relatedCities ?? []).map((c) => c.name).filter(Boolean),
  ].filter((s): s is string => Boolean(s));

  // ── Related weave columns ───────────────────────────────────────────
  const readNextItems: WeaveItem[] = weave.readNext.map((a) => ({
    id: a._id,
    kicker: a.category?.name,
    title: a.title,
    href: `/blog/${a.slug}`,
  }));

  const tourItems: WeaveItem[] = weave.tours
    .filter((tour) => tour.slug)
    .map((tour) => ({
      id: tour._id,
      kicker: tour.type === 'package' ? t('weavePackageKicker') : t('weaveTourKicker'),
      title: tour.title,
      note: tour.summary,
      href: tour.type === 'package' ? `/packages/${tour.slug}` : `/${tour.slug}`,
    }));

  const guideItems: WeaveItem[] = [
    ...(weave.city?.slug
      ? [
          {
            id: weave.city._id,
            kicker: t('weaveCityKicker'),
            title: weave.city.name ?? '',
            note: weave.city.summary,
            href: `/guide/${weave.city.slug}`,
          },
        ]
      : []),
    ...weave.guideArticles
      .filter((g) => g.slug && g.parentCitySlug)
      .map((g) => ({
        id: g._id,
        kicker: t('weaveGuideKicker'),
        title: g.title,
        note: g.summary,
        href: `/guide/${g.parentCitySlug}/${g.slug}`,
      })),
  ];

  const cityName = primaryCity?.name ?? '';
  const weaveColumns: WeaveColumn[] = [
    { heading: t('readNextLabel'), items: readNextItems },
    ...(cityName
      ? [{ heading: t('doInCityLabel', { city: cityName }), items: tourItems }]
      : []),
    { heading: t('readGuideLabel'), items: guideItems },
  ];

  const journalItems: WeaveItem[] = weave.recent.map((a) => ({
    id: a._id,
    kicker: a.category?.name,
    title: a.title,
    href: `/blog/${a.slug}`,
  }));

  // ── Structured data ─────────────────────────────────────────────────
  const articleSchema = buildArticleSchema(
    {
      title: article.title,
      slug,
      deck: article.deck,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      heroImage: article.heroImage,
      author: article.author
        ? { name: article.author.name, slug: article.author.slug }
        : null,
      category: article.category ? { name: article.category.name } : null,
    },
    locale as Locale
  );
  // Home › Journal › Section › Subcategory › Title — one builder feeds both
  // the visible breadcrumb and the JSON-LD, so they never drift.
  const trail = buildBlogTrail({
    homeLabel: tNav('home'),
    journalLabel: tNav('blog'),
    category: article.categoryTrail ?? null,
    article: { title: article.title, slug },
  });
  const breadcrumbItems = toVisibleCrumbs(trail);
  const breadcrumbSchema = buildBreadcrumbList(toSchemaCrumbs(trail), locale as Locale);

  return (
    <article>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />

      {/* ── Breadcrumb + type-led header ── */}
      <div className="mx-auto max-w-7xl px-6">
        <Breadcrumb items={breadcrumbItems} className="pt-8" />

        <header className="max-w-[820px] pt-12">
          {article.categoryTrail && (
            <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.2em] text-sand-warm">
              <Link
                href={`/blog/category/${article.categoryTrail.slug}`}
                className="transition-colors hover:text-night"
              >
                {article.categoryTrail.name}
              </Link>
            </p>
          )}
          <h1 className="font-serif text-[clamp(2.75rem,6vw,5rem)] font-normal leading-[1.02] tracking-[-0.01em] text-faience">
            {article.title}
          </h1>
          {article.deck && (
            <p className="mt-7 max-w-[680px] font-serif text-[clamp(1.375rem,2.3vw,1.8rem)] italic leading-snug text-night-soft">
              {article.deck}
            </p>
          )}
          <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-rule py-5 font-sans text-xs uppercase tracking-[0.08em] text-night-soft">
            {article.author && (
              <span className="text-night">
                <span className="text-night-soft">{t('byLabel')}</span> {article.author.name}
              </span>
            )}
            {article.author && dateLabel && <span aria-hidden className="text-rule-strong">·</span>}
            {dateLabel && <span>{dateLabel}</span>}
            <span aria-hidden className="text-rule-strong">·</span>
            <span>{t('readingTime', { count: minutes })}</span>
          </div>
        </header>
      </div>

      {/* ── Optional magazine lead image (features only) ── */}
      {featureUrl && (
        <div className="mx-auto mt-12 max-w-7xl px-6">
          <figure>
            <div className="relative aspect-[16/8] overflow-hidden bg-limestone-deep">
              <Image
                src={featureUrl}
                alt={article.heroImage?.alt || article.title}
                fill
                sizes="(max-width: 1280px) 100vw, 1216px"
                className="object-cover"
                priority
              />
            </div>
            {article.heroImage?.caption && (
              <figcaption className="mt-3 font-sans text-xs uppercase tracking-[0.08em] text-night-soft">
                {article.heroImage.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}

      {/* ── Body: sticky sidebar + article ── */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-x-20 gap-y-10 py-16 lg:grid-cols-[220px_minmax(0,1fr)]">
          <ArticleSidebar
            headings={headings}
            filedUnder={filedUnder}
            shareTitle={article.title}
            labels={{
              toc: t('tocLabel'),
              conciergeText: t('sidebarConciergeText'),
              conciergeCta: t('sidebarConciergeCta'),
              filedUnder: t('filedUnderLabel'),
              share: t('shareLabel'),
              copyLink: t('shareCopyLink'),
              copied: t('shareCopied'),
              email: t('shareEmail'),
            }}
          />

          <div className="min-w-0">
            {article.body ? (
              <div
                className={`prose-editorial max-w-[680px] ${dropCap ? 'article-dropcap' : ''}`}
              >
                <Body value={article.body} locale={locale as Locale} />
              </div>
            ) : null}

            {/* Archive attribution — only for legacy archive pieces */}
            {isArchive && (
              <div className="mt-10 max-w-[680px] bg-limestone-deep p-7">
                <p className="mb-2 font-sans text-xs font-medium uppercase tracking-[0.18em] text-night">
                  {t('archiveTitle')}
                </p>
                <p className="font-sans text-sm leading-relaxed text-night-soft">
                  {t('archiveBody')}
                </p>
              </div>
            )}

            {/* Author bio */}
            {article.authorBio?.bio ? (
              <section className="mt-12 max-w-[680px] border border-rule bg-limestone-warm p-8">
                <div className="flex items-center gap-4">
                  {authorPhotoUrl && (
                    <Image
                      src={authorPhotoUrl}
                      alt={article.author?.name ?? ''}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-serif text-xl text-night">{article.author?.name}</p>
                    {article.author?.role && (
                      <p className="font-sans text-xs uppercase tracking-wider text-night-soft">
                        {article.author.role}
                      </p>
                    )}
                  </div>
                </div>
                <div className="prose-editorial mt-4 max-w-none text-sm">
                  <Body value={article.authorBio.bio} locale={locale as Locale} />
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Related weave ── */}
      <ArticleRelatedWeave columns={weaveColumns} />

      {/* ── Concierge CTA (contextual where a city is known) ── */}
      <ConciergeCTA
        variant="compact"
        contextLabel={cityName ? t('conciergeAboutCity', { city: cityName }) : undefined}
      />

      {/* ── Foot connective band ── */}
      <ArticleFootBand
        inSeasonLabel={t('footInSeasonLabel')}
        inSeasonBody={t('footInSeasonBody')}
        journalLabel={t('footJournalLabel')}
        journalItems={journalItems}
        practicalLabel={t('footPracticalLabel')}
        practicalBody={t('footPracticalBody')}
      />

      {/* ── Persistent concierge affordance ── */}
      <FloatingConcierge />
    </article>
  );
}
