/**
 * Apply owner-approved concierge notes (EN/ES/JA) to the 18 group day tours
 * (owner: "apply all", 2026-07-22; drafts reviewed in chat; #18 reworded per
 * owner correction — no Safaga group departures exist, it's a Hurghada tour).
 *   npx tsx scripts/group-tours-concierge-notes.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: 'production',
  apiVersion: '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'raw',
});

type Tri = { en: string; es: string; ja: string };

const NOTES: Record<string, Tri> = {
  'abu-simbel-temples-day-tour-from-aswan': {
    en: "The drive is the price of the wonder — three hours each way along Lake Nasser. If your party would rather fly, or pair the temples with Philae and the High Dam on the day after, tell our concierge and we'll shape the Aswan days around it.",
    es: 'La carretera es el precio del prodigio: tres horas por la orilla del lago Nasser en cada sentido. Si tu grupo prefiere volar, o unir los templos con Filae y la Presa Alta al día siguiente, díselo a nuestro concierge y daremos forma a los días de Asuán.',
    ja: 'この感動には道のりという代価があります——ナセル湖沿いを片道約3時間。飛行機での訪問をご希望の場合も、翌日にフィラエ神殿とハイダムを組み合わせたい場合も、コンシェルジュにお知らせください。アスワンの数日を最適な形に整えます。',
  },
  'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo': {
    en: "One day shows you ancient Alexandria; the city keeps more — the fortress, the new Library, a fish lunch by the harbour. If the shared day whets your appetite, we can build a private return, or an overnight, around what you wished you'd had time for.",
    es: 'Un día enseña la Alejandría antigua; la ciudad guarda más — la fortaleza, la nueva Biblioteca, un almuerzo de pescado junto al puerto. Si el día compartido te abre el apetito, construimos un regreso privado, o una noche, alrededor de lo que te faltó.',
    ja: '一日で見えるのは古代のアレクサンドリア。街にはまだ先があります——要塞、新しい図書館、港沿いの魚料理の昼食。乗合の一日で興が乗ったら、心残りを軸にプライベートの再訪や一泊の行程をお作りします。',
  },
  'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor': {
    en: "This day is also a one-way bridge: it ends in Aswan, so it pairs naturally with Philae and Abu Simbel on the days after. Tell our concierge where you're staying on each side and we'll join the days up — luggage included.",
    es: 'Este día es también un puente de ida: termina en Asuán, así que casa de forma natural con Filae y Abu Simbel en los días siguientes. Dinos dónde te alojas a cada lado y uniremos los días — equipaje incluido.',
    ja: 'この一日は片道の橋でもあります。終点はアスワン——翌日以降のフィラエ神殿やアブシンベルと自然につながります。両側のご宿泊先をお知らせください。お荷物ごと、日程をつなぎます。',
  },
  'fayoum-meidum-hawara-pyramids-group-day-tour': {
    en: "Fayoum runs quieter than the pyramid canon — that is its point. If Wadi El-Rayan's dunes, the fossil whales of Wadi Al-Hitan, or a longer stop for birdlife tempt you, say so — the private version reaches further into the desert.",
    es: 'Fayum es más silencioso que el canon de las pirámides — ahí está su gracia. Si te tientan las dunas de Wadi El-Rayan, las ballenas fósiles de Wadi Al-Hitan o una parada larga para las aves, dilo: la versión privada llega más lejos en el desierto.',
    ja: 'ファイユームの持ち味は、ピラミッドの定番より静かなこと。ワディ・エル・ラヤンの砂丘、ワディ・アル・ヒタンのクジラ化石、鳥を見るための長めの停車がお好みなら、ぜひご相談を——プライベート版なら砂漠のさらに奥まで行けます。',
  },
  'grand-west-bank-group-day-tour-luxor': {
    en: "Three tombs are the day's ration; the valley holds more. If you want the extra-ticket tombs — Seti I, Ramses VI — a dawn balloon before the vans roll, or the same ground at a private pace, our concierge will build it into the morning.",
    es: 'Tres tumbas son la ración del día; el valle guarda más. Si quieres las tumbas de entrada especial — Seti I, Ramsés VI —, un globo al amanecer antes de que salgan los vehículos, o el mismo terreno a ritmo privado, nuestro concierge lo integra en la mañana.',
    ja: 'この日の持ち分は墓三つ。谷にはまだ先があります。特別券の墓（セティ1世、ラムセス6世）、車が動き出す前の夜明けの気球、同じ行程をプライベートの歩調で——ご希望はコンシェルジュが朝の行程に組み込みます。',
  },
  'memphis-saqqara-and-dahshur-group-day-tour': {
    en: "The natural companion to the Giza morning — many guests run the two on consecutive days for the whole Old Kingdom arc. If you'd rather fold in the Grand Egyptian Museum, or take the same route privately at a slower pace, tell our concierge.",
    es: 'El compañero natural de la mañana de Guiza — muchos viajeros hacen los dos en días consecutivos para el arco completo del Reino Antiguo. Si prefieres sumar el Gran Museo Egipcio, o la misma ruta en privado y más despacio, díselo a nuestro concierge.',
    ja: 'ギザの午前と対をなす一日です。二日続けて回り、古王国の流れを通しでご覧になる方が多くいらっしゃいます。大エジプト博物館を加えたい、同じ道をゆっくり貸切で、というご希望もコンシェルジュへどうぞ。',
  },
  'nubian-temples-day-tour-from-aswan': {
    en: "Aswan's quietest ancient corner — the crossing is short and the crowds stay thin. Pair it with Philae the same afternoon, or ask about lunch in a Nubian village on the way back; our concierge shapes the Aswan day around your pace.",
    es: 'El rincón antiguo más tranquilo de Asuán — el cruce es corto y la multitud, escasa. Únelo con Filae esa misma tarde, o pregunta por un almuerzo en un pueblo nubio al regreso; nuestro concierge da forma al día de Asuán a tu ritmo.',
    ja: 'アスワンで最も静かな古代の一角——渡しは短く、人は少なめです。同じ午後にフィラエ神殿を続けるのも、帰り道にヌビア村での昼食を挟むのもおすすめです。コンシェルジュがあなたの歩調に合わせて一日を整えます。',
  },
  'cairo-by-bus-group-day-tour-from-hurghada': {
    en: 'An honest word first: this is a long day, and the coach hours are most of it. If they daunt you, ask our concierge about the flight version, a private car, or an overnight that turns one demanding day into two easy ones.',
    es: 'Primero, honestidad: es un día largo, y las horas de autocar son la mayor parte. Si te frenan, pregunta a nuestro concierge por la versión en avión, un coche privado o una noche en El Cairo que convierte un día exigente en dos tranquilos.',
    ja: 'まず正直に：長い一日で、その大半はバスの時間です。それが気がかりでしたら、飛行機版、プライベートカー、あるいはカイロ一泊で「きつい一日」を「楽な二日」に変える案を、コンシェルジュにお尋ねください。',
  },
  'dahab-blue-hole-desert-snorkel-group-day-tour-from-sharm': {
    en: 'Snorkellers and non-swimmers ride equally well here — the canyon, the camels, and the Bedouin tea ask nothing of the sea. If Dahab tempts a longer, slower visit — an overnight, a dive course in town — tell our concierge before you go.',
    es: 'Aquí viajan igual de bien quienes hacen esnórquel y quienes no nadan — el cañón, los camellos y el té beduino no piden nada al mar. Si Dahab te tienta para una visita más lenta — una noche, un curso de buceo en el pueblo —, dilo antes de ir.',
    ja: '泳がない方も同じように楽しめる一日です——峡谷もラクダもベドウィンのお茶も、海を必要としません。ダハブの町にもう少し長く（一泊、ダイビング講習など）滞在したいと思ったら、出発前にコンシェルジュへご相談ください。',
  },
  'dendera-and-abydos-temple-day-tour-from-hurghada': {
    en: "The least-crowded great temples in Egypt, and the drive is why. If you're weighing this against the Luxor day, tell our concierge what you've already seen — we'll be honest about which inland day repays your party more.",
    es: 'Los grandes templos menos concurridos de Egipto, y la carretera es la razón. Si dudas entre este día y el de Luxor, cuéntale a nuestro concierge qué has visto ya — te diremos con franqueza cuál de los dos días recompensa más a tu grupo.',
    ja: 'エジプトで最も空いている偉大な神殿群——その理由が、この道のりです。ルクソール日帰りと迷ったら、これまでご覧になった場所をお知らせください。どちらの内陸の一日がより報われるか、率直にお答えします。',
  },
  'dolphin-house-shared-snorkeling-day-from-hurghada': {
    en: 'The dolphins are residents, not performers — sightings are the norm, never a promise. If your party wants the reef with more room, ask about the private charter of the same route, or compare notes with our Giftun day.',
    es: 'Los delfines son residentes, no artistas: verlos es lo habitual, nunca una promesa. Si tu grupo quiere el arrecife con más espacio, pregunta por el chárter privado de la misma ruta, o compárala con nuestro día en Giftún.',
    ja: 'イルカは住人であって、出演者ではありません——出会えるのが常ですが、お約束はできません。より余裕のあるリーフをお望みなら、同じルートの貸切チャーターを。ギフトゥン島の一日との比較もどうぞ。',
  },
  'dolphins-dance-group-shared-seas-full-day-snorkeling-tour': {
    en: 'Two dolphin days sail from Hurghada; this is the fuller one on the water, with three reef stops around the sighting grounds. Not sure which suits your party — or tempted to make it private? Our concierge will match the boat to the day.',
    es: 'De Hurgada zarpan dos días de delfines; éste es el más completo sobre el agua, con tres paradas de arrecife en la zona de avistamiento. ¿No sabes cuál encaja con tu grupo, o te tienta hacerlo privado? Nuestro concierge ajusta el barco al día.',
    ja: 'ハルガダ発のイルカの一日は二種類。こちらは海上時間が長いほうで、生息域周辺のリーフを三か所回ります。どちらがお仲間に合うか迷ったときも、貸切にしたいときも、コンシェルジュが船と一日を合わせます。',
  },
  'giftun-island-shared-snorkeling-day-from-hurghada': {
    en: 'The classic Hurghada sea day — reefs first, then sand. A party that splits between snorkellers and beach-sitters is carried easily here. For a quieter lagoon or a private boat, our concierge knows which mornings run emptiest.',
    es: 'El día de mar clásico de Hurgada — primero arrecifes, luego arena. Un grupo dividido entre esnórquel y playa viaja aquí sin fricción. Para una laguna más tranquila o un barco privado, nuestro concierge sabe qué mañanas van más vacías.',
    ja: 'ハルガダの定番の海の一日——まずリーフ、それから砂浜。シュノーケル派とビーチ派に分かれるグループでも無理なく楽しめます。より静かなラグーンや貸切ボートは、空いている朝をコンシェルジュがご案内します。',
  },
  'jerusalem-dead-sea-bethlehem-group-day-tour-from-sharm': {
    en: "A border day cannot be improvised: we need your passport details a few days ahead, and timings depend on the crossing. Send our concierge your dates early — we'll walk you through the formalities and be honest about whether a day-return suits your party.",
    es: 'Un día de frontera no se improvisa: necesitamos los datos de tu pasaporte con unos días de antelación, y los horarios dependen del paso. Envía tus fechas pronto — te guiamos con los trámites y te diremos con franqueza si el día de ida y vuelta le conviene a tu grupo.',
    ja: '国境越えの一日は即興ではできません。数日前までにパスポート情報が必要で、時間は検問の状況に左右されます。日程は早めにお知らせください——手続きをご案内し、日帰りがお仲間に向くかどうか、率直に申し上げます。',
  },
  'luxor-highlights-group-day-tour-from-hurghada': {
    en: 'Luxor in a day from the coast is a marathon with monuments — worth it, and worth asking whether your party would rather split it. An overnight by the temples turns the same list into two unhurried days; our concierge will price both honestly.',
    es: 'Luxor en un día desde la costa es una maratón con monumentos — vale la pena, y vale preguntar si tu grupo preferiría dividirla. Una noche junto a los templos convierte la misma lista en dos días sin prisa; nuestro concierge te da el precio honesto de ambos.',
    ja: '海岸からのルクソール日帰りは、記念碑つきのマラソンです。価値はあります——そして、二日に分ける価値も。神殿のそばでの一泊は、同じ見どころを急がない二日間に変えます。どちらの費用も正直にご提示します。',
  },
  'mount-sinai-and-st-catherine-full-day-tour-from-sharm': {
    en: "The night ascent is the point, and the price — you trade a night's sleep for the sunrise. Tell our concierge how your party walks: a camel path covers most of the climb, and some nights on the mountain are far quieter than others.",
    es: 'El ascenso nocturno es el sentido — y el precio: cambias una noche de sueño por el amanecer. Cuéntanos cómo camina tu grupo: un sendero de camellos cubre casi toda la subida, y algunas noches la montaña está mucho más tranquila que otras.',
    ja: '夜の登山こそがこの一日の核心で、代価でもあります——ご来光と引き換えに一晩の睡眠を差し出すのです。歩き方をお知らせください。登りの大半はラクダ道でカバーでき、山が静かな夜もあれば、混み合う夜もあります。',
  },
  'mount-sinai-sunrise-trek-group-day-tour': {
    en: "If you're choosing between our two Sinai nights, tell the concierge where you're staying — the pickup differs more than the mountain does. Either way pack warm layers and real shoes, and remember the monastery keeps its own calendar; we check it before we book you.",
    es: 'Si dudas entre nuestras dos noches del Sinaí, dinos dónde te alojas — la recogida cambia más que la montaña. En todo caso: ropa de abrigo, calzado de verdad, y recuerda que el monasterio tiene su propio calendario; lo comprobamos antes de reservarte.',
    ja: '二つのシナイ山ツアーで迷ったら、ご宿泊先をお知らせください——山よりも送迎時間のほうが違います。いずれにせよ防寒着としっかりした靴を。修道院には独自の暦があります——ご予約の前にこちらで確認いたします。',
  },
  // #18 reworded per owner: no Safaga group departures — this is a Hurghada tour.
  'safaga-to-luxor-full-day-group-ancient-city-adventure': {
    en: "One of two Luxor group days we run from Hurghada — the dates and pickup areas differ more than the sights do. Send our concierge your hotel and travel dates and we'll place you on the one that fits, honestly.",
    es: 'Uno de los dos días de Luxor en grupo que operamos desde Hurgada — cambian las fechas y las zonas de recogida más que los monumentos. Envía a nuestro concierge tu hotel y tus fechas y te situaremos en el que encaja, con franqueza.',
    ja: 'ハルガダから催行するルクソールのグループ日帰りは二つ。見どころよりも、催行日と送迎エリアの違いが大きいのです。ご宿泊先と日程をコンシェルジュへ——ふさわしいほうへ、率直にご案内します。',
  },
};

const i18n = (v: Tri) => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: v.en },
  { _key: 'es', _type: 'internationalizedArrayStringValue', value: v.es },
  { _key: 'ja', _type: 'internationalizedArrayStringValue', value: v.ja },
];

async function main() {
  const docs: Array<{ _id: string; slug: string }> = await client.fetch(
    `*[_type == "tour" && type == "dayTour" && tourMode == "group" && !(_id in path("drafts.**"))]{_id, "slug": slug[_key=="en"][0].value.current}`,
  );
  let n = 0;
  for (const d of docs) {
    const note = NOTES[d.slug];
    if (!note) continue; // Giza already has its note
    await client.patch(d._id).set({ conciergeNote: i18n(note) }).commit();
    n += 1;
    console.log(`✓ ${d.slug}`);
  }
  console.log(`\napplied ${n} concierge notes`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
