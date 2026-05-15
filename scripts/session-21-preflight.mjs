#!/usr/bin/env node
/**
 * Session 21 — Pre-flight identification of 8 docs flagged for deletion.
 * Read-only. Outputs JSON for operator review + scripted deletion input.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'migration/sessions/session-21');
const OUT = path.join(OUT_DIR, 'preflight.json');

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

const projection = `{
  _id, _type,
  "nameEn": name[_key=="en"].value,
  "nameEs": name[_key=="es"].value,
  "nameJa": name[_key=="ja"].value,
  "slugEn": slug.en.current,
  "slugEs": slug.es.current,
  "slugJa": slug.ja.current,
  "bodyLen": length(coalesce(pt::text(body), "")),
  "incomingRefs": *[references(^._id) && !(_id in path("drafts.**"))]{_id, _type}
}`;

async function q(label, groq) {
  const result = await client.fetch(groq);
  return { label, count: result.length, result };
}

const queries = [
  ['marriott', `*[_type=="hotel" && !(_id in path("drafts.**")) && name[_key=="en"].value match "*Marriott Mena House*"] | order(_id) ${projection}`],
  ['hilton_sharm', `*[_type=="hotel" && !(_id in path("drafts.**")) && name[_key=="en"].value match "*Hilton Sharm*"] | order(_id) ${projection}`],
  ['nile_cruise_holidays', `*[_type=="nileCruise" && !(_id in path("drafts.**")) && (name[_key=="en"].value match "*Nile Cruise Holidays*" || slug.en.current=="nile-cruise-holidays")] | order(_id) ${projection}`],
  ['dahabiya_nile_cruise', `*[_type=="nileCruise" && !(_id in path("drafts.**")) && (name[_key=="en"].value match "*Dahabiya Nile Cruise*" || slug.en.current match "*dahabiya-nile-cruise*")] | order(_id) ${projection}`],
  ['pickalbatros_palace_sharm', `*[_type=="hotel" && !(_id in path("drafts.**")) && name[_key=="en"].value match "*Pickalbatros Palace Sharm*"] | order(_id) ${projection}`],
  ['malouka_dups', `*[_type=="nileCruise" && !(_id in path("drafts.**")) && name[_key=="en"].value match "*Malouka*"] | order(name[_key=="en"].value asc) ${projection}`],
  ['adelaide_dups', `*[_type=="nileCruise" && !(_id in path("drafts.**")) && (name[_key=="en"].value match "*Adelaide*" || name[_key=="en"].value match "*Adelaïde*")] | order(name[_key=="en"].value asc) ${projection}`],
  ['agatha_dups', `*[_type=="nileCruise" && !(_id in path("drafts.**")) && name[_key=="en"].value match "*Agatha*"] | order(name[_key=="en"].value asc) ${projection}`],
];

const counts = {
  hotel_total: await client.fetch(`count(*[_type=="hotel" && !(_id in path("drafts.**"))])`),
  nileCruise_total: await client.fetch(`count(*[_type=="nileCruise" && !(_id in path("drafts.**"))])`),
};

const out = { generated_at: new Date().toISOString(), counts, queries: {} };
for (const [label, groq] of queries) {
  const r = await q(label, groq);
  out.queries[label] = r;
  console.error(`${label}: ${r.count}`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.error(`\nWrote ${OUT}`);
console.error(`Pre-counts: hotel=${counts.hotel_total}, nileCruise=${counts.nileCruise_total}`);
