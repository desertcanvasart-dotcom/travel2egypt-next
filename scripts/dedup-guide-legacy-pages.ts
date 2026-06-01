/**
 * Workstream C — de-duplicate legacy off-brand guide pages (migration-staging).
 *
 * Editorial review flagged ~50 cases where an OLD flowery/off-brand page and a
 * NEW source-backed canonical page are both live under different slugs. For each
 * pair we (reversibly) remove the legacy page and 301 it to the canonical:
 *
 *   1. Resolve ALL published docs with the legacy slug under the city (some
 *      legacy slugs collide across a `guideArticle.<city>.<slug>` id and a
 *      `wp-page-*` id — both are handled).
 *   2. Confirm the canonical slug is published. Safety: skip if the legacy body
 *      is >20% larger than the canonical (guards against removing the richer doc).
 *   3. Set `hidden = true` + migration trace fields on each legacy doc.
 *   4. Remove the legacy _id(s) from any city.placesToGo array.
 *   5. Append en/es/ja 301 rows (legacy slug → canonical slug) to redirect-map.csv.
 *
 * Reversible: unset hidden / re-add placesToGo / drop redirect rows.
 * Idempotent: skips docs already hidden with the trace flag.
 * After --commit, run `npm run redirect-map:regenerate`.
 *
 * Usage:
 *   npx tsx scripts/dedup-guide-legacy-pages.ts --dry-run
 *   npx tsx scripts/dedup-guide-legacy-pages.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');
const LOCALES = ['en', 'es', 'ja'] as const;
const REVIEW_FLAG = 'superseded-duplicate';

interface Pair { city: string; legacy: string; canonical: string; force?: boolean }

// Legacy slug → canonical slug, grouped by city. Clean 1:1 pairs only.
const PAIRS: Pair[] = [
  // Cairo (al-Nasir trio handled separately)
  { city: 'cairo', legacy: 'al-azhar-to-the-citadel', canonical: 'from-al-azhar-to-the-citadel-walking-islamic-cairo' },
  { city: 'cairo', legacy: 'aqsunur-mosque', canonical: 'aqsunqur-mosque-the-blue-mosque' },
  { city: 'cairo', legacy: 'church-of-st-barbara', canonical: 'church-of-saint-barbara' },
  { city: 'cairo', legacy: 'church-of-st-sergius-bacchus', canonical: 'church-of-saint-sergius-and-bacchus-abu-serga' },
  { city: 'cairo', legacy: 'ibn-tulun-citadel', canonical: 'mosque-of-ibn-tulun' },
  // force: reviewer-confirmed off-brand legacy that happens to be wordier than canonical
  { city: 'cairo', legacy: 'khan-al-khalili-bazaar', canonical: 'khan-el-khalili', force: true },
  { city: 'cairo', legacy: 'khanqah-mausoleum-of-sultan-baybars-al-gashankir', canonical: 'khanqah-and-mausoleum-of-sultan-baybars-al-jashnagir' },
  { city: 'cairo', legacy: 'madrassa-and-mausoleum-of-barquq', canonical: 'madrasa-and-khanqah-of-sultan-barquq' },
  { city: 'cairo', legacy: 'madrassa-mausoleum-of-as-salih-negm-el-din-ayyub', canonical: 'madrasa-and-mausoleum-of-as-salih-najm-al-din-ayyub' },
  { city: 'cairo', legacy: 'mosque-madrassa-of-al-ghouri', canonical: 'mosque-madrasa-of-al-ghouri' },
  { city: 'cairo', legacy: 'mosque-madrassa-of-umm-sultan-shaaban', canonical: 'mosque-madrassa-of-umm-sultan-sha-aban' },
  { city: 'cairo', legacy: 'sabil-and-kuttab-of-abdel-rahman-katkhuda', canonical: 'sabil-kuttab-of-abd-al-rahman-katkhuda' },
  { city: 'cairo', legacy: 'the-hanging-church', canonical: 'hanging-church-al-mu-allaqa' },
  { city: 'cairo', legacy: 'the-mosque-of-sultan-qaitbey', canonical: 'mausoleum-complex-of-sultan-qaytbay' },
  // Farafra
  { city: 'farafra-oasis', legacy: 'accommodations-in-farafra', canonical: 'top-hotels-in-farafra-oasis', force: true },
  { city: 'farafra-oasis', legacy: 'getting-around-in-farafra', canonical: 'getting-around-in-farafra-oasis' },
  { city: 'farafra-oasis', legacy: 'how-to-go-to-farafra', canonical: 'how-to-go-in-farafra-oasis' },
  { city: 'farafra-oasis', legacy: 'things-to-do-in-farafra', canonical: 'things-to-do-in-farafra-oasis', force: true },
  { city: 'farafra-oasis', legacy: 'weather-in-farafra', canonical: 'weather-in-farafra-oasis' },
  // Rosetta
  { city: 'rosetta-rasheed', legacy: 'best-rosetta-tours', canonical: 'tours-in-rosetta-rasheed' },
  { city: 'rosetta-rasheed', legacy: 'getting-around-rosetta', canonical: 'getting-around-in-rosetta-rasheed' },
  { city: 'rosetta-rasheed', legacy: 'only-in-rosetta', canonical: 'only-in-rosetta-rasheed' },
  { city: 'rosetta-rasheed', legacy: 'past-and-present-rosetta', canonical: 'rosetta-rasheed-historical-overview' },
  { city: 'rosetta-rasheed', legacy: 'places-to-go-in-rosetta', canonical: 'places-in-rosetta' },
  { city: 'rosetta-rasheed', legacy: 'rosetta-arrival-guide', canonical: 'how-to-go-in-rosetta-rasheed' },
  { city: 'rosetta-rasheed', legacy: 'stay-in-rosetta', canonical: 'top-hotels-in-rosetta-rasheed' },
  { city: 'rosetta-rasheed', legacy: 'taste-of-rosetta', canonical: 'food-in-rosetta-rasheed' },
  { city: 'rosetta-rasheed', legacy: 'things-to-do-in-rosetta', canonical: 'things-to-do-in-rosetta-rasheed' },
  { city: 'rosetta-rasheed', legacy: 'when-to-go-rosetta', canonical: 'weather-in-rosetta-rasheed' },
  // Siwa
  { city: 'siwa-oasis', legacy: 'adventure-activities-in-siwa-oasis', canonical: 'things-to-do-in-siwa-oasis' },
  { city: 'siwa-oasis', legacy: 'events-in-siwa', canonical: 'upcoming-events-in-siwa-oasis' },
  { city: 'siwa-oasis', legacy: 'getting-around-siwa', canonical: 'getting-around-in-siwa-oasis' },
  { city: 'siwa-oasis', legacy: 'siwa-dining-experiences', canonical: 'food-in-siwa-oasis' },
  { city: 'siwa-oasis', legacy: 'siwa-hotel-guide', canonical: 'top-hotels-in-siwa-oasis' },
  { city: 'siwa-oasis', legacy: 'siwa-only-here', canonical: 'only-in-siwa-oasis' },
  { city: 'siwa-oasis', legacy: 'siwa-weather-guide', canonical: 'weather-in-siwa-oasis' },
  // Wadi El Natrun (alternate spelling)
  { city: 'wadi-el-natrun', legacy: 'only-in-wadi-al-natron', canonical: 'only-in-wadi-el-natrun' },
  { city: 'wadi-el-natrun', legacy: 'things-to-do-in-wadi-al-natron', canonical: 'things-to-do-in-wadi-el-natrun' },
  // al-Nasir Muhammad: legacy off-brand → canonical (still on -en-2026-05 slug;
  // slug beautification handled separately once these free the clean slugs).
  { city: 'cairo', legacy: 'an-nasir-mohammed-bin-qalawoon-mosque', canonical: 'madrasa-of-al-nasir-muhammad-ibn-qalawun-en-2026-05' },
  { city: 'cairo', legacy: 'mosque-of-al-nasir-mohammed-ben-qalawoon', canonical: 'mosque-of-al-nasir-muhammad-ibn-qalawun-en-2026-05' },
  // Qena Dendera overview dups → the Dendera precinct hub.
  { city: 'qena', legacy: 'the-temple-of-dendera', canonical: 'the-temple-precinct' },
  { city: 'qena', legacy: 'the-temple-of-hathor', canonical: 'the-temple-precinct' },
  // Resolved specials (off-brand legacy → source-backed canonical)
  { city: 'al-wadi-al-gadid', legacy: 'el-wadi-el-gedid-museum', canonical: 'kharga-museum-of-antiquities' },
  { city: 'alexandria', legacy: 'the-national-museum', canonical: 'alexandria-national-museum' },
  { city: 'ras-sudr', legacy: 'places-to-visit-in-ras-sudr', canonical: 'places-in-ras-sudr' },
  { city: 'saint-catherine', legacy: 'mosque-of-al-hakim-be-amr-allah', canonical: 'fatimid-mosque' },
];

interface Args { commit: boolean; dryRun: boolean }
function parseArgs(argv: string[]): Args {
  let commit = false, dryRun = false;
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

interface DocLite { _id: string; len: number; hidden?: boolean; flag?: string }

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Legacy guide-page de-duplication ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\npairs: ${PAIRS.length}\n`);
  const client = getClient();

  const redirectRows: string[] = [];
  let actedDocs = 0, skippedResolved = 0, skippedSafety = 0, alreadyDone = 0;
  const placesToGoRemovals = new Map<string, Set<string>>(); // cityId -> legacy ids

  // pre-resolve city ids
  const cityIds = new Map<string, string>();
  for (const c of new Set(PAIRS.map((p) => p.city))) {
    const id = await client.fetch<string | null>(
      `*[_type=="city" && slug[_key=="en"][0].value.current==$c][0]._id`, { c });
    if (id) cityIds.set(c, id);
  }

  let tx = client.transaction();
  let hasOps = false;

  for (const p of PAIRS) {
    const cityId = cityIds.get(p.city);
    if (!cityId) { console.log(`  ✗ ${p.city}: city not found`); skippedResolved++; continue; }

    const canonical = await client.fetch<DocLite | null>(
      `*[_type=="guideArticle" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s && parentCity._ref==$c][0]{ _id, "len": length(pt::text(body[_key=="en"][0].value)) }`,
      { s: p.canonical, c: cityId });
    if (!canonical) { console.log(`  ✗ ${p.city}/${p.legacy}: canonical "${p.canonical}" NOT published — skip`); skippedResolved++; continue; }

    const legacyDocs = await client.fetch<DocLite[]>(
      `*[_type=="guideArticle" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s && parentCity._ref==$c]{ _id, "len": length(pt::text(body[_key=="en"][0].value)), hidden, "flag": migration.reviewFlag }`,
      { s: p.legacy, c: cityId });
    if (legacyDocs.length === 0) { console.log(`  - ${p.city}/${p.legacy}: already gone — skip`); alreadyDone++; continue; }

    let actedThisPair = false;
    for (const legacy of legacyDocs) {
      if (legacy.hidden && legacy.flag === REVIEW_FLAG) { alreadyDone++; continue; }
      const ratio = canonical.len === 0 ? Infinity : legacy.len / canonical.len;
      if (ratio > 1.2 && !p.force) {
        console.log(`  ⚠ ${p.city}/${p.legacy} [${legacy._id}] body ${legacy.len} vs canonical ${canonical.len} (ratio ${ratio.toFixed(2)}) — SKIP (legacy larger)`);
        skippedSafety++;
        continue;
      }
      console.log(`  ✓ ${p.city}/${p.legacy} [${legacy._id}] → ${p.canonical}  (body ${legacy.len} vs ${canonical.len})`);
      if (args.commit) {
        tx = tx.patch(legacy._id, (pt) => pt.set({ hidden: true, 'migration.reviewFlag': REVIEW_FLAG, 'migration.supersededBy': canonical._id }));
        hasOps = true;
      }
      if (!placesToGoRemovals.has(cityId)) placesToGoRemovals.set(cityId, new Set());
      placesToGoRemovals.get(cityId)!.add(legacy._id);
      actedDocs++;
      actedThisPair = true;
    }
    if (actedThisPair) {
      for (const loc of LOCALES) {
        const prefix = loc === 'en' ? '' : `/${loc}`;
        // 6-col format: from_url,to_path,locale,status_code,legacy_wp_id,priority_score
        redirectRows.push(`${prefix}/guide/${p.city}/${p.legacy},${prefix}/guide/${p.city}/${p.canonical},${loc},301,,0.00`);
      }
    }
  }

  // remove legacy ids from each city's placesToGo
  if (args.commit) {
    for (const [cityId, ids] of placesToGoRemovals) {
      const city = await client.fetch<{ placesToGo?: Array<{ _ref: string }> }>(`*[_id==$id][0]{ placesToGo }`, { id: cityId });
      if (city?.placesToGo?.length) {
        const next = city.placesToGo.filter((e) => !ids.has(e._ref));
        if (next.length !== city.placesToGo.length) {
          tx = tx.patch(cityId, (pt) => pt.set({ placesToGo: next }));
          hasOps = true;
          console.log(`  placesToGo ${cityId}: ${city.placesToGo.length} → ${next.length}`);
        }
      }
    }
    if (hasOps) await tx.commit({ visibility: 'sync' });
    if (redirectRows.length) appendFileSync(REDIRECT_CSV_PATH, '\n' + redirectRows.join('\n') + '\n', 'utf8');
  }

  console.log(`\n=== Summary ===`);
  console.log(`Legacy docs hidden:        ${actedDocs}`);
  console.log(`Redirect rows queued:      ${redirectRows.length}`);
  console.log(`Already done (idempotent): ${alreadyDone}`);
  console.log(`Skipped (unresolved):      ${skippedResolved}`);
  console.log(`Skipped (safety, larger):  ${skippedSafety}`);
  if (args.commit) console.log(`\n✓ Committed. Next: npm run redirect-map:regenerate`);
  else console.log(`\nDry-run — no writes.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
