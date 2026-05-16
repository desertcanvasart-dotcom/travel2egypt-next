import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import {
  buildTouristTripSchema,
  buildBreadcrumbList,
} from '@/lib/structured-data';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import {
  tourBySlugQuery,
  allTourSlugsQuery,
  siteSettingsQuery,
} from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import { GuideRefCard, type GuideRefCardData } from '@/components/GuideRefCard';
import { ItineraryDays } from '@/components/ItineraryDays';
import { Gallery } from '@/components/Gallery';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const pkg = await client.fetch(tourBySlugQuery(locale as Locale), { slug });
  if (!pkg) return {};
  return buildMetadata(pkg, {
    locale: locale as Locale,
    path: `/packages/${slug}`,
    pathByLocale: pathByLocaleFromSlugs(
      pkg.allSlugs,
      (s: string) => `/packages/${s}`
    ),
  });
}

export async function generateStaticParams() {
  const tours: Array<{
    type: string;
    slugs: Array<{ _key: string; current: string }>;
  }> = await client.fetch(allTourSlugsQuery);

  const params: Array<{ locale: string; slug: string }> = [];
  for (const tour of tours) {
    if (tour.type !== 'package') continue;
    const enSlug = tour.slugs?.find((s) => s._key === 'en')?.current;
    if (!enSlug) continue;
    for (const locale of routing.locales) {
      const localizedSlug =
        tour.slugs.find((s) => s._key === locale)?.current ?? enSlug;
      params.push({ locale, slug: localizedSlug });
    }
  }
  return params;
}

export default async function PackagePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('package');
  const [pkg, siteSettings] = await Promise.all([
    client.fetch(tourBySlugQuery(locale as Locale), { slug }),
    client.fetch(siteSettingsQuery(locale as Locale)),
  ]);

  if (!pkg || pkg.type !== 'package') {
    notFound();
  }

  const heroUrl = pkg.heroImage?.asset
    ? urlFor(pkg.heroImage).width(2400).height(1200).quality(85).url()
    : null;

  const whatsappNumber: string | undefined = siteSettings?.contact?.whatsapp;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
        `Hi — I'd like to ask about "${pkg.title}"`
      )}`
    : null;

  const cityList = (pkg.cities ?? []).map((c: { name: string }) => c.name);

  const guideRefs: GuideRefCardData[] = [
    ...((pkg.relatedGuides ?? []) as GuideRefCardData[]),
    ...((pkg.relatedGuideArticles ?? []) as GuideRefCardData[]),
  ].filter(
    (item, idx, arr) => arr.findIndex((other) => other._id === item._id) === idx
  );

  const tripSchema = buildTouristTripSchema(
    {
      title: pkg.title,
      slug,
      type: 'package',
      summary: pkg.summary,
      durationDays: pkg.durationDays,
      durationLabel: pkg.durationLabel,
      priceIndication: pkg.priceIndication,
      heroImage: pkg.heroImage,
      cities: pkg.cities,
    },
    locale as Locale
  );
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: 'Home', path: '/' },
      { name: 'Packages', path: '/packages' },
      { name: pkg.title, path: `/packages/${slug}` },
    ],
    locale as Locale
  );

  return (
    <article>
      <JsonLd data={[tripSchema, breadcrumbSchema]} />
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-cream-deep">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={pkg.heroImage?.alt || pkg.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1408]/25 via-[#1f1408]/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1f1408]/42 via-[#1f1408]/15 to-transparent pt-32">
          <div className="mx-auto max-w-7xl px-6 pb-12">
            <p className="mb-3 flex flex-wrap items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-soft">
              {pkg.durationLabel && <span>{pkg.durationLabel}</span>}
              {pkg.theme?.name && (
                <>
                  <span className="opacity-60">·</span>
                  <span>{pkg.theme.name}</span>
                </>
              )}
              {cityList.length > 0 && (
                <>
                  <span className="opacity-60">·</span>
                  <span className="text-paper/80">{cityList.join(' · ')}</span>
                </>
              )}
            </p>
            <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[1.05] text-paper drop-shadow-[0_2px_8px_rgba(31,20,8,0.45)] md:text-6xl">
              {pkg.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_340px]">
          {/* Main column */}
          <div>
            {pkg.summary && (
              <p className="mb-12 font-serif text-2xl italic leading-relaxed text-ink-soft">
                {pkg.summary}
              </p>
            )}

            {pkg.body && (
              <div className="prose-editorial max-w-none">
                <Body value={pkg.body} locale={locale as Locale} />
              </div>
            )}

            {/* Highlights */}
            {pkg.highlights && pkg.highlights.length > 0 && (
              <section className="mt-16 border-t border-line pt-12">
                <h2 className="mb-6 font-serif text-3xl font-medium text-ink">
                  {t('highlightsLabel')}
                </h2>
                <ul className="space-y-3 text-ink-soft">
                  {pkg.highlights.map((h: string, i: number) => (
                    <li key={i} className="flex gap-3 leading-relaxed">
                      <span
                        aria-hidden
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-deep"
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Inclusions / Exclusions */}
            {(pkg.inclusions || pkg.exclusions) && (
              <section className="mt-16 grid gap-10 border-t border-line pt-12 sm:grid-cols-2">
                {pkg.inclusions && (
                  <div>
                    <h2 className="mb-4 font-serif text-2xl font-medium text-ink">
                      {t('inclusionsLabel')}
                    </h2>
                    <div className="prose-editorial max-w-none text-ink-soft">
                      <Body value={pkg.inclusions} locale={locale as Locale} />
                    </div>
                  </div>
                )}
                {pkg.exclusions && (
                  <div>
                    <h2 className="mb-4 font-serif text-2xl font-medium text-ink">
                      {t('exclusionsLabel')}
                    </h2>
                    <div className="prose-editorial max-w-none text-ink-soft">
                      <Body value={pkg.exclusions} locale={locale as Locale} />
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Day-by-day itinerary (structured days[]) */}
            {pkg.days && pkg.days.length > 0 && (
              <ItineraryDays
                days={pkg.days}
                locale={locale as Locale}
                labels={{
                  itinerary: t('itineraryLabel'),
                  day: (n) => t('dayLabel', { n }),
                  meals: t('mealsLabel'),
                  stay: t('stayLabel'),
                  transport: t('transportLabel'),
                  pace: t('paceLabel'),
                  suggested: t('suggestedActivitiesLabel'),
                  photoSpots: t('photoSpotsLabel'),
                }}
              />
            )}

            {/* Gallery */}
            {pkg.gallery && pkg.gallery.length > 0 && (
              <Gallery images={pkg.gallery} title={t('galleryLabel')} />
            )}

            {/* Related packages */}
            {pkg.relatedTours && pkg.relatedTours.length > 0 && (
              <section className="mt-20 border-t border-line pt-16">
                <h2 className="mb-8 font-serif text-3xl font-medium text-ink">
                  {t('relatedPackagesLabel')}
                </h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
                  {pkg.relatedTours
                    .filter((r: { type?: string }) => r.type === 'package')
                    .map((related: PackageCardData) => (
                      <PackageCard key={related._id} pkg={related} />
                    ))}
                </div>
              </section>
            )}

            {/* Related guide content */}
            {guideRefs.length > 0 && (
              <section className="mt-20 border-t border-line pt-16">
                <h2 className="mb-8 font-serif text-3xl font-medium text-ink">
                  {t('relatedGuidesLabel')}
                </h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {guideRefs.slice(0, 6).map((g) => (
                    <GuideRefCard key={g._id} item={g} />
                  ))}
                </div>
              </section>
            )}

            {/* Traveler stories */}
            {pkg.relatedTravelerStories && pkg.relatedTravelerStories.length > 0 && (
              <section className="mt-20 border-t border-line pt-16">
                <h2 className="mb-8 font-serif text-3xl font-medium text-ink">
                  {t('travelerStoriesLabel')}
                </h2>
                <div className="space-y-8">
                  {pkg.relatedTravelerStories.map(
                    (story: {
                      _id: string;
                      excerpt?: string;
                      authorName?: string;
                      authorOrigin?: string;
                    }) => (
                      <figure
                        key={story._id}
                        className="border-l-2 border-orange pl-6"
                      >
                        {story.excerpt && (
                          <blockquote className="mb-3 font-serif text-xl italic leading-relaxed text-ink-soft">
                            “{story.excerpt}”
                          </blockquote>
                        )}
                        <figcaption className="font-sans text-xs uppercase tracking-wider text-ink-muted">
                          {story.authorName}
                          {story.authorOrigin ? ` · ${story.authorOrigin}` : ''}
                        </figcaption>
                      </figure>
                    )
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-line bg-cream-warm p-6">
              <dl className="space-y-4 text-sm">
                {pkg.durationLabel && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('durationLabel')}
                    </dt>
                    <dd className="text-ink-soft">{pkg.durationLabel}</dd>
                  </div>
                )}
                {pkg.theme?.name && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('themeLabel')}
                    </dt>
                    <dd className="text-ink-soft">
                      <Link
                        href={`/packages?theme=${pkg.theme.slug ?? ''}`}
                        className="underline decoration-orange-pale underline-offset-2 hover:text-ink"
                      >
                        {pkg.theme.name}
                      </Link>
                    </dd>
                  </div>
                )}
                {cityList.length > 0 && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('citiesLabel')}
                    </dt>
                    <dd className="text-ink-soft">{cityList.join(', ')}</dd>
                  </div>
                )}
                {pkg.priceIndication && (
                  <div className="border-t border-line pt-4">
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('priceIndicationLabel')}
                    </dt>
                    <dd className="font-serif text-base italic leading-relaxed text-ink">
                      {pkg.priceIndication}
                    </dd>
                    <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                      {t('priceCaveat')}
                    </p>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/contact"
                className="block w-full rounded-full bg-orange px-6 py-3.5 text-center text-sm font-medium text-paper transition-colors hover:bg-orange-deep"
              >
                {t('talkToConcierge')}
              </Link>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-full border border-ink px-6 py-3.5 text-center text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  {t('whatsappInquiry')}
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
