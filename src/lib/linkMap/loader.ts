import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';

import { toLinkMapEntry, type LinkMapEntry, type RawLinkEntry } from './resolve';

/**
 * Concierge link-map loader (locked model: load + validate the team-curated
 * `conciergeLinkMap` singleton, NOT document aggregation).
 *
 * Resolves curated entries to locale-correct, INDEXABLE in-site URLs for the
 * runtime entity-wrapping post-processor. The agent prompt is never touched.
 * v1 scope (wikiMonument + guideArticle) + indexability guard live in
 * ./resolve (pure). No slug in the active locale → entry omitted.
 */

export type { LinkMapEntry } from './resolve';

// locale is a controlled value (en/es), interpolated like the repo's other
// localized GROQ; not user input.
const linkMapQuery = (locale: Locale) => `
  *[_type == "conciergeLinkMap"][0].entries[ target->_type in ["wikiMonument","guideArticle"] ]{
    canonicalName,
    aliases,
    "type": target->_type,
    "slug": target->slug[_key == "${locale}"][0].value.current,
    "parentCitySlug": target->parentCity->slug[_key == "${locale}"][0].value.current
  }
`;

// Small per-locale TTL cache — the curated singleton changes rarely, so this
// avoids a Sanity round-trip on every concierge page render. (Webhook-driven
// revalidation is a future enhancement; a short TTL suffices for a hand-curated
// map.) Module-level → persists across requests on Railway's long-lived process.
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; map: LinkMapEntry[] }>();

export async function loadResolvedLinkMap(locale: Locale): Promise<LinkMapEntry[]> {
  const hit = cache.get(locale);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.map;
  let map: LinkMapEntry[] = [];
  try {
    const raw = (await client.fetch<RawLinkEntry[] | null>(linkMapQuery(locale))) ?? [];
    map = raw
      .map((r) => toLinkMapEntry(r, locale))
      .filter((e): e is LinkMapEntry => e !== null);
  } catch {
    map = []; // a link-map load failure must never break chat rendering
  }
  cache.set(locale, { at: Date.now(), map });
  return map;
}

/** Test-only: clear the TTL cache between cases. */
export function __clearLinkMapCache(): void {
  cache.clear();
}
