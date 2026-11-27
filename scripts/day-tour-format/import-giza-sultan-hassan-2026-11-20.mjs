/**
 * Giza Pyramids, Sultan Hassan & Khan El Khalili in the day-tour format, EN + ES + JA together.
 * Owner, 20 Nov: the locked copy and its open items ("Instructions for Claude Code" §1–§6).
 *
 *   tour  wp-page-87829   /giza-pyramids-the-citadel-cairo-bazaar-day-tour  →  /giza-pyramids-sultan-hassan-and-khan-el-khalili
 *   (the same document: reviews, images and references stay attached; 301s in the same commit,
 *   migration/redirect-map.*: 3 added, 2 repointed, 0 chains; hard-coded links to the old addresses
 *   are updated afterwards by relink-giza-sultan-hassan-2026-11-20.mjs)
 *
 * The product: pickup → Giza Plateau (the three pyramids, inside Khafre or Menkaure included, the
 * Sphinx) → lunch → Sultan Hassan and al-Rifa'i in the square below the Citadel → Khan El Khalili →
 * back. The Citadel itself is NOT a stop ("Worth knowing" says so); no panorama stop. Khufu's
 * interior and the camel ride are extra (the standing Giza rule). No tiers; children under 12 pay
 * 50 %; no age line. Guide in the page's language, so ES/JA keep their own price
 * (giza-sultan-hassan-prices.json, from Autoura T2E-DT-CAI-09).
 *
 * New slugs: EN and ES as proposed; JA follows the repo's pattern (Hepburn romaji of the Japanese
 * title before the colon, as #312 and #315 did), not the proposed English-spelled
 * giza-pyramid-sultan-hassan-khan-el-khalili — reported in the PR.
 *
 * Summary (dek / meta description): the old one led with "the last surviving wonder" and named no
 * stop; the new one, from the locked opening's words, names Giza, Sultan Hassan (and al-Rifa'i,
 * below the Citadel) and Khan El Khalili, and does not make the Citadel a stop.
 *
 * Essay (Gate A.3, corrections 1–9): 1 "Entrance to the plateau and one pyramid interior is
 * included; the Great Pyramid of Khufu is an extra ticket"; 2 "a pair of mosques below the
 * Citadel", and the opening's fix carried into the essay's first paragraph ("built their pyramids,
 * among them the only ancient wonder still standing"); 3 the Sphinx superlative REMOVED
 * (docs/established-superlatives.md has no approved row); 4 "one of the great mosques of the Islamic
 * world"; 5 kept; 6 the camel line as on the page; 7 "a working market since the 14th century";
 * 8 no title / dek / summary names the Citadel as a stop; 9 no panorama mention exists. Hidden from
 * "More about this day": the closing (the page has its own), the interiors helper line (it says the
 * interiors are paid at the gate), ES: the standfirst. The café keeps each locale's spelling
 * (open item: one site-wide spelling still to be chosen). The concierge note (not rendered by the
 * day-tour layout) is left as it is.
 *
 * Guide links: Khufu · Khafre · Menkaure · Great Sphinx · Sultan Hassan · Khan El Khalili. No guide
 * page exists for al-Rifa'i or Al-Fishawy; the GEM has only blog articles.
 *
 * needsReview: rows are written approved, as with every page in this batch (true would publish an
 * empty page); nothing is written until the owner says publish.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-sultan-hassan-2026-11-20.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-giza-sultan-hassan-2026-11-20.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-sultan-hassan-2026-11-20.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87829';
const OLD = { from: 86, es: 97, ja: 104 };
const PRICES = JSON.parse(readFileSync(new URL('./giza-sultan-hassan-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/giza-pyramids-sultan-hassan-khan-el-khalili-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  khufu: 'guideArticle.giza.the-great-pyramid-of-khufu',
  khafre: 'guideArticle.giza.pyramid-of-khafre',
  menkaure: 'guideArticle.giza.pyramid-of-menkaure',
  sphinx: 'guideArticle.giza.the-great-sphinx',
  hassan: 'guideArticle.cairo.mosque-madrassa-of-sultan-hassan',
  khan: 'guideArticle.cairo.khan-el-khalili',
};
// Sites per stop, in file order: the three pyramids; the Sphinx; "Sultan Hassan · Al-Rifa'i" (no
// guide page for al-Rifa'i); "Khan El Khalili · Al-Fishawy" (no guide page for the café).
const SITE_GUIDES = [[G.khufu, G.khafre, G.menkaure], [G.sphinx], [G.hassan, null], [G.khan, null]];
// New addresses (open items §3). JA: the repo's romaji pattern (see the header).
const NEW_SLUG = {
  en: 'giza-pyramids-sultan-hassan-and-khan-el-khalili',
  es: 'piramides-de-guiza-sultan-hassan-y-jan-el-jalili',
  ja: 'giza-no-piramiddo-sorutan-hasan-mosuku-han-hariri',
};
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '1日・約8時間' };
const DURATION_HOURS = 8;
// The dek / meta description: the locked opening's own words, naming all four stops.
const SUMMARY = {
  en: 'A private day in Cairo: the Giza Plateau and the Sphinx, the great mosques of Sultan Hassan and al-Rifa’i below the Citadel, and the medieval market of Khan El Khalili.',
  es: 'Un día privado en El Cairo: la meseta de Guiza y la Esfinge, las grandes mezquitas de Sultán Hassan y al-Rifai al pie de la Ciudadela, y el mercado medieval del Jan el-Jalili.',
  ja: 'カイロのプライベートな1日。ギザ台地とスフィンクス、シタデルのふもとのスルタン・ハサン・モスクとリファーイー・モスク、そして中世の市場ハーン・ハリーリ。',
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const OPTIONAL_COST = ['extraTicket', 'extraCost'];
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

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
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0, !!s.includedNote, s.optional?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
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
    ...Object.fromEntries(Object.keys(PANEL.en).map((k) => [`panel.${k}`, p.panelRows[PANEL[l][k]]])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text], [`p${pi}s${si}.inc`, s.includedNote], ...(s.optional ?? []).map((o, i) => [`p${pi}s${si}.o${i}`, o])])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Checked by hand (20 Nov), same meaning as EN: ES opening «la IV dinastía» = "the Fourth Dynasty" (Roman numeral); ES p0s1.x «146,5 metros» (decimal comma). JA p2s0.x 「五世紀半」 (kanji) and 「二つの建物」 (the two mosques); JA wk0 「六〜七時間」 (kanji).
const SAME_MEANING = { es: ['opening', 'p0s1.x'], ja: ['p2s0.x', 'wk0'] };
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
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'shin'), excluded: fact(p.excluded, 'shout'), options: fact(p.options, 'shopt'),
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
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's closing ("One day is not enough. But it is a serious beginning."), now the page's own.
const CLOSING_REF = { en: '000000000029', es: '00000000002b', ja: '000000000025' };
// The interiors helper line (it says the interiors are paid at the gate) · ES: the standfirst.
const SKIP = {
  en: ['000000000038'],
  es: ['000000000003', '00000000003c'],
  ja: ['000000000034'],
};
// [block, find, replace] — corrections 1, 2 (+ the opening's fix), 3, 4, 6 and 7.
const FIX = {
  en: [
    ['000000000003', 'built the only ancient wonder still standing — to a pair of Mamluk and Khedival mosques perched on the ridge below the Citadel,', 'built their pyramids, among them the only ancient wonder still standing — to a pair of mosques below the Citadel,'], // 2
    ['000000000013', ' At roughly 73 metres long and 20 metres high, it is the largest monolithic statue surviving from the ancient world.', ' It is roughly 73 metres long and 20 metres high.'], // 3
    ['000000000017', 'is one of the largest mosques ever built:', 'is one of the great mosques of the Islamic world:'], // 4
    ['000000000021', 'the market district established in the 14th century on the site of a Fatimid royal necropolis.', 'a working market since the 14th century, on the site of a Fatimid royal necropolis.'], // 7
    ['000000000025', 'Entrance to the plateau itself is included in the entrance-fee tiers of this tour; entrance to the interiors of the pyramids is not, and involves additional fees paid on-site (the chambers', 'Entrance to the plateau and one pyramid interior is included; the Great Pyramid of Khufu is an extra ticket (the chambers'], // 1
    ['000000000025', 'Camel and horse rides are offered independently by operators at the site; your guide can advise, but these are entirely at your own expense and discretion.', 'A camel ride is an optional extra. We work with handlers we know, whose animals are in good condition.'], // 6
  ],
  es: [
    ['000000000005', 'levantaron la única maravilla antigua aún en pie— a un par de mezquitas mameluca y jedivial encaramadas en la cresta bajo la Ciudadela,', 'levantaron sus pirámides, entre ellas la única maravilla antigua aún en pie— a un par de mezquitas al pie de la Ciudadela,'],
    ['000000000015', ' Con unos 73 metros de largo y 20 metros de altura, es la mayor estatua monolítica que sobrevive del mundo antiguo.', ' Mide unos 73 metros de largo y 20 metros de altura.'],
    ['000000000019', 'es una de las mezquitas más grandes jamás construidas:', 'es una de las grandes mezquitas del mundo islámico:'],
    ['000000000023', 'el distrito comercial fundado en el siglo XIV sobre el solar de una necrópolis real fatimí.', 'un mercado en activo desde el siglo XIV, sobre el solar de una necrópolis real fatimí.'],
    ['000000000027', 'La entrada a la meseta está incluida en las tarifas de entrada de este tour; el acceso al interior de las pirámides, no, e implica tasas adicionales pagadas in situ (las cámaras', 'La entrada a la meseta y al interior de una pirámide está incluida; la Gran Pirámide de Keops requiere entrada aparte (las cámaras'],
    ['000000000027', 'Los paseos en camello y en caballo los ofrecen operadores independientes en el sitio; el guía puede aconsejar, pero corren por cuenta y criterio del viajero.', 'El paseo en camello es un extra opcional. Trabajamos con cuidadores que conocemos, cuyos animales están en buen estado.'],
  ],
  ja: [
    ['000000000009', '第四王朝の三人のファラオが、いまも現存する唯一の古代の不思議を築いた地——から、城塞の下の尾根に据えられたマムルーク朝とヘディーヴ朝の一対のモスクへ、', '第四王朝の三人のファラオがピラミッドを築き、そのなかにいまも現存する唯一の古代の不思議がある地——から、城塞の下の一対のモスクへ、'],
    ['000000000015', '長さおよそ73メートル、高さ20メートルで、古代世界から残る最大の一枚岩の彫像です。', '長さおよそ73メートル、高さ20メートルです。'],
    ['000000000017', 'これまでに建てられた最大のモスクのひとつです', 'イスラム世界の偉大なモスクのひとつです'],
    ['00000000001d', '14世紀にファーティマ朝の王室墓地の跡地に開かれた市場の一角です。', '14世紀から商いが続く、ファーティマ朝の王室墓地の跡地の市場です。'],
    ['000000000021', '高原そのものへの入場はこのツアーに含まれます——ピラミッドの内部への入場は含まれず、現地でお支払いの追加料金を伴います（内部', '高原への入場とピラミッド1基の内部見学は含まれます。クフ王の大ピラミッドは別途チケットです（内部'],
    ['000000000021', 'ラクダと馬の乗馬は現地の業者が独自に提供しています——ガイドが助言できますが、これらはまったくお客様のご負担とご判断にお任せします。', 'ラクダ乗りはオプションです。動物を良い状態で世話している、私たちの知る業者と組んでいます。'],
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
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /entrance-fee tiers|largest monolithic|largest mosques|Khedival mosques perched|established in the 14th|horse rides|paid on-site|built the only ancient wonder/i,
  es: /tarifas de entrada de este tour|mayor estatua|más grandes jamás|encaramadas|fundado en el siglo XIV|caballo|in situ|levantaron la única/i,
  ja: /最大の一枚岩|最大のモスク|尾根|開かれた市場|馬の乗馬|現地でお支払い|唯一の古代の不思議を築いた/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
}
// The new slugs must be free (any document type, in any locale).
const taken = await client.fetch('*[_id != $id && !(_id in path("drafts.**")) && count(slug[value.current in $slugs]) > 0]{_id}', { id: DOC_ID, slugs: Object.values(NEW_SLUG) });
if (taken.length) throw new Error(`new slug already used by ${taken.map((t) => t._id).join(', ')}`);

const set = {
  slug: doc.slug.map((s) => (NEW_SLUG[s._key] ? { ...s, value: { ...s.value, current: NEW_SLUG[s._key] } } : s)),
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

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log('prices: NOT READY — fill giza-sultan-hassan-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  slug ${l}: ${doc.slug.find((s) => s._key === l)?.value.current} → ${NEW_SLUG[l]}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · lunch: ${B[l].intro.lunch.text}`);
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
    const slug = NEW_SLUG[l];
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn', 'allSlugs'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill giza-sultan-hassan-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-giza-sultan-hassan-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
