/**
 * Bucket 1 + 3 of the tour localization fix: add ES + JA to the EN-only
 * structured rail fields on the quad-bike sunset tour (wp-page-87637), and the
 * missing durationLabel on the family package (wp-page-113005). EN preserved.
 *
 *   tsx scripts/localize-quadbike-label.ts          # dry run (print)
 *   tsx scripts/localize-quadbike-label.ts --apply  # write + publish
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
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

// internationalized string/text item
const I = (en: string, es: string, ja: string) => [
  { _key: 'en', _type: 'object', value: en },
  { _key: 'es', _type: 'object', value: es },
  { _key: 'ja', _type: 'object', value: ja },
];
// internationalized list item (value is string[])
const L = (en: string[], es: string[], ja: string[]) => [
  { _key: 'en', _type: 'object', value: en },
  { _key: 'es', _type: 'object', value: es },
  { _key: 'ja', _type: 'object', value: ja },
];

const QUADBIKE = {
  'shapeOfDay.where': I(
    'Sharm El Sheikh → southern Sinai interior · Bedouin stop · sunset desert → Sharm El Sheikh',
    'Sharm El Sheikh → interior del Sinaí del Sur · parada beduina · desierto al atardecer → Sharm El Sheikh',
    'シャルム・エル・シェイク → 南シナイの内陸部 · ベドウィンの立ち寄り · 夕暮れの砂漠 → シャルム・エル・シェイク',
  ),
  'shapeOfDay.duration': I(
    'Late afternoon into early evening · around 5 hours',
    'Desde media tarde hasta primera hora de la noche · unas 5 horas',
    '午後遅くから夕刻にかけて · 約5時間',
  ),
  'shapeOfDay.character': I(
    'Private hotel transfer · shared desert ride · Bedouin stop · safety briefing · sunset timing · minimum age 18 to drive',
    'Traslado privado al hotel · paseo compartido por el desierto · parada beduina · charla de seguridad · al atardecer · edad mínima 18 años para conducir',
    'ホテルへのプライベート送迎 · 砂漠でのシェアライド · ベドウィンの立ち寄り · 安全説明 · 夕暮れの時間帯 · 運転は18歳以上',
  ),
  priceTiers: [
    {
      _key: 'p0', _type: 'object', price: 55,
      name: I('Base', 'Base', '基本'),
      sub: I('Transfer · quad & fuel · guide · Bedouin stop', 'Traslado · quad y combustible · guía · parada beduina', '送迎 · クアッドバイクと燃料 · ガイド · ベドウィンの立ち寄り'),
      unit: I('pp', 'pp', 'pp'),
    },
  ],
  priceNote: I(
    'Indicative, per person — the fare moves with season, party size and the inclusions level you choose. No fixed entrance or add-on tiers on this day. Final quote confirmed on inquiry.',
    'Indicativo, por persona — la tarifa varía según la temporada, el tamaño del grupo y el nivel de inclusiones que elijas. Este día no tiene entradas fijas ni niveles adicionales. Precio final confirmado al consultar.',
    '目安、お一人様あたり——料金は季節・人数・選ぶ内容の充実度によって変わります。この日は固定の入場料や追加プランはありません。最終料金はお問い合わせ時に確定します。',
  ),
  includedItems: L(
    ['Hotel pick-up & drop-off', 'Quad bike & fuel', 'Safety briefing', 'Licensed local guides', 'Bedouin encampment stop'],
    ['Recogida y regreso al hotel', 'Quad y combustible', 'Charla de seguridad', 'Guías locales autorizados', 'Parada en campamento beduino'],
    ['ホテルからの送迎', 'クアッドバイクと燃料', '安全説明', '公認の現地ガイド', 'ベドウィンの野営地に立ち寄り'],
  ),
  notIncludedItems: L(
    ['Protective clothing — closed shoes, long trousers, long sleeves', 'Goggles or glasses, and a scarf for dust'],
    ['Ropa protectora — zapatos cerrados, pantalones largos, mangas largas', 'Gafas protectoras o de vista, y un pañuelo para el polvo'],
    ['保護用の服装——つま先の覆われた靴、長ズボン、長袖', 'ゴーグルまたはメガネ、そして砂ぼこり用のスカーフ'],
  ),
  groupSize: I('Private transfer · shared ride', 'Traslado privado · paseo compartido', 'プライベート送迎 · シェアライド'),
  effortLevel: I('Active', 'Activo', 'アクティブ'),
  departsFrom: I('Sharm El Sheikh', 'Sharm El Sheikh', 'シャルム・エル・シェイク'),
};

const LABEL = { durationLabel: I('9 days / 8 nights', '9 días / 8 noches', '9日間／8泊') };

async function main() {
  console.log(APPLY ? '*** APPLY ***' : '--- DRY RUN (pass --apply) ---');
  console.log(`quad-bike (wp-page-87637): ${Object.keys(QUADBIKE).length} fields -> +ES +JA`);
  console.log(`family pkg (wp-page-113005): durationLabel -> +ES +JA`);
  if (!APPLY) { console.log('\nDRY RUN — pass --apply to write + publish.'); return; }
  await client.patch('wp-page-87637').set(QUADBIKE).commit({ visibility: 'sync' });
  console.log('  quad-bike patched.');
  await client.patch('wp-page-113005').set(LABEL).commit({ visibility: 'sync' });
  console.log('  family package patched.');
}
main().catch((e) => { console.error(e); process.exit(1); });
