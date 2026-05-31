/**
 * M/S Historia (wp-page-65217): the live body is a different property (a Malaysian
 * hotel — Katerina, Batu Pahat) imported by mistake. No rewritten source content
 * exists. Per user decision: correct capacity 36→46 (real config 34 cabins + 8
 * suites + 2 presidential + 2 royal) and UNPUBLISH so the junk stops rendering on
 * the live site. Content is preserved in a draft for later re-authoring.
 *
 * Unpublish via @sanity/client: copy published → drafts.<id>, then delete published.
 */
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
const ID = 'wp-page-65217';
(async () => {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging')
    throw new Error(`Refusing dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  const pub = await client.fetch(`*[_id == $id][0]`, { id: ID });
  if (!pub) { console.log('published not found?!'); return; }
  const existingDraft = await client.fetch(`*[_id == $id][0]._id`, { id: `drafts.${ID}` });
  console.log(`published capacity: ${pub.capacity} → 46`);
  console.log(`existing draft: ${existingDraft || '(none)'}`);
  if (!commit) { console.log('\nDRY RUN. Would: set capacity=46, create drafts.'+ID+' from published, delete published. Re-run with --commit.'); return; }
  // 1. correct capacity on the doc we are about to draft
  pub.capacity = 46;
  // 2. create draft copy (preserve content), 3. delete published
  const draftDoc = { ...pub, _id: `drafts.${ID}` };
  await client.transaction()
    .createIfNotExists(draftDoc)
    .delete(ID)
    .commit({ visibility: 'async' });
  console.log('→ capacity set to 46, content moved to draft, published deleted (unpublished).');
})().catch(e=>{console.error(e);process.exit(1)});
