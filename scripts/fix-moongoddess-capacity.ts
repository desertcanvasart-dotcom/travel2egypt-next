import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});
(async () => {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging')
    throw new Error(`Refusing dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  for (const target of ['wp-page-64340', 'drafts.wp-page-64340']) {
    const doc = await client.fetch(`*[_id == $id][0]{_id, capacity}`, { id: target });
    if (!doc) { if (!target.startsWith('drafts.')) console.log('(published not found?!)'); continue; }
    console.log(`• ${target}: capacity ${doc.capacity} → 53`);
    if (commit) { await client.patch(target).set({ capacity: 53 }).commit({ visibility: 'async' }); console.log('  → written'); }
  }
  if (!commit) console.log('DRY RUN. Re-run with --commit.');
})().catch(e=>{console.error(e);process.exit(1)});
