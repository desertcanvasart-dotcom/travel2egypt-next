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

const ID = 'wp-page-60533';
// HERO: UNCHANGED this build (owner-directed defer). Current asset is Kharga-Oasis.jpeg
// (1200x797, wrong-city Western Desert oasis, shared w/ Kharga) — a KNOWN, LOGGED gap:
// deferred as its own sourcing item pending a genuine Sohag-specific dry/clear-sky photo
// (not swapped from any current sibling). heroImage carried through byte-identical.
const REGION = 'upper-egypt';

let kc = 0;
const K = () => `s${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── Hero alt/caption — AUTHORED. Alt literal (White Monastery facade, clear blue sky);
//    caption climate-framed (clear dry winter sky, before the afternoon heat). No arch/history.
const HERO_ALT = {
  en: 'The pale limestone facade of the White Monastery at Sohag, dome and cross above weathered walls under a clear blue sky',
  es: 'La fachada de piedra caliza clara del Monasterio Blanco en Sohag, con cúpula y cruz sobre muros desgastados bajo un cielo azul despejado',
  ja: '澄んだ青空の下、ソハーグの白の修道院の淡い石灰岩のファサード。風化した壁の上にドームと十字架が立つ',
};
const HERO_CAPTION = {
  en: 'The White Monastery at Sohag under the clear, dry winter sky the season is built around — best seen before the afternoon heat.',
  es: 'El Monasterio Blanco en Sohag bajo el cielo invernal despejado y seco en torno al que gira la temporada — mejor visto antes del calor de la tarde.',
  ja: '澄んで乾いた冬の空の下に立つソハーグの白の修道院——午後の暑さが訪れる前に見るのがいい。',
};

// ── content. Provenance per section:
//   standfirst / carving / final = NEW, verbatim from Desktop/sohag-weather-copy.md
//   shape = owner-APPROVED fresh draft (corridor voice, real facts) — NOT in the .md
//   pack  = PRESERVED verbatim from the live doc (EN/ES as-was; JA de-fused from one block);
//           labels bolded to match the skeleton bullet format, wording unchanged.
const EN = {
  standfirst:
    "Sohag is the base for Abydos and the White Monastery, and a winter-morning proposition: clear, cool early, hot by two — time the carving for the low light. This isn't a city travellers linger in for its own sake; it's the sensible place to sleep before the two sites that actually justify the trip north.",
  h_shape: 'The Shape of the Year',
  shape:
    'Summer (June to August) is severe, days regularly near 39°C, dry and cloudless from mid-morning on. Winter (December to February) is the season to come — mild daytime highs in the low-to-mid 20s, but genuinely cold dawns near 5°C, and a swing of some sixteen degrees between first light and the afternoon. Spring and autumn are short, hot transitions, with the occasional khamsin sandstorm in spring.',
  h_carve: 'Time the Carving for the Light',
  carve:
    "Abydos holds some of the finest raised relief in Egypt, carved shallow enough that low, angled light does most of the work of revealing it — a flat midday sun washes the detail out entirely. Go early, while Sohag's own mornings are still clear and cool, and the White Monastery's stonework rewards the same instinct: soft light, not harsh overhead sun. By two in the afternoon, the heat has caught up with both the day and the light, and neither site shows as well.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' Light, breathable clothing, sunglasses, a wide-brimmed hat, and sunscreen are essential. Consider packing a lightweight scarf for protection against the sun and sand.')],
    [span('Winter:', ['strong']), span(' Bring layers, including a warm jacket for cooler nights. Comfortable walking shoes are a must for any season.')],
    [span('Spring and Autumn:', ['strong']), span(' Pack a mix of light clothing and a few warmer layers for the evenings. A light scarf can be handy for protection against wind and sand.')],
  ],
  h_final: 'Final Word',
  final:
    "Sohag is the base for Abydos and the White Monastery, and a winter-morning proposition: clear, cool early, hot by two — time the carving for the low light. Come for what's north of the city, not the city itself, and let the morning do the work the afternoon sun can't.",
};

const ES = {
  standfirst:
    'Sohag es la base para Abidos y el Monasterio Blanco, y una propuesta de mañana de invierno: despejado, fresco al principio, caluroso a las dos — programa la talla para la luz rasante. No es una ciudad en la que los viajeros se demoren por sí misma; es el lugar sensato donde dormir antes de los dos yacimientos que de verdad justifican el viaje al norte.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es severo, con días que rondan regularmente los 39°C, secos y sin nubes a partir de media mañana. El invierno (diciembre a febrero) es la temporada para venir — máximas diurnas suaves entre 20 y 25°C, pero amaneceres genuinamente fríos, cercanos a los 5°C, y un salto de unos dieciséis grados entre la primera luz y la tarde. La primavera y el otoño son transiciones breves y calurosas, con el jamsín ocasional en primavera.',
  h_carve: 'Programa la talla para la luz', // NEW — owner sign-off
  carve:
    'Abidos guarda algunos de los relieves en bajorrelieve más finos de Egipto, tallados con tan poca profundidad que la luz baja y angulada hace la mayor parte del trabajo de revelarlos — un sol de mediodía totalmente vertical borra el detalle por completo. Ve temprano, mientras las propias mañanas de Sohag siguen despejadas y frescas, y la piedra del Monasterio Blanco premia el mismo instinto: luz suave, no sol cenital duro. Hacia las dos de la tarde, el calor ha alcanzado tanto al día como a la luz, y ninguno de los dos yacimientos se ve igual de bien.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('En verano:', ['strong']), span(' Es esencial llevar ropa ligera y transpirable, gafas de sol, un sombrero de ala ancha y protección solar. Considera la posibilidad de llevar un pañuelo ligero para protegerte del sol y la arena.')],
    [span('En invierno:', ['strong']), span(' Lleva varias capas de ropa, incluida una chaqueta para las noches más frescas. Un calzado cómodo para caminar es imprescindible en cualquier estación.')],
    [span('Primavera y otoño:', ['strong']), span(' Empaca una mezcla de ropa ligera y algunas capas más abrigadas para las noches. Una bufanda ligera puede ser útil para protegerse del viento y la arena.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Sohag es la base para Abidos y el Monasterio Blanco, y una propuesta de mañana de invierno: despejado, fresco al principio, caluroso a las dos — programa la talla para la luz rasante. Ven por lo que hay al norte de la ciudad, no por la ciudad misma, y deja que la mañana haga el trabajo que el sol de la tarde no puede.',
};

const JA = {
  standfirst:
    'ソハーグはアビドスと白の修道院への拠点であり、冬の朝の提案です——早朝は晴れて涼しく、2時には暑くなります。彫刻は、光が低く差し込む時間に合わせて訪れてください。旅行者がこの街自体に長く留まることはあまりありません。北への旅を本当に正当化してくれるふたつの遺跡の前に眠る、理にかなった場所なのです。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は過酷で、日中は39°C近くまで上がり、午前半ば以降は乾いて雲ひとつない空が広がります。冬（12月から2月）こそ訪れるべき季節です——日中の最高気温は20度台前半から半ばと穏やかですが、夜明けは5°C前後まで本当に冷え込み、朝一番の光から午後にかけて16度ほどの寒暖差が生まれます。春と秋は短く暑い移行期で、春には時おりハムシンの砂嵐が訪れます。',
  h_carve: '光に合わせて彫刻を見る', // NEW — owner sign-off
  carve:
    'アビドスは、エジプトでも屈指の繊細な浮彫を有しています。彫りが浅いため、低く角度のついた光がその大部分を照らし出してくれます——真上からの正午の太陽は、その細部を完全に消し去ってしまいます。ソハーグ自体の朝がまだ晴れて涼しいうちに早く出発してください。白の修道院の石造も同じ本能に応えてくれます。柔らかな光であって、真上からの厳しい日差しではありません。午後2時までには、暑さが日の進みにも光にも追いついてしまい、どちらの遺跡も本来の姿を見せてはくれません。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽く通気性の良い服、サングラス、広めの帽子、日焼け止めが必須です。日差しや砂から身を守るために軽量のスカーフを持参するのも良いでしょう。')],
    [span('冬：', ['strong']), span('重ね着をし、涼しい夜のために暖かいジャケットを持参してください。どの季節でも快適に歩ける靴が必要です。')],
    [span('春と秋：', ['strong']), span('軽い服と夜間のために少し暖かいレイヤーを持参することをおすすめします。風や砂から守るために軽いスカーフが便利です。')],
  ],
  h_final: '最後に', // reused
  final:
    'ソハーグはアビドスと白の修道院への拠点であり、冬の朝の提案です——早朝は晴れて涼しく、2時には暑くなります。彫刻は、光が低く差し込む時間に合わせて訪れてください。訪れるべきは街の北にあるものであって、街そのものではありません。午後の太陽にはできない仕事を、朝にまかせてください。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_carve), p(x.carve),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Sohag', es: 'El Clima en Sohag', ja: 'ソハーグの気候ガイド' },
  desc: {
    en: 'The base for Abydos and the White Monastery, and a winter-morning proposition: clear, cool early, hot by two — time the carving for the low light.',
    es: 'La base para Abidos y el Monasterio Blanco, y una propuesta de mañana de invierno: despejado, fresco al principio, caluroso a las dos — programa la talla para la luz rasante.',
    ja: 'アビドスと白の修道院への拠点であり、冬の朝の提案です——早朝は晴れて涼しく、2時には暑くなります。彫刻は、光が低く差し込む時間に合わせて訪れてください。',
  },
};

// Preflight validates ONLY the from-copy strings (standfirst/carve/final + meta desc) against
// the .md. Shape (owner-approved draft) and Pack (preserved from live doc) are verified separately.
function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/sohag-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc + ':standfirst', C.standfirst], [loc + ':carve', C.carve], [loc + ':final', C.final]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) checks.push([loc + ':desc', (META.desc as any)[loc]]);
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(apos(str).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH (from-copy sections) — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} from-copy strings present in .md`);
}

async function main() {
  preflight();
  const pub: any = await client.getDocument(ID);
  if (!pub) throw new Error('published doc not found');
  const heroBefore = pub.heroImage?.asset?._ref;

  // Verify preserved What-to-Pack wording matches the live pre-build doc (EN/ES/JA)
  const liveText = (loc: string) => (pub.body.find((b: any) => b._key === loc)?.value || [])
    .filter((b: any) => b._type === 'block').map((b: any) => b.children.map((c: any) => c.text).join('')).join('\n').replace(/\s+/g, '');
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    for (const b of C.pack) {
      const t = b.map((s) => s.text).join('').replace(/\s+/g, '');
      if (!liveText(loc).includes(t)) { console.error(`PRESERVED PACK MISMATCH [${loc}]: ${t.slice(0, 40)}… not found verbatim in live doc`); process.exit(1); }
    }
  }
  console.log('preserved What-to-Pack: all 9 bullets match the live pre-build doc verbatim');

  const draft = {
    ...pub, // heroImage carried through UNCHANGED (deferred, see header note)
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
  console.log('  heroImage UNCHANGED:', heroBefore === draft.heroImage?.asset?._ref, '(deferred; asset', draft.heroImage?.asset?._ref + ')');
  console.log('  region set:', pub.region, '->', REGION);
  console.log('  body', buildBody(EN).length, 'blocks/locale; marker after "The Shape of the Year"');
  console.log('  title set / summary cleared / seo.metaDescription created x3');
}
main().catch((e) => { console.error(e); process.exit(1); });
