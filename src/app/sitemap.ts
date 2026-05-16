/**
 * Multilingual sitemap.
 *
 * For each (document, locale) pair we emit one entry. Documents whose
 * slugs vary across locales (city, tour, monument, …) get distinct URLs
 * per locale; documents with the same slug across locales share path
 * shape but still get one entry per locale prefix. Articles use
 * document-level i18n (one doc per language) so each language version is
 * its own entry.
 *
 * `alternates.languages` is included on each entry so search engines
 * understand the language relationships without requiring on-page
 * <link rel="alternate" hreflang> alone.
 *
 * /studio is excluded by virtue of not being listed.
 */

import type { MetadataRoute } from 'next';

import { client } from '@/sanity/lib/client';
import { sitemapDocsQuery } from '@/sanity/lib/queries';
import { routing, type Locale } from '@/i18n/routing';
import {
  pathFromDoc,
  siteUrlBase,
  type SitemapDocType,
} from '@/lib/path-from-doc';

interface LocalizedDoc {
  _id: string;
  _type: string;
  _updatedAt: string;
  slugs?: Array<{ _key: string; current: string }>;
  tourType?: 'dayTour' | 'package' | null;
  parentCitySlugs?: Array<{ _key: string; current: string }> | null;
}

interface ArticleDoc {
  _id: string;
  language: string;
  slug: string;
  _updatedAt: string;
}

const SITE = siteUrlBase();

// Static landings that don't come from Sanity.
const STATIC_PATHS: Array<{ path: string; priority?: number }> = [
  { path: '/', priority: 1.0 },
  { path: '/tours', priority: 0.9 },
  { path: '/packages', priority: 0.9 },
  { path: '/guide', priority: 0.9 },
  // /wiki redirects to /wiki/monuments in v1 (session 31 surgical defer);
  // surface the live landing directly so search engines index that URL.
  { path: '/wiki/monuments', priority: 0.9 },
  { path: '/blog', priority: 0.8 },
  { path: '/travel-tips', priority: 0.7 },
  { path: '/faq', priority: 0.6 },
  { path: '/about', priority: 0.6 },
  { path: '/contact', priority: 0.5 },
  // Name-in-hieroglyphs translator (session 32). Preserves SEO equity from
  // WP /your-name-in-hieroglyphics/ via a 301 set up at cutover.
  { path: '/your-name-in-hieroglyphs', priority: 0.8 },
  // Distance-between-cities tool (session 33). Slug preserved exactly from
  // legacy WP URL — no redirect needed.
  { path: '/distance-between-egyptian-cities', priority: 0.8 },
  // Hotel Grade Concept editorial + tier columns (session 34). Slug
  // preserved exactly from legacy WP URL.
  { path: '/hotel-grade-concept', priority: 0.7 },
  // Responsible Travel editorial (session 36). Slug preserved exactly
  // from legacy WP URL — captures ~1814 sessions of historical SEO equity.
  { path: '/responsible-travel', priority: 0.6 },
];

function buildLocaleUrl(path: string, locale: Locale): string {
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  return `${SITE}${localePrefix}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data: { localizedDocs: LocalizedDoc[]; articles: ArticleDoc[] } =
    await client.fetch(sitemapDocsQuery);

  const entries: MetadataRoute.Sitemap = [];

  // ── Static landings: one entry per locale, with hreflang alternates ──
  for (const item of STATIC_PATHS) {
    for (const locale of routing.locales) {
      const url = buildLocaleUrl(item.path, locale as Locale);
      const languages: Record<string, string> = {};
      for (const altLocale of routing.locales) {
        languages[altLocale] = buildLocaleUrl(item.path, altLocale as Locale);
      }
      languages['x-default'] = buildLocaleUrl(item.path, 'en');
      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: item.priority,
        alternates: { languages },
      });
    }
  }

  // ── Localized-slug docs ──
  for (const doc of data.localizedDocs) {
    const enSlug = doc.slugs?.find((s) => s._key === 'en')?.current;
    if (!enSlug) continue;

    const enParentCity = doc.parentCitySlugs?.find((s) => s._key === 'en')
      ?.current;

    // Build the per-locale URL map for this single doc.
    const urlsByLocale: Record<string, string> = {};
    for (const locale of routing.locales) {
      const slug =
        doc.slugs?.find((s) => s._key === locale)?.current ?? enSlug;
      const parentCitySlug =
        doc.parentCitySlugs?.find((s) => s._key === locale)?.current ??
        enParentCity ??
        null;
      const path = pathFromDoc({
        type: doc._type as SitemapDocType,
        slug,
        parentCitySlug,
        tourType: doc.tourType,
      });
      if (path) urlsByLocale[locale] = buildLocaleUrl(path, locale as Locale);
    }

    if (Object.keys(urlsByLocale).length === 0) continue;

    for (const locale of routing.locales) {
      const url = urlsByLocale[locale];
      if (!url) continue;
      entries.push({
        url,
        lastModified: new Date(doc._updatedAt),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: {
          languages: {
            ...urlsByLocale,
            'x-default': urlsByLocale['en'] ?? url,
          },
        },
      });
    }
  }

  // ── Articles (document-level i18n) ──
  // Group by slug-equivalence across languages — for now we treat each
  // language doc as standalone. The translation.metadata document links
  // them in the Studio but isn't queried here; that's a follow-up if we
  // want article entries to carry hreflang alternates.
  for (const article of data.articles) {
    if (!article.slug || !article.language) continue;
    if (!routing.locales.includes(article.language as Locale)) continue;
    const path = pathFromDoc({
      type: 'article',
      slug: article.slug,
    });
    if (!path) continue;
    entries.push({
      url: buildLocaleUrl(path, article.language as Locale),
      lastModified: new Date(article._updatedAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}
