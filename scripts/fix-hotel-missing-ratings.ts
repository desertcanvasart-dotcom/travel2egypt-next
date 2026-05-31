/**
 * GROUP 2 — Add missing info-box rating fields (category / starRating).
 *
 * Category mapping follows the site's existing convention (confirmed with owner):
 *   Luxury  = top international brands
 *   Deluxe  = upscale 5-star resorts/city hotels
 *   Standard = 4-star
 *   Boutique = design/Relais & Chateaux
 *
 * Star ratings & categories from each spec's "What is correct (verified)".
 * Only sets a field that is currently null/absent (never overwrites an existing value).
 * Patches published + draft. Dry-run by default; --commit to write.
 *
 * HELD OUT: Benben (spec gives no star number), Pyramids Park (4-vs-5 unresolved).
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

type Fix = { slug: string; category?: string; starRating?: number };
const FIXES: Fix[] = [
  { slug: 'barcelo-tiran-sharm-resort', category: 'standard', starRating: 4 },
  { slug: 'dusit-thani-lake-view', category: 'luxury', starRating: 5 },
  { slug: 'intercontinental-cairo-semiramis', category: 'deluxe', starRating: 5 },
  { slug: 'la-maison-bleue-el-gouna', category: 'boutique' }, // star held
  { slug: 'naama-bay-hotel-and-resort', category: 'deluxe', starRating: 5 },
  { slug: 'naama-bay-promenade-beach-resort-by-accor', category: 'deluxe', starRating: 5 },
  { slug: 'oberoi-sahl-hasheesh', category: 'luxury', starRating: 5 },
  { slug: 'park-regency-sharm-el-sheikh-resort', category: 'deluxe', starRating: 5 },
  { slug: 'the-waldorf-astoria-cairo', category: 'luxury', starRating: 5 },
  { slug: 'rixos-premium-magawish-suites-and-villas', starRating: 5 }, // category luxury already set
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
      const doc = await client.fetch(`*[_id==$id][0]{_id, category, starRating}`, { id: target });
      if (!doc) { console.log(`   ${target}: (absent)`); continue; }
      const set: Record<string, any> = {};
      if (fix.category !== undefined) {
        if (doc.category == null) set.category = fix.category;
        else console.log(`   ${target}: category already "${doc.category}" — skip`);
      }
      if (fix.starRating !== undefined) {
        if (doc.starRating == null) set.starRating = fix.starRating;
        else console.log(`   ${target}: starRating already ${doc.starRating} — skip`);
      }
      const parts = Object.entries(set).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ');
      console.log(`   ${target}: ${parts ? `set ${parts}` : '(nothing to set)'}`);
      if (commit && Object.keys(set).length) {
        await client.patch(target).set(set).commit({ visibility: 'async' });
        console.log(`     → written`);
      }
    }
  }
  if (!commit) console.log('\n  DRY RUN. Re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
