/**
 * Owner, 23 Nov: "hotels and boats are just a sample of what we are using, as most of them range" — the family page named
 * "M/S Sara" and the "Pyramids Park Resort" as if they were the only ones. Now: "a five-star Nile cruise ship, such as the
 * M/S Sara" and "a Cairo hotel such as the Pyramids Park Resort" (the ship and hotel are chosen from the database at booking).
 * Text-only: wp-page-237732 (EN/ES/JA, drafts too). Rollback first.
 *
 *   node --env-file=<.env> scripts/day-tour-format/family-samples-2026-11-23.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/family-samples-2026-11-23.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });
const ID = 'wp-page-237732';
const FIX = [
  // stay and travel
  ['four nights on the M/S Sara, a five-star cruise ship from Luxor to Aswan, chosen for its family cabins, full board.', 'four nights on a five-star cruise ship from Luxor to Aswan, such as the M/S Sara, chosen for its family cabins, full board.'],
  ['three nights at the Pyramids Park Resort or a similar family-friendly Cairo hotel, bed and breakfast.', 'three nights at a family-friendly Cairo hotel such as the Pyramids Park Resort, bed and breakfast.'],
  ['cuatro noches en el M/S Sara, un crucero de cinco estrellas de Luxor a Asuán, elegido por sus camarotes familiares, en pensión completa.', 'cuatro noches en un crucero de cinco estrellas de Luxor a Asuán, como el M/S Sara, elegido por sus camarotes familiares, en pensión completa.'],
  ['tres noches en el Pyramids Park Resort u otro hotel familiar similar de El Cairo, con alojamiento y desayuno.', 'tres noches en un hotel familiar de El Cairo, como el Pyramids Park Resort, con alojamiento y desayuno.'],
  ['M/S サラ号で4泊。ルクソールからアスワンまでの5つ星クルーズ船で、ファミリーキャビンがあることから選びました。', 'ルクソールからアスワンまでの5つ星クルーズ船（M/S サラ号など）で4泊。ファミリーキャビンがあることから選びました。'],
  ['カイロで3泊。ピラミッズ・パーク・リゾート、または同等のご家族向けホテル（朝食付き）。', 'カイロで3泊。ピラミッズ・パーク・リゾートなど、ご家族向けのホテル（朝食付き）。'],
  // included
  ['four nights on the five-star M/S Sara, full board', 'four nights on a five-star Nile cruise ship, full board'],
  ['cuatro noches en el M/S Sara, de cinco estrellas, en pensión completa', 'cuatro noches en un crucero de cinco estrellas por el Nilo, en pensión completa'],
  ['5つ星のM/S サラ号4泊（全食事付き）', '5つ星のナイル川クルーズ船4泊（全食事付き）'],
  // summary
  ['four nights on the M/S Sara from Luxor to Aswan', 'four nights on a five-star Nile cruise from Luxor to Aswan'],
  ['cuatro noches en el M/S Sara de Luxor a Asuán', 'cuatro noches en un crucero por el Nilo de Luxor a Asuán'],
  ['M/S サラ号でルクソールからアスワンまで4泊', '5つ星のナイル川クルーズ船でルクソールからアスワンまで4泊'],
];
function runs(o, path = '', out = []) {
  if (Array.isArray(o)) o.forEach((x, i) => runs(x, `${path}${x && typeof x === 'object' && x._key ? `[_key=="${x._key}"]` : `[${i}]`}`, out));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
    if (['_type', '_id', '_rev', 'source', 'slug', 'migration'].includes(k)) continue;
    if (typeof v === 'string') { if (k !== '_key') out.push([path ? `${path}.${k}` : k, v]); } else runs(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}
const plan = [];
for (const id of [ID, `drafts.${ID}`]) {
  const doc = await client.getDocument(id);
  if (!doc) continue;
  for (const [path, text] of runs(doc)) {
    let after = text;
    const ov = path.match(/^itineraryDays\[_key=="dah-(en|es|ja)-\d+"\]\.overnight$/);
    if (ov && /^M\/S (Sara|サラ号)/.test(text)) {
      const base = { en: 'Nile cruise ship', es: 'crucero por el Nilo', ja: 'ナイル川クルーズ船' }[ov[1]];
      after = base + text.replace(/^M\/S (Sara|サラ号)/, '');
    } else for (const [f, t] of FIX) after = after.split(f).join(t);
    if (after !== text) plan.push({ id, path, before: text, after });
  }
}
for (const p of plan) console.log(`${p.id} ${p.path.slice(0, 70)}\n  − ${p.before.slice(0, 170)}\n  + ${p.after.slice(0, 170)}`);
const left = [];
for (const id of [ID]) { const doc = await client.getDocument(id); for (const [path, text] of runs(doc)) if (/M\/S|Pyramids Park|ピラミッズ/.test(plan.find((p) => p.id === id && p.path === path)?.after ?? text)) left.push(`${path}: ${(plan.find((p) => p.id === id && p.path === path)?.after ?? text).slice(0, 140)}`); }
console.log(`\n${plan.length} text runs changed; M/S Sara / Pyramids Park mentions still present (should be only "such as" phrases): ${left.length}`);
for (const l of left) console.log('  ', l);
if (!apply) { console.log('dry run'); process.exit(0); }
await writeRollback(client, [...new Set(plan.map((p) => p.id))], 'family-samples');
const tx = client.transaction();
for (const p of plan) tx.patch(p.id, (q) => q.set({ [p.path]: p.after }));
await tx.commit();
console.log(`APPLIED ${plan.length}`);
