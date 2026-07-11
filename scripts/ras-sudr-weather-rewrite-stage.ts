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

const ID = 'wp-page-60380';
const HERO_DONOR = 'wp-page-60384'; // kitesurfer, 3000x2000

let kc = 0;
const K = () => `r${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (from Desktop/1ras-sudr-weather-copy.md) ────────────────
// Headings: EN verbatim. ES/JA — 4 reused verbatim from prior pages
// (Shape of the Year / Wind / What to Pack / Final Word); 1 NEW
// (Cairo's Weekend Coast) FLAGGED for owner sign-off.
const EN = {
  standfirst:
    "Ras Sudr doesn't try to be Hurghada or Sharm. There's no dive scene to speak of, no old town, not much beyond a flat, shallow lagoon and wind that blows sideways along the shore almost every afternoon. That single-mindedness is the point: this is where Cairo goes to kite for the weekend, two hours down the road and built around exactly one thing.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to September) is hot, days regularly reaching the mid-30s, though the shallow lagoon warms faster than the open sea and offers less relief than Hurghada's deeper water. Winter (December to February) brings mild days in the low-to-mid 20s and cool nights, without the crowds that fill the bigger resort towns further south. The wind barely takes a season off — it's the one constant on the calendar here.",
  h_wind: 'Wind',
  wind:
    "Ras Sudr's wind is different in character from its cluster-mates further south: it runs side-shore rather than cross-shore, blows almost every afternoon rather than seasonally, and the kite season here barely closes at all. This isn't background wind that happens to suit a sport — it's the reason the town has a sport in the first place, and the flat, shallow lagoon behind the beach makes it one of the most forgiving places on the Egyptian coast to learn.",
  h_coast: "Cairo's Weekend Coast",
  coast:
    "The other thing that sets Ras Sudr apart is who actually comes here: mostly Cairenes, driving down through the Ahmed Hamdi tunnel for a weekend rather than flying in from abroad. That's a different climate story too — this is a place built around Thursday-to-Saturday crowds and Sunday-empty beaches, not a year-round international season. If you want the Red Sea's wind without the Red Sea's tourism infrastructure, Ras Sudr is closer to Cairo than anywhere else on this list, and it shows in how the town runs.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and proper kite gear if that's why you're here — the lagoon rewards it.")],
    [span('Winter:', ['strong']), span(' swimwear plus a warmer layer for the evening; the wind makes winter days feel cooler than the thermometer suggests.')],
    [span('Year-round:', ['strong']), span(' reef-safe sunscreen and something to protect your eyes from blown sand on a windy afternoon.')],
  ],
  h_final: 'Final Word',
  final:
    "Ras Sudr isn't trying to be everything to everyone, and that's exactly why it works for the one thing it does. Come with a kite, or don't come at all — this is a coastline that sells wind, not scenery, and it delivers almost every single afternoon.",
};

const ES = {
  standfirst:
    'Ras Sudr no intenta ser Hurghada ni Sharm. No hay apenas escena de buceo, no hay casco antiguo, poco más que una laguna plana y poco profunda y un viento que sopla de lado a lo largo de la costa casi todas las tardes. Esa obstinación es precisamente el punto: aquí es donde El Cairo va a hacer kitesurf el fin de semana, a dos horas por carretera, construido en torno a una sola cosa.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a septiembre) es caluroso, con días que suelen alcanzar los mediados de los 30°C, aunque la laguna poco profunda se calienta más rápido que el mar abierto y ofrece menos alivio que las aguas más profundas de Hurghada. El invierno (diciembre a febrero) trae días templados entre 20 y 25°C y noches frescas, sin las multitudes que llenan los grandes pueblos turísticos más al sur. El viento apenas se toma una temporada libre — es la única constante en el calendario de aquí.',
  h_wind: 'Viento', // reused
  wind:
    'El viento de Ras Sudr tiene un carácter distinto al de sus vecinos más al sur: sopla de lado a lo largo de la orilla en vez de perpendicular a ella, casi todas las tardes en lugar de solo por temporada, y la temporada de kite aquí apenas llega a cerrar. No es un viento de fondo que resulta venirle bien a un deporte — es la razón por la que el pueblo tiene ese deporte, para empezar, y la laguna plana y poco profunda detrás de la playa lo convierte en uno de los lugares más indulgentes de toda la costa egipcia para aprender.',
  h_coast: 'La costa de fin de semana de El Cairo', // NEW — owner sign-off
  coast:
    'La otra cosa que distingue a Ras Sudr es quién viene realmente aquí: en su mayoría, gente de El Cairo, que baja en coche por el túnel de Ahmed Hamdi para pasar el fin de semana en lugar de volar desde el extranjero. Eso también cambia la historia del clima — este es un lugar construido en torno a las multitudes de jueves a sábado y las playas vacías del domingo, no una temporada internacional durante todo el año. Si quieres el viento del mar Rojo sin la infraestructura turística del mar Rojo, Ras Sudr está más cerca de El Cairo que cualquier otro lugar de esta lista, y eso se nota en cómo funciona el pueblo.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y equipo de kite en condiciones si es por eso que estás aquí — la laguna lo recompensa.')],
    [span('Invierno:', ['strong']), span(' bañador y una capa más abrigada para la noche; el viento hace que los días de invierno se sientan más fríos de lo que indica el termómetro.')],
    [span('Todo el año:', ['strong']), span(' protector solar respetuoso con el arrecife y algo para proteger los ojos de la arena que levanta el viento en una tarde ventosa.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Ras Sudr no intenta ser todo para todos, y precisamente por eso funciona tan bien para lo único que hace. Ven con una cometa, o no vengas — esta es una costa que vende viento, no paisaje, y lo cumple casi todas las tardes.',
};

const JA = {
  standfirst:
    'ラス・スドルは、ハルガダやシャルムになろうとはしません。ダイビングと呼べるようなシーンもなく、旧市街もなく、あるのはほとんど、浅く平らなラグーンと、ほぼ毎日午後に岸に沿って横向きに吹く風だけです。その一途さこそが、この町の要点です。ここは、カイロから車で2時間、たったひとつのことのために作られた、週末のカイトサーフィンの場所なのです。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から9月）は暑く、日中は30度台半ばに達する日が続きます。ただし浅いラグーンは外洋より早く温まるため、ハルガダの深い海ほどの涼しさは期待できません。冬（12月から2月）は日中20度台前半から半ばの穏やかな気候と涼しい夜をもたらし、さらに南にある大きなリゾートタウンほどの人混みはありません。風は季節を問わずほとんど休むことがありません——それが、ここの暦における唯一の定数です。',
  h_wind: '風', // reused
  wind:
    'ラス・スドルの風は、南にある同じクラスターの町々とは性格が異なります。岸に対して垂直ではなく横向きに吹き、季節限定ではなくほぼ毎日午後に吹き、ここのカイトシーズンはほとんど閉じることがありません。これは、たまたまスポーツに向いていた背景の風ではなく——この町にそのスポーツが存在する理由そのものです。ビーチの奥に広がる浅く平らなラグーンが、エジプト沿岸でも屈指の、初心者に優しい学びの場にしています。',
  h_coast: 'カイロの週末海岸', // NEW — owner sign-off
  coast:
    'ラス・スドルをもうひとつ際立たせているのは、実際にここへ来る人たちです——その多くは、海外から飛行機で来るのではなく、アハマド・ハムディ・トンネルを車で抜けて週末を過ごしにくるカイロの人々です。それは気候の物語も変えます。ここは木曜から土曜の人出と、日曜には空っぽになるビーチを軸に作られた場所であり、年間を通した国際的なシーズンを持つ町ではありません。紅海の風を、紅海の観光インフラなしで求めるなら、ラス・スドルはこのリストの中でもっともカイロに近く、それは町の営まれ方にも表れています。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そしてもしそれが目的なら本格的なカイト用具を——ラグーンはそれに応えてくれます。')],
    [span('冬：', ['strong']), span('水着と、夜のための暖かめの一枚。風のせいで、冬の日中は温度計の数字以上に涼しく感じられます。')],
    [span('通年：', ['strong']), span('サンゴに優しい日焼け止めと、風の強い午後に舞う砂から目を守るための対策を。')],
  ],
  h_final: '最後に', // reused
  final:
    'ラス・スドルは、すべての人にすべてを提供しようとはしていません。だからこそ、たったひとつのことに関しては見事に機能するのです。カイトを持って来るか、来ないか——ここは景色ではなく風を売る海岸であり、ほぼ毎日午後、その約束を果たしています。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_wind), p(x.wind),
    h2(x.h_coast), p(x.coast),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Ras Sudr', es: 'El Clima en Ras Sudr', ja: 'ラス・スドルの気候ガイド' },
  desc: {
    en: "Ras Sudr sells one thing: wind, steady and side-shore across a flat, shallow lagoon — which is why it's less an international resort than Cairo's own weekend kite coast.",
    es: 'Ras Sudr vende una sola cosa: viento, constante y de a través de una laguna plana y poco profunda — por eso es menos un resort internacional que la costa de fin de semana para el kitesurf de El Cairo.',
    ja: 'ラス・スドルが売るものはひとつだけです——浅く平らなラグーンを吹き抜ける、安定したサイドショアの風。だからこそここは国際的なリゾートというより、カイロの週末カイトコーストなのです。',
  },
};

function preflight() {
  // strip markdown bold + ALL whitespace so line-wrapped hyphens ("mid-\n30s")
  // and inter-word wraps compare cleanly across every locale.
  const flatStrip = fs.readFileSync('/Users/islamhussein/Desktop/1ras-sudr-weather-copy.md', 'utf8')
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.wind], [loc, C.coast], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  const fails: string[] = [];
  for (const [loc, str] of checks) {
    const ok = flatStrip.includes(str.replace(/\s+/g, ''));
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
  if (!donor?.heroImage?.asset) throw new Error('hero donor not found');
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
