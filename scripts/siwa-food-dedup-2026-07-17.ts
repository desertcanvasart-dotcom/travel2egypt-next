/**
 * Complete the half-finished Siwa food-page dedup (2026-07-17).
 *
 * State found: the redirect-map ALREADY routes siwa-dining-experiences ->
 * food-in-siwa-oasis in all 3 locales (intent established), but the superseded
 * doc wp-page-60512 was never hidden and still holds 5 inbound internalLink
 * refs; the keeper has 0. Same "verify shipped != verify live" gap as the
 * July-10 guide dedup.
 *
 * KEEPER    = guideArticle.siwa-oasis.food-in-siwa-oasis (authored editorial,
 *             real Siwan-food h2s, kind=food, food-in-<city> pattern)
 * SUPERSEDED= wp-page-60512 "Siwa Dining Experiences" (WP import: <!DOCTYPE
 *             html> junk lead, generic h2s, "Culinary Journey" promo tail)
 *
 * Actions: (1) repoint the 5 inbound internalLink refs to the keeper
 * (leaf _ref rewrite, _key preserved); (2) hide + flag the superseded doc.
 * Redirects already present — no redirect work. Rollback written first.
 * Usage: npx tsx scripts/siwa-food-dedup-2026-07-17.ts [--apply]
 */
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const APPLY = process.argv.includes('--apply');

const SUPERSEDED = 'wp-page-60512';
const KEEPER = 'guideArticle.siwa-oasis.food-in-siwa-oasis';

function rewriteRefs(node: any, from: string, to: string, changed: { n: number }): any {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map((c) => rewriteRefs(c, from, to, changed));
  const out: any = Array.isArray(node) ? [] : { ...node };
  for (const [k, v] of Object.entries(node)) {
    if (k === '_ref' && v === from) { out._ref = to; changed.n++; }
    else out[k] = rewriteRefs(v, from, to, changed);
  }
  return out;
}

async function main() {
  const referrers: any[] = await client.fetch(
    `*[references($id) && !(_id in path('drafts.**'))]{...}`,
    { id: SUPERSEDED }
  );
  const superseded = await client.getDocument(SUPERSEDED);
  const rollback = { referrers, superseded };
  fs.writeFileSync(
    'backups/siwa-food-dedup-rollback-2026-07-17.json',
    JSON.stringify(rollback, null, 2)
  );
  console.log(`rollback written (${referrers.length} referrers + superseded doc)`);

  // 1. repoint refs
  let repointed = 0;
  for (const doc of referrers) {
    const changed = { n: 0 };
    const patched = rewriteRefs(doc, SUPERSEDED, KEEPER, changed);
    console.log(`  ${doc._id}: ${changed.n} ref(s) -> keeper`);
    repointed += changed.n;
    if (APPLY) {
      const { _id, _rev, _createdAt, _updatedAt, _type, ...rest } = patched;
      await client.patch(_id).set(rest).commit();
    }
  }

  // 2. hide + flag superseded
  console.log(`  hide+flag ${SUPERSEDED} (hidden ${superseded?.hidden} -> true)`);
  if (APPLY) {
    await client.patch(SUPERSEDED).set({
      hidden: true,
      'migration.reviewFlag': 'superseded-duplicate',
      'migration.supersededBy': { _type: 'reference', _ref: KEEPER },
    }).commit();
  }

  console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'}: ${repointed} refs repointed across ${referrers.length} docs + 1 doc hidden`);
}
main().catch((e) => { console.error(e); process.exit(1); });
