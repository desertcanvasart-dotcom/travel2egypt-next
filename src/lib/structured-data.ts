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
import { CURRENCY } from './currency';
import { siteUrlBase } from './path-from-doc';

const SITE_NAME = 'Travel2Egypt';

/**
 * IMPORTANT: SITE_URL reads from process.env.NEXT_PUBLIC_SITE_URL at
 * build/render time. On localhost it will resolve to
 * http://localhost:3000 — that's expected during dev. In production this
 * env var MUST be set to https://travel2egypt.org (Vercel project
 * settings → Environment Variables → NEXT_PUBLIC_SITE_URL). If it isn't,
 * the Organization JSON-LD's `url` and `@id` fields will point at
 * localhost and Google will not be able to associate the schema with
 * the live domain.
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
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  return `${SITE_URL}${localePrefix}${path}`;
}

// ─────────────────────────────────────────────────────────
// Organization (used in the root layout)
// ─────────────────────────────────────────────────────────

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
    name: 'ETAA accredited',
    org: 'Egyptian Travel Agents Association',
    url: 'https://www.etaa-egypt.org/',
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
    description: input.tagline ?? 'Egyptian travel operator since 2003.',
    slogan: input.tagline,
    url: SITE_URL,
    foundingDate: '2003',
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
  type?: string; // 'dayTour' | 'package'
  summary?: string;
  durationDays?: number;
  durationLabel?: string;
  priceFrom?: number;
  heroImage?: ImageField | null;
  cities?: Array<{ name?: string }>;
}

export function buildTouristTripSchema(
  input: TouristTripInput,
  locale: Locale
) {
  const path =
    input.type === 'package' ? `/packages/${input.slug}` : `/tours/${input.slug}`;
  const url = absoluteUrl(path, locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: input.title,
    description: input.summary,
    url,
    ...(imageUrlOrUndefined(input.heroImage, 1600, 900)
      ? { image: imageUrlOrUndefined(input.heroImage, 1600, 900) }
      : {}),
    provider: { '@id': `${SITE_URL}#organization` },
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
    ...(typeof input.priceFrom === 'number'
      ? {
          offers: {
            '@type': 'Offer',
            price: input.priceFrom,
            priceCurrency: CURRENCY.code,
            availability: 'https://schema.org/InStock',
          },
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
