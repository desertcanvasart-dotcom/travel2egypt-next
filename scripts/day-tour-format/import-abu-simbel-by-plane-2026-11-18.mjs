/**
 * Abu Simbel by Plane from Aswan in the day-tour format, EN + ES + JA together — tour 2 of
 * the day-tour batch. Owner, 18 Nov: "make it 255" (with the review's defaults):
 *   - price €255; ES €266, JA €273 (the same +€11 / +€18 steps as before; were €108/119/126,
 *     when the old "Base" tier included the flights)
 *   - "usually on a small turboprop" removed (the route is flown by jets)
 *   - the panel's Flights row shows (intro.flightsLine, new field), as the copy has it
 * The owner's open items (18 Nov) are already in the locked copy: flights not included
 * (fare by date and availability; the child discount is on the tour, not the flights),
 * lunch in Abu Simbel or Aswan by flight time, no tiers (rule 8), no age line (rule 9).
 *
 *   tour  tour.abu-simble-by-plane-from-aswan   /abu-simbel-by-plane-from-aswan
 *
 * All three languages are parsed from review/locked/abu-simbel-by-plane-from-aswan-day-tour
 * {,.es,.ja}.md, word for word (Gate A-2). No fixed times: Pickup, Back and Flights are the
 * panel's own lines (pickupLine, returnNote, flightsLine).
 *
 * Essay (Gate A.3, open items 1–9): passages that contradict the page (flights "included",
 * the tiers, the turboprop/representative route paragraph, "the facade to yourself", the tier
 * note) are left out of "More about this day"; the rest are corrected in all three languages.
 * Item 3 (one block figure): "more than a thousand" is kept — the temples were cut into about
 * 1,040 blocks — and the car tour's "about two thousand" is corrected to match (separate
 * script, fix-abu-simbel-blocks-2026-11-18.mjs).
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-abu-simbel-by-plane-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-abu-simbel-by-plane-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-abu-simbel-by-plane-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'tour.abu-simble-by-plane-from-aswan';
// The live prices before this import, and the owner's new ones.
const OLD_PRICES = { from: 108, es: 119, ja: 126 };
const PRICE = 255;
const GUIDE_PRICES = { es: 266, ja: 273 };
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/abu-simbel-by-plane-from-aswan-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (18 Nov 2026; owner: "make it 255", with the review's defaults).`;

const G = { great: 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel' };
// Sites per stop, in file order: the Great Temple has a guide page; the Small Temple has none.
const SITE_GUIDES = [[G.great], [null]];
const DURATION_LABEL = { en: 'Half day · ~5 hrs', es: 'Medio día · ~5 h', ja: '半日・約5時間' };
const DURATION_HOURS = 5;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch', back: 'Back', flights: 'Flights' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo', back: 'Regreso', flights: 'Vuelos' },
  ja: { pickup: 'お迎え', lunch: '昼食', back: 'お戻り', flights: '航空券' },
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
for (const l of LANGS) for (const k of ['pickup', 'lunch', 'back', 'flights']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel`);

/* ── Numeric gate: ES/JA figures equal EN, string by string ──────────── */
const flat = (p) => ({
  opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
  ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
  ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
  ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
});
// Same meaning, checked by hand 18 Nov: "both temples" = «los dos templos» / 2つの神殿 (the gate
// reads «dos» / 2つ as 2): the Temple of Hathor stop (p0s2), the rescue (p0s3), Included row 4.
const SAME_MEANING = { es: ['p0s2.x', 'p0s3.x', 'in3'], ja: ['p0s2.x', 'p0s3.x', 'in3'] };
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
      pickupLine: p.panelRows[PANEL[l].pickup], flightsLine: p.panelRows[PANEL[l].flights], returnNote: p.panelRows[PANEL[l].back],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'apin'), excluded: fact(p.excluded, 'apout'), options: fact(p.options, 'apopt'),
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

const CLOSING_REF = { en: '000000000037', es: '000000000039', ja: '000000000025' };
// Passages that contradict the page: flights "included" + the tiers + "no minimum age", the
// turboprop / representative route paragraph, "the facade to yourself", the closing line's
// second half (the copy joins it into one), the tier note, the empty block.
const SKIP = {
  en: ['00000000001b', '000000000023', '000000000027', '000000000035', '000000000039', '000000000047', '00000000004a'],
  es: ['00000000001d', '000000000025', '000000000029', '000000000037', '00000000003b', '00000000004b', '00000000004e'],
  ja: ['000000000015', '000000000023', '000000000027', '000000000035', '000000000038'],
};
// [block, find, replace] — open items 1–9 (owner-approved 18 Nov), in single-run blocks.
const FIX = {
  en: [
    ['000000000005', 'equatorial sun', 'fierce sun'],
    ['000000000007', ' — roughly 22 February and 22 October, dates that correspond to Ramses\' birthday and coronation —', ' — roughly 22 February and 22 October —'],
    ['000000000009', 'It is the only temple in ancient Egypt in which a pharaoh represented his queen at equal scale to himself —', 'It is a rare case of a queen\'s statues carved at the same scale as the pharaoh\'s —'],
    ['000000000029', 'a local representative meets the group and accompanies you directly', 'your guide meets you and accompanies you directly'],
    ['00000000002d', 'before your representative escorts you back', 'before your guide takes you back'],
  ],
  es: [
    ['000000000007', 'sol ecuatorial', 'sol intenso'],
    ['000000000009', '—alrededor del 22 de febrero y del 22 de octubre, fechas asociadas al cumpleaños y a la coronación de Ramsés—', '—alrededor del 22 de febrero y del 22 de octubre—'],
    ['00000000000b', 'Es el único templo del Egipto antiguo en el que un faraón representó a su reina a la misma escala que él:', 'Es un caso poco común de estatuas de una reina talladas a la misma escala que las del faraón:'],
    ['00000000002b', 'un representante local recibe al grupo y le acompaña', 'tu guía te recibe y te acompaña'],
    ['00000000002f', 'antes de que su representante le acompañe', 'antes de que tu guía te acompañe'],
  ],
  ja: [
    ['00000000000b', '赤道直下のような日差し', '強烈な日差し'],
    ['00000000000d', 'およそ2月22日と10月22日、ラムセスの誕生日と即位の日にあたる日付', 'およそ2月22日と10月22日'],
    ['00000000000f', 'これは古代エジプトで、ファラオが王妃を自分と同じ大きさで表現した唯一の神殿です', 'これは、王妃の像がファラオと同じ大きさで彫られた、数少ない例のひとつです'],
    ['000000000017', '現地の係員がご一行をお迎えし', 'ガイドがお迎えし'],
    ['00000000001b', '係員がアスワンへの帰りのフライトのために', 'ガイドがアスワンへの帰りのフライトのために'],
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
  en: /equatorial|birthday|coronation|only temple in ancient Egypt|representative|turboprop|propeller|\btiers?\b|minimum age|to yourself|two thousand/i,
  es: /ecuatorial|cumpleaños|único templo|representante|turbohélice|niveles|edad mínima|para usted|dos mil/i,
  ja: /赤道|誕生日|唯一の神殿|係員|ターボプロップ|プロペラ|最低年齢|お客様だけのもの|二千/,
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
  guideLanguagePrices: { _type: 'object', ...GUIDE_PRICES },
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
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote} · flights: ${B[l].intro.flightsLine} · lunch: ${B[l].intro.lunch.text}`);
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
  await writeRollback(client, [DOC_ID], 'before-abu-simbel-by-plane-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
