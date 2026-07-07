/**
 * Finish the tour-dedup batch in PRODUCTION: 8 old duplicate docs are still
 * published (the rest of SET A/B/C/D were already retired). This script:
 *
 *   1. Repoints/clears the 7 inbound `relatedTours` references that point at the
 *      3 still-referenced old docs (so the strong refs don't block deletion).
 *      - DROP when the keeper is already in that doc's relatedTours (or self-ref).
 *      - REPOINT old->keeper when the keeper is not yet present.
 *      Edits target array items by _ref predicate, preserving every _key.
 *   2. Unpublishes all 8 old docs (REVERSIBLE: ensures a draft exists, then
 *      deletes only the published doc). EN 301 redirects already live in
 *      migration/redirect-map.csv.
 *
 * Redirect destinations (keepers) were verified to exist & be published.
 * DRY RUN by default. Pass --apply to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();
const APPLY = process.argv.includes('--apply');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, // production
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  // Production dataset → use the production write token.
  token:
    process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
    process.env.SANITY_API_WRITE_TOKEN,
});

type Edit =
  | { doc: string; op: 'drop'; oldRef: string }
  | { doc: string; op: 'repoint'; oldRef: string; newRef: string };

// Verified inbound relatedTours refs (2026-06-22 production audit).
const REF_EDITS: Edit[] = [
  // wp-page-87558 -> tour.dendera-and-abydos-temples-day-tour (keeper already present / self): DROP
  { doc: 'tour.dendera-and-abydos-temples-day-tour', op: 'drop', oldRef: 'wp-page-87558' },
  { doc: 'wp-page-115614', op: 'drop', oldRef: 'wp-page-87558' },
  { doc: 'wp-page-121250', op: 'drop', oldRef: 'wp-page-87558' },
  // wp-page-145919 -> tour.mount-sinai-sunrise-trek-group-day-tour (keeper absent): REPOINT
  { doc: 'wp-page-62455', op: 'repoint', oldRef: 'wp-page-145919', newRef: 'tour.mount-sinai-sunrise-trek-group-day-tour' },
  { doc: 'wp-page-83681', op: 'repoint', oldRef: 'wp-page-145919', newRef: 'tour.mount-sinai-sunrise-trek-group-day-tour' },
  // wp-page-238546 -> wp-page-86851 (the-elegant-cairo-4-days-tour; keeper absent): REPOINT
  { doc: 'wp-page-145910', op: 'repoint', oldRef: 'wp-page-238546', newRef: 'wp-page-86851' },
  { doc: 'wp-page-87834', op: 'repoint', oldRef: 'wp-page-238546', newRef: 'wp-page-86851' },
];

// The 8 still-published old docs to retire (slug shown for readability).
const UNPUBLISH: Array<{ id: string; slug: string }> = [
  { id: 'wp-page-135806', slug: 'aswan-city-tour-from-marsa-alam-small-group-tour' },
  { id: 'wp-page-87558', slug: 'dendera-and-abydos-temples-tour-from-safaga' },
  { id: 'wp-page-87460', slug: 'abu-simbel-temples-day-tour' },
  { id: 'wp-page-145919', slug: 'mount-sinai-sunrise-trek' },
  { id: 'wp-page-87600', slug: 'snorkeling-sea-trip-in-sharm-el-sheikh' },
  { id: 'wp-page-88564', slug: 'desert-rides-hurghada-quad-bike-adventure' },
  { id: 'wp-page-88176', slug: 'private-tour-valley-of-kings-temples-day-tour' },
  { id: 'wp-page-238546', slug: 'cairo-in-3-days-insider-edition-solo-traveller' },
];

async function applyEdit(e: Edit): Promise<string> {
  // Confirm the old ref is actually present before editing.
  const present = await client.fetch<boolean>(
    `count(*[_id==$d].relatedTours[_ref==$r]) > 0`,
    { d: e.doc, r: e.oldRef }
  );
  if (!present) return `skip (ref ${e.oldRef} not present)`;
  if (!APPLY) return e.op === 'drop' ? `would DROP ${e.oldRef}` : `would REPOINT ${e.oldRef} -> ${(e as any).newRef}`;
  if (e.op === 'drop') {
    await client.patch(e.doc).unset([`relatedTours[_ref=="${e.oldRef}"]`]).commit({ visibility: 'sync' });
    return `DROPPED ${e.oldRef}`;
  }
  await client.patch(e.doc).set({ [`relatedTours[_ref=="${e.oldRef}"]._ref`]: e.newRef }).commit({ visibility: 'sync' });
  return `REPOINTED ${e.oldRef} -> ${e.newRef}`;
}

async function unpublishOne(id: string): Promise<string> {
  const inbound = await client.fetch<number>(`count(*[!(_id in path("drafts.**")) && references($id)])`, { id });
  if (inbound > 0) return `BLOCKED: ${inbound} inbound ref(s) remain`;
  const published = await client.getDocument(id);
  if (!published) return 'already unpublished';
  if (!APPLY) return 'would unpublish';
  const { _id, _rev, ...rest } = published as any;
  await client
    .transaction()
    .createIfNotExists({ ...rest, _id: `drafts.${id}` })
    .delete(id)
    .commit({ visibility: 'async' });
  return 'unpublished';
}

async function main() {
  console.log(APPLY ? '*** APPLY MODE ***' : '--- DRY RUN (pass --apply to write) ---');
  console.log(`dataset=${client.config().dataset}\n`);

  console.log('STEP 1 — repoint/clear inbound relatedTours refs');
  for (const e of REF_EDITS) {
    const r = await applyEdit(e);
    console.log(`  ${e.doc.padEnd(40)} ${r}`);
  }

  console.log('\nSTEP 2 — unpublish old docs');
  let done = 0, blocked = 0;
  for (const { id, slug } of UNPUBLISH) {
    const r = await unpublishOne(id);
    if (r.startsWith('BLOCKED')) blocked++;
    if (r === 'unpublished' || r === 'would unpublish') done++;
    console.log(`  ${id.padEnd(18)} ${r.padEnd(34)} (${slug})`);
  }
  console.log(`\n${APPLY ? 'Unpublished' : 'Would unpublish'}=${done} blocked=${blocked}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
