/**
 * Import the 4-Day Nile Cruise: Aswan to Luxor (wp-page-90402,
 * /4-days-cruise-from-aswan-to-luxor) in the multi-day itinerary format,
 * EN + ES + JA together (canon VI.3), from the owner's locked files
 * (review/locked/4-day-nile-cruise-itinerary{,-es,-ja}.md, sent 17 Nov 2026
 * "ready for upload"; owner: publish now).
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-4-day-nile-cruise-2026-11-17.mjs              # dry run
 *   node --env-file=<.env> scripts/itinerary-format/import-4-day-nile-cruise-2026-11-17.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-4-day-nile-cruise-2026-11-17.mjs --apply --flags-approved
 *
 * Writes (all three languages, approved): itineraryDays (existing row keys kept),
 * itineraryIntro, inclusions, exclusions, customisationOptions, routeLegs.
 * Title, summary, slugs, price and body essay are unchanged; the day expanders
 * show the body's existing day passages.
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse, LOCKED } from './4-day-nile-cruise.parse.mjs';

const ID = 'wp-page-90402';
const LANGS = ['en', 'es', 'ja'];
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "4-day-nile-cruise-itinerary" (EN/ES/JA), 17 Nov 2026, sent ready for upload.';

const k = (n) => `0000000000${n}`;
// The body essay's day passages (same block keys in all three languages).
const MORE = { 1: [k('0b'), k('0d'), k('0f')], 2: [k('13'), k('15'), k('17')], 3: [k('1b'), k('1d')], 4: [k('21'), k('23'), k('25')] };
const CLOSING_REF = k('27');
// Guide pages per day, in the order of the day's "The day" list (null = no page).
const GUIDES = {
  1: ['guideArticle.aswan.the-philae-temple', 'wp-page-59236', 'guideArticle.aswan.the-unfinished-obelisk', null],
  2: ['guideArticle.kom-ombo.the-temple-of-kom-ombo', null, 'guideArticle.edfu.edfu-temple', null],
  3: ['guideArticle.luxor.the-karnak-temple', null, 'guideArticle.luxor.the-luxor-temple'],
  4: ['guideArticle.luxor.valley-of-the-kings', 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut', 'guideArticle.luxor.the-colossi-of-memnon'],
};
export const GUIDE_IDS = Object.values(GUIDES).flat().filter(Boolean);
const ROUTE = {
  en: { from: 'Aswan', to: 'Luxor', via: ['Kom Ombo', 'Edfu'] },
  es: { from: 'Asuán', to: 'Luxor', via: ['Kom Ombo', 'Edfu'] },
  ja: { from: 'アスワン', to: 'ルクソール', via: ['コム・オンボ', 'エドフ'] },
};

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l)]));

// Structure must match across languages before anything is built.
for (const l of ['es', 'ja']) {
  const a = P.en, b = P[l];
  const shape = (p) => JSON.stringify({
    days: p.days.map((d) => [d.day, d.segments?.map((s) => s.label) ?? `body${d.body.length}`, d.sites.length, d.meals.map((m) => m.meal + (m.note ? '+' : '')), d.optional.length, !!d.overnight]),
    inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length,
  });
  if (shape(a) !== shape(b)) throw new Error(`${l} structure differs from EN:\n EN ${shape(a)}\n ${l.toUpperCase()} ${shape(b)}`);
}

// Numeric gate (canon III): every figure in ES/JA equals EN, string by string.
const flat = (p) => {
  const o = { opening: p.opening, whyRoute: p.whyRoute, note: p.daysNote?.text, closing: p.closingLine };
  for (const d of p.days) {
    o[`d${d.day}.title`] = d.title;
    (d.segments ?? []).forEach((s, i) => (o[`d${d.day}.s${i}`] = s.text));
    (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = s));
    o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace;
    d.optional.forEach((s, i) => (o[`d${d.day}.o${i}`] = s));
  }
  Object.entries(p.stayAndTravel).forEach(([kk, v]) => (o[`stay.${kk}`] = v));
  p.included.forEach((s, i) => (o[`in${i}`] = s));
  p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text));
  p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Same meaning, no figure in the translation (reviewed, 17 Nov): EN "Luxor's two banks" = JA 「ルクソールの東岸と西岸」.
const SAME_MEANING = { ja: ['whyRoute'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), loc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete loc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning, written without a figure)`); }
  numericGate(en, loc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} not found`);
if (doc.durationDays !== 4) throw new Error(`durationDays is ${doc.durationDays}, expected 4`);
for (const l of LANGS) {
  const essay = doc.body?.find((b) => b._key === l)?.value ?? [];
  const keys = new Set(essay.map((b) => b._key));
  for (const ref of [...Object.values(MORE).flat(), CLOSING_REF]) if (!keys.has(ref)) throw new Error(`${l}: essay block ${ref} missing`);
}

const para = (text, i) => ({ _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text, marks: [] }] });
const fact = (key, l, text, extra = {}) => ({ _key: key, _type: 'productFact', lang: l, text, ...extra, source: SRC, needsReview: false });

function build(l) {
  const p = P[l];
  const exKey = (i) => `n4d-ex-${l}-${i}`;
  // "see Day n": each Not-included row with "see Day n" is linked from that day's next optional extra.
  const taken = new Set();
  const optRef = (day, oi) => {
    const cands = p.excluded.map((x, i) => ({ ...x, i })).filter((x) => x.seeDay === day && !taken.has(x.i));
    const opts = p.days.find((d) => d.day === day).optional;
    // Only as many links as rows that point at this day, in order.
    const first = opts.length - cands.length;
    if (oi < first || !cands.length) return undefined;
    const x = cands[0];
    taken.add(x.i);
    return exKey(x.i);
  };
  const prev = new Map((doc.itineraryDays ?? []).filter((r) => r.lang === l).map((r) => [r.day, r]));
  const days = p.days.map((d) => ({
    _key: prev.get(d.day)?._key ?? `n4d-${l}-${d.day}`,
    _type: 'itineraryDay',
    lang: l,
    day: d.day,
    place: d.place,
    title: d.title,
    ...(d.segments ? { segments: d.segments.map((s, i) => ({ _key: `g${i}`, _type: 'daySegment', label: s.label, ...(s.heading ? { heading: s.heading } : {}), text: s.text })) } : { body: d.body.map(para) }),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel,
    pace: d.pace,
    optional: d.optional.map((text, i) => {
      const ref = optRef(d.day, i);
      return { _key: `o${i}`, _type: 'dayOptional', text, ...(ref ? { exclusionRef: ref } : {}) };
    }),
    narrativeRefs: MORE[d.day],
    source: SRC,
    needsReview: false,
    overnightNeedsReview: false,
  }));
  const intro = {
    _key: `intro-${l}`,
    _type: 'itineraryIntro',
    lang: l,
    opening: p.opening,
    whyRoute: p.whyRoute,
    // No "More about this route": the essay's introduction makes the "oldest tourist route" claim the owner removed (handover 16 Nov).
    whyRouteRefs: [],
    closingLine: p.closingLine,
    closingRef: CLOSING_REF,
    daysNote: p.daysNote,
    stayAndTravel: p.stayAndTravel,
    fitFor: p.fitFor,
    worthKnowing: p.worthKnowing,
    makeItYoursIntro: p.makeItYoursIntro,
    source: SRC,
    needsReview: false,
  };
  return {
    days,
    intro,
    included: p.included.map((t, i) => fact(`n4d-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(exKey(i), l, x.text)),
    options: p.options.map((t, i) => fact(`n4d-opt-${l}-${i}`, l, t)),
    leg: { _key: `n4d-leg-${l}`, _type: 'routeLeg', lang: l, ...ROUTE[l], mode: 'nile_cruise', nights: 3, source: SRC, needsReview: false },
  };
}

const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
const set = {
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: LANGS.flatMap((l) => [B[l].leg]),
};
// EN typographic apostrophes (the locked EN already uses them; this only normalizes).
for (const f of Object.keys(set)) set[f] = curlyRows(set[f], 'en');

// Gate A-2: every string written, per language, is in that language's locked file.
// Route-leg place names are the panel's own (Ruta/ルート line of the same file).
for (const l of LANGS) {
  // A route leg's mode is an enum, not reader copy.
  const strings = Object.values(set).flatMap((rows) => visibleStrings(rows.filter((r) => r.lang === l).map(({ mode, ...r }) => r), l));
  verbatimPreflight(strings, [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

for (const [f, v] of Object.entries(set)) {
  const before = doc[f] ?? [];
  console.log(`${f}: ${before.length} → ${v.length} rows`);
}
for (const l of LANGS) {
  const links = B[l].days.flatMap((d) => d.optional.filter((o) => o.exclusionRef).map((o) => `day ${d.day}: "${o.text.slice(0, 40)}" → ${B[l].excluded.find((x) => x._key === o.exclusionRef).text}`));
  console.log(`${l} see-day links:\n  ${links.join('\n  ')}`);
}

if (previewOut) {
  const refs = await client.fetch(`*[_id in $ids]`, { ids: GUIDE_IDS });
  const cityIds = [...new Set(refs.map((r) => r.parentCity?._ref).concat((doc.cities ?? []).map((c) => c._ref)).filter(Boolean))];
  const cities = await client.fetch(`*[_id in $ids]`, { ids: cityIds });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const locale of LANGS) {
    const slug = doc.slug.find((s) => s._key === locale)?.value?.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(locale)), { dataset, params: { slug } })).get();
    out[locale] = Object.fromEntries(['approvedInclusions', 'approvedExclusionRows', 'itineraryFormat', 'approvedOptions', 'approvedRoute'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [ID], 'before-4day-import');
  await client.patch(ID).set(set).commit();
  console.log(`APPLIED to production ${ID}`);
} else if (!previewOut) {
  console.log('dry run (pass --apply --flags-approved to write production)');
}
