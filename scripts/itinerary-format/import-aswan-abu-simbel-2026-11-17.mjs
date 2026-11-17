/**
 * Two Days from Luxor to Abu Simbel, with a Night in Aswan — merge the
 * duplicate into the keeper and publish the owner's locked copy (EN/ES/JA,
 * 17 Nov, "ready for upload"; owner: the final URL is
 * /aswan-and-abu-simbel-from-luxor).
 *
 *   keeper    wp-page-102370                                   /aswan-and-abu-simbel-from-luxor
 *   duplicate tour.2-day-egypt-s-majestic-trio-aswan-and-abu-simbel-from-luxor
 *
 * Keeper receives: the locked itinerary (days, intro with panel Pickup/Ends,
 * stay and travel, included / not included, options, route legs), the new
 * titles ×3, the duplicate's rewritten summary ×3 and its essay ×3 with the
 * owner's approved corrections (open items, 17 Nov; canon Gate A.3).
 * Keeper keeps its slugs, hero, price and relatedTours.
 * The duplicate is NOT written here: it is unpublished once the 301s are live.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-aswan-abu-simbel-2026-11-17.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-aswan-abu-simbel-2026-11-17.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-aswan-abu-simbel-2026-11-17.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const KEEPER = 'wp-page-102370';
const DUP = 'tour.2-day-egypt-s-majestic-trio-aswan-and-abu-simbel-from-luxor';
const LANGS = ['en', 'es', 'ja'];
const LOCKED = {
  en: 'review/locked/2-day-aswan-and-abu-simbel-from-luxor.md',
  es: 'review/locked/2-day-aswan-and-abu-simbel-from-luxor-es.md',
  ja: 'review/locked/2-day-aswan-and-abu-simbel-from-luxor-ja.md',
};
const CFG = { locked: LOCKED, stayKeys: ['hotels', 'road', 'everyDay'], jaSites: { 1: ['フィラエ神殿', '切りかけのオベリスク', 'アスワン・ハイ・ダム'] } };
const PANEL = { en: ['Pickup', 'Ends'], es: ['Recogida', 'Final'], ja: ['お迎え', '解散'] };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "2-day-aswan-and-abu-simbel-from-luxor" (EN/ES/JA), 17 Nov 2026, sent ready for upload.';

const k = (n) => `0000000000${n}`;
// Essay passages under "More about this stop". Left out: the convoy / "well
// before dawn" paragraph (…17) and the return-to-Luxor choices (…1d), which the
// page no longer offers as included (owner, 17 Nov).
const MORE = { 1: [k('0b'), k('0d'), k('0f'), k('11'), k('13')], 2: [k('19'), k('1b')] };
const CLOSING_REF = k('23');
const GUIDES = {
  1: ['guideArticle.aswan.the-philae-temple', 'guideArticle.aswan.the-unfinished-obelisk', 'wp-page-59236'],
  2: [null, null],
};
const ROUTE = {
  en: [['Luxor', 'Aswan'], ['Aswan', 'Abu Simbel'], ['Abu Simbel', 'Aswan']],
  es: [['Luxor', 'Asuán'], ['Asuán', 'Abu Simbel'], ['Abu Simbel', 'Asuán']],
  ja: [['ルクソール', 'アスワン'], ['アスワン', 'アブ・シンベル'], ['アブ・シンベル', 'アスワン']],
};

/* Essay corrections (owner-approved open items, 17 Nov): [block, exact text, replacement]. */
const FIX = {
  en: [
    [k('0d'), 'from its original island to Agilkia, the rescue operation that followed the High Dam’s flooding of the first cataract.', 'from its original island to Agilkia: the old Aswan Dam of 1902 had left it flooded for much of each year, and the High Dam threatened it for good.'],
    [k('0d'), 'are among the clearest you will see anywhere.', 'are among the clearest in Egypt.'],
    [k('0f'), 'It is the closest you will get to seeing how ancient Egyptian masons actually worked.', 'For us, it is the best place to see how ancient Egyptian masons actually worked.'],
    [k('11'), 'and a dozen other temples.', 'and some twenty other monuments.'],
    [k('1b'), 'The story of the rescue is, in some ways, as remarkable as the temples themselves.', 'For us, the story of the rescue is as remarkable as the temples themselves.'],
  ],
  es: [
    [k('0b'), 'y su guía las ordenará', 'y tu guía las ordenará'],
    [k('0d'), 'a la de Agilkia, la operación de rescate que siguió al anegamiento de la primera catarata tras la Presa Alta.', 'a la de Agilkia: la antigua presa de Asuán, de 1902, lo dejaba inundado gran parte del año, y la Presa Alta lo amenazaba de forma definitiva.'],
    [k('0d'), 'se cuentan entre los más nítidos que se ven en cualquier parte.', 'están entre los más nítidos de Egipto.'],
    [k('0f'), 'Es lo más cerca que estará usted de ver cómo trabajaban realmente los canteros del antiguo Egipto.', 'Para nosotros, es el mejor lugar para ver cómo trabajaban realmente los canteros del antiguo Egipto.'],
    [k('11'), 'y otra docena de templos. Su guía explicará', 'y de una veintena de monumentos más. Tu guía te explicará'],
    [k('1b'), 'La historia del rescate es, en cierto modo, tan notable como los propios templos.', 'Para nosotros, la historia del rescate es tan notable como los propios templos.'],
  ],
  ja: [
    [k('0d'), 'アスワン・ハイダムの貯水が第一急湍を水没させたあと、神殿群全体は', '1902年の旧アスワン・ダムによって一年の大半を水に沈み、さらにハイダムによって水没の危機にさらされたため、神殿群全体は'],
    [k('0f'), '古代の石工がどのように働いていたか、その現場感に最も近づける場所です。', '古代の石工の仕事ぶりを知るには、ここが一番の場所だと私たちは考えています。'],
    [k('11'), 'その他十数の神殿', 'ほか約20の遺跡'],
    [k('1b'), '救出事業の物語そのものが、神殿に劣らず驚嘆に値します。', '私たちにとっては、救出事業の物語も神殿に劣らず驚くべきものです。'],
  ],
};

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.segments?.length ?? `b${d.body.length}`, d.sites.length, d.meals.map((m) => m.meal), d.optional.length, !!d.overnight]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
const flat = (p) => {
  const o = { opening: p.opening, why: p.whyRoute, closing: p.closingLine };
  for (const d of p.days) { o[`d${d.day}.t`] = d.title; (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = s)); o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace; d.optional.forEach((s, i) => (o[`d${d.day}.o${i}`] = s)); }
  Object.entries(p.stayAndTravel).forEach(([kk, v]) => (o[`stay.${kk}`] = v));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Same meaning, reviewed 17 Nov: EN "splits the journey" = JA 「旅を2日に分けます」 (the 2 is the trip's own two days).
const SAME_MEANING = { ja: ['opening'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), loc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete loc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, loc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const [keeper, dup] = await Promise.all([client.getDocument(KEEPER), client.getDocument(DUP)]);
if (!keeper || !dup) throw new Error('keeper or duplicate not found');
if (keeper.durationDays !== 2) throw new Error(`keeper durationDays ${keeper.durationDays}`);

// Essay: the duplicate's rewritten essay, corrected.
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const body = LANGS.map((l) => {
  const src = dup.body.find((b) => b._key === l);
  if (!src) throw new Error(`duplicate has no ${l} essay`);
  const keys = new Set(src.value.map((b) => b._key));
  for (const ref of [...Object.values(MORE).flat(), CLOSING_REF]) if (!keys.has(ref)) throw new Error(`${l}: essay block ${ref} missing`);
  const value = src.value.map((b) => {
    const fixes = FIX[l].filter(([key]) => key === b._key);
    if (!fixes.length) return b;
    let children = b.children.map((c) => ({ ...c }));
    for (const [, find, repl] of fixes) {
      // The EN essay uses straight apostrophes; match either form.
      const alts = [find, find.replace(/’/g, "'")];
      const i = children.findIndex((c) => alts.some((f) => c.text.includes(f)));
      if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
      const f = alts.find((x) => children[i].text.includes(x));
      children[i] = { ...children[i], text: children[i].text.replace(f, repl) };
    }
    return { ...b, children };
  });
  return { ...src, value };
});

const para = (text, i) => ({ _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text, marks: [] }] });
const fact = (key, l, text) => ({ _key: key, _type: 'productFact', lang: l, text, source: SRC, needsReview: false });
function build(l) {
  const p = P[l];
  const exKey = (i) => `asw-ex-${l}-${i}`;
  const taken = new Set();
  const optRef = (day, oi) => {
    const cands = p.excluded.map((x, i) => ({ ...x, i })).filter((x) => x.seeDay === day && !taken.has(x.i));
    const opts = p.days.find((d) => d.day === day).optional;
    if (oi < opts.length - cands.length || !cands.length) return undefined;
    taken.add(cands[0].i);
    return exKey(cands[0].i);
  };
  const prev = new Map((keeper.itineraryDays ?? []).filter((r) => r.lang === l).map((r) => [r.day, r]));
  const days = p.days.map((d) => ({
    _key: prev.get(d.day)?._key ?? `asw-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    ...(d.segments ? { segments: d.segments.map((s, i) => ({ _key: `g${i}`, _type: 'daySegment', ...s })) } : { body: d.body.map(para) }),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel, pace: d.pace,
    optional: d.optional.map((text, i) => { const ref = optRef(d.day, i); return { _key: `o${i}`, _type: 'dayOptional', text, ...(ref ? { exclusionRef: ref } : {}) }; }),
    narrativeRefs: MORE[d.day],
    source: SRC, needsReview: false, overnightNeedsReview: false,
  }));
  const [pk, en] = PANEL[l];
  const intro = {
    _key: `intro-${l}`, _type: 'itineraryIntro', lang: l,
    opening: p.opening, whyRoute: p.whyRoute, whyRouteRefs: [],
    closingLine: p.closingLine, closingRef: CLOSING_REF,
    pickup: p.panel[pk], ends: p.panel[en],
    stayAndTravel: p.stayAndTravel, fitFor: p.fitFor, worthKnowing: p.worthKnowing, makeItYoursIntro: p.makeItYoursIntro,
    source: SRC, needsReview: false,
  };
  if (!intro.pickup || !intro.ends) throw new Error(`${l}: panel Pickup/Ends missing`);
  return {
    days, intro,
    included: p.included.map((t, i) => fact(`asw-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(exKey(i), l, x.text)),
    options: p.options.map((t, i) => fact(`asw-opt-${l}-${i}`, l, t)),
    legs: ROUTE[l].map(([from, to], i) => ({ _key: `asw-leg-${l}-${i}`, _type: 'routeLeg', lang: l, from, to, mode: 'road', ...(i === 0 ? { nights: 1 } : {}), source: SRC, needsReview: false })),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
const set = {
  title: LANGS.map((l) => ({ ...(keeper.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => dup.summary.find((t) => t._key === l)),
  body,
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: LANGS.flatMap((l) => B[l].legs),
};
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs']) set[f] = curlyRows(set[f], 'en');

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs'].flatMap((f) => set[f].filter((r) => r.lang === l)).map(({ mode, ...r }) => r);
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

console.log('BEFORE (keeper):');
for (const l of LANGS) console.log(`  title ${l}: ${keeper.title.find((t) => t._key === l)?.value}\n  summary ${l}: ${keeper.summary.find((t) => t._key === l)?.value.slice(0, 120)}`);
console.log(`  hero keeper ${keeper.heroImage?.asset?._ref} · duplicate ${dup.heroImage?.asset?._ref}; price keeper €${keeper.priceFrom} · duplicate €${dup.priceFrom}`);
for (const [f, v] of Object.entries(set)) console.log(`${f}: ${(keeper[f] ?? []).length} → ${v.length}`);
for (const l of LANGS) for (const b of body.find((x) => x._key === l).value) {
  const before = dup.body.find((x) => x._key === l).value.find((x) => x._key === b._key);
  if (textOf(before) !== textOf(b)) console.log(`essay ${l} ${b._key}: ${textOf(b).slice(0, 200)}`);
}

if (previewOut) {
  const ids = Object.values(GUIDES).flat().filter(Boolean);
  const refs = await client.fetch(`*[_id in $ids]`, { ids });
  const cities = await client.fetch(`*[_id in $ids]`, { ids: (keeper.cities ?? []).map((c) => c._ref) });
  const dataset = [{ ...keeper, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = keeper.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'approvedInclusions', 'approvedExclusionRows', 'itineraryFormat', 'approvedOptions', 'approvedRoute'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [KEEPER, DUP], 'before-aswan-abu-simbel-merge');
  await client.patch(KEEPER).set(set).commit();
  console.log(`APPLIED to production ${KEEPER}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
