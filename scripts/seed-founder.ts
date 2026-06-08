/**
 * One-shot script: populate siteSettings.founder with the founder
 * identity that drives the schema.org/Person JSON-LD rendered alongside
 * the TravelAgency Organization in the root layout.
 *
 * Content is sourced from the implementation brief — these are
 * brand facts (founder bio, education, credentials), not editorial
 * copy, so they are seeded directly into Sanity. The operator can edit
 * any field afterwards from Studio without a redeploy.
 *
 * Run once:
 *   npx tsx scripts/seed-founder.ts
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
// The migration-staging dataset is private and is gated by its own write
// token (mirrors src/sanity/lib/client.ts). Prefer the staging token when
// pointed at the staging dataset; otherwise use the standard write token.
const stagingDataset = process.env.NEXT_PUBLIC_SANITY_STAGING_DATASET;
const token =
  (dataset === stagingDataset && process.env.SANITY_STAGING_API_WRITE_TOKEN) ||
  process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('Missing Sanity env vars (project id or write token).');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

const founder = {
  name: 'Islam Hussein',
  jobTitle: 'Founder',
  description:
    "Egyptian tour operator since 1993, founded Travel2Egypt in 2003. Licensed tourism guide (Egyptian Ministry of Tourism) with a degree from the Faculty of Hotels and Tourism, Helwan University, and a Bachelor's degree in Japanese Language and Literature from Cairo University. Based in Cairo, specialising in expert-led private journeys across Egypt's monuments, Nile valley, and desert oases.",
  birthPlace: 'Aswan, Egypt',
  knowsLanguage: ['Arabic', 'English', 'Japanese'],
  // Array-of-object items carry an explicit _key (and _type for the
  // anonymous inline object) so Sanity Studio's array editor renders them
  // without a "missing keys" warning.
  alumniOf: [
    {
      _type: 'object',
      _key: 'alma-helwan',
      name: 'Helwan University — Faculty of Hotels and Tourism',
      url: 'https://www.helwan.edu.eg/',
    },
    {
      _type: 'object',
      _key: 'alma-cairo',
      name: 'Cairo University — Faculty of Arts',
      url: 'https://cu.edu.eg/',
    },
  ],
  hasCredential: [
    {
      _type: 'object',
      _key: 'cred-license',
      credentialCategory: 'license',
      name: 'Tourism Guide License',
      recognizedBy: {
        name: 'Egyptian Ministry of Tourism and Antiquities',
        url: 'https://egymonuments.gov.eg/',
      },
    },
    {
      _type: 'object',
      _key: 'cred-tourism',
      credentialCategory: 'degree',
      name: 'Tourism Studies',
      recognizedBy: {
        name: 'Helwan University — Faculty of Hotels and Tourism',
        url: 'https://www.helwan.edu.eg/',
      },
    },
    {
      _type: 'object',
      _key: 'cred-japanese',
      credentialCategory: 'degree',
      name: "Bachelor's degree in Japanese Language and Literature",
      recognizedBy: {
        name: 'Cairo University — Faculty of Arts',
        url: 'https://cu.edu.eg/',
      },
    },
  ],
  // sameAs intentionally empty — operator adds LinkedIn / X / etc. from
  // Studio when desired. Empty arrays render no sameAs property in the
  // JSON-LD, which is the correct honest behaviour.
  sameAs: [],
};

async function main() {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "siteSettings"][0]{ _id }`,
  );

  if (!existing?._id) {
    console.error('No siteSettings document exists. Create one in Studio first.');
    process.exit(1);
  }

  console.log(`Patching siteSettings (${existing._id}) on dataset "${dataset}"…`);

  await client
    .patch(existing._id)
    .set({ founder })
    .commit();

  console.log('Done. Founder fields written.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
