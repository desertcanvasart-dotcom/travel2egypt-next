/**
 * Discard the rollback drafts left behind by retiring 9 duplicate tours
 * (8 dedup stragglers + grand-islamic-cairo). Deletes each `drafts.<id>` so the
 * doc is fully gone and can no longer be re-published from Studio by mistake.
 *
 * The 301 redirects stay in place, so the old URLs keep resolving to keepers.
 * Recovery after this is only via Sanity document history (no one-click revert).
 *
 * Safety: refuses to delete a draft whose published version still exists.
 * DRY RUN by default; pass --apply to delete.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();
const APPLY = process.argv.includes('--apply');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, // production
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const BASE_IDS = [
  'wp-page-135806', 'wp-page-87558', 'wp-page-87460', 'wp-page-145919',
  'wp-page-87600', 'wp-page-88564', 'wp-page-88176', 'wp-page-238546',
  'wp-page-89348',
];

async function main() {
  console.log(`${APPLY ? '*** APPLY ***' : '--- DRY RUN (pass --apply) ---'}  dataset=${client.config().dataset}\n`);
  let discarded = 0, skipped = 0;
  for (const baseId of BASE_IDS) {
    const draftId = `drafts.${baseId}`;
    const [draft, published] = await Promise.all([client.getDocument(draftId), client.getDocument(baseId)]);
    if (published) { console.log(`  SKIP  ${draftId} — published version still exists`); skipped++; continue; }
    if (!draft) { console.log(`  none  ${draftId} — already gone`); continue; }
    if (!APPLY) { console.log(`  would discard  ${draftId}`); discarded++; continue; }
    await client.delete(draftId);
    console.log(`  discarded  ${draftId}`);
    discarded++;
  }
  console.log(`\n${APPLY ? 'Discarded' : 'Would discard'}=${discarded} skipped=${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
