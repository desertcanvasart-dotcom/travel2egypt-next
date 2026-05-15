#!/usr/bin/env node
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
  })
);
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// All nileCruise docs with name + slug for duplicate-spotting.
const all = await client.fetch(`*[_type=="nileCruise" && !(_id in path("drafts.**"))] | order(name[_key=="en"].value asc) {
  _id, "nameEn": name[_key=="en"].value, "slug": slug.en.current
}`);
console.error(`Total: ${all.length}`);
for (const d of all) console.error(`  ${d._id}  |  ${d.nameEn}  |  ${d.slug ?? '(no slug)'}`);
