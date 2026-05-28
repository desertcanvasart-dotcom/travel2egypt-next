/**
 * Reclassify 16 Sanity-only package tours that were mis-tagged as
 * tourMode='group' in the WP import. All 16 have a `theme` set and slugs
 * that read as private packages ("private-tour-…", "…-solo-traveller",
 * "…-romance-edition", "…-for-friends"). None have originRegion, so they
 * don't belong to any Group Packages landing page.
 *
 * Action: set tourMode='private'. Their existing `theme` ref then makes
 * them valid `package × private` docs that route to the correct theme
 * landing page.
 *
 * Idempotent.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

const IDS = [
  'wp-page-113061', 'wp-page-113521', 'wp-page-130027', 'wp-page-130067',
  'wp-page-136566', 'wp-page-145910', 'wp-page-155692', 'wp-page-156421',
  'wp-page-158052', 'wp-page-238357', 'wp-page-238371', 'wp-page-238461',
  'wp-page-238546', 'wp-page-238562', 'wp-page-87832',  'wp-page-87834',
];

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
  console.log(`\n=== Fix 16 mis-tagged group-packages → private ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const rows = await client.fetch<Array<{ _id: string; slug: string | null; tourMode: string | null }>>(
    `*[_id in $ids]{ _id, "slug": slug[_key=='en'][0].value.current, tourMode }`,
    { ids: IDS },
  );
  const toFlip = rows.filter((r) => r.tourMode === 'group');
  console.log(`Will flip ${toFlip.length} docs from group → private (skipping already-private):`);
  for (const r of toFlip) console.log(`  + ${r._id.padEnd(20)} ${r.slug}`);

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (toFlip.length === 0) { console.log('Nothing to do.'); return; }

  let tx = client.transaction();
  for (const r of toFlip) tx = tx.patch(r._id, (p) => p.set({ tourMode: 'private' }));
  await tx.commit({ visibility: 'sync' });

  for (const r of toFlip) appendLog({ phase: 'S48-tourmode-fix-mistagged', _id: r._id, slug: r.slug, was: 'group', set: 'private' });
  console.log(`✓ Flipped ${toFlip.length}.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
