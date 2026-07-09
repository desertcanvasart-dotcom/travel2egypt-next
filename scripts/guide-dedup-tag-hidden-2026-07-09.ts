/**
 * Formally tag the 14 already-hidden-but-untagged day-tour-hub duplicate
 * guideArticle docs found in the 2026-07-09 audit, so June's
 * "superseded-duplicate" flag actually covers everything it's meant to.
 *
 * These 14 are already `hidden: true` on the PUBLISHED doc (from some
 * earlier, undocumented pass — not June's dedup-guide-legacy-pages.ts,
 * which always set the flag alongside hidden). This script does NOT change
 * visibility — it only ADDS `migration.reviewFlag` + `migration.supersededBy`,
 * for a consistent, documented state across all 34 duplicates found this
 * session (see scripts/guide-dedup-hide-and-redirect-2026-07-09.ts for the
 * other 16, which were still fully live and got hidden+redirected).
 *
 * STAGED AS DRAFTS ONLY, same pattern as every other change this session —
 * never touches the published doc directly, even though the field itself
 * is low-risk metadata.
 *
 * DRY RUN by default; --apply stages. Rollback backup to backups/.
 * Run: npx tsx scripts/guide-dedup-tag-hidden-2026-07-09.ts [--apply]
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
  apiVersion: '2024-12-01', useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const REVIEW_FLAG = 'superseded-duplicate';

const PAIRS: { legacyId: string; keeperId: string }[] = [
  { legacyId: 'wp-page-86817', keeperId: 'wp-page-58816' },  // Al-Gouna Private -> "Tours and Excursions from El Gouna"
  { legacyId: 'wp-page-86832', keeperId: 'wp-page-59386' },  // Cairo Private -> "Cairo Tours"
  { legacyId: 'wp-page-87739', keeperId: 'wp-page-59386' },  // Cairo Small Group -> "Cairo Tours"
  { legacyId: 'wp-page-86841', keeperId: 'wp-page-60653' },  // Luxor Private -> "Explore Luxor Tours"
  { legacyId: 'wp-page-87387', keeperId: 'wp-page-60653' },  // Luxor Small Group -> "Explore Luxor Tours"
  { legacyId: 'wp-page-86858', keeperId: 'wp-page-59704' },  // Hurghada Private -> "Discover Hurghada With Tours"
  { legacyId: 'wp-page-114936', keeperId: 'wp-page-59704' }, // Hurghada Small Group -> "Discover Hurghada With Tours"
  { legacyId: 'wp-page-86936', keeperId: 'wp-page-60443' },  // Safaga Private -> "Tours from Safaga"
  { legacyId: 'wp-page-87001', keeperId: 'wp-page-60207' },  // Marsa Alam Private -> "Best Marsa Alam Tours"
  { legacyId: 'wp-page-114934', keeperId: 'wp-page-60207' }, // Marsa Alam Small Group -> "Best Marsa Alam Tours"
  { legacyId: 'wp-page-87064', keeperId: 'wp-page-59208' },  // Aswan Private -> "Tours and Excursions in Aswan"
  { legacyId: 'wp-page-87408', keeperId: 'wp-page-59208' },  // Aswan Small Group -> "Tours and Excursions in Aswan"
  { legacyId: 'wp-page-87070', keeperId: 'wp-page-59178' },  // Alexandria Private -> "Tours and Excursions in Alexandria"
  { legacyId: 'wp-page-114938', keeperId: 'guideArticle.sharm-el-sheikh.tours-in-sharm-el-sheikh' }, // Sharm Small Group -> "Tours and Excursions in Sharm El Sheikh"
];

(async () => {
  console.log(`\n=== Tag 14 already-hidden duplicates ===\nmode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const backup: Record<string, unknown> = {};
  let staged = 0, notHidden = 0, alreadyTagged = 0, notFound = 0;

  for (const p of PAIRS) {
    const pub = await client.getDocument(p.legacyId);
    if (!pub) { console.log(`✗ not found: ${p.legacyId}`); notFound++; continue; }
    if ((pub as any).hidden !== true) {
      console.log(`⚠ NOT hidden on published — refusing to tag without explicit hide: ${p.legacyId}`);
      notHidden++;
      continue;
    }
    const draftId = `drafts.${p.legacyId}`;
    const existingDraft = await client.getDocument(draftId);
    const base: any = existingDraft ?? pub;
    if (base.migration?.reviewFlag === REVIEW_FLAG) {
      console.log(`- already tagged: ${p.legacyId}`);
      alreadyTagged++;
      continue;
    }

    console.log(`${APPLY ? 'staging' : '[dry run]'}: ${p.legacyId} -> flag + supersededBy ${p.keeperId}`);
    if (APPLY) {
      backup[p.legacyId] = { hadDraft: !!existingDraft, migrationBefore: base.migration ?? null };
      const doc = JSON.parse(JSON.stringify(base));
      doc._id = draftId;
      doc.migration = { ...(doc.migration ?? {}), reviewFlag: REVIEW_FLAG, supersededBy: p.keeperId };
      await client.createOrReplace(doc);
    }
    staged++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`Staged:          ${staged}`);
  console.log(`Already tagged:  ${alreadyTagged}`);
  console.log(`Not hidden:      ${notHidden}`);
  console.log(`Not found:       ${notFound}`);
  if (!APPLY) { console.log('\nDRY RUN — no writes. Re-run with --apply.'); return; }

  mkdirSync('backups', { recursive: true });
  const bpath = 'backups/guide-dedup-tag-hidden-rollback-2026-07-09.json';
  writeFileSync(bpath, JSON.stringify(backup, null, 2));
  console.log(`backup -> ${bpath}`);
  console.log(`✓ staged ${staged} drafts — NOT published. Review in Studio, then publish.`);
})();
