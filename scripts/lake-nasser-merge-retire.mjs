/**
 * Lake Nasser merge (2026-11-10): retire /blog/lake-nasser-cruises and its
 * ES/JA versions. Run AFTER lake-nasser-merge-links.mjs (which repoints every
 * reference to these documents) and after the 301s are deployed.
 *
 * "Unpublish" = keep the document as a draft (recoverable in Studio) and
 * delete the published version, so it leaves listings, Read Next, related,
 * search and the sitemap. The two translation.metadata documents that only
 * link the retired posts to each other are deleted (they hold strong
 * references that would block the unpublish). Everything is backed up first.
 * Usage (from the repo root): node scripts/lake-nasser-merge-retire.mjs [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const RETIRED = ['wp-post-144896-en', 'wp-post-155635-es', 'wp-post-170183-ja'];
const TMETA = ['tmeta-wp-post-144896', 'translation.metadata.wp-post-144896'];

const docs = await c.fetch(`*[_id in $ids]`, { ids: [...RETIRED, ...TMETA] });
fs.writeFileSync('docs/lake-nasser-merge/retired-backup-2026-11-10.json', JSON.stringify(docs, null, 1));
console.log(`backed up ${docs.length} documents to docs/lake-nasser-merge/retired-backup-2026-11-10.json`);

// Any remaining reference other than the translation metadata blocks the retire.
for (const id of RETIRED) {
  const refs = await c.fetch(`*[references($id) && !(_id in $tmeta)]._id`, { id, tmeta: TMETA });
  if (refs.length) throw new Error(`${id} is still referenced by ${refs.join(', ')} — run lake-nasser-merge-links.mjs first`);
}

let tx = c.transaction();
for (const id of TMETA) if (docs.find((d) => d._id === id)) { console.log(`delete ${id}`); tx = tx.delete(id); }
for (const id of RETIRED) {
  const d = docs.find((x) => x._id === id);
  if (!d) { console.log(`${id}: already unpublished`); continue; }
  const { _rev, _updatedAt, _createdAt, ...rest } = d;
  console.log(`unpublish ${id} (${d.language} /${d.slug?.current}) → drafts.${id}`);
  tx = tx.createOrReplace({ ...rest, _id: `drafts.${id}` }).delete(id);
}
if (APPLY) { const r = await tx.commit(); console.log('committed', r.results.length, 'mutations'); }
else console.log('(dry run — pass --apply)');
