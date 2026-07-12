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

const ID = 'wp-page-78374';
// NO hero swap — heroImage intentionally NOT overridden (golden-hour Kom Ombo temple,
// subject-perfect; only high-res alt is a night shot that contradicts the identity).
const REGION = 'upper-egypt';

let kc = 0;
const K = () => `k${(kc++).toString(36)}`;
type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
const span = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: K(), text, marks });
const block = (style: string, spans: Span[], extra: Record<string, unknown> = {}) =>
  ({ _type: 'block', _key: K(), style, markDefs: [], children: spans, ...extra });
const p = (t: string) => block('normal', [span(t)]);
const h2 = (t: string) => block('h2', [span(t)]);
const bullet = (spans: Span[]) => block('normal', spans, { listItem: 'bullet', level: 1 });
const MARKER = () => block('normal', [span('[[climate-signature]]')]);

// ── verbatim copy (from Desktop/kom-ombo-weather-copy.md) ─────────────────
// EN "cruise’s"/"day’s" authored CURLY to match the dataset caption fixed at
// source (Luxor-class). Preflight normalizes apostrophe glyphs vs the .md.
// Headings: EN verbatim. ES/JA — 3 reused; 1 NEW (Wait for the Sun to Leave) FLAGGED.
const EN = {
  standfirst:
    "The one temple the boats visit at golden hour: Kom Ombo at sunset is the cruise’s best-lit appointment, and the evening air off the river is the reward for the day’s heat. Where the rest of Upper Egypt asks you to beat the sun, Kom Ombo asks you to wait for it to leave.",
  h_shape: 'The Shape of the Year',
  shape:
    "Summer (June to August) is severe, days regularly past 42°C — tying Luxor for the hottest peak in the corridor. Winter (December to February) brings daytime highs in the low-to-mid 20s and the mildest January nights of any Upper Egypt river town on this list, rarely dropping below single digits. Spring and autumn are short, hot transitions, with the occasional khamsin sandstorm in spring.",
  h_wait: 'Wait for the Sun to Leave',
  wait:
    "Every other temple stop on this stretch of the Nile rewards arriving early, before the heat sets in. Kom Ombo works the opposite way: cruise itineraries schedule it for late afternoon on purpose, timing the visit so the temple's honey-coloured stone catches the low sun just as the day’s worst heat finally breaks. The evening river air that follows isn't a consolation for the heat you endured — it's the actual point, the moment the whole day was arranged around.",
  h_pack: 'What to Pack',
  pack: [
    [span('Summer:', ['strong']), span(" light, breathable clothing, strong sunscreen, and something for the evening — the temple visit here happens after the day’s heat, not before it.")],
    [span('Winter:', ['strong']), span(' a light layer for the evening river air; days stay mild but sunset still cools things down.')],
    [span('Year-round:', ['strong']), span(' a camera charged for golden hour — this is the one stop on the river built around the light.')],
  ],
  h_final: 'Final Word',
  final:
    "The one temple the boats visit at golden hour: Kom Ombo at sunset is the cruise’s best-lit appointment, and the evening air off the river is the reward for the day’s heat. Every other stop on this stretch tells you to hurry before the sun rises too high. Kom Ombo tells you to relax — the best part of the day comes after.",
};

const ES = {
  standfirst:
    'El único templo que los barcos visitan a la hora dorada: Kom Ombo al atardecer es la cita mejor iluminada del crucero, y el aire vespertino del río es la recompensa al calor del día. Mientras el resto del Alto Egipto te pide ganarle al sol, Kom Ombo te pide esperar a que se vaya.',
  h_shape: 'La forma del año', // reused
  shape:
    'El verano (junio a agosto) es severo, con días que superan regularmente los 42°C — empatando con Luxor como el pico más caluroso del corredor. El invierno (diciembre a febrero) trae máximas diurnas entre 20 y 25°C y las noches de enero más suaves de cualquier pueblo ribereño del Alto Egipto en esta lista, que rara vez bajan de un solo dígito. La primavera y el otoño son transiciones breves y calurosas, con el jamsín ocasional en primavera.',
  h_wait: 'Espera a que se vaya el sol', // NEW — owner sign-off
  wait:
    'Todas las demás paradas de templo en este tramo del Nilo premian llegar temprano, antes de que se instale el calor. Kom Ombo funciona al revés: los itinerarios de crucero lo programan a propósito para última hora de la tarde, calculando la visita para que la piedra color miel del templo capte la luz baja del sol justo cuando el peor calor del día por fin cede. El aire vespertino del río que sigue no es un consuelo por el calor soportado — es el verdadero objetivo, el momento en torno al cual se organizó todo el día.',
  h_pack: 'Qué llevar en la maleta', // reused
  pack: [
    [span('Verano:', ['strong']), span(' ropa ligera y transpirable, protector solar fuerte, y algo para la noche — la visita al templo aquí ocurre después del calor del día, no antes.')],
    [span('Invierno:', ['strong']), span(' una capa ligera para el aire vespertino del río; los días siguen templados pero el atardecer sigue refrescando.')],
    [span('Todo el año:', ['strong']), span(' una cámara cargada para la hora dorada — esta es la única parada del río construida en torno a la luz.')],
  ],
  h_final: 'Para terminar', // reused
  final:
    'El único templo que los barcos visitan a la hora dorada: Kom Ombo al atardecer es la cita mejor iluminada del crucero, y el aire vespertino del río es la recompensa al calor del día. Cada otra parada de este tramo te dice que te des prisa antes de que el sol suba demasiado. Kom Ombo te dice que te relajes — lo mejor del día llega después.',
};

const JA = {
  standfirst:
    '船がゴールデンアワーに訪れる唯一の神殿——夕暮れのコム・オンボはクルーズの中で最も美しく照らされる瞬間であり、川から吹く夜の空気は、一日の暑さに対する何よりの褒美です。上エジプトの他の町が太陽に打ち勝つことを求めるのに対して、コム・オンボは太陽が去るのを待つことを求めます。',
  h_shape: '一年の気候の移ろい', // reused
  shape:
    '夏（6月から8月）は過酷で、日中は42°Cを超える日が続きます——この街道沿いの中でルクソールと並ぶ最高気温です。冬（12月から2月）は日中の最高気温が20度台前半から半ば、そしてこのリストにある上エジプトの川沿いの町の中で最も穏やかな1月の夜をもたらし、一桁台まで下がることはめったにありません。春と秋は短く暑い移行期で、春には時おりハムシンの砂嵐が訪れます。',
  h_wait: '太陽が去るのを待つ', // NEW — owner sign-off
  wait:
    'このナイル沿いの区間にある他のどの神殿も、暑さが本格化する前の早い到着に報いてくれます。コム・オンボはその逆です。クルーズの旅程は意図的に午後遅くにこの神殿を組み込み、その日いちばんの暑さがようやく和らぐちょうどそのとき、蜂蜜色の神殿の石が低い陽光をとらえるよう、訪問の時間を計っています。そのあとに訪れる夜の川風は、耐えた暑さへの慰めではありません——それこそが本当の目的であり、一日全体がそのために組み立てられた瞬間なのです。',
  h_pack: '持ち物のヒント', // reused
  pack: [
    [span('夏：', ['strong']), span('軽くて通気性の良い服、強めの日焼け止め、そして夜のための一枚を——ここの神殿訪問は、一日の暑さのあとにやってきます。')],
    [span('冬：', ['strong']), span('川の夜風のための薄手の一枚を。日中は穏やかなままですが、夕暮れはやはり気温を下げます。')],
    [span('通年：', ['strong']), span('ゴールデンアワーのために充電したカメラを——これは、光を中心に組み立てられた、川沿いで唯一の寄港地です。')],
  ],
  h_final: '最後に', // reused
  final:
    '船がゴールデンアワーに訪れる唯一の神殿——夕暮れのコム・オンボはクルーズの中で最も美しく照らされる瞬間であり、川から吹く夜の空気は、一日の暑さに対する何よりの褒美です。この区間にある他のどの寄港地も、日が高く昇りすぎる前に急げと告げます。コム・オンボは、くつろいでいいと告げます——一日でいちばん良い瞬間は、そのあとにやって来るのです。',
};

function buildBody(x: typeof EN) {
  return [
    p(x.standfirst),
    h2(x.h_shape), p(x.shape),
    MARKER(),
    h2(x.h_wait), p(x.wait),
    h2(x.h_pack), ...x.pack.map((s) => bullet(s)),
    h2(x.h_final), p(x.final),
  ];
}

const META = {
  title: { en: 'Weather in Kom Ombo', es: 'El Clima en Kom Ombo', ja: 'コム・オンボの気候ガイド' },
  desc: {
    en: 'The one temple the boats visit at golden hour — Kom Ombo at sunset is the cruise’s best-lit appointment, and the evening air off the river is the reward for the day’s heat.',
    es: 'El único templo que los barcos visitan a la hora dorada — Kom Ombo al atardecer es la cita mejor iluminada del crucero, y el aire vespertino del río es la recompensa al calor del día.',
    ja: '船がゴールデンアワーに訪れる唯一の神殿——夕暮れのコム・オンボはクルーズの中で最も美しく照らされる瞬間であり、川から吹く夜の空気は、一日の暑さに対する何よりの褒美です。',
  },
};

function preflight() {
  const apos = (s: string) => s.replace(/[’‘ʼ]/g, "'");
  const flatStrip = apos(fs.readFileSync('/Users/islamhussein/Desktop/kom-ombo-weather-copy.md', 'utf8'))
    .replace(/\*\*/g, '').replace(/\s+/g, '');
  const checks: Array<[string, string]> = [];
  for (const [loc, C] of [['en', EN], ['es', ES], ['ja', JA]] as const) {
    checks.push([loc, C.standfirst], [loc, C.shape], [loc, C.wait], [loc, C.final]);
    for (const b of C.pack) checks.push([loc, b.map((s) => s.text).join('')]);
  }
  for (const loc of ['en', 'es', 'ja'] as const) checks.push([loc + ':desc', (META.desc as any)[loc]]);
  const fails: string[] = [];
  for (const [loc, str] of checks) if (!flatStrip.includes(apos(str).replace(/\s+/g, ''))) fails.push(`[${loc}] ${str.slice(0, 55)}…`);
  if (fails.length) { console.error('VERBATIM MISMATCH — aborting:\n' + fails.join('\n')); process.exit(1); }
  console.log(`verbatim pre-flight OK: ${checks.length} strings all present in copy file`);
  const enBody = [EN.standfirst, EN.shape, EN.wait, ...EN.pack.map((b) => b.map((s) => s.text).join('')), EN.final].join(' ');
  const curledWords = [...new Set((enBody.match(/[A-Za-z]+’[A-Za-z]+/g) || []).map((w) => w.replace('’', "'")))];
  const straightWords = [...new Set((enBody.match(/[A-Za-z]+'[A-Za-z]+/g) || []))];
  console.log(`  EN body curled word-forms (${curledWords.length}): ${JSON.stringify(curledWords)}`);
  console.log(`  EN body straight word-forms (${straightWords.length}): ${JSON.stringify(straightWords)}`);
  console.log(`  → chars: curly ’=${(enBody.match(/’/g) || []).length}, straight '=${(enBody.match(/'/g) || []).length}`);
  const allNew = [EN, ES, JA].flatMap((C) => [C.standfirst, C.shape, C.wait, C.final, ...C.pack.map((b) => b.map((s) => s.text).join(''))]).join(' ');
  console.log(`  filler tic ("visiting climate"/訪問気候) absent: ${!/visiting climate|訪問気候/i.test(allNew)}`);
}

async function main() {
  preflight();
  const pub: any = await client.getDocument(ID);
  if (!pub) throw new Error('published doc not found');
  const heroBefore = JSON.stringify(pub.heroImage);

  const draft = {
    ...pub, // heroImage carried through UNCHANGED (no swap)
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
  const heroAfter = JSON.stringify(draft.heroImage);
  await client.createOrReplace(draft);
  console.log('Staged draft drafts.' + ID);
  console.log('  heroImage UNCHANGED:', heroBefore === heroAfter, '(asset', draft.heroImage?.asset?._ref + ')');
  console.log('  region set:', pub.region, '->', REGION);
  console.log('  body', buildBody(EN).length, 'blocks/locale; marker after "The Shape of the Year"');
  console.log('  title set / summary cleared / seo.metaDescription created x3 (incl. ES overwrite)');
}
main().catch((e) => { console.error(e); process.exit(1); });
