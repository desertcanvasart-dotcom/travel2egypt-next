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

const ID = 'wp-page-60297';
const HERO_DONOR = 'wp-page-60736'; // jetty at sunrise near Nuweiba, 1200x800

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

// ── verbatim copy (from Desktop/nuweiba-weather-copy.md) ──────────────────
// Headings: EN verbatim. ES/JA — 3 reused verbatim from prior pages
// (Shape / What to Pack / Final Word); 2 NEW (The Quiet Coast, Warm Sea Late
// Season) FLAGGED for owner sign-off.
const EN = {
  standfirst:
    "Nuweiba doesn't compete with Dahab or Sharm for attention, and that's exactly its appeal. This is the gulf's quiet stretch — beach camps instead of resort towers, a coastline the mountains shadow by mid-afternoon, and a sea that stays warm well past the point where other towns' seasons have wound down.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to September) is hot, days regularly clearing 35°C, but the mountains behind the coast bring shade earlier than on the open mainland shore — by mid-to-late afternoon, much of the beach is out of direct sun. Winter (December to February) is mild, daytime highs in the low-to-mid 20s and nights cool enough for a blanket, with a sea that takes longer to cool than it does to warm. Spring and autumn are quiet transitions, largely free of the crowds that fill the bigger resort towns.",
  h_quiet: 'The Quiet Coast',
  quiet:
    "What Nuweiba actually offers is scarcity of the good kind: beach camps rather than hotel blocks, long stretches of sand with more mountain than people in view, and a pace set by the tide rather than a schedule. It's the closest thing on this stretch of coast to the Sinai's older way of visiting the sea — simple, unhurried, and mostly left alone.",
  h_warm: 'Warm Sea, Late Season',
  warm:
    "The water here holds its warmth stubbornly — long after the peak season crowds have gone, the sea is often still swimmable on a mild winter afternoon. Combined with the mountain shade that shortens the hottest hours in summer, Nuweiba runs a gentler temperature story than its neighbours even though the raw numbers on the chart above are nearly identical.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and something for the beach camps' cooler evening hours once the sun drops behind the mountains.")],
    [span('Winter:', ['strong']), span(' swimwear plus a warm layer for the night — camp evenings get cold faster than a hotel room does.')],
    [span('Year-round:', ['strong']), span(" reef-safe sunscreen, and a headlamp or torch if you're staying in a beach camp without much ambient light.")],
  ],
  h_final: 'Final Word',
  final:
    "Nuweiba isn't chasing anyone's attention, and the weather matches the mood — mild, forgiving, and content to stay quiet while the bigger towns further south do the advertising. Come here for the version of the Sinai coast that doesn't feel like a resort at all.",
};

const ES = {
  standfirst:
    'Nuweiba no compite con Dahab ni con Sharm por la atención, y ese es precisamente su encanto. Este es el tramo tranquilo del golfo — campamentos de playa en lugar de torres de resort, una costa a la que las montañas dan sombra desde media tarde, y un mar que sigue cálido mucho después de que otros pueblos hayan dado por cerrada su temporada.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a septiembre) es caluroso, con días que superan regularmente los 35°C, pero las montañas detrás de la costa traen sombra antes que en la orilla abierta del continente — desde media tarde, buena parte de la playa queda fuera del sol directo. El invierno (diciembre a febrero) es templado, con máximas diurnas entre 20 y 25°C y noches lo bastante frescas para una manta, y un mar que tarda más en enfriarse de lo que tarda en calentarse. La primavera y el otoño son transiciones tranquilas, en gran medida libres de las multitudes que llenan los pueblos turísticos más grandes.',
  h_quiet: 'La costa tranquila', // NEW — owner sign-off
  quiet:
    'Lo que Nuweiba ofrece en realidad es una escasez del tipo bueno: campamentos de playa en vez de bloques de hotel, largos tramos de arena con más montaña que gente a la vista, y un ritmo marcado por la marea más que por un horario. Es lo más parecido, en este tramo de costa, a la manera antigua de visitar el mar en el Sinaí — sencilla, sin prisa, y en gran medida dejada en paz.',
  h_warm: 'Mar cálido, temporada tardía', // NEW — owner sign-off
  warm:
    'El agua aquí retiene su calor con terquedad — mucho después de que se hayan ido las multitudes de temporada alta, el mar sigue siendo a menudo apto para nadar en una tarde templada de invierno. Combinado con la sombra de las montañas que acorta las horas más calurosas en verano, Nuweiba tiene una historia de temperatura más suave que sus vecinos, aunque las cifras del gráfico de arriba sean casi idénticas.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y algo para las horas más frescas de la noche en los campamentos de playa, una vez que el sol cae tras las montañas.')],
    [span('Invierno:', ['strong']), span(' bañador y una capa de abrigo para la noche — las noches de campamento se enfrían más rápido que una habitación de hotel.')],
    [span('Todo el año:', ['strong']), span(' protector solar respetuoso con el arrecife, y una linterna frontal si te alojas en un campamento de playa sin mucha luz ambiental.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'Nuweiba no persigue la atención de nadie, y el clima acompaña ese ánimo — templado, indulgente, y conforme con quedarse tranquilo mientras los pueblos más grandes más al sur se encargan de hacer publicidad. Ven aquí por la versión de la costa del Sinaí que no se parece en nada a un resort.',
};

const JA = {
  standfirst:
    'ヌエイバは、ダハブやシャルムのように注目を競おうとはしません。それこそが、この町の魅力です。ここは湾の静かな一角——リゾートの高層棟ではなくビーチキャンプ、午後の半ばには山の影が落ちる海岸線、そして他の町がシーズンを終えたあともずっと暖かいままの海があります。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から9月）は暑く、日中は35°Cを超える日が続きますが、海岸の背後にある山々のおかげで、本土側の開けた海岸よりも早く日陰が生まれます——午後半ばから遅くには、ビーチの多くが直射日光から外れます。冬（12月から2月）は穏やかで、日中の最高気温は20度台前半から半ば、夜は毛布がほしくなる涼しさで、海は温まるよりも冷めるほうに時間がかかります。春と秋は静かな移行期で、大きなリゾートタウンを埋めるような人混みからはおおむね無縁です。',
  h_quiet: '静かな海岸', // NEW — owner sign-off
  quiet:
    'ヌエイバが実際に差し出しているのは、良い意味での希少さです。ホテルの建物群ではなくビーチキャンプ、視界に人よりも山のほうが多く映る長い砂浜、そしてスケジュールではなく潮の満ち引きが刻むペース。この海岸線の中で、シナイのより古い海との付き合い方にいちばん近い場所——シンプルで、急がず、おおむね手つかずのまま残されています。',
  h_warm: '暖かい海、遅い季節', // NEW — owner sign-off
  warm:
    'ここの海水は、頑固なまでにその暖かさを保ちます——ピークシーズンの人混みが去ったずっとあとでも、穏やかな冬の午後には泳げることが少なくありません。夏のいちばん暑い時間帯を短くする山の陰と合わさって、ヌエイバは、上のグラフの数字が近隣とほぼ同じであるにもかかわらず、より穏やかな気温の物語を紡いでいます。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして太陽が山の向こうに沈んだあとのビーチキャンプの涼しい夜のための一枚を。')],
    [span('冬：', ['strong']), span('水着と、夜のための暖かい一枚——キャンプの夜は、ホテルの部屋よりも早く冷え込みます。')],
    [span('通年：', ['strong']), span('サンゴに優しい日焼け止めと、周囲の明かりが少ないビーチキャンプに泊まるならヘッドライトか懐中電灯を。')],
  ],
  h_final: '最後に', // reused
  final:
    'ヌエイバは誰の注目も追いかけていません。そして気候もその雰囲気に合っています——穏やかで、寛容で、南のもっと大きな町々が宣伝を担うあいだ、静かなままでいることに満足しています。リゾートらしさがまるでない、シナイ海岸の姿を求めるなら、ここへ。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_quiet), p(x.quiet),
    h2(x.h_warm), p(x.warm),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Nuweiba', es: 'El Clima en Nuweiba', ja: 'ヌエイバの気候ガイド' },
  desc: {
    en: "Nuweiba is the quiet stretch of the Gulf of Aqaba — beach camps instead of resorts, mountain shadow by late afternoon, and a sea that stays warm long after the season's crowds have thinned.",
    es: 'Nuweiba es el tramo tranquilo del golfo de Aqaba — campamentos de playa en lugar de resorts, sombra de montaña al caer la tarde, y un mar que sigue cálido mucho después de que se haya ido la multitud de temporada.',
    ja: 'ヌエイバは、アカバ湾の静かな一角です。リゾートではなくビーチキャンプ、午後遅くに山影が落ち、シーズンの人混みが去ってからもずっと暖かいままの海。',
  },
};

function preflight() {
  const flatStrip = fs.readFileSync('/Users/islamhussein/Desktop/nuweiba-weather-copy.md', 'utf8')
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.quiet], [loc, C.warm], [loc, C.final]);
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
