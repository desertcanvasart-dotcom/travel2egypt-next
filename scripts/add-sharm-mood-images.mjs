#!/usr/bin/env node
/**
 * Upload 3 mood-card images for the Sharm el-Sheikh private day tours landing
 * and wire them into moodChooser.cards[k4|k5|k6].image on both the published
 * and draft versions of tourLanding.sharm-el-sheikh-private-day-tours.
 *
 * Usage:
 *   node scripts/add-sharm-mood-images.mjs            # dry-run (no writes)
 *   node scripts/add-sharm-mood-images.mjs --commit   # upload + patch
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
    })
);

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID, // ufallvd2
  dataset: env.NEXT_PUBLIC_SANITY_DATASET, // production
  apiVersion: '2024-01-01',
  token: env.SANITY_PRODUCTION_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const COMMIT = process.argv.includes('--commit');
const SRC = '/Users/islamhussein/Desktop/sharm';
const PUBLISHED_ID = 'tourLanding.sharm-el-sheikh-private-day-tours';
const DRAFT_ID = 'drafts.tourLanding.sharm-el-sheikh-private-day-tours';

// card _key -> { file, alt, credit }
const CARDS = [
  {
    key: 'k4',
    label: 'Sea Sinai / Reefs & blue water',
    file: 'sharm-el-sheikh-egypt-may-03-beautiful-sea-view-swimming-pool-beach-tropical-luxury.jpg',
    alt: 'Turquoise Red Sea water along the Sharm el-Sheikh coast on a clear day',
  },
  {
    key: 'k5',
    label: 'Mountain Sinai / Sunrise & monastery',
    file: 'mount-sinai-sinai-peninsula-egypt-known-be-place-where-moses-received-ten-commandments.jpg',
    alt: 'Mount Sinai at first light on the Sinai Peninsula, above St. Catherine’s Monastery',
  },
  {
    key: 'k6',
    label: 'Desert Sinai / Wadis & Bedouin life',
    file: 'sinai-desert.jpg',
    alt: 'Open desert and dunes in the Sinai interior, away from the resort coast',
  },
];

const intl = (value) => [{ _key: 'en', _type: 'internationalizedArrayStringValue', value }];

async function main() {
  console.log(`Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}  project=${client.config().projectId} dataset=${client.config().dataset}\n`);

  const patchSet = {};
  for (const c of CARDS) {
    const filePath = path.join(SRC, c.file);
    if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
    console.log(`• ${c.label}\n    file: ${c.file}`);

    if (!COMMIT) {
      console.log('    (dry-run: would upload + set image)\n');
      continue;
    }

    const asset = await client.assets.upload('image', fs.createReadStream(filePath), {
      filename: c.file,
    });
    console.log(`    uploaded asset: ${asset._id}`);

    patchSet[`moodChooser.cards[_key=="${c.key}"].image`] = {
      _type: 'localizedImage',
      asset: { _type: 'reference', _ref: asset._id },
      alt: intl(c.alt),
    };
  }

  if (!COMMIT) {
    console.log('Dry-run complete. Re-run with --commit to upload and patch.');
    return;
  }

  for (const id of [PUBLISHED_ID, DRAFT_ID]) {
    const res = await client.patch(id).set(patchSet).commit();
    console.log(`\nPatched ${id} (rev ${res._rev})`);
  }

  console.log('\nDone. Published version updated; draft kept in sync.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
