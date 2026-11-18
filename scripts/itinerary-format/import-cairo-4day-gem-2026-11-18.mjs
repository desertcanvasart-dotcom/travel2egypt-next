/**
 * 4-Day Cairo: the Pyramids, the Grand Egyptian Museum and Old Cairo (the "History &
 * Culture Escape") — publish the owner's locked copy (EN/ES/JA, 18 Nov), rebuilt around
 * a midday arrival from the Gulf. Owner, 18 Nov: "Keep prices, defaults" (to the review
 * that proposed them):
 *   - prices kept: €520; ES €542, JA €556 (guideLanguagePrices, untouched)
 *   - Giza "built over roughly fifty years" → "within about three generations" (Khufu's
 *     reign began c. 2589 BC, Menkaure's ended c. 2503 BC)
 *   - "the shore" (open items) left out: only the Red Pyramid interior is added
 *   - Day 1 "lunch" off the sights list (it stays in the meals line); "Saints Sergius and
 *     Bacchus (Abu Serga)"; Day 4 meals "Breakfast (or a breakfast box …)" because the
 *     page shows a meal note in brackets; "On the sightseeing days" for the guide;
 *     "Shoes come off in the mosque"
 *
 *   tour  wp-page-153242   /4-day-history-culture-escape (City Break 301s here, #282)
 *
 * The page receives: the locked itinerary, new titles ×3, a new summary ×3 (also the
 * meta description), the panel's route line (shapeOfDay.where), and the approved essay
 * corrections (open items 6.1–6.7, canon Gate A.3). The essay was written for another
 * order (Giza first, GEM day 2, Old Cairo with Saqqara, a Tanoura and a Sound and Light
 * evening, full board), so the passages the page shows under "More about this stop" are
 * replaced by the same text with those sentences removed and the corrections made; the
 * Coptic quarter sentence becomes its own block so it can sit on Day 2 while Saqqara
 * stays on Day 3. It keeps its slugs, hero, prices and relatedTours.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-cairo-4day-gem-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-cairo-4day-gem-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-cairo-4day-gem-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const TOUR = 'wp-page-153242';
const PRICE = 520;
const GUIDE_PRICES = { es: 542, ja: 556 };
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/4-day-cairo-pyramids-gem-old-cairo';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
// JA site names contain 「・」, the row separator, so Day 2's list is given (checked against the file).
const JA_SITES = { 2: ['ギザのピラミッド', 'カフラー王またはメンカウラー王のピラミッド内部', 'パノラマ展望ポイント', '大スフィンクス', '河岸神殿', '吊り下げ教会', 'アブ・セルガ教会', 'ベン・エズラ・シナゴーグ', 'サラディンのシタデル', 'ムハンマド・アリー・モスク', 'ハン・ハリーリ'] };
const CFG = { locked: LOCKED, leadParas: true, jaSites: JA_SITES };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "4-day-cairo-pyramids-gem-old-cairo" (EN/ES/JA), 18 Nov 2026, reviewed 18 Nov.';

// Essay blocks (same keys in every language); COPTIC is new, split out of SAQQARA.
const E = { gem0: '000000000009', giza: '00000000000d', gem: '000000000011', saqqara: '000000000015', citadel: '000000000019', how: '00000000001d' };
const COPTIC = '000000000015c';
const MORE = Object.fromEntries(LANGS.map((l) => [l, { 1: [E.gem], 2: [E.giza, COPTIC, E.citadel], 3: [E.saqqara], 4: [] }]));
const G = {
  plateau: 'guideArticle.giza.the-giza-plateau',
  sphinx: 'guideArticle.giza.the-great-sphinx',
  hanging: 'guideArticle.cairo.hanging-church-al-mu-allaqa',
  serga: 'guideArticle.cairo.church-of-saint-sergius-and-bacchus-abu-serga',
  benEzra: 'guideArticle.cairo.ben-ezra-synagogue',
  citadel: 'guideArticle.cairo.the-citadel-of-saladin',
  muhammadAli: 'guideArticle.cairo.mosque-of-muhammad-ali',
  khan: 'guideArticle.cairo.khan-el-khalili',
  memphis: 'guideArticle.giza.memphis-mit-rahina',
  mitRahina: 'guideArticle.giza.mit-rahina-museum',
  saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  dahshur: 'guideArticle.giza.dahshur-necropolis',
  bent: 'guideArticle.giza.the-bent-pyramid-of-sneferu',
  red: 'guideArticle.giza.the-red-pyramid-of-sneferu',
};
// No guide pages for the GEM, the Valley Temple, the panorama or Djoser's pyramid on its own.
const GUIDES = {
  1: [null, null],
  2: [G.plateau, null, null, G.sphinx, null, G.hanging, G.serga, G.benEzra, G.citadel, G.muhammadAli, G.khan],
  3: [G.memphis, G.mitRahina, G.saqqara, null, G.dahshur, G.bent, G.red],
  4: [],
};
const SUMMARY = {
  en: 'A private four-day Cairo trip built around a midday arrival: the Grand Egyptian Museum on the day you land, Giza and Old Cairo, then Memphis, Saqqara and Dahshur.',
  es: 'Un viaje privado de cuatro días en El Cairo pensado para una llegada a mediodía: el Gran Museo Egipcio el día que aterrizas, Giza y el Cairo antiguo, y luego Menfis, Saqqara y Dahshur.',
  ja: '正午到着に合わせて組んだ、カイロのプライベートな4日間。到着日に大エジプト博物館、翌日にギザとオールド・カイロ、そしてメンフィス、サッカラ、ダハシュールへ。',
};

/* Essay (open items 6.1–6.7). Each entry: [block, a phrase the CURRENT text must contain, the new text].
 * The new text is the old one with the sentences that no longer fit removed (day framing for
 * the old order, the Khafre "option", the Sound and Light Show, the Tanoura, the airport
 * lunch, full board) and the corrections made: GEM and Djoser superlatives softened, the
 * repeated GEM "first time" said once, "more than eight centuries", "about three
 * generations", the guide "in your language", and the page's own spellings. */
const ESSAY = {
  en: [
    [E.gem0, 'reassembled and properly displayed for the first time since the excavation', null, [['The complete Tutankhamun collection is here, reassembled and properly displayed for the first time since the excavation.', 'The complete Tutankhamun collection is here.']]],
    [E.gem, 'The second day belongs to the collection.', 'The Grand Egyptian Museum is one of the largest archaeological museums in the world, and its permanent galleries finally bring together objects that were previously scattered across several institutions — many in storage for decades — into a single, properly scaled, rigorously organised display. The treasures of Tutankhamun are here, reassembled and presented in full for the first time since their excavation a century ago. The statuary, the papyri, the reconstructed chariots, the furniture of people dead for three millennia — all of it in a building large enough to give it room. (The royal mummies remain at the National Museum of Egyptian Civilisation in Old Cairo, where their dedicated gallery was built around them.) The museum rewards depth over coverage, and our Egyptologist will shape the route to your interests rather than walking you through every gallery.'],
    [E.giza, 'The first day goes straight to Giza', 'The plateau is where most people’s idea of Egypt was formed, and where it either holds or deepens. The Great Pyramid of Khufu, the Pyramid of Khafre, and the Pyramid of Menkaure were built within about three generations, around 2500 BC, with the Great Sphinx below them carved from a single limestone outcrop. The scale of the complex is what photographs consistently fail to convey: the plateau is large, the stones are enormous, and the fact of the Old Kingdom’s ambition settles on you differently in person than it does in any image.'],
    [COPTIC, null, 'Old Cairo’s Coptic quarter is where the Hanging Church and the Church of St Sergius and Bacchus record Egypt’s Christian centuries; the Ben Ezra Synagogue nearby was rebuilt on a site associated with a Jewish presence in Cairo going back well over a thousand years.'],
    [E.citadel, 'The final day belongs to medieval Cairo', 'The Saladin Citadel, built in the twelfth century AD on a spur of the Mokattam hills, has commanded the skyline for more than eight centuries. Inside it stands the Mosque of Muhammad Ali, completed in the 1840s in Ottoman style, its twin minarets visible from most of the city below. The Citadel also holds military and police museums and offers one of the better elevated views available to visitors. From there the day moves down into Khan El Khalili, the bazaar quarter that has traded continuously since the fourteenth century — loud, dense, and unhurried in the way only old markets are. It is the right place to end a day in Cairo: not a monument to the past but an active city doing what it has always done.'],
    [E.saqqara, 'The third day reaches back past Giza', 'The third day reaches back past Giza to the very beginning of monumental stone construction. Saqqara is where the pyramid was invented: the Step Pyramid of Djoser, built around 2650 BC under the architect Imhotep, is among the oldest large stone buildings in the world — the structural experiment from which Giza would eventually follow. The surrounding necropolis is large and only partially excavated; new finds continue to emerge. Memphis nearby preserves the colossal fallen statue of Ramses II and a large alabaster sphinx from the ancient capital that once stood here.'],
    [E.how, 'full board are included throughout', null, [['A licensed English-speaking Egyptologist, private air-conditioned transfers, three nights\' accommodation, and full board are included throughout;', 'A licensed Egyptologist in your language, private air-conditioned transfers, and three nights’ bed and breakfast are included;']]],
  ],
  es: [
    [E.gem0, 'reagrupada y montada por primera vez desde la excavación', null, [['La colección completa de Tutankamón está aquí, reagrupada y montada por primera vez desde la excavación.', 'La colección completa de Tutankamón está aquí.']]],
    [E.gem, 'El segundo día pertenece a la colección.', 'El Gran Museo Egipcio es uno de los mayores museos arqueológicos del mundo y sus galerías permanentes reúnen al fin, en un único edificio a escala adecuada y con curaduría rigurosa, objetos que durante décadas estuvieron repartidos en varias instituciones —muchos en almacén— o expuestos sin el espacio que merecían. Los tesoros de Tutankamón están aquí, reagrupados y presentados en su totalidad por primera vez desde la excavación de hace un siglo. Estatuaria, papiros, carros reconstruidos, mobiliario de personas muertas hace tres milenios: todo en un edificio lo bastante grande para darles aire. Las momias reales se conservan en el Museo Nacional de la Civilización Egipcia (NMEC), en El Cairo Antiguo, donde se construyó una galería específica a su alrededor. El museo recompensa la profundidad antes que la cobertura, y nuestro egiptólogo modulará el recorrido en función de tus intereses, no de cada vitrina.'],
    [E.giza, 'El primer día va directo a Guiza', 'La meseta es donde se formó la idea que la mayoría tiene de Egipto y donde esa idea o aguanta o se profundiza. La Gran Pirámide de Keops, la pirámide de Kefrén y la pirámide de Micerino se levantaron en unas tres generaciones, hacia 2500 a. C., con la Gran Esfinge debajo, tallada en un único afloramiento de caliza. La escala del conjunto es lo que las fotografías nunca consiguen transmitir: la meseta es vasta, las piedras son enormes y la ambición del Imperio Antiguo se asienta sobre el visitante de una forma que ninguna imagen sustituye.'],
    [COPTIC, null, 'El barrio copto de El Cairo Antiguo tiene la Iglesia Colgante y la iglesia de los santos Sergio y Baco como testigos de los siglos cristianos de Egipto; la sinagoga Ben Ezra, cerca, se reconstruyó sobre un emplazamiento ligado a una presencia judía en la ciudad de más de mil años.'],
    [E.citadel, 'El último día pertenece al Cairo medieval', 'La Ciudadela de Saladino, levantada en el siglo XII sobre un espolón de las colinas de Mokattam, lleva más de ocho siglos marcando el horizonte. Dentro se alza la mezquita de Muhammad Ali, terminada en la década de 1840 en estilo otomano, con sus dos minaretes visibles desde casi cualquier rincón de la ciudad. La Ciudadela alberga también museos militares y de policía y ofrece una de las mejores vistas elevadas disponibles para el visitante. Desde allí, la jornada baja a Jan el-Jalili, el barrio del bazar que comercia de manera continua desde el siglo XIV: ruidoso, denso y con la calma propia solo de los mercados antiguos. Es el sitio adecuado para cerrar un día en El Cairo: no un monumento al pasado, sino una ciudad activa haciendo lo que siempre ha hecho.'],
    [E.saqqara, 'El tercer día retrocede más allá de Guiza', 'El tercer día retrocede más allá de Giza, hasta el origen mismo de la construcción monumental en piedra. Saqqara es donde se inventó la pirámide: la Pirámide Escalonada de Djoser, levantada hacia 2650 a. C. bajo el arquitecto Imhotep, está entre los edificios de piedra de gran tamaño más antiguos del mundo: el experimento estructural del que Giza acabaría derivando. La necrópolis circundante es vasta y solo en parte excavada; los nuevos hallazgos siguen apareciendo. Menfis, cerca, conserva el colosal Ramsés II caído y una gran esfinge de alabastro de la antigua capital que estuvo aquí.'],
    [E.how, 'pensión completa están incluidos en todo momento', null, [['Un egiptólogo licenciado de habla hispana, traslados privados climatizados, tres noches de alojamiento y pensión completa están incluidos en todo momento;', 'Un egiptólogo con licencia que habla tu idioma, traslados privados climatizados y tres noches de alojamiento con desayuno están incluidos;'], ['en Guiza y Saqqara', 'en Giza y Saqqara']]],
  ],
  ja: [
    [E.gem0, '発掘以来初めて再構成された形で展示されています', null, [['ツタンカーメンのコレクション一式はここに集約され、発掘以来初めて再構成された形で展示されています。', 'ツタンカーメンのコレクション一式はここに集約されています。']]],
    [E.gem, '二日目はコレクションの日です。', '大エジプト博物館は世界有数の規模を誇る考古学博物館で、その常設ギャラリーは、これまで複数の機関に散在していた（多くは長く収蔵庫に眠っていた）品々を、ようやく一つの、ふさわしい規模と厳密な構成のもとに統合しました。ツタンカーメンの宝物は一世紀前の発掘以来はじめて、ここで全点が再構成されて並びます。彫像、パピルス、復元された戦車、3000年前に生きた人々の家具——すべてが、それを置くに足る空間のなかにあります。（王のミイラ群はオールド・カイロの国立エジプト文明博物館（NMEC）に留まり、専用ギャラリーが彼らに合わせて設えられています。）この博物館は「網羅」より「深く読む」ことに報いる館で、私たちのエジプト学ガイドはお客様の関心に沿って動線を組みます——全ギャラリーを順に流したりはしません。'],
    [E.giza, '初日は迷わずギザへ。', '多くの方の「エジプト」のイメージは高原で形づくられ、ここで深まるか、覆るかが決まります。クフ王の大ピラミッド、カフラー王のピラミッド、メンカウラー王のピラミッドは紀元前2500年ごろ、およそ3世代のあいだに築かれ、足元の大スフィンクスは一枚岩の石灰岩から掘り出されました。写真が一貫して伝えそこねるのは、ここのスケールです——高原は広く、石は巨大で、古王国の野心が「実物」となって沈黙のうちに語りかけてくる。'],
    [COPTIC, null, 'オールド・カイロのコプト地区では、吊り下げ教会と聖セルギウスと聖バッカス教会がエジプトのキリスト教時代を伝え、ベン・エズラ・シナゴーグは千年以上前にさかのぼるカイロのユダヤ人の歴史と結びつく場所に再建されています。'],
    [E.citadel, '最終日は、空港送迎の前、中世のカイロに充てます。', 'サラディンのシタデルは12世紀、モカッタムの丘の突端に築かれ、以来800年以上にわたりこの街のスカイラインを支配してきました。内部のムハンマド・アリー・モスクは1840年代にオスマン様式で完成、二本の尖塔（ミナレット）は街のほぼどこからでも見えます。城塞内には軍事博物館と警察博物館があり、訪問者が得られる眺望としてはカイロでも屈指のものです。そこから下って、ハン・ハリーリへ——14世紀以来絶えることなく商いの続く市場の一画です。賑やかで、密度が高く、古い市場だけが持つ「焦らなさ」がここにあります。カイロでの一日を締めくくるのにふさわしい場所です——過去の記念碑ではなく、現に動いている街、それも昔と変わらぬことを続けている街。'],
    [E.saqqara, '三日目はギザの背後にさかのぼり', '三日目はギザの背後にさかのぼり、記念碑的石造建築の出発点へ。サッカラはピラミッドが発明された場所——紀元前2650年ごろ、建築家イムホテプの設計によるジェセル王の階段ピラミッドは、世界でも最古級の大規模石造建造物で、やがてギザへと続いていく構造実験の起点です。周辺のネクロポリスは広大で、まだ全面的には発掘されていません——新しい発見が今も続いています。近くのメンフィスには、かつての首都の名残として、ラムセス2世の倒れた巨像と大型のアラバスター・スフィンクスが残ります。'],
    [E.how, '3泊分の宿泊と全食が含まれます', null, [['ライセンスを持つ英語対応のエジプト学ガイド、冷房付き専用車両、3泊分の宿泊と全食が含まれます。', 'お客様の言語を話す公認エジプト学者ガイド、冷房付き専用車両、3泊分の朝食付き宿泊が含まれます。']]],
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
// Same meaning, checked by hand 18 Nov:
//   ES d2.b2: "its twin minarets" = «sus dos minaretes» (the gate reads «dos» as 2).
//   JA d2.b2: "its twin minarets" = 2本のミナレット (same).
const SAME_MEANING = { es: ['d2.b2'], ja: ['d2.b2'] };
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

/* ---------- essay ---------- */
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const oneRun = (b, text) => ({ ...b, children: [{ ...b.children[0], text }] });
const body = tour.body.map((row) => {
  const l = row._key;
  if (!ESSAY[l]) return row;
  let value = row.value.map((b) => ({ ...b }));
  for (const [key, mustHave, newText, edits] of ESSAY[l]) {
    if (key === COPTIC) continue;
    const i = value.findIndex((b) => b._key === key);
    if (i < 0) throw new Error(`${l}: essay block ${key} missing`);
    const b = value[i];
    if ((b.children ?? []).length !== 1) throw new Error(`${l} ${key}: expected one run`);
    const cur = textOf(b);
    if (newText) {
      if (cur === newText) continue; // re-run
      if (!cur.includes(mustHave)) throw new Error(`${l} ${key}: "${mustHave}" not found — the essay changed`);
      value[i] = oneRun(b, newText);
    } else {
      let t = cur;
      for (const [find, repl] of edits) {
        const alts = [find, find.replace(/’/g, "'"), find.replace(/'/g, '’')];
        const f = alts.find((x) => t.includes(x));
        if (!f && t.includes(repl)) continue; // re-run
        if (!f) throw new Error(`${l} ${key}: "${find.slice(0, 50)}" not found`);
        t = t.replace(f, repl);
      }
      value[i] = oneRun(b, t);
    }
  }
  // The Coptic quarter, split out of the Saqqara passage, sits right after it.
  const coptic = ESSAY[l].find(([k]) => k === COPTIC)[2];
  const existing = value.find((b) => b._key === COPTIC);
  if (existing) value = value.map((b) => (b._key === COPTIC ? oneRun(b, coptic) : b));
  else {
    const at = value.findIndex((b) => b._key === E.saqqara) + 1;
    const tmpl = value[at - 1];
    value.splice(at, 0, { _key: COPTIC, _type: 'block', style: tmpl.style ?? 'normal', markDefs: [], children: [{ _key: `${COPTIC}r`, _type: 'span', marks: [], text: coptic }] });
  }
  return { ...row, value };
});
// Nothing the page shows may keep the old order, the dropped evenings or a corrected claim.
const RETIRED = {
  en: /first day|second day|final day|Sound and Light|Tanoura|full board|largest archaeological museum in the world|oldest large stone structure|eight hundred|fifty years|el-Khalili|airport|option to enter/,
  es: /primer día|segundo día|último día|luz y sonido|tanura|pensión completa|el mayor museo|la mayor estructura|ochocientos|cincuenta años|Guiza|Micerinos|Zoser|Moqattam|Mohamed Alí|aeropuerto/,
  ja: /初日|二日目|最終日|音と光|タヌーラ|全食|世界最大|世界最古の|800年にわたり|ほぼ50年|約50年|ハーン|ラメセス|中王国|吊り教会|空港/,
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
  if (p.days.map((d) => d.optional.length).join() !== '0,2,0,0') throw new Error(`${l}: expected two optional extras, on Day 2`);
  const days = p.days.map((d) => ({
    _key: prev.get(d.day)?._key ?? `c4g-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    body: d.body.map(para),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
    // Khufu and the camel: their "Not included" rows say the same, so no link is needed.
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
    included: p.included.map((t, i) => fact(`c4g-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(`c4g-ex-${l}-${i}`, l, x.text)),
    options: p.options.map((t, i) => fact(`c4g-opt-${l}-${i}`, l, t)),
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
  // The ES meta title stays; the meta description becomes the summary in all three.
  seo: { ...(tour.seo ?? { _type: 'seo' }), metaDescription: LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: SUMMARY[l] })) },
};
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions']) set[f] = curlyRows(set[f], 'en');
{
  // What the page and search show after the write may not promise full board or the dropped evenings as included.
  const after = { ...tour, ...set, body: null, migration: null };
  const j = JSON.stringify(after, (key, v) => (key === 'source' ? undefined : v));
  const hit = j.match(/.{0,80}(full board|pensión completa|全食).{0,40}/);
  if (hit) throw new Error(`a field still mentions full board: ${hit[0]}`);
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
  if (!before || textOf(before) !== textOf(b)) console.log(`essay ${l} ${b._key}${before ? '' : ' (new)'}: ${textOf(b)}`);
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
  await writeRollback(client, [TOUR], 'before-cairo-4day-gem');
  await client.patch(TOUR).set(set).commit();
  console.log(`APPLIED to production ${TOUR}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
