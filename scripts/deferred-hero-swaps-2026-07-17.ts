/**
 * Deferred-hero swaps (owner-approved 2026-07-17, interactive session):
 *  - kom-ombo weather (wp-page-78374): 800x450 facade -> 3000x2000 warm-light
 *    crowning-scene relief (owner chose relief over upscale/status-quo)
 *  - safaga weather (wp-page-60438): 1199px parasailing -> 3000px bright
 *    winter-sun beach (INTERIM; port/wind image stays on sourcing list)
 *  - sohag weather (wp-page-60533): wrong-city Kharga oasis -> 3000px
 *    Meritamun colossus at Akhmim (Sohag governorate, clear blue sky)
 * All three images VIEWED before writing. Alt + caption regenerated x3
 * locales per the alt-invariant. Rollback written first.
 * Usage: npx tsx scripts/deferred-hero-swaps-2026-07-17.ts [--apply]
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

const SWAPS = [
  {
    id: 'wp-page-78374',
    city: 'kom-ombo',
    assetRef: 'image-15f3f5f060bd2b3bac2bd51490f260c7edd77228-3000x2000-jpg',
    alt: loc(
      'Sunk-relief crowning scene on a wall of Kom Ombo Temple, the carved figures glowing warm amber',
      'Relieve de la escena de coronación en un muro del templo de Kom Ombo, con las figuras talladas brillando en un ámbar cálido',
      '温かな琥珀色に輝く、コム・オンボ神殿の壁に刻まれた戴冠場面のレリーフ'
    ),
    caption: loc(
      'Warm light on Kom Ombo’s carved walls — the temple the boats save for golden hour.',
      'Luz cálida sobre los muros tallados de Kom Ombo — el templo que los barcos reservan para la hora dorada.',
      'コム・オンボ神殿の彫刻壁を照らす温かな光——クルーズ船がゴールデンアワーに訪れる神殿。'
    ),
  },
  {
    id: 'wp-page-60438',
    city: 'safaga',
    assetRef: 'image-20ae355f698be60a94d5431f4a89786344035589-3000x2002-jpg',
    alt: loc(
      'Bright beach at Safaga with camping tents and sun umbrellas beside a turquoise-to-deep-blue sea',
      'Playa luminosa de Safaga con tiendas de campaña y sombrillas junto a un mar que pasa del turquesa al azul profundo',
      'ターコイズから濃紺へと変わる海辺に、テントとパラソルが並ぶサファガの明るいビーチ'
    ),
    caption: loc(
      'Winter sun on Safaga’s shore — bright, rainless, and never crowded.',
      'Sol de invierno en la orilla de Safaga — luminoso, sin lluvia y nunca abarrotado.',
      'サファガの海辺に降り注ぐ冬の陽——明るく、雨がなく、混み合うこともない。'
    ),
  },
  {
    id: 'wp-page-60533',
    city: 'sohag',
    assetRef: 'image-9e6c0863b24ed9af813186657d7961fe1e587b7b-3000x2000-jpg',
    alt: loc(
      'Colossal statue of Meritamun at Akhmim rising against a deep clear blue sky, palm fronds to one side',
      'Estatua colosal de Meritamún en Ajmim alzándose contra un cielo azul intenso y despejado, con palmeras a un lado',
      '澄み切った濃い青空を背に立つアフミームのメリトアメン巨像、傍らにヤシの葉'
    ),
    caption: loc(
      'Akhmim’s Meritamun colossus under the kind of clear dry sky Sohag wakes up to.',
      'El coloso de Meritamún en Ajmim bajo el cielo despejado y seco con el que amanece Sohag.',
      'ソハーグの朝を象徴する乾いた快晴の空の下、アフミームのメリトアメン巨像。'
    ),
  },
];

async function main() {
  const rollback: any[] = [];
  for (const s of SWAPS) {
    const doc: any = await client.getDocument(s.id);
    rollback.push({ _id: s.id, heroImage: doc.heroImage });
    console.log(`${s.city}: ${doc.heroImage?.asset?._ref} -> ${s.assetRef}`);
    if (APPLY) {
      await client.patch(s.id).set({
        'heroImage.asset': { _type: 'reference', _ref: s.assetRef },
        'heroImage.alt': s.alt,
        'heroImage.caption': s.caption,
      }).commit();
      console.log(`  applied (alt+caption regenerated x3)`);
    }
  }
  fs.writeFileSync(
    `backups/deferred-hero-swaps-rollback-2026-07-17.json`,
    JSON.stringify(rollback, null, 2)
  );
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — rollback written (3 heroImage objects)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
