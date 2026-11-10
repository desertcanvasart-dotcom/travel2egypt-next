/**
 * Cairo guide hero images (owner, 10 Nov 2026): upload the owner's images from
 * ~/Desktop/destination-images/cairo to the matching guide pages
 * (guide/cairo/<file-name>), with alt text in EN/ES/JA.
 *
 * Only pages WITHOUT a hero image and where the photo was checked by eye to
 * match the page. Pages that already have an image, and photos that do not
 * match, are left for the owner (see docs/cairo-guide-images-2026-11-10.md).
 * Creative Commons photos carry a credit and are uploaded with --cc only after
 * the guide page shows credits (attribution is required by the licence).
 * Usage (from the repo root): node scripts/cairo-guide-heroes-2026-11-10.mjs [--cc] [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const CC = process.argv.includes('--cc');
const DIR = '/Users/islamhussein/Desktop/destination-images/cairo';
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

// file (= page slug) → [EN alt, ES alt, JA alt]
const OWN = {
  'al-azhar-mosque': ['Minarets of Al-Azhar Mosque in Cairo against a pale blue sky.', 'Alminares de la mezquita de Al-Azhar en El Cairo bajo un cielo azul claro.', '淡い青空を背にした、カイロのアズハル・モスクのミナレット。'],
  'amir-taz-palace': ['Vaulted stone hall with a sunken marble fountain in the Palace of Amir Taz, Cairo.', 'Sala abovedada de piedra con una fuente de mármol empotrada en el palacio del emir Taz, El Cairo.', 'カイロ、アミール・ターズ宮殿の石造りのヴォールト天井の広間と、床に埋め込まれた大理石の噴水。'],
  'bab-zuweila': ['Looking up between the twin towers of Bab Zuweila, the medieval gate of Fatimid Cairo.', 'Vista desde abajo entre las dos torres de Bab Zuweila, la puerta medieval de El Cairo fatimí.', 'ファーティマ朝カイロの中世の門、バーブ・ズワイラの双塔を見上げる。'],
  'bein-al-qasreen': ['Ornate Mamluk interior on Bein al-Qasreen, Cairo, with hanging lamps and a stained-glass window.', 'Interior mameluco ornamentado en Bein al-Qasreen, El Cairo, con lámparas colgantes y una vidriera.', 'カイロ、バイン・アル・カスラインに建つマムルーク朝建築の華やかな内部。吊りランプとステンドグラスの窓。'],
  'beit-al-harrawi': ['Stone courtyard wall of Beit al-Harrawi in Cairo, with a large wooden mashrabiya window.', 'Muro de piedra del patio de Beit al-Harrawi en El Cairo, con una gran ventana de mashrabiya.', 'カイロのベイト・アル・ハラーウィー。大きな木製マシュラビーヤの窓がある中庭の石壁。'],
  'beit-al-suhaymi': ['Stone façade of Beit al-Suhaymi on Al-Muizz Street, Cairo, with a carved wooden door below a fanlight.', 'Fachada de piedra de Beit al-Suhaymi en la calle Al-Muizz, El Cairo, con una puerta de madera tallada bajo un montante calado.', 'カイロ、ムイッズ通りのベイト・アル・スハイミー。扇形の欄間の下に彫刻の木扉がある石造りのファサード。'],
  'beit-zeinab-al-khatoun': ['Courtyard of Beit Zeinab al-Khatoun in Cairo, with wooden mashrabiya balconies on a plastered façade.', 'Patio de Beit Zeinab al-Khatoun en El Cairo, con balcones de mashrabiya de madera sobre una fachada enlucida.', 'カイロのベイト・ゼイナブ・アル・ハトゥーンの中庭。漆喰の壁に木製マシュラビーヤの出窓が並ぶ。'],
  'cairo-events': ['A tanoura dancer spins in a colourful skirt in a historic Cairo courtyard.', 'Un bailarín de tanoura gira con su falda de colores en un patio histórico de El Cairo.', 'カイロの歴史ある中庭で、色鮮やかなスカートを回して踊るタンヌーラの踊り手。'],
  'church-of-saint-sergius-and-bacchus-abu-serga': ['Brick-vaulted chamber with an icon in the Church of Saints Sergius and Bacchus (Abu Serga), Coptic Cairo.', 'Cámara abovedada de ladrillo con un icono en la iglesia de San Sergio y San Baco (Abu Serga), El Cairo copto.', 'コプト・カイロの聖セルギウスと聖バッカス教会（アブ・セルガ）。イコンが掛かる煉瓦造りのヴォールト室。'],
  'complex-of-sultan-al-ashraf-barsbay': ['Prayer hall of the Complex of Sultan al-Ashraf Barsbay in Cairo, with a carved stone arch and hanging lamps.', 'Sala de oración del complejo del sultán al-Ashraf Barsbay en El Cairo, con un arco de piedra tallada y lámparas colgantes.', 'カイロのアシュラフ・バルスバイ複合施設の礼拝堂。石彫りのアーチと吊りランプ。'],
  'egyptian-museum-of-antiquities': ['Pink neoclassical façade of the Egyptian Museum in Tahrir Square, Cairo, framed by palm trees.', 'Fachada neoclásica rosada del Museo Egipcio en la plaza Tahrir, El Cairo, entre palmeras.', 'ヤシの木に囲まれた、カイロ・タハリール広場のエジプト考古学博物館の淡紅色の新古典様式ファサード。'],
  'egyptian-textile-museum': ['Traditional wooden loom on display in the Egyptian Textile Museum, Cairo.', 'Telar tradicional de madera expuesto en el Museo Egipcio del Textil, El Cairo.', 'カイロのエジプト織物博物館に展示された伝統的な木製の織機。'],
  'from-al-azhar-to-the-citadel-walking-islamic-cairo': ['Rooftop view across Islamic Cairo, with minarets and domes rising over the old city.', 'Vista desde las azoteas sobre El Cairo islámico, con alminares y cúpulas sobre la ciudad antigua.', '屋上から望むイスラーム地区カイロ。旧市街にミナレットとドームが立ち並ぶ。'],
  'gayer-anderson-museum': ['Courtyard of the Gayer-Anderson Museum in Cairo, with a stone stair, wooden door and mashrabiya window.', 'Patio del Museo Gayer-Anderson en El Cairo, con una escalera de piedra, una puerta de madera y una ventana de mashrabiya.', 'カイロのゲイヤー・アンダーソン博物館の中庭。石の階段、木の扉、マシュラビーヤの窓。'],
  'getting-around-cairo': ["Red sign reading 'Cairo Traffic' in Arabic and English on a street barrier in Cairo.", "Cartel rojo con el texto 'Cairo Traffic' en árabe e inglés sobre una valla en una calle de El Cairo.", 'カイロの路上の柵に掲げられた、アラビア語と英語で「Cairo Traffic」と書かれた赤い看板。'],
  'history-of-cairo': ['Sunset over Cairo, with the Sultan Hassan and Al-Rifai mosques in the foreground.', 'Atardecer sobre El Cairo, con las mezquitas del sultán Hassan y de Al-Rifai en primer plano.', '夕暮れのカイロ。手前にスルタン・ハサン・モスクとリファーイー・モスク。'],
  'khan-el-khalili': ['Lantern and brass shop beneath a stone archway in the Khan el-Khalili bazaar, Cairo.', 'Tienda de faroles y latón bajo un arco de piedra en el bazar de Khan el-Khalili, El Cairo.', 'カイロのハーン・ハリーリ市場。石のアーチの下にランタンと真鍮製品の店が並ぶ。'],
  'khanqah-and-mausoleum-of-sultan-baybars-al-jashnagir': ['Carved stone portal of the Khanqah and Mausoleum of Sultan Baybars al-Jashnagir, Cairo.', 'Portada de piedra tallada de la khanqah y mausoleo del sultán Baybars al-Jashnagir, El Cairo.', 'カイロ、スルタン・バイバルス・アル・ジャーシュナキールのハーンカーと霊廟の石彫りの正門。'],
  'madrasa-and-khanqah-of-sultan-barquq': ['Painted and gilded ceiling above the arcades of the Madrasa and Khanqah of Sultan Barquq, Cairo.', 'Techo pintado y dorado sobre las arcadas de la madrasa y khanqah del sultán Barquq, El Cairo.', 'カイロ、スルタン・バルクークのマドラサとハーンカー。アーケードの上の彩色と金箔の天井。'],
  'madrasa-and-mausoleum-of-as-salih-najm-al-din-ayyub': ['Carved stone niche on the façade of the Madrasa and Mausoleum of as-Salih Najm al-Din Ayyub, Cairo.', 'Hornacina de piedra tallada en la fachada de la madrasa y mausoleo de as-Salih Najm al-Din Ayyub, El Cairo.', 'カイロ、サーリフ・ナジュムッディーン・アイユーブのマドラサと霊廟のファサードにある石彫りの壁龕。'],
  'mausoleum-complex-of-sultan-qaytbay': ["Carved stone balcony of the minaret of Sultan Qaytbay's complex against the sky, Cairo.", 'Balcón de piedra tallada del alminar del complejo del sultán Qaytbay recortado contra el cielo, El Cairo.', '空を背にした、カイロのスルタン・カーイトバーイ複合施設のミナレットの石彫りのバルコニー。'],
  'mausoleum-of-al-ghouri': ['Stone hall of the Mausoleum of al-Ghouri in Cairo, set with chairs and carpets for events.', 'Sala de piedra del mausoleo de al-Ghouri en El Cairo, preparada con sillas y alfombras para actos.', 'カイロのグーリー霊廟の石造りの広間。催しのための椅子と絨毯が並ぶ。'],
  'mosque-madrasa-of-al-ghouri': ['Minaret tops of the al-Ghouri complex against a pale sky, Cairo.', 'Remates de los alminares del complejo de al-Ghouri contra un cielo claro, El Cairo.', '淡い空を背にした、カイロのグーリー複合施設のミナレットの頂部。'],
  'mosque-madrassa-of-sultan-hassan': ["The Mosque-Madrassa of Sultan Hassan and the Al-Rifai Mosque seen across Cairo's rooftops.", 'La mezquita-madrasa del sultán Hassan y la mezquita de Al-Rifai vistas sobre los tejados de El Cairo.', 'カイロの家並み越しに見るスルタン・ハサンのモスク・マドラサとリファーイー・モスク。'],
  'mosque-madrassa-of-umm-sultan-sha-aban': ["Dome and minaret of the Mosque-Madrassa of Umm Sultan Sha'ban in Cairo.", "Cúpula y alminar de la mezquita-madrasa de Umm Sultan Sha'ban en El Cairo.", 'カイロのウンム・スルタン・シャアバーンのモスク・マドラサのドームとミナレット。'],
  'mosque-of-al-aqmar': ['Carved stone façade of the Fatimid Al-Aqmar Mosque in Cairo, with its shell-shaped niche.', 'Fachada de piedra tallada de la mezquita fatimí de Al-Aqmar en El Cairo, con su hornacina en forma de concha.', 'カイロのファーティマ朝のアクマル・モスク。貝殻形の壁龕がある石彫りのファサード。'],
  'mosque-of-al-hakim': ['White courtyard and arcades of the Mosque of al-Hakim in Cairo, with a minaret beyond.', 'Patio blanco y arcadas de la mezquita de al-Hakim en El Cairo, con un alminar al fondo.', 'カイロのハーキム・モスクの白い中庭とアーケード、奥にミナレット。'],
  'mosque-of-al-mu-ayyad-shaykh': ["Silhouette of a minaret of the Mosque of al-Mu'ayyad Shaykh against a blue sky, Cairo.", "Silueta de un alminar de la mezquita de al-Mu'ayyad Shaykh contra el cielo azul, El Cairo.", '青空を背にした、カイロのムアイヤド・シャイフ・モスクのミナレットのシルエット。'],
  'mosque-of-al-nasir-muhammad-ibn-qalawun': ['Stone walls and minaret of the Mosque of al-Nasir Muhammad ibn Qalawun at the Cairo Citadel.', 'Muros de piedra y alminar de la mezquita de al-Nasir Muhammad ibn Qalawun en la Ciudadela de El Cairo.', 'カイロ城塞にあるナーシル・ムハンマド・イブン・カラーウーン・モスクの石壁とミナレット。'],
  'mosque-of-amr-ibn-al-as': ['Entrance façade and minaret of the Mosque of Amr ibn al-As in Old Cairo.', 'Fachada de entrada y alminar de la mezquita de Amr ibn al-As en El Cairo antiguo.', 'オールド・カイロのアムル・イブン・アル＝アース・モスクの正面とミナレット。'],
  'mosque-of-ibn-tulun': ['Courtyard of the Mosque of Ibn Tulun in Cairo, with its domed fountain and spiral minaret.', 'Patio de la mezquita de Ibn Tulun en El Cairo, con su fuente cubierta por una cúpula y su alminar en espiral.', 'カイロのイブン・トゥールーン・モスクの中庭。ドームのある泉亭と螺旋状のミナレット。'],
  'mosque-of-muhammad-ali': ['The Mosque of Muhammad Ali on the Cairo Citadel, framed by palm trees.', 'La mezquita de Muhammad Ali en la Ciudadela de El Cairo, entre palmeras.', 'ヤシの木に囲まれた、カイロ城塞のムハンマド・アリー・モスク。'],
  'mosque-of-sayyidna-al-hussein': ['Minaret and façade of the Mosque of Sayyidna al-Hussein in Cairo, with palm trees.', 'Alminar y fachada de la mezquita de Sayyidna al-Hussein en El Cairo, con palmeras.', 'ヤシの木が並ぶ、カイロのサイイドナ・フセイン・モスクのミナレットとファサード。'],
  'museum-of-islamic-art': ['Inlaid wooden geometric panels at the Museum of Islamic Art, Cairo.', 'Paneles geométricos de madera con incrustaciones en el Museo de Arte Islámico, El Cairo.', 'カイロのイスラーム美術館にある、象嵌細工の幾何学模様の木製パネル。'],
  'northern-enclosure-of-the-citadel': ["View over Cairo's rooftops from the Northern Enclosure of the Citadel.", 'Vista sobre los tejados de El Cairo desde el recinto norte de la Ciudadela.', '城塞の北側区域から見渡すカイロの家並み。'],
  'only-here-in-cairo': ['Street scene in a Cairo neighbourhood, with a food cart and shopfronts.', 'Escena callejera en un barrio de El Cairo, con un carrito de comida y escaparates.', '屋台と店先が並ぶ、カイロの下町の街角。'],
  'roman-towers-and-church-of-saint-george': ['Church of Saint George in Coptic Cairo, reached by a wide flight of steps.', 'La iglesia de San Jorge en El Cairo copto, a la que se sube por una amplia escalinata.', '広い石段の上に建つ、コプト・カイロの聖ゲオルギオス教会。'],
  'sabil-of-muhammad-ali-pasha': ['Curved façade of the Sabil of Muhammad Ali Pasha in Cairo, with gilded carving and a balcony.', 'Fachada curva del sabil de Muhammad Ali Pasha en El Cairo, con tallas doradas y un balcón.', 'カイロのムハンマド・アリー・パシャのサビール。金色の彫刻とバルコニーのある曲面のファサード。'],
  'sharia-al-muizz-li-din-allah': ['Brass lantern shop beside a stone doorway on Al-Muizz li-Din Allah Street, Cairo.', 'Tienda de faroles de latón junto a una puerta de piedra en la calle Al-Muizz li-Din Allah, El Cairo.', 'カイロ、ムイッズ・リ・ディーニッラー通りの石の戸口の脇にある真鍮ランタンの店。'],
  // Owner, 10 Nov 2026: replace the existing image on these pages.
  'cairo-food-guide': ["A bowl of koshari, Cairo's dish of rice, pasta and chickpeas topped with tomato sauce and fried onions.", 'Un cuenco de koshari, el plato cairota de arroz, pasta y garbanzos con salsa de tomate y cebolla frita.', 'トマトソースと揚げ玉ねぎをのせた、米・パスタ・ひよこ豆のカイロ料理コシャリ。'],
  'cairo-tours': ['The Pyramid of Khafre and the Great Sphinx at Giza under a sunset sky.', 'La pirámide de Kefrén y la Gran Esfinge de Guiza bajo el cielo del atardecer.', '夕焼け空の下のギザのカフラー王のピラミッドと大スフィンクス。'],
  'coptic-cairo': ['The twin bell towers of the Hanging Church above a lane in Coptic Cairo.', 'Las dos torres campanario de la Iglesia Colgante sobre una calle de El Cairo copto.', 'コプト・カイロの小路の先にそびえる、吊り下げ教会の二つの鐘楼。'],
  'how-to-go-to-cairo': ['An EgyptAir Express plane on an airport apron.', 'Un avión de EgyptAir Express en la plataforma de un aeropuerto.', '空港のエプロンに駐機するエジプト航空エクスプレスの機体。'],
  'things-to-do-in-cairo': ['A white-sailed felucca on the Nile.', 'Una faluca de vela blanca en el Nilo.', 'ナイル川を進む白い帆のフェルッカ。'],
  'ticket-prices-for-attractions-in-cairo': ['Façade of the Egyptian Museum in Tahrir Square, Cairo, with its pool and sphinx statues.', 'Fachada del Museo Egipcio en la plaza Tahrir, El Cairo, con su estanque y sus esfinges.', 'カイロ・タハリール広場のエジプト考古学博物館。池とスフィンクス像のある正面。'],
  'where-to-stay-in-cairo': ['The Nile in central Cairo, with riverside hotels and the Cairo Tower on the skyline.', 'El Nilo en el centro de El Cairo, con hoteles junto al río y la Torre de El Cairo en el horizonte.', 'ナイル川沿いのホテルとカイロ・タワーが並ぶ、カイロ中心部のスカイライン。'],
};
// Creative Commons (credits.json) → [EN, ES, JA, credit]
const CCMAP = {
  'al-ghuriyya-complex': ['Carved stone façade of the al-Ghuri complex in Cairo, with mashrabiya windows and a wooden canopy.', 'Fachada de piedra tallada del complejo de al-Ghuri en El Cairo, con ventanas de mashrabiya y un alero de madera.', 'マシュラビーヤの窓と木製の庇を備えた、カイロのグーリー複合施設の石彫りのファサード。', 'Djehouty / Wikimedia Commons, CC BY-SA 4.0'],
  'ben-ezra-synagogue': ['Interior of the Ben Ezra Synagogue in Coptic Cairo, with columns, an upper gallery and hanging lamps.', 'Interior de la sinagoga de Ben Ezra en El Cairo copto, con columnas, una galería superior y lámparas colgantes.', 'コプト・カイロのベン・エズラ・シナゴーグの内部。列柱、上階のギャラリー、吊りランプ。', 'Ovedc / Wikimedia Commons, CC BY-SA 4.0'],
  'khanqah-mausoleum-of-farag-ibn-barquq': ['Courtyard of the Khanqah-Mausoleum of Farag ibn Barquq in Cairo, with domes and arcades.', 'Patio de la khanqah-mausoleo de Farag ibn Barquq en El Cairo, con cúpulas y arcadas.', 'ドームとアーケードに囲まれた、カイロのファラジュ・イブン・バルクークのハーンカー・霊廟の中庭。', 'Robert Prazeres / Wikimedia Commons, CC BY-SA 4.0'],
  'mosque-of-aslam-al-silahdar': ['Carved and painted wooden ceiling panel in the Mosque of Aslam al-Silahdar, Cairo.', 'Panel de techo de madera tallada y pintada en la mezquita de Aslam al-Silahdar, El Cairo.', 'カイロのアスラム・アル・シラーフダール・モスクにある、彫刻と彩色の木製天井パネル。', 'R Prazeres / Wikimedia Commons, CC BY-SA 4.0'],
  'museo-mevlevi-mawlawiyya-museum': ['A Mevlevi whirling dervish turning in a dark hall.', 'Un derviche giróvago mevlevi girando en una sala en penumbra.', '薄暗い広間で旋回するメヴレヴィー教団の旋舞者。', 'Valeria Kikvidze / Wikimedia Commons, CC BY-SA 4.0'],
  'northern-walls-and-gates-of-fatimid-cairo': ['Bab al-Futuh, a gate in the northern walls of Fatimid Cairo.', 'Bab al-Futuh, una de las puertas de la muralla norte de El Cairo fatimí.', 'ファーティマ朝カイロの北の城壁にある門、バーブ・アル・フトゥーフ。', 'Djehouty / Wikimedia Commons, CC BY-SA 4.0'],
  'sabil-kuttab-of-abd-al-rahman-katkhuda': ['Stone basin below the grille of the Sabil-Kuttab of Abd al-Rahman Katkhuda, Cairo.', 'Pila de piedra bajo la reja del sabil-kuttab de Abd al-Rahman Katkhuda, El Cairo.', 'カイロのアブドゥッラフマーン・カトフダーのサビール・クッターブ。格子窓の下の石の水盤。', 'Marsupium / Wikimedia Commons, CC BY 4.0'],
  'gawhara-terrace-and-palace': ['Sign for El Gohara Palace on a stone wall at the Cairo Citadel.', 'Placa del palacio de El Gohara en un muro de piedra de la Ciudadela de El Cairo.', 'カイロ城塞の石壁に掲げられたガウハラ宮殿の銘板。', 'Zienauto / Wikimedia Commons, CC BY-SA 4.0'],
};

// Pages whose existing (live or draft-only) image the owner chose to replace (10 Nov 2026).
const REPLACE = new Set(['cairo-food-guide', 'cairo-tours', 'coptic-cairo', 'how-to-go-to-cairo', 'things-to-do-in-cairo', 'ticket-prices-for-attractions-in-cairo', 'where-to-stay-in-cairo',
  'al-ghuriyya-complex', 'bab-zuweila', 'beit-al-suhaymi', 'khan-el-khalili', 'madrasa-and-khanqah-of-sultan-barquq', 'mosque-of-al-aqmar', 'mosque-of-al-hakim', 'mosque-of-al-mu-ayyad-shaykh', 'sharia-al-muizz-li-din-allah']);
const SET = CC ? CCMAP : OWN;
const loc = (en, es, ja) => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: en },
  { _key: 'es', _type: 'internationalizedArrayStringValue', value: es },
  { _key: 'ja', _type: 'internationalizedArrayStringValue', value: ja },
];
const cityId = await c.fetch(`*[_type=="city" && slug[_key=="en"][0].value.current=="cairo" && !(_id in path("drafts.**"))][0]._id`);
const pages = await c.fetch(`*[_type=="guideArticle" && parentCity._ref==$cityId && slug[_key=="en"][0].value.current in $slugs]{_id, "s": slug[_key=="en"][0].value.current, "has": defined(heroImage.asset)}`, { cityId, slugs: Object.keys(SET) });
let tx = c.transaction(), n = 0, uploaded = 0;
for (const [slug, v] of Object.entries(SET)) {
  const ids = pages.filter((p) => p.s === slug);
  const pub = ids.find((p) => !p._id.startsWith('drafts.'));
  if (!pub) throw new Error(`no published page for ${slug}`);
  const done = await c.fetch(`*[_id==$id][0].heroImage.asset->originalFilename`, { id: pub._id });
  if (done === `${slug}.jpg`) { console.log(`${slug}: already has this image`); continue; }
  if (ids.some((p) => p.has) && !REPLACE.has(slug)) { console.log(`skip ${slug}: page already has an image`); continue; }
  const file = `${DIR}/${slug}.jpg`;
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);
  let assetId = '(dry run)';
  if (APPLY) { const a = await c.assets.upload('image', fs.createReadStream(file), { filename: `${slug}.jpg` }); assetId = a._id; uploaded++; }
  const hero = { _type: 'localizedImage', asset: { _type: 'reference', _ref: assetId }, alt: loc(v[0], v[1], v[2]), ...(v[3] ? { credit: v[3] } : {}) };
  for (const p of ids) { tx = tx.patch(c.patch(p._id).set({ heroImage: hero })); n++; }
  console.log(`${slug} → ${ids.map((p) => p._id).join(', ')}${v[3] ? `  [credit: ${v[3]}]` : ''}`);
}
if (APPLY && n) { const r = await tx.commit(); console.log(`uploaded ${uploaded} images; committed ${r.results.length} documents`); }
else console.log(`${Object.keys(SET).length} images, ${n} documents to patch (dry run — pass --apply)`);
