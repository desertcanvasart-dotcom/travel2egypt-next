/**
 * Bucket 2 of the tour localization fix: add ES + JA summary + body to the 6
 * tours that had EN-only prose. EN is preserved verbatim (with its links); ES/JA
 * bodies mirror the EN block structure (same _key/style/listItem) with clean
 * translated prose (one span per block; internal links omitted in ES/JA for
 * grammatical fidelity).
 *
 *   tsx scripts/localize-prose-tours.ts          # dry run
 *   tsx scripts/localize-prose-tours.ts --apply  # write + publish
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

type Loc = { es: string; ja: string };
type Doc = { summary: Loc; blocks: Record<string, Loc> };

const T: Record<string, Doc> = {
  // aswan-and-abu-simbel-from-luxor
  'wp-page-102370': {
    summary: {
      es: 'Un tour de 2 días desde Luxor a Asuán y Abu Simbel: el Templo de File, el Obelisco Inacabado y la Presa Alta, y al amanecer del segundo día, los colosales templos de Ramsés II en Abu Simbel.',
      ja: 'ルクソール発、アスワンとアブ・シンベルを巡る2日間。フィラエ神殿、未完のオベリスク、アスワン・ハイ・ダムを訪ね、2日目の夜明けにはアブ・シンベルのラムセス2世の巨大神殿へ。',
    },
    blocks: {
      '00000000000c': {
        es: 'Embárquese en el encantador tour de 2 días «El majestuoso trío de Egipto: Asuán y Abu Simbel desde Luxor», donde la historia cobra vida entre la belleza eterna del antiguo Egipto. Su viaje comienza en Luxor, una ciudad impregnada de relatos milenarios, mientras parte hacia el majestuoso Abu Simbel. Pero primero, sumérjase en el esplendor de Asuán, un tesoro de maravillas antiguas que espera ser explorado.',
        ja: '魅惑の2日間ツアー「エジプトの荘厳な三都：ルクソール発、アスワンとアブ・シンベル」へ。古代エジプトの時を超えた美しさの中で、歴史が息づきます。旅は、幾千年もの物語が息づく街ルクソールから始まり、荘厳なアブ・シンベルへと向かいます。けれどもまず、古代の驚異の宝庫であるアスワンの壮麗さに浸ってください——あなたに発見されるのを待っています。',
      },
      '000000000011': {
        es: 'Ponga un pie en los sagrados terrenos del Templo de File, elegantemente situado en una isla del Nilo, testimonio del legado perdurable de la arquitectura del antiguo Egipto. Contemple el Obelisco Inacabado, un monumento colosal que evoca la ambición y la maestría de la Antigüedad, antes de admirar la maravilla moderna de la Presa Alta, prueba del ingenio humano para dominar la fuerza del poderoso río.',
        ja: 'ナイル川の中州に優雅にたたずむフィラエ神殿の聖なる地に足を踏み入れましょう——古代エジプト建築の不朽の遺産を物語る場所です。古代の野心と職人技を今に伝える巨大な記念碑、未完のオベリスクを目にし、続いて、雄大な川の力を治める人間の英知の証である、近代の偉業アスワン・ハイ・ダムに目を見張ってください。',
      },
      '000000000013': {
        es: 'Tras una reparadora noche en Asuán, renueve sus energías para el camino que le espera. Al amanecer, emprenda una peregrinación a los imponentes templos de Abu Simbel. Deténgase con reverencia ante las colosales estructuras dedicadas a Ramsés II y su amada reina Nefertari, donde cada piedra da fe de un relato eterno de homenaje divino y legado histórico.',
        ja: 'アスワンで安らかな一夜を過ごしたら、これからの旅に向けて英気を養いましょう。日の出とともに、畏敬の念を抱かせるアブ・シンベル神殿への巡礼へと出発します。ラムセス2世と最愛の妃ネフェルタリに捧げられた巨大な建造物の前に、敬虔な思いで立ってください——一つひとつの石が、神への献身と歴史的遺産の、時を超えた物語を今に伝えています。',
      },
      '000000000015': {
        es: 'A medida que su aventura llega a su fin, regrese a Luxor con el corazón colmado por los ecos de la grandeza antigua y los logros contemporáneos de Egipto. Con recuerdos grabados en piedra, este tour promete una combinación perfecta de historia, cultura y brillantez arquitectónica: un viaje de descubrimiento y asombro que perdurará en su alma durante años.',
        ja: '冒険が終わりに近づくころ、ルクソールへと戻ります——エジプトの古の壮大さと現代の偉業の余韻に心を満たされながら。石に刻まれた思い出とともに、このツアーは歴史と文化、そして建築の輝きの完璧な調和をお約束します。それは、これから先何年もあなたの心に残り続ける、発見と驚きの旅です。',
      },
    },
  },
  // siwa-oasis-adventure-tour
  'wp-page-113061': {
    summary: {
      es: 'Una aventura de 3 días de El Cairo a Siwa: las arenas históricas de El Alamein, la mística inmensidad del Oasis de Siwa y un regreso panorámico por Marsa Matrouh.',
      ja: 'カイロからシワへ、3日間の冒険。エル・アラメインの歴史的な砂地、神秘的に広がるシワ・オアシス、そしてマルサ・マトルーフ経由の風光明媚な帰路。',
    },
    blocks: {
      '000000000006': {
        es: 'Embárquese en este encantador tour de aventura de 3 días por el Oasis de Siwa, que le lleva desde el vibrante corazón de El Cairo, a través de las históricas arenas de El Alamein, hasta la mística inmensidad del Oasis de Siwa, para culminar con un pintoresco regreso por Marsa Matrouh. Esta aventura excepcional combina profundos conocimientos históricos con la impresionante belleza natural de los senderos menos transitados de Egipto. Esto es lo que incluye su fascinante itinerario:',
        ja: '活気あふれるカイロの中心部を出発し、エル・アラメインの歴史的な砂地を抜けて、神秘的に広がるシワ・オアシスへ——そして風光明媚なマルサ・マトルーフ経由で戻る、魅惑の3日間シワ・オアシス冒険ツアーへ。この特別な旅は、深い歴史への洞察と、人があまり訪れないエジプトの道がもつ息をのむ自然美を融合させます。心躍る旅程の内容は次のとおりです：',
      },
    },
  },
  // private-tour-2-days-1-night-trip-to-saint-catherine-from-cairo
  'wp-page-87832': {
    summary: {
      es: 'Una escapada de 2 días desde El Cairo a Santa Catalina: uno de los monasterios cristianos en activo más antiguos del mundo, al pie del Monte Sinaí, con una ascensión al amanecer hasta la cima.',
      ja: 'カイロ発、聖カタリナへの2日間。シナイ山のふもとにたたずむ世界最古級の現役キリスト教修道院を訪ね、夜明けには山頂への登山を。',
    },
    blocks: {
      '000000000005': {
        es: 'Emprenda un viaje espiritual: excursión de 2 días a Santa Catalina desde El Cairo. Escape del bullicio de El Cairo en una transformadora expedición de dos días a la serena y espiritual Santa Catalina. Este tour, cuidadosamente diseñado, le invita a retroceder en el tiempo y explorar uno de los monasterios cristianos en activo más antiguos del mundo, enclavado al pie del Monte Sinaí. Imagine recorrer los senderos sagrados donde, según se dice, Moisés recibió los Diez Mandamientos, rodeado de las impresionantes vistas de la península del Sinaí.',
        ja: '心の旅へ——カイロ発、聖カタリナ修道院への2日間の旅。カイロの喧騒を離れ、静けさと聖性に満ちた聖カタリナへ、心を新たにする2日間の旅に出かけましょう。丹念に練り上げられたこのツアーは、時をさかのぼり、シナイ山のふもとにたたずむ世界最古級の現役キリスト教修道院のひとつを訪ねるものです。モーセが十戒を授かったと伝えられる聖なる道を、シナイ半島の息をのむ眺望に囲まれて歩く——そんな光景を思い描いてみてください。',
      },
      '00000000000d': {
        es: 'Su aventura comienza con un pintoresco trayecto desde El Cairo, que le lleva del vibrante paisaje urbano a los apacibles paisajes desérticos que prometen paz y misterio a partes iguales. Junto a un guía experto, descubrirá el rico tapiz de la historia religiosa y la perdurable cultura beduina que hacen de Santa Catalina no solo un destino, sino un viaje del alma.',
        ja: '旅は、カイロからの風光明媚なドライブで始まります——活気ある街並みから、安らぎと神秘をたたえた静かな砂漠の風景へと移り変わっていきます。熟練のガイドとともに、宗教の歴史と脈々と受け継がれるベドウィンの文化が織りなす豊かな世界を解き明かしていきましょう。それこそが、聖カタリナを単なる目的地ではなく、魂の旅にしているのです。',
      },
      '00000000000f': {
        es: 'Prepárese para una ascensión de madrugada a la cima del Monte Sinaí, donde podrá contemplar un amanecer que tiñe el cielo de colores tan vivos que parecen casi celestiales. A medida que avanza el día, descubra la emblemática Zarza Ardiente, fascinantes objetos religiosos y antiguos manuscritos que se conservan entre los muros del monasterio.',
        ja: '早朝、シナイ山の頂への登りに備えましょう。そこでは、空をほとんど天上のものとも思える鮮やかな色に染め上げる日の出を目にすることができます。日が進むにつれ、象徴的な「燃える柴」や、心を引きつける宗教的な品々、そして修道院の壁の内に納められた古い写本の数々を訪ねていきます。',
      },
      '000000000011': {
        es: 'Este viaje de dos días no es solo un tour; es una oportunidad para reflexionar, renovarse y conectar con la historia de un modo profundamente personal. ¿Qué más se puede pedir en una escapada de lo cotidiano?',
        ja: 'この2日間の旅は、単なるツアーではありません。立ち止まって思いをめぐらせ、心身を新たにし、歴史と深く個人的なかたちで結びつくための機会です。日常からの逃避に、これ以上何を望むことがあるでしょうか。',
      },
    },
  },
  // safaga-to-luxor-full-day-group-ancient-city-adventure
  'wp-page-115614': {
    summary: {
      es: 'Un tour de grupo de día completo de Safaga a Luxor: el Valle de los Reyes y la grandiosidad de los templos de Karnak y Luxor, en las dos orillas del Nilo.',
      ja: 'サファガからルクソールへ、1日かけて巡るグループツアー。王家の谷と、カルナック神殿・ルクソール神殿の壮大さを、ナイル両岸にわたって。',
    },
    blocks: {
      '00000000000c': {
        es: 'Acompáñenos en un viaje inolvidable por el corazón del antiguo Egipto con nuestro tour en grupo «De Safaga a Luxor: aventura de día completo por la ciudad antigua», que revela los tesoros de las orillas este y oeste de Luxor. Esta excursión, cuidadosamente diseñada, ofrece una exploración completa de los yacimientos arqueológicos más importantes de Luxor, desde las tumbas reales del Valle de los Reyes hasta la grandiosidad de los templos de Karnak y Luxor. Viva el sobrecogedor legado de los faraones, que cobra vida a través de relatos y estructuras que han resistido el paso del tiempo.',
        ja: '私たちのグループツアー「サファガからルクソールへ：1日かけて巡る古代都市アドベンチャー」で、古代エジプトの中心への忘れがたい旅へご一緒しましょう。ルクソールの東岸と西岸の宝を解き明かすツアーです。丹念に練り上げられたこの小旅行は、王家の谷の王たちの墓から、カルナック神殿とルクソール神殿の壮大さまで、ルクソールでも最も重要な遺跡を余すところなく巡ります。時の試練に耐えてきた物語と建造物を通して、いまに息づくファラオたちの畏敬すべき遺産を体感してください。',
      },
    },
  },
  // sunrise-hot-air-balloon-ride-over-luxors-ancient-landmarks
  'wp-page-133412': {
    summary: {
      es: 'Un vuelo privado en globo al amanecer sobre Luxor: los monumentos y paisajes de la ciudad desde el aire, con té o café al aterrizar, certificado de vuelo y traslados incluidos.',
      ja: '夜明けのルクソール上空を巡るプライベート熱気球フライト。遺跡と風景を空から眺め、着陸後はお茶かコーヒーを。フライト証明書と往復送迎付き。',
    },
    blocks: {
      '00000000000b': {
        es: 'Vuelo en globo aerostático al amanecer sobre los monumentos antiguos de Luxor. Descubra los monumentos antiguos de Luxor desde una perspectiva incomparable con este exclusivo paseo en globo aerostático. Cuando los primeros rayos del sol iluminan el horizonte, ascenderá al cielo y sobrevolará con elegancia los imponentes monumentos y los sobrecogedores paisajes de esta ciudad histórica. Este vuelo privado en globo ofrece una oportunidad única de contemplar la grandeza de Luxor desde las alturas, en una aventura verdaderamente inolvidable. Al aterrizar, disfrute de una reconfortante taza de té o café y reciba un certificado de vuelo para conmemorar la experiencia. Con los traslados de ida y vuelta incluidos, su viaje es fluido y sin complicaciones, para que pueda concentrarse en la magia del momento.',
        ja: 'ルクソールの古代遺跡の上空を巡る、日の出の熱気球フライト。この特別な熱気球の旅で、ルクソールの古代遺跡を比類なき視点から味わってください。朝日の最初の光が地平線を照らすころ、空へと舞い上がり、この歴史ある街の畏敬すべき遺跡と息をのむ風景の上を、優雅に飛んでいきます。このプライベートな気球フライトは、ルクソールの壮大さを上空から見渡せる、またとない機会——まさに忘れられない冒険です。着陸後は、さわやかなお茶かコーヒーをお楽しみいただき、体験を記念するフライト証明書をお受け取りください。往復送迎込みで、旅は滞りなく快適——その瞬間の魔法に、心ゆくまで浸っていただけます。',
      },
    },
  },
  // private-tour-2-day-trip-to-bahariya-oasis
  'wp-page-87834': {
    summary: {
      es: 'Un tour privado de 2 días al Oasis de Bahariya: palmerales, aguas termales y dunas doradas, reliquias faraónicas y tumbas antiguas, y una noche bajo las estrellas en un campamento del desierto.',
      ja: 'バハレイヤ・オアシスへの2日間プライベートツアー。ヤシの林、温泉、黄金の砂丘、ファラオ時代の遺物と古代の墓、そして砂漠のキャンプで過ごす星空の一夜。',
    },
    blocks: {
      '00000000000b': {
        es: 'Embárquese en un viaje extraordinario con nuestro «Oasis del desierto: tour privado de 2 días al Oasis de Bahariya». Esta aventura exclusiva le traslada al encantador Oasis de Bahariya, donde descubrirá una asombrosa combinación de historia antigua y belleza natural. Durante dos días, explore frondosos palmerales, relajantes aguas termales y las doradas dunas de arena que caracterizan este cautivador paisaje. Admire reliquias faraónicas bien conservadas, visite las antiguas tumbas ocultas bajo la superficie del desierto y relájese bajo las estrellas en un cómodo campamento. Este tour privado le promete una atención personalizada y un encuentro íntimo con uno de los destinos más serenos de Egipto.',
        ja: '私たちの「砂漠のオアシス：バハレイヤ・オアシス2日間プライベートツアー」で、特別な旅へ出かけましょう。この特別な冒険は、魅惑のバハレイヤ・オアシスへとあなたをいざないます。そこでは、古代の歴史と自然の美しさの見事な調和に出会えます。2日間にわたり、生い茂るヤシの林、心癒される温泉、そしてこの心奪われる風景を彩る黄金の砂丘を巡ります。よく保存されたファラオ時代の遺物に目を見張り、砂漠の地表の下に隠された古代の墓を訪ね、快適な砂漠のキャンプで星空の下くつろいでください。このプライベートツアーは、行き届いたおもてなしと、エジプトでもっとも静謐な目的地のひとつとの親密な出会いをお約束します。',
      },
    },
  },
};

const item = (key: string, value: any) => ({ _key: key, _type: 'object', value });
const tBlock = (b: any, text: string) => ({
  _key: b._key,
  _type: 'block',
  style: b.style || 'normal',
  ...(b.listItem ? { listItem: b.listItem, level: b.level ?? 1 } : {}),
  markDefs: [],
  children: [{ _type: 'span', _key: `${b._key}t`, text, marks: [] }],
});

async function main() {
  console.log(APPLY ? '*** APPLY ***' : '--- DRY RUN (pass --apply) ---');
  for (const [id, doc] of Object.entries(T)) {
    const data = await client.fetch<{ slug: string; summaryEn: string; bodyEn: any[] }>(
      `*[_id==$id][0]{ "slug": slug[_key=="en"][0].value.current, "summaryEn": summary[_key=="en"][0].value, "bodyEn": body[_key=="en"][0].value }`,
      { id }
    );
    const missing = data.bodyEn.filter((b: any) => b._type === 'block' && !doc.blocks[b._key]);
    if (missing.length) { console.log(`  !! ${data.slug}: untranslated blocks ${missing.map((b: any) => b._key).join(',')} — SKIP`); continue; }
    const esBlocks = data.bodyEn.map((b: any) => (b._type === 'block' ? tBlock(b, doc.blocks[b._key].es) : b));
    const jaBlocks = data.bodyEn.map((b: any) => (b._type === 'block' ? tBlock(b, doc.blocks[b._key].ja) : b));
    const summary = [item('en', data.summaryEn), item('es', doc.summary.es), item('ja', doc.summary.ja)];
    const body = [
      { _key: 'en', _type: 'object', value: data.bodyEn },
      { _key: 'es', _type: 'object', value: esBlocks },
      { _key: 'ja', _type: 'object', value: jaBlocks },
    ];
    console.log(`  ${data.slug}: +ES +JA summary + ${esBlocks.length}-block body`);
    if (APPLY) {
      await client.patch(id).set({ summary, body }).commit({ visibility: 'sync' });
      console.log(`     written.`);
    }
  }
  if (!APPLY) console.log('\nDRY RUN — pass --apply to write + publish.');
}
main().catch((e) => { console.error(e); process.exit(1); });
