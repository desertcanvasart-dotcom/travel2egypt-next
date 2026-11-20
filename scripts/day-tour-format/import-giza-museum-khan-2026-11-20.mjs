/**
 * Giza Pyramids, the Sphinx, the Egyptian Museum & Khan El Khalili in the day-tour format,
 * EN + ES + JA together. Owner, 19 Nov: the locked copy and its open-items answers.
 *
 *   tour  tour.private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar
 *   URL unchanged in all three locales; no redirect (open items).
 *
 * The product (owner, 19 Nov): pickup → Giza Plateau (the three pyramids, inside Khafre or
 * Menkaure included, the Sphinx) → lunch → the Egyptian Museum on Tahrir Square (not the GEM) →
 * Khan El Khalili → back. Khufu's interior and the camel ride are extra (the standing Giza rule).
 * The "substitute the GEM" option is gone from the copy, the essay and the concierge text; the
 * GEM or the NMEC is offered on another day. No tiers; children under 12 pay 50 %; no age line.
 * Title "Giza Pyramids, the Sphinx, the Egyptian Museum & Khan El Khalili: Private Day Tour".
 * Guide in the page's language, so ES/JA keep their own price (giza-museum-khan-prices.json;
 * --apply refuses while any is null — Autoura has no Cairo template for this day yet).
 *
 * Panel: Cairo, so the rule rows show (children 50 %, the Cairo/Giza pickup zones, guide = page
 * language); the intro carries the pickup line and the lunch text, as the Museum + Coptic import
 * does. The EN copy's "(ES: español · JA: 日本語)" note is an editor's aside, not written.
 * "Inside a pyramid (included)." becomes the three-pyramids stop's includedNote, and the optional
 * extras become the stop's optional rows (Khufu = extra ticket, camel = extra cost), as in the
 * Giza, Memphis & Saqqara import.
 *
 * Summary (the dek and, with no seo.metaDescription, the meta description): the old one said
 * "the world's largest collection of pharaonic antiquities"; the new one is built from the locked
 * opening's own words and names all three stops.
 *
 * Essay (Gate A.3, corrections 1–7): 1 "averaging about 2.5 tonnes"; 2 "has lost about nine
 * metres, mostly with its casing and capstone"; 3 the Sphinx superlative REMOVED
 * (docs/established-superlatives.md has no approved Tier 1 row yet); 4 the concierge note "a vast
 * pharaonic collection" (EN, ES, and JA too, though the day-tour layout renders it in no locale);
 * 5 Historic Cairo: "lined with medieval Islamic architecture", the wording already live on the
 * Cairo car-and-guide page; 6 the GEM's "displayed together for the first time" removed (the
 * approved GEM wording is "the complete Tutankhamun collection"; content-lint flags "for the first
 * time"); 7 the swap offer becomes "add the GEM on another day", and the concierge line that offered
 * the swap is left out of "More about this day".
 * Left out of "More about this day": the closing's second half (the page has its own closing), the
 * swap line / helper notes, empty blocks, ES: the standfirst.
 *
 * needsReview: as with every page in this batch, nothing is written until the owner says publish;
 * that OK is the approval, and the rows are written approved (needsReview: true would publish an
 * empty page — src/sanity/lib/queries.ts shows only needsReview == false).
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-museum-khan-2026-11-20.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-giza-museum-khan-2026-11-20.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-museum-khan-2026-11-20.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'tour.private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar';
const OLD = { from: 93, es: 104, ja: 111 };
const PRICES = JSON.parse(readFileSync(new URL('./giza-museum-khan-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/giza-pyramids-egyptian-museum-khan-el-khalili-day-tour';
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
  tahrir: 'guideArticle.cairo.egyptian-museum-of-antiquities',
  khan: 'guideArticle.cairo.khan-el-khalili',
  muizz: 'guideArticle.cairo.sharia-al-muizz-li-din-allah',
};
// Sites per stop, in file order: the three pyramids; the Sphinx; the Egyptian Museum; "Khan El
// Khalili · Al-Muizz Street". The GEM and the NMEC have only blog articles, no guide page.
const SITE_GUIDES = [[G.khufu, G.khafre, G.menkaure], [G.sphinx], [G.tahrir], [G.khan, G.muizz]];
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '1日・約8時間' };
const DURATION_HOURS = 8;
// The dek / meta description: the locked opening's own words, naming all four stops.
const SUMMARY = {
  en: 'A private day in Cairo, in order: the Giza Pyramids and the Sphinx, the Egyptian Museum on Tahrir Square and the Khan El Khalili bazaar.',
  es: 'Un día privado en El Cairo, en orden: las pirámides de Guiza y la Esfinge, el Museo Egipcio de la plaza Tahrir y el bazar del Jan el-Jalili.',
  ja: 'カイロを順番にたどるプライベートな1日。ギザのピラミッドとスフィンクス、タハリール広場のエジプト考古学博物館、ハーン・ハリーリのバザール。',
};
// Correction 4 (the concierge note). Not rendered by the day-tour layout in any locale.
const CONCIERGE = {
  en: ["Tahrir holds the world's largest pharaonic collection,", 'Tahrir holds a vast pharaonic collection,'],
  es: ['las salas de Tahrir guardan la mayor colección faraónica del mundo,', 'las salas de Tahrir guardan una vasta colección faraónica,'],
  ja: ['世界最大のファラオ時代コレクション', '膨大なファラオ時代コレクション'],
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
// Checked by hand (20 Nov), same meaning as EN: ES why «de finales de mayo a septiembre» = EN
// "from late May to September" (the gate reads the month names as 5 and 9); ES p0s1.x «2,3
// millones» = EN "2.3 million" (the gate splits the decimal comma). JA writes 「五千年」 (opening,
// closing), 「八時間」 (closing) and 「約二時間」 (p2s0.x) in kanji numerals, which the gate does not
// read; 「5月下旬から9月」 (why) = "from late May to September"; 「230万」 (p0s1.x) = 2.3 million.
const SAME_MEANING = { es: ['why', 'p0s1.x'], ja: ['opening', 'why', 'closing', 'p0s1.x', 'p2s0.x'] };
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
    included: fact(p.included, 'gmin'), excluded: fact(p.excluded, 'gmout'), options: fact(p.options, 'gmopt'),
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

// The closing's first half ("Five thousand years…"), now the page's own closing.
const CLOSING_REF = { en: '00000000001d', es: '000000000029', ja: '000000000023' };
// The closing's second half · the GEM-swap / helper lines · empty blocks · ES: the standfirst.
const SKIP = {
  en: ['00000000001f', '00000000002d', '000000000030'],
  es: ['000000000003', '00000000002b', '00000000003b', '00000000003e'],
  ja: ['000000000025', '000000000033', '000000000036'],
};
// [block, find, replace] — corrections 1–3 and 5–7 (open items, Gate A.3).
const FIX = {
  en: [
    ['00000000000d', 'Its original height of 146 metres has eroded by about nine metres, but', 'Its original height of 146 metres has lost about nine metres, mostly with its casing and capstone, but'], // 2
    ['00000000000d', 'the lightest weighing around 2.5 tonnes.', 'averaging about 2.5 tonnes.'], // 1
    ['000000000011', 'At 73 metres long and 20 metres high, it is the largest monolithic sculpture in the world.', 'It is 73 metres long and 20 metres high.'], // 3
    ['000000000017', 'is one of the finest concentrations of medieval Islamic architecture in the world,', 'is lined with medieval Islamic architecture,'], // 5
    ['00000000001b', ' — the entire assemblage, displayed together for the first time', ''], // 6
    ['00000000001b', 'ask about tour variants that substitute the GEM for the old Egyptian Museum.', 'add the GEM on another day.'], // 7
  ],
  es: [
    ['000000000011', 'Su altura original de 146 metros se ha erosionado en unos nueve metros, pero', 'Su altura original de 146 metros ha perdido unos nueve metros, sobre todo con el revestimiento y el piramidión, pero'],
    ['000000000011', 'el más ligero de unos 2,5 toneladas.', 'de unas 2,5 toneladas de media.'],
    ['00000000001b', 'Con sus 73 metros de longitud y 20 metros de altura, es la mayor escultura monolítica del mundo.', 'Mide 73 metros de longitud y 20 metros de altura.'],
    ['000000000023', 'forma una de las concentraciones más finas de arquitectura islámica medieval del mundo,', 'está flanqueado de arquitectura islámica medieval,'],
    ['000000000027', ' —el conjunto entero, mostrado por primera vez en un solo recorrido—', ''],
    ['000000000027', 'conviene preguntar por las variantes del tour que sustituyen el Museo Egipcio antiguo por el GEM.', 'añade el GEM otro día.'],
  ],
  ja: [
    ['000000000013', '元の高さ146メートルは約9メートル浸食されましたが、', '元の高さ146メートルは、主に化粧石と頂上石とともに約9メートルを失いましたが、'],
    ['000000000013', '最も軽いものでおよそ2.5トン。', '平均でおよそ2.5トン。'],
    ['000000000017', '長さ73メートル、高さ20メートルで、世界最大の一枚岩の彫像です。', '長さ73メートル、高さ20メートルです。'],
    ['00000000001d', '世界でも有数の中世イスラム建築の密な集積のひとつであり、', '中世イスラム建築が立ち並ぶ一帯であり、'],
    ['000000000021', '——その一揃いのすべてが、初めて一堂に展示されています——', ''],
    ['000000000021', '古いほうのエジプト博物館をGEMに替えるツアーの変種についてお尋ねください。', 'GEMは別の日に加えてください。'],
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
  en: /lightest|has eroded|largest monolithic|finest concentrations|entire assemblage|displayed together for the first time|substitute/i,
  es: /más ligero|se ha erosionado|mayor escultura|más finas|mostrado por primera vez|sustitu/i,
  ja: /最も軽い|浸食|世界最大|有数|初めて一堂|替える/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
}
const conciergeNote = LANGS.map((l) => {
  const row = doc.conciergeNote?.find((n) => n._key === l);
  if (!row) throw new Error(`${l}: no concierge note`);
  const [find, repl] = CONCIERGE[l];
  if (!row.value.includes(find) && !row.value.includes(repl)) throw new Error(`${l}: concierge note changed since 19 Nov`);
  return { ...row, value: row.value.replace(find, repl) };
});

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
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
if (!ready) console.log('prices: NOT READY — fill giza-museum-khan-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  concierge ${l}: ${conciergeNote.find((t) => t._key === l).value.slice(0, 90)}…`);
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
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn', 'allSlugs'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill giza-museum-khan-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-giza-museum-khan-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
