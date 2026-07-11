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

const ID = 'wp-page-60438';
// NO hero swap — heroImage is intentionally NOT overridden (kept from published doc).

let kc = 0;
const K = () => `f${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (from Desktop/1safaga-weather-copy.md) ──────────────────
// Headings: EN verbatim. ES/JA — 4 reused verbatim from prior pages
// (Shape of the Year / Wind / What to Pack / Final Word, all owner-approved);
// 1 NEW (A Working Coast) FLAGGED for owner sign-off.
const EN = {
  standfirst:
    "Safaga shares its weather almost exactly with Hurghada, an hour up the coast — same heat, same wind, same rainless winter sun. What it doesn't share is the crowd. This is a working port before it's a resort, and that difference shapes everything about how the town feels, even when the numbers on the forecast look identical to its more famous neighbour.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to September) is hot, days regularly clearing 35°C, softened by the same sea breeze that makes the whole coast bearable. Winter (December to February) brings daytime temperatures in the low-to-mid 20s and nights cool enough for a light jacket, with a sea that stays swimmable throughout. Spring can carry the khamsin, a hot dry wind off the desert; autumn is the quiet bridge between summer's heat and winter's calm.",
  h_wind: 'Wind',
  wind:
    "Safaga's wind is the same wind that built Hurghada's kitesurfing scene, blowing most reliably from March through November and strongest in the afternoons — but here it draws a different crowd. Windsurfers, not kitesurfers, are Safaga's signature on the water, and several long-running windsurf centres have built their entire season around this stretch of coast specifically.",
  h_coast: 'A Working Coast',
  coast:
    "The other thing that sets Safaga apart: it's a real port, phosphate docks and cargo ships sharing the same water as the dive boats and windsurf launches. That working identity keeps the town smaller and less polished than Hurghada — fewer resorts, fewer sunbeds lined up on the sand, and a coastline that still has a job to do besides tourism. For travellers who want Hurghada's climate without Hurghada's crowds, this is the trade Safaga offers.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and something to cut the wind if you're on the water in the afternoon.")],
    [span('Winter:', ['strong']), span(' swimwear plus a light jacket for the evening.')],
    [span('Year-round:', ['strong']), span(" reef-safe sunscreen, and gear suited to actual wind sport if that's the reason you're here — Safaga's wind is a working tool for windsurfers, not background weather.")],
  ],
  h_final: 'Final Word',
  final:
    "Safaga is what Hurghada's weather looks like without Hurghada's tourism machine around it — same sun, same wind, same swimmable winter sea, wrapped around a town that still answers first to its docks. Come for the windsurfing, or come because you want the Red Sea's easy climate with a quieter coast underneath it.",
};

const ES = {
  standfirst:
    'Safaga comparte su clima casi exactamente con Hurghada, una hora costa arriba — el mismo calor, el mismo viento, el mismo sol de invierno sin lluvia. Lo que no comparte es la multitud. Este es un puerto de trabajo antes que un resort, y esa diferencia marca todo lo que se siente en el pueblo, incluso cuando las cifras del pronóstico son prácticamente idénticas a las de su vecino más famoso.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a septiembre) es caluroso, con días que superan regularmente los 35°C, suavizados por la misma brisa marina que hace soportable toda la costa. El invierno (diciembre a febrero) trae temperaturas diurnas entre 20 y 25°C y noches lo bastante frescas para una chaqueta ligera, con un mar que se mantiene nadable durante toda la temporada. La primavera puede traer el jamsín, un viento cálido y seco del desierto; el otoño es el puente tranquilo entre el calor del verano y la calma del invierno.',
  h_wind: 'Viento', // reused (Hurghada, owner-approved)
  wind:
    'El viento de Safaga es el mismo que dio forma a la escena de kitesurf de Hurghada, y sopla con más regularidad de marzo a noviembre, más fuerte por las tardes — pero aquí atrae a un público distinto. Los windsurfistas, no los practicantes de kitesurf, son la firma de Safaga sobre el agua, y varios centros de windsurf con mucha trayectoria han construido toda su temporada específicamente en torno a este tramo de costa.',
  h_coast: 'Una costa que trabaja', // NEW — owner sign-off
  coast:
    'La otra cosa que distingue a Safaga: es un puerto real, con muelles de fosfatos y barcos de carga compartiendo el mismo agua que las embarcaciones de buceo y los lanzamientos de windsurf. Esa identidad de trabajo mantiene al pueblo más pequeño y menos pulido que Hurghada — menos resorts, menos tumbonas alineadas en la arena, y una costa que todavía tiene un trabajo que hacer además del turismo. Para quienes quieren el clima de Hurghada sin sus multitudes, este es el intercambio que ofrece Safaga.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y algo que corte el viento si vas a estar en el agua por la tarde.')],
    [span('Invierno:', ['strong']), span(' bañador y una chaqueta ligera para la noche.')],
    [span('Todo el año:', ['strong']), span(' protector solar respetuoso con el arrecife, y equipo adecuado para deporte de viento en serio si esa es la razón de tu visita — el viento de Safaga es una herramienta de trabajo para los windsurfistas, no un simple telón de fondo.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Safaga es el clima de Hurghada sin la maquinaria turística de Hurghada alrededor — el mismo sol, el mismo viento, el mismo mar de invierno en el que se puede nadar, envuelto en un pueblo que todavía responde primero a sus muelles. Ven por el windsurf, o ven porque quieres el clima fácil del mar Rojo con una costa más tranquila debajo.',
};

const JA = {
  standfirst:
    'サファガの気候は、海岸を1時間ほど北へ行ったハルガダとほぼ同じです——同じ暑さ、同じ風、同じ雨のない冬の日差し。共有していないのは、人混みです。ここはリゾートである前に働く港であり、その違いが、天気予報の数字が有名な隣町とほぼ同じであっても、町の感じ方すべてを形づくっています。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から9月）は暑く、日中は35°Cを超える日が続きますが、この海岸全体を過ごしやすくしているのと同じ海風が、その暑さを和らげてくれます。冬（12月から2月）は日中の気温が20度台前半から半ば、夜は薄手のジャケットがほしくなる涼しさで、海は季節を通して泳げる温かさを保ちます。春にはハムシン——砂漠から吹く暑く乾いた風——が訪れることがあり、秋は夏の暑さと冬の穏やかさのあいだの、静かな橋渡しの季節です。',
  h_wind: '風', // reused (Hurghada, owner-approved)
  wind:
    'サファガの風は、ハルガダのカイトサーフィンシーンを育てたのと同じ風です。最も安定して吹くのは3月から11月、最も強くなるのは午後——けれどここでは、違う顔ぶれを引き寄せます。水面の主役はカイトサーファーではなく、ウィンドサーファー。長年営業してきたウィンドサーフィンセンターのいくつかは、まさにこの海岸線を軸にシーズン全体を組み立てています。',
  h_coast: '働く海岸', // NEW — owner sign-off
  coast:
    'サファガをもうひとつ際立たせているもの——それは、本物の港であるということです。リン鉱石の積出桟橋と貨物船が、ダイビングボートやウィンドサーフィンの出艇場と同じ海を分け合っています。この働く港としての性格が、この町をハルガダより小さく、磨き上げられていないままにしています。リゾートは少なく、砂浜に並ぶビーチチェアも少なく、観光以外にもまだ仕事のある海岸線です。ハルガダの気候を、ハルガダの人混みなしで求める旅行者にとって、これがサファガの差し出す取引です。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして午後に水上で過ごすなら風を防ぐ一枚を。')],
    [span('冬：', ['strong']), span('水着と、夜のための薄手のジャケット。')],
    [span('通年：', ['strong']), span('サンゴに優しい日焼け止め、そしてもし本気でウィンドスポーツが目的なら、それに見合った装備を——サファガの風はウィンドサーファーにとって単なる背景ではなく、仕事道具です。')],
  ],
  h_final: '最後に', // reused
  final:
    'サファガは、ハルガダの観光の仕組みを取り除いたときのハルガダの気候そのものです——同じ太陽、同じ風、同じ泳げる冬の海。それが、いまだにまず港に応える町を包んでいます。ウィンドサーフィンのために来るのもいい。あるいは、紅海の気軽な気候を、その下により静かな海岸とともに求めて来るのもいいでしょう。',
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
  title: { en: 'Weather in Safaga', es: 'El Clima en Safaga', ja: 'サファガの気候ガイド' },
  desc: {
    en: "Safaga runs on Hurghada's climate with a working coast attached — phosphate docks, dive boats, and wind serious enough that windsurfers cross continents for it.",
    es: 'Safaga tiene el mismo clima que Hurghada, pero con una costa de trabajo de fondo — muelles de fosfatos, barcos de buceo, y un viento tan serio que los windsurfistas cruzan continentes para encontrarlo.',
    ja: 'サファガの気候はハルガダと同じですが、そこには働く港の顔があります。リン鉱石の積出港、ダイビングボート、そしてウィンドサーファーが大陸を越えてでも求める本気の風。',
  },
};

function preflight() {
  const md = fs.readFileSync('/Users/islamhussein/Desktop/1safaga-weather-copy.md', 'utf8').replace(/\*\*/g, '');
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const flatSpace = norm(md);
  const flatStrip = md.replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.wind], [loc, C.coast], [loc, C.final]);
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
