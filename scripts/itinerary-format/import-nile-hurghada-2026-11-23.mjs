/**
 * The 15-day Nile cruise and Hurghada page (wp-page-86875, "River, Then Reef") with the cruise week from the owner's itinerary
 * (7 nights Luxor → Aswan → Luxor, then Luxor → Hurghada, about three hours), absorbing the 15-day tour page (wp-page-249752).
 * Owner, 23 Nov. Updates wp-page-86875 IN PLACE (same _id and slugs; price, hero, theme, cities untouched); the live essay kept for
 * the days it still matches (Luxor, Edfu, Kom Ombo, Aswan, Hurghada). Retire: retire-nile-hurghada-*.mjs.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-nile-hurghada-2026-11-23.mjs              # dry run
 *   node --env-file=<.env> scripts/itinerary-format/import-nile-hurghada-2026-11-23.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-86875';
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/15-day-nile-cruise-and-hurghada';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
const JA_SITES = {
  1: ['カルナック神殿', '大列柱室', 'スフィンクス参道', 'ルクソール神殿'],
  2: ['王家の谷', '貴族の墓', 'ハトシェプスト女王葬祭殿', 'メムノンの巨像'],
  4: ['コム・オンボ神殿', 'ワニ博物館', 'アスワン・ハイ・ダム', '切りかけのオベリスク', 'ファルーカ'],
};
const CFG = { locked: LOCKED, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const SRC = 'Owner locked copy "15-day-nile-cruise-and-hurghada" (EN/ES/JA), 23 Nov 2026.';

const G = {
  karnak: 'guideArticle.luxor.the-karnak-temple', luxorTemple: 'guideArticle.luxor.the-luxor-temple', vok: 'guideArticle.luxor.valley-of-the-kings', hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut', colossi: 'guideArticle.luxor.the-colossi-of-memnon',
  edfu: 'guideArticle.edfu.edfu-temple', komOmbo: 'guideArticle.kom-ombo.the-temple-of-kom-ombo', obelisk: 'guideArticle.aswan.the-unfinished-obelisk',
};
// null = no guide page for that site.
const GUIDES = {
  1: [G.karnak, null, null, G.luxorTemple], 2: [G.vok, null, G.hatshepsut, G.colossi], 3: [G.edfu], 4: [G.komOmbo, null, null, G.obelisk, null], 5: [null], 6: [], 7: [], 8: [],
  9: [], 10: [], 11: [], 12: [], 13: [], 14: [], 15: [],
};
const SUMMARY = {
  en: 'A private fifteen-day journey: a seven-night Nile cruise from Luxor to Aswan and back, with Karnak, the Valley of the Kings, Edfu and Kom Ombo, then seven all-inclusive nights at Hurghada for the Giftun reefs and slow days by the sea.',
  es: 'Un viaje privado de quince días: un crucero de siete noches por el Nilo de Luxor a Asuán y vuelta, con Karnak, el Valle de los Reyes, Edfu y Kom Ombo, y después siete noches todo incluido en Hurghada para los arrecifes de Giftun y días lentos junto al mar.',
  ja: 'プライベートな15日間の旅。ルクソールからアスワンまで往復する7泊のナイル川クルーズでカルナック神殿、王家の谷、エドフ、コム・オンボを巡り、そのあとハルガダのオールインクルーシブ7泊で、ギフトゥーン島のサンゴ礁と海辺のゆったりした日々。',
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
// Same meaning, checked by hand 23 Nov: JA d2.b0 writes 三 / 六十 as kanji numerals (three terraces, sixty tombs).
const SAME_MEANING = { es: [], ja: ['d2.b0'] };
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

/* ---------- essay: the live body, kept for the days it still matches ---------- */
const k = (n) => `0000000000${n}`;
const ESSAY_FIX = {
  en: { 12: [['; the largest cult statue stands at the sanctuary entrance', '']] },
  es: { 12: [['; la estatua de culto mayor se sitúa a la entrada del santuario', '']] },
  ja: { 12: [['表され、最大のカルト像は至聖所の入口に立ちます。', '表されています。']] },
};
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const essay = LANGS.map((l) => {
  const src = existing.body.find((b) => b._key === l)?.value;
  if (!src || src.length !== 33) throw new Error(`${l}: live essay is not 33 blocks`);
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
const STALE = /largest cult statue|estatua de culto mayor|最大のカルト像/;
for (const e of essay) for (const b of e.value) if (STALE.test(textOf(b))) throw new Error(`${e._key}: stale wording left in essay block ${b._key}`);
// Day expanders: the passages that still match the cruise week (Luxor East/West Bank, Edfu, Kom Ombo, Aswan) and the Hurghada passages.
const ESSAY_MORE = { 1: [k('11')], 2: [k('13')], 3: [k('19')], 4: [k('1b'), k('21'), k('23')], 9: [k('2f'), k('31'), k('33')] };
const CLOSING_REF = k('39');
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
console.log(`  body essay: 26 blocks ×3, corrected: ${Object.keys(ESSAY_FIX.en).length} blocks in EN`);

if (apply) {
  await writeRollback(client, [TOUR], 'before-nile-hurghada');
  await client.patch(TOUR).set(doc).commit();
  console.log(`APPLIED: ${TOUR} updated in production`);
} else console.log('dry run (pass --apply --flags-approved to write production)');
