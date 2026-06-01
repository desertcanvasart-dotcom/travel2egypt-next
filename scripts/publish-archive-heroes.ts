/**
 * Surgically publish hero images for ONLY the hotels referenced by the
 * hotelsArchive doc (featured + collection refs), so /hotels shows photography
 * instead of placeholders.
 *
 * Run: npx tsx scripts/publish-archive-heroes.ts
 *
 * Why hero-only (not a full draft publish): for these docs the *published*
 * version carries the editorially-curated name/summary, while a separate draft
 * carries the hero image under an older, plainer name. Publishing the draft
 * would overwrite the curated published fields. So we copy just `heroImage`
 * (asset ref + localized alt) from the draft onto the published doc — additive,
 * reversible, no collateral change. Idempotent.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'migration-staging';
const token =
  process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('Missing project id or write token');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2024-12-01', token, useCdn: false });

// The hotels referenced by hotelsArchive that have a draft hero to surface.
const IDS = [
  'wp-page-62471', // Cairo Marriott (featured)
  'wp-page-63597', // Cairo Pyramids
  'wp-page-63552', // Hilton Luxor
  'wp-page-63641', // Sonesta St. George
  'wp-page-62450', // Rixos Seagate
  'wp-page-63506', // Premier Le Reve
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
