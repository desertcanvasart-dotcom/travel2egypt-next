/**
 * Giza Pyramids & Grand Egyptian Museum (wp-page-239597): drop the closing
 * filler sentence from the header intro (summary) in EN, ES and JA, so the
 * header reads like the 7-Day package's (owner, 2026-11-17). Nothing else
 * in the sentence changes.
 *
 *   node --env-file=<.env> scripts/itinerary-format/gem-intro-trim-2026-11-17.mjs           # dry run
 *   node --env-file=<.env> scripts/itinerary-format/gem-intro-trim-2026-11-17.mjs --apply   # writes production
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const ID = 'wp-page-239597';
const DROP = {
  en: ' Here is what to expect.',
  es: ' Esto es lo que cabe esperar.',
  ja: '何を見込んでおくべきか、ここに記します。',
};
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });

const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} not found`);
const summary = doc.summary.map((row) => {
  const drop = DROP[row._key];
  if (!drop) return row;
  if (!row.value.endsWith(drop)) throw new Error(`${row._key}: summary does not end with the sentence to drop:\n${row.value}`);
  return { ...row, value: row.value.slice(0, -drop.length) };
});
for (const [a, b] of doc.summary.map((r, i) => [r, summary[i]])) console.log(`${a._key}:\n  - ${a.value}\n  + ${b.value}`);
if (apply) {
  await writeRollback(client, [ID], 'before-gem-intro-trim');
  await client.patch(ID).set({ summary }).commit();
  console.log(`APPLIED to production ${ID}`);
} else console.log('dry run (pass --apply to write production)');
