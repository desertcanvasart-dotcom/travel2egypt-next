/**
 * The Two Caves of the Western Desert: 6 Days to Djara and Obeiyed — a NEW product from
 * the owner's locked copy (EN/ES/JA, 18 Nov) that replaces two 5-day tours (canon Gate D).
 * Owner, 18 Nov: "€990, defaults" (to the review that proposed them):
 *   - €990; ES €1,024, JA €1,044 (the same steps as the two old tours: +€34 / +€54)
 *   - theme Adventure (open items)
 *   - JA slug spelt as the other JA pages spell the names: jara, obeiyado
 *   - the closing line no longer claims "three thousand years of tourism"
 *   - published live (needsReview false), as Lake Nasser; native ES/JA review stays open
 *
 *   new  tour.western-desert-djara-and-obeiyed-caves
 *        /western-desert-djara-and-obeiyed-caves
 *        /es/las-dos-cuevas-del-desierto-occidental-djara-y-obeiyed
 *        /ja/seiho-sabaku-jara-obeiyado-dokutsu
 *   old  tour.the-white-desert-and-djara-cave (€890), wp-page-131889 Obeiyed (€550)
 *        → hidden, superseded-duplicate, supersededBy the new one; every card that points
 *        at either (drafts included) points at the new one, or is removed where the page
 *        already lists it; their six URLs 301 (migration/redirect-map.generated.ts).
 *
 * No essay, so no "More about this stop" (the copy's pointers are dropped by the parser).
 * The hero is the Djara tour's photo until the owner supplies one. No route legs: the
 * panel's route line is shapeOfDay.where.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-two-caves-6day-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-two-caves-6day-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-two-caves-6day-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'tour.western-desert-djara-and-obeiyed-caves';
const OLDS = ['tour.the-white-desert-and-djara-cave', 'wp-page-131889'];
const PRICE = 990;
const GUIDE_PRICES = { es: 1024, ja: 1044 };
const SLUGS = {
  en: 'western-desert-djara-and-obeiyed-caves',
  es: 'las-dos-cuevas-del-desierto-occidental-djara-y-obeiyed',
  ja: 'seiho-sabaku-jara-obeiyado-dokutsu',
};
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/6-day-western-desert-djara-and-obeiyed-caves';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
// JA site names contain 「・」, the row separator, so the JA lists are given (checked against the file).
const JA_SITES = {
  1: ['ピラミッド・マウンテン', 'イングリッシュ・マウンテン', 'エル・バウィーティの旧市街', '民俗博物館'],
  2: ['黄金のミイラ', '黒砂漠', 'クリスタル・マウンテン', 'アガバット', '旧白砂漠', 'テント・バレー'],
  5: ['オベイエド洞窟', 'マジック・スプリング', '新白砂漠', 'ハワース泉', 'ビール・セルウ'],
};
const CFG = { locked: LOCKED, leadParas: true, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "6-day-western-desert-djara-and-obeiyed-caves" (EN/ES/JA), 18 Nov 2026, with the owner\'s 18 Nov answers (€990, defaults).';

const G = {
  bawiti: 'guideArticle.bahariya-oasis.bawiti',
  mummies: 'guideArticle.bahariya-oasis.valley-of-the-golden-mummies',
  crystal: 'guideArticle.bahariya-oasis.crystal-mountain',
  agabat: 'guideArticle.farafra-oasis.crystal-mountain-and-aqabat',
  whiteDesert: 'guideArticle.farafra-oasis.white-desert-national-park',
  newWhite: 'guideArticle.farafra-oasis.hidden-valley-and-the-new-white-desert',
};
// No guide pages for Pyramid or English Mountain, the Ethnic Museum, the Black Desert, Tent
// Valley, the Acacia Tree, Watermelon Valley, Djara, Obeiyed, Magic Spring, Hawaas or Bir Serw.
const GUIDES = {
  1: [null, null, G.bawiti, null],
  2: [G.mummies, null, G.crystal, G.agabat, G.whiteDesert, null],
  3: [null, null, null],
  4: [null, null],
  5: [null, null, G.newWhite, null, null],
  6: [],
};
const SUMMARY = {
  en: 'A private six-day safari from Cairo into the Western Desert: Bahariya, the Black and White Deserts, and the prehistoric rock art of the Djara and Obeiyed caves, with three nights camping.',
  es: 'Un safari privado de seis días desde El Cairo al desierto occidental: Bahariya, el Desierto Negro y el Blanco, y el arte rupestre prehistórico de las cuevas de Djara y Obeiyed, con tres noches de acampada.',
  ja: 'カイロから西方砂漠へ向かう、プライベートな6日間のサファリ。バハレイヤ、黒砂漠と白砂漠、そしてジャラ洞窟とオベイエド洞窟の先史時代の岩絵へ。砂漠でのキャンプ3泊付き。',
};
const META_TITLE = {
  en: 'Djara and Obeiyed Caves: 6-Day Western Desert Safari',
  es: 'Cuevas de Djara y Obeiyed: safari de 6 días por el desierto occidental',
  ja: 'ジャラ洞窟とオベイエド洞窟：西方砂漠6日間のサファリ',
};
const CITIES = ['wp-page-83284' /* Cairo */, 'wp-page-58769' /* Bahariya */, 'wp-page-58849' /* Farafra */];
// The other Western Desert journeys.
const RELATED = ['wp-page-87834' /* 2-day Black and White Desert */, 'tour.4-days-white-desert-wadi-al-hittan-exploration', 'wp-page-89510' /* 6-day Pharaohs and White Desert */];

const panelText = (l, t) => (l === 'en' ? t.replace(/\s*\*\(ES:.*\)\*\s*$/, '') : t);
const paraText = (s) => (typeof s === 'string' ? s : `${s.lead} ${s.text}`);

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.map((s) => typeof s), d.segments?.length ?? 0, d.sites.length, d.meals.map((m) => [m.meal, !!m.note]), d.optional.length, !!d.overnight, !!d.pace]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
const ROUTE_LABEL = { en: 'Route', es: 'Ruta', ja: 'ルート' };
const WHERE = Object.fromEntries(LANGS.map((l) => [l, P[l].panel[ROUTE_LABEL[l]]]));
for (const l of LANGS) if (!WHERE[l]) throw new Error(`${l}: no route line in the panel`);
const flat = (p) => {
  const o = { opening: p.opening, why: p.whyRoute, closing: p.closingLine };
  for (const d of p.days) { o[`d${d.day}.t`] = d.title; (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = paraText(s))); o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace; }
  p.panelRows.forEach((r, i) => (o[`panel${i}`] = r.text)); p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Same meaning, checked by hand 18 Nov:
//   ES stay3: "both with you throughout" = «los dos contigo» (the gate reads «dos» as 2).
const SAME_MEANING = { es: ['stay3'], ja: [] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const existing = await client.getDocument(TOUR);
const olds = [];
for (const id of OLDS) {
  const d = await client.getDocument(id);
  if (!d) throw new Error(`${id} not found`);
  if (d.durationDays !== 5) throw new Error(`${id} is not a 5-day tour`);
  olds.push(d);
}
const djara = olds[0];
if (!djara.heroImage) throw new Error('the Djara tour has no hero image to reuse');
// The new slugs must be free (except on a re-run, where they are this tour's own).
for (const l of LANGS) {
  const taken = await client.fetch('*[_type == "tour" && _id != $id && !(_id in path("drafts.**")) && slug[_key == $l][0].value.current == $s]._id', { id: TOUR, l, s: SLUGS[l] });
  if (taken.length) throw new Error(`${l} slug ${SLUGS[l]} is taken by ${taken.join(', ')}`);
}

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
    _key: `cav-${l}-${d.day}`,
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
    included: p.included.map((t, i) => fact(`cav-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`cav-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`cav-opt-${l}-${i}`, l, t)),
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
  durationDays: 6,
  priceFrom: PRICE,
  guideLanguagePrices: { _type: 'object', ...GUIDE_PRICES },
  heroImage: djara.heroImage,
  title: intl('internationalizedArrayStringValue', Object.fromEntries(LANGS.map((l) => [l, P[l].title]))),
  summary: intl('internationalizedArrayTextValue', SUMMARY),
  slug: LANGS.map((l) => ({ _key: l, _type: 'object', value: { _type: 'slug', current: SLUGS[l] } })),
  seo: { _type: 'seo', metaTitle: intl('internationalizedArrayStringValue', META_TITLE), metaDescription: intl('internationalizedArrayTextValue', SUMMARY) },
  shapeOfDay: { where: intl('internationalizedArrayTextValue', WHERE) },
  relatedTours: RELATED.map((r) => ({ _key: `rel_${r.replace(/[^a-z0-9]/gi, '_')}`, _type: 'reference', _ref: r })),
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: [],
  migration: { source: 'owner-locked-copy', replaces: OLDS, createdFrom: SRC },
};
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) doc[f] = curlyRows(doc[f], 'en');
const targets = [...RELATED, ...CITIES, 'theme-adventure', ...Object.values(G)];
const found = await client.fetch('*[_id in $ids]._id', { ids: targets });
for (const id of targets) if (!found.includes(id)) throw new Error(`reference target ${id} missing`);

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => doc[f].filter((r) => r.lang === l));
  // 'strong' is the bold mark on the lead words, not copy.
  verbatimPreflight([...visibleStrings(rows, l).filter((x) => x !== 'strong'), P[l].title, WHERE[l]], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

/* ---------- cards that point at the old tours ---------- */
// Drafts are repointed too, so publishing one later can't bring an old card back.
const referrers = await client.fetch('*[references($ids) && !(_id in $ids) && !(_id in $draftOlds)]{_id, _type, relatedTours, endTours}', { ids: OLDS, draftOlds: OLDS.map((id) => `drafts.${id}`) });
const plan = [];
for (const d of referrers) {
  for (const field of ['relatedTours', 'endTours']) {
    // A landing page for one length ("4-Day Egypt Tours") is no place for a 6-day tour: the card is removed.
    let hasNew = /^tourLanding\.\d+-days?-egypt-tours$/.test(d._id) || d._id === TOUR || (d[field] ?? []).some((x) => x._ref === TOUR);
    for (const item of d[field] ?? []) {
      if (!OLDS.includes(item._ref)) continue;
      plan.push({ id: d._id, field, key: item._key, from: item._ref, action: hasNew ? 'remove' : 'swap' });
      hasNew = true;
    }
  }
}
const covered = new Set(plan.map((p) => p.id));
const unhandled = referrers.filter((d) => !covered.has(d._id));
if (unhandled.length) throw new Error(`references in other fields: ${unhandled.map((d) => d._id).join(', ')}`);
const hide = { hidden: true, 'migration.reviewFlag': 'superseded-duplicate', 'migration.supersededBy': TOUR, 'migration.supersededAt': new Date().toISOString() };
const oldIds = [...OLDS];
for (const id of OLDS) if (await client.getDocument(`drafts.${id}`)) oldIds.push(`drafts.${id}`);

console.log(`NEW ${TOUR} (${existing ? 'exists: replaced' : 'created'})`);
for (const l of LANGS) console.log(`  ${l}: /${l === 'en' ? '' : `${l}/`}${SLUGS[l]}\n    title: ${P[l].title}\n    summary: ${SUMMARY[l]}\n    where: ${WHERE[l]}\n    panel: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}\n    meals: ${JSON.stringify(B[l].days.map((d) => d.meals.map((m) => m.meal)))}`);
console.log(`  price €${PRICE} ${JSON.stringify(GUIDE_PRICES)} · theme-adventure · hero from ${djara._id}`);
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) console.log(`  ${f}: ${doc[f].length}`);
for (const o of olds) console.log(`OLD ${o._id}: ${JSON.stringify(o.title?.find((t) => t._key === 'en')?.value)} €${o.priceFrom}\n  slugs ${JSON.stringify(o.slug.map((s) => `${s._key}:${s.value.current}`))}`);
console.log(`  hide ${oldIds.join(', ')}: ${JSON.stringify(hide)}`);
for (const p of plan) console.log(`  card ${p.id} ${p.field}[_key=="${p.key}"] (${p.from}): ${p.action}`);

if (previewOut) {
  const refs = await client.fetch('*[_id in $ids]', { ids: [...Object.values(G), ...CITIES, ...RELATED, 'theme-adventure'] });
  const dataset = [doc, ...refs];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug: SLUGS[l] } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'shapeOfDay', 'approvedInclusions', 'approvedExclusionRows', 'itineraryFormat', 'approvedOptions', 'approvedRoute'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [...(existing ? [TOUR] : []), ...oldIds, ...covered], 'before-two-caves-6day');
  await client.createOrReplace(doc);
  console.log(`APPLIED: ${TOUR} created in production`);
  const tx = client.transaction();
  for (const id of oldIds) tx.patch(id, (q) => q.set(hide));
  for (const p of plan) {
    const path = `${p.field}[_key=="${p.key}"]`;
    tx.patch(p.id, (q) => (p.action === 'remove' ? q.unset([path]) : q.set({ [`${path}._ref`]: TOUR })));
  }
  await tx.commit();
  const left = await client.fetch('count(*[references($ids) && !(_id in $ids) && !(_id in $draftOlds)])', { ids: OLDS, draftOlds: OLDS.map((id) => `drafts.${id}`) });
  console.log(`RETIRED: ${oldIds.join(', ')} hidden, superseded by ${TOUR}; ${plan.length} cards changed; pages still pointing at an old tour: ${left}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
