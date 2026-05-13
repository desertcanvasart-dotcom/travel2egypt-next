/**
 * Reclassify 11 misclassified Batch-1 dayTours to packages (sub-step 2g.1).
 *
 * Slug-based classifier missed multi-day signals where day-count wasn't a
 * leading `^N-days-` prefix or matched the package keyword regex. Title-based
 * inspection at sub-step 2g surfaced 11 dayTours with operationally multi-day
 * content. Same pattern as session 14 commit 9b90353.
 *
 * For each target:
 *   - type: dayTour → package
 *   - durationDays: parsed from title
 *   - theme: placeholder `theme-egypt-in-depth` (Step 5 audit surfaces these
 *            for operator re-themeing — see methodology note in handoff)
 *   - tourMode: preserved (session 14 precedent)
 *
 * Usage:
 *   npx tsx scripts/reclassify-misclassified-tours-batch-1.ts --dry-run
 *   npx tsx scripts/reclassify-misclassified-tours-batch-1.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

interface Target { _id: string; days: number; titleHint: string }

// durationDays parsed from titles surfaced at sub-step 2g.
const TARGETS: Target[] = [
  { _id: 'wp-page-102370', days: 2,  titleHint: '2-Day Egypt\'s Majestic Trio (Aswan/Abu Simbel from Luxor)' },
  { _id: 'wp-page-87832',  days: 2,  titleHint: 'Mount Sinai Pilgrimage 2-Day Saint Catherine' },
  { _id: 'wp-page-113061', days: 3,  titleHint: '3-Day Siwa Oasis Adventure' },
  { _id: 'wp-page-238546', days: 3,  titleHint: 'Cairo in 3 Days Insider Edition' },
  { _id: 'wp-page-86851',  days: 4,  titleHint: 'The Elegant Cairo 4-Days Tour' },
  { _id: 'wp-page-238562', days: 5,  titleHint: 'Nile in 5 Days Luxor & Aswan' },
  { _id: 'wp-page-89510',  days: 6,  titleHint: '6-Day Great Pharaohs White Desert' },
  { _id: 'wp-page-89895',  days: 8,  titleHint: '8-Day Cairo and Nile Cruise' },
  { _id: 'wp-page-89015',  days: 10, titleHint: '10-Day Romantic Egypt' },
  { _id: 'wp-page-89619',  days: 10, titleHint: '10-Day Egypt and The Nile' },
  { _id: 'wp-page-86875',  days: 14, titleHint: '14-Night Nile Cruise & Hurghada Stay' },
];

const PLACEHOLDER_THEME_REF = { _type: 'reference' as const, _ref: 'theme-egypt-in-depth' };

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

function die(msg: string): never { process.stderr.write(`error: ${msg}\n`); process.exit(2); }

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set in .env');
  if (dataset !== 'migration-staging') die(`Refusing to run against "${dataset}". migration-staging only.`);
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die('SANITY_API_WRITE_TOKEN must be set in .env (lesson 23).');
  return createClient({
    projectId, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

function appendLog(entries: Array<Record<string, unknown>>): void {
  const path = resolve(process.cwd(), 'migration/migration-log.jsonl');
  const body = entries.map((e) => JSON.stringify({ ts: new Date().toISOString(), ...e })).join('\n') + '\n';
  appendFileSync(path, body, 'utf8');
}

interface Row {
  _id: string;
  type: string;
  tourMode: string | null;
  durationDays: number | null;
  theme: { _ref: string } | null;
  title_en: string | null;
  slug_en: string | null;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Reclassify 11 misclassified Batch-1 dayTours → package ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();
  const ids = TARGETS.map((t) => t._id);

  const rows = await client.fetch<Row[]>(`
    *[_type=="tour" && _id in $ids]{
      _id, type, tourMode, durationDays,
      "theme": theme,
      "title_en": title[_key=="en"][0].value,
      "slug_en": slug[_key=="en"][0].value.current
    } | order(_id asc)
  `, { ids });

  const byId = new Map(rows.map((r) => [r._id, r]));

  console.log(`| _id | slug | title | type now | days now → after | tourMode | theme |`);
  console.log(`|---|---|---|---|---|---|---|`);
  let willPatch = 0, alreadyOk = 0, notFound = 0;
  for (const t of TARGETS) {
    const r = byId.get(t._id);
    if (!r) {
      console.log(`| \`${t._id}\` | NOT FOUND | — | — | — | — | — |`);
      notFound++;
      continue;
    }
    const alreadyPackage = r.type === 'package' && r.durationDays === t.days && r.theme?._ref === 'theme-egypt-in-depth';
    if (alreadyPackage) {
      console.log(`| \`${r._id}\` | \`${r.slug_en}\` | ${r.title_en} | package | ${r.durationDays} (already ok) | ${r.tourMode ?? '—'} | egypt-in-depth |`);
      alreadyOk++;
      continue;
    }
    console.log(
      `| \`${r._id}\` | \`${r.slug_en}\` | ${r.title_en} | ${r.type} | ${r.durationDays ?? 'null'} → ${t.days} | ${r.tourMode ?? '—'} | ${r.theme?._ref ?? 'unset'} → egypt-in-depth |`
    );
    willPatch++;
  }
  console.log('');
  console.log(`  to patch: ${willPatch} / already ok: ${alreadyOk} / not found: ${notFound}`);

  if (notFound > 0) die('Refusing to proceed: one or more targets missing.');

  if (args.dryRun) {
    console.log(`\nDry-run complete. Re-run with --commit to apply.`);
    return;
  }

  let patched = 0;
  const errors: Array<{ _id: string; error: string }> = [];
  const logEntries: Array<Record<string, unknown>> = [];
  for (const t of TARGETS) {
    const r = byId.get(t._id);
    if (!r) continue;
    if (r.type === 'package' && r.durationDays === t.days && r.theme?._ref === 'theme-egypt-in-depth') continue;
    try {
      await client
        .patch(t._id)
        .set({
          type: 'package',
          durationDays: t.days,
          theme: PLACEHOLDER_THEME_REF,
        })
        .commit({ visibility: 'async' });
      patched++;
      logEntries.push({
        level: 'info',
        op: 'reclassify-misclassified-tour-batch-1',
        _id: t._id,
        days: t.days,
        themeRef: 'theme-egypt-in-depth',
        titleHint: t.titleHint,
      });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ _id: t._id, error: msg });
      logEntries.push({ level: 'error', op: 'reclassify-misclassified-tour-batch-1', _id: t._id, error: msg });
    }
  }
  if (logEntries.length > 0) appendLog(logEntries);
  console.log(`\n  patched: ${patched} / errors: ${errors.length}`);
  for (const e of errors.slice(0, 10)) console.log(`    ${e._id}: ${e.error}`);
  if (errors.length > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
