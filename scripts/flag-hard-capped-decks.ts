/**
 * Follow-up to truncate-article-decks.ts. Marks articles whose deck was
 * hard-capped at 280 chars + ellipsis (so they end mid-sentence) with
 * migration.deckNeedsReview = true. Editorial can then filter for them in
 * Studio and rewrite the deck.
 *
 * Selection: published articles whose deck length is >= 280 (the hard-cap
 * adds "..." → resulting length ~283). The natural-first-sentence truncations
 * top out at 279 chars, so this cleanly identifies the hard-capped set.
 *
 * Existing migration.reviewFlag values are preserved unchanged. The new
 * boolean is orthogonal.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const REQUIRED_DATASET = 'migration-staging';
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.SANITY_STAGING_DATASET ?? REQUIRED_DATASET;

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
  process.exit(1);
}
if (!token) {
  console.error('Missing SANITY_STAGING_API_WRITE_TOKEN');
  process.exit(1);
}
if (dataset !== REQUIRED_DATASET) {
  console.error(
    `Refusing: dataset=${dataset} but this script only writes to ${REQUIRED_DATASET}.`
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-10-01',
  useCdn: false,
  perspective: 'raw',
});

interface ArticleDoc {
  _id: string;
  deckLen: number;
  reviewFlag?: string | null;
}

async function main() {
  console.log(`Dataset: ${dataset}`);

  // Fetch the full set (avoiding GROQ aggregate length-index quirks) and
  // partition client-side.
  const all: Array<{ _id: string; deck?: string; reviewFlag?: string | null }> =
    await client.fetch(
      `*[_type == "article" && !(_id in path("drafts.**"))]{
        _id, deck, "reviewFlag": migration.reviewFlag
      }`
    );

  const hardCapped: ArticleDoc[] = all
    .filter((d) => typeof d.deck === 'string' && d.deck.length >= 280)
    .map((d) => ({ _id: d._id, deckLen: d.deck!.length, reviewFlag: d.reviewFlag ?? null }));

  console.log(`Hard-capped articles (deckLen >= 280): ${hardCapped.length}`);
  const withExistingFlag = hardCapped.filter((d) => d.reviewFlag).length;
  console.log(`  of those with existing migration.reviewFlag (preserved): ${withExistingFlag}`);
  console.log(`  of those with no existing reviewFlag:                    ${hardCapped.length - withExistingFlag}\n`);

  const BATCH = 50;
  let committed = 0;
  for (let i = 0; i < hardCapped.length; i += BATCH) {
    const slice = hardCapped.slice(i, i + BATCH);
    const tx = client.transaction();
    for (const d of slice) {
      tx.patch(d._id, (p) =>
        p.set({ 'migration.deckNeedsReview': true })
      );
    }
    await tx.commit();
    committed += slice.length;
    process.stdout.write(`\r  patched ${committed}/${hardCapped.length}`);
  }
  console.log('\n');

  // Verification
  const verifyTrue = await client.fetch<number>(
    `count(*[_type == "article" && !(_id in path("drafts.**")) && migration.deckNeedsReview == true])`
  );
  const stillFlaggedExisting = await client.fetch<number>(
    `count(*[_type == "article" && !(_id in path("drafts.**")) && migration.deckNeedsReview == true && defined(migration.reviewFlag)])`
  );
  const sampleConflict = await client.fetch<Array<{ _id: string; reviewFlag: string; deckNeedsReview: boolean }>>(
    `*[_type == "article" && !(_id in path("drafts.**")) && migration.deckNeedsReview == true && defined(migration.reviewFlag)][0...5]{
      _id, "reviewFlag": migration.reviewFlag, "deckNeedsReview": migration.deckNeedsReview
    }`
  );

  console.log('=== Verification ===');
  console.log(`migration.deckNeedsReview == true total:                          ${verifyTrue}`);
  console.log(`  …of which also retain an existing migration.reviewFlag value:  ${stillFlaggedExisting}`);
  console.log('\nSample docs with both flags set (existing reviewFlag preserved):');
  for (const s of sampleConflict) {
    console.log(`  ${s._id}  reviewFlag=${s.reviewFlag}  deckNeedsReview=${s.deckNeedsReview}`);
  }
}

main().catch((err) => {
  console.error('\nFAILED:', err);
  process.exit(1);
});
