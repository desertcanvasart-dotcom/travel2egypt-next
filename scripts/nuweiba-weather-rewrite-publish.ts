import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env' });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN, useCdn: false });
const ID = 'wp-page-60297';
async function main() {
  const pub: any = await c.getDocument(ID);
  const draft: any = await c.getDocument('drafts.' + ID);
  if (!draft) throw new Error('no draft');
  const path = 'backups/nuweiba-weather-pre-rewrite-2026-07-11.json';
  fs.writeFileSync(path, JSON.stringify(pub, null, 2));
  console.log('rollback snapshot ->', path, `(${(pub.body.find((b:any)=>b._key==='en').value||[]).length} en blocks)`);
  const { _id, _rev, ...rest } = draft;
  await c.transaction().createOrReplace({ ...rest, _id: ID }).delete('drafts.' + ID).commit({ visibility: 'async' });
  console.log('PUBLISHED', ID, '+ draft deleted');
  const now: any = await c.getDocument(ID); const dr: any = await c.getDocument('drafts.' + ID);
  console.log('verify title[en]=', now.title.find((t:any)=>t._key==='en').value);
  console.log('verify body[en]=', (now.body.find((b:any)=>b._key==='en').value||[]).length, 'blocks | draft gone=', !dr);
  console.log('verify hero=', now.heroImage?.asset?._ref, '| seo=', (now.seo?.metaDescription||[]).map((x:any)=>x._key).join(','));
}
main().catch(e=>{console.error(e);process.exit(1);});
