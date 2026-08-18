/**
 * Discard drafts.wp-page-58920 (safaga) — owner-approved 2026-07-30.
 *
 * The draft is an import-era copy whose body was never updated: it holds the
 * pre-rewrite WP marketing copy (20 EN / 19 ES / 18 JA blocks) while the
 * published doc holds the operator-voice rewrite (61 / 63 / 76 blocks). A later
 * hero-swap script patched the draft's heroImage on 2026-07-21, which is the
 * only reason its _updatedAt looks newer than published. Publishing it from the
 * Studio would silently destroy the rewrite.
 *
 * Writes a full snapshot to backups/ BEFORE deleting, then verifies the
 * published doc is untouched.
 *
 * Dry-run by default; pass --commit to delete.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'fs';
import { join } from 'path';

loadEnv();

const COMMIT = process.argv.includes('--commit');
const PUB_ID = 'wp-page-58920';
const DRAFT_ID = `drafts.${PUB_ID}`;
const BACKUP = join(process.cwd(), 'backups', 'safaga-stale-draft-discard-rollback-2026-07-30.json');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const blockCount = (doc: any) =>
  (doc?.overview ?? []).map((e: any) => `${e._key}:${(e.value ?? []).length}`).join(' ');

async function main() {
  console.log(`discard-safaga-stale-draft — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`);

  const draft: any = await client.getDocument(DRAFT_ID);
  const pubBefore: any = await client.getDocument(PUB_ID);
  if (!draft) { console.log('draft already gone — nothing to do.'); return; }
  if (!pubBefore) throw new Error(`published ${PUB_ID} missing — aborting, do not delete the draft`);

  console.log(`  draft     ${DRAFT_ID}  updated ${draft._updatedAt}  overview blocks: ${blockCount(draft)}`);
  console.log(`  published ${PUB_ID}          updated ${pubBefore._updatedAt}  overview blocks: ${blockCount(pubBefore)}`);

  // Guard: never discard a draft that carries MORE body than published.
  const draftTotal = (draft.overview ?? []).reduce((n: number, e: any) => n + (e.value?.length ?? 0), 0);
  const pubTotal = (pubBefore.overview ?? []).reduce((n: number, e: any) => n + (e.value?.length ?? 0), 0);
  if (draftTotal > pubTotal) {
    throw new Error(`draft body (${draftTotal} blocks) is LARGER than published (${pubTotal}) — re-review before discarding`);
  }
  console.log(`\n  guard ok: draft ${draftTotal} blocks < published ${pubTotal} blocks`);

  if (!COMMIT) {
    console.log(`\n  would write snapshot → ${BACKUP}`);
    console.log(`  would delete         → ${DRAFT_ID}`);
    console.log('\nRe-run with --commit to delete.');
    return;
  }

  writeFileSync(BACKUP, JSON.stringify(draft, null, 2));
  console.log(`\n  ✓ snapshot written → ${BACKUP}`);

  await client.delete(DRAFT_ID);
  console.log(`  ✓ deleted ${DRAFT_ID}`);

  const gone = await client.getDocument(DRAFT_ID);
  const pubAfter: any = await client.getDocument(PUB_ID);
  console.log(`\n  draft now: ${gone ? 'STILL PRESENT (!)' : 'gone'}`);
  console.log(`  published overview blocks: ${blockCount(pubAfter)}`);
  console.log(`  published hero asset: ${pubAfter?.heroImage?.asset?._ref}`);
  console.log(`  published _rev unchanged: ${pubAfter._rev === pubBefore._rev}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
