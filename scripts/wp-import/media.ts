/**
 * Media migration. Downloads original-size WP attachments and uploads them to
 * Sanity assets. Idempotent — re-running reuses already-uploaded assets.
 *
 * Per MIGRATION_MAPPING §3.8:
 *   - One Sanity asset per WP attachment (file shared across locales).
 *   - alt is per-locale on the embedding image block, NOT on the asset.
 *   - Lazy fetch — alt-per-locale is fetched only when an entity actually
 *     references the image.
 *   - Cache: migration/.cache/media/{wpId}.json (Sanity asset _id) and
 *     migration/.cache/media-alt/{wpId}-{locale}.json (per-locale alt).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SanityClient } from '@sanity/client';

import type { WpClient } from './wp-client.js';
import type { Locale, SanityImageRef, WpMedia, I18nString } from './types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_DIR = join(ROOT, 'migration/.cache/media');
const ALT_CACHE_DIR = join(ROOT, 'migration/.cache/media-alt');

mkdirSync(CACHE_DIR, { recursive: true });
mkdirSync(ALT_CACHE_DIR, { recursive: true });

interface AssetCacheEntry {
  wpId: number;
  sanityAssetId: string;
  filename: string;
  uploadedAt: string;
}

/** Process-level registry of attachment 404s, keyed by `${wpId}:${referrerSlug}:${referrerLocale}`. */
export interface MissingAttachment {
  wpId: number;
  src: string;
  referrerSlug: string;
  referrerLocale: string;
}
const MISSING_ATTACHMENTS: MissingAttachment[] = [];
const MISSING_DEDUPE = new Set<string>();

export function getMissingAttachments(): MissingAttachment[] {
  return MISSING_ATTACHMENTS.slice();
}

function recordMissing(m: MissingAttachment): void {
  const key = `${m.wpId}:${m.referrerSlug}:${m.referrerLocale}`;
  if (MISSING_DEDUPE.has(key)) return;
  MISSING_DEDUPE.add(key);
  MISSING_ATTACHMENTS.push(m);
}

/** Process-level registry of Sanity-side upload exhaustions: either non-transient
 *  errors (e.g. 4xx/auth) that throw immediately, or transient errors that
 *  exhausted the 5-attempt retry. Mirrors MISSING_ATTACHMENTS so editorial
 *  triage has a structured artifact instead of grepping stderr. */
export interface UploadExhausted {
  wpId: number;
  src: string;
  filename: string;
  attempts: number;
  lastError: string;
  referrerSlug: string;
  referrerLocale: string;
}
const UPLOAD_EXHAUSTED: UploadExhausted[] = [];
const UPLOAD_EXHAUSTED_DEDUPE = new Set<string>();

export function getUploadExhausted(): UploadExhausted[] {
  return UPLOAD_EXHAUSTED.slice();
}

function recordUploadExhausted(u: UploadExhausted): void {
  const key = `${u.wpId}:${u.referrerSlug}:${u.referrerLocale}`;
  if (UPLOAD_EXHAUSTED_DEDUPE.has(key)) return;
  UPLOAD_EXHAUSTED_DEDUPE.add(key);
  UPLOAD_EXHAUSTED.push(u);
}

/**
 * Ensure a WP attachment has a corresponding Sanity asset. Returns the
 * Sanity asset reference (_ref). Idempotent — returns the cached _ref if
 * the asset was uploaded in a previous run.
 */
export async function ensureAssetUploaded(
  client: SanityClient,
  wp: WpClient,
  attachmentId: number,
  opts: { dryRun?: boolean; referrerSlug?: string; referrerLocale?: string } = {}
): Promise<{ assetId: string; filename: string } | null> {
  const cachePath = join(CACHE_DIR, `${attachmentId}.json`);
  if (existsSync(cachePath)) {
    const cached: AssetCacheEntry = JSON.parse(readFileSync(cachePath, 'utf8'));
    return { assetId: cached.sanityAssetId, filename: cached.filename };
  }

  // Fetch the WP media record (EN locale — alt is per-locale and fetched separately).
  let media: WpMedia;
  try {
    media = (await wp.getJson(`/wp-json/wp/v2/media/${attachmentId}?lang=en`, {
      cacheKey: `media-${attachmentId}-en`,
    })) as WpMedia;
  } catch (e) {
    process.stderr.write(`[media] MISSING_MEDIA wpId=${attachmentId}: ${(e as Error).message}\n`);
    return null;
  }

  // Resolve the largest-available source URL (prefer .full, then .source_url root).
  const sourceUrl =
    media.media_details?.sizes?.full?.source_url ?? media.source_url;
  if (!sourceUrl) {
    process.stderr.write(`[media] no source_url for wpId=${attachmentId}\n`);
    return null;
  }

  const filename = (media.media_details?.file ?? sourceUrl.split('/').pop() ?? `wp-${attachmentId}`).split('/').pop()!;

  if (opts.dryRun) {
    process.stderr.write(`[media] DRY-RUN would upload wpId=${attachmentId} src=${sourceUrl}\n`);
    return { assetId: `image-dryrun-${attachmentId}`, filename };
  }

  // Download bytes.
  let buffer: Buffer;
  try {
    const dl = await wp.getBinary(sourceUrl);
    buffer = dl.buffer;
  } catch (e) {
    process.stderr.write(`[media] DOWNLOAD_FAIL wpId=${attachmentId} src=${sourceUrl}: ${(e as Error).message}\n`);
    if (opts.referrerSlug && opts.referrerLocale) {
      recordMissing({
        wpId: attachmentId,
        src: sourceUrl,
        referrerSlug: opts.referrerSlug,
        referrerLocale: opts.referrerLocale,
      });
    }
    return null;
  }

  // Upload to Sanity. Sanity dedups by content hash automatically — same bytes
  // returns the same _id, so re-uploads are cheap. Retry on transient socket
  // errors (ECONNRESET, ETIMEDOUT) — Sanity's edge occasionally drops TLS.
  let asset: { _id: string };
  let attempt = 0;
  while (true) {
    try {
      asset = await client.assets.upload('image', buffer, { filename });
      break;
    } catch (e) {
      const msg = (e as Error).message ?? '';
      const transient = /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|network/i.test(msg);
      if (!transient || attempt >= 4) {
        if (opts.referrerSlug && opts.referrerLocale) {
          recordUploadExhausted({
            wpId: attachmentId,
            src: sourceUrl,
            filename,
            attempts: attempt + 1,
            lastError: msg.slice(0, 200),
            referrerSlug: opts.referrerSlug,
            referrerLocale: opts.referrerLocale,
          });
        }
        process.stderr.write(`[media] UPLOAD_EXHAUSTED wpId=${attachmentId} src=${sourceUrl} attempts=${attempt + 1} transient=${transient}: ${msg.slice(0, 120)}\n`);
        throw e;
      }
      attempt++;
      const wait = 1000 * Math.pow(2, attempt);
      process.stderr.write(`[media] transient upload error (${msg.slice(0, 80)}); retry ${attempt}/4 in ${wait}ms\n`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  const entry: AssetCacheEntry = {
    wpId: attachmentId,
    sanityAssetId: asset._id,
    filename,
    uploadedAt: new Date().toISOString(),
  };
  writeFileSync(cachePath, JSON.stringify(entry));
  return { assetId: asset._id, filename };
}

/**
 * Build a Sanity image block referencing an uploaded asset, with per-locale
 * alt + caption fetched lazily from WP.
 */
export async function buildImageRef(
  client: SanityClient,
  wp: WpClient,
  attachmentId: number,
  locales: Locale[],
  opts: { dryRun?: boolean; referrerSlug?: string; referrerLocale?: string } = {}
): Promise<SanityImageRef | null> {
  const upload = await ensureAssetUploaded(client, wp, attachmentId, opts);
  if (!upload) return null;

  const alt: I18nString = [];
  const caption: I18nString = [];

  for (const locale of locales) {
    const cachePath = join(ALT_CACHE_DIR, `${attachmentId}-${locale}.json`);
    let altText = '';
    let cap = '';
    if (existsSync(cachePath)) {
      const c = JSON.parse(readFileSync(cachePath, 'utf8'));
      altText = c.alt ?? '';
      cap = c.caption ?? '';
    } else {
      try {
        const m = (await wp.getJson(`/wp-json/wp/v2/media/${attachmentId}?lang=${locale}`, {
          cacheKey: `media-${attachmentId}-${locale}`,
        })) as WpMedia;
        altText = m.alt_text ?? '';
        cap = stripHtml(m.caption?.rendered ?? '');
        writeFileSync(cachePath, JSON.stringify({ alt: altText, caption: cap }));
      } catch {
        // Locale variant missing — skip silently.
      }
    }
    if (altText) alt.push({ _key: locale, value: altText });
    if (cap) caption.push({ _key: locale, value: cap });
  }

  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: upload.assetId },
    ...(alt.length ? { alt } : {}),
    ...(caption.length ? { caption } : {}),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
