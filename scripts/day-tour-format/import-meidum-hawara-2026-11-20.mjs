/**
 * Meidum & Hawara Pyramids: Private Day Tour from Cairo, in the day-tour format, EN + ES + JA
 * together. Owner, 19 Nov: the locked copy and its open items ("Instructions for Claude Code"
 * §1–§6). The day is now a pyramid day: Lake Qarun and Wadi el-Rayan are gone (they are in the
 * two-day Fayoum desert trip, which "Make it your own" links to).
 *
 *   tour  wp-page-87835   /fayoum-oasis-including-pyramids-of-meydum-hawara  →  /meidum-and-hawara-pyramids-from-cairo
 *   (the same document: reviews, images and references stay attached; 301s in the same commit,
 *   migration/redirect-map.*; hard-coded links to the old addresses are updated afterwards by
 *   relink-meidum-hawara-2026-11-20.mjs)
 *
 * The product (owner, 19 Nov): pickup → Meidum Pyramid → the Meidum mastabas (closed: a note,
 * not a visit) → lunch → a village monastery (unnamed, on purpose) → Hawara → back to Cairo.
 * Entrance to Meidum and Hawara (including the Meidum corridor), lunch, water and the driver's tip
 * included; no tiers; children under 12 pay 50 %; no age line (the old "minimum age 18" lives
 * only in shapeOfDay, which the day-tour layout does not render). About 10 hours. Guide in the
 * page's language, so ES/JA keep their own price (meidum-hawara-prices.json; --apply refuses while
 * any is null).
 *
 * New slugs: EN and ES as proposed; JA follows the repo's pattern (Hepburn romaji of the Japanese
 * title before the colon: kairo-hatsu-… as kairo-hatsu-hikoki-de-iku-rukusoru-…, meidumu / piramiddo
 * as the guide page /ja/guide/beni-suefu/meidumu-no-piramiddo), not the proposed English-spelled
 * cairo-hatsu-meidum-hawara-pyramid — reported in the PR.
 *
 * Panel: the city is Cairo, so the rule rows show (children 50 %, the Cairo/Giza pickup zones,
 * guide = page language); the intro carries the pickup line, the Back line and the lunch text, as
 * the Dendera & Abydos import does. The EN copy's "(ES: español · JA: 日本語)" note is an editor's
 * aside, not written.
 *
 * "Make it your own": the third option (the two-day Fayoum desert trip) links to that tour in each
 * locale (productFact.linkRef → wp-page-156014, /fayoum-desert-adventure; new field, this PR).
 *
 * Guide links (open items): Meidum Pyramid and Hawara Pyramid have guide pages and are linked from
 * their site lines. The Labyrinth, the Fayoum portraits and the Egyptian Museum have no site line
 * of their own in the locked copy (the Labyrinth has no guide page; the museum is named in the
 * mastaba note, which has no Sites line) — reported in the PR, not invented.
 *
 * Summary (the dek and, with no seo.metaDescription, the meta description): it named the "desert
 * oasis"; the new one names Meidum, the village monastery and Hawara (correction 8), in the locked
 * opening's own words. Title / SEO title / og:title follow the title (no seo.metaTitle).
 *
 * Essay (Gate A.3, corrections 1–9 of the open items):
 *   1 the Fayoum "80 metres below sea level" paragraph — hidden (skipRefs)
 *   2 the Lake Qarun / Wadi el-Rayan paragraph, with "Egypt's only significant natural waterfall" — hidden
 *   3 "By late morning the group moves on." — removed, not reworded: Meidum is now the first stop,
 *     so the sentence (and the "50 kilometres from the oasis" drive after it) no longer fits
 *   4 the mastaba sentence — the owner's wording (closed; statues and the Meidum Geese in Cairo)
 *   5 "one of Egypt's oldest lakes" — in the paragraph hidden by 2
 *   6 "another 25 kilometres or so to the north, back towards the oasis" — removed
 *   7 Fayoum portraits — the essay already says "among the most lifelike" (ES «figuran entre»,
 *     JA 「…のうちにあります」): no change needed
 *   8 the essay title names Meidum, the village monastery and Hawara; the dek likewise; the opening
 *     (100 km south-west, "three of those sites"), the Fayoum drive (90 minutes) and the Fayoum
 *     villages paragraph are hidden
 *   9 the concierge note "ten to twelve hours" → "about ten hours" (EN and ES, as the open items say;
 *     the day-tour layout does not render the concierge note in any locale). The note still speaks
 *     of Lake Qarun and Wadi El Rayan — hidden on the page; reported in the PR.
 * Also hidden: the closing's second half (the page has its own closing; the first half is
 * closingRef), the corridor helper note (now "Make it your own"), ES: the standfirst ("oasis, lago").
 *
 * needsReview: the open items ask for `needsReview: true`, but the site shows only rows with
 * needsReview == false (src/sanity/lib/queries.ts), so `true` would publish an empty page. As with
 * every page in this batch, nothing is written until the owner says publish; that OK is the
 * approval, and the rows are written approved.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-meidum-hawara-2026-11-20.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-meidum-hawara-2026-11-20.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-meidum-hawara-2026-11-20.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87835';
const FAYOUM_DESERT = 'wp-page-156014'; // /fayoum-desert-adventure
const OLD = { from: 186, es: 197, ja: 204 };
const PRICES = JSON.parse(readFileSync(new URL('./meidum-hawara-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/meidum-hawara-pyramids-from-cairo-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  meidum: 'guideArticle.beni-suef.pyramid-of-meidum',
  hawara: 'guideArticle.al-fayoum.the-pyramid-of-hawara',
};
// Sites per stop that has them, in file order: "Meidum Pyramid"; "Hawara Pyramid · the Labyrinth"
// (no guide page for the Labyrinth).
const SITE_GUIDES = [[G.meidum], [G.hawara, null]];
const DURATION_LABEL = { en: 'Full day · ~10 hrs', es: 'Día completo · ~10 h', ja: '終日・約10時間' };
const DURATION_HOURS = 10;
// New addresses (open items, "Proposed URLs"). JA: the repo's romaji pattern (see the header).
const NEW_SLUG = {
  en: 'meidum-and-hawara-pyramids-from-cairo',
  es: 'piramides-de-meidum-y-hawara-desde-el-cairo',
  ja: 'kairo-hatsu-meidumu-to-hawara-no-piramiddo',
};
// The dek / meta description: the locked opening's own words; Meidum, the monastery and Hawara.
const SUMMARY = {
  en: 'A private day from Cairo given entirely to two pyramids south of the city, Meidum and Hawara, with a quiet stop at a small village monastery in between.',
  es: 'Un día privado desde El Cairo dedicado por completo a dos pirámides al sur de la ciudad, Meidum y Hawara, con una parada tranquila en un pequeño monasterio de pueblo entre las dos.',
  ja: 'カイロの南にある二つのピラミッド、メイドゥームとハワラだけに捧げるプライベートな1日。そのあいだに小さな村の修道院に静かに立ち寄ります。',
};
// Correction 9 (the concierge note), EN and ES. Not rendered by the day-tour layout in any locale.
const CONCIERGE = {
  en: ['and ten to twelve hours only just holds both.', 'and about ten hours only just holds both.'],
  es: ['y las diez o doce horas apenas alcanzan para ambos.', 'y unas diez horas apenas alcanzan para ambos.'],
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch', back: 'Back' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo', back: 'Regreso' },
  ja: { pickup: 'お迎え', lunch: '昼食', back: 'お戻り' },
};
// "Make it your own": the option that names the two-day Fayoum trip links to it.
const FAYOUM_OPTION = { en: /two-day Fayoum desert trip/, es: /viaje de dos días por el desierto de El Fayum/, ja: /二日間のファイユーム砂漠の旅/ };
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
// Separator "·" with spaces around it (JA uses full-width spaces: "朝　·　メイドゥーム").
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
const siteStops = P.en.periods.flatMap((x) => x.stops).filter((s) => s.sites);
if (siteStops.length !== SITE_GUIDES.length || siteStops.some((s, i) => s.sites.length !== SITE_GUIDES[i].length)) throw new Error('sites ≠ SITE_GUIDES');
for (const l of LANGS) if (P[l].options.filter((o) => FAYOUM_OPTION[l].test(o)).length !== 1) throw new Error(`${l}: the Fayoum-trip option is not exactly one item`);
// Gate B (open items §5.2): the lakes appear nowhere in the locked copy.
for (const l of LANGS) if (/Qarun|Qarún|Rayan|カルーン|ラヤン/.test(JSON.stringify(P[l]))) throw new Error(`${l}: the locked copy names Lake Qarun or Wadi el-Rayan`);

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(Object.keys(PANEL.en).map((k) => [`panel.${k}`, p.panelRows[PANEL[l][k]]])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Checked by hand (20 Nov), same meaning as EN: ES p2s0.x «Amenemhat III, de la XII dinastía» = EN
// "Amenemhat III of the Twelfth Dynasty" (the gate reads "Twelfth" as 12, not the Roman XII). JA
// closing 「この二つ」 = EN "These" (the two pyramids); JA op1 「順番は私たちが組みます」 = EN "we'll
// sequence the two" (the museum day and this one): no figure added or lost.
const SAME_MEANING = { es: ['p2s0.x'], ja: ['closing', 'op1'] };
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
  const options = fact(p.options, 'mhopt').map((o) => (FAYOUM_OPTION[l].test(o.text) ? { ...o, linkRef: { _type: 'reference', _ref: FAYOUM_DESERT, _weak: true } } : o));
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
    included: fact(p.included, 'mhin'), excluded: fact(p.excluded, 'mhout'), options,
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
if (await client.getDocument(`drafts.${DOC_ID}`)) throw new Error(`drafts.${DOC_ID} exists — handle it first`);
const fayoum = await client.getDocument(FAYOUM_DESERT);
if (fayoum?.slug?.find((s) => s._key === 'en')?.value.current !== 'fayoum-desert-adventure') throw new Error(`${FAYOUM_DESERT} is no longer /fayoum-desert-adventure`);
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.en, PRICES.es, PRICES.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The closing's first half ("Egypt's most visited monuments survive…"), now the page's own closing.
const CLOSING_REF = { en: '000000000029', es: '00000000002b', ja: '000000000027' };
// Hidden from "More about this day": the opening (100 km south-west, "three of those sites") · the
// Fayoum paragraph (correction 1) · the drive to the Fayoum (90 minutes) · Lake Qarun and Wadi
// el-Rayan (corrections 2, 5) · the Fayoum villages and monasteries · the closing's second half ·
// the corridor helper note (now "Make it your own") · ES: the standfirst.
const SKIP = {
  en: ['000000000003', '000000000005', '00000000000d', '000000000013', '000000000015', '00000000002b', '00000000003a'],
  es: ['000000000003', '000000000005', '000000000007', '00000000000f', '000000000015', '000000000017', '00000000002d', '00000000003e'],
  ja: ['000000000009', '00000000000b', '000000000013', '000000000015', '000000000017', '000000000029', '000000000038'],
};
// [block, find, replace] — corrections 3, 4, 6, 8 (open items, Gate A.3). '' removes the text.
// Finds next to a bold run («Meidum», «Hawara») start or end at the run's edge.
const FIX = {
  en: [
    ['000000000001', 'One Day, Three Eras: Fayoum Oasis, Meidum, and Hawara', 'One Day, Three Eras: Meidum, a Village Monastery and Hawara'], // 8
    ['000000000019', 'By late morning the group moves on. ', ''], // 3
    ['000000000019', ' lies on the desert edge, roughly 50 kilometres from the oasis, and the drive there transitions quickly from the green of the cultivated depression back into pale open sand.', ' lies on the desert edge.'], // 8 (the drive from the oasis)
    ['000000000019', 'The nearby mastaba tombs of Rahotep and Nofret are among the finest of the Old Kingdom, their painted relief work still in good condition.', 'The mastaba tombs around the pyramid, including that of Rahotep and Nofret, are closed to visitors; their statues and the Meidum Geese are in the Egyptian Museum in Cairo.'], // 4
    ['00000000001f', ', another 25 kilometres or so to the north, back towards the oasis. This', '. This'], // 6
  ],
  es: [
    ['000000000001', 'Un día, tres épocas: el oasis de Fayoum, Meidum y Hawara', 'Un día, tres épocas: Meidum, un monasterio de pueblo y Hawara'],
    ['00000000001b', 'A media mañana, el grupo continúa. ', ''],
    ['00000000001b', ' se levanta en el borde del desierto, a unos 50 kilómetros del oasis, y el trayecto pasa rápidamente del verde de la depresión cultivada al arenal abierto.', ' se levanta en el borde del desierto.'],
    ['00000000001b', 'Las mastabas cercanas de Rahotep y Nofret figuran entre las mejores del Imperio Antiguo y sus relieves pintados aún se conservan en buenas condiciones.', 'Las mastabas que rodean la pirámide, entre ellas la de Rahotep y Nofret, están cerradas al público; sus estatuas y las Ocas de Meidum se encuentran en el Museo Egipcio de El Cairo.'],
    ['000000000021', ', otros 25 kilómetros aproximadamente al norte, de vuelta hacia el oasis. Esta', '. Esta'],
  ],
  ja: [
    ['000000000007', '一日、三つの時代：ファイユーム・オアシス、メイドゥム、ハワーラ', '一日、三つの時代：メイドゥム、村の修道院、ハワーラ'],
    ['000000000019', '午前の遅くには、一行は先へ進みます。', ''],
    ['000000000019', 'メイドゥムは砂漠の縁に、オアシスからおよそ50キロのところにあり、そこへのドライブは、耕されたくぼ地の緑から、淡く開けた砂へとすばやく移り変わります。', 'メイドゥムは砂漠の縁にあります。'],
    ['000000000019', '近くのラホテプとノフレトのマスタバ墓は、古王国時代でも最も見事なもののうちにあり、その彩色されたレリーフは今もよい状態を保っています。', 'ラホテプとノフレトの墓をはじめ、ピラミッドの周囲のマスタバ墓は公開されていません。その彫像と「メイドゥームの鵞鳥」は、カイロのエジプト考古学博物館にあります。'],
    ['00000000001d', '午後はハワーラに充てられます——もう25キロほど北、オアシスのほうへ戻ったところにあります。', '午後はハワーラに充てられます。'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
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
      // A run emptied by a removal goes (correction 3 leaves the bold «Meidum» run first).
      const kept = children.filter((c) => c.text !== '');
      return { ...b, children: kept.length ? kept : children.slice(0, 1) };
    }),
  };
});
// Nothing "More about this day" shows may keep what the page corrects or drops.
const RETIRED = {
  en: /Qarun|Rayan|waterfall|below sea level|100 kilometres|90 minutes|25 kilometres|50 kilometres|finest of the Old Kingdom|group moves on|Fayoum Oasis/i,
  es: /Qar[uú]n|Rayan|cascada|nivel del mar|100 kilómetros|90 minutos|25 kilómetros|50 kilómetros|mejores del Imperio Antiguo|el grupo continúa|oasis de Fayoum/i,
  ja: /カルーン|ラヤン|滝|海面下|100キロ|90分|25キロ|50キロ|最も見事|一行は|ファイユーム・オアシス/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
  const shown = row.value.filter((b) => !hidden.has(b._key)).map(textOf).join('\n');
  if (!/Rahotep|ラホテプ/.test(shown) || !/(closed|cerradas|公開されていません)/.test(shown)) throw new Error(`${row._key}: the mastaba note is not in the essay`);
}
const conciergeNote = (doc.conciergeNote ?? []).map((row) => {
  if (!CONCIERGE[row._key]) return row;
  const [find, repl] = CONCIERGE[row._key];
  if (!row.value.includes(find) && !row.value.includes(repl)) throw new Error(`${row._key}: concierge note changed since 19 Nov`);
  return { ...row, value: row.value.replace(find, repl) };
});
for (const l of Object.keys(CONCIERGE)) if (!conciergeNote.find((r) => r._key === l)) throw new Error(`${l}: no concierge note`);

// The new slugs must be free (any document type, in any locale).
const taken = await client.fetch('*[_id != $id && !(_id in path("drafts.**")) && count(slug[value.current in $slugs]) > 0]{_id}', { id: DOC_ID, slugs: Object.values(NEW_SLUG) });
if (taken.length) throw new Error(`new slug already used by ${taken.map((t) => t._id).join(', ')}`);

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  slug: doc.slug.map((s) => (NEW_SLUG[s._key] ? { ...s, value: { ...s.value, current: NEW_SLUG[s._key] } } : s)),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  conciergeNote,
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
if (!ready) console.log('prices: NOT READY — fill meidum-hawara-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  slug ${l}: ${doc.slug.find((s) => s._key === l)?.value.current} → ${NEW_SLUG[l]}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  concierge ${l}: ${conciergeNote.find((t) => t._key === l)?.value.slice(0, 200)}…`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
  console.log(`  options ${l}: ${JSON.stringify(B[l].options.map((o) => [o.text, o.linkRef?._ref ?? null]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const before = doc.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const old = before.find((x) => x._key === b._key);
    if (textOf(old) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 220)}…`);
  }
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown`);
}

if (previewOut) {
  const refs = await client.fetch('*[_id in $ids]', { ids: [...Object.values(G), FAYOUM_DESERT] });
  const cityIds = [...new Set([...refs.map((r) => r.parentCity?._ref), ...(doc.cities ?? []).map((c) => c._ref)].filter(Boolean))];
  const cities = await client.fetch('*[_id in $ids]', { ids: cityIds });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = NEW_SLUG[l];
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'approvedOptionLinks', 'dayTourFormat', 'durationHours', 'citySlugsEn', 'allSlugs'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill meidum-hawara-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-meidum-hawara-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
