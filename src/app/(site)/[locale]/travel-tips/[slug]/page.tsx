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
  allTravelTipCategoriesQuery,
} from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { TravelTipCard, type TravelTipCardData } from '@/components/TravelTipCard';
import {
  TravelTipsSidebar,
  type TravelTipsSidebarCategory,
} from '@/components/TravelTipsSidebar';
import { SectionHeader } from '@/components/SectionHeader';
import { ConciergeCTA } from '@/components/ConciergeCTA';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import {
  buildArticleSchema,
  buildBreadcrumbList,
} from '@/lib/structured-data';

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
  featured?: boolean;
  category?: { _id?: string; name?: string; slug?: string } | null;
  relatedTips?: TravelTipCardData[];
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
    {
      title: tip.title,
      summary: tip.summary,
      heroImage: tip.heroImage,
      seo: tip.seo,
    },
    {
      locale: locale as Locale,
      path: `/travel-tips/${slug}`,
      pathByLocale: pathByLocaleFromSlugs(
        tip.allSlugs,
        (s: string) => `/travel-tips/${s}`
      ),
    }
  );
}

export async function generateStaticParams() {
  const tips: Array<{
    slugs: Array<{ _key: string; current: string }>;
  }> = await client.fetch(allTravelTipSlugsQuery);

  const params: Array<{ locale: string; slug: string }> = [];
  for (const tip of tips) {
    const enSlug = tip.slugs?.find((s) => s._key === 'en')?.current;
    if (!enSlug) continue;
    for (const locale of routing.locales) {
      const localizedSlug =
        tip.slugs.find((s) => s._key === locale)?.current ?? enSlug;
      params.push({ locale, slug: localizedSlug });
    }
  }
  return params;
}

export default async function TravelTipDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('travelTips');

  const [tip, categories] = await Promise.all([
    client.fetch(travelTipBySlugQuery(locale as Locale), { slug }) as Promise<
      TravelTipDoc | null
    >,
    client.fetch<TravelTipsSidebarCategory[]>(
      allTravelTipCategoriesQuery(locale as Locale)
    ),
  ]);

  if (!tip) notFound();

  const heroUrl = tip.heroImage?.asset
    ? urlFor(tip.heroImage).width(2000).height(1000).quality(85).url()
    : null;

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
      { name: 'Home', path: '/' },
      { name: t('landingTitle'), path: '/travel-tips' },
      ...(tip.category?.name && tip.category.slug
        ? [
            {
              name: tip.category.name,
              path: `/travel-tips#category-${tip.category.slug}`,
            },
          ]
        : []),
      { name: tip.title, path: `/travel-tips/${slug}` },
    ],
    locale as Locale
  );

  return (
    <article>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />

      {/* Hero */}
      {heroUrl && (
        <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden bg-limestone-deep">
          <Image
            src={heroUrl}
            alt={tip.heroImage?.alt || tip.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div>
            {/* Headline block */}
            <header className="mb-10">
              {tip.category?.name && tip.category.slug && (
                <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
                  <Link
                    href={`/travel-tips#category-${tip.category.slug}`}
                    className="hover:text-ink"
                  >
                    {tip.category.name}
                  </Link>
                </p>
              )}
              <h1 className="mb-6 font-serif text-4xl font-medium leading-[1.1] text-night md:text-5xl">
                {tip.title}
              </h1>
              {tip.summary && (
                <p className="font-serif text-2xl italic leading-relaxed text-night-soft">
                  {tip.summary}
                </p>
              )}
            </header>

            {/* Body */}
            {tip.body ? (
              <div className="prose-editorial max-w-none">
                <Body value={tip.body} locale={locale as Locale} />
              </div>
            ) : null}
          </div>

          {/* Sidebar — category navigation */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <TravelTipsSidebar
              categories={categories}
              currentCategorySlug={tip.category?.slug}
              locale={locale}
            />
          </aside>
        </div>

        {/* Related tips */}
        {tip.relatedTips && tip.relatedTips.length > 0 && (
          <section className="mt-20 border-t border-rule-strong pt-16">
            <SectionHeader num="i" title={<>{t('relatedTipsHeading')}</>} />
            <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {tip.relatedTips.map((rel) => (
                <TravelTipCard
                  key={rel._id}
                  tip={rel}
                  variant="default"
                  locale={locale}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <ConciergeCTA variant="full" />
    </article>
  );
}
