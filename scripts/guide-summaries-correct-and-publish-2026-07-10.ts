/**
 * Corrects 8 of the 13 Claude-drafted guideArticle summaries staged in
 * scripts/backfill-guide-summaries-2026-07-09.ts (PR #32), per owner fact-
 * check + approval 2026-07-10, then publishes all 13 (5 already-clean +
 * 8 corrected here) in one pass.
 *
 * The 8 corrections replace unverifiable/wrong specifics with claims that
 * trace directly to each doc's own body — either grounded phrasing or (per
 * the owner's standing rule) a concrete self-contained number in place of
 * an unverifiable superlative, same pattern as the Sharm/Farafra climate
 * caption fixes and the Minya summary-field fix earlier this session.
 *
 * Run (dry):    npx tsx scripts/guide-summaries-correct-and-publish-2026-07-10.ts
 * Run (apply):  APPLY=1 npx tsx scripts/guide-summaries-correct-and-publish-2026-07-10.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const APPLY = process.env.APPLY === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) {
  console.error('APPLY=1 needs SANITY_PRODUCTION_API_WRITE_TOKEN');
  process.exit(1);
}
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset,
  apiVersion: '2024-12-01',
  useCdn: false,
  token,
});

// Corrections: draft summary text is overwritten with the owner-approved fix.
const CORRECTIONS: { id: string; guardOld: string; newSummary: string }[] = [
  {
    id: 'wp-page-59655',
    guardOld: 'changes character twice before you arrive',
    newSummary:
      'The 310-kilometre road into Dakhla from Farafra runs from white stone desert to golden dunes to a green oasis outpost before you arrive.',
  },
  {
    id: 'wp-page-61927',
    guardOld: "built around Sharm's original tourist strip",
    newSummary:
      'Tropitel Naama Bay is a four-star resort in the heart of Naama Bay, Sharm El Sheikh, with its own dive centre on site.',
  },
  {
    id: 'wp-page-155767',
    guardOld: 'salt lakes',
    newSummary:
      'Fayoum packs a fossil valley, sparkling lakes, flamingos, and a 40-million-year-old sea into one short escape from Cairo.',
  },
  {
    id: 'wp-page-145987',
    guardOld: 'the one Sharm El Sheikh excursion',
    newSummary:
      'A full-day excursion from Sharm El Sheikh that leaves Egypt entirely — Jerusalem, the Dead Sea, and Bethlehem in a single day.',
  },
  {
    id: 'wp-page-72292',
    guardOld: 'Ptolemaic tombs, Roman theatres',
    newSummary:
      "Alexandria's attractions span ancient tombs, a Roman theatre, and the submerged Lost City of Heracleion — each with its own ticket.",
  },
  {
    id: 'wp-page-72336',
    guardOld: 'unusually gentle for a governorate',
    newSummary:
      "Every ticket on Sohag's list, including Abydos' Seti I Temple, costs EGP260 or less.",
  },
  {
    id: 'wp-page-72343',
    guardOld: "the Valley of the Kings' priciest chamber",
    newSummary:
      "Luxor's ticket list runs the length of the West Bank and back, from a modest EGP120 tomb to Nefertari's EGP2,500 chamber in the Valley of the Queens.",
  },
  {
    id: 'wp-page-72364',
    guardOld: "most modest entrance fees",
    newSummary:
      "Every ticket across Al Minya and Asyut's sites costs EGP200 or less.",
  },
];

// All 13 to publish (5 already-clean, unchanged; 8 corrected above).
const ALL_13 = [
  'guideArticle.alexandria.the-national-museum',
  'guideArticle.cairo.the-hanging-church',
  'guideArticle.saint-catherine.mosque-of-al-hakim-be-amr-allah',
  'wp-page-59655',
  'wp-page-61927',
  'wp-page-155767',
  'wp-page-145987',
  'wp-page-72292',
  'wp-page-72314',
  'wp-page-72327',
  'wp-page-72336',
  'wp-page-72343',
  'wp-page-72364',
];

function summaryEn(doc: any): string | undefined {
  return (doc.summary ?? []).find((s: any) => s._key === 'en')?.value;
}

async function main() {
  console.log(`=== ${APPLY ? 'APPLY' : 'DRY RUN'}: correct 8 drafts, then publish all 13 ===\n`);

  const backup: Record<string, unknown> = {};

  // ---- Step 1: correct the 8 drafts ----
  console.log('--- Step 1: correcting 8 drafts ---');
  for (const c of CORRECTIONS) {
    const draftId = `drafts.${c.id}`;
    const draft: any = await client.getDocument(draftId);
    if (!draft) throw new Error(`[correct] ${draftId} not found — was it already published/discarded?`);
    const current = summaryEn(draft);
    if (!current || !current.includes(c.guardOld)) {
      throw new Error(`[correct] ${c.id} guard fail — expected to find "${c.guardOld}" in "${current}"`);
    }
    console.log(`[${c.id}]`);
    console.log(`  old: ${current}`);
    console.log(`  new: ${c.newSummary}`);
    backup[c.id] = { draftSummaryBefore: draft.summary };
    if (!APPLY) continue;
    const doc = JSON.parse(JSON.stringify(draft));
    doc.summary = [
      ...(doc.summary ?? []).filter((s: any) => s._key !== 'en'),
      { _key: 'en', _type: 'internationalizedArrayTextValue', value: c.newSummary },
    ];
    await client.createOrReplace(doc);
  }

  // ---- Step 2: publish all 13 (createOrReplace published doc from draft, delete draft) ----
  console.log('\n--- Step 2: publishing all 13 ---');
  let published = 0;
  let failed = 0;
  for (const id of ALL_13) {
    const draftId = `drafts.${id}`;
    const draft: any = await client.getDocument(draftId);
    if (!draft) {
      console.error(`✗ no draft found for ${id} — skipping`);
      failed++;
      continue;
    }
    const pubBefore: any = await client.getDocument(id);
    backup[id] = { ...(backup[id] as object ?? {}), publishedBefore: pubBefore ?? null };
    const summary = summaryEn(draft);
    console.log(`[${id}] summary: ${summary}`);
    if (!APPLY) continue;
    const { _id, _rev, _createdAt, _updatedAt, ...rest } = draft;
    const newDoc = { _id: id, ...rest };
    try {
      await client
        .transaction()
        .createOrReplace(newDoc)
        .delete(draftId)
        .commit({ visibility: 'async' });
      console.log(`  ✓ published`);
      published++;
    } catch (err) {
      console.error(`  ✗ failed: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nrows=${ALL_13.length} published=${published} failed=${failed}`);
  if (!APPLY) {
    console.log('DRY RUN — re-run with APPLY=1');
    return;
  }
  mkdirSync('backups', { recursive: true });
  const bpath = 'backups/guide-summaries-correct-and-publish-rollback-2026-07-10.json';
  writeFileSync(bpath, JSON.stringify(backup, null, 2));
  console.log(`backup → ${bpath}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
