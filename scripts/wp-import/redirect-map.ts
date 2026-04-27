/**
 * Redirect-map writer + priority scorer.
 *
 * Sources per MIGRATION_MAPPING §9:
 *   1. Live WP URLs → new Next.js paths (collected from each mapper).
 *   2. 258 historic nested URLs from pre-block CSV (parsed + matched).
 *   3. /fi/ URLs → strip prefix, redirect to EN equivalent.
 *   4. ES/JA variants of every entity (already produced by mappers).
 *
 * Priority score: 0.7 * clicks_pre_block + 0.3 * impressions_recovering.
 * Sorted descending. Output: migration/redirect-map.csv.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Locale, RedirectEntry } from './types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PRE_BLOCK_CSV = join(ROOT, 'migration/seo-data/seo-priority-urls-pre-block.csv');
const RECOVERING_CSV = join(ROOT, 'migration/seo-data/seo-priority-urls-recovering.csv');
const REDIRECT_MAP_CSV = join(ROOT, 'migration/redirect-map.csv');
const ORPHANS_CSV = join(ROOT, 'migration/redirect-orphans.csv');

interface SeoRow {
  url: string;
  clicks: number;
  impressions: number;
}

export function readSeoCsv(path: string): SeoRow[] {
  const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/);
  return lines
    .slice(1)
    .map((l) => {
      const [url, clicks, impressions] = l.split(',');
      return { url, clicks: Number(clicks ?? 0), impressions: Number(impressions ?? 0) };
    })
    .filter((r) => r.url?.startsWith('http'));
}

/** Score a URL by historical clicks and recovering impressions. */
export function buildPriorityIndex(): Map<string, number> {
  const pre = readSeoCsv(PRE_BLOCK_CSV);
  const rec = readSeoCsv(RECOVERING_CSV);
  const idx = new Map<string, number>();
  for (const r of pre) {
    const decoded = decodeURIComponent(r.url).replace(/\/$/, '');
    idx.set(decoded, (idx.get(decoded) ?? 0) + 0.7 * r.clicks);
  }
  for (const r of rec) {
    const decoded = decodeURIComponent(r.url).replace(/\/$/, '');
    idx.set(decoded, (idx.get(decoded) ?? 0) + 0.3 * r.impressions);
  }
  return idx;
}

export interface RedirectMapBuildOpts {
  liveEntries: RedirectEntry[];
  /** Map of imported wpUrl → to_path so we can resolve historic nested URLs. */
  liveUrlToPath?: Map<string, { to_path: string; locale: Locale; legacy_wp_id: number }>;
  priorityIndex: Map<string, number>;
}

export function buildRedirectMap(opts: RedirectMapBuildOpts): { entries: RedirectEntry[]; orphans: string[] } {
  const out: RedirectEntry[] = [...opts.liveEntries];
  const orphans: string[] = [];

  // Apply priority scores to live entries.
  for (const e of out) {
    const decoded = decodeURIComponent(e.from_url).replace(/\/$/, '');
    const score = opts.priorityIndex.get(decoded);
    if (score !== undefined) e.priority_score = score;
  }

  // Process pre-block CSV — historic nested URLs that didn't resolve to live REST.
  const pre = readSeoCsv(PRE_BLOCK_CSV);
  const rec = readSeoCsv(RECOVERING_CSV);

  const byKey = new Map<string, RedirectEntry>();
  for (const e of out) byKey.set(decodeURIComponent(e.from_url).replace(/\/$/, ''), e);

  for (const csvRow of [...pre, ...rec]) {
    const decoded = decodeURIComponent(csvRow.url).replace(/\/$/, '');
    if (byKey.has(decoded)) continue; // Already has a live mapping.

    // /fi/ URLs → strip and redirect to EN.
    if (/\/fi\//.test(decoded)) {
      const enUrl = decoded.replace(/\/fi\//, '/');
      const target = opts.liveUrlToPath?.get(enUrl);
      if (target) {
        out.push({
          from_url: csvRow.url,
          to_path: target.to_path,
          locale: 'en',
          status_code: 301,
          legacy_wp_id: null,
          priority_score: 0.7 * csvRow.clicks + 0.3 * csvRow.impressions,
        });
      } else {
        // Fall back to root.
        out.push({
          from_url: csvRow.url,
          to_path: '/',
          locale: 'en',
          status_code: 301,
          legacy_wp_id: null,
          priority_score: 0.7 * csvRow.clicks + 0.3 * csvRow.impressions,
        });
      }
      continue;
    }

    // Historic nested /{destination}-travel-guide/{sub}/ — try to map.
    const m = /^https?:\/\/travel2egypt\.org(?:\/(es|ja))?\/([a-z-]+)-travel-guide\/([a-z-]+)\/?$/.exec(decoded);
    if (m) {
      const [, langPrefix, destination, sub] = m;
      const locale = (langPrefix as Locale | undefined) ?? 'en';
      // Try to find the new entity by sub-slug.
      const candidates = [
        `/guide/${destination}/${sub}`,
        `/guide/${destination}`,
        `/wiki/monuments/${sub}`,
      ];
      const matched = candidates.find((p) => {
        for (const e of out) if (e.to_path === p || e.to_path === `/${locale}${p}`) return true;
        return false;
      });
      if (matched) {
        out.push({
          from_url: csvRow.url,
          to_path: locale === 'en' ? matched : `/${locale}${matched}`,
          locale,
          status_code: 301,
          legacy_wp_id: null,
          priority_score: 0.7 * csvRow.clicks + 0.3 * csvRow.impressions,
        });
        continue;
      }
      // Else orphan — surface for manual triage.
      orphans.push(`${csvRow.url},${destination},${sub},${csvRow.clicks},${csvRow.impressions}`);
      continue;
    }
    // No-op: URL doesn't fit any pattern we know how to map.
    if (csvRow.clicks > 50 || csvRow.impressions > 1000) {
      orphans.push(`${csvRow.url},,,${csvRow.clicks},${csvRow.impressions}`);
    }
  }

  out.sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0));
  return { entries: out, orphans };
}

export function writeRedirectMap(entries: RedirectEntry[], orphans: string[]): void {
  const header = 'from_url,to_path,locale,status_code,legacy_wp_id,priority_score\n';
  const rows = entries
    .map((e) =>
      [
        e.from_url,
        e.to_path,
        e.locale,
        e.status_code,
        e.legacy_wp_id ?? '',
        (e.priority_score ?? 0).toFixed(2),
      ].join(',')
    )
    .join('\n');
  writeFileSync(REDIRECT_MAP_CSV, header + rows + '\n');

  if (orphans.length > 0) {
    const orphanHeader = 'from_url,destination,sub,clicks,impressions\n';
    writeFileSync(ORPHANS_CSV, orphanHeader + orphans.join('\n') + '\n');
  }
}
