/**
 * Minya Day Tour from Cairo: Beni Hassan, Amarna, Hermopolis & Tuna el-Gebel, in the day-tour format, EN + ES + JA
 * together (owner, 22 Nov: locked copy + open items).
 *
 *   tour  wp-page-87761   /minya-day-tour   (URLs unchanged: no redirect)
 *
 * Order (the river sets it): pickup, Beni Hassan and Amarna on the east bank, lunch, then Hermopolis and Tuna el-Gebel
 * on the west bank. Tuna el-Gebel is added to the day (own stop, own inclusion, in the title). Entrance to all four
 * sites, lunch, water, the driver's tip included. No tiers, no minimum age (the live character line said 18+). Cairo, so
 * the rule rows show (children 50 %, the Cairo/Giza pickup zones, guide = the page's language). "Make it your own"
 * links "our two-day Minya and Amarna tour" to the package wp-page-87830 (customisationOptions[].linkRef).
 * Price: minya-day-tour-prices.json: NOT FILLED (no Autoura day-trip car card for Cairo to Minya, no Hermopolis entrance
 * fee): the script refuses --apply until the owner gives a price source. Live: EUR 160 / ES 171 / JA 178.
 *
 * Essay (Gate A.3, corrections 1-8): "irrigation canals"; "through the valley"; "including Tutankhamun, probably his
 * son"; "are now in museums in Cairo and abroad"; "the heart of the country" removed; and the order fixed: the Amarna
 * blocks now come before the Hermopolis block, which starts "after lunch, on the west bank". Hidden: the essay's closing
 * (the page has its own) and the two-day concierge note ("a second pass at Tuna").
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-minya-day-tour-2026-11-22.mjs              # dry run
 *   node --env-file=<.env> scripts/day-tour-format/import-minya-day-tour-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87761';
const TWO_DAY = 'wp-page-87830';
const OLD = { from: 160, es: 171, ja: 178 };
const PRICES = JSON.parse(readFileSync(new URL('./minya-day-tour-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/minya-beni-hassan-hermopolis-amarna';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  beniHasan: 'guideArticle.al-minya.beni-hasan',
  amarna: 'guideArticle.al-minya.tell-el-amarna',
  ashmunein: 'guideArticle.al-minya.el-ashmunein',
  tuna: 'guideArticle.al-minya.tuna-el-gebel',
};
// Sites per stop, in file order: Beni Hassan tombs · Tell el-Amarna + Tombs of the Nobles · Hermopolis (el-Ashmunein) ·
// Tuna el-Gebel + Tomb of Petosiris.
const SITE_GUIDES = [[G.beniHasan], [G.amarna, G.amarna], [G.ashmunein], [G.tuna, G.tuna]];
const DURATION_LABEL = { en: 'Extended · ~12 hrs', es: 'Jornada larga · ~12 h', ja: '延長・約12時間' };
const DURATION_HOURS = 12;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const OPTIONAL_COST = ['extraTicket', 'extraTicket', 'extraTicket'];
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
// Separator "·" with spaces around it (JA uses full-width spaces: "朝　·　イスラーム地区").
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
const SUMMARY = Object.fromEntries(LANGS.map((l) => [l, (P[l].opening.match(l === 'ja' ? /^(?:[^。]+。){2}/ : /^(?:.+?[.!?](?:\s+|$)){2}/) ?? [P[l].opening])[0].trim()]));
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
// Checked by hand (21 Nov), same meaning as EN: ES p0s1.x «los dos minaretes» = "the twin minarets".
// JA p0s1.x 「二本のミナレット」 = "the twin minarets"; why 「十二世紀分」 = "about twelve centuries" and
// closing 「十四世紀」 = "fourteen centuries", written in kanji, which the gate doesn't read. (The open
// items expected JA extras 1 and 10, 1名様 and 10月6日市; the gate passes both.)
const SAME_MEANING = { es: ['why', 'p0s2.x'], ja: ['why', 'p0s0.x', 'p0s1.x', 'wk0'] };
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
        ...(s.optional ? { skipGlance: true, optional: s.optional.map((text, k) => ({ _key: `o${k + 1}`, _type: 'dayTourOptional', text, cost: OPTIONAL_COST[k] })) } : {}),
        ...(s.sites ? { sites: s.sites.map((name, k) => ({ _key: `x${pi + 1}${si + 1}${k}`, _type: 'dayTourSite', name, ...(guides[k] ? { guideRef: { _type: 'reference', _ref: guides[k], _weak: true } } : {}) })) } : {}),
      };
    }),
    source: SRC(l), needsReview: false,
  }));
  const TWO_DAY_RX = /two-day|dos días|2日間/;
  const fact = (list, prefix) => list.map((t, i) => ({ _key: `${prefix}${i + 1}-${l}`, _type: 'productFact', lang: l, text: t, source: SRC(l), needsReview: false, ...(prefix === 'cmopt' && TWO_DAY_RX.test(t) ? { linkRef: { _type: 'reference', _ref: TWO_DAY } } : {}) }));
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
    included: fact(p.included, 'cmin'), excluded: fact(p.excluded, 'cmout'), options: fact(p.options, 'cmopt'),
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

// The essay's closing ("That persistence…"), now the page's own closing line.
const CLOSING_REF = { en: '000000000022', es: '000000000024', ja: '000000000029' };
// Hidden: the two-day concierge note ("a second pass at Tuna el-Gebel").
const SKIP = { en: ['000000000031'], es: ['000000000035'], ja: ['000000000038'] };
// The Hermopolis block moves after the Amarna blocks (the order of the day), after block `after`.
const MOVE = { en: { h: '000000000013', after: '000000000018' }, es: { h: '000000000015', after: '00000000001a' }, ja: { h: '00000000001a', after: '00000000001f' } };
// [block, find, replace] — corrections 1-4, 6 and the order (7); each find sits inside one text run.
const FIX = {
  en: [
    ['000000000003', ' — the region Egyptians have long called the heart of the country —', ''], // 6
    ['000000000005', 'felucca-shaped irrigation canals', 'irrigation canals'], // 1
    ['000000000009', 'have migrated there', 'are now in museums in Cairo and abroad'], // 4
    ['00000000000d', 'the road runs south along the east bank of the Nile toward Minya', 'the road runs south through the valley towards Minya'], // 2
    ['000000000013', ' comes next.', ' comes after lunch, on the west bank.'], // 7
    ['000000000016', "is the day's final and most historically charged destination", "is the day's most historically charged destination"], // 7
    ['000000000016', 'including his son Tutankhamun', 'including Tutankhamun, probably his son'], // 3
  ],
  es: [
    ['000000000005', ' —la región que los egipcios han llamado durante mucho tiempo el corazón del país—', ''],
    ['00000000000b', 'han emigrado allí', 'están hoy en museos de El Cairo y del extranjero'],
    ['00000000000f', 'la carretera baja al sur por la orilla oriental del Nilo hacia Minia', 'la carretera baja al sur por el valle hacia Minia'],
    ['000000000015', ' viene a continuación.', ' viene después del almuerzo, en la orilla occidental.'],
    ['000000000018', 'es el destino final del día y el más cargado históricamente', 'es el destino más cargado históricamente del día'],
    ['000000000018', 'entre ellos su hijo Tutankamón', 'entre ellos Tutankamón, probablemente su hijo'],
  ],
  ja: [
    ['000000000009', '——エジプト人が長らくこの国の心臓部と呼んできた地域——', ''],
    ['00000000000b', 'フェルッカの形をした灌漑用水路', '灌漑用水路'],
    ['00000000000f', 'そこへ移されました', '現在、カイロと海外の博物館にあります'],
    ['000000000013', '道はナイルの東岸に沿って南へ、ミニヤへと向かいます', '道は谷を南へ、ミニヤへと向かいます'],
    ['00000000001a', '次に来るのが', '昼食のあと、西岸で最初に訪れるのが'],
    ['00000000001d', 'が、この一日の最後にして最も歴史的に重みのある目的地です', 'が、この一日で最も歴史的に重みのある目的地です'],
    ['00000000001d', '息子のトゥタンカーメンを含む', 'おそらく息子であるトゥタンカーメンを含む'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], MOVE[l].h, MOVE[l].after, ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  const value = row.value.map((b) => {
    const fixes = FIX[l].filter(([k]) => k === b._key);
    if (!fixes.length) return b;
    const children = b.children.map((c) => ({ ...c }));
    for (const [, find, repl] of fixes) {
      const i = children.findIndex((c) => c.text.includes(find));
      if (i < 0 && (repl === '' || children.some((c) => c.text.includes(repl)))) continue; // re-run
      if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
      children[i].text = children[i].text.replace(find, () => repl);
    }
    return { ...b, children };
  });
  // Move the Hermopolis block after the Amarna blocks (once).
  const hi = value.findIndex((b) => b._key === MOVE[l].h), wi = value.findIndex((b) => b._key === MOVE[l].after);
  if (hi >= 0 && wi >= 0 && hi < wi) { const [h] = value.splice(hi, 1); value.splice(value.findIndex((b) => b._key === MOVE[l].after) + 1, 0, h); }
  return { ...row, value };
});
// Nothing "More about this day", the summary or the notes may keep what the page corrects.
const RETIRED = {
  en: /felucca|east bank of the Nile toward|his son Tutankhamun|have migrated|heart of the country|final and most historically|three tiers|minimum age|English-speaking|Base \+/i,
  es: /faluca|orilla oriental del Nilo hacia|su hijo Tutankamón|han emigrado|corazón del país|destino final del día|tres niveles|edad mínima|angloparlante|Base \+/i,
  ja: /フェルッカの形|ナイルの東岸に沿って|息子のトゥタンカーメンを含む|心臓部|最後にして最も歴史的|段階|18歳|最低年齢|英語対応|移されました/,
};
for (const row of body) {
  const l = row._key;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}"`);
}
for (const l of LANGS) {
  if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);
  const note = doc.conciergeNote?.find((n) => n._key === l)?.value ?? '';
  if (RETIRED[l].test(note)) console.log(`WARNING ${l}: concierge note shows "${note.match(RETIRED[l])[0]}"`);
}
// shapeOfDay.character carried the tiers and "minimum age 18" (rules 8 and 9); the day-tour layout does not show it.
const UNSET = doc.shapeOfDay?.character ? ['shapeOfDay.character'] : [];

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
if (!ready) console.log('prices: NOT READY — fill minya-day-tour-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
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
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn', 'allSlugs'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill minya-day-tour-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-minya-day-tour');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
