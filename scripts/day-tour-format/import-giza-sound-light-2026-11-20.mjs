/**
 * The Giza Sound & Light Show: An Evening at the Pyramids, in the day-tour format, EN + ES + JA
 * together. Owner, 20 Nov: the locked copy and its open items.
 *
 *   tour  wp-page-110952   /the-giza-sound-and-light-show-experience   URL unchanged; no redirect.
 *
 * The product: evening pickup from a hotel in Cairo or Giza → seats facing the Sphinx → the show
 * (about 1 hour; the Sphinx narrates the story of the pyramids, Khufu, Khafre and Menkaure) → back
 * to the hotel. Private transfers, a representative (no guide), show tickets, a translation headset
 * if needed, water and the driver's tip. No lunch (an evening show). No tiers, no age line; children
 * under 12 pay 50 %. The duration is the show (about 1 hour) plus transfers and seating; the old
 * "~3 hrs" is gone. One period: Evening.
 *
 * Price: no guide, so ONE price for every language (guideLanguagePrices is removed, as on the
 * felucca page). giza-sound-light-prices.json holds it; --apply refuses while it is null. Autoura
 * has no fee for the Giza Sound & Light Show and no template for this evening yet (the evening car
 * card 'HOTEL-CAIRO-BY-NIGHT' exists).
 *
 * Panel: the copy's own rows (dayTourIntro.panelRows): children, pickup, the extra-charge pickup
 * areas, back. The Cairo rule rows would add "Lunch" and "Your guide speaks", which this evening
 * has neither of.
 *
 * Summary (dek / meta description): the old one said "the oldest stones on earth"; the new one is
 * built from the locked opening's own words.
 *
 * Essay (Gate A.3, corrections 1–8): 1–3, 7 the reigns passage (Thutmose IV and the Dream Stele,
 * Akhenaten, Nefertiti, Tutankhamun "the most complete royal burial ever found") becomes "The Sphinx
 * tells the story of the pyramids: how they were built, and the kings Khufu, Khafre and Menkaure";
 * the next paragraph's "1,500 years of history" aside goes with it; 4 the Sphinx "carved under
 * Khafre", no date; 5 "Translation headsets are available and included" (no languages listed);
 * 6 kept; 8 no "three hours" in the essay. Hidden from "More about this day": the closing's second
 * half (the page has its own closing), the concierge date/headset line, empty blocks, ES: the
 * standfirst and two helper lines. The concierge note (not rendered by the day-tour layout) is left
 * as it is.
 *
 * Guide links: Great Sphinx · Giza Plateau (the two sites the copy names). The Dream Stele /
 * Thutmose IV link the open items mention does not exist on this document.
 *
 * needsReview: rows are written approved, as with every page in this batch (true would publish an
 * empty page); nothing is written until the owner says publish.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-sound-light-2026-11-20.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-giza-sound-light-2026-11-20.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-sound-light-2026-11-20.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-110952';
const OLD = { from: 73, es: 84, ja: 91 };
const PRICES = JSON.parse(readFileSync(new URL('./giza-sound-light-prices.json', import.meta.url), 'utf8'));
const ready = typeof PRICES.price === 'number' && PRICES.price > 0;
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/giza-sound-and-light-show';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  sphinx: 'guideArticle.giza.the-great-sphinx',
  plateau: 'guideArticle.giza.the-giza-plateau',
};
// Sites: "Great Sphinx · Giza Plateau".
const SITE_GUIDES = [[G.sphinx, G.plateau]];
const DURATION_LABEL = { en: 'Evening · show ~1 hr', es: 'Noche · espectáculo ~1 h', ja: '夜・ショー約1時間' };
const DURATION_HOURS = 1;
// The dek / meta description: the locked opening's own words, naming all four stops.
const SUMMARY = {
  en: 'An evening at the pyramids: private transfers to the Giza Sound and Light Show, narrated by the Sphinx, with the monuments lit from below against the night sky.',
  es: 'Una noche en las pirámides: traslados privados al espectáculo de Luz y Sonido de Guiza, narrado por la Esfinge, con los monumentos iluminados desde abajo contra el cielo nocturno.',
  ja: 'ピラミッドで過ごす夜。専用車の送迎で、スフィンクスが語り手をつとめるギザの音と光のショーへ。下から照らされた遺跡が夜空に浮かびます。',
};
const PANEL = {
  en: { pickup: 'Pickup', back: 'Back' },
  es: { pickup: 'Recogida', back: 'Regreso' },
  ja: { pickup: 'お迎え', back: 'お戻り' },
};
const OPTIONAL_COST = ['extraTicket', 'extraCost'];
const PERIOD = { Evening: 'evening', Noche: 'evening', 夜: 'evening', Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 午前: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
// Separator "·" with spaces around it (JA uses full-width spaces: "朝　·　エジプト考古学博物館").
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
      if (p.startsWith('>')) continue; // "More about this day →" pointer
      const lines = p.split('\n');
      const inc = p.match(/^\*\*(.+?)\*\*\s+([\s\S]+)$/);
      if (inc && !lines[0].endsWith('**')) {
        // "**Inside a pyramid (included).** text" → the previous stop's includedNote, as one string.
        stops[stops.length - 1].includedNote = plain(`${inc[1]} ${inc[2]}`);
        continue;
      }
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected paragraph in "${head}": ${p.slice(0, 60)}`);
      const stop = { title: plain(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[:：]\*?[:：]?\s*(.+)$/);
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
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0, !!s.includedNote, s.optional?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup', 'back']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
const siteStops = P.en.periods.flatMap((x) => x.stops).filter((s) => s.sites);
if (siteStops.length !== SITE_GUIDES.length || siteStops.some((s, i) => s.sites.length !== SITE_GUIDES[i].length)) throw new Error('sites ≠ SITE_GUIDES');

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(Object.keys(PANEL.en).map((k) => [`panel.${k}`, p.panelRows[PANEL[l][k]]])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text], [`p${pi}s${si}.inc`, s.includedNote], ...(s.optional ?? []).map((o, i) => [`p${pi}s${si}.o${i}`, o])])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Checked by hand: filled in after the first run.
const SAME_MEANING = { es: [], ja: [] };
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
        ...(s.includedNote ? { includedNote: s.includedNote } : {}),
        // Khufu's interior = extra ticket, the camel ride = extra cost (file order).
        ...(s.optional ? { skipGlance: true, optional: s.optional.map((text, k) => ({ _key: `o${k + 1}`, _type: 'dayTourOptional', text, cost: OPTIONAL_COST[k] })) } : {}),
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
      panelRows: p.ownRows.map((r, i) => ({ _key: `pr${i + 1}`, _type: 'dayPanelRow', ...r })),
      returnNote: p.panelRows[PANEL[l].back],
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'slin'), excluded: fact(p.excluded, 'slout'), options: fact(p.options, 'slopt'),
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
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.price, '', ''].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's closing, first half ("…will not rewrite what you know…"), now the page's own closing.
const CLOSING_REF = { en: '000000000021', es: '000000000029', ja: '000000000027' };
// The closing's second half · the concierge date/headset line · empty blocks · ES: the standfirst
// and two helper lines.
const SKIP = {
  en: ['000000000023', '000000000031', '000000000034'],
  es: ['000000000003', '00000000002b', '00000000003b', '00000000003e'],
  ja: ['000000000029', '000000000037', '00000000003a'],
};
// Whole-paragraph rewrites: the show's narrative (corrections 1, 2, 3, 7).
const REPLACE = {
  en: {
    '000000000011': "The production opens with the Sphinx delivering its own narration — a device that sounds kitschy in description but works reasonably well in execution, largely because the monument's sheer physical presence does most of the dramatic lifting. The Sphinx tells the story of the pyramids: how they were built, and the kings Khufu, Khafre and Menkaure.",
  },
  es: {
    '000000000015': 'La producción abre con la Esfinge encargada de la narración —un recurso que en descripción suena kitsch pero funciona razonablemente bien en la ejecución, sobre todo porque la pura presencia física del monumento hace la mayor parte del trabajo dramático—. La Esfinge cuenta la historia de las pirámides: cómo se construyeron y los reyes Keops, Kefrén y Micerinos.',
  },
  ja: {
    '000000000017': '演目は、スフィンクスが自ら語りをつとめることで開きます——説明にするとけばけばしく聞こえる仕掛けですが、上演ではまずまずうまく働きます——おもに、その記念建造物のまぎれもない物理的な存在感が劇的な持ち上げの大半を担うからです。スフィンクスが語るのはピラミッドの物語——それがどのように築かれたか、そしてクフ王、カフラー王、メンカウラー王のことです。',
  },
};
// [block, find, replace] — corrections 4 and 5, and the "1,500 years" aside that went with the reigns.
const FIX = {
  en: [
    ['00000000000f', 'during the reign of Pharaoh Khafre, around 2500 BC, and measuring', 'under Khafre, and measuring'], // 4
    ['000000000013', 'The chronology is loose — the show compresses roughly 1,500 years of history into under an hour — but it touches', 'The chronology is loose, but it touches'],
    ['000000000019', 'Headsets providing commentary translation are available free of charge in nine languages: English, French, German, Spanish, Italian, Russian, Japanese, Polish, and Arabic.', 'Translation headsets are available and included.'], // 5
  ],
  es: [
    ['000000000013', 'durante el reinado del faraón Kefrén, hacia 2500 a. C., y que mide', 'bajo Kefrén, y que mide'],
    ['000000000017', 'La cronología es laxa —el espectáculo comprime aproximadamente 1500 años de historia en menos de una hora—, pero toca', 'La cronología es laxa, pero toca'],
    ['00000000001d', 'Hay auriculares con la traducción del comentario gratuitos en nueve lenguas: inglés, francés, alemán, español, italiano, ruso, japonés, polaco y árabe.', 'Los auriculares con la traducción están disponibles e incluidos.'],
  ],
  ja: [
    ['000000000015', 'カフラー王の治世、紀元前2500年ごろに一塊の岩の露頭から彫り出された', 'カフラー王の時代に一塊の岩の露頭から彫り出された'],
    ['000000000019', '年代の運びはゆるやかです——ショーはおおよそ1,500年の歴史を一時間足らずに圧縮します——けれど、', '年代の運びはゆるやかですが、'],
    ['00000000001f', '解説の翻訳を提供するヘッドセットが、九つの言語で無料で用意されています——英語、フランス語、ドイツ語、スペイン語、イタリア語、ロシア語、日本語、ポーランド語、そしてアラビア語。', '翻訳ヘッドセットが用意されており、料金に含まれます。'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...Object.keys(REPLACE[l]), ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
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
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /Thutmos|Dream Stele|Akhenaten|Nefertiti|Tutankhamun|most complete royal burial|nine languages|around 2500 BC|1,500 years/i,
  es: /Tutmosis|Estela del Sueño|Akenatón|Nefertiti|Tutankamón|más completo jamás|nueve lenguas|hacia 2500 a\. C\.|1500 años/i,
  ja: /トトメス|夢の碑|アクエンアテン|ネフェルティティ|ツタンカーメン|最も完全な王の埋葬|九つの言語|紀元前2500年|1,500年/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
}
const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  durationLabel: LANGS.map((l) => ({ ...(doc.durationLabel?.find((t) => t._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: DURATION_LABEL[l] })),
  durationHours: DURATION_HOURS,
  ...(ready ? { priceFrom: PRICES.price } : {}),
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
if (!ready) console.log('price: NOT READY — fill giza-sound-light-prices.json from Autoura (one price; no guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const before = doc.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const old = before.find((x) => x._key === b._key);
    if (textOf(old) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 160)}…`);
  }
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown`);
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
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn', 'allSlugs'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill giza-sound-light-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-giza-sound-light-day-tour');
  await client.patch(DOC_ID).set(set).unset(['guideLanguagePrices']).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
