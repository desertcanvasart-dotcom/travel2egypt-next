/**
 * Spanish / Japanese for the two approved reference products (2026-11-16):
 * the 7-Day tour (wp-page-136519, multi-day format) and Giza Pyramids & GEM
 * (wp-page-239597, day-tour format). Translations come from
 * review/localize/<lang>-strings.json (keys as in en-strings.json), mapped
 * onto the approved EN structure: same days, sites and guide links, same
 * essay references (the 7-Day essays share block keys in all languages).
 *
 *   node --env-file=<.env> scripts/localize/import-es-ja-2026-11-16.mjs --lang es              # dry run
 *   node --env-file=<.env> scripts/localize/import-es-ja-2026-11-16.mjs --lang es --preview <out.json>
 *   node --env-file=<.env> scripts/localize/import-es-ja-2026-11-16.mjs --lang es --apply --approved
 *       # WRITES production, approved; only after the owner approves review/localize/<lang>-review.md
 */
import { createClient } from '@sanity/client';
import { parse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { DAYS_EN, INTRO_EN, NEW_EXCLUSIONS_EN, OPTIONS_EN, GUIDE_IDS as G7 } from '../itinerary-format/7-day-epic-escape.data.mjs';
import { TIMELINE_EN, INTRO_EN as GINTRO, INCLUDED_EN, NOT_INCLUDED_EN, OPTIONS_EN as GOPTIONS, GUIDE_IDS as GG } from '../day-tour-format/giza-gem.data.mjs';

const args = process.argv.slice(2);
const L = args[args.indexOf('--lang') + 1];
if (!['es', 'ja'].includes(L)) throw new Error('--lang es|ja');
const apply = args.includes('--apply');
if (apply && !args.includes('--approved')) throw new Error('--apply needs --approved (owner approved the review file)');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const T = JSON.parse(readFileSync(new URL(`../../review/localize/${L}-strings.json`, import.meta.url), 'utf8'));
const tr = (k, required = true) => {
  if (T[k] === undefined || T[k] === null || T[k] === '') {
    if (required) throw new Error(`missing ${L} string: ${k}`);
    return undefined;
  }
  return T[k];
};
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const SRC = `Translated from the approved EN (2026-11-16), see review/localize/${L}-review.md.`;
const block = (text, i) => ({ _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text, marks: [] }] });
const others = (rows) => (rows ?? []).filter((r) => r.lang !== L);
const mine = (rows) => (rows ?? []).filter((r) => r.lang === L);

// ── 7-Day ──────────────────────────────────────────────────────────────────
const d7 = await client.getDocument('wp-page-136519');
const enEx = (d7.exclusions ?? []).filter((r) => r.lang === 'en');
const lEx = mine(d7.exclusions).filter((r) => !r._key.startsWith('itin7'));
// The original Not-included rows are parallel across languages (same order).
const exMap = Object.fromEntries(enEx.filter((r) => !r._key.startsWith('itin7')).map((r, i) => [r._key, lEx[i]?._key]));
for (const r of NEW_EXCLUSIONS_EN) exMap[r._key] = `${r._key}-${L}`;
const lDays = new Map(mine(d7.itineraryDays).map((r) => [r.day, r]));
const days7 = DAYS_EN.map((d) => {
  const p = `7day.d${d.day}`;
  const prev = lDays.get(d.day);
  return {
    _key: prev?._key ?? `itin-${L}-${d.day}`,
    _type: 'itineraryDay',
    lang: L,
    day: d.day,
    place: tr(`${p}.place`),
    title: tr(`${p}.title`),
    ...(d.body ? { body: d.body.map((_, i) => block(tr(`${p}.body${i}`), i)) } : {}),
    ...(d.segments ? { segments: d.segments.map((s, i) => ({ ...s, _key: `g${i}`, ...(s.heading ? { heading: tr(`${p}.seg${i}.heading`) } : {}), text: tr(`${p}.seg${i}.text`) })) } : {}),
    sites: (d.sites ?? []).map((s, i) => ({ ...s, _key: `site${i}`, name: tr(`${p}.site${i}`) })),
    // Overnights keep the approved wording already on the page in this language.
    ...(prev?.overnight ? { overnight: prev.overnight } : d.overnight ? { overnight: tr(`${p}.overnight`) } : {}),
    meals: (d.meals ?? []).map((m, i) => ({ ...m, _key: `m${i}`, ...(m.label ? { label: tr(`${p}.meal${i}.label`) } : {}), ...(m.note ? { note: tr(`${p}.meal${i}.note`) } : {}) })),
    travel: tr(`${p}.travel`),
    pace: tr(`${p}.pace`),
    optional: (d.optional ?? []).map((o, i) => ({ ...o, _key: `o${i}`, text: tr(`${p}.opt${i}`), exclusionRef: exMap[o.exclusionRef] })),
    narrativeRefs: d.narrativeRefs,
    source: SRC,
    needsReview: !apply,
    overnightNeedsReview: false,
  };
});
const enBody7 = new Map((d7.body.find((b) => b._key === L)?.value ?? []).map((b) => [b._key, b]));
const closing7 = (enBody7.get(INTRO_EN.closingRef)?.children ?? []).map((c) => c.text).join('');
const intro7 = {
  _key: `intro-${L}`,
  _type: 'itineraryIntro',
  lang: L,
  opening: tr('7day.intro.opening'),
  whyRoute: tr('7day.intro.whyRoute'),
  whyRouteRefs: INTRO_EN.whyRouteRefs,
  closingLine: closing7 || undefined,
  closingRef: closing7 ? INTRO_EN.closingRef : undefined,
  stayAndTravel: Object.fromEntries(Object.keys(INTRO_EN.stayAndTravel).map((k) => [k, tr(`7day.stay.${k}`)])),
  fitFor: INTRO_EN.fitFor.map((_, i) => tr(`7day.fit${i}`)),
  worthKnowing: INTRO_EN.worthKnowing.map((_, i) => tr(`7day.worth${i}`)),
  makeItYoursIntro: tr('7day.intro.makeItYoursIntro'),
  source: SRC,
  needsReview: !apply,
};
const set7 = {
  itineraryDays: [...others(d7.itineraryDays), ...days7],
  itineraryIntro: [...others(d7.itineraryIntro), intro7],
  exclusions: [
    ...(d7.exclusions ?? []).filter((r) => !(r.lang === L && r._key.startsWith('itin7'))),
    ...NEW_EXCLUSIONS_EN.map((r) => ({ ...r, _key: exMap[r._key], lang: L, text: tr(`7day.excl.${r._key}`), source: SRC, needsReview: !apply })),
  ],
  customisationOptions: [
    ...others(d7.customisationOptions),
    ...OPTIONS_EN.map((_, i) => ({ _key: `itin7opt${i + 1}-${L}`, _type: 'productFact', lang: L, text: tr(`7day.option${i}`), source: SRC, needsReview: !apply })),
  ],
};

// ── Giza & GEM ─────────────────────────────────────────────────────────────
const gz = await client.getDocument('wp-page-239597');
const gBody = new Map((gz.body.find((b) => b._key === L)?.value ?? []).map((b) => [b._key, b]));
const gClosingRef = T['giza.closingRef'] && gBody.has(T['giza.closingRef']) ? T['giza.closingRef'] : undefined;
const timeline = TIMELINE_EN.map((p, pi) => ({
  ...p,
  _key: `dt-${L}-${pi + 1}`,
  lang: L,
  periodLabel: tr(`giza.p${pi}.label`),
  stops: p.stops.map((s, si) => {
    const q = `giza.p${pi}.s${si}`;
    return {
      ...s,
      title: tr(`${q}.title`),
      ...(s.glanceLabel ? { glanceLabel: tr(`${q}.glance`) } : {}),
      ...(s.text ? { text: tr(`${q}.text`) } : {}),
      ...(s.includedNote ? { includedNote: tr(`${q}.included`) } : {}),
      ...(s.sites ? { sites: s.sites.map((x, i) => ({ ...x, name: tr(`${q}.site${i}`) })) } : {}),
      ...(s.optional ? { optional: s.optional.map((o, i) => ({ ...o, text: tr(`${q}.opt${i}`), ...(o.note ? { note: tr(`${q}.opt${i}.note`) } : {}) })) } : {}),
    };
  }),
  source: SRC,
  needsReview: !apply,
}));
const gIntro = {
  ...GINTRO,
  _key: `dti-${L}`,
  lang: L,
  opening: tr('giza.intro.opening'),
  whyThisOrder: tr('giza.intro.whyThisOrder'),
  returnNote: tr('giza.intro.returnNote'),
  lunch: { ...GINTRO.lunch, text: tr('giza.intro.lunch') },
  fitFor: GINTRO.fitFor.map((_, i) => tr(`giza.fit${i}`)),
  worthKnowing: GINTRO.worthKnowing.map((_, i) => tr(`giza.worth${i}`)),
  closingLine: tr('giza.closingLine'),
  closingRef: gClosingRef,
  // JA hides anything concierge-related (owner rule): the JA essay's concierge sentence stays in Sanity, out of the page.
  ...(L === 'ja' ? { skipRefs: (gz.body.find((b) => b._key === 'ja')?.value ?? []).filter((b) => (b.children ?? []).some((c) => /コンシェルジュ/.test(c.text ?? ''))).map((b) => b._key) } : {}),
  source: SRC,
  needsReview: !apply,
};
const gFacts = (list, key, prefix) => list.map((r, i) => ({ ...r, _key: `${prefix}${i + 1}-${L}`, lang: L, text: tr(`giza.${key}${i}`), source: SRC, needsReview: !apply }));
const setG = {
  dayTourIntro: [...others(gz.dayTourIntro), gIntro],
  dayTimeline: [...others(gz.dayTimeline), ...timeline],
  inclusions: [...others(gz.inclusions), ...gFacts(INCLUDED_EN, 'incl', 'gzin')],
  exclusions: [...others(gz.exclusions), ...gFacts(NOT_INCLUDED_EN, 'excl', 'gzout')],
  customisationOptions: [...others(gz.customisationOptions), ...gFacts(GOPTIONS, 'option', 'gzopt')],
};

// Gate A-2: every string written in this language must be in the approved strings file
// (closing lines come verbatim from this language's own essay, which is locked copy too).
{
  const essays = [d7, gz].flatMap((d) => (d.body.find((b) => b._key === L)?.value ?? []).map((b) => (b.children ?? []).map((c) => c.text).join('')));
  verbatimPreflight([...Object.entries(set7).flatMap(([k, rows]) => visibleStrings(rows, L, d7[k])), ...Object.entries(setG).flatMap(([k, rows]) => visibleStrings(rows, L, gz[k]))], [`review/localize/${L}-strings.json`], Object.fromEntries(essays.filter(Boolean).map((e) => [e, `${L} essay`])));
}
await contentGate({
  locked: [[`review/localize/${L}-strings.json`, L]],
  numeric: { en: JSON.parse(readFileSync(new URL('../../review/localize/en-strings.json', import.meta.url), 'utf8')), loc: T, lang: L },
  apply,
});
for (const [id, set, doc] of [['wp-page-136519', set7, d7], ['wp-page-239597', setG, gz]])
  for (const [k, v] of Object.entries(set)) console.log(`${id} ${k}: ${(doc[k] ?? []).length} → ${v.length} rows`);
console.log(`7-Day ${L} closing line: ${closing7 ? 'from the essay' : 'none'}; Giza ${L} closingRef: ${gClosingRef ?? 'none (line shown, essay block kept in the expander)'}`);

if (previewOut) {
  // Evaluate the page query over the patched docs, as approved, for a local render.
  const approve = (set) => JSON.parse(JSON.stringify(set).replaceAll('"needsReview":true', '"needsReview":false'));
  const ids = [...G7, ...GG];
  const refs = await client.fetch(`*[_id in $ids]`, { ids });
  const cityIds = [...new Set([...refs.map((r) => r.parentCity?._ref), ...(gz.cities ?? []).map((c) => c._ref), ...(d7.cities ?? []).map((c) => c._ref)].filter(Boolean))];
  const cities = await client.fetch(`*[_id in $ids]`, { ids: cityIds });
  const dataset = [{ ...d7, ...approve(set7) }, { ...gz, ...approve(setG) }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const doc of [d7, gz]) {
    const slug = doc.slug.find((s) => s._key === L)?.value?.current;
    const r = await (await evaluate(parse(tourBySlugQuery(L)), { dataset, params: { slug } })).get();
    out[doc._id] = Object.fromEntries(['approvedInclusions', 'approvedExclusions', 'approvedExclusionRows', 'approvedItinerary', 'approvedOptions', 'itineraryFormat', 'dayTourFormat', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}
if (apply) {
  await writeRollback(client, ['wp-page-136519', 'wp-page-239597'], `before-${L}-import`);
  await client.patch('wp-page-136519').set(set7).commit();
  await client.patch('wp-page-239597').set(setG).commit();
  console.log(`APPLIED ${L} (approved) to production`);
} else if (!previewOut) console.log('dry run (pass --apply --approved after the owner approves the review file)');
