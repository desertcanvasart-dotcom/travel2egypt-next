import type { Locale } from '@/i18n/routing';
import { pathFromDoc, type SitemapDocType } from '@/lib/path-from-doc';
import { isRobotsDisallowed } from '@/lib/robotsPolicy';

/**
 * Pure link-map resolution + indexability guard (no Sanity / network imports,
 * so it is unit-testable in isolation). The loader does the Sanity fetch and
 * caching; this module decides each entry's locale-correct URL or omission.
 */

/** A resolved, indexable link-map entry for one locale. */
export interface LinkMapEntry {
  canonicalName: string;
  /** Shared (not locale-scoped) — the schema's flat `aliases[]`. Curate to
      avoid cross-language homographs (e.g. ES "File" = EN "file"). */
  aliases: string[];
  url: string;
}

/** Raw entry as projected from Sanity (slug already locale-resolved). */
export interface RawLinkEntry {
  canonicalName?: string | null;
  aliases?: (string | null)[] | null;
  type?: string | null;
  slug?: string | null;
  parentCitySlug?: string | null;
}

/** v1 link targets only (build brief deliverable 2). */
export const V1_TYPES: readonly string[] = ['wikiMonument', 'guideArticle'];

export function localePrefix(locale: Locale): string {
  return locale === 'en' ? '' : `/${locale}`;
}

/**
 * Raw entry + locale → locale-correct in-site URL, or `null` to OMIT. Omits:
 * off-scope target type; no slug in this locale; missing guideArticle
 * parent-city slug; robots-disallowed (noindex) target.
 */
export function resolveEntryUrl(entry: RawLinkEntry, locale: Locale): string | null {
  const type = entry.type;
  if (!type || !V1_TYPES.includes(type)) return null;
  if (!entry.slug) return null; // no slug in the active locale → omit
  const path = pathFromDoc({
    type: type as SitemapDocType,
    slug: entry.slug,
    parentCitySlug: entry.parentCitySlug ?? null,
  });
  if (!path) return null; // e.g. guideArticle with no parent-city slug this locale
  if (isRobotsDisallowed(path)) return null; // indexability guard (robots SSOT)
  return `${localePrefix(locale)}${path}`;
}

/** Resolve a raw entry to a usable LinkMapEntry, or null to drop it. */
export function toLinkMapEntry(raw: RawLinkEntry, locale: Locale): LinkMapEntry | null {
  const url = resolveEntryUrl(raw, locale);
  const name = raw.canonicalName?.trim();
  if (!url || !name) return null;
  const aliases = (raw.aliases ?? []).filter(
    (a): a is string => typeof a === 'string' && a.trim().length > 0,
  );
  return { canonicalName: name, aliases, url };
}
