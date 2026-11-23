/**
 * The 14-day Nile cruise Aswan → Cairo (wp-page-90335) rebuilt from Mövenpick's own M/S Darakum itinerary (12 nights, Aswan to
 * Cairo, plus a Cairo arrival night and the flight to Aswan), absorbing the 11-day Luxor → Cairo page (wp-page-89177), which is
 * the same sailing joined at Luxor. Owner, 23 Nov: NO new price (the existing price stays); the page stays PRIVATE until the 2027 dates for
 * this direction are confirmed (then group mode with a departure list, as the 15-day page). Updates wp-page-90335 IN PLACE (same _id and slugs); the old essay is not
 * shown. Retire: retire-darakum-14day-*.mjs.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-darakum-14day-2026-11-23.mjs              # dry run
 *   node --env-file=<.env> scripts/itinerary-format/import-darakum-14day-2026-11-23.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-90335';
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/14-day-nile-cruise-aswan-to-cairo';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
const JA_SITES = {
  3: ['アスワン・ハイ・ダム', 'フィラエ神殿', 'ヌビア博物館'],
  4: ['コム・オンボ神殿'],
  8: ['アビドスのセティ1世神殿', 'アビドスの王名表'],
  10: ['テル・エル・アマルナの岩窟墓', 'トゥーナ・エル・ゲベル', 'ペトシリスの墓', 'アシュムネイン'],
  11: ['ベニ・ハサンの岩窟墓'],
  12: ['ハンギング・チャーチ', 'コプト博物館', 'ベン・エズラ・シナゴーグ'],
  13: ['ギザのピラミッド', '大スフィンクス', 'エジプト博物館'],
};
const CFG = { locked: LOCKED, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const SRC = 'Owner locked copy "14-day-nile-cruise-aswan-to-cairo" (EN/ES/JA), 23 Nov 2026.';

const G = {
  giza: 'guideArticle.giza.the-giza-plateau', sphinx: 'guideArticle.giza.the-great-sphinx', memphis: 'guideArticle.giza.memphis-mit-rahina', saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  hanging: 'guideArticle.cairo.the-hanging-church', coptic: 'guideArticle.cairo.the-coptic-museum', benEzra: 'guideArticle.cairo.ben-ezra-synagogue', egMuseum: 'guideArticle.cairo.egyptian-museum-of-antiquities',
  hathor: 'guideArticle.qena.the-temple-of-hathor',
  vok: 'guideArticle.luxor.valley-of-the-kings', hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut', karnak: 'guideArticle.luxor.the-karnak-temple', luxorTemple: 'guideArticle.luxor.the-luxor-temple',
  edfu: 'guideArticle.edfu.edfu-temple', komOmbo: 'guideArticle.kom-ombo.the-temple-of-kom-ombo', philae: 'guideArticle.aswan.the-philae-temple', nubian: 'guideArticle.aswan.the-nubian-museum',
};
// null = no guide page for that site.
const GUIDES = {
  1: [], 2: [], 3: [null, G.philae, G.nubian], 4: [G.komOmbo], 5: [G.edfu], 6: [G.vok, G.hatshepsut, G.karnak, G.luxorTemple], 7: [G.hathor], 8: [null, null], 9: [],
  10: [null, null, null, null], 11: [null], 12: [G.hanging, G.coptic, G.benEzra], 13: [G.giza, G.sphinx, G.egMuseum], 14: [],
};
const SUMMARY = {
  en: 'A private-guided fourteen-day cruise from Aswan to Cairo on a five-star Nile cruise ship: Kom Ombo, Edfu, Luxor, Dendera and Abydos, Tell el-Amarna, Beni Hassan, then the pyramids and the Egyptian Museum, on fixed sailing dates.',
  es: 'Un crucero de catorce días con guía de Asuán a El Cairo en un crucero de cinco estrellas por el Nilo: Kom Ombo, Edfu, Luxor, Dendera y Abidos, Tell el-Amarna, Beni Hassan, y después las pirámides y el Museo Egipcio, en fechas de salida fijas.',
  ja: 'アスワンからカイロまで、5つ星のナイル川クルーズ船でめぐる14日間のガイド付きクルーズ。コム・オンボ、エドフ、ルクソール、デンデラ、アビドス、テル・エル・アマルナ、ベニ・ハサン、そしてピラミッドとエジプト博物館へ。出発日は決まっています。',
};
const panelText = (l, t) => (l === 'en' ? t.replace(/\s*\*\(ES:.*\)\*\s*$/, '') : t);
const paraText = (s) => (typeof s === 'string' ? s : `${s.lead} ${s.text}`);

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.map((s) => typeof s), d.segments?.length ?? 0, d.sites.length, d.meals.map((m) => [m.meal, !!m.note]), d.optional.length, !!d.overnight, !!d.pace]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length, note: !!p.daysNote });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}

const ROUTE_LABEL = { en: 'Route', es: 'Ruta', ja: 'ルート' };
const WHERE = Object.fromEntries(LANGS.map((l) => [l, P[l].panel[ROUTE_LABEL[l]]]));
for (const l of LANGS) if (!WHERE[l]) throw new Error(`${l}: no route line in the panel`);
const flat = (p) => {
  const o = { opening: p.opening, why: p.whyRoute, note: p.daysNote?.text, closing: p.closingLine };
  for (const d of p.days) { o[`d${d.day}.t`] = d.title; (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = paraText(s))); o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace; }
  p.panelRows.forEach((r, i) => (o[`panel${i}`] = r.text)); p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Same meaning, checked by hand 23 Nov (the gate reads digits only):
//   ES why: «octavo» = the eighth; ES d6.b0: «20 a 40 millones» = 20 to 40 million; ES d7.b0: «dinastía XXVI» = the 26th Dynasty.
//   JA why: 二段階 = two stages (kanji numeral); JA d6.b0: 2000万〜4000万 = 20 to 40 million.
// Same meaning, checked by hand 23 Nov (the gate reads digits only): ES d6.b0 «dos paradas» = stopping twice; ES in5 «los dos museos» = both museums.
//   JA d5.b0 writes 三 / 六十 / 二十 / 三千 as kanji numerals (three, sixty, twenty, three thousand; Ramses VI = 6世 matches); JA d6.b0 «2か所» = stopping twice; JA in5 «二つの博物館» = both museums.
// Same meaning, checked by hand 23 Nov: ES opening «en los dos extremos» = at both ends; JA d4.b0 writes 六十 / 二十 as kanji numerals (sixty, twenty).
// Same meaning, checked by hand 23 Nov: JA d6.b0 writes 六十 (sixty) as kanji; JA d10.b0 writes 二度と (never) with a kanji numeral.
const SAME_MEANING = { es: [], ja: ['d6.b0', 'd10.b0'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const existing = await client.getDocument(TOUR);
if (!existing) throw new Error(`${TOUR} not found`);
if (await client.getDocument(`drafts.${TOUR}`)) throw new Error(`drafts.${TOUR} exists: handle it first`);
const SLUGS = Object.fromEntries(LANGS.map((l) => [l, existing.slug.find((x) => x._key === l).value.current]));

const ESSAY_MORE = {};
const CLOSING_REF = null;
// The live essay's passages (Fayoum, the Grand Egyptian Museum, a Cairo day) do not match the ship's own program, so no day links to them.

/* ---------- itinerary ---------- */
const para = (s, i) => (typeof s === 'string'
  ? { _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text: s, marks: [] }] }
  : { _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}a`, _type: 'span', text: s.lead, marks: ['strong'] }, { _key: `s${i}b`, _type: 'span', text: ` ${s.text}`, marks: [] }] });
const fact = (key, l, text) => ({ _key: key, _type: 'productFact', lang: l, text, source: SRC, needsReview: false });
const row = (key, r) => ({ _key: key, _type: 'labelledRow', label: r.label, text: r.text });
function build(l) {
  const p = P[l];
  for (const d of p.days) if (GUIDES[d.day].length !== d.sites.length) throw new Error(`${l} day ${d.day}: ${d.sites.length} sites, ${GUIDES[d.day].length} guide slots`);
  const days = p.days.map((d) => ({
    _key: `dah-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    ...(d.segments ? { segments: d.segments.map((sg, i) => ({ _key: `g${i}`, _type: 'daySegment', label: sg.label, ...(sg.heading ? { heading: sg.heading } : {}), text: sg.text })) } : { body: d.body.map(para) }),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
    optional: d.optional.map((text, i) => ({ _key: `o${i}`, _type: 'dayOptional', text, ...(/extra ticket|entrada.* extra|entradas extra|別途チケット/i.test(text) ? { cost: 'extraTicket' } : {}) })),
    narrativeRefs: ESSAY_MORE[d.day] ?? [],
    source: SRC, needsReview: false, overnightNeedsReview: false,
  }));
  const intro = {
    _key: `intro-${l}`, _type: 'itineraryIntro', lang: l,
    opening: p.opening, whyRoute: p.whyRoute, whyRouteRefs: [],
    ...(p.daysNote ? { daysNote: p.daysNote } : {}),
    closingLine: p.closingLine,
    ...(CLOSING_REF ? { closingRef: CLOSING_REF } : {}),
    panelRows: p.panelRows.map((r, i) => row(`pr${i}`, { ...r, text: panelText(l, r.text) })),
    stayRows: p.stayRows.map((r, i) => row(`sr${i}`, r)),
    fitFor: p.fitFor, worthKnowing: p.worthKnowing, makeItYoursIntro: p.makeItYoursIntro,
    source: SRC, needsReview: false,
  };
  return {
    days, intro,
    included: p.included.map((t, i) => fact(`dah-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`dah-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`dah-opt-${l}-${i}`, l, t)),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
const intl = (type, m) => LANGS.map((l) => ({ _key: l, _type: type, value: m[l] }));
const doc = {
  title: intl('internationalizedArrayStringValue', Object.fromEntries(LANGS.map((l) => [l, P[l].title]))),
  summary: intl('internationalizedArrayTextValue', SUMMARY),
  slug: LANGS.map((l) => ({ _key: l, _type: 'object', value: { _type: 'slug', current: SLUGS[l] } })),
  shapeOfDay: { ...(existing.shapeOfDay ?? {}), where: intl('internationalizedArrayTextValue', WHERE) },
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: [],
};
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) doc[f] = curlyRows(doc[f], 'en');
const targets = Object.values(G);
const found = await client.fetch('*[_id in $ids]._id', { ids: targets });
for (const id of targets) if (!found.includes(id)) throw new Error(`reference target ${id} missing`);

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => doc[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l).filter((x) => x !== 'strong'), P[l].title, WHERE[l]], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

console.log(`UPDATE ${TOUR} in place (${existing.priceFrom} / ${JSON.stringify(existing.guideLanguagePrices)} price, hero, theme, cities, related tours kept)`);
console.log(`  slugs unchanged: ${LANGS.map((l) => SLUGS[l]).join(' | ')}`);
for (const l of LANGS) console.log(`  ${l}: /${l === 'en' ? '' : `${l}/`}${SLUGS[l]}\n    title: ${P[l].title}\n    where: ${WHERE[l]}\n    panel: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}\n    days: ${JSON.stringify(B[l].days.map((d) => `${d.day} ${d.place} | ${d.overnight ?? '—'} | ${d.meals.map((m) => m.meal[0]).join('')} | opt ${d.optional.length} | essay ${d.narrativeRefs.length}`))}`);
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) console.log(`  ${f}: ${(existing[f] ?? []).length} → ${doc[f].length}`);
console.log(`  body essay: 26 blocks ×3, corrected: ${Object.keys(ESSAY_FIX.en).length} blocks in EN`);

if (apply) {
  await writeRollback(client, [TOUR], 'before-darakum-14day');
  await client.patch(TOUR).set(doc).commit();
  console.log(`APPLIED: ${TOUR} updated in production`);
} else console.log('dry run (pass --apply --flags-approved to write production)');
