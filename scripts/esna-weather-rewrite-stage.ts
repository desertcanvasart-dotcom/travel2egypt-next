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

const ID = 'wp-page-59605';
// HERO SWAP: IMG-20240421-WA0003-1 680x450 (shared 4-way, 2 wrong-city) -> el-kab-and-esna-temple 3000x2000.
const NEW_HERO_ASSET = 'image-6d203717318018cac350ac715e6c0219fc66f35b-3000x2000-jpg';
const REGION = 'upper-egypt';

let kc = 0;
const K = () => `e${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── Hero alt/caption — AUTHORED (not in locked copy). Alt is literal to the
//    visible scene (visitor touching a carved temple column, colonnade behind);
//    caption is climate-timing framed (morning temple, before the heat/boats) —
//    deliberately NO architecture/history claims (overlap discipline).
const HERO_ALT = {
  en: 'A visitor reaches up to touch the carved hieroglyphs on an ancient temple column, a colonnaded hall rising behind in warm light',
  es: 'Una visitante alza la mano para tocar los jeroglíficos tallados en una antigua columna de templo, con una sala de columnas alzándose detrás bajo una luz cálida',
  ja: '訪問者が古代神殿の柱に刻まれた象形文字に手を伸ばす。背後には暖かい光の中に列柱の広間がそびえている',
};
const HERO_CAPTION = {
  en: 'Esna’s morning temple in the early light — the cool hour to see it, before the heat builds and the boats move on.',
  es: 'El templo matutino de Esna con la primera luz — la hora fresca para verlo, antes de que apriete el calor y los barcos sigan su camino.',
  ja: '朝の光に照らされたエスナの神殿——暑さが増し、船が動き出す前の、涼しい時間に見るのがいい。',
};

// ── verbatim copy (from Desktop/esna-weather-copy.md) ─────────────────────
// Esna captions contain NO apostrophes/quotes → no straight/curly issue.
// Headings: EN verbatim. ES/JA — 3 reused; 1 NEW (Before the Boats Move On) FLAGGED.
const EN = {
  standfirst:
    "Esna happens while the boats queue for the lock — a morning temple with a restored ceiling worth every waiting minute, in a climate that says go before lunch. This is a smaller stop than Luxor or Aswan, and the weather here has one clear opinion about how to use it well.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is severe, days regularly past 40°C with little relief until the sun drops — Upper Egypt heat at its most unrelenting. Winter (December to February) brings daytime highs in the low-to-mid 20s and nights that fall into single digits, a sixteen-degree swing that makes river evenings genuinely pleasant. Spring and autumn are short, hot transitions, with the occasional khamsin sandstorm in spring.",
  h_boats: 'Before the Boats Move On',
  boats:
    "Cruise boats stop here whether they mean to linger or not — the Esna lock backs up traffic on the river, and that pause is the town's real opportunity. The Temple of Khnum sits a short walk from the water, its ceiling restored enough to show what colour looked like on these walls new, and the smart move is the same one the climate itself suggests: go while the morning is still cool and before the queue clears and the boats move on.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and a plan to see the temple before mid-morning if you're stopping en route.")],
    [span('Winter:', ['strong']), span(" warm layers for the evening; river air cools fast once the sun's down.")],
    [span('Year-round:', ['strong']), span(' sun protection for the eyes as well as the skin, and patience for the lock — it sets the schedule here more than any itinerary does.')],
  ],
  h_final: 'Final Word',
  final:
    "Esna happens while the boats queue for the lock — a morning temple with a restored ceiling worth every waiting minute, in a climate that says go before lunch. It's a small window in a small town, and the weather here rewards whoever actually takes it.",
};

const ES = {
  standfirst:
    'Esna sucede mientras los barcos hacen cola para la esclusa — un templo matutino con un techo restaurado que merece cada minuto de espera, en un clima que aconseja ir antes del almuerzo. Es una parada más pequeña que Luxor o Asuán, y aquí el clima tiene una opinión clara sobre cómo aprovecharla bien.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es severo, con días que superan regularmente los 40°C y poco alivio hasta que cae el sol — el calor del Alto Egipto en su versión más implacable. El invierno (diciembre a febrero) trae máximas diurnas entre 20 y 25°C y noches que caen a un solo dígito, un giro de dieciséis grados que hace que las tardes junto al río resulten genuinamente agradables. La primavera y el otoño son transiciones breves y calurosas, con el jamsín ocasional en primavera.',
  h_boats: 'Antes de que los barcos sigan su camino', // NEW — owner sign-off
  boats:
    'Los cruceros paran aquí quieran o no — la esclusa de Esna genera retenciones en el río, y esa pausa es la verdadera oportunidad del pueblo. El Templo de Khnum está a un corto paseo del agua, con su techo lo bastante restaurado como para mostrar cómo era el color en estos muros cuando eran nuevos, y la jugada inteligente es la misma que sugiere el propio clima: ir mientras la mañana todavía es fresca y antes de que la cola se despeje y los barcos sigan su camino.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y un plan para ver el templo antes de media mañana si haces escala de paso.')],
    [span('Invierno:', ['strong']), span(' capas de abrigo para la noche; el aire del río se enfría rápido en cuanto se pone el sol.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel, y paciencia para la esclusa — aquí marca el horario más que cualquier itinerario.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Esna sucede mientras los barcos hacen cola para la esclusa — un templo matutino con un techo restaurado que merece cada minuto de espera, en un clima que aconseja ir antes del almuerzo. Es una ventana pequeña en un pueblo pequeño, y el clima de aquí premia a quien realmente la aprovecha.',
};

const JA = {
  standfirst:
    'エスナは船が水門の順番待ちをしている間に訪れる街です。修復された天井を持つ朝の神殿は、待ち時間に見合う価値があります。そしてこの気候は、昼食前に行けと教えてくれます。ここはルクソールやアスワンより小さな寄港地であり、この気候には、それをうまく使う方法について、はっきりとした意見があります。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は過酷で、日中は40°Cを超える日が続き、太陽が沈むまでほとんど和らぎません——上エジプトの暑さが最も容赦なく現れる季節です。冬（12月から2月）は日中の最高気温が20度台前半から半ば、夜は一桁台まで下がり、16度の差が川辺の夕方を本当に心地よいものにしてくれます。春と秋は短く暑い移行期で、春には時おりハムシンの砂嵐が訪れます。',
  h_boats: '船が動き出す前に', // NEW — owner sign-off
  boats:
    'クルーズ船は、意図するとしないとにかかわらずここで止まります——エスナの水門が川の交通を滞らせ、その足止めこそがこの町の本当の好機です。クヌム神殿は水辺からほんの少し歩いた場所にあり、その天井は、これらの壁が新しかった頃の色合いを見せてくれるほどに修復されています。賢い選択は、気候そのものが示唆するものと同じです。朝がまだ涼しいうちに、列がさばけて船が動き出す前に行くことです。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして途中で立ち寄るなら午前半ばまでに神殿を見る計画を。')],
    [span('冬：', ['strong']), span('夜のための暖かい重ね着を。日が沈めば川の空気はすぐに冷えます。')],
    [span('通年：', ['strong']), span('肌だけでなく目のための日光対策と、水門への忍耐を——どんな旅程よりも、ここではそれがスケジュールを決めます。')],
  ],
  h_final: '最後に', // reused
  final:
    'エスナは船が水門の順番待ちをしている間に訪れる街です。修復された天井を持つ朝の神殿は、待ち時間に見合う価値があります。そしてこの気候は、昼食前に行けと教えてくれます。小さな町の小さな窓であり、ここの気候は、それを実際に活かす人に報いてくれます。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_boats), p(x.boats),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Esna', es: 'El Clima en Esna', ja: 'エスナの気候ガイド' },
  desc: {
    en: 'Esna happens while the boats queue for the lock — a morning temple with a restored ceiling worth every waiting minute, in a climate that says go before lunch.',
    es: 'Esna sucede mientras los barcos hacen cola para la esclusa — un templo matutino con un techo restaurado que merece cada minuto de espera, en un clima que aconseja ir antes del almuerzo.',
    ja: 'エスナは船が水門の順番待ちをしている間に訪れる街です。修復された天井を持つ朝の神殿は、待ち時間に見合う価値があります。そしてこの気候は、昼食前に行けと教えてくれます。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/esna-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.boats], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) checks.push([loc + ':desc', (META.desc as any)[loc]]);
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(apos(str).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} strings all present in copy file`);
  // "weather seasonal" / 季節的な天候 filler tic must be ABSENT from new copy
  const allNew = [EN, ES, JA].flatMap((C) => [C.standfirst, C.shape, C.boats, C.final, ...C.pack.map((b) => b.map((s) => s.text).join(''))]).join(' ');
  const tic = /weather seasonal|seasonal weather|季節的な天候/i.test(allNew);
  console.log(`filler tic ("weather seasonal"/季節的な天候) absent from new copy: ${!tic}`);
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
