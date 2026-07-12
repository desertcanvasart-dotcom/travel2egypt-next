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

const ID = 'wp-page-60557';
// HERO SWAP (owner choice): current hero is siwa-lake-by-night-.jpeg (752211618f — a dark
// night campfire on a calm Siwa oasis lake, wrong-city + contradicts "dry, bright, windy").
// -> suez.jpg (b11bea59 — the city's own canonical image: a ship transiting the channel
// between desert banks under a bright clear sky). Owner rejected ways-to-get-to-suez.jpg
// (bridge/transit-logistics imagery) as working against this page's own content boundary.
const NEW_HERO_ASSET = 'image-b11bea59622f1a2e8bfb4656e0934a254407b35f-3000x2000-jpg';
const REGION = 'red-sea'; // Suez city doc (wp-page-58938) region=red-sea (head of the Gulf of Suez)

let kc = 0;
const K = () => `n${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── Hero alt/caption — AUTHORED. alt = factual scene description (accessibility);
//    caption = climate-framed (the canal appears only as a climate mechanism, per boundary).
const HERO_ALT = {
  en: 'A large ship moves through the Suez Canal between bare desert banks under a bright, clear sky',
  es: 'Un gran barco avanza por el Canal de Suez entre orillas desérticas desnudas bajo un cielo despejado y luminoso',
  ja: '明るく澄んだ空の下、むき出しの砂漠の岸にはさまれたスエズ運河を進む大型船',
};
const HERO_CAPTION = {
  en: "Where the canal meets the gulf — the dry, bright, wind-touched setting that shapes Suez's weather.",
  es: 'Donde el canal se encuentra con el golfo — el entorno seco, luminoso y batido por el viento que moldea el clima de Suez.',
  ja: '運河が湾と出会う場所——スエズの気候を形づくる、乾いて明るく、風を感じる風景。',
};

// ── verbatim copy (from Desktop/suez-weather-copy.md) ──────────────────────
// 4-section thin model. Bookend (standfirst = Final Word) opens on the dataset caption,
// which was updated (owner Option A) to "Suez is a transit city with transit weather…" so the
// chart matches the body char-for-char (EN). ES/JA captions stay as natural-prose reworkings.
// Headings: signature H2 owner-approved in all 3 locales; chrome H2s reused from prior pages.
const EN = {
  standfirst:
    'Suez is a transit city with transit weather: dry, bright and windy where the canal meets the gulf, comfortable in the shoulder months and honest about July. Most people who pass through are here for the water, not the town — and the climate matches that businesslike character exactly.',
  h_shape: 'The Shape of the Year',
  shape:
    'Summer (June to August) is genuinely hot, days regularly past 35°C with the kind of dry, unshaded heat that gives the season its reputation — July is the month locals plan around, not through. Winter (December to February) brings daytime highs in the high teens to low 20s and noticeably cooler nights than the Red Sea resorts further south, the gulf air here carrying a real edge. Spring and autumn are comfortable, wind-touched shoulder seasons on either side of the summer peak.',
  h_canal: 'Where the Canal Meets the Wind',
  canal:
    "Suez's weather is shaped by two things it can't avoid: the canal, and the wind that funnels along it where the desert meets the gulf. That wind is nearly constant, and it's part of why the city's heat never quite settles into the airless stillness of towns further inland — there's almost always something moving through the air here, even on the hottest afternoons. It's a working climate for a working city, closer in feel to a shipping lane than a beach.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' light, breathable clothing, strong sunscreen, and something to secure loose items against the wind.')],
    [span('Winter:', ['strong']), span(' a windproof layer for the evening; the gulf air here carries more of an edge than its Red Sea neighbours.')],
    [span('Year-round:', ['strong']), span(' sun protection for the eyes as well as the skin — the wind and glare off the water are near-constant.')],
  ],
  h_final: 'Final Word',
  final:
    "Suez is a transit city with transit weather: dry, bright and windy where the canal meets the gulf, comfortable in the shoulder months and honest about July. It's not a place designed to be lingered in, and the climate doesn't pretend otherwise — come for the water, plan around the wind, and treat July as the month it is.",
};

const ES = {
  standfirst:
    'Suez es una ciudad de paso con un clima de paso: seco, luminoso y ventoso donde el canal se encuentra con el golfo, cómodo en los meses intermedios y honesto sobre julio. La mayoría de quienes pasan por aquí lo hacen por el agua, no por la ciudad — y el clima encaja exactamente con ese carácter funcional.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es genuinamente caluroso, con días que superan regularmente los 35°C y ese calor seco y sin sombra que le da fama a la temporada — julio es el mes en torno al cual planifican los locales, no a través del cual. El invierno (diciembre a febrero) trae máximas diurnas entre los 17 y los 22°C y noches notablemente más frescas que en los resorts del mar Rojo más al sur, con un aire del golfo que aquí tiene un filo real. La primavera y el otoño son temporadas intermedias agradables y tocadas por el viento, a ambos lados del pico del verano.',
  h_canal: 'Donde el canal se encuentra con el viento', // owner-approved
  canal:
    'El clima de Suez está moldeado por dos cosas que no puede evitar: el canal, y el viento que se canaliza a lo largo de él donde el desierto se encuentra con el golfo. Ese viento es casi constante, y es parte de por qué el calor de la ciudad nunca llega a asentarse en la quietud sin aire de los pueblos más hacia el interior — casi siempre hay algo moviéndose en el aire aquí, incluso en las tardes más calurosas. Es un clima de trabajo para una ciudad de trabajo, más cercano en sensación a una vía de navegación que a una playa.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y algo para asegurar los objetos sueltos frente al viento.')],
    [span('Invierno:', ['strong']), span(' una capa cortavientos para la noche; el aire del golfo aquí tiene más filo que el de sus vecinos del mar Rojo.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel — el viento y el reflejo del agua son casi constantes.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Suez es una ciudad de paso con un clima de paso: seco, luminoso y ventoso donde el canal se encuentra con el golfo, cómodo en los meses intermedios y honesto sobre julio. No es un lugar pensado para quedarse; y el clima no finge lo contrario — ven por el agua, planifica en torno al viento, y trata julio como el mes que realmente es.',
};

const JA = {
  standfirst:
    'スエズは通過点の街であり、通過点の気候を持っています。運河が湾と出会う場所は乾いて明るく、風が強く、端境期は過ごしやすく、7月については正直に厳しいと言わざるを得ません。ここを通り過ぎる人のほとんどは、街ではなく水のためにここにいます——そしてこの気候は、まさにその実務的な性格に一致しています。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は本当に暑く、日中は35°Cを超える日が続き、その季節の評判を作っている、日陰のない乾いた暑さです——7月は、乗り切る月ではなく、それを中心に計画を立てる月です。冬（12月から2月）は日中の最高気温が17度から22度ほどで、さらに南にある紅海のリゾートよりも夜が際立って涼しく、ここの湾の空気には本物の鋭さがあります。春と秋は、夏のピークの両側にある、風を感じる心地よい端境期です。',
  h_canal: '運河と風が出会う場所', // owner-approved
  canal:
    'スエズの気候を形づくっているのは、避けられないふたつのものです。運河と、砂漠が湾と出会う場所でその運河沿いに吹き抜ける風です。その風はほぼ絶え間なく吹いており、この街の暑さが、もっと内陸の町のような空気の動かない静けさに落ち着くことがない理由の一部でもあります——もっとも暑い午後でさえ、ここではほとんど常に何かが空気の中を動いています。これは働く街のための、働く気候です。ビーチというより、航路に近い感触です。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして風で飛ばされないよう荷物を留めておく工夫を。')],
    [span('冬：', ['strong']), span('夜のための防風の一枚を。ここの湾の空気は、紅海の他の町よりも鋭さを持っています。')],
    [span('通年：', ['strong']), span('肌だけでなく目のための日光対策を——風と水面の反射はほぼ絶え間なく続きます。')],
  ],
  h_final: '最後に', // reused
  final:
    'スエズは通過点の街であり、通過点の気候を持っています。運河が湾と出会う場所は乾いて明るく、風が強く、端境期は過ごしやすく、7月については正直に厳しいと言わざるを得ません。長く滞在するために作られた場所ではなく、気候もそれを取り繕いはしません——水のために来て、風を計画に入れ、7月をあるがままの7月として扱ってください。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_canal), p(x.canal),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Suez', es: 'El Clima en Suez', ja: 'スエズの気候ガイド' },
  desc: {
    en: 'A transit city with transit weather — dry, bright and windy where the canal meets the gulf, comfortable in the shoulder months and honest about July.',
    es: 'Una ciudad de paso con un clima de paso — seco, luminoso y ventoso donde el canal se encuentra con el golfo, cómodo en los meses intermedios y honesto sobre julio.',
    ja: '通過点の街には、通過点の気候があります——運河が湾と出会う場所は乾いて明るく、風が強く、端境期は過ごしやすく、7月については正直に厳しいと言わざるを得ません。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/suez-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.canal], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) checks.push([loc + ':desc', (META.desc as any)[loc]]);
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(apos(str).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} strings all present in copy file`);

  // EN bookend must equal the (now Option-A-fixed) dataset caption char-for-char
  const capEN = 'Suez is a transit city with transit weather: dry, bright and windy where the canal meets the gulf, comfortable in the shoulder months and honest about July.';
  const sfOpen = EN.standfirst.split('. Most people')[0] + '.';
  const fwOpen = EN.final.split(". It's not")[0] + '.';
  console.log(`  EN standfirst opener === dataset caption: ${sfOpen === capEN}`);
  console.log(`  EN Final Word opener === dataset caption: ${fwOpen === capEN}`);

  // Overlap boundary: canal appears ONLY as a climate mechanism — no ferry/crossing/
  // schedule/toll/convoy/freight/tonnage/canal-history/engineering content anywhere.
  const allNew = [EN, ES, JA].flatMap((C) => [C.standfirst, C.shape, C.canal, C.final, ...C.pack.map((b) => b.map((s) => s.text).join(''))]).join(' ');
  const logistics = /\bferr(y|ies)\b|\bcrossing\b|schedule|horario|\btoll\b|peaje|convoy|freight|carga marít|tonnage|Lesseps|18[0-9]{2}|dredg|excavat|engineering|ingenier/i.test(allNew);
  console.log(`  overlap boundary — zero ferry/crossing/logistics/canal-history in body: ${!logistics}`);
  // °C-only
  console.log(`  °F absent in all body copy: ${!/°F|℉|Fahrenheit/i.test(allNew)}`);
}

async function main() {
  preflight();
  const pub: any = await client.getDocument(ID);
  if (!pub) throw new Error('published doc not found');
  const heroBefore = pub.heroImage?.asset?._ref;

  const heroImage = {
    _type: 'localizedImage',
    asset: { _ref: NEW_HERO_ASSET, _type: 'reference' },
    alt: [
      { _key: 'en', _type: 'object', value: HERO_ALT.en },
      { _key: 'es', _type: 'object', value: HERO_ALT.es },
      { _key: 'ja', _type: 'object', value: HERO_ALT.ja },
    ],
    caption: [
      { _key: 'en', _type: 'object', value: HERO_CAPTION.en },
      { _key: 'es', _type: 'object', value: HERO_CAPTION.es },
      { _key: 'ja', _type: 'object', value: HERO_CAPTION.ja },
    ],
  };

  const draft = {
    ...pub,
    _id: 'drafts.' + ID,
    region: REGION,
    heroImage,
    title: [
      { _key: 'en', value: META.title.en },
      { _key: 'es', value: META.title.es },
      { _key: 'ja', value: META.title.ja },
    ],
    summary: [],
    seo: {
      metaDescription: [
        { _key: 'en', _type: 'internationalizedArrayTextValue', value: META.desc.en },
        { _key: 'es', _type: 'internationalizedArrayTextValue', value: META.desc.es },
        { _key: 'ja', _type: 'internationalizedArrayTextValue', value: META.desc.ja },
      ],
    },
    body: [
      { _key: 'en', value: buildBody(EN) },
      { _key: 'es', value: buildBody(ES) },
      { _key: 'ja', value: buildBody(JA) },
    ],
  };
  await client.createOrReplace(draft);
  console.log('Staged draft drafts.' + ID);
  console.log('  hero SWAP:', heroBefore, '->', draft.heroImage.asset._ref);
  console.log('  region set:', pub.region, '->', REGION);
  console.log('  body', buildBody(EN).length, 'blocks/locale; marker after "The Shape of the Year"');
  console.log('  title set / summary cleared / seo.metaDescription created x3');
}
main().catch((e) => { console.error(e); process.exit(1); });
