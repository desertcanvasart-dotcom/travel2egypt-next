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

const ID = 'wp-page-60647';
// HERO SWAP: Luxor-Temple-at-Sunset 800x450 -> sunrise-balloon-over-West-Bank 3000x2000.
const NEW_HERO_ASSET = 'image-41b11bdf6de0995ea221e262be6eb0b59c59fe1d-3000x2000-jpg';
const REGION = 'upper-egypt';

let kc = 0;
const K = () => `x${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── Hero alt/caption — AUTHORED (not in locked copy); factual to the image
//    (sunrise balloons over Luxor's West Bank). Note curly apostrophe in EN caption.
const HERO_ALT = {
  en: 'Hot-air balloons rising at sunrise over the West Bank of Luxor, the Nile and desert cliffs catching the first light of day',
  es: 'Globos aerostáticos ascendiendo al amanecer sobre la Orilla Occidental de Luxor, con el Nilo y los acantilados del desierto captando la primera luz del día',
  ja: '夜明けにルクソール西岸の上空へと昇る熱気球。ナイル川と砂漠の断崖が一日の最初の光を受けている',
};
const HERO_CAPTION = {
  en: 'Sunrise over Luxor’s West Bank — the cool early hour the whole summer itinerary is built around.',
  es: 'Amanecer sobre la Orilla Occidental de Luxor — la hora fresca en torno a la que se organiza todo el itinerario de verano.',
  ja: 'ルクソール西岸に昇る朝日——夏の旅程全体が組み立てられる、涼しい早朝の時間。',
};

// ── verbatim copy (from Desktop/luxor-weather-copy.md) ────────────────────
// "Luxor's" / "isn't" / "it's" authored with CURLY apostrophes to match the
// now-corrected dataset chart caption (owner-directed). Preflight normalizes
// apostrophe glyphs so these validate against the straight-quote source .md.
// Headings: EN verbatim. ES/JA — 3 reused; 1 NEW (The Order the Heat Demands) FLAGGED.
const EN = {
  standfirst:
    "Luxor’s weather writes the itinerary: West Bank tombs at eight, Karnak before noon, felucca at five — from May to September that order isn’t advice, it’s survival. This is the largest open-air museum on earth, and the heat here decides, more than any guidebook does, what you’ll actually see and when.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is severe, days regularly past 42°C — a degree hotter than Upper Egypt’s other river towns, and the reason Luxor’s own itinerary logic exists in the first place. Winter (December to February) is the reward: daytime highs in the low-to-mid 20s and nights that fall to single digits, a seventeen-degree nightly swing that makes evenings genuinely comfortable after a hot day. Spring and autumn are short, hot transitions with the occasional khamsin sandstorm in spring.",
  h_order: 'The Order the Heat Demands',
  order:
    "Luxor holds more open-air ancient sites than anywhere else on earth, and in summer, the heat sets a real schedule around them. The West Bank tombs come first, at first light, because their sun-facing approach turns punishing by mid-morning. Karnak follows before noon, its scale demanding time you won’t have once the day peaks. The felucca waits until five, when the river finally offers what the stone hasn’t all day: shade and a breeze. This sequence isn’t a suggestion from May to September — it’s the only order that actually works.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' light, breathable clothing, strong sunscreen, and a genuinely early alarm clock — the West Bank tombs reward whoever arrives before the heat does.')],
    [span('Winter:', ['strong']), span(' warm layers for the evening; the seventeen-degree nightly drop is real, and river evenings get cool fast.')],
    [span('Year-round:', ['strong']), span(' sun protection for the eyes as well as the skin, and water in far greater quantity than feels necessary at 8 a.m.')],
  ],
  h_final: 'Final Word',
  final:
    "Luxor’s weather writes the itinerary: West Bank tombs at eight, Karnak before noon, felucca at five — from May to September that order isn’t advice, it’s survival. Respect the sequence, and the largest open-air museum on earth becomes entirely manageable, one cool hour at a time.",
};

const ES = {
  standfirst:
    'El clima de Luxor escribe el itinerario: las tumbas de la Orilla Occidental a las ocho, Karnak antes del mediodía, felucca a las cinco — de mayo a septiembre, ese orden no es un consejo, es supervivencia. Este es el museo al aire libre más grande del planeta, y aquí el calor decide, más que cualquier guía, qué verás realmente y cuándo.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es severo, con días que superan regularmente los 42°C — un grado más que otras ciudades ribereñas del Alto Egipto, y la razón por la que existe, para empezar, la lógica del propio itinerario de Luxor. El invierno (diciembre a febrero) es la recompensa: máximas diurnas entre 20 y 25°C y noches que caen a un solo dígito, un giro nocturno de diecisiete grados que hace que las tardes resulten genuinamente agradables después de un día caluroso. La primavera y el otoño son transiciones breves y calurosas, con el jamsín ocasional en primavera.',
  h_order: 'El orden que impone el calor', // NEW — owner sign-off
  order:
    'Luxor concentra más yacimientos antiguos al aire libre que ningún otro lugar del planeta, y en verano, el calor impone un horario real en torno a ellos. Las tumbas de la Orilla Occidental van primero, con la primera luz, porque su exposición al sol las vuelve implacables a media mañana. Karnak sigue antes del mediodía, con una escala que exige un tiempo que ya no tendrás una vez que el día alcance su punto álgido. La felucca espera hasta las cinco, cuando el río por fin ofrece lo que la piedra no ha dado en todo el día: sombra y brisa. Este orden no es una sugerencia de mayo a septiembre — es el único que realmente funciona.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y un despertador genuinamente temprano — las tumbas de la Orilla Occidental premian a quien llega antes que el calor.')],
    [span('Invierno:', ['strong']), span(' capas de abrigo para la noche; el descenso nocturno de diecisiete grados es real, y las tardes junto al río se enfrían rápido.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel, y mucha más agua de la que parece necesaria a las 8 de la mañana.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'El clima de Luxor escribe el itinerario: las tumbas de la Orilla Occidental a las ocho, Karnak antes del mediodía, felucca a las cinco — de mayo a septiembre, ese orden no es un consejo, es supervivencia. Respeta la secuencia, y el museo al aire libre más grande del planeta se vuelve completamente manejable, una hora fresca a la vez.',
};

const JA = {
  standfirst:
    'ルクソールの気候が旅程そのものを決めてしまいます——西岸の墓群は8時、カルナックは正午前、ファルーカは5時。5月から9月にかけて、この順番は単なる助言ではなく、生き延びるための鉄則です。ここは地上最大の屋外博物館であり、どのガイドブックよりも、実際に何を、いつ見られるかを決めているのはこの暑さなのです。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は過酷で、日中は42°Cを超える日が続きます——上エジプトの他の川沿いの町より1度高く、そもそもルクソール独自の旅程の論理が存在する理由でもあります。冬（12月から2月）はその見返りです。日中の最高気温は20度台前半から半ば、夜は一桁台まで下がり、17度の夜間の差が、暑い一日のあとの夕方を本当に心地よいものにしてくれます。春と秋は短く暑い移行期で、春には時おりハムシンの砂嵐が訪れます。',
  h_order: '暑さが命じる順序', // NEW — owner sign-off
  order:
    'ルクソールには、地上のどこよりも多くの野外古代遺跡が集まっており、夏にはその暑さが、それらを巡る実際のスケジュールを決めてしまいます。西岸の墓群がまず最初、まだ薄暗いうちに訪れます。日当たりの良い立地のせいで、午前半ばには耐えがたくなるからです。カルナックは正午前に続きます。その規模は、日が最も高くなったあとにはもう残っていない時間を要求します。ファルーカは5時まで待ちます。石が一日じゅう与えてくれなかったもの——日陰と風——を、川がようやく差し出してくれる時間だからです。この順序は5月から9月のあいだ、提案ではありません。実際に機能する唯一の順序なのです。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして本当に早い目覚まし時計を——西岸の墓群は、暑さより先に到着した人に報いてくれます。')],
    [span('冬：', ['strong']), span('夜のための暖かい重ね着を。17度の夜間の気温差は本物で、川辺の夕方はすぐに冷え込みます。')],
    [span('通年：', ['strong']), span('肌だけでなく目のための日光対策と、午前8時の時点で必要だと感じる以上の水を。')],
  ],
  h_final: '最後に', // reused
  final:
    'ルクソールの気候が旅程そのものを決めてしまいます——西岸の墓群は8時、カルナックは正午前、ファルーカは5時。5月から9月にかけて、この順番は単なる助言ではなく、生き延びるための鉄則です。この順序を守れば、地上最大の屋外博物館も、涼しい一時間ずつ、十分に手に負えるものになります。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_order), p(x.order),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Luxor', es: 'El Clima en Luxor', ja: 'ルクソールの気候ガイド' },
  desc: {
    en: "Luxor’s weather writes the itinerary — West Bank tombs at eight, Karnak before noon, felucca at five. From May to September, that order isn’t advice, it’s survival.",
    es: 'El clima de Luxor escribe el itinerario — las tumbas de la Orilla Occidental a las ocho, Karnak antes del mediodía, felucca a las cinco. De mayo a septiembre, ese orden no es un consejo, es supervivencia.',
    ja: 'ルクソールの気候が旅程そのものを決めてしまいます——西岸の墓群は8時、カルナックは正午前、ファルーカは5時。5月から9月にかけて、この順番は単なる助言ではなく、生き延びるための鉄則です。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/luxor-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.order], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) checks.push([loc + ':desc', (META.desc as any)[loc]]);
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(apos(str).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} strings all present in copy file`);
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
