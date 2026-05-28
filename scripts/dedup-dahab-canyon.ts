/**
 * One-off dedup: Dahab's `colored-canyon` (wp-page-59458) is the same place
 * as `coloured-canyon` (US vs UK spelling). Keep `coloured-canyon`, delete
 * `colored-canyon`, redirect.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');
const LOCALES = ['en', 'es', 'ja'] as const;
const CITY_ID = 'wp-page-59436';
const CITY_SLUG = 'dahab';
const KEEP_ID = 'guideArticle.dahab.coloured-canyon';
const KEEP_SLUG = 'coloured-canyon';
const DEL_ID = 'wp-page-59458';
const DEL_SLUG = 'colored-canyon';

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

function bodyTextLen(body: any[] | undefined): number {
  if (!Array.isArray(body)) return 0;
  let n = 0;
  for (const entry of body) {
    if (entry?._key !== 'en') continue;
    if (!Array.isArray(entry.value)) continue;
    for (const b of entry.value) {
      if (b?._type === 'block' && Array.isArray(b.children)) {
        for (const c of b.children) if (typeof c?.text === 'string') n += c.text.length;
      }
    }
  }
  return n;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Dahab colored/coloured-canyon dedup ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const keep = await client.fetch<{ _id: string; body: any[] } | null>(`*[_id==$id][0]{ _id, body }`, { id: KEEP_ID });
  const del = await client.fetch<{ _id: string; body: any[] } | null>(`*[_id==$id][0]{ _id, body }`, { id: DEL_ID });
  if (!keep) die(`Keep ${KEEP_ID} not found.`);
  if (!del) { console.log('Already gone — nothing to do.'); return; }
  const keepLen = bodyTextLen(keep.body); const delLen = bodyTextLen(del.body);
  const ratio = keepLen === 0 ? Infinity : delLen / keepLen;
  console.log(`Delete ${DEL_ID} → keep ${KEEP_SLUG}   (body ${delLen} vs ${keepLen}, ratio ${ratio.toFixed(2)})`);
  if (ratio > 1.2 && args.commit) die(`Refusing — delete body is >20% larger.`);
  if (args.dryRun) return;

  const cityDoc = await client.fetch<{ placesToGo: Array<{ _key?: string; _ref: string }> }>(
    `*[_id==$id][0]{ placesToGo }`, { id: CITY_ID },
  );
  if (!cityDoc?.placesToGo) die('Could not read dahab placesToGo.');
  const newPlacesToGo = cityDoc.placesToGo.filter((e) => e._ref !== DEL_ID);
  console.log(`dahab placesToGo: ${cityDoc.placesToGo.length} → ${newPlacesToGo.length}`);

  await client.transaction()
    .patch(CITY_ID, (p) => p.set({ placesToGo: newPlacesToGo }))
    .delete(DEL_ID)
    .commit({ visibility: 'sync' });

  const rows = LOCALES.map((loc) => {
    const prefix = loc === 'en' ? '' : `/${loc}`;
    return `${prefix}/guide/${CITY_SLUG}/${DEL_SLUG},${prefix}/guide/${CITY_SLUG}/${KEEP_SLUG},301`;
  });
  appendFileSync(REDIRECT_CSV_PATH, '\n' + rows.join('\n') + '\n', 'utf8');
  appendLog({ phase: 'CLEANUP-dahab-canyon', deleted: DEL_ID, kept: KEEP_SLUG, delBodyLen: delLen, keepBodyLen: keepLen });
  console.log(`✓ Deleted, appended 3 redirect rows`);
}

main().catch((err) => { console.error(err); process.exit(1); });
