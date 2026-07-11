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

const ID = 'wp-page-60483';
const HERO_DONOR = 'wp-page-60485'; // cliff-backed cove, 4593x3495, Sharm-specific

let kc = 0;
const K = () => `s${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (from Desktop/1sharm-el-sheikh-weather-copy.md) ─────────
// Headings: EN verbatim. ES/JA — 3 reused verbatim from al-Quseir/Hurghada
// (Shape of the Year / What to Pack / Final Word); 2 NEW (Winter Escape,
// Rain as News) FLAGGED for owner sign-off.
// NOTE: "among the warmest winter nights…" is the DELIBERATE softened claim
// (locked per the numeric-claims sweep) — not the dataset's "the warmest".
const EN = {
  standfirst:
    "Sharm el-Sheikh's whole case is made in one season. While Northern Europe sits under grey January skies, Sharm is somewhere between 20 and 25°C at midday, with a sea that never really cools down and rain so rare it barely counts as weather. Summer here is hot the way most of the Red Sea coast is hot — but winter is the reason this town became what it is.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to September) runs hot, days regularly past 35°C and touching the upper 30s in peak August — hot enough that most visitors plan their days around the water rather than the streets. Winter (December to February) is where Sharm earns its reputation: daytime highs in the low-to-mid 20s, nights that stay mild rather than cold, and a stretch of dry, sunny days that most of Europe would trade for. Spring and autumn bridge the two, with the occasional dusty khamsin wind in spring the only real interruption to an otherwise calm calendar.",
  h_winter: 'Winter Escape',
  winter:
    "This is the section that explains Sharm's whole reputation: night temperatures here rarely drop out of the mid-teens even in January, among the warmest winter nights anywhere on the Egyptian coast. Pair that with daytime warmth and a sea that stays swimmable, and you get a town built almost entirely around one promise — winter, without actually leaving it behind.",
  h_rain: 'Rain as News',
  rain:
    'Rain in Sharm is rare enough to be a local talking point rather than a planning concern — most years see only a handful of days with any measurable rainfall at all, concentrated in the cooler months if they happen at all. This isn\'t a place to pack for weather contingencies; it\'s a place where the forecast is, most days, simply "the same as yesterday."',
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' light, breathable clothing, strong sunscreen, and something for shade during the hottest midday hours.')],
    [span('Winter:', ['strong']), span(" swimwear plus a light layer for the evening — Sharm's winter is mild, not cold, but the temperature drop after sunset is real.")],
    [span('Year-round:', ['strong']), span(' reef-safe sunscreen, given how much of a Sharm trip happens in or near the water.')],
  ],
  h_final: 'Final Word',
  final:
    "Sharm doesn't have a bad season so much as one exceptional one — winter here does what most of the world's beach towns can't, holding warmth and sun through the months everyone else spends waiting for spring. Come for the diving any time of year; come for the winter specifically if the weather itself is the point.",
};

const ES = {
  standfirst:
    'Todo el argumento de Sharm el-Sheikh se resume en una estación. Mientras el norte de Europa vive bajo cielos grises de enero, Sharm ronda los 20-25°C al mediodía, con un mar que nunca llega a enfriarse del todo y una lluvia tan rara que apenas cuenta como clima. El verano aquí es caluroso como en el resto de la costa del mar Rojo — pero es el invierno la razón por la que este lugar se convirtió en lo que es.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a septiembre) es caluroso, con días que superan regularmente los 35°C y rozan los 38°C en pleno agosto — lo bastante como para que la mayoría planifique el día en torno al agua más que a las calles. El invierno (diciembre a febrero) es donde Sharm se gana su fama: máximas diurnas entre 20 y 25°C, noches templadas en vez de frías, y una racha de días secos y soleados que media Europa firmaría sin dudarlo. Primavera y otoño hacen de puente entre ambos, con el jamsín ocasional en primavera como la única interrupción real en un calendario, por lo demás, tranquilo.',
  h_winter: 'La escapada invernal', // NEW — owner sign-off
  winter:
    'Esta es la sección que explica toda la fama de Sharm: las temperaturas nocturnas aquí rara vez bajan de los quince grados incluso en enero, entre las noches de invierno más cálidas de toda la costa egipcia. Súmale a eso el calor diurno y un mar que sigue siendo apto para nadar, y el resultado es un pueblo construido casi por completo alrededor de una sola promesa: el invierno, sin tener que dejarlo realmente atrás.',
  h_rain: 'La lluvia como noticia', // NEW — owner sign-off
  rain:
    'La lluvia en Sharm es tan poco frecuente que se convierte en un tema de conversación local más que en una preocupación para planificar el viaje — la mayoría de los años apenas hay un puñado de días con alguna precipitación medible, concentrados en los meses más frescos si es que llegan a ocurrir. No es un lugar para el que haya que preparar un plan B por el clima; es un lugar donde la previsión, la mayoría de los días, es simplemente "igual que ayer".',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y algo para hacer sombra durante las horas centrales del día.')],
    [span('Invierno:', ['strong']), span(' bañador y una capa ligera para la noche — el invierno de Sharm es templado, no frío, pero el descenso de temperatura tras la puesta de sol es real.')],
    [span('Todo el año:', ['strong']), span(' protector solar respetuoso con el arrecife, dado cuánto de un viaje a Sharm ocurre dentro o cerca del agua.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Sharm no tiene tanto una mala temporada como una excepcional — el invierno aquí hace lo que la mayoría de los pueblos costeros del mundo no pueden: mantener el calor y el sol durante los meses en que todos los demás esperan a que llegue la primavera. Ven a bucear en cualquier época del año; ven específicamente en invierno si el clima en sí es el objetivo del viaje.',
};

const JA = {
  standfirst:
    'シャルム・エル・シェイクの魅力は、ひとつの季節だけで語れます。北ヨーロッパが灰色の1月の空の下にあるあいだ、シャルムは正午で20〜25°C、海は本当の意味で冷えることがなく、雨はほとんど数えるに値しないほど稀です。夏の暑さは紅海沿岸の他の町と変わりません——けれど、この町を今の姿にしたのは冬です。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から9月）は暑く、日中は35°Cを超える日が続き、8月の盛りには38°C近くまで達します——ほとんどの旅行者が、通りではなく水辺を中心に一日を組み立てるほどの暑さです。冬（12月から2月）は、シャルムがその評判を築いた季節。日中の最高気温は20度台前半から半ば、夜も冷え込まずに穏やかで、乾いた晴天が続く日々は、ヨーロッパの多くの人が喜んで交換したくなるほどです。春と秋はその橋渡しの季節で、春に時おり吹く砂まじりのハムシンだけが、穏やかな暦の中の唯一の乱れです。',
  h_winter: '冬の避寒地', // NEW — owner sign-off
  winter:
    'シャルムの評判のすべてを説明するのが、この一節です。ここでは1月でも夜の気温がほとんど15度台を下回らず、エジプト沿岸でも屈指の暖かさを誇る冬の夜になります。それに日中の暖かさと、まだ泳げる海を組み合わせれば——ひとつの約束をほぼまるごと軸にして作られた町ができあがります。冬を、実質手放さずに過ごせるという約束です。',
  h_rain: 'ニュースになる雨', // NEW — owner sign-off
  rain:
    'シャルムの雨は、旅の計画で心配するようなものというより、地元の話題になるほど珍しいものです。ほとんどの年は、実際に測定できる雨が降る日はほんのひと握りで、しかも起こるとすれば涼しい時期に集中しています。天候の備えを考えて荷造りをするような土地ではありません。ほとんどの日、天気予報は単に「昨日と同じ」なのです。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして日中いちばん暑い時間帯のための日陰対策を。')],
    [span('冬：', ['strong']), span('水着と、夜のための薄手の一枚——シャルムの冬は穏やかで寒くはありませんが、日没後の気温の下がり方は本物です。')],
    [span('通年：', ['strong']), span('サンゴに優しい日焼け止め。シャルムでの滞在の多くは、水の中や水辺で過ごすことになるからです。')],
  ],
  h_final: '最後に', // reused
  final:
    'シャルムに悪い季節というものはほとんどなく、むしろ例外的に優れた季節がひとつあるだけです——冬のあいだ、世界のほとんどのビーチタウンにはできないことをこの町はやってのけます。誰もが春を待ちわびる数か月のあいだ、暖かさと日差しを保ち続けるのです。ダイビングなら一年中いつでも。天候そのものが目的なら、冬にこそ来てください。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_winter), p(x.winter),
    h2(x.h_rain), p(x.rain),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Sharm el-Sheikh', es: 'El Clima en Sharm el-Sheikh', ja: 'シャルム・エル・シェイクの気候ガイド' },
  desc: {
    en: 'Sharm exists because of its winter — sun in the middle of a European January, a sea still warm enough to swim in, and rain rare enough that the airport treats it as news.',
    es: 'Sharm existe por su invierno — sol en pleno enero europeo, un mar todavía lo bastante cálido para nadar, y una lluvia tan poco frecuente que el aeropuerto la trata como noticia.',
    ja: 'シャルムはその冬のためにある町です。ヨーロッパが真冬の1月でも太陽が照り、海はまだ泳げるほど暖かく、雨はほとんど降らないので、空港でさえニュースになるほどです。',
  },
};

function preflight() {
  const md = fs.readFileSync('/Users/islamhussein/Desktop/1sharm-el-sheikh-weather-copy.md', 'utf8').replace(/\*\*/g, '');
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const flatSpace = norm(md);
  const flatStrip = md.replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.winter], [loc, C.rain], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  const fails: string[] = [];
  for (const [loc, str] of checks) {
    const ok = loc === 'ja' ? flatStrip.includes(str.replace(/\s+/g, '')) : flatSpace.includes(norm(str));
    if (!ok) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  }
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} body strings all present in copy file`);
}

async function main() {
  preflight();
  const pub: any = await client.getDocument(ID);
  if (!pub) throw new Error('published doc not found');
  const donor: any = await client.getDocument(HERO_DONOR);
  if (!donor?.heroImage?.asset) throw new Error('hero donor not found');
  const heroImage = JSON.parse(JSON.stringify(donor.heroImage));

  const draft = {
    ...pub,
    _id: 'drafts.' + ID,
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
    heroImage,
    body: [
      { _key: 'en', value: buildBody(EN) },
      { _key: 'es', value: buildBody(ES) },
      { _key: 'ja', value: buildBody(JA) },
    ],
  };
  await client.createOrReplace(draft);
  console.log('Staged draft drafts.' + ID);
  console.log('  hero swapped ->', heroImage.asset._ref, '(from', HERO_DONOR + ')');
  console.log('  body', buildBody(EN).length, 'blocks/locale; marker after "The Shape of the Year"');
  console.log('  title set / summary cleared / seo.metaDescription created x3');
}
main().catch((e) => { console.error(e); process.exit(1); });
