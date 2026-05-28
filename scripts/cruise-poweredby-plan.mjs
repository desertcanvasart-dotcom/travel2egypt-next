#!/usr/bin/env node
/**
 * READ-ONLY plan: list every nileCruise doc + the poweredBy value that
 * WOULD be set per operator's rule (cruise-ship→engine, dahabiya→wind).
 * Surfaces feluccas + unknown types separately for explicit decision.
 * No writes.
 */
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

const docs = await client.fetch(
  `*[_type=="nileCruise" && !(_id in path("drafts.**"))]{
    _id, type,
    "name": name[_key=="en"].value,
    poweredBy
  } | order(type asc, name asc)`
);

const buckets = { 'cruise-ship': [], dahabiya: [], felucca: [], other: [] };
for (const d of docs) {
  const k = ['cruise-ship', 'dahabiya', 'felucca'].includes(d.type) ? d.type : 'other';
  buckets[k].push(d);
}

console.log(`Total cruises: ${docs.length}\n`);
console.log(`cruise-ship → would set poweredBy=["engine"]  (${buckets['cruise-ship'].length} docs):`);
for (const d of buckets['cruise-ship']) {
  const cur = Array.isArray(d.poweredBy) && d.poweredBy.length ? ` [skip — already=${JSON.stringify(d.poweredBy)}]` : '';
  console.log(`  ${d._id.padEnd(16)} ${d.name}${cur}`);
}
console.log(`\ndahabiya → would set poweredBy=["wind"]  (${buckets.dahabiya.length} docs):`);
for (const d of buckets.dahabiya) {
  const cur = Array.isArray(d.poweredBy) && d.poweredBy.length ? ` [skip — already=${JSON.stringify(d.poweredBy)}]` : '';
  console.log(`  ${d._id.padEnd(16)} ${d.name}${cur}`);
}
console.log(`\nfelucca → NOT auto-set  (${buckets.felucca.length} docs):`);
for (const d of buckets.felucca) console.log(`  ${d._id.padEnd(16)} ${d.name}`);
console.log(`\nunknown/missing type → NOT auto-set  (${buckets.other.length} docs):`);
for (const d of buckets.other) console.log(`  ${d._id.padEnd(16)} type=${d.type ?? '(unset)'}  ${d.name}`);
