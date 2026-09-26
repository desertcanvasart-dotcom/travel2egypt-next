/**
 * Schema.org JSON-LD builders. Each function returns a plain object that
 * the page renders inside <script type="application/ld+json">.
 *
 * Pattern: pages call buildXxxSchema(doc, locale) and pass the result to
 * the <JsonLd> component. The component handles serialization and
 * dangerouslySetInnerHTML safely (we control the data shape).
 *
 * Tested against Google Rich Results expectations — Article, TouristTrip,
 * Place, Person, Organization, BreadcrumbList, FAQPage all produce valid
 * markup the validator accepts.
 */

import { urlFor } from '@/sanity/lib/image';
import type { Locale } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { ETAA_LICENCE_URL, LEGAL_NAME } from './company';
import { siteUrlBase } from './path-from-doc';

const SITE_NAME = 'Travel2Egypt';

/**
 * SITE_URL is ALWAYS the production origin (siteUrlBase() returns the
 * hardcoded PRODUCTION_URL) — the same source seo.ts canonicals use, so
 * JSON-LD @id/url and canonical tags can never disagree, and no env var
 * is involved. (An earlier version read NEXT_PUBLIC_SITE_URL here; this
 * comment previously described that and was stale — s47 audit 2026-08-18.)
 */
const SITE_URL = siteUrlBase();

interface ImageField {
  asset?: unknown;
  alt?: string;
}

function imageUrlOrUndefined(
  img: ImageField | null | undefined,
  width = 1600,
  height = 900
): string | undefined {
  if (!img?.asset) return undefined;
  return urlFor(img).width(width).height(height).quality(85).url();
}

function absoluteUrl(path: string, locale: Locale): string {
  // getPathname applies the locale prefix (as-needed) AND localized pathnames
  // (the journey leaves in routing.ts), aligning JSON-LD URLs with the
  // canonical tag and sitemap, which already build through getPathname.
  // Byte-identical to the previous prefix+path construction for
  // identity-mapped and unknown (Sanity-slug) paths; the home path now emits
  // /es and /ja without the trailing slash, matching canonical/sitemap
  // (owner-accepted correction — breadcrumbs were the one disagreeing signal).
  return `${SITE_URL}${getPathname({ href: path, locale })}`;
}

// ─────────────────────────────────────────────────────────
// Organization (used in the root layout)
// ─────────────────────────────────────────────────────────

export interface FounderInput {
  name?: string;
  jobTitle?: string;
  description?: string;
  birthPlace?: string;
  knowsLanguage?: string[];
  alumniOf?: Array<{ name?: string; url?: string }>;
  hasCredential?: Array<{
    credentialCategory?: string;
    name?: string;
    recognizedBy?: { name?: string; url?: string };
  }>;
  sameAs?: string[];
}

export interface OrganizationInput {
  siteName?: string;
  tagline?: string;
  logo?: ImageField | null;
  defaultOgImage?: ImageField | null;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  } | null;
  contact?: { email?: string; phone?: string; whatsapp?: string };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    twitter?: string;
    tripadvisor?: string;
  };
  sisterBrands?: Array<{ name?: string; url?: string }>;
  knowsAbout?: string[];
  founder?: FounderInput | null;
}

const ACCREDITATIONS: Array<{ name: string; org: string; url?: string }> = [
  {
    name: 'JATA accredited',
    org: 'Japan Association of Travel Agents',
    url: 'https://www.jata-net.or.jp/english/',
  },
  {
    name: 'IATA accredited',
    org: 'International Air Transport Association',
    url: 'https://www.iata.org/',
  },
  {
    name: 'ASTA accredited',
    org: 'American Society of Travel Advisors',
    url: 'https://www.asta.org/',
  },
  {
    name: 'ETAA licensed travel agency (licence no. 2179)',
    org: 'Egyptian Travel Agents Association',
    url: ETAA_LICENCE_URL,
  },
];

export function buildOrganizationSchema(input: OrganizationInput) {
  // Logo and image are kept distinct: logo for Knowledge Panel
  // identity, image for the share-card / generic visual fallback.
  const logoUrl = imageUrlOrUndefined(input.logo, 600, 600);
  const imageUrl = imageUrlOrUndefined(input.defaultOgImage, 1200, 630);

  // sameAs — every public profile URL the operator wants Google and
  // AI engines to associate with this Organization.
  const sameAs = [
    input.socialLinks?.facebook,
    input.socialLinks?.instagram,
    input.socialLinks?.youtube,
    input.socialLinks?.linkedin,
    input.socialLinks?.twitter,
    input.socialLinks?.tripadvisor,
  ].filter((u): u is string => Boolean(u));

  // contactPoint replaces the previous flat email/telephone — the
  // structured form is what Google's parser expects.
  const phoneOrWhatsapp = input.contact?.phone ?? input.contact?.whatsapp;
  const contactPoint =
    phoneOrWhatsapp || input.contact?.email
      ? {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          ...(phoneOrWhatsapp ? { telephone: phoneOrWhatsapp } : {}),
          ...(input.contact?.email ? { email: input.contact.email } : {}),
          availableLanguage: ['en', 'es', 'ja'],
        }
      : null;

  const address = input.address
    ? {
        '@type': 'PostalAddress',
        ...(input.address.streetAddress
          ? { streetAddress: input.address.streetAddress }
          : {}),
        ...(input.address.addressLocality
          ? { addressLocality: input.address.addressLocality }
          : {}),
        ...(input.address.addressRegion
          ? { addressRegion: input.address.addressRegion }
          : {}),
        ...(input.address.postalCode
          ? { postalCode: input.address.postalCode }
          : {}),
        addressCountry: input.address.addressCountry ?? 'EG',
      }
    : { '@type': 'PostalAddress', addressCountry: 'EG' };

  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${SITE_URL}#organization`,
    name: input.siteName ?? SITE_NAME,
    description: input.tagline ?? 'Egyptian travel operator since 1993.',
    slogan: input.tagline,
    url: SITE_URL,
    legalName: LEGAL_NAME,
    foundingDate: '1993',
    ...(logoUrl
      ? {
          logo: {
            '@type': 'ImageObject',
            url: logoUrl,
          },
        }
      : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    address,
    ...(contactPoint ? { contactPoint } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    areaServed: {
      '@type': 'Country',
      name: 'Egypt',
    },
    ...(input.knowsAbout && input.knowsAbout.length > 0
      ? { knowsAbout: input.knowsAbout }
      : {}),
    ...(input.sisterBrands && input.sisterBrands.length > 0
      ? {
          subOrganization: input.sisterBrands
            .filter((b) => b.name && b.url)
            .map((b) => ({
              '@type': 'Organization',
              name: b.name,
              url: b.url,
            })),
        }
      : {}),
    hasCredential: ACCREDITATIONS.map((acc) => ({
      '@type': 'EducationalOccupationalCredential',
      name: acc.name,
      recognizedBy: {
        '@type': 'Organization',
        name: acc.org,
        url: acc.url,
      },
    })),
    // Founder is referenced by @id; the Person body is emitted separately
    // by buildFounderPersonSchema and rendered as a sibling in the root
    // layout. Splitting the entities lets each have its own @id so
    // crawlers can join the graph (Person.worksFor → Organization;
    // Organization.founder → Person).
    ...(input.founder?.name
      ? { founder: { '@id': `${SITE_URL}#founder` } }
      : {}),
  };
}

/**
 * Build the founder Person JSON-LD.
 *
 * Returns null if no founder is configured in siteSettings — the operator
 * must explicitly populate the founder field before the Person markup
 * appears. We do not fall back to hardcoded values: the founder belongs
 * in content, not in code, so the operator can edit biography copy
 * without a redeploy.
 */
export function buildFounderPersonSchema(founder: FounderInput | null | undefined) {
  if (!founder?.name) return null;

  const alumniOf = (founder.alumniOf ?? [])
    .filter((a) => a.name)
    .map((a) => ({
      '@type': 'EducationalOrganization',
      name: a.name,
      ...(a.url ? { url: a.url } : {}),
    }));

  const credentials = (founder.hasCredential ?? [])
    .filter((c) => c.name && c.recognizedBy?.name)
    .map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      ...(c.credentialCategory ? { credentialCategory: c.credentialCategory } : {}),
      name: c.name,
      recognizedBy: {
        '@type': 'Organization',
        name: c.recognizedBy!.name,
        ...(c.recognizedBy!.url ? { url: c.recognizedBy!.url } : {}),
      },
    }));

  const sameAs = (founder.sameAs ?? []).filter((u): u is string => Boolean(u));

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}#founder`,
    name: founder.name,
    ...(founder.jobTitle ? { jobTitle: founder.jobTitle } : {}),
    ...(founder.description ? { description: founder.description } : {}),
    ...(founder.birthPlace
      ? {
          birthPlace: {
            '@type': 'Place',
            name: founder.birthPlace,
          },
        }
      : {}),
    ...(founder.knowsLanguage && founder.knowsLanguage.length > 0
      ? { knowsLanguage: founder.knowsLanguage }
      : {}),
    ...(alumniOf.length > 0 ? { alumniOf } : {}),
    ...(credentials.length > 0 ? { hasCredential: credentials } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    worksFor: { '@id': `${SITE_URL}#organization` },
  };
}

// ─────────────────────────────────────────────────────────
// WebSite (homepage only)
//
// Identifies the canonical site entity for Knowledge Panel and AI-
// search purposes. Emitted only on the locale-aware homepage. No
// SearchAction is emitted: the site has no full-text search surface
// (per decision 6), and advertising a non-existent SearchAction would
// be a hallucination for crawlers.
// ─────────────────────────────────────────────────────────

export interface WebSiteSchemaInput {
  siteName?: string;
  tagline?: string;
}

export function buildWebSiteSchema(
  input: WebSiteSchemaInput,
  locale: Locale,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    name: input.siteName ?? SITE_NAME,
    ...(input.tagline ? { description: input.tagline } : {}),
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}#organization` },
    inLanguage: locale,
  };
}

// ─────────────────────────────────────────────────────────
// Article (journal posts)
// ─────────────────────────────────────────────────────────

export interface ArticleSchemaInput {
  title: string;
  slug: string;
  deck?: string;
  publishedAt?: string;
  updatedAt?: string;
  heroImage?: ImageField | null;
  author?: { name?: string; slug?: { current: string } } | null;
  category?: { name?: string } | null;
}

export function buildArticleSchema(
  input: ArticleSchemaInput,
  locale: Locale,
  path?: string,
) {
  const url = absoluteUrl(path ?? `/blog/${input.slug}`, locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: input.title,
    description: input.deck,
    ...(imageUrlOrUndefined(input.heroImage, 1600, 900)
      ? { image: imageUrlOrUndefined(input.heroImage, 1600, 900) }
      : {}),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    ...(input.author?.name
      ? {
          author: {
            '@type': 'Person',
            name: input.author.name,
            ...(input.author.slug?.current
              ? { url: `${SITE_URL}/about/${input.author.slug.current}` }
              : {}),
          },
        }
      : {}),
    ...(input.category?.name
      ? { articleSection: input.category.name }
      : {}),
    publisher: { '@id': `${SITE_URL}#organization` },
    inLanguage: locale,
  };
}

// ─────────────────────────────────────────────────────────
// TouristTrip (tours and packages)
// ─────────────────────────────────────────────────────────

export interface TouristTripInput {
  title: string;
  slug: string;
  /** 'dayTour' | 'package' — drives URL building and additionalType. */
  type?: string;
  /** 'private' | 'group' — drives whether to emit `offers` at all. */
  tourMode?: string;
  summary?: string;
  /** Total days for packages; 1 for day tours. Emitted as ISO-8601 duration. */
  durationDays?: number;
  /** Day-tour length in hours. Preferred over durationDays for day tours → PT{h}H. */
  durationHours?: number;
  durationLabel?: string;
  /** Per-person base price in EUR. Honest absence: when null, no `offers` is emitted. */
  basePrice?: number;
  /** Percent applied to basePrice on peak-flagged departures (group packages). */
  peakUpliftPct?: number;
  /** Max scheduled-departure group size (group packages). */
  maxGroup?: number;
  /** Origin region for group packages — 'japan-east-asia' | 'usa-canada' | etc. */
  originRegion?: string;
  heroImage?: ImageField | null;
  cities?: Array<{ name?: string }>;
}

/**
 * Build the schema.org/TouristTrip JSON-LD for tour and package pages.
 *
 * Pricing exposure follows the decision:
 *   - Group products → emit Offer (uniform basePrice) or AggregateOffer
 *     (low = basePrice, high = basePrice * (1 + peakUpliftPct/100)) when
 *     a peak uplift exists. Currency is always EUR — the canonical
 *     source-of-truth price, not a locale-converted display price. We do
 *     not expose USD/JPY conversions in structured data because doing so
 *     would advertise different prices for the same product depending on
 *     which language version the crawler hit.
 *   - Private products → omit `offers` entirely. The brand is
 *     consultative on private; emitting a fabricated price would be
 *     worse than honest absence.
 *   - In all cases the `basePrice` field must be non-null. Today no
 *     tour has basePrice set, so no `offers` will render. That is the
 *     intended state until pricing is published.
 */
export function buildTouristTripSchema(
  input: TouristTripInput,
  locale: Locale
) {
  // Canonical tour/package URL is the root path `/<slug>` — `/tours/<slug>`
  // and `/packages/<slug>` are now 301 redirect sources, so emitting them
  // here would put a redirected URL in the structured data, contradicting the
  // page's own canonical. Match the canonical instead.
  const url = absoluteUrl(`/${input.slug}`, locale);

  // additionalType — communicates the product variant to crawlers and AI
  // agents. We use four readable English labels rather than schema.org
  // enum URIs because there is no exact schema.org TouristTrip subtype
  // for "private day tour" vs "small-group package" — these are
  // commercial product shapes, not vocabulary terms.
  const additionalType =
    input.type === 'package'
      ? input.tourMode === 'group'
        ? 'GroupPackage'
        : 'PrivatePackage'
      : input.tourMode === 'group'
        ? 'GroupDayTour'
        : 'PrivateDayTour';

  const offers = buildTouristTripOffers(input);

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    additionalType,
    name: input.title,
    description: input.summary,
    url,
    ...(imageUrlOrUndefined(input.heroImage, 1600, 900)
      ? { image: imageUrlOrUndefined(input.heroImage, 1600, 900) }
      : {}),
    provider: { '@id': `${SITE_URL}#organization` },
    // Day tours read in hours (PT{h}H); packages and multi-day fall back to
    // whole days (P{d}D). A day tour without hours uses its day count.
    ...(input.type === 'dayTour' &&
    typeof input.durationHours === 'number' &&
    input.durationHours > 0
      ? { duration: `PT${input.durationHours}H` }
      : typeof input.durationDays === 'number' && input.durationDays > 0
        ? { duration: `P${input.durationDays}D` }
        : {}),
    ...(typeof input.maxGroup === 'number' && input.maxGroup > 0
      ? { maximumAttendeeCapacity: input.maxGroup }
      : {}),
    ...(input.originRegion
      ? {
          audience: {
            '@type': 'Audience',
            audienceType: input.originRegion,
          },
        }
      : {}),
    ...(input.cities && input.cities.length > 0
      ? {
          itinerary: input.cities
            .filter((c) => c.name)
            .map((c) => ({
              '@type': 'Place',
              name: c.name,
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'EG',
                addressLocality: c.name,
              },
            })),
        }
      : {}),
    ...(offers ? { offers } : {}),
    inLanguage: locale,
  };
}

/**
 * Pricing exposure decision (group-only). Returns null for private
 * products and for any product without a basePrice.
 *
 * Group day tours → uniform pricing per the data audit (no peak uplift
 * variation exists today). Emit a single Offer.
 * Group packages → emit AggregateOffer when peakUpliftPct is set,
 * otherwise a single Offer at basePrice.
 */
function buildTouristTripOffers(input: TouristTripInput) {
  if (input.tourMode !== 'group') return null;
  if (typeof input.basePrice !== 'number' || input.basePrice <= 0) return null;

  const isPackage = input.type === 'package';
  const peak = input.peakUpliftPct;
  const hasPeakVariation = isPackage && typeof peak === 'number' && peak > 0;

  if (hasPeakVariation) {
    const high = Math.round(input.basePrice * (1 + (peak as number) / 100));
    return {
      '@type': 'AggregateOffer',
      lowPrice: input.basePrice,
      highPrice: high,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    };
  }

  return {
    '@type': 'Offer',
    price: input.basePrice,
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
  };
}

// ─────────────────────────────────────────────────────────
// Hotel (`/hotels/[slug]`)
//
// Emits schema.org/Hotel. We deliberately do NOT emit `priceRange`,
// `amenityFeature`, `numberOfRooms`, or check-in/check-out: the operator
// neither manages rooms nor publishes nightly rates. The page exists to
// position the hotel editorially and link to relevant tours, not to act
// as a booking listing. Emitting placeholder fields would mislead AI
// agents into treating the page as a bookable inventory item.
// ─────────────────────────────────────────────────────────

export interface HotelSchemaInput {
  name: string;
  slug: string;
  summary?: string;
  heroImage?: ImageField | null;
  /** Free-form Sanity category — standard / deluxe / luxury / boutique. */
  category?: string;
  /** 1–5. Emitted only when within range. */
  starRating?: number;
  /** Parent city (resolved via Sanity reference). Populates `address.addressLocality`. */
  city?: { name?: string } | null;
}

export function buildHotelSchema(input: HotelSchemaInput, locale: Locale) {
  const url = absoluteUrl(`/hotels/${input.slug}`, locale);
  const heroUrl = imageUrlOrUndefined(input.heroImage, 1600, 900);
  const starRating =
    typeof input.starRating === 'number' &&
    input.starRating >= 1 &&
    input.starRating <= 5
      ? input.starRating
      : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: input.name,
    description: input.summary,
    url,
    ...(heroUrl ? { image: heroUrl } : {}),
    ...(input.category ? { additionalType: input.category } : {}),
    ...(starRating !== null
      ? {
          starRating: {
            '@type': 'Rating',
            ratingValue: starRating,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
      ...(input.city?.name ? { addressLocality: input.city.name } : {}),
    },
    inLanguage: locale,
  };
}

// ─────────────────────────────────────────────────────────
// Nile cruise (`/nile-cruises/[slug]`)
//
// schema.org/TouristTrip with `additionalType: 'BoatTrip'` — the
// TouristTrip parent is well-recognized by tooling; BoatTrip narrows
// the semantic intent without losing parser compatibility.
//
// Itinerary fans out as an ordered Place[] from cruise.itinerary[].
// Duration uses ISO-8601 (`P{n}D`) derived from durationNights.
// ─────────────────────────────────────────────────────────

export interface CruiseTouristTripInput {
  name: string;
  slug: string;
  summary?: string;
  heroImage?: ImageField | null;
  /** Sanity cruise.type — 'cruise-ship' | 'yacht' | 'dahabiya' | 'felucca'. */
  vesselType?: string;
  /** Sanity cruise.tier — 'standard' | 'deluxe' | 'luxury' | 'boutique'. */
  tier?: string;
  /** Sanity cruise.capacity — passenger count. */
  capacity?: number;
  /** Sanity cruise.durationNights — total nights aboard. */
  durationNights?: number;
  /** Sanity cruise.departureCity (resolved) — first stop of the journey. */
  departureCity?: { name?: string } | null;
  /** Sanity cruise.returnCity (resolved) — last stop of the journey. */
  returnCity?: { name?: string } | null;
  /** Cities visited in order, derived from cruise.itinerary[].cities[]. */
  itineraryCities?: Array<{ name?: string }>;
}

export function buildCruiseTouristTripSchema(
  input: CruiseTouristTripInput,
  locale: Locale,
) {
  const url = absoluteUrl(`/nile-cruises/${input.slug}`, locale);
  const heroUrl = imageUrlOrUndefined(input.heroImage, 1600, 900);

  // Build the itinerary: departure city + ordered visited cities + return
  // city, de-duplicating consecutive identical city names so a Luxor →
  // Luxor framing doesn't produce a 2-element itinerary of [Luxor, Luxor].
  const orderedCities: Array<{ name?: string }> = [];
  if (input.departureCity?.name)
    orderedCities.push({ name: input.departureCity.name });
  for (const c of input.itineraryCities ?? []) {
    if (!c?.name) continue;
    const last = orderedCities[orderedCities.length - 1];
    if (last?.name === c.name) continue;
    orderedCities.push(c);
  }
  if (input.returnCity?.name) {
    const last = orderedCities[orderedCities.length - 1];
    if (last?.name !== input.returnCity.name)
      orderedCities.push({ name: input.returnCity.name });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    additionalType: 'BoatTrip',
    name: input.name,
    description: input.summary,
    url,
    ...(heroUrl ? { image: heroUrl } : {}),
    provider: { '@id': `${SITE_URL}#organization` },
    ...(typeof input.durationNights === 'number' && input.durationNights > 0
      ? { duration: `P${input.durationNights}D` }
      : {}),
    ...(typeof input.capacity === 'number' && input.capacity > 0
      ? { maximumAttendeeCapacity: input.capacity }
      : {}),
    ...(input.tier
      ? {
          audience: {
            '@type': 'Audience',
            audienceType: input.tier,
          },
        }
      : {}),
    ...(input.vesselType
      ? {
          // vesselType is the closest semantic value for cruise-ship/yacht/
          // dahabiya/felucca; expose it as a structured property so AI
          // agents can answer "what kind of vessel is this" without parsing
          // editorial prose.
          additionalProperty: {
            '@type': 'PropertyValue',
            name: 'vesselType',
            value: input.vesselType,
          },
        }
      : {}),
    ...(orderedCities.length > 0
      ? {
          itinerary: orderedCities.map((c) => ({
            '@type': 'Place',
            name: c.name,
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'EG',
              addressLocality: c.name,
            },
          })),
        }
      : {}),
    inLanguage: locale,
  };
}

// ─────────────────────────────────────────────────────────
// Place (cities, monuments)
// ─────────────────────────────────────────────────────────

export interface PlaceInput {
  name: string;
  slug: string;
  summary?: string;
  heroImage?: ImageField | null;
  coordinates?: { lat?: number; lng?: number } | null;
  /** Override the URL builder; otherwise defaults by type. */
  pathOverride?: string;
  type: 'city' | 'wikiMonument';
  monumentType?: string;
  preciseLocation?: string;
}

export function buildPlaceSchema(input: PlaceInput, locale: Locale) {
  const path =
    input.pathOverride ??
    (input.type === 'city'
      ? `/guide/${input.slug}`
      : `/wiki/monuments/${input.slug}`);
  const url = absoluteUrl(path, locale);
  // For monuments the LandmarkOrHistoricalBuilding subtype is more
  // specific; cities use Place.
  const schemaType =
    input.type === 'wikiMonument' ? 'LandmarksOrHistoricalBuildings' : 'Place';
  return {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: input.name,
    description: input.summary,
    url,
    ...(imageUrlOrUndefined(input.heroImage, 1600, 900)
      ? { image: imageUrlOrUndefined(input.heroImage, 1600, 900) }
      : {}),
    ...(input.coordinates?.lat && input.coordinates?.lng
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: input.coordinates.lat,
            longitude: input.coordinates.lng,
          },
        }
      : {}),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
      ...(input.preciseLocation
        ? { addressLocality: input.preciseLocation }
        : {}),
    },
  };
}

// ─────────────────────────────────────────────────────────
// Guide article (`/guide/[city]/[slug]`)
//
// The `kind` field on guideArticle discriminates between an editorial
// piece ("article" and all other kinds) and a place-as-content
// ("attraction"). The former emits Article — same shape as the journal
// builder but with `articleSection` set to the parent city's name so
// the article's place in the editorial hierarchy is machine-readable.
// The latter emits TouristAttraction with `containedInPlace` and
// (when known) geo coordinates and street address.
// ─────────────────────────────────────────────────────────

export interface GuideArticleSchemaInput {
  /** Discriminator from `guideArticle.kind`. 'attraction' → TouristAttraction; everything else → Article. */
  kind?: string;
  title: string;
  /** Article slug under the parent city. */
  slug: string;
  /** Parent city slug for URL building. */
  citySlug: string;
  /** Parent city name — used as `articleSection` (Article) and `containedInPlace` (Attraction). */
  parentCityName?: string;
  summary?: string;
  heroImage?: ImageField | null;
  /** Coordinates of the attraction (TouristAttraction kind only). */
  coordinates?: { lat?: number; lng?: number } | null;
  /** A more specific subtype label (e.g. "Pyramid", "Temple") — populated from `guideArticle.monumentType`. */
  monumentType?: string;
  /** Free-text address (e.g. "El Haram, Al Giza Desert") — `guideArticle.preciseLocation`. */
  preciseLocation?: string;
}

export function buildGuideArticleSchema(
  input: GuideArticleSchemaInput,
  locale: Locale,
) {
  const url = absoluteUrl(`/guide/${input.citySlug}/${input.slug}`, locale);
  const heroUrl = imageUrlOrUndefined(input.heroImage, 1600, 900);

  if (input.kind === 'attraction') {
    return {
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      ...(input.monumentType ? { additionalType: input.monumentType } : {}),
      name: input.title,
      description: input.summary,
      url,
      ...(heroUrl ? { image: heroUrl } : {}),
      ...(input.parentCityName
        ? {
            containedInPlace: {
              '@type': 'Place',
              name: input.parentCityName,
              address: {
                '@type': 'PostalAddress',
                addressLocality: input.parentCityName,
                addressCountry: 'EG',
              },
            },
          }
        : {}),
      ...(input.coordinates?.lat && input.coordinates?.lng
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: input.coordinates.lat,
              longitude: input.coordinates.lng,
            },
          }
        : {}),
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'EG',
        ...(input.preciseLocation
          ? { streetAddress: input.preciseLocation }
          : input.parentCityName
            ? { addressLocality: input.parentCityName }
            : {}),
      },
      inLanguage: locale,
    };
  }

  // Default: Article — same publisher back-reference as journal posts so
  // the entity graph joins to the TravelAgency Organization.
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: input.title,
    description: input.summary,
    ...(heroUrl ? { image: heroUrl } : {}),
    ...(input.parentCityName ? { articleSection: input.parentCityName } : {}),
    publisher: { '@id': `${SITE_URL}#organization` },
    inLanguage: locale,
  };
}

// ─────────────────────────────────────────────────────────
// Person (authors, wiki people)
// ─────────────────────────────────────────────────────────

export interface PersonSchemaInput {
  name: string;
  slug: string;
  /** "wikiPerson" routes to /wiki/people/, "author" routes to /about/ */
  type: 'wikiPerson' | 'author';
  summary?: string;
  heroImage?: ImageField | null;
  alternateNames?: string[];
  /** For wikiPerson */
  reignDisplay?: string;
  role?: string;
}

export function buildPersonSchema(input: PersonSchemaInput, locale: Locale) {
  const path =
    input.type === 'wikiPerson'
      ? `/wiki/people/${input.slug}`
      : `/about/${input.slug}`;
  const url = absoluteUrl(path, locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: input.name,
    description: input.summary,
    url,
    ...(imageUrlOrUndefined(input.heroImage, 1200, 1200)
      ? { image: imageUrlOrUndefined(input.heroImage, 1200, 1200) }
      : {}),
    ...(input.alternateNames && input.alternateNames.length > 0
      ? { alternateName: input.alternateNames }
      : {}),
    ...(input.role ? { jobTitle: input.role } : {}),
    ...(input.reignDisplay ? { description: `${input.role ?? ''} ${input.reignDisplay}`.trim() } : {}),
  };
}

// ─────────────────────────────────────────────────────────
// BreadcrumbList (every detail page)
// ─────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  /** Locale-relative path (e.g. "/wiki/dynasties"). Helper adds locale prefix and origin. */
  path: string;
}

export function buildBreadcrumbList(items: BreadcrumbItem[], locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, locale),
    })),
  };
}

// ─────────────────────────────────────────────────────────
// FAQPage (used by /faq landing once it exists)
// ─────────────────────────────────────────────────────────

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * ItemList for landing/category grids (s47 audit 2026-08-18): name+url per
 * item, urls absolute on the production origin with locale prefix.
 */
export function buildItemListSchema(
  items: Array<{ title: string; slug: string }>,
  locale: Locale,
) {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.title,
      url: `${SITE_URL}${prefix}/${item.slug}`,
    })),
  };
}

export function buildFAQSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
