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
  });

  console.log('  ✓ 2 tours (1 day tour, 1 package)');

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
