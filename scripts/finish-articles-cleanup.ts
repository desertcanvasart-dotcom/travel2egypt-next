/**
 * Finishes the articles bulk import that hit reference constraints:
 *   1. Re-point internal references from stale duplicate articles to the
 *      canonical sibling.
 *   2. Delete the translation.metadata docs that link stale siblings.
 *   3. Delete the stale article docs (EN + ES + JA per pair).
 *
 * Idempotent.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

/** Stale (old) EN slug → canonical EN slug */
const STALE_PAIRS: Array<{ staleSlug: string; canonicalSlug: string }> = [
  { staleSlug: '4-day-egypt-travel-itnarary',   canonicalSlug: '4-day-egypt-travel-itinerary' },
  { staleSlug: 'month-by-month-guide-to-egypt', canonicalSlug: 'best-time-to-visit-egypt' },
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

/** Walk PT (i18n array OR flat block array) and re-point internalLink _refs. */
function rewriteRefs(value: any, repointMap: Map<string, string>): { value: any; changed: boolean } {
  if (!Array.isArray(value)) return { value, changed: false };
  let changed = false;
  const out = value.map((entry: any) => {
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
  console.log(`\n=== Finish articles cleanup (re-point + delete stale duplicates) ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  // Resolve stale + canonical doc IDs + siblings (by migration.wpId)
  interface Pair {
    staleSlug: string; canonicalSlug: string;
    stale: { en?: string; es?: string; ja?: string };
    canonical: { en?: string; es?: string; ja?: string };
  }
  const pairs: Pair[] = [];
  for (const p of STALE_PAIRS) {
    const staleEn = await client.fetch<{ _id: string; wpId: number | string | null } | null>(
      `*[_type=='article' && language=='en' && slug.current==$s][0]{ _id, "wpId": migration.wpId }`,
      { s: p.staleSlug },
    );
    const canonEn = await client.fetch<{ _id: string; wpId: number | string | null } | null>(
      `*[_type=='article' && language=='en' && slug.current==$s][0]{ _id, "wpId": migration.wpId }`,
      { s: p.canonicalSlug },
    );
    if (!staleEn) { console.log(`  - ${p.staleSlug}: already gone, skipping`); continue; }
    if (!canonEn) { console.log(`  ✗ ${p.canonicalSlug}: canonical not found, skipping`); continue; }
    const staleSibs = staleEn.wpId
      ? await client.fetch<Array<{ _id: string; language: string }>>(
          `*[_type=='article' && migration.wpId==$w && language != 'en']{ _id, language }`,
          { w: staleEn.wpId })
      : [];
    const canonSibs = canonEn.wpId
      ? await client.fetch<Array<{ _id: string; language: string }>>(
          `*[_type=='article' && migration.wpId==$w && language != 'en']{ _id, language }`,
          { w: canonEn.wpId })
      : [];
    const pair: Pair = {
      staleSlug: p.staleSlug, canonicalSlug: p.canonicalSlug,
      stale: { en: staleEn._id },
      canonical: { en: canonEn._id },
    };
    for (const s of staleSibs) if (s.language === 'es' || s.language === 'ja') pair.stale[s.language as 'es'|'ja'] = s._id;
    for (const s of canonSibs) if (s.language === 'es' || s.language === 'ja') pair.canonical[s.language as 'es'|'ja'] = s._id;
    pairs.push(pair);
  }

  // Build repoint map: stale doc _id → canonical doc _id (per-locale)
  const repointMap = new Map<string, string>();
  for (const p of pairs) {
    if (p.stale.en && p.canonical.en) repointMap.set(p.stale.en, p.canonical.en);
    if (p.stale.es && p.canonical.es) repointMap.set(p.stale.es, p.canonical.es);
    if (p.stale.ja && p.canonical.ja) repointMap.set(p.stale.ja, p.canonical.ja);
  }
  const staleIds = [...repointMap.keys()];

  console.log(`\nPairs to delete (${pairs.length}):`);
  for (const p of pairs) {
    console.log(`  ${p.staleSlug} → ${p.canonicalSlug}`);
    console.log(`    stale: en=${p.stale.en} es=${p.stale.es ?? '-'} ja=${p.stale.ja ?? '-'}`);
    console.log(`    canon: en=${p.canonical.en} es=${p.canonical.es ?? '-'} ja=${p.canonical.ja ?? '-'}`);
  }

  // Find all references to stale docs
  const refs = await client.fetch<Array<any>>(`*[references($ids) && !(_id in path('drafts.**'))]{ ... }`, { ids: staleIds });
  console.log(`\nReferences to stale docs: ${refs.length} (excluding drafts)`);

  // Plan content patches (PT-field repoints) for non-translation.metadata docs
  // and outright deletion of translation.metadata.* docs (i18n plugin will
  // rebuild them on next Studio open if needed).
  interface Patch { _id: string; sets: Record<string, unknown> }
  const patches: Patch[] = [];
  const tmDeletes: string[] = [];
  for (const doc of refs) {
    if (doc._type === 'translation.metadata') { tmDeletes.push(doc._id); continue; }
    const sets: Record<string, unknown> = {};
    for (const field of ['body', 'overview', 'description']) {
      if (doc[field] === undefined) continue;
      const r = rewriteRefs(doc[field], repointMap);
      if (r.changed) sets[field] = r.value;
    }
    if (Object.keys(sets).length) patches.push({ _id: doc._id, sets });
  }
  console.log(`  re-point patches:        ${patches.length}`);
  console.log(`  translation.metadata.*:  ${tmDeletes.length}`);

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }

  // ── APPLY ────────────────────────────────────────────────────────────
  if (patches.length) {
    let tx = client.transaction();
    for (const p of patches) tx = tx.patch(p._id, (pp) => pp.set(p.sets));
    await tx.commit({ visibility: 'sync' });
    console.log(`✓ Re-pointed refs in ${patches.length} doc(s)`);
  }
  if (tmDeletes.length) {
    let tx = client.transaction();
    for (const id of tmDeletes) tx = tx.delete(id);
    await tx.commit({ visibility: 'sync' });
    console.log(`✓ Deleted ${tmDeletes.length} translation.metadata doc(s)`);
  }
  // Delete stale articles + siblings
  if (staleIds.length) {
    let tx = client.transaction();
    for (const id of staleIds) tx = tx.delete(id);
    await tx.commit({ visibility: 'sync' });
    console.log(`✓ Deleted ${staleIds.length} stale article doc(s)`);
  }

  appendLog({
    phase: 'ARTICLES-finish-cleanup',
    pairs: pairs.map((p) => ({ stale: p.staleSlug, canonical: p.canonicalSlug })),
    refPatches: patches.length, tmDeletes: tmDeletes.length, articleDeletes: staleIds.length,
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
