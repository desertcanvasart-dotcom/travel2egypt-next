/**
 * Publish the owner-approved Stage A part 2 (heading-hierarchy fix) draft for
 * wp-page-60649 (Luxor accommodation). Studio-publish mechanism:
 * createOrReplace the published doc from the draft, then delete the draft.
 *
 * Run (dry):    npx tsx scripts/luxor-accommodation-headings-publish-2026-07-10.ts
 * Run (apply):  APPLY=1 npx tsx scripts/luxor-accommodation-headings-publish-2026-07-10.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const APPLY = process.env.APPLY === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) {
  console.error('APPLY=1 needs SANITY_PRODUCTION_API_WRITE_TOKEN');
  process.exit(1);
}
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset, apiVersion: '2024-12-01', useCdn: false, token,
});

const ID = 'wp-page-60649';

async function main() {
  console.log(`=== ${APPLY ? 'APPLY' : 'DRY RUN'}: publish ${ID} heading-fix draft ===\n`);
  const draft: any = await client.getDocument(`drafts.${ID}`);
  if (!draft) throw new Error(`no draft found for ${ID}`);
  const pubBefore: any = await client.getDocument(ID);
  const counts = (d: any) => ['en', 'es', 'ja'].map((l) => `${l}=${d.body.find((b: any) => b._key === l).value.length}`).join(' ');
  console.log(`draft block counts:     ${counts(draft)} (expect en=40 es=51 ja=51)`);
  console.log(`published (pre) counts: ${counts(pubBefore)} (expect en=45 es=52 ja=52)`);
  if (!APPLY) { console.log('\nDRY RUN — re-run with APPLY=1'); return; }

  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/luxor-accommodation-headings-publish-rollback-2026-07-10.json', JSON.stringify(pubBefore, null, 2));
  const { _id, _rev, _createdAt, _updatedAt, ...rest } = draft;
  await client.transaction().createOrReplace({ _id: ID, ...rest }).delete(`drafts.${ID}`).commit({ visibility: 'async' });
  console.log('\n✓ published; draft deleted.');
}

main().catch((e) => { console.error(e); process.exit(1); });
