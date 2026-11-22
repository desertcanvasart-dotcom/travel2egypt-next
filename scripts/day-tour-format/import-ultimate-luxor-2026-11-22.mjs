/**
 * The Ultimate Luxor Day Tour: Both Banks in One Day, in the day-tour format, EN + ES + JA together (owner, 22 Nov: locked
 * copy + open items).
 *
 *   tour  wp-page-88177   /the-ultimate-luxor-day-tour   (URLs unchanged: no redirect)
 *
 * Five sites, not six: the West Bank in the morning (Valley of the Kings, Hatshepsut, Colossi of Memnon), lunch, then the
 * East Bank (Karnak, Luxor Temple, ending at Luxor Temple). The Valley of the Queens and every Nefertari passage are
 * removed. About 10 hours. Included: standard entrance to the five sites (three Valley of the Kings tombs), lunch, water,
 * the driver's tip. Tutankhamun's tomb: an extra ticket bought at the site (optional extra, no price: the Grand West
 * Bank handling). No tiers, no minimum age (also out of shapeOfDay.character). The copy's own panel rows replace the rule
 * rows. Price: ultimate-luxor-prices.json (Autoura T2E-DT-LXR-11): EUR 122 / ES 133 / JA 150 (live 165 / 176 / 183).
 *
 * Essay (Gate A.3, corrections 1-9): the route essay was East-first; its blocks are reordered (West Bank, crossing,
 * Karnak, Luxor Temple) and their joining sentences rewritten; the Valley of the Queens block is hidden; "the whole
 * complex covers about 100 hectares"; the Luxor Temple drive is "a short drive south, about three kilometres"; "the most
 * densely concentrated ancient site" removed; "five sites"; "his vast temple"; the private and tier paragraphs rewritten.
 * Hidden: the essay's closing (the page has its own), the concierge helper note, empty blocks.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-ultimate-luxor-2026-11-22.mjs              # dry run
 *   node --env-file=<.env> scripts/day-tour-format/import-ultimate-luxor-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88177';
const OLD = { from: 165, es: 176, ja: 183 };
const PRICES = JSON.parse(readFileSync(new URL('./ultimate-luxor-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/ultimate-luxor-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026).`;

const G = {
  vok: 'guideArticle.luxor.valley-of-the-kings',
  hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut',
  colossi: 'guideArticle.luxor.the-colossi-of-memnon',
  karnak: 'guideArticle.luxor.the-karnak-temple',
  luxor: 'guideArticle.luxor.the-luxor-temple',
};
// Sites per stop, in file order: Valley of the Kings · Temple of Hatshepsut · Colossi of Memnon · Karnak + Great Hypostyle
// Hall + Sacred Lake · Luxor Temple.
const SITE_GUIDES = [[G.vok], [G.hatshepsut], [G.colossi], [G.karnak, null, null], [G.luxor]];
const DURATION_LABEL = { en: 'Full day · ~10 hrs', es: 'Día completo · ~10 h', ja: '1日・約10時間' };
const DURATION_HOURS = 10;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const PERIOD = { Evening: 'evening', Noche: 'evening', 夜: 'evening', Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
const SEP = /\s+·\s+/;
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = plain(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${l}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelLines = panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], plain(m[2]).replace(/\s*\(ES: .*\)$/, '')]);
  const panelRows = Object.fromEntries(panelLines);
  // The panel's own rows, as written: all but the Type/Duration line and the From placeholder.
  const ownRows = panelLines.slice(1).filter(([, v]) => !/\{.*\}/.test(v)).map(([label, text]) => ({ label, text }));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [word, ...labelParts] = head.split(/\s*[·・]\s*/);
    const period = PERIOD[word.trim()];
    if (!period || !labelParts.length) throw new Error(`${l}: unknown period heading "${head}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this evening →" pointer
      const lines = p.split('\n');
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected paragraph in "${head}": ${p.slice(0, 60)}`);
      const tm = plain(hm[1]).match(/^(\d\d:\d\d)\s*[·・]\s*(.+)$/);
      const stop = tm ? { time: tm[1], title: tm[2] } : { title: plain(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[^:：]*[:：]\*?[:：]?\s*(.+)$/);
        if (sm) stop.sites = sm[2].split(SEP).map((x) => plain(x));
        else if (ln.startsWith('- ')) (stop.optional ??= []).push(plain(ln.slice(2)));
        else body.push(ln);
      }
      if (body.length) stop.text = plain(body.join(' '));
      stops.push(stop);
    }
    return { period, periodLabel: plain(labelParts.join(l === 'ja' ? '・' : ' · ')), stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk).map(plain) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, ownRows, periods,
    opening: plain(paras(opening.text)[0]), whyThisOrder: plain(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text).map(plain), closingLine: plain(tail[tail.length - 1]),
  };
}
const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(l)]));
// The summary / meta description: the locked opening's own first two sentences.
const SUMMARY = Object.fromEntries(LANGS.map((l) => [l, (P[l].opening.match(l === 'ja' ? /^(?:[^。]+。){2}/ : /^(?:.+?[.!?](?:\s+|$)){2}/) ?? [P[l].opening])[0].trim()]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0, !!s.time, s.optional?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opt: p.options.length, rows: p.ownRows.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup', 'lunch']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
const siteStops = P.en.periods.flatMap((x) => x.stops).filter((s) => s.sites);
if (siteStops.length !== SITE_GUIDES.length || siteStops.some((s, i) => s.sites.length !== SITE_GUIDES[i].length)) throw new Error('sites ≠ SITE_GUIDES');

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(p.ownRows.map((r, i) => [`panel${i}`, r.text])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text], ...(s.optional ?? []).map((o, i) => [`p${pi}s${si}.o${i}`, o])])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Same figures, checked by hand (open items, "Numeric gate (22 Nov)": EN/ES 2, 6, 12, 50; JA adds 1 for 1名様).
const SAME_MEANING = { es: ['opening', 'why', 'fit0'], ja: ['opening', 'why', 'closing', 'p0s1.x', 'p0s2.x', 'p1s0.x', 'wk0'] };
for (const l of ['es', 'ja']) {
  const en = flat('en'), lc = flat(l);
  for (const k of SAME_MEANING[l]) { if (!(k in lc)) throw new Error(`${l}: SAME_MEANING key ${k} not found`); delete en[k]; delete lc[k]; console.log(`numeric gate (${l}): ${k} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

/* ── Build ────────────────────────────────────────────────────────────── */
function build(l) {
  const p = P[l];
  let siteStop = 0;
  const timeline = p.periods.map((x, pi) => ({
    _key: `dt-${l}-${pi + 1}`, _type: 'dayTourPeriod', lang: l, period: x.period, periodLabel: x.periodLabel,
    stops: x.stops.map((s, si) => {
      const guides = s.sites ? SITE_GUIDES[siteStop++] : null;
      if (s.sites && guides.length !== s.sites.length) throw new Error(`${l}: site/guide count mismatch at ${s.title}`);
      return {
        _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop', ...(s.time ? { time: s.time } : {}), title: s.title, ...(s.text ? { text: s.text } : {}),
        ...(s.optional ? { skipGlance: true, optional: s.optional.map((text, k) => ({ _key: `o${k + 1}`, _type: 'dayTourOptional', text, cost: 'extraTicket' })) } : {}),
        ...(s.sites ? { sites: s.sites.map((name, k) => ({ _key: `x${pi + 1}${si + 1}${k}`, _type: 'dayTourSite', name, ...(guides[k] ? { guideRef: { _type: 'reference', _ref: guides[k], _weak: true } } : {}) })) } : {}),
      };
    }),
    source: SRC(l), needsReview: false,
  }));
  const fact = (list, prefix) => list.map((t, i) => ({ _key: `${prefix}${i + 1}-${l}`, _type: 'productFact', lang: l, text: t, source: SRC(l), needsReview: false }));
  return {
    timeline,
    intro: {
      _key: `dti-${l}`, _type: 'dayTourIntro', lang: l,
      opening: p.opening, whyThisOrder: p.whyThisOrder,
      pickupLine: p.panelRows[PANEL[l].pickup],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      panelRows: p.ownRows.map((r, i) => ({ _key: `pr${i + 1}`, _type: 'dayPanelRow', ...r })),
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'gwin'), excluded: fact(p.excluded, 'gwout'), options: fact(p.options, 'gwopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
if (await client.getDocument(`drafts.${DOC_ID}`)) throw new Error(`drafts.${DOC_ID} exists — handle it first`);
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.en, PRICES.es, PRICES.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const TIER_FIELDS = ['priceTiers', 'tiers', 'tourLevels', 'levels', 'optionLink', 'optionLinks', 'minimumAge', 'ageLine', 'ageNote'];
const tierLeft = TIER_FIELDS.filter((f) => doc[f] != null);
if (tierLeft.length) throw new Error(`tier/age fields present (${tierLeft.join(', ')}) — retire them first`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's closing ("Six sites, two banks, three thousand years…") and "Go early…": the page has its own closing line.
const CLOSING_REF = { en: '000000000040', es: '000000000043', ja: '00000000002f' };
// Hidden: the Valley of the Queens block · the closing's second sentence · the tier / concierge helper notes · empty blocks.
const SKIP = {
  en: ['000000000032', '000000000042', '000000000050', '000000000053'],
  es: ['000000000035', '000000000045', '000000000055', '000000000058'],
  ja: ['000000000021', '000000000031', '00000000003f', '000000000042'],
};
// The route essay becomes West Bank first: the order after the rewrite (blocks not listed keep their place).
const ORDER = {
  en: ['000000000021', '00000000002e', '00000000003a', '000000000036', '00000000002a', '000000000028', '000000000024'],
  es: ['000000000023', '000000000031', '00000000003d', '000000000039', '00000000002d', '00000000002b', '000000000027'],
  ja: ['000000000011', '00000000001d', '000000000029', '000000000025', '00000000001a', '000000000018', '000000000014'],
};
// Whole blocks rewritten (their runs are lost).
const REPLACE = {
  en: {
    '000000000021': 'The day begins on the West Bank, in the Theban hills, where the desert begins and the tombs and terraces are best seen before the heat.',
    '00000000002a': 'After lunch, you cross the Nile to the East Bank, where the ancient city’s ceremonial core once stood.',
    '000000000015': 'This is a private tour, operated for your party alone — never shared with other guests. Because it is private, it runs for as few as one traveller, with no minimum group size and no waiting on other bookings; larger parties are accommodated in a suitable vehicle. A private, air-conditioned vehicle, a licensed Egyptologist guide in your language, and one bottle of mineral water per person are included. It is a long day on foot with steep tomb descents — families with young children should weigh that honestly.',
    '00000000001d': 'Standard entrance to all five sites and lunch are included; Tutankhamun’s tomb is extra.',
  },
  es: {
    '000000000023': 'La jornada arranca en la orilla occidental, en las colinas tebanas, donde empieza el desierto y las tumbas y terrazas se ven mejor antes del calor.',
    '00000000002d': 'Tras el almuerzo, se cruza el Nilo a la orilla oriental, donde antiguamente se alzaba el núcleo ceremonial de la ciudad.',
    '000000000017': 'Se trata de un tour estrictamente privado, operado en exclusiva para su grupo y nunca compartido con otros viajeros. Por su carácter privado, opera desde un único viajero, sin tamaño mínimo de grupo y sin esperas a otras reservas; los grupos más amplios se acomodan en un vehículo adecuado. Se incluyen un vehículo privado con aire acondicionado, un guía egiptólogo licenciado en tu idioma y una botella de agua mineral por persona. Es una jornada larga a pie con descensos empinados a las tumbas: las familias con niños pequeños deberían sopesarlo con honestidad.',
    '00000000001f': 'La entrada estándar a los cinco yacimientos y el almuerzo están incluidos; la tumba de Tutankamón es aparte.',
  },
  ja: {
    '000000000011': '一日は西岸から始まります。テーベの丘のふもと、砂漠が始まる場所で、墓とテラスは暑くなる前に見るのがいちばんです。',
    '00000000001a': '昼食のあと、ナイルを渡って東岸へ。かつて古代都市の儀礼の中核が立っていた場所です。',
  },
};
// [block, find, replace] — corrections 1-3, 5, 6 and 9; each find sits inside one text run.
const FIX = {
  en: [
    ['000000000003', 'Luxor is the most densely concentrated ancient site on earth.', ''], // 3
    ['000000000003', 'more significant monuments than in most entire countries', 'more great monuments than most countries hold'], // 3
    ['000000000003', 'This tour covers six major sites', 'This tour covers five major sites'], // 9
    ['000000000005', ', and their queens and children were interred nearby in the Valley of the Queens', ''], // 8
    ['00000000003a', 'The day concludes at the ', 'Next is the '], // 9
    ['000000000036', '(the largest ever built in Egypt, now largely destroyed)', '(his vast temple, now largely destroyed)'], // 6
    ['000000000028', 'From Luxor Temple, the route moves north to ', 'The afternoon begins at '], // 2
    ['000000000028', ' — a fifteen-minute drive, or roughly two kilometres along the Nile corniche.', ', the first of the afternoon’s two East Bank temples.'], // 2
    ['000000000028', 'The precinct of Amun-Ra alone covers around 200 hectares', 'The whole complex covers about 100 hectares'], // 1
    ['000000000024', ' is the logical starting point — central, accessible, and relatively compact, it gives you an immediate sense of scale and style before the larger sites.', ' is the fitting close — a short drive south, about three kilometres, central, accessible and relatively compact.'], // 2
    ['00000000003e', 'The six sites on this tour', 'The five sites on this tour'], // 9
  ],
  es: [
    ['000000000005', 'Luxor es el yacimiento antiguo más densamente concentrado del planeta.', ''],
    ['000000000005', 'más monumentos significativos que en muchos países enteros', 'más grandes monumentos que los que reúnen la mayoría de los países'],
    ['000000000005', 'Este tour cubre seis grandes yacimientos', 'Este tour cubre cinco grandes yacimientos'],
    ['000000000007', ', eran sepultados en el Valle de los Reyes y sus esposas e hijos se enterraban cerca, en el Valle de las Reinas', ', eran sepultados en el Valle de los Reyes'],
    ['00000000003d', 'La jornada se cierra en el ', 'A continuación, el '],
    ['000000000039', '(el mayor jamás levantado en Egipto, hoy desaparecido en su práctica totalidad)', '(su vasto templo, hoy desaparecido en su práctica totalidad)'],
    ['00000000002b', 'Desde el templo de Luxor, la ruta avanza al norte hasta ', 'La tarde empieza en '],
    ['00000000002b', ' —un trayecto de quince minutos, aproximadamente dos kilómetros por la corniche del Nilo—.', ', el primero de los dos templos de la orilla oriental de la tarde.'],
    ['00000000002b', 'Solo el recinto de Amón-Ra cubre alrededor de 200 hectáreas', 'Todo el complejo cubre unas 100 hectáreas'],
    ['000000000027', ' es el punto de partida lógico: céntrico, accesible y relativamente compacto, ofrece una primera percepción de escala y estilo antes de los yacimientos mayores.', ' es el cierre adecuado: un corto trayecto al sur, de unos tres kilómetros; céntrico, accesible y relativamente compacto.'],
    ['000000000041', 'Los seis yacimientos de este tour', 'Los cinco yacimientos de este tour'],
  ],
  ja: [
    ['000000000009', '六つの主要な遺跡', '五つの主要な遺跡'],
    ['000000000009', 'ルクソールは地上で最も密度の高い古代遺跡です。', ''],
    ['000000000009', 'たいていの国全体よりも多くの重要な記念建造物を見いだすことになります', 'たいていの国が抱えるよりも多くの偉大な記念建造物を見いだすことになります'],
    ['00000000000b', '、その妃や子らは近くの王妃の谷に納められました', ''],
    ['000000000029', '一日は、デイル・アル・バハリにある', '次に、デイル・アル・バハリにある'],
    ['000000000029', 'で締めくくられます', 'を訪れます'],
    ['000000000025', '（エジプトでこれまでに築かれた最大のもので、いまは大半が破壊されています）', '（彼の広大な神殿で、いまは大半が破壊されています）'],
    ['000000000018', 'ルクソール神殿から、ルートは北へ', '午後はカルナックから始まります。'],
    ['000000000018', 'へと進みます——15分のドライブ、あるいはナイルのコルニッシュ沿いにおよそ2キロメートルです。', 'は、午後に訪れる東岸の二つの神殿の最初です。'],
    ['000000000018', 'アムン・ラーの神域だけでおよそ200ヘクタールを覆い', '複合体全体でおよそ100ヘクタールを覆い'],
    ['000000000014', 'が論理的な出発点です——中心にあり、近づきやすく、比較的こぢんまりとしていて、より大きな遺跡へ向かう前に、規模と様式を即座に感じさせてくれます。', 'が締めくくりにふさわしい場所です——南へ少し走ったところ、約3キロメートル、中心にあり、近づきやすく、比較的こぢんまりとしています。'],
    ['00000000002d', 'このツアーの六つの遺跡', 'このツアーの五つの遺跡'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...ORDER[l], ...Object.keys(REPLACE[l]), ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  let value = row.value.map((b) => {
    if (REPLACE[l][b._key]) return { ...b, children: [{ ...b.children[0], marks: [], text: REPLACE[l][b._key] }] };
    const fixes = FIX[l].filter(([k]) => k === b._key);
    if (!fixes.length) return b;
    const children = b.children.map((c) => ({ ...c }));
    for (const [, find, repl] of fixes) {
      const alts = [find, find.replace(/'/g, '’'), find.replace(/’/g, "'")];
      const i = children.findIndex((c) => alts.some((x) => c.text.includes(x)));
      if (i < 0 && (repl === '' || children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x))))) continue; // re-run
      if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
      children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), () => repl);
    }
    return { ...b, children };
  });
  // Reorder the route blocks: they sit consecutively; put them in ORDER (once).
  const first = value.findIndex((b) => b._key === ORDER[l][0]);
  const inOrder = ORDER[l].every((k, i) => value[first + i]?._key === k);
  if (!inOrder) {
    const set = new Set(ORDER[l]);
    const moved = ORDER[l].map((k) => value.find((b) => b._key === k));
    const rest = value.filter((b) => !set.has(b._key) && b._key !== undefined);
    // keep the VoQ block (hidden) right after the Valley of the Kings: it is hidden anyway, order does not matter.
    const insertAt = rest.findIndex((b) => b._key > ORDER[l].reduce((m, k) => (k < m ? k : m), 'zzzz')) ;
    const cut = value.findIndex((b) => set.has(b._key));
    const before = value.slice(0, cut).filter((b) => !set.has(b._key));
    const after = value.slice(cut).filter((b) => !set.has(b._key));
    value = [...before, ...moved, ...after];
  }
  return { ...row, value };
});
// Nothing "More about this day", the summary or the notes may keep what the page corrects.
const RETIRED = {
  en: /\bsix\b|eight hours|eight to ten|Queens|Nefertari|most densely concentrated|200 hectares|fifteen-minute|largest ever built|three tiers|every tier|minimum age|English-speaking|Base \+/i,
  es: /seis|ocho horas|de ocho a diez|Reinas|Nefertari|más densamente concentrado|200 hectáreas|quince minutos|mayor jamás|tres niveles|cada nivel|edad mínima|angloparlante|Base \+/i,
  ja: /六つ|8時間|8〜10時間|王妃|ネフェルタリ|最も密度|200ヘクタール|15分のドライブ|最大のもの|段階|18歳|最低年齢|英語対応/,
};
for (const row of body) {
  const l = row._key;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}": ${textOf(b).slice(0, 140)}`);
}
for (const l of LANGS) if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);
// The concierge note said "Eight to ten hours" and "the same six monuments".
const NOTE_FIX = {
  en: [['Eight to ten hours across both banks', 'About ten hours across both banks'], ['the same six monuments', 'the same five monuments']],
  es: [['De ocho a diez horas entre las dos orillas', 'Unas diez horas entre las dos orillas'], ['los mismos seis monumentos', 'los mismos cinco monumentos']],
  ja: [['両岸あわせて8〜10時間', '両岸あわせて約10時間'], ['同じ6つの遺跡', '同じ5つの遺跡']],
};
const conciergeNote = LANGS.map((l) => {
  const row = doc.conciergeNote.find((n) => n._key === l);
  let v = row.value;
  for (const [f, r] of NOTE_FIX[l]) v = v.replace(f, r);
  if (RETIRED[l].test(v)) throw new Error(`${l}: concierge note still shows "${v.match(RETIRED[l])[0]}": ${v.slice(0, 200)}`);
  return { ...row, value: v };
});
const SHAPE = {
  duration: { en: 'Full day, about 10 hours, both banks', es: 'Día completo, unas 10 horas, las dos orillas', ja: '終日、約10時間、両岸' },
  where: { en: 'Luxor: the Valley of the Kings, Hatshepsut, the Colossi of Memnon, Karnak, Luxor Temple', es: 'Luxor: Valle de los Reyes, Hatshepsut, Colosos de Memnón, Karnak, templo de Luxor', ja: 'ルクソール：王家の谷、ハトシェプスト葬祭殿、メムノンの巨像、カルナック、ルクソール神殿' },
};
// shapeOfDay.character carried the tiers (rule 8); the day-tour layout does not show it.
const UNSET = doc.shapeOfDay?.character ? ['shapeOfDay.character'] : [];

const set = {
  conciergeNote,
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  durationLabel: LANGS.map((l) => ({ ...(doc.durationLabel?.find((t) => t._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: DURATION_LABEL[l] })),
  durationHours: DURATION_HOURS,
  ...(ready ? { priceFrom: PRICES.en, guideLanguagePrices: { ...(doc.guideLanguagePrices ?? { _type: 'object' }), es: PRICES.es, ja: PRICES.ja } } : {}),
  dayTourIntro: LANGS.map((l) => ({ ...B[l].intro, closingRef: CLOSING_REF[l], skipRefs: SKIP[l] })),
  dayTimeline: LANGS.flatMap((l) => B[l].timeline),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  body,
};
for (const f of ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions']) set[f] = curlyRows(set[f], 'en');
for (const f of ['duration', 'where']) set[`shapeOfDay.${f}`] = LANGS.map((l) => ({ ...(doc.shapeOfDay?.[f]?.find((n) => n._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: SHAPE[f][l] }));

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]], {});
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

for (const f of Object.keys(set)) {
  if (f === 'body' || f.startsWith('shapeOfDay') || f === 'seo.metaTitle') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
console.log(`unset: ${UNSET.join(', ') || 'nothing'}`);
if (!ready) console.log('prices: NOT READY');
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  panel ${l}: ${B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`).join(' | ')}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown: ${essay.filter((b) => !hidden.has(b._key)).map((b) => textOf(b).slice(0, 70)).join(' | ')}`);
}

if (previewOut) {
  const cityIds = (doc.cities ?? []).map((c) => c._ref).filter(Boolean);
  const cities = await client.fetch('*[_id in $ids]', { ids: cityIds });
  const next = { ...doc, ...set };
  next.shapeOfDay = { ...doc.shapeOfDay, character: undefined, duration: set['shapeOfDay.duration'], where: set['shapeOfDay.where'] };
  delete next['shapeOfDay.duration']; delete next['shapeOfDay.where'];
  const dataset = [next, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready');
  await writeRollback(client, [DOC_ID], 'before-ultimate-luxor');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (--apply --flags-approved writes production)');
