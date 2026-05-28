/**
 * Patch safaga's heroImage to use the correct schema type.
 * The doc stored heroImage with _type="image", but the field expects
 * the custom subtype "localizedImage". Studio refuses to publish until
 * the stored _type matches the schema.
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

const before = await client.fetch(`*[_id=="wp-page-58920"][0].heroImage`);
console.log('before:', JSON.stringify(before));

if (!before) {
  throw new Error('safaga has no heroImage to fix');
}
if (before._type === 'localizedImage') {
  console.log('already correct — no write needed.');
  process.exit(0);
}

// Target the _type sub-path directly. Plain `.set({heroImage: {...}})`
// gets normalized back to _type:"image" by the API because the payload
// shape (object with `asset`) is recognized as the built-in image type.
await client.patch('wp-page-58920').set({ 'heroImage._type': 'localizedImage' }).commit({ visibility: 'sync' });

const after = await client.fetch(`*[_id=="wp-page-58920"][0].heroImage`);
console.log('after: ', JSON.stringify(after));
