/**
 * Luxor accommodation (wp-page-60649) — Stage A part 2: heading-hierarchy fix.
 * Follows the first Stage A (debris cleanup, already published this session).
 *
 * ROOT BUG: `.prose-editorial` (globals.css) styles h2 and h3 but has NO h4
 * rule, so the hotel-name headings (stored as h4) render at 17px — identical
 * to body text — and read as plain paragraph starts. Confirmed in-browser
 * (h4=17px == body; h3=22px; h2=28px).
 *
 * EN edits (owner-approved):
 *   1. Delete the keyword-stuffed lead H2 "Top Hotels in Luxor: Where to
 *      Stay Near Karnak Temple and Luxor Temple" (not organizing content).
 *   2. Promote the 7 hotel names h4 -> h3 (the real fix — makes them visible
 *      headings, matching the restaurants page's h3 restaurant names).
 *   3. Promote the 3 hotel-category headings h3 -> h2 (Luxury Hotels,
 *      Peaceful Resorts, Boutique Comfort) — peers of the restaurants page's
 *      "East Bank"/"West Bank" h2s.
 *   4. "Authentic Local Stays" + "Practical Tips" STAY h3 (different content
 *      type, not hotel-category peers) — untouched.
 *   5. Delete the remaining promo tail: "Tailored Recommendations Just for
 *      You" + para + "Ready to Plan Your Luxor Getaway?" + para (4 blocks).
 *   6. No link changes (Valley of the Kings + Colossi of Memnon are
 *      legitimate same-guide nav links; kept).
 *
 * ES/JA minimal fix (this pass only):
 *   - Delete the redundant title-repeat lead H2 at [0] ("Guía de Alojamiento
 *     en Luxor" / "ルクソール宿泊ガイド"), mirroring the EN [0] deletion.
 *   - NO structural rebuild (ES/JA run a different per-hotel template with
 *     "Atracciones cercanas"/"周辺の見どころ" subsections + website lines +
 *     Conclusión/まとめ) — that waits for Stage B, designed with new copy.
 *
 * Hotel DESCRIPTIONS untouched everywhere (Stage B replaces them).
 *
 * Every edit guarded on key + exact current text + current style; aborts on
 * any mismatch. STAGING ONLY — writes drafts.wp-page-60649, never published.
 *
 * Run (dry):    npx tsx scripts/luxor-accommodation-stage-a-headings.ts
 * Run (stage):  APPLY=1 npx tsx scripts/luxor-accommodation-stage-a-headings.ts
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
  dataset, apiVersion: '2024-12-01', useCdn: false, token,
});

const ID = 'wp-page-60649';
const bt = (b: any) => (b._type === 'block' ? (b.children ?? []).map((c: any) => c.text ?? '').join('') : '');

// EN: { key, expectStyle, textStartsWith, action }
const EN_DELETE = [
  { key: '000000000004', style: 'h2', text: 'Top Hotels in Luxor: Where to Stay Near' },
  { key: '000000000075', style: 'h3', text: 'Tailored Recommendations Just for You' },
  { key: '00000000007f', style: 'normal', text: 'Not sure which of these hotels in Luxor' },
  { key: '000000000081', style: 'h3', text: 'Ready to Plan Your Luxor Getaway?' },
  { key: '000000000087', style: 'normal', text: 'Click here to request a custom itinerary' },
];
const EN_H4_TO_H3 = [
  { key: '00000000000c', text: 'Hilton Luxor Resort & Spa' },
  { key: '000000000016', text: 'Sofitel Pavillon Winter Luxor' },
  { key: '000000000020', text: 'Steigenberger Nile Palace' },
  { key: '00000000002f', text: 'Maritim Jolie Ville Kings Island Luxor' },
  { key: '000000000039', text: 'Mercure Luxor Karnak Resort' },
  { key: '000000000045', text: 'Steigenberger Achi Resort (formerly Sheraton Luxor)' },
  { key: '00000000004f', text: 'Sonesta St. George Hotel Luxor' },
];
const EN_H3_TO_H2 = [
  { key: '00000000000a', text: 'Luxury Hotels in Luxor' },
  { key: '00000000002d', text: 'Peaceful Resorts and Riverside Charm' },
  { key: '000000000043', text: 'Boutique Comfort and West Bank Gems' },
];
// ES/JA: delete the redundant title-repeat lead H2
const LEAD_DELETE = {
  es: { key: '000000000005', style: 'h2', text: 'Guía de Alojamiento en Luxor' },
  ja: { key: '000000000001', style: 'h2', text: 'ルクソール宿泊ガイド' },
};

function findBlock(entry: any, key: string): any {
  const b = entry.value.find((x: any) => x._key === key);
  if (!b) throw new Error(`key ${key} not found in body[${entry._key}]`);
  return b;
}

async function main() {
  console.log(`=== ${APPLY ? 'APPLY (staging draft)' : 'DRY RUN'}: ${ID} Stage A part 2 (headings) ===\n`);
  const pub: any = await client.getDocument(ID);
  const existingDraft: any = await client.getDocument(`drafts.${ID}`);
  if (existingDraft) throw new Error(`drafts.${ID} already exists — resolve/discard first`);
  const doc = JSON.parse(JSON.stringify(pub));

  const en = doc.body.find((b: any) => b._key === 'en');
  const es = doc.body.find((b: any) => b._key === 'es');
  const ja = doc.body.find((b: any) => b._key === 'ja');

  // ---- EN guards ----
  console.log('--- EN ---');
  for (const d of EN_DELETE) {
    const b = findBlock(en, d.key);
    if (b.style !== d.style) throw new Error(`[EN del ${d.key}] style ${b.style} != ${d.style}`);
    if (!bt(b).startsWith(d.text)) throw new Error(`[EN del ${d.key}] text guard fail: "${bt(b).slice(0,40)}"`);
  }
  for (const p of [...EN_H4_TO_H3, ...EN_H3_TO_H2]) {
    const b = findBlock(en, p.key);
    if (bt(b) !== p.text) throw new Error(`[EN promote ${p.key}] text guard fail: "${bt(b)}"`);
  }
  for (const p of EN_H4_TO_H3) { const b = findBlock(en, p.key); if (b.style !== 'h4') throw new Error(`[EN ${p.key}] expected h4, got ${b.style}`); }
  for (const p of EN_H3_TO_H2) { const b = findBlock(en, p.key); if (b.style !== 'h3') throw new Error(`[EN ${p.key}] expected h3, got ${b.style}`); }

  // apply EN
  const enDelKeys = new Set(EN_DELETE.map((d) => d.key));
  const enBefore = en.value.length;
  en.value = en.value.filter((b: any) => !enDelKeys.has(b._key));
  console.log(`  deleted ${enBefore - en.value.length} blocks (lead H2 + 4-block promo tail)`);
  for (const p of EN_H4_TO_H3) { findBlock(en, p.key).style = 'h3'; console.log(`  h4->h3: "${p.text}"`); }
  for (const p of EN_H3_TO_H2) { findBlock(en, p.key).style = 'h2'; console.log(`  h3->h2: "${p.text}"`); }

  // ---- ES/JA lead deletion ----
  for (const [loc, entry] of [['es', es], ['ja', ja]] as const) {
    const d = LEAD_DELETE[loc];
    const b = findBlock(entry, d.key);
    if (b.style !== d.style) throw new Error(`[${loc} del ${d.key}] style ${b.style} != ${d.style}`);
    if (bt(b) !== d.text) throw new Error(`[${loc} del ${d.key}] text guard fail: "${bt(b)}"`);
    const before = entry.value.length;
    entry.value = entry.value.filter((x: any) => x._key !== d.key);
    console.log(`--- ${loc.toUpperCase()} ---\n  deleted redundant lead H2 "${d.text}" (${before}->${entry.value.length})`);
  }

  console.log(`\nfinal block counts: en=${en.value.length} es=${es.value.length} ja=${ja.value.length}`);
  if (!APPLY) { console.log('\nDRY RUN — no writes. Re-run with APPLY=1.'); return; }

  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/luxor-accommodation-stage-a-headings-rollback-2026-07-10.json', JSON.stringify(pub, null, 2));
  doc._id = `drafts.${ID}`;
  await client.createOrReplace(doc);
  console.log(`\n✓ staged drafts.${ID} — NOT published. Review, then publish.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
