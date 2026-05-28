/**
 * One-off dedup: Aswan's `kitcheners-island` is the same place as
 * `botanical-garden` (Kitchener's Island IS the Aswan Botanical Garden).
 * Keep the latter, delete the former, redirect.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');
const LOCALES = ['en', 'es', 'ja'] as const;
const CITY_ID = 'wp-page-58758';
const CITY_SLUG = 'aswan';
const KEEP_ID = 'guideArticle.aswan.botanical-garden';
const KEEP_SLUG = 'botanical-garden';
const DEL_ID = 'guideArticle.aswan.kitcheners-island';
const DEL_SLUG = 'kitcheners-island';

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
  console.log(`\n=== Aswan Kitchener/Botanical dedup ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const del = await client.fetch<{ _id: string } | null>(`*[_id==$id][0]{ _id }`, { id: DEL_ID });
  if (!del) { console.log('Already gone — nothing to do.'); return; }
  console.log(`Delete ${DEL_ID} → keep ${KEEP_SLUG}`);
  if (args.dryRun) return;

  const cityDoc = await client.fetch<{ placesToGo: Array<{ _key?: string; _ref: string }> }>(
    `*[_id==$id][0]{ placesToGo }`, { id: CITY_ID },
  );
  if (!cityDoc?.placesToGo) die('Could not read aswan placesToGo.');
  const newPlacesToGo = cityDoc.placesToGo.filter((e) => e._ref !== DEL_ID);
  console.log(`aswan placesToGo: ${cityDoc.placesToGo.length} → ${newPlacesToGo.length}`);

  await client.transaction()
    .patch(CITY_ID, (p) => p.set({ placesToGo: newPlacesToGo }))
    .delete(DEL_ID)
    .commit({ visibility: 'sync' });

  const rows = LOCALES.map((loc) => {
    const prefix = loc === 'en' ? '' : `/${loc}`;
    return `${prefix}/guide/${CITY_SLUG}/${DEL_SLUG},${prefix}/guide/${CITY_SLUG}/${KEEP_SLUG},301`;
  });
  appendFileSync(REDIRECT_CSV_PATH, '\n' + rows.join('\n') + '\n', 'utf8');
  appendLog({ phase: 'CLEANUP-aswan-kitchener', deleted: DEL_ID, kept: KEEP_SLUG });
  console.log(`✓ Deleted, appended 3 redirect rows`);
}

main().catch((err) => { console.error(err); process.exit(1); });
