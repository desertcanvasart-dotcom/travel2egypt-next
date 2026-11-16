/**
 * Giza, Memphis & Saqqara in the day-tour format, from the owner's locked file.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-memphis-saqqara-2026-11-16.mjs            # dry run
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-memphis-saqqara-2026-11-16.mjs --preview <out.json>
 *   … --apply [--approved] [--flags-approved]
 *
 * --apply is refused (canon VI.3, "No page publishes EN-only") until the locked
 * ES and JA files exist next to the EN one:
 *   review/locked/giza-memphis-saqqara-day-tour.es.md, …ja.md
 * Rows are written needsReview: true unless --approved (owner approval).
 */
import { createClient } from '@sanity/client';
import { parse, evaluate } from 'groq-js';
import { existsSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { DOC_ID, LOCKED_EN, TIMELINE_EN, INTRO_EN, INCLUDED_EN, NOT_INCLUDED_EN, OPTIONS_EN, GUIDE_IDS, CLOSING_REF, DURATION_HOURS } from './giza-memphis-saqqara.data.mjs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const approved = args.includes('--approved');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (!(doc.body?.find((b) => b._key === 'en')?.value ?? []).some((b) => b._key === CLOSING_REF)) throw new Error('closing block not found in the EN essay');

const review = (rows) => rows.map((r) => ({ ...r, needsReview: !approved }));
const notEn = (rows) => (rows ?? []).filter((r) => r.lang !== 'en');
const set = {
  dayTourIntro: [...notEn(doc.dayTourIntro), ...review([INTRO_EN])],
  dayTimeline: [...notEn(doc.dayTimeline), ...review(TIMELINE_EN)],
  inclusions: [...notEn(doc.inclusions), ...review(INCLUDED_EN)],
  exclusions: [...notEn(doc.exclusions), ...review(NOT_INCLUDED_EN)],
  customisationOptions: [...notEn(doc.customisationOptions), ...review(OPTIONS_EN)],
};
for (const k of Object.keys(set)) set[k] = curlyRows(set[k], 'en');

// Gates: verbatim pre-flight against the locked file; lint (banned words, superlatives, typography).
verbatimPreflight(Object.values(set).flatMap((rows) => visibleStrings(rows, 'en')), [LOCKED_EN]);
await contentGate({ locked: [[LOCKED_EN, 'en']], apply });
for (const [k, v] of Object.entries(set)) console.log(`${k}: ${(doc[k] ?? []).length} → ${v.length} rows`);
console.log(`durationHours: ${doc.durationHours} → ${DURATION_HOURS} (the ES/JA duration labels change in the same publish)`);

if (previewOut) {
  const refs = await client.fetch(`*[_id in $ids]`, { ids: GUIDE_IDS });
  const cityIds = [...new Set([...refs.map((r) => r.parentCity?._ref), ...(doc.cities ?? []).map((c) => c._ref)].filter(Boolean))];
  const cities = await client.fetch(`*[_id in $ids]`, { ids: cityIds });
  const asApproved = JSON.parse(JSON.stringify(set).replaceAll('"needsReview":true', '"needsReview":false'));
  const dataset = [{ ...doc, ...asApproved, durationHours: DURATION_HOURS }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const slug = doc.slug.find((s) => s._key === 'en').value.current;
  const r = await (await evaluate(parse(tourBySlugQuery('en')), { dataset, params: { slug } })).get();
  const fields = ['approvedInclusions', 'approvedExclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'citySlugsEn', 'durationHours'];
  writeFileSync(previewOut, JSON.stringify({ en: Object.fromEntries(fields.map((f) => [f, r?.[f]])) }, null, 1));
  console.log(`preview → ${previewOut} (local render only; nothing written)`);
}

if (apply) {
  const missing = ['es', 'ja'].map((l) => LOCKED_EN.replace(/\.md$/, `.${l}.md`)).filter((f) => !existsSync(new URL(`../../${f}`, import.meta.url)));
  if (missing.length) throw new Error(`Refused: no page publishes EN-only (canon VI.3). Missing locked files: ${missing.join(', ')}`);
  await writeRollback(client, [DOC_ID], 'before-memphis-import');
  await client.patch(DOC_ID).set({ ...set, durationHours: DURATION_HOURS }).commit();
  console.log(`APPLIED to production ${DOC_ID} (${approved ? 'approved' : 'needsReview: true'})`);
} else if (!previewOut) console.log('dry run');
