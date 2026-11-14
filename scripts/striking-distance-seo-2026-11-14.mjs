// Owner-approved 2026-11-14 ("Approve as written"):
// review/seo/striking-distance-2026-11-14-en.md, section A (EN snippets only).
// node scripts/striking-distance-seo-2026-11-14.mjs [--apply]   (repo root)
//
// Canon Gate A: every string written must byte-match the locked review file
// (after straight→curly apostrophe normalisation). Any mismatch aborts.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const apply = process.argv.includes('--apply');
const curly = (s) => s.replace(/'/g, '’');
const LOCKED = curly(readFileSync('review/seo/striking-distance-2026-11-14-en.md', 'utf8'));

// field kinds: 'i18n' = internationalizedArray (set the en item, keep es/ja);
//              'plain' = per-language article doc string field.
const CHANGES = [
  { id: 'tourLanding.luxor-private-day-tours', kind: 'i18n', set: {
    'seo.metaTitle': 'Luxor Private Tours: Day Trips with Your Own Guide',
    'seo.metaDescription': 'Private Luxor day tours with your own guide: Karnak, Luxor Temple and the Valley of the Kings, plus day trips to Dendera, Edfu, Kom Ombo and Aswan.',
  } },
  { id: 'wp-page-59386', kind: 'i18n', set: { // /guide/cairo/cairo-tours
    'seo.metaTitle': 'Cairo Tours: The Pyramids, Museums, Old Cairo and Day Trips',
    seoDescription: "Cairo's sites are spread across a large city with heavy traffic, so most visitors book tours, at minimum for the Pyramids and the museums. Every option, from Saqqara to Fayoum.",
  } },
  { id: 'guideArticle.siwa-oasis.tours-in-siwa-oasis', kind: 'i18n', set: {
    'seo.metaTitle': 'Siwa Tours: Local Circuits, Salt Lakes and Great Sand Sea Safaris',
    seoDescription: 'Siwa divides into two kinds of travel: half-day circuits around Shali, the Oracle, the springs and the salt lakes, and 4×4 trips into the Great Sand Sea. How to choose, and when to go.',
  } },
  { id: 'guideArticle.sharm-el-sheikh.tours-in-sharm-el-sheikh', kind: 'i18n', set: {
    'seo.metaTitle': "Sharm El Sheikh Tours and Excursions: What's Worth Booking",
    seoDescription: "Sharm sells excursions on every corner. Which are worth it: Ras Mohammed and Tiran by boat, the Thistlegorm, desert safaris, Mount Sinai and Saint Catherine's, Cairo by plane.",
  } },
  { id: 'wp-post-111586-en', kind: 'plain', set: { // /blog/dahabiya-nile-cruises-wind-powered-journey
    'seo.metaTitle': 'What Is a Dahabiya? Routes, Season and Who It Suits',
    'seo.metaDescription': '', // cleared: the existing summary (deck) takes over
  } },
  { id: 'tourLanding.nile-cruise-holidays', kind: 'i18n', set: {
    'seo.metaTitle': 'Nile Cruise Holidays: Luxor–Aswan, Lake Nasser and Cairo Routes',
  } },
];

const ITEM_TYPE = { 'seo.metaTitle': 'internationalizedArrayStringValue' };
const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

// ── Pre-flight: every non-empty string must appear verbatim in the locked file.
let bad = 0;
for (const ch of CHANGES) for (const v of Object.values(ch.set)) {
  if (v && !LOCKED.includes(curly(v))) { console.error(`PRE-FLIGHT MISMATCH (${ch.id}): ${v}`); bad++; }
}
if (bad) { console.error(`${bad} string(s) not in locked copy — aborting.`); process.exit(1); }
console.log('pre-flight: all strings match the locked review file');

const tx = c.transaction();
for (const ch of CHANGES) {
  for (const id of [ch.id, `drafts.${ch.id}`]) {
    const d = await c.getDocument(id);
    if (!d) { if (id === ch.id) throw new Error(`missing ${id}`); continue; }
    const patch = {};
    for (const [path, raw] of Object.entries(ch.set)) {
      const value = curly(raw);
      if (ch.kind === 'plain') {
        console.log(`${id} ${path}: ${JSON.stringify(get(d, path))} → ${JSON.stringify(value)}`);
        patch[path] = value;
        continue;
      }
      const arr = Array.isArray(get(d, path)) ? get(d, path) : [];
      const old = arr.find((x) => x._key === 'en');
      const itemType = ITEM_TYPE[path] ?? 'internationalizedArrayTextValue';
      const next = old
        ? arr.map((x) => (x._key === 'en' ? { ...x, value } : x))
        : [{ _key: 'en', _type: itemType, value }, ...arr];
      console.log(`${id} ${path} [en]: ${JSON.stringify(old?.value ?? null)} → ${JSON.stringify(value)}`);
      patch[path] = next;
    }
    tx.patch(id, (p) => p.set(patch));
  }
}
if (apply) console.log('committed', (await tx.commit()).transactionId);
else console.log('dry run — pass --apply to write');
