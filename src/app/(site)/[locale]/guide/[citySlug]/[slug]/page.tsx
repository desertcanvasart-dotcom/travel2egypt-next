import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/structured-data';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import {
  guideArticleBySlugQuery,
  allGuideArticleSlugsQuery,
} from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { CityGuideSidebar } from '@/components/CityGuideSidebar';

interface Props {
  params: Promise<{ locale: string; citySlug: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, citySlug, slug } = await params;
  const article = await client.fetch(guideArticleBySlugQuery(locale as Locale), {
    citySlug,
    slug,
  });
  if (!article) return {};
  return buildMetadata(article, {
    locale: locale as Locale,
    path: `/guide/${citySlug}/${slug}`,
    pathByLocale: pathByLocaleFromSlugs(
      article.allSlugs,
      (s: string) => `/guide/${citySlug}/${s}`
    ),
  });
}

export async function generateStaticParams() {
  const articles: Array<{
    slugs: Array<{ _key: string; current: string }>;
    parentCitySlugs: Array<{ _key: string; current: string }> | null;
  }> = await client.fetch(allGuideArticleSlugsQuery);

  const params: Array<{ locale: string; citySlug: string; slug: string }> = [];
  for (const article of articles) {
    const enSlug = article.slugs?.find((s) => s._key === 'en')?.current;
    const enCitySlug = article.parentCitySlugs?.find((s) => s._key === 'en')
      ?.current;
    if (!enSlug || !enCitySlug) continue;

    for (const locale of routing.locales) {
      const localizedSlug =
        article.slugs.find((s) => s._key === locale)?.current ?? enSlug;
      const localizedCitySlug =
        article.parentCitySlugs?.find((s) => s._key === locale)?.current ??
        enCitySlug;
      params.push({
        locale,
        citySlug: localizedCitySlug,
        slug: localizedSlug,
      });
    }
  }
  return params;
}

const SECTION_LABEL_KEYS: Record<string, string> = {
  introducing: 'introducing',
  'plan-your-trip': 'plan-your-trip',
  'while-you-are-there': 'while-you-are-there',
  'places-to-go': 'places-to-go',
  others: 'others',
};

export default async function GuideArticlePage({ params }: Props) {
  const { locale, citySlug, slug } = await params;
  setRequestLocale(locale);

  const tSections = await getTranslations('guideSections');

  const article = await client.fetch(guideArticleBySlugQuery(locale as Locale), {
    citySlug,
    slug,
  });

  if (!article || !article.parentCity) {
    notFound();
  }

  const heroUrl = article.heroImage?.asset
    ? urlFor(article.heroImage).width(1800).height(900).quality(85).url()
    : null;

  const sectionLabel = article.section
    ? tSections(SECTION_LABEL_KEYS[article.section] ?? 'others')
    : null;

  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: 'Home', path: '/' },
      { name: 'Travel guide', path: '/guide' },
      { name: article.parentCity.name, path: `/guide/${citySlug}` },
      ...(sectionLabel
        ? [{ name: sectionLabel, path: `/guide/${citySlug}` }]
        : []),
      { name: article.title, path: `/guide/${citySlug}/${slug}` },
    ],
    locale as Locale
  );

  return (
    <article>
      <JsonLd data={[breadcrumbSchema]} />

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Breadcrumb */}
        <nav
          className="mb-8 font-sans text-xs uppercase tracking-[0.12em] text-ink-muted"
          aria-label="Breadcrumb"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href={`/guide/${citySlug}`}
                className="transition-colors hover:text-orange-deep"
              >
                {article.parentCity.name}
              </Link>
            </li>
            {sectionLabel && (
              <>
                <li aria-hidden="true">›</li>
                <li>{sectionLabel}</li>
              </>
            )}
            <li aria-hidden="true">›</li>
            <li className="text-ink-soft">{article.title}</li>
          </ol>
        </nav>

        {heroUrl && (
          <div className="relative mb-10 aspect-[2/1] w-full overflow-hidden rounded-lg bg-cream-deep">
            <Image
              src={heroUrl}
              alt={article.heroImage?.alt || article.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1200px"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
          <div>
            <h1 className="mb-6 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
              {article.title}
            </h1>
            {article.summary && (
              <p className="mb-10 font-serif text-2xl italic leading-relaxed text-ink-soft">
                {article.summary}
              </p>
            )}
            {article.body && (
              <div className="prose-editorial max-w-none">
                <Body value={article.body} locale={locale as Locale} />
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CityGuideSidebar
              citySlug={citySlug}
              cityName={article.parentCity.name}
              subArticles={article.parentCity.subArticles}
              placesToGo={article.parentCity.placesToGo}
              activeArticleSlug={article.slug}
            />
          </aside>
        </div>
      </div>
    </article>
  );
}
