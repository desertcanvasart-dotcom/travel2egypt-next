/**
 * Desert Horizons: 8 Days to Bahariya, the White Desert, Siwa and El Alamein — a NEW product from the
 * owner's locked copy (EN/ES/JA, 23 Nov 2026) that replaces the 7-day Bahariya & Siwa page
 * (wp-page-155539, /desert-horizons-7-day-bahariya-siwa-oasis-tour). Owner, 23 Nov: 8 days, Marsa Matruh
 * night at the Triumph White Sands Hotel, El Alamein war cemeteries on the way back, full board, Siwa road
 * 402 km, the old essay carried over with the corrections of the open-items file.
 *
 * This step ONLY creates the page (noIndex, no price, no redirects); the old page is retired in a second
 * script once the owner has seen it and set the price.
 *
 *   new  tour.desert-horizons-8-day-bahariya-siwa
 *
 * The essay (body) is the old page's, block for block (same keys), with the corrections applied per
 * language (ESSAY_FIX) and one new passage for Days 7-8 (keys ...f1/f3/f5, after the Mountain of the Dead).
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-desert-horizons-8day-2026-11-23.mjs              # dry run
 *   node --env-file=<.env> scripts/itinerary-format/import-desert-horizons-8day-2026-11-23.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'tour.desert-horizons-8-day-bahariya-siwa';
const OLD = 'wp-page-155539';
const SLUGS = {
  en: 'desert-horizons-8-day-bahariya-siwa-el-alamein',
  es: 'horizontes-del-desierto-8-dias-bahariya-siwa-y-el-alamein',
  ja: 'sabaku-no-chiheisen-bahareiya-shiwa-eru-aramein-8-nichikan',
};
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/8-day-desert-horizons-bahariya-siwa';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
const JA_SITES = {
  2: ['黒山地', 'イングリッシュ・ハウス', '塩湖', '白砂漠国立公園'],
  3: ['クリスタル・マウンテン', 'アガバート谷', '黒砂漠', 'エル・ハイズ'],
  5: ['シャーリー砦', 'アモンのオラクル神殿', 'ウンム・ウバイダ', 'クレオパトラの泉', 'ファトナス島'],
  6: ['マラキ村', '大砂海', '化石層', 'シアタ湖', 'サンドボーディング', 'ビル・ワヘド'],
  7: ['死者の山', 'ダクルール山', 'アブ・シェルーフ村'],
  8: ['英連邦戦没者墓地', 'ドイツ軍記念碑', 'イタリア軍記念碑', 'エル・アラメイン博物館'],
};
const CFG = { locked: LOCKED, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const SRC = 'Owner locked copy "8-day-desert-horizons-bahariya-siwa" (EN/ES/JA), 23 Nov 2026.';

const G = {
  whiteDesert: 'guideArticle.farafra-oasis.white-desert-national-park',
  crystal: 'guideArticle.bahariya-oasis.crystal-mountain',
  agabat: 'guideArticle.farafra-oasis.crystal-mountain-and-aqabat',
  hayz: 'guideArticle.bahariya-oasis.el-hayz',
  shali: 'guideArticle.siwa-oasis.shali-fortress',
  oracle: 'guideArticle.siwa-oasis.temple-of-the-oracle',
  cleopatra: 'guideArticle.siwa-oasis.cleopatra-s-pool',
  fatnas: 'guideArticle.siwa-oasis.fatnas-island',
  sandSea: 'guideArticle.siwa-oasis.the-great-sand-sea',
  dead: 'guideArticle.siwa-oasis.mountain-of-the-dead',
  dakrour: 'guideArticle.siwa-oasis.dakrour-mountain',
};
// null = no guide page for that site.
const GUIDES = {
  1: [],
  2: [null, null, null, G.whiteDesert],
  3: [G.crystal, G.agabat, null, G.hayz],
  4: [],
  5: [G.shali, G.oracle, null, G.cleopatra, G.fatnas],
  6: [null, G.sandSea, null, null, null, null],
  7: [G.dead, G.dakrour, null],
  8: [null, null, null, null],
};
const SUMMARY = {
  en: "A private eight-day journey from Cairo into Egypt's deep west: Bahariya, the White Desert, the Great Sand Sea and Siwa, then a night at Marsa Matruh and the war cemeteries of El Alamein on the road home.",
  es: 'Un viaje privado de ocho días desde El Cairo al oeste profundo de Egipto: Bahariya, el Desierto Blanco, el Gran Mar de Arena y Siwa, y de regreso una noche en Marsa Matruh y los cementerios de guerra de El Alamein.',
  ja: 'カイロからエジプトの深い西へ向かう、プライベートな8日間の旅。バハレイヤ、白砂漠、大砂海、シワを巡り、帰路ではマルサ・マトルーフで1泊して、エル・アラメインの戦没者墓地を訪れます。',
};
const META_TITLE = {
  en: 'Desert Horizons: 8-Day Bahariya, White Desert and Siwa Tour',
  es: 'Horizontes del desierto: 8 días a Bahariya, el Desierto Blanco y Siwa',
  ja: '砂漠の地平線：バハレイヤ、白砂漠、シワへの8日間',
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
const SAME_MEANING = { es: ['why', 'd6.b0', 'd7.b0'], ja: ['why', 'd6.b0'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const existing = await client.getDocument(TOUR);
const old = await client.getDocument(OLD);
if (!old) throw new Error(`${OLD} not found`);
const heroSrc = old;
if (!heroSrc?.heroImage) throw new Error('no hero image to reuse');
const THEME = old.theme._ref;
const CITIES = old.cities.map((c) => c._ref);
const RELATED = old.relatedTours.map((r) => r._ref);
for (const l of LANGS) {
  const taken = await client.fetch('*[_type == "tour" && _id != $id && !(_id in path("drafts.**")) && slug[_key == $l][0].value.current == $s]._id', { id: TOUR, l, s: SLUGS[l] });
  if (taken.length) throw new Error(`${l} slug ${SLUGS[l]} is taken by ${taken.join(', ')}`);
}


/* ---------- essay: the old page's body, corrected, plus the Days 7-8 passage ---------- */
const k = (n) => `0000000000${n}`;
// [block index in the old body, [[find, replace], ...]] — each find must occur exactly once in that block's single text run.
const ESSAY_FIX = {
  en: {
    0: [['Seven Days', 'Eight Days']],
    1: [['in 332 BC', 'in 331 BC']],
    4: [['in 332 BC', 'in 331 BC'], ['Seven days is the right length: enough to go deep without becoming an endurance exercise.', 'Eight days is the right length: enough to go deep without becoming an endurance exercise. The last two days turn north to the Mediterranean, splitting the road home with a night at Marsa Matruh and a visit to the war cemeteries of El Alamein.']],
    6: [['an overnight at the camp or hotel', 'an overnight at the hotel']],
    10: [['Valley of El Haize', 'Valley of El Hayz']],
    12: [['roughly 480 kilometres', '402 kilometres']],
    15: [['in 332 BC', 'in 331 BC'], ['Um Ubeyda', 'Umm Ubayda']],
    16: [['Ein Guba', 'Ain Juba'], ['Fitnas Island', 'Fatnas Island']],
    19: [['Cambrian-era fossils and ancient coral formations are visible in the rock — evidence that this entire landscape was ocean floor some 500 million years ago, before any of the life forms that built the temples to the east had appeared.', 'fossil shells and coral from a sea that covered the area some 20 to 40 million years ago are visible in the rock — evidence that this landscape was once sea floor.']],
    21: [['the road back', 'the road to the sea']],
    22: [['before the long return east.', 'before the road north to the coast.']],
    23: [['then the long drive back to Cairo, arriving in the evening.', 'then the road north to Marsa Matruh on the Mediterranean, four to four and a half hours, arriving in the afternoon.']],
    25: [['The two long drives are unavoidable', 'The long drives are unavoidable']],
    28: [['Great Sand Sea → Cairo', 'Great Sand Sea → Marsa Matruh → El Alamein → Cairo']],
    29: [['≈7 days / 6 nights', '≈8 days / 7 nights']],
    30: [['two long desert drives', 'long desert drives']],
  },
  es: {
    0: [['siete días', 'ocho días']],
    1: [['en 332 a. C.', 'en 331 a. C.']],
    4: [['en 332 a. C.', 'en 331 a. C.'], ['Siete días son la duración correcta: suficiente para ir hondo sin convertirse en ejercicio de resistencia.', 'Ocho días son la duración correcta: suficiente para ir hondo sin convertirse en ejercicio de resistencia. Los dos últimos días giran al norte, hacia el Mediterráneo, y dividen el camino de regreso con una noche en Marsa Matruh y una visita a los cementerios de guerra de El Alamein.']],
    6: [['la noche en el campamento u hotel', 'la noche en el hotel']],
    10: [['El Heiz', 'El Hayz']],
    12: [['unos 480 kilómetros', '402 kilómetros']],
    15: [['en 332 a. C.', 'en 331 a. C.'], ['Um Ubeyda', 'Umm Ubayda']],
    16: [['Ein Guba', 'Ain Juba'], ['isla de Fitnas', 'isla de Fatnas']],
    19: [['fósiles del Cámbrico y antiguas formaciones de coral —prueba de que todo este paisaje fue lecho oceánico hace unos 500 millones de años, antes de que apareciera ninguna de las formas de vida que construyeron los templos del este—', 'conchas y corales fósiles de un mar que cubría la zona hace unos 20 a 40 millones de años —prueba de que este paisaje fue en otro tiempo lecho marino—']],
    21: [['carretera de vuelta', 'carretera hacia el mar']],
    22: [['antes del largo regreso al este.', 'antes de la carretera al norte, hacia la costa.']],
    23: [['Almuerzo en Siwa y luego el largo trayecto de vuelta a El Cairo, con llegada al anochecer.', 'Almuerzo en Siwa y luego la carretera al norte, hasta Marsa Matruh, en el Mediterráneo, de cuatro a cuatro horas y media, con llegada por la tarde.']],
    25: [['Las dos largas conducciones son ineludibles', 'Las largas conducciones son ineludibles']],
    28: [['Gran Mar de Arena → El Cairo', 'Gran Mar de Arena → Marsa Matruh → El Alamein → El Cairo']],
    29: [['≈7 días / 6 noches', '≈8 días / 7 noches']],
    30: [['dos conducciones largas de desierto', 'conducciones largas de desierto']],
  },
  ja: {
    0: [['7日間', '8日間']],
    1: [['紀元前332年', '紀元前331年']],
    4: [['紀元前332年', '紀元前331年'], ['7日間はちょうど良い長さです——深く入っていくに足り、しかし耐久訓練にはならない。', '8日間はちょうど良い長さです——深く入っていくに足り、しかし耐久訓練にはならない。最後の2日間は北へ地中海に向かい、マルサ・マトルーフでの1泊と、エル・アラメインの戦没者墓地の訪問で、帰路を分けます。']],
    6: [['夜はキャンプまたはホテル。', '夜はホテル。']],
    12: [['およそ480キロメートル', '402キロメートル']],
    15: [['紀元前332年', '紀元前331年'], ['ウム・ウベイダ', 'ウンム・ウバイダ']],
    16: [['アイン・グバ', 'アイン・ジュバ'], ['フィトナス島', 'ファトナス島']],
    19: [['カンブリア紀の化石と古代の珊瑚層が岩に見える地点へ渡り——東の神殿を建てた生命の形が現れるよりずっと前、5億年前にこの風景全体が海底だったことの証拠です。', '約2000万〜4000万年前にこの一帯を覆っていた海の、貝やサンゴの化石が岩に見える地点へ渡り——この風景がかつて海底だったことの証拠です。']],
    21: [['シワでの最後の朝、東への道', 'シワでの最後の朝、海への道']],
    22: [['東への長い帰路に就きます。', '北の海岸への道に就きます。']],
    23: [['シワで昼食、その後の長いカイロへのドライブ、夕方に到着。', 'シワで昼食、その後は北へ、地中海沿いのマルサ・マトルーフへ。道のりは4時間から4時間半、午後に到着します。']],
    25: [['長距離ドライブ二つは避けられず', '長距離ドライブは避けられず']],
    28: [['大砂海 → カイロ', '大砂海 → マルサ・マトルーフ → エル・アラメイン → カイロ']],
    29: [['7日間／6泊', '8日間／7泊']],
    30: [['長距離ドライブ二段', '長距離ドライブ']],
  },
};
// The new passage (after the Mountain of the Dead paragraph, block 23): a heading and two paragraphs.
const COAST = {
  en: ['The coast, and El Alamein',
    "The seventh day leaves the desert for the sea. From Siwa the road runs north across the plateau, four to four and a half hours, to Marsa Matruh on the Mediterranean, where the evening belongs to the water's edge and dinner at the Triumph White Sands Hotel.",
    'The last day follows the coast east to El Alamein. In 1942 the British Eighth Army and the German-Italian Panzer Army fought the battles here that stopped the Axis advance on Egypt and began its retreat from North Africa. Today the field is a place of quiet cemeteries: the Commonwealth war cemetery, with its rows of white headstones; the German memorial, a fortress-like stone hall on a ridge above the sea; and the Italian memorial, a tall tower. The El Alamein museum puts the campaign in order, with its uniforms, weapons and maps. Lunch is included, then the road to Cairo, arriving in the evening.'],
  es: ['La costa y El Alamein',
    'El séptimo día deja el desierto por el mar. Desde Siwa, la carretera sube al norte por la meseta, de cuatro a cuatro horas y media, hasta Marsa Matruh, en el Mediterráneo, donde la tarde es para la orilla del agua y la cena en el Triumph White Sands Hotel.',
    'El último día sigue la costa hacia el este hasta El Alamein. En 1942, el Octavo Ejército británico y el Ejército Panzer germano-italiano libraron aquí las batallas que detuvieron el avance del Eje sobre Egipto y marcaron el comienzo de su retirada del norte de África. Hoy el campo es un lugar de cementerios silenciosos: el cementerio de guerra de la Commonwealth, con sus filas de lápidas blancas; el monumento alemán, una sala de piedra, como una fortaleza, sobre una loma frente al mar; y el monumento italiano, una torre alta. El museo de El Alamein ordena la campaña con sus uniformes, armas y mapas. El almuerzo está incluido y después, la carretera a El Cairo, con llegada al anochecer.'],
  ja: ['海岸とエル・アラメイン',
    '7日目は、砂漠を離れて海へ向かいます。シワから北へ台地を横切り、4時間から4時間半で地中海沿いのマルサ・マトルーフに着きます。夕方は水辺で過ごし、夕食はトライアンフ・ホワイト・サンズ・ホテルです。',
    '最終日は海岸沿いに東へ、エル・アラメインへ。1942年、英国第8軍とドイツ・イタリアの装甲軍がここで戦い、枢軸軍のエジプトへの進撃を止め、北アフリカからの後退を始めさせました。今、この戦場は静かな墓地の地です。白い墓標が並ぶ英連邦戦没者墓地、海を見下ろす尾根にそびえる要塞のような石造りのドイツ軍記念碑、そして高い塔のイタリア軍記念碑。エル・アラメイン博物館では、制服、武器、地図とともに、戦いの経過をたどれます。昼食は含まれます。そのあとカイロへの道を進み、夕方に到着します。'],
};
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const essay = LANGS.map((l) => {
  const src = old.body.find((b) => b._key === l)?.value;
  if (!src || src.length !== 31) throw new Error(`${l}: old essay is not 31 blocks`);
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
  const mk = (key, style, text) => ({ _key: key, _type: 'block', style, markDefs: [], children: [{ _key: `${key}s`, _type: 'span', text, marks: [] }] });
  const [h, p1, p2] = COAST[l];
  blocks.splice(24, 0, mk(k('f1'), 'h3', h), mk(k('f3'), 'normal', p1), mk(k('f5'), 'normal', p2));
  return { _key: l, _type: 'object', value: blocks };
});
// Leftover wording from the 7-day page, in any language, would be a miss.
const STALE = /332|480|Cambrian|Cámbric|Cámbrico|カンブリア|500 million|500 millones|5億|Um Ubeyda|Ein Guba|Fitnas|フィトナス|アイン・グバ|ウム・ウベイダ|camp or hotel|Seven [Dd]ays|siete días|7日間|≈7/;
for (const e of essay) for (const b of e.value) if (STALE.test(textOf(b))) throw new Error(`${e._key}: stale wording left in essay block ${b._key}: ${textOf(b).slice(0, 80)}`);
const ESSAY_MORE = { 1: [k('0d')], 2: [k('11'), k('13')], 3: [k('15')], 4: [k('19')], 5: [k('1d'), k('1f'), k('21')], 6: [k('25'), k('27'), k('29')], 7: [k('2d'), k('2f')], 8: [k('f1'), k('f3'), k('f5')] };
const CLOSING_REF = k('35');

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
    ...(d.segments ? { segments: d.segments.map((sg, i) => ({ _key: `g${i}`, _type: 'daySegment', label: sg.label, ...(sg.heading ? { heading: sg.heading } : {}), text: sg.text })) } : { body: d.body.map(para) }),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
    optional: [],
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
  body: essay,
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
  if (existing) await writeRollback(client, [TOUR], 'before-desert-horizons-8day');
  await client.createOrReplace(doc);
  console.log(`APPLIED: ${TOUR} created in production (noIndex)`);
} else console.log('dry run (pass --apply --flags-approved to write production)');
