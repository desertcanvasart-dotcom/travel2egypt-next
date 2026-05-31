/**
 * GROUP 5 — The Cascades slug rename (EN + ES).
 *
 * Doc wp-page-63628 (published name already "The Cascades…"; draft name is stale Westin).
 * EN+ES slug still legacy "the-westin-soma-bay-golf-resort-spa".
 * JA already renamed (slug + redirect both exist) — untouched.
 *
 * New slug: the-cascades-soma-bay  (EN + ES)
 * Keyed-path .set on slug[_key].value.current (no array re-key). Published + draft.
 * Redirect rows added separately to migration/redirect-map.csv.
 * Dry-run by default; --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const ID = 'wp-page-63628';
const OLD = 'the-westin-soma-bay-golf-resort-spa';
const NEW = 'the-cascades-soma-bay';
const LOCALES = ['en', 'es'];

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

  for (const target of [ID, `drafts.${ID}`]) {
    const doc = await client.fetch(`*[_id==$id][0]{_id, "slug": slug[]{_key, "c": value.current}}`, { id: target });
    if (!doc) { console.log(`\n• ${target}: (absent)`); continue; }
    console.log(`\n• ${target}`);
    const set: Record<string, string> = {};
    for (const loc of LOCALES) {
      const cur = doc.slug?.find((s: any) => s._key === loc)?.c;
      console.log(`   slug.${loc} = ${JSON.stringify(cur)}`);
      if (cur === OLD) set[`slug[_key=="${loc}"].value.current`] = NEW;
      else if (cur === NEW) console.log(`     already renamed`);
      else console.log(`     UNEXPECTED — skip`);
    }
    if (commit && Object.keys(set).length) {
      await client.patch(target).set(set).commit({ visibility: 'async' });
      console.log(`   → written: ${Object.keys(set).join(', ')} = "${NEW}"`);
    } else if (Object.keys(set).length) {
      console.log(`   would set ${Object.keys(set).join(', ')} = "${NEW}"`);
    }
  }
  if (!commit) console.log('\n  DRY RUN. Re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
