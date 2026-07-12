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

const ID = 'wp-page-60597';
// HERO SWAP (owner choice C): the shared generic 3-2.jpg (f1f8723c, wrong-subject temple ruin,
// shared 5-way incl. AWG) -> getting-to-wadi-el-natrun.jpg (desert-road landscape, iconography-
// free, genuinely local). De-entangles Wadi el-Natrun; AWG's pages keep 3-2.jpg untouched.
const NEW_HERO_ASSET = 'image-752c6b372530772cf556c9dfdb16083d6528f96d-3000x2000-jpg';
const REGION = 'lower-egypt'; // city doc region=lower-egypt (2nd Lower-Egypt page after Cairo)

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

// ── Hero alt/caption — AUTHORED, strictly GEOGRAPHIC (desert approach / depression /
//    between two cities). ZERO monastic/religious content, per this page's strict boundary.
const HERO_ALT = {
  en: 'A vehicle on a desert track winding through low arid hills on the approach to Wadi el-Natrun',
  es: 'Un vehículo en una pista desértica que serpentea entre bajas colinas áridas de camino a Wadi el-Natrun',
  ja: 'ワディ・エル・ナトルーンへ向かう、低く乾いた丘陵を縫う砂漠の道を走る一台の車',
};
const HERO_CAPTION = {
  en: 'The desert approach to Wadi el-Natrun — a dry, open depression roughly midway between Cairo and Alexandria.',
  es: 'La llegada por el desierto a Wadi el-Natrun — una depresión seca y abierta más o menos a medio camino entre El Cairo y Alejandría.',
  ja: 'ワディ・エル・ナトルーンへの砂漠の道——カイロとアレクサンドリアのほぼ中間に広がる、乾いて開けたくぼ地。',
};

// ── verbatim copy (from Desktop/wadi-el-natrun-weather-copy.md) ───────────
// STRICT boundary: zero monastic content. Bookend (standfirst=finalword) opens on
// "Wadi el-Natrun sits in a desert depression…" (geographic). The dataset caption was
// updated to a geographic version (owner-approved Option A) so the chart matches the body.
// Headings: EN verbatim; ES/JA 3 reused + 1 NEW (Between Two Cities) FLAGGED.
const EN = {
  standfirst:
    'Wadi el-Natrun sits in a desert depression roughly midway between Cairo and Alexandria, and its climate splits the difference too: cooler than Upper Egypt, calmer than the coast, and comfortable for a day trip from either city across most of the year.',
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is hot but rarely severe, days typically in the mid-30s rather than the low 40s further south — the depression's position between two milder climate zones keeps the worst of the desert heat at bay. Winter (December to February) brings daytime highs in the high teens to low 20s and genuinely cool nights, closer to Cairo's winter than to anywhere in Upper Egypt. Spring can carry the khamsin; autumn is a short, mild transition.",
  h_between: 'Between Two Cities',
  between:
    "What makes Wadi el-Natrun's weather worth knowing is its position: close enough to both Cairo and Alexandria that it works as a single-day trip from either, and far enough into the desert that its climate genuinely differs from both — milder than the capital's summer, drier than the coast's winter. That in-between character makes it one of the more flexible day-trip destinations on the Cairo-Alexandria road, comfortable across a wider stretch of the calendar than most single-city excursions manage.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and water — hot desert days even without the deep south's extremes.")],
    [span('Winter:', ['strong']), span(' a warm layer for the day; mornings and evenings carry real chill even when the afternoon is mild.')],
    [span('Year-round:', ['strong']), span(' comfortable shoes for a day trip involving some walking, and sun protection for the eyes as well as the skin.')],
  ],
  h_final: 'Final Word',
  final:
    'Wadi el-Natrun sits in a desert depression roughly midway between Cairo and Alexandria, and its climate splits the difference too: cooler than Upper Egypt, calmer than the coast, and comfortable for a day trip from either city across most of the year. Plan around mild mornings and cooling evenings, and the desert in between does the rest.',
};

const ES = {
  standfirst:
    'Wadi el-Natrun se asienta en una depresión desértica más o menos a medio camino entre El Cairo y Alejandría, y su clima también reparte las diferencias: más fresco que el Alto Egipto, más tranquilo que la costa, y cómodo para una excursión de un día desde cualquiera de las dos ciudades durante la mayor parte del año.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es caluroso pero rara vez severo, con días que suelen rondar mediados de los 30°C en lugar de los más de 40°C del sur — la posición de la depresión entre dos zonas climáticas más suaves mantiene a raya lo peor del calor del desierto. El invierno (diciembre a febrero) trae máximas diurnas entre los 17 y los 22°C y noches genuinamente frescas, más cercanas al invierno de El Cairo que a cualquier lugar del Alto Egipto. La primavera puede traer el jamsín; el otoño es una transición breve y templada.',
  h_between: 'Entre dos ciudades', // NEW — owner sign-off
  between:
    'Lo que hace que merezca la pena conocer el clima de Wadi el-Natrun es su posición: lo bastante cerca tanto de El Cairo como de Alejandría como para funcionar como una excursión de un solo día desde cualquiera de las dos, y lo bastante adentrada en el desierto como para que su clima difiera genuinamente de ambas — más suave que el verano de la capital, más seco que el invierno de la costa. Ese carácter intermedio la convierte en uno de los destinos de un día más flexibles de la carretera El Cairo-Alejandría, cómoda durante una franja del calendario más amplia de lo que suele permitir una excursión a una sola ciudad.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y agua — días de calor desértico aunque sin los extremos del sur profundo.')],
    [span('Invierno:', ['strong']), span(' una capa de abrigo para el día; las mañanas y las noches tienen un frío real incluso cuando la tarde es templada.')],
    [span('Todo el año:', ['strong']), span(' calzado cómodo para una excursión de un día que implica algo de caminar, y protección solar tanto para los ojos como para la piel.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Wadi el-Natrun se asienta en una depresión desértica más o menos a medio camino entre El Cairo y Alejandría, y su clima también reparte las diferencias: más fresco que el Alto Egipto, más tranquilo que la costa, y cómodo para una excursión de un día desde cualquiera de las dos ciudades durante la mayor parte del año. Planifica en torno a mañanas templadas y noches que refrescan, y el desierto de en medio hace el resto.',
};

const JA = {
  standfirst:
    'ワディ・エル・ナトルーンは、カイロとアレクサンドリアのほぼ中間に位置する砂漠のくぼ地にあり、その気候もちょうど両者の中間をいくものです。上エジプトより涼しく、海岸沿いより穏やかで、一年のほとんどの時期、どちらの街からの日帰り旅にも快適です。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は暑いものの、めったに過酷にはなりません。日中は南部の40度台前半ではなく、30度台半ばであることが多く、二つの穏やかな気候帯にはさまれたこのくぼ地の立地が、砂漠の暑さの最悪の部分を遠ざけてくれます。冬（12月から2月）は日中の最高気温が17度から22度ほど、夜は本当に涼しく、上エジプトのどこよりもカイロの冬に近い体感です。春にはハムシンが訪れることがあり、秋は短く穏やかな移行期です。',
  h_between: '二つの街のあいだで', // NEW — owner sign-off
  between:
    'ワディ・エル・ナトルーンの気候を知る価値があるのは、その位置にあります。カイロからもアレクサンドリアからも、日帰りとして成立するほど近く、それでいて砂漠の奥へと十分入り込んでいるため、両者とはっきり異なる気候になっています——首都の夏より穏やかで、海岸の冬より乾いています。その中間的な性格が、カイロ・アレクサンドリア間の道沿いでも指折りに柔軟な日帰り先にしており、単一都市への日帰りでは得がたいほど広い期間、快適に過ごせます。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして水を——深南部ほどの極端さはなくとも、砂漠の暑い一日になります。')],
    [span('冬：', ['strong']), span('日中のための暖かい一枚を。午後が穏やかでも、朝晩は本当に冷え込みます。')],
    [span('通年：', ['strong']), span('ある程度歩くことになる日帰り旅のための歩きやすい靴と、肌だけでなく目のための日光対策を。')],
  ],
  h_final: '最後に', // reused
  final:
    'ワディ・エル・ナトルーンは、カイロとアレクサンドリアのほぼ中間に位置する砂漠のくぼ地にあり、その気候もちょうど両者の中間をいくものです。上エジプトより涼しく、海岸沿いより穏やかで、一年のほとんどの時期、どちらの街からの日帰り旅にも快適です。穏やかな朝と涼しくなっていく夜を軸に計画すれば、あとはそのあいだに広がる砂漠が残りを引き受けてくれます。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_between), p(x.between),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Wadi el-Natrun', es: 'El Clima en Wadi el-Natrun', ja: 'ワディ・エル・ナトルーンの気候ガイド' },
  desc: {
    en: 'A desert depression between Cairo and Alexandria, cooler and calmer than the deep south — a comfortable day out from either city almost any time of year.',
    es: 'Una depresión desértica entre El Cairo y Alejandría, más fresca y tranquila que el sur profundo — una salida de un día cómoda desde cualquiera de las dos ciudades casi en cualquier época del año.',
    ja: 'カイロとアレクサンドリアのあいだに広がる砂漠のくぼ地で、はるか南よりも涼しく穏やかです——ほぼ一年を通して、どちらの街からも快適な日帰り旅ができます。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/wadi-el-natrun-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.between], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) checks.push([loc + ':desc', (META.desc as any)[loc]]);
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(apos(str).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} strings all present in copy file`);
  // strict boundary: no monastic content anywhere in the new body
  const allNew = [EN, ES, JA].flatMap((C) => [C.standfirst, C.shape, C.between, C.final, ...C.pack.map((b) => b.map((s) => s.text).join(''))]).join(' ');
  const monastic = /monaster|monasterio|修道|monk|wool|habit|hábito|ウール|Macarius|Pishoy|Paromeos|Syrian Mon|Coptic|copt/i.test(allNew);
  console.log(`  strict boundary — zero monastic content in body: ${!monastic}`);
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
