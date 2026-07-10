/** Publish the owner-approved Edfu strengthening-pass draft (wp-page-59574). */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();
const APPLY = process.env.APPLY === '1';
if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'production') throw new Error('not production');
const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN;
if (APPLY && !token) { console.error('need SANITY_PRODUCTION_API_WRITE_TOKEN'); process.exit(1); }
const client = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: 'production', apiVersion: '2024-12-01', useCdn: false, token });
const ID = 'wp-page-59574';

async function main() {
  const draft: any = await client.getDocument(`drafts.${ID}`);
  if (!draft) throw new Error('no draft');
  const pub: any = await client.getDocument(ID);
  const cnt = (d: any) => ['en', 'es', 'ja'].map((l) => `${l}=${d.body.find((b: any) => b._key === l).value.length}`).join(' ');
  console.log(`${APPLY ? 'APPLY' : 'DRY'}: draft ${cnt(draft)} | published(pre) ${cnt(pub)}`);
  if (!APPLY) { console.log('dry — APPLY=1 to publish'); return; }
  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/edfu-accommodation-publish-rollback-2026-07-10.json', JSON.stringify(pub, null, 2));
  const { _id, _rev, _createdAt, _updatedAt, ...rest } = draft;
  await client.transaction().createOrReplace({ _id: ID, ...rest }).delete(`drafts.${ID}`).commit({ visibility: 'async' });
  console.log('✓ published; draft deleted.');
}
main().catch((e) => { console.error(e); process.exit(1); });
