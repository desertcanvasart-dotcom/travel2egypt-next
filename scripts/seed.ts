/**
 * Seed script — populates the Sanity dataset with enough fixture content
 * for the city guide demo page (/guide/cairo) to render end-to-end.
 *
 * Run: npm run seed
 *
 * Requires SANITY_API_WRITE_TOKEN in .env (create one at
 * https://manage.sanity.io → API → Tokens, with Editor role).
 *
 * The script is idempotent — running it twice produces the same documents
 * (deterministic _id values), so it's safe to re-run during development.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
  process.exit(1);
}
if (!token) {
  console.error(
    'Missing SANITY_API_WRITE_TOKEN. Create one at https://manage.sanity.io with Editor role.'
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

// ── Image upload helper ───────────────────────────────────
// Each hero image is sourced from the Wikipedia article whose lead photo
// is editorially curated to depict that specific subject. We pin to a
// specific commons file path (resolved via the MediaWiki API) so we get a
// stable, content-correct image — generic stock libraries are unsafe here
// because their tagging is not reliable enough for an Egyptian operator
// site (a Dubai hotel on a Saqqara card destroys brand credibility).
//
// Production should replace these with the operator's own photography;
// `credit` carries the source so attribution is recoverable.

const assetCache = new Map<string, string>();

async function uploadImage(url: string, filename: string): Promise<string | null> {
  const cached = assetCache.get(url);
  if (cached) return cached;
  try {
    const res = await fetch(url, {
      headers: {
        // upload.wikimedia.org blocks UA-less requests
        'User-Agent': 'Travel2Egypt-seed/1.0 (https://travel2egypt.org)',
      },
    });
    if (!res.ok) {
      console.warn(`  ⚠ skipping image ${filename}: HTTP ${res.status}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload('image', buffer, {
      filename,
      contentType: res.headers.get('content-type') ?? 'image/jpeg',
    });
    assetCache.set(url, asset._id);
    return asset._id;
  } catch (err) {
    console.warn(`  ⚠ skipping image ${filename}: ${(err as Error).message}`);
    return null;
  }
}

const heroImage = (
  assetId: string | null,
  alt: { en: string; es?: string; ja?: string },
  credit?: string
) => {
  if (!assetId) return undefined;
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: assetId },
    alt: i18nString(alt.en, alt.es, alt.ja),
    ...(credit ? { credit } : {}),
  };
};

// Resolved Wikimedia Commons URLs (each one is the lead image of the
// linked Wikipedia article — verified Egyptian content).
const COMMONS = {
  cairo:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg/1920px-Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg',
  luxor:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Templo_de_Luxor%2C_Luxor%2C_Egipto%2C_2022-04-01%2C_DD_01.jpg/1920px-Templo_de_Luxor%2C_Luxor%2C_Egipto%2C_2022-04-01%2C_DD_01.jpg',
  aswan:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Panoramic_view_of_Aswan%2C_Egypt.jpg/1920px-Panoramic_view_of_Aswan%2C_Egypt.jpg',
  giza:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Pyramids_of_the_Giza_Necropolis.jpg/1920px-Pyramids_of_the_Giza_Necropolis.jpg',
  saqqara:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Saqqara_pyramid_ver_2.jpg/1920px-Saqqara_pyramid_ver_2.jpg',
  khanElKhalili:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/%D8%AE%D8%A7%D9%86_%D8%A7%D9%84%D8%AE%D9%84%D9%8A%D9%84%D9%8A_1.jpg/1920px-%D8%AE%D8%A7%D9%86_%D8%A7%D9%84%D8%AE%D9%84%D9%8A%D9%84%D9%8A_1.jpg',
  hatshepsut:
    'https://upload.wikimedia.org/wikipedia/commons/4/4c/Tempel_der_Hatschepsut_%28Deir_el-Bahari%29.jpg',
  felucca:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Felucca_R02.jpg/1920px-Felucca_R02.jpg',
  sphinx:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sphinx_with_the_third_pyramid.jpg/1920px-Sphinx_with_the_third_pyramid.jpg',
  cairoAirport:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Cairo_Airport_Terminal_3.jpg/1920px-Cairo_Airport_Terminal_3.jpg',
  koshary:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Egyptian_food_Koshary.jpg/1920px-Egyptian_food_Koshary.jpg',
  aswanNile:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Aswan_Nile_R02.jpg/1920px-Aswan_Nile_R02.jpg',
  // ── Wiki ──
  dynastyEighteenth:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Respaldo_del_trono_de_oro_de_Tutankam%C3%B3n.jpg/1920px-Respaldo_del_trono_de_oro_de_Tutankam%C3%B3n.jpg',
  dynastyOldKhafre:
    'https://upload.wikimedia.org/wikipedia/commons/d/d5/Khafre_statue.jpg',
  dynastyPtolemaic:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Temple_Edfou_Egypte.jpg/1920px-Temple_Edfou_Egypte.jpg',
  personHatshepsut:
    'https://upload.wikimedia.org/wikipedia/commons/7/7b/Seated_Statue_of_Hatshepsut_MET_Hatshepsut2012.jpg',
  personRamses:
    'https://upload.wikimedia.org/wikipedia/commons/c/cf/Ramses_II_British_Museum.jpg',
  personCleopatra:
    'https://upload.wikimedia.org/wikipedia/commons/3/3e/Kleopatra-VII.-Altes-Museum-Berlin1.jpg',
  monumentGreatPyramid:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg/1920px-Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg',
  // monumentKarnak: no verified Wikipedia article-lead available — placeholder.
  // monumentTempleHatshepsut: reuses COMMONS.hatshepsut (Deir el-Bahari) above.
  deityHorus:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Horus_standing.svg/1920px-Horus_standing.svg.png',
  deityAnubis:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Anubis_standing.svg/1920px-Anubis_standing.svg.png',
  // deityIsis: no verified article-lead — placeholder.
};

// ── Localized field helpers ───────────────────────────────
const i18nString = (en: string, es?: string, ja?: string) =>
  [
    { _key: 'en', value: en },
    es ? { _key: 'es', value: es } : null,
    ja ? { _key: 'ja', value: ja } : null,
  ].filter(Boolean) as Array<{ _key: string; value: string }>;

const i18nSlug = (en: string, es?: string, ja?: string) =>
  [
    { _key: 'en', value: { _type: 'slug', current: en } },
    es ? { _key: 'es', value: { _type: 'slug', current: es } } : null,
    ja ? { _key: 'ja', value: { _type: 'slug', current: ja } } : null,
  ].filter(Boolean) as Array<{
    _key: string;
    value: { _type: string; current: string };
  }>;

const i18nPortable = (
  en: any[],
  es?: any[],
  ja?: any[]
) =>
  [
    { _key: 'en', value: en },
    es ? { _key: 'es', value: es } : null,
    ja ? { _key: 'ja', value: ja } : null,
  ].filter(Boolean) as Array<{ _key: string; value: any[] }>;

// Helper to build a portable text block
const block = (text: string, style: string = 'normal') => ({
  _type: 'block',
  _key: Math.random().toString(36).slice(2, 10),
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: Math.random().toString(36).slice(2, 10), text, marks: [] }],
});

const operatorNote = (
  tone: 'honest' | 'caution' | 'insider' | 'context',
  text: string
) => ({
  _type: 'operatorNote',
  _key: Math.random().toString(36).slice(2, 10),
  tone,
  body: [block(text)],
});

// ── Fixture documents ───────────────────────────────

async function seed() {
  console.log(`Seeding dataset "${dataset}" on project "${projectId}"...`);

  // ── Upload hero images first; reference the asset IDs below ──
  // familyPkg is intentionally not assigned an image — leave as cream
  // placeholder rather than ship a wrong one. Replace with the operator's
  // own photography before launch.
  console.log('  · uploading images...');
  const img = {
    cairo: await uploadImage(COMMONS.cairo, 'cairo-hero.jpg'),
    luxor: await uploadImage(COMMONS.luxor, 'luxor-hero.jpg'),
    aswan: await uploadImage(COMMONS.aswan, 'aswan-hero.jpg'),
    pyramidsTour: await uploadImage(COMMONS.giza, 'giza-pyramids.jpg'),
    saqqaraTour: await uploadImage(COMMONS.saqqara, 'saqqara-step-pyramid.jpg'),
    oldCairoTour: await uploadImage(COMMONS.khanElKhalili, 'khan-el-khalili.jpg'),
    luxorWestTour: await uploadImage(COMMONS.hatshepsut, 'hatshepsut-temple.jpg'),
    classicPkg: await uploadImage(COMMONS.felucca, 'felucca-nile.jpg'),
    inDepthPkg: await uploadImage(COMMONS.sphinx, 'sphinx-with-pyramid.jpg'),
    cairoTransport: await uploadImage(COMMONS.cairoAirport, 'cairo-airport.jpg'),
    cairoFood: await uploadImage(COMMONS.koshary, 'koshary.jpg'),
    familyPkg: await uploadImage(COMMONS.aswanNile, 'aswan-nile.jpg'),
    // Wiki
    dyn18th: await uploadImage(COMMONS.dynastyEighteenth, 'tutankhamun-throne.jpg'),
    dynOld: await uploadImage(COMMONS.dynastyOldKhafre, 'khafre-statue.jpg'),
    dynPtolemaic: await uploadImage(COMMONS.dynastyPtolemaic, 'edfu-temple.jpg'),
    pHatshepsut: await uploadImage(COMMONS.personHatshepsut, 'hatshepsut-met.jpg'),
    pRamses: await uploadImage(COMMONS.personRamses, 'ramses-bm.jpg'),
    pCleopatra: await uploadImage(COMMONS.personCleopatra, 'cleopatra-altes.jpg'),
    monGreatPyramid: await uploadImage(COMMONS.monumentGreatPyramid, 'great-pyramid.jpg'),
    monTempleHatshepsut: await uploadImage(COMMONS.hatshepsut, 'deir-el-bahari.jpg'),
    deityHorus: await uploadImage(COMMONS.deityHorus, 'horus.png'),
    deityAnubis: await uploadImage(COMMONS.deityAnubis, 'anubis.png'),
  };
  const uploadedCount = Object.values(img).filter(Boolean).length;
  console.log(`  ✓ ${uploadedCount}/${Object.keys(img).length} images uploaded`);

  // ── Cairo ─────────────────────────────
  const cairo = await client.createOrReplace({
    _id: 'city-cairo',
    _type: 'city',
    name: i18nString('Cairo', 'El Cairo', 'カイロ'),
    slug: i18nSlug('cairo', 'el-cairo', 'cairo'),
    region: 'lower-egypt',
    orderRank: 10,
    coordinates: { _type: 'coordinates', lat: 30.0444, lng: 31.2357 },
    summary: [
      {
        _key: 'en',
        value:
          "A 22-million-person city built on a 5,000-year foundation. Difficult, dense, electric, and the only place in Egypt where the past genuinely brushes against the present in the same hour.",
      },
      {
        _key: 'es',
        value:
          'Una ciudad de 22 millones de personas construida sobre una base de 5.000 años. Difícil, densa, eléctrica, y el único lugar en Egipto donde el pasado realmente roza el presente en una misma hora.',
      },
      {
        _key: 'ja',
        value:
          '5,000年の基盤の上に築かれた人口2,200万の都市。手強く、密で、電撃的で、エジプトで過去と現在が同じ時間帯に本当に触れ合う唯一の場所。',
      },
    ],
    overview: i18nPortable([
      block('Cairo is not a city you understand quickly. The first day is overwhelming for almost everyone — traffic that operates on different rules than yours, a population density that compresses time, a noise floor that never quite settles. Most travelers leave the first day a little stunned. By the third day, something shifts.', 'h2'),
      block(
        'What shifts is calibration. The traffic still works the way it works; you just stop expecting it to work otherwise. The call to prayer that woke you at 4am the first morning becomes structural. The coffee at the corner of your hotel block becomes the best coffee you have anywhere in Egypt because the man making it has been making it the same way for thirty years.'
      ),
      operatorNote(
        'honest',
        "We tell every first-time visitor: budget at least three full days for Cairo. Two days is too short — you spend day one disoriented and day two starting to find your feet, then leave. Three days is the threshold where the city stops happening to you and you start choosing your relationship with it."
      ),
      block('What to actually see', 'h3'),
      block(
        "The Pyramids and Sphinx are non-negotiable but the experience has changed since the Grand Egyptian Museum opened on the Giza Plateau. The pyramids no longer stand alone in the visit — the GEM is now where the depth of context lives, and we recommend two separate half-days rather than trying to compress them. Old Cairo (Coptic Cairo, Khan el-Khalili, Islamic Cairo) is its own day and benefits enormously from a guide who can connect what you're seeing across centuries rather than treating each monument as a discrete photo stop."
      ),
      operatorNote(
        'insider',
        "If you have a fourth day, take it for the Egyptian Museum (the original one in Tahrir, not the GEM) — it's emptier now that most marquee items moved to Giza, and that emptiness is its gift. You can stand alone with objects that used to require fighting through crowds."
      ),
      block(
        "Skip Saqqara only if you must — it's the most underrated major site in greater Cairo, and the Step Pyramid context shifts how you read everything else."
      ),
      block('Where to base yourself', 'h3'),
      block(
        "Zamalek (the island in the Nile) is our default recommendation for first-time visitors who want quiet at the end of the day. Downtown is more atmospheric but louder. Giza puts you next to the pyramids but isolates you from everything else worth doing. We rarely recommend Heliopolis or New Cairo unless you have specific business there — they're long drives from the historic city and lose the texture that makes Cairo Cairo."
      ),
    ]),
    keyFacts: {
      bestSeason: i18nString(
        'October–April. May–September is hot but bearable with a Nile-facing hotel.',
        'Octubre–abril. Mayo–septiembre es caluroso pero llevadero con hotel frente al Nilo.',
        '10月〜4月。5月〜9月は暑いがナイル川沿いのホテルなら過ごしやすい。'
      ),
      gettingThere: i18nString(
        "International airport (CAI) connects to most major hubs. Driver pickup is straightforward; we don't recommend Cairo taxis for first arrivals.",
        'El aeropuerto internacional (CAI) conecta con la mayoría de los hubs principales. La recogida con chófer es sencilla; no recomendamos los taxis de El Cairo en la primera llegada.',
        '国際空港（CAI）は主要ハブと接続。運転手付き送迎が無難で、初到着時のカイロタクシーはお勧めしません。'
      ),
      daysNeeded: i18nString(
        'Three full days minimum. Four if you include the Egyptian Museum at Tahrir.',
        'Tres días completos como mínimo. Cuatro si incluyes el Museo Egipcio de Tahrir.',
        '最低3日間。タハリールのエジプト博物館を含むなら4日間。'
      ),
    },
    heroImage: heroImage(
      img.cairo,
      {
        en: 'Cairo Opera House and Al Hurriyah Park, with the Nile beyond',
        es: 'Ópera de El Cairo y Parque Al Hurriyah, con el Nilo al fondo',
        ja: 'カイロ・オペラハウスとアル・フッリーヤ公園、奥にナイル川',
      },
      'Wikimedia Commons — Cairo article lead photo'
    ),
    seo: {
      _type: 'seo',
      metaTitle: i18nString(
        'Cairo Travel Guide — Travel2Egypt',
        'Guía de viaje a El Cairo — Travel2Egypt',
        'カイロ旅行ガイド — Travel2Egypt'
      ),
      metaDescription: i18nString(
        'An honest, operator-grade guide to Cairo for first-time visitors. What to see, where to stay, what to skip, and how to actually enjoy the city.'
      ),
    },
  });

  console.log('  ✓ Cairo');

  // ── Sub-articles under Cairo ─────────────────────────────
  await client.createOrReplace({
    _id: 'guide-cairo-transport',
    _type: 'guideArticle',
    parentCity: { _type: 'reference', _ref: cairo._id },
    title: i18nString(
      'Getting around Cairo',
      'Cómo moverse por El Cairo',
      'カイロの移動手段'
    ),
    slug: i18nSlug('transport', 'transporte', 'transport'),
    orderRank: 10,
    summary: [
      {
        _key: 'en',
        value: 'Why we use private drivers, when Uber works, and the metro you should ride at least once.',
      },
      {
        _key: 'es',
        value: 'Por qué usamos chóferes privados, cuándo funciona Uber y el metro que deberías tomar al menos una vez.',
      },
      {
        _key: 'ja',
        value: '私たちが専属ドライバーを使う理由、Uberが機能する場面、一度は乗るべき地下鉄について。',
      },
    ],
    body: i18nPortable([
      block(
        "Cairo traffic is the first thing that humbles every visitor. Distances that look short on Google Maps take 45 minutes. Distances that look long take the same 45 minutes — the city operates on a kind of permanent congestion that flattens travel time across distances. We plan accordingly."
      ),
      operatorNote(
        'honest',
        "We use private drivers for almost every client. Not because it's expensive (it's not, by international standards), but because the cognitive overhead of navigating Cairo traffic via taxi or app is real and it depletes the energy you actually came here to spend on the city."
      ),
    ]),
    heroImage: heroImage(
      img.cairoTransport,
      {
        en: 'Cairo International Airport, Terminal 3',
        es: 'Aeropuerto Internacional de El Cairo, Terminal 3',
        ja: 'カイロ国際空港 第3ターミナル',
      },
      'Wikimedia Commons — Cairo International Airport article'
    ),
  });

  await client.createOrReplace({
    _id: 'guide-cairo-food',
    _type: 'guideArticle',
    parentCity: { _type: 'reference', _ref: cairo._id },
    title: i18nString(
      'Eating in Cairo',
      'Comer en El Cairo',
      'カイロで食べる'
    ),
    slug: i18nSlug('food', 'comida', 'food'),
    orderRank: 20,
    summary: [
      {
        _key: 'en',
        value: 'Where the locals actually eat, what to skip, and how to handle dietary restrictions in a city that makes most cuisines disappear at sundown.',
      },
      {
        _key: 'es',
        value: 'Dónde comen realmente los locales, qué evitar y cómo gestionar restricciones alimentarias en una ciudad donde la mayoría de cocinas desaparecen al anochecer.',
      },
      {
        _key: 'ja',
        value: '地元の人が実際に食べる場所、避けるべきもの、日没後に多くの料理が姿を消す街での食事制限の対処法。',
      },
    ],
    body: i18nPortable([
      block('Cairo eats late. A 7pm dinner reservation marks you as a foreigner; locals start arriving at 9 and the kitchen is busiest at 11.'),
    ]),
    heroImage: heroImage(
      img.cairoFood,
      {
        en: 'A bowl of koshary — the Egyptian street-food staple',
        es: 'Un plato de koshary — el plato callejero clásico de Egipto',
        ja: 'コシャリ — エジプトの定番ストリートフード',
      },
      'Wikimedia Commons — Koshary article'
    ),
  });

  console.log('  ✓ 2 sub-articles');

  // ── Theme ─────────────────────────────
  const inDepthTheme = await client.createOrReplace({
    _id: 'theme-egypt-in-depth',
    _type: 'theme',
    name: i18nString('Egypt In Depth', 'Egipto en profundidad', 'エジプト深掘り'),
    slug: i18nSlug('egypt-in-depth', 'egipto-en-profundidad', 'egypt-in-depth'),
    orderRank: 10,
    description: [
      {
        _key: 'en',
        value: 'Multi-week packages for travelers who want Egypt at depth — Cairo, Luxor, Aswan, Abu Simbel, the Western Desert, and the Sinai, with pacing that lets each place register.',
      },
    ],
  });

  console.log('  ✓ Egypt In Depth theme');

  // ── A day tour and a package, both in Cairo ─────────────────────────────
  await client.createOrReplace({
    _id: 'tour-pyramids-private-day',
    _type: 'tour',
    type: 'dayTour',
    dayTourMode: 'private',
    cities: [{ _type: 'reference', _ref: cairo._id, _key: 'cairo' }],
    durationDays: 1,
    durationLabel: i18nString('Full day, ~9 hours', 'Día completo, ~9 horas', '1日（約9時間）'),
    title: i18nString(
      'Private Pyramids & Sphinx Day Tour',
      'Tour privado de las Pirámides y la Esfinge',
      'プライベート・ピラミッドとスフィンクス日帰りツアー'
    ),
    slug: i18nSlug(
      'private-pyramids-sphinx-day-tour',
      'tour-privado-piramides-esfinge',
      'private-pyramids-sphinx-day-tour'
    ),
    summary: [
      {
        _key: 'en',
        value: "A full-day private tour of the Giza Plateau and the Grand Egyptian Museum, paced for context rather than checklist photography.",
      },
      {
        _key: 'es',
        value: 'Un tour privado de día completo por la Meseta de Giza y el Gran Museo Egipcio, con un ritmo pensado para el contexto, no para la fotografía de lista.',
      },
      {
        _key: 'ja',
        value: 'ギザ高原と大エジプト博物館を巡る終日プライベートツアー。チェックリスト的撮影ではなく、文脈を重視したペース配分。',
      },
    ],
    priceIndication: i18nString(
      'from €120 per person for two travelers, including private vehicle, Egyptologist guide, and museum entries',
      'desde 120 € por persona para dos viajeros, incluyendo vehículo privado, guía egiptólogo y entradas al museo',
      '2名様の場合、お一人様120ユーロから。専用車・エジプト学者ガイド・博物館入場料込み'
    ),
    heroImage: heroImage(
      img.pyramidsTour,
      {
        en: 'The Pyramids of the Giza Necropolis',
        es: 'Las pirámides de la necrópolis de Giza',
        ja: 'ギザのピラミッド',
      },
      'Wikimedia Commons — Giza pyramid complex article lead photo'
    ),
  });

  await client.createOrReplace({
    _id: 'tour-egypt-in-depth-14',
    _type: 'tour',
    type: 'package',
    theme: { _type: 'reference', _ref: inDepthTheme._id },
    cities: [
      { _type: 'reference', _ref: cairo._id, _key: 'cairo' },
    ],
    durationDays: 14,
    durationLabel: i18nString('14 days / 13 nights', '14 días / 13 noches', '14日間 / 13泊'),
    title: i18nString(
      'Egypt In Depth — 14 Days',
      'Egipto en profundidad — 14 días',
      'エジプト深掘り14日間'
    ),
    slug: i18nSlug(
      'egypt-in-depth-14-days',
      'egipto-en-profundidad-14-dias',
      'egypt-in-depth-14-days'
    ),
    summary: [
      {
        _key: 'en',
        value: 'Cairo, Luxor, Aswan, Abu Simbel, and a Nile cruise — paced over 14 days so each place registers rather than blurring into the next.',
      },
      {
        _key: 'es',
        value: 'El Cairo, Luxor, Asuán, Abu Simbel y un crucero por el Nilo, repartidos en 14 días para que cada lugar se asiente en lugar de difuminarse en el siguiente.',
      },
      {
        _key: 'ja',
        value: 'カイロ、ルクソール、アスワン、アブ・シンベル、ナイル川クルーズを14日間で。各地が次の場所に流されず、しっかり残るペース配分。',
      },
    ],
    priceIndication: i18nString(
      'from €3,200 per person for two travelers, depending on hotel tier and cruise vessel',
      'desde 3.200 € por persona para dos viajeros, según categoría del hotel y embarcación del crucero',
      '2名様の場合、お一人様3,200ユーロから。ホテルランクとクルーズ船による'
    ),
    heroImage: heroImage(
      img.inDepthPkg,
      {
        en: 'The Great Sphinx of Giza, with the pyramid of Menkaure beyond',
        es: 'La Gran Esfinge de Giza, con la pirámide de Micerino al fondo',
        ja: 'ギザの大スフィンクスと、奥に見えるメンカウラー王のピラミッド',
      },
      'Wikimedia Commons — Great Sphinx of Giza article lead photo'
    ),
    body: i18nPortable([
      block(
        "Fourteen days is the threshold where Egypt stops being a checklist and starts being a country. The classic seven-to-eight day Egypt itinerary works — Cairo, a four-night Nile cruise, Abu Simbel — but it leaves you having tasted everything and absorbed almost nothing. The fourteen-day version doesn't just add days. It adds the second visit, the unhurried morning, the empty temple at the time of day everyone else has left."
      ),
      operatorNote(
        'context',
        "Fourteen days lets us put two days in Aswan instead of half a day, build in the Western Desert oases or extra time at the Egyptian Museum, and pace the cruise so the temple visits happen at the right time of day rather than when the boat schedule says. This is the itinerary we recommend most often for travelers who can spare the time."
      ),
      block(
        "We tier this against your travel style. Slower pacing with afternoon downtime is the default. Higher-energy travelers can swap the rest blocks for additional sites — the Saqqara/Dahshur day, the Egyptian Museum's reserve collection, or a desert excursion to Bahariya. The architecture of the trip is the same; the density adjusts."
      ),
    ]),
    highlights: [
      {
        _key: 'en',
        value: [
          'Three full days in Cairo — Pyramids, GEM, Old Cairo, Saqqara',
          'Five-night Nile cruise (Luxor to Aswan), paced for early-morning visits',
          'Two days in Aswan, including Philae and the Nubian villages',
          'Abu Simbel via early flight — back at the temples before tour buses arrive',
          'A return Cairo evening for the Egyptian Museum at Tahrir',
          "Egyptologist guide assigned to your party for the full 14 days",
        ],
      },
      {
        _key: 'es',
        value: [
          'Tres días completos en El Cairo: Pirámides, GEM, El Cairo antiguo, Saqqara',
          'Crucero por el Nilo de cinco noches (Luxor–Asuán), con ritmo para visitas matutinas',
          'Dos días en Asuán, incluyendo Philae y los pueblos nubios',
          'Abu Simbel en vuelo madrugador — antes de la llegada de los autobuses',
          'Tarde de regreso en El Cairo para el Museo Egipcio de Tahrir',
          'Guía egiptólogo asignado a su grupo durante los 14 días',
        ],
      },
      {
        _key: 'ja',
        value: [
          'カイロで3日間 — ピラミッド、GEM、オールド・カイロ、サッカラ',
          'ナイル川クルーズ5泊（ルクソール〜アスワン）、朝の訪問に合わせたペース',
          'アスワン2日間、フィラエ神殿とヌビア村を含む',
          'アブ・シンベルへ早朝フライト — 観光バス到着前に到着',
          'カイロに戻った夜、タハリールのエジプト博物館へ',
          '14日間専属のエジプト学者ガイド',
        ],
      },
    ],
    inclusions: i18nPortable([
      block('All in-country flights (Cairo–Luxor, Aswan–Abu Simbel–Cairo)'),
      block('13 nights accommodation: 4-star to 5-star, your choice of tier'),
      block('5-night Nile cruise — vessel chosen with you based on style and date'),
      block('Egyptologist guide for the full duration, plus driver and air-conditioned vehicle'),
      block('All site entries, museum tickets, and special-access where available'),
      block('Breakfast daily, all meals during the cruise'),
      block('Airport pickup and drop-off, all internal transfers'),
    ]),
    exclusions: i18nPortable([
      block('International flights to/from Egypt'),
      block('Egypt visa (we send the e-visa link with your booking confirmation)'),
      block('Lunch and dinner in Cairo and Aswan (we recommend specific places)'),
      block('Personal expenses, gratuities, and travel insurance'),
      block('Optional balloon ride over Luxor (~€80, easy to add)'),
    ]),
    itinerary: i18nPortable([
      block('Day 1 — Arrival in Cairo', 'h3'),
      block(
        "We meet you at Cairo airport, transfer to your hotel in Zamalek or Garden City, and leave the rest of the day for recovery. A short orientation walk along the Nile in the late afternoon if you want it, or stay in. Most international flights leave you tired enough that the schedule shouldn't try harder than this."
      ),
      block('Day 2 — The Pyramids and the Grand Egyptian Museum', 'h3'),
      block(
        "Early start at the Giza plateau — Khufu, Khafre, Menkaure, the Sphinx, with time to walk around them rather than just photograph. After lunch we cross to the Grand Egyptian Museum for the afternoon. The GEM houses Tutankhamun's full collection in dedicated galleries plus the Khufu solar boats — at least three hours, easily four if you're absorbing."
      ),
      block('Day 3 — Saqqara, Dahshur, and Memphis', 'h3'),
      block(
        "The pyramids before the pyramids. Step Pyramid at Saqqara, Bent Pyramid and Red Pyramid at Dahshur (interior access at the Red), and the Memphis open-air museum. Quieter than Giza; better architectural context."
      ),
      block('Day 4 — Old Cairo, then fly to Luxor', 'h3'),
      block(
        "Coptic Cairo and the Hanging Church in the morning, Khan el-Khalili and Islamic Cairo in the afternoon. Late-afternoon flight to Luxor; check in to the cruise vessel for your first night onboard. Welcome dinner."
      ),
      block('Day 5 — Karnak and Luxor Temple', 'h3'),
      block(
        "Karnak in the morning before the heat; the scale of the hypostyle hall is the kind of thing that doesn't translate to photographs. Afternoon at Luxor Temple, then back to the boat. Optional Luxor Temple by night for the lighting."
      ),
      block('Day 6 — Luxor west bank', 'h3'),
      block(
        "Valley of the Kings (three tombs, chosen based on what's open and least crowded), Hatshepsut at Deir el-Bahari, Colossi of Memnon. Optional balloon ride at sunrise — we'll have asked about it during planning."
      ),
      block('Day 7 — Edfu and Kom Ombo', 'h3'),
      block(
        "The cruise sails between sites. Edfu (Horus temple, the best-preserved temple in Egypt) in the morning; Kom Ombo (the dual temple to Sobek and Horus) in the late afternoon. Time on deck between."
      ),
      block('Day 8 — Aswan, Philae, and the Nubian villages', 'h3'),
      block(
        "Disembark in Aswan. Philae temple (relocated stone-by-stone after the High Dam was built) by motorboat. Afternoon felucca to a Nubian village for tea and an unhurried walk. Two-night Aswan stay begins."
      ),
      block('Day 9 — Abu Simbel', 'h3'),
      block(
        "Early flight to Abu Simbel. We aim to be at the temples by 8am, well before the tour buses from Aswan arrive. Two to three hours on site — both the Great Temple and the smaller temple of Hathor for Nefertari. Back to Aswan by lunch."
      ),
      block('Day 10 — Aswan rest day, optional sites', 'h3'),
      block(
        "An unscheduled day. The High Dam, the Unfinished Obelisk, or the Nubian Museum if you want them. Otherwise, the Old Cataract terrace for tea and a slow afternoon. Egypt's southern light deserves an unscheduled day."
      ),
      block('Day 11 — Fly to Cairo, the Egyptian Museum', 'h3'),
      block(
        "Morning flight back to Cairo. Afternoon at the Egyptian Museum at Tahrir. Most marquee items have moved to the GEM; the Tahrir museum is now quieter and more atmospheric. The reserve collection downstairs and the Royal Mummies hall are the focus."
      ),
      block('Day 12 — Cairo at your pace', 'h3'),
      block(
        "Open day. Cairo's depth rewards return visits to places you saw briefly the first time. The Coptic Museum, the Citadel, Mohammed Ali mosque, or just an afternoon in Khan el-Khalili looking rather than photographing."
      ),
      block('Day 13 — Sinai or desert option (or rest)', 'h3'),
      block(
        "If you have the energy, a fly-in/fly-out day to St. Catherine's monastery in Sinai. Or a desert excursion to Bahariya. Or a final rest day in Cairo. The decision is made closer to the date based on energy."
      ),
      block('Day 14 — Departure', 'h3'),
      block(
        "Late-morning checkout, transfer to Cairo airport. Most international flights to Europe and Asia leave in the afternoon or evening, which means you can have a slow morning rather than rush."
      ),
    ]),
    relatedTours: [
      { _type: 'reference', _ref: 'tour-classic-egypt-8', _key: 'classic' },
      { _type: 'reference', _ref: 'tour-family-egypt-10', _key: 'family' },
    ],
    relatedGuides: [
      { _type: 'cityRef', _ref: cairo._id, _key: 'cairo-guide' },
    ],
  });

  console.log('  ✓ 2 tours (1 day tour, 1 package)');

  // ── Additional cities used by extra tours ─────────────────
  const luxor = await client.createOrReplace({
    _id: 'city-luxor',
    _type: 'city',
    name: i18nString('Luxor', 'Luxor', 'ルクソール'),
    slug: i18nSlug('luxor', 'luxor', 'luxor'),
    region: 'upper-egypt',
    orderRank: 20,
    coordinates: { _type: 'coordinates', lat: 25.6872, lng: 32.6396 },
    summary: [
      { _key: 'en', value: 'The open-air museum of the New Kingdom — Karnak, Luxor Temple, the Valley of the Kings, and Hatshepsut\'s temple, all within a half-day drive of each other.' },
      { _key: 'es', value: 'El museo al aire libre del Imperio Nuevo: Karnak, el Templo de Luxor, el Valle de los Reyes y el templo de Hatshepsut, todos a media hora en coche entre sí.' },
      { _key: 'ja', value: '新王国時代の野外博物館。カルナック、ルクソール神殿、王家の谷、ハトシェプスト葬祭殿——いずれも車で30分圏内。' },
    ],
    heroImage: heroImage(
      img.luxor,
      {
        en: 'Luxor Temple at the heart of the city',
        es: 'Templo de Luxor en el corazón de la ciudad',
        ja: '町の中心に立つルクソール神殿',
      },
      'Wikimedia Commons — Luxor Temple article lead photo'
    ),
  });

  const aswan = await client.createOrReplace({
    _id: 'city-aswan',
    _type: 'city',
    name: i18nString('Aswan', 'Asuán', 'アスワン'),
    slug: i18nSlug('aswan', 'asuan', 'aswan'),
    region: 'upper-egypt',
    orderRank: 30,
    coordinates: { _type: 'coordinates', lat: 24.0889, lng: 32.8998 },
    summary: [
      { _key: 'en', value: 'Egypt\'s southern frontier — Nubian markets, Philae temple, and the slow Nile that travelers describe as the part of the trip they did not expect to love most.' },
      { _key: 'es', value: 'La frontera sur de Egipto: mercados nubios, el templo de Philae y un Nilo pausado que los viajeros suelen describir como la parte del viaje que no esperaban amar.' },
      { _key: 'ja', value: 'エジプト最南端。ヌビアの市場、フィラエ神殿、ゆったりとしたナイル川——旅行者が「予想外に一番好きになった場所」と語る街。' },
    ],
    heroImage: heroImage(
      img.aswan,
      {
        en: 'Panoramic view of Aswan and the Nile',
        es: 'Vista panorámica de Asuán y el Nilo',
        ja: 'アスワンとナイル川のパノラマ',
      },
      'Wikimedia Commons — Aswan article lead photo'
    ),
  });

  console.log('  ✓ Luxor & Aswan');

  // ── Additional theme ─────────────────────────────
  const familyTheme = await client.createOrReplace({
    _id: 'theme-family-egypt',
    _type: 'theme',
    name: i18nString('Family Egypt', 'Egipto en familia', '家族で行くエジプト'),
    slug: i18nSlug('family-egypt', 'egipto-en-familia', 'family-egypt'),
    orderRank: 20,
    description: [
      { _key: 'en', value: 'Itineraries paced and chosen so the trip works for travelers between 6 and 60. Less walking through midday heat, more boats, and one shorter cruise instead of the standard four-night.' },
    ],
  });

  console.log('  ✓ Family Egypt theme');

  // ── 3 more day tours ─────────────────────────────
  await client.createOrReplace({
    _id: 'tour-saqqara-dahshur-private',
    _type: 'tour',
    type: 'dayTour',
    dayTourMode: 'private',
    cities: [{ _type: 'reference', _ref: cairo._id, _key: 'cairo' }],
    durationDays: 1,
    durationLabel: i18nString('Full day, ~8 hours', 'Día completo, ~8 horas', '1日（約8時間）'),
    title: i18nString(
      'Saqqara & Dahshur — the pyramids before the pyramids',
      'Saqqara y Dahshur: las pirámides antes de las pirámides',
      'サッカラとダハシュール — ピラミッドの起源を訪ねる'
    ),
    slug: i18nSlug('saqqara-dahshur-day-tour', 'saqqara-dahshur-dia', 'saqqara-dahshur-day-tour'),
    summary: [
      { _key: 'en', value: 'A quieter pyramid day for travelers who already saw Giza or want to see how pyramid architecture evolved. Step Pyramid, Bent Pyramid, Red Pyramid — and almost no crowds.' },
      { _key: 'es', value: 'Un día de pirámides más tranquilo para viajeros que ya vieron Giza o quieren entender cómo evolucionó la arquitectura piramidal. Pirámide Escalonada, Acodada y Roja — y casi sin gente.' },
      { _key: 'ja', value: 'ギザを既に訪れた方、あるいはピラミッド建築の進化を見たい方向けの、人出が少ない一日。階段ピラミッド、屈折ピラミッド、赤ピラミッド。' },
    ],
    priceIndication: i18nString(
      'from €110 per person for two travelers, including private vehicle and Egyptologist guide',
      'desde 110 € por persona para dos viajeros, vehículo privado y guía egiptólogo incluidos',
      '2名様の場合、お一人様110ユーロから。専用車・エジプト学者ガイド込み'
    ),
    heroImage: heroImage(
      img.saqqaraTour,
      {
        en: 'The Step Pyramid of Djoser at Saqqara',
        es: 'La Pirámide Escalonada de Zoser en Saqqara',
        ja: 'サッカラ、ジェセル王の階段ピラミッド',
      },
      'Wikimedia Commons — Pyramid of Djoser article lead photo'
    ),
    body: i18nPortable([
      block(
        "Saqqara is the necropolis that records pyramid architecture as a 200-year experiment. The Step Pyramid of Djoser — the first monumental stone building anywhere — is here, and so are the failures and refinements that follow it: the Bent Pyramid at Dahshur, where the angle changes mid-construction once the original slope proved unstable; the Red Pyramid, the first geometrically true pyramid and the rehearsal for Giza."
      ),
      operatorNote(
        'context',
        "Most first-time visitors do Giza on day one and feel they've understood Egyptian pyramids. Saqqara is what changes that. You see the prototypes, the corrections, the architectural reasoning across two centuries. By the time you stand at the Bent Pyramid, the Giza pyramids stop being a single moment and start being the answer to a long question."
      ),
      block(
        "We pace this day to alternate driving with walking — the sites are spread across the desert plateau and the heat is real even in winter. Lunch is at a quiet restaurant near Memphis, off the standard tourist route."
      ),
      operatorNote(
        'insider',
        "If the Serapeum is open the day you go (it varies), we always include it. The underground burial chambers for the Apis bulls are unlike anything else in Egypt — vast granite sarcophagi in cathedral-scale rock-cut galleries. Most tour operators skip it. We don't."
      ),
    ]),
    highlights: [
      {
        _key: 'en',
        value: [
          'Step Pyramid of Djoser — the first monumental stone building',
          'Bent Pyramid and Red Pyramid at Dahshur, with interior access at the Red',
          'The Serapeum (when open) — granite sarcophagi for the Apis bulls',
          'A quiet lunch near Memphis, off the tour-bus circuit',
          'Egyptologist commentary connecting Saqqara → Dahshur → Giza',
        ],
      },
      {
        _key: 'es',
        value: [
          'Pirámide Escalonada de Zoser — el primer edificio monumental de piedra',
          'Pirámide Acodada y Pirámide Roja en Dahshur, con entrada al interior de la Roja',
          'El Serapeum (cuando está abierto) — sarcófagos de granito para los toros Apis',
          'Almuerzo tranquilo cerca de Menfis, fuera del circuito de autobuses',
          'Comentario egiptológico que conecta Saqqara, Dahshur y Giza',
        ],
      },
      {
        _key: 'ja',
        value: [
          'ジェセル王の階段ピラミッド — 史上初の石造記念建築',
          'ダハシュールの屈折ピラミッドと赤ピラミッド（赤ピラミッドは内部に入場可能）',
          'セラペウム（公開時のみ）— アピス牛のための花崗岩の石棺',
          'メンフィス近郊の観光バスルートから外れた静かな昼食',
          'サッカラ→ダハシュール→ギザのつながりを解説するエジプト学者のガイド',
        ],
      },
    ],
    inclusions: i18nPortable([
      block('Private air-conditioned vehicle with English-speaking driver'),
      block('Licensed Egyptologist guide for the full day'),
      block('All site entrance tickets (Saqqara complex, Dahshur, Red Pyramid interior)'),
      block('Bottled water throughout the day'),
      block('Lunch at a quiet local restaurant near Memphis'),
    ]),
    exclusions: i18nPortable([
      block('Hotel pickup outside greater Cairo / Giza'),
      block('Personal expenses and gratuities'),
      block('Special-access tickets (e.g. Serapeum when ticketed separately)'),
      block('Photography permits inside specific tombs (rarely required)'),
    ]),
    itinerary: i18nPortable([
      block('Morning — Saqqara complex', 'h3'),
      block(
        "Pickup from your Cairo or Giza hotel between 7:30 and 8:30am. The drive to Saqqara is about 45 minutes. We start at the Step Pyramid and the surrounding Djoser complex — the colonnaded entrance, the heb-sed court, and the southern tomb. From here we visit the Pyramid of Unas (often quiet) for its early Pyramid Texts, and the Mastaba of Ti for its everyday-life reliefs."
      ),
      block('Midday — lunch near Memphis', 'h3'),
      block(
        "We break for lunch around 1pm at a small restaurant we've used for years. Quiet, shaded, and the food is from the surrounding farms rather than the tourist supply chain."
      ),
      block('Afternoon — Dahshur', 'h3'),
      block(
        "The drive to Dahshur is short — twenty minutes. We start at the Bent Pyramid for the architectural context, then walk to the Red Pyramid, where you can enter the burial chamber. The walk down the entrance corridor is long and low, but the chamber itself is the largest interior space in any Egyptian pyramid open to the public, and almost always empty."
      ),
      block(
        "Return to your hotel by 5–6pm depending on Cairo traffic."
      ),
    ]),
    relatedTours: [
      { _type: 'reference', _ref: 'tour-pyramids-private-day', _key: 'pyramids' },
      { _type: 'reference', _ref: 'tour-old-cairo-walking-group', _key: 'oldcairo' },
    ],
    relatedGuides: [
      { _type: 'cityRef', _ref: cairo._id, _key: 'cairo-guide' },
    ],
  });

  await client.createOrReplace({
    _id: 'tour-old-cairo-walking-group',
    _type: 'tour',
    type: 'dayTour',
    dayTourMode: 'group',
    cities: [{ _type: 'reference', _ref: cairo._id, _key: 'cairo' }],
    durationDays: 1,
    durationLabel: i18nString('Half day, ~4 hours', 'Medio día, ~4 horas', '半日（約4時間）'),
    title: i18nString(
      'Old Cairo Walking Tour — Coptic, Islamic, and Khan',
      'Caminata por El Cairo antiguo — copto, islámico y Khan',
      'オールド・カイロ徒歩ツアー — コプト・イスラム・ハーン'
    ),
    slug: i18nSlug('old-cairo-walking-tour', 'caminata-cairo-antiguo', 'old-cairo-walking-tour'),
    summary: [
      { _key: 'en', value: 'Coptic Cairo, the Citadel and Sultan Hassan, then through Khan el-Khalili at dusk. A small-group walking format with an Egyptologist who connects the layers across centuries.' },
      { _key: 'es', value: 'El Cairo copto, la Ciudadela y Sultán Hasán, luego por Khan el-Khalili al atardecer. Formato a pie en grupo reducido con un egiptólogo que conecta las capas a lo largo de los siglos.' },
      { _key: 'ja', value: 'コプト・カイロ、シタデルとスルタン・ハサン、夕暮れのハーン・ハリーリへ。少人数徒歩ツアー、エジプト学者が時代を超えて層を結びつけて解説します。' },
    ],
    priceIndication: i18nString(
      'from €45 per person, group of up to 8',
      'desde 45 € por persona, grupos de hasta 8',
      'お一人様45ユーロから（最大8名）'
    ),
    heroImage: heroImage(
      img.oldCairoTour,
      {
        en: 'Khan el-Khalili — the historic souk at the heart of Old Cairo',
        es: 'Khan el-Khalili: el zoco histórico en el corazón del Cairo antiguo',
        ja: 'ハーン・ハリーリ — オールド・カイロの中心にある歴史あるスーク',
      },
      'Wikimedia Commons — Khan el-Khalili article lead photo'
    ),
  });

  await client.createOrReplace({
    _id: 'tour-luxor-west-bank-private',
    _type: 'tour',
    type: 'dayTour',
    dayTourMode: 'private',
    cities: [{ _type: 'reference', _ref: luxor._id, _key: 'luxor' }],
    durationDays: 1,
    durationLabel: i18nString('Full day, ~7 hours', 'Día completo, ~7 horas', '1日（約7時間）'),
    title: i18nString(
      'Luxor West Bank — Valley of the Kings & Hatshepsut',
      'Orilla oeste de Luxor — Valle de los Reyes y Hatshepsut',
      'ルクソール西岸 — 王家の谷とハトシェプスト'
    ),
    slug: i18nSlug('luxor-west-bank-private', 'luxor-orilla-oeste-privado', 'luxor-west-bank-private'),
    summary: [
      { _key: 'en', value: 'Three tombs in the Valley of the Kings (we choose them based on what is open and what is least crowded that day), the Colossi of Memnon, and Hatshepsut\'s temple — the New Kingdom in one paced, private day.' },
      { _key: 'es', value: 'Tres tumbas en el Valle de los Reyes (las elegimos según qué esté abierto y con menos gente ese día), los Colosos de Memnón y el templo de Hatshepsut — el Imperio Nuevo en un día privado y bien dosificado.' },
      { _key: 'ja', value: '王家の谷の墓三基（その日の開放状況と混雑具合で選定）、メムノンの巨像、ハトシェプスト葬祭殿——新王国時代を1日で、ゆとりあるプライベート行程で。' },
    ],
    priceIndication: i18nString(
      'from €140 per person for two travelers, including private vehicle, Egyptologist, and tomb entries',
      'desde 140 € por persona para dos viajeros, vehículo privado, egiptólogo y entradas a tumbas incluidos',
      '2名様の場合、お一人様140ユーロから。専用車・エジプト学者・墓入場料込み'
    ),
    heroImage: heroImage(
      img.luxorWestTour,
      {
        en: "Hatshepsut's mortuary temple at Deir el-Bahari",
        es: 'Templo funerario de Hatshepsut en Deir el-Bahari',
        ja: 'ダイル・アル＝バハリのハトシェプスト葬祭殿',
      },
      'Wikimedia Commons — Deir el-Bahari article lead photo'
    ),
  });

  console.log('  ✓ 3 more day tours');

  // ── 2 more packages ─────────────────────────────
  await client.createOrReplace({
    _id: 'tour-classic-egypt-8',
    _type: 'tour',
    type: 'package',
    theme: { _type: 'reference', _ref: inDepthTheme._id },
    cities: [
      { _type: 'reference', _ref: cairo._id, _key: 'cairo' },
      { _type: 'reference', _ref: luxor._id, _key: 'luxor' },
      { _type: 'reference', _ref: aswan._id, _key: 'aswan' },
    ],
    durationDays: 8,
    durationLabel: i18nString('8 days / 7 nights', '8 días / 7 noches', '8日間 / 7泊'),
    title: i18nString(
      'Classic Egypt — 8 Days',
      'Egipto clásico — 8 días',
      'クラシック・エジプト 8日間'
    ),
    slug: i18nSlug('classic-egypt-8-days', 'egipto-clasico-8-dias', 'classic-egypt-8-days'),
    summary: [
      { _key: 'en', value: 'Cairo, then a four-night Nile cruise from Luxor to Aswan, then Abu Simbel. The most-asked-for itinerary, paced so it doesn\'t feel rushed.' },
      { _key: 'es', value: 'El Cairo, después un crucero de cuatro noches por el Nilo de Luxor a Asuán, y luego Abu Simbel. El itinerario más solicitado, con un ritmo que no agobia.' },
      { _key: 'ja', value: 'カイロ、次にルクソール〜アスワン4泊のナイル川クルーズ、そしてアブ・シンベル。最もご要望の多い行程を、せかせかしないペースで。' },
    ],
    priceIndication: i18nString(
      'from €1,950 per person for two travelers, depending on cruise vessel and hotel tier',
      'desde 1.950 € por persona para dos viajeros, según embarcación y categoría del hotel',
      '2名様の場合、お一人様1,950ユーロから。クルーズ船とホテルランクによる'
    ),
    heroImage: heroImage(
      img.classicPkg,
      {
        en: 'A felucca under sail on the Nile',
        es: 'Una faluca a vela en el Nilo',
        ja: 'ナイル川を行くファルーカ船（伝統的な帆船）',
      },
      'Wikimedia Commons — Felucca article lead photo'
    ),
  });

  await client.createOrReplace({
    _id: 'tour-family-egypt-10',
    _type: 'tour',
    type: 'package',
    theme: { _type: 'reference', _ref: familyTheme._id },
    cities: [
      { _type: 'reference', _ref: cairo._id, _key: 'cairo' },
      { _type: 'reference', _ref: luxor._id, _key: 'luxor' },
      { _type: 'reference', _ref: aswan._id, _key: 'aswan' },
    ],
    durationDays: 10,
    durationLabel: i18nString('10 days / 9 nights', '10 días / 9 noches', '10日間 / 9泊'),
    title: i18nString(
      'Family Egypt — 10 Days',
      'Egipto en familia — 10 días',
      '家族で行くエジプト 10日間'
    ),
    slug: i18nSlug('family-egypt-10-days', 'egipto-familia-10-dias', 'family-egypt-10-days'),
    summary: [
      { _key: 'en', value: 'The classic loop, recut for travelers between 6 and 60. Two-night cruise instead of four, more boat-based time on the Nile, and afternoons that stay out of the worst midday heat.' },
      { _key: 'es', value: 'El recorrido clásico, adaptado para viajeros de 6 a 60 años. Crucero de dos noches en vez de cuatro, más tiempo en barco por el Nilo y tardes fuera del peor calor del mediodía.' },
      { _key: 'ja', value: '定番ルートを6〜60歳の旅行者向けに再構成。クルーズは4泊から2泊に短縮し、ナイル川での船上時間を増やし、午後は猛暑を避ける配分です。' },
    ],
    priceIndication: i18nString(
      'from €1,750 per person for a family of four, hotel tier dependent',
      'desde 1.750 € por persona para una familia de cuatro, según categoría del hotel',
      '4名家族の場合、お一人様1,750ユーロから。ホテルランクによる'
    ),
    heroImage: heroImage(
      img.familyPkg,
      {
        en: 'The Nile at Aswan, viewed from the Old Cataract terrace',
        es: 'El Nilo en Asuán, desde la terraza del Old Cataract',
        ja: 'アスワンのナイル川 — オールド・カタラクト・ホテルのテラスから',
      },
      'Wikimedia Commons — Old Cataract Hotel article lead photo'
    ),
  });

  console.log('  ✓ 2 more packages');

  // ── Site settings (singleton) ─────────────────────────────
  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteName: i18nString('Travel2Egypt', 'Travel2Egypt', 'Travel2Egypt'),
    tagline: i18nString(
      'Egypt, with judgment.',
      'Egipto, con criterio.',
      '判断のあるエジプト旅行'
    ),
    sisterBrands: [
      {
        _key: 'affordegypt',
        name: 'AffordEgypt',
        url: 'https://affordegypt.com',
        description: i18nString(
          'Egypt for budget-conscious travelers.',
          'Egipto para viajeros con presupuesto.',
          '予算重視の旅行者のためのエジプト'
        ),
      },
      {
        _key: 'solei',
        name: 'Soléi',
        url: 'https://solei.com',
        description: i18nString(
          'Boutique luxury, Siwa-rooted.',
          'Lujo boutique, con raíces en Siwa.',
          'シーワに根ざしたブティック・ラグジュアリー'
        ),
      },
    ],
    contact: {
      email: 'hello@travel2egypt.org',
      whatsapp: '+201234567890',
    },
  });

  console.log('  ✓ Site settings');

  // ─────────────────────────────────────────────────────────
  // Wiki — Egyptian reference content
  //
  // Cross-references resolve in two passes: dynasties + monuments + deities
  // are created without forward refs to other wiki types, then patched
  // after wikiPerson docs exist. This avoids strong-ref-to-missing-doc
  // errors during initial creation.
  // ─────────────────────────────────────────────────────────

  // ── Dynasties (no cross-refs yet) ─────────────────────────
  await client.createOrReplace({
    _id: 'wiki-dynasty-eighteenth',
    _type: 'wikiDynasty',
    name: i18nString('Eighteenth Dynasty', 'XVIII Dinastía', '第18王朝'),
    slug: i18nSlug('eighteenth-dynasty', 'dinastia-xviii', 'eighteenth-dynasty'),
    kingdom: 'new',
    period: i18nString('c. 1550–1295 BCE', 'c. 1550–1295 a. C.', '紀元前1550年頃〜1295年頃'),
    startYear: -1550,
    endYear: -1295,
    summary: i18nString(
      'The first dynasty of the New Kingdom — Egypt at the height of imperial reach, the dynasty of Hatshepsut, Akhenaten, Nefertiti, and Tutankhamun.',
      'La primera dinastía del Imperio Nuevo, Egipto en su apogeo imperial: la dinastía de Hatshepsut, Akenatón, Nefertiti y Tutankamón.',
      '新王国時代の最初の王朝 — 帝国の最盛期、ハトシェプスト、アクエンアテン、ネフェルティティ、ツタンカーメンの王朝。'
    ),
    body: i18nPortable([
      block(
        "The Eighteenth Dynasty is the dynasty most modern audiences picture when they picture ancient Egypt. It opens with Ahmose I expelling the Hyksos and reunifying the country, runs through Hatshepsut's twenty-year peace and the empire-builder Thutmose III, lurches into Akhenaten's monotheist heresy at Amarna, and ends with the boy-king Tutankhamun, the general Horemheb, and the disrupted succession that ushers in the Nineteenth."
      ),
      operatorNote(
        'context',
        "If you have to learn one Egyptian dynasty before traveling, learn this one. Almost everything you'll see at Karnak, Luxor, the Valley of the Kings, and Deir el-Bahari is either Eighteenth Dynasty or a direct response to it."
      ),
      block(
        "The dynasty's signature is architectural ambition. Hatshepsut's terraced temple at Deir el-Bahari, Thutmose III's expansion of Karnak, the obelisks (most now in Rome, Istanbul, New York), the Valley of the Kings as the new royal necropolis — all of it. Nineteen pharaohs across roughly 250 years."
      ),
    ]),
    heroImage: heroImage(
      img.dyn18th,
      {
        en: 'Detail of the gold throne of Tutankhamun — Eighteenth Dynasty',
        es: 'Detalle del trono dorado de Tutankamón — Dinastía XVIII',
        ja: 'ツタンカーメンの黄金の玉座（第18王朝）',
      },
      'Wikimedia Commons — Eighteenth Dynasty article lead photo'
    ),
  });

  await client.createOrReplace({
    _id: 'wiki-dynasty-fourth-old',
    _type: 'wikiDynasty',
    name: i18nString('Fourth Dynasty', 'IV Dinastía', '第4王朝'),
    slug: i18nSlug('fourth-dynasty', 'dinastia-iv', 'fourth-dynasty'),
    kingdom: 'old',
    period: i18nString('c. 2613–2494 BCE', 'c. 2613–2494 a. C.', '紀元前2613年頃〜2494年頃'),
    startYear: -2613,
    endYear: -2494,
    summary: i18nString(
      "The Old Kingdom's pyramid-building dynasty — Sneferu, Khufu, Khafre, Menkaure. The Giza Plateau is essentially their work.",
      'La dinastía constructora de pirámides del Imperio Antiguo: Seneferu, Keops, Kefrén, Micerino. La meseta de Giza es esencialmente obra suya.',
      '古王国時代のピラミッド建造王朝 — スネフェル王、クフ王、カフラー王、メンカウラー王。ギザ高原はほぼ彼らの建造物。'
    ),
    body: i18nPortable([
      block(
        "The Fourth Dynasty is the apex of the Old Kingdom and the dynasty that produced the architecture by which all subsequent Egyptian and indeed many world cultures measured monumental ambition. Sneferu's three pyramids at Meidum and Dahshur record the architectural learning curve; his son Khufu builds the Great Pyramid at Giza; Khafre adds his own and the Sphinx; Menkaure closes the family with the smallest of the three Giza pyramids."
      ),
      operatorNote(
        'context',
        "Standing at Giza you are looking at roughly 75 years of one family's work. The plateau as built environment is essentially a Fourth-Dynasty monument."
      ),
    ]),
    heroImage: heroImage(
      img.dynOld,
      {
        en: "Diorite statue of Khafre, builder of the second Giza pyramid",
        es: 'Estatua de diorita de Kefrén, constructor de la segunda pirámide de Giza',
        ja: 'カフラー王の閃緑岩像 — ギザの第二ピラミッド建造者',
      },
      'Wikimedia Commons — Khafre article lead photo'
    ),
  });

  await client.createOrReplace({
    _id: 'wiki-dynasty-ptolemaic',
    _type: 'wikiDynasty',
    name: i18nString('Ptolemaic Dynasty', 'Dinastía Ptolemaica', 'プトレマイオス朝'),
    slug: i18nSlug('ptolemaic-dynasty', 'dinastia-ptolemaica', 'ptolemaic-dynasty'),
    kingdom: 'ptolemaic',
    period: i18nString('305–30 BCE', '305–30 a. C.', '紀元前305年〜30年'),
    startYear: -305,
    endYear: -30,
    summary: i18nString(
      "The Greek dynasty that ruled Egypt for nearly three centuries after Alexander's conquest, ending with Cleopatra VII and the annexation by Rome.",
      'La dinastía griega que gobernó Egipto durante casi tres siglos tras la conquista de Alejandro, hasta su final con Cleopatra VII y la anexión romana.',
      'アレクサンドロス征服後、約3世紀にわたりエジプトを統治したギリシャ系王朝 — クレオパトラ7世とローマ併合で幕を閉じる。'
    ),
    body: i18nPortable([
      block(
        "Ptolemy I, one of Alexander the Great's generals, took Egypt as his share of the empire and founded the dynasty that would rule from Alexandria for fifteen generations. The Ptolemies were Greek-speaking, ruled through a hybrid Greek-Egyptian apparatus, and never quite stopped being foreigners — until Cleopatra VII, who was the first to learn Egyptian and the last to rule before Rome."
      ),
      operatorNote(
        'context',
        "Most of the temples that look 'classically Egyptian' to modern visitors — Edfu, Dendera, Kom Ombo, Philae — are Ptolemaic. They're consciously archaic, deliberately styled to look like New-Kingdom temples a millennium older. The Ptolemies wanted Egyptian legitimacy and built it in stone."
      ),
    ]),
    heroImage: heroImage(
      img.dynPtolemaic,
      {
        en: 'The Temple of Edfu — Ptolemaic-era, the most-preserved temple in Egypt',
        es: 'El templo de Edfu — de época ptolemaica, el templo mejor conservado de Egipto',
        ja: 'エドフ神殿 — プトレマイオス朝期、エジプトで最も保存状態の良い神殿',
      },
      'Wikimedia Commons — Edfu article lead photo'
    ),
  });

  console.log('  ✓ 3 dynasties');

  // ── Monuments (refs cities + dynasties; person/deity refs added later) ──
  await client.createOrReplace({
    _id: 'wiki-monument-temple-hatshepsut',
    _type: 'wikiMonument',
    name: i18nString(
      'Mortuary Temple of Hatshepsut at Deir el-Bahari',
      'Templo funerario de Hatshepsut en Deir el-Bahari',
      'ダイル・アル=バハリのハトシェプスト葬祭殿'
    ),
    slug: i18nSlug('temple-of-hatshepsut', 'templo-de-hatshepsut', 'temple-of-hatshepsut'),
    monumentType: 'mortuary-temple',
    city: { _type: 'reference', _ref: luxor._id },
    preciseLocation: i18nString(
      'West Bank, Luxor — Deir el-Bahari',
      'Orilla oeste de Luxor — Deir el-Bahari',
      'ルクソール西岸 — ダイル・アル=バハリ'
    ),
    builtDuring: { _type: 'reference', _ref: 'wiki-dynasty-eighteenth' },
    summary: i18nString(
      "Hatshepsut's three-terraced mortuary temple, set against the cliffs of Deir el-Bahari. Architecturally unique in the Egyptian tradition.",
      'El templo funerario de tres terrazas de Hatshepsut, encajado en los acantilados de Deir el-Bahari. Arquitectónicamente único en la tradición egipcia.',
      'ダイル・アル=バハリの断崖を背景に建つ、ハトシェプストの三段テラス葬祭殿。エジプトの伝統において建築的に唯一無二。'
    ),
    body: i18nPortable([
      block(
        "The temple is built into the cliffs in three stepped terraces, connected by long ramps. It looks more Greek than Egyptian — and indeed Greek architects who reached Egypt in later centuries used Deir el-Bahari as a reference for proportional architecture. But it predates Greek temple-building by a thousand years."
      ),
      block(
        "The reliefs on the terraces tell two stories. The middle terrace shows the expedition to Punt — Hatshepsut's defining trade mission, possibly to Eritrea or Somalia, recorded with extraordinary visual specificity (giraffes, baboons, the Queen of Punt drawn faithfully as a heavy-set woman). The upper terrace records Hatshepsut's divine birth — her claim that Amun-Re was her father, the legitimacy theology of a queen ruling as king."
      ),
      operatorNote(
        'caution',
        "After Hatshepsut's death, her successor Thutmose III had her name and image systematically erased from the temple. The damnatio memoriae is visible everywhere — figures chiseled out, cartouches scraped off. The restoration work since the 1960s has been meticulous but the scars are still readable."
      ),
    ]),
    visitorInfo: i18nPortable([
      block(
        "Visiting hours: 6am–5pm. Most tour groups arrive between 8am and 10am, which is exactly when the sun is hottest on the unshaded terraces. We aim our visits at 7am or 4pm — cooler, longer shadows, fewer people."
      ),
      block(
        "There's a small electric tram from the entrance to the temple base; we usually skip it and walk (about 10 minutes), which gives you the approach the architects intended."
      ),
      operatorNote(
        'insider',
        "The Anubis Chapel on the middle terrace, north side, is often empty even when the main terraces are crowded. The painted reliefs there are some of the best-preserved color anywhere in the Theban necropolis."
      ),
    ]),
    heroImage: heroImage(
      img.monTempleHatshepsut,
      {
        en: 'The three terraces of Hatshepsut’s mortuary temple at Deir el-Bahari',
        es: 'Las tres terrazas del templo funerario de Hatshepsut en Deir el-Bahari',
        ja: 'ダイル・アル=バハリのハトシェプスト葬祭殿の三段テラス',
      },
      'Wikimedia Commons — Deir el-Bahari article lead photo'
    ),
  });

  await client.createOrReplace({
    _id: 'wiki-monument-karnak',
    _type: 'wikiMonument',
    name: i18nString(
      'Karnak Temple Complex',
      'Complejo templario de Karnak',
      'カルナック神殿群'
    ),
    slug: i18nSlug('karnak', 'karnak', 'karnak'),
    monumentType: 'temple',
    city: { _type: 'reference', _ref: luxor._id },
    preciseLocation: i18nString(
      'East Bank, Luxor',
      'Orilla este de Luxor',
      'ルクソール東岸'
    ),
    builtDuring: { _type: 'reference', _ref: 'wiki-dynasty-eighteenth' },
    summary: i18nString(
      "The largest religious building ever constructed — 200 acres of temples, pylons, sanctuaries, and obelisks accumulated across two thousand years of pharaonic dedication.",
      'El edificio religioso más grande jamás construido: 80 hectáreas de templos, pilonos, santuarios y obeliscos acumulados durante dos mil años de devoción faraónica.',
      'これまでに建造された世界最大の宗教施設 — 80ヘクタールの神殿群、塔門、聖所、オベリスクが2,000年にわたるファラオたちの奉献によって積み重なる。'
    ),
    body: i18nPortable([
      block(
        "Karnak is not a temple. It is the accumulated record of two thousand years of pharaohs each adding what they could afford to add. The Middle Kingdom started it. The Eighteenth Dynasty made it monumental — Hatshepsut's obelisks, Thutmose III's hall of festivals. The Nineteenth Dynasty's Ramesses II built the Great Hypostyle Hall, 134 columns, the largest ever raised. The Ptolemies added their own pylon. Even the Romans patched it."
      ),
      operatorNote(
        'context',
        "If you can only do one site at Luxor, Karnak is the one. Everything else — Luxor Temple, the Valley of the Kings, Hatshepsut's temple — makes sense in relation to Karnak. It was the religious center, and the others orbit it."
      ),
    ]),
    visitorInfo: i18nPortable([
      block('6am–5pm; light show in the evening (decent if you want it, skippable if not).'),
      operatorNote(
        'insider',
        "Walk the side paths into the chapels around the Sacred Lake — almost no one does, and that's where the best-preserved color reliefs are."
      ),
    ]),
    // No verified hero image — leaving placeholder rather than risk the
    // misattributed Wikipedia file (filename suggests Luxor Temple).
  });

  await client.createOrReplace({
    _id: 'wiki-monument-great-pyramid',
    _type: 'wikiMonument',
    name: i18nString(
      'Great Pyramid of Giza',
      'Gran Pirámide de Giza',
      'ギザの大ピラミッド'
    ),
    slug: i18nSlug('great-pyramid-of-giza', 'gran-piramide-de-giza', 'great-pyramid-of-giza'),
    monumentType: 'pyramid',
    city: { _type: 'reference', _ref: cairo._id },
    preciseLocation: i18nString(
      'Giza Plateau',
      'Meseta de Giza',
      'ギザ高原'
    ),
    builtDuring: { _type: 'reference', _ref: 'wiki-dynasty-fourth-old' },
    summary: i18nString(
      "Khufu's pyramid — the largest ever built, the only surviving Wonder of the Ancient World, and the architectural standard the Egyptian state never quite matched again.",
      'La pirámide de Keops: la más grande jamás construida, la única Maravilla del Mundo Antiguo que sobrevive, y el estándar arquitectónico que el Estado egipcio nunca volvió a igualar.',
      'クフ王のピラミッド — 史上最大、現存する唯一の古代世界の七不思議、そしてエジプト国家が二度と並べなかった建築水準。'
    ),
    body: i18nPortable([
      block(
        "146 meters originally, 138 today after the limestone casing was stripped for medieval Cairo's mosques. 2.3 million stone blocks, each averaging 2.5 tons. Built in roughly 20 years during Khufu's reign, around 2560 BCE — meaning a stone block was set every two minutes for two decades."
      ),
      operatorNote(
        'honest',
        "The interior chambers are interesting historically and uncomfortable physically. The Grand Gallery climb is steep, low-ceilinged, hot, and ends in a small room that contained a granite sarcophagus and now contains tourists. If you have any doubts about claustrophobia, skip the interior — the exterior and context are the real visit."
      ),
    ]),
    heroImage: heroImage(
      img.monGreatPyramid,
      {
        en: 'The Great Pyramid of Giza — Pyramid of Khufu',
        es: 'La Gran Pirámide de Giza — pirámide de Keops',
        ja: 'ギザの大ピラミッド — クフ王のピラミッド',
      },
      'Wikimedia Commons — Great Pyramid of Giza article lead photo'
    ),
  });

  console.log('  ✓ 3 monuments');

  // ── Deities ──────────────────────────────────────────────
  await client.createOrReplace({
    _id: 'wiki-deity-horus',
    _type: 'wikiDeity',
    name: i18nString('Horus', 'Horus', 'ホルス'),
    slug: i18nSlug('horus', 'horus', 'horus'),
    alternateNames: ['Hor', 'Heru', 'Hor-Wer', 'Harakhty', 'Harpocrates'],
    domain: i18nString(
      'Sky god, falcon-headed; god of kingship and protection',
      'Dios del cielo con cabeza de halcón; dios de la realeza y la protección',
      '空の神、ハヤブサ頭の神 — 王権と守護の神'
    ),
    summary: i18nString(
      "The falcon-headed sky god, son of Osiris and Isis. Every living pharaoh was considered Horus on earth — kingship's divine charter.",
      'El dios del cielo con cabeza de halcón, hijo de Osiris e Isis. Todo faraón vivo era considerado Horus en la tierra: la carta divina de la realeza.',
      '空の神、ハヤブサ頭、オシリスとイシスの息子。生ける全てのファラオは地上のホルスとされた — 王権の神聖なる根拠。'
    ),
    body: i18nPortable([
      block(
        "Horus's mythology is the Osiris cycle in compressed form: his father Osiris murdered by his uncle Set, his mother Isis hiding him in the Delta marshes, his eventual return to claim the throne and the long contendings with Set that ended with Horus winning kingship over the living world. By the historical period the doctrine was settled — the living king was Horus, the dead king became Osiris."
      ),
    ]),
    iconography: i18nPortable([
      block(
        "Falcon-headed man wearing the double crown of Upper and Lower Egypt. Often shown as a falcon alone, perched protectively behind the back of a pharaoh's head — most famously in Khafre's seated statue at Giza."
      ),
      block(
        "The Eye of Horus — the wedjat — circulates as a protective amulet across all periods."
      ),
    ]),
    heroImage: heroImage(
      img.deityHorus,
      {
        en: 'Horus standing — line drawing of the falcon-headed god',
        es: 'Horus de pie — dibujo lineal del dios con cabeza de halcón',
        ja: 'ホルス立像 — ハヤブサ頭の神の線描',
      },
      'Wikimedia Commons — Horus article lead'
    ),
  });

  await client.createOrReplace({
    _id: 'wiki-deity-isis',
    _type: 'wikiDeity',
    name: i18nString('Isis', 'Isis', 'イシス'),
    slug: i18nSlug('isis', 'isis', 'isis'),
    alternateNames: ['Aset', 'Eset', 'Au-Set'],
    domain: i18nString(
      'Goddess of magic, motherhood, and protection',
      'Diosa de la magia, la maternidad y la protección',
      '魔術・母性・守護の女神'
    ),
    summary: i18nString(
      "Wife of Osiris, mother of Horus, the great mother of the Egyptian pantheon. By the Roman era her cult had spread across the Mediterranean.",
      'Esposa de Osiris, madre de Horus, la gran madre del panteón egipcio. En época romana su culto se extendió por todo el Mediterráneo.',
      'オシリスの妻、ホルスの母、エジプト神話の偉大なる母。ローマ時代までに地中海全域に信仰が広まった。'
    ),
    body: i18nPortable([
      block(
        "Isis is, of all the Egyptian deities, the one whose cult traveled furthest. By the first century CE there were Isis temples in Rome, Pompeii, Athens, and Britain. The Greeks and Romans recognized her in their own mother-goddess types — Demeter, Magna Mater — and the Christian iconography of mother-and-child draws unmistakably from Isis-and-Horus images."
      ),
    ]),
    iconography: i18nPortable([
      block(
        "Woman with the throne hieroglyph (her name) on her head, or with cow horns and a sun disk (after she was syncretized with Hathor). Often shown nursing the infant Horus on her lap — the image that would echo, through Coptic Christian art, into the European Madonna-and-child tradition."
      ),
    ]),
    // No verified Wikipedia article-lead image — placeholder.
  });

  await client.createOrReplace({
    _id: 'wiki-deity-anubis',
    _type: 'wikiDeity',
    name: i18nString('Anubis', 'Anubis', 'アヌビス'),
    slug: i18nSlug('anubis', 'anubis', 'anubis'),
    alternateNames: ['Anpu', 'Inpu'],
    domain: i18nString(
      'Jackal-headed god of mummification and the afterlife',
      'Dios chacal de la momificación y el más allá',
      'ジャッカル頭の神 — ミイラ作りと冥界の神'
    ),
    summary: i18nString(
      "The jackal-headed god who oversees embalming and weighs the heart of the deceased against the feather of Maat. Patron of cemeteries and funerary practice.",
      'El dios chacal que supervisa el embalsamamiento y pesa el corazón del difunto contra la pluma de Maat. Patrón de los cementerios y la práctica funeraria.',
      'ジャッカル頭の神 — ミイラ作りを監督し、死者の心臓をマアトの羽根と比較して秤量する。墓地と葬送儀礼の守護神。'
    ),
    body: i18nPortable([
      block(
        "Anubis presides over the most consequential moment in Egyptian afterlife belief — the weighing of the heart in the Hall of Two Truths. If the heart, weighted with the deceased's deeds in life, balances against the feather of Maat, the soul passes into the afterlife. If not, Ammit — part lion, part hippopotamus, part crocodile — devours it."
      ),
      block(
        "His association with embalming is practical: jackals scavenged Egyptian cemeteries, and the early dynastic period seems to have rationalized this by making the jackal the guardian rather than the threat."
      ),
    ]),
    heroImage: heroImage(
      img.deityAnubis,
      {
        en: 'Anubis standing — line drawing of the jackal-headed god',
        es: 'Anubis de pie — dibujo lineal del dios con cabeza de chacal',
        ja: 'アヌビス立像 — ジャッカル頭の神の線描',
      },
      'Wikimedia Commons — Anubis article lead'
    ),
  });

  console.log('  ✓ 3 deities');

  // ── People ──────────────────────────────────────────────
  await client.createOrReplace({
    _id: 'wiki-person-hatshepsut',
    _type: 'wikiPerson',
    name: i18nString('Hatshepsut', 'Hatshepsut', 'ハトシェプスト'),
    slug: i18nSlug('hatshepsut', 'hatshepsut', 'hatshepsut'),
    role: 'pharaoh',
    alternateNames: ['Hatshepsut', 'Hatchepsut', 'Maatkare'],
    dynasty: { _type: 'reference', _ref: 'wiki-dynasty-eighteenth' },
    reignStartYear: -1479,
    reignEndYear: -1458,
    reignDisplay: i18nString(
      'c. 1479–1458 BCE',
      'c. 1479–1458 a. C.',
      '紀元前1479年頃〜1458年頃'
    ),
    summary: i18nString(
      'Eighteenth-Dynasty pharaoh, one of a small number of women to rule Egypt as king (not regent, not consort). Her two-decade reign was a peak of Egyptian prosperity and architectural ambition.',
      'Faraón de la Dinastía XVIII, una de las pocas mujeres que gobernó Egipto como rey (no como regente ni consorte). Sus dos décadas de reinado fueron un apogeo de prosperidad y ambición arquitectónica.',
      '第18王朝のファラオ。エジプトを王として（摂政や后ではなく）統治した数少ない女性の一人。20年に及ぶ治世はエジプトの繁栄と建築的野心の頂点。'
    ),
    body: i18nPortable([
      block(
        "Hatshepsut came to the throne first as regent for her young stepson Thutmose III, then — within a few years — as full pharaoh in her own right, taking the throne names and the kingly titles. She ruled for roughly two decades. The standard claim that she was 'erased from history by jealous male successors' overstates the case; the truth is that Thutmose III, after her death and his own emergence as a major military pharaoh, did remove her name and image from many monuments — but inconsistently, and probably for legitimist political reasons rather than personal animus."
      ),
      operatorNote(
        'context',
        "Her reign was peace, trade, and building. The expedition to Punt is recorded on her temple walls. Karnak got two of her obelisks — the standing one is still the tallest ancient obelisk in Egypt. And Deir el-Bahari is hers from the cliff face up."
      ),
      block(
        "The Hatshepsut you see in modern Egypt is the recovered version. Her statues at the Met, the Cairo Museum, and the Luxor Museum were systematically smashed in antiquity, then reconstructed across the twentieth century from the fragments dumped in a quarry pit in front of her temple. Most of the great statues you see now are partial reassemblies."
      ),
    ]),
    notableMonuments: [
      { _type: 'reference', _ref: 'wiki-monument-temple-hatshepsut', _key: 'temple-hat' },
      { _type: 'reference', _ref: 'wiki-monument-karnak', _key: 'karnak' },
    ],
    heroImage: heroImage(
      img.pHatshepsut,
      {
        en: 'Seated statue of Hatshepsut, Metropolitan Museum of Art',
        es: 'Estatua sedente de Hatshepsut, Museo Metropolitano de Arte',
        ja: 'ハトシェプスト座像 — メトロポリタン美術館',
      },
      'Wikimedia Commons — Hatshepsut article lead photo'
    ),
  });

  await client.createOrReplace({
    _id: 'wiki-person-ramses-ii',
    _type: 'wikiPerson',
    name: i18nString('Ramesses II', 'Ramsés II', 'ラムセス2世'),
    slug: i18nSlug('ramesses-ii', 'ramses-ii', 'ramesses-ii'),
    role: 'pharaoh',
    alternateNames: ['Ramses II', 'Ramesses the Great', 'Usermaatre Setepenre', 'Ozymandias'],
    reignStartYear: -1279,
    reignEndYear: -1213,
    reignDisplay: i18nString(
      'c. 1279–1213 BCE',
      'c. 1279–1213 a. C.',
      '紀元前1279年頃〜1213年頃'
    ),
    summary: i18nString(
      'Nineteenth-Dynasty pharaoh whose 66-year reign produced more monumental construction than any other ruler in Egyptian history. The default Egyptian pharaoh in the Western imagination — Shelley\'s Ozymandias is him.',
      'Faraón de la Dinastía XIX cuyo reinado de 66 años produjo más construcción monumental que cualquier otro gobernante en la historia egipcia. El faraón egipcio por defecto en el imaginario occidental: el Ozymandias de Shelley es él.',
      '第19王朝のファラオ。66年に及ぶ治世はエジプト史上最大の記念建造物建造を残した。西洋の想像における「典型的ファラオ」 — シェリーの「オジマンディアス」は彼。'
    ),
    body: i18nPortable([
      block(
        "Ramesses II ruled for so long that he outlived most of his children. The cartouches at Abu Simbel, the colossal seated statues at the Ramesseum, the additions to Karnak's Hypostyle Hall, the temple at Beit el-Wali, and a list of others — are all his. The signature is recognizable: deep-cut sunk relief, oversized statuary, and an obsessive habit of carving his name into earlier monuments."
      ),
      operatorNote(
        'honest',
        "He was also a propagandist. The Battle of Kadesh against the Hittites, recorded as a Ramesside victory all over Egypt, was probably a draw at best. The treaty that followed it was the first known international peace treaty — a more interesting outcome than the battle scenes suggest."
      ),
    ]),
    notableMonuments: [
      { _type: 'reference', _ref: 'wiki-monument-karnak', _key: 'karnak' },
    ],
    heroImage: heroImage(
      img.pRamses,
      {
        en: 'Granite colossus of Ramesses II — British Museum',
        es: 'Coloso de granito de Ramsés II — Museo Británico',
        ja: 'ラムセス2世の花崗岩巨像 — 大英博物館',
      },
      'Wikimedia Commons — Ramesses II article lead photo'
    ),
  });

  await client.createOrReplace({
    _id: 'wiki-person-cleopatra-vii',
    _type: 'wikiPerson',
    name: i18nString('Cleopatra VII', 'Cleopatra VII', 'クレオパトラ7世'),
    slug: i18nSlug('cleopatra-vii', 'cleopatra-vii', 'cleopatra-vii'),
    role: 'queen',
    alternateNames: ['Cleopatra Philopator', 'Kleopatra'],
    dynasty: { _type: 'reference', _ref: 'wiki-dynasty-ptolemaic' },
    reignStartYear: -51,
    reignEndYear: -30,
    reignDisplay: i18nString(
      '51–30 BCE',
      '51–30 a. C.',
      '紀元前51年〜30年'
    ),
    summary: i18nString(
      'The last active ruler of the Ptolemaic Kingdom. Her death after the Battle of Actium ended three thousand years of pharaonic Egypt and brought the country under Rome.',
      'La última gobernante en activo del Reino Ptolemaico. Su muerte tras la batalla de Accio puso fin a tres mil años de Egipto faraónico y entregó el país a Roma.',
      'プトレマイオス朝最後の実権ある支配者。アクティウム海戦後の彼女の死は、3,000年に及ぶファラオ時代のエジプトを終わらせ、ローマ支配下に置いた。'
    ),
    body: i18nPortable([
      block(
        "Cleopatra was the first Ptolemaic ruler in nearly three centuries to bother learning Egyptian. She also reportedly spoke nine other languages and presented herself to Egyptian audiences as the goddess Isis incarnate — a calculated piece of cultural politics in a country whose Greek-speaking elite had governed without engaging the local population for generations."
      ),
      block(
        "Her relationships with Julius Caesar and then Mark Antony were strategic alliances first, anything else second; the survival of Ptolemaic Egypt depended on Rome and she made the bargains the situation allowed. The bargains failed at Actium in 31 BCE."
      ),
      operatorNote(
        'context',
        "The Cleopatra of European painting — pale, sultry, Hellenistic — is partly a Ptolemaic court image and partly two thousand years of European projection. The historical Cleopatra was politically formidable, multilingual, and a writer (her medical and cosmetic treatises were cited by Galen)."
      ),
    ]),
    heroImage: heroImage(
      img.pCleopatra,
      {
        en: 'Marble bust of Cleopatra VII — Altes Museum, Berlin',
        es: 'Busto de mármol de Cleopatra VII — Altes Museum, Berlín',
        ja: 'クレオパトラ7世の大理石胸像 — ベルリン旧博物館',
      },
      'Wikimedia Commons — Cleopatra article lead photo'
    ),
  });

  console.log('  ✓ 3 people');

  // ── Patch passes to add cross-refs that depend on later docs ──
  await client
    .patch('wiki-monument-temple-hatshepsut')
    .set({
      builtBy: [
        { _type: 'reference', _ref: 'wiki-person-hatshepsut', _key: 'h' },
      ],
      dedicatedTo: [
        { _type: 'reference', _ref: 'wiki-deity-horus', _key: 'h' },
      ],
    })
    .commit();

  await client
    .patch('wiki-monument-karnak')
    .set({
      builtBy: [
        { _type: 'reference', _ref: 'wiki-person-hatshepsut', _key: 'h' },
        { _type: 'reference', _ref: 'wiki-person-ramses-ii', _key: 'r' },
      ],
      dedicatedTo: [
        { _type: 'reference', _ref: 'wiki-deity-horus', _key: 'h' },
      ],
    })
    .commit();

  await client
    .patch('wiki-dynasty-eighteenth')
    .set({
      notableRulers: [
        { _type: 'reference', _ref: 'wiki-person-hatshepsut', _key: 'h' },
      ],
      notableMonuments: [
        { _type: 'reference', _ref: 'wiki-monument-temple-hatshepsut', _key: 'th' },
        { _type: 'reference', _ref: 'wiki-monument-karnak', _key: 'k' },
      ],
    })
    .commit();

  await client
    .patch('wiki-dynasty-fourth-old')
    .set({
      notableMonuments: [
        { _type: 'reference', _ref: 'wiki-monument-great-pyramid', _key: 'gp' },
      ],
    })
    .commit();

  await client
    .patch('wiki-dynasty-ptolemaic')
    .set({
      notableRulers: [
        { _type: 'reference', _ref: 'wiki-person-cleopatra-vii', _key: 'c' },
      ],
    })
    .commit();

  await client
    .patch('wiki-deity-horus')
    .set({
      associatedMonuments: [
        { _type: 'reference', _ref: 'wiki-monument-karnak', _key: 'k' },
        { _type: 'reference', _ref: 'wiki-monument-temple-hatshepsut', _key: 'th' },
      ],
      associatedDeities: [
        { _type: 'reference', _ref: 'wiki-deity-isis', _key: 'i' },
      ],
      primaryCultCenters: [
        { _type: 'reference', _ref: luxor._id, _key: 'luxor' },
      ],
    })
    .commit();

  await client
    .patch('wiki-deity-isis')
    .set({
      associatedDeities: [
        { _type: 'reference', _ref: 'wiki-deity-horus', _key: 'h' },
      ],
    })
    .commit();

  console.log('  ✓ wiki cross-references patched');

  // ─────────────────────────────────────────────────────────
  // Editorial — Author, Categories, Articles (EN+ES with translation
  // metadata so the document-internationalization plugin's language
  // switcher works in the Studio).
  // ─────────────────────────────────────────────────────────

  const articleHero = (
    assetId: string | null,
    alt: string,
    credit?: string
  ) => {
    if (!assetId) return undefined;
    return {
      _type: 'image',
      asset: { _type: 'reference', _ref: assetId },
      alt,
      ...(credit ? { credit } : {}),
    };
  };

  const author = await client.createOrReplace({
    _id: 'author-mostafa',
    _type: 'author',
    name: 'Mostafa Hassan',
    slug: { _type: 'slug', current: 'mostafa-hassan' },
    role: i18nString(
      'Founder & lead trip designer',
      'Fundador y diseñador principal de viajes',
      '創業者・主任ツアーデザイナー'
    ),
    bio: i18nPortable([
      block(
        "Mostafa has been operating tours through Egypt since 1995. He grew up in Cairo, studied Egyptology at Cairo University, and has been writing about how to actually travel through this country since long before there was a Travel2Egypt to write for. The voice you hear on this site is mostly his."
      ),
    ]),
    yearsInOperation: 30,
  });

  await client.createOrReplace({
    _id: 'category-planning',
    _type: 'editorialCategory',
    name: i18nString('Planning advice', 'Consejos de planificación', '旅の計画'),
    slug: i18nSlug('planning-advice', 'consejos-de-planificacion', 'planning-advice'),
    description: i18nString(
      'How to think about pacing, sequencing, and the small choices that separate a good Egypt trip from a tired one.',
      'Cómo pensar el ritmo, la secuencia y las pequeñas decisiones que distinguen un buen viaje a Egipto de uno agotador.',
      'ペース配分、訪問順、よいエジプト旅と疲れる旅を分ける細かな選択の考え方。'
    ),
    orderRank: 10,
  });

  await client.createOrReplace({
    _id: 'category-destination',
    _type: 'editorialCategory',
    name: i18nString('Destination depth', 'Profundidad de destino', '訪問先を深く知る'),
    slug: i18nSlug('destination-depth', 'profundidad-de-destino', 'destination-depth'),
    description: i18nString(
      'Operator-grade detail on specific cities, sites, and corners of Egypt — the depth that doesn\'t fit in a guidebook.',
      'Detalle al nivel de un operador sobre ciudades, sitios y rincones específicos de Egipto: la profundidad que no cabe en una guía.',
      'エジプトの特定都市・遺跡・隅々についてのオペレーター視点の深掘り情報 — ガイドブックには収まらない深度。'
    ),
    orderRank: 20,
  });

  console.log('  ✓ author + 2 categories');

  // ── Articles — three pairs of EN+ES, linked by translation.metadata ──
  const articles = [
    {
      enId: 'article-cairo-third-day-en',
      esId: 'article-cairo-third-day-es',
      categoryId: 'category-planning',
      heroAsset: img.cairo,
      heroCredit: 'Wikimedia Commons — Cairo article',
      en: {
        title: "Why Cairo's third day is the one that matters",
        slug: 'why-cairos-third-day-matters',
        deck: "Two days in Cairo is too short. The third day is when the city stops happening to you and you start choosing your relationship with it.",
        alt: 'Cairo Opera House and the Nile, late afternoon',
        body: [
          block(
            "We tell every first-time visitor: budget at least three full days for Cairo. Two days is too short — you spend day one disoriented and day two starting to find your feet, then leave. Three days is the threshold where the city stops happening to you and you start choosing your relationship with it."
          ),
          block(
            "Day one is the city happening to you. Traffic that operates on different rules than yours. A noise floor that never quite settles. Twenty-two million people in roughly the same physical envelope as Greater Tokyo. The first day is overwhelming for almost everyone."
          ),
          operatorNote(
            'honest',
            "If your itinerary forces a one-night Cairo, decline. We can build around it, but the result is a tourist's pyramid checklist rather than an Egyptian capital experience. Three nights minimum or it's not worth doing."
          ),
          block(
            "Day two is the calibration. The traffic still works the way it works; you just stop expecting it to work otherwise. The call to prayer that woke you at 4am the first morning becomes structural. The coffee at the corner of your hotel block becomes the best coffee you have anywhere in Egypt because the man making it has been making it the same way for thirty years."
          ),
          block(
            "Day three is the one that matters. By day three, the city stops being a problem to solve and becomes a place to be. Khan el-Khalili stops feeling chaotic and starts feeling like a small handful of streets you mostly know now. The Coptic museum becomes interesting on its own terms rather than as a stop on a list. Coffee at Café Riche or El Fishawy in the late afternoon, watching the city happen rather than trying to do it."
          ),
          operatorNote(
            'context',
            "If you can spare a fourth day, the Egyptian Museum at Tahrir is what we recommend — emptier now that most marquee items moved to the Grand Egyptian Museum, and that emptiness is its gift."
          ),
        ],
      },
      es: {
        title: 'Por qué el tercer día en El Cairo es el que cuenta',
        slug: 'por-que-tercer-dia-cairo-cuenta',
        deck: 'Dos días en El Cairo se quedan cortos. Al tercero, la ciudad deja de pasarte por encima y eliges tú la relación con ella.',
        alt: 'La Ópera de El Cairo y el Nilo, al atardecer',
        body: [
          block(
            'A todo viajero primerizo le decimos lo mismo: dedica al menos tres días completos a El Cairo. Dos días es muy poco — pasas el primero desorientado, el segundo empiezas a orientarte y ya te marchas. Tres días es el umbral en el que la ciudad deja de pasarte por encima y empiezas a elegir cómo relacionarte con ella.'
          ),
          block(
            'El primer día es la ciudad sucediéndote. Un tráfico que funciona con reglas distintas a las tuyas. Un ruido de fondo que no se calma del todo. Veintidós millones de personas en aproximadamente el mismo espacio físico que el Gran Tokio. Es abrumador para casi todo el mundo.'
          ),
          operatorNote(
            'honest',
            "Si tu itinerario te obliga a una sola noche en El Cairo, rechaza. Podemos construir alrededor, pero el resultado es una lista turística de pirámides, no la experiencia de la capital egipcia. Tres noches como mínimo o no merece la pena."
          ),
          block(
            'El segundo día es la calibración. El tráfico sigue funcionando como funciona; tú simplemente dejas de esperar que sea de otra manera. La llamada al rezo que te despertó a las 4 de la mañana del primer día se vuelve estructural.'
          ),
          block(
            'El tercer día es el que importa. La ciudad deja de ser un problema a resolver y se vuelve un lugar donde estar.'
          ),
        ],
      },
    },
    {
      enId: 'article-nile-cruise-calendar-en',
      esId: 'article-nile-cruise-calendar-es',
      categoryId: 'category-planning',
      heroAsset: img.classicPkg,
      heroCredit: 'Wikimedia Commons — Felucca article',
      en: {
        title: 'The Nile cruise calendar — when, on what',
        slug: 'nile-cruise-calendar',
        deck: "Most cruise marketing sells you on the boat. We mostly care about when you sail, on what kind of vessel, and which direction.",
        alt: 'A felucca on the Nile under sail',
        body: [
          block(
            "Almost everyone who comes to Egypt does some version of a Nile cruise. The standard product is a four-night Luxor-to-Aswan run on a 100-cabin floating hotel. It's fine. It's also not the only thing you can do, and depending on when you come, it's not the right thing for everyone."
          ),
          block(
            "October through April is the cruise season. Outside that, the boats either don't run or run with depleted crews and intermittent maintenance — we don't recommend it. May and September are shoulder; the temperature is bearable in the morning and afternoon, brutal at midday."
          ),
          operatorNote(
            'insider',
            "If you can travel in late November or early February, do. The light is good, the temperature is in the low 20s C, the boats aren't full, and the temple visits at Luxor and Edfu are still slow enough to feel like sites rather than queues."
          ),
          block(
            "The vessel matters less than people think and more than the brochure suggests. The 100-cabin standard cruisers are fine for most travelers; the smaller dahabiyas (8–12 cabins, sail-powered) are slower, more expensive, and the better experience if you want it. We tier our recommendations against your travel style — most of the conversation is which of these you actually want."
          ),
        ],
      },
      es: {
        title: 'Calendario del crucero por el Nilo: cuándo y en qué',
        slug: 'calendario-crucero-nilo',
        deck: 'La publicidad de cruceros te vende el barco. A nosotros nos importa más cuándo navegas, en qué tipo de embarcación y en qué dirección.',
        alt: 'Una faluca a vela en el Nilo',
        body: [
          block(
            'Casi todo el que viene a Egipto hace alguna versión de un crucero por el Nilo. El producto estándar son cuatro noches de Luxor a Asuán en un hotel flotante de 100 camarotes. Está bien. Tampoco es lo único que se puede hacer.'
          ),
          block(
            'De octubre a abril es la temporada de cruceros. Fuera de ahí, los barcos no operan o lo hacen con tripulaciones reducidas y mantenimiento irregular — no lo recomendamos.'
          ),
          operatorNote(
            'insider',
            'Si puedes viajar a finales de noviembre o principios de febrero, hazlo. La luz es buena, la temperatura ronda los 20 °C, los barcos no van llenos.'
          ),
        ],
      },
    },
    {
      enId: 'article-saqqara-before-giza-en',
      esId: 'article-saqqara-before-giza-es',
      categoryId: 'category-destination',
      heroAsset: img.saqqaraTour,
      heroCredit: 'Wikimedia Commons — Pyramid of Djoser article',
      en: {
        title: "Why we send some travelers to Saqqara before Giza",
        slug: 'saqqara-before-giza',
        deck: 'The pyramids you should see first are not always the pyramids you think.',
        alt: 'The Step Pyramid of Djoser at Saqqara',
        body: [
          block(
            "The standard Cairo itinerary is Pyramids and Sphinx on day one, Egyptian Museum on day two, Old Cairo on day three. It's the obvious order and it works. But for travelers with three or four days in Cairo, we sometimes flip it: Saqqara first, then Giza."
          ),
          block(
            "The argument is architectural. The Step Pyramid of Djoser at Saqqara is the first monumental stone building anywhere in the world. The Bent Pyramid at Dahshur is where the angle changes mid-construction once the original slope proved unstable. The Red Pyramid is the first geometrically true pyramid. By the time you stand at Giza, you've watched a 200-year experiment converge on what most people picture when they picture pyramids."
          ),
          operatorNote(
            'context',
            "Most first-time visitors do Giza on day one and feel they've understood Egyptian pyramids. Saqqara afterward shows the prototypes, the corrections, the architectural reasoning. Doing it in reverse — Saqqara first — means Giza arrives as a culmination rather than a starting point."
          ),
          block(
            "It's not the right order for every traveler. Iconic-photo travelers, repeat visitors, and tight schedules do Giza first; those are the cases where the obvious order is right. Architectural-history travelers, second-time-to-Egypt travelers, and travelers who are tired of being told what to feel about pyramids — those are the cases where Saqqara first works."
          ),
        ],
      },
      es: {
        title: 'Por qué a algunos viajeros los enviamos a Saqqara antes que a Giza',
        slug: 'saqqara-antes-de-giza',
        deck: 'Las pirámides que deberías ver primero no siempre son las que piensas.',
        alt: 'La pirámide escalonada de Zoser en Saqqara',
        body: [
          block(
            'El itinerario estándar de El Cairo es Pirámides y Esfinge el día uno, Museo Egipcio el día dos, Cairo antiguo el día tres. Es el orden obvio y funciona. Pero para viajeros con tres o cuatro días en El Cairo, a veces lo invertimos: Saqqara primero, después Giza.'
          ),
          block(
            'El argumento es arquitectónico. La Pirámide Escalonada de Zoser en Saqqara es el primer edificio monumental de piedra del mundo. La Pirámide Acodada de Dahshur es donde el ángulo cambia a media construcción cuando la pendiente original demostró ser inestable.'
          ),
          operatorNote(
            'context',
            'La mayoría de los visitantes primerizos hacen Giza el día uno y sienten que ya entendieron las pirámides egipcias. Saqqara después muestra los prototipos, las correcciones, el razonamiento arquitectónico.'
          ),
        ],
      },
    },
  ];

  for (const a of articles) {
    // EN
    await client.createOrReplace({
      _id: a.enId,
      _type: 'article',
      language: 'en',
      title: a.en.title,
      slug: { _type: 'slug', current: a.en.slug },
      deck: a.en.deck,
      category: { _type: 'reference', _ref: a.categoryId },
      author: { _type: 'reference', _ref: author._id },
      publishedAt: '2025-09-15T10:00:00Z',
      body: a.en.body,
      heroImage: articleHero(a.heroAsset, a.en.alt, a.heroCredit),
    });
    // ES
    await client.createOrReplace({
      _id: a.esId,
      _type: 'article',
      language: 'es',
      title: a.es.title,
      slug: { _type: 'slug', current: a.es.slug },
      deck: a.es.deck,
      category: { _type: 'reference', _ref: a.categoryId },
      author: { _type: 'reference', _ref: author._id },
      publishedAt: '2025-09-15T10:00:00Z',
      body: a.es.body,
      heroImage: articleHero(a.heroAsset, a.es.alt, a.heroCredit),
    });
    // Translation metadata so the Studio's language-switcher links them.
    await client.createOrReplace({
      _id: `translation.metadata.${a.enId.replace(/-en$/, '')}`,
      _type: 'translation.metadata',
      schemaTypes: ['article'],
      translations: [
        {
          _key: 'en',
          _type: 'internationalizedArrayReferenceValue',
          value: { _type: 'reference', _ref: a.enId },
        },
        {
          _key: 'es',
          _type: 'internationalizedArrayReferenceValue',
          value: { _type: 'reference', _ref: a.esId },
        },
      ],
    });
  }

  console.log('  ✓ 3 articles (EN + ES) with translation metadata');

  console.log('\nDone. Next:');
  console.log(`  → Open the Studio at http://localhost:3000/studio`);
  console.log(`  → Open the demo page at http://localhost:3000/guide/cairo`);
  console.log(`  → Try the locale switcher to see /es/guide/el-cairo and /ja/guide/cairo`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
