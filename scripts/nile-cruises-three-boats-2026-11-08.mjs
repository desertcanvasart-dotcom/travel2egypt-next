/**
 * Nile Cruises rebuild (2026-11-08): three kinds of boat, Lake Nasser off the
 * page. Content side only — the page code reads these fields.
 *
 *  1. nileCruisesArchive: new essay (EN per the owner spec + faithful ES/JA),
 *     type cards 4 → 3 with a power-source line and an anchor link,
 *     Collection №3 → steamer-only, ES/JA for every archive string (the page
 *     showed English on /es and /ja because the document was EN-only).
 *  2. The four Lake Nasser ships with no route set get cruiseRoute
 *     "lake-nasser" (MS Eugénie already had it), so the page can exclude by
 *     data, not by name. Their pages stay published, unchanged otherwise.
 *  3. Steam Ship Sudan: poweredBy ["steam"] (how the page knows a steamer) and
 *     the softened "one of the very few" line in EN/ES (JA never had it).
 *
 * Dry run by default; --write to apply. Backups → backups/nile3-<id>.json
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const write = process.argv.includes('--write');

const loc = (m, type = 'object') =>
  Object.entries(m).map(([lang, value]) => ({ _key: lang, _type: type, value }));
const txt = (m) => loc(m);
const block = (key, text, style = 'normal') => ({
  _key: key, _type: 'block', style, markDefs: [],
  children: [{ _key: `${key}s`, _type: 'span', marks: [], text }],
});

// ── Type cards (shared rows; term/description/note are per-language) ──
const CARDS = [
  {
    _key: 'v1', href: '#dahabiyas',
    term: { en: 'Dahabiya', es: 'Dahabiya', ja: 'ダハビーヤ' },
    note: { en: 'Wind-powered', es: 'Impulsada por el viento', ja: '風で進む' },
    description: {
      en: 'A small sailing boat with a handful of cabins, usually seven to twelve, moving under sail where the wind serves. Slow and quiet, mooring at small sites the big ships pass. The connoisseur’s Nile.',
      es: 'Un pequeño barco de vela con pocos camarotes, normalmente entre siete y doce, que navega a vela cuando el viento lo permite. Lento y silencioso, atraca en pequeños sitios que los grandes barcos pasan de largo. El Nilo del entendido.',
      ja: '客室はわずか、通常7〜12室ほどの小さな帆船。風が許すところでは帆で進みます。ゆっくりと静かに、大型船が素通りする小さな遺跡に停泊します。通のためのナイル。',
    },
  },
  {
    _key: 'v2', href: '#cruise-ships',
    term: { en: 'Cruise ship', es: 'Barco de crucero', ja: 'クルーズ船' },
    note: { en: 'Engine-powered', es: 'Impulsado por motor', ja: 'エンジンで進む' },
    description: {
      en: 'The classic five-star floating hotel — pools, full board, sun decks, and an engine that keeps to the schedule. Comfortable and efficient: the standard Luxor–Aswan run, usually three or four nights.',
      es: 'El clásico hotel flotante de cinco estrellas — piscinas, pensión completa, cubiertas para tomar el sol y un motor que cumple el horario. Cómodo y eficiente: el recorrido estándar Luxor–Asuán, normalmente de tres o cuatro noches.',
      ja: '定番の5つ星の浮かぶホテル——プール、3食付き、サンデッキ、そして予定どおりに進むエンジン。快適で効率的。ルクソール〜アスワンの標準ルートで、通常3〜4泊です。',
    },
  },
  {
    _key: 'v3', href: '#steamers',
    term: { en: 'Steamer', es: 'Vapor', ja: '蒸気船' },
    note: { en: 'Steam-powered', es: 'Impulsado por vapor', ja: '蒸気で進む' },
    description: {
      en: 'The historic paddle steamers — brass, teak and the Nile of the early 1900s. Very few still sail. For the romance of the period, not the pool deck.',
      es: 'Los históricos vapores de ruedas — latón, teca y el Nilo de principios del siglo XX. Muy pocos siguen navegando. Para el romanticismo de la época, no para la cubierta con piscina.',
      ja: '歴史ある外輪蒸気船——真鍮とチーク材、1900年代初頭のナイル。今も航行するものはごくわずかです。プールデッキではなく、その時代のロマンを求める人に。',
    },
  },
];
const cardRows = CARDS.map((r) => ({
  _key: r._key, _type: 'definition', href: r.href,
  term: loc(r.term), note: loc(r.note), description: txt(r.description),
}));

const ESSAY = {
  en: [
    'Almost every Nile cruise covers the same stretch — Luxor to Aswan, the temples of Edfu and Kom Ombo in between. What changes everything is the kind of boat you do it on. A 300-guest floating hotel, a twelve-cabin dahabiya and a century-old steamer sail the same water and produce three completely different trips. Choose the boat first; the itinerary mostly follows.',
    'The three kinds of boat',
    'This is the decision that matters. Each is driven differently — by wind, by engine, by steam — and each suits a different traveller and a different budget.',
    'When to sail, and which direction',
    'October through April is the window — comfortable temperatures, the water at its kindest. Sailing upstream (Luxor to Aswan) usually adds a night over the downstream run, because you are working against the current — and that extra night is the one worth paying for.',
    'How to use this page',
    'If you already know the boat you want, the collections below are grouped exactly that way. If you are deciding, read the three kinds above first, then filter the full index by boat at the bottom.',
  ],
  es: [
    'Casi todos los cruceros por el Nilo recorren el mismo tramo — de Luxor a Asuán, con los templos de Edfu y Kom Ombo entre medias. Lo que lo cambia todo es el tipo de barco en el que lo haces. Un hotel flotante para 300 pasajeros, una dahabiya de doce camarotes y un vapor centenario navegan las mismas aguas y producen tres viajes completamente distintos. Elige primero el barco; el itinerario casi siempre viene después.',
    'Los tres tipos de barco',
    'Esta es la decisión que importa. Cada uno se mueve de forma distinta — con el viento, con motor, con vapor — y cada uno encaja con un viajero y un presupuesto diferentes.',
    'Cuándo navegar, y en qué sentido',
    'De octubre a abril es la ventana — temperaturas agradables, el agua en su mejor momento. Navegar río arriba (de Luxor a Asuán) suele añadir una noche respecto al trayecto río abajo, porque vas contra la corriente — y esa noche extra es la que merece la pena pagar.',
    'Cómo usar esta página',
    'Si ya sabes qué barco quieres, las colecciones de abajo están agrupadas exactamente así. Si aún lo estás decidiendo, lee primero los tres tipos de arriba y luego filtra el índice completo por barco al final de la página.',
  ],
  ja: [
    'ナイル川クルーズのほとんどは同じ区間をたどります——ルクソールからアスワンまで、その間にエドフとコム・オンボの神殿。すべてを変えるのは、どんな船で行くかです。300人乗りの浮かぶホテル、12室のダハビーヤ、そして100年前の蒸気船。同じ水の上を進みながら、まったく異なる三つの旅になります。まず船を選びましょう。旅程はたいていその後についてきます。',
    '三種類の船',
    'これが肝心な選択です。それぞれ進み方が違います——風で、エンジンで、蒸気で。そして、それぞれ合う旅人も予算も異なります。',
    'いつ、どちらの向きに航行するか',
    '10月から4月がベストシーズンです——過ごしやすい気温で、川も最も穏やか。上流へ（ルクソールからアスワンへ）向かう航行は、流れに逆らうため、下流への航行より通常1泊多くなります——そしてその1泊こそ、払う価値のある1泊です。',
    'このページの使い方',
    'すでに乗りたい船が決まっているなら、下のコレクションはまさにその分類でまとめています。迷っているなら、まず上の三種類を読み、ページ下部の一覧を船の種類で絞り込んでください。',
  ],
};
const essayFor = (lang) => {
  const p = ESSAY[lang];
  return [
    block('e1', p[0]),
    block('e2', p[1], 'h3'),
    block('e3', p[2]),
    { _key: 'e4', _type: 'definitionList', items: cardRows },
    block('e5', p[3], 'h3'),
    block('e6', p[4]),
    block('e7', p[5], 'h3'),
    block('e8', p[6]),
  ];
};

const ARCHIVE_ID = 'nileCruisesArchive';
const archiveSet = {
  kicker: loc({ en: 'On the river · Edition №7', es: 'En el río · Edición №7', ja: '川の上で · 第7版' }),
  mastTitle: loc({ en: 'Nile Cruises', es: 'Cruceros por el Nilo', ja: 'ナイル川クルーズ' }),
  tagline: loc({
    en: "The river is the spine of the country. The real choice isn't the route — it's the vessel you read it from.",
    es: 'El río es la espina dorsal del país. La verdadera elección no es la ruta, sino la embarcación desde la que lo lees.',
    ja: '川はこの国の背骨です。本当の選択はルートではなく、どの船からそれを眺めるかです。',
  }),
  essayHeading: loc({ en: 'Which boat is the whole decision.', es: 'El barco lo decide todo.', ja: 'すべては、どの船を選ぶかで決まります。' }),
  essay: ['en', 'es', 'ja'].map((lang) => ({ _key: lang, _type: 'object', value: essayFor(lang) })),
  'featured.dek': loc({
    en: 'Twelve guests, under sail where the wind serves, mooring at the small temples the cruise ships skip — the river the way it travelled before the floating hotels arrived.',
    es: 'Doce pasajeros, a vela cuando el viento lo permite, atracando en los pequeños templos que los cruceros se saltan — el río tal como se viajaba antes de que llegaran los hoteles flotantes.',
    ja: '乗客は12名。風が許すところでは帆で進み、クルーズ船が素通りする小さな神殿に停泊します——浮かぶホテルが現れる前の、かつての川の旅そのままに。',
  }),
};
const NOTE = {
  en: 'Sail upstream and end in Aswan, not Luxor. You want to finish in the gentler city — the terrace at sunset and Philae — rather than back in workaday Luxor.',
  es: 'Navega río arriba y termina en Asuán, no en Luxor. Conviene acabar en la ciudad más amable — la terraza al atardecer y Philae — y no de vuelta en el Luxor del día a día.',
  ja: '上流へ向かい、ルクソールではなくアスワンで旅を終えましょう。日常の喧騒が戻るルクソールではなく、夕暮れのテラスとフィラエ神殿のある、穏やかな街で締めくくりたいものです。',
};
const COLLECTIONS = {
  c1: {
    kicker: { en: 'Collection №1', es: 'Colección №1', ja: 'コレクション №1' },
    title: { en: 'Dahabiyas — the slow way', es: 'Dahabiyas — a ritmo lento', ja: 'ダハビーヤ — ゆっくり進む旅' },
    intro: {
      en: 'Small sail vessels for travellers who want the river quiet, the sites uncrowded, and the pace set by the wind rather than a schedule.',
      es: 'Pequeñas embarcaciones de vela para viajeros que quieren el río en silencio, los sitios sin multitudes y el ritmo marcado por el viento y no por un horario.',
      ja: '静かな川、混雑のない遺跡、そして時刻表ではなく風が決めるペースを求める旅人のための、小さな帆船。',
    },
  },
  c2: {
    kicker: { en: 'Collection №2', es: 'Colección №2', ja: 'コレクション №2' },
    title: { en: 'The grand ships', es: 'Los grandes barcos', ja: '大型クルーズ船' },
    intro: {
      en: 'The five-star floating hotels — comfortable, efficient, and the most straightforward way to see the temple stretch. The classic Nile cruise.',
      es: 'Los hoteles flotantes de cinco estrellas — cómodos, eficientes y la forma más sencilla de recorrer el tramo de los templos. El crucero clásico por el Nilo.',
      ja: '5つ星の浮かぶホテル——快適で効率的、神殿の続く区間を最も手軽にめぐる方法。定番のナイル川クルーズです。',
    },
  },
  c3: {
    kicker: { en: 'Collection №3', es: 'Colección №3', ja: 'コレクション №3' },
    title: { en: 'The steamer — the Nile of 1900', es: 'El vapor — el Nilo de 1900', ja: '蒸気船 — 1900年のナイル' },
    intro: {
      en: 'For travellers who want the river as it was first cruised: a period paddle steamer, brass and teak, a few dozen guests, and the slower rhythm of another century.',
      es: 'Para viajeros que quieren el río tal como se navegó en sus primeros cruceros: un vapor de ruedas de época, latón y teca, unas pocas decenas de pasajeros y el ritmo más pausado de otro siglo.',
      ja: '最初にクルーズが行われた頃の川を求める旅人に。時代物の外輪蒸気船、真鍮とチーク材、乗客は数十名ほど、そして別の世紀のゆったりとしたリズム。',
    },
  },
};
const KASR_IBRIM = 'wp-page-64216';

const LAKE_NASSER_UNSET = ['wp-page-64216', 'wp-page-64228', 'wp-page-64259', 'wp-page-64441'];
const SUDAN = 'nileCruise.steam-ship-sudan-nile-cruise';
const SUDAN_OLD = {
  en: 'The only authentic period steamer still sailing the Nile.',
  es: 'El único vapor de época auténtico que sigue navegando el Nilo.',
};
const SUDAN_NEW = {
  en: 'One of the very few period steamers still sailing the Nile.',
  es: 'Uno de los muy pocos vapores de época que siguen navegando el Nilo.',
};

// ── Build ──
const archive = await c.getDocument(ARCHIVE_ID);
if (!archive) throw new Error('archive missing');
const collections = archive.collections.map((col) => {
  const t = COLLECTIONS[col._key];
  if (!t) throw new Error(`unknown collection ${col._key}`);
  const out = { ...col, kicker: loc(t.kicker), title: loc(t.title), intro: loc(t.intro) };
  if (col._key === 'c3') out.cruises = col.cruises.filter((r) => r._ref !== KASR_IBRIM);
  return out;
});
const featuredBody = ['en', 'es', 'ja'].map((lang) => ({
  _key: lang, _type: 'object',
  value: [{ _key: 'fn', _type: 'conciergeNote', body: [block('fnb', NOTE[lang])] }],
}));

const sudan = await c.getDocument(SUDAN);
const sudanSummary = sudan.summary.map((s) => {
  if (!SUDAN_OLD[s._key]) return s;
  if (!s.value.includes(SUDAN_OLD[s._key])) throw new Error(`Sudan ${s._key} sentence not found`);
  return { ...s, value: s.value.replace(SUDAN_OLD[s._key], SUDAN_NEW[s._key]) };
});

const lnDocs = await c.fetch(`*[_id in $ids]{_id, "name": name[_key=="en"][0].value, cruiseRoute}`, { ids: LAKE_NASSER_UNSET });
console.log('archive: essay en/es/ja, 3 type cards, collections', collections.map((x) => `${x._key}:${x.cruises.length}`).join(' '));
console.log('lake nasser route →', lnDocs.map((d) => `${d.name} (${d.cruiseRoute ?? 'unset'})`).join('; '));
console.log('sudan summary', sudanSummary.map((s) => `${s._key}: …${s.value.slice(-70)}`).join('\n  '));

if (!write) {
  console.log('dry run — pass --write');
  process.exit(0);
}
fs.mkdirSync('backups', { recursive: true });
fs.writeFileSync(`backups/nile3-${ARCHIVE_ID}.json`, JSON.stringify(archive, null, 2));
fs.writeFileSync(`backups/nile3-${SUDAN}.json`, JSON.stringify(sudan, null, 2));
for (const id of LAKE_NASSER_UNSET) fs.writeFileSync(`backups/nile3-${id}.json`, JSON.stringify(await c.getDocument(id), null, 2));

const tx = c.transaction();
tx.patch(ARCHIVE_ID, (p) => p.set({ ...archiveSet, 'featured.body': featuredBody, collections }));
tx.patch(SUDAN, (p) => p.set({ poweredBy: ['steam'], summary: sudanSummary }));
for (const id of LAKE_NASSER_UNSET) tx.patch(id, (p) => p.set({ cruiseRoute: 'lake-nasser' }));
await tx.commit();
console.log('written');
