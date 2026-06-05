/**
 * Surface the 4 region-less published cities in the /guide index by setting
 * guideRegion. SINGLE additive field write — no other field touched.
 * raw @sanity/client, published docs only. Dry-run by default; --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();
const COMMIT = process.argv.includes('--commit');

const VALID_KEYS = new Set(['cairo-giza', 'middle-egypt', 'upper-egypt', 'delta-north-coast', 'sinai', 'red-sea-coast', 'western-desert']);
const EXPECTED = ['al-fayoum', 'al-wadi-al-gadid', 'siwa-oasis', 'wadi-el-natrun'];
const MAPPING: Record<string, string> = {
  'al-fayoum': 'middle-egypt',
  'al-wadi-al-gadid': 'western-desert',
  'siwa-oasis': 'western-desert',
  'wadi-el-natrun': 'delta-north-coast',
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'published',
  useCdn: false,
});

async function main() {
  console.log(`set-guide-region — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`);

  // STEP 1 — re-verify the region-less published set is exactly the 4 expected.
  const regionless: Array<{ _id: string; slug: string; name: string }> = await client.fetch(
    `*[_type=="city" && !(_id in path("drafts.**")) && !defined(guideRegion)]{ _id, "slug": slug[_key=="en"][0].value.current, "name": name[_key=="en"][0].value } | order(slug asc)`);
  const slugs = regionless.map((c) => c.slug).sort();
  console.log('STEP 1 — region-less published cities:', slugs.join(', '));
  if (JSON.stringify(slugs) !== JSON.stringify([...EXPECTED].sort())) {
    console.error('\n✗ STOP: region-less set differs from expected. Aborting (no writes).');
    console.error('  expected:', [...EXPECTED].sort().join(', '));
    console.error('  actual  :', slugs.join(', '));
    process.exit(1);
  }
  console.log('  ✓ matches expected set exactly.\n');

  // Validate every target key.
  for (const [slug, key] of Object.entries(MAPPING)) {
    if (!VALID_KEYS.has(key)) { console.error(`✗ STOP: invalid guideRegion "${key}" for ${slug}.`); process.exit(1); }
  }

  const indexBefore = await client.fetch<number>(`count(*[_type=="city" && !(_id in path("drafts.**")) && defined(guideRegion)])`);
  console.log(`STEP 3a — /guide index count BEFORE: ${indexBefore}\n`);

  // STEP 2 — apply single-field set per city (published _id).
  for (const c of regionless) {
    const key = MAPPING[c.slug];
    console.log(`  ${COMMIT ? '✓ set' : '· would set'} ${c.slug} (${c._id}) → guideRegion="${key}"`);
    if (COMMIT) await client.patch(c._id).set({ guideRegion: key }).commit({ autoGenerateArrayKeys: false });
  }

  // STEP 3 — verify.
  const indexAfter = await client.fetch<number>(`count(*[_type=="city" && !(_id in path("drafts.**")) && defined(guideRegion)])`);
  const nowSet = await client.fetch<Array<{ slug: string; guideRegion: string }>>(
    `*[_type=="city" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current in $s]{ "slug": slug[_key=="en"][0].value.current, guideRegion } | order(slug asc)`, { s: EXPECTED });
  console.log(`\nSTEP 3b — /guide index count AFTER: ${COMMIT ? indexAfter : indexBefore + ' (dry — unchanged)'}`);
  console.log('  the four:', JSON.stringify(nowSet));
  if (!COMMIT) console.log('\nDRY RUN — re-run with --commit to write.');
}
main().catch((e) => { console.error(e); process.exit(1); });
