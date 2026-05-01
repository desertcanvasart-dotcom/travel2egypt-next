import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import {
  buildPlaceSchema,
  buildBreadcrumbList,
} from '@/lib/structured-data';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { cityBySlugQuery, allCitySlugsQuery } from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { CityGuideSidebar } from '@/components/CityGuideSidebar';

interface Props {
  params: Promise<{ locale: string; citySlug: string }>;
}

/**
 * Static params — emit one entry per (locale, citySlug) so all variants
 * get pre-rendered at build time. The localized slug is read from the
 * city's slug array; if a locale doesn't have its own slug, the EN slug
 * is used (which next-intl handles via fallback at the route layer).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, citySlug } = await params;
  const city = await client.fetch(cityBySlugQuery(locale as Locale), {
    slug: citySlug,
  });
  if (!city) return {};
  // City schema uses `name` instead of `title`; normalize for the shared builder.
  return buildMetadata(
    { ...city, title: city.name },
    {
      locale: locale as Locale,
      path: `/guide/${citySlug}`,
      pathByLocale: pathByLocaleFromSlugs(
        city.allSlugs,
        (s: string) => `/guide/${s}`
      ),
    }
  );
}

export async function generateStaticParams() {
  const cities: Array<{ slugs: Array<{ _key: string; current: string }> }> =
    await client.fetch(allCitySlugsQuery);

  const params: Array<{ locale: string; citySlug: string }> = [];
  for (const city of cities) {
    const enSlug = city.slugs?.find((s) => s._key === 'en')?.current;
    if (!enSlug) continue;

    for (const locale of routing.locales) {
      const localizedSlug =
        city.slugs.find((s) => s._key === locale)?.current ?? enSlug;
      params.push({ locale, citySlug: localizedSlug });
    }
  }
  return params;
}

export default async function CityGuidePage({ params }: Props) {
  const { locale, citySlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('guide');

  const city = await client.fetch(cityBySlugQuery(locale as Locale), {
    slug: citySlug,
  });

  if (!city) {
    notFound();
  }

  const heroUrl = city.heroImage?.asset
    ? urlFor(city.heroImage).width(2000).height(1000).quality(85).url()
    : null;

  // Hide the Key Facts card entirely when no field has content. Per session
  // 5 carryover: an empty card with just the heading reads as a layout
  // mistake, not as restraint.
  const keyFacts = city.keyFacts ?? null;
  const hasKeyFacts =
    !!keyFacts &&
    (keyFacts.bestSeason || keyFacts.gettingThere || keyFacts.daysNeeded);

  const regionLabel = (city.region as string | undefined)?.replace(/-/g, ' ');

  const placeSchema = buildPlaceSchema(
    {
      name: city.name,
      slug: citySlug,
      summary: city.summary,
      heroImage: city.heroImage,
      coordinates: city.coordinates,
      type: 'city',
    },
    locale as Locale
  );
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: 'Home', path: '/' },
      { name: 'Travel guide', path: '/guide' },
      { name: city.name, path: `/guide/${citySlug}` },
    ],
    locale as Locale
  );

  return (
    <article>
      <JsonLd data={[placeSchema, breadcrumbSchema]} />
      {heroUrl ? (
        // With-hero variant: full-bleed image + overlay gradient + bottom-aligned title.
        <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-limestone-deep">
          <Image
            src={heroUrl}
            alt={city.heroImage?.alt || city.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/65 via-night/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-7xl px-6 pb-12">
              {regionLabel && (
                <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand">
                  {regionLabel}
                </p>
              )}
              <h1 className="font-serif text-6xl font-normal leading-[1.05] text-paper md:text-7xl">
                {city.name}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        // No-hero variant: large editorial title block on paper. Reads as
        // deliberate restraint, not as a missing image. Per Phase 2.6.
        <header className="border-b border-rule">
          <div className="mx-auto max-w-7xl px-6 pb-16 pt-24 md:pt-32">
            {regionLabel && (
              <p className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.18em] text-night-soft">
                {regionLabel}
              </p>
            )}
            <h1 className="max-w-[18ch] font-serif text-[clamp(2.5rem,6vw,5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-night">
              {city.name}
            </h1>
          </div>
        </header>
      )}

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div>
            {/* Summary / lede */}
            <p className="mb-12 font-serif text-2xl italic leading-snug text-night-soft md:text-[1.625rem]">
              {city.summary}
            </p>

            {/* Body */}
            {city.overview && (
              <div className="prose-editorial max-w-none">
                <Body value={city.overview} locale={locale as Locale} />
              </div>
            )}

            {/* Related tours */}
            {city.relatedTours && city.relatedTours.length > 0 && (
              <section className="mt-20 border-t border-rule-strong pt-12">
                <h2 className="mb-10 font-serif text-3xl font-normal tracking-[-0.01em] text-night">
                  {t('relatedToursLabel')}
                </h2>
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
                  {city.relatedTours.map((tour: any) => {
                    const tourImageUrl = tour.heroImage?.asset
                      ? urlFor(tour.heroImage).width(800).height(1000).quality(82).url()
                      : null;
                    const isPackage = tour.type === 'package';
                    return (
                      <Link
                        key={tour._id}
                        href={
                          isPackage
                            ? `/packages/${tour.slug}`
                            : `/tours/${tour.slug}`
                        }
                        className="group block transition-transform duration-500 hover:-translate-y-0.5"
                      >
                        <div className="mb-5 aspect-[4/5] overflow-hidden bg-limestone-deep">
                          {tourImageUrl && (
                            <Image
                              src={tourImageUrl}
                              alt={tour.heroImage?.alt || tour.title}
                              width={800}
                              height={1000}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                          )}
                        </div>
                        <p className="mb-2 font-sans text-xs font-medium uppercase tracking-[0.12em] text-night-soft">
                          {tour.durationLabel || `${tour.durationDays} days`}
                        </p>
                        <h3 className="mb-2 font-serif text-2xl font-medium leading-tight text-night transition-colors group-hover:text-faience">
                          {tour.title}
                        </h3>
                        {tour.summary && (
                          <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-night-soft">
                            {tour.summary}
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar — guide nav + key facts (two distinct widgets). */}
          <aside className="space-y-12 lg:sticky lg:top-24 lg:self-start">
            <CityGuideSidebar
              citySlug={citySlug}
              cityName={city.name}
              subArticles={city.subArticles}
              placesToGo={city.placesToGo}
            />
            {hasKeyFacts && (
              <div className="border-t border-rule-strong pt-6">
                <h3 className="mb-5 font-sans text-xs font-medium uppercase tracking-[0.16em] text-night-soft">
                  {t('keyFactsTitle')}
                </h3>
                <dl className="space-y-5 text-[0.9375rem]">
                  {keyFacts!.bestSeason && (
                    <div>
                      <dt className="mb-1 font-serif text-sm italic text-faience">
                        {t('keyFacts.bestSeason')}
                      </dt>
                      <dd className="text-night-soft">{keyFacts!.bestSeason}</dd>
                    </div>
                  )}
                  {keyFacts!.gettingThere && (
                    <div>
                      <dt className="mb-1 font-serif text-sm italic text-faience">
                        {t('keyFacts.gettingThere')}
                      </dt>
                      <dd className="text-night-soft">{keyFacts!.gettingThere}</dd>
                    </div>
                  )}
                  {keyFacts!.daysNeeded && (
                    <div>
                      <dt className="mb-1 font-serif text-sm italic text-faience">
                        {t('keyFacts.daysNeeded')}
                      </dt>
                      <dd className="text-night-soft">{keyFacts!.daysNeeded}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </aside>
        </div>
      </div>
    </article>
  );
}
