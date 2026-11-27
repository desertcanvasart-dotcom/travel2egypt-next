/**
 * Karnak After Dark: The Sound & Light Show in Luxor, in the day-tour format, EN + ES + JA
 * together. Owner, 21-22 Nov: the locked copy and its open items.
 *
 *   tour  tour.sound-light-show-at-karnak-temple-in-luxor   /sound-light-show-at-karnak-temple-in-luxor
 *   (ES /luz-y-sonido-en-karnak, JA /yoru-no-karunakku-rukusoru-no-hikari-to-oto-no-sho)
 *   URLs unchanged; no redirect.
 *
 * The product: evening pickup from a hotel in Luxor → Karnak (the walk in through the first pylon
 * and the Great Hypostyle Hall; the Sacred Lake) → back to the hotel. Private transfers, show
 * tickets, a bottle of water per person and the driver's tip. Not included: dinner and drinks. No
 * lunch (an evening show), no guide. No tiers, no minimum-age value; the panel row says
 * "Children and students: about 50% off" and REPLACES the standard "Children under 12" row (the
 * panel's own rows, dayTourIntro.panelRows, show in place of the rule rows). There is no student
 * price field to drive: the product has no price category for evenings, so no migration is needed.
 * One period: Evening.
 *
 * Price: ONE price for every language (no guide), EUR 44, from Autoura template T2E-DT-LXR-08
 * (the price includes the evening assistant 700 EGP, the driver tip 250 EGP and water). The live
 * page already carries 44 (set 21-22 Nov, PRs #334/#337); this import writes the same value and
 * leaves guideLanguagePrices unset.
 *
 * Summary (dek / meta description): built from the locked opening's own words. Duration label:
 * 'Evening · show ~1 hr' (the Giza style); durationHours stays 2 (2 to 2.5 hours pickup to return).
 *
 * Essay (Gate A.3, corrections 1-7; the live essay was already edited on 21-22 Nov, PRs #336/#337,
 * so the find/replace pairs match the CURRENT text):
 *   1 "247 acres" (twice) removed: "the vast Karnak complex" in the shown essay, "one temple" in the
 *     hidden closing; 2 and 5 "covers 5,000 square metres and was for many centuries the largest
 *     columned hall ever constructed" removed together (the sentence carried both); 3 kept (Tier 2);
 *     4 "and group logistics" dropped; 6 no minimum-age claim remains (retire-regex checks every
 *     shown block); 7 the essay has no child-price wording, so there is nothing to replace (the
 *     panel row carries it).
 * Hidden from "More about this day": the closing (the page has its own), the "That is worth an
 * evening" line, the concierge line, empty blocks, ES: the standfirst.
 *
 * Guide links: Karnak (guideArticle.luxor.the-karnak-temple). The copy's other sites (Great
 * Hypostyle Hall, Sacred Lake) have no guide page of their own in Luxor (guideArticle.qena.
 * hypostyle-hall-and-ceiling is Dendera's), and no "Luxor" city guide page exists: those link to nothing.
 *
 * needsReview: rows are written approved, as with every page in this batch (true would publish an
 * empty page); nothing is written until the owner says publish.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-karnak-sound-light-2026-11-22.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-karnak-sound-light-2026-11-22.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-karnak-sound-light-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'tour.sound-light-show-at-karnak-temple-in-luxor';
const PRICES = JSON.parse(readFileSync(new URL('./karnak-sound-light-prices.json', import.meta.url), 'utf8'));
const ready = typeof PRICES.price === 'number' && PRICES.price > 0;
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/karnak-sound-and-light-show';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (21 Nov 2026; price from Autoura template T2E-DT-LXR-08).`;

const G = { karnak: 'guideArticle.luxor.the-karnak-temple' };
// Sites per stop, in file order: "Karnak · Great Hypostyle Hall", "Sacred Lake". Only Karnak has a
// guide page.
const SITE_GUIDES = [[G.karnak, null], [null]];
const DURATION_LABEL = { en: 'Evening · show ~1 hr', es: 'Noche · espectáculo ~1 h', ja: '夜・ショー約1時間' };
const DURATION_HOURS = 2;
// The dek / meta description: the locked opening's own words.
const SUMMARY = {
  en: "An evening at Karnak: private transfers to the Sound and Light Show, with light on the pylons and columns and a narration that runs from Ramses II's campaigns to the power of Amun's priests.",
  es: 'Una noche en Karnak: traslados privados al espectáculo de Luz y Sonido, con luz sobre los pilonos y las columnas y una narración que va de las campañas de Ramsés II al poder de los sacerdotes de Amón.',
  ja: 'カルナック神殿の夜。専用車の送迎で音と光のショーへ。塔門や柱に光があたり、ラムセス2世の遠征からアメン神官団の権力までを語ります。',
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
const SAME_MEANING = { es: ['fit1'], ja: ['why', 'closing'] };
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
if (priceNow !== [PRICES.price, '', ''].join() || doc.guideLanguagePrices) throw new Error(`unexpected prices ${priceNow} (live must be ${PRICES.price}, no guideLanguagePrices)`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's closing ("Fifteen centuries of devotion…"), now the page's own closing line.
const CLOSING_REF = { en: '000000000029', es: '00000000002b', ja: '000000000023' };
// "That is worth an evening." · the concierge line · empty blocks · ES: the standfirst.
const SKIP = {
  en: ['00000000002b', '000000000039', '00000000003c'],
  es: ['000000000003', '00000000002d', '00000000003d', '000000000040'],
  ja: ['000000000025', '000000000033', '000000000036'],
};
// Nothing is rewritten whole on this page.
const REPLACE = { en: {}, es: {}, ja: {} };
// [block, find, replace] — corrections 1, 2 + 5 and 4 (read from the CURRENT essay, after PRs #336/#337).
const FIX = {
  en: [
    ['000000000003', '247 acres of pylons', 'the vast Karnak complex of pylons'], // 1
    ['00000000001f', " depending on your hotel's location and group logistics", " depending on your hotel's location"], // 4
    ['000000000025', 'Built between approximately 1290 and 1224 BC, it covers 5,000 square metres and was for many centuries the largest columned hall ever constructed.', 'Built between approximately 1290 and 1224 BC.'], // 2 + 5
    ['000000000029', 'pressed into 247 acres on the east bank', 'pressed into one temple on the east bank'], // 1, in the hidden closing
  ],
  es: [
    ['000000000005', '247 acres de pilonos', 'el vasto complejo de Karnak, con pilonos'],
    ['000000000021', ' y la logística del grupo', ''],
    ['000000000027', 'Construida entre, aproximadamente, el 1290 y el 1224 a. C., cubre 5.000 metros cuadrados y fue durante muchos siglos la mayor sala de columnas jamás construida.', 'Construida entre, aproximadamente, el 1290 y el 1224 a. C.'],
    ['00000000002b', 'comprimidos en 247 acres a la orilla', 'comprimidos en un solo templo a la orilla'],
  ],
  ja: [
    ['000000000009', '247エーカー', '広大なカルナック複合体'],
    ['000000000019', 'ホテルの位置と団体の段取り次第で', 'ホテルの位置次第で'],
    ['00000000001f', '築かれ、5,000平方メートルを覆い、何世紀にもわたってこれまでに造られた最大の柱の間でした。', '築かれました。'],
    ['000000000023', 'ナイル東岸の247エーカーに', 'ナイル東岸の一つの神殿に'],
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
  en: /247|acres|5,000 square|largest columned|minimum age|group logistics|under 12|children under/i,
  es: /247|acres|5\.000 metros|mayor sala de columnas|edad mínima|logística del grupo|menores de 12/i,
  ja: /247|エーカー|5,000平方|最大の柱の間|最低年齢|団体の段取り|12歳未満/,
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
