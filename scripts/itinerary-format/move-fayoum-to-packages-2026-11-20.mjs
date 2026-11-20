/**
 * Fayoum Desert in Two Days (wp-page-156014, /fayoum-desert-adventure): moved from day tours to
 * packages, under adventure, AHEAD of the content import (owner, 20 Nov: "Move it now, no price").
 *
 *   type dayTour → package · theme → theme-adventure · durationDays 1 → 2
 *
 * Nothing else changes: the current copy and price (€150 / €161 / €168) stay until
 * import-fayoum-2day-2026-11-20.mjs runs with Autoura prices (that import writes the same three
 * fields again, so it is unaffected). Writes a rollback first.
 *
 *   node --env-file=<.env> scripts/itinerary-format/move-fayoum-to-packages-2026-11-20.mjs           # dry run
 *   node --env-file=<.env> scripts/itinerary-format/move-fayoum-to-packages-2026-11-20.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const ID = 'wp-page-156014';
const THEME = 'theme-adventure';
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });

const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} missing`);
if (await client.getDocument(`drafts.${ID}`)) throw new Error(`drafts.${ID} exists — handle it first`);
if (!(await client.getDocument(THEME))) throw new Error(`${THEME} missing`);
const set = { type: 'package', theme: { _type: 'reference', _ref: THEME }, durationDays: 2 };
for (const [k, v] of Object.entries(set)) console.log(`${k}: ${JSON.stringify(doc[k])} → ${JSON.stringify(v)}`);
console.log(`tourMode ${doc.tourMode} · price €${doc.priceFrom} / ${JSON.stringify(doc.guideLanguagePrices)} (unchanged)`);
if (!apply) { console.log('dry run (--apply writes production)'); process.exit(0); }
await writeRollback(client, [ID], 'before-move-fayoum-to-packages');
await client.patch(ID).set(set).commit();
console.log(`APPLIED to production ${ID}`);
