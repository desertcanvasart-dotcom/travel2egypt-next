/**
 * Unpublishes the old duplicate/retired tour docs (REVERSIBLE).
 *
 * "Unpublish" = ensure a draft copy exists (created from the published doc if
 * none yet), then delete the *published* document. The draft is preserved, so
 * the page disappears from the live site but can be re-published from Studio.
 * No hard deletion — the document is never purged.
 *
 * Default is DRY RUN. Pass --apply to perform the writes.
 *
 *   SET A  37 old -> corpus (redirected)
 *   SET B  10 old -> landing/tour (redirected)
 *   SET C   8 old -> "delete entirely" (no redirect; pages 404 after unpublish)
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const APPLY = process.argv.includes('--apply');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_STAGING_API_WRITE_TOKEN,
});

const SET_A_OLD = [
  'abu-simbel-by-plane-from-aswan', 'abu-simbel-car-day-tour-from-aswan', 'alexandria-day-tour',
  'aswan-city-tour-from-marsa-alam-small-group-tour', 'cairo-day-tour-from-alexandria',
  'group-trip-to-cairo-by-bus-from-hurghada', 'shared-snorkeling-day-at-giftun-island',
  'dendera-and-abydos-temples-tour-from-safaga', 'desert-quad-bike-safari-from-hurghada',
  'group-day-tour-of-the-pyramids-and-sphinx', 'karnak-luxor-temples-and-museum-day-tour',
  'luxor-full-day-tour-from-hurghada', 'group-tour-luxor-hurghada', 'abu-simbel-temples-day-tour',
  'private-snorkeling-adventure-in-marsa-alam', 'marsa-alam-to-cairo-small-group-tour-full-day-by-plane',
  'memphis-saqqara-dahshur-tour-from-alexandria', 'mount-sinai-sunrise-trek',
  'private-car-transfer-from-aswan-to-luxor', 'esna-edfu-kom-ombo-day-tour',
  'group-day-tour-to-memphis-saqqara-and-dahshur', 'dendera-and-abydos-temples-from-hurghada',
  'private-tour-transfer-from-luxor-to-hurghada-by-car', 'pyramids-of-giza-sphinx-memphis-and-saqqara-tour',
  'pyramids-of-giza-sphinx-egyptian-museum-khan-el-khalili-tour', 'snorkeling-sea-trip-in-sharm-el-sheikh',
  'temples-of-time-day-tour-to-nubian-temples-from-aswan', 'desert-rides-hurghada-quad-bike-adventure',
  'the-grand-west-bank-tour', 'cairo-group-tour', 'day-tour-to-visit-cairo-from-alexandria',
  'bahariya-oasis-and-white-desert-3-day-tour', 'half-day-tour-of-luxor-karnak-temples',
  'fayoum-oasis-and-beni-suef-pyramids-tour', 'dendera-and-abydos-temple-tour-hurghada',
  'group-day-tour-to-kom-ombo-and-edfu-temples-from-aswan', 'private-tour-valley-of-kings-temples-day-tour',
];
const SET_B_OLD = [
  '11-day-luxor-to-cairo-egypt-nile-cruise-vacation', '12-day-red-sea-desert-friends-escape',
  'group-day-trip-to-cairo-from-safaga', 'group-day-tour-to-cairo-from-al-gouna',
  '5-days-cairo-luxor-romance-edition', '9-days-cairo-st-catherine-sharm-el-sheikh',
  '9-days-red-sea-desert-escape', 'cairo-in-3-days-insider-edition-solo-traveller',
  'desert-oasis-siwa-retreat-solo-traveller', 'nile-in-5-days-luxor-aswan-solo-traveller',
];
const SET_C_OLD = [
  'luxor-to-cairo-egypt-nile-cruise-vacation', 'egypt-nile-cruise-vacation-from-india',
  '18-day-grand-egypt-holiday-package', '8-day-customized-aswan-travel-deal',
  'egypt-escape-4-day-cairo-travel-package-from-australia', '4-day-cairo-travel-package',
  '10-day-romantic-egypt-travel-deals', '3-days-cairo-highlights-for-friends',
];
// SET D: doc-backed "unpublish & redirect". Only this one source is a live
// Sanity doc; the other SET D sources are legacy URLs (redirect-only).
const SET_D_OLD = ['nile-love-journey-luxor-aswan'];

async function resolveId(enSlug: string): Promise<string | null> {
  const d = await client.fetch<{ _id: string } | null>(
    `*[!(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s][0]{_id}`,
    { s: enSlug }
  );
  return d?._id ?? null;
}

async function unpublishOne(pubId: string): Promise<'unpublished' | 'already' | 'error'> {
  const draftId = `drafts.${pubId}`;
  const published = await client.getDocument(pubId);
  if (!published) return 'already'; // no published version
  if (!APPLY) return 'unpublished'; // dry run: would unpublish
  const { _id, _rev, ...rest } = published as any;
  await client
    .transaction()
    .createIfNotExists({ ...rest, _id: draftId })
    .delete(pubId)
    .commit({ visibility: 'async' });
  return 'unpublished';
}

async function main() {
  const groups: Array<[string, string[]]> = [['SET A', SET_A_OLD], ['SET B', SET_B_OLD], ['SET C', SET_C_OLD], ['SET D', SET_D_OLD]];
  let total = 0, done = 0, missing = 0;
  console.log(APPLY ? '*** APPLY MODE — performing unpublish ***' : '--- DRY RUN (pass --apply to execute) ---');
  for (const [label, slugs] of groups) {
    console.log(`\n${label} (${slugs.length})`);
    for (const s of slugs) {
      total++;
      const id = await resolveId(s);
      if (!id) { console.log(`  MISSING  ${s}`); missing++; continue; }
      const r = await unpublishOne(id);
      if (r === 'unpublished') done++;
      console.log(`  ${APPLY ? 'unpublished' : 'would-unpublish'}  ${id}  (${s})`);
    }
  }
  console.log(`\nTotal=${total} ${APPLY ? 'unpublished' : 'would-unpublish'}=${done} missing=${missing}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
