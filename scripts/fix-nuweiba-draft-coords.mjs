/**
 * Inject coordinates into nuweiba's open draft.
 *
 * Background: I patched nuweiba's published doc with coordinates earlier,
 * but a draft (drafts.wp-page-58892) was created in Studio afterwards
 * without inheriting those coords (drafts in Sanity are independent
 * snapshots once they exist; later writes to the published doc don't
 * propagate). Publishing the draft as-is would overwrite the published
 * coordinates with null. This script copies the coords from published
 * into the draft so the user can publish safely.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN,
  perspective: 'raw',
});

if (client.config().dataset !== 'migration-staging') {
  throw new Error(`refusing to run against ${client.config().dataset}`);
}

const published = await client.fetch(`*[_id=="wp-page-58892"][0]{coordinates}`);
if (!published?.coordinates?.lat || !published?.coordinates?.lng) {
  throw new Error('published nuweiba has no coordinates to copy');
}

const draftBefore = await client.fetch(`*[_id=="drafts.wp-page-58892"][0]{coordinates}`);
if (draftBefore?.coordinates?.lat && draftBefore?.coordinates?.lng) {
  console.log('draft already has coords:', JSON.stringify(draftBefore.coordinates));
  process.exit(0);
}

console.log('copying coordinates from published into draft:', JSON.stringify(published.coordinates));
await client
  .patch('drafts.wp-page-58892')
  .set({
    coordinates: {
      _type: 'coordinates',
      lat: published.coordinates.lat,
      lng: published.coordinates.lng,
    },
  })
  .commit({ visibility: 'sync' });

const after = await client.fetch(`*[_id=="drafts.wp-page-58892"][0]{coordinates}`);
console.log('draft now:', JSON.stringify(after));
