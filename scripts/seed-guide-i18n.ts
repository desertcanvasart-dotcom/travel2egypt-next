/**
 * Localize the /guide hub: seed es + ja into the (now internationalized) guide
 * content fields on siteSettings + every guide city. EN is preserved verbatim
 * (re-set from the live values). es/ja are AI drafts for team review.
 *
 * Fields converted to internationalizedArray and seeded here:
 *   siteSettings: guideLead, guideWays[].title/body, guideRegions[].name/lede,
 *                 guideManifesto[].bold/text, guideSignoff
 *   city:         guideDek, guideBestFor, guideTime, guideHonestNote, guideTierLabel
 *
 * migration-staging only. Dry-run by default; pass --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const COMMIT = process.argv.includes('--commit');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

type Tri = [string, string, string]; // [en, es, ja]
const S = (v: Tri) => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: v[0] },
  { _key: 'es', _type: 'internationalizedArrayStringValue', value: v[1] },
  { _key: 'ja', _type: 'internationalizedArrayStringValue', value: v[2] },
];
const T = (v: Tri) => [
  { _key: 'en', _type: 'internationalizedArrayTextValue', value: v[0] },
  { _key: 'es', _type: 'internationalizedArrayTextValue', value: v[1] },
  { _key: 'ja', _type: 'internationalizedArrayTextValue', value: v[2] },
];

// ── siteSettings ──────────────────────────────────────────────
const guideLead: Tri = [
  `Egypt is bigger than its postcard.\n\nMost first-time visitors arrive with a short list — Giza, a Nile cruise, a few days at the Red Sea — and that itinerary works. It also leaves the country reduced to a sequence of monuments rather than a place with cities, coasts, deserts and a present-day rhythm five thousand years deep.\n\nThis is a working reference to more than forty Egyptian cities, written by people who actually operate trips here and organised the way Egyptians think about their own country: by region, by what each place is genuinely for, and by the kind of traveller it suits. Not a brochure. Use it to plan, to skip the parts everyone recommends but you won’t enjoy, and to find the parts almost no one mentions.`,
  `Egipto es más grande que su postal.\n\nLa mayoría de quienes vienen por primera vez llegan con una lista corta —Guiza, un crucero por el Nilo, unos días en el mar Rojo— y ese itinerario funciona. Pero también reduce el país a una sucesión de monumentos, en lugar de un lugar con ciudades, costas, desiertos y un pulso contemporáneo de cinco mil años de profundidad.\n\nEsta es una referencia práctica a más de cuarenta ciudades egipcias, escrita por quienes operamos viajes aquí de verdad y organizada como los egipcios piensan su propio país: por región, por aquello para lo que cada lugar sirve realmente y por el tipo de viajero al que le conviene. No es un folleto. Úsala para planificar, para saltarte lo que todos recomiendan pero no vas a disfrutar y para encontrar lo que casi nadie menciona.`,
  `エジプトは、絵葉書よりずっと大きい。\n\n初めて訪れる人の多くは、短いリストを手にやってくる——ギザ、ナイル川クルーズ、紅海で数日。その行程は十分に成り立つ。だが同時に、この国を記念碑の連なりへと縮めてしまう。本来は都市があり、海岸があり、砂漠があり、五千年の厚みを持つ今日の暮らしの鼓動がある場所だ。\n\nこれは四十を超えるエジプトの都市についての実用的な手引きであり、実際に現地でツアーを運営する者たちが書いた。構成はエジプト人が自国を捉えるやり方にならっている——地域ごとに、それぞれの土地が本当に何のためにあるかで、そしてどんな旅行者に向くかで。パンフレットではない。計画に使い、誰もが勧めるが自分には合わない部分は省き、ほとんど誰も触れない部分を見つけるために使ってほしい。`,
];

const guideSignoff: Tri = [
  `Egypt does not fit into a week. It does not really fit into a month.\n\nPick your part of it — a focused first visit, or the desert, the Mediterranean, the Upper Egypt the cruises skip on a later return.\n\nThe rest is here when you come back.`,
  `Egipto no cabe en una semana. En realidad, tampoco cabe en un mes.\n\nElige tu parte —una primera visita centrada, o el desierto, el Mediterráneo, el Alto Egipto que los cruceros se saltan, para una vuelta posterior.\n\nEl resto seguirá aquí cuando regreses.`,
  `エジプトは一週間には収まらない。正直に言えば、一か月でも収まらない。\n\n自分の一部分を選べばいい——的を絞った初めての旅でも、砂漠でも、地中海でも、クルーズが素通りする上エジプトでも。それは次に戻ったときのために。\n\n残りは、また来るときにここで待っている。`,
];

const guideWays: Array<{ title: Tri; body: Tri }> = [
  {
    title: ['A first trip', 'Un primer viaje', '初めての旅'],
    body: [
      `Get the essentials right before anything else: Cairo, Giza, Luxor, Aswan and the Nile between them. The pharaonic heart of the country — add desert or coast only once these are settled.`,
      `Antes que nada, acierta con lo esencial: El Cairo, Guiza, Luxor, Asuán y el Nilo que los une. El corazón faraónico del país; añade desierto o costa solo cuando esto esté resuelto.`,
      `何よりもまず、要を押さえること——カイロ、ギザ、ルクソール、アスワン、そしてそれらを結ぶナイル川。ファラオ時代の国の中心だ。砂漠や海岸を加えるのは、ここが固まってからでいい。`,
    ],
  },
  {
    title: ['Going deeper', 'Profundizar', 'さらに深く'],
    body: [
      `For a second visit or a longer first one: Islamic and Coptic Cairo, the Nubian south at Aswan, Middle Egypt’s quieter temples, the monasteries, the food. The Egypt beyond the standard route.`,
      `Para una segunda visita o una primera más larga: el Cairo islámico y copto, el sur nubio en Asuán, los templos más tranquilos del Egipto Medio, los monasterios, la gastronomía. El Egipto que está más allá de la ruta habitual.`,
      `二度目の旅、あるいは長めの初旅に——イスラム・コプトのカイロ、アスワンのヌビアの南、人の少ない中エジプトの神殿群、修道院、そして食。定番ルートの先にあるエジプトだ。`,
    ],
  },
  {
    title: ['Specialist & return', 'Especialista y regreso', '上級者と再訪'],
    body: [
      `For Egyptology depth, desert journeys, diving, pilgrimage, or slow travel — the trips with a specific reason behind them, where honest route logic matters more than the highlights.`,
      `Para profundizar en la egiptología, viajes por el desierto, buceo, peregrinación o viaje pausado: los viajes con un motivo concreto detrás, donde una lógica de ruta sincera importa más que los grandes reclamos.`,
      `エジプト学を掘り下げる旅、砂漠の旅、ダイビング、巡礼、あるいはゆっくりとした旅へ——明確な目的を持つ旅であり、見どころよりも正直な道筋の論理が物を言う。`,
    ],
  },
];

const guideRegions: Array<{ key: string; name: Tri; lede: Tri }> = [
  {
    key: 'cairo-giza',
    name: ['Cairo & Giza', 'El Cairo y Guiza', 'カイロとギザ'],
    lede: [
      `The capital and its inseparable twin, where the Pyramids sit on what used to be desert and is now a city edge. Where most trips begin — and where most underestimate the time.`,
      `La capital y su gemela inseparable, donde las pirámides se alzan sobre lo que fue desierto y hoy es el borde de la ciudad. Donde empiezan casi todos los viajes, y donde casi todos subestiman el tiempo necesario.`,
      `首都と、切り離せないその双子の街。かつて砂漠だった土地は今や市街の縁となり、そこにピラミッドが立つ。多くの旅がここから始まり、多くの人が必要な時間を見誤る。`,
    ],
  },
  {
    key: 'upper-egypt',
    name: ['Upper Egypt', 'Alto Egipto', '上エジプト'],
    lede: [
      `Luxor and Aswan and the temples strung between them. This is the Nile-cruise corridor and the part of Egypt most visitors actually come for — the densest pharaonic landscape in the world.`,
      `Luxor y Asuán y los templos que se enhebran entre ambos. Es el corredor de los cruceros por el Nilo y la parte de Egipto por la que de verdad viene la mayoría: el paisaje faraónico más denso del mundo.`,
      `ルクソールとアスワン、そしてその間に連なる神殿群。ここはナイル川クルーズの回廊であり、多くの旅行者が本当に目当てにするエジプトだ——世界で最も濃密なファラオ時代の景観が広がる。`,
    ],
  },
  {
    key: 'delta-north-coast',
    name: ['The Delta & North Coast', 'El Delta y la costa norte', 'デルタと北海岸'],
    lede: [
      `A different Egypt — Greek, Roman and Ottoman layers, cooler air, the Mediterranean. The country’s second city and the coast running east and west of it.`,
      `Otro Egipto: capas griegas, romanas y otomanas, aire más fresco, el Mediterráneo. La segunda ciudad del país y la costa que se extiende al este y al oeste de ella.`,
      `もう一つのエジプト——ギリシア、ローマ、オスマンの層が重なり、空気は涼しく、地中海がある。国第二の都市と、その東西へと延びる海岸線だ。`,
    ],
  },
  {
    key: 'red-sea-coast',
    name: ['The Red Sea Coast', 'La costa del mar Rojo', '紅海沿岸'],
    lede: [
      `Egypt’s beach-and-reef country, where most trips come down off the history. The reefs that made it one of the world’s best-known dive destinations, and a string of resorts from polished to wild.`,
      `El Egipto de playa y arrecife, donde la mayoría de los viajes baja el ritmo tras la historia. Los arrecifes que lo convirtieron en uno de los destinos de buceo más conocidos del mundo, y una sucesión de resorts que van de lo pulido a lo salvaje.`,
      `ビーチとサンゴ礁のエジプト。歴史の旅を終えて多くの人がひと息つく場所だ。世界有数のダイビング地として知られるようになったサンゴ礁と、洗練されたものから素朴なものまで連なるリゾート群がある。`,
    ],
  },
  {
    key: 'sinai',
    name: ['Sinai', 'El Sinaí', 'シナイ半島'],
    lede: [
      `The peninsula between Egypt and the wider Middle East, in two distinct halves: the coastal dive resorts, and the high granite interior around the Monastery of St Catherine.`,
      `La península entre Egipto y el resto de Oriente Próximo, en dos mitades bien distintas: los resorts de buceo de la costa y el alto interior de granito en torno al monasterio de Santa Catalina.`,
      `エジプトと広い中東との間に横たわる半島。性格の異なる二つの半分から成る——沿岸のダイビング・リゾートと、聖カタリナ修道院を囲む花崗岩の高地だ。`,
    ],
  },
  {
    key: 'western-desert',
    name: ['The Western Desert', 'El Desierto Occidental', '西方砂漠'],
    lede: [
      `The chain of inhabited oases west of the Nile — the least-visited part of Egypt, and arguably the most rewarding for travellers who can spare the days for sand seas and silence.`,
      `La cadena de oasis habitados al oeste del Nilo: la parte menos visitada de Egipto y, posiblemente, la más gratificante para quienes pueden dedicar los días que piden los mares de arena y el silencio.`,
      `ナイル川の西に連なる、人の住むオアシス群。エジプトで最も訪れる人の少ない地域でありながら、砂の海と静寂のために日数を割ける旅行者には、おそらく最も報われる場所だ。`,
    ],
  },
  {
    key: 'middle-egypt',
    name: ['Middle Egypt', 'El Egipto Medio', '中エジプト'],
    lede: [
      `The Nile Valley between Cairo and Luxor, mostly skipped by international itineraries. For serious Egyptophiles willing to spend a few extra days on a valley tourism hasn’t reshaped.`,
      `El valle del Nilo entre El Cairo y Luxor, que los itinerarios internacionales suelen saltarse. Para egiptófilos serios dispuestos a dedicar unos días de más a un valle que el turismo no ha remodelado.`,
      `カイロとルクソールの間に広がるナイル渓谷で、国際的な行程ではたいてい飛ばされる。観光に作り変えられていないこの渓谷に、あえて数日を費やす本気のエジプト愛好家のための土地だ。`,
    ],
  },
];

const guideManifesto: Array<{ bold: Tri; text: Tri }> = [
  {
    bold: [
      `It won’t call every city magical.`,
      `No llamará mágica a cada ciudad.`,
      `どの街も「魅力的」だとは言わない。`,
    ],
    text: [
      `Some are practical waypoints, and the guide says so.`,
      `Algunas son simples puntos de paso, y la guía lo dice.`,
      `単なる通過点に過ぎない街もある。ガイドはそれをそのまま記す。`,
    ],
  },
  {
    bold: [
      `It won’t sell “hidden gems” vaguely.`,
      `No venderá “joyas ocultas” de forma vaga.`,
      `「隠れた名所」を曖昧に売り込まない。`,
    ],
    text: [
      `Hidden from whom? A site quiet in international tourism may be packed with Egyptians. We’re explicit about which.`,
      `¿Ocultas para quién? Un lugar tranquilo para el turismo internacional puede estar lleno de egipcios. Lo decimos con claridad en cada caso.`,
      `誰にとって隠れているのか。国際観光では静かな場所も、エジプト人で賑わっていることがある。どちらなのかを、はっきり示す。`,
    ],
  },
  {
    bold: [
      `It won’t pad with filler.`,
      `No rellenará con paja.`,
      `埋め草で水増ししない。`,
    ],
    text: [
      `Every city page tells you what it is, what’s worth your time, how long to stay, and how to get there — in operator’s voice, not the tourism-board version.`,
      `Cada página de ciudad te dice qué es, qué merece tu tiempo, cuánto quedarte y cómo llegar, con la voz de quien opera viajes, no la versión de la oficina de turismo.`,
      `どの都市のページも、そこが何なのか、何に時間をかける価値があるか、どれだけ滞在すべきか、どう行くかを伝える——観光局の言い回しではなく、運営者の声で。`,
    ],
  },
  {
    bold: [
      `It won’t push paid placements.`,
      `No empujará recomendaciones pagadas.`,
      `有料の掲載枠を押し付けない。`,
    ],
    text: [
      `The recommendations are where we actually book travellers and where we send ourselves.`,
      `Las recomendaciones son los lugares donde de verdad reservamos a nuestros viajeros y adonde vamos nosotros mismos.`,
      `ここで挙げる推奨は、実際に旅行者を手配し、自分たち自身も足を運ぶ場所だ。`,
    ],
  },
];

// ── cities ────────────────────────────────────────────────────
// Each: dek/honest = Text; bestFor/time/tierLabel = String. tierLabel null skipped.
interface CityRow {
  dek: Tri; bestFor: Tri; time: Tri; honest: Tri; tierLabel?: Tri;
}
const CITIES: Record<string, CityRow> = {
  'abu-simbel': {
    dek: [`Ramesses’ colossi, moved stone by stone above the lake — a day-flight south of Aswan.`,
      `Los colosos de Ramsés, trasladados piedra a piedra por encima del lago, a un vuelo de un día al sur de Asuán.`,
      `湖の上へ石を一つずつ移して残されたラムセスの巨像。アスワンから日帰りの空路で南へ。`],
    bestFor: [`Ramses II, Lake Nasser, monumental scale`, `Ramsés II, el lago Nasser, la escala monumental`, `ラムセス2世、ナセル湖、圧倒的な規模`],
    time: [`one long day, by flight`, `un día largo, en avión`, `空路で丸一日`],
    honest: [`The journey is half the experience.`, `El trayecto es la mitad de la experiencia.`, `道のりそのものが体験の半分だ。`],
  },
  'akhmim': {
    dek: [`A weaving town near Sohag, with a colossal Ramesside statue few travellers see.`,
      `Una ciudad textil cerca de Sohag, con una estatua ramésida colosal que pocos viajeros ven.`,
      `ソハーグ近くの織物の町。訪れる人の少ない、ラムセス朝の巨像が残る。`],
    bestFor: [`the Ramesside colossus, textile workshops`, `el coloso ramésida, los talleres textiles`, `ラムセス朝の巨像、織物工房`],
    time: [`a half-day from Sohag`, `medio día desde Sohag`, `ソハーグから半日`],
    honest: [`An add-on to Sohag, not a base.`, `Un complemento a Sohag, no una base.`, `ソハーグの付け足しであって、拠点ではない。`],
  },
  'al-arish': {
    dek: [`The North Sinai capital on the Mediterranean — currently off the travel map.`,
      `La capital del norte del Sinaí, en el Mediterráneo, hoy fuera del mapa turístico.`,
      `地中海に面した北シナイの中心都市。現在は旅の地図の外にある。`],
    bestFor: [`—`, `—`, `—`],
    time: [`—`, `—`, `—`],
    honest: [`Not currently advised for visitors.`, `No se recomienda actualmente para visitantes.`, `現在、訪問は勧められない。`],
  },
  'al-gouna': {
    dek: [`A built-from-scratch lagoon town — the Red Sea at its most polished.`,
      `Una ciudad-laguna construida de cero: el mar Rojo en su versión más pulida.`,
      `ゼロから造られたラグーンの町。最も洗練された姿の紅海だ。`],
    bestFor: [`a calm, polished base`, `una base tranquila y cuidada`, `落ち着いた、洗練された拠点`],
    time: [`three nights or more`, `tres noches o más`, `三泊以上`],
    honest: [`Quieter and pricier than Hurghada.`, `Más tranquila y más cara que Hurgada.`, `ハルガダより静かで、値も張る。`],
    tierLabel: [`For the right traveller`, `Para el viajero adecuado`, `人を選ぶ`],
  },
  'al-minya': {
    dek: [`The base for Beni Hasan and Tell el-Amarna — Akhenaten’s lost capital, at your own pace.`,
      `La base para Beni Hasan y Tell el-Amarna, la capital perdida de Akenatón, a tu propio ritmo.`,
      `ベニ・ハサンとテル・エル・アマルナ——アクエンアテンの失われた都——への拠点。自分のペースで巡れる。`],
    bestFor: [`Beni Hasan, Amarna, the unreshaped valley`, `Beni Hasan, Amarna, el valle sin remodelar`, `ベニ・ハサン、アマルナ、手つかずの渓谷`],
    time: [`two nights`, `dos noches`, `二泊`],
    honest: [`For travellers with time and a real reason.`, `Para viajeros con tiempo y un motivo real.`, `時間と確かな目的のある旅行者向け。`],
    tierLabel: [`For Egyptophiles`, `Para egiptófilos`, `エジプト学好きに`],
  },
  'al-quseir': {
    dek: [`An old Red Sea port with a Roman past and an Ottoman fort, between the big resorts.`,
      `Un viejo puerto del mar Rojo con pasado romano y un fuerte otomano, entre los grandes resorts.`,
      `大型リゾートの合間にある、紅海の古い港町。ローマの歴史とオスマンの要塞を持つ。`],
    bestFor: [`the Ottoman fort, the old harbour`, `el fuerte otomano, el viejo puerto`, `オスマンの要塞、古い港`],
    time: [`a night, or a stop`, `una noche, o una parada`, `一泊、あるいは立ち寄り`],
    honest: [`For history between dives, not the reefs alone.`, `Para la historia entre inmersiones, no solo por los arrecifes.`, `ダイビングの合間の歴史のために。サンゴ礁だけが目的なら違う。`],
  },
  'alexandria': {
    dek: [`Not pharaonic and not trying to be — a faded Mediterranean capital of libraries, corniche cafés and Greco-Roman remains. The antidote to a trip spent entirely among temples.`,
      `Ni faraónica ni con ganas de serlo: una desvaída capital mediterránea de bibliotecas, cafés en la corniche y restos grecorromanos. El antídoto a un viaje pasado por completo entre templos.`,
      `ファラオの街ではないし、そうあろうともしていない。図書館と海沿いのカフェ、ギリシア・ローマの遺構を持つ、色あせた地中海の都。神殿ばかりの旅への解毒剤だ。`],
    bestFor: [`Greco-Roman history, sea air, café afternoons`, `historia grecorromana, aire de mar, tardes de café`, `ギリシア・ローマの歴史、潮風、カフェの午後`],
    time: [`full day or an overnight`, `un día entero o una noche`, `丸一日、あるいは一泊`],
    honest: [`A complement to Luxor and Aswan, never a substitute.`, `Un complemento a Luxor y Asuán, nunca un sustituto.`, `ルクソールやアスワンの補完であって、代わりにはならない。`],
  },
  'aswan': {
    dek: [`Egypt’s gentlest city, where the Nile changes character and Nubia begins.`,
      `La ciudad más apacible de Egipto, donde el Nilo cambia de carácter y empieza Nubia.`,
      `エジプトで最も穏やかな街。ここでナイルは表情を変え、ヌビアが始まる。`],
    bestFor: [`Philae, feluccas, Nubian culture`, `Filé, las falúas, la cultura nubia`, `フィラエ、ファルーカ、ヌビアの文化`],
    time: [`two nights`, `dos noches`, `二泊`],
    honest: [`The south’s slow pace is the point — don’t rush it.`, `El ritmo lento del sur es lo que importa: no lo apresures.`, `南部のゆったりした時間こそが眼目だ。急いではいけない。`],
  },
  'asyut': {
    dek: [`A practical stop on the long valley road — a waypoint, not a destination.`,
      `Una parada práctica en la larga carretera del valle: un punto de paso, no un destino.`,
      `長い渓谷の道沿いの実用的な立ち寄り先。通過点であって、目的地ではない。`],
    bestFor: [`breaking the valley drive`, `partir el trayecto por el valle`, `渓谷のドライブの区切り`],
    time: [`a waypoint`, `un punto de paso`, `通過点`],
    honest: [`Functional, not a destination.`, `Funcional, no un destino.`, `機能的ではあるが、目的地ではない。`],
    tierLabel: [`Waypoint`, `Punto de paso`, `通過点`],
  },
  'bahariya-oasis': {
    dek: [`The closest oasis to Cairo and the gateway to the white chalk formations of the open desert — the classic overnight under the stars.`,
      `El oasis más cercano a El Cairo y la puerta a las formaciones de tiza blanca del desierto abierto: el clásico vivac bajo las estrellas.`,
      `カイロに最も近いオアシスであり、開けた砂漠の白い石灰岩群への入口。星空の下での定番の一泊だ。`],
    bestFor: [`the white formations, a night in the desert`, `las formaciones blancas, una noche en el desierto`, `白い岩層、砂漠での一夜`],
    time: [`two days from Cairo`, `dos días desde El Cairo`, `カイロから二日`],
    honest: [`The overnight is the point, not the town.`, `Lo que importa es el vivac, no el pueblo.`, `眼目は野営であって、町ではない。`],
    tierLabel: [`For sand & silence`, `Para arena y silencio`, `砂と静寂を求めて`],
  },
  'baris': {
    dek: [`A small oasis south of Kharga, at the desert’s far edge.`,
      `Un pequeño oasis al sur de Jarga, en el confín del desierto.`,
      `ハルガの南、砂漠の最果てにある小さなオアシス。`],
    bestFor: [`true remoteness, the road south`, `el aislamiento real, la carretera al sur`, `真の僻遠、南へ続く道`],
    time: [`a stop on the Kharga loop`, `una parada en el circuito de Jarga`, `ハルガ周遊の途中の立ち寄り`],
    honest: [`For desert completists only.`, `Solo para completistas del desierto.`, `砂漠を極めたい人だけに。`],
  },
  'beni-suef': {
    dek: [`The valley’s northern gateway, with Meidum’s collapsed pyramid nearby and almost no tourism.`,
      `La puerta norte del valle, con la pirámide derrumbada de Meidum cerca y casi nada de turismo.`,
      `渓谷の北の入口。近くに崩れたメイドゥムのピラミッドがあり、観光客はほとんどいない。`],
    bestFor: [`Meidum’s pyramid, the valley gateway`, `la pirámide de Meidum, la puerta del valle`, `メイドゥムのピラミッド、渓谷の入口`],
    time: [`a stop`, `una parada`, `立ち寄り`],
    honest: [`Thin on tourism — for the determined.`, `Escaso en turismo: para los decididos.`, `観光基盤は薄い。意志の固い人向け。`],
    tierLabel: [`For Egyptophiles`, `Para egiptófilos`, `エジプト学好きに`],
  },
  'cairo': {
    dek: [`Where nearly every trip begins — and the city most travellers shortchange. The Egyptian Museum, Islamic and Coptic Cairo, the markets. Three days, minimum, before you’ve really seen it.`,
      `Donde empieza casi todo viaje, y la ciudad a la que más viajeros escatiman tiempo. El Museo Egipcio, el Cairo islámico y copto, los mercados. Tres días, como mínimo, para verla de verdad.`,
      `ほぼすべての旅がここから始まる——そして、多くの旅行者が時間を惜しんでしまう街。エジプト考古学博物館、イスラム・コプトのカイロ、市場。本当に見て回るには、最低でも三日はいる。`],
    bestFor: [`the Museum, Islamic & Coptic Cairo, first arrival`, `el Museo, el Cairo islámico y copto, la primera llegada`, `博物館、イスラム・コプトのカイロ、最初の到着`],
    time: [`three days, minimum`, `tres días, como mínimo`, `最低でも三日`],
    honest: [`Don’t compress it into a single pyramid day.`, `No la comprimas en un único día de pirámides.`, `ピラミッド一日で済ませてはいけない。`],
  },
  'dahab': {
    dek: [`Where Sinai slows down — a backpacker-grown dive town, not a resort.`,
      `Donde el Sinaí baja el ritmo: un pueblo de buceo crecido a partir de la mochila, no un resort.`,
      `シナイがゆっくりと流れる場所。リゾートではなく、バックパッカーから育ったダイビングの町だ。`],
    bestFor: [`relaxed diving, the Blue Hole, freediving`, `buceo relajado, el Blue Hole, apnea`, `のんびりしたダイビング、ブルーホール、フリーダイビング`],
    time: [`three nights or more`, `tres noches o más`, `三泊以上`],
    honest: [`A town, not a resort — that’s the appeal.`, `Un pueblo, no un resort: ahí está el encanto.`, `リゾートではなく町であること。そこが魅力だ。`],
    tierLabel: [`For divers`, `Para buceadores`, `ダイバー向け`],
  },
  'dakhla-oasis': {
    dek: [`Mudbrick villages and hot springs, deep in the sand sea.`,
      `Aldeas de adobe y manantiales termales, en lo hondo del mar de arena.`,
      `砂の海の奥深くにある、日干し煉瓦の集落と温泉。`],
    bestFor: [`old Islamic towns, springs, quiet`, `viejos pueblos islámicos, manantiales, calma`, `古いイスラムの町、泉、静けさ`],
    time: [`two nights`, `dos noches`, `二泊`],
    honest: [`A long way in — go slow or don’t go.`, `Está muy adentro: ve despacio o no vayas.`, `たどり着くのに遠い。ゆっくり行けないなら、行かないほうがいい。`],
    tierLabel: [`Deep cut`, `Solo para iniciados`, `上級者向け`],
  },
  'edfu': {
    dek: [`The Temple of Horus, the most complete in Egypt — a standard cruise mooring between the cities.`,
      `El templo de Horus, el más completo de Egipto: un amarre habitual de los cruceros entre las ciudades.`,
      `エジプトで最も完全な姿を保つホルス神殿。都市間のクルーズが立ち寄る定番の停泊地だ。`],
    bestFor: [`the Temple of Horus, the most complete in Egypt`, `el templo de Horus, el más completo de Egipto`, `ホルス神殿、エジプト随一の保存状態`],
    time: [`a morning`, `una mañana`, `半日（午前）`],
    honest: [`Best seen as a cruise stop, not a standalone detour.`, `Mejor verlo como parada de crucero, no como desvío en sí.`, `単独の寄り道より、クルーズの一停泊として見るのがいい。`],
    tierLabel: [`On the cruise`, `En el crucero`, `クルーズ途中に`],
  },
  'esna': {
    dek: [`A small, vividly painted temple below the modern street — and the cruise lock.`,
      `Un templo pequeño de colores vivos bajo el nivel de la calle moderna, y la esclusa de los cruceros.`,
      `現代の街路の下に沈む、鮮やかな彩色の小神殿。そしてクルーズの水門がある。`],
    bestFor: [`recently cleaned colour, the lock crossing`, `el color recién limpiado, el paso por la esclusa`, `近年清掃された彩色、水門の通過`],
    time: [`an hour`, `una hora`, `一時間`],
    honest: [`Worth it mainly if you’re already sailing.`, `Vale la pena sobre todo si ya navegas.`, `すでにクルーズ中なら立ち寄る価値がある、という程度。`],
    tierLabel: [`On the cruise`, `En el crucero`, `クルーズ途中に`],
  },
  'farafra-oasis': {
    dek: [`The slowest oasis pace, on the edge of the White Desert.`,
      `El ritmo de oasis más lento, en el borde del Desierto Blanco.`,
      `白砂漠の縁にある、オアシスで最ものんびりした時間。`],
    bestFor: [`White Desert access, oasis stillness`, `acceso al Desierto Blanco, quietud de oasis`, `白砂漠への入口、オアシスの静寂`],
    time: [`a night`, `una noche`, `一泊`],
    honest: [`A stop on the desert loop, not a destination alone.`, `Una parada del circuito por el desierto, no un destino en sí.`, `砂漠周遊の途中の一泊であって、単独の目的地ではない。`],
    tierLabel: [`Deep cut`, `Solo para iniciados`, `上級者向け`],
  },
  'giza': {
    dek: [`The Pyramids and the Sphinx, on the desert edge the city has grown up to meet.`,
      `Las pirámides y la Esfinge, en el borde del desierto al que la ciudad ha llegado creciendo.`,
      `ピラミッドとスフィンクス。街が育って届いた砂漠の縁に立つ。`],
    bestFor: [`the Pyramids, the Sphinx, the Grand Egyptian Museum`, `las pirámides, la Esfinge, el Gran Museo Egipcio`, `ピラミッド、スフィンクス、大エジプト博物館`],
    time: [`half to full day`, `de medio día a un día entero`, `半日〜丸一日`],
    honest: [`Budget for the traffic, not just the plateau.`, `Cuenta con el tráfico, no solo con la meseta.`, `見込むべきは台地だけでなく、渋滞の時間も。`],
  },
  'hurghada': {
    dek: [`The Red Sea’s workhorse — the most reefs, the easiest logistics, the shortest transfer. Not pretty, but it works, and the diving is the point.`,
      `El caballo de batalla del mar Rojo: más arrecifes, la logística más fácil, el traslado más corto. No es bonita, pero funciona, y lo que importa es el buceo.`,
      `紅海の働き者——サンゴ礁が最も多く、手配が最も楽で、移動が最も短い。美しくはないが、役に立つ。眼目はダイビングだ。`],
    bestFor: [`reliable reefs, easy flights, families`, `arrecifes fiables, vuelos cómodos, familias`, `安定したサンゴ礁、便利な空路、家族連れ`],
    time: [`three nights or more to dive`, `tres noches o más para bucear`, `ダイビングなら三泊以上`],
    honest: [`Functional, not beautiful — you’re here for the water.`, `Funcional, no bonita: vienes por el agua.`, `美しさではなく機能。来る理由は海の中にある。`],
    tierLabel: [`For the right traveller`, `Para el viajero adecuado`, `人を選ぶ`],
  },
  'ismailia': {
    dek: [`The canal’s mid-point on Lake Timsah — a Canal city, for specific interest, not a first trip.`,
      `El punto medio del canal, junto al lago Timsah: una ciudad del Canal, para un interés concreto, no para un primer viaje.`,
      `ティムサ湖に面した運河の中間点。運河の街であり、特定の関心のためのもの。初めての旅向きではない。`],
    bestFor: [`Canal history, lakeside calm`, `historia del Canal, calma junto al lago`, `運河の歴史、湖畔の静けさ`],
    time: [`a stop`, `una parada`, `立ち寄り`],
    honest: [`Interest-led only — not a first-trip stop.`, `Solo por interés concreto: no es parada de primer viaje.`, `関心がある人だけに。初旅の立ち寄り先ではない。`],
    tierLabel: [`Skip unless`, `Solo por interés`, `関心があれば`],
  },
  'kharga-oasis': {
    dek: [`The southern oasis, with Roman temples almost no traveller reaches.`,
      `El oasis del sur, con templos romanos a los que casi ningún viajero llega.`,
      `南のオアシス。ほとんど誰もたどり着かないローマ時代の神殿が残る。`],
    bestFor: [`Roman desert temples, true remoteness`, `templos romanos del desierto, aislamiento real`, `砂漠のローマ神殿、真の僻遠`],
    time: [`a night`, `una noche`, `一泊`],
    honest: [`For desert completists only.`, `Solo para completistas del desierto.`, `砂漠を極めたい人だけに。`],
    tierLabel: [`Deep cut`, `Solo para iniciados`, `上級者向け`],
  },
  'kom-ombo': {
    dek: [`The double temple on the river bend the cruises moor for, north of Aswan.`,
      `El templo doble en el recodo del río donde amarran los cruceros, al norte de Asuán.`,
      `アスワンの北、川の湾曲部に立つ二重神殿。クルーズが停泊する。`],
    bestFor: [`the double temple on the river bend`, `el templo doble en el recodo del río`, `川の湾曲部の二重神殿`],
    time: [`an afternoon`, `una tarde`, `半日（午後）`],
    honest: [`A cruise mooring, not a detour.`, `Un amarre de crucero, no un desvío.`, `クルーズの停泊地であって、寄り道ではない。`],
    tierLabel: [`On the cruise`, `En el crucero`, `クルーズ途中に`],
  },
  'luxor': {
    dek: [`The greatest open-air museum there is — Karnak and Luxor temple on the east bank, the Valley of the Kings on the west. Two full days only scratches it.`,
      `El mayor museo al aire libre que existe: Karnak y el templo de Luxor en la orilla este, el Valle de los Reyes en la oeste. Dos días enteros apenas lo rozan.`,
      `世界最大の野外博物館——東岸にカルナックとルクソール神殿、西岸に王家の谷。丸二日でも、ほんの表面に触れるだけだ。`],
    bestFor: [`Karnak, the royal tombs, Egyptology`, `Karnak, las tumbas reales, la egiptología`, `カルナック、王墓、エジプト学`],
    time: [`two nights, ideally three`, `dos noches, idealmente tres`, `二泊、できれば三泊`],
    honest: [`The west bank needs an unhurried morning, not a dash.`, `La orilla oeste pide una mañana sin prisa, no una carrera.`, `西岸には急がない午前が要る。駆け足では足りない。`],
  },
  'marsa-alam': {
    dek: [`The wilder south — the reefs people fly past Hurghada for.`,
      `El sur más salvaje: los arrecifes por los que la gente pasa de largo Hurgada.`,
      `より野性的な南——人々がハルガダを素通りしてまで目指すサンゴ礁だ。`],
    bestFor: [`house reefs, dugongs, fewer crowds`, `arrecifes de casa, dugongos, menos gente`, `ハウスリーフ、ジュゴン、少ない人出`],
    time: [`four nights or more`, `cuatro noches o más`, `四泊以上`],
    honest: [`Longer transfer in — worth it for divers.`, `El traslado es más largo: vale la pena para buceadores.`, `移動は長い。ダイバーには、その価値がある。`],
    tierLabel: [`For divers`, `Para buceadores`, `ダイバー向け`],
  },
  'marsa-matruh': {
    dek: [`Summer beach for domestic travellers — skip unless that’s your season.`,
      `Playa de verano para el viajero nacional: sáltala salvo que sea tu temporada.`,
      `国内客向けの夏のビーチ。その季節を狙うのでなければ、見送っていい。`],
    bestFor: [`summer swimming`, `baños de verano`, `夏の海水浴`],
    time: [`a few days in season`, `unos días en temporada`, `シーズン中に数日`],
    honest: [`Skip outside high summer.`, `Sáltala fuera del pleno verano.`, `盛夏以外は見送りでいい。`],
    tierLabel: [`Skip unless`, `Solo por interés`, `関心があれば`],
  },
  'nuweiba': {
    dek: [`The far coast toward the border — empty beaches, little else.`,
      `La costa lejana hacia la frontera: playas vacías y poco más.`,
      `国境へと向かう遠い海岸——人気のないビーチ、それ以外はほとんどない。`],
    bestFor: [`solitude, simple beach camps`, `soledad, campamentos sencillos de playa`, `静けさ、素朴なビーチキャンプ`],
    time: [`a quiet few days`, `unos días tranquilos`, `静かな数日`],
    honest: [`Little beyond the shore — that’s deliberate.`, `Poco más allá de la orilla, y es a propósito.`, `浜辺の先には、ほとんど何もない——それは意図されたものだ。`],
    tierLabel: [`Quieter still`, `Aún más tranquilo`, `さらに静か`],
  },
  'port-said': {
    dek: [`Canal-city Egypt at the Mediterranean mouth — for maritime or modern-history interest only.`,
      `El Egipto de las ciudades del Canal en la desembocadura mediterránea: solo por interés marítimo o de historia moderna.`,
      `地中海側の運河都市のエジプト——海事や近代史に関心がある人だけに。`],
    bestFor: [`Canal history, maritime interest`, `historia del Canal, interés marítimo`, `運河の歴史、海事への関心`],
    time: [`a stop`, `una parada`, `立ち寄り`],
    honest: [`Interest-led only — not a first-trip stop.`, `Solo por interés concreto: no es parada de primer viaje.`, `関心がある人だけに。初旅の立ち寄り先ではない。`],
    tierLabel: [`Skip unless`, `Solo por interés`, `関心があれば`],
  },
  'qena': {
    dek: [`The base for Dendera — the best-preserved temple ceiling in Egypt, and far quieter than Luxor.`,
      `La base para Dendera: el techo de templo mejor conservado de Egipto, y mucho más tranquilo que Luxor.`,
      `デンデラへの拠点——エジプトで最も保存のよい神殿の天井があり、ルクソールよりはるかに静かだ。`],
    bestFor: [`the painted ceiling, Hathor’s temple at Dendera`, `el techo pintado, el templo de Hathor en Dendera`, `彩色天井、デンデラのハトホル神殿`],
    time: [`half day from Luxor`, `medio día desde Luxor`, `ルクソールから半日`],
    honest: [`Go early; you may have it nearly to yourself.`, `Ve temprano: puede que lo tengas casi para ti.`, `早めに行けば、ほぼ独り占めできるかもしれない。`],
    tierLabel: [`Worth it`, `Vale la pena`, `価値あり`],
  },
  'ras-sudr': {
    dek: [`A windsurf-and-spa stretch on the Gulf of Suez — the closest beach to Cairo.`,
      `Un tramo de windsurf y spa en el golfo de Suez: la playa más cercana a El Cairo.`,
      `スエズ湾沿いの、ウインドサーフィンとスパの一帯。カイロから最も近いビーチだ。`],
    bestFor: [`kitesurfing, weekend escapes from Cairo`, `kitesurf, escapadas de fin de semana desde El Cairo`, `カイトサーフィン、カイロからの週末の逃避`],
    time: [`a weekend`, `un fin de semana`, `週末`],
    honest: [`A domestic getaway, not a destination.`, `Una escapada nacional, no un destino.`, `国内向けの息抜きであって、目的地ではない。`],
  },
  'rosetta-rasheed': {
    dek: [`Where the Nile meets the sea and Ottoman merchant houses still stand — the stone’s hometown.`,
      `Donde el Nilo se encuentra con el mar y siguen en pie las casas de mercaderes otomanos: la cuna de la piedra.`,
      `ナイルが海と出会い、オスマン商人の館が今も残る町——あの石碑の故郷だ。`],
    bestFor: [`Ottoman architecture, the river mouth`, `arquitectura otomana, la desembocadura del río`, `オスマン建築、河口`],
    time: [`half day from Alexandria`, `medio día desde Alejandría`, `アレクサンドリアから半日`],
    honest: [`A detour for the curious, not a must.`, `Un desvío para los curiosos, no una visita obligada.`, `好奇心のある人のための寄り道。必訪ではない。`],
    tierLabel: [`Worth it`, `Vale la pena`, `価値あり`],
  },
  'safaga': {
    dek: [`Low-key, kite-able, and the port for the deep southern dive sites.`,
      `Discreta, apta para el kite y puerto de salida para los puntos de buceo del extremo sur.`,
      `控えめで、カイトに向き、南の深場のダイビングポイントへの港でもある。`],
    bestFor: [`quiet diving, kitesurfing`, `buceo tranquilo, kitesurf`, `静かなダイビング、カイトサーフィン`],
    time: [`three nights or more`, `tres noches o más`, `三泊以上`],
    honest: [`Low-key by design — bring your own pace.`, `Discreta a propósito: trae tu propio ritmo.`, `あえて控えめな町。自分のペースを持ち込んで。`],
    tierLabel: [`Quieter`, `Más tranquilo`, `より静か`],
  },
  'saint-catherine': {
    dek: [`The world’s oldest working monastery, at the foot of the mountain you climb before dawn.`,
      `El monasterio en activo más antiguo del mundo, al pie de la montaña que se asciende antes del alba.`,
      `世界最古の現役修道院。夜明け前に登る山の麓に立つ。`],
    bestFor: [`the monastery, the pre-dawn summit`, `el monasterio, la cumbre antes del alba`, `修道院、夜明け前の山頂`],
    time: [`an overnight`, `una noche`, `一泊`],
    honest: [`The climb is a 2am start, not a stroll.`, `La subida empieza a las 2 de la madrugada; no es un paseo.`, `登山は午前2時出発。散歩ではない。`],
    tierLabel: [`For pilgrims & trekkers`, `Para peregrinos y montañeros`, `巡礼者・登山者に`],
  },
  'sharm-el-sheikh': {
    dek: [`Sinai’s dive capital and the easiest base for the reefs of Ras Mohammed and Tiran — and the launch point for the desert interior behind it.`,
      `La capital del buceo del Sinaí y la base más fácil para los arrecifes de Ras Mohammed y Tirán, y el punto de partida hacia el interior desértico que tiene detrás.`,
      `シナイのダイビングの中心地で、ラス・ムハンマドとティラン島のサンゴ礁への最も楽な拠点。背後の砂漠内陸への出発点でもある。`],
    bestFor: [`Ras Mohammed & Tiran reefs, desert access`, `los arrecifes de Ras Mohammed y Tirán, acceso al desierto`, `ラス・ムハンマドとティランのサンゴ礁、砂漠への入口`],
    time: [`three nights or more`, `tres noches o más`, `三泊以上`],
    honest: [`A resort town — go for the water and the interior, not the strip.`, `Una ciudad de resort: ve por el agua y el interior, no por el paseo de bares.`, `リゾートの町。目当ては海と内陸であって、繁華街ではない。`],
    tierLabel: [`For the right traveller`, `Para el viajero adecuado`, `人を選ぶ`],
  },
  'sohag': {
    dek: [`The base for Abydos — Seti I’s temple and the holiest ground of the Osiris cult.`,
      `La base para Abidos: el templo de Seti I y el suelo más sagrado del culto a Osiris.`,
      `アビドスへの拠点——セティ1世の神殿と、オシリス信仰の最も聖なる地。`],
    bestFor: [`Seti I’s reliefs at Abydos, the Osiris cult`, `los relieves de Seti I en Abidos, el culto a Osiris`, `アビドスのセティ1世の浮彫、オシリス信仰`],
    time: [`a day`, `un día`, `一日`],
    honest: [`One of Egypt’s great temples, rarely crowded.`, `Uno de los grandes templos de Egipto, rara vez concurrido.`, `エジプト屈指の神殿でありながら、混むことはまれだ。`],
    tierLabel: [`For Egyptophiles`, `Para egiptófilos`, `エジプト学好きに`],
  },
  'suez': {
    dek: [`The canal’s southern gate — a working port, for maritime or modern-history interest only.`,
      `La puerta sur del canal: un puerto en activo, solo por interés marítimo o de historia moderna.`,
      `運河の南の門——現役の港であり、海事や近代史に関心がある人だけに。`],
    bestFor: [`Canal history, the port`, `historia del Canal, el puerto`, `運河の歴史、港`],
    time: [`a stop`, `una parada`, `立ち寄り`],
    honest: [`Interest-led only — not a first-trip stop.`, `Solo por interés concreto: no es parada de primer viaje.`, `関心がある人だけに。初旅の立ち寄り先ではない。`],
    tierLabel: [`Skip unless`, `Solo por interés`, `関心があれば`],
  },
  'taba': {
    dek: [`The border crossing and a handful of resorts — for transit or seclusion.`,
      `El paso fronterizo y un puñado de resorts: para tránsito o retiro.`,
      `国境の検問所と、わずかなリゾート——通過か、人目を避けるためか。`],
    bestFor: [`the border crossing, quiet resorts`, `el paso fronterizo, resorts tranquilos`, `国境の通過、静かなリゾート`],
    time: [`a quiet few days`, `unos días tranquilos`, `静かな数日`],
    honest: [`For transit or seclusion, little else.`, `Para tránsito o retiro, poco más.`, `通過か隠遁のため。それ以外はほとんどない。`],
    tierLabel: [`Quieter still`, `Aún más tranquilo`, `さらに静か`],
  },
};

async function main() {
  console.log(`seed-guide-i18n — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`);

  // settings
  const settings = await client.fetch<{ _id: string } | null>(`*[_type=="siteSettings"][0]{_id}`);
  if (!settings?._id) throw new Error('siteSettings not found');
  const waysRaw = await client.fetch<Array<{ _key: string }>>(`*[_type=="siteSettings"][0].guideWays[]{_key}`);
  const regionsRaw = await client.fetch<Array<{ _key: string; key: string }>>(`*[_type=="siteSettings"][0].guideRegions[]{_key,key}`);
  const manifestoRaw = await client.fetch<Array<{ _key: string }>>(`*[_type=="siteSettings"][0].guideManifesto[]{_key}`);

  const setPatch: Record<string, unknown> = {
    guideLead: T(guideLead),
    guideSignoff: T(guideSignoff),
  };
  waysRaw.forEach((w, i) => {
    setPatch[`guideWays[_key=="${w._key}"].title`] = S(guideWays[i].title);
    setPatch[`guideWays[_key=="${w._key}"].body`] = T(guideWays[i].body);
  });
  regionsRaw.forEach((r) => {
    const def = guideRegions.find((g) => g.key === r.key);
    if (!def) { console.warn(`  ! region ${r.key} has no translation`); return; }
    setPatch[`guideRegions[_key=="${r._key}"].name`] = S(def.name);
    setPatch[`guideRegions[_key=="${r._key}"].lede`] = T(def.lede);
  });
  manifestoRaw.forEach((m, i) => {
    setPatch[`guideManifesto[_key=="${m._key}"].bold`] = S(guideManifesto[i].bold);
    setPatch[`guideManifesto[_key=="${m._key}"].text`] = T(guideManifesto[i].text);
  });
  console.log(`settings: guideLead, guideSignoff, ${waysRaw.length} ways, ${regionsRaw.length} regions, ${manifestoRaw.length} manifesto points`);
  if (COMMIT) await client.patch(settings._id, { set: setPatch }).commit({ autoGenerateArrayKeys: false });

  // cities
  let n = 0;
  for (const [slug, row] of Object.entries(CITIES)) {
    const ids = await client.fetch<string[]>(
      `*[_type=="city" && slug[_key=="en"][0].value.current==$slug]._id`, { slug });
    if (!ids.length) { console.warn(`  ! city not found: ${slug}`); continue; }
    const set: Record<string, unknown> = {
      guideDek: T(row.dek),
      guideBestFor: S(row.bestFor),
      guideTime: S(row.time),
      guideHonestNote: T(row.honest),
    };
    if (row.tierLabel) set.guideTierLabel = S(row.tierLabel);
    for (const id of ids) {
      if (COMMIT) await client.patch(id, { set }).commit({ autoGenerateArrayKeys: false });
    }
    n++;
    console.log(`  ${COMMIT ? '✓' : '·'} ${slug}${row.tierLabel ? ' (+tierLabel)' : ''}`);
  }
  console.log(`\n${n} cities ${COMMIT ? 'patched' : 'previewed'}. ${COMMIT ? 'DONE.' : 'Re-run with --commit to write.'}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
