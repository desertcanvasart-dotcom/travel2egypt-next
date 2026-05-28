/**
 * Round 3 of placesToGo dedup — pairs the audit missed (apostrophe
 * variants, al/el transliteration, saint/st abbreviation, different
 * slugs describing the same place, cross-city duplicates).
 *
 * Operator-confirmed. Same mechanics as dedup-cairo-sharm-places.ts:
 *   - body-length safety check (>20% larger → halt)
 *   - delete doc
 *   - remove ref from parent city's placesToGo
 *   - append 3 redirect rows per pair (en/es/ja)
 *
 * Special cases:
 *   - sharm-el-luli (Sharm copy): cross-city redirect — the kept doc
 *     lives in marsa-alam, so redirect target points to that path.
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

interface PairSpec {
  citySlug: string;
  cityId: string;
  keepSlug: string;
  delSlug: string;
  keepId: string;
  delId: string;
  /** Identical slug → no redirect needed. */
  identicalSlug?: boolean;
  /** Cross-city: redirect should point to a different city's path. */
  redirectTargetCity?: string;
}

const PAIRS: PairSpec[] = [
  // Farafra
  { citySlug: 'farafra-oasis', cityId: 'wp-page-58849',
    keepSlug: 'qasr-al-farafra', delSlug: 'qasr-al-farafra',
    keepId: 'guideArticle.farafra-oasis.qasr-al-farafra', delId: 'wp-page-59654',
    identicalSlug: true },
  { citySlug: 'farafra-oasis', cityId: 'wp-page-58849',
    keepSlug: 'badr-museum', delSlug: 'badrs-museum',
    keepId: 'guideArticle.farafra-oasis.badr-museum', delId: 'guideArticle.farafra-oasis.badrs-museum' },
  { citySlug: 'farafra-oasis', cityId: 'wp-page-58849',
    keepSlug: 'white-desert-national-park', delSlug: 'white-desert',
    keepId: 'guideArticle.farafra-oasis.white-desert-national-park', delId: 'guideArticle.farafra-oasis.white-desert' },
  // Al Fayoum (the rayan pair is here, not Farafra)
  { citySlug: 'al-fayoum', cityId: 'wp-page-58530',
    keepSlug: 'wadi-al-rayan', delSlug: 'wadi-el-rayan',
    keepId: 'guideArticle.al-fayoum.wadi-al-rayan', delId: 'guideArticle.al-fayoum.wadi-el-rayan' },
  // Marsa Alam
  { citySlug: 'marsa-alam', cityId: 'wp-page-58885',
    keepSlug: 'wadi-el-gemal-national-park', delSlug: 'wadi-el-gamal-national-park',
    keepId: 'guideArticle.marsa-alam.wadi-el-gemal-national-park', delId: 'wp-page-60689' },
  // Aswan
  { citySlug: 'aswan', cityId: 'wp-page-58758',
    keepSlug: 'saint-simeon-monastery', delSlug: 'st-simeon-monastery',
    keepId: 'guideArticle.aswan.saint-simeon-monastery', delId: 'guideArticle.aswan.st-simeon-monastery' },
  // Sharm El-Sheikh — Nabq
  { citySlug: 'sharm-el-sheikh', cityId: 'wp-page-58927',
    keepSlug: 'nabq-national-park', delSlug: 'nabq-managed-resource-protected-area',
    keepId: 'guideArticle.sharm-el-sheikh.nabq-national-park', delId: 'wp-page-59456' },
  // Sharm El-Sheikh — Naama Bay
  { citySlug: 'sharm-el-sheikh', cityId: 'wp-page-58927',
    keepSlug: 'naama-bay-sharm-el-sheikh-guide', delSlug: 'naama-bay-promenade-resort',
    keepId: 'wp-page-60771', delId: 'wp-page-63527' },
  // Sharm El-Sheikh — Sharm El Luli (the real attraction is in Marsa Alam)
  { citySlug: 'sharm-el-sheikh', cityId: 'wp-page-58927',
    keepSlug: 'sharm-el-luli', delSlug: 'sharm-el-luli',
    keepId: 'guideArticle.marsa-alam.sharm-el-luli', delId: 'wp-page-146102',
    redirectTargetCity: 'marsa-alam' },
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

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Dedup batch 3 — audit-missed pairs ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const resolved: Array<{ spec: PairSpec; keepLen: number; delLen: number }> = [];
  for (const spec of PAIRS) {
    const keep = await client.fetch<{ body: any[] } | null>(`*[_id==$id][0]{ body }`, { id: spec.keepId });
    const del = await client.fetch<{ body: any[] } | null>(`*[_id==$id][0]{ body }`, { id: spec.delId });
    if (!keep) { console.log(`  ✗ keep ${spec.keepId} not found — skipping`); continue; }
    if (!del) { console.log(`  - delete ${spec.delId} already gone — skipping`); continue; }
    resolved.push({ spec, keepLen: bodyTextLen(keep.body), delLen: bodyTextLen(del.body) });
  }

  console.log('Plan:');
  let unsafe = 0;
  for (const r of resolved) {
    const ratio = r.keepLen === 0 ? Infinity : r.delLen / r.keepLen;
    const safe = ratio <= 1.2;
    if (!safe) unsafe++;
    const note = r.spec.redirectTargetCity ? ` [→ ${r.spec.redirectTargetCity}]` : r.spec.identicalSlug ? ' [identical slug — no redirect]' : '';
    console.log(`  ${safe ? '✓' : '⚠'}  ${r.spec.citySlug}: delete ${r.spec.delId.padEnd(50)} → keep ${r.spec.keepSlug}   (body ${r.delLen} vs ${r.keepLen}, ratio ${ratio.toFixed(2)})${note}`);
  }
  console.log(`\nTo delete: ${resolved.length}  (${unsafe} pair(s) unsafe)`);
  if (unsafe > 0 && args.commit) die(`Refusing — ${unsafe} unsafe.`);
  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (resolved.length === 0) { console.log('Nothing to do.'); return; }

  // Group by city for one placesToGo patch per city
  const byCity = new Map<string, { cityId: string; citySlug: string; delIds: Set<string>; resolved: typeof resolved }>();
  for (const r of resolved) {
    if (!byCity.has(r.spec.cityId)) byCity.set(r.spec.cityId, { cityId: r.spec.cityId, citySlug: r.spec.citySlug, delIds: new Set(), resolved: [] });
    const e = byCity.get(r.spec.cityId)!;
    e.delIds.add(r.spec.delId);
    e.resolved.push(r);
  }

  for (const [, group] of byCity) {
    const cityDoc = await client.fetch<{ placesToGo: Array<{ _key?: string; _ref: string }> }>(
      `*[_id==$id][0]{ placesToGo }`, { id: group.cityId },
    );
    if (!cityDoc?.placesToGo) die(`Could not read ${group.citySlug} placesToGo.`);
    const newPlacesToGo = cityDoc.placesToGo.filter((e) => !group.delIds.has(e._ref));
    console.log(`\n${group.citySlug} placesToGo: ${cityDoc.placesToGo.length} → ${newPlacesToGo.length}`);

    let tx = client.transaction();
    tx = tx.patch(group.cityId, (p) => p.set({ placesToGo: newPlacesToGo }));
    for (const r of group.resolved) tx = tx.delete(r.spec.delId);
    await tx.commit({ visibility: 'sync' });

    const rows: string[] = [];
    for (const r of group.resolved) {
      if (r.spec.identicalSlug) continue;
      for (const loc of LOCALES) {
        const prefix = loc === 'en' ? '' : `/${loc}`;
        const targetCity = r.spec.redirectTargetCity ?? group.citySlug;
        rows.push(`${prefix}/guide/${group.citySlug}/${r.spec.delSlug},${prefix}/guide/${targetCity}/${r.spec.keepSlug},301`);
      }
    }
    if (rows.length) appendFileSync(REDIRECT_CSV_PATH, '\n' + rows.join('\n') + '\n', 'utf8');
    for (const r of group.resolved) {
      appendLog({
        phase: 'CLEANUP-batch-3-dedup',
        city: group.citySlug,
        deleted: r.spec.delId,
        keptSlug: r.spec.keepSlug,
        delSlug: r.spec.delSlug,
        delBodyLen: r.delLen, keepBodyLen: r.keepLen,
        identicalSlug: r.spec.identicalSlug ?? false,
        crossCityRedirect: r.spec.redirectTargetCity ?? null,
      });
    }
    console.log(`  ✓ Deleted ${group.resolved.length} docs, appended ${rows.length} redirect rows`);
  }

  console.log('\n✓ Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
