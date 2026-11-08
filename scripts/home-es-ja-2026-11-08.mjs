/**
 * ES/JA homepage (owner translations, 2026-11-08) — content side.
 *
 *  1. Image alt texts (owner list, EN <img> order on the homepage): the
 *     homepage hero + the 17 product heroes the page shows, ES and JA. The alt
 *     lives on the product's heroImage, so product pages get it too (it
 *     describes the same photo).
 *  2. ES strings from rounds 2–3 written with usted → tú: Cairo guide end-block
 *     heading, /blog/egypt-package-deals (ES) end heading.
 *  3. JA spelling: アレキサンドリア → アレクサンドリア on the Alexandria day-tour
 *     hub title (and the one guide H2 that repeats it); Cairo guide JA meta
 *     イスラーム → イスラム (owner's exact sentence).
 *
 * Dry run by default; --write to apply. Backups → backups/home-esja-<id>.json
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const write = process.argv.includes('--write');

// [EN slug | 'homePage', ES alt, JA alt] in homepage <img> order.
const ALTS = [
  ['homePage',
    'Una dahabiya tradicional de dos mástiles en el Nilo en calma al anochecer, con la luna llena sobre las colinas del desierto y las palmeras reflejadas en el agua',
    '夕暮れの穏やかなナイル川に浮かぶ二本マストの伝統的なダハビーヤ。砂漠の丘に満月が昇り、ヤシの並ぶ岸辺が水面に映る'],
  ['epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs',
    'Un barco de crucero por el Nilo amarrado bajo las ruinas del templo de Kom Ombo con la luz dorada del atardecer',
    '夕方の金色の光の中、コム・オンボ神殿の遺跡の下に停泊するナイル川クルーズ船'],
  ['10-days-nile-dreamer-tour-experience',
    'Una dahabiya tradicional navegando por el Nilo junto a orillas bordeadas de palmeras',
    'ヤシの並ぶ岸辺に沿ってナイル川を進む伝統的なダハビーヤ'],
  ['10-day-egypt-travel-journey-through-history',
    'El templo funerario en terrazas de Hatshepsut ante los acantilados de Deir el-Bahari, en Luxor',
    'ルクソール、デイル・エル＝バハリの断崖を背にしたハトシェプスト女王葬祭殿のテラス'],
  ['9-day-classic-egypt-family-adventure',
    'Falucas tradicionales en el Nilo en calma, en Asuán, con las colinas del desierto al fondo',
    '砂漠の丘を背景に、アスワンの穏やかなナイル川に浮かぶ伝統的なフェルッカ'],
  ['10-day-nile-and-western-desert-tour',
    'La colosal estatua yacente de Ramsés II en el museo de Menfis',
    'メンフィスの博物館に横たわるラムセス2世の巨像'],
  ['4-day-history-culture-escape',
    'Los dos campanarios blancos de la Iglesia Colgante sobre un patio de El Cairo copto',
    'コプト地区のカイロ、中庭の上にそびえる「吊り下げ教会」の白い双塔'],
  ['pyramids-of-giza-and-grand-egyptian-museum',
    'Un visitante fotografía estatuas y estelas faraónicas en una sala de museo con luz tenue',
    'やわらかな照明の博物館で、ファラオ時代の彫像や石碑を撮影する来館者'],
  ['private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara',
    'La pirámide escalonada de Zoser en Saqqara, elevándose por niveles desde el desierto, con andamios en un lado',
    'サッカラの砂漠に段状にそびえるジェセル王の階段ピラミッド。片側に足場がかかる'],
  ['pyramids-of-giza-and-sphinx-group-day-tour',
    'La Gran Esfinge de Guiza de perfil, con la pirámide de Kefrén detrás bajo un cielo con nubes',
    '雲の浮かぶ空の下、カフラー王のピラミッドを背にしたギザの大スフィンクスの横顔'],
  ['day-tour-to-karnak-luxor-temples-luxor-museum',
    'Un hombre con galabiya gris entre las esfinges con cabeza de carnero de la avenida del templo de Karnak, en Luxor',
    'ルクソールのカルナック神殿、羊頭スフィンクスが並ぶ参道に立つグレーのガラベーヤ姿の男性'],
  ['grand-west-bank-group-day-tour-luxor',
    'El Valle de los Reyes en Luxor, con entradas de tumbas y visitantes al pie de los acantilados',
    'ルクソールの王家の谷。切り立った崖の下に墓の入口と観光客'],
  ['skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience',
    'Un globo aerostático a cuadros inflándose al amanecer en la orilla occidental de Luxor, con el equipo y una camioneta',
    'ルクソール西岸、夜明けに膨らむチェック柄の熱気球と、クルーとピックアップトラック'],
  ['private-tour-abu-simble-by-bus-from-aswan',
    'Una fila de estatuas de halcones desgastadas sobre la terraza del Gran Templo de Abu Simbel bajo un cielo azul',
    '青空の下、アブ・シンベル大神殿のテラスに並ぶ風化したハヤブサ像'],
  ['nubian-temples-day-tour-from-aswan',
    'Un templo nubio bajo de arenisca sobre una terraza de piedra en pleno desierto, bajo colinas desnudas',
    '荒涼とした丘のふもと、砂漠の石のテラスに立つ低い砂岩のヌビア神殿'],
  ['aswan-felucca-adventure',
    'Una faluca de casco rojo navega por el Nilo junto a dunas doradas y rocas en Asuán',
    'アスワン、金色の砂丘と岩場のそばをナイル川に進む赤い船体のフェルッカ'],
  ['2-day-pyramids-mediterranean-tour',
    'Coches en la Corniche de Alejandría junto a un edificio con fachada de mosaico azul y hoteles blancos',
    '青いモザイク張りの建物と白いホテルが並ぶアレクサンドリアの海岸通り（コルニーシュ）を走る車'],
  ['alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo',
    'El palacio de Montaza en Alejandría iluminado al anochecer, con su torre ornamentada y sus arcadas contra un cielo azul intenso',
    '深い青の夕空に、装飾的な塔とアーケードが浮かび上がるアレクサンドリアのモンタザ宮殿'],
];

/** Replace/insert the es and ja entries of an internationalized alt array. */
function withAlt(alt, es, ja) {
  const arr = Array.isArray(alt) ? alt.filter((x) => x._key !== 'es' && x._key !== 'ja') : [];
  const type = arr[0]?._type ?? 'internationalizedArrayStringValue';
  return [...arr, { _key: 'es', _type: type, value: es }, { _key: 'ja', _type: type, value: ja }];
}

const patches = []; // [id, setObject, note]
const backups = new Map();

for (const [slug, es, ja] of ALTS) {
  const doc =
    slug === 'homePage'
      ? await c.getDocument('homePage')
      : await c.fetch(`*[_type=="tour" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$slug][0]`, { slug });
  if (!doc) throw new Error(`missing ${slug}`);
  if (!doc.heroImage?.asset) throw new Error(`no hero on ${slug}`);
  backups.set(doc._id, doc);
  patches.push([doc._id, { 'heroImage.alt': withAlt(doc.heroImage.alt, es, ja) }, `alt ${slug}`]);
}

// ES tú fixes
const cairo = await c.getDocument('wp-page-83284');
backups.set(cairo._id, cairo);
const endHeading = cairo.endHeading.map((x) => (x._key === 'es' ? { ...x, value: 'Haz de El Cairo el viaje' } : x));
const seoDescription = cairo.seoDescription.map((x) =>
  x._key === 'ja'
    ? { ...x, value: '現地ガイドによるカイロ旅行ガイド。イスラム地区とコプト地区、ダウンタウン、大エジプト博物館、必要な日数、市内の移動手段まで。' }
    : x,
);
patches.push([cairo._id, { endHeading, seoDescription }, 'Cairo guide: ES end heading (tú), JA meta イスラム']);

const blogEs = await c.getDocument('wp-post-154308-es');
backups.set(blogEs._id, blogEs);
patches.push([blogEs._id, { endHeading: 'Empieza por uno de estos y cambia lo que quieras' }, 'package-deals ES end heading (tú)']);

// JA Alexandria spelling
const OLD_JA = 'アレキサンドリアプライベートデイツアー';
const NEW_JA = 'アレクサンドリア プライベートデイツアー';
for (const id of ['tourLanding.alexandria-private-day-tours', 'wp-page-87070']) {
  const d = await c.getDocument(id);
  backups.set(id, d);
  const s = JSON.stringify(d);
  if (!s.includes(OLD_JA)) throw new Error(`${id}: string not found`);
  // Rewrite only the fields that contain the old spelling.
  const set = {};
  for (const [k, v] of Object.entries(d)) {
    if (k.startsWith('_')) continue;
    const vs = JSON.stringify(v);
    if (vs.includes(OLD_JA)) set[k] = JSON.parse(vs.split(`${OLD_JA} `).join(NEW_JA).split(OLD_JA).join(NEW_JA));
  }
  patches.push([id, set, `JA Alexandria spelling: ${Object.keys(set).join(', ')}`]);
}

for (const [id, , note] of patches) console.log(id, '—', note);
if (!write) {
  console.log(`dry run (${patches.length} patches) — pass --write`);
  process.exit(0);
}
fs.mkdirSync('backups', { recursive: true });
for (const [id, d] of backups) fs.writeFileSync(`backups/home-esja-${id}.json`, JSON.stringify(d, null, 2));
const tx = c.transaction();
for (const [id, set] of patches) tx.patch(id, (p) => p.set(set));
await tx.commit();
console.log('written', patches.length);
