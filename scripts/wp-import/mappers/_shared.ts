/**
 * Shared helpers used by every entity mapper.
 */

import { parse } from 'node-html-parser';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SanityClient } from '@sanity/client';

import { htmlToPortableText, type PtBlock } from '../../wp-import-html.js';
import type { WpClient } from '../wp-client.js';
import { ensureAssetUploaded } from '../media.js';
import { titleToRomajiSlug } from './_romaji.js';
import type {
  I18nSlug,
  I18nString,
  Locale,
  LocaleGroup,
  MigrationMetadata,
  RedirectEntry,
  ReviewFlag,
  WpEntityFull,
} from '../types.js';

export const NOW = () => new Date().toISOString();

/** Strip HTML, decode entities, collapse whitespace. */
export function plainText(html: string | undefined | null): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function decodeTitle(html: string | undefined): string {
  return plainText(html ?? '');
}

/** Build a field-level i18n string field. Skips locales with empty values. */
export function i18nString(group: LocaleGroup, pick: (e: WpEntityFull) => string): I18nString {
  const out: I18nString = [];
  if (group.en && pick(group.en)) out.push({ _key: 'en', value: pick(group.en) });
  if (group.es && pick(group.es)) out.push({ _key: 'es', value: pick(group.es) });
  if (group.ja && pick(group.ja)) out.push({ _key: 'ja', value: pick(group.ja) });
  return out;
}

export function i18nSlug(group: LocaleGroup): I18nSlug {
  const out: I18nSlug = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (e?.slug) out.push({ _key: loc, value: { _type: 'slug', current: decodeURIComponent(e.slug) } });
  }
  return out;
}

// ─── JA slug override + romanization (consumed by article.ts + travelTip.ts) ──

interface JaSlugOverrideValue { slug: string; reason?: string; }
type JaSlugOverrides = Record<string, string | JaSlugOverrideValue>;

let _jaSlugOverrides: JaSlugOverrides | null = null;
const JA_SLUG_OVERRIDES_PATH = resolve(process.cwd(), 'migration/ja-slug-overrides.json');

function loadJaSlugOverrides(): JaSlugOverrides {
  if (_jaSlugOverrides !== null) return _jaSlugOverrides;
  if (!existsSync(JA_SLUG_OVERRIDES_PATH)) { _jaSlugOverrides = {}; return _jaSlugOverrides; }
  const raw = readFileSync(JA_SLUG_OVERRIDES_PATH, 'utf8').trim();
  if (!raw) { _jaSlugOverrides = {}; return _jaSlugOverrides; }
  _jaSlugOverrides = JSON.parse(raw) as JaSlugOverrides;
  return _jaSlugOverrides;
}

function jaSlugOverride(overrideKey: string): string | null {
  const v = loadJaSlugOverrides()[overrideKey];
  if (!v) return null;
  return typeof v === 'string' ? v : v.slug;
}

/**
 * Derive the JA slug for a doc — override-first, algorithmic fallback.
 * Caller passes the Sanity _id (or equivalent unique key) for override lookup.
 * Requires initRomaji() to have been called at process startup.
 */
export async function deriveJaSlug(jaTitle: string, overrideKey: string): Promise<string> {
  const ov = jaSlugOverride(overrideKey);
  if (ov !== null) return ov;
  return titleToRomajiSlug(jaTitle);
}

/**
 * Field-level i18n slug array, with the JA entry produced via the romaji
 * helper (override-first, algorithmic fallback). EN/ES use decodeURIComponent
 * of the WP source slug, identical to i18nSlug().
 *
 * Caller passes the override key for the JA entry — typically the Sanity _id.
 * For travelTip (single doc, no -ja suffix), pass `wp-page-${en.id}`.
 *
 * Throws if the JA entry has a slug but no title — required to avoid
 * silently falling back to the Japanese-character WP slug (the bug §4.2
 * this session closed). Resolve by fixing the JA title upstream, or by
 * adding an override entry to migration/ja-slug-overrides.json.
 */
export async function i18nSlugWithJaRomaji(
  group: LocaleGroup,
  jaOverrideKey: string
): Promise<I18nSlug> {
  const out: I18nSlug = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e?.slug) continue;
    if (loc === 'ja') {
      if (!e.title?.rendered) {
        throw new Error(
          `[i18nSlugWithJaRomaji] JA entry has slug but no title for override key '${jaOverrideKey}'. ` +
          `Cannot derive romaji slug without title input. ` +
          `Resolution: (1) fix the JA title upstream in WP, OR (2) add an entry to migration/ja-slug-overrides.json keyed by '${jaOverrideKey}' with a manually-chosen slug.`
        );
      }
      const jaTitle = decodeTitle(e.title.rendered);
      const slug = await deriveJaSlug(jaTitle, jaOverrideKey);
      out.push({ _key: 'ja', value: { _type: 'slug', current: slug } });
    } else {
      out.push({ _key: loc, value: { _type: 'slug', current: decodeURIComponent(e.slug) } });
    }
  }
  return out;
}

/** Build per-locale Portable Text (one PT array per locale). */
export function i18nBody(group: LocaleGroup, fieldName = 'body'): Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }> {
  const out: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }> = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e?.content?.rendered) continue;
    const result = htmlToPortableText(e.content.rendered, { locale: loc });
    out.push({ _key: loc, _type: 'object', value: result.blocks });
  }
  void fieldName;
  return out;
}

/** Combined HTML→PT stats summed across all locales of a group. */
export function summedHtmlStats(group: LocaleGroup) {
  const stats = {
    operatorNotes: 0, pullQuotes: 0, sideImages: 0, images: 0, tablesFlattened: 0, pendingInternalLinks: 0,
    tourPromoStripped: 0, categoryGridStripped: 0, backlinkStripped: 0,
    carouselSwiperStripped: 0, carouselPremiumAdvStripped: 0, bdtImgStripped: 0,
    titleH1Stripped: 0, metadataLineStripped: 0, sectionNavBlockStripped: 0,
    crossPromoTailStripped: 0,
    linkMarkConvertedToPendingRef: 0, linkMarkKeptAsExternal: 0,
    linkMarkStrippedMalformed: 0, linkMarkStrippedAnchor: 0, linkMarkStrippedMailto: 0,
  };
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e?.content?.rendered) continue;
    const r = htmlToPortableText(e.content.rendered, { locale: loc });
    for (const k of Object.keys(stats) as Array<keyof typeof stats>) stats[k] += r.stats[k];
  }
  return stats;
}

export function buildMigrationMeta(
  group: LocaleGroup,
  reviewFlag?: ReviewFlag,
  extras?: Partial<Pick<MigrationMetadata, 'cityResolution' | 'themeMatchedPattern' | 'matrixViolation' | 'durationDaysSource'>>
): MigrationMetadata {
  const en = group.en;
  return {
    wpId: en.id,
    wpUrl: en.link,
    wpModifiedAt: en.modified_gmt ?? en.modified,
    wpTemplate: en.template ?? null,
    migratedAt: NOW(),
    source: 'wp-import',
    ...(reviewFlag ? { reviewFlag } : {}),
    ...(extras ?? {}),
  };
}

/** Build redirect entries for an entity (one per locale present in the group). */
export function buildRedirects(
  group: LocaleGroup,
  toPathBuilder: (locale: Locale, slug: string) => string,
  priorityScore: number
): RedirectEntry[] {
  const entries: RedirectEntry[] = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e) continue;
    const path = toPathBuilder(loc, e.slug);
    if (!path) continue;
    entries.push({
      from_url: e.link,
      to_path: path,
      locale: loc,
      status_code: 301,
      legacy_wp_id: e.id,
      priority_score: priorityScore,
    });
  }
  return entries;
}

/**
 * Pre-scan a body HTML string for inline `<img>` tags carrying a
 * `wp-image-{ID}` class, upload each attachment to Sanity (idempotent), and
 * return a resolver that maps the `<img src>` URL to the uploaded Sanity
 * asset _id. Pass the resolver to `htmlToPortableText({ attachmentResolver })`.
 *
 * Why class-based: WP renders body images with `class="wp-image-{ID}"` —
 * the source-of-truth attachment ID. Avoids round-tripping the WP REST API
 * with /media?search=<filename> just to find an attachment from a URL.
 */
export async function prepareBodyImageResolver(
  client: SanityClient,
  wp: WpClient,
  html: string,
  opts: { dryRun?: boolean; referrerSlug?: string; referrerLocale?: string } = {}
): Promise<{ resolver: (src: string) => string | null; uploaded: number; duplicateSrcRemappings: number }> {
  if (!html) return { resolver: () => null, uploaded: 0, duplicateSrcRemappings: 0 };
  const root = parse(html, { lowerCaseTagName: false });
  const map = new Map<string, string>(); // src URL → Sanity asset _id
  // The same WP attachment can render under multiple <img src> URLs in one
  // body (http vs https, with/without size suffix, classic-editor vs
  // block-editor). Track wpId → assetId so subsequent occurrences resolve to
  // the same asset instead of being skipped as "already seen" (which would
  // leave them as _pendingImage in the output).
  const wpIdToAsset = new Map<number, string>();
  let uploaded = 0;
  let duplicateSrcRemappings = 0;

  // Pass 1: class-based resolution (preferred — direct attachment ID).
  const classlessSrcs: string[] = [];
  for (const img of root.querySelectorAll('img')) {
    const src = img.getAttribute('src');
    if (!src) continue;
    if (map.has(src)) continue;
    const cls = img.getAttribute('class') ?? '';
    const m = /wp-image-(\d+)/.exec(cls);
    if (!m) {
      // Only candidate for filename fallback if it's a /wp-content/uploads/ src.
      if (/\/wp-content\/uploads\//.test(src)) classlessSrcs.push(src);
      continue;
    }
    const wpId = Number(m[1]);
    const existingAsset = wpIdToAsset.get(wpId);
    if (existingAsset) {
      // Same wpId, different src URL. Map this src to the same asset.
      map.set(src, existingAsset);
      duplicateSrcRemappings++;
      continue;
    }
    const result = await ensureAssetUploaded(client, wp, wpId, opts);
    if (result) {
      map.set(src, result.assetId);
      wpIdToAsset.set(wpId, result.assetId);
      uploaded++;
    }
  }

  // Pass 2: filename-fallback for class-less <img>s pointing at WP uploads.
  // (Forward-looking insurance — exercises mostly on Block-editor / pasted
  // imagery in upcoming entity types, not on the post corpus where everything
  // tends to carry wp-image-{ID}.)
  const seenSrc = new Set<string>();
  for (const src of classlessSrcs) {
    if (seenSrc.has(src) || map.has(src)) continue;
    seenSrc.add(src);
    const wpId = await resolveAttachmentByFilename(wp, src, opts);
    if (wpId === null) continue;
    const existingAsset = wpIdToAsset.get(wpId);
    if (existingAsset) {
      // Class-less src whose attachment was already uploaded under a class-
      // bearing src elsewhere in the same body. Map to the same asset.
      map.set(src, existingAsset);
      duplicateSrcRemappings++;
      continue;
    }
    const result = await ensureAssetUploaded(client, wp, wpId, opts);
    if (result) {
      map.set(src, result.assetId);
      wpIdToAsset.set(wpId, result.assetId);
      uploaded++;
    }
  }

  const resolver = (src: string): string | null => map.get(src) ?? null;
  return { resolver, uploaded, duplicateSrcRemappings };
}

/**
 * Filename-fallback attachment resolver.
 *
 * For `<img>` tags without `wp-image-{ID}` class (Block-editor pasted images,
 * legacy posts, some Elementor inner-content imagery): derive a base filename
 * from the `<img src>`, query `/wp/v2/media?search=<base>`, and pick the best
 * candidate (exact source_url match wins, else most-recently-uploaded).
 *
 * Multi-match cases (≥2 candidates without exact match) are logged to
 * MEDIA_SEARCH_AMBIGUOUS so editorial can spot-check the chosen attachment.
 *
 * Result is cached in-process so the same src URL never round-trips twice.
 */
const FILENAME_RESOLUTION_CACHE = new Map<string, number | null>();

async function resolveAttachmentByFilename(
  wp: WpClient,
  src: string,
  opts: { referrerSlug?: string; referrerLocale?: string } = {}
): Promise<number | null> {
  const cached = FILENAME_RESOLUTION_CACHE.get(src);
  if (cached !== undefined) return cached;

  const base = deriveBaseFilename(src);
  if (!base) {
    FILENAME_RESOLUTION_CACHE.set(src, null);
    return null;
  }

  let results: WpMediaSearchHit[] = [];
  try {
    results = await wp.getJson<WpMediaSearchHit[]>(
      `/wp-json/wp/v2/media?search=${encodeURIComponent(base)}&per_page=10&_fields=id,date,source_url`,
      { cacheKey: `media-search-${base}` }
    );
  } catch (e) {
    process.stderr.write(`[media-search] FAIL base=${base} src=${src}: ${(e as Error).message}\n`);
    FILENAME_RESOLUTION_CACHE.set(src, null);
    return null;
  }
  if (!Array.isArray(results) || results.length === 0) {
    FILENAME_RESOLUTION_CACHE.set(src, null);
    return null;
  }

  return chooseCandidate(src, base, results, opts);
}

/**
 * Three-layer cascade for picking among candidate WP attachments returned by
 * `?search=<base>`. WP search is full-text and returns broad token matches —
 * `pyramids-of-giza` matches `great-pyramids-of-giza`, `10` matches every
 * file with `10` anywhere — so a "most-recently-uploaded wins" tiebreaker
 * silently picks unrelated files. The cascade trades coverage for accuracy:
 *
 *   Layer 0: exact source_url match (any direct hit wins).
 *   Layer 1: exact path-tail match — `source_url` ends with `/<base>.<ext>`.
 *            One match → use. Multiple matches → fall to layer 2 within them.
 *   Layer 2: same year/month directory (`/YYYY/MM/`) preference.
 *            One match → use. Multiple → most-recent among filtered.
 *   Layer 3: no match — return null (image stays as `_pendingImage`),
 *            record to MEDIA_SEARCH_AMBIGUOUS with full candidate list and
 *            rejection reason. Editorial sees genuine ambiguities only.
 */
function chooseCandidate(
  src: string,
  base: string,
  results: WpMediaSearchHit[],
  opts: { referrerSlug?: string; referrerLocale?: string }
): number | null {
  // Layer 0: exact source_url match.
  const exact = results.find((r) => r.source_url === src);
  if (exact) {
    FILENAME_RESOLUTION_CACHE.set(src, exact.id);
    return exact.id;
  }

  const ext = deriveExtension(src);
  const tail = ext ? `/${base}${ext}`.toLowerCase() : `/${base}.`.toLowerCase();
  const yearMonth = deriveYearMonth(src);

  // Layer 1: exact path-tail match.
  const tailMatches = results.filter((r) =>
    ext
      ? r.source_url.toLowerCase().endsWith(tail)
      : r.source_url.toLowerCase().includes(tail)
  );

  if (tailMatches.length === 1) {
    FILENAME_RESOLUTION_CACHE.set(src, tailMatches[0].id);
    return tailMatches[0].id;
  }

  // Layer 2: year/month preference. Pool depends on layer 1 outcome:
  //   - If multiple exact-tail matches: filter within them (genuine collision).
  //   - If zero exact-tail matches: try year/month across all candidates
  //     (file may have been renamed mid-flight — same upload month is a
  //     reasonable proxy).
  const layer2Pool = tailMatches.length > 1 ? tailMatches : results;
  if (yearMonth) {
    const ym = layer2Pool.filter((r) => r.source_url.includes(yearMonth));
    if (ym.length === 1) {
      process.stderr.write(
        `[media-search] LAYER2 src=${src} → wpId=${ym[0].id} (year/month=${yearMonth}, layer1=${tailMatches.length})\n`
      );
      FILENAME_RESOLUTION_CACHE.set(src, ym[0].id);
      return ym[0].id;
    }
    if (ym.length > 1) {
      const chosen = ym.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
      process.stderr.write(
        `[media-search] LAYER2 src=${src} → wpId=${chosen.id} (year/month=${yearMonth}, most-recent of ${ym.length})\n`
      );
      recordAmbiguousMatch({
        baseFilename: base,
        srcUrl: src,
        chosenWpId: chosen.id,
        candidateWpIds: ym.map((r) => r.id),
        candidateSourceUrls: ym.map((r) => r.source_url),
        referrerSlug: opts.referrerSlug ?? '<unknown>',
        referrerLocale: opts.referrerLocale ?? '<unknown>',
        layer: 'year-month',
        rejectionReason: `${ym.length} candidates within ${yearMonth} (${tailMatches.length > 1 ? 'after layer-1 tail filter' : 'no exact-tail match'})`,
      });
      FILENAME_RESOLUTION_CACHE.set(src, chosen.id);
      return chosen.id;
    }
  }

  // Layer 3: no exact-tail single match, no single year/month match. Refuse
  // to pick — leave as _pendingImage. Editorial sees this as a genuine
  // ambiguity, not algorithmic noise.
  recordAmbiguousMatch({
    baseFilename: base,
    srcUrl: src,
    chosenWpId: null,
    candidateWpIds: results.map((r) => r.id),
    candidateSourceUrls: results.map((r) => r.source_url),
    referrerSlug: opts.referrerSlug ?? '<unknown>',
    referrerLocale: opts.referrerLocale ?? '<unknown>',
    layer: 'rejected',
    rejectionReason: `no exact-tail (${tailMatches.length} matches), year-month=${yearMonth ?? 'unknown'} matched 0 of ${results.length}`,
  });
  FILENAME_RESOLUTION_CACHE.set(src, null);
  return null;
}

interface WpMediaSearchHit {
  id: number;
  date: string;
  source_url: string;
}

/**
 * Derive a search-friendly base filename from a WP upload URL.
 * Strips: query string, path prefix, common WP size suffix `-NxN` and
 * `-scaled`, and the file extension. Output is a base name suitable for
 * `/wp/v2/media?search=<base>`.
 *
 * Examples:
 *   .../uploads/2024/06/Cairo-evening-1024x768.jpg → Cairo-evening
 *   .../uploads/2024/03/5-4.jpg                    → 5-4
 *   .../uploads/2024/05/temple-of-luxor-scaled.jpg → temple-of-luxor
 */
function deriveBaseFilename(src: string): string | null {
  try {
    const u = new URL(src);
    const last = u.pathname.split('/').pop() ?? '';
    if (!last) return null;
    let name = last.replace(/\.[a-z0-9]{2,5}$/i, '');
    name = name.replace(/-scaled$/i, '');
    name = name.replace(/-\d{2,4}x\d{2,4}$/, '');
    return name || null;
  } catch {
    return null;
  }
}

/** Extract the file extension (with leading dot) from a WP upload URL. */
function deriveExtension(src: string): string | null {
  try {
    const u = new URL(src);
    const last = u.pathname.split('/').pop() ?? '';
    const m = /\.([a-z0-9]{2,5})$/i.exec(last);
    return m ? `.${m[1]}` : null;
  } catch {
    return null;
  }
}

/**
 * Extract the `/YYYY/MM/` segment from a WP upload URL like
 * `…/wp-content/uploads/2024/03/foo.jpg`. Returns the segment with leading
 * and trailing slash so it can be substring-matched against any candidate's
 * `source_url` regardless of full path shape.
 */
function deriveYearMonth(src: string): string | null {
  const m = /\/wp-content\/uploads\/(\d{4})\/(\d{2})\//.exec(src);
  return m ? `/${m[1]}/${m[2]}/` : null;
}

export interface AmbiguousMediaMatch {
  baseFilename: string;
  srcUrl: string;
  /** null when the cascade refused to pick (layer 3 rejection — left as _pendingImage). */
  chosenWpId: number | null;
  candidateWpIds: number[];
  candidateSourceUrls: string[];
  referrerSlug: string;
  referrerLocale: string;
  /** Which layer made the call. `year-month` = layer 2 disambiguator fired; `rejected` = layer 3 returned null. */
  layer: 'year-month' | 'rejected';
  /** Human-readable reason describing the layer-1/layer-2 filter outcomes. */
  rejectionReason: string;
}
const AMBIGUOUS_MATCHES: AmbiguousMediaMatch[] = [];
function recordAmbiguousMatch(m: AmbiguousMediaMatch): void {
  AMBIGUOUS_MATCHES.push(m);
}
export function getAmbiguousMediaMatches(): AmbiguousMediaMatch[] {
  return AMBIGUOUS_MATCHES.slice();
}

/** Pull featured-media id from EN entity's featured_media field. */
export async function buildHeroImage(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: { dryRun?: boolean; referrerSlug?: string; referrerLocale?: string } = {}
): Promise<unknown | null> {
  const featured = group.en.featured_media;
  if (!featured) return null;
  const upload = await ensureAssetUploaded(client, wp, featured, opts);
  if (!upload) return null;
  // localizedImage's underlying primitive is 'image' — so the stored _type is image
  // and Sanity hydrates the alt/caption i18n fields via the field's declared type.
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: upload.assetId },
  };
}
