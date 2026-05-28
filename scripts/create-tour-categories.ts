/**
 * Create the 4 tourCategory hub docs. EN slugs are LOCKED to legacy WP
 * URLs to preserve SEO equity; ES/JA slugs left blank for editor pass.
 *
 * Idempotent — re-running checks existence by _id and only creates missing.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

interface CategorySpec {
  _id: string;
  key: 'private-day-tour' | 'group-day-tour' | 'private-package' | 'group-package';
  subAxis: 'destination-city' | 'theme' | 'origin-region';
  enSlug: string;
  enTitle: string;
  enSummary: string;
  legacyWpUrl: string;
}

const CATEGORIES: CategorySpec[] = [
  {
    _id: 'tourCategory.private-day-tour',
    key: 'private-day-tour',
    subAxis: 'destination-city',
    enSlug: 'private-day-tours',
    enTitle: 'Private Day Tours',
    enSummary:
      'Exclusive guided day tours operated for your party alone, available in nine cities across Egypt.',
    legacyWpUrl: 'https://travel2egypt.org/private-day-tours/',
  },
  {
    _id: 'tourCategory.group-day-tour',
    key: 'group-day-tour',
    subAxis: 'destination-city',
    enSlug: 'group-day-tours',
    enTitle: 'Small Group Day Tours',
    enSummary:
      'Scheduled small-group day tours with shared departures — a sociable, lower-cost way to see Egypt’s highlights from six base cities.',
    legacyWpUrl: 'https://travel2egypt.org/group-day-tours/',
  },
  {
    _id: 'tourCategory.private-package',
    key: 'private-package',
    subAxis: 'theme',
    enSlug: 'egypt-travel-packages',
    enTitle: 'Egypt Travel Packages',
    enSummary:
      'Multi-day private journeys built around a theme — from in-depth historical itineraries to family holidays, luxury, dahabiya cruises, and the Red Sea.',
    legacyWpUrl: 'https://travel2egypt.org/egypt-travel-packages/',
  },
  {
    _id: 'tourCategory.group-package',
    key: 'group-package',
    subAxis: 'origin-region',
    enSlug: 'small-group-travel-packages',
    enTitle: 'Small Group Travel Packages',
    enSummary:
      'Multi-day shared-departure Egypt tours organised by traveler origin region — choose the program built for your country group.',
    legacyWpUrl: 'https://travel2egypt.org/small-group-travel-packages/',
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

function buildDoc(spec: CategorySpec) {
  return {
    _id: spec._id,
    _type: 'tourCategory' as const,
    key: spec.key,
    subAxis: spec.subAxis,
    title: [{ _key: 'en', _type: 'object', value: spec.enTitle }],
    slug: [
      { _key: 'en', _type: 'object', value: { _type: 'slug', current: spec.enSlug } },
    ],
    summary: [{ _key: 'en', _type: 'object', value: spec.enSummary }],
    migration: { wpUrl: spec.legacyWpUrl },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Create 4 tourCategory hub docs ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const existing = await client.fetch<Array<{ _id: string }>>(
    `*[_id in $ids]{ _id }`,
    { ids: CATEGORIES.map((c) => c._id) },
  );
  const haveSet = new Set(existing.map((d) => d._id));

  const toCreate = CATEGORIES.filter((c) => !haveSet.has(c._id));
  console.log(`Plan: create ${toCreate.length}  · already exist ${haveSet.size}`);
  for (const c of CATEGORIES) {
    console.log(`  ${haveSet.has(c._id) ? '-' : '+'} ${c._id.padEnd(40)} /${c.enSlug}`);
  }

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (toCreate.length === 0) { console.log('Nothing to do.'); return; }

  let tx = client.transaction();
  for (const c of toCreate) tx = tx.create(buildDoc(c) as any);
  await tx.commit({ visibility: 'sync' });

  for (const c of toCreate) {
    appendLog({ phase: 'S48-tourCategory-create', _id: c._id, key: c.key, enSlug: c.enSlug });
  }
  console.log(`✓ Created ${toCreate.length} tourCategory hub docs.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
