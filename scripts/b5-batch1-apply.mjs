/**
 * B5 batch 1 (2026-11-09): writes the owner-locked copy in
 * docs/b5-copy-draft-2026-11-09.md to Sanity. Verbatim pre-flight (Canon
 * Gate A): every string must appear byte-for-byte in the locked file, or
 * nothing is written. Usage: node scripts/b5-batch1-apply.mjs [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const locked = fs.readFileSync('docs/b5-copy-draft-2026-11-09.md', 'utf8');
if (!/Status: LOCKED/.test(locked)) throw new Error('copy file is not LOCKED');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const S = (v) => [{ _key: 'en', _type: 'internationalizedArrayStringValue', value: v }];
const T = (v) => [{ _key: 'en', _type: 'internationalizedArrayTextValue', value: v }];
// [docId, field label, GROQ path to read, patch(set object), new string]
const NEWSEO = (id, title, desc) => [
  [id, 'meta title', 'seo.metaTitle[_key=="en"][0].value', { 'seo.metaTitle': S(title) }, title],
  [id, 'meta description', 'seo.metaDescription[_key=="en"][0].value', { 'seo.metaDescription': T(desc) }, desc],
];
const OPS = [
  ...NEWSEO('wp-page-88178', 'Dendera and Abydos Temples Tour from Luxor',
    'Private full-day tour from Luxor to the Temple of Hathor at Dendera and the Temple of Seti I at Abydos, with its King List. About 11 hours.'),
  ['wp-page-88178', 'intro', 'summary[_key=="en"][0].value', null,
    'A private full day north of Luxor to two major temples: Hathor\'s temple at Dendera, among the best preserved in Egypt, and the Temple of Seti I at Abydos, with its King List of seventy-six names.'],
  ...NEWSEO('wp-page-86875', 'Nile Cruise and Hurghada Stay: 14 Days',
    'A 14-day private package: a week\'s Nile cruise between Luxor and Aswan, then a week on the Red Sea at Hurghada, planned as one trip.'),
  ['wp-page-86875', 'intro', 'summary[_key=="en"][0].value', null,
    'A Nile cruise and a Red Sea stay in one fortnight: a week on the river between Luxor and Aswan, then a week at Hurghada — two registers, deliberately uneven.'],
  ['tourLanding.luxor-private-day-tours', 'meta title', 'seo.metaTitle[_key=="en"][0].value', null, 'Luxor Private Day Tours and Day Trips'],
  ...NEWSEO('wp-page-113061', 'Siwa Oasis Tour from Cairo: 3 Days',
    'A private 3-day Siwa Oasis tour from Cairo: the coast road past El Alamein, the oasis near the Libyan border, and the return through Marsa Matrouh.'),
  ['wp-page-113061', 'H1', 'title[_key=="en"][0].value', null, '3-Day Siwa Oasis Tour from Cairo, via El Alamein'],
  ['wp-page-113061', 'intro', 'summary[_key=="en"][0].value', null,
    'Three days from Cairo to Siwa and back: west along the Mediterranean coast past El Alamein, into the oasis near the Libyan border, and home by way of Marsa Matrouh.'],
  ...NEWSEO('wp-page-89558', '8-Day Essential Egypt Tour: Cairo to Luxor',
    'A private 8-day Egypt tour: the Giza plateau, Alexandria on the Mediterranean, Abu Simbel and Aswan, then the temples and tombs of Luxor.'),
  ['wp-page-87832', 'meta title', 'seo.metaTitle[_key=="en"][0].value', null, 'Mount Sinai Tour from Cairo: 2 Days'],
  ...NEWSEO('wp-page-86867', 'Sharm El Sheikh Travel Package: 8 Days',
    'An 8-day private Sharm El Sheikh package: Ras Mohammed, the Tiran reefs and the Sinai desert interior, with a stop in Cairo on the Nile.'),
  ...NEWSEO('wp-page-89015', 'Romantic Egypt Tour: 10 Days for Two',
    'A private 10-day Egypt tour paced for two: Cairo, Luxor, the Nile, Aswan and Alexandria, with a felucca at Elephantine and a dinner cruise.'),
  ['wp-post-155175-en', 'meta title (blog)', 'seo.metaTitle', { 'seo.metaTitle': 'Egypt Holidays from the UK' }, 'Egypt Holidays from the UK'],
  ['wp-post-172212-ja', 'meta title (blog)', 'seo.metaTitle', { 'seo.metaTitle': 'イギリスからエジプトへの休暇' }, 'イギリスからエジプトへの休暇'],
];

// Verbatim pre-flight.
const norm = (s) => s.replace(/[’‘]/g, "'");
const bad = OPS.filter(([, , , , v]) => !norm(locked).includes(norm(v)));
if (bad.length) { console.error('PRE-FLIGHT FAILED — not in locked copy:', bad.map((b) => b[4])); process.exit(1); }
console.log(`pre-flight OK: ${OPS.length} strings match the locked copy`);

let tx = c.transaction();
for (const [id, label, path, set, v] of OPS) {
  for (const docId of [id, `drafts.${id}`]) {
    const cur = await c.fetch(`*[_id==$docId][0]{"v": ${path}, "seoDefined": defined(seo)}`, { docId });
    if (!cur) continue;
    console.log(`\n${docId} · ${label}\n  - ${cur.v ?? '(empty)'}\n  + ${v}`);
    if (cur.v === v) { console.log('  (unchanged)'); continue; }
    tx = tx.patch(docId, (p) => {
      if (set && set['seo.metaTitle'] && Array.isArray(set['seo.metaTitle']) || set && set['seo.metaDescription']) p = p.setIfMissing({ seo: { _type: 'seo' } });
      if (set && !cur.seoDefined && typeof Object.values(set)[0] === 'string') p = p.setIfMissing({ seo: {} });
      if (set && cur.v == null) return p.set(set);
      return p.set({ [path.replace('[0].value', '.value')]: v });
    });
  }
}
if (APPLY) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('\ncommitted', r.results.length, 'mutations'); }
else console.log('\n(dry run — pass --apply to write)');
