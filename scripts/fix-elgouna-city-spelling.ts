/**
 * GROUP 3 — City spelling "Al Gouna" → "El Gouna".
 *
 * The spelling lives in ONE shared city document (wp-page-58740), referenced by
 * Casa Cook, La Maison Bleue, Movenpick (+1 more). Fixing the city doc's name
 * corrects the info-box City label on every hotel that points to it.
 *
 *   name.en  "Al Gouna" → "El Gouna"
 *   name.es  "Al Gouna" → "El Gouna"
 *   name.ja  already "エル・グーナ" (El Gouna) — untouched
 *   slug stays "al-gouna" (URL, not displayed spelling — left as-is to avoid redirects)
 *
 * Keyed-path .set() (no array re-key). Patches published + draft.
 * Dry-run by default; --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const CITY_ID = 'wp-page-58740';

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

  for (const target of [CITY_ID, `drafts.${CITY_ID}`]) {
    const doc = await client.fetch(`*[_id==$id][0]{_id, "n": name[]{_key, value}}`, { id: target });
    if (!doc) { console.log(`\n• ${target}: (absent)`); continue; }
    console.log(`\n• ${target}`);
    const set: Record<string, string> = {};
    for (const loc of ['en', 'es']) {
      const cur = doc.n?.find((x: any) => x._key === loc)?.value;
      console.log(`   name.${loc} = ${JSON.stringify(cur)}`);
      if (cur === 'Al Gouna') set[`name[_key=="${loc}"].value`] = 'El Gouna';
      else if (cur === 'El Gouna') console.log(`     already correct`);
      else console.log(`     UNEXPECTED — skip`);
    }
    if (commit && Object.keys(set).length) {
      await client.patch(target).set(set).commit({ visibility: 'async' });
      console.log(`   → written: ${Object.keys(set).join(', ')}`);
    } else if (Object.keys(set).length) {
      console.log(`   would set: ${JSON.stringify(set)}`);
    }
  }

  // Show which hotels benefit
  const hotels = await client.fetch(
    `*[_type=="hotel" && city._ref==$id]{"slug": slug[_key=="en"][0].value.current}`, { id: CITY_ID });
  console.log(`\n  Hotels referencing this city: ${hotels.map((h: any) => h.slug).join(', ')}`);
  if (!commit) console.log('\n  DRY RUN. Re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
