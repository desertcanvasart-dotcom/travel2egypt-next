/**
 * Black and White Desert: 2-Day Private Tour from Cairo (wp-page-87834,
 * /private-tour-2-day-trip-to-bahariya-oasis; slugs unchanged) in the
 * multi-day format, EN/ES/JA, from the owner's locked files (17 Nov,
 * "ready for upload"; publish now).
 *
 * Writes: title ×3, summary ×3 (= the locked Opening, so the header carries
 * it and the body starts at "Why this route works"; the old summary named the
 * Golden Mummies and the Temple of Alexander, which this trip no longer
 * visits), itinerary days (timed stops), intro (panel and stay rows with the
 * locked labels), included / not included, options, route legs, and the
 * essay correction (Gate A.3). Hero, price, slugs unchanged.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-bahariya-2day-2026-11-17.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-bahariya-2day-2026-11-17.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-bahariya-2day-2026-11-17.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const ID = 'wp-page-87834';
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/2-day-bahariya-oasis-black-and-white-desert';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
const CFG = {
  locked: LOCKED,
  dayTitles: false,
  jaSites: { 1: ['アル・マルスース山（黒砂漠）', 'ベドウィンの村と硫黄泉の井戸', 'クリスタル・マウンテン', 'アガバット', '白砂漠国立公園'] },
};
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "2-day-bahariya-oasis-black-and-white-desert" (EN/ES/JA), 17 Nov 2026, sent ready for upload.';

// "More about this day" (Day 1): the essay passages that still describe this trip
// (opening, the drive, the 4×4 desert leg). The rest describes the old itinerary
// (oasis lodge, Golden Mummies, the tombs, the Temple of Alexander, a late-evening
// return) and is left out, per the owner's open items (Gate A.3).
const MORE = { 1: ['b0', 'b3', 'b8'], 2: [] };
const GUIDES = {
  1: [null, null, 'guideArticle.bahariya-oasis.crystal-mountain', 'guideArticle.farafra-oasis.crystal-mountain-and-aqabat', 'guideArticle.farafra-oasis.white-desert-national-park'],
  2: [null],
};
const ROUTE = {
  en: [['Cairo', 'Bahariya'], ['Bahariya', 'White Desert', ['Black Desert', 'Crystal Mountain', 'Agabat'], 1], ['White Desert', 'Cairo']],
  es: [['El Cairo', 'Bahariya'], ['Bahariya', 'Desierto Blanco', ['Desierto Negro', 'Montaña de Cristal', 'Agabat'], 1], ['Desierto Blanco', 'El Cairo']],
  ja: [['カイロ', 'バハレイヤ'], ['バハレイヤ', '白砂漠', ['黒砂漠', 'クリスタル・マウンテン', 'アガバット'], 1], ['白砂漠', 'カイロ']],
};
// The 4×4 passage's last sentence says the two-day trip doesn't sleep in the White Desert; it now camps at El Haiz.
const FIX = {
  en: [['b8', ' The two-day version of the trip does not overnight in the White Desert — that is the three-day route — but a long late-afternoon traverse of the park is the second day’s substance, and the photography in low sun is the part travellers remember.', '']],
  es: [['b8', ' La versión de dos días no pernocta en el Desierto Blanco —ése es el itinerario de tres días—, pero un recorrido largo a la luz baja por el parque es la sustancia del segundo día, y la fotografía en luz oblicua es la parte que los viajeros recuerdan.', '']],
  ja: [['b8', '二日間版では白砂漠での宿泊はしません――それは三日間ルートです。けれども午後遅くから夕暮れにかけての長い横断こそが二日目の本体で、低い光のもとでの撮影は旅人の記憶に最も残る部分です。', '']],
};

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.segments?.map((s) => !!s.text), d.sites.length, d.meals.map((m) => m.meal), d.optional.length, !!d.overnight]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
const flat = (p) => {
  const o = { opening: p.opening, why: p.whyRoute, closing: p.closingLine };
  for (const d of p.days) { (d.segments ?? []).forEach((s, i) => { o[`d${d.day}.h${i}`] = s.heading; if (s.text) o[`d${d.day}.s${i}`] = s.text; }); o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace; }
  p.panelRows.forEach((r, i) => (o[`panel${i}`] = r.text)); p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Reviewed 17 Nov: the JA opening says 「このプライベートツアー」 without "two-day"; the duration is in the panel. Native-speaker review item.
const SAME_MEANING = { ja: ['opening'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), loc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete loc[key]; console.log(`numeric gate (${l}): ${key} checked by hand`); }
  numericGate(en, loc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(ID);
if (!doc || doc.durationDays !== 2) throw new Error(`${ID} missing or not 2 days`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const ref of Object.values(MORE).flat().map((k) => `${l}${k}`)) if (!keys.has(ref)) throw new Error(`${l}: essay block ${ref} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
      const fixes = FIX[l].filter(([k]) => `${l}${k}` === b._key);
      if (!fixes.length) return b;
      let children = b.children.map((c) => ({ ...c }));
      for (const [, find, repl] of fixes) {
        const alts = [find, find.replace(/’/g, "'")];
        const i = children.findIndex((c) => alts.some((f) => c.text.includes(f)));
        if (i < 0) throw new Error(`${l} ${b._key}: text not found in one run`);
        children[i] = { ...children[i], text: children[i].text.replace(alts.find((f) => children[i].text.includes(f)), repl) };
      }
      return { ...b, children };
    }),
  };
});

const fact = (key, l, text) => ({ _key: key, _type: 'productFact', lang: l, text, source: SRC, needsReview: false });
const row = (key, r) => ({ _key: key, _type: 'labelledRow', label: r.label, text: r.text });
function build(l) {
  const p = P[l];
  const prev = new Map((doc.itineraryDays ?? []).filter((r) => r.lang === l).map((r) => [r.day, r]));
  const days = p.days.map((d) => ({
    _key: prev.get(d.day)?._key ?? `bah-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place,
    segments: d.segments.map((s, i) => ({ _key: `g${i}`, _type: 'daySegment', heading: s.heading, text: s.text ?? '' })),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, pace: d.pace,
    optional: [],
    narrativeRefs: MORE[d.day].map((k) => `${l}${k}`),
    source: SRC, needsReview: false, overnightNeedsReview: false,
  }));
  const intro = {
    _key: `intro-${l}`, _type: 'itineraryIntro', lang: l,
    // The Opening is the page summary (header); see the file note.
    whyRoute: p.whyRoute, whyRouteRefs: [],
    closingLine: p.closingLine,
    panelRows: p.panelRows.map((r, i) => row(`pr${i}`, r)),
    stayRows: p.stayRows.map((r, i) => row(`sr${i}`, r)),
    fitFor: p.fitFor, worthKnowing: p.worthKnowing, makeItYoursIntro: p.makeItYoursIntro,
    source: SRC, needsReview: false,
  };
  return {
    days, intro,
    included: p.included.map((t, i) => fact(`bah-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`bah-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`bah-opt-${l}-${i}`, l, t)),
    legs: ROUTE[l].map(([from, to, via, nights], i) => ({ _key: `bah-leg-${l}-${i}`, _type: 'routeLeg', lang: l, from, to, ...(via ? { via } : {}), mode: 'road', ...(nights ? { nights } : {}), source: SRC, needsReview: false })),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(doc.summary.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].opening })),
  body,
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: LANGS.flatMap((l) => B[l].legs),
};
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs']) set[f] = curlyRows(set[f], 'en');

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs'].flatMap((f) => set[f].filter((r) => r.lang === l)).map(({ mode, ...r }) => r);
  verbatimPreflight([...visibleStrings(rows, l), P[l].title, P[l].opening], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

for (const l of LANGS) console.log(`BEFORE ${l}: ${doc.title.find((t) => t._key === l)?.value} | ${doc.summary.find((t) => t._key === l)?.value.slice(0, 100)}`);
for (const [f, v] of Object.entries(set)) console.log(`${f}: ${(doc[f] ?? []).length} → ${v.length}`);
for (const l of LANGS) for (const b of body.find((x) => x._key === l).value) {
  const before = doc.body.find((x) => x._key === l).value.find((x) => x._key === b._key);
  if (textOf(before) !== textOf(b)) console.log(`essay ${l} ${b._key}: …${textOf(b).slice(-140)}`);
}

if (previewOut) {
  const ids = Object.values(GUIDES).flat().filter(Boolean);
  const refs = await client.fetch(`*[_id in $ids]`, { ids });
  const cities = await client.fetch(`*[_id in $ids]`, { ids: [...(doc.cities ?? []).map((c) => c._ref), ...refs.map((r) => r.parentCity?._ref).filter(Boolean)] });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'approvedInclusions', 'approvedExclusionRows', 'itineraryFormat', 'approvedOptions', 'approvedRoute'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [ID], 'before-bahariya-2day');
  await client.patch(ID).set(set).commit();
  console.log(`APPLIED to production ${ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
