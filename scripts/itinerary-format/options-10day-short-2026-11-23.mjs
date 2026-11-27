/**
 * Owner, 23 Nov: the 8-day Essential Egypt joins the merged 10-day page ("it's better to sell a single Egypt program").
 * Adds one option to the 10-day page's "Make it your own": a shorter eight-day version, on request (EN/ES/JA), last in the list.
 *
 *   node --env-file=<.env> scripts/itinerary-format/options-10day-short-2026-11-23.mjs           # dry run
 *   node --env-file=<.env> scripts/itinerary-format/options-10day-short-2026-11-23.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });
const ID = 'wp-page-87255';
const doc = await client.getDocument(ID);
if (!doc) throw new Error('missing');
const SRC = 'Owner, 23 Nov 2026: single Egypt program; Essential Egypt (8 days) merged into the 10-day page.';
const TEXT = { en: 'A shorter eight-day version of this route: ask us', es: 'Una versión más corta de ocho días de esta ruta: consúltanos', ja: 'このルートの8日間の短縮版：お問い合わせください' };
const have = new Set((doc.customisationOptions ?? []).map((o) => o._key));
const add = Object.entries(TEXT).filter(([l]) => !have.has(`short8-${l}`)).map(([l, text]) => ({ _key: `short8-${l}`, _type: 'productFact', lang: l, text, source: SRC, needsReview: false }));
console.log(`options now: ${(doc.customisationOptions ?? []).length}; adding ${add.length}`);
for (const a of add) console.log(`  + [${a.lang}] ${a.text}`);
if (!apply) { console.log('dry run'); process.exit(0); }
await writeRollback(client, [ID], 'options-10day-short');
await client.patch(ID).setIfMissing({ customisationOptions: [] }).append('customisationOptions', add).commit();
console.log('APPLIED');
