/**
 * Seed the /hotels archive-settings document (`hotelsArchive`).
 *
 * Run: npx tsx scripts/seed-hotels-archive.ts
 *
 * Idempotent — uses a fixed _id and createOrReplace, so re-running overwrites
 * the same document. Authored EN-only; ES/JA fall back to EN via the GROQ
 * coalesce pattern, consistent with the rest of the migrated content.
 *
 * Editorial copy here is general (how we think about hotels, the grade
 * definitions, how to use the page) — it asserts no per-hotel facts. The
 * curated references point at real published hotels; their own summaries
 * supply the per-card copy.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'migration-staging';
const token =
  process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
  process.exit(1);
}
if (!token) {
  console.error('Missing SANITY write token (SANITY_STAGING_API_WRITE_TOKEN / SANITY_API_WRITE_TOKEN)');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

/** internationalized-array string/text value (EN only). */
const intl = (value: string) => [{ _key: 'en', _type: 'object', value }];

/** A localized-portable-text field with a single EN body. */
const ptField = (blocks: unknown[]) => [{ _key: 'en', _type: 'object', value: blocks }];

/** A plain paragraph block. */
const para = (key: string, text: string, markDefs: unknown[] = [], marks: string[] = []) => ({
  _key: key,
  _type: 'block',
  style: 'normal',
  markDefs,
  children: [{ _key: `${key}s`, _type: 'span', marks, text }],
});

const heading = (key: string, text: string) => ({
  _key: key,
  _type: 'block',
  style: 'h3',
  markDefs: [],
  children: [{ _key: `${key}s`, _type: 'span', marks: [], text }],
});

const ref = (key: string, id: string) => ({ _key: key, _type: 'reference', _ref: id });

const essayBlocks = [
  para(
    'e1',
    'A hotel is not a detail at the end of a trip. In Egypt it is often half the experience — the terrace where the Nile turns gold, the courtyard that keeps the city outside, the desert lodge with a sky you forgot existed. We list the properties we actually book travellers into, and we say why each one suits the trip it suits.'
  ),
  heading('e2', 'How we grade them'),
  para(
    'e3',
    'The star rating on the door and the experience inside are not the same thing. Our grades describe the second — what kind of stay it is, not how many facilities it counts.'
  ),
  {
    _key: 'e4',
    _type: 'definitionList',
    items: [
      {
        _key: 'g1',
        _type: 'definition',
        term: intl('Luxury'),
        description: intl(
          'Genuine top tier — service, setting, and a sense of occasion. You feel it the moment you arrive.'
        ),
      },
      {
        _key: 'g2',
        _type: 'definition',
        term: intl('Deluxe'),
        description: intl(
          'Excellent, reliable, well-run. The dependable choice in a city, without the luxury price.'
        ),
      },
      {
        _key: 'g3',
        _type: 'definition',
        term: intl('Boutique'),
        description: intl(
          'Small, characterful, often family-run. Chosen for atmosphere over amenities.'
        ),
      },
      {
        _key: 'g4',
        _type: 'definition',
        term: intl('Standard'),
        description: intl('Clean, central, honest. For trips where the hotel is a base, not the point.'),
      },
    ],
  },
  para('e5', 'Read the full Hotel Grade Concept →', [
    { _key: 'lnk', _type: 'externalLink', href: '/hotel-grade-concept', newTab: false },
  ], ['lnk']),
  heading('e6', "What we won't list"),
  para(
    'e7',
    "We don't take placement fees, and we don't list a property we wouldn't put our own travellers in. The absence of a famous name usually means we have a reason."
  ),
  heading('e8', 'How to use this page'),
  para(
    'e9',
    "If you know your city and your grade, skip to the index at the bottom and filter. If you're still shaping the trip, read the collections below — they group properties by the kind of stay rather than the star count, which is usually the more useful question."
  ),
];

const featuredBody = [
  {
    _key: 'fn',
    _type: 'conciergeNote',
    body: [
      {
        _key: 'fnb',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _key: 'fnbs',
            _type: 'span',
            marks: [],
            text: 'When you book a landmark hotel, the wing and the view matter more than the star count. Tell us what you want to wake up to and we will request the right room.',
          },
        ],
      },
    ],
  },
];

const doc = {
  _id: 'hotelsArchive',
  _type: 'hotelsArchive',
  kicker: intl('Where to stay · Edition №7'),
  mastTitle: intl('Hotels we recommend in Egypt'),
  tagline: intl(
    'Specific properties we work with — chosen because they suit a kind of traveller and a kind of trip, not because anyone paid for placement.'
  ),
  essayHeading: intl('How we think about where you sleep.'),
  essay: ptField(essayBlocks),
  featured: {
    hotel: { _type: 'reference', _ref: 'wp-page-62471' }, // Cairo Marriott (Gezira Palace)
    body: ptField(featuredBody),
  },
  collections: [
    {
      _key: 'c1',
      _type: 'themedCollection',
      kicker: intl('Collection №1'),
      title: intl('City landmarks'),
      intro: intl(
        "The hotels that come with a history attached. You don't just stay in them — you stay in the story of the city around them."
      ),
      layoutVariant: 'lead',
      hotels: [
        ref('h1', 'wp-page-63597'), // Cairo Pyramids Hotel (Giza)
        ref('h2', 'wp-page-63552'), // Hilton Luxor Resort & Spa
        ref('h3', 'wp-page-63641'), // Sonesta St. George, Luxor
      ],
    },
    {
      _key: 'c2',
      _type: 'themedCollection',
      kicker: intl('Collection №2'),
      title: intl('Red Sea, properly'),
      intro: intl(
        'Past the package-resort sprawl, the properties that actually earn the coast — for divers, for families, and for travellers who want the reef without the crowd.'
      ),
      layoutVariant: 'pair',
      hotels: [
        ref('h4', 'wp-page-62450'), // Rixos Premium Seagate, Sharm
        ref('h5', 'wp-page-63506'), // Premier Le Reve, Sahl Hasheesh
      ],
    },
    {
      _key: 'c3',
      _type: 'themedCollection',
      kicker: intl('Collection №3'),
      title: intl('Desert & oasis'),
      intro: intl(
        'Where the point is the silence, the stars, and the absence of everything else. Not for every trip — exactly right for the right one.'
      ),
      layoutVariant: 'trio',
      hotels: [
        ref('h6', 'wp-page-64066'), // Badawiya, Dakhla
        ref('h7', 'wp-page-64075'), // Dream Lodge, Siwa
        ref('h8', 'wp-page-83188'), // El Beyt Farm, Bahariya
      ],
    },
  ],
};

async function main() {
  const result = await client.createOrReplace(doc as any);
  console.log(`✓ Wrote ${result._id} (${result._type}) to ${dataset}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
