/**
 * Swap the homePage hero image to the Karnak Ramses II + Meritamun statue.
 *
 * Uploads the source JPG to Sanity, then patches homePage.heroImage.asset
 * to the new ref and updates heroImage.alt + heroCaption across en/es/ja
 * to match the new image (the previous "Nile village, evening" copy
 * doesn't describe a Karnak statue).
 *
 * Dry-run by default; pass --commit to write. Idempotent — re-running
 * re-uploads (Sanity will dedupe by file hash) and re-patches with the
 * latest values. Same write-token convention as the deity seed.
 *
 *   pnpm tsx scripts/swap-home-hero-karnak.ts
 *   pnpm tsx scripts/swap-home-hero-karnak.ts --commit
 */

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { createClient, type SanityClient } from '@sanity/client';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2';

const SOURCE =
  '/Users/islamhussein/Desktop/Projects/T2E/img-depo/raw/luxor/karnak-temple/statue-ramses-ii-his-daughter-merit-amon-temple-amun-ra-karnak-luxor-egypt.jpg';
const HOME_DOC_ID = 'homePage';

const commit = process.argv.includes('--commit');

function die(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function getClient(): SanityClient {
  const isProd = DATASET === 'production';
  const token = isProd
    ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
      process.env.SANITY_API_WRITE_TOKEN
    : process.env.SANITY_STAGING_API_WRITE_TOKEN ||
      process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die(`No write token in env for dataset "${DATASET}"`);
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    token,
    useCdn: false,
  });
}

// ── Copy to apply ────────────────────────────────────────────────────────
// The image: a colossal statue of Ramses II at Karnak with his daughter
// Meritamun beside him, in the precinct of Amun-Ra. Alt is descriptive
// (what's in the frame); caption is atmospheric (the operator's voice,
// matching the "A Nile village, evening" register the previous image used).
const ALT = {
  en: 'A colossal stone statue of Ramses II with his daughter Meritamun beside him, in the Temple of Amun-Ra at Karnak',
  es: 'Una colosal estatua de piedra de Ramsés II con su hija Meritamón a su lado, en el templo de Amón-Ra en Karnak',
  ja: 'カルナックのアムン・ラー神殿に立つ、娘メリトアメンを傍らに従えたラムセス2世の巨像',
};

const CAPTION = {
  en: 'Karnak, Ramses II and his daughter',
  es: 'Karnak, Ramsés II y su hija',
  ja: 'カルナック、ラムセス2世とその娘',
};

const i18n = (m: Record<string, string>) =>
  Object.entries(m).map(([_key, value]) => ({ _key, value }));

async function run() {
  const mode = commit ? 'COMMIT' : 'DRY-RUN';
  console.log(`\n— Home hero swap (${mode}) —`);
  console.log(`  dataset:  ${DATASET}`);
  console.log(`  source:   ${SOURCE}`);
  console.log(`  doc:      ${HOME_DOC_ID}`);
  console.log(`  caption:  ${CAPTION.en}\n`);

  if (!fs.existsSync(SOURCE)) die(`source image not found: ${SOURCE}`);
  const stat = fs.statSync(SOURCE);
  console.log(`  filesize: ${(stat.size / 1024 / 1024).toFixed(2)} MB\n`);

  if (!commit) {
    console.log(`(dry-run — re-run with --commit to upload + patch)`);
    return;
  }

  const client = getClient();

  // Sanity dedupes assets by hash, so re-running just returns the same
  // asset ref rather than uploading a new copy.
  console.log('Uploading image to Sanity…');
  const stream = fs.createReadStream(SOURCE);
  const asset = await client.assets.upload('image', stream, {
    filename: path.basename(SOURCE),
  });
  console.log(`  ✓ asset _id: ${asset._id}`);

  // Patch the document. heroImage is a localizedImage object; we replace
  // the asset reference + the localized alt array, and overwrite
  // heroCaption (also a localized array).
  console.log('\nPatching homePage…');
  await client
    .patch(HOME_DOC_ID)
    .set({
      'heroImage.asset': { _type: 'reference', _ref: asset._id },
      'heroImage.alt': i18n(ALT),
      heroCaption: i18n(CAPTION),
    })
    // Clear any stale hotspot — the previous image's crop coordinates won't
    // apply to the new frame. Letting Sanity default to centered.
    .unset(['heroImage.hotspot', 'heroImage.crop'])
    .commit();

  console.log(`  ✓ ${HOME_DOC_ID}.heroImage.asset → ${asset._id}`);
  console.log(`  ✓ ${HOME_DOC_ID}.heroImage.alt → updated (en/es/ja)`);
  console.log(`  ✓ ${HOME_DOC_ID}.heroCaption → updated (en/es/ja)`);
  console.log(`\nDone.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
