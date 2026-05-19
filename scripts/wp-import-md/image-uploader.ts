/**
 * Local-file image uploader for MD-authored content.
 *
 * Mirrors the upload + cache shape of scripts/wp-import/media.ts but operates
 * on local file paths (no WP attachment ID, no HTTP fetch). Caches by content
 * hash so the same bytes uploaded twice return the cached assetId.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SanityClient } from '@sanity/client';

import type { UploadedImage } from './types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_DIR = join(ROOT, '.cache/md-images');

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

function hashBytes(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

/** In-memory cache. Persistent disk cache is keyed by content hash. */
const memCache = new Map<string, UploadedImage>();

export function clearMemCacheForTests(): void {
  memCache.clear();
}

/**
 * Upload a local image file. Idempotent — same bytes return the cached entry
 * (both in-memory within a run, and on disk across runs).
 *
 * @param absPath  Absolute filesystem path to the image.
 * @param client   Sanity client (env-guarded to migration-staging upstream).
 * @param dryRun   When true, returns a synthetic assetId without uploading.
 */
export async function uploadLocalImage(
  absPath: string,
  client: SanityClient,
  opts: { dryRun?: boolean } = {}
): Promise<UploadedImage> {
  const resolved = resolve(absPath);
  if (memCache.has(resolved)) return memCache.get(resolved)!;
  if (!existsSync(resolved)) {
    throw new Error(`image-uploader: file not found at ${resolved}`);
  }

  const buf = readFileSync(resolved);
  const hash = hashBytes(buf);
  const filename = basename(resolved);

  if (opts.dryRun) {
    // Dry-run intentionally bypasses the on-disk cache: it should never observe
    // assetIds from prior wet-runs (would mask test failures and confuse the
    // run-summary's "what would actually upload" line).
    const entry: UploadedImage = {
      assetId: `image-dryrun-${hash.slice(0, 12)}`,
      filename,
      sourcePath: resolved,
    };
    memCache.set(resolved, entry);
    return entry;
  }

  ensureCacheDir();
  const cachePath = join(CACHE_DIR, `${hash}.json`);
  if (existsSync(cachePath)) {
    const cached = JSON.parse(readFileSync(cachePath, 'utf8')) as UploadedImage;
    memCache.set(resolved, cached);
    return cached;
  }

  const asset = await client.assets.upload('image', buf, { filename });
  const entry: UploadedImage = { assetId: asset._id, filename, sourcePath: resolved };
  writeFileSync(cachePath, JSON.stringify(entry));
  memCache.set(resolved, entry);
  return entry;
}

/**
 * Pre-upload every image referenced from a MD body. Returns a path→upload map
 * so md-to-pt can hand the right assetIds to the html-pipeline resolver.
 *
 * `baseDir` is the directory of the source .md file. Relative paths in MD
 * (typically `./images/<file>`) resolve against it.
 */
export async function preuploadImages(
  body: string,
  baseDir: string,
  client: SanityClient,
  opts: { dryRun?: boolean } = {}
): Promise<Map<string, UploadedImage>> {
  const refs = extractImageRefs(body);
  const out = new Map<string, UploadedImage>();
  for (const ref of refs) {
    const abs = resolve(baseDir, ref);
    const entry = await uploadLocalImage(abs, client, opts);
    out.set(ref, entry);
  }
  return out;
}

/** Pull out every `![alt](path)` MD reference. Returns unique relative paths. */
export function extractImageRefs(body: string): string[] {
  const out = new Set<string>();
  const re = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const path = m[1];
    // Skip absolute URLs — those aren't local files.
    if (/^https?:\/\//i.test(path)) continue;
    out.add(path);
  }
  return [...out];
}
