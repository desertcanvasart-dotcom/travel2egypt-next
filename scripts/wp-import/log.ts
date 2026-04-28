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

import type { DiscardedCarousel, LogEntry, ReviewFlag } from './types.js';
import type { AmbiguousMediaMatch } from './mappers/_shared.js';

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
  stripRules: {
    tourPromo: number;
    categoryGrid: number;
    backlink: number;
    carouselSwiper: number;
    carouselPremiumAdv: number;
    bdtImg: number;
  };
  /** Per-locale records of carousel images discarded by strip rules. */
  discardedCarousels: DiscardedCarousel[];
  /** Filename-fallback resolutions where >=2 candidates matched. */
  ambiguousMatches: AmbiguousMediaMatch[];
  hreflang: { entitiesProbed: number; multiLocaleGroups: number; singletons: number; broken: number };
  media: { uploaded: number; reused: number; failed: number };
  /** Per-attachment 404 misses, keyed by referencing article slug + locale. */
  missingAttachments: Array<{ wpId: number; src: string; referrerSlug: string; referrerLocale: string }>;
  /** Sanity write retries triggered by transient 5xx / ECONNRESET. */
  sanityRetries: number;
  /** `<img src>` URLs remapped to a previously-resolved asset (same wpId, different src). */
  duplicateSrcRemappings: number;
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
    stripRules: { tourPromo: 0, categoryGrid: 0, backlink: 0, carouselSwiper: 0, carouselPremiumAdv: 0, bdtImg: 0 },
    discardedCarousels: [],
    ambiguousMatches: [],
    hreflang: { entitiesProbed: 0, multiLocaleGroups: 0, singletons: 0, broken: 0 },
    media: { uploaded: 0, reused: 0, failed: 0 },
    missingAttachments: [],
    sanityRetries: 0,
    duplicateSrcRemappings: 0,
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

  push(`## Strip rule activity`);
  push();
  push(`| Rule | Instances removed |`);
  push(`|---|---:|`);
  push(`| tour-promo CTA (\`.elementor-cta\`) | ${stats.stripRules.tourPromo} |`);
  push(`| category-grid (\`.e-grid\` w/ internal-only anchors) | ${stats.stripRules.categoryGrid} |`);
  push(`| duplicate-paragraph backlink | ${stats.stripRules.backlink} |`);
  push(`| swiper carousel (\`swiper-slide-image\`) | ${stats.stripRules.carouselSwiper} |`);
  push(`| premium-adv carousel (\`premium-adv-carousel__item-img\`) | ${stats.stripRules.carouselPremiumAdv} |`);
  push(`| bdt-img tour-promo (\`bdt-img\`) | ${stats.stripRules.bdtImg} |`);
  push();

  push(`## Stripped carousels`);
  push();
  if (stats.discardedCarousels.length === 0) {
    push(`_None._`);
  } else {
    push(
      `Carousel widgets removed by the HTML pipeline. Sample src URLs are preserved so editorial can decide whether specific high-value articles need a surgical re-import that retains the imagery (gallery schema work TBD per known-issues.md "Pre-flight gates").`
    );
    push();
    push(`| Doc ID | Slug | Locale | Widget | Imgs discarded | Sample src |`);
    push(`|---|---|---|---|---:|---|`);
    for (const dc of stats.discardedCarousels) {
      const sample = dc.sampleSrcs[0] ?? '';
      push(`| ${dc.docId} | ${dc.slug} | ${dc.locale} | ${dc.widget} | ${dc.count} | ${sample} |`);
    }
  }
  push();

  push(`## Ambiguous filename matches`);
  push();
  if (stats.ambiguousMatches.length === 0) {
    push(`_None._`);
  } else {
    push(
      `Filename fallback resolved an \`<img>\` to multiple candidate WP attachments without an exact \`source_url\` match. Selection rule: most-recently-uploaded wins. Editorial spot-check recommended.`
    );
    push();
    push(`| Article slug | Locale | base filename | candidate IDs | chosen | src URL |`);
    push(`|---|---|---|---|---:|---|`);
    for (const m of stats.ambiguousMatches) {
      const ids = m.candidateWpIds.join(', ');
      push(`| ${m.referrerSlug} | ${m.referrerLocale} | ${m.baseFilename} | ${ids} | ${m.chosenWpId} | ${m.srcUrl} |`);
    }
  }
  push();

  push(`## Sanity write resilience`);
  push();
  push(`- Transient retries (5xx / ECONNRESET, succeeded after retry): ${stats.sanityRetries}`);
  push();

  push(`## Media`);
  push();
  push(`- Uploaded: ${stats.media.uploaded}`);
  push(`- Reused (idempotent): ${stats.media.reused}`);
  push(`- Failed: ${stats.media.failed}`);
  push(`- Duplicate \`<img src>\` remappings (same wpId, different src): ${stats.duplicateSrcRemappings}`);
  push();

  push(`## Missing source attachments`);
  push();
  if (stats.missingAttachments.length === 0) {
    push(`_None._`);
  } else {
    push(`Editorial triage: source URL returned 404, image silently skipped.`);
    push();
    push(`| Article slug | Locale | WP attachment ID | Source URL |`);
    push(`|---|---|---:|---|`);
    for (const m of stats.missingAttachments) {
      push(`| ${m.referrerSlug} | ${m.referrerLocale} | ${m.wpId} | ${m.src} |`);
    }
  }
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
