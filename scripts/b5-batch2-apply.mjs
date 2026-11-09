/**
 * B5 batch 2 (2026-11-09): writes the owner-locked copy in
 * docs/b5-copy-batch2-draft-2026-11-09.md to Sanity (EN fields only). Verbatim
 * pre-flight (Canon Gate A). The packages-hub title lives in messages/en.json
 * (packagesHub.metaTitle) and is changed in the PR, not here.
 * Usage (from the repo root): node scripts/b5-batch2-apply.mjs [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const locked = fs.readFileSync('docs/b5-copy-batch2-draft-2026-11-09.md', 'utf8');
if (!/Status: LOCKED/.test(locked)) throw new Error('copy file is not LOCKED');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const MT = 'metaTitle', MD = 'metaDescription';
// [docId, seo field, new EN string]
const SEO = [
  ['wp-page-90326', MT, 'Nile Cruise from Cairo to Luxor: 13 Days'],
  ['wp-page-90326', MD, 'A private 13-day Nile cruise from Cairo to Luxor: the Giza plateau first, then south through the temples and tombs of Middle Egypt to Karnak.'],
  ['wp-page-89177', MT, 'Nile Cruise from Luxor to Cairo: 11 Days'],
  ['wp-page-89177', MD, 'A private 11-day Nile cruise from Luxor to Cairo: Karnak first, then north through the temples and tombs of Middle Egypt to Giza at the end.'],
  ['tourLanding.authentic-dahabiya-nile-cruise', MT, 'Dahabiya Nile Cruises: Luxor and Aswan'],
  ['tourLanding.egypt-luxury-holidays', MT, 'Luxury Egypt Holidays and Private Tours'],
  ['tourLanding.egypt-family-holidays', MT, 'Egypt Family Holidays and Tours with Kids'],
  ['tourLanding.multiday-adventure-and-safari-tours', MT, 'Egypt Desert Safari and Adventure Tours'],
  ['tourLanding.cairo-private-day-tours', MT, 'Cairo Private Day Tours and Day Trips'],
  ['tourLanding.aswan-private-day-tours', MT, 'Aswan Private Day Tours and Day Trips'],
  ['wp-page-88170', MT, 'Valley of the Kings Tour: Luxor West Bank'],
  ['wp-page-88170', MD, 'A private full day on Luxor’s West Bank: the Valleys of the Kings and Queens, the Colossi of Memnon, Hatshepsut’s temple, Medinet Habu and Deir el-Medina.'],
  ['wp-page-129996', MT, 'Lake Nasser Fishing Safari: 3 Days'],
  ['wp-page-129996', MD, 'A private three-day live-aboard fishing safari on Lake Nasser for Nile perch and tigerfish, with Nubian guides and no other boats around you.'],
  ['wp-page-136519', MT, '7-Day Egypt Tour: Cairo, Nile Cruise, Luxor'],
  ['wp-page-136519', MD, 'A private 7-day Egypt tour: Cairo and Giza, the overnight train south, a three-night Nile cruise from Aswan to Luxor and a last day in Thebes.'],
  ['wp-page-156421', MT, '9-Day Egypt Tour: Cairo, Luxor and Aswan'],
  ['wp-page-156421', MD, 'A private 9-day Egypt tour: Giza and old Cairo, both banks of Luxor, a Nile cruise to Aswan past Edfu and Kom Ombo, and Saqqara to close.'],
  ['wp-page-156539', MT, '10-Day Private Egypt Tour with Abu Simbel'],
  ['wp-page-156539', MD, 'Ten private days that end at Giza: Cairo’s older quarters, Alexandria, the Nubian south and Abu Simbel, Luxor on both banks, then the pyramids.'],
  ['wp-page-86836', MT, '11-Day Egypt Tour: Nile, Luxor and Red Sea'],
  ['wp-page-86836', MD, 'Eleven family-paced private days: the Giza plateau, Abu Simbel, both banks of Luxor, and a Red Sea stay to close the trip.'],
  ['wp-page-112993', MT, '12-Day Egypt Family Tour: Nile and Red Sea'],
  ['wp-page-112993', MD, 'Twelve family-paced private days: Cairo’s pyramids and bazaars, three nights on the Red Sea, and four on a Nile cruise from Luxor to Aswan.'],
  ['wp-page-113004', MT, '14-Day Luxury Egypt Family Holiday'],
  ['wp-page-113004', MD, 'Fourteen family-paced private days at top hotel and cruise grades: Giza, a Nile cruise from Aswan to Luxor, four nights on the Red Sea, Cairo to close.'],
];
const SUMMARY = { id: 'wp-page-156421', value: 'Nine private days: Cairo and Giza, a flight to Luxor, a Nile cruise south past Edfu and Kom Ombo to Aswan, the night train back, and Saqqara and Old Cairo to close.' };

const strings = [...SEO.map((s) => s[2]), SUMMARY.value];
const bad = strings.filter((v) => !locked.includes(v));
if (bad.length) { console.error('PRE-FLIGHT FAILED:', bad); process.exit(1); }
console.log(`pre-flight OK: ${strings.length} strings match the locked copy`);

const itemType = (f) => (f === MT ? 'internationalizedArrayStringValue' : 'internationalizedArrayTextValue');
let tx = c.transaction(), n = 0;
for (const base of [...new Set([...SEO.map((s) => s[0]), SUMMARY.id])]) {
  for (const id of [base, `drafts.${base}`]) {
    const doc = await c.fetch(`*[_id==$id][0]{_id, seo, summary}`, { id });
    if (!doc) { if (id === base) throw new Error(`missing ${id}`); continue; }
    let p = c.patch(id), changed = false;
    if (!doc.seo) p = p.setIfMissing({ seo: { _type: 'seo' } });
    for (const [, f, v] of SEO.filter((s) => s[0] === base)) {
      const arr = doc.seo?.[f];
      const cur = Array.isArray(arr) ? arr.find((i) => i._key === 'en')?.value : undefined;
      console.log(`\n${id} · seo.${f} [en]\n  - ${cur ?? '(empty)'}\n  + ${v}`);
      if (cur === v) { console.log('  (unchanged)'); continue; }
      changed = true;
      const item = { _key: 'en', _type: itemType(f), value: v };
      if (!Array.isArray(arr)) p = p.set({ [`seo.${f}`]: [item] });
      // A Sanity patch holds one insert; each insert goes in its own patch.
      else if (cur === undefined) tx = tx.patch(c.patch(id).insert('before', `seo.${f}[0]`, [item]));
      else p = p.set({ [`seo.${f}[_key=="en"].value`]: v });
    }
    if (base === SUMMARY.id) {
      const cur = Array.isArray(doc.summary) ? doc.summary.find((i) => i._key === 'en')?.value : undefined;
      console.log(`\n${id} · summary [en]\n  - ${cur ?? '(empty)'}\n  + ${SUMMARY.value}`);
      if (cur === undefined) throw new Error(`no en summary on ${id}`);
      if (cur !== SUMMARY.value) { changed = true; p = p.set({ 'summary[_key=="en"].value': SUMMARY.value }); }
    }
    if (changed) { tx = tx.patch(p); n++; }
  }
}
if (APPLY && n) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('\ncommitted', r.results.length, 'mutations'); }
else console.log(`\n${n} docs to patch ${APPLY ? '' : '(dry run — pass --apply)'}`);
