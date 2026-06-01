/**
 * Surgically copy the heroImage from a referenced day tour's draft onto its
 * published doc (hero-only, to avoid clobbering curated published fields), so
 * the /private-day-tours featured tour shows a photo. Idempotent.
 *
 * Run: npx tsx scripts/publish-day-tour-heroes.ts
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'migration-staging';
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('Missing project id or write token');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2024-12-01', token, useCdn: false });

// Referenced day tours whose published doc lacks a hero but whose draft has one.
const IDS = [
  'wp-page-87756', // Memphis, Saqqara & Dahshur (featured)
];

async function main() {
  for (const id of IDS) {
    const draftHero = await client.fetch(`*[_id == $id][0].heroImage`, { id: `drafts.${id}` });
    if (!draftHero?.asset?._ref) {
      console.log(`– ${id}: no draft hero asset, skipping`);
      continue;
    }
    const publishedHero = await client.fetch(`*[_id == $id][0].heroImage.asset._ref`, { id });
    if (publishedHero) {
      console.log(`✓ ${id}: published already has a hero, skipping`);
      continue;
    }
    await client.patch(id).set({ heroImage: draftHero }).commit();
    console.log(`✓ ${id}: copied draft hero → published`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
