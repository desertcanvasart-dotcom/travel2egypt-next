/**
 * Migrate the 15 existing day-tour landing guideArticles into tourLanding docs.
 *
 * Source: 9 private-day-tours + 6 small-group-day-tours guideArticles, each
 *   carrying rich editorial body (some 200+ blocks) from the WP import.
 * Target: tourLanding doc per source. Fields copied: title, slug, summary,
 *   body→intro, heroImage, migration.wpUrl. Discriminators set: category
 *   (tourCategory ref) and destinationCity (city ref derived from
 *   guideArticle.parentCity).
 *
 * Source docs are NOT deleted (yet) — set hidden: true so they leave the
 * city sidebar. After the catch-all routing ships and frontend stops
 * querying guideArticle for these slugs, a follow-up pass deletes them.
 *
 * Adds 3 redirect rows per migrated doc (/guide/<city>/<slug> → /<slug>)
 * for the old in-guide URL.
 *
 * Idempotent.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');
const LOCALES = ['en', 'es', 'ja'] as const;

interface LandingSpec {
  sourceId: string;            // guideArticle _id (WP-imported, like wp-page-86832)
  enSlug: string;
  cityRef: string;             // city doc _id (parentCity._ref on the source)
  categoryRef: 'tourCategory.private-day-tour' | 'tourCategory.group-day-tour';
}

const LANDINGS: LandingSpec[] = [
  // private day tours (9 cities) — parentCity refs come from earlier query
  { sourceId: 'wp-page-86817', enSlug: 'al-gouna-private-day-tours',      cityRef: '', categoryRef: 'tourCategory.private-day-tour' },
  { sourceId: 'wp-page-87070', enSlug: 'alexandria-private-day-tours',    cityRef: '', categoryRef: 'tourCategory.private-day-tour' },
  { sourceId: 'wp-page-87064', enSlug: 'aswan-private-day-tours',         cityRef: '', categoryRef: 'tourCategory.private-day-tour' },
  { sourceId: 'wp-page-86832', enSlug: 'cairo-private-day-tours',         cityRef: '', categoryRef: 'tourCategory.private-day-tour' },
  { sourceId: 'wp-page-86858', enSlug: 'hurghada-private-day-tours',      cityRef: '', categoryRef: 'tourCategory.private-day-tour' },
  { sourceId: 'wp-page-86841', enSlug: 'luxor-private-day-tours',         cityRef: '', categoryRef: 'tourCategory.private-day-tour' },
  { sourceId: 'wp-page-87001', enSlug: 'marsa-alam-private-day-tours',    cityRef: '', categoryRef: 'tourCategory.private-day-tour' },
  { sourceId: 'wp-page-86936', enSlug: 'safaga-private-day-tours',        cityRef: '', categoryRef: 'tourCategory.private-day-tour' },
  { sourceId: 'wp-page-86911', enSlug: 'sharm-el-sheikh-private-day-tours', cityRef: '', categoryRef: 'tourCategory.private-day-tour' },
  // group day tours (6 cities)
  { sourceId: 'wp-page-87408',  enSlug: 'aswan-small-group-day-tours',          cityRef: '', categoryRef: 'tourCategory.group-day-tour' },
  { sourceId: 'wp-page-87739',  enSlug: 'cairo-small-group-day-tours',          cityRef: '', categoryRef: 'tourCategory.group-day-tour' },
  { sourceId: 'wp-page-114936', enSlug: 'hurghada-small-group-day-tours',       cityRef: '', categoryRef: 'tourCategory.group-day-tour' },
  { sourceId: 'wp-page-87387',  enSlug: 'luxor-small-group-day-tours',          cityRef: '', categoryRef: 'tourCategory.group-day-tour' },
  { sourceId: 'wp-page-114934', enSlug: 'marsa-alam-small-group-day-tours',     cityRef: '', categoryRef: 'tourCategory.group-day-tour' },
  { sourceId: 'wp-page-114938', enSlug: 'sharm-el-sheikh-small-group-day-tours', cityRef: '', categoryRef: 'tourCategory.group-day-tour' },
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
  console.log(`\n=== Migrate 15 day-tour landings → tourLanding ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  // Fetch all sources in one query
  const sources = await client.fetch<Array<any>>(`*[_id in $ids]`, {
    ids: LANDINGS.map((l) => l.sourceId),
  });
  const byId = new Map<string, any>(sources.map((d) => [d._id, d]));

  // Fetch all existing tourLanding docs to detect idempotent re-runs
  const targetIds = LANDINGS.map((l) => `tourLanding.${l.enSlug}`);
  const existing = await client.fetch<Array<{ _id: string }>>(`*[_id in $ids]{ _id }`, { ids: targetIds });
  const existingSet = new Set(existing.map((d) => d._id));

  console.log('Plan:');
  const toMigrate: Array<{ spec: LandingSpec; src: any; targetId: string }> = [];
  for (const spec of LANDINGS) {
    const src = byId.get(spec.sourceId);
    const targetId = `tourLanding.${spec.enSlug}`;
    if (!src) { console.log(`  ✗ ${spec.sourceId} not found — skipping`); continue; }
    if (existingSet.has(targetId)) { console.log(`  - ${spec.enSlug.padEnd(42)} already migrated — skipping`); continue; }
    const cityRef = src.parentCity?._ref;
    if (!cityRef) { console.log(`  ✗ ${spec.sourceId} has no parentCity — skipping`); continue; }
    toMigrate.push({ spec: { ...spec, cityRef }, src, targetId });
    console.log(`  + ${spec.enSlug.padEnd(42)} city=${cityRef.padEnd(14)} ← ${spec.sourceId}`);
  }
  console.log(`\nCreate: ${toMigrate.length}  · skip: ${LANDINGS.length - toMigrate.length}`);

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (toMigrate.length === 0) { console.log('Nothing to do.'); return; }

  // Build new docs + a tx that creates them, patches source to hidden, and adds redirects
  let tx = client.transaction();
  const redirectRows: string[] = [];

  for (const { spec, src, targetId } of toMigrate) {
    const doc: any = {
      _id: targetId,
      _type: 'tourLanding',
      category: { _type: 'reference', _ref: spec.categoryRef },
      destinationCity: { _type: 'reference', _ref: spec.cityRef },
      title: src.title ?? [{ _key: 'en', _type: 'object', value: spec.enSlug.replace(/-/g, ' ') }],
      slug: src.slug ?? [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: spec.enSlug } }],
      summary: src.summary,
      // Map body → intro
      intro: src.body,
      heroImage: src.heroImage,
      migration: src.migration ?? { wpUrl: `https://travel2egypt.org/${spec.enSlug}/` },
    };
    tx = tx.createIfNotExists(doc);
    // Soft-archive source: set hidden=true so it leaves the city sidebar
    tx = tx.patch(spec.sourceId, (p) => p.set({ hidden: true }));

    // Redirect rows: old in-guide path → new root path (3 locales)
    const citySlugEn = src.parentCity?._ref; // we don't have city slug directly, fetch in a moment if needed
    // We do know parentCity slug because we set placesToGo etc; safer to fetch later. For now generate from spec heuristically:
    const cityFromSlug = spec.enSlug.replace(/-private-day-tours$/, '').replace(/-small-group-day-tours$/, '');
    for (const loc of LOCALES) {
      const prefix = loc === 'en' ? '' : `/${loc}`;
      redirectRows.push(`${prefix}/guide/${cityFromSlug}/${spec.enSlug},${prefix}/${spec.enSlug},301`);
    }
  }
  await tx.commit({ visibility: 'sync' });

  // Append redirect rows
  appendFileSync(REDIRECT_CSV_PATH, '\n' + redirectRows.join('\n') + '\n', 'utf8');
  for (const { spec, targetId } of toMigrate) {
    appendLog({
      phase: 'S48-tourLanding-migrate-day',
      source: spec.sourceId,
      target: targetId,
      enSlug: spec.enSlug,
      category: spec.categoryRef,
      destinationCity: spec.cityRef,
    });
  }
  console.log(`✓ Created ${toMigrate.length} tourLanding docs.`);
  console.log(`✓ Soft-archived ${toMigrate.length} source guideArticles (hidden=true).`);
  console.log(`✓ Appended ${redirectRows.length} redirect rows.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
