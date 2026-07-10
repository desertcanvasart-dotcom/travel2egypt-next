/**
 * Publishes the 2 owner-approved Stage A drafts staged earlier this session:
 *   - wp-page-72314 (Aswan prices): pending-image + JA date-stamp deletions,
 *     JA summary debris cleared.
 *   - wp-page-60649 (Luxor accommodation): EN pending-images + promo tail
 *     removed, ES DOCTYPE + duplicate title removed, JA title style fixed,
 *     all 3 summaries cleared.
 *
 * Mechanism mirrors Studio "Publish": createOrReplace the published doc
 * with the draft's content, then delete the draft.
 *
 * Run (dry):    npx tsx scripts/debris-stage-a-publish-2026-07-10.ts
 * Run (apply):  APPLY=1 npx tsx scripts/debris-stage-a-publish-2026-07-10.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const APPLY = process.env.APPLY === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) {
  console.error('APPLY=1 needs SANITY_PRODUCTION_API_WRITE_TOKEN');
  process.exit(1);
}
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset,
  apiVersion: '2024-12-01',
  useCdn: false,
  token,
});

const IDS = ['wp-page-72314', 'wp-page-60649'];

async function main() {
  console.log(`=== ${APPLY ? 'APPLY' : 'DRY RUN'}: publish 2 Stage A drafts ===\n`);
  const backup: Record<string, unknown> = {};

  for (const id of IDS) {
    const draftId = `drafts.${id}`;
    const draft: any = await client.getDocument(draftId);
    if (!draft) { console.error(`✗ no draft found for ${id}`); continue; }
    const pubBefore: any = await client.getDocument(id);
    backup[id] = { publishedBefore: pubBefore };
    console.log(`[${id}] draft body[en] blocks: ${draft.body.find((b: any) => b._key === 'en').value.length}, summary keys: ${(draft.summary ?? []).map((s: any) => s._key).join(',') || '(none)'}`);
    if (!APPLY) continue;
    const { _id, _rev, _createdAt, _updatedAt, ...rest } = draft;
    const newDoc = { _id: id, ...rest };
    await client.transaction().createOrReplace(newDoc).delete(draftId).commit({ visibility: 'async' });
    console.log(`  ✓ published`);
  }

  if (!APPLY) { console.log('\nDRY RUN — re-run with APPLY=1'); return; }
  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/debris-stage-a-publish-rollback-2026-07-10.json', JSON.stringify(backup, null, 2));
  console.log('\nbackup → backups/debris-stage-a-publish-rollback-2026-07-10.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
