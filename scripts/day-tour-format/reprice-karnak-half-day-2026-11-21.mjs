/**
 * Karnak & Luxor Temple half day (wp-page-88397): priced on the half-day "Hotel - Karnak Temple" car card
 * (owner, 21 Nov: "Use the Karnak Temple card for the half day"). Autoura: Luxor Temple added to that card's
 * covered sights (8 rows, rates unchanged; snapshot autoura-saas/scripts/tmp-t2e/widen-karnak-half-card.before.json).
 * LXR-02 re-priced €67.29 / €78.30 / €94.81 → €68 / €79 / €95 (was €66 / €77 / €94 on the empty-list
 * "Hotel - Luxor Temple" fallback card).
 *
 *   node --env-file=<.env> scripts/day-tour-format/reprice-karnak-half-day-2026-11-21.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { writeRollback } from '../lib/content-gates.mjs';

const DOC_ID = 'wp-page-88397';
const OLD = [66, 77, 94];
const P = JSON.parse(readFileSync(new URL('./karnak-luxor-half-day-prices.json', import.meta.url), 'utf8'));
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (await client.getDocument(`drafts.${DOC_ID}`)) throw new Error('draft exists');
const now = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja];
const next = [P.en, P.es, P.ja];
if (now.join() === next.join()) { console.log('already', next.join(' / ')); process.exit(0); }
if (now.join() !== OLD.join()) throw new Error(`unexpected live prices ${now.join()}`);
console.log(`${DOC_ID}: ${now.join(' / ')} → ${next.join(' / ')}`);
if (process.argv.includes('--apply')) {
  await writeRollback(client, [DOC_ID], 'before-karnak-half-day-karnak-card');
  await client.patch(DOC_ID).set({ priceFrom: P.en, 'guideLanguagePrices.es': P.es, 'guideLanguagePrices.ja': P.ja }).commit();
  console.log('APPLIED');
}
