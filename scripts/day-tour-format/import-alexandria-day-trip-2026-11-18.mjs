/**
 * Alexandria Day Trip from Cairo in the day-tour format, EN + ES + JA together — tour 3 of
 * the day-tour batch. Owner, 18 Nov: "Keep €132, defaults":
 *   - price kept: €132; ES €143, JA €150
 *   - Kom El Dikka: "Built in Roman times and used until the 7th century" (the date is
 *     disputed: 2nd or 4th century), in the locked copy and the essay, EN/ES/JA. The owner's
 *     Desktop files are left untouched (the EN one is read-only); the change is in the repo's
 *     locked copy and the open-items note.
 *   - Cairo pickup: the standard Cairo/Giza row (the tour is a Cairo tour).
 * The owner's open items are already in the locked copy: no tiers (rule 8), no age line
 * (rule 9). The duplicate /2-day-pyramids-mediterranean-tour is retired into this page by
 * retire-alexandria-duplicate-2026-11-18.mjs.
 *
 *   tour  wp-page-88427   /private-tour-day-tour-to-alexandria-from-cairo
 *
 * Essay (Gate A.3, open items 1–8): the concierge line about tiers is left out; Alexandria
 * founded 331 BC (ES said 332); Pompey's Pillar about 27 m (was 28); "among the largest"
 * catacombs; the museum "a good place to see…"; Kom El Dikka no longer "the only"; Alexandria
 * "one of the largest" Mediterranean cities (Tier 1 candidates stay softened until approved).
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-alexandria-day-trip-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-alexandria-day-trip-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-alexandria-day-trip-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88427';
// The owner kept the live prices.
const OLD_PRICES = { from: 132, es: 143, ja: 150 };
const PRICE = 132;
const GUIDE_PRICES = { es: 143, ja: 150 };
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/alexandria-day-trip-from-cairo-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (18 Nov 2026; owner: "Keep €132, defaults").`;

const G = {
  catacombs: 'guideArticle.alexandria.catacombs-of-kom-el-shoqafa',
  pillar: 'guideArticle.alexandria.pompeys-pillar',
  serapeum: 'guideArticle.alexandria.the-serapeum-temple',
  museum: 'guideArticle.alexandria.alexandria-national-museum',
  theatre: 'guideArticle.alexandria.roman-theatre',
};
const JA_SITES = [['コム・エル・シュカーファのカタコンベ'], ['ポンペイの柱', 'セラペウム'], ['アレクサンドリア国立博物館'], ['コム・エル・ディッカのローマ円形劇場']];
// Sites per stop, in file order.
const SITE_GUIDES = [[G.catacombs], [G.pillar, G.serapeum], [G.museum], [G.theatre]];
const DURATION_LABEL = { en: 'Extended day · ~12 hrs', es: 'Jornada larga · ~12 h', ja: '延長・約12時間' };
const DURATION_HOURS = 12;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch', back: 'Back' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo', back: 'Regreso' },
  ja: { pickup: 'お迎え', lunch: '昼食', back: 'お戻り' },
};
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 午前: 'morning', 昼: 'midday', 午後: 'afternoon' };

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
  const panelRows = Object.fromEntries(panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]));
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
    title, panelRows, periods,
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
for (const l of LANGS) for (const k of ['pickup', 'lunch', 'back']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel`);

/* ── Numeric gate: ES/JA figures equal EN, string by string ──────────── */
const flat = (p) => ({
  opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
  ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
  ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
  ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
});
// Same meaning, checked by hand 18 Nov: JA p0s1.x (the catacombs) "forty-five minutes" = 45分
// (the gate reads the EN words as 40 and 5).
const SAME_MEANING = { es: [], ja: ['p0s1.x'] };
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
      // A Cairo tour: the panel's Pickup row is the Cairo/Giza rule; pickupLine is kept for the record.
      pickupLine: p.panelRows[PANEL[l].pickup], returnNote: p.panelRows[PANEL[l].back],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'axin'), excluded: fact(p.excluded, 'axout'), options: fact(p.options, 'axopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
// On a re-run the prices are already the new ones.
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD_PRICES.from, OLD_PRICES.es, OLD_PRICES.ja].join(), [PRICE, GUIDE_PRICES.es, GUIDE_PRICES.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

const CLOSING_REF = { en: '000000000025', es: '000000000029', ja: '00000000002a' };
// The closing line's second half (the copy joins it), the concierge line about tiers, the empty
// block; ES also its alternative closing lines.
const SKIP = {
  en: ['000000000027', '000000000035', '000000000038'],
  es: ['00000000002b', '00000000003b', '00000000003e'],
  ja: ['00000000002c', '00000000003a'],
};
// [block, find, replace] — open items 2–7 (owner-approved 18 Nov) and the Kom El Dikka date;
// the find text must sit in one run (some blocks have bold site names).
const FIX = {
  en: [
    ['000000000007', 'within a century had become the largest city in the Mediterranean world', 'within a century had become one of the largest cities in the Mediterranean world'],
    ['000000000011', 'these are the largest Greco-Roman burial chambers in Egypt', 'these are among the largest Greco-Roman burial chambers in Egypt'],
    ['000000000015', '28 metres tall', 'about 27 metres tall'],
    ['000000000019', 'making it the best place in the world to see what has been retrieved from ancient Alexandria\'s submerged precincts', 'making it a good place to see what has been raised from ancient Alexandria\'s sunken quarters'],
    ['00000000001d', 'the only excavated Roman-period theatre in Egypt', 'one of the few Roman-period theatres excavated in Egypt'],
    ['00000000001d', 'It dates to the 2nd century AD', 'It dates to Roman times'],
  ],
  es: [
    ['000000000009', 'en 332 a. C.', 'en 331 a. C.'],
    ['000000000009', 'se había convertido en la mayor ciudad del Mediterráneo', 'se había convertido en una de las mayores ciudades del Mediterráneo'],
    ['000000000015', 'son las mayores cámaras funerarias grecorromanas de Egipto', 'están entre las mayores cámaras funerarias grecorromanas de Egipto'],
    ['000000000019', 'de 28 metros de altura', 'de unos 27 metros de altura'],
    ['00000000001d', 'lo que lo convierte en el mejor lugar del mundo para ver lo que se ha recuperado de los recintos sumergidos de la Alejandría antigua', 'lo que lo convierte en un buen lugar para ver lo que se ha rescatado de los barrios sumergidos de la Alejandría antigua'],
    ['000000000021', 'el único teatro de época romana excavado en Egipto', 'uno de los pocos teatros de época romana excavados en Egipto'],
    ['000000000021', 'Se levantó en el siglo II d. C.', 'Se levantó en época romana'],
  ],
  ja: [
    ['00000000000d', '地中海世界で最大の都市となりました', '地中海世界で最大級の都市のひとつとなりました'],
    ['000000000017', 'エジプトで最大のギリシア・ローマの墓室です', 'エジプトで最大級のギリシア・ローマの墓室のひとつです'],
    ['00000000001b', '高さ28メートル', '高さ約27メートル'],
    ['00000000001e', '見るのに、世界で最良の場所にしています', '見るのに、よい場所となっています'],
    ['000000000022', 'エジプトで唯一発掘されたローマ時代の劇場です', 'エジプトで発掘された数少ないローマ時代の劇場のひとつです'],
    ['000000000022', '紀元2世紀にさかのぼり', 'ローマ時代にさかのぼり'],
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
  en: /\btiers?\b|332 BC|28 metres|best place in the world|the only excavated|(are|become) the largest|dates to the 2nd century/i,
  es: /elegir el nivel|332 a\. C|28 metros|el mejor lugar|el único teatro|son las mayores cámaras|en la mayor ciudad|Se levantó en el siglo II/i,
  ja: /段階|28メートル|最良の場所|唯一発掘|最大の都市と|最大のギリシア|紀元2世紀にさかのぼり/,
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
  await writeRollback(client, [DOC_ID], 'before-alexandria-day-trip');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
