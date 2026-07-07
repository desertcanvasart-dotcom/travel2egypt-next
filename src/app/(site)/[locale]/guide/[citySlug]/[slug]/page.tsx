import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import '@/styles/climate-signature.css';
import '@/styles/price-manifest.css';
import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import ClimateSignature from '@/components/climate/ClimateSignature';
import { climateData } from '@/data/climate';
import PriceManifest from '@/components/prices/PriceManifest';
import { splitPriceRegion } from '@/components/prices/splitPriceRegion';
import { priceData } from '@/data/prices';
import {
  buildBreadcrumbList,
  buildGuideArticleSchema,
} from '@/lib/structured-data';

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

  // Weather-page hero: the climate signature. Gated on the structural
  // `kind === 'climate'` discriminator AND an existing per-city data entry
  // AND locale === 'en' (ES/JA keep their current hero until the localized
  // editorial batch lands). A city with no data entry falls through to the
  // existing photo-hero branch unchanged; non-weather articles never match.
  const climate =
    article.kind === 'climate' && locale === 'en'
      ? climateData[citySlug]
      : undefined;

  const sectionLabel = article.section
    ? tSections(SECTION_LABEL_KEYS[article.section] ?? 'others')
    : null;

  // Resolve region label for the parent city (used in the breadcrumb trail).
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const tRegions = await getTranslations({ locale, namespace: 'regions' });
  const cityRegion = article.parentCity?.region as string | undefined;
  const regionLabel = cityRegion && tRegions.has(cityRegion as any)
    ? tRegions(cityRegion as any)
    : null;

  const breadcrumbItems = [
    { label: tNav('home'), href: '/' },
    { label: tNav('guide'), href: '/guide' },
    ...(regionLabel && cityRegion
      ? [{ label: regionLabel, href: `/guide#${cityRegion}` }]
      : []),
    { label: article.parentCity.name, href: `/guide/${citySlug}` },
    ...(sectionLabel ? [{ label: sectionLabel }] : []),
    { label: article.title },
  ];
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: tNav('guide'), path: '/guide' },
      ...(regionLabel && cityRegion
        ? [{ name: regionLabel, path: `/guide#${cityRegion}` }]
        : []),
      { name: article.parentCity.name, path: `/guide/${citySlug}` },
      ...(sectionLabel
        ? [{ name: sectionLabel, path: `/guide/${citySlug}` }]
        : []),
      { name: article.title, path: `/guide/${citySlug}/${slug}` },
    ],
    locale as Locale
  );

  // `kind === 'attraction'` flips this to TouristAttraction with geo +
  // containedInPlace; every other kind emits Article. The discriminator
  // is set in Studio per the guideArticle schema.
  const guideArticleSchema = buildGuideArticleSchema(
    {
      kind: article.kind,
      title: article.title,
      slug,
      citySlug,
      parentCityName: article.parentCity.name,
      summary: article.summary,
      heroImage: article.heroImage,
      coordinates: article.coordinates,
      monumentType: article.monumentType,
      preciseLocation: article.preciseLocation,
    },
    locale as Locale,
  );

  return (
    <article>
      <JsonLd data={[guideArticleSchema, breadcrumbSchema]} />

      <div className="mx-auto max-w-7xl px-6 py-12">
        <Breadcrumb items={breadcrumbItems} className="mb-8" />

        {/* Weather pages (EN): climate signature. Otherwise the photo hero. */}
        {climate ? (
          <div className="mb-10">
            <ClimateSignature
              title={article.title}
              cityName={article.parentCity.name}
              record={climate}
              copy={{ ...climate.editorial.en, rainLabel: 'RAIN DAYS' }}
              locale={locale}
            />
          </div>
        ) : (
          heroUrl && (
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
          )
        )}

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
          <div>
            {/* Eyebrow: City · Region — each segment is a link. */}
            <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
              <Link href={`/guide/${citySlug}`} className="hover:text-ink">
                {article.parentCity.name}
              </Link>
              {regionLabel && cityRegion && (
                <>
                  <span aria-hidden className="mx-2">·</span>
                  <Link href={`/guide#${cityRegion}`} className="hover:text-ink">
                    {regionLabel}
                  </Link>
                </>
              )}
            </p>
            <h1 className="mb-6 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
              {article.title}
            </h1>
            {article.summary && (
              <p className="mb-10 font-serif text-2xl italic leading-relaxed text-ink-soft">
                {article.summary}
              </p>
            )}
            {(() => {
              // Ticket-price pages (verified data present): suppress the
              // legacy flattened price bullets at RENDER time and put the
              // PriceManifest in their place. No Sanity content is touched;
              // pages without a priceData entry render exactly as before.
              // Locale gate: 'en' for legacy pages (ES/JA keep bullets until
              // their batch); 'all' for pages created for the manifest.
              const candidate = priceData[article._id];
              const pricePage =
                candidate &&
                (candidate.localeGate === 'all' || locale === 'en')
                  ? candidate
                  : undefined;
              const split =
                pricePage && article.body
                  ? splitPriceRegion(article.body)
                  : null;
              if (pricePage && split?.found) {
                return (
                  <div className="prose-editorial max-w-none">
                    <Body value={split.before} locale={locale as Locale} />
                    <PriceManifest page={pricePage} />
                    <Body value={split.after} locale={locale as Locale} />
                  </div>
                );
              }
              if (pricePage) {
                // No legacy bullet region (a page created for the manifest,
                // or a locale whose body lacks the bullets): body first if
                // any, manifest after.
                return (
                  <div className="prose-editorial max-w-none">
                    {article.body && (
                      <Body value={article.body} locale={locale as Locale} />
                    )}
                    <PriceManifest page={pricePage} />
                  </div>
                );
              }
              return article.body ? (
                <div className="prose-editorial max-w-none">
                  <Body value={article.body} locale={locale as Locale} />
                </div>
              ) : null;
            })()}
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
