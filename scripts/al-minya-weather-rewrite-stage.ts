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

const ID = 'wp-page-58638';
// HERO SWAP: reliefs-on-columns.jpg 400x265 (generic, shared w/ Dakhla) -> al-minya.jpg 3000x2000 (city-hub Nile-valley, viewed).
const NEW_HERO_ASSET = 'image-b9ebafc3c263853c9910caa842b276e4bb30b342-3000x2000-jpg';
const REGION = 'upper-egypt'; // REGIONS enum has no "middle-egypt"; city doc + neighbours all upper-egypt

let kc = 0;
const K = () => `m${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── Hero alt/caption — AUTHORED (not in locked copy). Alt literal to the scene
//    (Nile, palm groves, limestone cliffs); caption climate/geography framed
//    (the valley + the river you cross for the far-bank tombs). No monument desc.
const HERO_ALT = {
  en: 'The Nile at Al-Minya, palm groves and green fields along the water with the limestone cliffs of Middle Egypt rising behind',
  es: 'El Nilo a su paso por Al-Minya, con palmerales y campos verdes junto al agua y los acantilados calizos del Egipto Medio al fondo',
  ja: 'アル・ミニヤのナイル川。水辺にはナツメヤシの木立と緑の畑が広がり、背後には中部エジプトの石灰岩の崖がそびえる',
};
const HERO_CAPTION = {
  en: 'The Nile at Al-Minya — the green valley narrowing between limestone cliffs, and the river you cross for the tombs on the far bank.',
  es: 'El Nilo a su paso por Al-Minya — el valle verde estrechándose entre acantilados calizos, y el río que se cruza para llegar a las tumbas de la otra orilla.',
  ja: 'アル・ミニヤのナイル川——石灰岩の崖のあいだに狭まる緑の谷と、対岸の墓所へ渡るための川。',
};

// ── verbatim copy (from Desktop/al-minya-weather-copy.md) ─────────────────
// Caption has NO apostrophes → bookend glyph-clean, no curl needed. Body ships
// the copy's straight apostrophes as-is. Standfirst uses a COLON after "deep
// south"; Final Word uses an EM-DASH (matches caption) — asymmetry FLAGGED.
// Headings: EN verbatim. ES/JA — 3 reused; 1 NEW (Winter Mornings at Their Best) FLAGGED.
const EN = {
  standfirst:
    "Middle Egypt runs a degree cooler than the deep south: Amarna and Beni Hasan are winter mornings at their best, with a jacket for the boat crossing. Al-Minya isn't on most first-time itineraries, and the climate here rewards exactly the kind of traveller who's already decided that's a reason to come, not a reason to skip it.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is severe, days regularly past 40°C — Upper Egypt's heat reaching this far north with little relief until the sun drops. Winter (December to February) brings daytime highs in the low-to-mid 20s and the coldest nights of any city on this stretch of the Nile, often dropping into single digits before dawn. Spring and autumn are short, hot transitions, with the occasional khamsin sandstorm in spring.",
  h_winter: 'Winter Mornings at Their Best',
  winter:
    "The reason to brave Al-Minya's cold nights is the same reason they're worth bracing for: Amarna and Beni Hasan, two of Middle Egypt's least-visited major sites, are genuinely best seen in the sharp light of a winter morning, before the day's heat flattens the detail on painted tomb walls and sunlit relief. The Nile crossing to reach them is part of the appeal, not an obstacle — bring the jacket the dawn air actually demands, and the reward is a version of ancient Egypt without another visitor in sight.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and plenty of water — Upper Egypt heat with no coastline nearby.")],
    [span('Winter:', ['strong']), span(' a genuinely warm jacket for pre-dawn boat crossings and early tomb visits; this is the coldest stretch of the Nile Valley after dark.')],
    [span('Year-round:', ['strong']), span(' sun protection for the eyes as well as the skin.')],
  ],
  h_final: 'Final Word',
  final:
    "Middle Egypt runs a degree cooler than the deep south — Amarna and Beni Hasan are winter mornings at their best, with a jacket for the boat crossing. Al-Minya asks a little more of the traveller than Luxor or Aswan does, and the quiet, unhurried version of ancient Egypt it offers in return is exactly why that's worth it.",
};

const ES = {
  standfirst:
    'El Egipto Medio corre un grado más fresco que el sur profundo: Amarna y Beni Hasan son las mañanas de invierno en su mejor momento, con una chaqueta para el cruce en barca. Al-Minya no está en la mayoría de los itinerarios de primera visita, y el clima de aquí premia exactamente al tipo de viajero que ya ha decidido que eso es un motivo para venir, no para saltárselo.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es severo, con días que superan regularmente los 40°C — el calor del Alto Egipto llegando hasta aquí, tan al norte, con poco alivio hasta que cae el sol. El invierno (diciembre a febrero) trae máximas diurnas entre 20 y 25°C y las noches más frías de cualquier ciudad en este tramo del Nilo, que a menudo bajan a un solo dígito antes del amanecer. La primavera y el otoño son transiciones breves y calurosas, con el jamsín ocasional en primavera.',
  h_winter: 'Mañanas de invierno en su mejor momento', // NEW — owner sign-off
  winter:
    'La razón para enfrentar las noches frías de Al-Minya es la misma razón por la que merece la pena soportarlas: Amarna y Beni Hasan, dos de los yacimientos principales menos visitados del Egipto Medio, se ven genuinamente mejor con la luz nítida de una mañana de invierno, antes de que el calor del día aplane el detalle de las paredes pintadas de las tumbas y los relieves iluminados por el sol. El cruce del Nilo para llegar hasta ellos forma parte del atractivo, no un obstáculo — trae la chaqueta que el aire del amanecer realmente exige, y la recompensa es una versión del Egipto antiguo sin otro visitante a la vista.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y mucha agua — calor del Alto Egipto sin costa cerca.')],
    [span('Invierno:', ['strong']), span(' una chaqueta genuinamente abrigada para los cruces en barca antes del amanecer y las primeras visitas a las tumbas; este es el tramo más frío del valle del Nilo tras el anochecer.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel.')],
  ],
  h_final: 'Para terminar', // reused
  // ES Final Word: colon -> em-dash (owner-directed) so it closes on the caption's
  // own punctuation, matching EN's colon-opens / em-dash-closes shape. Standfirst
  // colon stays. This is the ONE intentional deviation from the .md source.
  final:
    'El Egipto Medio corre un grado más fresco que el sur profundo — Amarna y Beni Hasan son las mañanas de invierno en su mejor momento, con una chaqueta para el cruce en barca. Al-Minya pide un poco más al viajero de lo que piden Luxor o Asuán, y la versión tranquila y sin prisa del Egipto antiguo que ofrece a cambio es exactamente la razón por la que vale la pena.',
};

const JA = {
  standfirst:
    '中部エジプトは、はるか南よりも1度涼しい気候を保っています。アマルナとベニ・ハサンは、冬の朝がもっとも美しい時間帯——渡し船にはジャケットをお忘れなく。アル・ミニヤはほとんどの初めての旅程には入っていませんが、この気候は、それをスキップする理由ではなく訪れる理由だとすでに決めている旅行者にこそ、正しく報いてくれます。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は過酷で、日中は40°Cを超える日が続きます——上エジプトの暑さがここまで北に達し、太陽が沈むまでほとんど和らぎません。冬（12月から2月）は日中の最高気温が20度台前半から半ば、そしてこのナイル沿いの区間にあるどの都市よりも寒い夜をもたらし、夜明け前には一桁台まで下がることもしばしばです。春と秋は短く暑い移行期で、春には時おりハムシンの砂嵐が訪れます。',
  h_winter: '冬の朝がもっとも美しい時間', // NEW — owner sign-off
  winter:
    'アル・ミニヤの寒い夜に立ち向かう理由は、それに耐えるだけの価値がある理由と同じです。アマルナとベニ・ハサン——中部エジプトで最も訪問者の少ない主要な遺跡のふたつ——は、日中の暑さが彩色墓室の壁や陽光を浴びたレリーフの細部を平板にしてしまう前の、冬の朝の鋭い光の中でこそ、本当に美しく見えます。そこへ渡るナイル川の船旅は障害ではなく、魅力の一部です。夜明けの空気が実際に求めてくるジャケットを持っていけば、その先には、他に訪問者の姿が見えない古代エジプトが待っています。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そしてたっぷりの水を——海岸のない上エジプトの暑さです。')],
    [span('冬：', ['strong']), span('夜明け前の渡し船と早朝の墓所訪問のための、本当に暖かいジャケットを。ここは日没後、ナイル渓谷でもっとも冷え込む区間です。')],
    [span('通年：', ['strong']), span('肌だけでなく目のための日光対策も。')],
  ],
  h_final: '最後に', // reused
  final:
    '中部エジプトは、はるか南よりも1度涼しい気候を保っています。アマルナとベニ・ハサンは、冬の朝がもっとも美しい時間帯——渡し船にはジャケットをお忘れなく。アル・ミニヤは、ルクソールやアスワンよりも旅行者に少しだけ多くを求めます。そしてその見返りに差し出される、静かで急がされることのない古代エジプトの姿こそが、それだけの価値がある理由です。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_winter), p(x.winter),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Al-Minya', es: 'El Clima en Al-Minya', ja: 'アル・ミニヤの気候ガイド' },
  desc: {
    en: 'Middle Egypt runs a degree cooler than the deep south — Amarna and Beni Hasan are winter mornings at their best, with a jacket for the boat crossing.',
    es: 'El Egipto Medio corre un grado más fresco que el sur profundo — Amarna y Beni Hasan son las mañanas de invierno en su mejor momento, con una chaqueta para el cruce en barca.',
    ja: '中部エジプトは、はるか南よりも1度涼しい気候を保っています。アマルナとベニ・ハサンは、冬の朝がもっとも美しい時間帯——渡し船にはジャケットをお忘れなく。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  // Treat the caption-join colon/em-dash after "deep south"/"sur profundo" as
  // equivalent — the ONE owner-directed deviation (ES Final Word :→—). Scoped to
  // that exact join so all other punctuation stays strict.
  const joinNorm = (s: string) => s.replace(/(profundo|south)\s*[—:–-]\s*(Amarna)/gi, '$1 $2');
  const flatStrip = joinNorm(apos(fs.readFileSync('/Users/islamhussein/Desktop/al-minya-weather-copy.md', 'utf8')))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.winter], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) checks.push([loc + ':desc', (META.desc as any)[loc]]);
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(joinNorm(apos(str)).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} strings all present in copy file`);
  const allNew = [EN, ES, JA].flatMap((C) => [C.standfirst, C.shape, C.winter, C.final, ...C.pack.map((b) => b.map((s) => s.text).join(''))]).join(' ');
  console.log(`  filler tic ("climate seasonal"/季節的な) absent: ${!/climate seasonal|seasonal climate|climático,? desértico seasonal|季節的な天候パターン/i.test(allNew)}`);
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
