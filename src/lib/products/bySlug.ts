/**
 * Resolve products (Sanity `tour` docs) by SLUG — never by document ID.
 *
 * Product IDs are not derivable from slugs: WordPress imports are
 * `wp-page-89558`, newer imports `tour.<slug>`, and a doc's slug can change
 * after creation. Every lookup that starts from a slug (journey picks, the
 * product "Part of" line, homepage lists, nav prices, review tooling) goes
 * through these fragments so it matches on the slug values themselves.
 *
 * `$slugs` may hold any language's slug (EN, ES or JA): a product matches
 * when any of its localized slugs is in the list. Results are keyed by the
 * EN slug (the stable config key used across the codebase).
 *
 * Client-safe (strings + pure functions only).
 */

/** GROQ filter: published products whose slug (any language) is in $slugs. */
export const PRODUCTS_BY_SLUGS_FILTER = `_type == "tour" && !(_id in path("drafts.**")) && count(slug[value.current in $slugs]) > 0`;

/** GROQ projection: the EN slug (config key). */
export const EN_SLUG = `slug[_key=="en"][0].value.current`;

/** GROQ projection: this language's slug, falling back to EN ($locale param). */
export const LOCAL_SLUG = `coalesce(slug[_key==$locale][0].value.current, slug[_key=="en"][0].value.current)`;

/** Every slug of a product, for matching an input slug back to its row. */
export const ALL_SLUGS = `slug[].value.current`;

/** The EN slug from a doc's `allSlugs` (`slug[]{ _key, current }`) array. */
export function enSlugOf(allSlugs?: Array<{ _key: string; current?: string | null }> | null, fallback?: string | null): string | null {
  return allSlugs?.find((s) => s._key === 'en')?.current ?? fallback ?? null;
}

/** Map input slugs (any language) → the resolved row, using each row's `allSlugs` values. */
export function indexBySlugs<T extends { slugs?: Array<string | null> | null }>(rows: T[], inputs: string[]): Map<string, T> {
  const out = new Map<string, T>();
  for (const input of inputs) {
    const hit = rows.find((r) => (r.slugs ?? []).includes(input));
    if (hit) out.set(input, hit);
  }
  return out;
}
