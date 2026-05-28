/**
 * Hide 6 specific-property accommodations from sidebars (set hidden=true)
 * and reclassify one mis-tagged tour from kind=accommodation → kind=tours.
 *
 * These are individual hotels/camps that got migrated as accommodation
 * docs. Each city already has a generic "Where to Stay in X" overview —
 * the property pages duplicate that role and clutter the sidebar.
 *
 * Idempotent.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

const HIDE_IDS = [
  'wp-page-61927', // tropitel-naama-bay-sharm-el-sheikh
  'wp-page-63832', // dusit-thani-lake-view-cairo
  'wp-page-64034', // ghaliet-ecolodge-siwa
  'wp-page-64048', // shamsiya-camp-dakhla-oasis
  'wp-page-64054', // al-tabuna-camp-el-dakhla-oasis
  'wp-page-77016', // la-maison-bleue-el-gouna
];

const RECLASSIFY_ID = 'wp-page-86865'; // the-pearl-of-red-sea-hurghada

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
  console.log(`\n=== Hide 6 hotels + reclassify Hurghada Pearl ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const docs = await client.fetch<Array<{ _id: string; kind: string; hidden?: boolean; title: string | null }>>(
    `*[_id in $ids]{ _id, kind, hidden, "title": title[_key=="en"][0].value }`,
    { ids: [...HIDE_IDS, RECLASSIFY_ID] },
  );
  const byId = new Map(docs.map((d) => [d._id, d]));

  console.log('Hide (set hidden=true):');
  let hideWrites = 0;
  for (const id of HIDE_IDS) {
    const d = byId.get(id);
    if (!d) { console.log(`  ✗ ${id} — NOT FOUND`); continue; }
    if (d.hidden === true) { console.log(`  - ${id} — already hidden (noop)`); continue; }
    console.log(`  ✓ ${id}  — ${d.title}`);
    hideWrites++;
  }

  console.log('\nReclassify (kind: accommodation → tours):');
  const r = byId.get(RECLASSIFY_ID);
  let reclassifyWrite = false;
  if (!r) console.log(`  ✗ ${RECLASSIFY_ID} — NOT FOUND`);
  else if (r.kind === 'tours') console.log(`  - already kind=tours (noop)`);
  else { console.log(`  ✓ ${RECLASSIFY_ID}  (${r.kind} → tours)  — ${r.title}`); reclassifyWrite = true; }

  console.log(`\nWrites planned: ${hideWrites} hide(s) + ${reclassifyWrite ? 1 : 0} reclassify`);
  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (hideWrites === 0 && !reclassifyWrite) { console.log('Nothing to do.'); return; }

  let tx = client.transaction();
  for (const id of HIDE_IDS) {
    const d = byId.get(id);
    if (!d || d.hidden === true) continue;
    tx = tx.patch(id, (p) => p.set({ hidden: true }));
  }
  if (reclassifyWrite) tx = tx.patch(RECLASSIFY_ID, (p) => p.set({ kind: 'tours' }));
  await tx.commit({ visibility: 'sync' });

  for (const id of HIDE_IDS) {
    const d = byId.get(id);
    if (!d || d.hidden === true) continue;
    appendLog({ phase: 'CLEANUP-hide-hotels', _id: id, action: 'hide' });
  }
  if (reclassifyWrite) appendLog({ phase: 'CLEANUP-hide-hotels', _id: RECLASSIFY_ID, action: 'reclassify-to-tours', from: r!.kind });
  console.log('✓ Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
