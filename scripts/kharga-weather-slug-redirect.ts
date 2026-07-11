import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN, useCdn: false });
const ID = 'wp-page-59731';
const NEW_JA_SLUG = 'haruga-oashisu-no-kiko';
async function main(){
  const pub:any = await c.getDocument(ID);
  const oldSlug = (pub.slug||[]).map((s:any)=>s._key+':'+s.value?.current);
  // clone slug array, replace ONLY the ja item's value.current
  const newSlugArr = (pub.slug||[]).map((s:any)=> s._key==='ja' ? { ...s, value:{ ...s.value, current: NEW_JA_SLUG } } : s);
  const draft = { ...pub, _id: 'drafts.'+ID, slug: newSlugArr };
  await c.createOrReplace(draft);
  const dr:any = await c.getDocument('drafts.'+ID);
  console.log('=== SLUG CHANGE staged (draft) ===');
  console.log('BEFORE slug[]:', oldSlug.join('  '));
  console.log('AFTER  slug[]:', (dr.slug||[]).map((s:any)=>s._key+':'+s.value?.current).join('  '));
  console.log('\n--- integrity: everything else unchanged? ---');
  const g=(a:any[],k:string)=>(a||[]).find((x:any)=>x._key===k)?.value;
  console.log('EN slug unchanged:', g(dr.slug,'en')?.current===g(pub.slug,'en')?.current);
  console.log('ES slug unchanged:', g(dr.slug,'es')?.current===g(pub.slug,'es')?.current);
  console.log('heroImage unchanged:', JSON.stringify(dr.heroImage)===JSON.stringify(pub.heroImage));
  console.log('body unchanged:', JSON.stringify(dr.body)===JSON.stringify(pub.body));
  console.log('title unchanged:', JSON.stringify(dr.title)===JSON.stringify(pub.title));
  console.log('ONLY ja slug differs:', g(dr.slug,'ja')?.current==='haruga-oashisu-no-kiko' && g(pub.slug,'ja')?.current==='harugada-no-tenki-yoho');
}
main().catch(e=>{console.error(e);process.exit(1);});
