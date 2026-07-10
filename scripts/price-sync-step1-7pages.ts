/**
 * Price-sync Step 1 — resync ES prices to the EN/JA-verified figures
 * ("Checked July 2026") across the 7 clean-pattern legacy price pages
 * (Al Minya & Asyut, Alexandria, Aswan, Giza, Qena, Sohag; Beni Suef is
 * already clean, 0 rows need touching).
 *
 * Investigation (2026-07-10) found JA matches EN exactly on every row of
 * every page; ES was never updated when the owner did the EN price
 * verification pass. On top of the plain price staleness, 2 non-numeric
 * drift items were found in the SAME stale rows and are fixed here too:
 *   - Aswan "ABS Temple on 22 Oct & 22 Feb": ES said "el 2 de febrero"
 *     (should be "el 22 de febrero") — corrupts a real solar-alignment date.
 *   - Aswan "Kom Ombo Temple": ES name had "Omb0" (digit zero for the
 *     letter O) — a spelling typo, unrelated to price.
 * Hours were swept and found fully consistent across locales on every
 * row of every page — no hour corrections needed.
 *
 * Each row's price fields are replaced by splitting the block text on
 * " · " and rebuilding segments 1 (adult) and 2 (student) — never a blind
 * regex substitution — so the name/hours segments are never touched
 * except for the 2 explicit text fixes above. Every row is guarded
 * against its current ES price figures (and text-fix substring, where
 * applicable) before writing; the script aborts on any mismatch.
 *
 * STAGING ONLY — writes go to `drafts.<id>`, never published.
 * Run (dry):    npx tsx scripts/price-sync-step1-7pages.ts
 * Run (stage):  APPLY=1 npx tsx scripts/price-sync-step1-7pages.ts
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

interface RowFix {
  key: string;
  oldAdult: number;
  oldStudent: number;
  newAdult: number;
  newStudent: number;
  textFix?: { old: string; new: string };
}
interface PageFix {
  id: string;
  city: string;
  rows: RowFix[];
}

const PAGES: PageFix[] = [
  {
    id: 'wp-page-72364', city: 'Al Minya & Asyut',
    rows: [
      { key: '00000000000c', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
      { key: '00000000000e', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
      { key: '000000000014', oldAdult: 100, oldStudent: 50, newAdult: 120, newStudent: 60 },
      { key: '000000000016', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
      { key: '000000000018', oldAdult: 100, oldStudent: 50, newAdult: 120, newStudent: 60 },
    ],
  },
  {
    id: 'wp-page-72292', city: 'Alexandria',
    rows: [
      { key: '000000000020', oldAdult: 300, oldStudent: 150, newAdult: 400, newStudent: 200 },
      { key: '000000000022', oldAdult: 180, oldStudent: 90, newAdult: 220, newStudent: 110 },
      { key: '00000000002c', oldAdult: 180, oldStudent: 90, newAdult: 220, newStudent: 110 },
      { key: '00000000002e', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
      { key: '000000000030', oldAdult: 189, oldStudent: 90, newAdult: 180, newStudent: 90 }, // outlier: ES was higher than EN
      { key: '000000000032', oldAdult: 100, oldStudent: 50, newAdult: 120, newStudent: 60 },
      { key: '000000000034', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
      { key: '000000000036', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
      { key: '00000000003a', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
    ],
  },
  {
    id: 'wp-page-72314', city: 'Aswan',
    rows: [
      { key: '00000000000e', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
      { key: '000000000010', oldAdult: 600, oldStudent: 300, newAdult: 750, newStudent: 375 },
      {
        key: '000000000012', oldAdult: 900, oldStudent: 450, newAdult: 1200, newStudent: 600,
        textFix: { old: 'el 22 de octubre y el 2 de febrero', new: 'el 22 de octubre y el 22 de febrero' },
      },
      { key: '000000000016', oldAdult: 450, oldStudent: 230, newAdult: 550, newStudent: 275 },
      { key: '00000000001c', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
      {
        key: '00000000001e', oldAdult: 360, oldStudent: 180, newAdult: 450, newStudent: 225,
        textFix: { old: 'Kom Omb0', new: 'Kom Ombo' },
      },
      { key: '000000000022', oldAdult: 300, oldStudent: 150, newAdult: 400, newStudent: 200 },
      { key: '000000000024', oldAdult: 450, oldStudent: 230, newAdult: 550, newStudent: 275 },
      { key: '000000000026', oldAdult: 200, oldStudent: 100, newAdult: 220, newStudent: 110 },
    ],
  },
  {
    id: 'wp-page-72327', city: 'Giza',
    rows: [
      { key: '000000000010', oldAdult: 540, oldStudent: 270, newAdult: 700, newStudent: 350 },
      { key: '000000000012', oldAdult: 900, oldStudent: 450, newAdult: 1000, newStudent: 500 },
      { key: '000000000014', oldAdult: 220, oldStudent: 110, newAdult: 280, newStudent: 140 },
      { key: '000000000016', oldAdult: 220, oldStudent: 110, newAdult: 280, newStudent: 140 },
      { key: '000000000018', oldAdult: 400, oldStudent: 200, newAdult: 200, newStudent: 200 },
      { key: '00000000001a', oldAdult: 120, oldStudent: 60, newAdult: 200, newStudent: 100 },
      { key: '00000000001e', oldAdult: 450, oldStudent: 230, newAdult: 600, newStudent: 300 },
      { key: '000000000020', oldAdult: 330, oldStudent: 170, newAdult: 400, newStudent: 200 },
      { key: '000000000022', oldAdult: 240, oldStudent: 120, newAdult: 300, newStudent: 150 },
      { key: '000000000024', oldAdult: 900, oldStudent: 450, newAdult: 1000, newStudent: 500 },
      { key: '000000000026', oldAdult: 220, oldStudent: 110, newAdult: 280, newStudent: 140 },
      { key: '000000000028', oldAdult: 270, oldStudent: 140, newAdult: 340, newStudent: 170 },
      { key: '00000000002a', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
      { key: '00000000002c', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
      { key: '00000000002e', oldAdult: 150, oldStudent: 75, newAdult: 200, newStudent: 100 },
    ],
  },
  {
    id: 'wp-page-72338', city: 'Qena',
    rows: [
      { key: '00000000000e', oldAdult: 240, oldStudent: 120, newAdult: 300, newStudent: 150 },
    ],
  },
  {
    id: 'wp-page-72336', city: 'Sohag',
    rows: [
      { key: '00000000000e', oldAdult: 100, oldStudent: 50, newAdult: 120, newStudent: 60 },
      { key: '000000000016', oldAdult: 200, oldStudent: 100, newAdult: 260, newStudent: 130 },
    ],
  },
];

const blockText = (b: any) => (b._type === 'block' ? (b.children ?? []).map((c: any) => c.text ?? '').join('') : '');

/**
 * Some rows have an inline link markDef on the attraction name, splitting
 * the block into multiple spans (e.g. "Templo de " + [link]"Edfu" + " ·
 * EGP450 · EGP230 · ..."). Editing must be span-aware: only the span(s)
 * actually containing the price/name text get touched — a link span's
 * text and markDefs are never modified, so the link itself survives.
 */
function rebuildBlock(block: any, fix: RowFix): void {
  const spans: Array<{ text: string }> = block.children;

  if (fix.textFix) {
    const span = spans.find((s) => s.text.includes(fix.textFix!.old));
    if (!span) throw new Error(`textFix guard failed — "${fix.textFix.old}" not found in any span`);
    span.text = span.text.replace(fix.textFix.old, fix.textFix.new);
  }

  // Locate the span holding the price segments (the only span containing "EGP").
  const priceSpan = spans.find((s) => s.text.includes('EGP'));
  if (!priceSpan) throw new Error('no span contains "EGP"');
  const segments = priceSpan.text.split(' · ');
  const priceIdxs = segments
    .map((seg, i) => (/^EGP\d+$/.test(seg) ? i : -1))
    .filter((i) => i !== -1);
  if (priceIdxs.length !== 2) throw new Error(`expected exactly 2 EGP segments, found ${priceIdxs.length} in "${priceSpan.text}"`);
  segments[priceIdxs[0]] = `EGP${fix.newAdult}`;
  segments[priceIdxs[1]] = `EGP${fix.newStudent}`;
  priceSpan.text = segments.join(' · ');
}

async function main() {
  console.log(`=== ${APPLY ? 'APPLY (staging drafts)' : 'DRY RUN'}: price-sync Step 1 (7 pages) ===\n`);
  const backup: Record<string, unknown> = {};
  let totalRows = 0;

  for (const page of PAGES) {
    const pub: any = await client.getDocument(page.id);
    const existingDraft: any = await client.getDocument(`drafts.${page.id}`);
    if (existingDraft) throw new Error(`drafts.${page.id} already exists — resolve/discard before staging`);
    const doc = JSON.parse(JSON.stringify(pub));
    const esEntry = doc.body.find((b: any) => b._key === 'es');

    console.log(`--- ${page.city} (${page.id}) ---`);
    for (const fix of page.rows) {
      const block = esEntry.value.find((b: any) => b._key === fix.key);
      if (!block) throw new Error(`[guard] ${page.id} key ${fix.key} not found`);
      const text = blockText(block);
      const expectedOld = `EGP${fix.oldAdult}`;
      if (!text.includes(expectedOld)) throw new Error(`[guard] ${page.id} key ${fix.key}: expected "${expectedOld}" in "${text}"`);
      const spanCountBefore = block.children.length;
      rebuildBlock(block, fix);
      const newText = blockText(block);
      if (block.children.length !== spanCountBefore) throw new Error(`[guard] ${page.id} key ${fix.key}: span count changed unexpectedly`);
      console.log(`  [${fix.key}] ${fix.textFix ? '(+ text fix) ' : ''}${spanCountBefore > 1 ? '(multi-span, link preserved) ' : ''}${text}`);
      console.log(`  ${' '.repeat(fix.key.length + 4)}-> ${newText}`);
      totalRows++;
    }
    console.log('');

    if (!APPLY) continue;
    backup[page.id] = { publishedBefore: pub };
    doc._id = `drafts.${page.id}`;
    await client.createOrReplace(doc);
  }

  console.log(`Total rows corrected: ${totalRows} across ${PAGES.length} pages`);
  if (!APPLY) { console.log('\nDRY RUN — no writes. Re-run with APPLY=1 to stage.'); return; }

  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/price-sync-step1-7pages-rollback-2026-07-10.json', JSON.stringify(backup, null, 2));
  console.log('\n✓ staged 6 drafts (Beni Suef needs no changes) — NOT published. Review, then publish.');
}

main().catch((e) => { console.error(e); process.exit(1); });
