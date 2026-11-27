/**
 * Royal Mummies, Old Cairo & Khan El Khalili: Private Day Tour, in the day-tour format, EN + ES + JA together
 * (owner, 22 Nov: locked copy + open items).
 *
 *   tour  tour.nmec-royal-mummies-old-cairo   /nmec-royal-mummies-old-cairo   (URLs unchanged: no redirect)
 *
 * The day: pickup 09:00, the NMEC (Royal Mummies Hall and main galleries), the Hanging Church, Ben Ezra and Abu Serga,
 * lunch, Khan El Khalili, back. Al-Azhar Mosque is REMOVED (title, stop, essay). Included: entrance to the NMEC with the
 * Royal Mummies Hall and the Coptic Cairo sites, lunch, water, the driver's tip. No tiers, no minimum age (also out of
 * the concierge note and shapeOfDay.character). Cairo: the rule rows show (children 50 %, pickup zones, guide language);
 * the intro carries pickupTime 09:00 and the Back line.
 * Price: royal-mummies-prices.json (Autoura T2E-DT-CAI-15): EUR 86 / ES 97 / JA 113 (live 77 / 88 / 95).
 *
 * Essay (Gate A.3, corrections 1-11): the Al-Azhar passage is hidden (6, 10); Ben Ezra "the present building dates from a
 * rebuilding in the 1890s, on a much older site" (1); "some 400,000 manuscript fragments" (3); "a rare concentration of
 * early Christian monuments" (4); the Coptic community's "ten million" removed (5); "the NMEC … opened in 2021" (7);
 * 2, 8, 9 kept. Hidden: the essay's closing (the page has its own) and its second sentence, the concierge helper note.
 * Open items still pending: the Royal Mummies Hall ticket is in the Autoura price (550 EGP); the mummy count is not on
 * the page.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-royal-mummies-2026-11-22.mjs              # dry run
 *   node --env-file=<.env> scripts/day-tour-format/import-royal-mummies-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'tour.nmec-royal-mummies-old-cairo';
const OLD = { from: 77, es: 88, ja: 95 };
const PRICES = JSON.parse(readFileSync(new URL('./royal-mummies-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/royal-mummies-old-cairo-khan-el-khalili';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  hanging: 'guideArticle.cairo.hanging-church-al-mu-allaqa',
  benEzra: 'guideArticle.cairo.ben-ezra-synagogue',
  abuSerga: 'guideArticle.cairo.church-of-saint-sergius-and-bacchus-abu-serga',
  khan: 'guideArticle.cairo.khan-el-khalili',
};
// Sites per stop, in file order: National Museum of Egyptian Civilisation (no guide page) · Hanging Church + Ben Ezra +
// Abu Serga · Khan El Khalili + El Fishawy.
const SITE_GUIDES = [[null], [G.hanging, G.benEzra, G.abuSerga], [G.khan, null]];
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '1日・約8時間' };
const DURATION_HOURS = 8;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch', back: 'Back' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo', back: 'Regreso' },
  ja: { pickup: 'お迎え', lunch: '昼食', back: 'お戻り' },
};
const OPTIONAL_COST = ['extraTicket', 'extraCost'];
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
for (const l of LANGS) for (const k of ['pickup', 'lunch', 'back']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
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
const SAME_MEANING = { es: ['p0s2.x'], ja: ['why', 'closing', 'p0s0.x', 'p0s1.x', 'p0s2.x', 'p1s0.x'] };
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
  const fact = (list, prefix) => list.map((t, i) => ({ _key: `${prefix}${i + 1}-${l}`, _type: 'productFact', lang: l, text: t, source: SRC(l), needsReview: false }));
  return {
    timeline,
    intro: {
      _key: `dti-${l}`, _type: 'dayTourIntro', lang: l,
      opening: p.opening, whyThisOrder: p.whyThisOrder,
      pickupLine: p.panelRows[PANEL[l].pickup], pickupTime: '09:00', returnNote: p.panelRows[PANEL[l].back],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'rmin'), excluded: fact(p.excluded, 'rmout'), options: fact(p.options, 'rmopt'),
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

// The essay's two closing sentences (the page has its own closing line): block 1 = closingRef, block 2 hidden.
const CLOSING_REF = { en: '000000000035', es: '000000000037', ja: '00000000002b' };
// Hidden: the Al-Azhar passage · the closing's second sentence · the concierge helper note.
const SKIP = {
  en: ['00000000002b', '000000000037', '000000000046'],
  es: ['00000000002d', '000000000039', '00000000004a'],
  ja: ['000000000023', '00000000002d', '00000000003c'],
};
// [block, find, replace] — corrections 1, 3, 4, 5 and 7 (2, 8, 9 kept); each find sits inside one text run.
const FIX = {
  en: [
    ['000000000011', 'opened fully in its current form and expanded in recent years to house the Royal Mummies Hall', 'opened in 2021 and built to house the Royal Mummies Hall'], // 7
    ['00000000001b', 'contains a concentration of early Christian monuments found nowhere else on the continent', 'contains a rare concentration of early Christian monuments'], // 4
    ['00000000001b', ', which numbers around ten million people today', ''], // 5
    ['000000000023', 'The building itself dates largely to the twelfth century, but it achieved global significance', 'The present building dates from a rebuilding in the 1890s, on a much older site, but it achieved global significance'], // 1
    ['000000000023', 'a cache of some three hundred thousand manuscript fragments', 'a cache of some 400,000 manuscript fragments'], // 3
  ],
  es: [
    ['000000000013', 'abierto plenamente en su forma actual y ampliado en los últimos años para alojar', 'abierto en 2021 y concebido para alojar'],
    ['00000000001d', 'y concentra una densidad de monumentos cristianos tempranos no hallable en ninguna otra parte del continente', 'y concentra una rara densidad de monumentos cristianos tempranos'],
    ['00000000001d', ', que ronda los diez millones de fieles hoy', ''],
    ['000000000025', 'El edificio data en gran parte del siglo XII, pero alcanzó', 'El edificio actual data de una reconstrucción de la década de 1890, sobre un solar mucho más antiguo, pero alcanzó'],
    ['000000000025', 'unos trescientos mil fragmentos manuscritos', 'unos 400 000 fragmentos manuscritos'],
  ],
  ja: [
    ['000000000015', '現在の形で全面開館し、近年、王家のミイラの間を収めるべく拡張されました', '2021年に開館し、王家のミイラの間を収めるために造られました'],
    ['00000000001b', 'この大陸のほかのどこにも見られない初期キリスト教の記念建造物の集積を擁しています', '初期キリスト教の記念建造物のまれな集積を擁しています'],
    ['00000000001b', '今日およそ一千万人を数える', ''],
    ['00000000001f', '建物そのものはおおむね十二世紀にさかのぼりますが', '現在の建物は1890年代の再建によるもので、はるかに古い敷地に建っていますが'],
    ['00000000001f', 'およそ三十万点の写本の断片', '約40万点の写本の断片'],
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
        const i = children.findIndex((c) => c.text.includes(find));
        if (i < 0 && (repl === '' || children.some((c) => c.text.includes(repl)))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(find, () => repl);
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day", the summary or the notes may keep what the page corrects (or Al-Azhar).
const RETIRED = {
  en: /Al-Azhar|twelfth century|three hundred thousand|nowhere else on the continent|ten million|opened fully|three tiers|minimum age|English-speaking|Base \+/i,
  es: /Al-Azhar|siglo XII|trescientos mil|ninguna otra parte del continente|diez millones|abierto plenamente|tres niveles|edad mínima|angloparlante|Base \+/i,
  ja: /アズハル|十二世紀|三十万|この大陸のほかの|一千万|現在の形で全面開館|段階|18歳|最低年齢|英語対応/,
};
for (const row of body) {
  const l = row._key;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}"`);
}
for (const l of LANGS) if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);
// The concierge note said "one of the few days we run with no minimum age" (rule 9).
const NOTE_FIX = {
  en: [' — and one of the few days we run with no minimum age', ''],
  es: [' — y uno de los pocos días que operamos sin edad mínima', ''],
  ja: ['最少年齢を設けていない数少ないコースでもあります。', ''],
};
const conciergeNote = LANGS.map((l) => {
  const row = doc.conciergeNote.find((n) => n._key === l);
  const [find, repl] = NOTE_FIX[l];
  const v = row.value.includes(find) ? row.value.replace(find, repl) : row.value;
  if (RETIRED[l].test(v) || /minimum age|edad mínima|最少年齢/.test(v)) throw new Error(`${l}: concierge note still shows an age line: ${v.slice(0, 200)}`);
  return { ...row, value: v };
});
// shapeOfDay.character carried the tiers and "no minimum age" (rules 8 and 9); the day-tour layout does not show it.
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

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log('prices: NOT READY — fill royal-mummies-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

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
  if (!ready) throw new Error('prices not ready — fill royal-mummies-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-royal-mummies');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
