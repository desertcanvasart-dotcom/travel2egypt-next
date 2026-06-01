import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  categoryBySlugQuery,
  categoryLeavesByParentIdQuery,
  articlesByCategorySlugQuery,
  allCategorySlugsQuery,
} from '@/sanity/lib/queries';
import { ArticleCard, type ArticleCardData } from '@/components/ArticleCard';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { buildBreadcrumbList } from '@/lib/structured-data';
import {
  buildBlogTrail,
  toVisibleCrumbs,
  toSchemaCrumbs,
} from '@/lib/blog-breadcrumb';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

interface CategoryDoc {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  heroImage?: any;
  seo?: any;
  parent: { _id: string; name: string; slug: string } | null;
}

interface LeafSummary {
  _id: string;
  name: string;
  slug: string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const cat = await client.fetch<CategoryDoc | null>(
    categoryBySlugQuery(locale as Locale),
    { slug }
  );
  if (!cat) return {};
  return buildMetadata(
    { title: cat.name, summary: cat.description, heroImage: cat.heroImage, seo: cat.seo },
    { locale: locale as Locale, path: `/blog/category/${slug}` }
  );
}

export async function generateStaticParams() {
  // Emits both root slugs (planning, destination) and all 21 leaf slugs.
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
  const tNav = await getTranslations('nav');

  const category = await client.fetch<CategoryDoc | null>(
    categoryBySlugQuery(locale as Locale),
    { slug }
  );
  if (!category) notFound();

  const isRoot = !category.parent;

  // Home › Journal › Section [› Subcategory] — the category itself is the
  // current page. Same builder as the article route, so trails stay aligned.
  const trail = buildBlogTrail({
    homeLabel: tNav('home'),
    journalLabel: tNav('blog'),
    category: {
      name: category.name,
      slug: category.slug,
      parent: category.parent
        ? { name: category.parent.name, slug: category.parent.slug }
        : null,
    },
  });
  const breadcrumbItems = toVisibleCrumbs(trail);
  const breadcrumbSchema = buildBreadcrumbList(toSchemaCrumbs(trail), locale as Locale);

  // Fetch leaves only when on a root page; articles always.
  const [leaves, articles] = await Promise.all([
    isRoot
      ? client.fetch<LeafSummary[]>(categoryLeavesByParentIdQuery(locale as Locale), {
          parentId: category._id,
        })
      : Promise.resolve<LeafSummary[]>([]),
    client.fetch<ArticleCardData[]>(articlesByCategorySlugQuery, { locale, slug }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <JsonLd data={[breadcrumbSchema]} />
      <Breadcrumb items={breadcrumbItems} className="mb-8" />
      <header className="mb-12 max-w-3xl">
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

      {/* Secondary filter bar — only on root bucket pages */}
      {isRoot && leaves.length > 0 && (
        <nav
          aria-label={t('categoryLabel')}
          className="mb-12 flex flex-wrap gap-x-6 gap-y-3 border-y border-rule py-4"
        >
          {leaves.map((leaf) => (
            <Link
              key={leaf._id}
              href={`/blog/category/${leaf.slug}`}
              className="font-serif text-base italic text-night-soft transition-colors hover:text-faience"
            >
              {leaf.name}
            </Link>
          ))}
        </nav>
      )}

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
