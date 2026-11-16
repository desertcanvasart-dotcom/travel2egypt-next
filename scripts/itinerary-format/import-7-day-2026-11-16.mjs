/**
 * Import the 7-Day tour (wp-page-136519) in the multi-day itinerary format.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-7-day-2026-11-16.mjs            # dry run: prints the change
 *   node --env-file=<.env> scripts/itinerary-format/import-7-day-2026-11-16.mjs --preview <out.json>
 *       # no write: applies the patch in memory and evaluates the page query
 *       # (groq-js) over the patched doc + its guide pages, for a local render
 *   node --env-file=<.env> scripts/itinerary-format/import-7-day-2026-11-16.mjs --apply   # WRITES production (owner OK needed)
 *
 * What it changes (EN unless stated):
 *  - itineraryDays: the 7 EN rows get the day-block fields; approved.
 *  - itineraryIntro: one EN row (opening, why, stay and travel, fit, worth knowing); approved.
 *  - inclusions: the meals line gains "farewell dinner on day six" in EN, ES and JA.
 *  - exclusions: + "Abu Simbel: optional extra", + "Extra hours in Cairo before a late departure: optional".
 *  - customisationOptions: the 4 EN rows replaced by the reference's 4, approved.
 * ES / JA days and options are untouched.
 */
import { createClient } from '@sanity/client';
import { parse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { DAYS_EN, INTRO_EN, MEALS_INCLUSION, NEW_EXCLUSIONS_EN, OPTIONS_EN, GUIDE_IDS } from './7-day-epic-escape.data.mjs';

const ID = 'wp-page-136519';
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} not found`);

export function patched(d) {
  const enDays = (d.itineraryDays ?? []).filter((r) => r.lang === 'en').sort((a, b) => a.day - b.day);
  if (enDays.length !== DAYS_EN.length) throw new Error(`expected ${DAYS_EN.length} EN days, found ${enDays.length}`);
  const days = (d.itineraryDays ?? []).map((r) => {
    if (r.lang !== 'en') return r;
    const nd = DAYS_EN.find((x) => x.day === r.day);
    const { source } = r;
    return {
      _key: r._key, _type: 'itineraryDay', lang: 'en', ...nd,
      overnight: nd.overnight ?? undefined,
      source: [source, 'Day block: owner-approved reference draft (2026-11-16).'].filter(Boolean).join('\n'),
      needsReview: false, overnightNeedsReview: false,
    };
  });
  const intro = [...(d.itineraryIntro ?? []).filter((r) => r.lang !== 'en'), { _key: 'intro-en', ...INTRO_EN }];
  const inclusions = (d.inclusions ?? []).map((r) => (MEALS_INCLUSION[r._key] ? { ...r, text: MEALS_INCLUSION[r._key], source: [r.source, 'Owner fact (brief §6.1): farewell dinner on day six.'].filter(Boolean).join('\n') } : r));
  const have = new Set((d.exclusions ?? []).map((r) => r._key));
  const exclusions = [...(d.exclusions ?? []), ...NEW_EXCLUSIONS_EN.filter((r) => !have.has(r._key))];
  const options = [
    ...(d.customisationOptions ?? []).filter((r) => r.lang !== 'en'),
    ...OPTIONS_EN.map((text, i) => ({ _key: `itin7opt${i + 1}`, _type: 'productFact', lang: 'en', text, source: 'Owner-approved reference draft (2026-11-16), "Make it yours".', needsReview: false })),
  ];
  return { itineraryDays: days, itineraryIntro: intro, inclusions, exclusions, customisationOptions: options };
}

const set = patched(doc);
for (const [k, v] of Object.entries(set)) {
  const before = JSON.stringify(doc[k] ?? null);
  console.log(`${k}: ${before === JSON.stringify(v) ? 'unchanged' : `${(doc[k] ?? []).length} → ${v.length} rows`}`);
}

if (previewOut) {
  // Evaluate the page query's review-gated fields over the patched doc.
  const refs = await client.fetch(`*[_id in $ids]{..., "parentCity": parentCity}`, { ids: GUIDE_IDS });
  const cityIds = [...new Set(refs.map((r) => r.parentCity?._ref).filter(Boolean))];
  const cities = await client.fetch(`*[_id in $ids]`, { ids: cityIds });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const locale of ['en', 'es', 'ja']) {
    const q = tourBySlugQuery(locale);
    const slug = doc.slug.find((s) => s._key === locale)?.value?.current ?? doc.slug.find((s) => s._key === 'en').value.current;
    const r = await (await evaluate(parse(q), { dataset, params: { slug } })).get();
    out[locale] = Object.fromEntries(['approvedInclusions', 'approvedExclusions', 'approvedExclusionRows', 'approvedItinerary', 'itineraryFormat', 'approvedOptions'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await client.patch(ID).set(set).commit();
  console.log(`APPLIED to production ${ID}`);
} else if (!previewOut) {
  console.log('dry run (pass --apply to write production; owner OK required)');
}
