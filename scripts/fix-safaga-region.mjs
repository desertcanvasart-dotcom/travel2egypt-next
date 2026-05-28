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
const pub = await client.fetch(`*[_id=="wp-page-58920"][0]{_id, region}`);
const draft = await client.fetch(`*[_id=="drafts.wp-page-58920"][0]{_id, region}`);
console.log('published:', pub);
console.log('draft:    ', draft);
// Patch published so frontend (which reads published perspective) sees it
await client.patch('wp-page-58920').set({ region: 'red-sea' }).commit({ visibility: 'sync' });
const after = await client.fetch(`*[_id=="wp-page-58920"][0]{region}`);
console.log('published after:', after);
