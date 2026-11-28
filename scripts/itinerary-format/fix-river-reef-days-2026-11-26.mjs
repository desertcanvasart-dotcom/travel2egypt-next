/**
 * "River, Then Reef: 15 Days on the Nile and the Red Sea" (wp-page-86875) stored durationDays 14 (its 14
 * nights) while its title (EN/ES/JA) and itinerary say 15 days. Owner, 26 Nov: "go ahead and fix the
 * river then reef tour". Sets durationDays 15; slug unchanged.
 *
 *   node -r dotenv/config scripts/itinerary-format/fix-river-reef-days-2026-11-26.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const ID = 'wp-page-86875';
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });
const doc = await client.getDocument(ID);
if (await client.getDocument(`drafts.${ID}`)) throw new Error('draft exists');
const days = (doc.itineraryDays ?? []).filter((d) => d.lang === 'en').length;
if (days !== 15) throw new Error(`itinerary has ${days} EN days, expected 15`);
if (doc.durationDays === 15) { console.log('already 15'); process.exit(0); }
if (doc.durationDays !== 14) throw new Error(`unexpected durationDays ${doc.durationDays}`);
console.log(`${ID}: durationDays 14 → 15`);
if (process.argv.includes('--apply')) {
  await writeRollback(client, [ID], 'before-river-reef-days');
  await client.patch(ID).set({ durationDays: 15 }).commit();
  console.log('APPLIED');
}
