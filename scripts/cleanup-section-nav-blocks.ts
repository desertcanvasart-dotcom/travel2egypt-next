/**
 * One-shot Sanity cleanup: strip WP-hub-template section-nav TOC tail blocks
 * (and the cross-promo "Learn more" follow-on) from JA + ES body fields on
 * city and guideArticle docs in migration-staging.
 *
 * Per-doc logic:
 *   1. Read {bodyField}[_key=="{locale}"][0].value → PT block array.
 *   2. Walk from start; find first block matching the locale's section-header
 *      regex (Type 1 — plain-text block, no marks, text matches one of
 *      JA/ES SECTION_HEADER_PATTERNS).
 *   3. From there, walk BACK consuming contiguous Type 2 anchor-only paragraph
 *      blocks (single-span, single-mark, externalLink markDef). Per session 13
 *      pre-flight, JA/ES tail blocks often have sub-anchors (e.g., 歴史 / 天気,
 *      Historia / El tiempo) preceding the first plain section header.
 *   4. From original first-match index, walk FORWARD consuming contiguous
 *      Type 1 + Type 2 blocks. Stop at first non-matching block. This is
 *      tocEnd.
 *   5. From tocEnd, check next 4 blocks for the cross-promo signature:
 *        [image block] + [h2/h3 block] + [normal prose block] + [normal block
 *         whose plain-text concat matches the locale's Learn-more regex]
 *      If match, advance tocEnd past those 4 blocks.
 *   6. Cleaned PT array = original[0 .. tocStart). Everything from tocStart
 *      to (tocEnd, inclusive of cross-promo if matched) is removed.
 *
 * Override file: migration/section-nav-cleanup-overrides.json
 *   Keyed by "_id::locale" (e.g., "wp-page-58090::ja").
 *   Override actions:
 *     - { "action": "skip", "reason": "..." } — skip this doc/locale entirely
 *     - { "action": "manual", "sliceIndex": N, "reason": "..." } — slice at N
 *
 * Audit log: migration/cleanup-section-nav-log.jsonl (append-only, JSONL).
 *
 * Usage:
 *   npx tsx scripts/cleanup-section-nav-blocks.ts --type city --locale ja
 *     → dry-run (default)
 *   npx tsx scripts/cleanup-section-nav-blocks.ts --type guideArticle --locale es --commit
 *     → apply patches
 *   --limit N  limit to first N docs (smoke testing)
 *   --verbose  print full per-doc table instead of head + tail sample
 *
 * Refuses to run against any dataset other than migration-staging.
 */

import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

import {
  SECTION_HEADER_PATTERNS_BY_LOCALE,
  CROSS_PROMO_LEARN_MORE_BY_LOCALE,
} from './wp-import/section-nav-patterns.js';

loadEnv();

// ─── Types ────────────────────────────────────────────────────────────────

type EntityType = 'city' | 'guideArticle';
type Locale = 'ja' | 'es';

interface Span {
  _type: 'span';
  _key: string;
  text?: string;
  marks?: string[];
}
interface MarkDef {
  _key: string;
  _type: string;
  href?: string;
  [k: string]: unknown;
}
interface PtBlock {
  _type: string;
  _key: string;
  style?: string;
  children?: Span[];
  markDefs?: MarkDef[];
  // image and other custom-type blocks have arbitrary fields
  [k: string]: unknown;
}

interface EntityConfig {
  type: EntityType;
  bodyField: 'overview' | 'body';
  label: string;
}

const CONFIGS: Record<EntityType, EntityConfig> = {
  city: { type: 'city', bodyField: 'overview', label: 'city.overview' },
  guideArticle: { type: 'guideArticle', bodyField: 'body', label: 'guideArticle.body' },
};

// ─── Locale-keyed cleanup patterns ────────────────────────────────────────
// Sourced from scripts/wp-import/section-nav-patterns.ts — single source of
// truth shared with the import-time pipeline (wp-import-html.ts).

// ─── CLI ──────────────────────────────────────────────────────────────────

interface Args {
  type: EntityType;
  locale: Locale;
  commit: boolean;
  limit?: number;
  verbose: boolean;
}

function die(msg: string): never {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

function parseArgs(argv: string[]): Args {
  let type: EntityType | null = null;
  let locale: Locale | null = null;
  let commit = false;
  let limit: number | undefined;
  let verbose = false;
  const a = argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const arg = a[i];
    if (arg === '--commit') commit = true;
    else if (arg === '--verbose') verbose = true;
    else if (arg.startsWith('--type=')) type = parseType(arg.slice(7));
    else if (arg === '--type' && i + 1 < a.length) { type = parseType(a[++i]); }
    else if (arg.startsWith('--locale=')) locale = parseLocale(arg.slice(9));
    else if (arg === '--locale' && i + 1 < a.length) { locale = parseLocale(a[++i]); }
    else if (arg.startsWith('--limit=')) limit = parseInt(arg.slice(8), 10);
    else if (arg === '--limit' && i + 1 < a.length) { limit = parseInt(a[++i], 10); }
    else die(`Unknown argument: ${arg}`);
  }
  if (!type) die('--type is required. Allowed: city, guideArticle.');
  if (!locale) die('--locale is required. Allowed: ja, es.');
  return { type, locale, commit, limit, verbose };
}

function parseType(v: string): EntityType {
  if (v !== 'city' && v !== 'guideArticle') {
    die(`Unknown --type "${v}". Allowed: city, guideArticle.`);
  }
  return v;
}
function parseLocale(v: string): Locale {
  if (v !== 'ja' && v !== 'es') {
    die(`Unknown --locale "${v}". Allowed: ja, es.`);
  }
  return v;
}

// ─── Overrides ────────────────────────────────────────────────────────────

interface OverrideValue {
  action: 'skip' | 'manual';
  sliceIndex?: number;
  reason: string;
}
type Overrides = Record<string, OverrideValue>;

const OVERRIDES_PATH = resolve(process.cwd(), 'migration/section-nav-cleanup-overrides.json');

function loadOverrides(): Overrides {
  if (!existsSync(OVERRIDES_PATH)) return {};
  const raw = readFileSync(OVERRIDES_PATH, 'utf8').trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      die(`${OVERRIDES_PATH} must be a JSON object (got ${typeof parsed}).`);
    }
    return parsed as Overrides;
  } catch (e) {
    die(`Failed to parse ${OVERRIDES_PATH}: ${(e as Error).message}`);
  }
}

function overrideFor(o: Overrides, id: string, locale: Locale): OverrideValue | null {
  return o[`${id}::${locale}`] ?? null;
}

// ─── Sanity client ────────────────────────────────────────────────────────

function getClient(forWrites: boolean): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set.');
  if (dataset !== 'migration-staging') {
    die(`Refusing to run against dataset "${dataset}". This script operates on migration-staging only.`);
  }
  const token = forWrites ? process.env.SANITY_API_WRITE_TOKEN : undefined;
  if (forWrites && !token) die('SANITY_API_WRITE_TOKEN must be set for --commit.');
  return createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false,
    token,
  });
}

// ─── Detector ─────────────────────────────────────────────────────────────

function isSectionHeaderBlock(block: PtBlock, locale: Locale): boolean {
  if (block._type !== 'block') return false;
  if (block.style !== 'normal') return false;
  if (!Array.isArray(block.children) || block.children.length !== 1) return false;
  const span = block.children[0];
  if (span._type !== 'span') return false;
  if (Array.isArray(span.marks) && span.marks.length > 0) return false;
  if (Array.isArray(block.markDefs) && block.markDefs.length > 0) return false;
  const text = span.text?.trim() ?? '';
  return SECTION_HEADER_PATTERNS_BY_LOCALE[locale].some((re) => re.test(text));
}

function isAnchorOnlyBlock(block: PtBlock): boolean {
  if (block._type !== 'block') return false;
  if (block.style !== 'normal') return false;
  if (!Array.isArray(block.children) || block.children.length !== 1) return false;
  const span = block.children[0];
  if (span._type !== 'span') return false;
  if (!Array.isArray(span.marks) || span.marks.length !== 1) return false;
  if (!Array.isArray(block.markDefs) || block.markDefs.length !== 1) return false;
  const markKey = span.marks[0];
  const markDef = block.markDefs[0];
  if (markDef._key !== markKey) return false;
  // Both 'externalLink' (this codebase's custom type) and 'link' (PT default)
  // are recognized — observed only externalLink in pre-flight, but defensive.
  if (markDef._type !== 'externalLink' && markDef._type !== 'link') return false;
  return true;
}

function isCrossPromoLearnMoreBlock(block: PtBlock, locale: Locale): boolean {
  if (block._type !== 'block') return false;
  if (block.style !== 'normal') return false;
  if (!Array.isArray(block.children) || block.children.length === 0) return false;
  // Concatenate all span texts (cross-promo text may be plain or in a link).
  const text = block.children
    .map((s) => (s._type === 'span' ? (s.text ?? '') : ''))
    .join('')
    .trim()
    .replace(/\s+/g, ' ');
  return CROSS_PROMO_LEARN_MORE_BY_LOCALE[locale].test(text);
}

interface CleanupResult {
  /** Whether the doc/locale has a TOC tail to strip. */
  hasToc: boolean;
  /** Where to slice from (inclusive). If hasToc=false, this is unused. */
  sliceIndex: number;
  /** Number of blocks that would be removed (original.length - sliceIndex). */
  removedCount: number;
  /** Whether the cross-promo 4-block tail was also matched. */
  crossPromoMatched: boolean;
  /** Cleaned array (original sliced at sliceIndex). */
  cleaned: PtBlock[];
}

function detectCleanup(blocks: PtBlock[], locale: Locale): CleanupResult {
  if (blocks.length === 0) {
    return { hasToc: false, sliceIndex: 0, removedCount: 0, crossPromoMatched: false, cleaned: [] };
  }

  // Find first block matching the locale's section-header pattern.
  let firstHeaderIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (isSectionHeaderBlock(blocks[i], locale)) { firstHeaderIdx = i; break; }
  }
  if (firstHeaderIdx === -1) {
    return { hasToc: false, sliceIndex: blocks.length, removedCount: 0, crossPromoMatched: false, cleaned: blocks.slice() };
  }

  // Walk back consuming contiguous anchor-only paragraphs.
  let startIdx = firstHeaderIdx;
  while (startIdx > 0 && isAnchorOnlyBlock(blocks[startIdx - 1])) {
    startIdx--;
  }

  // Walk forward from firstHeaderIdx consuming contiguous header + anchor-only.
  let endIdx = firstHeaderIdx; // inclusive forward boundary
  for (let i = firstHeaderIdx + 1; i < blocks.length; i++) {
    const b = blocks[i];
    if (isSectionHeaderBlock(b, locale) || isAnchorOnlyBlock(b)) {
      endIdx = i;
      continue;
    }
    break;
  }

  // Cross-promo detection: next 4 blocks after endIdx.
  let crossPromoMatched = false;
  let afterEnd = endIdx + 1;
  if (afterEnd + 3 < blocks.length + 1 && blocks.length - afterEnd >= 4) {
    const image = blocks[afterEnd];
    const heading = blocks[afterEnd + 1];
    const prose = blocks[afterEnd + 2];
    const learnMore = blocks[afterEnd + 3];

    const isImage = image._type === 'image';
    const isHeading = heading._type === 'block' && (heading.style === 'h2' || heading.style === 'h3');
    const isProse = prose._type === 'block' && prose.style === 'normal';
    const isLearnMore = isCrossPromoLearnMoreBlock(learnMore, locale);

    if (isImage && isHeading && isProse && isLearnMore) {
      crossPromoMatched = true;
      endIdx = afterEnd + 3;
    }
  }

  const sliceIndex = startIdx;
  return {
    hasToc: true,
    sliceIndex,
    removedCount: blocks.length - sliceIndex,
    crossPromoMatched,
    cleaned: blocks.slice(0, sliceIndex),
  };
}

// ─── Output ───────────────────────────────────────────────────────────────

interface Row {
  _id: string;
  origCount: number;
  result: CleanupResult;
  source: 'algorithm' | 'override' | 'override-skip';
  overrideReason?: string;
  flags: string[];
}

function fmtTable(rows: Row[], verbose: boolean): string {
  const out: string[] = [];
  out.push('| _id | original | removed | final | toc | cross-promo | source | flags |');
  out.push('|---|---|---|---|---|---|---|---|');
  const display = verbose ? rows : [...rows.slice(0, 20), ...(rows.length > 25 ? rows.slice(-5) : [])];
  if (!verbose && rows.length > 25) {
    out.push(`<!-- showing first 20 + last 5 of ${rows.length}; --verbose for full table -->`);
  }
  for (const r of display) {
    out.push(
      `| \`${r._id}\` | ${r.origCount} | ${r.result.removedCount} | ${r.origCount - r.result.removedCount} | ${r.result.hasToc ? '✓' : '—'} | ${r.result.crossPromoMatched ? '✓' : '—'} | ${r.source} | ${r.flags.join(', ') || '—'} |`
    );
  }
  return out.join('\n');
}

function writeCsv(type: EntityType, locale: Locale, rows: Row[], timestamp: string): string {
  const dir = resolve(process.cwd(), 'migration/.cache');
  mkdirSync(dir, { recursive: true });
  const path = resolve(dir, `cleanup-section-nav-${type}-${locale}-${timestamp}.csv`);
  const header = '_id,orig_count,removed_count,final_count,has_toc,cross_promo,source,flags\n';
  const body = rows
    .map((r) => [
      r._id,
      r.origCount,
      r.result.removedCount,
      r.origCount - r.result.removedCount,
      r.result.hasToc ? '1' : '0',
      r.result.crossPromoMatched ? '1' : '0',
      r.source,
      r.flags.join('|'),
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  writeFileSync(path, header + body + '\n', 'utf8');
  return path;
}

function appendLog(entries: Array<Record<string, unknown>>): void {
  const path = resolve(process.cwd(), 'migration/cleanup-section-nav-log.jsonl');
  const body = entries.map((e) => JSON.stringify({ ts: new Date().toISOString(), ...e })).join('\n') + '\n';
  appendFileSync(path, body, 'utf8');
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  const cfg = CONFIGS[args.type];

  console.log(`\n=== section-nav cleanup — ${cfg.label} [${args.locale}] ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}`);
  if (args.limit) console.log(`limit: ${args.limit}`);
  console.log('');

  const client = getClient(args.commit);
  const overrides = loadOverrides();

  const scopeQuery = `*[_type == "${cfg.type}"
    && defined(${cfg.bodyField}[_key == "${args.locale}"][0].value)]{
    _id,
    "blocks": ${cfg.bodyField}[_key == "${args.locale}"][0].value
  } | order(_id asc)${args.limit ? `[0...${args.limit}]` : ''}`;

  const docs = await client.fetch<Array<{ _id: string; blocks: PtBlock[] }>>(scopeQuery);
  console.log(`Fetched ${docs.length} ${cfg.type} docs with ${args.locale} body content`);
  console.log('');

  const rows: Row[] = [];
  for (const d of docs) {
    const blocks = Array.isArray(d.blocks) ? d.blocks : [];
    const origCount = blocks.length;
    const ov = overrideFor(overrides, d._id, args.locale);

    let result: CleanupResult;
    let source: 'algorithm' | 'override' | 'override-skip';
    const flags: string[] = [];
    let overrideReason: string | undefined;

    if (ov?.action === 'skip') {
      result = { hasToc: false, sliceIndex: blocks.length, removedCount: 0, crossPromoMatched: false, cleaned: blocks };
      source = 'override-skip';
      flags.push('OVERRIDE-SKIP');
      overrideReason = ov.reason;
    } else if (ov?.action === 'manual' && typeof ov.sliceIndex === 'number') {
      const sliceIndex = ov.sliceIndex;
      result = {
        hasToc: true,
        sliceIndex,
        removedCount: blocks.length - sliceIndex,
        crossPromoMatched: false,
        cleaned: blocks.slice(0, sliceIndex),
      };
      source = 'override';
      flags.push('OVERRIDE-MANUAL');
      overrideReason = ov.reason;
    } else {
      result = detectCleanup(blocks, args.locale);
      source = 'algorithm';
      if (!result.hasToc) flags.push('NO-TOC');
      if (result.hasToc && !result.crossPromoMatched) flags.push('TOC-NO-CROSSPROMO');
    }

    rows.push({ _id: d._id, origCount, result, source, overrideReason, flags });
  }

  // Aggregate stats
  const withToc = rows.filter((r) => r.result.hasToc).length;
  const withoutToc = rows.length - withToc;
  const crossPromoHits = rows.filter((r) => r.result.crossPromoMatched).length;
  const tocNoCrossPromo = rows.filter((r) => r.result.hasToc && !r.result.crossPromoMatched).length;
  const removedCounts = rows.filter((r) => r.result.hasToc).map((r) => r.result.removedCount);
  const minRem = removedCounts.length ? Math.min(...removedCounts) : 0;
  const maxRem = removedCounts.length ? Math.max(...removedCounts) : 0;
  const meanRem = removedCounts.length ? (removedCounts.reduce((s, n) => s + n, 0) / removedCounts.length).toFixed(1) : '0';

  // Print
  console.log('## Per-doc summary');
  console.log(fmtTable(rows, args.verbose));
  console.log('');
  console.log('## Stats');
  console.log(`  Total docs:                ${rows.length}`);
  console.log(`  With TOC tail:             ${withToc}`);
  console.log(`  No TOC tail (no cleanup):  ${withoutToc}`);
  console.log(`  Cross-promo also stripped: ${crossPromoHits}`);
  console.log(`  TOC stripped, no cross-promo (🚩): ${tocNoCrossPromo}`);
  if (removedCounts.length > 0) {
    console.log(`  Blocks removed: mean ${meanRem}, range ${minRem}–${maxRem}`);
  }
  const overrideCount = rows.filter((r) => r.source !== 'algorithm').length;
  if (overrideCount > 0) console.log(`  Overrides applied:         ${overrideCount}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const csvPath = writeCsv(args.type, args.locale, rows, timestamp);
  console.log(`\nCSV: ${csvPath}`);

  if (!args.commit) {
    console.log('\nDry-run complete. Re-run with --commit to apply.');
    return;
  }

  // ── Apply patches
  console.log(`\n## Applying patches…`);
  let patched = 0;
  let skipped = 0;
  const errors: Array<{ _id: string; error: string }> = [];
  const logEntries: Array<Record<string, unknown>> = [];

  for (const r of rows) {
    if (!r.result.hasToc) {
      skipped++;
      continue;
    }
    if (r.source === 'override-skip') {
      skipped++;
      continue;
    }
    // NOTE: Sanity patch paths do NOT accept [0] after [_key=="..."] —
    // the filter resolves to the single element directly. GROQ READ paths
    // accept and require the [0] index. Easy to confuse; the cleanup script
    // initially had the wrong shape, and Sanity silently no-op'd 82 patches
    // before the block-count integrity check caught it. See session 13 commit
    // 3701eaf for the failure-mode audit trail.
    const patchPath = `${cfg.bodyField}[_key=="${args.locale}"].value`;
    try {
      await client.patch(r._id).set({ [patchPath]: r.result.cleaned }).commit({ visibility: 'async' });
      patched++;
      logEntries.push({
        level: 'info',
        op: 'section-nav-cleanup',
        type: cfg.type,
        locale: args.locale,
        _id: r._id,
        origCount: r.origCount,
        removedCount: r.result.removedCount,
        crossPromoMatched: r.result.crossPromoMatched,
        source: r.source,
        ...(r.overrideReason ? { overrideReason: r.overrideReason } : {}),
      });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ _id: r._id, error: msg });
      logEntries.push({
        level: 'error',
        op: 'section-nav-cleanup',
        type: cfg.type,
        locale: args.locale,
        _id: r._id,
        error: msg,
      });
    }
  }

  if (logEntries.length > 0) appendLog(logEntries);

  console.log(`  patched: ${patched}`);
  console.log(`  skipped (no-toc or override-skip): ${skipped}`);
  console.log(`  errors:  ${errors.length}`);
  if (errors.length > 0) {
    for (const e of errors.slice(0, 10)) console.log(`    ${e._id}: ${e.error}`);
    process.exit(1);
  }
  console.log(`\nLog entries appended to migration/cleanup-section-nav-log.jsonl`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
