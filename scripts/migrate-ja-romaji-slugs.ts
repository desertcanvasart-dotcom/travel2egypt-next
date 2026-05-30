/**
 * JA slug migration — one-shot patch of existing JA docs in
 * migration-staging to Hepburn-romanized ASCII slugs per the locked
 * policies in docs/decisions/ja-slug-options.md §1.5.
 *
 * Usage:
 *   npx tsx scripts/migrate-ja-romaji-slugs.ts --type article
 *     → dry-run for article (default; prints table + writes CSV)
 *
 *   npx tsx scripts/migrate-ja-romaji-slugs.ts --type travelTip
 *     → dry-run for travelTip
 *
 *   npx tsx scripts/migrate-ja-romaji-slugs.ts --type article --commit
 *     → apply patches (refuses if unresolved collisions or mismatches)
 *
 *   npx tsx scripts/migrate-ja-romaji-slugs.ts --type article --commit --only=wp-post-103379-ja
 *     → single doc
 *
 *   --allow-mismatches  acknowledges JA-title-without-JA-slug docs in
 *                       travelTip dataset; required if any such doc
 *                       exists and isn't covered by an override.
 *
 * Reads migration/ja-slug-overrides.json keyed by Sanity _id. Override
 * value: string slug or { slug, reason }. Override consulted first;
 * algorithmic fallback otherwise.
 *
 * Single source of truth: scripts/wp-import/mappers/_romaji.ts. The
 * wp-import mappers (article.ts, travelTip.ts) also call into this
 * helper for future imports — same algorithm, same output.
 *
 * Writes:
 *   - migration/.cache/ja-slug-{type}-{timestamp}.csv  (dry-run + commit)
 *   - migration/migration-log.jsonl  (append, on --commit only)
 *   - Sanity migration-staging dataset  (on --commit only)
 */

import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

import { initRomaji, titleToRomajiSlug } from './wp-import/mappers/_romaji.js';

loadEnv();

// ─── Per-type configuration ───────────────────────────────────────────────

type EntityType = 'article' | 'travelTip' | 'guideArticle' | 'city' | 'tour' | 'hotel' | 'nileCruise';

interface EntityConfig {
  type: EntityType;
  /** GROQ that returns the JA scope plus title/slug fields under
   *  consistent aliases. Coverage check uses a wider query. */
  scopeQuery: string;
  /** Coverage query — returns one row per logical doc with
   *  hasJaTitle + hasJaSlug booleans. */
  coverageQuery: string;
  /** Sanity patch path for the JA slug field. */
  patchPath: string;
  /** Friendly name for log/CSV. */
  label: string;
  /** Operator's estimate (used for sanity-check informational note). */
  expectedCount?: number;
}

const CONFIGS: Record<EntityType, EntityConfig> = {
  article: {
    type: 'article',
    label: 'article (document-level i18n)',
    expectedCount: 170,
    coverageQuery: `*[_type == "article" && language == "ja"]{
      _id,
      "hasJaTitle": defined(title),
      "hasJaSlug": defined(slug.current),
    }`,
    scopeQuery: `*[_type == "article" && language == "ja" && defined(title) && defined(slug.current)]{
      _id,
      "jaTitle": title,
      "jaSlug": slug.current,
    } | order(_id asc)`,
    patchPath: 'slug.current',
  },
  travelTip: {
    type: 'travelTip',
    label: 'travelTip (field-level i18n)',
    expectedCount: 30,
    coverageQuery: `*[_type == "travelTip"]{
      _id,
      "hasJaTitle": defined(title[_key == "ja"][0].value),
      "hasJaSlug": defined(slug[_key == "ja"][0].value.current),
    }`,
    scopeQuery: `*[_type == "travelTip"
      && defined(title[_key == "ja"][0].value)
      && defined(slug[_key == "ja"][0].value.current)]{
      _id,
      "jaTitle": title[_key == "ja"][0].value,
      "jaSlug": slug[_key == "ja"][0].value.current,
    } | order(_id asc)`,
    patchPath: 'slug[_key=="ja"].value.current',
  },
  guideArticle: {
    type: 'guideArticle',
    label: 'guideArticle (field-level i18n)',
    expectedCount: 430,
    coverageQuery: `*[_type == "guideArticle"]{
      _id,
      "hasJaTitle": defined(title[_key == "ja"][0].value),
      "hasJaSlug": defined(slug[_key == "ja"][0].value.current),
    }`,
    scopeQuery: `*[_type == "guideArticle"
      && defined(title[_key == "ja"][0].value)
      && defined(slug[_key == "ja"][0].value.current)]{
      _id,
      "jaTitle": title[_key == "ja"][0].value,
      "jaSlug": slug[_key == "ja"][0].value.current,
    } | order(_id asc)`,
    patchPath: 'slug[_key=="ja"].value.current',
  },
  city: {
    type: 'city',
    label: 'city (field-level i18n) — JA title sourced from name[_key=="ja"][0].value',
    expectedCount: 41,
    coverageQuery: `*[_type == "city"]{
      _id,
      "hasJaTitle": defined(name[_key == "ja"][0].value),
      "hasJaSlug": defined(slug[_key == "ja"][0].value.current),
    }`,
    scopeQuery: `*[_type == "city"
      && defined(name[_key == "ja"][0].value)
      && defined(slug[_key == "ja"][0].value.current)]{
      _id,
      "jaTitle": name[_key == "ja"][0].value,
      "jaSlug": slug[_key == "ja"][0].value.current,
    } | order(_id asc)`,
    patchPath: 'slug[_key=="ja"].value.current',
  },
  tour: {
    type: 'tour',
    label: 'tour (field-level i18n)',
    expectedCount: 6,
    coverageQuery: `*[_type == "tour"]{
      _id,
      "hasJaTitle": defined(title[_key == "ja"][0].value),
      "hasJaSlug": defined(slug[_key == "ja"][0].value.current),
    }`,
    scopeQuery: `*[_type == "tour"
      && defined(title[_key == "ja"][0].value)
      && defined(slug[_key == "ja"][0].value.current)]{
      _id,
      "jaTitle": title[_key == "ja"][0].value,
      "jaSlug": slug[_key == "ja"][0].value.current,
    } | order(_id asc)`,
    patchPath: 'slug[_key=="ja"].value.current',
  },
  hotel: {
    type: 'hotel',
    label: 'hotel (field-level i18n) — JA title sourced from name[_key=="ja"][0].value',
    expectedCount: 66,
    coverageQuery: `*[_type == "hotel"]{
      _id,
      "hasJaTitle": defined(name[_key == "ja"][0].value),
      "hasJaSlug": defined(slug[_key == "ja"][0].value.current),
    }`,
    scopeQuery: `*[_type == "hotel"
      && defined(name[_key == "ja"][0].value)
      && defined(slug[_key == "ja"][0].value.current)]{
      _id,
      "jaTitle": name[_key == "ja"][0].value,
      "jaSlug": slug[_key == "ja"][0].value.current,
    } | order(_id asc)`,
    patchPath: 'slug[_key=="ja"].value.current',
  },
  nileCruise: {
    type: 'nileCruise',
    label: 'nileCruise (field-level i18n) — JA title sourced from name[_key=="ja"][0].value',
    expectedCount: 40,
    coverageQuery: `*[_type == "nileCruise"]{
      _id,
      "hasJaTitle": defined(name[_key == "ja"][0].value),
      "hasJaSlug": defined(slug[_key == "ja"][0].value.current),
    }`,
    scopeQuery: `*[_type == "nileCruise"
      && defined(name[_key == "ja"][0].value)
      && defined(slug[_key == "ja"][0].value.current)]{
      _id,
      "jaTitle": name[_key == "ja"][0].value,
      "jaSlug": slug[_key == "ja"][0].value.current,
    } | order(_id asc)`,
    patchPath: 'slug[_key=="ja"].value.current',
  },
};

// ─── CLI argument parsing ─────────────────────────────────────────────────

interface Args {
  type: EntityType;
  commit: boolean;
  only?: string;
  allowMismatches: boolean;
}

function parseArgs(argv: string[]): Args {
  let type: EntityType | null = null;
  let commit = false;
  let only: string | undefined;
  let allowMismatches = false;
  for (const arg of argv.slice(2)) {
    if (arg === '--commit') commit = true;
    else if (arg === '--allow-mismatches') allowMismatches = true;
    else if (arg.startsWith('--type=')) {
      const v = arg.slice('--type='.length);
      if (v !== 'article' && v !== 'travelTip' && v !== 'guideArticle' && v !== 'city' && v !== 'tour' && v !== 'hotel' && v !== 'nileCruise') {
        die(`Unknown --type "${v}". Allowed: article, travelTip, guideArticle, city, tour, hotel, nileCruise.`);
      }
      type = v;
    } else if (arg === '--type') {
      die('--type requires a value (e.g. --type article). Use --type=article syntax or --type article.');
    } else if (arg.startsWith('--only=')) {
      only = arg.slice('--only='.length);
    } else {
      die(`Unknown argument: ${arg}`);
    }
  }
  if (!type) {
    die('--type is required. Allowed values: article, travelTip, guideArticle, city, tour, hotel, nileCruise.');
  }
  return { type: type as EntityType, commit, only, allowMismatches };
}

function die(msg: string): never {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

// Two-pass parse so --type with space-separated value works
function parseArgsLoose(argv: string[]): Args {
  const normalized: string[] = [];
  const a = argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--type' && i + 1 < a.length && !a[i + 1].startsWith('--')) {
      normalized.push(`--type=${a[i + 1]}`);
      i++;
    } else if (a[i] === '--only' && i + 1 < a.length && !a[i + 1].startsWith('--')) {
      normalized.push(`--only=${a[i + 1]}`);
      i++;
    } else {
      normalized.push(a[i]);
    }
  }
  return parseArgs(['node', 'script', ...normalized]);
}

// ─── Overrides ────────────────────────────────────────────────────────────

interface OverrideValue {
  slug: string;
  reason?: string;
}

type Overrides = Record<string, string | OverrideValue>;

const OVERRIDES_PATH = resolve(process.cwd(), 'migration/ja-slug-overrides.json');

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

function overrideSlug(o: Overrides, id: string): string | null {
  const v = o[id];
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && typeof v.slug === 'string') return v.slug;
  return null;
}

// ─── Sanity client ────────────────────────────────────────────────────────

function getClient(forWrites: boolean): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) {
    die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set in .env');
  }
  if (dataset !== 'migration-staging') {
    die(`Refusing to run against dataset "${dataset}". This script operates on migration-staging only.`);
  }
  const token = forWrites
    ? (process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN)
    : undefined;
  if (forWrites && !token) {
    die('SANITY_STAGING_API_WRITE_TOKEN (or SANITY_API_WRITE_TOKEN) must be set in .env for --commit.');
  }
  return createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false,
    token,
  });
}

// ─── Coverage check ───────────────────────────────────────────────────────

interface CoverageRow {
  _id: string;
  hasJaTitle: boolean;
  hasJaSlug: boolean;
}

interface CoverageSummary {
  total: number;
  bothPresent: number;
  titleOnly: string[];   // ids needing decision (skip/override/algo-from-title)
  slugOnly: string[];    // anomalous — can't romanize without title
  neither: number;
}

function summarizeCoverage(rows: CoverageRow[]): CoverageSummary {
  const s: CoverageSummary = { total: rows.length, bothPresent: 0, titleOnly: [], slugOnly: [], neither: 0 };
  for (const r of rows) {
    if (r.hasJaTitle && r.hasJaSlug) s.bothPresent++;
    else if (r.hasJaTitle && !r.hasJaSlug) s.titleOnly.push(r._id);
    else if (!r.hasJaTitle && r.hasJaSlug) s.slugOnly.push(r._id);
    else s.neither++;
  }
  return s;
}

// ─── Slug generation per doc ─────────────────────────────────────────────

interface InputDoc {
  _id: string;
  jaTitle: string;
  jaSlug: string;
}

interface ResultRow {
  _id: string;
  title: string;
  currentSlug: string;
  proposedSlug: string;
  source: 'algorithm' | 'override';
  flags: string[];
}

async function generateProposals(
  docs: InputDoc[],
  overrides: Overrides
): Promise<ResultRow[]> {
  const out: ResultRow[] = [];
  for (const d of docs) {
    const ov = overrideSlug(overrides, d._id);
    const flags: string[] = [];
    let proposed: string;
    let source: 'algorithm' | 'override';
    if (ov !== null) {
      proposed = ov;
      source = 'override';
      flags.push('OVERRIDE');
    } else {
      proposed = await titleToRomajiSlug(d.jaTitle);
      source = 'algorithm';
    }
    if (proposed.length >= 58) flags.push('TRUNCATED');
    out.push({
      _id: d._id,
      title: d.jaTitle,
      currentSlug: d.jaSlug,
      proposedSlug: proposed,
      source,
      flags,
    });
  }
  // Collision detection — second pass after all proposals generated.
  const slugCounts = new Map<string, number>();
  for (const r of out) {
    slugCounts.set(r.proposedSlug, (slugCounts.get(r.proposedSlug) ?? 0) + 1);
  }
  for (const r of out) {
    if ((slugCounts.get(r.proposedSlug) ?? 0) > 1) r.flags.push('COLLISION');
  }
  return out;
}

// ─── Output ───────────────────────────────────────────────────────────────

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

function printTable(rows: ResultRow[]): void {
  // stdout is a markdown table for readability; full CSV goes to .cache/
  console.log('');
  console.log('| _id | title (≤50) | current slug | proposed slug | source | flags |');
  console.log('|---|---|---|---|---|---|');
  for (const r of rows) {
    const t = truncate(r.title.replace(/\|/g, '\\|'), 50);
    const cs = truncate(r.currentSlug, 30);
    console.log(`| \`${r._id}\` | ${t} | \`${cs}\` | \`${r.proposedSlug}\` | ${r.source} | ${r.flags.join(', ') || '—'} |`);
  }
}

function writeCsv(type: EntityType, rows: ResultRow[], timestamp: string): string {
  const dir = resolve(process.cwd(), 'migration/.cache');
  mkdirSync(dir, { recursive: true });
  const path = resolve(dir, `ja-slug-${type}-${timestamp}.csv`);
  const header = '_id,title,current_slug,proposed_slug,source,flags\n';
  const body = rows
    .map((r) => {
      const cells = [
        r._id,
        r.title,
        r.currentSlug,
        r.proposedSlug,
        r.source,
        r.flags.join('|'),
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`);
      return cells.join(',');
    })
    .join('\n');
  writeFileSync(path, header + body + '\n', 'utf8');
  return path;
}

function appendLog(entries: Array<Record<string, unknown>>): void {
  const path = resolve(process.cwd(), 'migration/migration-log.jsonl');
  const body = entries.map((e) => JSON.stringify({ ts: new Date().toISOString(), ...e })).join('\n') + '\n';
  appendFileSync(path, body, 'utf8');
}

// ─── Apply patches ────────────────────────────────────────────────────────

async function applyPatches(
  client: SanityClient,
  cfg: EntityConfig,
  rows: ResultRow[]
): Promise<{ patched: number; unchanged: number; errors: Array<{ _id: string; error: string }> }> {
  let patched = 0;
  let unchanged = 0;
  const errors: Array<{ _id: string; error: string }> = [];
  const logEntries: Array<Record<string, unknown>> = [];

  for (const r of rows) {
    if (r.currentSlug === r.proposedSlug) {
      unchanged++;
      continue;
    }
    try {
      await client.patch(r._id).set({ [cfg.patchPath]: r.proposedSlug }).commit({ visibility: 'async' });
      patched++;
      logEntries.push({
        level: 'info',
        op: 'ja-slug-update',
        type: cfg.type,
        _id: r._id,
        oldSlug: r.currentSlug,
        newSlug: r.proposedSlug,
        source: r.source,
      });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ _id: r._id, error: msg });
      logEntries.push({
        level: 'error',
        op: 'ja-slug-update',
        type: cfg.type,
        _id: r._id,
        error: msg,
      });
    }
  }

  if (logEntries.length > 0) appendLog(logEntries);
  return { patched, unchanged, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgsLoose(process.argv);
  const cfg = CONFIGS[args.type];

  console.log(`\n=== JA slug migration — ${cfg.label} ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}`);
  if (args.only) console.log(`only: ${args.only}`);
  console.log('');

  const client = getClient(args.commit);

  // ── Coverage check
  const coverage = await client.fetch<CoverageRow[]>(cfg.coverageQuery);
  const cov = summarizeCoverage(coverage);
  console.log('## Coverage');
  console.log(`Total ${cfg.type} docs (or JA docs for doc-level): ${cov.total}`);
  console.log(`  with both JA title + slug: ${cov.bothPresent}`);
  console.log(`  with JA title, no JA slug: ${cov.titleOnly.length}`);
  console.log(`  with JA slug, no JA title: ${cov.slugOnly.length}`);
  console.log(`  with neither:              ${cov.neither}`);
  if (cfg.expectedCount !== undefined) {
    const target = cov.bothPresent;
    const delta = target - cfg.expectedCount;
    if (delta !== 0) {
      console.log(`  (operator estimate was ~${cfg.expectedCount}; actual ${target}, delta ${delta >= 0 ? '+' : ''}${delta})`);
    } else {
      console.log(`  (matches operator estimate of ~${cfg.expectedCount})`);
    }
  }

  const overrides = loadOverrides();
  const overridesCovering = (ids: string[]) =>
    ids.filter((id) => overrideSlug(overrides, id) !== null);

  // ── Mismatch gating
  const titleOnlyUncovered = cov.titleOnly.filter((id) => overrideSlug(overrides, id) === null);
  const slugOnly = cov.slugOnly;
  if (titleOnlyUncovered.length > 0 || slugOnly.length > 0) {
    console.log('');
    console.log('## Mismatches');
    if (titleOnlyUncovered.length > 0) {
      console.log(`  ${titleOnlyUncovered.length} docs have JA title but no JA slug (no override):`);
      titleOnlyUncovered.slice(0, 10).forEach((id) => console.log(`    SKIP-NO-JA-SLUG  ${id}`));
      if (titleOnlyUncovered.length > 10) console.log(`    … and ${titleOnlyUncovered.length - 10} more`);
    }
    if (slugOnly.length > 0) {
      console.log(`  ${slugOnly.length} docs have JA slug but no JA title (cannot romanize):`);
      slugOnly.slice(0, 10).forEach((id) => console.log(`    SKIP-NO-JA-TITLE  ${id}`));
      if (slugOnly.length > 10) console.log(`    … and ${slugOnly.length - 10} more`);
    }
    if (args.commit && !args.allowMismatches) {
      console.log('');
      die('Unresolved mismatches above. Resolve via overrides, or re-run with --allow-mismatches to skip them.');
    }
  }
  if (overridesCovering(cov.titleOnly).length > 0) {
    console.log(`  ${overridesCovering(cov.titleOnly).length} title-only docs covered by override`);
  }

  // ── Build scope
  let docs = await client.fetch<InputDoc[]>(cfg.scopeQuery);
  // Published-only: a write token surfaces draft versions, which are
  // editorial work-in-progress (often near-duplicate JA titles that
  // collide with their published counterparts). The live site reads
  // published docs, so we romanize those only — matching the tokenless
  // dry-run scope. Drafts keep their slug until the operator publishes.
  const draftCount = docs.filter((d) => d._id.startsWith('drafts.')).length;
  if (draftCount > 0) {
    console.log(`\n(skipping ${draftCount} draft doc(s); patching published only)`);
    docs = docs.filter((d) => !d._id.startsWith('drafts.'));
  }
  if (args.only) {
    docs = docs.filter((d) => d._id === args.only);
    if (docs.length === 0) die(`No doc matched --only=${args.only} within scope query.`);
  }

  // ── Generate proposals
  console.log('');
  console.log(`## Initializing kuromoji dictionary…`);
  const t0 = Date.now();
  await initRomaji();
  console.log(`   ready in ${Date.now() - t0}ms`);

  const rows = await generateProposals(docs, overrides);

  // ── Output
  printTable(rows);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const csvPath = writeCsv(cfg.type, rows, timestamp);

  // ── Aggregate stats
  const lengths = rows.map((r) => r.proposedSlug.length);
  const truncated = rows.filter((r) => r.flags.includes('TRUNCATED')).length;
  const overrideCount = rows.filter((r) => r.source === 'override').length;
  const collisions = rows.filter((r) => r.flags.includes('COLLISION'));

  console.log('');
  console.log('## Stats');
  console.log(`  ${rows.length} ${cfg.type} docs in scope`);
  console.log(`  ${overrideCount} override / ${rows.length - overrideCount} algorithmic`);
  if (lengths.length > 0) {
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    const mean = (lengths.reduce((s, n) => s + n, 0) / lengths.length).toFixed(1);
    console.log(`  slug length: mean ${mean} (range ${min}–${max})`);
  }
  console.log(`  ${truncated} hit 60-char cap (word-boundary truncated)`);
  console.log(`  ${collisions.length} unresolved collisions`);
  console.log('');
  console.log(`CSV: ${csvPath}`);

  if (collisions.length > 0) {
    console.log('');
    console.log('## Collisions');
    const byProposed = new Map<string, ResultRow[]>();
    for (const c of collisions) {
      const arr = byProposed.get(c.proposedSlug) ?? [];
      arr.push(c);
      byProposed.set(c.proposedSlug, arr);
    }
    for (const [slug, group] of byProposed) {
      console.log(`  "${slug}":`);
      for (const g of group) console.log(`    - ${g._id}  (${truncate(g.title, 50)})`);
    }
    if (args.commit) {
      die('Unresolved collisions. Resolve via overrides before --commit.');
    }
  }

  // ── Apply
  if (!args.commit) {
    console.log('');
    console.log('Dry-run complete. Re-run with --commit to apply.');
    return;
  }

  console.log('');
  console.log(`## Applying ${rows.length} patches…`);
  const result = await applyPatches(client, cfg, rows);
  console.log(`  patched:   ${result.patched}`);
  console.log(`  unchanged: ${result.unchanged} (current slug already matched proposed)`);
  console.log(`  errors:    ${result.errors.length}`);
  if (result.errors.length > 0) {
    for (const e of result.errors.slice(0, 10)) {
      console.log(`    ${e._id}: ${e.error}`);
    }
    process.exit(1);
  }
  console.log('');
  console.log(`Log entries appended to migration/migration-log.jsonl`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
