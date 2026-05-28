/**
 * Consolidate the remaining placesToGo duplicates surfaced by the audit:
 * 4 spelling/variant pairs in Cairo + 1 slug-collision pair in Sharm.
 *
 * Operator-confirmed pairs (keep ← delete). For each pair:
 *   1. Body-length safety check (delete doc must not be >20% larger).
 *   2. Delete the doc.
 *   3. Remove its _ref from the parent city's `placesToGo` array.
 *   4. Append redirect rows (en/es/ja) — EXCEPT for the Sharm pair, which
 *      shares an identical slug between the two docs (no URL change after
 *      delete, so no redirect needed).
 *
 * Idempotent.
 *
 * Usage:
 *   npx tsx scripts/dedup-cairo-sharm-places.ts --dry-run
 *   npx tsx scripts/dedup-cairo-sharm-places.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');
const LOCALES = ['en', 'es', 'ja'] as const;

interface PairSpec {
  citySlug: string;
  cityId: string;
  keepSlug: string;
  delSlug: string;
  /**
   * If true, both docs share the same EN slug — deleting the dup leaves
   * the URL unchanged, so no redirect row should be added. (Sharm nabq case.)
   */
  identicalSlug?: boolean;
  /**
   * For docs whose `_id` isn't deterministic from slug+city — required for
   * the Sharm case where wp-page-60770 needs to be referenced explicitly.
   */
  delById?: string;
}

const PAIRS: PairSpec[] = [
  // Cairo (4 dupes, all with redirects)
  { citySlug: 'cairo', cityId: 'wp-page-83284', keepSlug: 'mosque-of-al-mu-ayyad-shaykh',   delSlug: 'mosque-of-al-muayyad-shaykh' },
  { citySlug: 'cairo', cityId: 'wp-page-83284', keepSlug: 'mosque-of-muhammad-ali',         delSlug: 'mosque-of-mohammed-ali' },
  { citySlug: 'cairo', cityId: 'wp-page-83284', keepSlug: 'sabil-of-muhammad-ali-pasha',    delSlug: 'sabil-of-muhammed-ali-pasha' },
  { citySlug: 'cairo', cityId: 'wp-page-83284', keepSlug: 'egyptian-museum-of-antiquities', delSlug: 'the-egyptian-museum' },
  // Sharm El-Sheikh — slug collision: two docs sharing identical slug. Delete the WP-imported one explicitly by _id.
  { citySlug: 'sharm-el-sheikh', cityId: 'wp-page-58927', keepSlug: 'nabq-national-park', delSlug: 'nabq-national-park', identicalSlug: true, delById: 'wp-page-60770' },
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

function bodyTextLen(body: any[] | undefined): number {
  if (!Array.isArray(body)) return 0;
  let n = 0;
  for (const entry of body) {
    if (entry?._key !== 'en') continue;
    if (!Array.isArray(entry.value)) continue;
    for (const b of entry.value) {
      if (b?._type === 'block' && Array.isArray(b.children)) {
        for (const c of b.children) if (typeof c?.text === 'string') n += c.text.length;
      }
    }
  }
  return n;
}

interface Resolved { keepId: string; keepLen: number; delId: string; delLen: number; spec: PairSpec }

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Cairo + Sharm placesToGo de-duplication ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();

  const resolved: Resolved[] = [];
  for (const spec of PAIRS) {
    // Resolve keep doc by slug + parentCity
    const keep = await client.fetch<{ _id: string; body: any[] } | null>(
      `*[_type=="guideArticle" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$slug && parentCity._ref==$cityId][0]{ _id, body }`,
      { slug: spec.keepSlug, cityId: spec.cityId },
    );
    // Resolve delete doc — by explicit _id if given, otherwise by slug + parentCity
    const del = spec.delById
      ? await client.fetch<{ _id: string; body: any[] } | null>(`*[_id==$id][0]{ _id, body }`, { id: spec.delById })
      : await client.fetch<{ _id: string; body: any[] } | null>(
          `*[_type=="guideArticle" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$slug && parentCity._ref==$cityId && _id != $keepId][0]{ _id, body }`,
          { slug: spec.delSlug, cityId: spec.cityId, keepId: keep?._id ?? '' },
        );
    if (!keep) { console.log(`  ✗ keep slug "${spec.keepSlug}" not found — skipping`); continue; }
    if (!del) { console.log(`  - delete "${spec.delSlug}" already gone (idempotent) — skipping`); continue; }
    resolved.push({
      keepId: keep._id, keepLen: bodyTextLen(keep.body),
      delId: del._id, delLen: bodyTextLen(del.body), spec,
    });
  }

  console.log('Plan:');
  let unsafe = 0;
  for (const r of resolved) {
    const ratio = r.keepLen === 0 ? Infinity : r.delLen / r.keepLen;
    const safe = ratio <= 1.2;
    if (!safe) unsafe++;
    const note = r.spec.identicalSlug ? ' [identical slug — no redirect]' : '';
    console.log(`  ${safe ? '✓' : '⚠'}  ${r.spec.citySlug}: delete ${r.delId.padEnd(48)} → keep ${r.spec.keepSlug}   (body ${r.delLen} vs ${r.keepLen} chars, ratio ${ratio.toFixed(2)})${note}`);
  }
  console.log(`\nTo delete: ${resolved.length}  (${unsafe} pair(s) with delete body > 20% larger than keep)`);
  if (unsafe > 0 && args.commit) die(`Refusing — ${unsafe} pair(s) unsafe. Review manually.`);
  if (args.dryRun) { console.log('\nDry-run — no writes. Re-run with --commit to apply.'); return; }
  if (resolved.length === 0) { console.log('Nothing to do.'); return; }

  // Group deletes by city so we patch each city's placesToGo once
  const byCity = new Map<string, { cityId: string; citySlug: string; delIds: Set<string>; resolved: Resolved[] }>();
  for (const r of resolved) {
    if (!byCity.has(r.spec.cityId)) byCity.set(r.spec.cityId, { cityId: r.spec.cityId, citySlug: r.spec.citySlug, delIds: new Set(), resolved: [] });
    const e = byCity.get(r.spec.cityId)!;
    e.delIds.add(r.delId);
    e.resolved.push(r);
  }

  for (const [, group] of byCity) {
    const cityDoc = await client.fetch<{ placesToGo: Array<{ _key?: string; _ref: string }> }>(
      `*[_id==$id][0]{ placesToGo }`, { id: group.cityId },
    );
    if (!cityDoc?.placesToGo) die(`Could not read ${group.citySlug} placesToGo array.`);
    const newPlacesToGo = cityDoc.placesToGo.filter((entry) => !group.delIds.has(entry._ref));
    console.log(`\n${group.citySlug} placesToGo: ${cityDoc.placesToGo.length} → ${newPlacesToGo.length} entries`);

    let tx = client.transaction();
    tx = tx.patch(group.cityId, (p) => p.set({ placesToGo: newPlacesToGo }));
    for (const r of group.resolved) tx = tx.delete(r.delId);
    await tx.commit({ visibility: 'sync' });

    // Append redirect rows where applicable
    const rows: string[] = [];
    for (const r of group.resolved) {
      if (r.spec.identicalSlug) continue;
      for (const loc of LOCALES) {
        const prefix = loc === 'en' ? '' : `/${loc}`;
        rows.push(`${prefix}/guide/${group.citySlug}/${r.spec.delSlug},${prefix}/guide/${group.citySlug}/${r.spec.keepSlug},301`);
      }
    }
    if (rows.length) appendFileSync(REDIRECT_CSV_PATH, '\n' + rows.join('\n') + '\n', 'utf8');
    for (const r of group.resolved) {
      appendLog({
        phase: 'CLEANUP-cairo-sharm-dedup',
        city: group.citySlug,
        deleted: r.delId,
        keptSlug: r.spec.keepSlug,
        delSlug: r.spec.delSlug,
        delBodyLen: r.delLen,
        keepBodyLen: r.keepLen,
        identicalSlug: r.spec.identicalSlug ?? false,
      });
    }
    console.log(`  ✓ Deleted ${group.resolved.length} docs in ${group.citySlug}`);
    console.log(`  ✓ Appended ${rows.length} redirect rows`);
  }

  console.log('\n✓ All done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
