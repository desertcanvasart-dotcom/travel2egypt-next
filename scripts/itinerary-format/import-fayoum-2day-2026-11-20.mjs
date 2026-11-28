/**
 * Fayoum Desert in Two Days: Wadi al-Hitan, Wadi al-Rayan & Lake Qarun (wp-page-156014,
 * /fayoum-desert-adventure; slugs unchanged, no redirect) in the multi-day format, EN/ES/JA, from
 * the owner's locked files and open items (19 Nov).
 *
 * MOVED FROM DAY TOURS TO PACKAGES (owner, 20 Nov: "take this tour from day tours to multi-day
 * tours and add it under adventure"): type dayTour → package, theme → theme-adventure (the
 * /multiday-adventure-and-safari-tours landing lists packages by theme), durationDays 2. It leaves
 * the private day-tour lists and joins the private packages hub and the adventure landing.
 *
 * The product: Day 1 Cairo → Wadi al-Hitan → Tzila Lodge (half board); Day 2 Wadi al-Rayan and its
 * waterfalls (sandboarding included) → lunch → Lake Qarun → Gebel Qatrani → Cairo. An Egyptologist
 * in your language with a desert guide; all meals from lunch on Day 1 to lunch on Day 2; water both
 * days; no tiers, no age line; children under 12 pay 50 %. The open items' five "To confirm" points
 * (4×4, Gebel Qatrani entry, the desert guide's language, Tunis village, Day 2 timing) are not
 * guessed: the copy is written as locked.
 *
 * Writes: type, theme, durationDays, title ×3, summary ×3 (= the locked Opening), itinerary days,
 * intro (panel and stay rows as written), included / not included, options, route legs, the essay
 * corrections (Gate A.3), and the price (fayoum-2day-prices.json; --apply refuses while null:
 * Autoura has no template and no Wadi al-Hitan / Wadi al-Rayan fee yet). Hero and slugs unchanged.
 *
 * Essay ("More about this stop", corrections 1–8): Day 1 shows the Wadi al-Hitan paragraph without
 * its Gebel Qatrani sentence (7); Day 2 shows Wadi al-Rayan ("Egypt's best-known waterfalls" (1),
 * sandboarding included (8)) and Lake Qarun (no Predynastic claim (6), no Lost Land (5)) with Gebel
 * Qatrani moved there and "a key site for the study of whale evolution" (4). The lodge and meal
 * paragraphs ("desert-themed", "simple") are left out; corrections 2 and 3 are applied to them anyway.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-fayoum-2day-2026-11-20.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-fayoum-2day-2026-11-20.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-fayoum-2day-2026-11-20.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const ID = 'wp-page-156014';
const THEME = 'theme-adventure';
const OLD = { from: 150, es: 161, ja: 168 };
const PRICES = JSON.parse(readFileSync(new URL('./fayoum-2day-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/2-day-fayoum-desert';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
const CFG = {
  locked: LOCKED,
  dayTitles: true,
  jaSites: { 1: ['ワディ・アル・ヒタン'] },
};
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "fayoum-desert-2-day-trip" (EN/ES/JA) and open items, 19 Nov 2026.';

// "More about this stop": Day 1 the Wadi al-Hitan paragraph; Day 2 Wadi al-Rayan and Lake Qarun.
// The same block keys in every locale.
const MORE = { 1: ['00000000000c'], 2: ['000000000011', '000000000015'] };
// Only Wadi al-Rayan has a guide page (Wadi al-Hitan, Lake Qarun and Gebel Qatrani have none).
const RAYAN = 'guideArticle.al-fayoum.wadi-al-rayan';
const GUIDES = { 1: [null], 2: [RAYAN, RAYAN, null, null] };
const ROUTE = {
  en: [['Cairo', 'Tzila Lodge', ['Wadi al-Hitan'], 1], ['Tzila Lodge', 'Cairo', ['Wadi al-Rayan', 'Lake Qarun', 'Gebel Qatrani']]],
  es: [['El Cairo', 'Tzila Lodge', ['Wadi al-Hitan'], 1], ['Tzila Lodge', 'El Cairo', ['Wadi al-Rayan', 'lago Qarun', 'Gebel Qatrani']]],
  ja: [['カイロ', 'ツィラ・ロッジ', ['ワディ・アル・ヒタン'], 1], ['ツィラ・ロッジ', 'カイロ', ['ワディ・アル・ラヤン', 'カルーン湖', 'ゲベル・カトラーニ']]],
};
// [block, find, replace] — corrections 1, 4–8 on the shown paragraphs; 2 and 3 on hidden ones.
const FIX = {
  en: [
    ['000000000007', 'with an English-speaking guide', 'with an Egyptologist in your language and a desert guide'], // 3 (hidden)
    ['00000000000c', 'Day one: Wadi al-Hitan and Gebel Qatrani.', 'Day one: Wadi al-Hitan.'], // 7
    ['00000000000c', " After lunch, the afternoon takes in the Gebel Qatrani open-air museum to the north — petrified wood, the same Eocene formations — and explains why the Fayoum's geology is one of the most studied vertebrate fossil zones in the world.", ''], // 7, 4
    ['000000000011', 'Day two: Wadi al-Rayan and Lake Qarun.', 'Day two: Wadi al-Rayan, Lake Qarun and Gebel Qatrani.'], // 7
    ['000000000011', 'the only natural waterfalls in Egypt', "Egypt's best-known waterfalls"], // 1
    ['000000000011', 'with optional sandboarding on the dunes nearby if the group wants it.', 'with sandboarding on the dunes nearby, included if you want it.'], // 8
    ['000000000015', 'The day closes at ', 'After lunch comes '], // before the bold «Lake Qarun»
    ['000000000015', 'an ancient body of water that has been continuously occupied since the Predynastic period and that supported', 'an ancient body of water that supported'], // 6
    ['000000000015', 'The waterfront at the Lost Land area is for birdwatching and a slower close to the trip. The return drive', 'The lakeshore is for birdwatching and a slower pace. Then Gebel Qatrani, north of the lake: petrified wood in the same Eocene formations as the whales, part of why the Fayoum is a key site for the study of whale evolution. The return drive'], // 5, 7, 4
    ['000000000029', 'the two-night version', 'the two-day version'], // 2 (hidden)
  ],
  es: [
    ['000000000007', 'con guía angloparlante', 'con un egiptólogo en su idioma y un guía del desierto'],
    ['00000000000c', 'Día uno: Wadi al-Hitan y Gebel Qatrani.', 'Día uno: Wadi al-Hitan.'],
    ['00000000000c', ' Tras el almuerzo, la tarde incluye el museo al aire libre de Gebel Qatrani, al norte —madera petrificada, las mismas formaciones eocenas— y explica por qué la geología del Fayum es una de las zonas de fósiles de vertebrados más estudiadas del mundo.', ''],
    ['000000000011', 'Día dos: Wadi al-Rayan y el lago Qarun.', 'Día dos: Wadi al-Rayan, el lago Qarun y Gebel Qatrani.'],
    ['000000000011', 'constituyen las únicas cascadas naturales de Egipto', 'son las cascadas más conocidas de Egipto'],
    ['000000000011', 'con la posibilidad opcional de sandboarding en las dunas cercanas si el grupo lo pide.', 'con sandboarding en las dunas cercanas, incluido si lo desea.'],
    ['000000000015', 'El día se cierra en el ', 'Después del almuerzo llega el '],
    ['000000000015', 'una masa de agua antigua, habitada de forma continua desde el período predinástico y vinculada', 'una masa de agua antigua, vinculada'],
    ['000000000015', 'La orilla del área conocida como Lost Land se presta a la observación de aves y a un cierre tranquilo del viaje. La vuelta', 'Su orilla se presta a la observación de aves y a un ritmo más tranquilo. Después, Gebel Qatrani, al norte del lago: madera petrificada en las mismas formaciones eocenas que las ballenas, parte de lo que hace del Fayum un lugar clave para estudiar la evolución de las ballenas. La vuelta'],
  ],
  ja: [
    ['000000000007', '英語ガイド', 'お客様の言語のエジプト学者と砂漠ガイド'],
    ['00000000000c', '一日目：ワディ・アル・ヒタンとゲベル・カトラニ。', '一日目：ワディ・アル・ヒタン。'],
    ['00000000000c', '昼食のあと、午後はゲベル・カトラニの屋外博物館へ。珪化木、同じ始新世の地層。ファイユームの地質が、世界でもっとも研究されている脊椎動物化石帯のひとつである理由が、見えてきます。', ''],
    ['000000000011', '二日目：ワディ・アル・ラヤンとカルーン湖。', '二日目：ワディ・アル・ラヤン、カルーン湖、ゲベル・カトラニ。'],
    ['000000000011', '控えめながら、エジプト唯一の自然の滝です。', '控えめながら、エジプトでいちばんよく知られた滝です。'],
    ['000000000011', 'ご希望があれば、近くの砂丘でサンドボーディングも。', 'ご希望があれば、近くの砂丘でサンドボーディングも（料金に含まれます）。'],
    ['000000000015', '一日の締めくくりは', '昼食のあとは'],
    ['000000000015', '先王朝期から人々が暮らしを続けてきた古い水域です。', '古い水域です。'],
    ['000000000015', '「失われた土地」と呼ばれるエリアの湖畔は、野鳥観察と、旅をゆっくり終わらせるための場所です。', '湖畔は、野鳥観察とゆったりした時間のための場所です。そのあと湖の北のゲベル・カトラニへ。クジラと同じ始新世の地層に珪化木が残り、ファイユームがクジラの進化を研究するうえで重要な場所である理由のひとつになっています。'],
  ],
};
// Nothing "More about this stop" shows may keep what the page corrects.
const RETIRED = {
  en: /only natural waterfalls|Predynastic|Lost Land|most studied|desert-themed|optional sandboarding|English-speaking|and Gebel Qatrani\. The drive/i,
  es: /únicas cascadas naturales|predinástico|Lost Land|más estudiadas|inspiración desértica|opcional de sandboarding|angloparlante/i,
  ja: /唯一の自然の滝|先王朝期|失われた土地|もっとも研究されている|砂漠をテーマ|英語ガイド/,
};

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.length, d.sites.length, d.meals.map((m) => m.meal), d.optional.length, !!d.overnight]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
const flat = (p) => {
  const o = { opening: p.opening, why: p.whyRoute, closing: p.closingLine };
  for (const d of p.days) { o[`d${d.day}.title`] = d.title; (d.body ?? []).forEach((t, i) => (o[`d${d.day}.b${i}`] = t)); o[`d${d.day}.travel`] = d.travel; if (d.pace) o[`d${d.day}.pace`] = d.pace; }
  p.panelRows.forEach((r, i) => (o[`panel${i}`] = r.text)); p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Checked by hand (20 Nov), same meaning as EN: ES in2 «los dos días» = "both days" (the gate reads «dos» as 2); ES d1.b0 «cuarenta millones» = "forty million" (the gate reads 40 vs 40,000,000).
// JA writes 百キロ / 四千万 (opening), 二時間・六時間 (why) and 約十時間 (wk0) in kanji numerals; 「2食付き」
// (panel2, stay0, in3) is "half board" (two meals); 「2日間」 (in2) is "both days"; d1.b0 「四十五分」「約四千万年前」 are kanji (45 minutes, forty million).
const SAME_MEANING = { es: ['in2', 'd1.b0'], ja: ['opening', 'why', 'panel2', 'stay0', 'in2', 'in3', 'wk0', 'd1.b0'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), loc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete loc[key]; console.log(`numeric gate (${l}): ${key} checked by hand`); }
  numericGate(en, loc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} missing`);
if (await client.getDocument(`drafts.${ID}`)) throw new Error(`drafts.${ID} exists — handle it first`);
if (!['dayTour', 'package'].includes(doc.type)) throw new Error(`unexpected type ${doc.type}`);
if (!(await client.getDocument(THEME))) throw new Error(`${THEME} missing`);
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.en, PRICES.es, PRICES.ja].join(), ',,'].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const ref of Object.values(MORE).flat()) if (!keys.has(ref)) throw new Error(`${l}: essay block ${ref} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
      const fixes = FIX[l].filter(([k]) => k === b._key);
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

for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const shown = new Set(Object.values(MORE).flat());
  for (const b of row.value) if (shown.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this stop" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
}
const para = (text, i) => ({ _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text, marks: [] }] });
const fact = (key, l, text) => ({ _key: key, _type: 'productFact', lang: l, text, source: SRC, needsReview: false });
const row = (key, r) => ({ _key: key, _type: 'labelledRow', label: r.label, text: r.text });
function build(l) {
  const p = P[l];
  const prev = new Map((doc.itineraryDays ?? []).filter((r) => r.lang === l).map((r) => [r.day, r]));
  const days = p.days.map((d) => ({
    _key: prev.get(d.day)?._key ?? `fay-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    body: d.body.map(para),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, pace: d.pace,
    optional: [],
    narrativeRefs: MORE[d.day],
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
    included: p.included.map((t, i) => fact(`fay-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`fay-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`fay-opt-${l}-${i}`, l, t)),
    legs: ROUTE[l].map(([from, to, via, nights], i) => ({ _key: `fay-leg-${l}-${i}`, _type: 'routeLeg', lang: l, from, to, ...(via ? { via } : {}), mode: 'road', ...(nights ? { nights } : {}), source: SRC, needsReview: false })),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
const set = {
  // Day tours → multi-day tours, under adventure (owner, 20 Nov).
  type: 'package',
  theme: { _type: 'reference', _ref: THEME },
  durationDays: 2,
  ...(ready ? { priceFrom: PRICES.en, guideLanguagePrices: { ...(doc.guideLanguagePrices ?? { _type: 'object' }), es: PRICES.es, ja: PRICES.ja } } : {}),
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
for (const [f, v] of Object.entries(set)) console.log(Array.isArray(v) ? `${f}: ${(doc[f] ?? []).length} → ${v.length}` : `${f}: ${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`);
// Owner rule (27 Nov): a missing Autoura price never holds the itinerary back. Unpriced, the
// page publishes with the old day-tour price REMOVED (it priced a different, one-day trip).
if (!ready) console.log(`prices: NOT READY — publishing WITHOUT a price (removes ${priceNow}); fill fayoum-2day-prices.json from Autoura and re-run to add it.`);
for (const l of LANGS) for (const b of body.find((x) => x._key === l).value) {
  const before = doc.body.find((x) => x._key === l).value.find((x) => x._key === b._key);
  if (textOf(before) !== textOf(b)) console.log(`essay ${l} ${b._key}: …${textOf(b).slice(-140)}`);
}

if (previewOut) {
  const ids = Object.values(GUIDES).flat().filter(Boolean);
  const refs = await client.fetch(`*[_id in $ids]`, { ids });
  const cities = await client.fetch(`*[_id in $ids]`, { ids: [...(doc.cities ?? []).map((c) => c._ref), ...refs.map((r) => r.parentCity?._ref).filter(Boolean)] });
  const theme = await client.fetch('*[_id == $t || (_type == "tourLanding" && themeRef._ref == $t)]', { t: THEME });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities, ...theme];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'type', 'durationDays', 'themeLanding', 'priceFrom', 'approvedInclusions', 'approvedExclusionRows', 'itineraryFormat', 'approvedOptions', 'approvedRoute'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [ID], 'before-fayoum-2day');
  await client.patch(ID).set(set).unset(ready ? [] : ['priceFrom', 'guideLanguagePrices']).commit();
  console.log(`APPLIED to production ${ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
