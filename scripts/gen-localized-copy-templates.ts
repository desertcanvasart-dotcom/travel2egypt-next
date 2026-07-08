/**
 * Generate owner-fill ES/JA copy templates for the two locale-gated batches
 * (climate signature + price manifest). Read-only: extracts the EN source of
 * truth from the code/data and writes CSVs with blank es/ja columns for the
 * owner to translate. Nothing is drafted — es/ja are left empty.
 *
 * The owner fills the es/ja columns; a follow-up wire-in step reads the filled
 * CSV back into src/data/climate + the price chrome map, then flips the gate.
 *
 * Run: npx tsx scripts/gen-localized-copy-templates.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';

import { climateData, type ClimateEditorial } from '../src/data/climate';

const STAMP = '2026-07-08';
mkdirSync('docs', { recursive: true });

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ── Climate: 41 cities × up to 5 editorial fields ───────────────────────────
const CLIMATE_FIELDS: (keyof ClimateEditorial)[] = [
  'descriptors',
  'gapText',
  'troughText',
  'caption',
  'seasonLabel',
];

const climateRows: string[] = ['citySlug,field,en,es,ja'];
let climateCities = 0;
let climateStrings = 0;
for (const [city, rec] of Object.entries(climateData)) {
  const en = rec.editorial.en;
  if (!en) continue;
  climateCities += 1;
  for (const field of CLIMATE_FIELDS) {
    const enVal = en[field];
    if (!enVal) continue; // only ask for translations of fields the EN actually uses
    climateStrings += 1;
    climateRows.push([city, field, csvCell(enVal), '', ''].join(','));
  }
}
const climatePath = `docs/climate-signature-copy-ES-JA-template-${STAMP}.csv`;
writeFileSync(climatePath, climateRows.join('\n') + '\n');

// ── Price manifest: shared chrome + the 2 locked footnotes ──────────────────
// EN source is hardcoded in src/components/prices/PriceManifest.tsx (owner-locked).
// Extracted verbatim here so the owner translates against the exact live text.
// Extracted verbatim from PriceManifest.tsx (2026-07-08). v2 renders NO title
// (surfaceless). Chrome = the stamp label + the 4 table headers; then the 2
// owner-locked footnote paragraphs. `EGP` and the em-dash stay as-is.
const PRICE_STRINGS: { key: string; en: string; note: string }[] = [
  { key: 'stamp_label', en: 'Checked', note: 'Stamp label; the date follows in bold.' },
  { key: 'stamp_date', en: 'July 2026', note: 'The `checked` value per page (es: "julio de 2026", ja: "2026年7月"). Currently one date across pages.' },
  { key: 'header_site', en: 'Site', note: 'Table header.' },
  { key: 'header_adult', en: 'Adult', note: 'Table header.' },
  { key: 'header_student', en: 'Student', note: 'Table header.' },
  { key: 'header_hours', en: 'Hours', note: 'Table header.' },
  {
    key: 'footnote_1',
    en: 'Egypt revises its antiquities fees often, usually ahead of the winter season — treat these as accurate at the date above, and expect the direction of change to be upward. Student prices need an ISIC card, and "hours" means the gate: last entry is generally 45 minutes before it.',
    note: 'Owner-locked footnote ¶1 (verbatim from mock).',
  },
  {
    key: 'footnote_2',
    en: 'On our private tours, this table is our problem rather than yours — tickets are arranged and included as listed on each itinerary.',
    note: 'Owner-locked footnote ¶2 (verbatim from mock).',
  },
];
const priceRows: string[] = ['key,en,es,ja,note'];
for (const s of PRICE_STRINGS) priceRows.push([s.key, csvCell(s.en), '', '', csvCell(s.note)].join(','));
const pricePath = `docs/price-manifest-chrome-ES-JA-template-${STAMP}.csv`;
writeFileSync(pricePath, priceRows.join('\n') + '\n');

console.log(`Climate template → ${climatePath}`);
console.log(`  ${climateCities} cities, ${climateStrings} strings to translate (×2 locales).`);
console.log(`Price template   → ${pricePath}`);
console.log(`  ${PRICE_STRINGS.length} chrome/footnote strings (×2 locales).`);
