/**
 * Mount Sinai and Saint Catherine from Cairo: 2 Days — publish the owner's locked
 * copy (EN/ES/JA, 17 Nov; reviewed 18 Nov; owner: "Yes, keep €325").
 *
 *   tour  wp-page-87832   /private-tour-2-days-1-night-trip-to-saint-catherine-from-cairo
 *
 * The page receives: the locked itinerary (days, intro with the panel and stay rows,
 * included / not included, the camel as Day 2's optional extra, route legs), the new
 * titles ×3, a new summary ×3, and the essay corrections (open items 4–5, canon Gate
 * A.3) in the passages the page shows under "More about this stop": no "restricted
 * through 2026" (the two access passages are removed from the essay), the climb starts
 * at 01:00, Daniela Village or similar, "the drive back", and the page's own names for
 * the places (ES tú). It keeps its slugs, hero, price (€325; ES €347, JA €361) and
 * relatedTours. The unpublished draft copy (drafts.tour.mount-sinai-pilgrimage-…) is
 * not touched. 18 Nov: "Worth knowing" gains the owner's Friday (later start) and Sunday/holiday (dates moved) line.
 *
 * Day 2 has 01:00 / 08:45 / breakfast parts, each with a bold lead, stored as
 * paragraphs (parser leadParas), as on Minya.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-sinai-2day-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-sinai-2day-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-sinai-2day-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-87832';
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/2-day-mount-sinai-and-saint-catherine-from-cairo';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
// JA site names contain 「・」, the row separator, so the JA lists are given (checked against the file).
const JA_SITES = {
  1: ['モーセの泉', 'ハンマーム・ファラウン', 'シナイの山々'],
  2: ['シナイ山', 'キャメル・パス', '悔い改めの階段', '聖カタリナ修道院'],
};
const CFG = { locked: LOCKED, leadParas: true, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "2-day-mount-sinai-and-saint-catherine-from-cairo" (EN/ES/JA), 17 Nov 2026, reviewed 18 Nov.';

// "More about this stop": Day 1 = the southern Sinai road (b3–b5); Day 2 = the mountain
// (b7–b9), the monastery (b11–b12) and the drive back (b14). Same keys in all languages.
const k = (l, ns) => ns.map((n) => `${l}b${n}`);
const MORE = Object.fromEntries(LANGS.map((l) => [l, { 1: k(l, [3, 4, 5]), 2: k(l, [7, 8, 9, 11, 12, 14]) }]));
// The two "access restricted through 2026" passages (open item 5).
const DROP = Object.fromEntries(LANGS.map((l) => [l, k(l, [1, 13])]));
// Guide links: Mount Sinai and the monastery. No guide pages for the Springs of Moses,
// Hammam Pharaon, the Camel Path or the Steps.
const G = { sinai: 'guideArticle.saint-catherine.mount-sinai-jebel-musa', mon: 'guideArticle.saint-catherine.saint-catherine-monastery' };
const GUIDES = { 1: [null, null, null], 2: [G.sinai, null, null, G.mon] };
const ROUTE = {
  en: [['Cairo', 'Saint Catherine', ['Springs of Moses', 'Hammam Pharaon'], 1], ['Saint Catherine', 'Cairo']],
  es: [['El Cairo', 'Santa Catalina', ['Fuentes de Moisés', 'Hammam Faraón'], 1], ['Santa Catalina', 'El Cairo']],
  ja: [['カイロ', 'セント・カトリーン', ['モーセの泉', 'ハンマーム・ファラウン'], 1], ['セント・カトリーン', 'カイロ']],
};
// Owner-approved 18 Nov ("Yes, keep €325", to the review that proposed it).
const SUMMARY = {
  en: 'A private two-day trip from Cairo into the Sinai: a night climb of Mount Sinai for sunrise, and Saint Catherine’s Monastery at its morning opening.',
  es: 'Un viaje privado de dos días desde El Cairo al Sinaí: la subida nocturna al monte Sinaí para ver el amanecer y el monasterio de Santa Catalina en su apertura de la mañana.',
  ja: 'カイロからシナイ半島へ向かうプライベートな2日間の旅。日の出を見るために夜のシナイ山に登り、朝に開く聖カタリナ修道院を訪ねます。',
};

/* Essay corrections (open items 4–5, 18 Nov; canon Gate A.3), in the passages the page
 * shows. The page's own place names (SPELL) replace the essay's older ones. */
const SPELL = {
  en: [],
  es: [['Los Manantiales de Moisés', 'Las Fuentes de Moisés'], ['Manantiales de Moisés', 'Fuentes de Moisés'], ['Hammam Pharaon', 'Hammam Faraón'], ['Camino del Camello', 'Camino de los Camellos'], ['Su guía beduino', 'Tu guía beduino']],
  ja: [['ハマーム・ファラオン', 'ハンマーム・ファラウン'], ['「ラクダの道」', '「キャメル・パス」'], ['ラクダの道', 'キャメル・パス'], ['「悔悛の階段」', '「悔い改めの階段」'], ['悔悛の階段', '悔い改めの階段']],
};
const FIX = {
  en: [
    ['enb5', 'Check-in at the local hotel — the Monastery Guesthouse, Daniela Village, Catherine Plaza, depending on season — and an early dinner. The next morning starts before midnight.', 'Check-in at Daniela Village or a similar hotel, and an early dinner. The climb starts at 01:00.'],
    ['enb12', 'What you visit, depending on the current access state in 2026, is some subset of the following: the Church', 'Inside the walls: the Church'],
    ['enb12', 'The library is rarely open to general visitors even at full access.', 'The library is rarely open to general visitors.'],
    ['enb14', 'The descent from Saint Catherine back to Cairo is the rest of the day', 'The drive back to Cairo is the rest of the day'],
  ],
  es: [
    ['esb5', 'El registro de entrada es en el hotel local —el Monastery Guesthouse, Daniela Village, Catherine Plaza, según temporada— y una cena temprana. La mañana siguiente arranca antes de medianoche.', 'Llegada a Daniela Village o a un hotel similar, y una cena temprana. La subida empieza a la 01:00.'],
    ['esb12', 'Lo que se visita, según el estado de acceso vigente en 2026, es algún subconjunto de lo siguiente: la Iglesia', 'Dentro de las murallas: la Iglesia'],
    ['esb12', 'La biblioteca rara vez está abierta al público general incluso en pleno acceso.', 'La biblioteca rara vez está abierta al público general.'],
    ['esb14', 'El descenso de Santa Catalina de vuelta a El Cairo ocupa', 'El viaje de vuelta a El Cairo ocupa'],
  ],
  ja: [
    ['jab5', '聖カタリナは標高約1,600メートル', 'セント・カトリーンは標高約1,600メートル'],
    ['jab5', '地元のホテル――修道院ゲストハウス、ダニエラ・ヴィレッジ、カトリーン・プラザ（季節により）――にチェックインし、早めの夕食。翌朝は深夜出発です。', 'ダニエラ・ヴィレッジまたは同等クラスのホテルにチェックインし、早めの夕食。登山は01:00に始まります。'],
    ['jab12', '2026年現在のアクセス状況によって、訪問する対象は次のうちの一部となります――', '城壁の中にあるのは――'],
    ['jab12', '図書館はアクセスが全面開放の状態でも、一般来訪者には稀にしか公開されません。', '図書館は、一般来訪者には稀にしか公開されません。'],
    ['jab14', '聖カタリナからカイロへの下りは', 'カイロへの帰り道は'],
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
  for (const d of p.days) { o[`d${d.day}.t`] = d.title; (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = paraText(s))); o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace; d.optional.forEach((x, i) => (o[`d${d.day}.o${i}`] = x)); }
  p.panelRows.forEach((r, i) => (o[`panel${i}`] = r.text)); p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Same meaning, checked by hand 18 Nov:
//   ES why: "sixteen centuries" = «dieciséis siglos» (the gate does not read «dieciséis»).
//   ES in5: EN "on both days" = «los dos días» (the gate reads «dos» as 2).
//   JA why: "sixteen centuries" = 1,600年 (16世紀 would read "the 16th century"; open items).
//   JA d2.b0: "the Ten Commandments" = 十戒 (a name, not a figure).
//   JA opening: says 「このプライベートツアー」 without "two-day"; the duration is in the panel
//   (as on Bahariya and Minya). Native-speaker review item.
const SAME_MEANING = { es: ['why', 'in5'], ja: ['why', 'd2.b0', 'opening'] };
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
    value: row.value.filter((b) => !DROP[l].includes(b._key)).map((b) => {
      const fixes = FIX[l].filter(([k]) => k === b._key);
      if (!fixes.length && !shown.has(b._key)) return b;
      let children = b.children.map((c) => ({ ...c }));
      for (const [, find, repl] of fixes) {
        const alts = [find, find.replace(/’/g, "'")];
        const i = children.findIndex((c) => alts.some((f) => c.text.includes(f)));
        // Re-runs (e.g. the hotel name, 17 Nov evening): a fix already applied is skipped.
        if (i < 0 && children.some((c) => c.text.includes(repl))) continue;
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i] = { ...children[i], text: children[i].text.replace(alts.find((f) => children[i].text.includes(f)), repl) };
      }
      if (shown.has(b._key)) children = children.map((c) => ({ ...c, text: SPELL[l].reduce((t, [a, z]) => t.replaceAll(a, z), c.text) }));
      return { ...b, children };
    }),
  };
});
// Nothing the page shows may keep a retired spelling or the corrected wording.
const RETIRED = { en: /2026|midnight|Catherine Plaza|descent from Saint/, es: /2026|medianoche|Catherine Plaza|El descenso de Santa|Pharaon|Manantiales|Camino del Camello|Su guía/, ja: /2026|深夜出発|カトリーン・プラザ|ハマーム|悔悛の階段|ラクダの道|聖カタリナは|聖カタリナから/ };
for (const row of body) for (const b of row.value) {
  if (Object.values(MORE[row._key]).flat().includes(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: still has ${textOf(b).match(RETIRED[row._key])[0]}`);
  if (/2026/.test(textOf(b))) throw new Error(`${row._key} ${b._key}: the essay still dates access to 2026`);
}
for (const row of body) if (row.value.some((b) => DROP[row._key].includes(b._key))) throw new Error(`${row._key}: access passage not removed`);

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
  if (p.days.map((d) => d.optional.length).join() !== '0,1') throw new Error(`${l}: expected one optional extra, on Day 2`);
  const days = p.days.map((d) => ({
    _key: prev.get(d.day)?._key ?? `sin-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    body: d.body.map(para),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
    // The camel: its "Not included" row says the same, so no link is needed.
    optional: d.optional.map((text, i) => ({ _key: `o${i}`, _type: 'dayOptional', text })),
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
    included: p.included.map((t, i) => fact(`sin-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`sin-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`sin-opt-${l}-${i}`, l, t)),
    legs: ROUTE[l].map(([from, to, via, nights], i) => ({ _key: `sin-leg-${l}-${i}`, _type: 'routeLeg', lang: l, from, to, ...(via ? { via } : {}), mode: 'road', ...(nights ? { nights } : {}), source: SRC, needsReview: false })),
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
// The meta description and the "shape of day" line still promised "2026 restricted access".
const CHARACTER = {
  en: 'Fully private · Bedouin mountain guide · night climb for sunrise · the monastery at its morning opening',
  es: 'Salida privada · guía beduino de montaña · subida nocturna para el amanecer · el monasterio en su apertura de la mañana',
  ja: '完全プライベート · ベドウィンの山岳ガイド · 日の出を目指す夜の登山 · 朝に開く修道院を見学',
};
set['seo.metaDescription'] = LANGS.map((l) => ({ ...(loc(tour.seo?.metaDescription, l) ?? { _key: l, _type: 'internationalizedArrayTextValue' }), value: SUMMARY[l] }));
set['shapeOfDay.character'] = LANGS.map((l) => ({ ...(loc(tour.shapeOfDay?.character, l) ?? { _key: l, _type: 'internationalizedArrayTextValue' }), value: CHARACTER[l] }));
{
  // What the page and search show after the write (sources carry the copy's date, so skip them).
  const after = { ...tour, ...set, body: null, migration: null, _createdAt: null, _updatedAt: null, _rev: null, seo: { ...tour.seo, metaDescription: set['seo.metaDescription'] }, shapeOfDay: { ...tour.shapeOfDay, character: set['shapeOfDay.character'] } };
  const j = JSON.stringify(after, (key, v) => (key === 'source' ? undefined : v));
  const hit = j.match(/.{0,100}(2026|restrict|restring|制限).{0,40}/);
  if (hit) throw new Error(`a field still mentions 2026 access: ${hit[0]}`);
}
if (tour.priceFrom !== 325) throw new Error(`price is ${tour.priceFrom}, expected the owner's €325`);
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
  await writeRollback(client, [TOUR], 'before-sinai-2day');
  await client.patch(TOUR).set(set).commit();
  console.log(`APPLIED to production ${TOUR}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
