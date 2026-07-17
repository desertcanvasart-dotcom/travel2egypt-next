import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import {
  travelTipBySlugQuery,
  allTravelTipSlugsQuery,
  siblingTravelTipsQuery,
  articlesByLanguageQuery,
} from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ArticleSidebar } from '@/components/ArticleSidebar';
import { ConciergeCTA } from '@/components/ConciergeCTA';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import {
  ArticleRelatedWeave,
  ArticleFootBand,
  type WeaveColumn,
  type WeaveItem,
} from '@/components/ArticleConnective';
import { extractHeadings, readingTimeMinutes } from '@/lib/portable-text';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import { buildArticleSchema, buildBreadcrumbList } from '@/lib/structured-data';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

interface TravelTipDoc {
  _id: string;
  title: string;
  slug: string;
  allSlugs?: Array<{ _key: string; current: string }>;
  summary?: string;
  body?: unknown;
  category?: { _id?: string; name?: string; slug?: string } | null;
  heroImage?: { asset?: unknown; alt?: string; caption?: string } | null;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: { asset?: unknown } | null;
    noIndex?: boolean;
  } | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tip = (await client.fetch(travelTipBySlugQuery(locale as Locale), {
    slug,
  })) as TravelTipDoc | null;
  if (!tip) return {};
  return buildMetadata(
    { title: tip.title, summary: tip.summary, heroImage: tip.heroImage, seo: tip.seo },
    {
      locale: locale as Locale,
      path: `/travel-tips/${slug}`,
      pathByLocale: pathByLocaleFromSlugs(tip.allSlugs, (s: string) => `/travel-tips/${s}`),
    }
  );
}

export async function generateStaticParams() {
  const tips: Array<{ slugs: Array<{ _key: string; current: string }> }> =
    await client.fetch(allTravelTipSlugsQuery);
  const params: Array<{ locale: string; slug: string }> = [];
  for (const tip of tips) {
    const enSlug = tip.slugs?.find((s) => s._key === 'en')?.current;
    if (!enSlug) continue;
    for (const locale of routing.locales) {
      params.push({ locale, slug: tip.slugs.find((s) => s._key === locale)?.current ?? enSlug });
    }
  }
  return params;
}

export default async function TravelTipDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('travelTips');
  const tBlog = await getTranslations('blog');
  const tNav = await getTranslations('nav');

  const tip = (await client.fetch(travelTipBySlugQuery(locale as Locale), {
    slug,
  })) as TravelTipDoc | null;
  if (!tip) notFound();

  const [siblings, recentArticles] = await Promise.all([
    tip.category?._id
      ? client.fetch<Array<{ _id: string; title: string; slug: string; summary?: string }>>(
          siblingTravelTipsQuery(locale as Locale),
          { categoryId: tip.category._id, excludeId: tip._id }
        )
      : Promise.resolve([]),
    client.fetch<
      Array<{ _id: string; title: string; slug: string; category?: { name?: string } | null }>
    >(articlesByLanguageQuery, { locale }),
  ]);

  const headings = extractHeadings(tip.body);
  const minutes = readingTimeMinutes(tip.body, locale as Locale);
  const dropCap = minutes >= 2;

  const featureUrl = tip.heroImage?.asset
    ? urlFor(tip.heroImage).width(1600).quality(85).url()
    : null;

  const categoryHref = tip.category?.slug ? `/travel-tips#category-${tip.category.slug}` : null;

  // ── Related weave: "More in {category}" siblings (tips carry no city, so
  // the "Read in the Guide" column is omitted — the weave drops empty columns). ──
  const moreInItems: WeaveItem[] = siblings.map((s) => ({
    id: s._id,
    title: s.title,
    note: s.summary,
    href: `/travel-tips/${s.slug}`,
  }));
  const weaveColumns: WeaveColumn[] = tip.category?.name
    ? [{ heading: t('moreInCategory', { category: tip.category.name }), items: moreInItems }]
    : [];

  const journalItems: WeaveItem[] = recentArticles.slice(0, 3).map((a) => ({
    id: a._id,
    title: a.title,
    kicker: a.category?.name,
    href: `/blog/${a.slug}`,
  }));

  // ── Structured data ──
  const articleSchema = buildArticleSchema(
    {
      title: tip.title,
      slug,
      deck: tip.summary,
      heroImage: tip.heroImage,
      category: tip.category ? { name: tip.category.name } : null,
    },
    locale as Locale,
    `/travel-tips/${slug}`
  );
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: t('landingTitle'), path: '/travel-tips' },
      ...(tip.category?.name && tip.category.slug
        ? [{ name: tip.category.name, path: `/travel-tips#category-${tip.category.slug}` }]
        : []),
      { name: tip.title, path: `/travel-tips/${slug}` },
    ],
    locale as Locale
  );

  const breadcrumbItems = [
    { label: tNav('home'), href: '/' },
    { label: t('breadcrumb'), href: '/travel-tips' },
    ...(tip.category?.name && categoryHref
      ? [{ label: tip.category.name, href: categoryHref }]
      : []),
    { label: tip.title },
  ];

  return (
    <article>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />

      {/* Breadcrumb + type-led header */}
      <div className="mx-auto max-w-7xl px-6">
        <Breadcrumb items={breadcrumbItems} className="pt-8" />

        <header className="max-w-[820px] pt-12">
          {tip.category?.name && categoryHref && (
            <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.2em] text-gold-ink">
              <Link href={categoryHref} className="transition-colors hover:text-night">
                {tip.category.name}
              </Link>
            </p>
          )}
          <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] font-normal leading-[1.04] tracking-[-0.01em] text-faience">
            {tip.title}
          </h1>
          {tip.summary && (
            <p className="mt-7 max-w-[680px] font-serif text-[clamp(1.375rem,2.3vw,1.75rem)] italic leading-snug text-night-soft">
              {tip.summary}
            </p>
          )}
          <div className="mt-9 flex flex-wrap items-center gap-x-4 border-y border-rule py-5 font-sans text-xs uppercase tracking-[0.08em] text-night-soft">
            <span>{t('readingTime', { count: minutes })}</span>
          </div>
        </header>
      </div>

      {/* Optional lead image */}
      {featureUrl && (
        <div className="mx-auto mt-12 max-w-7xl px-6">
          <figure>
            <div className="relative aspect-[16/8] overflow-hidden bg-limestone-deep">
              <Image
                src={featureUrl}
                alt={tip.heroImage?.alt || tip.title}
                fill
                sizes="(max-width: 1280px) 100vw, 1216px"
                className="object-cover"
                priority
              />
            </div>
            {tip.heroImage?.caption && (
              <figcaption className="mt-3 font-sans text-xs uppercase tracking-[0.08em] text-night-soft">
                {tip.heroImage.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}

      {/* Body: sticky sidebar + article */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-x-20 gap-y-10 py-16 lg:grid-cols-[220px_minmax(0,1fr)]">
          <ArticleSidebar
            headings={headings}
            filedUnder={tip.category?.name ? [tip.category.name] : []}
            shareTitle={tip.title}
            labels={{
              toc: tBlog('tocLabel'),
              conciergeText: tBlog('sidebarConciergeText'),
              conciergeCta: tBlog('sidebarConciergeCta'),
              filedUnder: tBlog('filedUnderLabel'),
              share: tBlog('shareLabel'),
              copyLink: tBlog('shareCopyLink'),
              copied: tBlog('shareCopied'),
              email: tBlog('shareEmail'),
            }}
          />

          <div className="min-w-0">
            {tip.body ? (
              <div className={`prose-editorial max-w-[680px] ${dropCap ? 'article-dropcap' : ''}`}>
                <Body value={tip.body} locale={locale as Locale} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ArticleRelatedWeave columns={weaveColumns} />

      <ConciergeCTA chatEnabled={isChatEnabled()} variant="compact" contextLabel={t('conciergeAboutTips')} />
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
