/**
 * 2026-11-08 — owner-supplied hero images for two dahabiya vessel pages
 * (both had no hero). Backups → backups/dahabiya-hero-<id>.json
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const DIR = '/Users/islamhussein/Desktop/aha/daha';
const i18n = (m) => Object.entries(m).map(([lang, value]) => ({ _key: lang, _type: 'internationalizedArrayStringValue', value }));

const JOBS = [
  {
    id: 'nileCruise.la-flaneuse-du-nil-dahabiya',
    file: 'La-Flâneuse-du-Nil-enhanced.png',
    alt: {
      en: 'Curved shaded deck of La Flâneuse du Nil dahabiya with cushioned bench seating, linen curtains and brass lanterns above the Nile',
      es: 'Cubierta curva y en sombra de la dahabiya La Flâneuse du Nil, con banco de cojines, cortinas de lino y faroles de latón sobre el Nilo',
      ja: 'ラ・フラヌーズ・デュ・ニル号の日陰のカーブしたデッキ。クッション付きのベンチ、リネンのカーテン、真鍮のランタン越しにナイル川を望む',
    },
    caption: { en: 'La Flâneuse du Nil: the shaded deck', es: 'La Flâneuse du Nil: la cubierta a la sombra', ja: 'ラ・フラヌーズ・デュ・ニル号：日陰のデッキ' },
  },
  {
    id: 'nileCruise.eyaru-dahabiya',
    file: 'eyaru-dahabiya-enhanced.png',
    alt: {
      en: 'Private curved balcony on the Eyaru dahabiya with a cushioned bench, woven rug and wooden louvred doors, looking across the Nile',
      es: 'Balcón privado curvo en la dahabiya Eyaru, con banco de cojines, alfombra tejida y puertas de lamas de madera, frente al Nilo',
      ja: 'エヤル号の曲線を描くプライベートバルコニー。クッション付きベンチ、織りのラグ、木製ルーバー扉、目の前にナイル川',
    },
    caption: { en: 'Eyaru: a private balcony over the Nile', es: 'Eyaru: un balcón privado sobre el Nilo', ja: 'エヤル号：ナイル川に面したプライベートバルコニー' },
  },
];

fs.mkdirSync('backups', { recursive: true });
for (const j of JOBS) {
  const doc = await c.getDocument(j.id);
  if (!doc) throw new Error(`missing ${j.id}`);
  fs.writeFileSync(`backups/dahabiya-hero-${j.id}.json`, JSON.stringify(doc, null, 2));
  const asset = await c.assets.upload('image', fs.createReadStream(`${DIR}/${j.file}`), { filename: j.file.replace('â', 'a').replace('-enhanced', '') });
  await c.patch(j.id).set({
    heroImage: { _type: 'localizedImage', asset: { _type: 'reference', _ref: asset._id }, alt: i18n(j.alt), caption: i18n(j.caption) },
  }).commit();
  console.log('set', j.id, asset._id);
}
