/**
 * Swap the homePage hero image to the seated Ramses II at Luxor Temple.
 *
 * Sets a Sanity hotspot at (x=0.42, y=0.42) with a 0.55-wide safe area
 * so the statue's face and torso stay framed when the hero figure
 * crops to its on-page aspect (the source is 1612×2448 portrait;
 * the figure renders ~1:1.25, so some top/bottom crop happens).
 *
 * Dry-run by default; --commit to write. Idempotent (Sanity dedupes
 * assets by hash). Mirrors scripts/swap-home-hero-karnak.ts.
 *
 *   pnpm tsx scripts/swap-home-hero-luxor.ts
 *   pnpm tsx scripts/swap-home-hero-luxor.ts --commit
 */

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { createClient, type SanityClient } from '@sanity/client';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2';

const SOURCE = '/Users/islamhussein/Desktop/ramsess-the-second-in-luxor-temple.jpg';
const HOME_DOC_ID = 'homePage';

// Hotspot (x, y, height, width) — fractions of the source. The statue
// occupies the left-center; centering the hotspot slightly left and
// slightly above the geometric centre keeps the face and torso
// visible at every crop the renderer might apply.
const HOTSPOT = { x: 0.42, y: 0.42, height: 0.6, width: 0.6 };

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

const ALT = {
  en: 'A colossal seated statue of Ramses II at the entrance to Luxor Temple, hieroglyph-carved columns rising behind',
  es: 'Una colosal estatua sedente de Ramsés II en la entrada del templo de Luxor, con columnas talladas en jeroglíficos detrás',
  ja: 'ルクソール神殿の入口に座すラムセス2世の巨像、ヒエログリフが刻まれた円柱を背景に',
};

const CAPTION = {
  en: 'Luxor Temple, Ramses II',
  es: 'Templo de Luxor, Ramsés II',
  ja: 'ルクソール神殿、ラムセス2世',
};

const i18n = (m: Record<string, string>) =>
  Object.entries(m).map(([_key, value]) => ({ _key, value }));

async function run() {
  const mode = commit ? 'COMMIT' : 'DRY-RUN';
  console.log(`\n— Home hero swap (${mode}) —`);
  console.log(`  dataset:  ${DATASET}`);
  console.log(`  source:   ${SOURCE}`);
  console.log(`  hotspot:  x=${HOTSPOT.x}, y=${HOTSPOT.y}, w=${HOTSPOT.width}, h=${HOTSPOT.height}`);
  console.log(`  caption:  ${CAPTION.en}\n`);

  if (!fs.existsSync(SOURCE)) die(`source image not found: ${SOURCE}`);
  const stat = fs.statSync(SOURCE);
  console.log(`  filesize: ${(stat.size / 1024 / 1024).toFixed(2)} MB\n`);

  if (!commit) {
    console.log(`(dry-run — re-run with --commit to upload + patch)`);
    return;
  }

  const client = getClient();

  console.log('Uploading image to Sanity…');
  const stream = fs.createReadStream(SOURCE);
  const asset = await client.assets.upload('image', stream, {
    filename: path.basename(SOURCE),
  });
  console.log(`  ✓ asset _id: ${asset._id}`);

  console.log('\nPatching homePage…');
  await client
    .patch(HOME_DOC_ID)
    .set({
      'heroImage.asset': { _type: 'reference', _ref: asset._id },
      'heroImage.hotspot': { _type: 'sanity.imageHotspot', ...HOTSPOT },
      'heroImage.alt': i18n(ALT),
      heroCaption: i18n(CAPTION),
    })
    // Clear any stale crop bounds; we want the full frame available so
    // the hotspot-based focal centering does the work.
    .unset(['heroImage.crop'])
    .commit();

  console.log(`  ✓ ${HOME_DOC_ID}.heroImage.asset → ${asset._id}`);
  console.log(`  ✓ ${HOME_DOC_ID}.heroImage.hotspot → set`);
  console.log(`  ✓ ${HOME_DOC_ID}.heroImage.alt → updated (en/es/ja)`);
  console.log(`  ✓ ${HOME_DOC_ID}.heroCaption → updated (en/es/ja)`);
  console.log(`\nDone.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
