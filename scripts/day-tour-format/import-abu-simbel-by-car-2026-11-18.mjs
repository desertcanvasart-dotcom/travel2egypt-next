/**
 * Abu Simbel by Car from Aswan in the day-tour format, EN + ES + JA together — the first
 * of the 56-tour day-tour batch. Owner, 18 Nov: "Keep €163, defaults":
 *   - price kept: €163; ES €174, JA €181 (guideLanguagePrices, untouched)
 *   - back "around 16:00", as the owner gave it
 *   - pickup "your hotel in Aswan" (no cruise ships)
 * The owner's open items (18 Nov) are already in the locked copy: no tiers (standing rule
 * 8: entrance fees and lunch included), no age line and children 50% off (standing rule 9),
 * no convoy (pickup 06:00, back around 16:00), lunch at a lake-view restaurant.
 *
 *   tour  tour.private-tour-abu-simble-by-bus-from-aswan   /abu-simbel-by-car-from-aswan
 *
 * All three languages are parsed from the owner's locked files (review/locked/
 * abu-simbel-by-car-from-aswan-day-tour{,.es,.ja}.md), every string word for word
 * (Gate A-2). The Pickup row is the panel's own line (intro.pickupLine, new field: outside
 * Cairo and Giza the zone isn't the Cairo rule's).
 *
 * Essay (Gate A.3, open items 1–12): the passages written for the old convoy product (the
 * tiers, the 04:00 convoy, "minimum age 18", the tour-bus crowds, "no equivalent anywhere
 * else", the tier note) are left out of "More about this day" (skipRefs); the passages that
 * stay get the approved corrections, in all three languages. The drafting note "What the
 * source material describes as…" is gone from the page.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-abu-simbel-by-car-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-abu-simbel-by-car-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-abu-simbel-by-car-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'tour.private-tour-abu-simble-by-bus-from-aswan';
const PRICE = 163;
const GUIDE_PRICES = { es: 174, ja: 181 };
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/abu-simbel-by-car-from-aswan-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (18 Nov 2026; owner: "Keep €163, defaults").`;

const G = { great: 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel' };
// Sites per stop, in file order: the Great Temple has a guide page; the Small Temple has none.
const SITE_GUIDES = [[G.great], [null]];
const DURATION_LABEL = { en: 'Full day · ~10 hrs', es: 'Día completo · ~10 h', ja: '終日・約10時間' };
const DURATION_HOURS = 10;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
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
    const [word, label] = head.split(/\s*[·・]\s*/);
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
        if (sm) stop.sites = sm[2].split(l === 'ja' ? '・' : ' · ').map((x) => x.trim());
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
for (const l of LANGS) for (const k of ['pickup', 'lunch']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel`);

/* ── Numeric gate: ES/JA figures equal EN, string by string ──────────── */
const flat = (p) => ({
  opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
  ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
  ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
  ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
});
// Same meaning, checked by hand 18 Nov:
//   ES in3: "Entrance to both temples" = «Entrada a los dos templos» (the gate reads «dos» as 2).
//   JA in3: the same, 2つの神殿.
//   JA p0s3.x (the rescue): "sixty-five metres" = 65メートル (the gate reads the EN words as 60 and 5).
const SAME_MEANING = { es: ['in3'], ja: ['in3', 'p0s3.x'] };
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
      pickupTime: '06:00', pickupLine: p.panelRows[PANEL[l].pickup], returnTime: '16:00',
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'asin'), excluded: fact(p.excluded, 'asout'), options: fact(p.options, 'asopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
if (doc.priceFrom !== PRICE) throw new Error(`price is ${doc.priceFrom}, expected the owner's €${PRICE}`);
if (doc.guideLanguagePrices?.es !== GUIDE_PRICES.es || doc.guideLanguagePrices?.ja !== GUIDE_PRICES.ja) throw new Error(`guide-language prices changed: ${JSON.stringify(doc.guideLanguagePrices)}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

const CLOSING_REF = { en: '000000000033', es: '000000000035', ja: '000000000025' };
// The old convoy product's passages, and the empty/tier note blocks at the end.
const SKIP = {
  en: ['000000000013', '00000000001b', '000000000021', '000000000035', '000000000043', '000000000046'],
  es: ['000000000015', '00000000001d', '000000000023', '000000000037', '000000000047', '00000000004a'],
  ja: ['00000000000d', '000000000013', '000000000027', '000000000035', '000000000038'],
};
// [block, find, replace] — open items 1–12 (owner-approved 18 Nov), in single-run blocks.
const FIX = {
  en: [
    ['000000000005', 'return to the city by mid-afternoon', 'be back in Aswan around 16:00'],
    ['000000000005', 'Abu Simbel is, straightforwardly, one of the most impressive', 'For us, Abu Simbel is one of the most impressive'],
    ['00000000001f', 'Departure from your Aswan hotel is early, typically around 4 a.m., to coincide with convoy hours; the Egyptian authorities organise road travel to Abu Simbel in escorted groups, and the timing is fixed by that schedule rather than preference.', 'Departure from your Aswan hotel is at 06:00.'],
    ['000000000025', 'it is the only Egyptian temple in which a queen\'s statues are carved at the same scale as the pharaoh\'s — an unusual indication of Nefertari\'s standing', 'it is a rare case of a queen\'s statues carved at the same scale as the pharaoh\'s, an unusual indication of Nefertari\'s standing'],
    ['000000000025', 'its reliefs include some of the best-preserved colour in any Nubian monument', 'its reliefs keep colour that has survived unusually well'],
    ['000000000029', 'What the source material describes as a relocation is worth a moment\'s explanation', 'The relocation is worth a moment\'s explanation'],
    ['00000000002b', 'Arrival in Aswan is typically late afternoon, depending on departure time and any stops along the road.', 'You are back in Aswan around 16:00.'],
    ['00000000002f', 'built more than any pharaoh before or after him', 'built on a scale few pharaohs matched'],
    ['000000000031', 'the reservoir created by the Aswan High Dam — itself one of the largest engineering projects of the twentieth century.', 'the reservoir created by the Aswan High Dam.'],
    ['000000000033', 'a 4 a.m. departure', 'an early start'],
  ],
  es: [
    ['000000000003', 'con la salida del convoy al amanecer y el regreso por la tarde', 'con la salida a las 06:00 y el regreso hacia las 16:00'],
    ['000000000007', 'regresará a la ciudad a media tarde', 'volverá a Asuán hacia las 16:00'],
    ['000000000007', 'Abu Simbel es, lisa y llanamente, uno de los monumentos', 'Para nosotros, Abu Simbel es uno de los monumentos'],
    ['000000000021', 'La salida desde su hotel de Asuán se realiza temprano, normalmente hacia las 4 de la mañana, para coincidir con los horarios del convoy: las autoridades egipcias organizan el tráfico por carretera a Abu Simbel en grupos escoltados, y el horario lo fija ese calendario, no la preferencia individual.', 'La salida desde tu hotel de Asuán es a las 06:00.'],
    ['000000000027', 'es el único templo egipcio en el que las estatuas de una reina se tallan a la misma escala que las del faraón —una indicación inusual del rango de Nefertari—', 'es un caso poco común de estatuas de una reina talladas a la misma escala que las del faraón, una indicación inusual del rango de Nefertari'],
    ['000000000027', 'sus relieves contienen parte del color mejor conservado de cualquier monumento nubio', 'sus relieves conservan un color que ha resistido inusualmente bien'],
    ['00000000002b', 'Lo que las fuentes describen como un traslado merece un momento de explicación', 'El traslado merece un momento de explicación'],
    ['00000000002d', 'La llegada a Asuán se sitúa habitualmente a última hora de la tarde, en función de la hora de salida y de las paradas en el camino.', 'Se vuelve a Asuán hacia las 16:00.'],
    ['000000000031', 'construyó más que cualquier faraón anterior o posterior', 'construyó a una escala que pocos faraones igualaron'],
    ['000000000033', 'el embalse creado por la Alta Presa de Asuán, en sí uno de los mayores proyectos de ingeniería del siglo XX.', 'el embalse creado por la Alta Presa de Asuán.'],
    ['000000000035', 'una salida a las 4 de la mañana', 'una salida temprana'],
  ],
  ja: [
    ['00000000000b', '午後の半ばまでに街へ戻ります', '16:00頃にアスワンへ戻ります'],
    ['00000000000b', 'アブ・シンベルは、率直に言って、古代世界に現存する最も印象的な記念建造物のひとつです', '私たちにとって、アブ・シンベルは古代世界に現存する最も印象的な記念建造物のひとつです'],
    ['000000000011', 'アスワンのホテルからの出発は早く、たいてい午前4時ごろで、護送隊の時間に合わせます。エジプト当局はアブ・シンベルへの陸路移動を護衛付きのグループで編成しており、時刻は希望ではなくその予定によって定められます。', 'アスワンのホテルを06:00に出発します。'],
    ['000000000017', '王妃の像がファラオと同じ大きさで彫られたエジプト唯一の神殿です', '王妃の像がファラオと同じ大きさで彫られた、数少ない例のひとつです'],
    ['000000000017', 'ヌビアのどの記念建造物にも見られるなかで最もよく保存された彩色のいくつかが含まれます', '驚くほどよく残った彩色が見られます'],
    ['00000000001b', '資料が移設と呼ぶものは、少し説明する価値があります。', '神殿の移設は、少し説明する価値があります。'],
    ['00000000001d', 'アスワン到着は、出発時刻と道中の停車次第ですが、たいてい午後の遅い時刻です。', '16:00頃にアスワンへ戻ります。'],
    ['000000000021', '前後のどのファラオよりも多くを建造しました', 'ほかのファラオがほとんど及ばない規模で建造しました'],
    ['000000000023', '貯水池——それ自体が20世紀で最大級の土木事業のひとつ——であるナセル湖', '貯水池であるナセル湖'],
    ['000000000025', '午前4時の出発', '早朝の出発'],
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
      if (b.children.length !== 1) throw new Error(`${l} ${b._key}: expected one text run`);
      let t = b.children[0].text;
      for (const [, find, repl] of fixes) {
        const alts = [find, find.replace(/'/g, '’'), find.replace(/’/g, "'")];
        const f = alts.find((x) => t.includes(x));
        if (!f && t.includes(repl)) continue; // re-run
        if (!f) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found`);
        t = t.replace(f, repl);
      }
      return { ...b, children: [{ ...b.children[0], text: t }] };
    }),
  };
});
// Nothing "More about this day" shows may keep the old convoy product or a corrected claim.
const RETIRED = {
  en: /4 a\.m|convoy|\btiers?\b|minimum age|straightforwardly|only Egyptian temple|best-preserved|source material|more than any pharaoh|largest engineering|late afternoon|no equivalent/i,
  es: /4 de la mañana|convoy|niveles|edad mínima|lisa y llanamente|único templo|mejor conservado|las fuentes describen|más que cualquier faraón|mayores proyectos|última hora de la tarde|no tiene equivalente/i,
  ja: /午前4時|護送隊|最低年齢|率直に言って|唯一の神殿|最もよく保存|資料が移設|どのファラオよりも|最大級の土木|午後の遅い|比肩する/,
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
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · lunch: ${B[l].intro.lunch.text}`);
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
  await writeRollback(client, [DOC_ID], 'before-abu-simbel-by-car-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
