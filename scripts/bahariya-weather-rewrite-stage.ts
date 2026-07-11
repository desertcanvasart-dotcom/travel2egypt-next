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

const ID = 'wp-page-58727';
// NO hero swap — heroImage intentionally NOT overridden.

let kc = 0;
const K = () => `b${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (from Desktop/bahariya-oasis-weather-copy.md) ───────────
// Headings: EN verbatim. ES/JA — 3 reused (Shape / What to Pack / Final Word);
// 2 NEW (Warm Springs Cold Desert, Gateway to the Chalk) FLAGGED for sign-off.
const EN = {
  standfirst:
    "Bahariya isn't the New Valley — it's its own oasis, 370 kilometres southwest of Cairo, the northern gateway into the Western Desert and the last real town before the White Desert's chalk formations begin. Its climate has a specific trick: the springs the oasis is named for keep their warmth long after dark, while the open desert around it — especially further out toward the White Desert camps — does the opposite entirely.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is hot, days regularly past 37°C, and the desert offers little relief until the sun drops. Winter (December to February) brings mild days in the low-to-mid 20s, but nights are the coldest of any oasis in this part of the desert — routinely down near freezing, colder after dark here than at Kharga or the New Valley further south. Spring and autumn sit between the extremes, warm by day and still sharply cool once the sun is gone.",
  h_springs: 'Warm Springs, Cold Desert',
  springs:
    "The oasis takes its character from water: hot springs that keep their temperature well into the evening, drawing both residents and visitors after the day's heat breaks. Step away from that warmth into the open desert, though, and the contrast is immediate — with no water and no cover to hold the day's heat, the surrounding sand cools fast and keeps cooling long after the springs have settled into their steady warmth. It's the same desert, telling two completely different stories depending on where you're standing.",
  h_gateway: 'Gateway to the Chalk',
  gateway:
    "Bahariya is where most White Desert trips actually begin — the last stop for supplies and a hot meal before the road turns to the Black Desert's dark hills and then the chalk formations further out. That onward stretch runs colder than Bahariya itself: December camp nights among the White Desert's rock formations can touch freezing, part of why the desert there feels so different after dark than it looks during the day.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(' light, breathable clothing, strong sunscreen, and plenty of water — the heat here has no coastline to soften it.')],
    [span('Winter:', ['strong']), span(' warm layers for the evening without exception, and genuinely cold-weather gear if a White Desert camp night is part of the plan.')],
    [span('Year-round:', ['strong']), span(" something to swim in if you're visiting the hot springs, and a headlamp for anywhere without much ambient light after dark.")],
  ],
  h_final: 'Final Word',
  final:
    "Bahariya runs on a contrast most oases don't have — warm water after dark on one side, a desert cooling toward freezing on the other, and a road leading further into that cold if you keep going. Come for the springs, stay for the gateway, and pack for both halves of the climate story.",
};

const ES = {
  standfirst:
    'Bahariya no es el Nuevo Valle — es su propio oasis, a 370 kilómetros al suroeste de El Cairo, la puerta norte hacia el Desierto Occidental y el último pueblo real antes de que comiencen las formaciones de tiza del Desierto Blanco. Su clima tiene un truco particular: los manantiales que dan nombre al oasis conservan su calor mucho después del anochecer, mientras que el desierto abierto a su alrededor —especialmente más allá, hacia los campamentos del Desierto Blanco— hace exactamente lo contrario.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es caluroso, con días que superan regularmente los 37°C, y el desierto ofrece poco alivio hasta que cae el sol. El invierno (diciembre a febrero) trae días templados entre 20 y 25°C, pero las noches son las más frías de cualquier oasis de esta parte del desierto — habitualmente cerca de la congelación, más frías después del anochecer aquí que en Kharga o el Nuevo Valle más al sur. La primavera y el otoño se sitúan entre los extremos, cálidos de día y todavía marcadamente frescos en cuanto se pone el sol.',
  h_springs: 'Manantiales cálidos, desierto frío', // NEW — owner sign-off
  springs:
    'El oasis toma su carácter del agua: manantiales termales que mantienen su temperatura hasta bien entrada la noche, atrayendo tanto a residentes como a visitantes una vez que se rompe el calor del día. Pero al alejarse de ese calor hacia el desierto abierto, el contraste es inmediato — sin agua ni nada que retenga el calor del día, la arena de alrededor se enfría rápido y sigue enfriándose mucho después de que los manantiales se hayan asentado en su calidez constante. Es el mismo desierto, contando dos historias completamente distintas según dónde te encuentres.',
  h_gateway: 'La puerta de entrada a la caliza', // NEW — owner sign-off
  gateway:
    'Bahariya es donde suelen empezar de verdad la mayoría de los viajes al Desierto Blanco — la última parada para provisiones y una comida caliente antes de que la carretera se adentre en las colinas oscuras del Desierto Negro y, más allá, en las formaciones de tiza. Ese tramo posterior es más frío que la propia Bahariya: las noches de diciembre acampando entre las formaciones rocosas del Desierto Blanco pueden rozar la congelación, una de las razones por las que ese desierto se siente tan distinto de noche de lo que parece de día.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y mucha agua — aquí el calor no tiene costa que lo suavice.')],
    [span('Invierno:', ['strong']), span(' capas de abrigo para la noche sin excepción, y equipo genuinamente de clima frío si una noche de campamento en el Desierto Blanco forma parte del plan.')],
    [span('Todo el año:', ['strong']), span(' algo para bañarte si visitas los manantiales termales, y una linterna frontal para cualquier lugar con poca luz ambiental después del anochecer.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Bahariya funciona con un contraste que la mayoría de los oasis no tienen — agua cálida después del anochecer por un lado, un desierto que se enfría hacia la congelación por el otro, y una carretera que lleva a más frío todavía si sigues adelante. Ven por los manantiales, quédate por la puerta de entrada, y equípate para las dos mitades de esta historia climática.',
};

const JA = {
  standfirst:
    'バハリーヤはニュー・ヴァレーではありません——独自のオアシスであり、カイロから南西へ370キロ、西方砂漠への北の玄関口であり、白砂漠の白亜の奇岩群が始まる前の最後の本当の町です。この気候にはひとつの特徴があります。オアシスの名の由来である温泉は、日が沈んだあとも長く暖かさを保ちますが、その周囲に広がる開けた砂漠——とりわけさらに先にある白砂漠のキャンプ地——はまったく逆のことが起こります。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は暑く、日中は37°Cを超える日が続き、太陽が沈むまで砂漠はほとんど和らぎません。冬（12月から2月）は日中20度台前半から半ばの穏やかな気候をもたらしますが、夜はこの砂漠一帯のどのオアシスよりも冷え込みます——たいてい氷点近くまで下がり、南にあるハルガやニュー・ヴァレーよりも、日没後はここのほうが寒くなります。春と秋は両極端のあいだにあり、日中は暖かいものの、日が沈めば依然としてはっきりと涼しくなります。',
  h_springs: '温かい温泉、冷たい砂漠', // NEW — owner sign-off
  springs:
    'このオアシスの性格を決めているのは水です。夕方になっても温度を保つ温泉が、日中の暑さがやわらいだあと、住民と旅行者の両方を引き寄せます。けれど、その温かさから離れて開けた砂漠に足を踏み入れると、対比は即座に訪れます——水も、日中の熱を保つ覆いもないため、周囲の砂はすぐに冷え、温泉が安定した暖かさに落ち着いたあとも、なお冷え続けます。同じ砂漠が、立っている場所によってまったく異なるふたつの物語を語るのです。',
  h_gateway: '白亜の大地への玄関口', // NEW — owner sign-off
  gateway:
    'バハリーヤは、白砂漠への旅の多くが実際に始まる場所です——道が黒砂漠の暗い丘、さらにその先の白亜の奇岩群へと向かう前の、物資調達と温かい食事のための最後の立ち寄り地です。その先の区間はバハリーヤ自体よりも冷え込みます。白砂漠の奇岩群のあいだで過ごす12月のキャンプの夜は、氷点に達することもあります。それが、この砂漠が昼の姿と夜の感触でこれほど違って感じられる理由のひとつです。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そしてたっぷりの水を——ここの暑さを和らげてくれる海岸線はありません。')],
    [span('冬：', ['strong']), span('例外なく、夜のための暖かい重ね着を。白砂漠でのキャンプの夜が予定にあるなら、本格的な防寒装備を。')],
    [span('通年：', ['strong']), span('温泉を訪れるなら水着を、そして日没後に周囲の明かりが少ない場所のためのヘッドライトを。')],
  ],
  h_final: '最後に', // reused
  final:
    'バハリーヤは、ほとんどのオアシスにはない対比の上に成り立っています——片や日が沈んだあとも温かい水、片やそのまま先へ進むほど氷点に向かって冷えていく砂漠と、そこへ続く道。温泉のために来て、玄関口としての魅力にとどまり、この気候の物語の両方の側面に備えてください。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_springs), p(x.springs),
    h2(x.h_gateway), p(x.gateway),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Bahariya Oasis', es: 'El Clima en el Oasis de Bahariya', ja: 'バハリーヤ・オアシスの気候ガイド' },
  desc: {
    en: "Bahariya's weather matters most after dark — the springs stay warm, the desert doesn't, and the White Desert camps beyond can touch freezing on the same December night.",
    es: 'El clima de Bahariya importa sobre todo después del anochecer — los manantiales se mantienen cálidos, el desierto no, y los campamentos del Desierto Blanco pueden rozar el punto de congelación la misma noche de diciembre.',
    ja: 'バハリーヤの気候が本領を発揮するのは日が沈んでから。温泉は暖かいままですが、砂漠はそうではありません。同じ12月の夜に、その先の白砂漠のキャンプは氷点近くまで冷え込むことがあります。',
  },
};

function preflight() {
  const flatStrip = fs.readFileSync('/Users/islamhussein/Desktop/bahariya-oasis-weather-copy.md', 'utf8')
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.springs], [loc, C.gateway], [loc, C.final]);
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
