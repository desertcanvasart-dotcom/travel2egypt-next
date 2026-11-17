/**
 * Aswan & Abu Simbel (#265): finish Gate D step 4 for the duplicate.
 * The duplicate was unpublished after its 301s went live (only its draft is
 * left, already carrying migration.supersededBy) but was never flagged. This
 * marks the draft hidden + superseded-duplicate, as for Luxor by Air (#267),
 * so it stays out of every list even if the draft is published by mistake.
 *
 *   node --env-file=<.env> scripts/itinerary-format/retire-aswan-duplicate-2026-11-17.mjs          # dry run
 *   node --env-file=<.env> scripts/itinerary-format/retire-aswan-duplicate-2026-11-17.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const KEEPER = 'wp-page-102370';
const DUP = 'tour.2-day-egypt-s-majestic-trio-aswan-and-abu-simbel-from-luxor';
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });

const ids = [DUP, `drafts.${DUP}`];
const docs = (await Promise.all(ids.map((id) => client.getDocument(id)))).map((d, i) => [ids[i], d]).filter(([, d]) => d);
if (!docs.length) throw new Error('duplicate not found (neither published nor draft)');
if (!(await client.getDocument(KEEPER))) throw new Error('keeper missing');
const inbound = await client.fetch('*[references($a) || references($b)]{_id}', { a: DUP, b: `drafts.${DUP}` });
if (inbound.length) throw new Error(`still referenced by ${inbound.map((x) => x._id).join(', ')}: repoint first`);

const hide = { hidden: true, 'migration.reviewFlag': 'superseded-duplicate', 'migration.supersededBy': KEEPER, 'migration.supersededAt': new Date().toISOString() };
for (const [id] of docs) console.log(`hide ${id}: ${JSON.stringify(hide)}`);
if (apply) {
  await writeRollback(client, docs.map(([id]) => id), 'before-aswan-retire');
  for (const [id] of docs) await client.patch(id).set(hide).commit();
  console.log(`RETIRED ${docs.map(([id]) => id).join(', ')}`);
} else console.log('dry run (pass --apply to write production)');
