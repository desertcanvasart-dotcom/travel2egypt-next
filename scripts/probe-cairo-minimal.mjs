import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  perspective: 'published',
});

async function probe(label, projection) {
  const q = `*[_type=="city" && slug[_key=="en"][0].value.current=="cairo"][0]{
    "places": placesToGo[]->{${projection}}
  }`;
  const r = await client.fetch(q);
  const arr = r?.places ?? [];
  const nonNull = arr.filter((p) => p !== null && p !== undefined).length;
  console.log(`${label}:  total=${arr.length}  nonNull=${nonNull}`);
}

await probe('A. only _id                      ', '_id');
await probe('B. _id + name                    ', '_id, "name": title[_key=="en"][0].value');
await probe('C. _id + name + slug             ', '_id, "name": title[_key=="en"][0].value, "slug": slug[_key=="en"][0].value.current');
await probe('D. + summary                     ', '_id, "name": title[_key=="en"][0].value, "slug": slug[_key=="en"][0].value.current, "summary": summary[_key=="en"][0].value');
await probe('E. + visitorInfo (old)           ', '_id, "name": title[_key=="en"][0].value, "visitorInfo": coalesce(visitorInfo[_key=="en"][0].value, visitorInfo[_key=="en"][0].value)[]{...}');
await probe('F. + visitorInfo (with [] fallback)', '_id, "name": title[_key=="en"][0].value, "visitorInfo": coalesce(visitorInfo[_key=="en"][0].value, visitorInfo[_key=="en"][0].value, [])[]{...}');
await probe('G. + monumentType                ', '_id, "name": title[_key=="en"][0].value, monumentType');
await probe('H. + heroImage                   ', '_id, "name": title[_key=="en"][0].value, heroImage');
await probe('I. + heroImage with alt          ', '_id, heroImage{..., "alt": coalesce(alt[_key=="en"][0].value, alt[_key=="en"][0].value)}');
