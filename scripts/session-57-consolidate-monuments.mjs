import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';

/**
 * Session 57 — Phase 3d step A: wikiMonument → guideArticle consolidation.
 *
 * For each of 134 published wikiMonument docs, create a new guideArticle at
 * a deterministic _id (guideArticle.<city>.<slug>) carrying:
 *   - kind = 'attraction', section = 'places-to-go' (derived)
 *   - parentCity ref (from wikiMonument.city)
 *   - title (from name), slug, summary, body, heroImage  — i18n preserved
 *   - 6 carry-over fields: monumentType, preciseLocation, coordinates,
 *     visitorInfo, gallery, featured  (s53 schema additions)
 *   - migration metadata (wpId, wpUrl, source='wp-import-monument-consolidation')
 *
 * Cross-ref fields (builtBy, builtDuring, buriedHere, dedicatedTo,
 * relatedMonuments, relatedArticles) are dropped — per s57 pre-flight, zero
 * monuments populate them and the four wiki-type doc tables are empty.
 *
 * Idempotent: skips when the deterministic _id already exists. Operator can
 * delete the new guideArticle and rerun for a refresh.
 *
 * Side effect: emits migration/.diffs/s57-monument-consolidation-map.json with
 * { wikiMonument._id → guideArticle._id } used by step E (redirects) + step F
 * (soft-archive reviewFlag).
 *
 * Run:  node scripts/session-57-consolidate-monuments.mjs [--dry-run]
 */

const DRY_RUN = process.argv.includes('--dry-run');

const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_STAGING_API_WRITE_TOKEN in .env');
  process.exit(1);
}

const client = createClient({
  projectId: 'ufallvd2',
  dataset: 'migration-staging',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

const MAP_OUT = 'migration/.diffs/s57-monument-consolidation-map.json';

async function main() {
  const monuments = await client.fetch(
    `*[_type == "wikiMonument" && !(_id in path("drafts.**"))]{
       _id,
       name,
       slug,
       monumentType,
       preciseLocation,
       coordinates,
       summary,
       body,
       visitorInfo,
       heroImage,
       gallery,
       featured,
       migration,
       "cityRef": city._ref,
       "citySlugEn": city->slug[_key=="en"][0].value.current
     } | order(citySlugEn asc, slug[_key=="en"][0].value.current asc)`
  );
  console.log(`[s57-consolidate] wikiMonument published count: ${monuments.length}`);
  if (monuments.length !== 134) {
    console.warn(`[s57-consolidate] WARN expected 134, got ${monuments.length}`);
  }

  let created = 0;
  let skippedExisting = 0;
  let failed = 0;
  const failures = [];
  const mapping = {};

  for (let i = 0; i < monuments.length; i++) {
    const m = monuments[i];
    const enSlug = m.slug?.find?.((s) => s._key === 'en')?.value?.current;
    const enCity = m.citySlugEn;
    const enName = m.name?.find?.((n) => n._key === 'en')?.value;
    if (!enSlug || !enCity) {
      console.error(`[s57-consolidate] SKIP ${m._id}: missing en slug or city slug`);
      failed++;
      failures.push({ id: m._id, reason: 'missing en slug or city slug' });
      continue;
    }
    const newId = `guideArticle.${enCity}.${enSlug}`;

    // Idempotency: skip if already exists.
    const existing = await client.fetch(`*[_id == $id][0]{_id}`, { id: newId });
    if (existing) {
      skippedExisting++;
      mapping[m._id] = newId;
      if ((i + 1) % 20 === 0) console.log(`  …processed ${i + 1}/${monuments.length}`);
      continue;
    }

    const doc = {
      _id: newId,
      _type: 'guideArticle',
      parentCity: { _type: 'reference', _ref: m.cityRef },
      kind: 'attraction',
      section: 'places-to-go',
      title: m.name,
      slug: m.slug,
      ...(m.summary ? { summary: m.summary } : {}),
      ...(m.body ? { body: m.body } : {}),
      ...(m.heroImage ? { heroImage: m.heroImage } : {}),
      ...(m.monumentType ? { monumentType: m.monumentType } : {}),
      ...(m.preciseLocation ? { preciseLocation: m.preciseLocation } : {}),
      ...(m.coordinates ? { coordinates: m.coordinates } : {}),
      ...(m.visitorInfo ? { visitorInfo: m.visitorInfo } : {}),
      ...(m.gallery ? { gallery: m.gallery } : {}),
      ...(m.featured !== undefined ? { featured: m.featured } : {}),
      migration: {
        ...(m.migration ?? {}),
        source: 'wp-import-monument-consolidation',
        migratedAt: new Date().toISOString(),
      },
    };

    if (DRY_RUN) {
      console.log(`[dry] would create ${newId} (${enName})`);
      created++;
      mapping[m._id] = newId;
      continue;
    }

    try {
      await client.createIfNotExists(doc);
      created++;
      mapping[m._id] = newId;
      if ((i + 1) % 10 === 0) console.log(`  …${i + 1}/${monuments.length} (last: ${enName})`);
    } catch (e) {
      failed++;
      failures.push({ id: m._id, newId, reason: e.message });
      console.error(`[s57-consolidate] FAIL ${m._id} → ${newId}: ${e.message}`);
    }
  }

  // Always write the mapping (dry-run and wet).
  if (!existsSync('migration/.diffs')) mkdirSync('migration/.diffs', { recursive: true });
  writeFileSync(MAP_OUT, JSON.stringify(mapping, null, 2) + '\n');

  console.log(
    `\n[s57-consolidate] summary${DRY_RUN ? ' (DRY-RUN)' : ''}: ` +
      `created=${created} skipped_existing=${skippedExisting} failed=${failed} ` +
      `mapping_entries=${Object.keys(mapping).length}`
  );
  if (failures.length) {
    console.error('failures:');
    for (const f of failures) console.error(`  ${f.id}: ${f.reason}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`[s57-consolidate] FATAL: ${e.message}`);
  process.exit(1);
});
