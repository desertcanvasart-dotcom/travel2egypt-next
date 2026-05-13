/**
 * One-off durationDays backfill for the 4 dayTours surfaced in session 14
 * Step 3h verification as carrying `durationDays: null` despite schema
 * marking the field as required. All 4 are unambiguously single-day per
 * title + dayTour classification.
 *
 * Usage:
 *   npx tsx scripts/fix-daytour-durations.ts --dry-run
 *   npx tsx scripts/fix-daytour-durations.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const TARGETS = [
  { _id: 'wp-page-87438', label: 'Aswan: Private Car and Guide for a Day' },
  { _id: 'wp-page-87764', label: 'Cairo: Private Car and Guide for a Day' },
  { _id: 'wp-page-88169', label: 'Luxor: Private Car and Guide Service' },
  { _id: 'wp-page-115573', label: 'Nefertari Submarine Sunset & Snorkeling' },
];

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
  if (!token) die('SANITY_API_WRITE_TOKEN must be set in .env (required for both dry-run and commit per lesson 23).');
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

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== dayTour durationDays backfill — set to 1 ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();
  const ids = TARGETS.map((t) => t._id);

  interface Row { _id: string; type: string | null; durationDays: number | null }
  const rows = await client.fetch<Row[]>(
    `*[_type=="tour" && _id in $ids]{_id, type, durationDays} | order(_id asc)`,
    { ids }
  );
  const byId = new Map(rows.map((r) => [r._id, r]));

  console.log(`## Targets`);
  console.log(`| _id | label | type | durationDays now → after |`);
  console.log(`|---|---|---|---|`);
  let willPatch = 0, alreadyOk = 0, notFound = 0, typeMismatch = 0;
  for (const t of TARGETS) {
    const r = byId.get(t._id);
    if (!r) { console.log(`| \`${t._id}\` | ${t.label} | NOT FOUND | — |`); notFound++; continue; }
    if (r.type !== 'dayTour') { console.log(`| \`${t._id}\` | ${t.label} | ${r.type} ⚠ | ${r.durationDays} (skip — not dayTour) |`); typeMismatch++; continue; }
    if (r.durationDays === 1) { console.log(`| \`${t._id}\` | ${t.label} | dayTour | 1 (already set, skip) |`); alreadyOk++; continue; }
    console.log(`| \`${t._id}\` | ${t.label} | dayTour | ${r.durationDays ?? 'null'} → 1 |`);
    willPatch++;
  }
  console.log('');
  console.log(`  to patch: ${willPatch} / already ok: ${alreadyOk} / not found: ${notFound} / type mismatch: ${typeMismatch}`);
  console.log('');

  if (notFound > 0 || typeMismatch > 0) die('Refusing to proceed: one or more targets missing or not dayTour.');

  if (args.dryRun) {
    console.log(`Dry-run complete. Re-run with --commit to apply.`);
    return;
  }

  let patched = 0;
  const errors: Array<{ _id: string; error: string }> = [];
  const logEntries: Array<Record<string, unknown>> = [];
  for (const t of TARGETS) {
    const r = byId.get(t._id);
    if (!r || r.durationDays === 1) continue;
    try {
      await client.patch(t._id).set({ durationDays: 1 }).commit({ visibility: 'async' });
      patched++;
      logEntries.push({ level: 'info', op: 'daytour-duration-backfill', _id: t._id, durationDays: 1 });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ _id: t._id, error: msg });
      logEntries.push({ level: 'error', op: 'daytour-duration-backfill', _id: t._id, error: msg });
    }
  }
  if (logEntries.length > 0) appendLog(logEntries);
  console.log(`  patched: ${patched} / errors: ${errors.length}`);
  for (const e of errors.slice(0, 10)) console.log(`    ${e._id}: ${e.error}`);
  if (errors.length > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
