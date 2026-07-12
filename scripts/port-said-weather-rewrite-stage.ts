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

const ID = 'wp-page-60347';
// HERO SWAP (Phase 1 rec): current hero is El-Ahmar-Sinai-Go-tell-it-on-the-mountain_result-1.jpg
// (de98356b, 1200×675 — a Sinai high-granite massif at dawn, camel silhouette, burned-in third-
// party watermark "GOTELLITONTHEMOUNTAIN.NET"). Wrong-city (Mount Sinai/Saint-Catherine, ~hundreds
// of km from a flat sea-level Mediterranean port) AND a licensing problem. Not shared.
// -> port-said.jpg (c8e43ef8 — the city's own canonical image: the domed Suez Canal Authority
// building on the Port Said harbour, tugboats, water foreground, soft light). Shares only with
// the Port Said city landing page. Best "working harbour" match. ⚠️ HERO SWAP AWAITS EXPLICIT
// OWNER CONFIRMATION at diff review (owner approved caption+heading, was silent on hero target).
const NEW_HERO_ASSET = 'image-c8e43ef8f2a779fb9d95b958256145745d1656e7-3000x2000-jpg';
const REGION = 'mediterranean'; // Port Said city doc (wp-page-58900) region=mediterranean (NOT red-sea like Suez)

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

// ── Hero alt/caption — AUTHORED. alt = factual scene (accessibility); caption climate-framed
//    (the sea, not the canal, sets the weather — matches the page's own signature).
const HERO_ALT = {
  en: 'The domed Suez Canal Authority building on the Port Said waterfront, with tugboats moored along the harbour under a soft sky',
  es: 'El edificio con cúpulas de la Autoridad del Canal de Suez en el paseo marítimo de Port Said, con remolcadores amarrados en el puerto bajo un cielo suave',
  ja: 'やわらかな空の下、ポートサイドの海沿いに立つドームを頂いたスエズ運河庁の建物と、港に係留されたタグボート',
};
const HERO_CAPTION = {
  en: 'The harbour at Port Said, where the Mediterranean — not the canal — sets the weather: mild, humid, and softened by the sea.',
  es: 'El puerto de Port Said, donde el Mediterráneo — no el canal — dicta el clima: templado, húmedo y suavizado por el mar.',
  ja: 'ポートサイドの港——気候を決めるのは運河ではなく地中海だ。穏やかで、湿気があり、海にやわらげられている。',
};

// ── verbatim copy (from Desktop/port-said-weather-copy.md) ─────────────────
// 4-section thin model. Bookend (standfirst = Final Word) opens on the dataset caption, which
// was updated (owner Option A) to "Port Said is a working harbour…" so the chart matches the body
// char-for-char (EN). ES/JA captions stay as natural-prose reworkings. Signature H2 owner-approved
// all 3 locales; chrome H2s reused. IDENTITY = the humid Mediterranean harbour where the SEA (not
// the canal) runs the weather — deliberately DIFFERENT from Suez's dry/bright/windy transit voice.
const EN = {
  standfirst:
    "Port Said is a working harbour more than a resort: mild most of the year, humid in high summer, and best when the light is long — spring and autumn. This is the Mediterranean end of the same canal Suez sits at the Gulf end of, and the sea makes all the difference: real winter rain, real humidity, and a softer temperature swing than anywhere else on this stretch of coast.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is hot and notably humid, days regularly in the low-to-mid 30s but feeling heavier than the same numbers would inland, the Mediterranean air holding onto moisture the desert never has to. Winter (December to February) brings daytime highs in the mid-to-high teens and genuinely wet weather — Port Said sees real rain across these months, more than almost anywhere else in this project's coverage. Spring and autumn are the sweet spot: mild, clear, and free of both summer's humidity and winter's rain.",
  h_sea: 'Where the Sea Takes Over',
  sea:
    "What actually shapes Port Said's climate isn't the canal, it's the sea it opens into. The Mediterranean brings real winter rain to this stretch of coast — genuinely wet weather, not the occasional desert shower — and holds enough moisture in summer to make the heat feel heavier than the thermometer admits. That's a different relationship with water than Suez has at the canal's other end, where the gulf shapes wind more than weather. Here, the sea is doing most of the talking.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' light, breathable clothing, strong sunscreen, and something for the humidity — this heat sits on you differently than dry desert heat does.')],
    [span('Winter:', ['strong']), span(" a genuine rain layer, not just a windbreaker; this is one of the few places in Egypt where you'll actually need it.")],
    [span('Year-round:', ['strong']), span(" sun protection for the eyes as well as the skin, and layers that adapt easily given how much the coast's mood shifts with the season.")],
  ],
  h_final: 'Final Word',
  final:
    'Port Said is a working harbour more than a resort: mild most of the year, humid in high summer, and best when the light is long — spring and autumn. Come expecting a coast the sea genuinely shapes, rain and all — the canal built this city, but the Mediterranean runs its weather.',
};

const ES = {
  standfirst:
    'Port Said es un puerto de trabajo más que un resort: templado la mayor parte del año, húmedo en pleno verano, y mejor cuando la luz es larga — primavera y otoño. Es el extremo mediterráneo del mismo canal en cuyo extremo del golfo se encuentra Suez, y el mar marca toda la diferencia: lluvia real en invierno, humedad real, y un vaivén de temperatura más suave que en cualquier otro punto de esta costa.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es caluroso y notablemente húmedo, con días que rondan regularmente los 30-33°C pero que se sienten más pesados de lo que sugerirían esas cifras tierra adentro, ya que el aire mediterráneo retiene una humedad que el desierto nunca tiene que soportar. El invierno (diciembre a febrero) trae máximas diurnas entre los 15 y los 19°C y un tiempo genuinamente lluvioso — Port Said recibe lluvia real durante estos meses, más que casi cualquier otro lugar cubierto en este proyecto. La primavera y el otoño son el punto dulce: templados, despejados, y libres tanto de la humedad del verano como de la lluvia del invierno.',
  h_sea: 'Donde el mar toma el control', // owner-approved
  sea:
    'Lo que realmente moldea el clima de Port Said no es el canal, es el mar al que se abre. El Mediterráneo trae lluvia real de invierno a este tramo de costa — un tiempo genuinamente lluvioso, no el chubasco ocasional del desierto — y retiene suficiente humedad en verano como para que el calor se sienta más pesado de lo que admite el termómetro. Es una relación con el agua distinta de la que tiene Suez en el otro extremo del canal, donde el golfo moldea el viento más que el clima. Aquí, es el mar quien lleva la voz cantante.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y algo para la humedad — este calor se siente distinto al calor seco del desierto.')],
    [span('Invierno:', ['strong']), span(' una capa de lluvia de verdad, no solo un cortavientos; este es uno de los pocos lugares de Egipto donde realmente la vas a necesitar.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel, y capas fáciles de ajustar, dado cuánto cambia el ánimo de la costa según la temporada.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Port Said es un puerto de trabajo más que un resort: templado la mayor parte del año, húmedo en pleno verano, y mejor cuando la luz es larga — primavera y otoño. Ven esperando una costa que el mar moldea de verdad, lluvia incluida — el canal construyó esta ciudad, pero el Mediterráneo dirige su clima.',
};

const JA = {
  standfirst:
    'ポートサイドは、リゾートというより働く港町です——一年の大半は穏やかで、真夏は湿気があり、いちばん美しいのは日が長い季節、春と秋です。ここは、スエズが湾側の端に位置するのと同じ運河の、地中海側の端にあたります。そして海がすべての違いを生み出しています。本物の冬の雨、本物の湿気、そしてこの海岸線のどこよりも穏やかな気温の振れ幅です。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は暑く、際立って湿度が高く、日中は30度台前半から半ばであることが多いものの、地中海の空気が砂漠には無縁の湿気を抱え込んでいるため、同じ気温でも内陸より重く感じられます。冬（12月から2月）は日中の最高気温が15度から19度ほどで、本物の雨天をもたらします——ポートサイドはこの数か月、このプロジェクトが扱う中でもほぼどこよりも多くの雨を経験します。春と秋は最良の時期です。穏やかで澄み渡り、夏の湿気からも冬の雨からも自由な季節です。',
  h_sea: '運河ではなく海が', // owner-approved
  sea:
    'ポートサイドの気候を実際に形づくっているのは、運河ではなく、それが開かれている海です。地中海は、この海岸線に本物の冬の雨をもたらします——たまに降る砂漠のにわか雨ではなく、本当に雨がちな天候です——そして夏には、気温計が示す以上に暑さを重く感じさせるだけの湿気を蓄えています。これは、運河のもう一方の端にあるスエズとは異なる水との関係です。あちらでは、湾が天候よりも風を形づくっています。ここでは、海がほとんどの語りを担っているのです。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして湿気への対策を——この暑さは、乾いた砂漠の暑さとは違う感じ方をします。')],
    [span('冬：', ['strong']), span('ウィンドブレーカーだけでなく、本物のレインウェアを。エジプトの中でも、実際に必要になる数少ない場所のひとつです。')],
    [span('通年：', ['strong']), span('肌だけでなく目のための日光対策と、季節によって海岸の表情が大きく変わることを踏まえた、調整しやすい重ね着を。')],
  ],
  h_final: '最後に', // reused
  final:
    'ポートサイドは、リゾートというより働く港町です——一年の大半は穏やかで、真夏は湿気があり、いちばん美しいのは日が長い季節、春と秋です。雨も含めて、海が本当に形づくる海岸を期待して来てください——この街を築いたのは運河ですが、その気候を司っているのは地中海です。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_sea), p(x.sea),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Port Said', es: 'El Clima en Port Said', ja: 'ポートサイドの気候ガイド' },
  desc: {
    en: 'A working harbour more than a resort — mild most of the year, humid in high summer, and best when the light is long: spring and autumn.',
    es: 'Un puerto de trabajo más que un resort — templado la mayor parte del año, húmedo en pleno verano, y mejor cuando la luz es larga: primavera y otoño.',
    ja: 'リゾートというより働く港町——一年の大半は穏やかで、真夏は湿気があり、いちばん美しいのは日が長い季節、春と秋です。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/port-said-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.sea], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) checks.push([loc + ':desc', (META.desc as any)[loc]]);
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(apos(str).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} strings all present in copy file`);

  // EN bookend must equal the (now Option-A-fixed) dataset caption char-for-char
  const capEN = 'Port Said is a working harbour more than a resort: mild most of the year, humid in high summer, and best when the light is long — spring and autumn.';
  const sfOpen = EN.standfirst.split('. This is the Mediterranean')[0] + '.';
  const fwOpen = EN.final.split('. Come expecting')[0] + '.';
  console.log(`  EN standfirst opener === dataset caption: ${sfOpen === capEN}`);
  console.log(`  EN Final Word opener === dataset caption: ${fwOpen === capEN}`);

  // Overlap boundary: sea/canal appear ONLY as climate mechanisms — no canal-history / duty-free /
  // museum / Waterfront-Quarter-destination / port-industry content anywhere.
  const allNew = [EN, ES, JA].flatMap((C) => [C.standfirst, C.shape, C.sea, C.final, ...C.pack.map((b) => b.map((s) => s.text).join(''))]).join(' ');
  const outOfScope = /duty.?free|Simon Arzt|De Lesseps|Lesseps|1869|18[0-9]{2}|museum|museo|博物館|Arzt|Waterfront Quarter|customs|aduana/i.test(allNew);
  console.log(`  overlap boundary — zero canal-history/duty-free/museum content in body: ${!outOfScope}`);
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
