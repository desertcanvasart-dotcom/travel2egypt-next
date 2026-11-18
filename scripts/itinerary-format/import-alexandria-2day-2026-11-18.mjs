/**
 * Alexandria in Two Days from Cairo — the owner's locked copy (EN/ES/JA, 18 Nov) on the page
 * /private-tour-2-day-trip-to-alexandria-from-cairo (wp-page-87976), which becomes a real 2-day
 * trip and moves from the day tours to the multi-day packages (owner: "Take it to the multi-day
 * packages"). The retire of this page was undone first (PR #293).
 *
 * Owner, 18 Nov: no dinner; the hotel is the Paradise Inn Le Metropole; the Sound and Light Show
 * at Qaitbey is included (English, with headphones for other languages); El Montaza entry
 * included; back in Cairo around 19:00–20:00. Price €325 (ES €336, JA €343).
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-alexandria-2day-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-alexandria-2day-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-alexandria-2day-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-87976';
// The owner's price for the 2-day trip, and the guide-language prices (same steps as before:
// +€11 Spanish, +€18 Japanese). Owner, 18 Nov: "325".
const PRICE = 325;
const GUIDE_PRICES = PRICE ? { es: PRICE + 11, ja: PRICE + 18 } : null;
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/2-day-alexandria-from-cairo';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
// JA site names contain 「・」, the row separator, so the JA lists are given (checked against the file).
const JA_SITES = {
  1: ['コム・エル・シュカーファのカタコンベ', 'ポンペイの柱', 'セラペウム', 'グレコ・ローマン博物館', 'カーイトベイの要塞の音と光のショー'],
  2: ['アレクサンドリア図書館', 'コム・エル・ディッカのローマ劇場', 'モンタザの庭園'],
};
const CFG = { locked: LOCKED, leadParas: true, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "2-day-alexandria-from-cairo" (EN/ES/JA), 18 Nov 2026, with the owner\'s 18 Nov answers.';

const G = {
  catacombs: 'guideArticle.alexandria.catacombs-of-kom-el-shoqafa',
  pillar: 'guideArticle.alexandria.pompeys-pillar',
  serapeum: 'guideArticle.alexandria.the-serapeum-temple',
  museum: 'guideArticle.alexandria.the-greco-roman-museum',
  qaitbey: 'guideArticle.alexandria.qaitbey-fort',
  bibliotheca: 'guideArticle.alexandria.bibliotheca-alexandrina',
  theatre: 'guideArticle.alexandria.roman-theatre',
};
// No guide page for El Montaza.
const GUIDES = { 1: [G.catacombs, G.pillar, G.serapeum, G.museum, G.qaitbey], 2: [G.bibliotheca, G.theatre, null] };
const ROUTE = {
  en: [['Cairo', 'Alexandria', null, 1], ['Alexandria', 'Cairo']],
  es: [['El Cairo', 'Alejandría', null, 1], ['Alejandría', 'El Cairo']],
  ja: [['カイロ', 'アレクサンドリア', null, 1], ['アレクサンドリア', 'カイロ']],
};
const SUMMARY = {
  en: 'A private two-day trip from Cairo to Alexandria: the catacombs, Pompey’s Pillar and the Greco-Roman Museum, the Sound and Light Show at Qaitbey, a night by the sea, then the Bibliotheca, the Roman theatre and El Montaza.',
  es: 'Un viaje privado de dos días desde El Cairo a Alejandría: las catacumbas, la Columna de Pompeyo y el Museo Grecorromano, el espectáculo de luz y sonido en Qaitbay, una noche junto al mar y, después, la Biblioteca, el teatro romano y El Montaza.',
  ja: 'カイロから行く、アレクサンドリアへのプライベートな2日間の旅。カタコンベ、ポンペイの柱、グレコ・ローマン博物館、カーイトベイの音と光のショー、海辺での1泊、そして図書館、ローマ劇場、モンタザへ。',
};
const CITIES = ['wp-page-83284' /* Cairo */, 'wp-page-58750' /* Alexandria */];

const panelText = (l, t) => (l === 'en' ? t.replace(/\s*\*\(ES:.*\)\*\s*$/, '') : t);
const paraText = (s) => (typeof s === 'string' ? s : `${s.lead} ${s.text}`);

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.map((s) => typeof s), d.segments?.length ?? 0, d.sites.length, d.meals.map((m) => m.meal), d.optional.length, !!d.overnight, !!d.pace]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
const ROUTE_LABEL = { en: 'Route', es: 'Ruta', ja: 'ルート' };
const WHERE = Object.fromEntries(LANGS.map((l) => [l, P[l].panel[ROUTE_LABEL[l]]]));
const flat = (p) => {
  const o = { opening: p.opening, why: p.whyRoute, closing: p.closingLine };
  for (const d of p.days) { o[`d${d.day}.t`] = d.title; (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = paraText(s))); o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace; }
  p.panelRows.forEach((r, i) => (o[`panel${i}`] = r.text)); p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Same meaning, checked by hand 18 Nov: ES in4 "Lunch on both days" = «los dos días» (the gate reads «dos» as 2).
const SAME_MEANING = { es: ['in4'], ja: [] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l]) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const tour = await client.getDocument(TOUR);
if (!tour) throw new Error(`${TOUR} not found`);
if (tour.hidden || tour.migration?.supersededBy) throw new Error(`${TOUR} is still retired: run the undo first (PR #293)`);

/* ---------- itinerary ---------- */
const para = (s, i) => (typeof s === 'string'
  ? { _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text: s, marks: [] }] }
  : { _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}a`, _type: 'span', text: s.lead, marks: ['strong'] }, { _key: `s${i}b`, _type: 'span', text: ` ${s.text}`, marks: [] }] });
const fact = (key, l, text) => ({ _key: key, _type: 'productFact', lang: l, text, source: SRC, needsReview: false });
const row = (key, r) => ({ _key: key, _type: 'labelledRow', label: r.label, text: r.text });
function build(l) {
  const p = P[l];
  for (const d of p.days) if (GUIDES[d.day].length !== d.sites.length) throw new Error(`${l} day ${d.day}: ${d.sites.length} sites, ${GUIDES[d.day].length} guide slots`);
  if (p.days.some((d) => d.optional.length)) throw new Error(`${l}: unexpected optional extras`);
  const days = p.days.map((d) => ({
    _key: `alx2-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    body: d.body.map(para),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
    optional: [],
    // The page's essay is the old one-day essay: no "More about this stop" until a 2-day essay is approved.
    narrativeRefs: [],
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
    included: p.included.map((t, i) => fact(`alx2-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`alx2-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`alx2-opt-${l}-${i}`, l, t)),
    legs: ROUTE[l].map(([from, to, via, nights], i) => ({ _key: `alx2-leg-${l}-${i}`, _type: 'routeLeg', lang: l, from, to, ...(via ? { via } : {}), mode: 'road', ...(nights ? { nights } : {}), source: SRC, needsReview: false })),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
const loc = (arr, l) => (arr ?? []).find((t) => t._key === l);
const set = {
  type: 'package',
  durationDays: 2,
  cities: CITIES.map((c, i) => ({ _key: `city-${i + 1}`, _type: 'reference', _ref: c })),
  title: LANGS.map((l) => ({ ...(loc(tour.title, l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(loc(tour.summary, l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: LANGS.flatMap((l) => B[l].legs),
  // The old one-day "shape" (character: "minimum age 18", tiers; duration: "Long single day",
  // which the package header would show instead of "2 days · 1 night") is replaced: route only.
  shapeOfDay: { where: LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: WHERE[l] })) },
  seo: { ...(tour.seo ?? { _type: 'seo' }), metaDescription: LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: SUMMARY[l] })) },
  ...(PRICE ? { priceFrom: PRICE, guideLanguagePrices: { _type: 'object', ...GUIDE_PRICES } } : {}),
};
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs']) set[f] = curlyRows(set[f], 'en');
const found = await client.fetch('*[_id in $ids]._id', { ids: [...CITIES, ...Object.values(G)] });
for (const id of [...CITIES, ...Object.values(G)]) if (!found.includes(id)) throw new Error(`reference target ${id} missing`);

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs'].flatMap((f) => set[f].filter((r) => r.lang === l)).map(({ mode, ...r }) => r);
  verbatimPreflight([...visibleStrings(rows, l).filter((x) => x !== 'strong'), P[l].title, WHERE[l]], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

console.log(`BEFORE: type ${tour.type}, ${tour.durationDays} days, €${tour.priceFrom} ${JSON.stringify(tour.guideLanguagePrices)}`);
console.log(`AFTER: type package, 2 days, ${PRICE ? `€${PRICE} ${JSON.stringify(GUIDE_PRICES)}` : 'PRICE NOT SET'}`);
for (const l of LANGS) console.log(`  ${l}: ${P[l].title}\n    where: ${WHERE[l]}\n    panel: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}\n    meals: ${JSON.stringify(B[l].days.map((d) => d.meals.map((m) => m.meal)))} overnight: ${JSON.stringify(B[l].days.map((d) => d.overnight ?? '—'))}`);
for (const [f, v] of Object.entries(set)) console.log(`${f}: ${Array.isArray(tour[f]) ? tour[f].length : JSON.stringify(tour[f] ?? null)?.slice(0, 50)} → ${Array.isArray(v) ? v.length : JSON.stringify(v).slice(0, 50)}`);

if (previewOut) {
  const refs = await client.fetch('*[_id in $ids]', { ids: [...Object.values(G), ...CITIES] });
  const dataset = [{ ...tour, ...set }, ...refs];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = tour.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'priceFrom', 'shapeOfDay', 'approvedInclusions', 'approvedExclusionRows', 'itineraryFormat', 'approvedOptions', 'approvedRoute'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!PRICE) throw new Error('the owner has not given the price yet: set PRICE');
  await writeRollback(client, [TOUR], 'before-alexandria-2day');
  await client.patch(TOUR).set(set).commit();
  console.log(`APPLIED to production ${TOUR}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
