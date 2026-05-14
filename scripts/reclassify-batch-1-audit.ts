/**
 * Batch 1 audit pass — 28 corrections (sub-step 3.5a-redo).
 *
 * Operator clarification: type = duration. package = multi-day, dayTour = 1-day.
 * The slug-pattern heuristic in the mapper had a 22%+ error rate on Batch 1's
 * dayTour cohort because it relied on slug markers (^N-days- prefix, package
 * keywords) rather than actual duration. Title-based audit at sub-step 3.5a
 * surfaced 24 multi-day docs misclassified as dayTour, plus 4 docs that don't
 * belong as `tour` at all.
 *
 * Two operations:
 *
 *   1. Reclassify 24 dayTours → packages
 *      - 22 STRONG (title encodes N>1)
 *      - 2 operator-domain placeholders (durationDays=3 placeholder; multi-city
 *        geography or operator confirmation that offering is typically multi-day)
 *      - For each: set type='package', set durationDays (overwrite the
 *        sub-step 2g.2 backfill's `1`), set theme=theme-egypt-in-depth placeholder.
 *      - tourMode preserved.
 *
 *   2. Delete 4 docs that don't belong under `tour`:
 *      - 2 cruise vessel pages → belong under hotelAndCruise (deferred entity type)
 *      - 2 'Planning Your Trip' info pages → belong under article/guide
 *
 * Usage:
 *   npx tsx scripts/reclassify-batch-1-audit.ts --dry-run
 *   npx tsx scripts/reclassify-batch-1-audit.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

interface Reclassify { _id: string; days: number; reason: 'strong-title' | 'multi-city-placeholder' | 'operator-domain-placeholder'; titleHint: string }
interface Delete { _id: string; reason: string }

const RECLASSIFY: Reclassify[] = [
  // 22 STRONG — title encodes N>1 explicitly
  { _id: 'wp-page-86846',  days: 4, reason: 'strong-title', titleHint: '4-Days City Break' },
  { _id: 'wp-page-86790',  days: 2, reason: 'strong-title', titleHint: 'Aerial Odyssey: Luxor 2-Day Tour' },
  { _id: 'wp-page-87830',  days: 2, reason: 'strong-title', titleHint: '2-Day Minya Tour from Cairo' },
  { _id: 'wp-page-87834',  days: 2, reason: 'strong-title', titleHint: '2-Day Bahariya Oasis Private Tour' },
  { _id: 'wp-page-87976',  days: 2, reason: 'strong-title', titleHint: '2-Day Alexandria Private Tour' },
  { _id: 'wp-page-89411',  days: 4, reason: 'strong-title', titleHint: '4-Day Cairo and White Desert Tour' },
  { _id: 'wp-page-89439',  days: 3, reason: 'strong-title', titleHint: 'Bahariya & White Desert 3-Day Adventure' },
  { _id: 'wp-page-90402',  days: 4, reason: 'strong-title', titleHint: '4-Days Cruise from Aswan to Luxor' },
  { _id: 'wp-page-90411',  days: 5, reason: 'strong-title', titleHint: '5-Day River Cruise from Luxor' },
  { _id: 'wp-page-90425',  days: 5, reason: 'strong-title', titleHint: '5-Day Lake Nasser Cruise from Aswan' },
  { _id: 'wp-page-90443',  days: 4, reason: 'strong-title', titleHint: '4-Day Lake Nasser Cruise from Abu Simbel' },
  { _id: 'wp-page-113521', days: 3, reason: 'strong-title', titleHint: '3-Day Siwa Journey From Alexandria' },
  { _id: 'wp-page-130027', days: 2, reason: 'strong-title', titleHint: '2-Day Nubian Desert Nature & Wildlife Retreat' },
  { _id: 'wp-page-130067', days: 4, reason: 'strong-title', titleHint: '4-Day Ultimate Lake Nasser Experience' },
  { _id: 'wp-page-131889', days: 5, reason: 'strong-title', titleHint: '5-Day The Obeiyed Cave Safari Tour' },
  { _id: 'wp-page-136519', days: 7, reason: 'strong-title', titleHint: '7-Day Adventure from Pyramids to Pharaohs' },
  { _id: 'wp-page-136566', days: 7, reason: 'strong-title', titleHint: '7 Days in Egypt: Pyramids, Temples' },
  { _id: 'wp-page-145910', days: 2, reason: 'strong-title', titleHint: 'Cairo to Alexandria: 2-Day Pyramids & Mediterranean' },
  { _id: 'wp-page-153242', days: 4, reason: 'strong-title', titleHint: 'Short Break in Cairo: 4-Day History Culture' },
  { _id: 'wp-page-155539', days: 7, reason: 'strong-title', titleHint: '7-Day Bahariya Siwa Oasis Tour' },
  { _id: 'wp-page-238357', days: 5, reason: 'strong-title', titleHint: '5 Days – Cairo Luxor Romance Edition' },
  { _id: 'wp-page-238461', days: 3, reason: 'strong-title', titleHint: '3 Days – Cairo Highlights for Friends' },
  // 2 operator-domain placeholders (durationDays=3, operator confirms in Studio)
  { _id: 'wp-page-238371', days: 3, reason: 'multi-city-placeholder',     titleHint: 'Nile Love Journey — Luxor Aswan (multi-city ⇒ multi-day)' },
  { _id: 'wp-page-155692', days: 3, reason: 'operator-domain-placeholder', titleHint: 'A Western Desert Expedition (operator: typically multi-day)' },
];

const DELETIONS: Delete[] = [
  { _id: 'wp-page-64129', reason: 'cruise-vessel — belongs under hotelAndCruise' },
  { _id: 'wp-page-64216', reason: 'cruise-vessel — belongs under hotelAndCruise' },
  { _id: 'wp-page-59425', reason: 'planning-page — belongs under article/guide' },
  { _id: 'wp-page-60348', reason: 'planning-page — belongs under article/guide' },
];

const PLACEHOLDER_THEME_REF = { _type: 'reference' as const, _ref: 'theme-egypt-in-depth' };

interface Args { commit: boolean; dryRun: boolean }
function parseArgs(argv: string[]): Args {
  let commit = false, dryRun = false;
  for (const a of argv.slice(2)) {
    if (a === '--commit') commit = true;
    else if (a === '--dry-run') dryRun = true;
    else die(`Unknown argument: ${a}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun };
}
function die(msg: string): never { process.stderr.write(`error: ${msg}\n`); process.exit(2); }

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set in .env');
  if (dataset !== 'migration-staging') die(`Refusing to run against "${dataset}". migration-staging only.`);
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die('SANITY_API_WRITE_TOKEN must be set in .env (lesson 23).');
  return createClient({
    projectId, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

function appendLog(entries: Array<Record<string, unknown>>): void {
  const path = resolve(process.cwd(), 'migration/migration-log.jsonl');
  const body = entries.map((e) => JSON.stringify({ ts: new Date().toISOString(), ...e })).join('\n') + '\n';
  appendFileSync(path, body, 'utf8');
}

interface Row {
  _id: string;
  type: string;
  tourMode: string | null;
  durationDays: number | null;
  theme: { _ref: string } | null;
  title_en: string | null;
  slug_en: string | null;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log('\n=== Batch 1 audit pass — 24 reclassify + 4 delete ===');
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();

  // --- Reclassify preview ---
  const reIds = RECLASSIFY.map((t) => t._id);
  const reRows = await client.fetch<Row[]>(`
    *[_type=="tour" && _id in $ids]{
      _id, type, tourMode, durationDays,
      "theme": theme,
      "title_en": title[_key=="en"][0].value,
      "slug_en": slug[_key=="en"][0].value.current
    } | order(_id asc)
  `, { ids: reIds });
  const reBy = new Map(reRows.map((r) => [r._id, r]));

  console.log('--- RECLASSIFY (24) ---');
  console.log('| _id | type now | days now → after | tourMode | theme now → after | reason |');
  console.log('|---|---|---|---|---|---|');
  let willPatch = 0, alreadyOk = 0, missing = 0;
  for (const t of RECLASSIFY) {
    const r = reBy.get(t._id);
    if (!r) { console.log(`| \`${t._id}\` | NOT FOUND | — | — | — | ${t.reason} |`); missing++; continue; }
    const ok = r.type === 'package' && r.durationDays === t.days && r.theme?._ref === 'theme-egypt-in-depth';
    if (ok) { console.log(`| \`${r._id}\` | package | ${r.durationDays} (ok) | ${r.tourMode ?? '—'} | egypt-in-depth (ok) | ${t.reason} |`); alreadyOk++; continue; }
    console.log(`| \`${r._id}\` | ${r.type} | ${r.durationDays ?? 'null'} → ${t.days} | ${r.tourMode ?? '—'} | ${r.theme?._ref ?? 'unset'} → egypt-in-depth | ${t.reason} |`);
    willPatch++;
  }
  console.log(`\n  to patch: ${willPatch} / already ok: ${alreadyOk} / not found: ${missing}`);
  if (missing > 0) die('Refusing to proceed: one or more reclassify targets missing.');

  // --- Deletion preview ---
  const delIds = DELETIONS.map((d) => d._id);
  const delRows = await client.fetch<Row[]>(`
    *[_type=="tour" && _id in $ids]{
      _id, type, tourMode, durationDays,
      "theme": theme,
      "title_en": title[_key=="en"][0].value,
      "slug_en": slug[_key=="en"][0].value.current
    } | order(_id asc)
  `, { ids: delIds });
  const delBy = new Map(delRows.map((r) => [r._id, r]));

  console.log('\n--- DELETE (4) ---');
  console.log('| _id | type | slug | title | reason |');
  console.log('|---|---|---|---|---|');
  let willDelete = 0, gone = 0;
  for (const d of DELETIONS) {
    const r = delBy.get(d._id);
    if (!r) { console.log(`| \`${d._id}\` | (already deleted) | — | — | ${d.reason} |`); gone++; continue; }
    console.log(`| \`${r._id}\` | ${r.type} | \`${r.slug_en}\` | ${r.title_en} | ${d.reason} |`);
    willDelete++;
  }
  console.log(`\n  to delete: ${willDelete} / already gone: ${gone}`);

  if (args.dryRun) {
    console.log(`\nDry-run complete. Re-run with --commit to apply.`);
    return;
  }

  // --- Commit reclassifications ---
  let patched = 0;
  const errors: Array<{ _id: string; op: string; error: string }> = [];
  const logEntries: Array<Record<string, unknown>> = [];
  for (const t of RECLASSIFY) {
    const r = reBy.get(t._id);
    if (!r) continue;
    if (r.type === 'package' && r.durationDays === t.days && r.theme?._ref === 'theme-egypt-in-depth') continue;
    try {
      await client.patch(t._id).set({
        type: 'package',
        durationDays: t.days,
        theme: PLACEHOLDER_THEME_REF,
      }).commit({ visibility: 'async' });
      patched++;
      logEntries.push({
        level: 'info', op: 'reclassify-batch-1-audit',
        _id: t._id, days: t.days, themeRef: 'theme-egypt-in-depth',
        reason: t.reason, titleHint: t.titleHint,
      });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ _id: t._id, op: 'reclassify', error: msg });
      logEntries.push({ level: 'error', op: 'reclassify-batch-1-audit', _id: t._id, error: msg });
    }
  }

  // --- Commit deletions ---
  let deleted = 0;
  for (const d of DELETIONS) {
    const r = delBy.get(d._id);
    if (!r) continue;
    try {
      await client.delete(d._id);
      deleted++;
      logEntries.push({
        level: 'info', op: 'delete-batch-1-audit',
        _id: d._id, reason: d.reason,
      });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ _id: d._id, op: 'delete', error: msg });
      logEntries.push({ level: 'error', op: 'delete-batch-1-audit', _id: d._id, error: msg });
    }
  }

  if (logEntries.length > 0) appendLog(logEntries);
  console.log(`\n  patched: ${patched} / deleted: ${deleted} / errors: ${errors.length}`);
  for (const e of errors.slice(0, 10)) console.log(`    [${e.op}] ${e._id}: ${e.error}`);
  if (errors.length > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
