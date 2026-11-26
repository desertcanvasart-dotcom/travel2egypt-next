/**
 * Giza Pyramids, the Sphinx, Al-Muizz Street & Khan El Khalili in the day-tour format,
 * EN + ES + JA together. Owner, 19 Nov: the locked copy and its open-items answers
 * ("For Claude Code").
 *
 *   tour  wp-page-88093   /pyramids-of-giza-and-sphinx   (URL kept in every locale; no redirect)
 *
 * The product (owner, 19 Nov): 09:00 pickup → Giza Plateau (Khufu, Khafre and Menkaure, the
 * Sphinx) → lunch → Al-Muizz Street → Khan El Khalili → back. The Giza rule: the inside of Khafre
 * or Menkaure included; Khufu and the camel ride extra (checked below against the locked lists).
 * Entrance to the Qalawun and al-Ghuri complexes, lunch, water and the driver's tip included; no
 * tiers; children under 12 pay 50 %; no age line. New title "Giza Pyramids, the Sphinx, Al-Muizz
 * Street & Khan El Khalili: Private Day Tour" ("& Old Cairo" is gone: the afternoon is Islamic
 * Cairo). Guide in the page's language, so ES/JA keep their own price (giza-muizz-prices.json;
 * --apply refuses while any is null).
 *
 * Panel: the city is Cairo, so the rule rows show (children 50 %, the Cairo/Giza pickup zones,
 * guide = page language); pickupTime 09:00 puts the time in the Pickup row. No Back row (the copy
 * gives no return time). The EN copy's "(ES: español · JA: 日本語)" note is an editor's aside.
 *
 * Summary (the dek and, with no seo.metaDescription, the meta description): it must name Al-Muizz
 * Street and Khan El Khalili and must not say "Old Cairo" (open items). The new one is built from
 * the locked opening's own words. Title / SEO title / og:title follow the title (the document has
 * no seo.metaTitle).
 *
 * Essay (Gate A.3, the correction table 1–9): 1 "the only one of the Seven Wonders still
 * standing"; 2 "still the largest stone structure ever constructed" REMOVED (no approved Tier 1
 * wording in docs/established-superlatives.md); 3 "the only ancient wonder still standing"; 4 "near
 * the top"; 5 Menkaure's "best preserved" claim removed (the valley-temple stonework sentence
 * stays); 6 the 8 cm / 230 m figures removed, "tolerances … a modern surveyor" kept; 7 "some of the
 * finest Mamluk stonework" (Tier 2); 8 the essay title's "Old Cairo" → Al-Muizz Street and Khan El
 * Khalili; 9 "typically 8 or 9 a.m." → 09:00. The closing line's "light at eight in the morning"
 * becomes "the morning light" (open items), and that block is the page's own closing (closingRef).
 * The concierge note needs no correction (no figure, no 08:00); the day-tour layout does not render
 * it.
 * Left out of "More about this day": the helper note (now "Make it your own") and empty trailing
 * blocks; ES: the standfirst and the two trailing lines; JA: the concierge line.
 *
 * Not linked (no guide page): the open items' "Giza Pyramids" (no overview page; each pyramid has
 * its own) and the Grand Egyptian Museum (blog articles only) — reported in the PR.
 *
 * needsReview: the open items ask for `needsReview: true`, but the site shows only rows with
 * needsReview == false (src/sanity/lib/queries.ts), so `true` would publish an empty page. As
 * with every page in this batch, nothing is written until the owner says publish; that OK is the
 * approval, and the rows are written approved.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-muizz-2026-11-20.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-giza-muizz-2026-11-20.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-muizz-2026-11-20.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88093';
const SLUG = { en: 'pyramids-of-giza-and-sphinx' };
const OLD = { from: 86, es: 97, ja: 104 };
const PRICES = JSON.parse(readFileSync(new URL('./giza-muizz-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/giza-pyramids-sphinx-al-muizz-khan-el-khalili-day-tour';
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
  muizz: 'guideArticle.cairo.sharia-al-muizz-li-din-allah',
  qalawun: 'guideArticle.cairo.madrassa-mausoleum-of-qalawun',
  ghuri: 'guideArticle.cairo.al-ghuriyya-complex',
  khan: 'guideArticle.cairo.khan-el-khalili',
};
// Sites per stop that has them, in file order: "Great Pyramid of Khufu"; "Pyramid of Khafre ·
// Pyramid of Menkaure"; "Great Sphinx"; "Al-Muizz Street · Qalawun Complex · Al-Ghuri Complex";
// "Khan El Khalili".
const SITE_GUIDES = [[G.khufu], [G.khafre, G.menkaure], [G.sphinx], [G.muizz, G.qalawun, G.ghuri], [G.khan]];
// The owner's itinerary order (open items, "For Claude Code").
const ORDER = ['Pickup from your hotel', 'The Great Pyramid of Khufu', 'Khafre and Menkaure', 'The Great Sphinx', 'Optional extras, if you’ve chosen them', 'Lunch at a local restaurant (included)', 'Al-Muizz Street', 'Khan El Khalili', 'Back to your hotel'];
const PICKUP_TIME = '09:00';
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '終日・約8時間' };
const DURATION_HOURS = 8;
const SUMMARY = {
  en: 'A private day in Cairo: the three pyramids and the Sphinx in the quiet of the morning, then the Fatimid and Mamluk city of Al-Muizz Street and Khan El Khalili in the afternoon.',
  es: 'Un día privado en El Cairo: las tres pirámides y la Esfinge en la calma de la mañana y, por la tarde, la ciudad fatimí y mameluca de la calle Al-Muizz y el Jan el-Jalili.',
  ja: 'カイロのプライベートな1日。朝の静けさのなかで三大ピラミッドとスフィンクスを、午後はファーティマ朝とマムルーク朝の街、ムイッズ通りとハーン・ハリーリを。',
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
// Separator "·" with spaces around it (JA uses full-width spaces: "朝　·　ギザ台地").
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
      const tm = hm[1].match(/^(\d\d:\d\d)\s*[·・]\s*(.+)$/);
      const stop = tm ? { time: tm[1], title: plain(tm[2]) } : { title: plain(hm[1]) };
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
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [s.time ?? null, !!s.text, s.sites?.length ?? 0, !!s.includedNote, s.optional?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup', 'lunch']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
for (const l of LANGS) if (!P[l].panelRows[PANEL[l].pickup].startsWith(PICKUP_TIME) && !P[l].panelRows[PANEL[l].pickup].includes(PICKUP_TIME)) throw new Error(`${l}: the pickup row does not say ${PICKUP_TIME}`);
const enStops = P.en.periods.flatMap((x) => x.stops.map((s) => s.title));
if (JSON.stringify(enStops) !== JSON.stringify(ORDER)) throw new Error(`EN stop order is not the owner's:\n ${enStops.join(' → ')}`);
if (P.en.periods[0].stops[0].time !== PICKUP_TIME) throw new Error('the pickup stop is not at 09:00');
const siteStops = P.en.periods.flatMap((x) => x.stops).filter((s) => s.sites);
if (siteStops.length !== SITE_GUIDES.length || siteStops.some((s, i) => s.sites.length !== SITE_GUIDES[i].length)) throw new Error('sites ≠ SITE_GUIDES');
// The Giza rule: the inside of Khafre or Menkaure included; Khufu and the camel ride extra.
if (!P.en.included.some((t) => /inside one pyramid: Khafre or Menkaure/i.test(t))) throw new Error('Giza rule: Khafre/Menkaure interior not in Included');
if (!P.en.excluded.some((t) => /Great Pyramid of Khufu/.test(t)) || !P.en.excluded.some((t) => /Camel ride/i.test(t))) throw new Error('Giza rule: Khufu / camel not in Not included');
if (P.en.included.some((t) => /Khufu|camel/i.test(t))) throw new Error('Giza rule: Khufu or the camel listed as included');

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(Object.keys(PANEL.en).map((k) => [`panel.${k}`, p.panelRows[PANEL[l][k]]])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text], [`p${pi}s${si}.i`, s.includedNote], ...(s.optional ?? []).map((o, oi) => [`p${pi}s${si}.o${oi}`, o])])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Checked by hand (20 Nov), same meaning as EN: why — ES «de mayo a septiembre» / JA 「5月から9月」
// = EN "from May to September" (the gate reads the month names as 5 and 9 in ES/JA only; the open
// items list 5 and 9 as JA additions). p0s1.x — ES «2,3 millones» / JA 「約230万」 = EN "2.3
// million" (the gate splits the ES decimal comma and reads JA 万 as 2,300,000). JA op0 「二〜三時間」
// = EN "two to three extra hours" (kanji numerals, which the gate does not read).
const SAME_MEANING = { es: ['why', 'p0s1.x'], ja: ['why', 'p0s1.x', 'op0'] };
for (const l of ['es', 'ja']) {
  const en = flat('en'), lc = flat(l);
  for (const k of SAME_MEANING[l]) { if (!(k in lc)) throw new Error(`${l}: SAME_MEANING key ${k} not found`); delete en[k]; delete lc[k]; console.log(`numeric gate (${l}): ${k} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

/* ── Build ────────────────────────────────────────────────────────────── */
const COST = ['extraTicket', 'extraCost'];
function optional(l, list) {
  return list.map((t, i) => {
    const o = { _key: `o${i + 1}`, _type: 'dayTourOptional', text: t, cost: COST[i] };
    if (i !== 1) return o;
    // The camel ride keeps the welfare line as a note: split after the first sentence.
    const m = l === 'ja' ? t.match(/^(.+?。)(.+)$/) : t.match(/^(.+?\.)\s+(.+)$/);
    if (!m) throw new Error(`${l}: cannot split the camel line "${t}"`);
    return { ...o, text: m[1], note: m[2] };
  });
}
function build(l) {
  const p = P[l];
  let siteStop = 0;
  const timeline = p.periods.map((x, pi) => ({
    _key: `dt-${l}-${pi + 1}`, _type: 'dayTourPeriod', lang: l, period: x.period, periodLabel: x.periodLabel,
    stops: x.stops.map((s, si) => {
      const guides = s.sites ? SITE_GUIDES[siteStop++] : null;
      if (s.sites && guides.length !== s.sites.length) throw new Error(`${l}: site/guide count mismatch at ${s.title}`);
      return {
        _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop', ...(s.time ? { time: s.time } : {}), title: s.title,
        ...(s.optional ? { skipGlance: true } : {}), ...(s.text ? { text: s.text } : {}),
        ...(s.sites ? { sites: s.sites.map((name, k) => ({ _key: `x${pi + 1}${si + 1}${k}`, _type: 'dayTourSite', name, ...(guides[k] ? { guideRef: { _type: 'reference', _ref: guides[k], _weak: true } } : {}) })) } : {}),
        ...(s.includedNote ? { includedNote: s.includedNote } : {}),
        ...(s.optional ? { optional: optional(l, s.optional) } : {}),
      };
    }),
    source: SRC(l), needsReview: false,
  }));
  if (siteStop !== SITE_GUIDES.length) throw new Error(`${l}: ${siteStop} stops with sites, SITE_GUIDES has ${SITE_GUIDES.length}`);
  const fact = (list, prefix) => list.map((t, i) => ({ _key: `${prefix}${i + 1}-${l}`, _type: 'productFact', lang: l, text: t, source: SRC(l), needsReview: false }));
  return {
    timeline,
    intro: {
      _key: `dti-${l}`, _type: 'dayTourIntro', lang: l,
      opening: p.opening, whyThisOrder: p.whyThisOrder,
      pickupTime: PICKUP_TIME,
      pickupLine: p.panelRows[PANEL[l].pickup],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'gmin'), excluded: fact(p.excluded, 'gmout'), options: fact(p.options, 'gmopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
if (doc.slug.find((s) => s._key === 'en')?.value.current !== SLUG.en) throw new Error(`EN slug is not ${SLUG.en}`);
if (await client.getDocument(`drafts.${DOC_ID}`)) throw new Error(`drafts.${DOC_ID} exists — handle it first`);
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.en, PRICES.es, PRICES.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's closing line ("Start early. …"), corrected and now the page's own closing.
const CLOSING_REF = { en: '000000000021', es: '000000000025', ja: '000000000027' };
// The helper note (now "Make it your own") and empty trailing blocks · ES: the standfirst and the
// two trailing lines · JA: the concierge line and an empty block.
const SKIP = {
  en: ['00000000002f', '000000000032'],
  es: ['000000000003', '000000000035', '000000000038'],
  ja: ['000000000035', '000000000038'],
};
// [block, find, replace] — corrections 1–9 (open items, Gate A.3).
const FIX = {
  en: [
    ['000000000001', 'Giza to Old Cairo: One Day Across Four Thousand Years', 'Giza to Al-Muizz Street and Khan El Khalili: One Day Across Four Thousand Years'], // 8
    ['000000000003', 'the oldest intact wonder of the ancient world', 'the only ancient wonder still standing'], // 3
    ['000000000007', 'An early start, typically 8 or 9 a.m., rewards you', 'An early start, at 09:00, rewards you'], // 9
    ['00000000000d', 'built around 2560 BC and still the largest stone structure ever constructed.', 'built around 2560 BC.'], // 2
    ['00000000000d', 'the engineering precision: the four base sides deviate from perfect alignment by less than eight centimetres across 230 metres. However the ancient Egyptians managed it,', 'the engineering precision: however the ancient Egyptians managed it,'], // 6
    ['00000000000f', 'still adheres to the top third,', 'still adheres near the top,'], // 4
    ['000000000011', "Menkaure's mortuary complex is the best preserved of the three, and the quality of the stonework in its valley temple", 'The quality of the stonework in its valley temple'], // 5
    ['000000000015', 'is among the finest Mamluk stonework in Egypt', 'is some of the finest Mamluk stonework in Egypt'], // 7
    ['00000000001b', 'The three pyramids are the only surviving structure from the original Seven Wonders of the Ancient World, and they predate', 'The Great Pyramid is the only one of the Seven Wonders still standing, and it predates'], // 1
    ['00000000001b', 'They were already ancient when Cleopatra was born.', 'The pyramids were already ancient when Cleopatra was born.'], // 1 (the subject follows)
    ['000000000021', 'but the light at eight in the morning is not.', 'but the morning light isn’t.'], // the closing line (open items)
  ],
  es: [
    ['000000000001', 'De Guiza a El Cairo antiguo: un día a través de cuatro mil años', 'De Guiza a la calle Al-Muizz y el Jan el-Jalili: un día a través de cuatro mil años'],
    ['000000000005', 'la maravilla intacta más antigua del mundo', 'la única maravilla antigua que sigue en pie'],
    ['000000000009', 'Una salida temprana, típicamente a las 8 o 9 de la mañana, recompensa', 'Una salida temprana, a las 09:00, recompensa'],
    ['00000000000f', 'construida hacia 2560 a. C. y aún hoy la mayor estructura de piedra jamás levantada.', 'construida hacia 2560 a. C.'],
    ['00000000000f', 'la precisión ingenieril: los cuatro lados de la base se desvían de la alineación perfecta menos de ocho centímetros en 230 metros. Sea como fuese que', 'la precisión ingenieril: sea como fuese que'],
    ['000000000011', 'sigue adherida al tercio superior,', 'sigue adherida cerca de la cima,'],
    ['000000000013', 'El complejo funerario de Micerinos es el mejor conservado de los tres, y la calidad del trabajo', 'La calidad del trabajo'],
    ['000000000019', 'son uno de los mejores trabajos en piedra mamelucos de Egipto', 'están entre los mejores trabajos en piedra mamelucos de Egipto'],
    ['00000000001f', 'Las tres pirámides son la única estructura superviviente de las siete maravillas originales del mundo antiguo y preceden', 'La Gran Pirámide es la única de las siete maravillas del mundo antiguo que sigue en pie y precede'],
    ['00000000001f', 'Eran ya antiguas cuando Cleopatra nació.', 'Las pirámides eran ya antiguas cuando Cleopatra nació.'],
    ['000000000025', 'pero la luz a las ocho de la mañana no lo es.', 'pero la luz de la mañana no.'],
  ],
  ja: [
    ['000000000007', 'ギザからオールド・カイロへ：四千年を横断する一日', 'ギザからムイッズ通りとハーン・ハリーリへ：四千年を横断する一日'],
    ['000000000009', '古代世界で最も古い無傷の七不思議の基部', '今も建つ唯一の古代の七不思議の基部'],
    ['00000000000d', '早めの出発——たいてい午前8時か9時——は', '09:00の早めの出発は'],
    ['000000000013', '紀元前2560年ごろに築かれ、いまだ建造された最大の石造構造物です。', '紀元前2560年ごろに築かれました。'],
    ['000000000013', 'あまり説明されないのは工学の精度です——四つの基底の辺は、230メートルにわたって完全な整列から8センチ未満しか逸れていません。古代エジプト人が', 'あまり説明されないのは工学の精度です。古代エジプト人が'],
    ['000000000015', 'いまも上の三分の一に付着しており', 'いまも頂上付近に付着しており'],
    ['000000000017', 'メンカウラー王の葬祭複合体は三基で最も保存状態がよく、その河岸神殿の石工の質は', 'メンカウラー王の河岸神殿の石工の質は'],
    ['00000000001b', 'エジプトで最も優れたマムルーク朝の石工のひとつです', 'エジプトでも屈指のマムルーク朝の石工です'],
    ['000000000021', '三基のピラミッドは、もとの古代世界の七不思議で唯一現存する構造物であり、', '大ピラミッドは、古代世界の七不思議で唯一今も建っているものであり、'],
    ['000000000027', '午前8時の光はそうではありません。', '朝の光は違います。'],
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
        if (i < 0 && children.some((c) => [repl, repl.replace(/'/g, '’'), repl.replace(/’/g, "'")].some((x) => c.text.includes(x)))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), repl);
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /Old Cairo|oldest intact|8 or 9|largest stone|top third|best preserved|eight centimetres|230 metres|among the finest|only surviving structure|eight in the morning/i,
  es: /El Cairo antiguo|intacta más antigua|8 o 9|mayor estructura|tercio superior|mejor conservado|ocho centímetros|230 metros|uno de los mejores|única estructura superviviente|ocho de la mañana/i,
  ja: /オールド・カイロ|最も古い無傷|8時か9時|最大の石造|三分の一|最も保存状態|8センチ|230メートル|最も優れた|唯一現存する構造物|午前8時/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: the page still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
  if (!/Muizz|ムイッズ/.test(textOf(row.value[0]))) throw new Error(`${row._key}: the essay title does not name Al-Muizz Street`);
}
for (const l of LANGS) {
  for (const s of [P[l].title, SUMMARY[l]]) if (RETIRED[l].test(s)) throw new Error(`${l}: title/summary still says "${s.match(RETIRED[l])[0]}"`);
  if (!/Muizz|ムイッズ/.test(SUMMARY[l]) || !/Khalili|Jalili|ハリーリ/.test(SUMMARY[l])) throw new Error(`${l}: summary must name Al-Muizz Street and Khan El Khalili`);
}

const set = {
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
if (!ready) console.log('prices: NOT READY — fill giza-muizz-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  slug ${l}: ${doc.slug.find((s) => s._key === l)?.value.current} (unchanged)`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupTime} · ${B[l].intro.pickupLine} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.time, s.title, (s.sites ?? []).map((z) => z.name), s.includedNote ? 'incl' : undefined, (s.optional ?? []).map((o) => [o.text, o.cost, o.note ? 'note' : undefined])].filter(Boolean))]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const before = doc.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const old = before.find((x) => x._key === b._key);
    if (textOf(old) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 200)}…`);
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
  if (!ready) throw new Error('prices not ready — fill giza-muizz-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-giza-muizz-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
