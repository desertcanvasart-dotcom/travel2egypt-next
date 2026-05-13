/**
 * Seed 8 new tour theme docs in migration-staging.
 *
 * EN name + EN slug only; ES + JA fields left empty for operator to fill
 * via Studio at editorial discretion. Field shape matches the 2 existing
 * theme docs (theme-egypt-in-depth, theme-family-egypt): inner array
 * entries are `{ _key, value }` only — no per-entry _type tag (the
 * internationalizedArray plugin tags items at read time).
 *
 * Usage:
 *   npx tsx scripts/seed-tour-themes.ts --dry-run
 *   npx tsx scripts/seed-tour-themes.ts --commit
 *
 * Uses authenticated client + perspective:'raw' for both modes so the
 * pre-existence check sees the same view as the write path (lesson 23,
 * session 14: auth/perspective divergence between dry-run and commit
 * leads to phantom scope estimates).
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

interface ThemeSeed {
  _id: string;
  nameEN: string;
  slugEN: string;
  orderRank: number;
}

const THEMES: ThemeSeed[] = [
  { _id: 'theme-luxury',              nameEN: 'Luxury',                 slugEN: 'luxury',                  orderRank: 110 },
  { _id: 'theme-egypt-red-sea',       nameEN: 'Egypt and the Red Sea',  slugEN: 'egypt-and-the-red-sea',   orderRank: 120 },
  { _id: 'theme-egypt-on-the-go',     nameEN: 'Egypt on the Go',        slugEN: 'egypt-on-the-go',         orderRank: 130 },
  { _id: 'theme-hassle-free',         nameEN: 'Hassle Free',            slugEN: 'hassle-free',             orderRank: 140 },
  { _id: 'theme-nile-cruise',         nameEN: 'Nile Cruise',            slugEN: 'nile-cruise',             orderRank: 150 },
  { _id: 'theme-dahabiya-nile-cruise',nameEN: 'Dahabiya Nile Cruise',   slugEN: 'dahabiya-nile-cruise',    orderRank: 160 },
  { _id: 'theme-special-interest',    nameEN: 'Special Interest',       slugEN: 'special-interest',        orderRank: 170 },
  { _id: 'theme-adventure',           nameEN: 'Adventure',              slugEN: 'adventure',               orderRank: 180 },
];

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

function die(msg: string): never {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set in .env');
  if (dataset !== 'migration-staging') die(`Refusing to run against "${dataset}". migration-staging only.`);
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die('SANITY_API_WRITE_TOKEN must be set in .env (required for both dry-run and commit per lesson 23).');
  return createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false,
    token,
    perspective: 'raw',
  });
}

function buildDoc(t: ThemeSeed) {
  return {
    _id: t._id,
    _type: 'theme',
    name: [{ _key: 'en', value: t.nameEN }],
    slug: [{ _key: 'en', value: { _type: 'slug', current: t.slugEN } }],
    orderRank: t.orderRank,
  };
}

function appendLog(entries: Array<Record<string, unknown>>): void {
  const path = resolve(process.cwd(), 'migration/migration-log.jsonl');
  const body = entries.map((e) => JSON.stringify({ ts: new Date().toISOString(), ...e })).join('\n') + '\n';
  appendFileSync(path, body, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Theme seed — 8 new tour themes ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();

  // Pre-existence check
  const existingIds = await client.fetch<string[]>(
    `*[_type=="theme" && _id in $ids]._id`,
    { ids: THEMES.map((t) => t._id) }
  );
  const allThemeCount = await client.fetch<number>('count(*[_type=="theme"])');

  console.log(`## Pre-flight`);
  console.log(`  themes currently in dataset: ${allThemeCount}`);
  console.log(`  of the 8 target IDs, already present: ${existingIds.length}`);
  if (existingIds.length > 0) {
    console.log(`    ${existingIds.join(', ')}`);
    console.log(`  (these would be overwritten by createOrReplace — STOP and verify)`);
  }
  console.log('');

  console.log(`## Docs to seed`);
  console.log(`| _id | name EN | slug EN | orderRank |`);
  console.log(`|---|---|---|---|`);
  for (const t of THEMES) {
    const existing = existingIds.includes(t._id) ? ' ⚠ EXISTS' : '';
    console.log(`| \`${t._id}\` | ${t.nameEN} | \`${t.slugEN}\` | ${t.orderRank} |${existing}`);
  }
  console.log('');

  if (args.dryRun) {
    console.log(`Dry-run complete. Re-run with --commit to apply.`);
    return;
  }

  if (existingIds.length > 0) {
    die(`Refusing to commit: ${existingIds.length} target IDs already exist. Use createOrReplace explicitly if intentional.`);
  }

  console.log(`## Creating ${THEMES.length} theme docs…`);
  let created = 0;
  const errors: Array<{ _id: string; error: string }> = [];
  const logEntries: Array<Record<string, unknown>> = [];

  for (const t of THEMES) {
    try {
      await client.create(buildDoc(t));
      created++;
      logEntries.push({ level: 'info', op: 'theme-seed', _id: t._id, nameEN: t.nameEN });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ _id: t._id, error: msg });
      logEntries.push({ level: 'error', op: 'theme-seed', _id: t._id, error: msg });
    }
  }

  if (logEntries.length > 0) appendLog(logEntries);

  console.log(`  created: ${created}`);
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
