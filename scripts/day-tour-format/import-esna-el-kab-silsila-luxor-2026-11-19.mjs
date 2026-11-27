/**
 * Esna, El Kab & Gebel Silsila from Luxor in the day-tour format, EN + ES + JA together. Owner,
 * 19 Nov: the locked copy and its open-items answers ("Instructions for Claude Code").
 *
 *   tour  wp-page-88167   /esna-temple-and-el-kab-day-tour-from-luxor  →  /esna-el-kab-and-gebel-silsila-from-luxor
 *   (the same document: reviews, images and references stay attached; 301s in the same commit,
 *   migration/redirect-map.*; hard-coded links to the old addresses: relink-esna-luxor-2026-11-19.mjs)
 *
 * The product (owner, 19 Nov): Nekhen REMOVED (closed, needs permission); Gebel Silsila added as
 * the third and furthest stop. Pickup in the morning, Esna → El Kab → lunch → Gebel Silsila → the
 * drive back. Private; entrance to all three and lunch included, no tiers (owner rule 8); children
 * under 12 pay 50 %; no age line (rule 9). Title "Esna, El Kab & Gebel Silsila: Private Day Tour
 * from Luxor". Guide in the page's language, so ES/JA keep their own price
 * (esna-el-kab-silsila-luxor-prices.json; --apply refuses while any is null). Duration stays
 * "about 10 hours" until the owner confirms it (open items, To confirm 1): durationLabel and
 * durationHours are not touched.
 *
 * New slugs: EN and ES as proposed; JA follows the repo's pattern (romaji of the Japanese title,
 * like the old rukusoru-hatsu-esuna-eru-kabu-… and the sister page's asuwan-hatsu-edofu-eru-kabu-
 * geberu-shirushira), not the proposed English-spelled luxor-hatsu-esna-el-kab-gebel-silsila.
 *
 * Panel: the rule rows (children, pickup, back, lunch, guide language): the city is Luxor.
 *
 * Summary (the dek under the H1 and the meta description, as the doc has no seo field): the old
 * one described Nekhen ("the ruins of a city that predates the pharaohs"); a new one names Esna,
 * El Kab and Gebel Silsila, in the locked copy's words.
 *
 * Essay (Gate A.3, corrections 1–7): every Nekhen passage removed (its two route paragraphs
 * hidden; Nekhen/Predynastic sentences cut from the opening, the crowds line and the closing
 * note), the tier paragraph → "Entrance to all three sites and lunch at a local restaurant are
 * included." (1; the tier summary hidden), the guide "in your language" and no minimum age (2),
 * Esna's texts "among the last great religious texts written in hieroglyphs" (3), (4) kept,
 * "Pahery" → "Paheri" (6), the essay title (7). The opening's third site is Gebel Silsila in the
 * page's own words ("the sandstone cliffs of Gebel Silsila, where the stone for Karnak and Luxor
 * was cut"). "One to two hours of driving each way" (true of the old Nekhen route) is cut, as
 * the owner has not confirmed Silsila's distance. The Silsila passage (row 8) comes later from
 * the owner: no gap or placeholder is left for it.
 *
 * needsReview: the open items ask for `needsReview: true`, but the site shows only rows with
 * needsReview == false (src/sanity/lib/queries.ts), so `true` would publish an empty page. As
 * with every page in this batch, nothing is written until the owner says publish; that OK is the
 * approval, and the rows are written approved.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-esna-el-kab-silsila-luxor-2026-11-19.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-esna-el-kab-silsila-luxor-2026-11-19.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-esna-el-kab-silsila-luxor-2026-11-19.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88167';
const OLD = { from: 82, es: 93, ja: 100 };
const PRICES = JSON.parse(readFileSync(new URL('./esna-el-kab-silsila-luxor-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/esna-el-kab-gebel-silsila-from-luxor-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  khnum: 'guideArticle.esna.the-temple-of-khnum-at-esna',
  elkab: 'guideArticle.edfu.elkab',
  silsila: 'guideArticle.kom-ombo.gebel-el-silsila',
  speos: 'guideArticle.kom-ombo.speos-of-horemheb',
};
// Sites per stop that has them, in file order: "Temple of Khnum, Esna"; "El Kab · Tomb of Ahmose
// son of Ibana · Tomb of Paheri" (no guide page for the two tombs, as on the Edfu page);
// "Gebel Silsila · Speos of Horemheb". No Nekhen / Hierakonpolis / Narmer link anywhere.
const SITE_GUIDES = [[G.khnum], [G.elkab, null, null], [G.silsila, G.speos]];
// New addresses (open items, Proposed URLs). JA: the repo's romaji pattern (see the header).
const NEW_SLUG = {
  en: 'esna-el-kab-and-gebel-silsila-from-luxor',
  es: 'esna-el-kab-y-gebel-silsila-desde-luxor',
  ja: 'rukusoru-hatsu-esuna-eru-kabu-geberu-shirushira',
};
// The dek under the H1 and the meta description (the old one described Nekhen), in the locked
// copy's words.
const SUMMARY = {
  en: 'A private full day south of Luxor: the Roman-era Temple of Khnum at Esna, the tombs of El Kab, and the sandstone cliffs of Gebel Silsila, where the stone for Karnak and Luxor was cut.',
  es: 'Un día privado al sur de Luxor: el templo de Jnum en Esna, de época romana, las tumbas de El Kab y los acantilados de arenisca de Gebel Silsila, donde se cortó la piedra de Karnak y Luxor.',
  ja: 'ルクソールの南で過ごすプライベートな1日。エスナのローマ時代のクヌム神殿、エル・カブの墓、そしてカルナックやルクソールの石が切り出されたゲベル・シルシラの砂岩の崖を訪ねます。',
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch', back: 'Back' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo', back: 'Regreso' },
  ja: { pickup: 'お迎え', lunch: '昼食', back: 'お戻り' },
};
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 午前: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
// Separator "·" with spaces around it (JA uses full-width spaces: "朝　·　アビドス").
const SEP = /\s+·\s+/;
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = plain(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${l}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelRows = Object.fromEntries(panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], plain(m[2])]));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [word, ...labelParts] = head.split(SEP);
    const period = PERIOD[word.trim()];
    if (!period || !labelParts.length) throw new Error(`${l}: unknown period heading "${head}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this day →" pointer
      const lines = p.split('\n');
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected paragraph in "${head}": ${p.slice(0, 60)}`);
      // "09:00 · Pickup from your hotel" / JA "09:00　·　ホテルでのお迎え": the time is its own field.
      const [first, ...restTitle] = plain(hm[1]).split(SEP);
      const stop = /^\d\d:\d\d$/.test(first) && restTitle.length ? { time: first, title: restTitle.join(' · ') } : { title: plain(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[:：]\*?[:：]?\s*(.+)$/);
        if (sm) stop.sites = sm[2].split(SEP).map((x) => plain(x));
        else body.push(ln);
      }
      if (body.length) stop.text = plain(body.join(' '));
      stops.push(stop);
    }
    return { period, periodLabel: plain(labelParts.join(' · ')), stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk).map(plain) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, periods,
    opening: plain(paras(opening.text)[0]), whyThisOrder: plain(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text).map(plain), closingLine: plain(tail[tail.length - 1]),
  };
}
const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(l)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [s.time ?? '', !!s.text, s.sites?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup', 'lunch', 'back']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(Object.keys(PANEL.en).map((k) => [`panel.${k}`, p.panelRows[PANEL[l][k]]])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Checked by hand (19 Nov), same meaning as EN: the Esna stop (p0s1.x) writes its figures in kanji,
// 「約九メートル」 = "some nine metres" and 「二千年分」 = "two thousand years", which the gate does
// not read (九 before メ, 千 after a kanji); 「紀元1世紀」 = "the 1st century AD".
const SAME_MEANING = { es: [], ja: ['p0s1.x'] };
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
      pickupLine: p.panelRows[PANEL[l].pickup], returnNote: p.panelRows[PANEL[l].back],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'esin'), excluded: fact(p.excluded, 'esout'), options: fact(p.options, 'esopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.en, PRICES.es, PRICES.ja].join(), ',,'].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The closing line's first half (the locked closing line is shown on its own).
const CLOSING_REF = { en: '000000000033', es: '000000000035', ja: '000000000023' };
// Hidden from "More about this day": the closing's second half · the two Nekhen route paragraphs ·
// the tier summary with the Narmer Palette concierge pairing (JA: the concierge note) · the empty
// block · (ES) the lead line ("cuatro mil años", Nekhen's span).
const SKIP = {
  en: ['000000000035', '000000000029', '00000000002b', '000000000043', '000000000046'],
  es: ['000000000037', '00000000002b', '00000000002d', '000000000047', '00000000004a', '000000000003'],
  ja: ['000000000025', '000000000019', '00000000001b', '000000000033', '000000000036'],
};
// Whole blocks rewritten (one run, no marks): correction 1. JA has no tier paragraph.
const REPLACE = {
  en: { '00000000001d': 'Entrance to all three sites and lunch at a local restaurant are included.' },
  es: { '00000000001f': 'Se incluyen la entrada a los tres lugares y el almuerzo en un restaurante local.' },
  ja: {},
};
// The route keeps its order (Esna → El Kab → the drive back); Nekhen's paragraphs are hidden.
const ROUTE = { en: [], es: [], ja: [] };
// [block, find, replace], each inside one text run (the private-tour paragraph has bold runs; a
// run emptied by a fix is dropped) — correction 7 (essay title), the opening without Nekhen (its third
// site now Gebel Silsila, in the page's words), the crowds line, the driving time of the old
// route, correction 2 + no age line, correction 3, correction 6, the closing note without Nekhen.
const FIX = {
  en: [
    ['000000000001', 'South of Luxor: A Day Among Esna, El Kab, and the Ruins of Nekhen', 'South of Luxor: Esna, El Kab & Gebel Silsila'],
    ['000000000003', 'running south of Luxor towards Edfu holds three sites that between them span roughly four thousand years of continuous human occupation:', 'running south of Luxor holds three sites that most visitors never reach:'],
    ['000000000003', 'and a scatter of mud-brick ruins that represent nothing less than the political capital of Upper Egypt before writing was fully invented.', 'and the sandstone cliffs of Gebel Silsila, where the stone for Karnak and Luxor was cut.'],
    ['000000000005', 'at El Kab or Nekhen', 'at El Kab or Gebel Silsila'],
    ['000000000005', 'Expect a full day on the road, with roughly one to two hours of driving each way from Luxor depending on your starting point.', 'Expect a full day on the road.'],
    ['000000000015', 'licensed, English-speaking Egyptologist guide', 'licensed Egyptologist guide in your language'],
    ['000000000015', ' are included in every tier. Given the long drive, the heat, and the rough ground at Nekhen and El Kab, the ', ' are included'],
    ['000000000015', 'minimum age for this tour is 18', ''],
    ['000000000021', 'the last significant body of religious writing produced in that script before knowledge of it was lost entirely.', 'among the last great religious texts written in hieroglyphs.'],
    ['000000000027', 'The tombs of Pahery and Renni', 'The tombs of Paheri and Renni'],
    ['000000000031', 'you begin with Rome, move back to the New Kingdom, and end in the Predynastic', 'you begin with Rome and move back to the New Kingdom'],
    ['000000000031', ' Nekhen shows the moment before Egypt was Egypt. Taken together, the three sites compress something close to four thousand years of human history into a single day\'s drive.', ''],
  ],
  es: [
    ['000000000001', 'Al sur de Luxor: una jornada entre Esna, El Kab y las ruinas de Nejen', 'Al sur de Luxor: Esna, El Kab y Gebel Silsila'],
    ['000000000005', 'que discurre al sur de Luxor hacia Edfu reúne tres yacimientos que entre los tres cubren cerca de cuatro mil años de ocupación humana continua:', 'que discurre al sur de Luxor reúne tres lugares a los que la mayoría de los visitantes nunca llega:'],
    ['000000000005', 'y una dispersión de ruinas de adobe que constituyen, ni más ni menos, la capital política del Alto Egipto antes de que la escritura estuviera plenamente desarrollada.', 'y los acantilados de arenisca de Gebel Silsila, donde se cortó la piedra de Karnak y Luxor.'],
    ['000000000007', 'en El Kab o en Nejen', 'en El Kab o en Gebel Silsila'],
    ['000000000007', 'Cuente con una jornada larga en carretera, con aproximadamente una a dos horas de conducción en cada sentido desde Luxor según el punto de partida.', 'Cuente con una jornada larga en carretera.'],
    ['000000000017', 'en un vehículo adecuado. Cada nivel incluye ', 'en un vehículo adecuado. Incluye '],
    ['000000000017', 'guía egiptólogo licenciado de habla hispana', 'guía egiptólogo licenciado en su idioma'],
    ['000000000017', '. Dada la duración del trayecto, el calor y el terreno irregular de Nejen y El Kab, la ', ''],
    ['000000000017', 'edad mínima para este tour es de 18 años', ''],
    ['000000000023', '—el último corpus significativo de escritura religiosa producido en esa grafía antes de que su lectura se perdiera por completo—.', '—entre los últimos grandes textos religiosos escritos en jeroglíficos—.'],
    ['000000000029', 'Las tumbas de Pahery y Renni', 'Las tumbas de Paheri y Renni'],
    ['000000000033', 'se empieza con Roma, se retrocede al Imperio Nuevo y se termina en el Predinástico', 'se empieza con Roma y se retrocede al Imperio Nuevo'],
    ['000000000033', ' Nejen muestra el momento previo a que Egipto fuera Egipto. Tomados juntos, los tres sitios comprimen algo cercano a cuatro mil años de historia humana en una sola jornada de carretera.', ''],
  ],
  ja: [
    ['000000000007', 'ルクソールの南へ：エスナ、エル・カブ、そしてネケンの遺跡をめぐる一日', 'ルクソールの南へ：エスナ、エル・カブ、ゲベル・シルシラ'],
    ['000000000009', 'ルクソールからエドフへ向かって南へ走るナイルの一区間には、合わせておよそ四千年にわたる連続した人の居住をまたぐ三つの遺跡があります', 'ルクソールから南へ走るナイルの一区間には、ほとんどの旅行者が足を運ばない三つの遺跡があります'],
    ['000000000009', 'そして、文字が完全に発明される前の上エジプトの政治の都にほかならない、点在する日干し煉瓦の遺跡です。', 'そして、カルナックやルクソールの石が切り出されたゲベル・シルシラの砂岩の崖です。'],
    ['00000000000b', 'エル・カブやネケンで', 'エル・カブやゲベル・シルシラで'],
    ['00000000000b', '出発地点にもよりますが、ルクソールからの片道でおよそ1時間から2時間の運転を伴います。', ''],
    ['000000000011', 'それは、その文字の知識がすっかり失われる前に、その筆記体系で生み出された、最後の意味のある一群の宗教的な文章です。', 'それは、この文字で記された最後期の偉大な宗教文書の一つです。'],
    ['000000000021', 'ローマに始まり、新王国へさかのぼり、先王朝で終わる', 'ローマに始まり、新王国へさかのぼる'],
    ['000000000021', 'ネケンは、エジプトがエジプトになる前の瞬間を示します。合わせて見れば、三つの遺跡は、四千年近い人類史を、一日のドライブのなかに凝縮するのです。', ''],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...Object.keys(REPLACE[l]), ...ROUTE[l], ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
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
      children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), (m) => (m.includes('’') ? repl.replace(/'/g, '’') : repl));
    }
    return { ...b, children: children.filter((c) => c.text !== '') };
  });
  // Reorder: the route blocks fill their own slots in the new order (re-runs are a no-op).
  const byKey = new Map(value.map((b) => [b._key, b]));
  const routeSet = new Set(ROUTE[l]);
  let next = 0;
  value = value.map((b) => (routeSet.has(b._key) ? byKey.get(ROUTE[l][next++]) : b));
  return { ...row, value };
});
// Nothing "More about this day" shows may keep Nekhen, the tiers, the age line or what the page
// corrects (open items: "every mention is gone").
const RETIRED = {
  en: /Nekhen|Hierakonpolis|Narmer|Predynastic|City of the Falcon|before writing|\btiers?\b|Base \+|English-speaking|minimum age|Pahery|last significant body|four thousand years|one to two hours|towards Edfu/i,
  es: /Nejen|Nekhen|Hierak[oó]mpolis|Narmer|Predin[aá]stic|ciudad del halc[oó]n|escritura estuviera|\bniveles?\b|Base \+|habla hispana|edad m[ií]nima|Pahery|[uú]ltimo corpus|cuatro mil años|una a dos horas|hacia Edfu/i,
  ja: /ネケン|ヒエラコンポリス|ナルメル|先王朝|隼の都市|文字が完全に発明|段階|十八歳|18歳|最後の意味のある|四千年|1時間から2時間|エドフへ向かって/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
  // Esna before El Kab, and the drive back last, in the shown essay's route.
  const shown = row.value.filter((b) => !hidden.has(b._key)).map(textOf).join('\n');
  const esna = { en: 'The day begins at the Temple of Khnum in Esna', es: 'El día arranca en el Templo de Khnum', ja: '一日は、ルクソールの南へ' }[row._key];
  const elkab = { en: 'the route continues south to El Kab', es: 'la ruta sigue al sur hasta El Kab', ja: '東岸に位置するエル・カブへ' }[row._key];
  const back = { en: 'The return to Luxor completes the day', es: 'El regreso a Luxor cierra el día', ja: 'ルクソールへの帰路が一日を締めくくり' }[row._key];
  const at = [esna, elkab, back].map((x) => shown.indexOf(x));
  if (!(at[0] >= 0 && at[0] < at[1] && at[1] < at[2])) throw new Error(`${row._key}: the essay's route is not Esna → El Kab → back (${at})`);
}

// The new slugs must be free.
const taken = await client.fetch('*[_type == "tour" && _id != $id && !(_id in path("drafts.**")) && count(slug[value.current in $slugs]) > 0]{_id}', { id: DOC_ID, slugs: Object.values(NEW_SLUG) });
if (taken.length) throw new Error(`new slug already used by ${taken.map((t) => t._id).join(', ')}`);

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  slug: doc.slug.map((s) => (NEW_SLUG[s._key] ? { ...s, value: { ...s.value, current: NEW_SLUG[s._key] } } : s)),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  ...(ready ? { priceFrom: PRICES.en, guideLanguagePrices: { ...(doc.guideLanguagePrices ?? { _type: 'object' }), es: PRICES.es, ja: PRICES.ja } } : {}),
  dayTourIntro: LANGS.map((l) => ({ ...B[l].intro, closingRef: CLOSING_REF[l], skipRefs: SKIP[l] })),
  dayTimeline: LANGS.flatMap((l) => B[l].timeline),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  body,
};
for (const f of ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions']) set[f] = curlyRows(set[f], 'en');

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
// Owner rule (27 Nov): a missing Autoura price never holds the itinerary back. Unpriced, the page
// publishes with the old Esna + El Kab price REMOVED (it priced a different, shorter trip).
if (!ready) console.log(`prices: NOT READY — publishing WITHOUT a price (removes ${priceNow}); fill esna-el-kab-silsila-luxor-prices.json from Autoura and re-run to add it.`);

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  slug ${l}: ${doc.slug.find((s) => s._key === l)?.value.current} → ${NEW_SLUG[l]}`);
  console.log(`  summary ${l}: ${doc.summary?.find((s) => s._key === l)?.value} → ${SUMMARY[l]}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [(s.time ? s.time + ' · ' : '') + s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const before = doc.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const old = before.find((x) => x._key === b._key);
    if (textOf(old) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 160)}…`);
  }
  console.log(`  essay ${l} order: ${essay.map((b) => b._key.slice(-2)).join(' ')}`);
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  const empty = essay.filter((b) => !hidden.has(b._key) && !textOf(b).trim()).map((b) => b._key);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown${empty.length ? `, EMPTY shown: ${empty.join(', ')}` : ''}`);
}

if (previewOut) {
  const refs = await client.fetch('*[_id in $ids]', { ids: Object.values(G) });
  const cityIds = [...new Set([...refs.map((r) => r.parentCity?._ref), ...(doc.cities ?? []).map((c) => c._ref)].filter(Boolean))];
  const cities = await client.fetch('*[_id in $ids]', { ids: cityIds });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = NEW_SLUG[l];
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [DOC_ID], 'before-esna-el-kab-silsila-luxor-day-tour');
  await client.patch(DOC_ID).set(set).unset(ready ? [] : ['priceFrom', 'guideLanguagePrices']).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
