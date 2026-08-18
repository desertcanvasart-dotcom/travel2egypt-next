/**
 * Root catch-all router. Resolves a single-segment slug to a Sanity doc
 * across tourCategory / tourLanding / tour / article / wikiMonument and
 * dispatches to the matching renderer. Multi-segment paths fall through
 * to 404 — root-level resources are flat by design.
 *
 * Priority order on slug collision:
 *   tourCategory > tourLanding > tour > article > wikiMonument
 *
 * Verified zero collisions at s48 build time; the priority clause is
 * defensive against future editorial additions.
 */
import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';

import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import {
  slugLookupQuery,
  tourCategoryBySlugQuery,
  tourLandingBySlugQuery,
  tourBySlugQuery,
  siteSettingsQuery,
} from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList, buildItemListSchema } from '@/lib/structured-data';
import { TourPageView } from '@/components/TourPageView';
import { SingleTourView } from '@/components/tour-system/SingleTourView';
import { PackageView } from '@/components/tour-system/PackageView';
import { SubcategoryView } from '@/components/tour-system/SubcategoryView';
import { LandingFaq, type LandingFaqItem } from '@/components/tour-system/LandingFaq';
import { PackageSubcategoryView } from '@/components/tour-system/PackageSubcategoryView';
import { TourCloseRhythm } from '@/components/subcategory/TourCloseRhythm';

interface Props {
  params: Promise<{ locale: string; rest: string[] }>;
}

/**
 * Tiny resolver: takes the first path segment and looks it up. Returns
 * null for any multi-segment path (we only handle single-slug routes
 * here — nested URLs route through their own explicit Next.js segments).
 */
// Per-request fetch dedup. generateMetadata and the page body resolve the same
// slug and re-fetch the same doc; React cache() collapses each pair into one
// Sanity round-trip per request (the @sanity/client reads bypass Next's fetch
// cache, so this is what de-duplicates them).
const getHit = cache(
  (
    locale: Locale,
    slug: string,
  ): Promise<{ _id: string; _type: string } | null> =>
    client.fetch(slugLookupQuery(locale), { slug }),
);
const getTour = cache((locale: Locale, slug: string) =>
  client.fetch(tourBySlugQuery(locale), { slug }),
);
const getTourCategory = cache((locale: Locale, slug: string) =>
  client.fetch(tourCategoryBySlugQuery(locale), { slug }),
);
const getTourLanding = cache((locale: Locale, slug: string) =>
  client.fetch(tourLandingBySlugQuery(locale), { slug }),
);

async function resolveSlug(
  locale: Locale,
  rest: string[],
): Promise<{ _id: string; _type: string } | null> {
  if (rest.length !== 1) return null;
  return getHit(locale, rest[0]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, rest } = await params;
  const hit = await resolveSlug(locale as Locale, rest);
  if (!hit) return {};

  if (hit._type === 'tourCategory') {
    const doc = await getTourCategory(locale as Locale, rest[0]);
    if (!doc) return {};
    return buildMetadata(doc, {
      locale: locale as Locale,
      path: `/${rest[0]}`,
      ogType: 'website',
      pathByLocale: pathByLocaleFromSlugs(doc.allSlugs, (s: string) => `/${s}`),
    });
  }
  if (hit._type === 'tourLanding') {
    const doc = await getTourLanding(locale as Locale, rest[0]);
    if (!doc) return {};
    return buildMetadata(doc, {
      locale: locale as Locale,
      path: `/${rest[0]}`,
      ogType: 'website',
      pathByLocale: pathByLocaleFromSlugs(doc.allSlugs, (s: string) => `/${s}`),
    });
  }
  if (hit._type === 'tour') {
    const tour = await getTour(locale as Locale, rest[0]);
    if (!tour) return {};
    return buildMetadata(tour, {
      locale: locale as Locale,
      path: `/${rest[0]}`,
      pathByLocale: pathByLocaleFromSlugs(tour.allSlugs, (s: string) => `/${s}`),
    });
  }
  // article / wikiMonument still routed via their explicit handlers; they own metadata there.
  return {};
}

export default async function CatchAllPage({ params }: Props) {
  const { locale, rest } = await params;
  setRequestLocale(locale);

  const hit = await resolveSlug(locale as Locale, rest);
  if (!hit) notFound();

  // Tours render natively here (canonical URL is the root path) using the
  // shared TourPageView component, which is also used by the legacy
  // /tours/[slug] route — that route now redirects here.
  if (hit._type === 'tour') {
    const [tour, siteSettings] = await Promise.all([
      getTour(locale as Locale, rest[0]),
      client.fetch(siteSettingsQuery(locale as Locale)),
    ]);
    if (!tour) notFound();
    // Single day tours render in the reconciled journey-3 design; standard/private
    // packages render in the journey-pkg design. The group-package "departure
    // dates" variant is deferred — it keeps the legacy TourPageView for now.
    const tType = (tour as { type?: string; tourMode?: string }).type;
    const tMode = (tour as { tourMode?: string }).tourMode;
    if (tType === 'dayTour') {
      return <SingleTourView tour={tour as never} locale={locale as Locale} />;
    }
    if (tType === 'package' && (tMode === 'private' || tMode === 'group')) {
      // Private packages → journey-pkg; group packages → journey-pkg + the
      // scheduled-departures apparatus (PackageView detects mode internally).
      return <PackageView tour={tour as never} locale={locale as Locale} />;
    }
    return (
      <>
        <TourPageView tour={tour} locale={locale as Locale} slug={rest[0]} siteSettings={siteSettings} />
        <TourCloseRhythm tour={tour} locale={locale as Locale} />
      </>
    );
  }
  // Articles + wikiMonuments still live under their explicit named routes —
  // redirect from root preserves legacy WP URLs at a single 307 hop until
  // those renderers are extracted into shared components as well.
  if (hit._type === 'article') {
    redirect(`/blog/${rest[0]}`);
  }
  if (hit._type === 'wikiMonument') {
    redirect(`/wiki/monuments/${rest[0]}`);
  }

  // tourCategory + tourLanding render inline (their canonical URL IS the root path)
  if (hit._type === 'tourCategory') {
    const doc = await getTourCategory(locale as Locale, rest[0]);
    if (!doc) notFound();
    return <TourCategoryView doc={doc} locale={locale as Locale} />;
  }

  if (hit._type === 'tourLanding') {
    const doc = await getTourLanding(locale as Locale, rest[0]);
    if (!doc) notFound();
    // Day-tour landings (city × track) render through the reconciled
    // SubcategoryView (journey-2). Private/standard package theme landings
    // render through PackageSubcategoryView (journey-pkg-subcategory). Group
    // packages (origin-region) keep the legacy view for now.
    const key = doc.category?.key;
    if ((key === 'private-day-tour' || key === 'group-day-tour') && doc.destinationCity?.slug) {
      return <SubcategoryView doc={doc} locale={locale as Locale} />;
    }
    if (key === 'private-package' && doc.themeRef?.slug) {
      return <PackageSubcategoryView doc={doc} locale={locale as Locale} />;
    }
    if (key === 'group-package' && doc.originRegion) {
      return <PackageSubcategoryView doc={doc} locale={locale as Locale} mode="group" />;
    }
    return <TourLandingView doc={doc} locale={locale as Locale} />;
  }

  notFound();
}

// ─────────────────────────────────────────────────────────────────────────
// Inline view components. Kept here for MVP; extract to /components when
// the templates stabilize.
// ─────────────────────────────────────────────────────────────────────────

interface TourCategoryDoc {
  _id: string;
  key: string;
  subAxis: 'destination-city' | 'theme' | 'origin-region';
  title: string;
  slug: string;
  summary?: string;
  intro?: any[];
  faq?: LandingFaqItem[];
  heroImage?: { asset?: unknown; alt?: string };
  landings: Array<{
    _id: string;
    title: string;
    slug: string;
    summary?: string;
    heroImage?: { asset?: unknown; alt?: string };
    destinationCitySlug?: string | null;
    themeSlug?: string | null;
    originRegion?: string | null;
  }>;
}


async function TourCategoryView({ doc, locale }: { doc: TourCategoryDoc; locale: Locale }) {
  const tNav = await getTranslations('nav');
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: doc.title, path: `/${doc.slug}` },
    ],
    locale,
  );
  const itemListSchema = buildItemListSchema(doc.landings ?? [], locale);
  const heroUrl = doc.heroImage?.asset
    ? urlFor(doc.heroImage as never).width(1800).height(900).quality(85).url()
    : null;

  return (
    <article>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      {heroUrl ? (
        <div className="relative h-[50vh] min-h-[360px] w-full overflow-hidden bg-limestone-deep">
          <Image src={heroUrl} alt={doc.heroImage?.alt || doc.title} fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-night/65 via-night/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-7xl px-6 pb-12">
              <h1 className="font-serif text-5xl font-normal leading-[1.05] text-paper md:text-7xl">{doc.title}</h1>
            </div>
          </div>
        </div>
      ) : (
        <header className="border-b border-rule">
          <div className="mx-auto max-w-7xl px-6 pb-12 pt-24">
            <h1 className="font-serif text-5xl font-normal leading-[1.05] text-ink md:text-6xl">{doc.title}</h1>
          </div>
        </header>
      )}

      <div className="mx-auto max-w-7xl px-6 py-12">
        {doc.summary && (
          <p className="mb-10 font-serif text-2xl italic leading-snug text-ink-soft md:text-[1.625rem]">{doc.summary}</p>
        )}
        {doc.intro && (
          <div className="prose-editorial mb-12 max-w-3xl">
            <Body value={doc.intro} locale={locale} />
          </div>
        )}

        <h2 className="mb-6 font-serif text-3xl font-medium text-ink">
          {doc.subAxis === 'destination-city' ? 'Choose by destination' :
           doc.subAxis === 'theme' ? 'Choose your theme' :
           'Choose your region'}
        </h2>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doc.landings.map((l) => (
            <li key={l._id}>
              <Link href={`/${l.slug}`} className="block rounded-lg border border-rule p-6 transition-colors hover:border-ink">
                <h3 className="mb-2 font-serif text-xl font-medium text-ink">{l.title}</h3>
                {l.summary && <p className="text-sm text-ink-soft">{l.summary}</p>}
              </Link>
            </li>
          ))}
        </ul>

        <LandingFaq items={doc.faq} locale={locale} />
      </div>
    </article>
  );
}

interface TourLandingDoc {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  intro?: any[];
  faq?: LandingFaqItem[];
  heroImage?: { asset?: unknown; alt?: string };
  category: { _id: string; key: string; title: string; slug: string };
  destinationCity?: { _id: string; name: string; slug: string };
  themeRef?: { _id: string; name: string; slug: string };
  originRegion?: string;
  tours: Array<{
    _id: string;
    type: 'dayTour' | 'package';
    tourMode: 'private' | 'group';
    durationDays?: number;
    title: string;
    slug: string;
    summary?: string;
    durationLabel?: string;
    heroImage?: { asset?: unknown; alt?: string };
  }>;
}

async function TourLandingView({ doc, locale }: { doc: TourLandingDoc; locale: Locale }) {
  const tNav = await getTranslations('nav');
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: doc.category.title, path: `/${doc.category.slug}` },
      { name: doc.title, path: `/${doc.slug}` },
    ],
    locale,
  );
  const itemListSchema = buildItemListSchema(doc.tours ?? [], locale);
  const heroUrl = doc.heroImage?.asset
    ? urlFor(doc.heroImage as never).width(1800).height(900).quality(85).url()
    : null;

  return (
    <article>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      {heroUrl ? (
        <div className="relative h-[45vh] min-h-[320px] w-full overflow-hidden bg-limestone-deep">
          <Image src={heroUrl} alt={doc.heroImage?.alt || doc.title} fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-night/65 via-night/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-7xl px-6 pb-12">
              <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand">
                <Link href={`/${doc.category.slug}`} className="hover:text-paper">{doc.category.title}</Link>
              </p>
              <h1 className="font-serif text-5xl font-normal leading-[1.05] text-paper md:text-6xl">{doc.title}</h1>
            </div>
          </div>
        </div>
      ) : (
        <header className="border-b border-rule">
          <div className="mx-auto max-w-7xl px-6 pb-10 pt-24">
            <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
              <Link href={`/${doc.category.slug}`} className="hover:text-ink">{doc.category.title}</Link>
            </p>
            <h1 className="font-serif text-5xl font-normal leading-[1.05] text-ink md:text-6xl">{doc.title}</h1>
          </div>
        </header>
      )}

      <div className="mx-auto max-w-7xl px-6 py-12">
        {doc.summary && (
          <p className="mx-auto mb-10 max-w-3xl font-serif text-2xl italic leading-snug text-ink-soft md:text-[1.625rem]">{doc.summary}</p>
        )}
        {doc.intro && (
          <div className="prose-editorial mx-auto mb-12 max-w-3xl">
            <Body value={doc.intro} locale={locale} />
          </div>
        )}

        <h2 className="mb-6 font-serif text-3xl font-medium text-ink">
          {doc.tours.length === 0 ? 'No tours yet' : `${doc.tours.length} tour${doc.tours.length === 1 ? '' : 's'}`}
        </h2>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doc.tours.map((t) => {
            const tourImg = t.heroImage?.asset
              ? urlFor(t.heroImage as never).width(600).height(400).quality(85).url()
              : null;
            return (
            <li key={t._id}>
              <Link href={`/${t.slug}`} className="group block overflow-hidden rounded-lg border border-rule transition-colors hover:border-ink">
                {tourImg && (
                  <div className="relative aspect-[3/2] w-full overflow-hidden bg-limestone-deep">
                    <Image
                      src={tourImg}
                      alt={t.heroImage?.alt || t.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  <p className="mb-2 font-sans text-xs uppercase tracking-wider text-ink-soft">
                    {t.durationLabel ?? (t.durationDays ? `${t.durationDays} day${t.durationDays === 1 ? '' : 's'}` : '')}
                  </p>
                  <h3 className="mb-2 font-serif text-lg font-medium text-ink">{t.title}</h3>
                  {t.summary && <p className="line-clamp-3 text-sm text-ink-soft">{t.summary}</p>}
                </div>
              </Link>
            </li>
            );
          })}
        </ul>

        <LandingFaq items={doc.faq} locale={locale} />
      </div>
    </article>
  );
}
