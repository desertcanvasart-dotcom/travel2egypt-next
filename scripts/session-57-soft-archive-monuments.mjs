import 'dotenv/config';
import { createClient } from '@sanity/client';

/**
 * Session 57 — Phase 3d step F: soft-archive consolidated wikiMonument docs.
 *
 * Per the s57 STOP gate (decision 1), wikiMonument source docs are left in
 * place — the redirect layer (step E) intercepts /wiki/monuments/<slug>
 * requests and 301s them to /guide/<city>/<slug>. To make the consolidation
 * traceable for the eventual hard-delete sweep, this script patches each
 * of the 134 consolidated wikiMonument docs with
 *
 *   migration.reviewFlag = "superseded-by-guideArticle"
 *   migration.supersededBy = <guideArticle._id>          (NEW soft field)
 *   migration.supersededAt = <iso timestamp>
 *
 * The schema declares `migration.reviewFlag` as `type: 'string'` (open string,
 * not enum). The other two field names are written into the open `migration`
 * object — Sanity stores them; they're not surfaced in Studio UI (no schema
 * field) but are queryable via GROQ for the hard-delete decision later.
 *
 * Idempotent: skips docs whose reviewFlag is already set to the target value.
 *
 * Run: node scripts/session-57-soft-archive-monuments.mjs [--dry-run]
 */

import { readFileSync } from 'node:fs';

const DRY_RUN = process.argv.includes('--dry-run');
const MAP_PATH = 'migration/.diffs/s57-monument-consolidation-map.json';
const REVIEW_FLAG = 'superseded-by-guideArticle';

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

async function main() {
  const mapping = JSON.parse(readFileSync(MAP_PATH, 'utf8'));
  const entries = Object.entries(mapping);
  console.log(`[s57-archive] mapping entries: ${entries.length}`);

  let patched = 0;
  let skipped = 0;
  let failed = 0;
  const now = new Date().toISOString();

  for (const [wikiId, guideId] of entries) {
    const existing = await client.fetch(
      `*[_id == $id][0]{_id, "flag": migration.reviewFlag, "supersededBy": migration.supersededBy}`,
      { id: wikiId }
    );
    if (!existing) {
      failed++;
      console.error(`[s57-archive] FAIL not found: ${wikiId}`);
      continue;
    }
    if (existing.flag === REVIEW_FLAG && existing.supersededBy === guideId) {
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`[dry] would set reviewFlag on ${wikiId} → ${guideId}`);
      patched++;
      continue;
    }
    try {
      await client
        .patch(wikiId)
        .set({
          'migration.reviewFlag': REVIEW_FLAG,
          'migration.supersededBy': guideId,
          'migration.supersededAt': now,
        })
        .commit();
      patched++;
    } catch (e) {
      failed++;
      console.error(`[s57-archive] FAIL ${wikiId}: ${e.message}`);
    }
    if ((patched + skipped) % 20 === 0) {
      console.log(`  …${patched + skipped}/${entries.length}`);
    }
  }
  console.log(`\n[s57-archive] summary${DRY_RUN ? ' (DRY-RUN)' : ''}: patched=${patched} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(`[s57-archive] FATAL: ${e.message}`);
  process.exit(1);
});
