/**
 * One-off: replace the homepage hero image (homePage.heroImage) with a new
 * local file, and update the localized alt + caption to match the new frame.
 * Records the outgoing asset id so the swap is reversible.
 *
 *   npx tsx scripts/set-home-hero.ts
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const FILE = '/Users/islamhussein/Desktop/dahabiya-down-the-river-nile.jpg';

const ALT = {
  en: 'A traditional twin-masted dahabiya houseboat on the calm Nile at dusk, a full moon rising over desert hills and palm-lined banks mirrored in the water',
  es: 'Una dahabiya tradicional de dos mástiles en el Nilo en calma al anochecer, con la luna llena alzándose sobre colinas desérticas y riberas de palmeras reflejadas en el agua',
  ja: '夕暮れの穏やかなナイル川に浮かぶ、二本マストの伝統的なダハビーヤ船。砂漠の丘の上に満月が昇り、ヤシの並ぶ岸辺が水面に映る。',
};
const CAPTION = {
  en: 'A dahabiya on the Nile',
  es: 'Una dahabiya en el Nilo',
  ja: 'ナイル川のダハビーヤ',
};

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token =
    process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !dataset || !token) throw new Error('missing Sanity env');

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-12-01',
    useCdn: false,
    token,
    perspective: 'raw',
  });

  const before = await client.fetch(
    `*[_id == "homePage"][0]{ "asset": heroImage.asset._ref }`,
  );
  console.log('outgoing hero asset (rollback):', before?.asset);

  const buf = readFileSync(FILE);
  const asset = await client.assets.upload('image', buf, { filename: basename(FILE) });
  console.log('uploaded new asset:', asset._id, `${asset.metadata?.dimensions?.width}x${asset.metadata?.dimensions?.height}`);

  const res = await client
    .patch('homePage')
    .set({
      'heroImage.asset._ref': asset._id,
      'heroImage.hotspot': { _type: 'sanity.imageHotspot', x: 0.48, y: 0.62, height: 0.5, width: 0.5 },
      'heroImage.alt[_key=="en"].value': ALT.en,
      'heroImage.alt[_key=="es"].value': ALT.es,
      'heroImage.alt[_key=="ja"].value': ALT.ja,
      'heroCaption[_key=="en"].value': CAPTION.en,
      'heroCaption[_key=="es"].value': CAPTION.es,
      'heroCaption[_key=="ja"].value': CAPTION.ja,
    })
    .unset(['heroImage.crop'])
    .commit();

  console.log('patched homePage rev:', res._rev);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
