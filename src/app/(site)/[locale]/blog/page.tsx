import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  articlesByLanguageQuery,
  categoryRootsQuery,
  featuredLeadArticleQuery,
} from '@/sanity/lib/queries';
import { ArticleCard, type ArticleCardData } from '@/components/ArticleCard';
import { Breadcrumb } from '@/components/Breadcrumb';
import { EditorialHeroStats } from '@/components/EditorialHeroStats';
import { buildStaticMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/structured-data';
import {
  buildBlogTrail,
  toVisibleCrumbs,
  toSchemaCrumbs,
} from '@/lib/blog-breadcrumb';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/blog',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

export default async function BlogLandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('blog');
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const [articles, categories, lead] = await Promise.all([
    client.fetch<ArticleCardData[]>(articlesByLanguageQuery, { locale }),
    // Primary nav surfaces only the two root buckets (Planning, Destination);
    // leaf sub-categories are reached from each bucket's landing page.
    client.fetch<Array<{ _id: string; name: string; slug: string }>>(
      categoryRootsQuery(locale as Locale)
    ),
    client.fetch<ArticleCardData | null>(featuredLeadArticleQuery, { locale }),
  ]);

  // Hero stat anchor. "Updated" reflects the most recent article's date.
  const latestDate = articles.reduce((m, a) => {
    const d = a.updatedAt ?? a.publishedAt;
    return d && (!m || d > m) ? d : m;
  }, '');
  const heroStats = [
    { label: t('statArticles'), value: articles.length },
    { label: t('statCategories'), value: new Set(articles.map((a) => a.category?.slug).filter(Boolean)).size },
    {
      label: t('statUpdated'),
      value: latestDate
        ? new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : locale === 'es' ? 'es-ES' : 'en-GB', {
            month: 'short',
            year: 'numeric',
          }).format(new Date(latestDate))
        : '',
    },
  ];

  // Filter the lead out of the rest grid to avoid duplication.
  const rest = articles.filter((a) => a._id !== lead?._id);

  // Same builder as the category + article routes, so the visible
  // breadcrumb and JSON-LD stay aligned. The landing itself is the
  // current page (Journal), so it lands as the non-linked last crumb.
  const trail = buildBlogTrail({
    homeLabel: tNav('home'),
    journalLabel: tNav('blog'),
  });
  const breadcrumbItems = toVisibleCrumbs(trail);
  const breadcrumbSchema = buildBreadcrumbList(toSchemaCrumbs(trail), locale as Locale);

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumb items={breadcrumbItems} className="mb-8" />
      <header className="mb-16 flex flex-col gap-10 md:flex-row md:items-end md:justify-between md:gap-12">
        <div className="max-w-3xl">
          <h1 className="mb-6 font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-night">
            {t('landingTitle')}
          </h1>
          <p className="font-serif text-[clamp(1.25rem,2vw,1.5rem)] italic leading-[1.45] text-night-soft">
            {t('landingDeck')}
          </p>
        </div>
        <EditorialHeroStats stats={heroStats} />
      </header>

      {categories.length > 0 && (
        <nav
          aria-label={t('categoryLabel')}
          className="mb-16 flex flex-wrap gap-x-8 gap-y-3 border-y border-rule py-5"
        >
          <Link
            href="/blog"
            className="font-serif text-base text-night transition-colors hover:text-faience"
          >
            {t('allCategories')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/blog/category/${cat.slug}`}
              className="font-serif text-base italic text-night-soft transition-colors hover:text-faience"
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      )}

      {articles.length === 0 ? (
        <p className="mt-12 font-serif text-lg italic text-night-soft">
          {t('noArticlesYet')}
        </p>
      ) : (
        <div className="space-y-20">
          {lead && (
            <ArticleCard article={lead} variant="lead" locale={locale} />
          )}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-x-10 gap-y-16 border-t border-rule-strong pt-16 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <ArticleCard
                  key={article._id}
                  article={article}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
