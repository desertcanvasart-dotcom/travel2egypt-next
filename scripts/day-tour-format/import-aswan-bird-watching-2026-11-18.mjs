/**
 * Aswan Bird-Watching by Private Boat in the day-tour format, EN + ES + JA together. Owner, 18 Nov:
 * "per person and make it 60" (with the review's defaults):
 *   - €60 per person on every page: the guide is a specialist birder in English (translation
 *     on request), so no Spanish/Japanese guide price (guideLanguagePrices removed; was
 *     €51 / €62 / €69)
 *   - one water per morning; the Philae landing unnamed; a "Worth knowing" line that the lake
 *     around Philae is at its best in winter; no checklist/photography, no "40–65 species",
 *     no sunset trip
 * The panel shows the copy's own rows (dayTourIntro.panelRows): the choice of waters,
 * children, pickup, back, binoculars, "Your guide: a specialist birder, in English" — the rule
 * rows would say the guide speaks the page's language, which this tour doesn't promise.
 *
 *   tour  wp-page-88572   /private-tour-aswan-bird-watching-tour
 *
 * Essay (Gate A.3, open items 1–4): "reeds" not papyrus; no African fish eagle; the migration
 * windows and peaks said once; the passages the page contradicts left out ("no minimum age",
 * "bring binoculars or ask"). Item 5 (a Philae passage) waits for its text.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-aswan-bird-watching-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-aswan-bird-watching-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-aswan-bird-watching-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88572';
const OLD_PRICES = { from: 51, es: 62, ja: 69 };
// Owner: €60, the same on every page (English-speaking specialist guide).
const PRICE = 60;
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/aswan-bird-watching-motor-boat-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (18 Nov 2026; owner: "per person and make it 60").`;

const G = {
  elephantine: 'guideArticle.aswan.elephantine-island',
  botanical: 'guideArticle.aswan.botanical-garden',
  philae: 'guideArticle.aswan.the-philae-temple',
};
const JA_SITES = [['エレファンティネ島', 'キッチナー島（植物園）、いずれも水上から'], ['フィラエ島を囲む湖、水上から']];
// Sites per stop, in file order.
const SITE_GUIDES = [[G.elephantine, G.botanical], [G.philae]];
const DURATION_LABEL = { en: '~2–3 hrs', es: '~2–3 h', ja: '約2〜3時間' };
const DURATION_HOURS = 2.5;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch', back: 'Back' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo', back: 'Regreso' },
  ja: { pickup: 'お迎え', lunch: '昼食', back: 'お戻り' },
};
const PERIOD = {
  'Before sunrise': 'morning', 'Early morning': 'morning', 'Mid-morning': 'morning', 'Antes del amanecer': 'morning', 'Primera hora': 'morning', 'Media mañana': 'morning', 日の出前: 'morning', 早朝: 'morning', 午前中: 'morning', Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 午前: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse a locked day-tour file ─────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t]+$/gm, '').trim();
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = clean(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${l}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelLines = panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]);
  const panelRows = Object.fromEntries(panelLines);
  // The panel's own rows, as written: all but the Type/Duration line and the From placeholder.
  const ownRows = panelLines.slice(1).filter(([, v]) => !/\{.*\}/.test(v)).map(([label, text]) => ({ label, text }));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    // Split on the first separator only: JA names contain 「・」 (アブ・シンベル).
    const [, word, label] = head.match(/^(.+?)\s*[·・]\s*(.+)$/);
    const period = PERIOD[word.trim()];
    if (!period) throw new Error(`${l}: unknown period "${word}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this day →" pointer
      const lines = p.split('\n');
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected paragraph in "${label}": ${p.slice(0, 60)}`);
      // "06:00 · Pickup…", "Around 16:00 · Back…", "16:00頃・…": the time part is kept as written.
      const parts = hm[1].split(/\s*[·・]\s*/);
      const stop = parts.length > 1 && /\d\d:\d\d/.test(parts[0]) ? { time: clean(parts[0]), title: clean(parts.slice(1).join(l === 'ja' ? '・' : ' · ')) } : { title: clean(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[:：]\*?[:：]?\s*(.+)$/);
        if (sm) {
          // JA names contain 「・」, the separator: their lists are given (checked against the file).
          const given = l === 'ja' ? JA_SITES.find((list) => list.join('・') === sm[2].trim()) : null;
          if (l === 'ja' && !given) throw new Error(`ja: no given site list for "${sm[2]}"`);
          stop.sites = given ?? sm[2].split(' · ').map((x) => x.trim());
        }
        else body.push(ln);
      }
      if (body.length) stop.text = clean(body.join(' '));
      stops.push(stop);
    }
    return { period, periodLabel: clean(label), stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, ownRows, periods,
    opening: clean(paras(opening.text)[0]),
    whyThisOrder: clean(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text),
    closingLine: clean(tail[tail.length - 1].replace(/^\*(.*)\*$/, '$1')),
  };
}
const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(l)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.time, !!s.text, s.sites?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup', 'back']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel`);

/* ── Numeric gate: ES/JA figures equal EN, string by string ──────────── */
const flat = (p) => ({
  opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
  ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
  ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
  ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
});
// Same meaning, checked by hand 18 Nov: "October and March and April" = «octubre… marzo y abril»
// / 10月・3〜4月 (the gate reads ES/JA months as numbers, not EN ones).
const SAME_MEANING = { es: ['why'], ja: ['why'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l]) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
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
        _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop',
        ...(s.time ? { time: s.time } : {}), title: s.title, ...(s.text ? { text: s.text } : {}),
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
      // Outside Cairo and Giza: the panel's Pickup row is this line as written.
      pickupLine: p.panelRows[PANEL[l].pickup], returnNote: p.panelRows[PANEL[l].back],
      panelRows: p.ownRows.map((r, i) => ({ _key: `pr${i}`, _type: 'dayPanelRow', ...r })),
      lunch: { status: 'notIncluded' },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'bwin'), excluded: fact(p.excluded, 'bwout'), options: fact(p.options, 'bwopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
// On a re-run the price is already the new one and the guide-language prices are gone.
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD_PRICES.from, OLD_PRICES.es, OLD_PRICES.ja].join(), [PRICE, '', ''].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

const CLOSING_REF = { en: '000000000029', es: '00000000002b', ja: '000000000023' };
// The closing line's second half, "no minimum age" (+ "expert English/Spanish-speaking guide"),
// the "bring binoculars or ask" concierge line, the empty block.
const SKIP = {
  en: ['000000000013', '00000000002b', '000000000039', '00000000003c'],
  es: ['000000000015', '00000000002d', '00000000003d', '000000000040'],
  ja: ['000000000025', '000000000033', '000000000036'],
};
// [block, find, replace] — open items 1, 2 and 4 (owner-approved 18 Nov).
const FIX = {
  en: [
    ['000000000003', 'lined with papyrus and acacia', 'lined with reeds and acacia'],
    ['00000000001b', 'the African fish eagle, the pied kingfisher', 'the pied kingfisher'],
    ['00000000001b', 'During the main migration windows — roughly September to November and March to May — the count expands sharply.', 'During the migration windows, September to November and March to May, peaking in October and in March and April, the count expands sharply.'],
    ['000000000027', 'Peak migration months — October and March to April — offer the highest species counts and the most visible activity. ', ''],
  ],
  es: [
    ['000000000005', 'orlado de papiros y acacias', 'orlado de juncos y acacias'],
    ['00000000001d', 'el águila pescadora africana, el martín pescador pío', 'el martín pescador pío'],
    ['00000000001d', 'Durante las ventanas migratorias principales —aproximadamente de septiembre a noviembre y de marzo a mayo— el número se dispara.', 'Durante las ventanas migratorias, de septiembre a noviembre y de marzo a mayo, con picos en octubre y en marzo y abril, el número se dispara.'],
    ['000000000029', 'Los meses cumbre de migración —octubre y de marzo a abril— ofrecen los mayores recuentos de especies y la actividad más visible. ', ''],
  ],
  ja: [
    ['000000000009', 'パピルスとアカシアが岸を縁取っています', '葦とアカシアが岸を縁取っています'],
    ['000000000015', 'サンショクウミワシ、浅瀬の上で', '浅瀬の上で'],
    ['000000000015', '主な渡りの時期——およそ9月から11月、そして3月から5月——には、その数が一気に増えます。', '9月から11月、そして3月から5月の渡りの時期、とくにピークとなる10月と3〜4月には、その数が一気に増えます。'],
    ['000000000021', '渡りのピークの月——10月、そして3月から4月——は、最も多くの種類と、最も目に見える活動を提供します。', ''],
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
        if (i < 0 && children.some((c) => c.text.includes(repl))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), repl);
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day" shows may keep the old convoy product or a corrected claim.
const RETIRED = {
  en: /papyrus|fish eagle|no minimum age|ask in advance whether the operator|Peak migration months/i,
  es: /papiro|águila pescadora africana|edad mínima|meses cumbre/i,
  ja: /パピルス|ウミワシ|渡りのピークの月/,
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
  priceFrom: PRICE,
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

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.periodLabel, x.stops.map((s) => (s.time ? `${s.time} · ` : '') + s.title)]))}`);
  for (const b of set.body.find((r) => r._key === l).value) {
    const before = doc.body.find((r) => r._key === l).value.find((x) => x._key === b._key);
    if (textOf(before) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 170)}…`);
  }
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
    out[l] = Object.fromEntries(['title', 'priceFrom', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [DOC_ID], 'before-aswan-bird-watching');
  await client.patch(DOC_ID).set(set).unset(['guideLanguagePrices']).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
