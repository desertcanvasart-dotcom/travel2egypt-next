/**
 * Owner answers, small-group Q&A (2026-11-11). Production Sanity writes:
 *  - Q2: 12-day Australia & Oceania tour gets departures 21 Jan 2027 and
 *    15 Mar 2027, max group 12 (peak uplift 30% stored like the other three).
 *  - Q8: "Alexandria in a Day" (wp-page-145910, /2-day-pyramids-mediterranean-tour)
 *    becomes a private DAY tour: type dayTour, durationHours 12, label from the
 *    product's own "twelve to fourteen hours", durationDays unset. URL, city
 *    (Cairo, the departure city) and every other field unchanged.
 * Each patch is guarded by the document revision read just before.
 * Run from the repo root: node scripts/small-group-owner-answers-2026-11-11.mjs [--apply]
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const apply = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-10-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN, useCdn: false });

const AUS = 'tour.12-day-egypt-group-tour-cairo-dahabiya-red-sea';
const ALEX = 'wp-page-145910';

const aus = await c.getDocument(AUS);
const alex = await c.getDocument(ALEX);
console.log('Australia before:', { departures: aus.departures ?? null, maxGroup: aus.maxGroup ?? null, peakUpliftPct: aus.peakUpliftPct ?? null });
console.log('Alexandria before:', { type: alex.type, durationDays: alex.durationDays, durationHours: alex.durationHours ?? null, durationLabel: alex.durationLabel ?? null });
if (alex.type !== 'package' && alex.type !== 'dayTour') throw new Error('unexpected Alexandria type');

if (!apply) { console.log('Dry run. Pass --apply to write.'); process.exit(0); }

await c
  .patch(AUS)
  .ifRevisionId(aus._rev)
  .set({
    departures: [
      { _key: 'dep0', _type: 'departure', startDate: '2027-01-21', isPeak: false },
      { _key: 'dep1', _type: 'departure', startDate: '2027-03-15', isPeak: false },
    ],
    maxGroup: 12,
    peakUpliftPct: 30,
  })
  .commit({ autoGenerateArrayKeys: false });

await c
  .patch(ALEX)
  .ifRevisionId(alex._rev)
  .set({
    type: 'dayTour',
    durationHours: 12,
    durationLabel: [
      { _key: 'en', _type: 'internationalizedArrayStringValue', value: 'Extended · ~12–14 hrs' },
      { _key: 'es', _type: 'internationalizedArrayStringValue', value: 'Jornada larga · ~12–14 h' },
      { _key: 'ja', _type: 'internationalizedArrayStringValue', value: '延長・約12〜14時間' },
    ],
  })
  .unset(['durationDays'])
  .commit({ autoGenerateArrayKeys: false });

console.log('Applied.');
