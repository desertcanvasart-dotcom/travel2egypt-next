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
import { groq } from 'next-sanity';

import { client } from '@/sanity/lib/client';
import { sitemapDocsQuery } from '@/sanity/lib/queries';
import { routing, type Locale } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { finalizeSitemap } from '@/lib/sitemap-policy';
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
  _type: 'article' | 'foodArticle';
  language: string;
  slug: string;
  _updatedAt: string;
}

const SITE = siteUrlBase();

// Re-generate hourly so content-only Sanity changes (new docs, slug fixes,
// retired duplicates) reach the sitemap without waiting for a redeploy.
export const revalidate = 3600;

// Article translation groups (document-level i18n): the translation.metadata
// doc links each language's article. We read it to emit hreflang alternates on
// article sitemap entries, mirroring the on-page <link rel="alternate">.
const articleTranslationGroupsQuery = groq`
  *[_type == "translation.metadata" && count(translations[value->_type in ["article", "foodArticle"]]) > 0]{
    "rows": translations[]{ "language": _key, "slug": value->slug.current, "type": value->_type }
  }
`;

interface TranslationGroup {
  rows: Array<{ language: string | null; slug: string | null; type?: string | null }>;
}

// Static landings that don't come from Sanity.
const STATIC_PATHS: Array<{ path: string; priority?: number }> = [
  { path: '/', priority: 1.0 },
  { path: '/tours', priority: 0.9 },
  { path: '/packages', priority: 0.9 },
  // Commercial category landings. Paths are the EN pathnames keys;
  // buildLocaleUrl → getPathname emits the localized ES/JA leaves declared in
  // routing.ts (e.g. /es/paquetes-de-viaje-a-egipto, /ja/ejiputo-ryoko-pakkeeji).
  // These four were previously absent from the sitemap in every locale.
  { path: '/egypt-travel-packages', priority: 0.9 },
  { path: '/small-group-travel-packages', priority: 0.9 },
  { path: '/private-day-tours', priority: 0.9 },
  { path: '/group-day-tours', priority: 0.9 },
  { path: '/guide', priority: 0.9 },
  // /wiki redirects to /wiki/monuments in v1 (session 31 surgical defer);
  // surface the live landing directly so search engines index that URL.
  { path: '/wiki/monuments', priority: 0.9 },
  { path: '/blog', priority: 0.8 },
  { path: '/travel-tips', priority: 0.7 },
  // FAQ page shipped session 39 (was deferred in session 37).
  { path: '/faq', priority: 0.6 },
  // Top-level company page (session 38) — priority 0.7, a notch above the
  // editorial pages below it.
  { path: '/about', priority: 0.7 },
  { path: '/plan-your-tour', priority: 0.7 },
  { path: '/contact', priority: 0.5 },
  // s47 audit additions (2026-08-18) — live listings/pages that had zero
  // sitemap presence:
  { path: '/hotels', priority: 0.7 },
  { path: '/nile-cruises', priority: 0.7 },
  { path: '/food', priority: 0.7 },
  { path: '/resources', priority: 0.6 },
  { path: '/resources/pyramids-decoded', priority: 0.6 },
  { path: '/resources/pharaoh-timeline', priority: 0.6 },
  { path: '/resources/arabic-lightly', priority: 0.6 },
  { path: '/resources/egyptian-gods', priority: 0.6 },
  // Legal pages (kind-based static routes; their Sanity docs deliberately
  // emit no per-doc sitemap entry — see pathFromDoc legalPage).
  { path: '/privacy-policy', priority: 0.3 },
  { path: '/terms', priority: 0.3 },
  { path: '/cookie-policy', priority: 0.3 },
  { path: '/disclaimer', priority: 0.3 },
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
  // Journey (traveller-type) pages — six editorial pages in EN/ES/JA.
  // Paths are the EN pathnames keys; buildLocaleUrl → getPathname emits the
  // localized ES/JA leaves declared in routing.ts (audit fix: these pages
  // were absent from the sitemap in all locales).
  { path: '/journeys/first-time-in-egypt', priority: 0.7 },
  { path: '/journeys/the-cultural-traveller', priority: 0.7 },
  { path: '/journeys/travelling-as-a-family', priority: 0.7 },
  { path: '/journeys/desert-and-quiet', priority: 0.7 },
  { path: '/journeys/travelling-in-style', priority: 0.7 },
  { path: '/journeys/coming-back', priority: 0.7 },
];

function buildLocaleUrl(path: string, locale: Locale): string {
  // getPathname applies the locale prefix (as-needed) AND localized pathnames
  // for static routes (e.g. /hotels → /ja/hoteru). Dynamic/Sanity paths are
  // unknown to the pathnames map, so they get the prefix only.
  return `${SITE}${getPathname({ href: path, locale })}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [data, translationGroups] = await Promise.all([
    client.fetch<{ localizedDocs: LocalizedDoc[]; articles: ArticleDoc[] }>(
      sitemapDocsQuery
    ),
    client.fetch<TranslationGroup[]>(articleTranslationGroupsQuery),
  ]);

  // "language:slug" → { locale → url, x-default → url } for every article that
  // has at least one translation sibling. Standalone articles aren't indexed
  // here and fall through to a no-alternates entry below.
  const articleAlternates = new Map<string, Record<string, string>>();
  for (const group of translationGroups ?? []) {
    const valid = (group.rows ?? []).filter(
      (r): r is { language: string; slug: string } =>
        Boolean(r.language && r.slug) &&
        routing.locales.includes(r.language as Locale)
    );
    if (valid.length < 2) continue;
    // article → /blog/<slug>; foodArticle → /food/<slug> (s47: food joined
    // the document-per-locale family).
    const base = group.rows?.find((r) => r.type)?.type === 'foodArticle' ? '/food' : '/blog';
    const languages: Record<string, string> = {};
    for (const r of valid) {
      languages[r.language] = buildLocaleUrl(`${base}/${r.slug}`, r.language as Locale);
    }
    const enSlug = valid.find((r) => r.language === 'en')?.slug;
    languages['x-default'] = enSlug
      ? buildLocaleUrl(`${base}/${enSlug}`, 'en')
      : Object.values(languages)[0];
    for (const r of valid) {
      articleAlternates.set(`${r.language}:${r.slug}`, languages);
    }
  }

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
  // Each language doc is its own entry; articles that share a
  // translation.metadata group additionally carry hreflang alternates
  // (built above) so search engines join the language versions.
  for (const article of data.articles) {
    if (!article.slug || !article.language) continue;
    if (!routing.locales.includes(article.language as Locale)) continue;
    const path = pathFromDoc({
      type: article._type ?? 'article',
      slug: article.slug,
    });
    if (!path) continue;
    const languages = articleAlternates.get(
      `${article.language}:${article.slug}`
    );
    entries.push({
      url: buildLocaleUrl(path, article.language as Locale),
      lastModified: new Date(article._updatedAt),
      changeFrequency: 'monthly',
      priority: 0.6,
      ...(languages ? { alternates: { languages } } : {}),
    });
  }

  return finalizeSitemap(entries);
}
