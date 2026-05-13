/**
 * durationDays backfill for the dayTours imported in session 15 Batch 1
 * (sub-step 2g). Mapper only sets durationDays via slug-based daysFromSlug()
 * which requires `^\d+-days?-` prefix; most dayTours don't match and import
 * with durationDays unset. Required-field validation will block Studio
 * publish until backfill lands.
 *
 * Since dayTour classification means single-day by definition, durationDays=1
 * is correct for all affected docs.
 *
 * Same pattern as session 14's fix-daytour-durations.ts (4 docs); this run
 * scales to ~128.
 *
 * Usage:
 *   npx tsx scripts/fix-daytour-durations-batch-1.ts --dry-run
 *   npx tsx scripts/fix-daytour-durations-batch-1.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

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
  if (!token) die('SANITY_API_WRITE_TOKEN must be set in .env (lesson 23: identical auth in dry-run + commit).');
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
  durationDays: number | null;
  title_en: string | null;
  slug_en: string | null;
}

/** Detect titles suggesting multi-day content despite dayTour classification. */
function flagSuspectMultiDay(title: string | null, slug: string | null): string | null {
  const t = (title ?? '').toLowerCase();
  const s = (slug ?? '').toLowerCase();
  // Title or slug containing "2-day", "3-day", … "N-day(s)" or "N nights"
  const re = /(\b|^)(\d+)[- ]?(day|night)s?\b/;
  const mt = re.exec(t);
  const ms = re.exec(s);
  if (mt && Number(mt[2]) > 1) return `title says ${mt[0]}`;
  if (ms && Number(ms[2]) > 1) return `slug says ${ms[0]}`;
  return null;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== dayTour durationDays backfill — batch 1 (set to 1) ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();

  const rows = await client.fetch<Row[]>(`
    *[_type=="tour" && type=="dayTour" && !defined(durationDays)]{
      _id, type, durationDays,
      "title_en": title[_key=="en"][0].value,
      "slug_en": slug[_key=="en"][0].value.current
    } | order(_id asc)
  `);

  console.log(`Found ${rows.length} dayTour doc(s) missing durationDays.\n`);

  const suspects: Array<{ row: Row; reason: string }> = [];
  for (const r of rows) {
    const reason = flagSuspectMultiDay(r.title_en, r.slug_en);
    if (reason) suspects.push({ row: r, reason });
  }

  if (suspects.length > 0) {
    console.log(`⚠ ${suspects.length} suspect dayTour(s) with title/slug suggesting multi-day:`);
    console.log(`| _id | type | slug | title | flag |`);
    console.log(`|---|---|---|---|---|`);
    for (const s of suspects) {
      console.log(`| \`${s.row._id}\` | ${s.row.type} | \`${s.row.slug_en}\` | ${s.row.title_en} | ${s.reason} |`);
    }
    console.log('');
    console.log('Operator review: are these correctly classified as dayTour, or do they need reclassify-to-package?');
    console.log('');
  }

  if (args.dryRun) {
    console.log(`Dry-run complete. ${rows.length} doc(s) would receive durationDays=1.`);
    console.log(`Re-run with --commit to apply.`);
    return;
  }

  let patched = 0;
  const errors: Array<{ _id: string; error: string }> = [];
  const logEntries: Array<Record<string, unknown>> = [];
  for (const r of rows) {
    try {
      await client.patch(r._id).set({ durationDays: 1 }).commit({ visibility: 'async' });
      patched++;
      logEntries.push({ level: 'info', op: 'daytour-duration-backfill-batch-1', _id: r._id, durationDays: 1 });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ _id: r._id, error: msg });
      logEntries.push({ level: 'error', op: 'daytour-duration-backfill-batch-1', _id: r._id, error: msg });
    }
  }
  if (logEntries.length > 0) appendLog(logEntries);
  console.log(`  patched: ${patched} / errors: ${errors.length}`);
  for (const e of errors.slice(0, 10)) console.log(`    ${e._id}: ${e.error}`);
  if (errors.length > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
