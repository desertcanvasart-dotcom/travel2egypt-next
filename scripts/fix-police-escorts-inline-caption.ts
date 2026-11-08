/**
 * Backfill the one caption-less inline image in the corpus (audit 2026-08-03).
 *
 * Census result: across 1,241 published heroes (all alt+caption complete ×3
 * locales) and 508 published docs with inline body images, exactly ONE image
 * lacks a caption: the oasis-lodge terrace photo in the EN tourist-police
 * escorts article. Its EN alt exists (plain string, correct); ES/JA sibling
 * docs carry no images, so this is an EN-only, caption-only fix.
 *
 * Image (viewed 2026-08-03): mud-brick lodge terrace with rattan chairs
 * looking over an oasis village of mud-brick buildings, scattered young
 * palms, and a pale limestone escarpment behind. No place name is claimed —
 * the source file carries none and the article names no lodge.
 *
 * Caption matches the alt's plain-string shape (readLocalized in Body.tsx
 * accepts both) and the article's theme: remote oasis lodges sit at the end
 * of the long desert roads where permits and convoys apply.
 *
 * Dry-run by default; pass --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const COMMIT = process.argv.includes('--commit');
const DOC_ID = 'wp-post-236678-en'; // article "Tourist-Police Escorts and Convoys in Egypt", published
const BLOCK_KEY = '53dda9272c04';
const EXPECTED_ASSET = 'image-0358b05c94351bd3d7a6060a84cfb302c16b4db2-1000x669-jpg';

const CAPTION =
  'Where the long desert roads end — a mud-brick lodge terrace above an oasis village.';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

async function main() {
  console.log(
    `fix-police-escorts-inline-caption — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`,
  );

  const doc = (await client.getDocument(DOC_ID)) as
    | { body?: { _key: string; _type: string; asset?: { _ref: string }; alt?: unknown; caption?: unknown }[] }
    | undefined;
  if (!doc) throw new Error(`${DOC_ID} not found`);

  const block = (doc.body ?? []).find((b) => b._key === BLOCK_KEY);
  if (!block) throw new Error(`block ${BLOCK_KEY} not found`);
  if (block.asset?._ref !== EXPECTED_ASSET)
    throw new Error(`asset changed (now ${block.asset?._ref}) — re-audit before writing`);
  if (block.caption != null && block.caption !== '')
    throw new Error(`caption already present (${JSON.stringify(block.caption)}) — nothing to do`);

  console.log(`current alt:     ${JSON.stringify(block.alt)}`);
  console.log(`caption to set:  ${JSON.stringify(CAPTION)}`);

  if (!COMMIT) {
    console.log('\nDry run only. Re-run with --commit to write.');
    return;
  }

  await client
    .patch(DOC_ID)
    .set({ [`body[_key=="${BLOCK_KEY}"].caption`]: CAPTION })
    .commit();
  console.log('\nCOMMITTED. Rollback: unset the same path (caption was null before).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
