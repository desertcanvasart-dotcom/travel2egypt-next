/**
 * Fix round 2, Task A — content side (2026-11-08). Run AFTER the round-2
 * code is live (it renders the {licenceFull}/{ministryLicenceNumber}/
 * {licenceVerifyUrl} tokens). Dry run by default; --write to apply.
 *
 *  - siteSettings: etaaMember = true; etaaNumber removed (one licence,
 *    automatic ETAA membership — never a second number).
 *  - Contact, About (EN/ES/JA), Responsible Travel, Terms (EN/ES/JA):
 *    licence/ETAA wording → the approved Full string via tokens; the Terms
 *    legal-entity paragraph names Capital Travel Service as specified.
 * Backups of every touched document → backups/round2-licence-<id>.json
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const write = process.argv.includes('--write');

// [docId, locale|null (section-free bodies use locale), blockKey, sectionKey|null, from, to]
const EDITS = [
  // Contact — "Where we're based"
  ['editorial-page-contact', 'en', 'c1a3', 'bf7aca1f37f6', 'Licensed travel agency, ETAA licence no. ', ''],
  ['editorial-page-contact', 'en', 'c1a3', 'bf7aca1f37f6', '{etaaNumber}', '{licenceFull}'],
  // Contact — "Accreditations"
  ['editorial-page-contact', 'en', 'e3ae29717463', 'b977c08f393c', 'ETAA — Egyptian Travel Agents Association, ', ''],
  ['editorial-page-contact', 'en', 'e3ae29717463', 'b977c08f393c', 'licence no. {etaaNumber}', '{licenceFull}'],
  // About
  ['editorial-page-about', 'en', 'b36e6070309a', '001a89657b82',
    'We are licensed by the Egyptian Travel Agents Association, which most travelers will not care about, but which matters when something goes wrong on the ground.',
    'Our licence: {licenceFull}. Most travelers will not care about that, but it matters when something goes wrong on the ground.'],
  ['editorial-page-about', 'es', 'es-s4p1', '001a89657b82',
    'Estamos acreditados por la Asociación Egipcia de Agentes de Viajes (ETAA), algo que a la mayoría de los viajeros no les importará, pero que sí importa cuando algo sale mal sobre el terreno.',
    'Nuestra licencia: {licenceFull}. A la mayoría de los viajeros no les importará, pero sí importa cuando algo sale mal sobre el terreno.'],
  ['editorial-page-about', 'ja', 'ja-s4p1', '001a89657b82',
    '私たちはエジプト旅行代理店協会（ETAA）の免許を受けています。',
    '当社の認可：{licenceFull}。'],
  // Responsible Travel (EN only has this sentence)
  ['editorial-page-responsible-travel', 'en', 'af86a89b6855', '82cafb041977',
    "We're members of established industry associations (JATA, IATA, ASTA, ETAA).",
    'Our licence and memberships: {licenceFull}; we are also IATA members.'],
  // Terms — legal-entity paragraph
  ['legal-terms', 'en', '83c5f30ff64d', null,
    'International San Tours ("Travel2Egypt," "we," "us") owns and operates',
    'Capital Travel Service, licensed by the Egyptian Ministry of Tourism (licence no. {ministryLicenceNumber}) and a member of the ETAA ("Travel2Egypt," "we," "us"), owns and operates'],
  ['legal-terms', 'es', '83c5f30ff64d', null,
    'International San Tours («Travel2Egypt», «nosotros») es propietaria',
    'Capital Travel Service, con licencia del Ministerio de Turismo de Egipto (licencia n.º {ministryLicenceNumber}) y miembro de la ETAA («Travel2Egypt», «nosotros»), es propietaria'],
  ['legal-terms', 'ja', '83c5f30ff64d', null,
    'International San Tours（以下「Travel2Egypt」「当社」といいます）は、',
    'Capital Travel Service（エジプト観光省認可、ライセンス番号 {ministryLicenceNumber}、ETAA 会員。以下「Travel2Egypt」「当社」といいます）は、'],
];
// Link targets on the Contact page.
const HREFS = [
  ['editorial-page-contact', 'en', 'c1a3', 'bf7aca1f37f6', 'c1a4'],
  ['editorial-page-contact', 'en', 'e3ae29717463', 'b977c08f393c', 'c1b0'],
];

const ids = [...new Set(EDITS.map((e) => e[0]))];
const docs = Object.fromEntries((await c.fetch(`*[_id in $ids]`, { ids })).map((d) => [d._id, d]));
const patches = {};
const pending = {};
const blockOf = (doc, loc, blockKey, sectionKey) => {
  const body = sectionKey ? doc.sections.find((s) => s._key === sectionKey).body : doc.body;
  return body.find((l) => l._key === loc).value.find((b) => b._key === blockKey);
};
const base = (loc, blockKey, sectionKey) =>
  `${sectionKey ? `sections[_key=="${sectionKey}"].` : ''}body[_key=="${loc}"].value[_key=="${blockKey}"]`;

for (const [id, loc, bk, sk, from, to] of EDITS) {
  const b = blockOf(docs[id], loc, bk, sk);
  const spans = b.children.filter((s) => (pending[`${id}|${base(loc, bk, sk)}|${s._key}`] ?? s.text).includes(from));
  if (spans.length !== 1) throw new Error(`${id} ${loc}/${bk}: ${spans.length} spans contain "${from.slice(0, 50)}"`);
  const k = `${id}|${base(loc, bk, sk)}|${spans[0]._key}`;
  const next = (pending[k] ?? spans[0].text).replace(from, to);
  pending[k] = next;
  (patches[id] ??= {})[`${base(loc, bk, sk)}.children[_key=="${spans[0]._key}"].text`] = next;
  console.log(`${id} ${loc}/${bk}\n  - ${from}\n  + ${to || '(removed)'}`);
}
for (const [id, loc, bk, sk, mk] of HREFS) {
  (patches[id] ??= {})[`${base(loc, bk, sk)}.markDefs[_key=="${mk}"].href`] = '{licenceVerifyUrl}';
  console.log(`${id} ${loc}/${bk} link → {licenceVerifyUrl}`);
}
console.log('siteSettings → etaaMember: true, unset etaaNumber');

if (write) {
  fs.mkdirSync('backups', { recursive: true });
  for (const [id, set] of Object.entries(patches)) {
    fs.writeFileSync(`backups/round2-licence-${id}.json`, JSON.stringify(docs[id], null, 2));
    await c.patch(id).set(set).commit();
    console.log('patched', id);
  }
  const ss = await c.fetch(`*[_id=="siteSettings"][0]`);
  fs.writeFileSync('backups/round2-licence-siteSettings.json', JSON.stringify(ss, null, 2));
  await c.patch('siteSettings').set({ etaaMember: true }).unset(['etaaNumber']).commit();
  console.log('patched siteSettings');
} else console.log('dry run — pass --write');
