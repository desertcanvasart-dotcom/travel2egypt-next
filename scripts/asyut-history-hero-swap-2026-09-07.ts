/**
 * Watermark cleanup (delivery prep, 2026-09-07):
 *  - wp-page-59260 "History Of Asyut": hero was a 1200x900 Sinai photo
 *    (Jebel Salla, Wadi Feiran) carrying a gotellitonthemountain.net
 *    watermark — third-party licensing exposure AND wrong subject.
 *    -> swapped to the Asyut city doc's own 8090x2939 Nile-shore panorama
 *    (asset already in the dataset, no watermark, viewed at full res).
 *  - wp-page-58764 city "Asyut": its hero alt/caption x3 described "a mosque
 *    with a tall minaret and gilded domes at dusk" — nothing of the sort is
 *    in the image (palms, fields, limestone escarpment, the Nile). Corrected
 *    to the same accurate text.
 * The orphaned second watermarked asset (El-Ahmar-Sinai…, formerly the Port
 * Said weather hero, re-imaged 2026-07-12) has 0 references and is left for
 * the owner to delete from the asset library.
 * Rollback written first to backups/. Guarded: refuses if a draft exists or
 * the current asset is not the one expected.
 * Usage: npx tsx scripts/asyut-history-hero-swap-2026-09-07.ts [--apply]
 */
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const APPLY = process.argv.includes('--apply');

const loc = (en: string, es: string, ja: string) => [
  { _key: 'en', _type: 'object', value: en },
  { _key: 'es', _type: 'object', value: es },
  { _key: 'ja', _type: 'object', value: ja },
];

const HISTORY_ID = 'wp-page-59260';
const CITY_ID = 'wp-page-58764';
const WATERMARKED_ASSET = 'image-f9ba0f054d84e204a8553d1e6fea4ecd8ad6744d-1200x900-jpg';
const NILE_ASSET = 'image-bd033995ae52321dbe8e88c04e63e6ef20c17a45-8090x2939-jpg';

const ALT = loc(
  'Date palms and green fields on the Nile bank below the pale limestone escarpment near Asyut',
  'Palmeras datileras y campos verdes en la orilla del Nilo bajo el pálido escarpe calizo cerca de Asyut',
  'アスユート近郊、淡い石灰岩の断崖の下、ナイル川岸に広がるナツメヤシと緑の畑',
);
const CAPTION = loc(
  'The Nile at Asyut: a strip of palms and cultivation pressed between the river and the desert cliffs.',
  'El Nilo en Asyut: una franja de palmeras y cultivos encajada entre el río y los acantilados del desierto.',
  'アスユートのナイル川。川と砂漠の断崖の間に、ヤシと耕地の細い帯が挟まれている。',
);

async function main() {
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'production') {
    throw new Error(`Refusing: dataset is ${process.env.NEXT_PUBLIC_SANITY_DATASET}, expected production`);
  }
  const docs = await client.fetch<
    { _id: string; heroImage: any }[]
  >(`*[_id in [$h, $c, "drafts." + $h, "drafts." + $c]]{_id, heroImage}`, { h: HISTORY_ID, c: CITY_ID });

  const drafts = docs.filter((d) => d._id.startsWith('drafts.'));
  if (drafts.length) throw new Error(`Refusing: drafts exist for ${drafts.map((d) => d._id).join(', ')}`);
  const history = docs.find((d) => d._id === HISTORY_ID);
  const city = docs.find((d) => d._id === CITY_ID);
  if (!history || !city) throw new Error('Refusing: one of the published docs is missing');
  if (history.heroImage?.asset?._ref !== WATERMARKED_ASSET) {
    throw new Error(`Refusing: ${HISTORY_ID} hero asset is ${history.heroImage?.asset?._ref}, not the watermarked one`);
  }
  if (city.heroImage?.asset?._ref !== NILE_ASSET) {
    throw new Error(`Refusing: ${CITY_ID} hero asset is ${city.heroImage?.asset?._ref}, not the Nile panorama`);
  }

  const rollback = {
    at: new Date().toISOString(),
    docs: [
      { _id: HISTORY_ID, heroImage: history.heroImage },
      { _id: CITY_ID, heroImage: city.heroImage },
    ],
  };
  const rbPath = `backups/asyut-hero-swap-rollback-2026-09-07.json`;

  console.log(`[${APPLY ? 'APPLY' : 'DRY-RUN'}]`);
  console.log(`  ${HISTORY_ID}: asset ${WATERMARKED_ASSET} -> ${NILE_ASSET}; alt+caption x3 replaced`);
  console.log(`  ${CITY_ID}: alt+caption x3 corrected (asset unchanged)`);
  if (!APPLY) return;

  fs.mkdirSync('backups', { recursive: true });
  fs.writeFileSync(rbPath, JSON.stringify(rollback, null, 2));
  console.log(`  rollback -> ${rbPath}`);

  const tx = client.transaction();
  tx.patch(HISTORY_ID, (p) =>
    p
      .set({
        'heroImage.asset': { _type: 'reference', _ref: NILE_ASSET },
        'heroImage.alt': ALT,
        'heroImage.caption': CAPTION,
      })
      .unset(['heroImage.hotspot', 'heroImage.crop']),
  );
  tx.patch(CITY_ID, (p) =>
    p.set({ 'heroImage.alt': ALT, 'heroImage.caption': CAPTION }),
  );
  const res = await tx.commit();
  console.log(`  committed tx ${res.transactionId}`);

  const after = await client.fetch(
    `*[_id in [$h, $c]]{_id, "asset": heroImage.asset._ref, "alt": heroImage.alt[].value, "cap": heroImage.caption[].value}`,
    { h: HISTORY_ID, c: CITY_ID },
  );
  console.log(JSON.stringify(after, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
