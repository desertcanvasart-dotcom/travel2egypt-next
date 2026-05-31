/**
 * Passport & Visa travel tip — visa fee fact update ($25 → $30).
 *
 * From 1 March 2026 the Egyptian visa-on-arrival / e-Visa single-entry fee rose
 * to $30 (source: visa2egypt.gov.eg; the doc's own JA version already reflects
 * this). The EN and ES bodies still carry the outdated "$25" wording in the
 * opening paragraph. JA is already correct — left untouched.
 *
 * Span-level .text replacement; raw @sanity/client preserves _key/_type.
 * Patches published + draft. Dry-run by default; --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const SLUG = 'passport-and-visa';
const REPS: Record<string, Array<{ find: string; replace: string }>> = {
  en: [{ find: 'exactly twenty-five US dollars', replace: 'exactly thirty US dollars' }],
  es: [{ find: 'exactamente veinticinco dólares estadounidenses', replace: 'exactamente treinta dólares estadounidenses' }],
};

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

  const base = await client.fetch(
    `*[_type=="travelTip" && slug[_key=="en"][0].value.current==$s][0]._id`, { s: SLUG });
  if (!base) throw new Error('passport-and-visa travelTip not found');
  const id = base.replace(/^drafts\./, '');

  for (const target of [id, `drafts.${id}`]) {
    const doc = await client.fetch(`*[_id==$id][0]{_id, body}`, { id: target });
    if (!doc || !Array.isArray(doc.body)) { console.log(`\n## ${target}: (absent)`); continue; }
    console.log(`\n## ${target}`);
    let changed = false;

    for (const [loc, reps] of Object.entries(REPS)) {
      const entry = (doc.body || []).find((b: any) => b._key === loc);
      if (!entry || !Array.isArray(entry.value)) { console.log(`   ${loc}: ✗ no body`); continue; }
      for (const r of reps) {
        let hits = 0;
        for (const block of entry.value) {
          if (block._type !== 'block' || !Array.isArray(block.children)) continue;
          for (const span of block.children) {
            if (typeof span.text === 'string' && span.text.includes(r.find)) {
              hits += span.text.split(r.find).length - 1;
              span.text = span.text.split(r.find).join(r.replace);
              changed = true;
            }
          }
        }
        console.log(`   ${loc}: ${hits > 0 ? '✓' : '✗ NOT FOUND'} (${hits})  "${r.find}" → "${r.replace}"`);
      }
    }

    if (changed && commit) {
      await client.patch(target).set({ body: doc.body }).commit({ visibility: 'async' });
      console.log(`     → written`);
    }
  }
  if (!commit) console.log('\nDRY RUN. Re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
