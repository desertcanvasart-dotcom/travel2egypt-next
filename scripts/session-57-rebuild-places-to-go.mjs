import 'dotenv/config';
import { createClient } from '@sanity/client';

/**
 * Session 57 — Phase 3d step B: comprehensive placesToGo rebuild.
 *
 * For each of 41 published city docs, replace `placesToGo` with an array
 * of references to every guideArticle where kind=="attraction" and
 * parentCity points at this city.
 *
 * After step A, this includes both the 134 newly-consolidated docs and
 * the 25 pre-existing kind=attraction guideArticles. The schema change
 * in step C tightens the type; this step writes valid refs to that new
 * type. Order: this script runs BEFORE the schema change so existing
 * Studio sessions don't trip over a transient mismatch — once the
 * schema-typed deploy ships, the data is already aligned.
 *
 * Idempotent — re-running with no new attractions is a no-op (existing
 * placesToGo content-fingerprint matches projected). Cities with zero
 * attractions get an empty array (the renderer already hides the
 * section when empty).
 *
 * Run: node scripts/session-57-rebuild-places-to-go.mjs [--dry-run]
 */

const DRY_RUN = process.argv.includes('--dry-run');

const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_STAGING_API_WRITE_TOKEN');
  process.exit(1);
}

const client = createClient({
  projectId: 'ufallvd2',
  dataset: 'migration-staging',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

function stableKey(prefix, i) {
  // _key just needs to be stable + unique within the array. Use a deterministic
  // string so re-runs produce identical fingerprints when content is unchanged.
  return `${prefix}-${i}`;
}

async function main() {
  const cities = await client.fetch(
    `*[_type == "city" && !(_id in path("drafts.**"))] | order(slug[_key=="en"][0].value.current asc){
       _id,
       "city": slug[_key=="en"][0].value.current,
       "currentPlacesIds": placesToGo[]._ref
     }`
  );
  console.log(`[s57-places] cities: ${cities.length}`);
  if (cities.length !== 41) console.warn(`[s57-places] WARN expected 41, got ${cities.length}`);

  let patched = 0;
  let unchanged = 0;
  let failed = 0;
  const summary = [];

  for (const city of cities) {
    const attractions = await client.fetch(
      `*[_type == "guideArticle" && kind == "attraction" && parentCity._ref == $cityId && !(_id in path("drafts.**"))]
       | order(title[_key=="en"][0].value asc){_id}`,
      { cityId: city._id }
    );
    const newRefs = attractions.map((a, i) => ({
      _key: stableKey(city.city, i),
      _type: 'reference',
      _ref: a._id,
    }));

    const before = (city.currentPlacesIds ?? []).slice().sort();
    const after = attractions.map((a) => a._id).sort();
    const sameSet = before.length === after.length && before.every((id, i) => id === after[i]);
    const sameOrder =
      (city.currentPlacesIds ?? []).length === attractions.length &&
      (city.currentPlacesIds ?? []).every((id, i) => id === attractions[i]._id);

    const beforeCount = city.currentPlacesIds?.length ?? 0;
    const afterCount = attractions.length;
    summary.push({ city: city.city, before: beforeCount, after: afterCount });

    if (sameSet && sameOrder) {
      unchanged++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[dry] ${city.city}: ${beforeCount} → ${afterCount}`);
      patched++;
      continue;
    }

    try {
      await client.patch(city._id).set({ placesToGo: newRefs }).commit();
      patched++;
      console.log(`[patch] ${city.city}: ${beforeCount} → ${afterCount}`);
    } catch (e) {
      failed++;
      console.error(`[s57-places] FAIL ${city.city} (${city._id}): ${e.message}`);
    }
  }

  console.log(`\n[s57-places] summary${DRY_RUN ? ' (DRY-RUN)' : ''}: patched=${patched} unchanged=${unchanged} failed=${failed}`);
  // Print final counts per city.
  console.log('\nCity counts after rebuild:');
  for (const s of summary) {
    const arrow = s.before === s.after ? '=' : '→';
    console.log(`  ${s.city.padEnd(22)} ${String(s.before).padStart(3)} ${arrow} ${String(s.after).padStart(3)}`);
  }
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(`[s57-places] FATAL: ${e.message}`);
  process.exit(1);
});
