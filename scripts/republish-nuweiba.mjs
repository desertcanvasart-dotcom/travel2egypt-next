/**
 * Force-publish nuweiba server-side and clear the broken draft.
 *
 * The Studio editor session got into a desynced state after the schema
 * redeploy + multiple programmatic patches: image preview won't render
 * and the Publish button stays inert. Data is fine — it's a v4 client
 * sync glitch. Resolve by promoting the draft to published in one
 * transaction, then deleting the draft. Studio reload picks up clean
 * published state with no pending changes.
 *
 * Mirrors the mechanism in scripts/publish-city-drafts.ts (same
 * createOrReplace + delete pattern), scoped to one doc.
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

const DRAFT_ID = 'drafts.wp-page-58892';
const PUBLISHED_ID = 'wp-page-58892';

const draft = await client.fetch(`*[_id==$id][0]`, { id: DRAFT_ID });
if (!draft) {
  console.log('No draft found — already clean. Nothing to do.');
  process.exit(0);
}

// Strip server-managed fields. _system is internal canvas-tracking state
// (visible in raw perspective) and will be regenerated; we don't carry it.
const { _id, _rev, _createdAt, _updatedAt, _system, ...rest } = draft;
const newPublished = { _id: PUBLISHED_ID, ...rest };

console.log('promoting draft fields:');
console.log('  region:      ', newPublished.region);
console.log('  coordinates: ', JSON.stringify(newPublished.coordinates));
console.log('  heroImage:   ', JSON.stringify(newPublished.heroImage));
console.log('  placesToGo:  ', (newPublished.placesToGo || []).length, 'entry/entries');
console.log('');

await client
  .transaction()
  .createOrReplace(newPublished)
  .delete(DRAFT_ID)
  .commit({ visibility: 'sync' });

console.log('✓ published replaced, draft deleted');

// Verify
const after = await client.fetch(
  `{
    "published": *[_id==$pub][0]{region, coordinates, "heroAsset": heroImage.asset._ref, "heroType": heroImage._type},
    "draftStillExists": defined(*[_id==$draft][0])
  }`,
  { pub: PUBLISHED_ID, draft: DRAFT_ID },
);
console.log('\nverification:');
console.log(JSON.stringify(after, null, 2));
