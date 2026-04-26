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

  console.log('\nDone. Next:');
  console.log(`  → Open the Studio at http://localhost:3000/studio`);
  console.log(`  → Open the demo page at http://localhost:3000/guide/cairo`);
  console.log(`  → Try the locale switcher to see /es/guide/el-cairo and /ja/guide/cairo`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
