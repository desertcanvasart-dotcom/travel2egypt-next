/**
 * Seed the /private-day-tours archive-settings document (`dayToursArchive`).
 *
 * Run: npx tsx scripts/seed-day-tours-archive.ts
 *
 * Idempotent (fixed _id + createOrReplace). EN-authored; ES/JA fall back to EN.
 * Editorial copy is general (what a private day is, the tiers, how to use the
 * page); per-card copy comes from each tour's own summary. Curated references
 * point at real published tours and the existing city sub-pages.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'migration-staging';
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('Missing project id or write token');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2024-12-01', token, useCdn: false });

const intl = (value: string) => [{ _key: 'en', _type: 'object', value }];
const ptField = (blocks: unknown[]) => [{ _key: 'en', _type: 'object', value: blocks }];
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
const tourRef = (key: string, id: string) => ({ _key: key, _type: 'reference', _ref: id });

const essayBlocks = [
  para(
    'e1',
    'A private day is the difference between visiting Egypt and being herded through it. It runs for your party alone — two people or twelve — with a dedicated guide and vehicle, no minimum group size, and no waiting on other bookings. The guide reads the place; you set the pace.'
  ),
  heading('e2', 'Who it suits'),
  para(
    'e3',
    'Anyone who would rather not share a coach, anyone travelling with children or with limited time, anyone who wants to ask real questions and get real answers. It costs more than a seat on a group tour. It is worth it for most travellers and essential for some.'
  ),
  heading('e4', 'How a private day works'),
  para(
    'e5',
    'The day comes in tiers, so you only pay for what you want. Entrance fees in Egypt are revised often — keeping them separate keeps the base fare honest.'
  ),
  {
    _key: 'e6',
    _type: 'definitionList',
    items: [
      {
        _key: 't1',
        _type: 'definition',
        term: intl('Base'),
        description: intl('Private vehicle, licensed Egyptologist guide, water, and all logistics. The day itself.'),
      },
      {
        _key: 't2',
        _type: 'definition',
        term: intl('Base + Entrance Fees'),
        description: intl('The above, plus entry to every ticketed site on the route.'),
      },
      {
        _key: 't3',
        _type: 'definition',
        term: intl('Base + Entrance + Lunch'),
        description: intl('The full day — sites included, plus a proper sit-down lunch at a vetted spot.'),
      },
    ],
  },
  heading('e7', 'How to use this page'),
  para(
    'e8',
    "If you know your city, jump to the navigator below — every city opens to its own day tours. If you're shaping the trip, read the collections first: they group days by the kind of day rather than by place. The full index, filterable by city and length, is at the bottom."
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
            text: 'Do this before Giza, not after. Seeing the experiments first — the Step Pyramid, then the Bent and Red Pyramids — makes the Great Pyramid land as the achievement it was, rather than just the biggest one.',
          },
        ],
      },
    ],
  },
];

const navCity = (key: string, landingId: string, note: string) => ({
  _key: key,
  _type: 'navigatorCity',
  landing: { _type: 'reference', _ref: landingId },
  note: intl(note),
});

const doc = {
  _id: 'dayToursArchive',
  _type: 'dayToursArchive',
  kicker: intl('Day by day · Edition №7'),
  mastTitle: intl('Private Day Tours'),
  tagline: intl(
    'Guided days operated for your party alone — no group to wait on, no fixed script, a licensed Egyptologist, and the pace set by you.'
  ),
  essayHeading: intl('What a private day actually means.'),
  essay: ptField(essayBlocks),
  featured: {
    tour: { _type: 'reference', _ref: 'wp-page-87756' }, // Memphis, Saqqara & Dahshur
    dek: intl(
      "Egypt's first capital and the day the pyramid was invented — the Step Pyramid, the Bent Pyramid, and the Red Pyramid, in the order they were built."
    ),
    body: ptField(featuredBody),
  },
  collections: [
    {
      _key: 'c1',
      _type: 'themedCollection',
      kicker: intl('Collection №1'),
      title: intl('Half a day, well spent'),
      intro: intl('For arrival days, departure mornings, or when the heat wins by noon. Short, focused, and complete in themselves.'),
      layoutVariant: 'lead',
      tours: [
        tourRef('a1', 'wp-page-133463'), // Luxor Sunrise Balloon (hero)
        tourRef('a2', 'wp-page-87637'), // Sharm Sunset Quad Bike (hero)
        tourRef('a3', 'wp-page-115573'), // Sunset Snorkelling, Marsa Alam
      ],
    },
    {
      _key: 'c2',
      _type: 'themedCollection',
      kicker: intl('Collection №2'),
      title: intl('The essential days'),
      intro: intl('If you only have one day in a place, these are the ones — the monuments everyone comes for, given the time they deserve, without the coach.'),
      layoutVariant: 'trio',
      tours: [
        tourRef('b1', 'wp-page-87438'), // Aswan by Private Car & Guide
        tourRef('b2', 'wp-page-87309'), // Full Day Private Tour in Alexandria
        tourRef('b3', 'wp-page-135878'), // Luxor Full Day from Marsa Alam
      ],
    },
    {
      _key: 'c3',
      _type: 'themedCollection',
      kicker: intl('Collection №3'),
      title: intl('Beyond the obvious'),
      intro: intl('For the second visit, the longer stay, or the traveller who has already done Giza. Egypt with the crowds left behind.'),
      layoutVariant: 'pair',
      tours: [
        tourRef('c1t', 'wp-page-121071'), // Orange Bay private boat
        tourRef('c2t', 'wp-page-146018'), // Ramasside desert & snorkeling
      ],
    },
  ],
  navigator: {
    heading: intl('Where will you be?'),
    intro: intl('Private day tours run in nine cities. Each opens to its own days.'),
    items: [
      navCity('n1', 'tourLanding.cairo-private-day-tours', 'Pyramids, museums, the medieval city'),
      navCity('n2', 'tourLanding.luxor-private-day-tours', 'Karnak and the Valley of the Kings'),
      navCity('n3', 'tourLanding.aswan-private-day-tours', 'Philae, Nubia, the road to Abu Simbel'),
      navCity('n4', 'tourLanding.alexandria-private-day-tours', 'The Mediterranean city'),
      navCity('n5', 'tourLanding.hurghada-private-day-tours', 'Reef, desert, and day trips inland'),
      navCity('n6', 'tourLanding.sharm-el-sheikh-private-day-tours', 'Sinai, St Catherine, and the sea'),
      navCity('n7', 'tourLanding.marsa-alam-private-day-tours', 'Southern reef and desert'),
      navCity('n8', 'tourLanding.safaga-private-day-tours', 'Red Sea cruise-port days'),
      navCity('n9', 'tourLanding.al-gouna-private-day-tours', 'Lagoon-town day trips'),
    ],
  },
};

async function main() {
  const result = await client.createOrReplace(doc as any);
  console.log(`✓ Wrote ${result._id} (${result._type}) to ${dataset}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
