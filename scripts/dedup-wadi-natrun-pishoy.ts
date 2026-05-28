/**
 * One-off dedup: Wadi El Natrun's `monastery-of-st-pishoy` is the same place
 * as `monastery-of-saint-pishoy` (saint/st abbreviation variant — same
 * pattern as Aswan's saint-simeon/st-simeon already deduped).
 * Keep the `saint-` form, delete `st-`, redirect.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');
const LOCALES = ['en', 'es', 'ja'] as const;
const CITY_ID = 'wp-page-58731';
const CITY_SLUG = 'wadi-el-natrun';
const KEEP_ID = 'guideArticle.wadi-el-natrun.monastery-of-saint-pishoy';
const KEEP_SLUG = 'monastery-of-saint-pishoy';
const DEL_ID = 'guideArticle.wadi-el-natrun.monastery-of-st-pishoy';
const DEL_SLUG = 'monastery-of-st-pishoy';

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
  console.log(`\n=== Wadi El Natrun st-pishoy/saint-pishoy dedup ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const keep = await client.fetch<{ _id: string } | null>(`*[_id==$id][0]{ _id }`, { id: KEEP_ID });
  if (!keep) die(`Keep ${KEEP_ID} not found.`);
  const del = await client.fetch<{ _id: string } | null>(`*[_id==$id][0]{ _id }`, { id: DEL_ID });
  if (!del) { console.log('Already gone — nothing to do.'); return; }
  console.log(`Delete ${DEL_ID} → keep ${KEEP_SLUG}`);
  if (args.dryRun) return;

  const cityDoc = await client.fetch<{ placesToGo: Array<{ _key?: string; _ref: string }> }>(
    `*[_id==$id][0]{ placesToGo }`, { id: CITY_ID },
  );
  if (!cityDoc?.placesToGo) die('Could not read wadi-el-natrun placesToGo.');
  const newPlacesToGo = cityDoc.placesToGo.filter((e) => e._ref !== DEL_ID);
  console.log(`wadi-el-natrun placesToGo: ${cityDoc.placesToGo.length} → ${newPlacesToGo.length}`);

  await client.transaction()
    .patch(CITY_ID, (p) => p.set({ placesToGo: newPlacesToGo }))
    .delete(DEL_ID)
    .commit({ visibility: 'sync' });

  const rows = LOCALES.map((loc) => {
    const prefix = loc === 'en' ? '' : `/${loc}`;
    return `${prefix}/guide/${CITY_SLUG}/${DEL_SLUG},${prefix}/guide/${CITY_SLUG}/${KEEP_SLUG},301`;
  });
  appendFileSync(REDIRECT_CSV_PATH, '\n' + rows.join('\n') + '\n', 'utf8');
  appendLog({ phase: 'CLEANUP-wadi-natrun-pishoy', deleted: DEL_ID, kept: KEEP_SLUG });
  console.log(`✓ Deleted, appended 3 redirect rows`);
}

main().catch((err) => { console.error(err); process.exit(1); });
