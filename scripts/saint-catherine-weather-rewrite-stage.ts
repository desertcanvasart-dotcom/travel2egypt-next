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

const ID = 'wp-page-60457';
// HERO: DEFERRED (owner call 2026-07-17). The copy's "confirmed snow-capped peak
// image" does NOT exist in the asset pool — 10 candidates viewed, all fail the
// snow test (summit chapel ×3 = religious content the page forbids, monastery
// complex ×3, camels, watermarked third-party hike shot, desert scenes). The doc
// is currently hero-less (alt exists, asset gone), so nothing wrong is shown
// meanwhile. Joins the fresh-sourcing list (Sohag / Kom Ombo / Safaga / AWG).
// REGION: not set on the article — Sharm precedent (article region null; the
// breadcrumb reads the CITY doc, which already carries region: 'sinai').

let kc = 0;
const K = () => `sc${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (Desktop/saint-catherine-weather-copy.md) ────────────────
// EN apostrophes normalized straight→curly (Luxor Stage-B precedent; preflight
// compares apostrophe-insensitively). Bookend = dataset caption (A-compact,
// same commit) after a "Saint Catherine is" lead-in — Sohag precedent.
// Signature H2 ES/JA absent from copy → owner-approved 2026-07-17:
// "El único invierno de verdad de Egipto" / 「エジプトで唯一の本物の冬」.
const EN = {
  standfirst:
    'Saint Catherine is the one Egyptian weather page with snow on it: at 1,600 metres, winter nights here freeze in earnest, the summer days stay mountain-mild, and the summit sunrise wants every layer you brought. This is Egypt’s only real winter, and its only real mountain — nothing else in the country’s climate looks like this.',
  h_shape: 'The Shape of the Year',
  shape:
    'Summer (June to August) is mild by Egyptian standards, days typically in the low-to-mid 20s and nights that stay genuinely cool even at the height of the season — mountain air doing what no desert or coastal town in this country can. Winter (December to February) is where Saint Catherine becomes something else entirely: daytime highs struggle into the high single digits, and nights regularly drop below freezing, occasionally low enough for snow to settle on the peaks. Spring and autumn are short, cool transitions, closer to a European shoulder season than anything else in Egypt.',
  h_sig: 'Egypt’s Only Real Winter',
  sig:
    'Nowhere else in Egypt does the thermometer do what it does here. Freezing nights are routine in December and January, and the cold is the whole reason the Mount Sinai sunrise hike is such a specific kind of undertaking: most climbs start in pitch darkness, hours before dawn, at altitude and temperature most visitors to this country never otherwise encounter. That combination — genuine cold, real elevation, a walk timed entirely around when the sun clears the ridge — doesn’t exist anywhere else on this list, and it rewards packing like the mountain means it, because it does.',
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' layers even in the warm season — daytime mild, nights genuinely cool, unlike anywhere else in Egypt.')],
    [span('Winter:', ['strong']), span(' serious cold-weather gear, full stop: proper insulation, a real jacket, and gloves if the summit hike is on the itinerary.')],
    [span('Year-round:', ['strong']), span(' sturdy footwear for uneven mountain ground, and a headlamp if a pre-dawn start is part of the plan.')],
  ],
  h_final: 'Final Word',
  final:
    'Saint Catherine is the one Egyptian weather page with snow on it: at 1,600 metres, winter nights here freeze in earnest, the summer days stay mountain-mild, and the summit sunrise wants every layer you brought. Come prepared for a country you didn’t expect to find inside Egypt — cold, high, and entirely its own.',
};

const ES = {
  standfirst:
    'Santa Catalina es la única página de clima en Egipto con nieve: a 1.600 metros, las noches de invierno se congelan de verdad aquí, los días de verano se mantienen frescos como en montaña, y el amanecer en la cumbre pide cada capa de ropa que llevaste. Este es el único invierno de verdad de Egipto, y su única montaña de verdad — nada más en el clima del país se parece a esto.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es templado para los estándares egipcios, con días que suelen rondar los 20-25°C y noches que se mantienen genuinamente frescas incluso en pleno verano — el aire de montaña haciendo lo que ningún pueblo del desierto o de la costa de este país puede hacer. El invierno (diciembre a febrero) es donde Santa Catalina se convierte en otra cosa por completo: las máximas diurnas apenas superan un solo dígito alto, y las noches bajan regularmente de cero, a veces lo bastante como para que la nieve se asiente en los picos. La primavera y el otoño son transiciones breves y frescas, más cercanas a una temporada media europea que a cualquier otra cosa en Egipto.',
  h_sig: 'El único invierno de verdad de Egipto', // NEW — owner-approved 2026-07-17
  sig:
    'En ningún otro lugar de Egipto el termómetro hace lo que hace aquí. Las noches bajo cero son habituales en diciembre y enero, y ese frío es la razón por la que la caminata al amanecer del Monte Sinaí es un tipo de empresa tan particular: la mayoría de las ascensiones empiezan en plena oscuridad, horas antes del alba, a una altitud y una temperatura que la mayoría de los visitantes de este país nunca encuentran de otro modo. Esa combinación — frío genuino, altitud real, una caminata cronometrada por completo en torno al momento en que el sol asoma sobre la cresta — no existe en ningún otro lugar de esta lista, y premia a quien se equipa como si la montaña fuera en serio, porque lo es.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' capas incluso en la temporada cálida — días templados, noches genuinamente frescas, a diferencia de cualquier otro lugar de Egipto.')],
    [span('Invierno:', ['strong']), span(' equipo serio para clima frío, sin excepciones: buen aislamiento, una chaqueta de verdad, y guantes si la caminata a la cima está en el itinerario.')],
    [span('Todo el año:', ['strong']), span(' calzado resistente para terreno de montaña irregular, y una linterna frontal si un inicio antes del amanecer forma parte del plan.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Santa Catalina es la única página de clima en Egipto con nieve: a 1.600 metros, las noches de invierno se congelan de verdad aquí, los días de verano se mantienen frescos como en montaña, y el amanecer en la cumbre pide cada capa de ropa que llevaste. Ven preparado para un país que no esperabas encontrar dentro de Egipto — frío, alto, y completamente propio.',
};

const JA = {
  standfirst:
    'サンタ・カタリナは、エジプトの気候ページの中で唯一雪が登場する場所です。標高1,600メートルのここでは、冬の夜は本当に凍りつき、夏の日中は山らしい涼しさを保ち、山頂での日の出には、持ってきたすべての重ね着が必要になります。これはエジプトで唯一の本物の冬であり、唯一の本物の山です——この国の気候の中に、これと似たものは他にありません。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）はエジプトの基準からすれば穏やかで、日中は20度台前半から半ばであることが多く、夏の盛りでも夜は本当に涼しいままです——この国の砂漠の町や海岸の町にはできないことを、山の空気がやってのけています。冬（12月から2月）は、サンタ・カタリナがまったく別の場所に変わる季節です。日中の最高気温は一桁台の後半にとどまり、夜は日常的に氷点を下回り、時には山頂に雪が積もるほど冷え込みます。春と秋は短く涼しい移行期で、エジプトの他のどこよりもヨーロッパの端境期に近い感覚です。',
  h_sig: 'エジプトで唯一の本物の冬', // NEW — owner-approved 2026-07-17
  sig:
    'エジプトの他のどこでも、ここのような気温計の動きは見られません。氷点下の夜は12月と1月には日常的で、その寒さこそが、シナイ山の日の出ハイキングをこれほど特殊な試みにしている理由です。ほとんどの登山は、夜明けの何時間も前、真っ暗闇の中で始まります。この国を訪れる人がふだんめったに経験しない標高と気温の中で。本物の寒さ、本物の標高、そして太陽が稜線を越える瞬間だけを軸に組まれた歩み——この組み合わせは、このリストの他のどこにも存在せず、山を本気で相手にするだけの装備をしてきた人にこそ報いてくれます。実際、本気の山なのですから。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span(' 暖かい季節でも重ね着を——日中は穏やかでも、夜は本当に涼しく、エジプトの他のどことも違います。')],
    [span('冬：', ['strong']), span(' 本格的な防寒装備を、例外なく——きちんとした断熱、本物のジャケット、そして山頂ハイキングが予定にあるなら手袋も。')],
    [span('通年：', ['strong']), span(' でこぼこした山道のための丈夫な靴と、夜明け前の出発が計画にあるならヘッドライトを。')],
  ],
  h_final: '最後に', // reused
  final:
    'サンタ・カタリナは、エジプトの気候ページの中で唯一雪が登場する場所です。標高1,600メートルのここでは、冬の夜は本当に凍りつき、夏の日中は山らしい涼しさを保ち、山頂での日の出には、持ってきたすべての重ね着が必要になります。エジプトの中にあるとは思っていなかった国に備えて来てください——寒く、高く、まったく独自の場所です。',
};

function buildBody(x: typeof EN | typeof ES | typeof JA) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_sig), p(x.sig),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s as Span[])),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Saint Catherine', es: 'El Clima en Santa Catalina', ja: 'サンタ・カタリナの気候ガイド' },
  desc: {
    en: 'The one Egyptian weather page with snow on it — winter nights here genuinely freeze at 1,600 metres, and the summit hike wants every layer you brought.',
    es: 'La única página de clima en Egipto con nieve — aquí las noches de invierno se congelan de verdad a 1.600 metros, y la caminata a la cima pide cada capa de ropa que llevaste.',
    ja: 'エジプトの気候ページの中で、唯一雪が登場する場所です——標高1,600メートルのここでは、冬の夜は本当に凍りつきます。山頂へのハイキングには、持ってきたすべての重ね着が必要になります。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/saint-catherine-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.sig], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, (b as Span[]).map((s) => s.text).join('')]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) {
    checks.push([loc + ':title', (META.title as any)[loc]], [loc + ':desc', (META.desc as any)[loc]]);
  }
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(apos(str).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} strings all present in copy file`);
}

async function main() {
  preflight();
  const pub: any = await client.getDocument(ID);
  if (!pub) throw new Error('published doc not found');
  fs.writeFileSync('backups/saint-catherine-weather-pre-rewrite-2026-07-17.json', JSON.stringify(pub, null, 2));
  console.log('rollback written: backups/saint-catherine-weather-pre-rewrite-2026-07-17.json');

  const draft = {
    ...pub, // heroImage carried UNCHANGED (hero-less; deferred — see header note)
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
  await client.createOrReplace(draft);
  console.log('Staged draft drafts.' + ID);
  console.log('  body', buildBody(EN).length, 'blocks/locale; marker after "The Shape of the Year"');
  console.log('  title set x3 / summary cleared / seo.metaDescription created x3');
  console.log('  hero UNCHANGED (deferred, hero-less); region untouched (city doc carries sinai)');
}
main().catch((e) => { console.error(e); process.exit(1); });
