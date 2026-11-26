/**
 * The 10-day Nile cruise page, rebuilt in the multi-day format; Pharaohs' Legacy and Love on the Nile fold into it as options (owner, 26 Nov: six 10-day pages to three).
 * Updates wp-page-89376 IN PLACE (same _id and slugs; price, hero, theme, cities, tourMode untouched); the old essay is not shown.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-10day-nile-cruise-2026-11-26.mjs              # dry run
 *   node --env-file=<.env> scripts/itinerary-format/import-10day-nile-cruise-2026-11-26.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-89376';
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/10-day-cairo-aswan-nile-cruise-sleeper-train';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
const JA_SITES = {"2": ["ギザのピラミッド", "大スフィンクス", "エジプト考古学博物館"], "3": ["サラディンの城塞", "ムハンマド・アリ・モスク", "ハーン・ハリーリ"], "4": ["アスワン・ハイ・ダム", "切りかけのオベリスク", "フィラエ神殿", "ファルーカ"], "6": ["コム・オンボ神殿", "エドフのホルス神殿"], "7": ["カルナック神殿", "大列柱室", "ルクソール神殿", "スフィンクス参道"], "8": ["王家の谷", "ハトシェプスト女王葬祭殿", "メムノンの巨像"], "9": ["メンフィス", "サッカラの階段ピラミッド", "ダハシュール", "ナイル川ディナークルーズ"]};
const CFG = { locked: LOCKED, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const SRC = 'Owner locked copy "10-day-cairo-aswan-nile-cruise-sleeper-train" (EN/ES/JA), 26 Nov 2026.';

const G = {
  giza: 'guideArticle.giza.the-giza-plateau', sphinx: 'guideArticle.giza.the-great-sphinx', memphis: 'guideArticle.giza.memphis-mit-rahina', saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  karnak: 'guideArticle.luxor.the-karnak-temple', luxorTemple: 'guideArticle.luxor.the-luxor-temple', vok: 'guideArticle.luxor.valley-of-the-kings', hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut', colossi: 'guideArticle.luxor.the-colossi-of-memnon',
  edfu: 'guideArticle.edfu.edfu-temple', komOmbo: 'guideArticle.kom-ombo.the-temple-of-kom-ombo', abuSimbel: 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel', obelisk: 'guideArticle.aswan.the-unfinished-obelisk', philae: 'guideArticle.aswan.the-philae-temple',
  citadel: 'guideArticle.cairo.the-citadel-of-saladin', aliMosque: 'guideArticle.cairo.mosque-of-muhammad-ali', khan: 'guideArticle.cairo.khan-el-khalili',
  hanging: 'guideArticle.cairo.the-hanging-church', coptic: 'guideArticle.cairo.the-coptic-museum',
};
// null = no guide page for that site.
const GUIDES = {
  1: [], 2: [G.giza, G.sphinx, null], 3: [G.citadel, G.aliMosque, G.khan], 4: [null, G.obelisk, G.philae, null], 5: [], 6: [G.komOmbo, G.edfu], 7: [G.karnak, null, G.luxorTemple, null], 8: [G.vok, G.hatshepsut, G.colossi], 9: [G.memphis, G.saqqara, null, null], 10: [],
};
const SUMMARY = {
  en: "Ten private days with the Nile in the middle: Giza and old Cairo, the sleeper train to Aswan, three nights cruising to Luxor, both banks of ancient Thebes and a flight back to Cairo.",
  es: "Diez días privados con el Nilo en el centro: Giza y el viejo Cairo, el tren nocturno a Asuán, tres noches de crucero hasta Luxor, las dos orillas de la antigua Tebas y un vuelo de vuelta a El Cairo.",
  ja: "ナイルを真ん中に置いたプライベートな10日間。ギザとカイロ旧市街、アスワンへの寝台列車、ルクソールまでの3泊クルーズ、古代テーベの両岸、そしてカイロへの帰りのフライト。",
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
// Same meaning, to be filled after the first dry run.
const SAME_MEANING = { es: ['opening'], ja: [] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const existing = await client.getDocument(TOUR);
if (!existing) throw new Error(`${TOUR} not found`);
if (P.en.days.length !== 10) throw new Error(`expected 10 days, found ${P.en.days.length}`);
if (await client.getDocument(`drafts.${TOUR}`)) throw new Error(`drafts.${TOUR} exists: handle it first`);
const SLUGS = Object.fromEntries(LANGS.map((l) => [l, existing.slug.find((x) => x._key === l).value.current]));

const ESSAY_MORE = {};
const CLOSING_REF = null;
// The old essay no longer matches the programme, so no day links to it.

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
console.log('  body essay: unchanged (not shown on this page)');

if (apply) {
  await writeRollback(client, [TOUR], 'before-10day-nile-cruise');
  await client.patch(TOUR).set(doc).commit();
  console.log(`APPLIED: ${TOUR} updated in production`);
} else console.log('dry run (pass --apply --flags-approved to write production)');
