/**
 * Backfill `tourMode: 'private'` on the 31 package-tier tour docs that
 * are missing the field. Confirmed manually 2026-05-28 — slugs uniformly
 * indicate private packages (multi-day vacations / travel deals / golf /
 * family / luxury / nile-cruise); none of them are group departures.
 *
 * Idempotent.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

interface Args { commit: boolean; dryRun: boolean }
function parseArgs(argv: string[]): Args {
  let commit = false; let dryRun = false;
  for (const a of argv.slice(2)) {
    if (a === '--commit') commit = true;
    else if (a === '--dry-run') dryRun = true;
    else die(`Unknown arg: ${a}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun };
}
function die(msg: string): never { process.stderr.write(`error: ${msg}\n`); process.exit(2); }

function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') die(`Refusing against ${dataset}`);
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) die('SANITY_STAGING_API_WRITE_TOKEN required');
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

function appendLog(entry: Record<string, unknown>): void {
  mkdirSync(resolve(process.cwd(), 'migration'), { recursive: true });
  appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Backfill tourMode='private' on unset packages ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const rows = await client.fetch<Array<{ _id: string; slug: string | null }>>(
    `*[_type=='tour' && type=='package' && !defined(tourMode) && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current }`,
  );
  console.log(`Found ${rows.length} packages with unset tourMode.`);
  for (const r of rows) console.log(`  + ${r._id.padEnd(20)} ${r.slug}`);

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (rows.length === 0) { console.log('Nothing to do.'); return; }

  let tx = client.transaction();
  for (const r of rows) tx = tx.patch(r._id, (p) => p.set({ tourMode: 'private' }));
  await tx.commit({ visibility: 'sync' });

  for (const r of rows) appendLog({ phase: 'S48-tourmode-backfill', _id: r._id, slug: r.slug, set: 'private' });
  console.log(`✓ Patched ${rows.length} packages with tourMode='private'.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
