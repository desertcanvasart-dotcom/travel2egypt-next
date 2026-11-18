/**
 * Lake Nasser Birdwatching and Desert Boat Safari: 3 Days — a NEW product from the
 * owner's locked copy (EN/ES/JA, 18 Nov), replacing the 2-day "Nubian Retreat"
 * (canon Gate D). Owner, 18 Nov: €499; a visit to the Abu Simbel temples on Day 1
 * (entrance included); pickup 07:30 in Aswan; a guide in another language is extra,
 * priced by language. Theme: Adventure.
 *
 *   new  tour.lake-nasser-birdwatching-boat-safari
 *        /lake-nasser-birdwatching-boat-safari
 *        /es/safari-en-barco-y-observacion-de-aves-en-el-lago-nasser
 *        /ja/naseru-ko-yacho-kansatsu-boto-safari   (naseru-ko, as the other Lake Nasser pages)
 *   old  tour.2-day-nubian-desert-nature-wildlife-retreat → hidden, superseded-duplicate,
 *        supersededBy the new one; its three URLs 301 to the new ones
 *        (migration/redirect-map.generated.ts, same commit).
 *
 * The guides speak English in every language, so there is no guide-language price:
 * ES and JA show €499 with no "Spanish/Japanese-speaking guide" note. No essay, so
 * no "More about this stop". No hero image yet (the owner will supply one; Gate C).
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-lake-nasser-3day-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-lake-nasser-3day-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-lake-nasser-3day-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'tour.lake-nasser-birdwatching-boat-safari';
const OLD = 'tour.2-day-nubian-desert-nature-wildlife-retreat';
const PRICE = 499;
const SLUGS = {
  en: 'lake-nasser-birdwatching-boat-safari',
  es: 'safari-en-barco-y-observacion-de-aves-en-el-lago-nasser',
  ja: 'naseru-ko-yacho-kansatsu-boto-safari',
};
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/3-day-lake-nasser-birdwatching-boat-safari';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
// JA site names contain 「・」, the row separator, so the JA lists are given (checked against the file).
const JA_SITES = {
  1: ['アブ・シンベルへのドライブ', 'アブ・シンベル神殿', '乗船', '船上からのバードウォッチング', '砂漠のガイドウォーク', '停泊地での夕日'],
};
const CFG = { locked: LOCKED, leadParas: true, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "3-day-lake-nasser-birdwatching-boat-safari" (EN/ES/JA), 18 Nov 2026, with the owner\'s 18 Nov answers (temples, 07:30, guide cost).';

const G = { abuSimbel: 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel' };
const GUIDES = { 1: [null, G.abuSimbel, null, null, null, null], 2: [null, null, null], 3: [null, null, null] };
const ROUTE = {
  en: [['Aswan', 'Abu Simbel', null, 'road'], ['Abu Simbel', 'Abu Simbel', ['Lake Nasser'], 'boat', 2], ['Abu Simbel', 'Aswan', null, 'road']],
  es: [['Asuán', 'Abu Simbel', null, 'road'], ['Abu Simbel', 'Abu Simbel', ['lago Nasser'], 'boat', 2], ['Abu Simbel', 'Asuán', null, 'road']],
  ja: [['アスワン', 'アブ・シンベル', null, 'road'], ['アブ・シンベル', 'アブ・シンベル', ['ナセル湖'], 'boat', 2], ['アブ・シンベル', 'アスワン', null, 'road']],
};
const SUMMARY = {
  en: 'A private three-day boat safari on Lake Nasser from Abu Simbel: waterbirds, desert walks and dunes, two nights aboard a two-cabin boat, and the temples of Abu Simbel.',
  es: 'Un safari privado de tres días en barco por el lago Nasser desde Abu Simbel: aves acuáticas, paseos por el desierto y las dunas, dos noches a bordo de un barco de dos camarotes y los templos de Abu Simbel.',
  ja: 'アブ・シンベルから出発する、ナセル湖のプライベートな3日間のボートサファリ。水鳥の観察、砂漠と砂丘の散策、2キャビンのボートでの船中2泊、そしてアブ・シンベル神殿の見学。',
};
const META_TITLE = {
  en: 'Lake Nasser Birdwatching Boat Safari: 3 Days',
  es: 'Safari en barco y aves en el lago Nasser: 3 días',
  ja: 'ナセル湖バードウォッチング・ボートサファリ3日間',
};
const CITIES = ['wp-page-58758' /* Aswan */, 'wp-page-56813' /* Abu Simbel */];
// The other Lake Nasser journeys.
const RELATED = ['wp-page-129996' /* 3-day fishing safari */, 'wp-page-130067' /* 4 days on Lake Nasser */, 'wp-page-90443' /* 4-day cruise from Abu Simbel */];

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
// Same meaning, checked by hand 18 Nov:
//   ES panel1 / wk1: "October to April" = «de octubre a abril» (the gate reads ES month names as numbers, not EN ones).
//   ES d2.b0: "or see neither" = «que no veas ninguna de las dos cosas» (the gate reads «dos» as 2).
//   ES stay3: "both speaking English" = «los dos de habla inglesa» (the same).
//   JA panel1 / wk1: "October to April" = 10月〜4月 (open items).
const SAME_MEANING = { es: ['panel1', 'wk1', 'd2.b0', 'stay3'], ja: ['panel1', 'wk1'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const existing = await client.getDocument(TOUR);
const old = await client.getDocument(OLD);
if (!old) throw new Error(`${OLD} not found`);
if (old.durationDays !== 2) throw new Error('old product is not the 2-day retreat');
// The new slugs must be free (except on a re-run, where they are this tour's own).
for (const l of LANGS) {
  const taken = await client.fetch('*[_type == "tour" && _id != $id && !(_id in path("drafts.**")) && slug[_key == $l][0].value.current == $s]._id', { id: TOUR, l, s: SLUGS[l] });
  if (taken.length) throw new Error(`${l} slug ${SLUGS[l]} is taken by ${taken.join(', ')}`);
}
const inbound = await client.fetch('*[references($a) || references($b)]._id', { a: OLD, b: `drafts.${OLD}` });
if (inbound.length) throw new Error(`the old product is still referenced by ${inbound.join(', ')}: repoint first`);

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
    _key: `lns-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    body: d.body.map(para),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
    optional: [],
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
    included: p.included.map((t, i) => fact(`lns-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`lns-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`lns-opt-${l}-${i}`, l, t)),
    legs: ROUTE[l].map(([from, to, via, mode, nights], i) => ({ _key: `lns-leg-${l}-${i}`, _type: 'routeLeg', lang: l, from, to, ...(via ? { via } : {}), mode, ...(nights ? { nights } : {}), source: SRC, needsReview: false })),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
const intl = (type, m) => LANGS.map((l) => ({ _key: l, _type: type, value: m[l] }));
const doc = {
  _id: TOUR,
  _type: 'tour',
  type: 'package',
  tourMode: 'private',
  theme: { _type: 'reference', _ref: 'theme-adventure' },
  cities: CITIES.map((c, i) => ({ _key: `city-${i + 1}`, _type: 'reference', _ref: c })),
  durationDays: 3,
  maxGroup: 8,
  priceFrom: PRICE,
  title: intl('internationalizedArrayStringValue', Object.fromEntries(LANGS.map((l) => [l, P[l].title]))),
  summary: intl('internationalizedArrayTextValue', SUMMARY),
  slug: LANGS.map((l) => ({ _key: l, _type: 'object', value: { _type: 'slug', current: SLUGS[l] } })),
  seo: { _type: 'seo', metaTitle: intl('internationalizedArrayStringValue', META_TITLE), metaDescription: intl('internationalizedArrayTextValue', SUMMARY) },
  relatedTours: RELATED.map((r) => ({ _key: `rel_${r.replace(/[^a-z0-9]/gi, '_')}`, _type: 'reference', _ref: r })),
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: LANGS.flatMap((l) => B[l].legs),
  migration: { source: 'owner-locked-copy', replaces: OLD, createdFrom: SRC },
};
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs']) doc[f] = curlyRows(doc[f], 'en');
const related = await client.fetch('*[_id in $ids]._id', { ids: [...RELATED, ...CITIES, 'theme-adventure', ...Object.values(G)] });
for (const id of [...RELATED, ...CITIES, 'theme-adventure', ...Object.values(G)]) if (!related.includes(id)) throw new Error(`reference target ${id} missing`);

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs'].flatMap((f) => doc[f].filter((r) => r.lang === l)).map(({ mode, ...r }) => r);
  // 'strong' is the bold mark on the lead words, not copy.
  verbatimPreflight([...visibleStrings(rows, l).filter((x) => x !== 'strong'), P[l].title], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

const hide = { hidden: true, 'migration.reviewFlag': 'superseded-duplicate', 'migration.supersededBy': TOUR, 'migration.supersededAt': new Date().toISOString() };
const oldIds = [OLD, ...((await client.getDocument(`drafts.${OLD}`)) ? [`drafts.${OLD}`] : [])];

console.log(`NEW ${TOUR} (${existing ? 'exists: replaced' : 'created'})`);
for (const l of LANGS) console.log(`  ${l}: /${l === 'en' ? '' : `${l}/`}${SLUGS[l]}\n    title: ${P[l].title}\n    summary: ${SUMMARY[l]}\n    panel: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}`);
console.log(`  price €${PRICE} (ES/JA the same: English-speaking guides) · theme-adventure · maxGroup 8`);
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs']) console.log(`  ${f}: ${doc[f].length}`);
console.log(`OLD ${oldIds.join(', ')}: ${JSON.stringify(old.title?.find((t) => t._key === 'en')?.value)} €${old.priceFrom}`);
console.log(`  slugs ${JSON.stringify(old.slug.map((s) => `${s._key}:${s.value.current}`))}`);
console.log(`  set ${JSON.stringify(hide)}`);

if (previewOut) {
  const refs = await client.fetch('*[_id in $ids]', { ids: [...Object.values(G), ...CITIES, ...RELATED, 'theme-adventure'] });
  const dataset = [doc, ...refs];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug: SLUGS[l] } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'approvedInclusions', 'approvedExclusionRows', 'itineraryFormat', 'approvedOptions', 'approvedRoute'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [...(existing ? [TOUR] : []), ...oldIds], 'before-lake-nasser-3day');
  await client.createOrReplace(doc);
  console.log(`APPLIED: ${TOUR} created in production`);
  for (const id of oldIds) await client.patch(id).set(hide).commit();
  console.log(`RETIRED: ${oldIds.join(', ')} hidden, superseded by ${TOUR}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
