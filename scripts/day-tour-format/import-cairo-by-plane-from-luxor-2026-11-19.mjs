/**
 * Cairo in a Day by Plane from Luxor in the day-tour format, EN + ES + JA together. Owner,
 * 19 Nov: the locked copy (EN 17 Nov, ES/JA 19 Nov); prices last, from Autoura.
 *
 *   tour  wp-page-88173   /full-day-trip-to-cairo-by-plane-from-luxor
 *
 * The product (the locked copy): a private day from a Luxor hotel, flying to Cairo and back;
 * Giza (one pyramid interior included, Khufu and a camel ride extra), lunch, the Grand Egyptian
 * Museum, Khan El Khalili. Flights NOT included (as on Abu Simbel by plane, owner 18 Nov).
 * Children under 12: 50 %. No tiers. Guide in the page's language, so ES/JA keep their own price.
 *
 * Panel: the rule rows (children, flights, pickup, back, lunch, guide language) — the tour's
 * city is Luxor, so no Cairo pickup-zone rows. Prices: cairo-by-plane-prices.json, null until
 * Autoura prices the tour; --apply refuses until all three are filled.
 *
 * Essay (Gate A.3, the open items): the tier paragraph → "Entrance to the Giza Plateau, one
 * pyramid interior, the Grand Egyptian Museum and lunch are included; domestic flights are
 * not." (and the tier summary hidden); "included in every tier" → "included"; the
 * Egyptologist "in your language"; Khufu "the tallest man-made structure on earth for nearly
 * four thousand years" (the Giza page's wording); the GEM at the plateau's "north-eastern
 * edge"; the closing's second half, the ES lead line and the empty block left out.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-cairo-by-plane-from-luxor-2026-11-19.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-cairo-by-plane-from-luxor-2026-11-19.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-cairo-by-plane-from-luxor-2026-11-19.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88173';
const OLD = { from: 206, es: 217, ja: 224 };
const PRICES = JSON.parse(readFileSync(new URL('./cairo-by-plane-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/cairo-day-trip-by-plane-from-luxor-day-tour';
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
};
// Sites per stop that has them, in file order (GEM and Khan El Khalili have no guide page).
const SITE_GUIDES = [[G.khufu, G.khafre, G.menkaure], [G.sphinx], [null, null], [null]];
const DURATION_LABEL = { en: 'Extended day · ~14 hrs', es: 'Día largo · ~14 h', ja: '長い1日・約14時間' };
const DURATION_HOURS = 14;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch', back: 'Back', flights: 'Flights' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo', back: 'Regreso', flights: 'Vuelos' },
  ja: { pickup: 'お迎え', lunch: '昼食', back: 'お戻り', flights: '航空券' },
};
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 午前: 'morning', 昼: 'midday', 午後: 'afternoon' };
// The extras, in file order: Khufu = an extra ticket; the camel = an extra cost (+ its welfare line).
const OPTIONAL_COST = ['extraTicket', 'extraCost'];

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = plain(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${l}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelRows = Object.fromEntries(panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], plain(m[2])]));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [, word, label] = head.match(/^(.+?)\s*[·・]\s*(.+)$/); // first separator only (JA names keep 「・」)
    const period = PERIOD[word.trim()];
    if (!period) throw new Error(`${l}: unknown period "${word}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this day →" pointer
      const lines = p.split('\n');
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) {
        // "**Inside a pyramid (included).** You go inside…" → the previous stop's included line.
        if (/^\*\*/.test(p) && stops.length) { stops[stops.length - 1].includedNote = plain(p); continue; }
        throw new Error(`${l}: unexpected paragraph in "${label}": ${p.slice(0, 60)}`);
      }
      const stop = { title: plain(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[:：]\*?[:：]?\s*(.+)$/);
        // JA separates sites with 「・」, which some names contain too (ハーン・ハリーリ).
        if (sm) stop.sites = (l === 'ja' ? sm[2].replace(/ハーン・ハリーリ/g, 'ハーン\u0000ハリーリ').split('・').map((x) => x.replace('\u0000', '・')) : sm[2].split(' · ')).map((x) => plain(x));
        else if (ln.startsWith('- ')) {
          // The camel (2nd): "A camel ride: extra cost. We work with…" → text + its welfare note.
          // The Khufu ticket (1st) stays one line, as in EN (JA writes it in two sentences).
          const t = plain(ln.slice(2));
          const m = (stop.optional?.length ?? 0) === 1 ? t.match(/^(.+?[.。])\s*(.+)$/) : null;
          (stop.optional ??= []).push(m ? { text: m[1], note: m[2] } : { text: t });
        } else body.push(ln);
      }
      if (body.length) stop.text = plain(body.join(' '));
      stops.push(stop);
    }
    return { period, periodLabel: plain(label), stops };
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
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0, !!s.includedNote, (s.optional ?? []).map((o) => !!o.note)])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup', 'lunch', 'back', 'flights']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (p) => ({
  opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
  ...Object.fromEntries(Object.values(PANEL.en).map((k, i) => [`panel${i}`, p.panelRows[Object.values(PANEL[p === P.en ? 'en' : p === P.es ? 'es' : 'ja'])[i]]])),
  ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [
    [`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text], [`p${pi}s${si}.inc`, s.includedNote],
    ...(s.optional ?? []).flatMap((o, oi) => [[`p${pi}s${si}.o${oi}`, o.text], [`p${pi}s${si}.o${oi}n`, o.note]]),
  ])).filter(([, v]) => v)),
  ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
  ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
});
// Checked by hand (19 Nov): ES «2,3 millones» = 2.3 million (decimal comma; the gate reads 2 and 3 000 000); JA 230万個 = 2.3 million (the gate reads 2 300 000).
const SAME_MEANING = { es: ['p0s1.x'], ja: ['p0s1.x'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
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
        ...(s.includedNote ? { includedNote: s.includedNote } : {}),
        ...(s.optional ? { skipGlance: true, optional: s.optional.map((o, k) => ({ _key: `o${pi + 1}${si + 1}${k}`, _type: 'dayTourOptional', text: o.text, cost: OPTIONAL_COST[k], ...(o.note ? { note: o.note } : {}) })) } : {}),
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
      pickupLine: p.panelRows[PANEL[l].pickup], flightsLine: p.panelRows[PANEL[l].flights], returnNote: p.panelRows[PANEL[l].back],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'cpin'), excluded: fact(p.excluded, 'cpout'), options: fact(p.options, 'cpopt'),
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

const CLOSING_REF = { en: '000000000031', es: '000000000033', ja: '000000000021' };
// The closing's second half · the tier summary · the empty block · (ES) the lead line · (JA) the concierge note.
const SKIP = {
  en: ['000000000033', '000000000041', '000000000044'],
  es: ['000000000035', '000000000045', '000000000048', '000000000003'],
  ja: ['000000000023', '000000000031', '000000000034'],
};
// Whole blocks rewritten (one run): the tier paragraph → what is included (open item 1).
const REPLACE = {
  en: { '00000000001f': 'Entrance to the Giza Plateau, one pyramid interior, the Grand Egyptian Museum and lunch are included; domestic flights are not.' },
  es: { '000000000021': 'Están incluidos la entrada a la meseta de Guiza, el interior de una pirámide, el Gran Museo Egipcio y el almuerzo; los vuelos domésticos, no.' },
  ja: {},
};
// [block, find, replace] — open items 2, 3, 5 and the tiers' traces.
const FIX = {
  en: [
    ['000000000017', 'led by a licensed Egyptologist who meets you', 'led by a licensed Egyptologist in your language who meets you'],
    ['000000000017', 'are included in every tier.', 'are included.'],
    ['000000000027', 'sits at the plateau\'s northern edge', 'sits at the plateau\'s north-eastern edge'],
    ['00000000002f', 'the Khufu pyramid was the tallest structure in the world for approximately 3,800 years', 'the Khufu pyramid was the tallest man-made structure on earth for nearly four thousand years'],
  ],
  es: [
    ['000000000019', 'Cada nivel incluye', 'Se incluyen'],
    ['000000000019', 'guía egiptólogo de habla hispana', 'guía egiptólogo en su idioma'],
    ['000000000029', 'en el extremo norte de la meseta', 'en el extremo nororiental de la meseta'],
    ['000000000031', 'la pirámide de Keops fue la estructura más alta del mundo durante unos 3.800 años', 'la pirámide de Keops fue la estructura más alta construida por el ser humano durante casi cuatro mil años'],
  ],
  ja: [
    ['000000000017', '台地の北の縁', '台地の北東の縁'],
    ['00000000001f', 'クフのピラミッドはおよそ3,800年にわたって世界一高い構造物でした', 'クフのピラミッドは4,000年近くにわたって世界で最も高い人工建造物でした'],
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
        if (i < 0 && children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x)))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), (m) => (m.includes('’') ? repl.replace(/'/g, '’') : repl));
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /\btiers?\b|Base \+|approximately 3,800|northern edge|tallest structure in the world/i,
  es: /\bniveles?\b|Base \+|habla hispana|3\.800 años|extremo norte de/i,
  ja: /パッケージ[A-ZＡ-Ｚ]|段階|3,800年|北の縁|世界一高い/, // (「慌ただしいパッケージ」 = a rushed package holiday, kept as in EN)
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
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
if (!ready) console.log('prices: NOT READY — fill cairo-by-plane-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote} · flights: ${B[l].intro.flightsLine} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).length, !!s.includedNote, (s.optional ?? []).map((o) => o.text)])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const before = doc.body.find((r) => r._key === l).value.find((x) => x._key === b._key);
    if (textOf(before) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 200)}…`);
  }
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
  if (!ready) throw new Error('prices not ready — fill cairo-by-plane-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-cairo-by-plane-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
