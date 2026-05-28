/**
 * Consolidate duplicate Places To Go entries on the Giza city doc.
 *
 * Operator-confirmed pairs (keep ← delete). For each pair:
 *   1. Body-length sanity check — if the delete doc's body is more than
 *      20% larger than the keep doc's body, halt and surface for manual
 *      review. Most pairs were synced to the same MD source during the
 *      bulk upload, so they should be within a few %.
 *   2. Delete the doc from Sanity.
 *   3. Remove its _ref from the parent city's `placesToGo` array.
 *   4. Append three redirect rows (en/es/ja) to migration/redirect-map.csv
 *      so old URLs forward to the keep slug. Preserves SEO + inbound links.
 *
 * Scope: Giza city only (wp-page-58854). Same approach can be applied to
 * other cities by adding rows to PAIRS below.
 *
 * Idempotent — re-running is a no-op if the delete docs are already gone.
 *
 * Usage:
 *   npx tsx scripts/dedup-giza-places-to-go.ts --dry-run
 *   npx tsx scripts/dedup-giza-places-to-go.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');
const CITY_ID = 'wp-page-58854';
const CITY_SLUG = 'giza';
const LOCALES = ['en', 'es', 'ja'] as const;

interface Pair { keep: string; del: string }

// Operator-confirmed Giza duplicate pairs.
const PAIRS: Pair[] = [
  // Abu Rawash
  { keep: 'pyramid-of-djedefre-at-abu-rawash', del: 'abu-rawash-pyramid-of-djedefre' },
  // Abusir
  { keep: 'pyramid-of-khentkaus-ii-at-abusir', del: 'abusir-pyramid-of-khentkawes' },
  { keep: 'pyramid-of-neferirkare-at-abusir',  del: 'abusir-pyramid-of-neferirkare' },
  { keep: 'pyramid-of-sahure-at-abusir',       del: 'abusir-pyramid-of-sahure' },
  // Dahshur
  { keep: 'the-bent-pyramid-of-sneferu',       del: 'the-bent-pyramid' },
  { keep: 'the-red-pyramid-of-sneferu',        del: 'the-red-pyramid' },
  { keep: 'the-red-pyramid-of-sneferu',        del: 'the-northern-pyramid' },
  { keep: 'the-white-pyramid-of-amenemhat-ii', del: 'the-white-pyramid' },
  // Giza Plateau
  { keep: 'the-great-pyramid-of-khufu',        del: 'pyramid-of-khufu' },
  { keep: 'the-solar-boat-of-khufu',           del: 'the-solar-boat-museum' },
  // Memphis
  { keep: 'mit-rahina-museum',                 del: 'memphis-mit-rahina-museum' },
  // Saqqara
  { keep: 'imhotep-museum-at-saqqara',         del: 'imhotep-museum' },
  { keep: 'tomb-of-general-horemheb-at-saqqara', del: 'tomb-of-general-horemheb' },
  { keep: 'tomb-of-mereruka-at-saqqara',       del: 'tomb-of-mereruka' },
  { keep: 'the-saqqara-necropolis',            del: 'saqqara' },
  // Zawyet el-Aryan
  { keep: 'the-layer-pyramid-of-khaba-at-zawyet-el-aryan', del: 'the-pyramid-of-khaba' },
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

function bodyText(body: any[] | undefined): string {
  if (!Array.isArray(body)) return '';
  let out = '';
  for (const localeEntry of body) {
    if (localeEntry?._key !== 'en') continue; // measure EN body only — consistent reference
    const blocks = localeEntry.value;
    if (!Array.isArray(blocks)) continue;
    for (const b of blocks) {
      if (b?._type === 'block' && Array.isArray(b.children)) {
        for (const c of b.children) {
          if (typeof c?.text === 'string') out += c.text + '\n';
        }
      }
    }
  }
  return out;
}

interface Resolved { keepId: string; keepLen: number; delId: string; delLen: number; pair: Pair }

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Giza placesToGo de-duplication ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();

  // Resolve each pair: find _ids by slug + city, measure body length.
  const resolved: Resolved[] = [];
  const skipped: Array<{ pair: Pair; reason: string }> = [];
  for (const pair of PAIRS) {
    const r = await client.fetch<Array<{ _id: string; slug: string; body: any[] }>>(
      `*[_type=="guideArticle" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current in [$keep, $del] && parentCity._ref==$cityId]{
        _id, "slug": slug[_key=="en"][0].value.current, body
      }`,
      { keep: pair.keep, del: pair.del, cityId: CITY_ID },
    );
    const keep = r.find((d) => d.slug === pair.keep);
    const del = r.find((d) => d.slug === pair.del);
    if (!keep && !del) { skipped.push({ pair, reason: 'neither doc found' }); continue; }
    if (!keep) { skipped.push({ pair, reason: `keep slug "${pair.keep}" not found` }); continue; }
    if (!del) { skipped.push({ pair, reason: `delete slug "${pair.del}" already gone (idempotent skip)` }); continue; }
    resolved.push({
      keepId: keep._id,
      keepLen: bodyText(keep.body).length,
      delId: del._id,
      delLen: bodyText(del.body).length,
      pair,
    });
  }

  console.log('Plan:');
  let unsafePairs = 0;
  for (const r of resolved) {
    const ratio = r.keepLen === 0 ? Infinity : r.delLen / r.keepLen;
    const safe = ratio <= 1.2;
    if (!safe) unsafePairs++;
    console.log(
      `  ${safe ? '✓' : '⚠'}  delete ${r.pair.del.padEnd(50)} → keep ${r.pair.keep}` +
      `   (body ${r.delLen} vs ${r.keepLen} chars, ratio ${ratio.toFixed(2)})`,
    );
  }
  if (skipped.length) {
    console.log('\nSkipped:');
    for (const s of skipped) console.log(`  - ${s.pair.del}  (${s.reason})`);
  }
  console.log(`\nTo delete: ${resolved.length}  (${unsafePairs} need manual review — delete doc body > 20% larger than keep)`);

  if (unsafePairs > 0 && args.commit) {
    die(
      `Refusing to delete: ${unsafePairs} pair(s) have delete doc bodies more than 20% larger than the keep. Review manually, then re-run with --commit (after either accepting the loss or merging content into the keep first).`,
    );
  }

  if (args.dryRun) {
    console.log('\nDry-run — no writes. Re-run with --commit to apply.');
    return;
  }

  if (resolved.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  // Pull the current placesToGo array, filter out the deleted refs, write back.
  const cityDoc = await client.fetch<{ placesToGo: Array<{ _key?: string; _ref: string }> }>(
    `*[_id==$id][0]{ placesToGo }`, { id: CITY_ID },
  );
  if (!cityDoc?.placesToGo) die('Could not read Giza placesToGo array.');

  const delIds = new Set(resolved.map((r) => r.delId));
  const newPlacesToGo = cityDoc.placesToGo.filter((entry) => !delIds.has(entry._ref));
  console.log(`\nGiza placesToGo: ${cityDoc.placesToGo.length} → ${newPlacesToGo.length} entries`);

  // Build redirect CSV rows (3 locales per pair).
  const redirectRows: string[] = [];
  for (const r of resolved) {
    for (const loc of LOCALES) {
      const prefix = loc === 'en' ? '' : `/${loc}`;
      redirectRows.push(`${prefix}/guide/${CITY_SLUG}/${r.pair.del},${prefix}/guide/${CITY_SLUG}/${r.pair.keep},301`);
    }
  }

  // Single transaction: patch city + delete all dup docs.
  let tx = client.transaction();
  tx = tx.patch(CITY_ID, (p) => p.set({ placesToGo: newPlacesToGo }));
  for (const r of resolved) tx = tx.delete(r.delId);
  await tx.commit({ visibility: 'sync' });

  // Append redirects.
  appendFileSync(REDIRECT_CSV_PATH, '\n' + redirectRows.join('\n') + '\n', 'utf8');
  for (const r of resolved) {
    appendLog({
      phase: 'CLEANUP-giza-dedup',
      city: CITY_SLUG,
      deleted: r.delId,
      keptSlug: r.pair.keep,
      delSlug: r.pair.del,
      delBodyLen: r.delLen,
      keepBodyLen: r.keepLen,
    });
  }
  console.log(`\n✓ Deleted ${resolved.length} docs`);
  console.log(`✓ Updated giza.placesToGo (${cityDoc.placesToGo.length} → ${newPlacesToGo.length})`);
  console.log(`✓ Appended ${redirectRows.length} redirect rows to ${REDIRECT_CSV_PATH}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
