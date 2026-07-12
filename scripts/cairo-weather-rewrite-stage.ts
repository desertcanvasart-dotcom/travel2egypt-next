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

const ID = 'wp-page-59394';
// HERO: UNCHANGED. Current asset (egyptian-museum-cairo-exterior.jpg, 1400x933) is a
// genuine Cairo landmark under a CLEAR BLUE SKY — consistent with the standfirst's
// "the sky rarely changes its mind" claim (passes the clear-day check). Re-verified:
// every high-res alternative fails clear-day (history-buffs=hazy; hakubutsukan=skyless
// interior). No swap needed; the copy's "swap to a Phase-1 alternative" premise was off.
const REGION = 'lower-egypt'; // Cairo city doc region=lower-egypt (NOT upper-egypt); REGIONS enum has lower-egypt

let kc = 0;
const K = () => `c${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (from Desktop/cairo-weather-copy.md) ────────────────────
// Caption has ZERO apostrophes → bookend glyph-clean. Bookend embeds the caption
// after a "Cairo is" lead-in ("Hot"->"hot"). Headings: EN verbatim; ES/JA 3 reused +
// 1 NEW (A City the Sky Rarely Argues With) FLAGGED.
const EN = {
  standfirst:
    "Cairo is hot and bright from May to September, mild and blue-skied all winter — rain comes a handful of days a year, and the city treats each one as an event. This is a capital with twenty million people and almost no weather to argue about: the sky here rarely changes its mind.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (May to September) is hot and dry, days regularly reaching the mid-30s and occasionally higher, with the desert's dust often softening the horizon into haze. Winter (December to February) brings daytime highs in the high teens to low 20s and cool, clear nights — Cairo's most reliably pleasant season, and its most crowded one for exactly that reason. Spring can bring the khamsin, a hot dry wind carrying sand in from the desert for a few days at a time; autumn is a short, mild bridge back toward winter.",
  h_city: 'A City the Sky Rarely Argues With',
  city:
    "What defines Cairo's weather isn't drama, it's consistency: twenty million people living under a sky that almost never sends rain, almost never drops below comfortable in winter, and almost never cools the summer heat with anything but nightfall. The haze that softens the skyline most afternoons is less about clouds than about dust and density — a city this size and this dry produces its own permanent weather, independent of whatever the season is technically doing.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and something to cut the glare — the haze softens the sun's edges but not its strength.")],
    [span('Winter:', ['strong']), span(" a light jacket for the evening; days are mild but nights have real bite once the sun's down.")],
    [span('Year-round:', ['strong']), span(" sun protection for the eyes as well as the skin, and something to keep dust off electronics if you're out in the wind.")],
  ],
  h_final: 'Final Word',
  final:
    "Cairo is hot and bright from May to September, mild and blue-skied all winter — rain comes a handful of days a year, and the city treats each one as an event. There's very little to plan around here beyond the season itself: come in winter for comfort, come in summer knowing exactly what you're getting.",
};

const ES = {
  standfirst:
    'El Cairo es caluroso y luminoso de mayo a septiembre, templado y de cielos despejados todo el invierno — la lluvia llega un puñado de días al año, y la ciudad trata cada uno como un acontecimiento. Es una capital de veinte millones de personas y casi ningún clima sobre el que discutir: aquí el cielo rara vez cambia de opinión.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (mayo a septiembre) es caluroso y seco, con días que alcanzan regularmente mediados de los 30°C y en ocasiones más, mientras el polvo del desierto suele difuminar el horizonte en una bruma. El invierno (diciembre a febrero) trae máximas diurnas entre los 17 y los 22°C y noches frescas y despejadas — la temporada más fiablemente agradable de El Cairo, y por eso mismo la más concurrida. La primavera puede traer el jamsín, un viento cálido y seco que arrastra arena del desierto durante unos días; el otoño es un puente breve y templado de vuelta al invierno.',
  h_city: 'Una ciudad con la que el cielo rara vez discute', // NEW — owner sign-off
  city:
    'Lo que define el clima de El Cairo no es el drama, sino la constancia: veinte millones de personas viviendo bajo un cielo que casi nunca envía lluvia, que casi nunca baja de lo agradable en invierno, y que casi nunca enfría el calor del verano con nada que no sea la caída de la noche. La bruma que suaviza el perfil de la ciudad la mayoría de las tardes tiene menos que ver con las nubes que con el polvo y la densidad — una ciudad de este tamaño y esta sequedad produce su propio clima permanente, independiente de lo que la estación esté técnicamente haciendo.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y algo que corte el resplandor — la bruma suaviza los bordes del sol, pero no su fuerza.')],
    [span('Invierno:', ['strong']), span(' una chaqueta ligera para la noche; los días son templados pero las noches muerden de verdad en cuanto se pone el sol.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel, y algo para proteger la electrónica del polvo si te sorprende el viento.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'El Cairo es caluroso y luminoso de mayo a septiembre, templado y de cielos despejados todo el invierno — la lluvia llega un puñado de días al año, y la ciudad trata cada uno como un acontecimiento. Aquí hay muy poco que planificar más allá de la propia estación: ven en invierno por la comodidad, ven en verano sabiendo exactamente a qué atenerte.',
};

const JA = {
  standfirst:
    'カイロは5月から9月にかけて暑く明るい季節を迎え、冬は一年を通して穏やかで青空が広がります——雨が降るのは年にほんの数日だけで、この街はその一日一日を出来事として扱います。二千万人が暮らす首都でありながら、争うべき天候はほとんどありません。ここの空は、めったに気を変えないのです。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（5月から9月）は暑く乾燥し、日中の気温は30度台半ばに達することが多く、時にはそれ以上になります。砂漠から舞う砂埃が、地平線をかすませることも珍しくありません。冬（12月から2月）は日中の最高気温が17度から22度ほど、夜は涼しく澄み渡ります——カイロで最も安定して心地よい季節であり、まさにその理由でもっとも混み合う季節でもあります。春にはハムシンが訪れることがあります。砂漠から砂を運ぶ、暑く乾いた風が数日間続きます。秋は、冬へと戻る短く穏やかな橋渡しの季節です。',
  h_city: '空がめったに異を唱えない街', // NEW — owner sign-off
  city:
    'カイロの気候を特徴づけているのは、劇的さではなく一貫性です。二千万人が、雨をほとんど送ってこず、冬も快適さを下回ることがほとんどなく、夏の暑さを夜以外の何かで和らげることもほとんどない空の下で暮らしています。ほとんどの午後に街の輪郭をかすませる霞は、雲というより砂埃と密度によるものです——これほどの規模とこれほどの乾燥を持つ都市は、暦の上の季節が何をしていようと関係なく、独自の恒常的な気候を生み出してしまうのです。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして眩しさを和らげる対策を——霞は太陽の輪郭を柔らげますが、その強さまでは和らげません。')],
    [span('冬：', ['strong']), span('夜のための薄手のジャケットを。日中は穏やかですが、日が沈むと夜は本当に冷え込みます。')],
    [span('通年：', ['strong']), span('肌だけでなく目のための日光対策と、風の強い日に電子機器を砂埃から守るための備えを。')],
  ],
  h_final: '最後に', // reused
  final:
    'カイロは5月から9月にかけて暑く明るい季節を迎え、冬は一年を通して穏やかで青空が広がります——雨が降るのは年にほんの数日だけで、この街はその一日一日を出来事として扱います。ここでは季節そのもの以外、計画すべきことはほとんどありません。快適さを求めるなら冬に、何が待っているかを承知のうえでなら夏に来てください。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_city), p(x.city),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Cairo', es: 'El Clima en El Cairo', ja: 'カイロの気候ガイド' },
  desc: {
    en: 'Hot and bright from May to September, mild and blue-skied all winter — rain comes a handful of days a year, and the city treats each one as an event.',
    es: 'Caluroso y luminoso de mayo a septiembre, templado y de cielos despejados todo el invierno — la lluvia llega un puñado de días al año, y la ciudad trata cada uno como un acontecimiento.',
    ja: '5月から9月は暑く明るい季節、冬は一年を通して穏やかで青空が広がります——雨が降るのは年にほんの数日だけで、この街はその一日一日を出来事として扱います。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/cairo-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.city], [loc, C.final]);
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

  const draft = {
    ...pub, // heroImage carried through UNCHANGED (clear-day museum; see header note)
    _id: 'drafts.' + ID,
    region: REGION,
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
  console.log('  heroImage UNCHANGED:', heroBefore === draft.heroImage?.asset?._ref, '(clear-day museum; asset', draft.heroImage?.asset?._ref + ')');
  console.log('  region set:', pub.region, '->', REGION);
  console.log('  body', buildBody(EN).length, 'blocks/locale; marker after "The Shape of the Year"');
  console.log('  title set / summary cleared / seo.metaDescription created x3 (incl. ES overwrite)');
}
main().catch((e) => { console.error(e); process.exit(1); });
