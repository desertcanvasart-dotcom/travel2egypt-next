/**
 * The merged 10-day page: "10 Days from Giza to the Nubian South" (wp-page-87255) becomes THE 10-day Egypt page
 * (Cairo, Alexandria, Luxor, Aswan, Abu Simbel), absorbing "To Abu Simbel and Back" (wp-page-88992) and "10-Day Egypt
 * Private Tour with Abu Simbel" (wp-page-156539). Owner, 23 Nov: "Merge them into one page"; copy locked EN/ES/JA.
 *
 * This step updates wp-page-87255 IN PLACE (same _id, so its 39 inbound cards stay valid): new itinerary-format copy,
 * the live essay kept with the open-items corrections, the EN slug without "unforgettable". Price, hero, theme, cities
 * and ES/JA slugs are untouched (price follows from Autoura). The two old pages and the redirects are a second step.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-10day-merged-2026-11-23.mjs              # dry run
 *   node --env-file=<.env> scripts/itinerary-format/import-10day-merged-2026-11-23.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-87255';
const NEW_EN_SLUG = '10-day-egypt-cairo-alexandria-luxor-aswan';
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/10-day-egypt-cairo-alexandria-luxor-aswan';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
const JA_SITES = {
  2: ['アレクサンドリア図書館', 'カイトベイ要塞', 'コム・エル・シュカファのカタコンベ', 'ポンペイの柱', 'アレクサンドリア国立博物館'],
  6: ['エドフのホルス神殿', 'コム・オンボ神殿', 'ファルーカ'],
  7: ['アブ・シンベル神殿', 'アスワン・ハイ・ダム', '切りかけのオベリスク'],
  8: ['ベン・エズラ・シナゴーグ', 'ハンギング・チャーチ', 'コプト博物館', 'ハーン・ハリーリ', 'ナイル川ディナークルーズ'],
};
const CFG = { locked: LOCKED, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const SRC = 'Owner locked copy "10-day-egypt-cairo-alexandria-luxor-aswan" (EN/ES/JA), 23 Nov 2026.';

const G = {
  giza: 'guideArticle.giza.the-giza-plateau', sphinx: 'guideArticle.giza.the-great-sphinx',
  biblio: 'guideArticle.alexandria.bibliotheca-alexandrina', qaitbay: 'guideArticle.alexandria.qaitbey-fort',
  catacombs: 'guideArticle.alexandria.catacombs-of-kom-el-shoqafa', pompey: 'guideArticle.alexandria.pompeys-pillar',
  alexMuseum: 'guideArticle.alexandria.alexandria-national-museum',
  memphis: 'guideArticle.giza.memphis-mit-rahina', saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  bent: 'guideArticle.giza.the-bent-pyramid-of-sneferu', red: 'guideArticle.giza.the-red-pyramid-of-sneferu',
  karnak: 'guideArticle.luxor.the-karnak-temple', luxorTemple: 'guideArticle.luxor.the-luxor-temple', luxorMuseum: 'guideArticle.luxor.the-luxor-museum',
  vok: 'guideArticle.luxor.valley-of-the-kings', hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut', colossi: 'guideArticle.luxor.the-colossi-of-memnon',
  edfu: 'guideArticle.edfu.edfu-temple', komOmbo: 'guideArticle.kom-ombo.the-temple-of-kom-ombo',
  abuSimbel: 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel', obelisk: 'guideArticle.aswan.the-unfinished-obelisk',
  benEzra: 'guideArticle.cairo.ben-ezra-synagogue', hanging: 'guideArticle.cairo.the-hanging-church', coptic: 'guideArticle.cairo.the-coptic-museum', khan: 'guideArticle.cairo.khan-el-khalili',
  egMuseum: 'guideArticle.cairo.egyptian-museum-of-antiquities',
};
// null = no guide page for that site.
const GUIDES = {
  1: [G.giza, G.sphinx],
  2: [G.biblio, G.qaitbay, G.catacombs, G.pompey, G.alexMuseum],
  3: [G.memphis, G.saqqara, null, G.bent, G.red],
  4: [G.karnak, null, G.luxorTemple, G.luxorMuseum],
  5: [G.vok, G.hatshepsut, G.colossi],
  6: [G.edfu, G.komOmbo, null],
  7: [G.abuSimbel, null, G.obelisk],
  8: [G.benEzra, G.hanging, G.coptic, G.khan, null],
  9: [G.egMuseum, null],
  10: [],
};
const SUMMARY = {
  en: 'A private ten-day journey along the classic spine of Egypt: Giza, Alexandria, Memphis, Saqqara and Dahshur, two days in Luxor, Edfu, Kom Ombo and Aswan, Abu Simbel, and both of Cairo\'s great museums to close.',
  es: 'Un viaje privado de diez días por la columna vertebral clásica de Egipto: Guiza, Alejandría, Menfis, Saqqara y Dahshur, dos días en Luxor, Edfu, Kom Ombo y Asuán, Abu Simbel y los dos grandes museos de El Cairo para terminar.',
  ja: 'エジプトの王道をたどる、プライベートな10日間の旅。ギザ、アレクサンドリア、メンフィス、サッカラ、ダハシュール、ルクソールで2日間、エドフ、コム・オンボ、アスワン、アブ・シンベル、そして最後にカイロの二つの大博物館。',
};

const panelText = (l, t) => (l === 'en' ? t.replace(/\s*\*\(ES:.*\)\*\s*$/, '') : t);
const paraText = (s) => (typeof s === 'string' ? s : `${s.lead} ${s.text}`);

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.map((s) => typeof s), d.segments?.length ?? 0, d.sites.length, d.meals.map((m) => [m.meal, !!m.note]), d.optional.length, !!d.overnight, !!d.pace]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length, note: !!p.daysNote });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
if (P.en.days.length !== 10) throw new Error(`expected 10 days, found ${P.en.days.length}`);
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
const SAME_MEANING = { es: ['d6.b0', 'in5'], ja: ['d5.b0', 'd6.b0', 'in5'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const existing = await client.getDocument(TOUR);
if (!existing) throw new Error(`${TOUR} not found`);
if (await client.getDocument(`drafts.${TOUR}`)) throw new Error(`drafts.${TOUR} exists: handle it first`);
const taken = await client.fetch('*[_type == "tour" && _id != $id && !(_id in path("drafts.**")) && slug[_key == "en"][0].value.current == $s]._id', { id: TOUR, s: NEW_EN_SLUG });
if (taken.length) throw new Error(`EN slug ${NEW_EN_SLUG} is taken by ${taken.join(', ')}`);
const OLD_EN_SLUG = existing.slug.find((x) => x._key === 'en').value.current;
const SLUGS = Object.fromEntries(LANGS.map((l) => [l, l === 'en' ? NEW_EN_SLUG : existing.slug.find((x) => x._key === l).value.current]));

/* ---------- essay: the live body, kept, with the open-items corrections ---------- */
const k = (n) => `0000000000${n}`;
const ESSAY_FIX = {
  en: {
    10: [[' — which is to say, to the beginning of large stone construction anywhere on earth', '']],
    17: [['created the largest artificial lake in the world', 'created one of the largest artificial lakes in the world']],
    19: [['the Mamluk sultan Barquq established it in 1382', 'the emir Jaharkas al-Khalili founded it in 1382']],
  },
  es: {
    10: [[', es decir, al comienzo de la gran construcción en piedra en cualquier parte del planeta', '']],
    17: [['creó el mayor lago artificial del mundo', 'creó uno de los mayores lagos artificiales del mundo']],
    19: [['el sultán mameluco Barquq lo estableció en 1382', 'el emir Jaharkas al-Jalili lo fundó en 1382']],
  },
  ja: {
    10: [['——つまり、地上のどこであれ大規模な石造建設の始まり——', '']],
    17: [['世界最大の人造湖', '世界有数の人造湖']],
    19: [['マムルーク朝のスルタン・バルクークが設けて以来', 'アミールのジャハルカス・アル・ハリーリーが創設して以来']],
  },
};
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const essay = LANGS.map((l) => {
  const src = existing.body.find((b) => b._key === l)?.value;
  if (!src || src.length !== 26) throw new Error(`${l}: live essay is not 26 blocks`);
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
const STALE = /Barquq|バルクーク|created the largest artificial lake|creó el mayor lago|世界最大の人造湖|large stone construction|gran construcción en piedra|大規模な石造建設/;
for (const e of essay) for (const b of e.value) if (STALE.test(textOf(b))) throw new Error(`${e._key}: stale wording left in essay block ${b._key}`);
// Day expanders show the essay passages (same block keys in all three languages).
const ESSAY_MORE = { 1: [k('0d')], 2: [k('11')], 3: [k('15')], 4: [k('19'), k('1b')], 5: [k('1d')], 6: [k('21')], 7: [k('23')], 8: [k('27')], 9: [k('29')] };
const CLOSING_REF = k('2b');
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
console.log(`  EN slug: ${OLD_EN_SLUG} → ${NEW_EN_SLUG}  (ES/JA slugs unchanged; the old EN address needs a 301)`);
for (const l of LANGS) console.log(`  ${l}: /${l === 'en' ? '' : `${l}/`}${SLUGS[l]}\n    title: ${P[l].title}\n    where: ${WHERE[l]}\n    panel: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}\n    days: ${JSON.stringify(B[l].days.map((d) => `${d.day} ${d.place} | ${d.overnight ?? '—'} | ${d.meals.map((m) => m.meal[0]).join('')} | opt ${d.optional.length} | essay ${d.narrativeRefs.length}`))}`);
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) console.log(`  ${f}: ${(existing[f] ?? []).length} → ${doc[f].length}`);
console.log(`  body essay: 26 blocks ×3, corrected: ${Object.values(ESSAY_FIX.en).length} blocks per language`);

if (apply) {
  await writeRollback(client, [TOUR], 'before-10day-merged');
  await client.patch(TOUR).set(doc).commit();
  console.log(`APPLIED: ${TOUR} updated in production`);
} else console.log('dry run (pass --apply --flags-approved to write production)');
