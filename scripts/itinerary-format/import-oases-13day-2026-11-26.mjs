/**
 * 13-Day Oases and the Nile rebuilt in the multi-day format (owner, 26 Nov: corrected night plan, "Publish, no price").
 * Updates wp-page-88994 IN PLACE (same _id and slugs; hero, theme, cities, tourMode untouched); the old essay is not
 * shown (it described the wrong plan: Luxor hotel nights, cruise from day 9).
 *
 * Night plan (owner): Cairo 2 · Bahariya 1 · White Desert camp 1 · Dakhla 1 · Kharga 1 · Nile cruise 4 (board Luxor
 * day 7, leave Aswan day 11) · Cairo 2. Day 11 Aswan → Abu Simbel → Cairo by air; domestic flights NOT included.
 * Full board days 2–12. PRICE REMOVED (priceFrom + guideLanguagePrices unset) until Autoura has the desert rates;
 * the old €3,500 was for the old plan.
 *
 *   node -r dotenv/config scripts/itinerary-format/import-oases-13day-2026-11-26.mjs              # dry run
 *   node -r dotenv/config scripts/itinerary-format/import-oases-13day-2026-11-26.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-88994';
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/13-day-oases-and-the-nile';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
// JA site names that contain "・" themselves, listed whole.
const JA_SITES = {
  2: ['ギザのピラミッド', '大スフィンクス', 'メンフィス', 'サッカラ', 'ジェセル王の階段ピラミッド'],
  3: ['黄金のミイラ', 'バンネンティウとジェド・アメン・エフ・アンクの墓', 'アレクサンドロス大王の神殿'],
  4: ['黒砂漠', 'クリスタル・マウンテン', 'アガバト', '白砂漠国立公園'],
  5: ['ファラフラ', 'デイル・エル・ハガル', 'カスル・ダフラ'],
  6: ['ヒビス神殿', 'バガワットの墓地'],
  7: ['カルナック神殿', '大列柱室', 'ルクソール神殿', 'スフィンクス参道'],
  8: ['王家の谷', 'ハトシェプスト女王葬祭殿', 'メムノンの巨像'],
  9: ['エドフのホルス神殿', 'コム・オンボ神殿', 'ワニ博物館', 'ガラベーヤ・パーティー'],
  10: ['アスワン・ハイ・ダム', '未完成のオベリスク', 'フィラエ神殿', 'ファルーカ'],
  11: ['アブ・シンベル'],
  12: ['大エジプト博物館', 'サラディンのシタデル', 'ムハンマド・アリー・モスク', 'ハーン・ハリーリ'],
};
const CFG = { locked: LOCKED, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const SRC = 'Owner-agreed night plan and answers (26 Nov 2026); copy "13-day-oases-and-the-nile" (EN/ES/JA) written from them.';

const G = {
  giza: 'guideArticle.giza.the-giza-plateau', sphinx: 'guideArticle.giza.the-great-sphinx', memphis: 'guideArticle.giza.memphis-mit-rahina', saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  mummies: 'guideArticle.bahariya-oasis.valley-of-the-golden-mummies', crystal: 'guideArticle.bahariya-oasis.crystal-mountain', agabat: 'guideArticle.farafra-oasis.crystal-mountain-and-aqabat', whiteDesert: 'guideArticle.farafra-oasis.white-desert-national-park',
  deirHagar: 'guideArticle.dakhla-oasis.deir-el-hagar', hibis: 'guideArticle.kharga-oasis.hibis-temple', bagawat: 'guideArticle.kharga-oasis.cemetery-of-el-bagawat',
  karnak: 'guideArticle.luxor.the-karnak-temple', luxorTemple: 'guideArticle.luxor.the-luxor-temple', vok: 'guideArticle.luxor.valley-of-the-kings', hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut', colossi: 'guideArticle.luxor.the-colossi-of-memnon',
  edfu: 'guideArticle.edfu.edfu-temple', komOmbo: 'guideArticle.kom-ombo.the-temple-of-kom-ombo', obelisk: 'guideArticle.aswan.the-unfinished-obelisk', philae: 'guideArticle.aswan.the-philae-temple', abuSimbel: 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel',
  citadel: 'guideArticle.cairo.the-citadel-of-saladin', aliMosque: 'guideArticle.cairo.mosque-of-muhammad-ali', khan: 'guideArticle.cairo.khan-el-khalili',
};
// One slot per site on the day's line; null = no guide page.
const GUIDES = {
  1: [], 2: [G.giza, G.sphinx, G.memphis, G.saqqara, null], 3: [G.mummies, null, null], 4: [null, G.crystal, G.agabat, G.whiteDesert],
  5: [null, G.deirHagar, null], 6: [G.hibis, G.bagawat], 7: [G.karnak, null, G.luxorTemple, null], 8: [G.vok, G.hatshepsut, G.colossi],
  9: [G.edfu, G.komOmbo, null, null], 10: [null, G.obelisk, G.philae, null], 11: [G.abuSimbel], 12: [null, G.citadel, G.aliMosque, G.khan], 13: [],
};
const SUMMARY = {
  en: 'Thirteen private days that go sideways first: west from Cairo through the oases of Bahariya, Dakhla and Kharga with a night camped in the White Desert, then a four-night Nile cruise from Luxor to Aswan and Abu Simbel.',
  es: 'Trece días privados que primero se desvían: hacia el oeste desde El Cairo por los oasis de Bahariya, Dajla y Jarga con una noche de acampada en el Desierto Blanco, y después un crucero de cuatro noches por el Nilo de Luxor a Asuán y Abu Simbel.',
  ja: 'まず横へそれるプライベートな13日間。カイロから西へ、バハレイヤ、ダフラ、ハルガのオアシスと白砂漠でのキャンプ1泊を経て、ルクソールからアスワンまでのナイル川クルーズ4泊とアブ・シンベルへ。',
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
// Same meaning, checked by hand: EN "why" says the river comes "second" (read as 2); ES "después".
// JA: why (same "second"); d5.b0 「三柱神」 = "Amun, Mut and Khonsu" (EN names the three); d8.b0 「六十」 in kanji
// = "sixty"; stay3 / in3 「3食付き」 = "full board" (three meals).
const SAME_MEANING = { es: ['why'], ja: ['why', 'd5.b0', 'd8.b0', 'stay3', 'in3'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const existing = await client.getDocument(TOUR);
if (!existing) throw new Error(`${TOUR} not found`);
if (P.en.days.length !== 13) throw new Error(`expected 13 days, found ${P.en.days.length}`);
if (await client.getDocument(`drafts.${TOUR}`)) throw new Error(`drafts.${TOUR} exists: handle it first`);
const SLUGS = Object.fromEntries(LANGS.map((l) => [l, existing.slug.find((x) => x._key === l).value.current]));

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
    _key: `oas-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    ...(d.segments ? { segments: d.segments.map((sg, i) => ({ _key: `g${i}`, _type: 'daySegment', label: sg.label, ...(sg.heading ? { heading: sg.heading } : {}), text: sg.text })) } : { body: d.body.map(para) }),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
    optional: d.optional.map((text, i) => ({ _key: `o${i}`, _type: 'dayOptional', text, ...(/extra ticket|entrada.* extra|entradas extra|別途チケット|別途入場券/i.test(text) ? { cost: 'extraTicket' } : {}) })),
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
    included: p.included.map((t, i) => fact(`oas-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`oas-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`oas-opt-${l}-${i}`, l, t)),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
const intl = (type, m) => LANGS.map((l) => ({ _key: l, _type: type, value: m[l] }));
const doc = {
  title: intl('internationalizedArrayStringValue', Object.fromEntries(LANGS.map((l) => [l, P[l].title]))),
  summary: intl('internationalizedArrayTextValue', SUMMARY),
  slug: LANGS.map((l) => ({ _key: l, _type: 'object', value: { _type: 'slug', current: SLUGS[l] } })),
  shapeOfDay: { ...(existing.shapeOfDay ?? {}), where: intl('internationalizedArrayTextValue', WHERE) },
  durationDays: 13,
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: [],
};
const UNSET = ['priceFrom', 'guideLanguagePrices'];
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) doc[f] = curlyRows(doc[f], 'en');
const targets = Object.values(G);
const found = await client.fetch('*[_id in $ids]._id', { ids: targets });
for (const id of targets) if (!found.includes(id)) throw new Error(`reference target ${id} missing`);

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => doc[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l).filter((x) => x !== 'strong'), P[l].title, WHERE[l]], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

console.log(`UPDATE ${TOUR} in place; price REMOVED (was ${existing.priceFrom} / ${JSON.stringify(existing.guideLanguagePrices)}); hero, theme, cities kept`);
console.log(`  slugs unchanged: ${LANGS.map((l) => SLUGS[l]).join(' | ')}`);
for (const l of LANGS) console.log(`  ${l}: /${l === 'en' ? '' : `${l}/`}${SLUGS[l]}\n    title: ${P[l].title}\n    where: ${WHERE[l]}\n    panel: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}\n    days: ${JSON.stringify(B[l].days.map((d) => `${d.day} ${d.place} | ${d.overnight ?? '—'} | ${d.meals.map((m) => m.meal[0]).join('')} | sites ${d.sites.length} | opt ${d.optional.length}`))}`);
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) console.log(`  ${f}: ${(existing[f] ?? []).length} → ${doc[f].length}`);
console.log('  body essay: unchanged (not shown on this page)');

if (apply) {
  await writeRollback(client, [TOUR], 'before-oases-13day');
  await client.patch(TOUR).set(doc).unset(UNSET).commit();
  console.log(`APPLIED: ${TOUR} updated in production`);
} else console.log('dry run (pass --apply --flags-approved to write production)');
