import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const baseConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
};

const pubClient = createClient({ ...baseConfig, perspective: 'published' });
const rawClient = createClient({ ...baseConfig, perspective: 'raw' });
const pubWithToken = createClient({ ...baseConfig, perspective: 'published', token: process.env.SANITY_STAGING_API_WRITE_TOKEN });

console.log('=== Direct fetch by _id (with/without token) ===');
const variants = [
  ['published, no token', pubClient],
  ['raw, no token      ', rawClient],
  ['published, w/ token', pubWithToken],
];
for (const [label, c] of variants) {
  const r = await c.fetch(`*[_id == "guideArticle.cairo.gayer-anderson-museum"][0]{_id, _type, "title": title[_key=="en"][0].value}`);
  console.log(`  ${label}: ${JSON.stringify(r)}`);
}

console.log('\n=== placesToGo[]-> dereference ===');
for (const c of [pubClient, rawClient]) {
  const p = c.config().perspective;
  const r = await c.fetch(`*[_id == "wp-page-83284"][0]{ "first5_no_slice": placesToGo[]->{_id, _type}[0..4], "first5_slice_first": placesToGo[0..4]->{_id, _type} }`);
  console.log(`  ${p}:`);
  console.log(`    no-slice:    ${JSON.stringify(r.first5_no_slice?.map((x) => x ? x._id : 'NULL'))}`);
  console.log(`    slice-first: ${JSON.stringify(r.first5_slice_first?.map((x) => x ? x._id : 'NULL'))}`);
}
