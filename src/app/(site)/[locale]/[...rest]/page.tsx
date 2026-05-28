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
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
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
import { TourPageView } from '@/components/TourPageView';

interface Props {
  params: Promise<{ locale: string; rest: string[] }>;
}

/**
 * Tiny resolver: takes the first path segment and looks it up. Returns
 * null for any multi-segment path (we only handle single-slug routes
 * here — nested URLs route through their own explicit Next.js segments).
 */
async function resolveSlug(
  locale: Locale,
  rest: string[],
): Promise<{ _id: string; _type: string } | null> {
  if (rest.length !== 1) return null;
  const slug = rest[0];
  return client.fetch(slugLookupQuery(locale), { slug });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, rest } = await params;
  const hit = await resolveSlug(locale as Locale, rest);
  if (!hit) return {};

  if (hit._type === 'tourCategory') {
    const doc = await client.fetch(tourCategoryBySlugQuery(locale as Locale), { slug: rest[0] });
    if (!doc) return {};
    return {
      title: doc.seo?.metaTitle ?? doc.title,
      description: doc.seo?.metaDescription ?? doc.summary,
    };
  }
  if (hit._type === 'tourLanding') {
    const doc = await client.fetch(tourLandingBySlugQuery(locale as Locale), { slug: rest[0] });
    if (!doc) return {};
    return {
      title: doc.seo?.metaTitle ?? doc.title,
      description: doc.seo?.metaDescription ?? doc.summary,
    };
  }
  if (hit._type === 'tour') {
    const tour = await client.fetch(tourBySlugQuery(locale as Locale), { slug: rest[0] });
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
      client.fetch(tourBySlugQuery(locale as Locale), { slug: rest[0] }),
      client.fetch(siteSettingsQuery(locale as Locale)),
    ]);
    if (!tour) notFound();
    return <TourPageView tour={tour} locale={locale as Locale} slug={rest[0]} siteSettings={siteSettings} />;
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
    const doc = await client.fetch(tourCategoryBySlugQuery(locale as Locale), { slug: rest[0] });
    if (!doc) notFound();
    return <TourCategoryView doc={doc} locale={locale as Locale} />;
  }

  if (hit._type === 'tourLanding') {
    const doc = await client.fetch(tourLandingBySlugQuery(locale as Locale), { slug: rest[0] });
    if (!doc) notFound();
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
  faq?: any[];
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

function TourCategoryView({ doc, locale }: { doc: TourCategoryDoc; locale: Locale }) {
  const heroUrl = doc.heroImage?.asset
    ? urlFor(doc.heroImage as any).width(1800).height(900).quality(85).url()
    : null;

  return (
    <article>
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

        {doc.faq && (
          <section className="mt-16">
            <h2 className="mb-6 font-serif text-3xl font-medium text-ink">FAQ</h2>
            <div className="prose-editorial max-w-3xl">
              <Body value={doc.faq} locale={locale} />
            </div>
          </section>
        )}
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
  faq?: any[];
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

function TourLandingView({ doc, locale }: { doc: TourLandingDoc; locale: Locale }) {
  const heroUrl = doc.heroImage?.asset
    ? urlFor(doc.heroImage as any).width(1800).height(900).quality(85).url()
    : null;

  return (
    <article>
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
          <p className="mb-10 font-serif text-2xl italic leading-snug text-ink-soft md:text-[1.625rem]">{doc.summary}</p>
        )}
        {doc.intro && (
          <div className="prose-editorial mb-12 max-w-3xl">
            <Body value={doc.intro} locale={locale} />
          </div>
        )}

        <h2 className="mb-6 font-serif text-3xl font-medium text-ink">
          {doc.tours.length === 0 ? 'No tours yet' : `${doc.tours.length} tour${doc.tours.length === 1 ? '' : 's'}`}
        </h2>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doc.tours.map((t) => (
            <li key={t._id}>
              <Link href={`/${t.slug}`} className="block rounded-lg border border-rule p-6 transition-colors hover:border-ink">
                <p className="mb-2 font-sans text-xs uppercase tracking-wider text-ink-soft">
                  {t.durationLabel ?? (t.durationDays ? `${t.durationDays} day${t.durationDays === 1 ? '' : 's'}` : '')}
                </p>
                <h3 className="mb-2 font-serif text-lg font-medium text-ink">{t.title}</h3>
                {t.summary && <p className="line-clamp-3 text-sm text-ink-soft">{t.summary}</p>}
              </Link>
            </li>
          ))}
        </ul>

        {doc.faq && (
          <section className="mt-16">
            <h2 className="mb-6 font-serif text-3xl font-medium text-ink">FAQ</h2>
            <div className="prose-editorial max-w-3xl">
              <Body value={doc.faq} locale={locale} />
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
