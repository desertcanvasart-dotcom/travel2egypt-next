/**
 * Import the Giza Pyramids & GEM day tour (wp-page-239597) in the day-tour format.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-gem-2026-11-16.mjs              # dry run
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-gem-2026-11-16.mjs --preview <out.json>
 *       # no write: patch in memory, evaluate the page query (groq-js) for a local render
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-gem-2026-11-16.mjs --apply      # WRITES production (owner OK needed)
 *
 * EN only: dayTourIntro + dayTimeline (approved); Included / Not included and
 * "Make it your own" replaced by the reference's lists (approved). ES / JA untouched.
 */
import { createClient } from '@sanity/client';
import { parse, evaluate } from 'groq-js';
import { writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback } from '../lib/content-gates.mjs';
import { TIMELINE_EN, INTRO_EN, INCLUDED_EN, NOT_INCLUDED_EN, OPTIONS_EN, GUIDE_IDS } from './giza-gem.data.mjs';

const ID = 'wp-page-239597';
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} not found`);
const enBody = doc.body?.find((b) => b._key === 'en')?.value ?? [];
if (!enBody.some((b) => b._key === INTRO_EN.closingRef)) throw new Error('closing block not found in the EN essay');

const notEn = (rows) => (rows ?? []).filter((r) => r.lang !== 'en');
const set = {
  dayTourIntro: [...notEn(doc.dayTourIntro), INTRO_EN],
  dayTimeline: [...notEn(doc.dayTimeline), ...TIMELINE_EN],
  inclusions: [...notEn(doc.inclusions), ...INCLUDED_EN],
  exclusions: [...notEn(doc.exclusions), ...NOT_INCLUDED_EN],
  customisationOptions: [...notEn(doc.customisationOptions), ...OPTIONS_EN],
};
for (const k of Object.keys(set)) set[k] = curlyRows(set[k], 'en');
// Gate A-2: every EN string written must be in the locked copy (two glance labels are locked in the brief).
verbatimPreflight(Object.values(set).flatMap((rows) => visibleStrings(rows, 'en')), ['review/locked/giza-pyramids-gem-day-tour.md'], {
  Panorama: 'day-tour brief §2, "Your day at a glance" example',
  'Sphinx & Valley Temple': 'day-tour brief §2, "Your day at a glance" example',
});
for (const [k, v] of Object.entries(set)) console.log(`${k}: ${(doc[k] ?? []).length} → ${v.length} rows`);

if (previewOut) {
  const refs = await client.fetch(`*[_id in $ids]`, { ids: GUIDE_IDS });
  const cityIds = [...new Set([...refs.map((r) => r.parentCity?._ref), ...(doc.cities ?? []).map((c) => c._ref)].filter(Boolean))];
  const cities = await client.fetch(`*[_id in $ids]`, { ids: cityIds });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const locale of ['en', 'es', 'ja']) {
    const slug = doc.slug.find((s) => s._key === locale)?.value?.current ?? doc.slug.find((s) => s._key === 'en').value.current;
    const r = await (await evaluate(parse(tourBySlugQuery(locale)), { dataset, params: { slug } })).get();
    out[locale] = Object.fromEntries(['approvedInclusions', 'approvedExclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}
{
  // What this run changes, as reader-visible strings (EN).
  const changed = Object.entries(set).flatMap(([k, rows]) => visibleStrings(rows, 'en', doc[k]));
  console.log(`EN strings this run changes: ${changed.length}`);
  for (const c of changed) console.log(`  ~ ${c.slice(0, 100)}`);
}
if (apply) {
  await writeRollback(client, [ID], 'before-giza-import');
  await client.patch(ID).set(set).commit();
  console.log(`APPLIED to production ${ID}`);
} else if (!previewOut) console.log('dry run (pass --apply to write production; owner OK required)');
