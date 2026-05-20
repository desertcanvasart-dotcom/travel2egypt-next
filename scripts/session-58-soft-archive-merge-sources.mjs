import 'dotenv/config';
import { createClient } from '@sanity/client';

/**
 * Session 58 — Phase 3e step D: soft-archive the 2 merged source docs.
 *
 *   migration.reviewFlag    = "merged-into-city"
 *   migration.supersededBy  = <city _id>
 *   migration.supersededAt  = <iso timestamp>
 *
 * Mirrors the s57 wikiMonument soft-archive shape. The `migration` object
 * accepts open-shape additions (Sanity stores undeclared subfields); s57
 * proved this works in practice on wikiMonument.migration, and the
 * guideArticle.migration schema is the same _helpers.migrationField() shape.
 *
 * Idempotent: skips docs already at the target reviewFlag + supersededBy.
 *
 * Run: node scripts/session-58-soft-archive-merge-sources.mjs [--dry-run]
 */

const DRY_RUN = process.argv.includes('--dry-run');
const REVIEW_FLAG = 'merged-into-city';

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

const TARGETS = [
  { sourceId: 'wp-page-60303', cityId: 'wp-page-58892' },
  { sourceId: 'wp-page-75692', cityId: 'wp-page-58920' },
];

async function main() {
  const now = new Date().toISOString();
  let patched = 0;
  let skipped = 0;
  let failed = 0;

  for (const { sourceId, cityId } of TARGETS) {
    const existing = await client.fetch(
      `*[_id == $id][0]{_id, "flag": migration.reviewFlag, "supersededBy": migration.supersededBy}`,
      { id: sourceId }
    );
    if (!existing) {
      console.error(`[s58-archive] FAIL not found: ${sourceId}`);
      failed++;
      continue;
    }
    if (existing.flag === REVIEW_FLAG && existing.supersededBy === cityId) {
      console.log(`[s58-archive] skip ${sourceId} (already merged-into-city → ${cityId})`);
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`[dry] would set reviewFlag on ${sourceId} → ${cityId}`);
      patched++;
      continue;
    }
    try {
      await client
        .patch(sourceId)
        .set({
          'migration.reviewFlag': REVIEW_FLAG,
          'migration.supersededBy': cityId,
          'migration.supersededAt': now,
        })
        .commit();
      patched++;
      console.log(`[s58-archive] ${sourceId} reviewFlag set → ${cityId}`);
    } catch (e) {
      console.error(`[s58-archive] FAIL ${sourceId}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n[s58-archive] summary${DRY_RUN ? ' (DRY-RUN)' : ''}: patched=${patched} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(`[s58-archive] FATAL: ${e.message}`);
  process.exit(1);
});
