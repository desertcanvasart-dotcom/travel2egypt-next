/**
 * Abydos & Dendera Temples from Luxor in the day-tour format, EN + ES + JA together. Owner,
 * 19 Nov: the locked copy (with the open-items answers of 19 Nov); prices last, from Autoura.
 *
 *   tour  wp-page-88178   /dendera-and-abydos-temples-from-luxor   (URL unchanged: no redirect)
 *
 * The product (owner, 19 Nov): Abydos first (the furthest point), lunch, then Dendera on the way
 * back. Entrance fees and lunch included, no tiers; children under 12 pay 50 %; no age line.
 * Title now "Abydos & Dendera Temples from Luxor" (follows the order). Guide in the page's
 * language, so ES/JA keep their own price (dendera-abydos-prices.json; --apply refuses while
 * any is null).
 *
 * Panel: the rule rows (children, pickup, back, lunch, guide language): the city is Luxor.
 *
 * Essay (Gate A.3, the approved corrections 1–7): the tier paragraph → "Entrance to both
 * temples and lunch at a local restaurant are included." (tier summary hidden); the private-tour
 * paragraph rewritten without tiers, with the guide "in your language" and no minimum age;
 * Dendera's inner rooms "where the colour survives far better"; "in many scholarly assessments
 * the greater ruler" removed; the route reordered to Abydos → Dendera, with its link sentences
 * rewritten (row 7). Kept (Tier 2): "one of the finest examples of New Kingdom relief carving",
 * "among the most satisfying things they do in Egypt".
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-dendera-abydos-2026-11-19.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-dendera-abydos-2026-11-19.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-dendera-abydos-2026-11-19.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88178';
const OLD = { from: 117, es: 128, ja: 135 };
const PRICES = JSON.parse(readFileSync(new URL('./dendera-abydos-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/dendera-abydos-from-luxor-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  abydos: 'guideArticle.sohag.abydos-temple',
  hathor: 'guideArticle.qena.the-temple-of-hathor',
  zodiac: 'guideArticle.qena.dendera-zodiac-and-the-osiris-chapels',
};
// Sites per stop that has them, in file order: "Abydos · Temple of Seti I", "King List · Osireion",
// "Temple of Hathor · Dendera Zodiac".
const SITE_GUIDES = [[null, G.abydos], [null, null], [G.hathor, G.zodiac]];
const DURATION_LABEL = { en: 'Extended · ~11 hrs', es: 'Jornada larga · ~11 h', ja: '長めの1日・約11時間' };
const DURATION_HOURS = 11;
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
      const stop = { title: plain(hm[1]) };
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
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
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
// Checked by hand (19 Nov), same meaning as EN: ES p2s0.x «Veinticuatro columnas» = 24 (the gate
// cannot read the word); JA writes four figures in kanji, which the gate does not read:
// p0s1.x 二千年 = 2,000 years · p0s2.x 七十六 = 76 kings · p2s0.x 二十四 = 24 columns ·
// wk0 四時間 = about four hours (二つ = the two sites is read).
const SAME_MEANING = { es: ['p2s0.x'], ja: ['p0s1.x', 'p0s2.x', 'p2s0.x', 'wk0'] };
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
        _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop', title: s.title, ...(s.text ? { text: s.text } : {}),
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
    included: fact(p.included, 'daein'), excluded: fact(p.excluded, 'daeout'), options: fact(p.options, 'daeopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.en, PRICES.es, PRICES.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

const CLOSING_REF = { en: '000000000037', es: '000000000039', ja: '000000000027' };
// The closing's second half · the tier summary (+ concierge GEM note) · the empty block ·
// (ES) the lead line · (JA) the concierge note.
const SKIP = {
  en: ['000000000039', '000000000047', '00000000004a'],
  es: ['00000000003b', '00000000004b', '00000000004e', '000000000003'],
  ja: ['000000000029', '000000000037', '00000000003a'],
};
// Whole blocks rewritten (one run, no marks): correction 1 and the private-tour paragraph.
const REPLACE = {
  en: {
    '000000000017': 'This is a private tour, operated for your party alone and never shared with other guests. Because it is private, it runs for as few as one traveller, with no minimum group size and no waiting on other bookings; larger parties are accommodated in a suitable vehicle. A private, air-conditioned vehicle, a licensed Egyptologist guide in your language and one bottle of mineral water per person are included.',
    '00000000001f': 'Entrance to both temples and lunch at a local restaurant are included.',
  },
  es: {
    '000000000019': 'Se trata de un tour estrictamente privado, operado en exclusiva para su grupo y nunca compartido con otros viajeros. Por su carácter privado, opera desde un único viajero, sin tamaño mínimo de grupo y sin esperar a otras reservas; los grupos más amplios se acomodan en un vehículo adecuado. Se incluyen un vehículo privado con aire acondicionado, un guía egiptólogo licenciado en su idioma y una botella de agua mineral por persona.',
    '000000000021': 'Se incluyen la entrada a ambos templos y el almuerzo en un restaurante local.',
  },
  ja: {},
};
// Correction 7: the route in the day's order — Abydos, then Dendera on the way back. These are
// the route's blocks in their NEW order; they take the route's existing slots.
const ROUTE = {
  en: ['00000000002b', '00000000002d', '00000000002f', '000000000031', '000000000033', '000000000023', '000000000025', '000000000027', '000000000029', '000000000035'],
  es: ['00000000002d', '00000000002f', '000000000031', '000000000033', '000000000035', '000000000025', '000000000027', '000000000029', '00000000002b', '000000000037'],
  ja: ['00000000001b', '00000000001d', '00000000001f', '000000000021', '000000000023', '000000000013', '000000000015', '000000000017', '000000000019', '000000000025'],
};
// [block, find, replace] — corrections 3, 5 and the route's link sentences (7).
const FIX = {
  en: [
    ['00000000002b', 'From Dendera, the drive continues north to Abydos, approximately ninety minutes further along the valley. Abydos is a different experience entirely', 'The day begins with a road transfer north from Luxor along the Nile\'s west bank to Abydos, about two and a half hours away. Abydos is a different experience from Dendera'],
    ['00000000002d', 'Seti I — father of Ramses II, and in many scholarly assessments the greater ruler — commissioned', 'Seti I — father of Ramses II — commissioned'],
    ['000000000023', 'The day begins with a road transfer north from Luxor along the Nile\'s west bank. The first stop, reached after roughly an hour, is the Temple of Hathor at Dendera', 'On the way back, about an hour from Luxor, the day stops at the Temple of Hathor at Dendera'],
    ['000000000025', 'essentially absent in the inner sanctuaries, which were sealed and forgotten until the nineteenth century, preserving their colour in a way that remains startling.', 'essentially absent in the inner rooms, where the colour survives far better.'],
    ['000000000035', 'The return drive to Luxor follows in the late afternoon.', 'From Dendera, the drive back to Luxor takes about an hour, arriving in the evening.'],
  ],
  es: [
    ['00000000002d', 'Desde Dendera, la marcha continúa hacia el norte hasta Abidos, aproximadamente noventa minutos más por el valle. Abidos es una experiencia completamente distinta:', 'El día arranca con un traslado por carretera hacia el norte desde Luxor, por la orilla occidental del Nilo, hasta Abidos, a unas dos horas y media. Abidos es una experiencia muy distinta de Dendera:'],
    ['00000000002f', 'Seti I —padre de Ramsés II y, en muchas evaluaciones académicas, gobernante mayor— encargó', 'Seti I —padre de Ramsés II— encargó'],
    ['000000000025', 'El día arranca con un traslado por carretera hacia el norte desde Luxor por la orilla occidental del Nilo. La primera parada, tras aproximadamente una hora, es el Templo de Hathor en Dendera,', 'De regreso, a una hora de Luxor, el día se detiene en el Templo de Hathor en Dendera,'],
    ['000000000027', 'prácticamente inexistente en los santuarios interiores, sellados y olvidados hasta el siglo XIX, que conservan su color con una nitidez que sigue desconcertando.', 'prácticamente inexistente en las salas interiores, donde el color se conserva mucho mejor.'],
    ['000000000037', 'El regreso a Luxor se realiza a última hora de la tarde.', 'Desde Dendera, el regreso a Luxor lleva alrededor de una hora; se llega por la tarde-noche.'],
  ],
  ja: [
    ['00000000001b', 'デンデラから、ドライブは渓谷をさらにおよそ90分進んで、北のアビドスへ続きます。', '一日は、ナイルの西岸沿いにルクソールから北へ、およそ2時間半の道のりでアビドスへ向かうことから始まります。'],
    ['00000000001d', 'セティ1世——ラムセス2世の父であり、多くの学術的な評価においてより偉大な統治者——は', 'セティ1世——ラムセス2世の父——は'],
    ['000000000013', '一日は、ナイルの西岸沿いにルクソールから北へ向かう陸路の移動で始まります。最初の立ち寄り先は、およそ1時間ののちに着くデンデラのハトホル神殿です——', '帰り道、ルクソールまでおよそ1時間のところで、デンデラのハトホル神殿に立ち寄ります——'],
    ['000000000015', '内陣ではほぼ皆無です。内陣は封じられ忘れられたまま19世紀まで残り、いまなお目を引くしかたで、その色彩を保存していました。', '内側の部屋ではほぼ皆無で、色彩もはるかによく残っています。'],
    ['000000000025', 'ルクソールへの帰路のドライブは、午後の遅い時刻に続きます。', 'デンデラからルクソールへはおよそ1時間で、夕方から夜に戻ります。'],
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
      if (i < 0 && children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x)))) continue; // re-run
      if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
      children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), (m) => (m.includes('’') ? repl.replace(/'/g, '’') : repl));
    }
    return { ...b, children };
  });
  // Reorder: the route blocks fill their own slots in the new order (re-runs are a no-op).
  const byKey = new Map(value.map((b) => [b._key, b]));
  const routeSet = new Set(ROUTE[l]);
  let next = 0;
  value = value.map((b) => (routeSet.has(b._key) ? byKey.get(ROUTE[l][next++]) : b));
  return { ...row, value };
});
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /\btiers?\b|Base \+|English-speaking|minimum age|sealed and forgotten|greater ruler|From Dendera, the drive continues|first stop/i,
  es: /\bniveles?\b|Base \+|habla hispana|edad mínima|sellados y olvidados|gobernante mayor|Desde Dendera, la marcha|primera parada/i,
  ja: /段階|パッケージ[A-ZＡ-Ｚ]|封じられ忘れられ|偉大な統治者|デンデラから、ドライブ|最初の立ち寄り先/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
  // Abydos before Dendera in the shown essay's route.
  const shown = row.value.filter((b) => !hidden.has(b._key)).map(textOf).join('\n');
  const abydos = { en: 'to Abydos, about two and a half', es: 'hasta Abidos, a unas dos horas', ja: '2時間半の道のりでアビドス' }[row._key];
  const dendera = { en: 'the day stops at the Temple of Hathor', es: 'el día se detiene en el Templo de Hathor', ja: 'デンデラのハトホル神殿に立ち寄ります' }[row._key];
  if (!(shown.indexOf(abydos) >= 0 && shown.indexOf(abydos) < shown.indexOf(dendera))) throw new Error(`${row._key}: the essay's route is not Abydos → Dendera`);
}

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
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

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log('prices: NOT READY — fill dendera-abydos-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
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
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill dendera-abydos-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-dendera-abydos-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
