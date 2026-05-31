/**
 * Hotel body footer date line: drop "Created: …" and keep only "Updated: …".
 *
 * Imported hotel bodies ended with an EN footer block reading
 *   "Created: May 2026 | Updated: 18 May 2026"
 * while ES/JA already show only a "last updated" line. Per request, the
 * created date is removed and only the updated date is kept, so the EN
 * footer becomes:
 *   "Updated: 18 May 2026"
 *
 * Span-level .text mutation (no _key regen); raw @sanity/client stores
 * _key/_type verbatim. Patches published + draft. Dry-run by default; --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

// "Created: <anything> | Updated: <date>"  ->  "Updated: <date>"
const CREATED_RE = /^\s*Created:[^|]*\|\s*(Updated:.*)$/;

async function main() {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }

  // Raw perspective: returns both published (hotel.* / wp-page-*) and drafts.* docs.
  const ids: string[] = await client.fetch(`*[_type=="hotel"]._id`);
  const targets = Array.from(new Set(ids.map((id) => id.replace(/^drafts\./, '')))).sort();
  console.log(`Found ${targets.length} hotel base IDs.\n`);

  let touched = 0;
  for (const id of targets) {
    for (const target of [id, `drafts.${id}`]) {
      const doc = await client.fetch(`*[_id==$id][0]{_id, body}`, { id: target });
      if (!doc || !Array.isArray(doc.body)) continue;

      let changed = false;
      for (const entry of doc.body) {
        if (!entry || !Array.isArray(entry.value)) continue;
        for (const block of entry.value) {
          if (block._type !== 'block' || !Array.isArray(block.children)) continue;
          for (const span of block.children) {
            if (typeof span.text === 'string') {
              const m = span.text.match(CREATED_RE);
              if (m) {
                console.log(`   ${target} body.${entry._key}: "${span.text}" → "${m[1]}"`);
                span.text = m[1];
                changed = true;
              }
            }
          }
        }
      }

      if (changed) {
        touched++;
        if (commit) {
          await client.patch(target).set({ body: doc.body }).commit({ visibility: 'async' });
          console.log(`     → written`);
        }
      }
    }
  }

  console.log(`\n${touched} document(s) ${commit ? 'updated' : 'would be updated'}.`);
  if (!commit) console.log('DRY RUN. Re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
