/**
 * Reproduce the exact GROQ the leaf-page sidebar uses, with the same
 * next-sanity client config (perspective: 'published', useCdn: false in
 * dev). Tells us definitively what the page server-side fetch receives.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  perspective: 'published',
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN,
});

const locale = 'en';

// Pulled verbatim from src/sanity/lib/i18n.ts + queries.ts (city sidebar slice)
const localizedField = (field, l) =>
  `coalesce(${field}[_key=="${l}"][0].value, ${field}[_key=="en"][0].value)`;
const localizedSlug = (field, l) =>
  `coalesce(${field}[_key=="${l}"][0].value.current, ${field}[_key=="en"][0].value.current)`;
const portableTextBodyProjection = (field, l) => `
  coalesce(${field}[_key=="${l}"][0].value, ${field}[_key=="en"][0].value, [])[]{
    ...,
    markDefs[]{ ... }
  }
`;

const query = `
*[_type=="city" && slug[_key=="en"][0].value.current=="cairo"][0]{
  "placesToGo": placesToGo[]->{
    _id,
    "name": ${localizedField('title', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "summary": ${localizedField('summary', locale)},
    "visitorInfo": ${portableTextBodyProjection('visitorInfo', locale)},
    monumentType,
    heroImage{
      ...,
      "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
    }
  }
}
`;

const result = await client.fetch(query);
const places = result?.placesToGo ?? [];
const nonNull = places.filter((p) => p !== null && p !== undefined);
const withName = places.filter((p) => p && p.name);
console.log(`Total entries:      ${places.length}`);
console.log(`Non-null entries:   ${nonNull.length}`);
console.log(`Entries with name:  ${withName.length}`);
console.log(`\nFirst 3 entries:`);
for (const p of places.slice(0, 3)) {
  console.log(`  ${JSON.stringify(p === null ? 'NULL' : { _id: p._id, name: p.name, slug: p.slug })}`);
}
