/**
 * Tour field rename — one-shot patch of every tour doc (published +
 * drafts) in migration-staging: copy `dayTourMode` value to `tourMode`,
 * then unset `dayTourMode`.
 *
 * Pairs with the code-side rename across schema, queries, components,
 * mappers, and seed. Both ship in a single commit so the dataset is
 * consistent with the deployed schema after merge.
 *
 * Usage:
 *   npx tsx scripts/migrate-tour-mode.ts --dry-run
 *   npx tsx scripts/migrate-tour-mode.ts --commit
 *
 * Refuses to run against any dataset other than "migration-staging".
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

interface Args {
  commit: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  let commit = false;
  let dryRun = false;
  for (const arg of argv.slice(2)) {
    if (arg === '--commit') commit = true;
    else if (arg === '--dry-run') dryRun = true;
    else die(`Unknown argument: ${arg}`);
  }
  if (commit === dryRun) {
    die('Pass exactly one of --dry-run or --commit.');
  }
  return { commit, dryRun };
}

function die(msg: string): never {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

function getClient(forWrites: boolean): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) {
    die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set in .env');
  }
  if (dataset !== 'migration-staging') {
    die(`Refusing to run against dataset "${dataset}". This script operates on migration-staging only.`);
  }
  const token = forWrites ? process.env.SANITY_API_WRITE_TOKEN : undefined;
  if (forWrites && !token) {
    die('SANITY_API_WRITE_TOKEN must be set in .env for --commit.');
  }
  return createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false,
    token,
    perspective: 'raw',
  });
}

interface TourRow {
  _id: string;
  dayTourMode: string | null;
  tourMode: string | null;
  type: string | null;
}

const SCOPE_QUERY = `*[_type == "tour"]{
  _id,
  dayTourMode,
  tourMode,
  type,
} | order(_id asc)`;

function appendLog(entries: Array<Record<string, unknown>>): void {
  const path = resolve(process.cwd(), 'migration/migration-log.jsonl');
  const body = entries.map((e) => JSON.stringify({ ts: new Date().toISOString(), ...e })).join('\n') + '\n';
  appendFileSync(path, body, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Tour field rename — dayTourMode → tourMode ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient(args.commit);
  const rows = await client.fetch<TourRow[]>(SCOPE_QUERY);

  const toMigrate = rows.filter((r) => r.dayTourMode !== undefined && Object.prototype.hasOwnProperty.call(r, 'dayTourMode') && (r as any).dayTourMode !== null);
  // Include docs with dayTourMode === null too — operator's placeholder draft case.
  const allWithField = rows.filter((r) => Object.prototype.hasOwnProperty.call(r, 'dayTourMode'));

  console.log(`## Scope`);
  console.log(`  total tour docs (incl. drafts): ${rows.length}`);
  console.log(`  docs with dayTourMode set (non-null): ${toMigrate.length}`);
  console.log(`  docs with dayTourMode === null: ${allWithField.length - toMigrate.length}`);
  console.log(`  docs with tourMode already set: ${rows.filter((r) => r.tourMode != null).length}`);
  console.log('');

  console.log(`## Transitions`);
  console.log(`| _id | type | dayTourMode → tourMode |`);
  console.log(`|---|---|---|`);
  for (const r of rows) {
    const dtm = (r as any).dayTourMode;
    const tm = (r as any).tourMode;
    if (dtm === undefined && tm == null) continue;
    const from = dtm === undefined ? '—' : dtm === null ? 'null' : `"${dtm}"`;
    const to = tm == null ? (dtm === undefined ? '—' : dtm === null ? 'null' : `"${dtm}"`) : `"${tm}" (already set)`;
    console.log(`| \`${r._id}\` | ${r.type ?? '—'} | ${from} → ${to} |`);
  }
  console.log('');

  if (args.dryRun) {
    console.log(`Dry-run complete. Re-run with --commit to apply.`);
    return;
  }

  console.log(`## Applying patches…`);
  let patched = 0;
  let skipped = 0;
  const errors: Array<{ _id: string; error: string }> = [];
  const logEntries: Array<Record<string, unknown>> = [];

  for (const r of rows) {
    const dtm = (r as any).dayTourMode;
    if (dtm === undefined) {
      skipped++;
      continue;
    }
    try {
      await client
        .patch(r._id)
        .set({ tourMode: dtm })
        .unset(['dayTourMode'])
        .commit({ visibility: 'async' });
      patched++;
      logEntries.push({
        level: 'info',
        op: 'tour-mode-rename',
        _id: r._id,
        from: dtm,
        to: dtm,
      });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ _id: r._id, error: msg });
      logEntries.push({ level: 'error', op: 'tour-mode-rename', _id: r._id, error: msg });
    }
  }

  if (logEntries.length > 0) appendLog(logEntries);

  console.log(`  patched: ${patched}`);
  console.log(`  skipped (no dayTourMode field): ${skipped}`);
  console.log(`  errors:  ${errors.length}`);
  for (const e of errors.slice(0, 10)) console.log(`    ${e._id}: ${e.error}`);
  if (errors.length > 0) process.exit(1);
  console.log('');
  console.log(`Log entries appended to migration/migration-log.jsonl`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
