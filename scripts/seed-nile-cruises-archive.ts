/**
 * Seed the /nile-cruises archive-settings document (`nileCruisesArchive`).
 *
 * Run: npx tsx scripts/seed-nile-cruises-archive.ts
 *
 * Idempotent (fixed _id + createOrReplace). EN-authored; ES/JA fall back to EN.
 * Editorial copy is general (the four vessel kinds, when to sail); per-card copy
 * comes from each cruise's own summary. Curated references point at real
 * published cruises. No navigator (cruises aren't browsed by city).
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
const para = (key: string, text: string) => ({
  _key: key,
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [{ _key: `${key}s`, _type: 'span', marks: [], text }],
});
const heading = (key: string, text: string) => ({
  _key: key,
  _type: 'block',
  style: 'h3',
  markDefs: [],
  children: [{ _key: `${key}s`, _type: 'span', marks: [], text }],
});
const cruiseRef = (key: string, id: string) => ({ _key: key, _type: 'reference', _ref: id });

const essayBlocks = [
  para(
    'e1',
    'Almost every Nile cruise covers the same stretch — Luxor to Aswan, the temples of Edfu and Kom Ombo in between. What changes everything is the kind of vessel you do it on. A 300-guest floating hotel and a twelve-cabin dahabiya sail the same water and produce two completely different trips. Choose the boat first; the itinerary mostly follows.'
  ),
  heading('e2', 'The four kinds of vessel'),
  para('e3', 'This is the decision that matters. Each suits a different traveller and a different budget.'),
  {
    _key: 'e4',
    _type: 'definitionList',
    items: [
      {
        _key: 'v1',
        _type: 'definition',
        term: intl('Dahabiya'),
        description: intl(
          'Small sailing vessel, 8–12 cabins, under sail where the wind serves. Slow and quiet, stopping at small sites the big ships pass. The connoisseur’s Nile.'
        ),
      },
      {
        _key: 'v2',
        _type: 'definition',
        term: intl('Cruise ship'),
        description: intl(
          'The classic five-star floating hotel — pools, full board, sun decks. Comfortable and efficient: the standard Luxor–Aswan run.'
        ),
      },
      {
        _key: 'v3',
        _type: 'definition',
        term: intl('Steamer'),
        description: intl(
          'The historic boats — coal, brass, and teak, the Nile of the early 1900s. Few remain. For the romance of the period, not the pool deck.'
        ),
      },
      {
        _key: 'v4',
        _type: 'definition',
        term: intl('Lake Nasser'),
        description: intl(
          'A different river entirely — Aswan toward Abu Simbel, past the Nubian temples saved from the flood. Emptier, stranger, unforgettable.'
        ),
      },
    ],
  },
  heading('e5', 'When to sail, and which direction'),
  para(
    'e6',
    'October through April is the window — comfortable temperatures, the water at its kindest. Sailing upstream (Luxor to Aswan) usually adds a night over the downstream run, because you are working against the current — and that extra night is the one worth paying for.'
  ),
  heading('e7', 'How to use this page'),
  para(
    'e8',
    'If you already know the vessel you want, the collections below are grouped exactly that way. If you are deciding, read the four kinds above first, then filter the full index by vessel and route at the bottom.'
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
            text: 'Sail upstream and end in Aswan, not Luxor. You want to finish in the gentler city — the terrace at sunset and Philae — rather than back in workaday Luxor.',
          },
        ],
      },
    ],
  },
];

const doc = {
  _id: 'nileCruisesArchive',
  _type: 'nileCruisesArchive',
  kicker: intl('On the river · Edition №7'),
  mastTitle: intl('Nile Cruises'),
  tagline: intl(
    "The river is the spine of the country. The real choice isn't the route — it's the vessel you read it from."
  ),
  essayHeading: intl('Which boat is the whole decision.'),
  essay: ptField(essayBlocks),
  featured: {
    cruise: { _type: 'reference', _ref: 'wp-page-65273' }, // Nour El Nil Assouan (founding dahabiya, hero)
    dek: intl(
      'Twelve guests, under sail where the wind serves, mooring at the small temples the cruise ships skip — the river the way it travelled before the floating hotels arrived.'
    ),
    body: ptField(featuredBody),
  },
  collections: [
    {
      _key: 'c1',
      _type: 'themedCollection',
      kicker: intl('Collection №1'),
      title: intl('Dahabiyas — the slow way'),
      intro: intl('Small sail vessels for travellers who want the river quiet, the sites uncrowded, and the pace set by the wind rather than a schedule.'),
      layoutVariant: 'lead',
      cruises: [
        cruiseRef('d1', 'wp-page-64190'), // Meroe Dahabiya (hero)
        cruiseRef('d2', 'nileCruise.la-flaneuse-du-nil-dahabiya'),
        cruiseRef('d3', 'nileCruise.eyaru-dahabiya'),
      ],
    },
    {
      _key: 'c2',
      _type: 'themedCollection',
      kicker: intl('Collection №2'),
      title: intl('The grand ships'),
      intro: intl('The five-star floating hotels — comfortable, efficient, and the most straightforward way to see the temple stretch. The classic Nile cruise.'),
      layoutVariant: 'trio',
      cruises: [
        cruiseRef('s1', 'wp-page-64053'), // Swiss Inn Radamis II (hero)
        cruiseRef('s2', 'wp-page-64278'), // M/S Al-Jamila (hero)
        cruiseRef('s3', 'nileCruise.oberoi-philae-nile-cruise'),
      ],
    },
    {
      _key: 'c3',
      _type: 'themedCollection',
      kicker: intl('Collection №3'),
      title: intl('Steamers & Lake Nasser'),
      intro: intl('Two cruises for travellers who want something other than the standard run — the historic steamer, and the strange empty beauty of the southern lake.'),
      layoutVariant: 'pair',
      cruises: [
        cruiseRef('x1', 'nileCruise.steam-ship-sudan-nile-cruise'), // Steam Ship Sudan
        cruiseRef('x2', 'wp-page-64216'), // Kasr Ibrim (Lake Nasser, hero)
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
