/**
 * Stage day-tour drafts (day-tour format) on their products, review-gated.
 *
 *   node --env-file=<.env> scripts/day-tour-format/stage-batch-2026-11-16.mjs review/day-tours/drafts/*.draft.json          # dry run
 *   node --env-file=<.env> scripts/day-tour-format/stage-batch-2026-11-16.mjs --apply review/day-tours/drafts/*.draft.json  # WRITES production (owner OK needed)
 *
 * Each draft (see review/day-tours/batch-01-en.md) becomes one EN
 * `dayTourIntro` row and the EN `dayTimeline` rows, all needsReview: true.
 * Included / Not included / options are added as needsReview: true rows only
 * where the product has no EN rows of that kind yet; otherwise they are
 * reported for the owner to merge by hand. Nothing renders until approved.
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback } from '../lib/content-gates.mjs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const files = args.filter((a) => !a.startsWith('--'));
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });

const SRC = 'Day-tour batch 1 draft, see review/day-tours/batch-01-en.md.';
const notEn = (rows) => (rows ?? []).filter((r) => r.lang !== 'en');
const facts = (list, prefix) => (list ?? []).map((text, i) => ({ _key: `${prefix}${i + 1}`, _type: 'productFact', lang: 'en', text, source: SRC, needsReview: true }));

for (const f of files) {
  const d = JSON.parse(readFileSync(f, 'utf8'));
  const doc = await client.getDocument(d._id);
  if (!doc) throw new Error(`${d._id} not found`);
  const enSlug = doc.slug?.find((s) => s._key === 'en')?.value?.current;
  if (enSlug !== d.slug) throw new Error(`${f}: slug ${d.slug} ≠ ${enSlug}`);
  const periods = d.periods.map((p, i) => ({
    _key: `dt-en-${i + 1}`,
    _type: 'dayTourPeriod',
    lang: 'en',
    period: p.period,
    ...(p.periodLabel ? { periodLabel: p.periodLabel } : {}),
    stops: (p.stops ?? []).map((s, j) => ({
      _key: `s${i + 1}-${j + 1}`,
      _type: 'dayTourStop',
      ...Object.fromEntries(['time', 'title', 'glanceLabel', 'skipGlance', 'text', 'includedNote'].filter((k) => s[k] !== undefined && s[k] !== '').map((k) => [k, s[k]])),
      sites: (s.sites ?? []).map((name, k) => ({ _key: `x${k}`, _type: 'dayTourSite', name })),
      optional: (s.optional ?? []).map((o, k) => ({ _key: `o${k}`, _type: 'dayTourOptional', ...o })),
    })),
    source: SRC,
    needsReview: true,
  }));
  const set = {
    dayTourIntro: [...notEn(doc.dayTourIntro), { _key: 'dti-en', _type: 'dayTourIntro', lang: 'en', ...d.intro, source: SRC, needsReview: true }],
    dayTimeline: [...notEn(doc.dayTimeline), ...periods],
  };
  const held = [];
  for (const [field, list, prefix] of [['inclusions', d.included, 'dtin'], ['exclusions', d.notIncluded, 'dtout'], ['customisationOptions', d.options, 'dtopt']]) {
    if (!list?.length) continue;
    const hasEn = (doc[field] ?? []).some((r) => r.lang === 'en');
    if (hasEn) held.push(field);
    else set[field] = [...(doc[field] ?? []), ...facts(list, prefix)];
  }
  console.log(`${d.slug} (${d._id}): ${periods.length} periods, intro${held.length ? `; owner merges by hand: ${held.join(', ')}` : ''}`);
  for (const k of Object.keys(set)) set[k] = curlyRows(set[k], 'en');
  // Gate A-2: the draft file (approved by the owner) is the locked copy.
  verbatimPreflight(Object.values(set).flatMap((rows) => visibleStrings(rows, 'en')), [relative(new URL('../../', import.meta.url).pathname, f)]);
  if (apply) {
    await writeRollback(client, [d._id], 'before-daytour-staging');
    await client.patch(d._id).set(set).commit();
    console.log('  APPLIED');
  }
}
if (!apply) console.log('dry run (pass --apply to write production; owner OK required)');
