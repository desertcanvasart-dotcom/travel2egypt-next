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

const ID = 'wp-page-59731';
// NO hero swap — heroImage intentionally NOT overridden.

let kc = 0;
const K = () => `k${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (from Desktop/kharga-oasis-weather-copy.md) ─────────────
// Headings: EN verbatim. ES/JA — 3 reused (Shape / What to Pack / Final Word);
// 2 NEW (The Forty-Days Road, Vast Skies No Rain) FLAGGED for owner sign-off.
const EN = {
  standfirst:
    "Kharga isn't just another Western Desert oasis — it's the New Valley's capital, and it sits on a route that's been in use since Roman soldiers were stationed here to guard it. The climate hasn't softened with the centuries: this is still caravan weather, rainless and vast-skied, punishing by early summer and gentler only once the sun stops being the main event.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is severe, days regularly past 40°C with almost no relief from humidity or cloud cover — this is one of the hottest stretches of the entire Egyptian desert. Winter (December to February) is the reward: daytime highs in the low-to-mid 20s and nights that drop close to freezing, cold enough to explain why travelling this route in summer was never really an option. Spring and autumn are short, hot transitions either side of the extremes.",
  h_road: 'The Forty-Days Road',
  road:
    "Kharga sits on the Darb al-Arba'in, the forty-days road that once carried caravans and enslaved people north from Sudan to the Nile Valley — one of Africa's oldest and longest trade routes. The Roman forts still standing along it weren't built for decoration: they garrisoned troops here specifically through the cooler months, when moving through this stretch of desert was survivable rather than suicidal. The same seasonal logic holds for visiting today.",
  h_sky: 'Vast Skies, No Rain',
  sky:
    "Rain essentially doesn't happen here — the New Valley's whole climate is built around that absence, and the payoff is sky. With no moisture to soften the horizon, Kharga's stars at night and its sunsets by day are about as unobstructed as Egypt gets, especially away from the town's own lights toward the desert edge.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' light, breathable clothing, strong sunscreen, and more water than feels necessary — this is severe desert heat, not coastal heat with a breeze to soften it.')],
    [span('Winter:', ['strong']), span(" warm layers for the evening; the desert's night chill is real and arrives fast after sunset.")],
    [span('Year-round:', ['strong']), span(" sun protection for the eyes as much as the skin — there's very little haze here to filter the light.")],
  ],
  h_final: 'Final Word',
  final:
    "Kharga rewards travellers who take its history as seriously as its heat — this is a capital city with a Roman garrison's worth of reasons to respect the calendar. Come in winter, follow the same season the forts once waited out summer for, and the forty-days road gives up its sky in return.",
};

const ES = {
  standfirst:
    'Kharga no es solo otro oasis del Desierto Occidental — es la capital del Nuevo Valle, y se asienta sobre una ruta que lleva en uso desde que los soldados romanos se apostaban aquí para vigilarla. El clima no se ha suavizado con los siglos: sigue siendo clima de caravana, sin lluvia y de cielos inmensos, implacable desde principios de verano y solo más amable cuando el sol deja de ser el protagonista.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es severo, con días que superan regularmente los 40°C y casi ningún alivio de humedad o nubosidad — este es uno de los tramos más calurosos de todo el desierto egipcio. El invierno (diciembre a febrero) es la recompensa: máximas diurnas entre 20 y 25°C y noches que caen cerca de la congelación, lo bastante frías como para explicar por qué recorrer esta ruta en verano nunca fue realmente una opción. La primavera y el otoño son transiciones breves y calurosas a ambos lados de los extremos.',
  h_road: 'El camino de los cuarenta días', // NEW — owner sign-off
  road:
    "Kharga se encuentra sobre el Darb al-Arba'in, el camino de los cuarenta días que antaño llevaba caravanas y personas esclavizadas desde Sudán hasta el valle del Nilo — una de las rutas comerciales más antiguas y largas de África. Los fuertes romanos que aún se alzan a lo largo del camino no se construyeron por decoración: guarnecían tropas aquí específicamente durante los meses más frescos, cuando cruzar este tramo de desierto era algo sobrevivible y no un suicidio. La misma lógica estacional se aplica hoy a quien lo visita.",
  h_sky: 'Cielos inmensos, sin lluvia', // NEW — owner sign-off
  sky:
    'Aquí, la lluvia prácticamente no existe — todo el clima del Nuevo Valle está construido en torno a esa ausencia, y la recompensa es el cielo. Sin humedad que suavice el horizonte, las estrellas de Kharga por la noche y sus atardeceres de día son de lo más despejado que ofrece Egipto, sobre todo lejos de las luces del propio pueblo, hacia el borde del desierto.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y más agua de la que parece necesaria — este es un calor de desierto severo, no un calor costero suavizado por la brisa.')],
    [span('Invierno:', ['strong']), span(' capas de abrigo para la noche; el frío nocturno del desierto es real y llega rápido tras la puesta de sol.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel — aquí hay muy poca bruma que filtre la luz.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Kharga recompensa a quienes se toman su historia tan en serio como su calor — es una ciudad capital con motivos, dignos de una guarnición romana, para respetar el calendario. Ven en invierno, sigue la misma temporada que los fuertes esperaban para dejar atrás el verano, y el camino de los cuarenta días te devuelve su cielo a cambio.',
};

const JA = {
  standfirst:
    'ハルガは、西方砂漠にあるただのオアシスのひとつではありません——ニュー・ヴァレーの州都であり、ローマの兵士たちがこの道を守るために駐屯していた頃から使われ続けてきたルートの上に位置しています。気候は何世紀を経ても和らいでいません。いまも隊商の気候のまま——雨はなく、空は広大で、初夏にはすでに容赦なく、太陽が主役の座を降りたときだけ、ようやく穏やかになります。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は過酷で、日中は40°Cを超える日が続き、湿度や雲による救いもほとんどありません——エジプトの砂漠の中でも、もっとも厳しい地域のひとつです。冬（12月から2月）はその見返りです。日中の最高気温は20度台前半から半ば、夜は氷点に近づくほど冷え込みます。夏にこのルートを旅することが、実質的に選択肢になり得なかった理由がよくわかる寒さです。春と秋は、両極端のあいだの短く暑い移行期です。',
  h_road: '四十日の道', // NEW — owner sign-off
  road:
    'ハルガは、ダルブ・アル・アルバイン——「四十日の道」と呼ばれる交易路の上にあります。かつてスーダンからナイル渓谷へ、隊商や奴隷にされた人々を北へと運んだ、アフリカでもっとも古く、もっとも長い交易路のひとつです。いまも道沿いに残るローマの砦は、装飾のために建てられたものではありません。この一帯を移動することが自殺行為ではなく生き延びられる行為になる、涼しい季節に絞って、ここに軍を駐屯させていたのです。同じ季節の論理は、今日この地を訪れる際にもそのまま当てはまります。',
  h_sky: '広大な空、雨なし', // NEW — owner sign-off
  sky:
    'ここでは、雨はほぼ存在しません——ニュー・ヴァレー全体の気候は、その不在の上に成り立っており、その見返りが空です。地平線を和らげる湿気がないため、ハルガの夜の星空や日中の夕焼けは、エジプトの中でもとりわけ遮るもののない眺めになります。特に町自体の明かりから離れ、砂漠の縁に向かうほどそうです。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして必要以上に感じるくらいの水を——これは風がやわらげてくれる沿岸の暑さではなく、過酷な砂漠の暑さです。')],
    [span('冬：', ['strong']), span('夜のための暖かい重ね着を。砂漠の夜の冷え込みは本物で、日没後すぐにやってきます。')],
    [span('通年：', ['strong']), span('肌だけでなく目のための日光対策も。ここでは光を和らげるもやがほとんどありません。')],
  ],
  h_final: '最後に', // reused
  final:
    'ハルガは、その暑さと同じくらい、その歴史を真剣に受け止める旅行者に報います——ここは、ローマの守備隊が暦を尊重するだけの理由を持っていたような州都です。冬に来て、砦がかつて夏をやり過ごすために待っていたのと同じ季節に合わせれば、四十日の道はその見返りに、空を差し出してくれます。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_road), p(x.road),
    h2(x.h_sky), p(x.sky),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Kharga Oasis', es: 'El Clima en el Oasis de Kharga', ja: 'ハルガ・オアシスの気候ガイド' },
  desc: {
    en: 'Kharga is the New Valley\'s capital and keeps a caravan climate — rainless, huge-skied, and fierce by May, exactly as it was when Roman forts lined the road south.',
    es: 'Kharga es la capital del Nuevo Valle y conserva un clima de caravana — sin lluvia, de cielos inmensos, y feroz desde mayo, tal como era cuando los fuertes romanos flanqueaban el camino hacia el sur.',
    ja: 'ハルガはニュー・ヴァレーの州都であり、いまも隊商の気候を保っています。雨は降らず、空は広大で、5月にはすでに厳しい暑さになります。ローマの砦が南への道沿いに並んでいた頃と同じように。',
  },
};

function preflight() {
  const flatStrip = fs.readFileSync('/Users/islamhussein/Desktop/kharga-oasis-weather-copy.md', 'utf8')
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.road], [loc, C.sky], [loc, C.final]);
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
  const heroBefore = JSON.stringify(pub.heroImage);

  const draft = {
    ...pub, // heroImage carried through UNCHANGED (no swap)
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
    body: [
      { _key: 'en', value: buildBody(EN) },
      { _key: 'es', value: buildBody(ES) },
      { _key: 'ja', value: buildBody(JA) },
    ],
  };
  const heroAfter = JSON.stringify(draft.heroImage);
  await client.createOrReplace(draft);
  console.log('Staged draft drafts.' + ID);
  console.log('  heroImage UNCHANGED:', heroBefore === heroAfter, '(asset', draft.heroImage?.asset?._ref + ')');
  console.log('  body', buildBody(EN).length, 'blocks/locale; marker after "The Shape of the Year"');
  console.log('  title set / summary cleared / seo.metaDescription created x3');
}
main().catch((e) => { console.error(e); process.exit(1); });
