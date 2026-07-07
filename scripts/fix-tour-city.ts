/**
 * Repoint a tour's `cities` reference to the correct city doc. The rail "WHERE"
 * and city crosslinks derive from cities[0], so a wrong ref shows the wrong city.
 *
 *   tsx scripts/fix-tour-city.ts --slug <tour-slug> --city <cityDocId>          # dry run
 *   tsx scripts/fix-tour-city.ts --slug <tour-slug> --city <cityDocId> --apply  # write + publish
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { randomBytes } from 'node:crypto';

loadEnv();
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const SLUG = arg('slug');
const CITY = arg('city');
const APPLY = process.argv.includes('--apply');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

async function cityName(id: string) {
  return client.fetch<string | null>(`*[_id==$id][0].name[_key=="en"][0].value`, { id });
}

async function main() {
  if (!SLUG || !CITY) throw new Error('usage: --slug <slug> --city <cityDocId> [--apply]');
  const tour = await client.fetch<{ _id: string; refs: string[] } | null>(
    `*[!(_id in path("drafts.**")) && _type=="tour" && slug[_key=="en"][0].value.current==$s][0]{_id, "refs": cities[]._ref}`,
    { s: SLUG }
  );
  if (!tour) throw new Error(`No published tour with slug ${SLUG}`);
  const targetName = await cityName(CITY);
  if (!targetName) throw new Error(`City doc ${CITY} not found / has no name`);
  const current = await Promise.all((tour.refs ?? []).map(async (r) => `${r} (${await cityName(r)})`));
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'}  tour=${tour._id}`);
  console.log(`  current cities: ${current.join(', ') || '(none)'}`);
  console.log(`  -> set to:      ${CITY} (${targetName})`);
  if (!APPLY) { console.log('\nDRY RUN — pass --apply to write + publish.'); return; }
  const cities = [{ _type: 'reference', _ref: CITY, _key: randomBytes(6).toString('hex') }];
  await client.patch(tour._id).set({ cities }).commit({ visibility: 'sync' });
  console.log(`\nPublished: cities set to ${CITY} (${targetName}).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
