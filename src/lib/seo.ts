/**
 * Shared SEO/metadata builder. Every page that surfaces editor-managed
 * content should call this so the fallback chain stays consistent:
 *
 *   title:  seo.metaTitle  →  document title  →  site name
 *   desc:   seo.metaDescription  →  document summary  →  site tagline
 *   image:  seo.ogImage  →  document heroImage  →  none
 *
 * The `noIndex` flag from the seo block is honored.
 */

import type { Metadata } from 'next';

import { urlFor } from '@/sanity/lib/image';
import { routing, type Locale } from '@/i18n/routing';

const SITE_NAME = 'Travel2Egypt';
const SITE_TAGLINE = 'Egypt travel, with judgment. An Egyptian operator since 1995.';

const LOCALE_OG: Record<Locale, string> = {
  en: 'en_US',
  es: 'es_ES',
  ja: 'ja_JP',
};

interface SourceDoc {
  title?: string;
  summary?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: { asset?: unknown } | null;
    noIndex?: boolean;
  } | null;
  /**
   * Per-locale slugs for this document, projected from the
   * `internationalized-array` slug field. Plumbed through here so
   * Session 3.5 (SEO infra) can wire `<link rel="alternate" hreflang>`
   * without schema changes.
   */
  allSlugs?: Array<{ _key: string; current: string }> | null;
}

interface Options {
  locale: Locale;
  /** Path under the locale prefix, e.g. "/tours/saqqara-dahshur-day-tour". */
  path?: string;
  /** Override the title suffix. Defaults to "— Travel2Egypt" unless the title already ends with the brand. */
  brandSuffix?: boolean;
  /** Force a specific OG type (defaults to "article" for content pages). */
  ogType?: 'website' | 'article';
}

export function buildMetadata(doc: SourceDoc, options: Options): Metadata {
  const { locale, path = '/', brandSuffix = true, ogType = 'article' } = options;

  const rawTitle =
    doc.seo?.metaTitle?.trim() || doc.title?.trim() || SITE_NAME;
  const title =
    brandSuffix && !rawTitle.toLowerCase().includes(SITE_NAME.toLowerCase())
      ? `${rawTitle} — ${SITE_NAME}`
      : rawTitle;

  const description =
    doc.seo?.metaDescription?.trim() ||
    doc.summary?.trim() ||
    SITE_TAGLINE;

  const ogSource = doc.seo?.ogImage?.asset
    ? doc.seo.ogImage
    : doc.heroImage?.asset
      ? doc.heroImage
      : null;
  const ogUrl = ogSource
    ? urlFor(ogSource).width(1200).height(630).quality(85).url()
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  const url = `${siteUrl}${localePrefix}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: doc.seo?.noIndex
      ? { index: false, follow: false }
      : undefined,
    openGraph: {
      type: ogType,
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: LOCALE_OG[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => LOCALE_OG[l as Locale]),
      ...(ogUrl
        ? {
            images: [
              {
                url: ogUrl,
                width: 1200,
                height: 630,
                alt: doc.heroImage?.alt || rawTitle,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogUrl ? { images: [ogUrl] } : {}),
    },
  };
}

/**
 * For pure listing pages (no Sanity doc behind them) — uses translation
 * strings directly, still emits OG/Twitter so cards render correctly.
 */
export function buildStaticMetadata(args: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
}): Metadata {
  return buildMetadata(
    { title: args.title, summary: args.description },
    { locale: args.locale, path: args.path, ogType: 'website' }
  );
}
