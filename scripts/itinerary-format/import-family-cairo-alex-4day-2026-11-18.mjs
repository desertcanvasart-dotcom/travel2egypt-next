/**
 * Four Days for Families: Cairo and Alexandria, Slowed Down — publish the owner's locked
 * copy (EN/ES/JA, 18 Nov), rebuilt around the Children's Museum at the Egyptian Museum
 * (Tahrir). Owner, 18 Nov: "Keep prices, defaults" (to the review that proposed them):
 *   - prices kept: €665; ES €687, JA €701 (guideLanguagePrices, untouched)
 *   - Day 2's Khan El Khalili evening "depending on energy"
 *   - "On the sightseeing days" for the car and guide
 *   - "Worth knowing" gains: Day 4 suits an evening flight; the dress line for the
 *     churches, the synagogue and the mosque (shoes off in the mosque)
 *   - ES: «falúa» → «faluca» (a falúa is another boat), as on Elegant Cairo
 * The camel ride is included on this tour: a recorded exception (owner, open items).
 *
 *   tour  wp-page-237730   /cairo-and-alexandria-4-days-family-package
 *
 * The page receives: the locked itinerary, new titles ×3, a new summary ×3 (also the
 * meta description), the panel's route line (shapeOfDay.where), and the approved essay
 * corrections (open items 1–5, canon Gate A.3) in the passages the page shows under
 * "More about this stop": no carriage ride, no evening felucca (it is Day 1 now), no
 * al-Muizz Street, "since the medieval city", no "after his Siwa visit", no NMEC option
 * on Day 4; the essay's GEM / Heliopolis passage is removed and "Sakkara" → "Saqqara".
 * It keeps its slugs, hero, prices and relatedTours.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-family-cairo-alex-4day-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-family-cairo-alex-4day-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-family-cairo-alex-4day-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-237730';
const PRICE = 665;
const GUIDE_PRICES = { es: 687, ja: 701 };
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/4-day-cairo-and-alexandria-family';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
// JA site names contain 「・」, the row separator, so those lists are given (checked against the file).
const JA_SITES = {
  2: ['ギザのピラミッド', 'カフラー王またはメンカウラー王のピラミッド内部', 'パノラマ展望ポイント', '大スフィンクス', '河岸神殿', 'ラクダ乗り', '子ども博物館', 'ハン・ハリーリ'],
  3: ['カーイトベイの要塞', 'アレクサンドリア図書館', 'モンタザ宮殿の庭園またはコム・エル・ディッカ'],
  4: ['吊り下げ教会', 'ベン・エズラ・シナゴーグ', 'サラディンのシタデル', 'ムハンマド・アリー・モスク'],
};
const CFG = { locked: LOCKED, leadParas: true, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "4-day-cairo-and-alexandria-family" (EN/ES/JA), 18 Nov 2026, reviewed 18 Nov.';

// Essay blocks (same keys in every language).
const E = { gem: '00000000000f', giza: '00000000000d', khan: '000000000015', alex: '000000000019', qaitbay: '00000000001b', coptic: '00000000001f', citadel: '000000000021', how: '000000000027' };
const MORE = Object.fromEntries(LANGS.map((l) => [l, { 1: [], 2: [E.giza, E.khan], 3: [E.alex, E.qaitbay], 4: [E.coptic, E.citadel] }]));
// The GEM passage (with the Heliopolis "Child Museum"): the page no longer has either (open item 5).
const DROP = [E.gem];
const G = {
  plateau: 'guideArticle.giza.the-giza-plateau',
  sphinx: 'guideArticle.giza.the-great-sphinx',
  egyptianMuseum: 'guideArticle.cairo.egyptian-museum-of-antiquities',
  khan: 'guideArticle.cairo.khan-el-khalili',
  qaitbay: 'guideArticle.alexandria.qaitbey-fort',
  bibliotheca: 'guideArticle.alexandria.bibliotheca-alexandrina',
  hanging: 'guideArticle.cairo.hanging-church-al-mu-allaqa',
  benEzra: 'guideArticle.cairo.ben-ezra-synagogue',
  citadel: 'guideArticle.cairo.the-citadel-of-saladin',
  muhammadAli: 'guideArticle.cairo.mosque-of-muhammad-ali',
};
// The Children's Museum is part of the Egyptian Museum, so it links there. No guide pages
// for the felucca, the panorama, the Valley Temple, the camel, or "Montaza or Kom El Dikka".
const GUIDES = {
  1: [null, null],
  2: [G.plateau, null, null, G.sphinx, null, null, G.egyptianMuseum, G.khan],
  3: [G.qaitbay, G.bibliotheca, null],
  4: [G.hanging, G.benEzra, G.citadel, G.muhammadAli],
};
const SUMMARY = {
  en: 'A private four-day Cairo and Alexandria trip paced for families: a Nile felucca on the first evening, the pyramids and the Children’s Museum, a Mediterranean day, and Old Cairo.',
  es: 'Un viaje privado de cuatro días por El Cairo y Alejandría al ritmo de la familia: una faluca por el Nilo la primera noche, las pirámides y el Museo de los Niños, un día en el Mediterráneo y el Cairo antiguo.',
  ja: 'ご家族のペースで巡る、カイロとアレクサンドリアのプライベートな4日間。初日の夜はナイル川のファルーカ、ピラミッドと子ども博物館、地中海の一日、そしてオールド・カイロへ。',
};

/* Essay corrections (open items 1–5, 18 Nov; canon Gate A.3), run by run (some blocks
 * have italic food names). SPELL brings the page's own names into the shown passages. */
const SPELL = {
  en: [['Khan el-Khalili', 'Khan El Khalili'], ['Kom el-Dikka', 'Kom El Dikka'], ['Genizah', 'Geniza']],
  es: [['Micerinos', 'Micerino'], ['Mohamed Alí', 'Muhammad Ali'], ['Bibliotheca Alexandrina', 'Biblioteca Alejandrina'], ['fiteer', 'feteer'], ['sinagoga de Ben Ezra', 'sinagoga Ben Ezra']],
  ja: [['ハーン・ハリーリ', 'ハン・ハリーリ'], ['「懸垂教会」', '吊り下げ教会'], ['懸垂教会', '吊り下げ教会'], ['ムハンマド・アリ・モスク', 'ムハンマド・アリー・モスク'], ['サラディン城塞', 'サラディンのシタデル'], ['カイトベイ要塞', 'カーイトベイの要塞'], ['フィティール', 'フティール']],
};
const FIX = {
  en: [
    [E.giza, 'A short camel or carriage ride', 'A short camel ride'],
    [E.khan, 'Evening is Khan el-Khalili and al-Muizz Street:', 'Evening is Khan El Khalili:'],
    [E.khan, 'since the fourteenth century. If the family is up for it, a sunset felucca on the Nile is a quiet close.', 'since the medieval city.'],
    [E.alex, ' after his Siwa visit', ''],
    [E.citadel, 'A choice between two finishes. The Citadel', 'The Citadel'],
    [E.citadel, ' Or the National Museum of Egyptian Civilisation (NMEC) in Old Cairo, where the 22 royal mummies were moved in the 2021 Pharaohs\' Golden Parade, and where the lighting and pacing are markedly calmer than at the Grand Egyptian Museum\'s busier galleries.', ''],
    [E.how, 'Sakkara', 'Saqqara'],
  ],
  es: [
    [E.giza, 'Un breve trayecto en camello o en calesa de un mirador', 'Un breve trayecto en camello de un mirador'],
    [E.khan, 'La velada es Jan el-Jalili y la calle al-Muizz:', 'La velada es Jan el-Jalili:'],
    [E.khan, 'desde el siglo XIV. Si la familia tiene fuerzas, una faluca al ocaso por el Nilo es un cierre sereno.', 'desde la ciudad medieval.'],
    [E.alex, ' tras su visita a Siwa', ''],
    [E.citadel, 'Una elección entre dos cierres. La Ciudadela', 'La Ciudadela'],
    [E.citadel, ' O el Museo Nacional de la Civilización Egipcia (NMEC), en El Cairo Antiguo, adonde las 22 momias reales fueron trasladadas en el Desfile Dorado de los Faraones de 2021, y donde la iluminación y el ritmo son notablemente más tranquilos que en las galerías más concurridas del Gran Museo Egipcio.', ''],
  ],
  ja: [
    [E.giza, '視点を移動する短いラクダ乗りや馬車での移動は', '視点を移動する短いラクダ乗りは'],
    [E.khan, '夕方はハーン・ハリーリとムイッズ通り――', '夕方はハン・ハリーリ――'],
    [E.khan, '十四世紀から形を変えていない路地のゆっくりとした散歩。ご家族の体力次第で、日没のナイルでファルーカという静かな締めくくりも。', '中世から形を変えていない路地のゆっくりとした散歩。'],
    [E.alex, '紀元前331年にシワ訪問の後にアレクサンドロス大王が', '紀元前331年にアレクサンドロス大王が'],
    [E.citadel, '締めくくりは二択。サラディン城塞', 'サラディン城塞'],
    [E.citadel, 'もうひとつは旧カイロの国立エジプト文明博物館（NMEC）――2021年の「ファラオの黄金パレード」で22体の王のミイラが移送された場所で、照明と動線は混み合うGEMの大広間よりずっと落ち着いています。', ''],
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
const SAME_MEANING = { es: [], ja: [] };
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
if (tour.guideLanguagePrices?.es !== GUIDE_PRICES.es || tour.guideLanguagePrices?.ja !== GUIDE_PRICES.ja) throw new Error(`guide-language prices changed: ${JSON.stringify(tour.guideLanguagePrices)}`);

/* ---------- essay corrections ---------- */
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const body = tour.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  const shown = new Set(Object.values(MORE[l]).flat());
  for (const ref of Object.values(E)) if (!keys.has(ref)) throw new Error(`${l}: essay block ${ref} missing`);
  return {
    ...row,
    value: row.value.filter((b) => !DROP.includes(b._key)).map((b) => {
      const fixes = FIX[l].filter(([k]) => k === b._key);
      if (!fixes.length && !shown.has(b._key)) return b;
      let children = b.children.map((c) => ({ ...c }));
      for (const [, find, repl] of fixes) {
        const alts = [find, find.replace(/’/g, "'"), find.replace(/'/g, '’')];
        const i = children.findIndex((c) => alts.some((f) => c.text.includes(f)));
        if (i < 0 && repl && children.some((c) => c.text.includes(repl))) continue; // re-run: already applied
        if (i < 0 && !repl) continue; // re-run: a removal already made
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i] = { ...children[i], text: children[i].text.replace(alts.find((f) => children[i].text.includes(f)), repl) };
      }
      if (shown.has(b._key)) children = children.map((c) => ({ ...c, text: SPELL[l].reduce((t, [a, z]) => t.replaceAll(a, z), c.text) }));
      return { ...b, children };
    }),
  };
});
// Nothing the page shows may keep a dropped stop or an older name.
const RETIRED = {
  en: /carriage|Siwa|Muizz|felucca|NMEC|Grand Egyptian|Heliopolis|fourteenth century\.|el-Khalili|Genizah|el-Dikka|choice between/,
  es: /calesa|Siwa|Muizz|faluca|NMEC|Gran Museo|Heliópolis|Micerinos|Mohamed|fiteer|elección entre/,
  ja: /馬車|シワ|ムイッズ|ファルーカ|NMEC|GEM|ヘリオポリス|ハーン|懸垂|十四世紀から|二択/,
};
for (const row of body) {
  if (row.value.some((b) => DROP.includes(b._key))) throw new Error(`${row._key}: the GEM passage was not removed`);
  for (const b of row.value) if (Object.values(MORE[row._key]).flat().includes(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: still has ${textOf(b).match(RETIRED[row._key])[0]}`);
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
    _key: prev.get(d.day)?._key ?? `fam-${l}-${d.day}`,
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
    included: p.included.map((t, i) => fact(`fam-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`fam-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`fam-opt-${l}-${i}`, l, t)),
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
  seo: { ...(tour.seo ?? { _type: 'seo' }), metaDescription: LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: SUMMARY[l] })) },
};
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) set[f] = curlyRows(set[f], 'en');
{
  // The page and search may not send families to Heliopolis for the Children's Museum.
  const after = { ...tour, ...set, body: null, migration: null };
  const j = JSON.stringify(after, (key, v) => (key === 'source' ? undefined : v));
  const hit = j.match(/.{0,80}(Heliopolis|Heliópolis|ヘリオポリス).{0,40}/);
  if (hit) throw new Error(`a field still says Heliopolis: ${hit[0]}`);
}

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
  await writeRollback(client, [TOUR], 'before-family-cairo-alex-4day');
  await client.patch(TOUR).set(set).commit();
  console.log(`APPLIED to production ${TOUR}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
