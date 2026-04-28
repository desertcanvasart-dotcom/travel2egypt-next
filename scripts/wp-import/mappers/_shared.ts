/**
 * Shared helpers used by every entity mapper.
 */

import { parse } from 'node-html-parser';
import type { SanityClient } from '@sanity/client';

import { htmlToPortableText, type PtBlock } from '../../wp-import-html.js';
import type { WpClient } from '../wp-client.js';
import { ensureAssetUploaded } from '../media.js';
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

/** Build per-locale Portable Text (one PT array per locale). */
export function i18nBody(group: LocaleGroup, fieldName = 'body'): Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }> {
  const out: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }> = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e?.content?.rendered) continue;
    const result = htmlToPortableText(e.content.rendered);
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
  };
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e?.content?.rendered) continue;
    const r = htmlToPortableText(e.content.rendered);
    for (const k of Object.keys(stats) as Array<keyof typeof stats>) stats[k] += r.stats[k];
  }
  return stats;
}

export function buildMigrationMeta(
  group: LocaleGroup,
  reviewFlag?: ReviewFlag
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
      `/wp/v2/media?search=${encodeURIComponent(base)}&per_page=10&_fields=id,date,source_url`,
      { cacheKey: `media-search-${base}` }
    );
  } catch {
    FILENAME_RESOLUTION_CACHE.set(src, null);
    return null;
  }
  if (!Array.isArray(results) || results.length === 0) {
    FILENAME_RESOLUTION_CACHE.set(src, null);
    return null;
  }

  // Prefer exact source_url match (any size variant counted equal).
  const exact = results.find((r) => r.source_url === src);
  let chosen: WpMediaSearchHit;
  if (exact) {
    chosen = exact;
  } else {
    // Most-recently-uploaded wins.
    chosen = results.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    if (results.length > 1) {
      recordAmbiguousMatch({
        baseFilename: base,
        srcUrl: src,
        chosenWpId: chosen.id,
        candidateWpIds: results.map((r) => r.id),
        candidateSourceUrls: results.map((r) => r.source_url),
        referrerSlug: opts.referrerSlug ?? '<unknown>',
        referrerLocale: opts.referrerLocale ?? '<unknown>',
      });
    }
  }
  FILENAME_RESOLUTION_CACHE.set(src, chosen.id);
  return chosen.id;
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

export interface AmbiguousMediaMatch {
  baseFilename: string;
  srcUrl: string;
  chosenWpId: number;
  candidateWpIds: number[];
  candidateSourceUrls: string[];
  referrerSlug: string;
  referrerLocale: string;
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
