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
const r = await client.fetch(`*[_type=="hotel" && !(_id in path("drafts.**")) && (
  name[_key=="en"].value match "*Double Tree*" ||
  name[_key=="en"].value match "*DoubleTree*" ||
  name[_key=="es"].value match "*Double Tree*" ||
  name[_key=="es"].value match "*DoubleTree*"
)]{_id, "nameEn": name[_key=="en"].value, "nameEs": name[_key=="es"].value, "slug": slug.en.current}`);
console.log(JSON.stringify(r, null, 2));
