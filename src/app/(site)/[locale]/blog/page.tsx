import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  articlesByLanguageQuery,
  allCategoriesQuery,
  featuredLeadArticleQuery,
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
  const [articles, categories, lead] = await Promise.all([
    client.fetch<ArticleCardData[]>(articlesByLanguageQuery, { locale }),
    client.fetch<Array<{ _id: string; name: string; slug: string }>>(
      allCategoriesQuery(locale as Locale)
    ),
    client.fetch<ArticleCardData | null>(featuredLeadArticleQuery, { locale }),
  ]);

  // Filter the lead out of the rest grid to avoid duplication.
  const rest = articles.filter((a) => a._id !== lead?._id);

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <header className="mb-16 max-w-3xl">
        <h1 className="mb-6 font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-night">
          {t('landingTitle')}
        </h1>
        <p className="font-serif text-[clamp(1.25rem,2vw,1.5rem)] italic leading-[1.45] text-night-soft">
          {t('landingDeck')}
        </p>
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
