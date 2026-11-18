/**
 * The Elegant Cairo: 4 Days — publish the owner's locked copy (EN/ES/JA, 18 Nov).
 * Owner, 18 Nov: "Keep prices, defaults" (to the review that proposed them):
 *   - prices kept: €1,450; ES €1,472, JA €1,486 (guideLanguagePrices, untouched)
 *   - breakfast every day (the Four Seasons rate is with breakfast)
 *   - a Friday line: the mosques close for the midday prayer, so that day they move to after lunch
 *   - headscarves: bring your own
 *   - "Every day: your own Egyptologist" → "On the sightseeing days" (Days 1 and 4 are transfers)
 *   - ES: «de inspiración falúa» → «con temática de faluca» (a falúa is another boat)
 * The Day 3 meals line is written "lunch (Naguib Mahfouz Restaurant)", as the JA file has
 * it, because the page shows a meal's note in brackets.
 *
 *   tour  wp-page-86851   /the-elegant-cairo-4-days-tour
 *
 * The page receives: the locked itinerary (days, intro with the panel and stay rows,
 * included / not included, Khufu as Day 2's optional extra), the new titles ×3, a new
 * summary ×3 (also the meta description), the panel's route line (shapeOfDay.where), and
 * the essay corrections (open items, canon Gate A.3) in the passages the page shows
 * under "More about this stop", plus the approved title/superlative fixes elsewhere in
 * the essay. No route legs: the tour stays in Greater Cairo (the old unreviewed legs are
 * removed). It keeps its slugs, hero, prices and relatedTours.
 *
 * Days 2 and 3 have Morning / Midday / … parts, each with a bold lead, stored as
 * paragraphs (parser leadParas), as on Minya and Sinai. Days 1 and 4 have no sites.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-elegant-cairo-4day-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-elegant-cairo-4day-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-elegant-cairo-4day-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-86851';
const PRICE = 1450;
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/4-day-elegant-cairo';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
// JA site names contain 「・」, the row separator, so the JA lists are given (checked against the file).
const JA_SITES = {
  2: ['大エジプト博物館', 'ツタンカーメンのギャラリー', 'ギザのピラミッド', 'カフラー王またはメンカウラー王のピラミッド内部', 'パノラマ展望ポイント', '大スフィンクス', '河岸神殿', 'ラクダ乗り'],
  3: ['国立エジプト文明博物館', '王家のミイラの間', '吊り下げ教会', 'コプト博物館', 'ベン・エズラ・シナゴーグ', 'スルタン・ハサンのモスク・マドラサ', 'リファーイー・モスク', 'ハン・ハリーリ'],
};
const CFG = { locked: LOCKED, leadParas: true, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "4-day-elegant-cairo" (EN/ES/JA), 18 Nov 2026, reviewed 18 Nov.';

// Essay blocks (same keys in every language).
const E = { h2: '000000000001', civ: '000000000007', order: '000000000011', nmec: '000000000013', giza: '000000000015', third: '000000000019', old: '00000000001b', khan: '00000000001d' };
// "More about this stop": Day 2 = the collection-before-the-monuments logic and Giza;
// Day 3 = the NMEC, Cairo's other history, Old Cairo, and Khan El Khalili.
const MORE = Object.fromEntries(LANGS.map((l) => [l, { 1: [], 2: [E.order, E.giza], 3: [E.nmec, E.third, E.old, E.khan], 4: [] }]));
// Guide links. No guide pages for the GEM, the NMEC, Al-Rifai, the Valley Temple, the panorama or the camel.
const G = {
  plateau: 'guideArticle.giza.the-giza-plateau',
  sphinx: 'guideArticle.giza.the-great-sphinx',
  hanging: 'guideArticle.cairo.hanging-church-al-mu-allaqa',
  coptic: 'guideArticle.cairo.the-coptic-museum',
  benEzra: 'guideArticle.cairo.ben-ezra-synagogue',
  hassan: 'guideArticle.cairo.mosque-madrassa-of-sultan-hassan',
  khan: 'guideArticle.cairo.khan-el-khalili',
};
const GUIDES = {
  1: [],
  2: [null, null, G.plateau, null, null, G.sphinx, null, null],
  3: [null, null, G.hanging, G.coptic, G.benEzra, G.hassan, null, G.khan],
  4: [],
};
const SUMMARY = {
  en: 'A private four-day luxury break in Cairo: the Grand Egyptian Museum before the pyramids, the royal mummies, Coptic and Islamic Cairo, and three nights at the Four Seasons.',
  es: 'Una escapada privada de lujo de cuatro días en El Cairo: el Gran Museo Egipcio antes que las pirámides, las momias reales, el Cairo copto e islámico, y tres noches en el Four Seasons.',
  ja: 'カイロで過ごすプライベートなラグジュアリー4日間。ピラミッドの前に大エジプト博物館へ。王家のミイラ、コプト地区とイスラーム地区を訪ね、フォーシーズンズに3泊します。',
};

/* Essay corrections (open items, 18 Nov; canon Gate A.3). The NMEC passage moves to Day 3,
 * so its Day 2 lunch and "the world you are about to visit" go. The page's own names
 * (SPELL) replace the essay's older ones in the passages the page shows. */
const SPELL = {
  en: [['al-Muallaqah', 'al-Muallaqa'], ['Khan el-Khalili', 'Khan El Khalili']],
  es: [['Guiza', 'Giza'], ['Micerinos', 'Micerino'], ['Naguib Mahfouz', 'Naguib Mahfuz'], ['al-Muallaqah', 'al-Muallaqa']],
  ja: [['ハーン・ハリーリ', 'ハン・ハリーリ'], ['ハンギング・チャーチ', '吊り下げ教会']],
};
const FIX = {
  en: [
    [E.h2, 'Four Days in the City That Invented Civilisation', 'Four Days in the Ancient and the Living City'],
    [E.civ, 'one of the longest continuous civilisations in human history', 'a long, continuous civilisation'],
    [E.nmec, 'These are the actual remains of the people who built the world you are about to visit. Lunch is taken at the Oberoi\'s felucca-themed restaurant on the Nile.', 'These are the actual remains of the people who built the world you saw at Giza.'],
    [E.old, 'holds the most complete collection of Coptic art in the world', 'holds one of the world’s great collections of Coptic art'],
    [E.old, 'a cache of nearly 300,000 manuscript fragments', 'a cache of about 300,000 manuscript fragments'],
    [E.khan, 'Lunch is at the Naguib Mahfouz Café in Khan el-Khalili: a restaurant named for', 'Lunch is at the Naguib Mahfouz Restaurant in Khan el-Khalili, named for'],
    [E.khan, 'since the Mamluk sultan Barquq laid it out in 1382', 'since the emir Jaharkas al-Khalili founded it in 1382'],
  ],
  es: [
    [E.h2, 'cuatro días en la ciudad que inventó la civilización', 'cuatro días en la ciudad antigua y viva'],
    [E.civ, 'una de las civilizaciones continuas más largas de la historia humana', 'una civilización larga y continua'],
    [E.nmec, 'Son los restos reales de las personas que construyeron el mundo que se está a punto de visitar. El almuerzo se toma en el restaurante de inspiración fluvial del Oberoi sobre el Nilo.', 'Son los restos reales de las personas que construyeron el mundo que viste en Giza.'],
    [E.old, 'guarda la colección más completa de arte copto del mundo', 'guarda una de las grandes colecciones de arte copto del mundo'],
    [E.old, 'un fondo de cerca de 300 000 fragmentos manuscritos', 'un fondo de unos 300.000 fragmentos manuscritos'],
    [E.khan, 'El almuerzo es en el café Naguib Mahfouz en Jan el-Jalili: un restaurante que toma el nombre', 'El almuerzo es en el restaurante Naguib Mahfouz, en Jan el-Jalili, que toma el nombre'],
    [E.khan, 'desde que el sultán mameluco Barquq lo trazó en 1382', 'desde que el emir Jaharkas al-Jalili lo fundó en 1382'],
  ],
  ja: [
    [E.h2, '文明を発明した街での4日間', '古代と今が息づく都での4日間'],
    [E.civ, '人類史上もっとも長く続いた文明のひとつ', '長く途切れることなく続いてきた文明'],
    [E.nmec, 'これは、これから訪ねる世界を築いた人々の、実際の遺骸です。昼食はナイル上のオベロイ系のフェルッカをモチーフにしたレストランで。', 'これは、ギザで目にした世界を築いた人々の、実際の遺骸です。'],
    [E.old, '世界で最も完全なコプト美術のコレクション', '世界有数のコプト美術のコレクション'],
    [E.khan, '「ナギーブ・マフフーズ・カフェ」で。', '「ナギーブ・マフフーズ・レストラン」で。'],
    [E.khan, '1382年にマムルーク朝のスルタン・バルクークが整備して以来', '1382年にアミール、ジャハルカス・アル＝ハリーリーが創設して以来'],
  ],
};

// The EN panel's guide row carries an authoring note for the other languages.
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
  for (const d of p.days) { o[`d${d.day}.t`] = d.title; (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = paraText(s))); o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace; d.optional.forEach((x, i) => (o[`d${d.day}.o${i}`] = x)); }
  p.panelRows.forEach((r, i) => (o[`panel${i}`] = r.text)); p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Same meaning, checked by hand 18 Nov (the gate does not read Roman numerals or «veintidós»):
//   ES d2.b2: "25th century BC" = «siglo XXV a. C.».
//   ES d3.b0: "twenty-two" = «veintidós», "two towers" = «dos torres», "19th-century" = «siglo XIX», 300,000 = 300.000.
//   JA d3.b0: "twenty-two" = 22人 (the gate reads the EN word as 20).
//   JA d3.b3: "after six centuries" = 600年 (6世紀 would read "the 6th century"; open items).
const SAME_MEANING = { es: ['d2.b2', 'd3.b0'], ja: ['d3.b0', 'd3.b3'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const tour = await client.getDocument(TOUR);
if (!tour) throw new Error(`${TOUR} not found`);
if (tour.durationDays !== 4) throw new Error('not a 4-day document');
if (tour.priceFrom !== PRICE) throw new Error(`price is ${tour.priceFrom}, expected the owner's €${PRICE}`);
if (tour.guideLanguagePrices?.es !== 1472 || tour.guideLanguagePrices?.ja !== 1486) throw new Error(`guide-language prices changed: ${JSON.stringify(tour.guideLanguagePrices)}`);

/* ---------- essay corrections ---------- */
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const body = tour.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  const shown = new Set(Object.values(MORE[l]).flat());
  for (const ref of [...shown, ...Object.values(E)]) if (!keys.has(ref)) throw new Error(`${l}: essay block ${ref} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
      const fixes = FIX[l].filter(([k]) => k === b._key);
      if (!fixes.length && !shown.has(b._key)) return b;
      let children = b.children.map((c) => ({ ...c }));
      for (const [, find, repl] of fixes) {
        const alts = [find, find.replace(/’/g, "'"), find.replace(/'/g, '’')];
        const i = children.findIndex((c) => alts.some((f) => c.text.includes(f)));
        if (i < 0 && children.some((c) => c.text.includes(repl))) continue; // re-run: already applied
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i] = { ...children[i], text: children[i].text.replace(alts.find((f) => children[i].text.includes(f)), repl) };
      }
      if (shown.has(b._key)) children = children.map((c) => ({ ...c, text: SPELL[l].reduce((t, [a, z]) => t.replaceAll(a, z), c.text) }));
      return { ...b, children };
    }),
  };
});
// Nothing the page shows may keep a retired spelling or a corrected claim.
const RETIRED = {
  en: /Barquq|Café|Oberoi|about to visit|most complete|nearly 300|Muallaqah|el-Khalili|Invented/,
  es: /Barquq|café|Oberoi|a punto de visitar|más completa|cerca de 300|Guiza|Micerinos|Mahfouz|inventó/,
  ja: /バルクーク|カフェ|オベロイ|これから訪ねる|最も完全|ハーン|ハンギング|発明/,
};
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
  if (p.days.map((d) => d.optional.length).join() !== '0,1,0,0') throw new Error(`${l}: expected one optional extra, on Day 2`);
  const days = p.days.map((d) => ({
    _key: prev.get(d.day)?._key ?? `elc-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    body: d.body.map(para),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
    // Khufu: its "Not included" row says the same, so no link is needed.
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
    included: p.included.map((t, i) => fact(`elc-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`elc-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`elc-opt-${l}-${i}`, l, t)),
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
  routeLegs: [],
  shapeOfDay: { ...(tour.shapeOfDay ?? {}), where: LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: WHERE[l] })) },
  seo: { ...(tour.seo ?? {}), metaDescription: LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: SUMMARY[l] })) },
};
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) set[f] = curlyRows(set[f], 'en');

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  // 'strong' is the bold mark on the lead words, not copy.
  verbatimPreflight([...visibleStrings(rows, l).filter((x) => x !== 'strong'), P[l].title, WHERE[l]], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

console.log('BEFORE:');
for (const l of LANGS) {
  console.log(`  title ${l}: ${loc(tour.title, l)?.value}`);
  console.log(`  summary ${l}: ${String(loc(tour.summary, l)?.value).slice(0, 110)}`);
}
console.log(`  price €${tour.priceFrom} ${JSON.stringify(tour.guideLanguagePrices)} (kept)`);
console.log('AFTER:');
for (const l of LANGS) console.log(`  title ${l}: ${P[l].title}\n  summary ${l}: ${SUMMARY[l]}\n  where ${l}: ${WHERE[l]}\n  panel ${l}: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}\n  meals ${l}: ${JSON.stringify(B[l].days.map((d) => d.meals.map((m) => m.meal + (m.note ? `(${m.note})` : ''))))}`);
for (const [f, v] of Object.entries(set)) console.log(`${f}: ${Array.isArray(tour[f]) ? tour[f].length : JSON.stringify(tour[f] ?? null)?.slice(0, 60)} → ${Array.isArray(v) ? v.length : JSON.stringify(v).slice(0, 60)}`);
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
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'shapeOfDay', 'approvedInclusions', 'approvedExclusionRows', 'itineraryFormat', 'approvedOptions', 'approvedRoute'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [TOUR], 'before-elegant-cairo-4day');
  await client.patch(TOUR).set(set).commit();
  console.log(`APPLIED to production ${TOUR}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
