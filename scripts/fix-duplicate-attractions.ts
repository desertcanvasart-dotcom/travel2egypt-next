/**
 * Cleanup pass after the May-2026 bulk MD upload.
 *
 * The bulk upload created 175 new `guideArticle` docs with `kind=attraction`.
 * Two distinct subsets:
 *
 *   - 24 "phantom duplicates" — same attraction as a pre-existing doc, but
 *     with a slug that differs by the "the-" article prefix (e.g., new
 *     `temple-of-amada` vs existing `the-temple-of-amada`). The pre-existing
 *     doc is the URL-stable one referenced by `city.placesToGo`. Root cause:
 *     the upload's city-pool assignment heuristic used substring-on-slug,
 *     which can't see existing docs whose slug doesn't contain the city name.
 *
 *   - 151 truly-new attractions — content from the corpus that has no Sanity
 *     counterpart. These need to be appended to their city's `placesToGo`
 *     array so the sidebar renders them.
 *
 * Two phases:
 *
 *   Phase 1 — Merge duplicates:
 *     For each pair, copy the new doc's body/title/summary/seo onto the
 *     existing doc (keeping its stable slug + ID + city.placesToGo ref),
 *     then delete the new doc.
 *
 *   Phase 2 — Place-to-go references:
 *     For each truly-new attraction, append its ID to the parent city's
 *     `placesToGo` array (deduped — no double-adds on re-run).
 *
 * Idempotent. --dry-run first.
 *
 * Usage:
 *   npx tsx scripts/fix-duplicate-attractions.ts --dry-run
 *   npx tsx scripts/fix-duplicate-attractions.ts --commit
 */
import { createClient, type SanityClient, type SanityDocument } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

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
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') die(`Refusing to run against ${dataset}.`);
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) die('SANITY_STAGING_API_WRITE_TOKEN required');
  return createClient({
    projectId: projectId!, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

function appendLog(entry: Record<string, unknown>): void {
  mkdirSync(resolve(process.cwd(), 'migration'), { recursive: true });
  appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

interface AttractionRow {
  _id: string;
  slug: string;
  citySlug: string | null;
  title: unknown;
  summary: unknown;
  body: unknown;
  seo: unknown;
  parentCityRef: string | null;
  createdAt: string;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Duplicate-attraction cleanup ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();

  // Fetch every kind=attraction doc (post-upload state)
  const all = await client.fetch<AttractionRow[]>(`
    *[_type=="guideArticle" && !(_id in path("drafts.**")) && kind=="attraction"]{
      _id,
      "slug": slug[_key=="en"][0].value.current,
      "citySlug": parentCity->slug[_key=="en"][0].value.current,
      title, summary, body, seo,
      "parentCityRef": parentCity._ref,
      "createdAt": _createdAt
    }
  `);
  console.log(`Loaded ${all.length} attraction docs`);

  // Build a slug index
  const bySlug = new Map<string, AttractionRow>();
  for (const a of all) if (a.slug) bySlug.set(a.slug, a);

  // ── Phase 1: identify duplicate pairs ──────────────────────────────
  // Pair = same city, slugs differ only by leading "the-" prefix.
  interface Pair { oldDoc: AttractionRow; newDoc: AttractionRow }
  const pairs: Pair[] = [];
  const seenInPair = new Set<string>();
  for (const a of all) {
    if (seenInPair.has(a._id) || !a.slug) continue;
    // Variant 1: this doc has no "the-" prefix; check if "the-" + slug exists
    if (!a.slug.startsWith('the-')) {
      const withThe = bySlug.get(`the-${a.slug}`);
      if (withThe && withThe.citySlug === a.citySlug) {
        pairs.push({ oldDoc: withThe, newDoc: a });
        seenInPair.add(a._id);
        seenInPair.add(withThe._id);
      }
    }
  }
  console.log(`Phase 1 — duplicate pairs to merge: ${pairs.length}`);

  // ── Phase 2: truly-new attractions (created today, not in any pair) ─
  // Cutoff: anything created on the bulk-upload day
  const newAttractions = all.filter((a) => {
    if (seenInPair.has(a._id)) return false;
    if (!a._id.startsWith('guideArticle.')) return false;
    return a.createdAt >= '2026-05-27';
  });
  console.log(`Phase 2 — truly-new attractions to add to city.placesToGo: ${newAttractions.length}`);

  // ── Plan output ────────────────────────────────────────────────────
  if (args.dryRun) {
    console.log('\nPhase 1 sample (first 5 merges):');
    for (const { oldDoc, newDoc } of pairs.slice(0, 5)) {
      console.log(`  ${oldDoc.citySlug}: ${newDoc.slug} → merge into ${oldDoc.slug} (delete new)`);
    }
    if (pairs.length > 5) console.log(`  …and ${pairs.length - 5} more`);

    console.log('\nPhase 2 sample (first 10 placesToGo additions):');
    const byCity = new Map<string, string[]>();
    for (const a of newAttractions) {
      const key = a.citySlug ?? '(no city)';
      if (!byCity.has(key)) byCity.set(key, []);
      byCity.get(key)!.push(a.slug);
    }
    for (const [city, slugs] of [...byCity.entries()].slice(0, 10)) {
      console.log(`  ${city}: +${slugs.length} attraction(s): ${slugs.slice(0, 3).join(', ')}${slugs.length > 3 ? '…' : ''}`);
    }
    console.log(`\nTotal cities receiving placesToGo additions: ${byCity.size}`);
    return;
  }

  // ── Phase 1 commit: merge + delete ─────────────────────────────────
  console.log('\nPhase 1 — merging duplicates...');
  let merged = 0;
  for (const { oldDoc, newDoc } of pairs) {
    try {
      await client
        .transaction()
        .patch(oldDoc._id, (p) =>
          p.set({
            title: newDoc.title,
            summary: newDoc.summary,
            body: newDoc.body,
            ...(newDoc.seo ? { seo: newDoc.seo } : {}),
          }),
        )
        .delete(newDoc._id)
        .commit({ visibility: 'sync' });
      merged++;
      appendLog({ phase: 'CLEANUP-merge', kept: oldDoc._id, deleted: newDoc._id, citySlug: oldDoc.citySlug });
      console.log(`  ✓ ${oldDoc.citySlug}: ${newDoc.slug} → ${oldDoc.slug}`);
    } catch (err) {
      console.error(`  ✗ ${oldDoc.slug}: ${(err as Error).message}`);
      throw err;
    }
  }
  console.log(`Phase 1 done. Merged ${merged} duplicate pairs.`);

  // ── Phase 2 commit: append to city.placesToGo ──────────────────────
  console.log('\nPhase 2 — appending to city.placesToGo...');
  // Group additions by city
  const additionsByCity = new Map<string, AttractionRow[]>();
  for (const a of newAttractions) {
    if (!a.citySlug) continue;
    if (!additionsByCity.has(a.citySlug)) additionsByCity.set(a.citySlug, []);
    additionsByCity.get(a.citySlug)!.push(a);
  }

  // For each city, fetch current placesToGo, then dedup-append new entries.
  type CityRefRow = { _id: string; slug: string; placesToGo: Array<{ _ref?: string; _key?: string }> | null };
  for (const [citySlug, additions] of additionsByCity) {
    const cityDoc = await client.fetch<CityRefRow>(
      `*[_type=="city" && slug[_key=="en"][0].value.current==$slug][0]{ _id, "slug": slug[_key=="en"][0].value.current, placesToGo }`,
      { slug: citySlug },
    );
    if (!cityDoc) { console.error(`  ✗ city missing: ${citySlug}`); continue; }
    const existing = (cityDoc.placesToGo ?? []).map((p) => p._ref).filter(Boolean);
    const existingSet = new Set(existing);
    const newRefs = additions.filter((a) => !existingSet.has(a._id));
    if (newRefs.length === 0) {
      console.log(`  - ${citySlug}: already up to date`);
      continue;
    }
    const newEntries = newRefs.map((a) => ({
      _type: 'reference' as const,
      _ref: a._id,
      _key: `auto-${a.slug.slice(0, 40)}`,
    }));
    try {
      await client
        .patch(cityDoc._id)
        .setIfMissing({ placesToGo: [] })
        .append('placesToGo', newEntries)
        .commit({ visibility: 'sync' });
      for (const a of newRefs) appendLog({ phase: 'CLEANUP-append', cityId: cityDoc._id, citySlug, addedRef: a._id });
      console.log(`  ✓ ${citySlug}: +${newRefs.length} (was ${existing.length})`);
    } catch (err) {
      console.error(`  ✗ ${citySlug}: ${(err as Error).message}`);
      throw err;
    }
  }
  console.log('\n✓ Cleanup complete.');
}

main().catch((err) => { console.error(err); process.exit(1); });
