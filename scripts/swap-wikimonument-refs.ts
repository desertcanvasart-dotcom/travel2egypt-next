/**
 * Swap wikiMonument references in `city.placesToGo` for their `guideArticle`
 * twins, dedup, and clean up.
 *
 * Context: 134 wikiMonument docs were consolidated into guideArticle docs in
 * session 57 (same slug, same content). But the cities' `placesToGo` arrays
 * still reference the old wikiMonument _ids. After this session's schema
 * change (which locked `placesToGo` to accept only guideArticle refs), the
 * sidebar dereference returns broken data — wikiMonument docs have null
 * titles, so the sidebar component filters them out as malformed entries.
 *
 * Net effect: Cairo and other cities show empty Places To Go sections.
 *
 * Fix per ref:
 *   - If the ref points to a `wikiMonument` doc, find its `guideArticle`
 *     twin (matched by slug) and update the ref to point at the twin.
 *   - Preserve the `_key` so existing array positions stay stable.
 *   - Dedup against guideArticle refs already in the array (from the
 *     fix-duplicate-attractions cleanup) — drop the wikiMonument ref if a
 *     guideArticle ref to the same slug already exists.
 *
 * Idempotent. --dry-run first.
 */
import { createClient, type SanityClient } from '@sanity/client';
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
  console.log(`\n=== Swap wikiMonument refs → guideArticle twins ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  // Build a map: wikiMonument slug → guideArticle twin _id
  const twins = await client.fetch<Array<{ slug: string; gaId: string }>>(`
    *[_type=="wikiMonument" && !(_id in path("drafts.**"))]{
      "slug": slug[_key=="en"][0].value.current,
      "gaId": *[_type=="guideArticle" && slug[_key=="en"][0].value.current == ^.slug[_key=="en"][0].value.current][0]._id
    }[defined(slug) && defined(gaId)]
  `);
  console.log(`Loaded ${twins.length} wikiMonument → guideArticle twin mappings`);
  const twinBySlug = new Map(twins.map((t) => [t.slug, t.gaId]));
  const wmIdToTwinId = new Map<string, string>();
  // Also build a lookup by wikiMonument _id → guideArticle _id (for cities
  // whose placesToGo refs use the wikiMonument _id directly)
  const wmDocs = await client.fetch<Array<{ _id: string; slug: string }>>(`
    *[_type=="wikiMonument" && !(_id in path("drafts.**"))]{ _id, "slug": slug[_key=="en"][0].value.current }
  `);
  for (const wm of wmDocs) {
    const twin = twinBySlug.get(wm.slug);
    if (twin) wmIdToTwinId.set(wm._id, twin);
  }
  console.log(`Built ${wmIdToTwinId.size} wikiMonument-id → guideArticle-id lookups\n`);

  // For each city, walk placesToGo, build new array with swaps + dedup
  const cities = await client.fetch<Array<{ _id: string; slug: string; placesToGo: Array<{ _key?: string; _ref: string; _type?: string }> | null }>>(`
    *[_type=="city" && !(_id in path("drafts.**"))]{ _id, "slug": slug[_key=="en"][0].value.current, placesToGo }
  `);

  let totalSwaps = 0;
  let totalDrops = 0;
  let citiesTouched = 0;

  for (const city of cities) {
    const current = city.placesToGo ?? [];
    if (current.length === 0) continue;

    const seenRefs = new Set<string>();
    const newArr: Array<{ _key: string; _ref: string; _type: 'reference' }> = [];
    let citySwaps = 0;
    let cityDrops = 0;

    for (const entry of current) {
      const replacement = wmIdToTwinId.get(entry._ref);
      const finalRef = replacement ?? entry._ref;
      if (seenRefs.has(finalRef)) {
        cityDrops++;
        continue;
      }
      seenRefs.add(finalRef);
      if (replacement) citySwaps++;
      newArr.push({
        _key: entry._key ?? `auto-${finalRef.replace(/[^a-z0-9]/gi, '').slice(0, 40)}`,
        _ref: finalRef,
        _type: 'reference',
      });
    }

    // Only patch if anything changed
    const changed = citySwaps > 0 || cityDrops > 0 || newArr.length !== current.length;
    if (!changed) continue;

    citiesTouched++;
    totalSwaps += citySwaps;
    totalDrops += cityDrops;
    console.log(`  ${city.slug}: ${current.length} → ${newArr.length}  (swaps=${citySwaps}, drops=${cityDrops})`);

    if (!args.dryRun) {
      try {
        await client.patch(city._id).set({ placesToGo: newArr }).commit({ visibility: 'sync' });
        appendLog({ phase: 'CLEANUP-wm-swap', cityId: city._id, citySlug: city.slug, swaps: citySwaps, drops: cityDrops, finalCount: newArr.length });
      } catch (err) {
        console.error(`    ✗ patch failed: ${(err as Error).message}`);
        throw err;
      }
    }
  }

  console.log(`\nSummary: cities touched=${citiesTouched}, total swaps=${totalSwaps}, total drops=${totalDrops}`);
  if (args.dryRun) console.log('Dry-run — no writes. Re-run with --commit.');
}

main().catch((err) => { console.error(err); process.exit(1); });
