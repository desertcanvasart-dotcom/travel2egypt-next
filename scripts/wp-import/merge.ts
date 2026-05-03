/**
 * Q3 unified merge rule: WP overwrites where WP has a value; everything else
 * stays as-is. Pure function; testable; no Sanity / WP IO.
 *
 * The merge applies to a single Sanity doc (e.g. one `city` document with
 * field-level i18n arrays). The four sub-decisions from Q3 (Islam,
 * 2026-04-28):
 *
 *   1. Field WP has → overwrite Sanity with WP value
 *   2. Field WP doesn't have → leave Sanity untouched
 *   3. Field not in WP schema (editorial-only) → always leave untouched
 *   4. Locale slot WP doesn't have → leave that slot untouched (do NOT blank)
 *
 * Sub-decision 5 (seed cities not in WP) is handled at the orchestrator
 * level, not here. If the orchestrator never calls merge for that city, its
 * Sanity state remains as-is.
 *
 * Sub-decision Q3.1 (placesToGo out of scope) is enforced by listing the
 * field in EDITORIAL_ONLY_FIELDS — even if a WP source contained
 * placesToGo-shaped data, this merge would not propagate it.
 *
 * Field categorization rules:
 *   - `editorialOnly`: field is never sourced from WP. Always preserved.
 *   - `migrationSourced`: field is sourced from WP. Q3 rules 1/2 apply.
 *   - i18n arrays: per-locale slot rule (Q3 rule 4) applies element-wise.
 *
 * This module is intentionally narrow: it knows the city merge contract,
 * not the city schema. Fixtures in __tests__/merge.test.ts cover the five
 * cases in DOC 3 step 2.
 */

/** Generic Sanity doc shape — typed loosely so the merge contract is enforced
 * by tests rather than the type system. The merge function does not mutate
 * either input. */
export type SanityDoc = Record<string, unknown> & { _id?: string; _type?: string };

/** Field-level i18n array entry shape: `[{ _key: 'en', value: ... }, ...]`. */
export interface I18nEntry {
  _key: string;
  value: unknown;
  _type?: string;
}

/** Editorial-only fields on `city` that the city mapper never writes.
 *
 * `placesToGo` is out of scope for session 5 per Q3.1; including it here as
 * editorial-only ensures any future stray attempt to set it from the mapper
 * still falls back to "preserve Sanity" instead of overwriting.
 *
 * `coordinates`, `region`, `orderRank` are seed-only fields.
 *
 * Schema reference: `src/sanity/schemas/city.ts`. */
export const CITY_EDITORIAL_ONLY_FIELDS: readonly string[] = [
  'placesToGo',
  'coordinates',
  'region',
  'orderRank',
  'gallery',
] as const;

/** Editorial-only fields on `article` (document-level i18n).
 *
 * `author` and `category` are mapper-produced **acknowledged-defaults**, not
 * canonical assignments: the article mapper writes `author = legacy-archive`
 * unconditionally and a 2-bucket `category` from a slug heuristic. Editorial
 * reassignment in Studio is the canonical authority. Treating these as
 * editorial-only means the CREATE-first run seeds them and UPDATE re-imports
 * preserve whatever editorial state has overlaid them. This is the field-
 * classification principle the session 6 brief locked: provenance authority,
 * not mapper-produces-or-not.
 *
 * `featured`, `updatedAt`, `relatedArticles`, `relatedTours`, `relatedCities`
 * the mapper never writes — pure editorial fields.
 *
 * Schema reference: `src/sanity/schemas/article.ts`. */
export const ARTICLE_EDITORIAL_ONLY_FIELDS: readonly string[] = [
  'author',
  'category',
  'featured',
  'updatedAt',
  'relatedArticles',
  'relatedTours',
  'relatedCities',
] as const;

/** Editorial-only fields on `guideArticle` (field-level i18n).
 *
 * `section` is a mapper-produced acknowledged-default from the classifier's
 * `inferredSection`. Phase 3 of session 6 explicitly assigns sections for the
 * 27 deferred `*-egypt` slugs; treating section as editorial-only ensures
 * those triage decisions survive session 6.5 re-imports. The same provenance
 * principle as article.author / article.category.
 *
 * `orderRank`, `relatedTours`, `seo` the mapper does not produce.
 *
 * Schema reference: `src/sanity/schemas/guideArticle.ts`. */
export const GUIDE_ARTICLE_EDITORIAL_ONLY_FIELDS: readonly string[] = [
  'section',
  'orderRank',
  'relatedTours',
  'seo',
] as const;

/** Internal shape for a single field's merge outcome — surfaced to the
 * orchestrator for fingerprint generation and for the diff summary table. */
export interface PerFieldChange {
  field: string;
  /**
   *  - `created`: field was absent in Sanity, WP supplied. (CREATE-first run.)
   *  - `overwritten`: field present in both, WP value used.
   *  - `preserved-no-wp`: field present in Sanity, WP didn't supply.
   *  - `preserved-editorial-only`: field is in CITY_EDITORIAL_ONLY_FIELDS.
   *  - `i18n-merged`: i18n array; some locale slots overwritten, others preserved.
   *    `localesTouched` enumerates which slots WP supplied.
   *  - `unchanged`: identical value on both sides.
   */
  outcome:
    | 'created'
    | 'overwritten'
    | 'preserved-no-wp'
    | 'preserved-editorial-only'
    | 'i18n-merged'
    | 'unchanged';
  localesTouched?: string[];
}

/** Type guard for an i18n entry array. */
function isI18nArray(v: unknown): v is I18nEntry[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((e) => typeof e === 'object' && e !== null && '_key' in e && typeof (e as I18nEntry)._key === 'string')
  );
}

/** Merge a WP-derived doc onto an existing Sanity doc per Q3 rules.
 *
 * @param existing - current Sanity state. `null` for CREATE-first scenarios.
 * @param wp - WP-derived candidate doc (the output of the city mapper).
 * @param editorialOnlyFields - field names the merge will never overwrite.
 * @returns merged doc (the actual write payload) + per-field outcome list.
 *
 * Behaviour:
 * - `_id`, `_type` always taken from `wp` (matching the mapper's deterministic IDs).
 * - For each field in `wp`:
 *     - If listed in `editorialOnlyFields` → ignored (preserved-editorial-only).
 *     - If `existing[field]` is undefined → field is set from `wp[field]` (created).
 *     - If both are i18n arrays → element-wise merge by `_key` (i18n-merged or unchanged).
 *     - Otherwise → `wp[field]` wins (overwritten or unchanged).
 * - For each field in `existing` not present in `wp` → preserved-no-wp.
 * - For each field in `existing` listed as editorial-only → preserved-editorial-only,
 *   even if `wp` also supplied it (defensive).
 */
export function mergeCityDoc(
  existing: SanityDoc | null,
  wp: SanityDoc,
  editorialOnlyFields: readonly string[] = CITY_EDITORIAL_ONLY_FIELDS,
): { merged: SanityDoc; perFieldChanges: PerFieldChange[] } {
  const editorialSet = new Set(editorialOnlyFields);
  const merged: SanityDoc = {};
  const changes: PerFieldChange[] = [];

  // Always start from existing (preserve everything we don't explicitly overwrite).
  if (existing) {
    for (const k of Object.keys(existing)) merged[k] = existing[k];
  }

  // _id and _type come from WP / mapper output — same value as existing in steady state,
  // but on first CREATE they're the only source.
  if (wp._id !== undefined) merged._id = wp._id;
  if (wp._type !== undefined) merged._type = wp._type;

  // Walk WP fields applying Q3 rules.
  const wpKeys = Object.keys(wp).filter((k) => k !== '_id' && k !== '_type');
  const handledKeys = new Set<string>();
  for (const field of wpKeys) {
    handledKeys.add(field);
    if (editorialSet.has(field)) {
      // Editorial-only contract: WP cannot OVERWRITE a value the editor has set.
      // On CREATE-first (existing has no value yet) the WP value is allowed to
      // seed the field — this is the "acknowledged-default" semantics for
      // mapper-produced fields like article.author / article.category /
      // guideArticle.section: mapper writes a heuristic default to satisfy
      // schema requirements; once an editor overlays canonical authority, the
      // editorial value sticks across re-imports.
      const existingHasValue = existing && existing[field] !== undefined;
      if (existingHasValue) {
        changes.push({ field, outcome: 'preserved-editorial-only' });
        continue;
      }
      merged[field] = wp[field];
      changes.push({ field, outcome: 'created' });
      continue;
    }
    const wpVal = wp[field];
    const existingVal = existing?.[field];

    if (existingVal === undefined) {
      merged[field] = wpVal;
      changes.push({ field, outcome: 'created' });
      continue;
    }

    if (isI18nArray(wpVal) && isI18nArray(existingVal)) {
      const { merged: mergedI18n, localesTouched, anyChange } = mergeI18nArray(existingVal, wpVal);
      merged[field] = mergedI18n;
      if (localesTouched.length === 0) {
        changes.push({ field, outcome: 'unchanged' });
      } else if (anyChange) {
        changes.push({ field, outcome: 'i18n-merged', localesTouched });
      } else {
        changes.push({ field, outcome: 'unchanged' });
      }
      continue;
    }

    if (deepEqual(wpVal, existingVal)) {
      merged[field] = existingVal;
      changes.push({ field, outcome: 'unchanged' });
    } else {
      merged[field] = wpVal;
      changes.push({ field, outcome: 'overwritten' });
    }
  }

  // Surface fields present in existing but not in wp (preserved-no-wp).
  if (existing) {
    for (const field of Object.keys(existing)) {
      if (field === '_id' || field === '_type') continue;
      if (handledKeys.has(field)) continue;
      if (editorialSet.has(field)) {
        changes.push({ field, outcome: 'preserved-editorial-only' });
      } else {
        changes.push({ field, outcome: 'preserved-no-wp' });
      }
    }
  }

  return { merged, perFieldChanges: changes.sort((a, b) => a.field.localeCompare(b.field)) };
}

/** Element-wise merge of two i18n arrays by `_key`.
 *
 * For every entry in `wp`: overwrite the matching `_key` in `existing`.
 * For every entry in `existing` whose `_key` is NOT in `wp`: preserve it.
 *
 * `localesTouched` enumerates which `_key`s came from WP (overwrote or
 * created). `anyChange` is true if any locale slot's value differs from
 * what existing held. */
function mergeI18nArray(
  existing: I18nEntry[],
  wp: I18nEntry[],
): { merged: I18nEntry[]; localesTouched: string[]; anyChange: boolean } {
  const wpByKey = new Map<string, I18nEntry>();
  for (const e of wp) wpByKey.set(e._key, e);
  const existingByKey = new Map<string, I18nEntry>();
  for (const e of existing) existingByKey.set(e._key, e);

  const localesTouched: string[] = [];
  let anyChange = false;
  const out: I18nEntry[] = [];
  // Ensure deterministic order: union of keys, sorted alphabetically.
  const allKeys = new Set<string>([...existingByKey.keys(), ...wpByKey.keys()]);
  for (const key of [...allKeys].sort()) {
    const wpE = wpByKey.get(key);
    const existE = existingByKey.get(key);
    if (wpE !== undefined) {
      out.push(wpE);
      localesTouched.push(key);
      if (!existE || !deepEqual(existE.value, wpE.value)) anyChange = true;
    } else if (existE !== undefined) {
      out.push(existE);
    }
  }
  return { merged: out, localesTouched, anyChange };
}

/** Structural equality. Sufficient for our payloads (JSON-shaped). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const ak = Object.keys(ao).sort();
    const bk = Object.keys(bo).sort();
    if (ak.length !== bk.length) return false;
    for (let i = 0; i < ak.length; i++) {
      if (ak[i] !== bk[i]) return false;
      if (!deepEqual(ao[ak[i]], bo[bk[i]])) return false;
    }
    return true;
  }
  return false;
}

/** Canonicalize a doc for fingerprinting / diffing. Returns a string with
 * deterministic key ordering AND with noise-key stripping (PT block/span
 * `_key` values are random hex generated per pipeline run; they're stable
 * identifiers for React rendering but content-irrelevant for diff). Locale
 * `_key`s on i18n array entries (`'en'`, `'es'`, `'ja'`) are PRESERVED —
 * those carry semantic meaning. */
export function canonicalize(doc: SanityDoc | unknown): string {
  return JSON.stringify(sortKeys(stripNoiseKeys(doc)), null, 2);
}

/** Locale-code _key values that are part of the schema's i18n contract.
 * These must NOT be stripped by canonicalize. Any other _key (random hex
 * from PT block/span generation) is noise for diff/fingerprint purposes. */
const LOCALE_KEYS = new Set(['en', 'es', 'ja', 'x-default']);

/** Run-volatile fields. These differ on every mapper run by design and are
 * not semantic-content drift. The drift-assertion protocol catches real
 * diff/write divergences; these fields would be false positives.
 *
 * - `migratedAt`: timestamp of the mapper run (always changes per run).
 *
 * If you find yourself adding to this list, ask whether the field is
 * actually semantic content or pipeline metadata. Semantic content stays
 * in the canonical form. Pipeline metadata is excluded. */
const RUN_VOLATILE_KEYS = new Set(['migratedAt']);

/** Strip noise from canonical output:
 *   - Random `_key` strings (PT block/span/markDef IDs) — replaced with
 *     deterministic counter values upstream, but defensively stripped here
 *     in case any survive.
 *   - Locale `_key`s on i18n array entries are PRESERVED (en/es/ja carry
 *     semantic meaning).
 *   - Run-volatile fields (`migratedAt`) — stripped because they always
 *     differ across mapper runs, polluting the drift assertion.
 */
function stripNoiseKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripNoiseKeys);
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj)) {
      if (k === '_key' && typeof obj[k] === 'string' && !LOCALE_KEYS.has(obj[k] as string)) continue;
      if (RUN_VOLATILE_KEYS.has(k)) continue;
      out[k] = stripNoiseKeys(obj[k]);
    }
    return out;
  }
  return v;
}

/**
 * Minimal Sanity-client shape for `applyCityMerge`. The full @sanity/client
 * type has many methods we don't need; carving out just `fetch` keeps this
 * helper testable with a tiny mock object.
 */
export interface MergeFetcher {
  fetch<T = unknown>(query: string, params?: Record<string, unknown>): Promise<T>;
}

/**
 * Q3 merge for an `article` doc. Thin facade — mergeCityDoc is generic via
 * the editorialOnlyFields parameter; the named wrapper makes the call site
 * read like its provenance.
 */
export function mergeArticleDoc(
  existing: SanityDoc | null,
  wp: SanityDoc,
): { merged: SanityDoc; perFieldChanges: PerFieldChange[] } {
  return mergeCityDoc(existing, wp, ARTICLE_EDITORIAL_ONLY_FIELDS);
}

/**
 * Q3 merge for a `guideArticle` doc. Thin facade — see mergeArticleDoc.
 */
export function mergeGuideArticleDoc(
  existing: SanityDoc | null,
  wp: SanityDoc,
): { merged: SanityDoc; perFieldChanges: PerFieldChange[] } {
  return mergeCityDoc(existing, wp, GUIDE_ARTICLE_EDITORIAL_ONLY_FIELDS);
}

/**
 * Single source of truth for which `_type` values get Q3 merge protection.
 * Maps the Sanity doc type to its editorial-only field list. Used by both
 * `applyMerge` (the dispatcher) and `isMergeableType` (the predicate the
 * write path uses to decide whether to call the dispatcher).
 *
 * To extend with a new mergeable type: add the type's
 * `EDITORIAL_ONLY_FIELDS` constant above, add an entry here, and the
 * write path picks it up automatically.
 */
const MERGE_REGISTRY: Record<string, readonly string[]> = {
  city: CITY_EDITORIAL_ONLY_FIELDS,
  article: ARTICLE_EDITORIAL_ONLY_FIELDS,
  guideArticle: GUIDE_ARTICLE_EDITORIAL_ONLY_FIELDS,
};

/**
 * Predicate the write path uses to decide whether to dispatch through
 * `applyMerge`. Doc types not in the registry (editorialCategory,
 * translation.metadata, etc.) skip merge entirely and are written via raw
 * createOrReplace — they have no editorial-only fields to preserve.
 */
export function isMergeableType(type: string | undefined): boolean {
  return type !== undefined && Object.prototype.hasOwnProperty.call(MERGE_REGISTRY, type);
}

/**
 * Single dispatcher for all Q3-protected merges. Replaces the per-type
 * `applyCityMerge` pattern: the write path calls `applyMerge(sanity, doc)`
 * and the registry routes to the right field list.
 *
 * Loud-failure contract (methodology lesson 1): if called with a `_type`
 * not in `MERGE_REGISTRY`, this throws. The registry itself is now a
 * safety-net component — silently falling back to "no merge protection"
 * is exactly the failure mode that the registry exists to prevent. The
 * write path must gate its call with `isMergeableType` first.
 *
 * Without this helper, `client.createOrReplace(mapperDoc)` would clobber
 * editorial-only fields (city.region, article.author, guideArticle.section,
 * etc.). The bug class surfaced in session 5: the `--dry-run-diff-only`
 * path used mergeCityDoc, but the live write path used raw createOrReplace
 * and silently lost editorial state.
 */
export async function applyMerge(
  fetcher: MergeFetcher,
  mapperDoc: SanityDoc,
): Promise<{ merged: SanityDoc; perFieldChanges: PerFieldChange[] }> {
  const type = mapperDoc._type;
  if (!type || !Object.prototype.hasOwnProperty.call(MERGE_REGISTRY, type)) {
    throw new Error(
      `applyMerge: no merge handler registered for _type=${JSON.stringify(type)}. ` +
        `Registered types: ${Object.keys(MERGE_REGISTRY).join(', ')}. ` +
        `If this is a new doc type that should be merge-protected, add its ` +
        `EDITORIAL_ONLY_FIELDS to scripts/wp-import/merge.ts MERGE_REGISTRY. ` +
        `If it should bypass merge entirely, gate the call site with isMergeableType.`,
    );
  }
  if (!mapperDoc._id) {
    throw new Error(`applyMerge: mapperDoc lacks _id (type=${type}). Cannot fetch existing.`);
  }
  const editorialOnlyFields = MERGE_REGISTRY[type];
  const existing = await fetcher.fetch<SanityDoc | null>(`*[_id == $id][0]`, { id: mapperDoc._id });
  return mergeCityDoc(existing ?? null, mapperDoc, editorialOnlyFields);
}

/**
 * Backward-compatible facade for the city-specific merge entry. The
 * `wp-import-diff.ts` diff path imports this directly. New code should use
 * `applyMerge` + `isMergeableType` instead.
 */
export async function applyCityMerge(
  fetcher: MergeFetcher,
  mapperDoc: SanityDoc,
): Promise<{ merged: SanityDoc; perFieldChanges: PerFieldChange[] }> {
  if (mapperDoc._type !== 'city') {
    // Defensive: callers passed mapperDoc through this city-specific facade.
    // Returning verbatim preserves prior behavior (no merge, no throw).
    return { merged: mapperDoc, perFieldChanges: [] };
  }
  if (!mapperDoc._id) {
    return { merged: mapperDoc, perFieldChanges: [] };
  }
  return applyMerge(fetcher, mapperDoc);
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) out[k] = sortKeys(obj[k]);
    return out;
  }
  return v;
}
