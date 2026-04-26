import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { cityBySlugQuery, allCitySlugsQuery } from '@/sanity/lib/queries';
import { Body } from '@/components/Body';

interface Props {
  params: Promise<{ locale: string; citySlug: string }>;
}

/**
 * Static params — emit one entry per (locale, citySlug) so all variants
 * get pre-rendered at build time. The localized slug is read from the
 * city's slug array; if a locale doesn't have its own slug, the EN slug
 * is used (which next-intl handles via fallback at the route layer).
 */
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

  return (
    <article>
      {/* Hero */}
      {heroUrl && (
        <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-cream-deep">
          <Image
            src={heroUrl}
            alt={city.heroImage?.alt || city.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-7xl px-6 pb-12">
              <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-soft">
                {city.region?.replace(/-/g, ' ')}
              </p>
              <h1 className="font-serif text-6xl font-medium leading-none text-paper md:text-7xl">
                {city.name}
              </h1>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div>
            {/* Summary */}
            <p className="mb-12 font-serif text-2xl italic leading-relaxed text-ink-soft">
              {city.summary}
            </p>

            {/* Body */}
            {city.overview && (
              <div className="prose-editorial max-w-none">
                <Body value={city.overview} locale={locale as Locale} />
              </div>
            )}

            {/* Sub-articles */}
            {city.subArticles && city.subArticles.length > 0 && (
              <section className="mt-20 border-t border-line pt-16">
                <h2 className="mb-8 font-serif text-3xl font-medium text-ink">
                  {t('subArticlesLabel')}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {city.subArticles.map((sub: any) => (
                    <Link
                      key={sub._id}
                      href={`/guide/${citySlug}/${sub.slug}`}
                      className="group block rounded-lg border border-line bg-paper p-6 transition-shadow hover:shadow-soft"
                    >
                      <h3 className="mb-2 font-serif text-xl text-ink group-hover:text-orange-deep">
                        {sub.title}
                      </h3>
                      {sub.summary && (
                        <p className="text-sm text-ink-soft">{sub.summary}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related tours */}
            {city.relatedTours && city.relatedTours.length > 0 && (
              <section className="mt-20 border-t border-line pt-16">
                <h2 className="mb-8 font-serif text-3xl font-medium text-ink">
                  {t('relatedToursLabel')}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {city.relatedTours.map((tour: any) => {
                    const tourImageUrl = tour.heroImage?.asset
                      ? urlFor(tour.heroImage).width(700).height(450).quality(80).url()
                      : null;
                    const isPackage = tour.type === 'package';
                    return (
                      <Link
                        key={tour._id}
                        href={
                          isPackage
                            ? { pathname: '/packages/[slug]', params: { slug: tour.slug } }
                            : { pathname: '/tours/[slug]', params: { slug: tour.slug } }
                        }
                        className="group block"
                      >
                        {tourImageUrl && (
                          <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-cream-deep">
                            <Image
                              src={tourImageUrl}
                              alt={tour.heroImage?.alt || tour.title}
                              width={700}
                              height={450}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </div>
                        )}
                        <p className="mb-1 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-orange-deep">
                          {tour.durationLabel || `${tour.durationDays} days`}
                        </p>
                        <h3 className="mb-1 font-serif text-xl text-ink group-hover:text-orange-deep">
                          {tour.title}
                        </h3>
                        {tour.summary && (
                          <p className="text-sm text-ink-soft">{tour.summary}</p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar — key facts */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {city.keyFacts && (
              <div className="rounded-lg border border-line bg-cream-warm p-6">
                <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  {t('subArticlesLabel') === 'In this guide' ? 'Key facts' : ''}
                </h3>
                <dl className="space-y-4 text-sm">
                  {city.keyFacts.bestSeason && (
                    <div>
                      <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        {t('keyFacts.bestSeason')}
                      </dt>
                      <dd className="text-ink-soft">{city.keyFacts.bestSeason}</dd>
                    </div>
                  )}
                  {city.keyFacts.gettingThere && (
                    <div>
                      <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        {t('keyFacts.gettingThere')}
                      </dt>
                      <dd className="text-ink-soft">{city.keyFacts.gettingThere}</dd>
                    </div>
                  )}
                  {city.keyFacts.daysNeeded && (
                    <div>
                      <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        {t('keyFacts.daysNeeded')}
                      </dt>
                      <dd className="text-ink-soft">{city.keyFacts.daysNeeded}</dd>
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
