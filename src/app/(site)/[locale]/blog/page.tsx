import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  articlesByLanguageQuery,
  allCategoriesQuery,
} from '@/sanity/lib/queries';
import { ArticleCard, type ArticleCardData } from '@/components/ArticleCard';
import { buildStaticMetadata } from '@/lib/seo';

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
  const [articles, categories] = await Promise.all([
    client.fetch<ArticleCardData[]>(articlesByLanguageQuery, { locale }),
    client.fetch<Array<{ _id: string; name: string; slug: string }>>(
      allCategoriesQuery(locale as Locale)
    ),
  ]);

  const lead = articles[0];
  const rest = articles.slice(1);

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

      {categories.length > 0 && (
        <nav
          aria-label={t('categoryLabel')}
          className="mb-12 flex flex-wrap gap-2 border-y border-line py-4"
        >
          <Link
            href="/blog"
            className="rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper"
          >
            {t('allCategories')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/blog/category/${cat.slug}`}
              className="rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      )}

      {articles.length === 0 ? (
        <p className="mt-12 font-serif text-lg italic text-ink-muted">
          {t('noArticlesYet')}
        </p>
      ) : (
        <div className="space-y-16">
          {lead && (
            <ArticleCard article={lead} variant="lead" locale={locale} />
          )}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-x-10 gap-y-14 border-t border-line pt-12 md:grid-cols-2 lg:grid-cols-3">
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
