/**
 * The three Sound & Light evenings (Giza, Karnak, Philae): priced from Autoura, ONE price for every
 * language. Owner, 21 Nov: "Use the 2-traveller price, one price for all languages". The old prices were
 * not calculated (Giza €73, Karnak €73, Philae €61, each with a guide-language add-on for ES/JA although
 * these evenings have no guide). Price only: no copy, layout or slug changes. The new Giza layout stays
 * in PR #321 (it accepts the same price: priceFrom set, guideLanguagePrices absent).
 *
 *   node --env-file=<.env> scripts/day-tour-format/reprice-sound-light-2026-11-21.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { writeRollback } from '../lib/content-gates.mjs';

const P = JSON.parse(readFileSync(new URL('./sound-light-prices.json', import.meta.url), 'utf8'));
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const apply = process.argv.includes('--apply');
const jobs = [];
for (const k of ['giza', 'karnak', 'philae']) {
  const { id, old, price } = P[k];
  const doc = await client.getDocument(id);
  if (!doc) throw new Error(`${id} not found`);
  if (await client.getDocument(`drafts.${id}`)) throw new Error(`drafts.${id} exists`);
  const now = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja];
  if (now.join() === [price, '', ''].join()) { console.log(`${k}: already ${price}`); continue; }
  if (now.join() !== old.join()) throw new Error(`${k}: unexpected live prices ${now.join()}`);
  console.log(`${k} (${id}): ${now.join(' / ')} → ${price} (one price, all languages)`);
  jobs.push({ k, id, price });
}
if (apply && jobs.length) {
  await writeRollback(client, jobs.map((j) => j.id), 'before-sound-light-price');
  for (const j of jobs) { await client.patch(j.id).set({ priceFrom: j.price }).unset(['guideLanguagePrices']).commit(); console.log(`APPLIED ${j.k}`); }
} else if (!apply) console.log('dry run (--apply writes production)');
