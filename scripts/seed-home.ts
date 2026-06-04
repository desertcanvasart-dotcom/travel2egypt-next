/**
 * Seed the homePage singleton (id: `homePage`) for the v2 homepage.
 *  - travellerCards (6): title / dek / href  — links to real entrances
 *  - guideCards (4): title / dek / href=/guide
 *  - startingPoints (4): real tour reference + editorial meta/title/dek
 *
 * Copy is the reference draft (flagged for team review). New text fields are
 * EN-only internationalized arrays; es/ja coalesce to EN via localizedField.
 * migration-staging only. Dry-run by default; pass --commit to write.
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

const S = (v: string) => [{ _key: 'en', _type: 'internationalizedArrayStringValue', value: v }];
const T = (v: string) => [{ _key: 'en', _type: 'internationalizedArrayTextValue', value: v }];
let n = 0;
const key = (p: string) => `${p}${(n++).toString(36)}`;

const travellerCards = [
  { t: 'First time in Egypt', d: 'Cairo, the Pyramids, a Nile cruise, Luxor and Aswan — the essential story, and what not to rush.', h: '/egypt-travel-packages' },
  { t: 'The cultural traveller', d: 'Islamic and Coptic Cairo, Luxor, Abydos, Nubian Aswan, the desert monasteries.', h: '/guide' },
  { t: 'Travelling as a family', d: 'Cairo, a Nile cruise and Red Sea rest — culture, comfort and breathing space, paced for children.', h: '/packages/9-day-classic-egypt-family-adventure' },
  { t: 'Desert & quiet', d: "Bahariya, the White Desert and Fayoum — Egypt's silence as much as its temples.", h: '/packages/10-day-nile-and-western-desert-tour' },
  { t: 'Travelling in style', d: 'Private guiding, the finest boats on the Nile, landmark hotels, and every transfer handled.', h: '/nile-cruises' },
  { t: 'Coming back', d: 'Middle Egypt, Alexandria, the desert oases, the specialist sites a first trip leaves out.', h: '/guide' },
];

const guideCards = [
  { t: 'How Egypt is laid out', d: 'Cairo, the Nile Valley, the Red Sea, Sinai, the Delta and the Western Desert — and how they connect.' },
  { t: 'First-trip route logic', d: 'What belongs in a first Egypt trip, what can wait for a second, and what to give the most time.' },
  { t: 'The cities that matter', d: 'Cairo, Giza, Luxor, Aswan, Alexandria, Abu Simbel and beyond — ranked honestly, not alphabetically.' },
  { t: 'Specialist Egypt', d: 'The monasteries, Middle Egypt, the desert oases, Nubian culture, Islamic Cairo — for the deeper trip.' },
];

// editorial title/dek + meta (reference draft); each wired to the closest real journey by EN slug.
const startingPoints = [
  { slug: '10-days-nile-dreamer-tour-experience', meta: '9–11 days', t: 'The First Egypt Journey', d: 'Cairo, a Nile cruise, Luxor and Aswan — the essential story without rushing.' },
  { slug: '7-days-dahabiya-nile-cruise-from-aswan-to-luxor', meta: '8 days', t: 'The Slow Nile Journey', d: 'A dahabiya, Luxor and Aswan, the quieter river stops. Atmosphere over checklist.' },
  { slug: '10-day-nile-and-western-desert-tour', meta: '7–9 days', t: 'The Desert & Nile Journey', d: 'Cairo, Bahariya, the White Desert, then the river. Silence as much as temples.' },
  { slug: '9-day-classic-egypt-family-adventure', meta: '10 days', t: 'The Family Egypt Journey', d: 'Cairo, a Nile cruise and Red Sea rest — culture, comfort and breathing space.' },
];

async function main() {
  console.log(`seed-home — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`);

  const sp = [];
  for (const s of startingPoints) {
    const id = await client.fetch<string | null>(
      `*[_type=="tour" && slug[_key=="en"][0].value.current==$slug][0]._id`, { slug: s.slug });
    if (!id) { console.warn(`  ⚠ NO MATCH for ${s.slug} — leaving reference empty (FLAG)`); }
    else console.log(`  ✓ ${s.t} → ${s.slug} (${id})`);
    sp.push({
      _key: key('sp'), _type: 'startingPoint',
      ...(id ? { tour: { _type: 'reference', _ref: id } } : {}),
      meta: S(s.meta), title: S(s.t), dek: T(s.d),
    });
  }

  const doc = {
    _id: 'homePage', _type: 'homePage',
    heroCaption: S('Western Desert, golden hour'),
    travellerCards: travellerCards.map((c) => ({ _key: key('tc'), _type: 'travellerCard', title: S(c.t), dek: T(c.d), href: c.h })),
    guideCards: guideCards.map((c) => ({ _key: key('gc'), _type: 'guideCard', title: S(c.t), dek: T(c.d), href: '/guide' })),
    startingPoints: sp,
  };

  console.log(`\nhomePage: ${doc.travellerCards.length} traveller, ${doc.guideCards.length} guide, ${doc.startingPoints.length} starting points`);
  if (COMMIT) {
    await client.createOrReplace(doc);
    console.log('\n✓ homePage written (createOrReplace). DONE.');
  } else {
    console.log('\nDRY RUN — re-run with --commit to write.');
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
