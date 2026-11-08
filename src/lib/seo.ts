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

import { cache } from 'react';

import type { Metadata } from 'next';

import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { routing, type Locale } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { PRODUCTION_URL } from './site';

const SITE_NAME = 'Travel2Egypt';
const SITE_TAGLINE = 'Egypt travel, with judgment. An Egyptian operator since 1993.';

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
   * OG image fallback after seo.ogImage and doc.heroImage. When OMITTED,
   * the helper resolves `siteSettings.defaultOgImage` itself (cached per
   * render pass); pass an image to override that lookup, or `null` to
   * skip straight to the static /og-default.png.
   */
  defaultOgImage?: { asset?: unknown; alt?: string } | null;
}

/**
 * Site-wide OG fallback (siteSettings.defaultOgImage), fetched once per
 * render pass via React cache. Failure falls through to /og-default.png —
 * metadata must never take a page down.
 */
const getSiteDefaultOgImage = cache(
  async (): Promise<{ asset?: unknown; alt?: string } | null> => {
    try {
      return await client.fetch(`*[_type == "siteSettings"][0].defaultOgImage`);
    } catch {
      return null;
    }
  }
);

function siteUrl(): string {
  // Always the production origin — canonical URLs must be host-independent
  // so the Railway deployment never self-canonicalizes to its own domain.
  return PRODUCTION_URL;
}

function buildAbsoluteUrl(locale: Locale, path: string): string {
  // getPathname applies the locale prefix (as-needed) AND the localized
  // pathname for static routes (e.g. /private-day-tours → /ja/puraibeeto-deitsuaa).
  // Unknown/dynamic paths (Sanity slugs) are returned with just the prefix.
  const localizedPath = getPathname({ href: path, locale });
  return `${siteUrl()}${localizedPath}`;
}

function buildLanguageAlternates(
  options: Options
): { [key: string]: string } {
  const out: { [key: string]: string } = {};

  for (const loc of routing.locales) {
    const explicit = options.pathByLocale?.[loc as Locale];
    // When an explicit per-locale map is supplied, a missing locale means
    // "no version of this doc exists in that language" — so omit it rather
    // than emit an hreflang pointing at another locale's slug (which would
    // 404 / mis-signal). Callers that want every locale (the common case)
    // populate them all via pathByLocaleFromSlugs's EN fallback.
    if (options.pathByLocale && !explicit) continue;
    const path = explicit ?? options.path ?? '/';
    out[LOCALE_HREFLANG[loc as Locale]] = buildAbsoluteUrl(loc as Locale, path);
  }

  // x-default: the EN canonical (falls back to the bare path if EN-less).
  const enPath = options.pathByLocale?.en ?? options.path ?? '/';
  out['x-default'] = buildAbsoluteUrl('en', enPath);

  return out;
}

export async function buildMetadata(doc: SourceDoc, options: Options): Promise<Metadata> {
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
  // The site default (siteSettings.defaultOgImage) is fetched only when the
  // doc supplies nothing and the caller didn't pass an explicit override.
  let ogSource = doc.seo?.ogImage?.asset
    ? doc.seo.ogImage
    : doc.heroImage?.asset
      ? doc.heroImage
      : null;
  if (!ogSource) {
    const siteDefault =
      options.defaultOgImage !== undefined
        ? options.defaultOgImage
        : await getSiteDefaultOgImage();
    ogSource = siteDefault?.asset ? siteDefault : null;
  }
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
export async function buildStaticMetadata(args: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  defaultOgImage?: { asset?: unknown; alt?: string } | null;
  /**
   * When provided, hreflang alternates are emitted ONLY for these locales
   * (all sharing `path`, since these routes keep one slug across locales).
   * Omit to keep the default behavior — an alternate for every locale by
   * prefix-swap. Journey routes pass the locales their content module
   * actually defines, so alternates self-heal as ES/JA modules land rather
   * than advertising translated URLs that still serve the EN fallback.
   */
  availableLocales?: readonly Locale[];
}): Promise<Metadata> {
  const pathByLocale = args.availableLocales
    ? Object.fromEntries(args.availableLocales.map((l) => [l, args.path]))
    : undefined;
  return buildMetadata(
    { title: args.title, summary: args.description },
    {
      locale: args.locale,
      path: args.path,
      ogType: 'website',
      defaultOgImage: args.defaultOgImage,
      pathByLocale,
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

/**
 * Like `pathByLocaleFromSlugs`, but for routes with a LOCALIZED PARENT segment
 * — e.g. guide articles at `/guide/<citySlug>/<slug>`. Each locale's alternate
 * must use THAT locale's city slug AND that locale's article slug (both falling
 * back to `en`), not the current request's city slug. Passing only the article
 * slugs (as `pathByLocaleFromSlugs` does) pins the parent segment to the current
 * locale, so every hreflang alternate points at the wrong city path.
 */
export function pathByLocaleFromParentAndSlug(
  parentSlugs: Array<{ _key: string; current: string }> | null | undefined,
  childSlugs: Array<{ _key: string; current: string }> | null | undefined,
  buildPath: (parentSlug: string, childSlug: string) => string
): Partial<Record<Locale, string>> {
  if (!parentSlugs || !childSlugs) return {};
  const enParent = parentSlugs.find((s) => s._key === 'en')?.current;
  const enChild = childSlugs.find((s) => s._key === 'en')?.current;
  const out: Partial<Record<Locale, string>> = {};
  for (const loc of routing.locales) {
    const parent = parentSlugs.find((s) => s._key === loc)?.current ?? enParent;
    const child = childSlugs.find((s) => s._key === loc)?.current ?? enChild;
    if (parent && child) out[loc as Locale] = buildPath(parent, child);
  }
  return out;
}
