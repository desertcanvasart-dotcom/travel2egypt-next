/**
 * RIPPLE FIX — AmaLilia sister-ship cross-reference.
 *
 * The AmaDahlia was corrected 72→68 guests (fix-cruise-body.ts edit #3).
 * The AmaLilia article cross-references "AmaDahlia (72 guests/pasajeros/定員72名)"
 * in all three locales — a stale number the original edit spec missed
 * ("Data completeness only — no change to article text").
 *
 * The "(72 ...)" text lives in a plain (non-bold) span; each doc's own count
 * is 82, so "72 guests"/"72 pasajeros"/"定員72名" is unique to the reference.
 * Same safe span-level .text mutation as fix-cruise-body.ts. Dry-run by default.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const ID = 'nileCruise.amawaterways-amalilia-nile-cruise';
const REPS: Record<string, { find: string; replace: string }[]> = {
  en: [{ find: '72 guests', replace: '68 guests' }],
  es: [{ find: '72 pasajeros', replace: '68 pasajeros' }],
  ja: [{ find: '定員72名', replace: '定員68名' }],
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

  for (const target of [ID, `drafts.${ID}`]) {
    const doc = await client.fetch(`*[_id == $id][0]{_id, body}`, { id: target });
    if (!doc) { if (!target.startsWith('drafts.')) console.log(`(published not found?!)`); continue; }
    console.log(`\n• ${target}`);
    let changed = false;
    for (const [loc, reps] of Object.entries(REPS)) {
      const entry = (doc.body || []).find((b: any) => b._key === loc);
      if (!entry || !Array.isArray(entry.value)) { console.log(`    [${loc}] ✗ no body`); continue; }
      for (const r of reps) {
        let hits = 0;
        for (const block of entry.value) {
          if (block._type !== 'block' || !Array.isArray(block.children)) continue;
          for (const span of block.children) {
            if (typeof span.text === 'string' && span.text.includes(r.find)) {
              span.text = span.text.split(r.find).join(r.replace);
              hits++; changed = true;
            }
          }
        }
        console.log(`    [${loc}] ${hits > 0 ? '✓' : '✗ NOT FOUND'} (${hits})  "${r.find}" → "${r.replace}"`);
      }
    }
    if (commit && changed) {
      await client.patch(target).set({ body: doc.body }).commit({ visibility: 'async' });
      console.log(`    → written`);
    }
  }
  if (!commit) console.log('\n  DRY RUN. Re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
