/**
 * Shared SEO/metadata builder. Every page that surfaces editor-managed
 * content should call this so the fallback chain stays consistent:
 *
 *   title:  seo.metaTitle  →  document title  →  site name
 *   desc:   seo.metaDescription  →  document summary  →  site tagline
 *   image:  seo.ogImage  →  document heroImage  →  siteSettings
 *           defaultOgImage  →  /og-default.png static fallback
 *
 * The `noIndex` flag from the seo block is honored.
 *
 * hreflang alternates are emitted automatically. For doc-driven pages,
 * pass `pathByLocale` to map each locale to its localized URL (when slugs
 * differ across locales). For pages where the path is identical across
 * locales (most listings), pass nothing — the helper builds the
 * alternates by prefixing each locale.
 */

import type { Metadata } from 'next';

import { urlFor } from '@/sanity/lib/image';
import { routing, type Locale } from '@/i18n/routing';

const SITE_NAME = 'Travel2Egypt';
const SITE_TAGLINE = 'Egypt travel, with judgment. An Egyptian operator since 2003.';

const LOCALE_OG: Record<Locale, string> = {
  en: 'en_US',
  es: 'es_ES',
  ja: 'ja_JP',
};

const LOCALE_HREFLANG: Record<Locale, string> = {
  en: 'en',
  es: 'es',
  ja: 'ja',
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
   * `internationalized-array` slug field. When provided, the helper
   * builds hreflang alternates with the locale-specific slug. When
   * absent, alternates fall back to assuming the same path across
   * locales (correct for static landings, wrong for slug-localized
   * docs — pass it where applicable).
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
  /**
   * Explicit per-locale paths for the same doc, overriding the
   * default behavior of just swapping the locale prefix. Pass this
   * for doc-driven pages where slugs differ per locale.
   * Example:
   *   {
   *     en: '/guide/cairo',
   *     es: '/guide/el-cairo',
   *     ja: '/guide/cairo',
   *   }
   */
  pathByLocale?: Partial<Record<Locale, string>>;
  /**
   * When set, used as the absolute final OG image fallback after
   * seo.ogImage and doc.heroImage. Editors override this via
   * siteSettings.defaultOgImage.
   */
  defaultOgImage?: { asset?: unknown; alt?: string } | null;
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
}

function buildAbsoluteUrl(locale: Locale, path: string): string {
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  return `${siteUrl()}${localePrefix}${path}`;
}

function buildLanguageAlternates(
  options: Options
): { [key: string]: string } {
  const out: { [key: string]: string } = {};

  for (const loc of routing.locales) {
    const path = options.pathByLocale?.[loc as Locale] ?? options.path ?? '/';
    out[LOCALE_HREFLANG[loc as Locale]] = buildAbsoluteUrl(loc as Locale, path);
  }

  // x-default: the EN canonical
  const enPath = options.pathByLocale?.en ?? options.path ?? '/';
  out['x-default'] = buildAbsoluteUrl('en', enPath);

  return out;
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

  // OG image fallback chain: editor-set → doc hero → site default → static.
  const ogSource = doc.seo?.ogImage?.asset
    ? doc.seo.ogImage
    : doc.heroImage?.asset
      ? doc.heroImage
      : options.defaultOgImage?.asset
        ? options.defaultOgImage
        : null;
  const ogUrlFromSanity = ogSource
    ? urlFor(ogSource).width(1200).height(630).quality(85).url()
    : null;
  const ogUrl = ogUrlFromSanity ?? `${siteUrl()}/og-default.png`;

  // Canonical URL: the current locale's URL for this doc.
  const canonicalPath = options.pathByLocale?.[locale] ?? path;
  const canonical = buildAbsoluteUrl(locale, canonicalPath);

  return {
    title,
    description,
    metadataBase: new URL(siteUrl()),
    alternates: {
      canonical,
      languages: buildLanguageAlternates(options),
    },
    robots: doc.seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: ogType,
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale: LOCALE_OG[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => LOCALE_OG[l as Locale]),
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: doc.heroImage?.alt || rawTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl],
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
  defaultOgImage?: { asset?: unknown; alt?: string } | null;
}): Metadata {
  return buildMetadata(
    { title: args.title, summary: args.description },
    {
      locale: args.locale,
      path: args.path,
      ogType: 'website',
      defaultOgImage: args.defaultOgImage,
    }
  );
}

/**
 * Helper to derive a `pathByLocale` map from a doc's allSlugs array
 * and a path-prefix function. Used by generateMetadata in pages that
 * read allSlugs from GROQ.
 */
export function pathByLocaleFromSlugs(
  allSlugs: Array<{ _key: string; current: string }> | null | undefined,
  buildPath: (slug: string) => string
): Partial<Record<Locale, string>> {
  if (!allSlugs) return {};
  const enSlug = allSlugs.find((s) => s._key === 'en')?.current;
  const out: Partial<Record<Locale, string>> = {};
  for (const loc of routing.locales) {
    const slugForLocale =
      allSlugs.find((s) => s._key === loc)?.current ?? enSlug;
    if (slugForLocale) out[loc as Locale] = buildPath(slugForLocale);
  }
  return out;
}
