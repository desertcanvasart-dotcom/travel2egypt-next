/**
 * The two by-plane day tours, priced wholly by Autoura (owner, 26 Nov: "go ahead and do it … includes
 * everything but the flight"). Each template day now lists its own transport lines (both cities' cars)
 * and its airport assistance, so the engine's figure for 2 travellers is the price; no hand additions.
 *   T2E-DT-CAI-16  Cairo by plane from Luxor  €192.54 / €203.41 / €219.72 → €193 / €204 / €220 (was €198 / €209 / €226)
 *   T2E-DT-LXR-09  Luxor by plane from Cairo  €169.05 / €179.93 / €196.23 → €170 / €180 / €197 (was €166 / €177 / €194)
 * Autoura changes: autoura-saas scripts/tmp-t2e/plane-transport-lines.mts (+ LXR-09 airport flags on), snapshot
 * plane-transport-lines.before.json. Flights excluded.
 *
 *   node -r dotenv/config scripts/day-tour-format/reprice-by-plane-autoura-2026-11-26.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const TOURS = [
  { id: 'wp-page-88173', name: 'Cairo by plane from Luxor', old: [198, 209, 226], next: [193, 204, 220] },
  { id: 'wp-page-87760', name: 'Luxor by plane from Cairo', old: [166, 177, 194], next: [170, 180, 197] },
];
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const apply = process.argv.includes('--apply');
for (const t of TOURS) {
  const doc = await client.getDocument(t.id);
  if (!doc) throw new Error(`${t.id} missing`);
  if (await client.getDocument(`drafts.${t.id}`)) throw new Error(`${t.id}: draft exists`);
  const now = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja];
  if (now.join() === t.next.join()) { console.log(`${t.name}: already ${t.next.join(' / ')}`); continue; }
  if (now.join() !== t.old.join()) throw new Error(`${t.name}: unexpected live prices ${now.join()}`);
  console.log(`${t.name} (${t.id}): ${now.join(' / ')} → ${t.next.join(' / ')}`);
  if (apply) {
    await writeRollback(client, [t.id], 'before-by-plane-autoura-price');
    await client.patch(t.id).set({ priceFrom: t.next[0], 'guideLanguagePrices.es': t.next[1], 'guideLanguagePrices.ja': t.next[2] }).commit();
    console.log('  APPLIED');
  }
}
if (!apply) console.log('dry run (--apply writes production)');
