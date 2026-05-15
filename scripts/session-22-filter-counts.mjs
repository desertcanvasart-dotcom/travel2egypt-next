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
const checks = [
  ['day tours total',                      `count(*[_type=="tour" && type=="dayTour" && !(_id in path("drafts.**"))])`],
  ['day tours · needs durationHours',      `count(*[_type=="tour" && type=="dayTour" && !defined(durationHours) && !(_id in path("drafts.**"))])`],
  ['cruises total',                        `count(*[_type=="nileCruise" && !(_id in path("drafts.**"))])`],
  ['cruises · needs propulsion type',      `count(*[_type=="nileCruise" && (!defined(poweredBy) || count(poweredBy)==0) && !(_id in path("drafts.**"))])`],
  ['cruises · needs departure city',       `count(*[_type=="nileCruise" && !defined(departureCity) && !(_id in path("drafts.**"))])`],
  ['cruises · needs itinerary',            `count(*[_type=="nileCruise" && (!defined(itinerary) || count(itinerary)==0) && !(_id in path("drafts.**"))])`],
];
for (const [label, q] of checks) {
  const n = await client.fetch(q);
  console.log(`${label.padEnd(38)} ${n}`);
}
