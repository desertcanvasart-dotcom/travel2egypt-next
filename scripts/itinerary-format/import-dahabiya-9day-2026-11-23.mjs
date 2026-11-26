/**
 * Dahabiya Nile Cruise from Luxor to Aswan: 9 days with Luxor and Aswan included — a NEW product from the
 * owner's locked copy (EN/ES/JA, 23 Nov 2026) that will replace the six near-identical 7-day boat pages.
 * Owner, 23 Nov: "create the programs, finalize all the editing and formatting, and wait until I finish
 * adding all prices inside the system" — so this step ONLY creates the page. No price, no redirects, no
 * retiring of the old pages yet (they follow once the prices are in Autoura). The page is published with
 * seo.noIndex so it can be reviewed live without being indexed; the owner clears noIndex at go-live.
 *
 *   new  tour.dahabiya-nile-cruise-luxor-to-aswan
 *        /dahabiya-nile-cruise-luxor-to-aswan
 *        /es/crucero-en-dahabiya-por-el-nilo-de-luxor-a-asuan
 *        /ja/dahabiya-nairu-kuruzu-rukusoru-kara-asuwan
 *
 * No essay, so no "More about this stop". Boat prices come later as priceTiers (name = boat, sub =
 * departure, price per person, double sharing) plus priceNote (single = 1.9×; child under 6 = 50%).
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-dahabiya-9day-2026-11-23.mjs              # dry run
 *   node --env-file=<.env> scripts/itinerary-format/import-dahabiya-9day-2026-11-23.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'tour.dahabiya-nile-cruise-luxor-to-aswan';
const SLUGS = {
  en: 'dahabiya-nile-cruise-luxor-to-aswan',
  es: 'crucero-en-dahabiya-por-el-nilo-de-luxor-a-asuan',
  ja: 'dahabiya-nairu-kuruzu-rukusoru-kara-asuwan',
};
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/9-day-dahabiya-nile-cruise-luxor-to-aswan';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
const JA_SITES = {
  2: ['気球', '王家の谷', 'ツタンカーメン王墓', 'ハトシェプスト女王葬祭殿', 'メディネト・ハブ', 'メムノンの巨像'],
  4: ['エル・カブ遺跡', 'ネクベト神殿', 'エル・カブの岩窟墓', 'エドフのホルス神殿'],
  6: ['ゲベル・エル・シルシラの石切場', 'ホルエムヘブの岩窟神殿', '水遊び'],
  7: ['コム・オンボ神殿', 'ワニ博物館'],
  9: ['フィラエ神殿（イシス神殿）', 'アスワン・ハイ・ダム'],
};
const CFG = { locked: LOCKED, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const SRC = 'Owner locked copy "9-day-dahabiya-nile-cruise-luxor-to-aswan" (EN/ES/JA), 23 Nov 2026.';

const G = {
  hathor: 'guideArticle.qena.the-temple-of-hathor',
  karnak: 'guideArticle.luxor.the-karnak-temple',
  luxorTemple: 'guideArticle.luxor.the-luxor-temple',
  vok: 'guideArticle.luxor.valley-of-the-kings',
  hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut',
  habu: 'guideArticle.luxor.madinat-habu-temple',
  colossi: 'guideArticle.luxor.the-colossi-of-memnon',
  khnum: 'guideArticle.esna.the-temple-of-khnum-at-esna',
  elkab: 'guideArticle.edfu.elkab',
  edfu: 'guideArticle.edfu.edfu-temple',
  silsila: 'guideArticle.kom-ombo.gebel-el-silsila',
  horemheb: 'guideArticle.kom-ombo.speos-of-horemheb',
  komOmbo: 'guideArticle.kom-ombo.the-temple-of-kom-ombo',
  garden: 'guideArticle.aswan.botanical-garden',
  nubian: 'guideArticle.aswan.the-nubian-museum',
  philae: 'guideArticle.aswan.the-philae-temple',
};
// null = no guide page for that site (balloon, Tutankhamun's tomb inside the Valley page, Esna market, Nekhbet, El Kab tombs,
// sailing, the swim, inscriptions, the quarries day swim, the Crocodile Museum, the felucca, the market, the High Dam).
const GUIDES = {
  1: [G.hathor, G.karnak, G.luxorTemple],
  2: [null, G.vok, null, G.hatshepsut, G.habu, G.colossi],
  3: [G.khnum, null],
  4: [G.elkab, null, null, G.edfu],
  5: [null, null, null],
  6: [G.silsila, G.horemheb, null],
  7: [G.komOmbo, null],
  8: [null, G.garden, G.nubian, null],
  9: [G.philae, null],
};
const SUMMARY = {
  en: 'A private nine-day program: two nights in Luxor with Dendera, Karnak, a West Bank balloon flight and the Valley of the Kings, five nights on a sailing dahabiya to Aswan, and a final day with the Nubian Museum, the market and Philae.',
  es: 'Un programa privado de nueve días: dos noches en Luxor con Dendera, Karnak, un vuelo en globo sobre la orilla oeste y el Valle de los Reyes, cinco noches en una dahabiya de vela hasta Asuán y un último día con el Museo Nubio, el mercado y Filé.',
  ja: 'プライベートな9日間のプログラム。ルクソールで2泊し、デンデラ、カルナック、西岸の気球、王家の谷を巡り、帆船ダハビーヤでアスワンまで5泊、最終日はヌビア博物館、市場、フィラエ神殿へ。',
};
const META_TITLE = {
  en: 'Dahabiya Nile Cruise from Luxor to Aswan: 9 Days',
  es: 'Crucero en dahabiya por el Nilo de Luxor a Asuán: 9 días',
  ja: 'ダハビーヤで巡るナイル川クルーズ、ルクソールからアスワン：9日間',
};
const THEME = 'theme-dahabiya-nile-cruise';
const CITIES = ['wp-page-58877' /* Luxor */, 'wp-page-58758' /* Aswan */];
const RELATED = ['tour.7-days-dahabiya-nile-cruise-from-aswan-to-luxor'];

const panelText = (l, t) => (l === 'en' ? t.replace(/\s*\*\(ES:.*\)\*\s*$/, '') : t);
const paraText = (s) => (typeof s === 'string' ? s : `${s.lead} ${s.text}`);

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.map((s) => typeof s), d.segments?.length ?? 0, d.sites.length, d.meals.map((m) => [m.meal, !!m.note]), d.optional.length, !!d.overnight, !!d.pace]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length, note: !!p.daysNote });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
if (P.en.days.length !== 9) throw new Error(`expected 9 days, found ${P.en.days.length}`);
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
// Same meaning, checked by hand 23 Nov: ES wk2 writes 1.9 as «1,9» (the gate reads 1 and 9).
//   JA d2.b0 writes "sixty" as 六十 (a kanji numeral); 1550 and 1922 match.
const SAME_MEANING = { es: ['wk2'], ja: ['d2.b0'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const existing = await client.getDocument(TOUR);
const heroSrc = (await client.getDocument('drafts.tour.7-days-luxury-dahabiya-cruise-on-the-nile')) ?? (await client.getDocument('tour.adelaide-dahabiya-nile-cruise'));
if (!heroSrc?.heroImage) throw new Error('no hero image to reuse');
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
    _key: `dah-${l}-${d.day}`,
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
    ...(p.daysNote ? { daysNote: p.daysNote } : {}),
    closingLine: p.closingLine,
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
  _id: TOUR,
  _type: 'tour',
  type: 'package',
  tourMode: 'private',
  theme: { _type: 'reference', _ref: THEME },
  cities: CITIES.map((c, i) => ({ _key: `city-${i + 1}`, _type: 'reference', _ref: c })),
  durationDays: 9,
  heroImage: heroSrc.heroImage,
  title: intl('internationalizedArrayStringValue', Object.fromEntries(LANGS.map((l) => [l, P[l].title]))),
  summary: intl('internationalizedArrayTextValue', SUMMARY),
  slug: LANGS.map((l) => ({ _key: l, _type: 'object', value: { _type: 'slug', current: SLUGS[l] } })),
  seo: { _type: 'seo', noIndex: true, metaTitle: intl('internationalizedArrayStringValue', META_TITLE), metaDescription: intl('internationalizedArrayTextValue', SUMMARY) },
  shapeOfDay: { where: intl('internationalizedArrayTextValue', WHERE) },
  relatedTours: RELATED.map((r) => ({ _key: `rel_${r.replace(/[^a-z0-9]/gi, '_')}`, _type: 'reference', _ref: r })),
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: [],
  migration: { source: 'owner-locked-copy', createdFrom: SRC },
};
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) doc[f] = curlyRows(doc[f], 'en');
const targets = [...RELATED, ...CITIES, THEME, ...Object.values(G)];
const found = await client.fetch('*[_id in $ids]._id', { ids: targets });
for (const id of targets) if (!found.includes(id)) throw new Error(`reference target ${id} missing`);

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => doc[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l).filter((x) => x !== 'strong'), P[l].title, WHERE[l]], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

console.log(`NEW ${TOUR} (${existing ? 'exists: replaced' : 'created'}) — noIndex, no price, no redirects`);
for (const l of LANGS) console.log(`  ${l}: /${l === 'en' ? '' : `${l}/`}${SLUGS[l]}\n    title: ${P[l].title}\n    where: ${WHERE[l]}\n    note: ${P[l].daysNote?.lead}\n    panel: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}\n    days: ${JSON.stringify(B[l].days.map((d) => `${d.day} ${d.place} | ${d.overnight ?? '—'} | ${d.meals.map((m) => m.meal[0]).join('')}`))}`);
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) console.log(`  ${f}: ${doc[f].length}`);
console.log(`  hero from ${heroSrc._id}`);

if (apply) {
  if (existing) await writeRollback(client, [TOUR], 'before-dahabiya-9day');
  await client.createOrReplace(doc);
  console.log(`APPLIED: ${TOUR} created in production (noIndex)`);
} else console.log('dry run (pass --apply --flags-approved to write production)');
