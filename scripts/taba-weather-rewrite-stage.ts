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

const ID = 'wp-page-60579';
const HERO_DONOR = 'wp-page-60582'; // turquoise inlet between rust mountains, 5184x3456

let kc = 0;
const K = () => `t${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (from Desktop/taba-weather-copy.md) ─────────────────────
// Headings: EN verbatim. ES/JA — 3 reused verbatim (Shape / What to Pack /
// Final Word); 2 NEW (Four Countries One View, Pink at Dusk) FLAGGED for
// owner sign-off.
const EN = {
  standfirst:
    "Taba sits at the point where the Gulf of Aqaba pinches tightest — narrow enough that Egypt, Israel, Jordan, and Saudi Arabia are all visible from roughly the same spot. It's a small resort corner more than a town, and the geography does most of the talking: calm water, close mountains, and a strait that turns pink at dusk in a way few other places on this coast can match.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to September) is hot, days regularly past 35°C, though the tightly enclosed gulf keeps the water notably calm even when the air is at its most intense. Winter (December to February) brings mild days in the low-to-mid 20s and cool nights, with the narrow strait sheltering the coast from the rougher conditions further south. Spring and autumn are brief, gentle bridges either side of summer's peak.",
  h_four: 'Four Countries, One View',
  four:
    "This is the detail that makes Taba worth the drive: from the same stretch of beach, Egypt's own coastline curves away on one side while Jordan's mountains rise across the water, Israel's Eilat sits at the gulf's northern tip, and on a clear day Saudi Arabia's coast is visible to the south. No other point on the Egyptian Red Sea offers that particular geography lesson with your morning coffee.",
  h_pink: 'Pink at Dusk',
  pink:
    "Late afternoon is Taba's best hour: as the sun drops behind Sinai's mountains, Jordan's peaks across the strait catch the last light and turn a deep pink before the colour fades to grey. It's a brief window, worth timing a sunset drink around, and the calm, narrow water makes an unusually still mirror for it.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' light, breathable clothing, strong sunscreen, and something for the water — the calm gulf here is ideal for casual swimming even at midday.')],
    [span('Winter:', ['strong']), span(' swimwear plus a light jacket for the evening, especially if you want to be out for the sunset colour change.')],
    [span('Year-round:', ['strong']), span(' reef-safe sunscreen, and a camera charged for dusk — this is the one hour on this coast worth planning around.')],
  ],
  h_final: 'Final Word',
  final:
    "Taba is small enough to see in an afternoon and specific enough to remember for years — four countries from one beach, and a mountain range that performs the same trick every evening if you're there to watch it. The climate simply gets out of the way and lets the geography do the work.",
};

const ES = {
  standfirst:
    'Taba se encuentra en el punto donde el golfo de Aqaba se estrecha al máximo — lo bastante estrecho como para ver Egipto, Israel, Jordania y Arabia Saudí, casi todos desde el mismo lugar. Es más un pequeño rincón de resort que un pueblo, y la geografía hace la mayor parte del trabajo: agua en calma, montañas cercanas, y un estrecho que se tiñe de rosa al atardecer de una forma que pocos otros lugares de esta costa pueden igualar.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a septiembre) es caluroso, con días que superan regularmente los 35°C, aunque el golfo, tan estrechamente cerrado, mantiene el agua notablemente en calma incluso cuando el aire está en su punto más intenso. El invierno (diciembre a febrero) trae días templados entre 20 y 25°C y noches frescas, con el estrecho protegiendo la costa de las condiciones más agitadas más al sur. La primavera y el otoño son puentes breves y suaves a ambos lados del pico del verano.',
  h_four: 'Cuatro países, una vista', // NEW — owner sign-off
  four:
    'Este es el detalle que hace que merezca la pena venir hasta Taba: desde el mismo tramo de playa, la propia costa egipcia se curva hacia un lado mientras las montañas de Jordania se alzan al otro lado del agua, la Eilat israelí se asienta en la punta norte del golfo, y en un día despejado se puede ver la costa de Arabia Saudí hacia el sur. Ningún otro punto del mar Rojo egipcio ofrece esa lección de geografía particular junto con el café de la mañana.',
  h_pink: 'Rosa al atardecer', // NEW — owner sign-off
  pink:
    'La última hora de la tarde es el mejor momento de Taba: mientras el sol cae tras las montañas del Sinaí, los picos de Jordania al otro lado del estrecho captan la última luz y se tiñen de un rosa intenso antes de que el color se apague hacia el gris. Es una ventana breve, que merece la pena organizar en torno a una copa al atardecer, y el agua en calma y estrecha actúa como un espejo inusualmente quieto para el espectáculo.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y algo para el agua — el golfo, tan en calma aquí, es ideal para nadar sin prisa incluso al mediodía.')],
    [span('Invierno:', ['strong']), span(' bañador y una chaqueta ligera para la noche, especialmente si quieres estar fuera para el cambio de color del atardecer.')],
    [span('Todo el año:', ['strong']), span(' protector solar respetuoso con el arrecife, y una cámara cargada para el atardecer — es la única hora de esta costa que vale la pena planificar con antelación.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Taba es lo bastante pequeña como para verla en una tarde y lo bastante particular como para recordarla durante años — cuatro países desde una sola playa, y una cordillera que repite el mismo truco cada noche si estás allí para verlo. El clima, sencillamente, se aparta y deja que la geografía haga el trabajo.',
};

const JA = {
  standfirst:
    'タバは、アカバ湾がもっとも狭くなる地点にあります——エジプト、イスラエル、ヨルダン、サウジアラビアがほぼ同じ場所から見渡せるほどの狭さです。町というより、小さなリゾートの一角に近い場所で、地形がその語りの大半を担っています。穏やかな水面、間近に迫る山々、そしてこの海岸沿いの他ではなかなか見られないほど、夕暮れにピンク色に染まる海峡。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から9月）は暑く、日中は35°Cを超える日が続きますが、狭く閉ざされたこの湾は、空気がもっとも激しい時期でも、水面を際立って穏やかに保ちます。冬（12月から2月）は日中20度台前半から半ばの穏やかな気候と涼しい夜をもたらし、狭い海峡が、より南の荒れた状況から海岸を守っています。春と秋は、夏のピークの両側にある、短く穏やかな橋渡しの季節です。',
  h_four: '4か国、ひとつの眺め', // NEW — owner sign-off
  four:
    'これが、タバまで足を運ぶ価値を作っている細部です。同じ浜辺から、エジプト自身の海岸線が片側にカーブして伸び、対岸にはヨルダンの山々がそびえ、湾の北端にはイスラエルのエイラットがあり、晴れた日には南にサウジアラビアの海岸線まで見渡せます。朝のコーヒーとともにこのような地理の授業を味わえる場所は、エジプトの紅海沿岸に他にありません。',
  h_pink: '夕暮れのピンク', // NEW — owner sign-off
  pink:
    '夕方遅くは、タバの最良の時間です。太陽がシナイの山々の向こうに沈むにつれ、海峡の向こうのヨルダンの峰々が最後の光をとらえ、灰色に褪せる前に深いピンク色に染まります。短い時間帯ですが、夕暮れの一杯をそれに合わせる価値があり、穏やかで狭い水面が、その光景を映す珍しいほど静かな鏡になります。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして水のための装備を——ここの穏やかな湾は、正午でも気軽に泳ぐのに最適です。')],
    [span('冬：', ['strong']), span('水着と、夜のための薄手のジャケット。特に夕暮れの色の変化を見に外に出たいなら。')],
    [span('通年：', ['strong']), span('サンゴに優しい日焼け止めと、夕暮れのために充電したカメラを——この海岸で唯一、計画する価値のある一時間です。')],
  ],
  h_final: '最後に', // reused
  final:
    'タバは、午後のうちに見て回れるほど小さく、何年も記憶に残るほど特徴的な場所です——ひとつの浜辺から4か国、そしてそれを見に来る人がいれば毎晩同じ芸当を繰り返す山並み。気候はただ道を譲り、地形にその仕事を任せているだけなのです。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_four), p(x.four),
    h2(x.h_pink), p(x.pink),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Taba', es: 'El Clima en Taba', ja: 'タバの気候ガイド' },
  desc: {
    en: 'Taba sits where the Gulf of Aqaba narrows to its tightest point — four countries in view at once, and mountains that turn pink across the water at dusk.',
    es: 'Taba se encuentra donde el golfo de Aqaba se estrecha al máximo — cuatro países a la vista al mismo tiempo, y montañas que se tiñen de rosa al otro lado del agua al atardecer.',
    ja: 'タバは、アカバ湾がもっとも狭くなる地点にあります。一度に4か国を見渡せ、夕暮れには対岸の山々がピンク色に染まります。',
  },
};

function preflight() {
  const flatStrip = fs.readFileSync('/Users/islamhussein/Desktop/taba-weather-copy.md', 'utf8')
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.four], [loc, C.pink], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(str.replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
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
