/**
 * The merged family page: "Eight Days for Families: Cairo and the Nile Cruise" (wp-page-237732) absorbs the "9-Day
 * Classic Egypt Family Tour" (wp-page-113005). Owner, 23 Nov: "merge both, start with the family"; answers: M/S Sara,
 * Pyramids Park Resort or similar, bed and breakfast, lunches on sightseeing days, no dinners in Cairo, cooking class
 * "ask us", Nubian music already on the ship, 50 % under 12, free under 2.
 *
 * The 8-day family tour is the base (its four cruise nights add up; the 9-day page's own days run six nights while it says
 * four). Updates wp-page-237732 IN PLACE (same _id and slugs; price, hero, theme, cities untouched): new itinerary-format
 * copy, the live essay kept with corrections (no tame crocodile, no "largest stone building", "first cataract", ...).
 * The 9-day page and its redirects are a second step (retire-family-2026-11-23.mjs).
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-family-merged-2026-11-23.mjs              # dry run
 *   node --env-file=<.env> scripts/itinerary-format/import-family-merged-2026-11-23.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-237732';
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/8-day-cairo-and-nile-cruise-family';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
const JA_SITES = {
  3: ['サラディンのシタデル', 'ムハンマド・アリ・モスク', 'ハンギング・チャーチ', 'ベン・エズラ・シナゴーグ', 'ハーン・ハリーリ', 'アル・ムイッズ通り'],
  6: ['エドフのホルス神殿', 'コム・オンボ神殿', 'ワニ博物館'],
  7: ['アスワン・ハイ・ダム', '切りかけのオベリスク', 'フィラエ神殿', 'ファルーカ', 'ヌビアの村', 'ヌビアの音楽と踊り'],
};
const CFG = { locked: LOCKED, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const SRC = 'Owner locked copy "8-day-cairo-and-nile-cruise-family" (EN/ES/JA), 23 Nov 2026.';

const G = {
  giza: 'guideArticle.giza.the-giza-plateau', sphinx: 'guideArticle.giza.the-great-sphinx',
  citadel: 'guideArticle.cairo.the-citadel-of-saladin', aliMosque: 'guideArticle.cairo.mosque-of-muhammad-ali',
  hanging: 'guideArticle.cairo.the-hanging-church', benEzra: 'guideArticle.cairo.ben-ezra-synagogue',
  khan: 'guideArticle.cairo.khan-el-khalili', muizz: 'guideArticle.cairo.sharia-al-muizz-li-din-allah',
  luxorTemple: 'guideArticle.luxor.the-luxor-temple',
  vok: 'guideArticle.luxor.valley-of-the-kings', hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut', colossi: 'guideArticle.luxor.the-colossi-of-memnon',
  edfu: 'guideArticle.edfu.edfu-temple', komOmbo: 'guideArticle.kom-ombo.the-temple-of-kom-ombo',
  obelisk: 'guideArticle.aswan.the-unfinished-obelisk', philae: 'guideArticle.aswan.the-philae-temple',
};
// null = no guide page for that site.
const GUIDES = {
  1: [],
  2: [G.giza, G.sphinx, null, null],
  3: [G.citadel, G.aliMosque, G.hanging, G.benEzra, G.khan, G.muizz],
  4: [G.luxorTemple],
  5: [G.vok, G.hatshepsut, G.colossi, null],
  6: [G.edfu, G.komOmbo, null],
  7: [null, G.obelisk, G.philae, null, null, null],
  8: [],
};
const SUMMARY = {
  en: 'A private eight-day family journey: three days in Cairo, a flight south, four nights on the M/S Sara from Luxor to Aswan with a hieroglyphics workshop and a Nubian village, and a flight home, paced for children.',
  es: 'Un viaje familiar privado de ocho días: tres días en El Cairo, un vuelo al sur, cuatro noches en el M/S Sara de Luxor a Asuán con un taller de jeroglíficos y un pueblo nubio, y un vuelo de regreso, a ritmo de niños.',
  ja: 'ご家族のためのプライベートな8日間の旅。カイロで3日間、南へのフライト、M/S サラ号でルクソールからアスワンまで4泊（ヒエログリフ教室とヌビアの村）、そして帰りのフライト。お子様に合わせたペースです。',
};

const panelText = (l, t) => (l === 'en' ? t.replace(/\s*\*\(ES:.*\)\*\s*$/, '') : t);
const paraText = (s) => (typeof s === 'string' ? s : `${s.lead} ${s.text}`);

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.map((s) => typeof s), d.segments?.length ?? 0, d.sites.length, d.meals.map((m) => [m.meal, !!m.note]), d.optional.length, !!d.overnight, !!d.pace]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length, note: !!p.daysNote });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
if (P.en.days.length !== 8) throw new Error(`expected 8 days, found ${P.en.days.length}`);
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
const SAME_MEANING = { es: [], ja: [] };
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

/* ---------- essay: the live body, kept, with the open-items corrections ---------- */
const k = (n) => `0000000000${n}`;
const ESSAY_FIX = {
  en: {
    5: [[", with Khufu's still the largest stone building on earth at 4,500 years old", '']],
    6: [['in a single curated route for the first time in history', 'in a single route']],
    17: [['displaced roughly 100,000 Nubians whose villages', 'displaced more than 100,000 people whose villages'], ['Philae, Abu Simbel and a dozen other temples', 'Philae, Abu Simbel and some twenty other monuments']],
    18: [['the lower cataract', 'the first cataract']],
    19: [['painted bright the way the High Dam erased', 'painted in bright colours'], [', see the geographic counterpoint, hold a tame crocodile if the family is up for it', ' and see the geographic counterpoint']],
    23: [['a Sakkara morning', 'a Saqqara morning']],
  },
  es: {
    6: [['en un único recorrido curado por primera vez en la historia', 'en un único recorrido']],
    17: [['desplazó a alrededor de 100 000 nubios cuyas aldeas', 'desplazó a más de 100 000 personas cuyas aldeas'], ['otra docena de templos', 'una veintena de otros monumentos']],
    18: [['la catarata baja', 'la primera catarata']],
    19: [['se pintan con los colores que la Presa Alta borró', 'se pintan con colores vivos'], [', ven el contrapunto geográfico, sostienen un cocodrilo domesticado si la familia se anima', ' y ven el contrapunto geográfico']],
  },
  ja: {
    5: [['に築かれ、クフ王のものは4,500年経った今も地上最大の石造建築です。', 'に築かれました。']],
    6: [['単一の動線にまとめられたのは史上初めてです。', '単一の動線にまとめられています。']],
    17: [['約10万人のヌビア人を先祖代々の村から移住させ', '10万人を超える人々を先祖代々の村から移住させ'], ['その他十数の神殿の救出', 'その他二十ほどの遺跡の救出']],
    19: [['ハイダムが消した色彩で塗り直された家々の並ぶ', '色鮮やかに塗られた家々の並ぶ'], ['お子さまは現地のお子さまに会い、地理的な対位法を見て、ご家族の意向次第では人懐こいワニを抱いてみることもできます。', 'お子さまは現地のお子さまに会い、地理的な対位法を見ます。']],
  },
};
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const essay = LANGS.map((l) => {
  const src = existing.body.find((b) => b._key === l)?.value;
  if (!src || src.length !== 30) throw new Error(`${l}: live essay is not 30 blocks`);
  const blocks = src.map((b) => JSON.parse(JSON.stringify(b)));
  for (const [idx, fixes] of Object.entries(ESSAY_FIX[l])) {
    const b = blocks[Number(idx)];
    if (b.children.length !== 1) throw new Error(`${l} block ${idx}: ${b.children.length} text runs`);
    for (const [find, to] of fixes) {
      const n = b.children[0].text.split(find).length - 1;
      if (n !== 1) throw new Error(`${l} block ${idx}: "${find.slice(0, 40)}" found ${n} times`);
      b.children[0].text = b.children[0].text.replace(find, to);
    }
  }
  return { _key: l, _type: 'object', value: blocks };
});
const STALE = /tame crocodile|crocodile if the family|cocodrilo domesticado|人懐こいワニ|largest stone building|a dozen other|lower cataract|Sakkara|primera vez en la historia|史上初/;
for (const e of essay) for (const b of e.value) if (STALE.test(textOf(b))) throw new Error(`${e._key}: stale wording left in essay block ${b._key}`);
// Day expanders show the essay passages (same block keys in all three languages).
const ESSAY_MORE = { 2: [k('0b'), k('0d'), k('0f')], 4: [k('13')], 5: [k('15'), k('17')], 6: [k('1b'), k('1d'), k('1f')], 7: [k('23'), k('25'), k('27')], 8: [k('2b')] };
const CLOSING_REF = k('31');
for (const e of essay) { const keys = new Set(e.value.map((b) => b._key)); for (const ref of [...Object.values(ESSAY_MORE).flat(), CLOSING_REF]) if (!keys.has(ref)) throw new Error(`${e._key}: essay block ${ref} missing`); }

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
    closingRef: CLOSING_REF,
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
  body: essay,
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
console.log(`  body essay: 30 blocks ×3, corrected: ${Object.keys(ESSAY_FIX.en).length} blocks in EN`);

if (apply) {
  await writeRollback(client, [TOUR], 'before-family-merged');
  await client.patch(TOUR).set(doc).commit();
  console.log(`APPLIED: ${TOUR} updated in production`);
} else console.log('dry run (pass --apply --flags-approved to write production)');
