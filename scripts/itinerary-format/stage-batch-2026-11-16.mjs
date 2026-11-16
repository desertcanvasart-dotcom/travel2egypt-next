/**
 * Stage Batch drafts (multi-day itinerary format) on their products, review-gated.
 *
 *   node --env-file=<.env> scripts/itinerary-format/stage-batch-2026-11-16.mjs review/itinerary/drafts/*.draft.json          # dry run
 *   node --env-file=<.env> scripts/itinerary-format/stage-batch-2026-11-16.mjs --apply review/itinerary/drafts/*.draft.json  # WRITES production (owner OK needed)
 *
 * Each draft (see review/itinerary/batch-01-en.md) becomes:
 *  - one EN `itineraryIntro` row, needsReview: true
 *  - the EN `itineraryDays` rows (existing rows keep their _key and their
 *    overnight approval; new rows are created), day content needsReview: true
 *  - EN `customisationOptions` from the draft's options, needsReview: true
 *    (only added when the product has none in EN)
 * Nothing renders until the owner approves the intro and every day: until then
 * the page keeps its current layout. Overnights already approved stay approved
 * (they drive the panel Nights count); a changed overnight goes back to review.
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback } from '../lib/content-gates.mjs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const files = args.filter((a) => !a.startsWith('--'));
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });

const block = (text, i) => ({ _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text, marks: [] }] });
const keyed = (arr, prefix, map) => (arr ?? []).filter(Boolean).map((x, i) => ({ _key: `${prefix}${i}`, ...map(x) }));

for (const f of files) {
  const d = JSON.parse(readFileSync(f, 'utf8'));
  const doc = await client.getDocument(d._id);
  if (!doc) throw new Error(`${d._id} not found`);
  const enSlug = doc.slug?.find((s) => s._key === 'en')?.value?.current;
  if (enSlug !== d.slug) throw new Error(`${f}: slug ${d.slug} ≠ ${enSlug}`);
  const old = new Map((doc.itineraryDays ?? []).filter((r) => r.lang === 'en').map((r) => [r.day, r]));
  const enDays = d.days.map((x) => {
    const prev = old.get(x.day);
    const overnightSame = prev && (prev.overnight ?? null) === (x.overnight ?? null);
    return {
      _key: prev?._key ?? `itin-en-${x.day}`,
      _type: 'itineraryDay',
      lang: 'en',
      day: x.day,
      place: x.place,
      title: x.title,
      ...(x.body?.length ? { body: x.body.map(block) } : {}),
      ...(x.segments?.length ? { segments: keyed(x.segments, 'g', (s) => ({ _type: 'daySegment', ...s })) } : {}),
      sites: keyed(x.sites, 'site', (name) => ({ _type: 'daySite', name })),
      ...(x.overnight ? { overnight: x.overnight } : {}),
      meals: keyed(x.meals, 'm', (m) => ({ _type: 'dayMeal', ...m })),
      ...(x.travel ? { travel: x.travel } : {}),
      ...(x.pace ? { pace: x.pace } : {}),
      optional: keyed(x.optional, 'o', (o) => ({ _type: 'dayOptional', ...o })),
      narrativeRefs: x.narrativeRefs ?? [],
      ...(typeof x.continuesInDay === 'number' ? { continuesInDay: x.continuesInDay } : {}),
      source: [prev?.source, 'Day block: batch 1 draft, see review/itinerary/batch-01-en.md.'].filter(Boolean).join('\n'),
      needsReview: true,
      overnightNeedsReview: overnightSame ? prev.overnightNeedsReview !== false : true,
    };
  });
  const itineraryDays = [...(doc.itineraryDays ?? []).filter((r) => r.lang !== 'en'), ...enDays];
  const itineraryIntro = [
    ...(doc.itineraryIntro ?? []).filter((r) => r.lang !== 'en'),
    { _key: 'intro-en', _type: 'itineraryIntro', lang: 'en', ...d.intro, source: 'Batch 1 draft, see review/itinerary/batch-01-en.md.', needsReview: true },
  ];
  const set = { itineraryDays, itineraryIntro };
  const hasEnOptions = (doc.customisationOptions ?? []).some((r) => r.lang === 'en');
  if (!hasEnOptions && d.options?.length) {
    set.customisationOptions = [
      ...(doc.customisationOptions ?? []),
      ...d.options.map((text, i) => ({ _key: `itin-opt-en-${i}`, _type: 'productFact', lang: 'en', text, source: 'Batch 1 draft.', needsReview: true })),
    ];
  }
  console.log(`${d.slug} (${d._id}): ${enDays.length} EN days, intro, ${set.customisationOptions ? 'options added' : 'options kept'}`);
  for (const k of Object.keys(set)) set[k] = curlyRows(set[k], 'en');
  // Gate A-2: the draft file (approved by the owner) is the locked copy.
  verbatimPreflight(Object.values(set).flatMap((rows) => visibleStrings(rows, 'en')), [relative(new URL('../../', import.meta.url).pathname, f)]);
  if (apply) {
    await writeRollback(client, [d._id], 'before-itinerary-staging');
    await client.patch(d._id).set(set).commit();
    console.log('  APPLIED');
  }
}
if (!apply) console.log('dry run (pass --apply to write production; owner OK required)');
