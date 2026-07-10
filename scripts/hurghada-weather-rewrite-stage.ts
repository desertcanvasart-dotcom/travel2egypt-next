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

const ID = 'wp-page-59689';
const HERO_DONOR = 'wp-page-59704'; // boats off Hurghada, 1200x800 landscape

let kc = 0;
const K = () => `h${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (from Desktop/1hurghada-weather-copy.md) ────────────────
// Section headings: EN verbatim from the copy file. ES/JA headings — 3 reused
// verbatim from al-Quseir (owner-approved: Shape of the Year / What to Pack /
// Final Word); 2 NEW (Wind, The Winter Sea) drafted to mirror EN register +
// al-Gouna's shipped Viento/風 — FLAGGED for owner sign-off, not final.
const EN = {
  standfirst:
    "Hurghada's weather isn't complicated, and that's exactly the sell. Sun most days of the year, a sea warm enough to swim in through January, and a wind that blows reliably enough that an entire sport built itself around it. This is the Red Sea's biggest resort town for a reason, and the reason is mostly the sky.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to September) is hot, days regularly clearing 35°C, but the coast has a trick inland Egypt doesn't: a sea breeze that takes the edge off even the hottest afternoons. Winter (December to February) is Hurghada at its most sold — daytime temperatures in the low-to-mid 20s, nights cool enough for a light jacket, and a sea that never really gets cold. Spring can bring the khamsin, a hot dry wind carrying sand off the desert for a few days at a time; autumn is the quiet hinge between summer's heat and winter's crowds.",
  h_wind: 'Wind',
  wind:
    "Wind is not incidental to Hurghada — it's most of the reason the town has an international kitesurfing and windsurfing scene at all. It blows most reliably from March through November, strongest in the afternoons, and the same wind that fills a kite also means most beaches face a light chop rather than flat calm. If you want stiller water for casual swimming, mornings are the quieter window before the wind picks up.",
  h_sea: 'The Winter Sea',
  sea:
    "This is the fact that sells Hurghada in December: the water rarely drops below the low 20s°C, which means winter swimming is genuinely comfortable, not just technically possible. It's a different proposition from the summer sea, which is warm enough to feel like a bath by August — some visitors actually prefer the cooler, clearer winter water for snorkelling.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and something to cut the wind if you're on the water in the afternoon.")],
    [span('Winter:', ['strong']), span(" swimwear plus a light jacket for the evening — you'll want both in the same day.")],
    [span('Year-round:', ['strong']), span(' reef-safe sunscreen, and a windbreaker layer if water sports are on the itinerary.')],
  ],
  h_final: 'Final Word',
  final:
    "Hurghada doesn't ask much of the calendar — there's a reason to come almost any month, and the only real variable is whether you want the wind at full strength or the water at its calmest. Winter for swimming and reef visibility, spring and autumn for good wind without summer's heat, summer if you're chasing the kitesurfing season at its peak.",
};

const ES = {
  standfirst:
    'El clima de Hurghada no tiene complicaciones, y ahí está precisamente su encanto. Sol la mayoría de los días del año, un mar lo bastante cálido para nadar incluso en enero, y un viento tan fiable que un deporte entero se organizó a su alrededor. Hurghada es la ciudad turística más grande del mar Rojo, y la razón está, sobre todo, en el cielo.',
  h_shape: 'La forma del año', // reused from al-Quseir (owner-approved)
  shape:
    'El verano (junio a septiembre) es caluroso, con días que superan regularmente los 35°C, pero la costa tiene un truco que el interior de Egipto no tiene: una brisa marina que suaviza incluso las tardes más calurosas. El invierno (diciembre a febrero) es Hurghada en su mejor versión de venta: temperaturas diurnas entre 20 y 25°C, noches lo bastante frescas para una chaqueta ligera, y un mar que nunca llega a enfriarse del todo. En primavera puede aparecer el jamsín, un viento cálido y seco que arrastra arena del desierto durante unos días; el otoño es la bisagra tranquila entre el calor del verano y las multitudes del invierno.',
  h_wind: 'Viento', // NEW (al-Gouna-aligned) — owner sign-off
  wind:
    'El viento no es un detalle secundario en Hurghada — es buena parte de la razón por la que la ciudad tiene una escena internacional de kitesurf y windsurf. Sopla con más regularidad de marzo a noviembre, más fuerte por las tardes, y el mismo viento que hincha una cometa también hace que la mayoría de las playas tengan algo de oleaje en lugar de estar completamente en calma. Si buscas aguas más tranquilas para nadar sin más, las mañanas son la ventana más calmada antes de que el viento arranque.',
  h_sea: 'El mar en invierno', // NEW — owner sign-off
  sea:
    'Este es el dato que vende Hurghada en diciembre: el agua rara vez baja de los 20-22°C, lo que significa que nadar en invierno es genuinamente agradable, no solo técnicamente posible. Es una propuesta distinta a la del mar de verano, que para agosto está lo bastante cálido como para sentirse casi como un baño — algunos visitantes prefieren el agua más fresca y clara del invierno para hacer esnórquel.',
  h_pack: 'Qué llevar en la maleta', // reused from al-Quseir
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y algo que corte el viento si vas a estar en el agua por la tarde.')],
    [span('Invierno:', ['strong']), span(' bañador y una chaqueta ligera para la noche — vas a necesitar los dos el mismo día.')],
    [span('Todo el año:', ['strong']), span(' protector solar respetuoso con el arrecife, y una capa cortavientos si el plan incluye deportes acuáticos.')],
  ],
  h_final: 'Para terminar', // reused from al-Quseir (owner-revised)
  final:
    'Hurghada no le pide mucho al calendario — hay motivos para venir casi cualquier mes, y la única variable real es si prefieres el viento a plena fuerza o el agua en su momento más calmado. Invierno para nadar y ver bien el arrecife, primavera y otoño para buen viento sin el calor del verano, verano si buscas la temporada de kitesurf en su punto más alto.',
};

const JA = {
  standfirst:
    'ハルガダの気候は複雑ではありません。そしてそれこそが、この町の売りです。一年のほとんどの日が晴れ、1月でも泳げるほど暖かい海、そしてひとつのスポーツがまるごと成立するほど安定した風。ハルガダが紅海最大のリゾートタウンである理由は、たいてい空にあります。',
  h_shape: '一年の気候の移ろい', // reused from al-Quseir
  shape:
    '夏（6月から9月）は暑く、日中は35°Cを超える日も珍しくありません。けれどこの海岸には、内陸のエジプトにはない工夫があります——最も暑い午後さえ和らげる海風です。冬（12月から2月）は、ハルガダが最も輝く季節。日中の気温は20度台前半から半ば、夜は薄手のジャケットがほしくなる涼しさで、海が本当に冷たくなることはありません。春にはハムシンが訪れることがあります。砂漠から砂を運ぶ、暑く乾いた風が数日間続きます。秋は、夏の暑さと冬の人出のあいだの、静かな移行期です。',
  h_wind: '風', // NEW (al-Gouna-aligned) — owner sign-off
  wind:
    '風はハルガダにとって付随的なものではありません——この町に国際的なカイトサーフィンやウィンドサーフィンのシーンが存在すること自体、その大部分は風のおかげです。最も安定して吹くのは3月から11月、最も強くなるのは午後です。カイトを膨らませるのと同じ風が、たいていのビーチに完全な凪ではなく、ある程度の波を作ります。ただ泳ぐために穏やかな海がほしいなら、風が強まる前の午前中が、いちばん静かな時間帯です。',
  h_sea: '冬の海', // NEW — owner sign-off
  sea:
    'これが12月のハルガダを売り込む事実です。水温はめったに20〜22°Cを下回りません。つまり冬の遊泳は、技術的に可能というだけでなく、実際に心地よいのです。8月にはほとんどお風呂のように温かくなる夏の海とは、また別の魅力です——シュノーケリングには、涼しく澄んだ冬の海のほうを好む人も少なくありません。',
  h_pack: '持ち物のヒント', // reused from al-Quseir
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして午後にウォータースポーツをするなら風を防ぐ一枚を。')],
    [span('冬：', ['strong']), span('水着と、夜のための薄手のジャケット——同じ日にどちらも必要になります。')],
    [span('通年：', ['strong']), span('サンゴに優しい日焼け止め、そしてウォータースポーツの予定があるなら防風レイヤーを。')],
  ],
  h_final: '最後に', // reused from al-Quseir
  final:
    'ハルガダは、暦にそれほど多くを求めません。ほぼどの月にも訪れる理由があり、実質的な選択は、風を全開で楽しみたいか、海がいちばん穏やかな時期を選びたいかだけです。泳ぐこと、サンゴ礁の透明度を求めるなら冬。夏の暑さなしで良い風を求めるなら春か秋。カイトサーフィンのシーズンを最盛期で楽しみたいなら夏。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_wind), p(x.wind),
    h2(x.h_sea), p(x.sea),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Hurghada', es: 'El Clima en Hurghada', ja: 'ハルガダの気候ガイド' },
  desc: {
    en: "Hurghada's weather is a promise more than a forecast — sun most days, a sea that stays swimmable through winter, and wind steady enough that the kite schools plan their whole season around it.",
    es: 'El clima de Hurghada es más una promesa que un pronóstico — sol casi todos los días, un mar que se puede nadar incluso en invierno, y un viento tan constante que las escuelas de kitesurf organizan toda su temporada en torno a él.',
    ja: 'ハルガダの気候は、天気予報というより約束のようなものです。ほとんど毎日晴れ、冬でも泳げる海、そしてカイトスクールがシーズン全体をそれに合わせて組むほど安定した風。',
  },
};

// ── verbatim pre-flight: abort if any body string is not in the copy file ──
function preflight() {
  // strip markdown bold markers (**label**) so bold-label bullets compare on text
  const md = fs.readFileSync('/Users/islamhussein/Desktop/1hurghada-weather-copy.md', 'utf8').replace(/\*\*/g, '');
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const flatSpace = norm(md);
  const flatStrip = md.replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.wind], [loc, C.sea], [loc, C.final]);
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
  if (!donor?.heroImage?.asset) throw new Error('hero donor image not found');
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
