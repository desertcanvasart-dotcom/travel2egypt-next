/**
 * Guide-article duplicate cleanup — 16 orphaned legacy pages found in the
 * 2026-07-09 hero-image/summary audit (see project_guide_editorial_audit
 * memory). These are the SAME mechanism as June's dedup-guide-legacy-pages.ts
 * (hidden + migration.reviewFlag + migration.supersededBy, 301 redirects,
 * placesToGo cleanup) — 12 of the 16 were already queued in that script's
 * PAIRS array but never reached production (commit likely lost across the
 * migration-staging → prod cutover). This script corrects two gaps found on
 * reconfirmation, not improvisation:
 *
 *   (a) June's redirect rows reused the EN slug string across all 3 locale
 *       prefixes. Every doc here has genuinely different es/ja slugs (and
 *       the CITY slug is localized too) — this script builds each redirect
 *       row from the doc's and city's REAL per-locale slug, fetched live.
 *   (b) 9 wikiMonument/guideArticle docs hold `internalLink` markDefs
 *       pointing at 6 of these legacy docs (found via a live inbound-ref
 *       check June's script never did) — repointed to the keeper doc,
 *       same technique as climate-dedup-repoint-refs.ts (leaf-only _ref
 *       rewrite, _key preserved).
 *
 * Safety guard preserved: skip unless `force: true` if legacy body is >20%
 * larger than the keeper's (Farafra Accommodations 1.26x and Things-To-Do
 * 1.34x need force, exactly as anticipated in June's own PAIRS list).
 *
 * STAGING ONLY — writes go to `drafts.<id>`, never the published doc.
 * Nothing is publicly visible until reviewed + published in Studio.
 * The redirect-map.csv change is written to disk but left as an
 * uncommitted/branch change for review, per instruction.
 *
 * DRY RUN by default; --apply stages. Rollback backup to backups/.
 * Run: npx tsx scripts/guide-dedup-hide-and-redirect-2026-07-09.ts [--apply]
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync, readFileSync, appendFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
  apiVersion: '2024-12-01', useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const REVIEW_FLAG = 'superseded-duplicate';
const REDIRECT_CSV = 'migration/redirect-map.csv';
const LOCALES = ['en', 'es', 'ja'] as const;

interface Pair { legacyId: string; keeperId: string; citySlugEn: string; force?: boolean }

const PAIRS: Pair[] = [
  // Rosetta
  { legacyId: 'wp-page-60416', keeperId: 'guideArticle.rosetta-rasheed.rosetta-rasheed-historical-overview', citySlugEn: 'rosetta-rasheed' },
  { legacyId: 'wp-page-60420', keeperId: 'guideArticle.rosetta-rasheed.how-to-go-in-rosetta-rasheed', citySlugEn: 'rosetta-rasheed' },
  { legacyId: 'wp-page-60421', keeperId: 'guideArticle.rosetta-rasheed.top-hotels-in-rosetta-rasheed', citySlugEn: 'rosetta-rasheed' },
  { legacyId: 'wp-page-60422', keeperId: 'guideArticle.rosetta-rasheed.getting-around-in-rosetta-rasheed', citySlugEn: 'rosetta-rasheed' },
  { legacyId: 'wp-page-60424', keeperId: 'guideArticle.rosetta-rasheed.tours-in-rosetta-rasheed', citySlugEn: 'rosetta-rasheed' },
  { legacyId: 'wp-page-60425', keeperId: 'guideArticle.rosetta-rasheed.food-in-rosetta-rasheed', citySlugEn: 'rosetta-rasheed' },
  // Farafra
  { legacyId: 'wp-page-59636', keeperId: 'guideArticle.farafra-oasis.top-hotels-in-farafra-oasis', citySlugEn: 'farafra-oasis', force: true },
  { legacyId: 'wp-page-59638', keeperId: 'guideArticle.farafra-oasis.getting-around-in-farafra-oasis', citySlugEn: 'farafra-oasis' },
  { legacyId: 'wp-page-59642', keeperId: 'guideArticle.farafra-oasis.things-to-do-in-farafra-oasis', citySlugEn: 'farafra-oasis', force: true },
  { legacyId: 'wp-page-96618', keeperId: 'guideArticle.farafra-oasis.how-to-go-in-farafra-oasis', citySlugEn: 'farafra-oasis' },
  // Siwa
  { legacyId: 'wp-page-60508', keeperId: 'guideArticle.siwa-oasis.top-hotels-in-siwa-oasis', citySlugEn: 'siwa-oasis' },
  { legacyId: 'wp-page-60511', keeperId: 'guideArticle.siwa-oasis.upcoming-events-in-siwa-oasis', citySlugEn: 'siwa-oasis' },
  { legacyId: 'wp-page-60513', keeperId: 'guideArticle.siwa-oasis.only-in-siwa-oasis', citySlugEn: 'siwa-oasis' },
  // Wadi El Natrun
  { legacyId: 'wp-page-60601', keeperId: 'guideArticle.wadi-el-natrun.things-to-do-in-wadi-el-natrun', citySlugEn: 'wadi-el-natrun' },
  { legacyId: 'wp-page-60604', keeperId: 'guideArticle.wadi-el-natrun.only-in-wadi-el-natrun', citySlugEn: 'wadi-el-natrun' },
  // Sharm
  { legacyId: 'wp-page-86911', keeperId: 'guideArticle.sharm-el-sheikh.tours-in-sharm-el-sheikh', citySlugEn: 'sharm-el-sheikh' },
];

// referencerId -> locale the internalLink lives in -> legacyId it points at
const REPOINTS: { referencerId: string; locale: 'en' | 'es' | 'ja'; legacyId: string }[] = [
  { referencerId: 'wp-page-59652', locale: 'es', legacyId: 'wp-page-59636' },
  { referencerId: 'wp-page-59652', locale: 'es', legacyId: 'wp-page-59638' },
  { referencerId: 'wp-page-59652', locale: 'es', legacyId: 'wp-page-59642' },
  { referencerId: 'wp-page-59652', locale: 'es', legacyId: 'wp-page-96618' },
  { referencerId: 'wp-page-59653', locale: 'es', legacyId: 'wp-page-59636' },
  { referencerId: 'wp-page-59653', locale: 'es', legacyId: 'wp-page-59638' },
  { referencerId: 'wp-page-59653', locale: 'es', legacyId: 'wp-page-59642' },
  { referencerId: 'wp-page-59653', locale: 'es', legacyId: 'wp-page-96618' },
  { referencerId: 'wp-page-206305', locale: 'es', legacyId: 'wp-page-60508' },
  { referencerId: 'wp-page-206305', locale: 'es', legacyId: 'wp-page-60513' },
  { referencerId: 'wp-page-60778', locale: 'es', legacyId: 'wp-page-60508' },
  { referencerId: 'wp-page-60778', locale: 'es', legacyId: 'wp-page-60513' },
  { referencerId: 'wp-page-60779', locale: 'es', legacyId: 'wp-page-60508' },
  { referencerId: 'wp-page-60779', locale: 'es', legacyId: 'wp-page-60513' },
  { referencerId: 'wp-page-60781', locale: 'es', legacyId: 'wp-page-60508' },
  { referencerId: 'wp-page-60781', locale: 'es', legacyId: 'wp-page-60513' },
  { referencerId: 'wp-page-60782', locale: 'es', legacyId: 'wp-page-60508' },
  { referencerId: 'wp-page-60782', locale: 'es', legacyId: 'wp-page-60513' },
  { referencerId: 'wp-page-60796', locale: 'es', legacyId: 'wp-page-60601' },
  { referencerId: 'wp-page-60796', locale: 'es', legacyId: 'wp-page-60604' },
  { referencerId: 'wp-page-60797', locale: 'es', legacyId: 'wp-page-60601' },
  { referencerId: 'wp-page-60797', locale: 'es', legacyId: 'wp-page-60604' },
  { referencerId: 'wp-page-60798', locale: 'es', legacyId: 'wp-page-60601' },
  { referencerId: 'wp-page-60798', locale: 'es', legacyId: 'wp-page-60604' },
  { referencerId: 'wp-page-60799', locale: 'es', legacyId: 'wp-page-60601' },
  { referencerId: 'wp-page-60799', locale: 'es', legacyId: 'wp-page-60604' },
  { referencerId: 'wp-page-114938', locale: 'en', legacyId: 'wp-page-86911' },
];

type SlugMap = Partial<Record<'en' | 'es' | 'ja', string>>;
function slugMap(slugArr: any[]): SlugMap {
  const m: SlugMap = {};
  for (const s of slugArr ?? []) m[s._key as 'en' | 'es' | 'ja'] = s.value?.current;
  return m;
}

async function main() {
  console.log(`\n=== Guide-article dedup: hide + redirect + repoint ===\nmode: ${APPLY ? 'APPLY (staging drafts)' : 'DRY RUN'}\npairs: ${PAIRS.length}, repoints: ${REPOINTS.length}\n`);

  // pre-fetch city slugs
  const citySlugs = new Map<string, SlugMap>();
  for (const c of new Set(PAIRS.map((p) => p.citySlugEn))) {
    const city = await client.fetch<{ slug: any[] } | null>(
      `*[_type=="city" && slug[_key=="en"][0].value.current==$c][0]{slug}`, { c });
    if (!city) throw new Error(`city not found: ${c}`);
    citySlugs.set(c, slugMap(city.slug));
  }

  const backup: Record<string, unknown> = {};
  const redirectRows: string[] = [];
  let staged = 0, skippedSafety = 0, skippedExisting = 0;

  for (const p of PAIRS) {
    const legacy = await client.fetch<any>(`*[_id==$id][0]`, { id: p.legacyId });
    const keeper = await client.fetch<any>(`*[_id==$id][0]{_id, slug, "bodyLen": length(pt::text(body[_key=="en"][0].value))}`, { id: p.keeperId });
    if (!legacy) { console.log(`✗ legacy not found: ${p.legacyId}`); continue; }
    if (!keeper) { console.log(`✗ keeper not found: ${p.keeperId}`); continue; }

    const legacyBodyLen = await client.fetch<number>(`length(pt::text(*[_id==$id][0].body[_key=="en"][0].value))`, { id: p.legacyId });
    const ratio = keeper.bodyLen === 0 ? Infinity : legacyBodyLen / keeper.bodyLen;
    if (ratio > 1.2 && !p.force) {
      console.log(`⚠ SKIP (safety, legacy ${legacyBodyLen} vs keeper ${keeper.bodyLen}, ratio ${ratio.toFixed(2)}): ${p.legacyId}`);
      skippedSafety++;
      continue;
    }

    const draftId = `drafts.${p.legacyId}`;
    const existingDraft = await client.getDocument(draftId);
    if (existingDraft && (existingDraft as any).hidden === true && (existingDraft as any).migration?.reviewFlag === REVIEW_FLAG) {
      console.log(`- already staged: ${p.legacyId}`);
      skippedExisting++;
      continue;
    }

    const legacySlugs = slugMap(legacy.slug);
    const keeperSlugs = slugMap(keeper.slug);
    const city = citySlugs.get(p.citySlugEn)!;

    console.log(`${APPLY ? 'staging' : '[dry run]'}: ${p.legacyId} (ratio ${ratio.toFixed(2)}${p.force ? ', forced' : ''}) -> hidden + superseded by ${p.keeperId}`);

    for (const loc of LOCALES) {
      const prefix = loc === 'en' ? '' : `/${loc}`;
      const legacySlug = legacySlugs[loc] ?? legacySlugs.en;
      const keeperSlug = keeperSlugs[loc] ?? keeperSlugs.en;
      const citySlug = city[loc] ?? city.en;
      if (!legacySlug || !keeperSlug || !citySlug) {
        console.log(`  ⚠ missing slug for locale=${loc} on ${p.legacyId} — skipping this locale's redirect row`);
        continue;
      }
      const from = `${prefix}/guide/${citySlug}/${legacySlug}`;
      const to = `${prefix}/guide/${citySlug}/${keeperSlug}`;
      console.log(`    ${loc}: ${from} -> ${to}`);
      redirectRows.push(`${from},${to},${loc},301,,0.00`);
    }

    if (APPLY) {
      backup[p.legacyId] = { hadDraft: !!existingDraft, publishedHidden: legacy.hidden ?? null, publishedFlag: legacy.migration?.reviewFlag ?? null };
      const draftDoc = JSON.parse(JSON.stringify(existingDraft ?? legacy));
      draftDoc._id = draftId;
      draftDoc.hidden = true;
      draftDoc.migration = { ...(draftDoc.migration ?? {}), reviewFlag: REVIEW_FLAG, supersededBy: p.keeperId };
      await client.createOrReplace(draftDoc);
    }
    staged++;
  }

  console.log(`\n--- Repointing ${REPOINTS.length} inline references ---`);
  const byReferencer = new Map<string, typeof REPOINTS>();
  for (const r of REPOINTS) {
    if (!byReferencer.has(r.referencerId)) byReferencer.set(r.referencerId, []);
    byReferencer.get(r.referencerId)!.push(r);
  }
  const legacyToKeeper = new Map(PAIRS.map((p) => [p.legacyId, p.keeperId]));

  for (const [referencerId, repoints] of byReferencer) {
    const pub = await client.getDocument(referencerId);
    if (!pub) { console.log(`✗ referencer not found: ${referencerId}`); continue; }
    const draftId = `drafts.${referencerId}`;
    const existingDraft = await client.getDocument(draftId);
    const base: any = JSON.parse(JSON.stringify(existingDraft ?? pub));

    let changed = 0;
    for (const rp of repoints) {
      const keeperId = legacyToKeeper.get(rp.legacyId)!;
      const localeBlock = (base.body ?? []).find((b: any) => b._key === rp.locale);
      if (!localeBlock) { console.log(`  ⚠ ${referencerId}: no ${rp.locale} body block`); continue; }
      let foundHere = 0;
      for (const block of localeBlock.value ?? []) {
        for (const md of block.markDefs ?? []) {
          if (md._type === 'internalLink' && md.reference?._ref === rp.legacyId) {
            console.log(`  ${referencerId} [${rp.locale}]: markDef ${md._key} ${rp.legacyId} -> ${keeperId}`);
            md.reference._ref = keeperId;
            changed++;
            foundHere++;
          }
        }
      }
      if (foundHere === 0) console.log(`  ⚠ ${referencerId} [${rp.locale}]: no markDef found for ${rp.legacyId} (already repointed or moved?)`);
    }
    if (changed === 0) { console.log(`- ${referencerId}: nothing to change`); continue; }

    if (APPLY) {
      backup[`referencer:${referencerId}`] = { hadDraft: !!existingDraft };
      base._id = draftId;
      await client.createOrReplace(base);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Staged for hide+redirect: ${staged}`);
  console.log(`Skipped (safety ratio):   ${skippedSafety}`);
  console.log(`Skipped (already staged): ${skippedExisting}`);
  console.log(`Redirect rows generated:  ${redirectRows.length}`);

  if (!APPLY) { console.log('\nDRY RUN — no writes. Re-run with --apply.'); return; }

  mkdirSync('backups', { recursive: true });
  const bpath = 'backups/guide-dedup-hide-redirect-rollback-2026-07-09.json';
  writeFileSync(bpath, JSON.stringify(backup, null, 2));
  console.log(`backup -> ${bpath}`);

  // stage the redirect-map.csv change on disk (left uncommitted for review)
  const csvBefore = readFileSync(REDIRECT_CSV, 'utf8');
  writeFileSync('backups/redirect-map-before-2026-07-09.csv', csvBefore);
  appendFileSync(REDIRECT_CSV, redirectRows.join('\n') + '\n', 'utf8');
  console.log(`\n✓ appended ${redirectRows.length} rows to ${REDIRECT_CSV} (uncommitted — review diff, then run "npm run redirect-map:regenerate")`);
  console.log(`✓ staged ${staged} legacy docs as drafts (hidden+flagged) — NOT published.`);
  console.log(`✓ staged repoints on ${byReferencer.size} referencer docs as drafts — NOT published.`);
  console.log(`\nNothing is publicly visible. Review in Studio, then publish the drafts; separately commit+regenerate the redirect-map and merge when ready.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
