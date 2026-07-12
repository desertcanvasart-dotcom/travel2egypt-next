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

const ID = 'wp-page-59572';
// HERO SWAP: Luxor-2-1.jpg 800x450 (mislabeled filename, genuinely Temple of Horus)
//   -> edfu.jpg 3000x2000 (Edfu city-hub hero, Temple of Horus, viewed/verified).
const NEW_HERO_ASSET = 'image-714656560ae1f6ef6c43f6f2164d162fdcef2634-3000x2000-jpg';
const REGION = 'upper-egypt';

let kc = 0;
const K = () => `d${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── Hero alt/caption — AUTHORED (not in locked copy). Alt literal to the image
//    (twin pylons of the Temple of Horus, visitors in the forecourt); caption
//    climate-timing framed (carriage from the boat, morning before the noon heat).
const HERO_ALT = {
  en: 'The towering twin pylons of the Temple of Horus at Edfu, deep relief carvings across the stone, visitors crossing the forecourt below',
  es: 'Los imponentes pilonos gemelos del Templo de Horus en Edfu, con relieves profundos tallados en la piedra y visitantes cruzando la explanada',
  ja: 'エドフのホルス神殿のそびえ立つ双塔の塔門。石には深いレリーフが刻まれ、前庭を横切る観光客の姿が見える',
};
const HERO_CAPTION = {
  en: 'The Temple of Horus at Edfu — reached by carriage from the boat, best seen in the cool of the morning before the courts hold the noon heat.',
  es: 'El Templo de Horus en Edfu — al que se llega en carruaje desde el barco, mejor visto en el fresco de la mañana antes de que los patios retengan el calor del mediodía.',
  ja: 'エドフのホルス神殿——船から馬車で向かい、中庭が正午の熱を抱え込む前の、涼しい朝に見るのがいい。',
};

// ── verbatim copy (from Desktop/edfu-weather-copy.md) ─────────────────────
// EN "temple’s" authored with CURLY apostrophe (U+2019) to match the already-
// correct dataset chart caption (owner-directed, Option A — scoped to "temple’s"
// only, per Qena precedent; no dataset edit needed). Preflight normalizes
// apostrophe glyphs so these validate against the straight-quote source .md.
// Headings: EN verbatim. ES/JA — 3 reused; 1 NEW (Nine O'Clock Off the Boat) FLAGGED.
const EN = {
  standfirst:
    "Edfu is met at nine in the morning off a boat, which is exactly right: the temple’s courts hold the heat by noon, and the horse carriages know it. This is one of the best-preserved temples in Egypt, and the climate here has already worked out the only sensible way to see it.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is severe, days regularly past 40°C with little relief until the sun drops — the same unforgiving Upper Egypt heat as its river neighbours. Winter (December to February) brings daytime highs in the low-to-mid 20s and nights that fall into single digits, a sixteen-degree swing that turns evenings genuinely comfortable. Spring and autumn are short, hot transitions, with the occasional khamsin sandstorm in spring.",
  h_boat: "Nine O'Clock Off the Boat",
  boat:
    "Most visitors reach Edfu the same way: a Nile cruise moors near town, and a horse-drawn carriage carries you the short distance to the Temple of Horus. The carriage drivers know the schedule better than any guidebook — arrive around nine, while the stone is still cool from the night, and the temple’s open courts are genuinely comfortable to explore. Wait until midday and those same courts, with no shade and nowhere for the heat to go, turn the visit into something to endure rather than enjoy.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' light, breathable clothing, strong sunscreen, and a firm plan to be at the temple by nine, not eleven.')],
    [span('Winter:', ['strong']), span(' warm layers for the evening; the sixteen-degree nightly drop is real.')],
    [span('Year-round:', ['strong']), span(' sun protection for the eyes as well as the skin, and water enough for a shadeless stone courtyard at midday if your timing slips.')],
  ],
  h_final: 'Final Word',
  final:
    "Edfu is met at nine in the morning off a boat, which is exactly right: the temple’s courts hold the heat by noon, and the horse carriages know it. Trust the schedule the carriage drivers already keep, and one of Egypt's best-preserved temples stays exactly that — a temple, not an ordeal.",
};

const ES = {
  standfirst:
    'Edfu se visita a las nueve de la mañana al bajar del barco, y es justo lo correcto: los patios del templo retienen el calor hacia el mediodía, y los carruajes de caballos lo saben bien. Es uno de los templos mejor conservados de Egipto, y aquí el clima ya ha resuelto la única manera sensata de verlo.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es severo, con días que superan regularmente los 40°C y poco alivio hasta que cae el sol — el mismo calor implacable del Alto Egipto que comparten sus vecinos ribereños. El invierno (diciembre a febrero) trae máximas diurnas entre 20 y 25°C y noches que caen a un solo dígito, un giro de dieciséis grados que vuelve las tardes genuinamente agradables. La primavera y el otoño son transiciones breves y calurosas, con el jamsín ocasional en primavera.',
  h_boat: 'A las nueve, al bajar del barco', // NEW — owner sign-off
  boat:
    'La mayoría de los visitantes llega a Edfu de la misma manera: un crucero por el Nilo atraca cerca del pueblo, y un carruaje tirado por caballos te lleva la corta distancia hasta el Templo de Horus. Los cocheros conocen el horario mejor que cualquier guía — llega sobre las nueve, cuando la piedra todavía está fresca de la noche, y los patios abiertos del templo resultan genuinamente agradables para explorar. Espera hasta el mediodía y esos mismos patios, sin sombra y sin adónde escape el calor, convierten la visita en algo que hay que aguantar más que disfrutar.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y un plan firme para estar en el templo a las nueve, no a las once.')],
    [span('Invierno:', ['strong']), span(' capas de abrigo para la noche; el descenso nocturno de dieciséis grados es real.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel, y agua suficiente para un patio de piedra sin sombra al mediodía, por si el horario se te escapa.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Edfu se visita a las nueve de la mañana al bajar del barco, y es justo lo correcto: los patios del templo retienen el calor hacia el mediodía, y los carruajes de caballos lo saben bien. Confía en el horario que ya siguen los cocheros, y uno de los templos mejor conservados de Egipto se queda exactamente en eso — un templo, no una prueba de resistencia.',
};

const JA = {
  standfirst:
    'エドフは船を降りた朝9時に訪れるのが正解です——神殿の中庭は正午までに熱がこもるようになり、それは馬車の御者たちが一番よく知っています。ここはエジプトでも屈指の保存状態を誇る神殿であり、この気候はすでに、それを見る唯一の賢明な方法を導き出しています。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は過酷で、日中は40°Cを超える日が続き、太陽が沈むまでほとんど和らぎません——川沿いの隣町と同じ、容赦のない上エジプトの暑さです。冬（12月から2月）は日中の最高気温が20度台前半から半ば、夜は一桁台まで下がり、16度の差が夕方を本当に心地よいものにしてくれます。春と秋は短く暑い移行期で、春には時おりハムシンの砂嵐が訪れます。',
  h_boat: '船を降りて朝9時に', // NEW — owner sign-off
  boat:
    'ほとんどの旅行者は同じ方法でエドフに到着します。ナイル川クルーズが町の近くに停泊し、馬車がホルス神殿までの短い距離を運んでくれます。御者たちは、どんなガイドブックよりもそのスケジュールをよく知っています——石がまだ夜の涼しさを残す9時頃に到着すれば、神殿の開けた中庭は本当に快適に見て回れます。正午まで待てば、日陰もなく、熱の逃げ場もない同じ中庭は、楽しむものというより耐えるものに変わってしまいます。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして11時ではなく9時に神殿にいるという確かな計画を。')],
    [span('冬：', ['strong']), span('夜のための暖かい重ね着を。16度の夜間の気温差は本物です。')],
    [span('通年：', ['strong']), span('肌だけでなく目のための日光対策と、もし時間がずれた場合に備えて、日陰のない石の中庭で正午を過ごすための十分な水を。')],
  ],
  h_final: '最後に', // reused
  final:
    'エドフは船を降りた朝9時に訪れるのが正解です——神殿の中庭は正午までに熱がこもるようになり、それは馬車の御者たちが一番よく知っています。御者たちがすでに守っているその時間割を信じれば、エジプトでも屈指の保存状態を誇る神殿は、まさにそのままの姿でいてくれます——試練ではなく、神殿として。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_boat), p(x.boat),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Edfu', es: 'El Clima en Edfu', ja: 'エドフの気候ガイド' },
  desc: {
    en: 'Edfu is met at nine in the morning off a boat, which is exactly right — the temple’s courts hold the heat by noon, and the horse carriages know it.',
    es: 'Edfu se visita a las nueve de la mañana al bajar del barco, y es justo lo correcto — los patios del templo retienen el calor hacia el mediodía, y los carruajes de caballos lo saben bien.',
    ja: 'エドフは船を降りた朝9時に訪れるのが正解です——神殿の中庭は正午までに熱がこもるようになり、それは馬車の御者たちが一番よく知っています。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/edfu-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.boat], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) checks.push([loc + ':desc', (META.desc as any)[loc]]);
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(apos(str).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} strings all present in copy file`);
  // curly "temple’s" count in authored EN body/meta (should be all curly, 0 straight)
  const enAll = [EN.standfirst, EN.boat, EN.final, META.desc.en].join(' ');
  console.log(`  EN curly "temple’s": ${(enAll.match(/temple’s/g) || []).length} | straight "temple's": ${(enAll.match(/temple's/g) || []).length}`);
  // filler tic must be absent
  const allNew = [EN, ES, JA].flatMap((C) => [C.standfirst, C.shape, C.boat, C.final, ...C.pack.map((b) => b.map((s) => s.text).join(''))]).join(' ');
  console.log(`  filler tic ("seasonal weather"/季節的な天候) absent: ${!/seasonal weather variations|weather seasonal|季節的な天候/i.test(allNew)}`);
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
