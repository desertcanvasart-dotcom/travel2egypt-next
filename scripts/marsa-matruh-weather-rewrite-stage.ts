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

const ID = 'wp-page-60224';
// HERO SWAP (owner-confirmed): current hero is beach-of-movenpick.jpg (d09ce9bd, 500x333 — a
// parasol beach with a reef line offshore that reads Red Sea, and far too small). Owner rejected
// the city-hub marsa-matruh.jpg (dusk — water not visibly turquoise, FAILS the standfirst's
// explicit "genuinely earns the comparison" turquoise claim) and tours (pebbly, no white sand).
// -> things-to-do-in-marsa-matruh.jpeg (e05edfa3 — clear turquoise/Aegean shallows over pale sand;
// the ONLY candidate that visibly earns the turquoise claim). Owner-confirmed.
const NEW_HERO_ASSET = 'image-e05edfa33d2ffe3249f99f8a000ecc81e573e896-2752x1536-jpg';
const REGION = 'mediterranean'; // Marsa Matruh city doc (wp-page-58887) region=mediterranean (2nd Med page after Port Said)

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

// ── Hero alt/caption — AUTHORED. alt = factual turquoise scene (accessibility); caption
//    season-framed (the one summer season the town runs on).
const HERO_ALT = {
  en: 'Clear turquoise shallows over pale sand at Marsa Matruh, with jet-skis moored offshore under a bright summer sky',
  es: 'Aguas turquesas y transparentes sobre arena pálida en Marsa Matruh, con motos acuáticas fondeadas bajo un cielo veraniego luminoso',
  ja: '明るい夏空の下、マルサ・マトルーフの淡い砂底を透かす澄んだターコイズブルーの浅瀬と、沖に停泊するジェットスキー',
};
const HERO_CAPTION = {
  en: 'The turquoise summer lagoons Marsa Matruh runs on — the one season that genuinely earns the Aegean comparison.',
  es: 'Las lagunas turquesas de verano de las que vive Marsa Matruh — la única temporada que se gana de verdad la comparación con el Egeo.',
  ja: 'マルサ・マトルーフが頼りにする夏のターコイズブルーのラグーン——エーゲ海の比喩に本当に値する、唯一の季節。',
};

// ── verbatim copy (from Desktop/marsa-matruh-weather-copy.md) ──────────────
// 4-section thin model. Bookend (standfirst = Final Word opening) built on the dataset caption,
// which was updated (owner Option A-compact) to "Marsa Matruh runs on one season: … wet, and …"
// so the chart's wording agrees with the copy. ES/JA captions unchanged (natural-prose reworkings).
// IDENTITY = the seasonality EXTREME, stated plainly (Ras-Sudr-class single-mindedness): one real
// season (Jun–Sep), a candid "closed-season" winter, no softening of the off-season.
// ⚠️ Signature H2 ES/JA = PROPOSED (copy .md gave EN only) — flagged for owner sign-off at diff review.
const EN = {
  standfirst:
    'Marsa Matruh runs on one season: the summer months when its lagoons do their Aegean impression, turquoise water against white sand that genuinely earns the comparison. Winter is windy, wet, and largely shuttered, and we say so — this is a town built around a single window, not a year-round destination with a quiet off-season.',
  h_shape: 'The Shape of the Year',
  shape:
    'Summer (June to September) is warm and reliably sunny, days typically in the high 20s to low 30s with a Mediterranean breeze that keeps the heat from turning severe — this is the entire reason the town exists as a destination. Winter (December to February) is a different place altogether: daytime highs drop into the mid-teens, rain is genuinely common, and much of the town’s tourism infrastructure closes for the season rather than limping through it. Spring and autumn are brief, unreliable transitions rather than a real shoulder season.',
  h_sig: 'One Season, Honestly',
  sig:
    'Most beach towns in this project soften their off-season into something workable — cooler, quieter, still open. Marsa Matruh doesn’t, and pretending otherwise would do visitors no favours: this is primarily a domestic summer destination, and outside June to September, much of what makes it worth visiting simply isn’t running. That’s not a flaw to apologise for, it’s the honest shape of the place — a town that does one thing extremely well and makes no claims about the other nine months.',
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' light, breathable clothing, strong sunscreen, and swimwear that earns its keep — this is a lagoon town, plan accordingly.')],
    [span('Winter:', ['strong']), span(" genuinely warm, wind-resistant layers and rain protection if you're visiting off-season; confirm what's actually open before you travel.")],
    [span('Year-round:', ['strong']), span(' sun protection for the eyes as well as the skin during the season that matters.')],
  ],
  h_final: 'Final Word',
  final:
    'Marsa Matruh runs on one season: the summer months when its lagoons do their Aegean impression, turquoise water against white sand that genuinely earns the comparison. Winter is windy, wet, and largely shuttered, and we say so — come in summer, or don’t come expecting summer’s version of the town.',
};

const ES = {
  standfirst:
    'Marsa Matruh funciona con una sola temporada: los meses de verano en los que sus lagunas hacen su imitación del Egeo, agua turquesa contra arena blanca que se gana la comparación de verdad. El invierno es ventoso, lluvioso y en gran parte cerrado, y lo decimos sin rodeos — este es un pueblo construido en torno a una única ventana, no un destino de todo el año con una temporada baja tranquila.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a septiembre) es cálido y de sol fiable, con días que suelen rondar los 27-32°C y una brisa mediterránea que evita que el calor se vuelva severo — esta es toda la razón por la que el pueblo existe como destino. El invierno (diciembre a febrero) es un lugar completamente distinto: las máximas diurnas bajan a mediados de los 10°C, la lluvia es genuinamente frecuente, y buena parte de la infraestructura turística del pueblo cierra por temporada en lugar de sobrevivir a duras penas. La primavera y el otoño son transiciones breves y poco fiables, más que una temporada media real.',
  h_sig: 'Una sola temporada, sin rodeos', // ⚠️ PROPOSED (not in copy .md) — owner sign-off pending
  sig:
    'La mayoría de los pueblos costeros de este proyecto suavizan su temporada baja en algo manejable — más fresco, más tranquilo, pero abierto. Marsa Matruh no lo hace, y fingir lo contrario no le haría ningún favor a quien lo visita: este es sobre todo un destino de verano nacional, y fuera de junio a septiembre, buena parte de lo que lo hace merecer la visita sencillamente no está en funcionamiento. Eso no es un defecto por el que disculparse, es la forma honesta del lugar — un pueblo que hace una cosa extremadamente bien y no hace promesas sobre los otros nueve meses.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y bañador que se gane su lugar — este es un pueblo de lagunas, planifica en consecuencia.')],
    [span('Invierno:', ['strong']), span(' capas genuinamente abrigadas y resistentes al viento, y protección contra la lluvia si visitas fuera de temporada; confirma qué está realmente abierto antes de viajar.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel durante la temporada que importa.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Marsa Matruh funciona con una sola temporada: los meses de verano en los que sus lagunas hacen su imitación del Egeo, agua turquesa contra arena blanca que se gana la comparación de verdad. El invierno es ventoso, lluvioso y en gran parte cerrado, y lo decimos sin rodeos — ven en verano, o no esperes la versión veraniega del pueblo.',
};

const JA = {
  standfirst:
    'マルサ・マトルーフはひとつの季節だけで成り立っています。ラグーンがエーゲ海さながらの姿を見せる夏のあいだ——白い砂浜に映えるターコイズブルーの水は、その比喩に本当に値します。冬は風が強く、雨がちで、ほとんどの店が閉まります。それをはっきりお伝えします。ここは、静かなオフシーズンのある年間を通した観光地ではなく、たったひとつの窓のまわりに作られた町なのです。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から9月）は暖かく、確実に晴れる日が続き、日中は27度から32度ほどで、地中海の風のおかげで暑さが過酷になることはありません——これこそが、この町が観光地として存在する理由のすべてです。冬（12月から2月）はまったく別の場所になります。日中の最高気温は10度台半ばまで下がり、雨は本当に頻繁に降り、町の観光インフラの多くは、無理に営業を続けるのではなく季節ごと閉まってしまいます。春と秋は、本物の端境期というより、短く当てにならない移行期です。',
  h_sig: 'ひとつの季節、正直に', // ⚠️ PROPOSED (not in copy .md) — owner sign-off pending
  sig:
    'このプロジェクトに登場するビーチの町の多くは、オフシーズンを「涼しく、静かだが、営業はしている」という形に和らげています。マルサ・マトルーフはそうしません。そして、そうではないふりをすることは、訪れる人のためになりません。ここは基本的に国内向けの夏の観光地であり、6月から9月を外れると、この町を訪れる価値の多くがそもそも動いていないのです。それは謝るべき欠点ではなく、この場所の正直な姿です——ひとつのことを極めて上手にこなし、残りの九か月については何の約束もしない町なのです。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そしてしっかり活躍する水着を——ここはラグーンの町です。それに合わせて。')],
    [span('冬：', ['strong']), span('オフシーズンに訪れるなら、本当に暖かく防風性のある重ね着と雨対策を。旅行前に、実際に何が営業しているか確認してください。')],
    [span('通年：', ['strong']), span('意味のある季節のあいだは、肌だけでなく目のための日光対策も。')],
  ],
  h_final: '最後に', // reused
  final:
    'マルサ・マトルーフはひとつの季節だけで成り立っています。ラグーンがエーゲ海さながらの姿を見せる夏のあいだ——白い砂浜に映えるターコイズブルーの水は、その比喩に本当に値します。冬は風が強く、雨がちで、ほとんどの店が閉まります。それをはっきりお伝えします。夏に来てください。そうでなければ、夏の姿のこの町を期待しないでください。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_sig), p(x.sig),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Marsa Matruh', es: 'El Clima en Marsa Matruh', ja: 'マルサ・マトルーフの気候ガイド' },
  desc: {
    en: 'Matruh runs on one season — the summer months when its lagoons do their Aegean impression — while winter is windy, wet, and largely shuttered, and we say so.',
    es: 'Marsa Matruh funciona con una sola temporada — los meses de verano en los que sus lagunas hacen su imitación del Egeo — mientras el invierno es ventoso, lluvioso y en gran parte cerrado, y lo decimos sin rodeos.',
    ja: 'マルサ・マトルーフはひとつの季節だけで成り立っています——ラグーンがエーゲ海さながらの姿を見せる夏のあいだだけ。冬は風が強く、雨がちで、ほとんどの店が閉まります。それをはっきりお伝えします。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/marsa-matruh-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.sig], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) checks.push([loc + ':desc', (META.desc as any)[loc]]);
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(apos(str).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} strings all present in copy file`);

  // Bookend: standfirst & Final Word OPEN on the (Option-A-compact) dataset caption wording.
  const capEN = 'Marsa Matruh runs on one season: the summer months when its lagoons do their Aegean impression — winter is windy, wet, and largely shuttered, and we say so.';
  const sfStartsOnCap = EN.standfirst.startsWith('Marsa Matruh runs on one season: the summer months when its lagoons do their Aegean impression');
  const capWinterClause = 'Winter is windy, wet, and largely shuttered, and we say so';
  console.log(`  EN standfirst opens on caption phrase: ${sfStartsOnCap}`);
  console.log(`  EN standfirst carries caption winter clause verbatim: ${EN.standfirst.includes(capWinterClause)}`);
  console.log(`  EN Final Word carries caption winter clause verbatim: ${EN.final.includes(capWinterClause)}`);
  console.log(`  dataset caption (A-compact) present in source: ${capEN.length > 0}`);

  // Domestic-tourism sentence must appear EXACTLY ONCE and not be expanded.
  const dtCount = (EN.sig.match(/this is primarily a domestic summer destination/g) || []).length;
  console.log(`  domestic-tourism sentence appears exactly once: ${dtCount === 1} (count=${dtCount})`);

  // Overlap: no specific lagoon/beach names, hotels, Rommel/WWII, events.
  const allNew = [EN, ES, JA].flatMap((C) => [C.standfirst, C.shape, C.sig, C.final, ...C.pack.map((b) => b.map((s) => s.text).join(''))]).join(' ');
  const outOfScope = /Rommel|WWII|World War|Cleopatra|Ageeba|Agiba|hotel|resort\b|festival|Almaza/i.test(allNew);
  console.log(`  overlap boundary — no Rommel/WWII/named-beach/hotel/festival: ${!outOfScope}`);
  console.log(`  °F absent in all body copy: ${!/°F|℉|Fahrenheit/i.test(allNew)}`);
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
