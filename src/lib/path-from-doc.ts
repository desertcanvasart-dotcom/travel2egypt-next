/**
 * Single source of truth for "given a doc and a locale, what path does it
 * live at?" — used by the sitemap, the hreflang alternate-URL builder,
 * and breadcrumb structured data.
 *
 * This must stay in sync with the route segments in src/app/(site)/[locale]/.
 */

import type { Locale } from '@/i18n/routing';

export type SitemapDocType =
  | 'city'
  | 'guideArticle'
  | 'tour'
  | 'travelTip'
  | 'faqEntry'
  | 'article'
  | 'wikiPerson'
  | 'wikiMonument'
  | 'wikiDynasty'
  | 'wikiDeity'
  | 'hotel'
  | 'nileCruise'
  | 'page'
  | 'legalPage';

export interface PathFromDocInput {
  type: SitemapDocType;
  /** The slug for the locale being built. */
  slug: string;
  /** For documents that nest under another, e.g. guideArticle under city. */
  parentCitySlug?: string | null;
  /** Tour discriminator — day-tour vs package routes. */
  tourType?: 'dayTour' | 'package' | null;
}

/**
 * Returns a locale-relative path (no locale prefix). The page-level
 * generateMetadata helper and the sitemap builder both add the
 * locale prefix where appropriate.
 */
export function pathFromDoc({
  type,
  slug,
  parentCitySlug,
  tourType,
}: PathFromDocInput): string | null {
  if (!slug) return null;
  switch (type) {
    case 'city':
      return `/guide/${slug}`;
    case 'guideArticle':
      return parentCitySlug ? `/guide/${parentCitySlug}/${slug}` : null;
    case 'tour':
      return tourType === 'package' ? `/packages/${slug}` : `/tours/${slug}`;
    case 'article':
      return `/blog/${slug}`;
    case 'wikiPerson':
      return `/wiki/people/${slug}`;
    case 'wikiMonument':
      return `/wiki/monuments/${slug}`;
    case 'wikiDynasty':
      return `/wiki/dynasties/${slug}`;
    case 'wikiDeity':
      return `/wiki/deities/${slug}`;
    case 'travelTip':
      return `/travel-tips/${slug}`;
    case 'faqEntry':
      return `/faq#${slug}`;
    case 'hotel':
      return `/hotels/${slug}`;
    case 'nileCruise':
      return `/cruises/${slug}`;
    case 'page':
      return `/${slug}`;
    case 'legalPage':
      return `/legal/${slug}`;
    default:
      return null;
  }
}

/**
 * Build the absolute URL for a doc on a specific locale. EN is canonical
 * (no /en prefix); ES and JA get prefixed.
 */
export function absoluteUrlForDoc(
  doc: PathFromDocInput,
  locale: Locale,
  siteUrl: string
): string | null {
  const path = pathFromDoc(doc);
  if (!path) return null;
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  return `${siteUrl}${localePrefix}${path}`;
}

export function siteUrlBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
}
