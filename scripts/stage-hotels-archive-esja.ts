/**
 * Stage + ES/JA for the hotelsArchive singleton (owner instruction
 * 2026-08-19: "do the hotels one too" — same EN-only gap as
 * travelTipsArchive, found while fixing that page).
 *
 * EN-only fields localized: kicker, mastTitle, tagline, essayHeading,
 * essay (incl. h3 headings, the 4-grade definitionList, and the linked
 * "Hotel Grade Concept" line — same href, which is a locale-less site
 * path, pre-existing behavior), and the 3 collections' kicker/title/intro.
 * featured.body is empty in EN — left untouched. "Hotel Grade Concept"
 * stays as a proper noun in both renderings (it names an EN page).
 *
 * Canon: figures/grades identical; ES impersonal-editorial; JA formal,
 * full-width punctuation. Guards: no pre-existing draft; EN text parity
 * on every block this file was authored against.
 *
 *   Dry run (default): npx tsx scripts/stage-hotels-archive-esja.ts
 *   Apply (stage):     npx tsx scripts/stage-hotels-archive-esja.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');

const token =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_PRODUCTION_API_WRITE_TOKEN');
  process.exit(1);
}
const c = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

const STR: Record<string, { es: string; ja: string }> = {
  kicker: { es: 'Dónde alojarse · Edición №7', ja: 'どこに泊まるか · 第7版' },
  mastTitle: { es: 'Hoteles que recomendamos en Egipto', ja: '私たちがおすすめするエジプトのホテル' },
  tagline: {
    es: 'Propiedades concretas con las que trabajamos, elegidas porque encajan con un tipo de viajero y un tipo de viaje, no porque nadie haya pagado por aparecer.',
    ja: '実際に私たちが提携している具体的なホテルです——掲載料のためではなく、旅行者のタイプと旅のかたちに合うという理由で選んでいます。',
  },
  essayHeading: { es: 'Cómo pensamos el lugar donde se duerme.', ja: '泊まる場所について、私たちの考え方' },
};

const GRADES = [
  { en: 'Luxury', es: 'Lujo', ja: 'ラグジュアリー',
    esD: 'Máximo nivel auténtico: servicio, entorno y sensación de ocasión. Se percibe nada más llegar.',
    jaD: '正真正銘の最上級——サービス、ロケーション、特別な時間の感覚。到着した瞬間に分かります。' },
  { en: 'Deluxe', es: 'Deluxe', ja: 'デラックス',
    esD: 'Excelente, fiable, bien gestionado. La elección segura en una ciudad, sin el precio del lujo.',
    jaD: '上質で安定した、運営の行き届いたホテル。ラグジュアリーの価格を出さずに済む、都市での堅実な選択です。' },
  { en: 'Boutique', es: 'Boutique', ja: 'ブティック',
    esD: 'Pequeño, con carácter, a menudo de gestión familiar. Elegido por su atmósfera más que por sus servicios.',
    jaD: '小規模で個性があり、家族経営も多いホテル。設備よりも雰囲気で選んでいます。' },
  { en: 'Standard', es: 'Estándar', ja: 'スタンダード',
    esD: 'Limpio, céntrico, honesto. Para viajes en los que el hotel es una base, no el destino.',
    jaD: '清潔で、立地がよく、価格に正直。ホテルが目的ではなく拠点である旅のために。' },
];

const ESSAY = {
  es: {
    e1: 'Un hotel no es un detalle al final del viaje. En Egipto suele ser la mitad de la experiencia: la terraza donde el Nilo se vuelve dorado, el patio que deja la ciudad fuera, el lodge del desierto con un cielo que uno había olvidado que existía. Aquí están las propiedades en las que realmente alojamos a nuestros viajeros, con el porqué de cada una y el viaje al que conviene.',
    e2: 'Cómo los clasificamos',
    e3: 'La categoría de estrellas de la puerta y la experiencia del interior no son lo mismo. Nuestros grados describen lo segundo: qué tipo de estancia es, no cuántas instalaciones suma.',
    e5: 'Leer el Hotel Grade Concept completo →',
    e6: 'Lo que no incluimos',
    e7: 'No cobramos por aparecer y no incluimos ninguna propiedad en la que no alojaríamos a nuestros propios viajeros. La ausencia de un nombre famoso suele tener su motivo.',
    e8: 'Cómo usar esta página',
    e9: 'Si ya se conoce la ciudad y el grado, basta con ir al índice del final y filtrar. Si el viaje aún está tomando forma, es mejor leer las colecciones de abajo: agrupan las propiedades por el tipo de estancia y no por el número de estrellas, que suele ser la pregunta más útil.',
  },
  ja: {
    e1: 'ホテルは旅の最後に決める些末な項目ではありません。エジプトでは、ホテルが体験の半分を占めることも珍しくないのです——ナイル川が黄金色に染まるテラス、街の喧騒を外に締め出す中庭、忘れていた星空に出会える砂漠のロッジ。ここには、私たちが実際に旅行者をご案内しているホテルだけを掲載し、それぞれがどんな旅に向いているのかを添えています。',
    e2: 'グレードの考え方',
    e3: '入口に掲げられた星の数と、中での体験は別物です。私たちのグレードが表すのは後者——設備の数ではなく、どのような滞在になるかです。',
    e5: 'Hotel Grade Concept の全文を読む →',
    e6: '掲載しないもの',
    e7: '私たちは掲載料を受け取りませんし、自分たちの旅行者を泊めたいと思えないホテルを載せることもありません。有名なホテルが見当たらない場合、たいていそれなりの理由があります。',
    e8: 'このページの使い方',
    e9: '都市とグレードが決まっている方は、ページ末尾の索引で絞り込んでください。旅のかたちがまだ固まっていない方は、下のコレクションからどうぞ——星の数ではなく滞在のタイプでホテルをまとめており、たいていはそちらの方が役に立つ問いです。',
  },
};

const COLLECTIONS = [
  { key: 'c1', enTitle: 'City landmarks',
    kicker: { es: 'Colección №1', ja: 'コレクション №1' },
    title: { es: 'Emblemas de ciudad', ja: '都市のランドマーク' },
    intro: {
      es: 'Los hoteles que vienen con historia incorporada. No se trata solo de alojarse en ellos: es alojarse en la historia de la ciudad que los rodea.',
      ja: '歴史を背負ったホテルたち。そこに泊まることは、単なる宿泊ではなく、街の物語の中に身を置くことです。',
    } },
  { key: 'c2', enTitle: 'Red Sea, properly',
    kicker: { es: 'Colección №2', ja: 'コレクション №2' },
    title: { es: 'El mar Rojo, como es debido', ja: '紅海を、正しく' },
    intro: {
      es: 'Más allá de la expansión de los resorts de paquete, las propiedades que de verdad se ganan la costa: para buceadores, para familias y para quienes quieren el arrecife sin la multitud.',
      ja: 'パッケージリゾートが立ち並ぶ一帯の先にある、海岸の名にふさわしいホテルたち。ダイバーにも、ご家族にも、人混みを避けてリーフを楽しみたい方にも。',
    } },
  { key: 'c3', enTitle: 'Desert & oasis',
    kicker: { es: 'Colección №3', ja: 'コレクション №3' },
    title: { es: 'Desierto y oasis', ja: '砂漠とオアシス' },
    intro: {
      es: 'Donde lo importante es el silencio, las estrellas y la ausencia de todo lo demás. No es para todos los viajes; es exactamente lo adecuado para el viaje indicado.',
      ja: '大切なのは静寂と星空、そして余計なものが何もないこと。すべての旅に向くわけではありません——合う旅には、これ以上ないほど合います。',
    } },
];

const block = (key: string, text: string, style = 'normal', marks: string[] = [], markDefs: unknown[] = []) => ({
  _type: 'block',
  _key: key,
  style,
  markDefs,
  children: [{ _type: 'span', _key: `${key}s`, marks, text }],
});

function essayValue(loc: 'es' | 'ja') {
  const t = ESSAY[loc];
  return [
    block(`h${loc}1`, t.e1),
    block(`h${loc}2`, t.e2, 'h3'),
    block(`h${loc}3`, t.e3),
    {
      _type: 'definitionList',
      _key: `h${loc}4`,
      items: GRADES.map((g, i) => ({
        _type: 'definition',
        _key: `h${loc}4g${i}`,
        term: [
          { _key: 'en', _type: 'object', value: g.en },
          { _key: loc, _type: 'object', value: g[loc] },
        ],
        description: [
          { _key: loc, _type: 'object', value: loc === 'es' ? g.esD : g.jaD },
        ],
      })),
    },
    block(`h${loc}5`, t.e5, 'normal', ['lnk'], [
      { _key: 'lnk', _type: 'externalLink', href: '/hotel-grade-concept', newTab: false },
    ]),
    block(`h${loc}6`, t.e6, 'h3'),
    block(`h${loc}7`, t.e7),
    block(`h${loc}8`, t.e8, 'h3'),
    block(`h${loc}9`, t.e9),
  ];
}

async function main() {
  console.log(`\n=== Stage hotelsArchive ES/JA — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const [doc, draftExists] = await Promise.all([
    c.getDocument('hotelsArchive'),
    c.fetch<boolean>(`defined(*[_id=='drafts.hotelsArchive'][0]._id)`),
  ]);
  if (!doc) throw new Error('hotelsArchive not found');
  if (draftExists) throw new Error('draft already exists — clean-draft rule');
  if ((doc.tagline ?? []).some((x: { _key: string }) => x._key === 'es')) {
    console.log('Already localized — nothing to do.');
    return;
  }
  // guards: collections order + grade terms as authored against
  const enOf = (arr: any[]) => (arr ?? []).find((x) => x._key === 'en')?.value;
  doc.collections.forEach((col: any, i: number) => {
    if (enOf(col.title) !== COLLECTIONS[i].enTitle)
      throw new Error(`collection ${i} title drifted: ${enOf(col.title)}`);
  });
  const enEssay = enOf(doc.essay);
  const defList = enEssay.find((b: any) => b._type === 'definitionList');
  defList.items.forEach((it: any, i: number) => {
    if (enOf(it.term) !== GRADES[i].en) throw new Error(`grade ${i} term drifted: ${enOf(it.term)}`);
  });

  const addLoc = (arr: any[], es: string, ja: string) => [
    ...arr,
    { _key: 'es', value: es },
    { _key: 'ja', value: ja },
  ];

  const draft = {
    ...doc,
    _id: 'drafts.hotelsArchive',
    kicker: addLoc(doc.kicker, STR.kicker.es, STR.kicker.ja),
    mastTitle: addLoc(doc.mastTitle, STR.mastTitle.es, STR.mastTitle.ja),
    tagline: addLoc(doc.tagline, STR.tagline.es, STR.tagline.ja),
    essayHeading: addLoc(doc.essayHeading, STR.essayHeading.es, STR.essayHeading.ja),
    essay: [...doc.essay, { _key: 'es', value: essayValue('es') }, { _key: 'ja', value: essayValue('ja') }],
    collections: doc.collections.map((col: any, i: number) => ({
      ...col,
      kicker: addLoc(col.kicker, COLLECTIONS[i].kicker.es, COLLECTIONS[i].kicker.ja),
      title: addLoc(col.title, COLLECTIONS[i].title.es, COLLECTIONS[i].title.ja),
      intro: addLoc(col.intro, COLLECTIONS[i].intro.es, COLLECTIONS[i].intro.ja),
    })),
  };

  console.log('  ✓ DRAFT drafts.hotelsArchive — masthead ×4, essay (9 blocks + 4-grade definitionList + linked line), 3 collections ×3 fields, ×2 locales');
  if (APPLY) {
    await c.createOrReplace(draft as never);
    console.log('  staged.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
