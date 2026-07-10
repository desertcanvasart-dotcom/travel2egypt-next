/**
 * Stage A for wp-page-60649 (Places to Stay in Luxor) — structural debris
 * cleanup only, per Phase 1 investigation 2026-07-10.
 *
 * EN: delete the 2 dead `_pendingImage` blocks + the 3-block generic promo
 *     tail ("Egypt's Finest Stays & Nile Cruises...Learn more") — same
 *     species as the Culinary-Journey promo tail removed from the Luxor
 *     restaurants page's Stage A.
 * ES: delete the literal `<!DOCTYPE html>` junk block + the duplicate
 *     plain-text repeat of the title (keep the real h2 title block
 *     immediately after it).
 * JA: fix the title block's style from 'normal' to 'h2' — cosmetic only,
 *     NOT a deletion (the text doesn't repeat anywhere else in the body).
 *
 * Summary: clear the duplicate-opening-sentence debris in all 3 locales
 * (each was a truncated re-run of the body's own intro text) — leaves all
 * 3 with NO summary for now, pending replacement copy.
 *
 * Hero image alt mismatch (Karnak temple photo on an accommodation page)
 * is flagged only — no action taken here, owner decides separately.
 *
 * Every deletion/edit is guarded against the block's current text; the
 * script aborts rather than write past a mismatch.
 *
 * STAGING ONLY — writes go to `drafts.wp-page-60649`, never published.
 * Run (dry):    npx tsx scripts/luxor-accommodation-stage-a.ts
 * Run (stage):  APPLY=1 npx tsx scripts/luxor-accommodation-stage-a.ts
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

const ID = 'wp-page-60649';

const EN_DELETE_KEYS = ['000000000088', '000000000089', '00000000008b', '00000000008d', '00000000008f'];
const ES_DELETE_KEYS = ['000000000001', '000000000003'];
const JA_TITLE_KEY = '000000000001';
const JA_TITLE_EXPECTED_TEXT = 'ルクソール宿泊ガイド';

const blockText = (b: any) => (b._type === 'block' ? (b.children ?? []).map((c: any) => c.text ?? '').join('') : '');

async function main() {
  console.log(`=== ${APPLY ? 'APPLY (staging draft)' : 'DRY RUN'}: ${ID} Stage A ===\n`);

  const pub: any = await client.getDocument(ID);
  const existingDraft: any = await client.getDocument(`drafts.${ID}`);
  if (existingDraft) throw new Error(`drafts.${ID} already exists — resolve/discard before staging`);
  const doc = JSON.parse(JSON.stringify(pub));

  // ---- EN: delete pending images + promo tail ----
  const enEntry = doc.body.find((b: any) => b._key === 'en');
  for (const key of EN_DELETE_KEYS) {
    const block = enEntry.value.find((b: any) => b._key === key);
    if (!block) throw new Error(`[guard] EN key ${key} not found`);
  }
  const promoTailBlock = enEntry.value.find((b: any) => b._key === '00000000008b');
  if (!blockText(promoTailBlock).includes("Egypt's Finest Stays")) {
    throw new Error(`[guard] EN promo tail text mismatch: "${blockText(promoTailBlock)}"`);
  }
  const enBefore = enEntry.value.length;
  enEntry.value = enEntry.value.filter((b: any) => !EN_DELETE_KEYS.includes(b._key));
  console.log(`body[en]: ${enBefore} -> ${enEntry.value.length} blocks (removed ${EN_DELETE_KEYS.length}: 2 pending images + 3-block promo tail)`);

  // ---- ES: delete DOCTYPE junk + duplicate title, keep real h2 ----
  const esEntry = doc.body.find((b: any) => b._key === 'es');
  const doctypeBlock = esEntry.value.find((b: any) => b._key === '000000000001');
  if (blockText(doctypeBlock) !== '<!DOCTYPE html>') {
    throw new Error(`[guard] ES DOCTYPE block mismatch: "${blockText(doctypeBlock)}"`);
  }
  const dupTitleBlock = esEntry.value.find((b: any) => b._key === '000000000003');
  if (blockText(dupTitleBlock) !== 'Guía de Alojamiento en Luxor') {
    throw new Error(`[guard] ES duplicate-title block mismatch: "${blockText(dupTitleBlock)}"`);
  }
  const realH2Block = esEntry.value.find((b: any) => b._key === '000000000005');
  if (realH2Block.style !== 'h2' || blockText(realH2Block) !== 'Guía de Alojamiento en Luxor') {
    throw new Error(`[guard] ES real h2 title block mismatch`);
  }
  const esBefore = esEntry.value.length;
  esEntry.value = esEntry.value.filter((b: any) => !ES_DELETE_KEYS.includes(b._key));
  console.log(`body[es]: ${esBefore} -> ${esEntry.value.length} blocks (removed DOCTYPE junk + duplicate title; kept real h2)`);

  // ---- JA: fix title block style, not a deletion ----
  const jaEntry = doc.body.find((b: any) => b._key === 'ja');
  const jaTitleBlock = jaEntry.value.find((b: any) => b._key === JA_TITLE_KEY);
  if (!jaTitleBlock || blockText(jaTitleBlock) !== JA_TITLE_EXPECTED_TEXT) {
    throw new Error(`[guard] JA title block mismatch: "${blockText(jaTitleBlock)}"`);
  }
  if (jaTitleBlock.style !== 'normal') {
    throw new Error(`[guard] JA title block style already "${jaTitleBlock.style}", expected "normal"`);
  }
  jaTitleBlock.style = 'h2';
  console.log(`body[ja]: block ${JA_TITLE_KEY} style 'normal' -> 'h2' (text unchanged: "${JA_TITLE_EXPECTED_TEXT}")`);

  // ---- Summary: clear debris in all 3 locales ----
  console.log('\n--- summary ---');
  for (const locale of ['en', 'es', 'ja'] as const) {
    const s = doc.summary?.find((x: any) => x._key === locale);
    if (!s) { console.log(`summary[${locale}]: already absent, no-op`); continue; }
    console.log(`summary[${locale}] BEFORE: ${s.value.slice(0, 80)}...`);
  }
  doc.summary = (doc.summary ?? []).filter((s: any) => !['en', 'es', 'ja'].includes(s._key));
  console.log('summary[en/es/ja]: all cleared, no summary (pending replacement copy)');

  if (!APPLY) {
    console.log('\nDRY RUN — no writes. Re-run with APPLY=1 to stage.');
    return;
  }

  mkdirSync('backups', { recursive: true });
  writeFileSync(`backups/luxor-accommodation-stage-a-rollback-2026-07-10.json`, JSON.stringify(pub, null, 2));
  doc._id = `drafts.${ID}`;
  await client.createOrReplace(doc);
  console.log(`\n✓ staged drafts.${ID} — NOT published. Review, then publish.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
