/**
 * GROUP 1 — Hotel star-rating corrections (structured leaf field).
 *
 * Verified specs (All 3 langs/Hotels/Hotels Md/*.md, "What is correct (verified)"):
 *   DoubleTree Sharks Bay   5 → 4   (hilton.com)
 *   JAZ Fayrouz (ex-Hilton) 5 → 4   (jazhotels.com)
 *   Steigenberger Cecil     5 → 4   (hrewards.com, heritage 4-star)
 *   Tolip Aswan (ex-Helnan) 4 → 5   (tolipgroup.com)
 *
 * Pyramids Park (4 vs 5, sources differ) intentionally EXCLUDED — needs confirmation.
 *
 * starRating is a plain number field → safe .set(). Patches published + draft.
 * Dry-run by default; re-run with --commit.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const FIXES: { slug: string; from: number; to: number }[] = [
  { slug: 'double-tree-sharks-bay-resort', from: 5, to: 4 },
  { slug: 'sharm-el-sheikh-fayrouz-resort', from: 5, to: 4 },
  { slug: 'steigenberger-cecil-hotel-alexandria', from: 5, to: 4 },
  { slug: 'tolip-aswan-hotel', from: 4, to: 5 },
];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

async function main() {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }

  for (const fix of FIXES) {
    const base = await client.fetch(
      `*[_type=="hotel" && slug[_key=="en"][0].value.current==$s][0]._id`, { s: fix.slug });
    if (!base) { console.log(`\n## ${fix.slug}\n   !! NOT FOUND`); continue; }
    const id = base.replace(/^drafts\./, '');
    console.log(`\n## ${fix.slug}  (${id})`);
    for (const target of [id, `drafts.${id}`]) {
      const doc = await client.fetch(`*[_id==$id][0]{_id, starRating}`, { id: target });
      if (!doc) { console.log(`   ${target}: (absent)`); continue; }
      const ok = doc.starRating === fix.from;
      console.log(`   ${target}: starRating=${doc.starRating} ${ok ? `→ ${fix.to}` : `(expected ${fix.from}; ${doc.starRating === fix.to ? 'already correct' : 'UNEXPECTED — skip'})`}`);
      if (commit && ok) {
        await client.patch(target).set({ starRating: fix.to }).commit({ visibility: 'async' });
        console.log(`     → written`);
      }
    }
  }
  if (!commit) console.log('\n  DRY RUN. Re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
