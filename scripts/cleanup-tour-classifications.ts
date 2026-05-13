/**
 * Tour data quality cleanup — one-shot:
 *   - 3 reclassifications: dayTour → package, with theme + durationDays
 *   - 1 durationDays fix on a dayTour (was null)
 *   - 1 tourMode editorial correction (89438 → group)
 *   - 3 cruft draft deletions
 *
 * Uses authenticated client + perspective:'raw' from the outset for both
 * dry-run and commit (lesson 23, session 14: auth/perspective divergence
 * between modes leads to phantom scope estimates and silent no-ops).
 *
 * Pre-deletion draft-visibility verification: queries for drafts.** tours
 * and refuses to commit if the count is unexpected.
 *
 * Usage:
 *   npx tsx scripts/cleanup-tour-classifications.ts --dry-run
 *   npx tsx scripts/cleanup-tour-classifications.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

interface Args { commit: boolean; dryRun: boolean }

interface Reclassification {
  _id: string;
  label: string;
  durationDays: number;
  themeRef: string;
}

const RECLASSIFICATIONS: Reclassification[] = [
  { _id: 'wp-page-89558', label: 'Essential Egypt 8-Day',           durationDays: 8,  themeRef: 'theme-egypt-in-depth' },
  { _id: 'wp-page-89353', label: 'Pharaohs Epic 18-Day Grand Tour', durationDays: 18, themeRef: 'theme-egypt-in-depth' },
  { _id: 'wp-page-89452', label: 'Sacred Journey 15-Day Holy Family', durationDays: 15, themeRef: 'theme-special-interest' },
];

const DURATION_FIX = { _id: 'wp-page-146018', label: 'Ramasside Tours (dayTour)', durationDays: 1 };
const MODE_CORRECTION = { _id: 'wp-page-89438', label: 'Nile Sails Felucca (package)', tourMode: 'group' as const };

const DRAFTS_TO_DELETE = [
  'drafts.wp-page-146018',
  'drafts.c8ef22ad-e55d-4568-b907-31197b910863',
  'drafts.wp-page-89438',
];

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

function die(msg: string): never {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set in .env');
  if (dataset !== 'migration-staging') die(`Refusing to run against "${dataset}". migration-staging only.`);
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die('SANITY_API_WRITE_TOKEN must be set in .env (required for both dry-run and commit per lesson 23).');
  return createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false,
    token,
    perspective: 'raw',
  });
}

function appendLog(entries: Array<Record<string, unknown>>): void {
  const path = resolve(process.cwd(), 'migration/migration-log.jsonl');
  const body = entries.map((e) => JSON.stringify({ ts: new Date().toISOString(), ...e })).join('\n') + '\n';
  appendFileSync(path, body, 'utf8');
}

interface TourSnapshot {
  _id: string;
  type: string | null;
  tourMode: string | null;
  durationDays: number | null;
  themeRef: string | null;
}

async function fetchSnapshot(client: SanityClient, ids: string[]): Promise<Map<string, TourSnapshot>> {
  const rows = await client.fetch<TourSnapshot[]>(
    `*[_type=="tour" && _id in $ids]{
      _id, type, tourMode, durationDays, "themeRef": theme._ref
    }`,
    { ids }
  );
  return new Map(rows.map((r) => [r._id, r]));
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Tour data quality cleanup ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();

  // ── Draft-visibility verification ───────────────────────────────────────
  console.log(`## Draft visibility check`);
  const draftRows = await client.fetch<Array<{ _id: string; type: string | null; tourMode: string | null }>>(
    `*[_type=="tour" && _id in path("drafts.**")]{_id, type, tourMode} | order(_id asc)`
  );
  console.log(`  drafts.** tours visible: ${draftRows.length}`);
  for (const d of draftRows) console.log(`    ${d._id}  type=${d.type}  tourMode=${d.tourMode}`);
  console.log('');

  const expectedDraftIds = new Set(DRAFTS_TO_DELETE);
  const visibleDraftIds = new Set(draftRows.map((r) => r._id));
  const missingDrafts = [...expectedDraftIds].filter((id) => !visibleDraftIds.has(id));
  const extraDrafts = [...visibleDraftIds].filter((id) => !expectedDraftIds.has(id));
  if (missingDrafts.length > 0 || extraDrafts.length > 0) {
    console.log(`## Draft-set mismatch`);
    if (missingDrafts.length > 0) console.log(`  missing (expected but not visible): ${missingDrafts.join(', ')}`);
    if (extraDrafts.length > 0) console.log(`  unexpected (visible but not in delete list): ${extraDrafts.join(', ')}`);
    die(`Draft visibility check failed. Expected exactly the 3 drafts in DRAFTS_TO_DELETE. Resolve before commit.`);
  }
  console.log(`  ✓ all 3 expected drafts visible, no extras`);
  console.log('');

  // ── Snapshot before ─────────────────────────────────────────────────────
  const affectedIds = [
    ...RECLASSIFICATIONS.map((r) => r._id),
    DURATION_FIX._id,
    MODE_CORRECTION._id,
  ];
  const before = await fetchSnapshot(client, affectedIds);

  console.log(`## Planned patches`);
  console.log(`### Reclassifications (3) — dayTour → package`);
  console.log(`| _id | label | type | tourMode | durationDays → | theme → |`);
  console.log(`|---|---|---|---|---|---|`);
  for (const r of RECLASSIFICATIONS) {
    const b = before.get(r._id);
    if (!b) { console.log(`| \`${r._id}\` | ${r.label} | **NOT FOUND** | | | |`); continue; }
    console.log(`| \`${r._id}\` | ${r.label} | ${b.type} → package | ${b.tourMode} (unchanged) | ${b.durationDays ?? 'null'} → ${r.durationDays} | ${b.themeRef ?? 'null'} → ${r.themeRef} |`);
  }
  console.log('');

  console.log(`### durationDays fix (1)`);
  const dfBefore = before.get(DURATION_FIX._id);
  console.log(`  \`${DURATION_FIX._id}\` (${DURATION_FIX.label}): durationDays ${dfBefore?.durationDays ?? 'null'} → ${DURATION_FIX.durationDays}`);
  console.log('');

  console.log(`### tourMode correction (1) — editorial`);
  const mcBefore = before.get(MODE_CORRECTION._id);
  console.log(`  \`${MODE_CORRECTION._id}\` (${MODE_CORRECTION.label}): tourMode ${mcBefore?.tourMode ?? 'null'} → ${MODE_CORRECTION.tourMode}`);
  console.log('');

  console.log(`### Draft deletions (3)`);
  for (const id of DRAFTS_TO_DELETE) console.log(`  ${id}`);
  console.log('');

  if (args.dryRun) {
    console.log(`Total ops on --commit: 5 patches + 3 deletions = 8 operations.`);
    console.log(`Dry-run complete. Re-run with --commit to apply.`);
    return;
  }

  // ── Apply ───────────────────────────────────────────────────────────────
  console.log(`## Applying ops…`);
  const errors: Array<{ op: string; _id: string; error: string }> = [];
  const logEntries: Array<Record<string, unknown>> = [];
  let patched = 0, deleted = 0;

  for (const r of RECLASSIFICATIONS) {
    try {
      await client.patch(r._id)
        .set({
          type: 'package',
          durationDays: r.durationDays,
          theme: { _type: 'reference', _ref: r.themeRef },
        })
        .commit({ visibility: 'async' });
      patched++;
      logEntries.push({ level: 'info', op: 'tour-reclassify', _id: r._id, themeRef: r.themeRef, durationDays: r.durationDays });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ op: 'reclassify', _id: r._id, error: msg });
      logEntries.push({ level: 'error', op: 'tour-reclassify', _id: r._id, error: msg });
    }
  }

  try {
    await client.patch(DURATION_FIX._id).set({ durationDays: DURATION_FIX.durationDays }).commit({ visibility: 'async' });
    patched++;
    logEntries.push({ level: 'info', op: 'tour-duration-fix', _id: DURATION_FIX._id, durationDays: DURATION_FIX.durationDays });
  } catch (e) {
    const msg = (e as Error).message;
    errors.push({ op: 'duration-fix', _id: DURATION_FIX._id, error: msg });
    logEntries.push({ level: 'error', op: 'tour-duration-fix', _id: DURATION_FIX._id, error: msg });
  }

  try {
    await client.patch(MODE_CORRECTION._id).set({ tourMode: MODE_CORRECTION.tourMode }).commit({ visibility: 'async' });
    patched++;
    logEntries.push({ level: 'info', op: 'tour-mode-correction', _id: MODE_CORRECTION._id, tourMode: MODE_CORRECTION.tourMode });
  } catch (e) {
    const msg = (e as Error).message;
    errors.push({ op: 'mode-correction', _id: MODE_CORRECTION._id, error: msg });
    logEntries.push({ level: 'error', op: 'tour-mode-correction', _id: MODE_CORRECTION._id, error: msg });
  }

  for (const id of DRAFTS_TO_DELETE) {
    try {
      await client.delete(id);
      deleted++;
      logEntries.push({ level: 'info', op: 'tour-draft-delete', _id: id });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ op: 'draft-delete', _id: id, error: msg });
      logEntries.push({ level: 'error', op: 'tour-draft-delete', _id: id, error: msg });
    }
  }

  if (logEntries.length > 0) appendLog(logEntries);

  console.log(`  patched:  ${patched} (expected 5)`);
  console.log(`  deleted:  ${deleted} (expected 3)`);
  console.log(`  errors:   ${errors.length}`);
  for (const e of errors.slice(0, 10)) console.log(`    [${e.op}] ${e._id}: ${e.error}`);
  if (errors.length > 0) process.exit(1);

  // ── Post-state snapshot for the 5 patched docs ───────────────────────────
  const after = await fetchSnapshot(client, affectedIds);
  console.log(`\n## Post-state snapshot (affected docs)`);
  console.log(`| _id | type | tourMode | durationDays | theme |`);
  console.log(`|---|---|---|---|---|`);
  for (const id of affectedIds) {
    const a = after.get(id);
    if (!a) { console.log(`| \`${id}\` | NOT FOUND | | | |`); continue; }
    console.log(`| \`${id}\` | ${a.type} | ${a.tourMode} | ${a.durationDays} | ${a.themeRef ?? '—'} |`);
  }
  console.log('');
  console.log(`Log entries appended to migration/migration-log.jsonl`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
