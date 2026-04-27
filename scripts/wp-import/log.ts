/**
 * Migration logger and summary writer.
 *
 * Two outputs:
 *   - migration/migration-log.jsonl — one JSON line per event (warnings,
 *     errors, per-doc actions). Append-only across runs.
 *   - migration/migration-summary.md — human-readable rollup at the end of
 *     each run: counts by type, success/failure, image upload counts,
 *     operator-notes detected, internal-link orphans, places-to-go
 *     reconciliation, sections auto-assigned vs flagged.
 */

import { appendFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { LogEntry, ReviewFlag } from './types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOG_PATH = join(ROOT, 'migration/migration-log.jsonl');
const SUMMARY_PATH = join(ROOT, 'migration/migration-summary.md');

export interface MigrationStats {
  startedAt: string;
  finishedAt?: string;
  argv: string[];
  bySanityType: Record<string, { written: number; skipped: number; failed: number }>;
  reviewFlags: Record<ReviewFlag | 'none', number>;
  htmlPipeline: { operatorNotes: number; pullQuotes: number; sideImages: number; images: number; tablesFlattened: number };
  hreflang: { entitiesProbed: number; multiLocaleGroups: number; singletons: number; broken: number };
  media: { uploaded: number; reused: number; failed: number };
  redirects: { total: number; liveMatched: number; historicMatched: number; orphans: number };
  relink: { scanned: number; resolved: number; orphaned: number; patched: number };
  reconciliation: { citiesUpdated: number; placesToGoAdded: number };
  errors: number;
}

export function emptyStats(argv: string[]): MigrationStats {
  return {
    startedAt: new Date().toISOString(),
    argv,
    bySanityType: {},
    reviewFlags: {} as MigrationStats['reviewFlags'],
    htmlPipeline: { operatorNotes: 0, pullQuotes: 0, sideImages: 0, images: 0, tablesFlattened: 0 },
    hreflang: { entitiesProbed: 0, multiLocaleGroups: 0, singletons: 0, broken: 0 },
    media: { uploaded: 0, reused: 0, failed: 0 },
    redirects: { total: 0, liveMatched: 0, historicMatched: 0, orphans: 0 },
    relink: { scanned: 0, resolved: 0, orphaned: 0, patched: 0 },
    reconciliation: { citiesUpdated: 0, placesToGoAdded: 0 },
    errors: 0,
  };
}

export function logEvent(entry: LogEntry): void {
  appendFileSync(LOG_PATH, JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n');
}

export function logToStderr(entry: LogEntry): void {
  const prefix = entry.level === 'error' ? '✗' : entry.level === 'warn' ? '!' : '·';
  process.stderr.write(`${prefix} ${entry.message}\n`);
}

export function writeSummary(stats: MigrationStats): void {
  stats.finishedAt = new Date().toISOString();
  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  push(`# Migration summary`);
  push();
  push(`- **Started:** ${stats.startedAt}`);
  push(`- **Finished:** ${stats.finishedAt}`);
  push(`- **Argv:** \`${stats.argv.join(' ')}\``);
  push(`- **Errors:** ${stats.errors}`);
  push();

  push(`## By Sanity type`);
  push();
  push(`| Type | Written | Skipped | Failed |`);
  push(`|---|---:|---:|---:|`);
  for (const [t, v] of Object.entries(stats.bySanityType).sort()) {
    push(`| ${t} | ${v.written} | ${v.skipped} | ${v.failed} |`);
  }
  push();

  push(`## Review flags applied`);
  push();
  push(`| Flag | Count |`);
  push(`|---|---:|`);
  for (const [k, v] of Object.entries(stats.reviewFlags)
    .sort((a, b) => (b[1] as number) - (a[1] as number))) {
    push(`| ${k} | ${v} |`);
  }
  push();

  push(`## HTML pipeline detections`);
  push();
  push(`- Operator notes: ${stats.htmlPipeline.operatorNotes}`);
  push(`- Pull quotes: ${stats.htmlPipeline.pullQuotes}`);
  push(`- Side images: ${stats.htmlPipeline.sideImages}`);
  push(`- Inline images: ${stats.htmlPipeline.images}`);
  push(`- Tables flattened: ${stats.htmlPipeline.tablesFlattened}`);
  push();

  push(`## Locale linkage (hreflang)`);
  push();
  push(`- Entities probed: ${stats.hreflang.entitiesProbed}`);
  push(`- Multi-locale groups (EN+ES+JA): ${stats.hreflang.multiLocaleGroups}`);
  push(`- Singletons (EN-only): ${stats.hreflang.singletons}`);
  push(`- Broken hreflang (URL not in REST cache): ${stats.hreflang.broken}`);
  push();

  push(`## Media`);
  push();
  push(`- Uploaded: ${stats.media.uploaded}`);
  push(`- Reused (idempotent): ${stats.media.reused}`);
  push(`- Failed: ${stats.media.failed}`);
  push();

  push(`## Redirects`);
  push();
  push(`- Total entries: ${stats.redirects.total}`);
  push(`- Live URL matches: ${stats.redirects.liveMatched}`);
  push(`- Historic nested URL matches: ${stats.redirects.historicMatched}`);
  push(`- Orphans (manual triage): ${stats.redirects.orphans}`);
  push();

  push(`## Relink phase`);
  push();
  push(`- Documents scanned: ${stats.relink.scanned}`);
  push(`- Internal links resolved: ${stats.relink.resolved}`);
  push(`- Orphaned (kept as external): ${stats.relink.orphaned}`);
  push(`- Documents patched: ${stats.relink.patched}`);
  push();

  push(`## City reconciliation`);
  push();
  push(`- Cities updated: ${stats.reconciliation.citiesUpdated}`);
  push(`- Places-to-go references added: ${stats.reconciliation.placesToGoAdded}`);
  push();

  writeFileSync(SUMMARY_PATH, lines.join('\n'));
}
