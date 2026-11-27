/**
 * Grand Islamic Cairo (wp-page-87839): price with the Mosque of Ibn Tulun fee. Owner, 21 Nov: Ibn Tulun
 * costs EGP 100 (Autoura fee row "Ibn Tolun Mosque"), added to T2E-DT-CAI-10's attractions; re-priced
 * €94.48 / €105.49 / €122.00 → €95 / €106 / €122 (was €93 / €104 / €120). Owner: "Yes, update it".
 *
 *   node --env-file=<.env> scripts/day-tour-format/reprice-grand-islamic-2026-11-21.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { writeRollback } from '../lib/content-gates.mjs';

const DOC_ID = 'wp-page-87839';
const OLD = [93, 104, 120];
const P = JSON.parse(readFileSync(new URL('./grand-islamic-prices.json', import.meta.url), 'utf8'));
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (await client.getDocument(`drafts.${DOC_ID}`)) throw new Error('draft exists');
const now = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja];
const next = [P.en, P.es, P.ja];
if (now.join() === next.join()) { console.log('already', next.join(' / ')); process.exit(0); }
if (now.join() !== OLD.join()) throw new Error(`unexpected live prices ${now.join()}`);
console.log(`${DOC_ID}: ${now.join(' / ')} → ${next.join(' / ')}`);
if (process.argv.includes('--apply')) {
  await writeRollback(client, [DOC_ID], 'before-grand-islamic-ibn-tulun-price');
  await client.patch(DOC_ID).set({ priceFrom: P.en, 'guideLanguagePrices.es': P.es, 'guideLanguagePrices.ja': P.ja }).commit();
  console.log('APPLIED');
}
