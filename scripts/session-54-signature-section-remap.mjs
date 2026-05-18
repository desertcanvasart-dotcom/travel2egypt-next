import 'dotenv/config';
import { createClient } from '@sanity/client';

/**
 * Session 54 — Phase 3a follow-up: signature -> others section remap.
 *
 * The kind->section mapping for `signature` changed from `introducing` to
 * `others` (s54 locked decision, phase-2-plan.md §2.4). This re-aligns the
 * dataset: every kind=signature guideArticle gets section=others, overriding
 * whatever it currently holds (operator-set or s53-backfilled).
 *
 * Idempotent: skips docs already at section=others.
 * Run from the repo root:  node scripts/session-54-signature-section-remap.mjs
 */

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
  const docs = await client.fetch(
    '*[_type=="guideArticle" && kind=="signature" && !(_id in path("drafts.**"))]{_id, section}'
  );
  console.log(`kind=signature published guideArticle docs: ${docs.length}`);

  let patched = 0, skipped = 0;
  const failures = [];
  let i = 0;

  for (const doc of docs) {
    i++;
    if (doc.section === 'others') {
      skipped++;
      if (i % 10 === 0) console.log(`  ...${i}/${docs.length}`);
      continue;
    }
    try {
      await client.patch(doc._id).set({ section: 'others' }).commit();
      patched++;
    } catch (e) {
      failures.push({ id: doc._id, reason: String(e).slice(0, 120) });
    }
    if (i % 10 === 0) console.log(`  ...${i}/${docs.length}`);
  }

  console.log('');
  console.log('=== signature -> others remap complete ===');
  console.log('section: patched', patched, '| skipped (already others)', skipped);
  console.log('failures:', failures.length);
  for (const f of failures) console.log('  FAIL', f.id, '-', f.reason);
}

main().catch((e) => { console.error(e); process.exit(1); });
