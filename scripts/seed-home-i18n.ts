/**
 * Localize the homePage singleton to es + ja (createOrReplace, trilingual).
 * EN preserved verbatim; es/ja are AI drafts for team review. Re-resolves the
 * four starting-point tour references by EN slug. migration-staging only.
 * Dry-run by default; pass --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();
const COMMIT = process.argv.includes('--commit');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

type Tri = [string, string, string];
const S = (v: Tri) => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: v[0] },
  { _key: 'es', _type: 'internationalizedArrayStringValue', value: v[1] },
  { _key: 'ja', _type: 'internationalizedArrayStringValue', value: v[2] },
];
const T = (v: Tri) => [
  { _key: 'en', _type: 'internationalizedArrayTextValue', value: v[0] },
  { _key: 'es', _type: 'internationalizedArrayTextValue', value: v[1] },
  { _key: 'ja', _type: 'internationalizedArrayTextValue', value: v[2] },
];
let n = 0;
const key = (p: string) => `${p}${(n++).toString(36)}`;

const heroCaption: Tri = ['Western Desert, golden hour', 'Desierto Occidental, hora dorada', '西方砂漠、黄金の時間'];

const travellerCards: Array<{ t: Tri; d: Tri; h: string }> = [
  { h: '/egypt-travel-packages',
    t: ['First time in Egypt', 'Primera vez en Egipto', 'はじめてのエジプト'],
    d: ['Cairo, the Pyramids, a Nile cruise, Luxor and Aswan — the essential story, and what not to rush.',
        'El Cairo, las pirámides, un crucero por el Nilo, Luxor y Asuán: la historia esencial, y lo que no conviene apresurar.',
        'カイロ、ピラミッド、ナイル川クルーズ、ルクソール、アスワン——欠かせない物語と、急ぐべきでないこと。'] },
  { h: '/guide',
    t: ['The cultural traveller', 'El viajero cultural', '文化を旅する人へ'],
    d: ['Islamic and Coptic Cairo, Luxor, Abydos, Nubian Aswan, the desert monasteries.',
        'El Cairo islámico y copto, Luxor, Abidos, la Asuán nubia, los monasterios del desierto.',
        'イスラム・コプトのカイロ、ルクソール、アビドス、ヌビアのアスワン、砂漠の修道院。'] },
  { h: '/packages/9-day-classic-egypt-family-adventure',
    t: ['Travelling as a family', 'Viajar en familia', '家族で旅する'],
    d: ['Cairo, a Nile cruise and Red Sea rest — culture, comfort and breathing space, paced for children.',
        'El Cairo, un crucero por el Nilo y descanso en el mar Rojo: cultura, comodidad y espacio para respirar, al ritmo de los niños.',
        'カイロ、ナイル川クルーズ、紅海での休息——文化と快適さ、そしてゆとりを、子どものペースに合わせて。'] },
  { h: '/packages/10-day-nile-and-western-desert-tour',
    t: ['Desert & quiet', 'Desierto y calma', '砂漠と静けさ'],
    d: ["Bahariya, the White Desert and Fayoum — Egypt's silence as much as its temples.",
        'Bahariya, el Desierto Blanco y Fayum: tanto el silencio de Egipto como sus templos.',
        'バハレイヤ、白砂漠、ファイユーム——神殿と同じくらい、エジプトの静寂を。'] },
  { h: '/nile-cruises',
    t: ['Travelling in style', 'Viajar con estilo', '上質に旅する'],
    d: ['Private guiding, the finest boats on the Nile, landmark hotels, and every transfer handled.',
        'Guía privado, los mejores barcos del Nilo, hoteles emblemáticos y cada traslado resuelto.',
        'プライベートガイド、ナイル随一の船、名だたるホテル、そしてすべての送迎まで。'] },
  { h: '/guide',
    t: ['Coming back', 'Volver a Egipto', 'ふたたびのエジプト'],
    d: ['Middle Egypt, Alexandria, the desert oases, the specialist sites a first trip leaves out.',
        'El Egipto Medio, Alejandría, los oasis del desierto, los sitios para especialistas que un primer viaje deja fuera.',
        '中エジプト、アレクサンドリア、砂漠のオアシス、初めての旅では省かれる専門的な場所。'] },
];

const guideCards: Array<{ t: Tri; d: Tri }> = [
  { t: ['How Egypt is laid out', 'Cómo se organiza Egipto', 'エジプトの地理'],
    d: ['Cairo, the Nile Valley, the Red Sea, Sinai, the Delta and the Western Desert — and how they connect.',
        'El Cairo, el valle del Nilo, el mar Rojo, el Sinaí, el Delta y el Desierto Occidental, y cómo se conectan.',
        'カイロ、ナイル渓谷、紅海、シナイ、デルタ、西方砂漠——そしてそれぞれのつながり。'] },
  { t: ['First-trip route logic', 'La lógica de un primer viaje', '初めての旅のルート設計'],
    d: ['What belongs in a first Egypt trip, what can wait for a second, and what to give the most time.',
        'Qué pertenece a un primer viaje a Egipto, qué puede esperar a un segundo y a qué dar más tiempo.',
        '初めてのエジプトに入れるべきもの、二度目に回せるもの、最も時間をかけるべきもの。'] },
  { t: ['The cities that matter', 'Las ciudades que importan', '重要な都市'],
    d: ['Cairo, Giza, Luxor, Aswan, Alexandria, Abu Simbel and beyond — ranked honestly, not alphabetically.',
        'El Cairo, Guiza, Luxor, Asuán, Alejandría, Abu Simbel y más allá: clasificadas con honestidad, no por orden alfabético.',
        'カイロ、ギザ、ルクソール、アスワン、アレクサンドリア、アブ・シンベル、そしてその先——五十音順ではなく、正直に並べて。'] },
  { t: ['Specialist Egypt', 'El Egipto para especialistas', '専門家のエジプト'],
    d: ['The monasteries, Middle Egypt, the desert oases, Nubian culture, Islamic Cairo — for the deeper trip.',
        'Los monasterios, el Egipto Medio, los oasis del desierto, la cultura nubia, el Cairo islámico: para el viaje más profundo.',
        '修道院、中エジプト、砂漠のオアシス、ヌビア文化、イスラムのカイロ——より深い旅のために。'] },
];

const startingPoints: Array<{ slug: string; meta: Tri; t: Tri; d: Tri }> = [
  { slug: '10-days-nile-dreamer-tour-experience',
    meta: ['9–11 days', '9–11 días', '9〜11日'],
    t: ['The First Egypt Journey', 'El primer viaje a Egipto', 'はじめてのエジプトの旅'],
    d: ['Cairo, a Nile cruise, Luxor and Aswan — the essential story without rushing.',
        'El Cairo, un crucero por el Nilo, Luxor y Asuán: la historia esencial sin prisas.',
        'カイロ、ナイル川クルーズ、ルクソール、アスワン——欠かせない物語を、急がずに。'] },
  { slug: '7-days-dahabiya-nile-cruise-from-aswan-to-luxor',
    meta: ['8 days', '8 días', '8日'],
    t: ['The Slow Nile Journey', 'El viaje lento por el Nilo', 'ゆっくりのナイルの旅'],
    d: ['A dahabiya, Luxor and Aswan, the quieter river stops. Atmosphere over checklist.',
        'Una dahabiya, Luxor y Asuán, las paradas más tranquilas del río. Atmósfera antes que lista.',
        'ダハビーヤで、ルクソールとアスワン、そして静かな川辺の寄港地へ。チェックリストより、空気感を。'] },
  { slug: '10-day-nile-and-western-desert-tour',
    meta: ['7–9 days', '7–9 días', '7〜9日'],
    t: ['The Desert & Nile Journey', 'El viaje del desierto y el Nilo', '砂漠とナイルの旅'],
    d: ['Cairo, Bahariya, the White Desert, then the river. Silence as much as temples.',
        'El Cairo, Bahariya, el Desierto Blanco y luego el río. Tanto silencio como templos.',
        'カイロ、バハレイヤ、白砂漠、そして川へ。神殿と同じくらい、静けさを。'] },
  { slug: '9-day-classic-egypt-family-adventure',
    meta: ['10 days', '10 días', '10日'],
    t: ['The Family Egypt Journey', 'El viaje en familia por Egipto', '家族でめぐるエジプトの旅'],
    d: ['Cairo, a Nile cruise and Red Sea rest — culture, comfort and breathing space.',
        'El Cairo, un crucero por el Nilo y descanso en el mar Rojo: cultura, comodidad y espacio para respirar.',
        'カイロ、ナイル川クルーズ、紅海での休息——文化、快適さ、そしてゆとりを。'] },
];

async function main() {
  console.log(`seed-home-i18n — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`);
  const sp = [];
  for (const s of startingPoints) {
    const id = await client.fetch<string | null>(
      `*[_type=="tour" && slug[_key=="en"][0].value.current==$slug][0]._id`, { slug: s.slug });
    if (!id) console.warn(`  ⚠ NO MATCH ${s.slug}`); else console.log(`  ✓ ${s.t[0]} → ${s.slug}`);
    sp.push({ _key: key('sp'), _type: 'startingPoint', ...(id ? { tour: { _type: 'reference', _ref: id } } : {}), meta: S(s.meta), title: S(s.t), dek: T(s.d) });
  }
  const doc = {
    _id: 'homePage', _type: 'homePage',
    heroCaption: S(heroCaption),
    travellerCards: travellerCards.map((c) => ({ _key: key('tc'), _type: 'travellerCard', title: S(c.t), dek: T(c.d), href: c.h })),
    guideCards: guideCards.map((c) => ({ _key: key('gc'), _type: 'guideCard', title: S(c.t), dek: T(c.d), href: '/guide' })),
    startingPoints: sp,
  };
  console.log(`\nhomePage trilingual: ${doc.travellerCards.length} traveller, ${doc.guideCards.length} guide, ${doc.startingPoints.length} starts`);
  if (COMMIT) { await client.createOrReplace(doc); console.log('\n✓ written. DONE.'); }
  else console.log('\nDRY RUN — re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
