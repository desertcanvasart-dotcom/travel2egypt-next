/**
 * Create the 3 Group Packages origin-region tourLanding docs. Pattern-A
 * slugs locked per session-47/48 decision. No legacy WP URLs (these are
 * new pages — the WP site grouped Small Group Packages by theme, not by
 * traveler origin).
 *
 * Bodies are empty placeholders; editor pass after schema is live.
 *
 * Idempotent.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

interface RegionSpec {
  _id: string;
  enSlug: string;
  originRegion: 'japan-east-asia' | 'usa-canada' | 'uk-europe';
  enTitle: string;
  enSummary: string;
}

const REGIONS: RegionSpec[] = [
  {
    _id: 'tourLanding.egypt-group-tours-from-japan',
    enSlug: 'egypt-group-tours-from-japan',
    originRegion: 'japan-east-asia',
    enTitle: 'Egypt Group Tours from Japan & East Asia',
    enSummary:
      'Shared-departure Egypt itineraries built for travelers from Japan and East Asia — flight scheduling, language considerations, and pacing tuned to the region.',
  },
  {
    _id: 'tourLanding.egypt-group-tours-from-usa-canada',
    enSlug: 'egypt-group-tours-from-usa-canada',
    originRegion: 'usa-canada',
    enTitle: 'Egypt Group Tours from USA & Canada',
    enSummary:
      'Shared-departure Egypt itineraries built for travelers from the USA and Canada — convenient connection points, generous itineraries, and trusted operators.',
  },
  {
    _id: 'tourLanding.egypt-group-tours-from-uk-europe',
    enSlug: 'egypt-group-tours-from-uk-europe',
    originRegion: 'uk-europe',
    enTitle: 'Egypt Group Tours from UK & Europe',
    enSummary:
      'Shared-departure Egypt itineraries built for travelers from the UK and Europe — flexible departure dates and itineraries that pair Egypt with regional preferences.',
  },
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

function buildDoc(spec: RegionSpec) {
  return {
    _id: spec._id,
    _type: 'tourLanding' as const,
    category: { _type: 'reference', _ref: 'tourCategory.group-package' },
    originRegion: spec.originRegion,
    title: [{ _key: 'en', _type: 'object', value: spec.enTitle }],
    slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: spec.enSlug } }],
    summary: [{ _key: 'en', _type: 'object', value: spec.enSummary }],
  };
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Create 3 origin-region tourLanding docs ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const existing = await client.fetch<Array<{ _id: string }>>(
    `*[_id in $ids]{ _id }`,
    { ids: REGIONS.map((r) => r._id) },
  );
  const haveSet = new Set(existing.map((d) => d._id));
  const toCreate = REGIONS.filter((r) => !haveSet.has(r._id));

  console.log(`Plan: create ${toCreate.length}  · already exist ${haveSet.size}`);
  for (const r of REGIONS) console.log(`  ${haveSet.has(r._id) ? '-' : '+'} ${r.enSlug}`);

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (toCreate.length === 0) { console.log('Nothing to do.'); return; }

  let tx = client.transaction();
  for (const r of toCreate) tx = tx.create(buildDoc(r) as any);
  await tx.commit({ visibility: 'sync' });

  for (const r of toCreate) appendLog({ phase: 'S48-tourLanding-region-create', _id: r._id, originRegion: r.originRegion });
  console.log(`✓ Created ${toCreate.length} region landing docs.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
