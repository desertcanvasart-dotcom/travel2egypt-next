/**
 * Nubian Temples from Aswan (tour.nubian-temples-day-tour-from-aswan): a FULL day, about 7–8 hours (owner, 28 Nov 2026:
 * "because of the distance between each place, it is a full day and it would take almost 7 to 8 hours").
 * Changes only what said "half day" / 5–6 hours / "Philae the same afternoon", in EN/ES/JA. Rollback written first.
 *   node --env-file=<.env> scripts/day-tour-format/nubian-temples-full-day-2026-11-28.mjs            # dry run
 *   node --env-file=<.env> scripts/day-tour-format/nubian-temples-full-day-2026-11-28.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const ID = 'tour.nubian-temples-day-tour-from-aswan';
const apply = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const d = await c.getDocument(ID);
if (await c.getDocument(`drafts.${ID}`)) throw new Error('draft exists');

const LABEL = { en: 'Full day · ~7–8 hrs', es: 'Día completo · ~7–8 h', ja: '終日・約7〜8時間' };
const CARD = { en: 'Full day, ≈7–8 hours', es: 'Día completo, ≈7–8 horas', ja: '終日（ドアtoドアでおよそ7〜8時間／船は片道およそ15分）' };
// [locale, block key, old text, new text] — exact sentence swaps in the essay.
const BODY = [
  ['en', '000000000019', 'Half a day on the new island is enough to give them their own chapter.', 'A full day out to the new island gives them their own chapter.'],
  ['en', '000000000028', 'A natural half-day complement to Philae or Abu Simbel — we can arrange the boat timings around an Aswan hotel base or a Nile cruise berth.', 'A full day of its own, to pair with Philae or Abu Simbel on another day — we can arrange the boat timings around an Aswan hotel base or a Nile cruise berth.'],
  ['ja', '000000000003', '半日のうちに歩く。', '一日をかけて歩く。'],
];
const SWAP = {
  summary: { ja: ['半日のうちに歩く。', '一日をかけて歩く。'] },
  conciergeNote: {
    en: ['Pair it with Philae the same afternoon, or ask', 'Pair it with Philae on another day, or ask'],
    es: ['Únelo con Filae esa misma tarde, o pregunta', 'Únelo con Filae otro día, o pregunta'],
    ja: ['同じ午後にフィラエ神殿を続けるのも、', '別の日にフィラエ神殿を組み合わせるのも、'],
  },
};
// "Make it your own" options that offered Philae "the same afternoon" (the source notes are provenance, left as is).
const OPTS = {
  px06jdie7y: ['Pair the tour with Philae the same afternoon', 'Pair the tour with Philae on another day'],
  '4hj63h9zac': ['Combinar la visita con Filae esa misma tarde', 'Combinar la visita con Filae otro día'],
  kf4tr86spd: ['同じ午後にフィラエ神殿の見学を組み合わせる', '別の日にフィラエ神殿の見学を組み合わせる'],
};
const optsOnly = process.argv.includes('--options-only');
const swapArr = (arr, map) => arr.map((x) => {
  const s = map[x._key]; if (!s) return x;
  if (!x.value.includes(s[0])) { if (x.value.includes(s[1])) return x; throw new Error(`text not found (${x._key}): ${s[0]}`); }
  return { ...x, value: x.value.replace(s[0], s[1]) };
});
const setLabel = (arr, m) => arr.map((x) => ({ ...x, value: m[x._key] ?? x.value }));
const body = d.body.map((row) => ({ ...row, value: row.value.map((b) => {
  const hit = BODY.find(([l, k]) => l === row._key && k === b._key); if (!hit) return b;
  const span = b.children.find((ch) => ch.text.includes(hit[2]));
  if (!span) { if (b.children.some((ch) => ch.text.includes(hit[3]))) return b; throw new Error(`body ${hit[0]} ${hit[1]}: text not found`); }
  return { ...b, children: b.children.map((ch) => (ch === span ? { ...ch, text: ch.text.replace(hit[2], hit[3]) } : ch)) };
}) }));
const options = d.customisationOptions.map((o) => (OPTS[o._key] ? (o.text === OPTS[o._key][0] || o.text === OPTS[o._key][1] ? { ...o, text: OPTS[o._key][1] } : (() => { throw new Error(`option ${o._key}: unexpected text`); })()) : o));
const set = optsOnly ? { customisationOptions: options } : {
  customisationOptions: options,
  durationHours: 8,
  durationLabel: setLabel(d.durationLabel, LABEL),
  'shapeOfDay.duration': setLabel(d.shapeOfDay.duration, CARD),
  summary: swapArr(d.summary, SWAP.summary),
  conciergeNote: swapArr(d.conciergeNote, SWAP.conciergeNote),
  body,
};
console.log('durationHours', d.durationHours, '→ 8');
for (const l of ['en', 'es', 'ja']) console.log(l, '|', set.durationLabel.find((x) => x._key === l).value, '|', set['shapeOfDay.duration'].find((x) => x._key === l).value);
for (const [l, k, a, b] of BODY) console.log(`body ${l} ${k}: "${a}" → "${b}"`);
console.log('summary ja + conciergeNote en/es/ja swapped');
if (apply) { await writeRollback(c, [ID], 'before-nubian-full-day'); await c.patch(ID).set(set).commit(); console.log('APPLIED', ID); } else console.log('dry run (--apply to write)');
