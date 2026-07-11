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

const ID = 'wp-page-60321';
// HERO SWAP: Siwa Oracle Temple (wrong region) -> Hathor-at-Dendera.
const NEW_HERO_ASSET = 'image-a9d8a5823e2515b28604771202d4de29bea56832-2600x1730-jpg';
const REGION = 'upper-egypt'; // canonical REGIONS enum (city.ts); Qena city doc = upper-egypt

let kc = 0;
const K = () => `q${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── Hero alt/caption — AUTHORED (not in locked copy); factual to the image
//    (painted hieroglyphic carvings / columns of the Temple of Hathor at Dendera).
const HERO_ALT = {
  en: 'Painted hieroglyphic carvings on the columns and ceiling of the Temple of Hathor at Dendera, colour still visible on the ancient stone',
  es: 'Relieves jeroglíficos pintados en las columnas y el techo del Templo de Hathor en Dendera, con el color todavía visible sobre la piedra antigua',
  ja: 'デンデラのハトホル神殿の柱と天井に描かれた彩色された象形文字のレリーフ。古代の石にいまも色が残っている',
};
const HERO_CAPTION = {
  en: 'At Dendera, just north of Qena, the Temple of Hathor still carries its original paint across carved stone.',
  es: 'En Dendera, justo al norte de Qena, el Templo de Hathor conserva su pintura original sobre la piedra tallada.',
  ja: 'ケナのすぐ北にあるデンデラのハトホル神殿は、彫られた石の上に当時の彩色をいまも残している。',
};

// ── verbatim copy (from Desktop/qena-weather-copy.md) ─────────────────────
// Headings: EN verbatim. ES/JA — 3 reused (Shape / What to Pack / Final Word);
// 2 NEW (Dendera's Ceiling, The Only Real Decision) FLAGGED for sign-off.
const EN = {
  // "Qena's" normalized to a curly apostrophe (U+2019) to match the dataset
  // chart caption that renders on this same page (owner-directed; source .md typo).
  standfirst:
    "Qena’s climate is not complicated. It is honest: rainless, bright, and seventeen degrees cooler every night than the afternoon that preceded it — the season decision here is heat, nothing else. What the city rarely gets credit for is what sits just north of it: the Temple of Hathor at Dendera, whose ceiling still carries its original paint, in some of the finest-preserved relief carving anywhere in Egypt.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is severe, days regularly past 40°C with almost no relief until the sun drops — this is deep Upper Egypt heat, dry and unbroken. Winter (December to February) is the reward: daytime highs in the low-to-mid 20s and nights that fall close to freezing, a genuine seventeen-degree swing from the afternoon that came before. Spring and autumn are short, hot transitions either side of the extremes, with the occasional khamsin sandstorm in spring.",
  h_dendera: "Dendera's Ceiling",
  dendera:
    "The Temple of Hathor at Dendera sits close enough to Qena to be a morning errand rather than a journey, and it holds something rare in Egyptian archaeology: a ceiling that still carries its original astronomical paintings, colour intact after two thousand years underground beneath later construction before excavation brought it back to light. Visit in the cooler months and the temple's stone interior stays genuinely comfortable well into the day — a small mercy that Upper Egypt's open-air sites rarely offer.",
  h_decision: 'The Only Real Decision',
  decision:
    "There's no real weather strategy required in Qena beyond one choice: come in the cooler months, or accept that midday summer heat will dictate every hour of the day for you. Rainless, sunny, and almost mathematically predictable, Qena’s climate rewards simple planning far more than it punishes bad planning — as long as you respect the one variable that actually matters here.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and a plan to see Dendera's temple interior in the early morning before the heat sets in fully.")],
    [span('Winter:', ['strong']), span(' warm layers for the evening; the seventeen-degree nightly drop is not an exaggeration.')],
    [span('Year-round:', ['strong']), span(" sun protection for the eyes as much as the skin — there's very little haze to soften the light here.")],
  ],
  h_final: 'Final Word',
  final:
    "Qena’s climate is not complicated. It is honest: rainless, bright, and seventeen degrees cooler every night than the afternoon that preceded it — the season decision here is heat, nothing else. Come in the cool months, give Dendera's ceiling the morning it deserves, and let the rest of the day settle into whatever shade you can find.",
};

const ES = {
  standfirst:
    'El clima de Qena no es complicado. Es honesto: sin lluvias, luminoso, y diecisiete grados más fresco cada noche que la tarde que la precedió — aquí la decisión de la temporada es el calor, y nada más. Lo que la ciudad rara vez recibe el crédito que merece es lo que se encuentra justo al norte: el Templo de Hathor en Dendera, cuyo techo todavía conserva su pintura original, en uno de los relieves mejor preservados de todo Egipto.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es severo, con días que superan regularmente los 40°C y casi ningún alivio hasta que cae el sol — este es el calor profundo del Alto Egipto, seco e ininterrumpido. El invierno (diciembre a febrero) es la recompensa: máximas diurnas entre 20 y 25°C y noches que caen cerca de la congelación, un giro genuino de diecisiete grados respecto a la tarde anterior. La primavera y el otoño son transiciones breves y calurosas a ambos lados de los extremos, con el jamsín ocasional en primavera.',
  h_dendera: 'El techo de Dendera', // NEW — owner sign-off
  dendera:
    'El Templo de Hathor en Dendera se encuentra lo bastante cerca de Qena como para ser una excursión de una mañana y no un viaje, y guarda algo poco frecuente en la arqueología egipcia: un techo que todavía conserva sus pinturas astronómicas originales, con el color intacto tras dos mil años enterrado bajo construcciones posteriores, antes de que la excavación lo devolviera a la luz. Visítalo en los meses más frescos y el interior de piedra del templo se mantiene genuinamente agradable hasta bien entrado el día — una pequeña gracia que los yacimientos al aire libre del Alto Egipto rara vez ofrecen.',
  h_decision: 'La única decisión real', // NEW — owner sign-off
  decision:
    'En Qena no hace falta ninguna estrategia climática real más allá de una sola decisión: venir en los meses más frescos, o aceptar que el calor del mediodía en verano dictará cada hora del día por ti. Sin lluvias, soleado y casi matemáticamente predecible, el clima de Qena premia la planificación sencilla mucho más de lo que castiga la mala planificación — siempre que respetes la única variable que aquí realmente importa.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y un plan para ver el interior del templo de Dendera a primera hora de la mañana, antes de que el calor se instale por completo.')],
    [span('Invierno:', ['strong']), span(' capas de abrigo para la noche; el descenso nocturno de diecisiete grados no es una exageración.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel — aquí hay muy poca bruma que suavice la luz.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'El clima de Qena no es complicado. Es honesto: sin lluvias, luminoso, y diecisiete grados más fresco cada noche que la tarde que la precedió — aquí la decisión de la temporada es el calor, y nada más. Ven en los meses frescos, dedica al techo de Dendera la mañana que merece, y deja que el resto del día se asiente en cualquier sombra que encuentres.',
};

const JA = {
  standfirst:
    'ケナの気候は複雑ではありません。ただ正直なだけです——雨は降らず、明るく、夜はその日の午後より17度も涼しくなります。ここで季節を決めるのは暑さ、それだけです。この街があまり評価されていないのは、そのすぐ北にあるものです。デンデラのハトホル神殿——その天井はいまも当時の彩色を残しており、エジプトでも屈指の保存状態を誇るレリーフのひとつです。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は過酷で、日中は40°Cを超える日が続き、太陽が沈むまでほとんど和らぎません——これは上エジプト奥地の暑さ、乾いて途切れることのない暑さです。冬（12月から2月）はその見返りです。日中の最高気温は20度台前半から半ば、夜は氷点近くまで冷え込み、その日の午後との差はまさに17度に達します。春と秋は両極端のあいだの短く暑い移行期で、春には時おりハムシンの砂嵐が訪れます。',
  h_dendera: 'デンデラの天井', // NEW — owner sign-off
  dendera:
    'デンデラのハトホル神殿は、旅というよりも午前中の外出で行ける距離にケナから位置しており、エジプト考古学の中でも稀なものを備えています——今なお当時のままの天文図が残る天井です。後世の建造物の下に2000年間埋もれていた色彩は、発掘によって再び光のもとに戻されたあとも、いまだ鮮やかさを保っています。涼しい季節に訪れれば、神殿の石造りの内部は日中もかなり長く快適さを保ちます——上エジプトの屋外遺跡がめったに与えてくれない、ささやかな恵みです。',
  h_decision: '唯一の本当の決断', // NEW — owner sign-off
  decision:
    'ケナでは、たったひとつの選択を除けば、本当の意味での気候戦略は必要ありません。涼しい季節に来るか、あるいは夏の正午の暑さがその日のすべての時間を支配することを受け入れるか。雨は降らず、晴れており、ほとんど数式のように予測可能なケナの気候は、悪い計画を罰する以上に、シンプルな計画に報いてくれます——ここで本当に大事な、たったひとつの変数さえ尊重すれば。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして暑さが本格化する前の早朝にデンデラ神殿の内部を訪れる計画を。')],
    [span('冬：', ['strong']), span('夜のための暖かい重ね着を。17度の夜間の気温差は誇張ではありません。')],
    [span('通年：', ['strong']), span('肌だけでなく目のための日光対策も。ここでは光を和らげるもやがほとんどありません。')],
  ],
  h_final: '最後に', // reused
  final:
    'ケナの気候は複雑ではありません。ただ正直なだけです——雨は降らず、明るく、夜はその日の午後より17度も涼しくなります。ここで季節を決めるのは暑さ、それだけです。涼しい季節に来て、デンデラの天井にふさわしい朝を捧げ、残りの時間は見つけられる日陰に身を委ねてください。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_dendera), p(x.dendera),
    h2(x.h_decision), p(x.decision),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Qena', es: 'El Clima en Qena', ja: 'ケナの気候ガイド' },
  desc: {
    en: "Qena's climate is not complicated. It is honest — rainless, bright, seventeen degrees cooler every night than the afternoon before it, and a short drive from the finest surviving ceiling in Egypt.",
    es: 'El clima de Qena no es complicado. Es honesto — sin lluvias, luminoso, diecisiete grados más fresco cada noche que la tarde anterior, y a un corto trayecto del techo mejor conservado de todo Egipto.',
    ja: 'ケナの気候は複雑ではありません。ただ正直なだけです——雨は降らず、明るく、夜はその日の午後より17度も涼しくなります。そして車で少し行けば、エジプトで最も保存状態の良い天井が待っています。',
  },
};

function preflight() {
  // Normalize apostrophe glyphs (curly U+2019 <-> straight) so the owner-directed
  // "Qena’s" curly fix still validates against the straight-quote source .md.
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/qena-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.dendera], [loc, C.decision], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  // meta descriptions are also in the copy file
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
