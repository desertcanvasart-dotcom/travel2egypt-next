/**
 * Finishes the hotel-promotion phase that errored mid-flight:
 *   1. Re-point any internalLink references from the 5 promoted-from
 *      guideArticles to their new hotel docs (preserves outbound links).
 *   2. Delete the 5 promoted guideArticles.
 *   3. Append the 30 redirect rows (15 brand-rename + 15 promotion).
 *
 * Idempotent — guards against re-running.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');
const LOCALES = ['en', 'es', 'ja'];

/** old guideArticle _id → new hotel _id */
const PROMOTED: Array<{ from: string; to: string; oldSlug: string; canonicalSlug: string; city: string }> = [
  { from: 'wp-page-63832', to: 'hotel.dusit-thani-lake-view',       oldSlug: 'dusit-thani-lake-view-cairo',    canonicalSlug: 'dusit-thani-lake-view',       city: 'cairo' },
  { from: 'wp-page-64034', to: 'hotel.ghaliet-siwa-ecolodge',       oldSlug: 'ghaliet-ecolodge-siwa',          canonicalSlug: 'ghaliet-siwa-ecolodge',       city: 'siwa-oasis' },
  { from: 'wp-page-64048', to: 'hotel.shamsiya-camp-dakhla-oasis',  oldSlug: 'shamsiya-camp-dakhla-oasis',     canonicalSlug: 'shamsiya-camp-dakhla-oasis',  city: 'dakhla-oasis' },
  { from: 'wp-page-64054', to: 'hotel.al-tabuna-camp-dakhla-oasis', oldSlug: 'al-tabuna-camp-el-dakhla-oasis', canonicalSlug: 'al-tabuna-camp-dakhla-oasis', city: 'dakhla-oasis' },
  { from: 'wp-page-77016', to: 'hotel.la-maison-bleue-el-gouna',    oldSlug: 'la-maison-bleue-el-gouna',       canonicalSlug: 'la-maison-bleue-el-gouna',    city: 'al-gouna' },
];

/** brand-rename redirects (old hotels slug → new hotels slug) */
const BRAND_RENAMES: Array<{ oldSlug: string; newSlug: string }> = [
  { oldSlug: 'sofitel-legend-old-cataract',         newSlug: 'mandarin-oriental-old-cataract-aswan' },
  { oldSlug: 'sofitel-pavillon-winter-luxor',       newSlug: 'mandarin-oriental-winter-palace-luxor' },
  { oldSlug: 'grand-nile-tower-hotel-cairo',        newSlug: 'hilton-cairo-grand-nile' },
  { oldSlug: 'sharm-dreams-resort-sharm-el-sheikh', newSlug: 'jaz-sharm-dreams-resort' },
  { oldSlug: 'four-seasons-resort-sharm-alsheikh',  newSlug: 'the-four-seasons-at-sharm' },
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

/** Walk a portable-text array and rewrite internalLink _ref values per map. */
function rewriteRefs(value: any, repointMap: Map<string, string>): { value: any; changed: boolean } {
  if (!Array.isArray(value)) return { value, changed: false };
  let changed = false;
  const out = value.map((entry: any) => {
    // Field-level i18n shape: { _key: 'en', value: PtBlock[] }
    if (entry && typeof entry === 'object' && Array.isArray(entry.value)) {
      const r = rewriteBlocks(entry.value, repointMap);
      if (r.changed) changed = true;
      return { ...entry, value: r.blocks };
    }
    return entry;
  });
  if (out.every((e: any) => e && typeof e === 'object' && '_type' in e && e._type === 'block')) {
    const r = rewriteBlocks(out, repointMap);
    return { value: r.blocks, changed: r.changed };
  }
  return { value: out, changed };
}

function rewriteBlocks(blocks: any[], repointMap: Map<string, string>): { blocks: any[]; changed: boolean } {
  let changed = false;
  const out = blocks.map((b: any) => {
    if (!b || b._type !== 'block' || !Array.isArray(b.markDefs)) return b;
    const newMarkDefs = b.markDefs.map((md: any) => {
      if (md?._type === 'internalLink' && md.reference?._ref && repointMap.has(md.reference._ref)) {
        changed = true;
        return { ...md, reference: { ...md.reference, _ref: repointMap.get(md.reference._ref) } };
      }
      return md;
    });
    return { ...b, markDefs: newMarkDefs };
  });
  return { blocks: out, changed };
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Finish hotel promotion (re-point refs + delete + redirects) ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const repoint = new Map<string, string>(PROMOTED.map((p) => [p.from, p.to]));
  const fromIds = PROMOTED.map((p) => p.from);

  // ── 1. Find docs that reference the promoted-from ids ────────────────
  const referrers = await client.fetch<Array<any>>(
    `*[references($ids) && !(_id in path('drafts.**'))]{ ... }`,
    { ids: fromIds },
  );
  console.log(`Found ${referrers.length} doc(s) referencing the promoted guideArticles`);

  // ── 2. Plan + apply re-point patches ────────────────────────────────
  const patches: Array<{ _id: string; sets: Record<string, unknown> }> = [];
  for (const doc of referrers) {
    const sets: Record<string, unknown> = {};
    for (const field of ['body', 'overview', 'description']) {
      if (doc[field] === undefined) continue;
      const r = rewriteRefs(doc[field], repoint);
      if (r.changed) sets[field] = r.value;
    }
    // Also check placesToGo array (city docs)
    if (Array.isArray(doc.placesToGo)) {
      const newPtg = doc.placesToGo.map((e: any) =>
        e?._ref && repoint.has(e._ref) ? { ...e, _ref: repoint.get(e._ref) } : e,
      );
      const ptgChanged = newPtg.some((e: any, i: number) => e._ref !== doc.placesToGo[i]._ref);
      if (ptgChanged) sets.placesToGo = newPtg;
    }
    if (Object.keys(sets).length) patches.push({ _id: doc._id, sets });
  }

  console.log(`\nWill re-point refs in ${patches.length} doc(s):`);
  for (const p of patches) console.log(`  ${p._id}: fields ${Object.keys(p.sets).join(', ')}`);

  // ── 3. Check existing guideArticles still exist (idempotency) ────────
  const existing = await client.fetch<Array<{ _id: string }>>(`*[_id in $ids]{ _id }`, { ids: fromIds });
  const stillExistIds = new Set(existing.map((d) => d._id));
  const toDelete = fromIds.filter((id) => stillExistIds.has(id));
  console.log(`\nguideArticles to delete: ${toDelete.length} of ${fromIds.length}`);

  // ── 4. Redirect rows plan ────────────────────────────────────────────
  const redirectRows: string[] = [];
  for (const r of BRAND_RENAMES) {
    for (const loc of LOCALES) {
      const prefix = loc === 'en' ? '' : `/${loc}`;
      redirectRows.push(`${prefix}/hotels/${r.oldSlug},${prefix}/hotels/${r.newSlug},301`);
    }
  }
  for (const p of PROMOTED) {
    for (const loc of LOCALES) {
      const prefix = loc === 'en' ? '' : `/${loc}`;
      redirectRows.push(`${prefix}/guide/${p.city}/${p.oldSlug},${prefix}/hotels/${p.canonicalSlug},301`);
    }
  }
  console.log(`Redirect rows planned: ${redirectRows.length} (15 brand + 15 promote)`);

  // Idempotency: don't append redirect rows that already exist in the CSV
  let existingCsv = '';
  try { existingCsv = readFileSync(REDIRECT_CSV_PATH, 'utf8'); } catch {}
  const newRedirects = redirectRows.filter((row) => !existingCsv.includes(row));
  console.log(`After dedup vs existing CSV: ${newRedirects.length} new rows to append`);

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }

  // ── 5. APPLY: patch referrers, delete guideArticles, append redirects
  if (patches.length) {
    let tx = client.transaction();
    for (const p of patches) tx = tx.patch(p._id, (pp) => pp.set(p.sets));
    await tx.commit({ visibility: 'sync' });
    console.log(`✓ Re-pointed refs in ${patches.length} doc(s)`);
  }

  if (toDelete.length) {
    let tx = client.transaction();
    for (const id of toDelete) tx = tx.delete(id);
    await tx.commit({ visibility: 'sync' });
    console.log(`✓ Deleted ${toDelete.length} guideArticles`);
  }

  if (newRedirects.length) {
    appendFileSync(REDIRECT_CSV_PATH, '\n' + newRedirects.join('\n') + '\n', 'utf8');
    console.log(`✓ Appended ${newRedirects.length} redirect rows`);
  }

  appendLog({
    phase: 'HOTELS-finish-promotion',
    refsPatched: patches.length,
    guideArticlesDeleted: toDelete.length,
    redirectRowsAppended: newRedirects.length,
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
