/**
 * Two edits to the 7-Day Egypt Tour (owner, 26 Nov), EN/ES/JA:
 *  - remove "The Mummies Room at the Egyptian Museum" extra (Day 2 and the not-included list): the royal
 *    mummies are at the National Museum of Egyptian Civilisation, as the same page already says;
 *  - add the option of a day in Alexandria, the page that now takes over from "Seven Days in Egypt".
 *
 *   node --env-file=<.env> scripts/itinerary-format/edit-7day-mummies-alexandria-2026-11-26.mjs           # dry run
 *   node --env-file=<.env> scripts/itinerary-format/edit-7day-mummies-alexandria-2026-11-26.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const ID = 'wp-page-136519';
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });

const MUMMIES = { en: 'The Mummies Room at the Egyptian Museum', es: 'La Sala de las Momias del Museo Egipcio', ja: 'エジプト考古学博物館のミイラ室' };
const OPTION = {
  en: 'Add a day in Alexandria, on the Mediterranean (the trip becomes eight days)',
  es: 'Añadir un día en Alejandría, en el Mediterráneo (el viaje pasa a ocho días)',
  ja: '地中海の街アレクサンドリアの1日を加える（8日間の旅になります）',
};

const doc = await client.getDocument(ID);
if (!doc) throw new Error(`missing ${ID}`);
if (await client.getDocument(`drafts.${ID}`)) throw new Error('draft exists');
const unset = [];
for (const [l, text] of Object.entries(MUMMIES)) {
  const ex = doc.exclusions.filter((x) => x.lang === l && x.text === text);
  const days = doc.itineraryDays.filter((d) => d.lang === l).flatMap((d) => (d.optional ?? []).filter((o) => o.text.startsWith(text)).map((o) => ({ d, o })));
  if (ex.length !== 1 || days.length !== 1) throw new Error(`${l}: expected one exclusion and one day option, found ${ex.length} and ${days.length}`);
  unset.push(`exclusions[_key=="${ex[0]._key}"]`, `itineraryDays[_key=="${days[0].d._key}"].optional[_key=="${days[0].o._key}"]`);
  console.log(`${l}: remove "${ex[0].text}" and Day ${days[0].d.day} "${days[0].o.text}"`);
}
if (doc.customisationOptions.some((o) => Object.values(OPTION).includes(o.text))) throw new Error('option already there');
// Each new option goes after the last option of its language.
const options = [];
for (const l of ['en', 'es', 'ja']) {
  const mine = doc.customisationOptions.filter((o) => o.lang === l);
  options.push(...mine, { _key: `itin7opt-alex-${l}`, _type: 'productFact', lang: l, text: OPTION[l], source: 'Owner decision, 26 Nov 2026: Seven Days in Egypt folds into this page.', needsReview: false });
  console.log(`${l}: add option "${OPTION[l]}"`);
}
if (options.length !== doc.customisationOptions.length + 3) throw new Error('options in an unexpected language');

if (!apply) { console.log('dry run (--apply writes production)'); process.exit(0); }
await writeRollback(client, [ID], 'before-7day-edits');
await client.patch(ID).ifRevisionId(doc._rev).set({ customisationOptions: options }).unset(unset).commit();
console.log(`APPLIED to production ${ID}`);
