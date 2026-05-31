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
  allArticleSlugsQuery,
} from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { ArticleCard, type ArticleCardData } from '@/components/ArticleCard';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import {
  buildArticleSchema,
  buildBreadcrumbList,
} from '@/lib/structured-data';

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
  // Each article exists per-language; emit a (locale, slug) for each
  // article whose language matches a routing locale.
  const params: Array<{ locale: string; slug: string }> = [];
  for (const article of all) {
    if (!article.slug || !article.language) continue;
    if (!routing.locales.includes(article.language as Locale)) continue;
    params.push({ locale: article.language, slug: article.slug });
  }
  return params;
}

interface ArticleDoc {
  _id: string;
  title: string;
  slug: string;
  deck?: string;
  body?: unknown;
  publishedAt?: string;
  updatedAt?: string;
  heroImage?: { asset?: unknown; alt?: string; caption?: string; credit?: string } | null;
  category?: { name: string; slug: string } | null;
  author?: {
    _id: string;
    name: string;
    slug?: { current: string };
    role?: string;
    photo?: { asset?: unknown } | null;
  } | null;
  authorBio?: { bio?: unknown } | null;
  relatedArticles?: ArticleCardData[];
  relatedTours?: Array<{
    _id: string;
    type?: string;
    title: string;
    slug: string;
    summary?: string;
    durationLabel?: string;
    heroImage?: { asset?: unknown; alt?: string } | null;
  }>;
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('blog');
  const article = (await client.fetch(articleBySlugQuery, {
    locale,
    slug,
  })) as ArticleDoc | null;
  if (!article) notFound();

  const heroUrl = article.heroImage?.asset
    ? urlFor(article.heroImage).width(2400).height(1400).quality(85).url()
    : null;
  const authorPhotoUrl = article.author?.photo?.asset
    ? urlFor(article.author.photo).width(160).height(160).quality(85).url()
    : null;

  const displayDate = article.updatedAt ?? article.publishedAt;
  const dateLabel = displayDate
    ? new Date(displayDate).toLocaleDateString(
        locale === 'ja' ? 'ja-JP' : locale === 'es' ? 'es-ES' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : null;

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
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: 'Home', path: '/' },
      { name: 'Journal', path: '/blog' },
      ...(article.category
        ? [{ name: article.category.name, path: `/blog/category/${article.category.slug}` }]
        : []),
      { name: article.title, path: `/blog/${slug}` },
    ],
    locale as Locale
  );

  return (
    <article>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />
      {/* Hero */}
      {heroUrl && (
        <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden bg-cream-deep">
          <Image
            src={heroUrl}
            alt={article.heroImage?.alt || article.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Headline block */}
        <header className="mb-10">
          {article.category && (
            <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
              <Link
                href={`/blog/category/${article.category.slug}`}
                className="hover:text-ink"
              >
                {article.category.name}
              </Link>
            </p>
          )}
          <h1 className="mb-6 font-serif text-4xl font-medium leading-[1.1] text-ink md:text-5xl">
            {article.title}
          </h1>
          {article.deck && (
            <p className="mb-8 font-serif text-2xl italic leading-relaxed text-ink-soft">
              {article.deck}
            </p>
          )}
          {article.author && (
            <div className="flex items-center gap-3 border-y border-line py-4">
              {authorPhotoUrl ? (
                <Image
                  src={authorPhotoUrl}
                  alt={article.author.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : null}
              <div className="text-sm">
                <p className="text-ink">
                  <span className="text-ink-muted">{t('byLabel')}</span>{' '}
                  <span className="font-medium">{article.author.name}</span>
                </p>
                {article.author.role && (
                  <p className="text-xs uppercase tracking-wider text-ink-muted">
                    {article.author.role}
                  </p>
                )}
              </div>
              {dateLabel && (
                <p className="ml-auto text-xs uppercase tracking-wider text-ink-muted">
                  {dateLabel}
                </p>
              )}
            </div>
          )}
        </header>

        {/* Body — generous typography on a narrower column */}
        {article.body ? (
          <div className="prose-editorial max-w-none">
            <Body value={article.body} locale={locale as Locale} />
          </div>
        ) : null}
      </div>

      {/* Author bio + related */}
      <div className="mx-auto max-w-3xl px-6">
        {article.authorBio?.bio ? (
          <section className="mt-16 rounded-lg border border-line bg-cream-warm p-8">
            <div className="flex items-center gap-4">
              {authorPhotoUrl && (
                <Image
                  src={authorPhotoUrl}
                  alt={article.author?.name ?? ''}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-serif text-xl text-ink">{article.author?.name}</p>
                {article.author?.role && (
                  <p className="text-xs uppercase tracking-wider text-ink-muted">
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

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-16">
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <section className="mt-12 border-t border-line pt-12">
            <h2 className="mb-8 font-serif text-3xl font-medium text-ink">
              {t('relatedArticlesLabel')}
            </h2>
            <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {article.relatedArticles.map((r) => (
                <ArticleCard key={r._id} article={r} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
