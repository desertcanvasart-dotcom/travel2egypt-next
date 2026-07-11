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

const ID = 'wp-page-58730';
// NO hero swap — heroImage intentionally NOT overridden.

let kc = 0;
const K = () => `w${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (from Desktop/al-wadi-al-gadid-weather-copy.md) ─────────
// Headings: EN verbatim. ES/JA — 3 reused (Shape / What to Pack / Final Word);
// 2 NEW (One Enormous Quiet, Cold the Moment the Sun Leaves) FLAGGED for sign-off.
const EN = {
  standfirst:
    "Al Wadi Al Gadid — the New Valley — isn't one oasis but a governorate that holds several, Kharga and Dakhla and Baris among them, scattered across a stretch of Western Desert big enough to swallow smaller countries whole. What unites them is climate: rainless, punishing by summer, and quiet in a way that has less to do with population than with distance from almost everything else.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is severe across the whole governorate, days regularly past 40°C with no coastline and no cloud cover to soften it — this is deep-desert heat in its purest form. Winter (December to February) brings relief: daytime highs in the low-to-mid 20s and nights that drop close to freezing the moment the sun goes down, across every oasis in the region alike. Spring and autumn are brief, hot transitions either side of the extremes.",
  h_quiet: 'One Enormous Quiet',
  quiet:
    "This governorate is less a place than a distance — Kharga in the north, Dakhla further west, Baris deeper south still, each its own small world separated from the others by hours of empty desert. That scale is the actual climate story here: not just heat and cold, but a quiet that comes from being genuinely far from almost everywhere, in every direction, at once. Visit one oasis and you've seen a town; understand the New Valley and you've understood how much of Egypt is simply empty, on purpose.",
  h_cold: 'Cold the Moment the Sun Leaves',
  cold:
    "Across the whole governorate, the desert's oldest trick holds true: nothing in the air or on the ground retains the day's heat once the sun is gone. A 40°C afternoon can give way to a genuinely cold night within hours, regardless of which oasis you're standing in — pack for both extremes on the same day, because the New Valley will ask for both.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and far more water than you'd carry anywhere with a coastline nearby.")],
    [span('Winter:', ['strong']), span(' warm layers for the evening without exception — the temperature drop after sunset applies across the whole region, not just one oasis.')],
    [span('Year-round:', ['strong']), span(' sun protection for the eyes as well as the skin, and a plan for genuinely long driving distances between towns.')],
  ],
  h_final: 'Final Word',
  final:
    "Al Wadi Al Gadid isn't a single climate story so much as the same story told across an enormous distance — rainless, huge-skied, and quiet for reasons that have everything to do with scale. Come to understand the New Valley as what it actually is: not one oasis, but the vast, empty, patient space between several of them.",
};

const ES = {
  standfirst:
    'Al Wadi Al Gadid — el Nuevo Valle — no es un solo oasis sino una gobernación que reúne a varios, Kharga, Dakhla y Baris entre ellos, repartidos por un tramo del Desierto Occidental lo bastante grande como para engullir países más pequeños enteros. Lo que los une es el clima: sin lluvia, implacable en verano, y silencioso de una manera que tiene menos que ver con la población que con la distancia respecto a casi todo lo demás.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es severo en toda la gobernación, con días que superan regularmente los 40°C, sin costa y sin nubosidad que lo suavice — este es el calor de desierto profundo en su forma más pura. El invierno (diciembre a febrero) trae alivio: máximas diurnas entre 20 y 25°C y noches que caen cerca de la congelación en cuanto se pone el sol, por igual en cada oasis de la región. La primavera y el otoño son transiciones breves y calurosas a ambos lados de los extremos.',
  h_quiet: 'Una quietud inmensa', // NEW — owner sign-off
  quiet:
    'Esta gobernación es menos un lugar que una distancia — Kharga al norte, Dakhla más al oeste, Baris aún más al sur, cada uno su propio pequeño mundo separado de los demás por horas de desierto vacío. Esa escala es la verdadera historia climática de aquí: no solo calor y frío, sino un silencio que nace de estar genuinamente lejos de casi todo, en todas direcciones a la vez. Visita un oasis y habrás visto un pueblo; entiende el Nuevo Valle y habrás entendido cuánto de Egipto está, sencillamente, vacío a propósito.',
  h_cold: 'Frío en cuanto se va el sol', // NEW — owner sign-off
  cold:
    'En toda la gobernación se cumple el truco más antiguo del desierto: nada en el aire ni en el suelo retiene el calor del día una vez que el sol se ha ido. Una tarde de 40°C puede dar paso a una noche genuinamente fría en cuestión de horas, sin importar en qué oasis te encuentres — prepárate para ambos extremos en el mismo día, porque el Nuevo Valle te los pedirá los dos.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y mucha más agua de la que llevarías en cualquier lugar con costa cerca.')],
    [span('Invierno:', ['strong']), span(' capas de abrigo para la noche sin excepción — el descenso de temperatura tras la puesta de sol se aplica a toda la región, no solo a un oasis.')],
    [span('Todo el año:', ['strong']), span(' protección solar tanto para los ojos como para la piel, y un plan para distancias de conducción genuinamente largas entre pueblos.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Al Wadi Al Gadid no es tanto una única historia climática como la misma historia contada a lo largo de una distancia enorme — sin lluvia, de cielos inmensos, y silenciosa por razones que tienen todo que ver con la escala. Ven a entender el Nuevo Valle por lo que realmente es: no un solo oasis, sino el espacio vasto, vacío y paciente entre varios de ellos.',
};

const JA = {
  standfirst:
    'アル・ワーディ・アル・ガディード——ニュー・ヴァレー——は、ひとつのオアシスではなく、ハルガ、ダフラ、バリスなどを含む複数のオアシスを抱える県です。より小さな国をまるごと飲み込んでしまえそうなほど広大な西方砂漠の一帯に散らばっています。それらをひとつにまとめているのは気候です。雨はなく、夏には容赦なく、そしてその静けさは、人口の少なさというより、ほとんどすべてのものからの距離によって生まれています。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は県全体で過酷を極め、日中は40°Cを超える日が続き、和らげてくれる海岸線も雲もありません——これは、もっとも純粋な形の砂漠奥地の暑さです。冬（12月から2月）は救いをもたらします。日中の最高気温は20度台前半から半ば、そして太陽が沈んだ瞬間に氷点近くまで冷え込む夜が、この地域のどのオアシスでも等しく訪れます。春と秋は、両極端のあいだの短く暑い移行期です。',
  h_quiet: 'ひとつの巨大な静寂', // NEW — owner sign-off
  quiet:
    'この県は、場所というより距離です——北にハルガ、さらに西にダフラ、さらに南深くにバリス。それぞれが独自の小さな世界であり、何時間もの空虚な砂漠によって互いに隔てられています。その規模こそが、ここでの本当の気候の物語です。暑さと寒さだけでなく、あらゆる方向から、ほぼすべてのものから本当に遠く離れていることから生まれる静けさ。ひとつのオアシスを訪れれば、ひとつの町を見たことになります。ニュー・ヴァレーを理解すれば、エジプトのどれほどの部分が、意図的に空っぽのままにされているかを理解したことになります。',
  h_cold: '太陽が去った瞬間の寒さ', // NEW — owner sign-off
  cold:
    '県全体で、砂漠のもっとも古い仕掛けが変わらず成り立っています——太陽が去ってしまえば、空気にも地面にも、日中の熱を保つものは何もありません。40°Cの午後が、数時間のうちに本当に寒い夜へと変わることがあり、それはどのオアシスに立っていても変わりません。同じ日に両方の極端に備えてください。ニュー・ヴァレーは、その両方を求めてくるからです。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして海岸の近くにある場所よりもずっと多くの水を。')],
    [span('冬：', ['strong']), span('例外なく、夜のための暖かい重ね着を——日没後の気温の下がり方は、ひとつのオアシスだけでなく地域全体に当てはまります。')],
    [span('通年：', ['strong']), span('肌だけでなく目のための日光対策と、町と町のあいだの本当に長い運転距離への備えを。')],
  ],
  h_final: '最後に', // reused
  final:
    'アル・ワーディ・アル・ガディードは、ひとつの気候の物語というより、途方もない距離にわたって語られる同じ物語です——雨はなく、空は広大で、その静けさの理由はすべて規模にあります。ニュー・ヴァレーを、その実際の姿として理解しに来てください。ひとつのオアシスではなく、いくつものオアシスのあいだに広がる、広大で空虚な、辛抱強い空間として。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_quiet), p(x.quiet),
    h2(x.h_cold), p(x.cold),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Al Wadi Al Gadid', es: 'El Clima en Al Wadi Al Gadid', ja: 'アル・ワーディ・アル・ガディードの気候ガイド' },
  desc: {
    en: 'The New Valley holds Kharga, Dakhla, and Baris in one enormous quiet — true deep-desert weather, rainless and huge-skied, cold the moment the sun leaves.',
    es: 'El Nuevo Valle reúne a Kharga, Dakhla y Baris en una única y enorme quietud — clima de desierto profundo, sin lluvia y de cielos inmensos, frío en cuanto el sol se retira.',
    ja: 'ニュー・ヴァレーは、ハルガ、ダフラ、バリスをひとつの巨大な静寂の中に抱えています。真の砂漠奥地の気候——雨はなく、空は広大で、太陽が沈んだ瞬間に冷え込みます。',
  },
};

function preflight() {
  const flatStrip = fs.readFileSync('/Users/islamhussein/Desktop/al-wadi-al-gadid-weather-copy.md', 'utf8')
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.quiet], [loc, C.cold], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(str.replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} body strings all present in copy file`);
}

async function main() {
  preflight();
  const pub: any = await client.getDocument(ID);
  if (!pub) throw new Error('published doc not found');
  const heroBefore = JSON.stringify(pub.heroImage);

  const draft = {
    ...pub, // heroImage carried through UNCHANGED (no swap)
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
  const heroAfter = JSON.stringify(draft.heroImage);
  await client.createOrReplace(draft);
  console.log('Staged draft drafts.' + ID);
  console.log('  heroImage UNCHANGED:', heroBefore === heroAfter, '(asset', draft.heroImage?.asset?._ref + ')');
  console.log('  body', buildBody(EN).length, 'blocks/locale; marker after "The Shape of the Year"');
  console.log('  title set / summary cleared / seo.metaDescription created x3');
}
main().catch((e) => { console.error(e); process.exit(1); });
