import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import type { Locale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  categoryBySlugQuery,
  articlesByCategorySlugQuery,
  allCategorySlugsQuery,
} from '@/sanity/lib/queries';
import { ArticleCard, type ArticleCardData } from '@/components/ArticleCard';
import { buildMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const cat = await client.fetch(categoryBySlugQuery(locale as Locale), { slug });
  if (!cat) return {};
  return buildMetadata(
    { title: cat.name, summary: cat.description, heroImage: cat.heroImage, seo: cat.seo },
    { locale: locale as Locale, path: `/blog/category/${slug}` }
  );
}

export async function generateStaticParams() {
  const all: Array<{ slugs: Array<{ _key: string; current: string }> }> =
    await client.fetch(allCategorySlugsQuery);
  const params: Array<{ locale: string; slug: string }> = [];
  for (const c of all) {
    const enSlug = c.slugs?.find((s) => s._key === 'en')?.current;
    if (!enSlug) continue;
    for (const locale of routing.locales) {
      params.push({
        locale,
        slug: c.slugs.find((s) => s._key === locale)?.current ?? enSlug,
      });
    }
  }
  return params;
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('blog');
  const [category, articles] = await Promise.all([
    client.fetch<{
      _id: string;
      name: string;
      description?: string;
    } | null>(categoryBySlugQuery(locale as Locale), { slug }),
    client.fetch<ArticleCardData[]>(articlesByCategorySlugQuery, { locale, slug }),
  ]);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-16 max-w-3xl">
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
          {t('categoryLabel')}
        </p>
        <h1 className="mb-4 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="font-serif text-xl italic leading-relaxed text-ink-soft">
            {category.description}
          </p>
        )}
      </header>

      {articles.length === 0 ? (
        <p className="mt-12 font-serif text-lg italic text-ink-muted">
          {t('noArticlesYet')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article._id} article={article} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
