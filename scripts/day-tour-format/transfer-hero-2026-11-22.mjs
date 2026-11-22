/** Luxor → Aswan pure transfer: hero swapped from the Edfu temple to a road image (owner, 22 Nov: "Swap the hero for a road image").
 *  Reuses the white-minibus-on-a-desert-road photo already on the Luxor → Marsa Alam transfer (wp-page-88174). */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';
const ID = 'tour.private-tour-transfer-from-luxor-to-aswan-by-bus';
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });
const src = await c.getDocument('wp-page-88174');
const t = (en, es, ja) => [{ _key: 'en', _type: 'object', value: en }, { _key: 'es', _type: 'object', value: es }, { _key: 'ja', _type: 'object', value: ja }];
const hero = {
  _type: 'localizedImage',
  asset: src.heroImage.asset,
  ...(src.heroImage.hotspot ? { hotspot: src.heroImage.hotspot } : {}),
  ...(src.heroImage.crop ? { crop: src.heroImage.crop } : {}),
  alt: t('A white minibus on a curving asphalt road beside a rocky desert hillside', 'Un microbús blanco en una carretera asfaltada con curvas junto a una ladera rocosa del desierto', '岩だらけの砂漠の斜面に沿ってカーブする舗装路を走る白いミニバス'),
  caption: t('A private vehicle on the road south.', 'Un vehículo privado en la carretera hacia el sur.', '南へ続く道を行くプライベート車両。'),
};
if (await c.getDocument(`drafts.${ID}`)) throw new Error('draft exists');
await writeRollback(c, [ID], 'hero-road');
await c.patch(ID).set({ heroImage: hero }).commit();
console.log('hero set', hero.asset._ref);
