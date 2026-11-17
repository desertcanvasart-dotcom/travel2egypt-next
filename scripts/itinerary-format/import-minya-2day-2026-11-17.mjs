/**
 * Middle Egypt from Cairo: 2 Days in Minya, Beni Hassan and Amarna — publish the
 * owner's locked copy (EN/ES/JA, 17 Nov; reviewed and corrected the same evening;
 * owner: "Yes, keep €399").
 *
 *   tour  wp-page-87830   /2-day-tour-to-al-minya-from-cairo
 *
 * One page, no duplicate (the Minya day tour and the 10-day tour are other
 * products). The page receives: the locked itinerary (days, intro with the
 * "Your guide speaks" panel row and the stay rows, included / not included,
 * route legs), the new titles ×3, a new summary ×3 (the old one used the
 * retired spellings), and the essay corrections (Gate A.3) in the passages the
 * page shows under "More about this stop". It keeps its slugs, hero, essay,
 * price (€399; ES €421, JA €435) and relatedTours. No concierge note.
 *
 * Day 1 opens with a plain paragraph and then has Morning / Afternoon / Late
 * afternoon parts; the page cannot show both on one day, so the day is stored as
 * paragraphs, each part with its bold lead word as written (parser leadParas).
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-minya-2day-2026-11-17.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-minya-2day-2026-11-17.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-minya-2day-2026-11-17.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-87830';
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/2-day-minya-and-amarna-from-cairo';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
// JA site names contain 「・」, the row separator, so the JA lists are given (checked against the file).
const JA_SITES = {
  1: ['ベニ・ハサン', 'ヘルモポリス（アシュムネイン）', 'トゥナ・エル・ゲベル', 'ペトシリスの墓', 'テル・エル・アマルナ'],
  2: ['トゥナ・エル・ゲベル', 'テル・エル・アマルナ'],
};
const CFG = { locked: LOCKED, leadParas: true, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "2-day-minya-and-amarna-from-cairo" (EN/ES/JA), 17 Nov 2026, reviewed and corrected 17 Nov evening.';

// "More about this stop": Day 1 = the essay's route passage (the drive, Beni Hassan,
// Hermopolis, Tuna el-Gebel, Amarna, the night in Minya); Day 2 = "Amarna and why it matters".
// The keys differ per language.
const MORE = {
  en: { 1: ['00000000000b', '00000000000f', '000000000013', '000000000017', '00000000001b', '00000000001d'], 2: ['000000000025', '000000000027'] },
  es: { 1: ['00000000000d', '000000000011', '000000000015', '000000000019', '00000000001d', '00000000001f'], 2: ['000000000027', '000000000029'] },
  ja: { 1: ['000000000011', '000000000013', '000000000015', '000000000017', '000000000019', '00000000001b'], 2: ['000000000023', '000000000025', '000000000027'] },
};
// Guide links (open items): Beni Hassan · Hermopolis · Tuna el-Gebel · Tell el-Amarna.
// No guide page for the Tomb of Petosiris (it is part of Tuna el-Gebel's).
const G = {
  bh: 'guideArticle.al-minya.beni-hasan', her: 'guideArticle.al-minya.el-ashmunein',
  tuna: 'guideArticle.al-minya.tuna-el-gebel', am: 'guideArticle.al-minya.tell-el-amarna',
};
const GUIDES = { 1: [G.bh, G.her, G.tuna, null, G.am], 2: [G.tuna, G.am] };
const ROUTE = {
  en: [['Cairo', 'Minya', ['Beni Hassan', 'Hermopolis', 'Tuna el-Gebel', 'Tell el-Amarna'], 1], ['Minya', 'Cairo']],
  es: [['El Cairo', 'Minia', ['Beni Hasan', 'Hermópolis', 'Tuna el-Gebel', 'Tell el-Amarna'], 1], ['Minia', 'El Cairo']],
  ja: [['カイロ', 'ミニヤ', ['ベニ・ハサン', 'ヘルモポリス', 'トゥナ・エル・ゲベル', 'テル・エル・アマルナ'], 1], ['ミニヤ', 'カイロ']],
};
// Owner-approved 17 Nov ("Yes, keep €399", to the review that proposed it).
const SUMMARY = {
  en: 'A private two-day trip from Cairo into Middle Egypt: Beni Hassan, Hermopolis, Tuna el-Gebel and Tell el-Amarna, with a night in Minya.',
  es: 'Un viaje privado de dos días desde El Cairo al Egipto Medio: Beni Hasan, Hermópolis, Tuna el-Gebel y Tell el-Amarna, con una noche en Minia.',
  ja: 'カイロから中部エジプトへ向かうプライベートな2日間の旅。ベニ・ハサン、ヘルモポリス、トゥナ・エル・ゲベル、テル・エル・アマルナをめぐり、ミニヤで1泊します。',
};

/* Essay corrections (open items, 17 Nov; canon Gate A.3), in the passages the page shows:
 * one spelling site-wide; "Horizon of the Aten" (what Akhetaten means; ES/JA already say so); the Amarna superlative in Tier 2; "abandoned after his death";
 * "Within a few years, Tutankhamun"; the Nile is to the EAST driving south; one drive time
 * (three to four hours); dinner is now included (half board), so not "on your own account". */
const SPELL = {
  en: [['Tal El Amarna', 'Tell el-Amarna'], ['Tuna El Gabal', 'Tuna el-Gebel']],
  es: [['Tel el-Amarna', 'Tell el-Amarna'], ['Beni Hassan', 'Beni Hasan'], ['Ajenatón', 'Akenatón'], ['Ajetatón', 'Aketatón']],
  ja: [],
};
const FIX = {
  en: [
    ['00000000000b', 'approximately three hours depending on traffic — plan for the full stretch rather than a best-case scenario.', 'three to four hours depending on traffic.'],
    ['00000000000b', 'the Nile a persistent presence to the west.', 'the Nile a persistent presence to the east.'],
    ['00000000001b', "Akhenaten's Horizon of the Sun", "Akhenaten's Horizon of the Aten"],
    ['00000000001b', 'abandoned shortly after his death circa 1336 BC', 'abandoned after his death circa 1336 BC'],
    ['00000000001b', 'They are among the most visually distinctive examples of Amarna art in existence.', 'To our eye, they are among the most distinctive examples of Amarna art you can see.'],
    ['00000000001d', 'Dinner is on your own account; your guide can advise on local options.', 'Dinner is at your hotel.'],
    ['000000000025', 'His successor Tutankhamun restored', 'Within a few years, Tutankhamun restored'],
  ],
  es: [
    ['00000000000d', 'toma aproximadamente tres horas dependiendo del tráfico —conviene contar con el plazo completo, no con el mejor escenario—.', 'toma de tres a cuatro horas dependiendo del tráfico.'],
    ['00000000000d', 'con el Nilo siempre presente al oeste.', 'con el Nilo siempre presente al este.'],
    ['00000000001d', 'abandonado poco después de su muerte hacia el 1336 a. C.', 'abandonado tras su muerte, hacia el 1336 a. C.'],
    ['00000000001d', 'Figuran entre los ejemplos visualmente más distintivos del arte amarniano que se conservan.', 'A nuestro juicio, figuran entre los ejemplos más distintivos del arte amarniano que pueden verse.'],
    ['00000000001f', 'La cena corre por cuenta del viajero; el guía puede recomendar opciones locales.', 'La cena es en el hotel.'],
    ['000000000027', 'Su sucesor Tutankamón restauró', 'En pocos años, Tutankamón restauró'],
  ],
  ja: [
    ['000000000011', '交通状況によりおよそ3時間です——最良の場合ではなく、丸ごとの行程を見込んでください。', '交通状況により3〜4時間です。'],
    ['000000000011', 'ナイルが西にずっと寄り添います', 'ナイルが東にずっと寄り添います'],
    ['000000000019', '紀元前1346年ごろに築かれ、その死の少しのち、紀元前1336年ごろに棄てられました。', '紀元前1346年ごろに築かれ、紀元前1336年ごろの王の死ののちに放棄されました。'],
    ['000000000019', '現存するアマルナ美術のなかでも、最も視覚的に際立つ例のひとつです。', '私たちの見るところ、アマルナ美術のなかでも特に際立つ例のひとつです。'],
    ['000000000025', '後継者ツタンカーメンは伝統的な諸信仰を復し', '数年のうちに、ツタンカーメンが伝統的な諸信仰を復し'],
  ],
};

// The EN panel's guide row carries an authoring note for the other languages.
const panelText = (l, t) => (l === 'en' ? t.replace(/\s*\*\(ES:.*\)\*\s*$/, '') : t);
const paraText = (s) => (typeof s === 'string' ? s : `${s.lead} ${s.text}`);

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.map((s) => typeof s), d.segments?.length ?? 0, d.sites.length, d.meals.map((m) => m.meal), d.optional.length, !!d.overnight, !!d.pace]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
const flat = (p) => {
  const o = { opening: p.opening, why: p.whyRoute, closing: p.closingLine };
  for (const d of p.days) { o[`d${d.day}.t`] = d.title; (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = paraText(s))); o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace; }
  p.panelRows.forEach((r, i) => (o[`panel${i}`] = r.text)); p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Same meaning, checked by hand 17 Nov:
//   ES in4: EN "on both days" = «los dos días» (the gate reads «dos» as 2).
//   JA d1.b1: "thirty-nine … twelve" = 39基 … 12基 (the gate reads "thirty-nine" as 30 + 9).
//   JA d2.t / d2.b0: "a second look / pass" = 「もう一度」 (an ordinal, not a figure).
//   JA opening: says 「このプライベートツアー」 without "two-day"; the duration is in the panel
//   (as on Bahariya). Native-speaker review item.
const SAME_MEANING = { es: ['in4'], ja: ['opening', 'd1.b1', 'd2.t', 'd2.b0'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const tour = await client.getDocument(TOUR);
if (!tour) throw new Error(`${TOUR} not found`);
if (tour.durationDays !== 2) throw new Error('not a 2-day document');

/* ---------- essay corrections ---------- */
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const body = tour.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  const shown = new Set(Object.values(MORE[l]).flat());
  for (const ref of shown) if (!keys.has(ref)) throw new Error(`${l}: essay block ${ref} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
      const fixes = FIX[l].filter(([k]) => k === b._key);
      if (!fixes.length && !shown.has(b._key)) return b;
      let children = b.children.map((c) => ({ ...c }));
      for (const [, find, repl] of fixes) {
        const alts = [find, find.replace(/’/g, "'")];
        const i = children.findIndex((c) => alts.some((f) => c.text.includes(f)));
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i] = { ...children[i], text: children[i].text.replace(alts.find((f) => children[i].text.includes(f)), repl) };
      }
      if (shown.has(b._key)) children = children.map((c) => ({ ...c, text: SPELL[l].reduce((t, [a, z]) => t.replaceAll(a, z), c.text) }));
      return { ...b, children };
    }),
  };
});
// Nothing the page shows may keep a retired spelling or the corrected wording.
const RETIRED = { en: /Tal El|El Gabal|own account|to the west|His successor/, es: /Tel el-|Beni Hassan|Ajenat|Ajetat|por cuenta del viajero|al oeste|Su sucesor/, ja: /西にずっと|後継者ツタンカーメン|およそ3時間/ };
for (const row of body) for (const b of row.value) {
  if (Object.values(MORE[row._key]).flat().includes(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: still has ${textOf(b).match(RETIRED[row._key])[0]}`);
}

/* ---------- itinerary ---------- */
const para = (s, i) => (typeof s === 'string'
  ? { _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text: s, marks: [] }] }
  : { _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}a`, _type: 'span', text: s.lead, marks: ['strong'] }, { _key: `s${i}b`, _type: 'span', text: ` ${s.text}`, marks: [] }] });
const fact = (key, l, text) => ({ _key: key, _type: 'productFact', lang: l, text, source: SRC, needsReview: false });
const row = (key, r) => ({ _key: key, _type: 'labelledRow', label: r.label, text: r.text });
function build(l) {
  const p = P[l];
  const prev = new Map((tour.itineraryDays ?? []).filter((r) => r.lang === l).map((r) => [r.day, r]));
  for (const d of p.days) if (GUIDES[d.day].length !== d.sites.length) throw new Error(`${l} day ${d.day}: ${d.sites.length} sites, ${GUIDES[d.day].length} guide slots`);
  if (p.days.some((d) => d.optional.length)) throw new Error(`${l}: unexpected optional extras`);
  const days = p.days.map((d) => ({
    _key: prev.get(d.day)?._key ?? `min-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    body: d.body.map(para),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
    optional: [],
    narrativeRefs: MORE[l][d.day],
    source: SRC, needsReview: false, overnightNeedsReview: false,
  }));
  const intro = {
    _key: `intro-${l}`, _type: 'itineraryIntro', lang: l,
    opening: p.opening, whyRoute: p.whyRoute, whyRouteRefs: [],
    closingLine: p.closingLine,
    panelRows: p.panelRows.map((r, i) => row(`pr${i}`, { ...r, text: panelText(l, r.text) })),
    stayRows: p.stayRows.map((r, i) => row(`sr${i}`, r)),
    fitFor: p.fitFor, worthKnowing: p.worthKnowing, makeItYoursIntro: p.makeItYoursIntro,
    source: SRC, needsReview: false,
  };
  return {
    days, intro,
    included: p.included.map((t, i) => fact(`min-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`min-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`min-opt-${l}-${i}`, l, t)),
    legs: ROUTE[l].map(([from, to, via, nights], i) => ({ _key: `min-leg-${l}-${i}`, _type: 'routeLeg', lang: l, from, to, ...(via ? { via } : {}), mode: 'road', ...(nights ? { nights } : {}), source: SRC, needsReview: false })),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
const loc = (arr, l) => (arr ?? []).find((t) => t._key === l);
const set = {
  title: LANGS.map((l) => ({ ...(loc(tour.title, l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(loc(tour.summary, l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  body,
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: LANGS.flatMap((l) => B[l].legs),
};
if (tour.priceFrom !== 399) throw new Error(`price is ${tour.priceFrom}, expected the owner's €399`);
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs']) set[f] = curlyRows(set[f], 'en');

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs'].flatMap((f) => set[f].filter((r) => r.lang === l)).map(({ mode, ...r }) => r);
  // 'strong' is the bold mark on Day 1's lead words, not copy.
  verbatimPreflight([...visibleStrings(rows, l).filter((x) => x !== 'strong'), P[l].title], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

console.log('BEFORE:');
for (const l of LANGS) {
  console.log(`  title ${l}: ${loc(tour.title, l)?.value}`);
  console.log(`  summary ${l}: ${String(loc(tour.summary, l)?.value).slice(0, 110)}`);
}
console.log(`  price €${tour.priceFrom} ${JSON.stringify(tour.guideLanguagePrices)} (kept)`);
console.log('AFTER:');
for (const l of LANGS) console.log(`  title ${l}: ${P[l].title}\n  summary ${l}: ${SUMMARY[l]}\n  panel ${l}: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}\n  day1 ${l}: ${JSON.stringify(B[l].days[0].body.map((b) => b.children.map((c) => (c.marks.length ? `**${c.text}**` : c.text)).join('')).map((s) => s.slice(0, 40)))}`);
for (const [f, v] of Object.entries(set)) console.log(`${f}: ${Array.isArray(tour[f]) ? tour[f].length : JSON.stringify(tour[f] ?? null)} → ${Array.isArray(v) ? v.length : JSON.stringify(v)}`);
for (const l of LANGS) for (const b of body.find((x) => x._key === l).value) {
  const before = tour.body.find((x) => x._key === l).value.find((x) => x._key === b._key);
  if (textOf(before) !== textOf(b)) console.log(`essay ${l} ${b._key}: ${textOf(b)}`);
}

if (previewOut) {
  const ids = Object.values(G);
  const refs = await client.fetch(`*[_id in $ids]`, { ids });
  const cities = await client.fetch(`*[_id in $ids]`, { ids: [...(tour.cities ?? []).map((c) => c._ref), ...refs.map((r) => r.parentCity?._ref).filter(Boolean)] });
  const dataset = [{ ...tour, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = tour.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'approvedInclusions', 'approvedExclusionRows', 'itineraryFormat', 'approvedOptions', 'approvedRoute'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [TOUR], 'before-minya-2day');
  await client.patch(TOUR).set(set).commit();
  console.log(`APPLIED to production ${TOUR}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
