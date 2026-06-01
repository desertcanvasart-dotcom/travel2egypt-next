/**
 * Seed the /travel-tips archive-settings document (`travelTipsArchive`).
 *
 * Run: npx tsx scripts/seed-travel-tips-archive.ts
 *
 * Idempotent (fixed _id + createOrReplace). EN-authored; ES/JA fall back to EN.
 * Editorial framing only — which tips sit in a department comes from each tip's
 * category reference. Cornerstone = "About Egypt". Departments are ordered for
 * reading; "Introducing Egypt" is omitted as a department because its only tip
 * is the cornerstone (it still appears in the contents index).
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
const dept = (key: string, categoryId: string, intro: string) => ({
  _key: key,
  _type: 'department',
  category: { _type: 'reference', _ref: categoryId },
  intro: intl(intro),
});

const essayBlocks = [
  para(
    'e1',
    "These are the answers we give most often before a first trip — the practical scaffolding that lets the rest of the trip be about Egypt rather than logistics. Visas, money, dress, getting around: settled once, then forgotten."
  ),
  para(
    'e2',
    'Start with About Egypt if the country is new to you. Otherwise, jump to the department you need — the full index of every tip sits at the bottom.'
  ),
  {
    _key: 'e3',
    _type: 'conciergeNote',
    body: [
      {
        _key: 'e3b',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _key: 'e3bs',
            _type: 'span',
            marks: [],
            text: "If your question isn't here, just ask. The practical details are the easy part to get right with a little local knowledge.",
          },
        ],
      },
    ],
  },
];

const doc = {
  _id: 'travelTipsArchive',
  _type: 'travelTipsArchive',
  kicker: intl('Before you go · Edition №7'),
  mastTitle: intl('Travel Tips'),
  tagline: intl(
    "The questions that come up before every first trip to Egypt — answered simply, and as we'd answer them privately."
  ),
  essayHeading: intl('How to use this page.'),
  essay: ptField(essayBlocks),
  cornerstone: {
    tip: { _type: 'reference', _ref: 'travelTip.about-egypt' },
    dek: intl(
      'What the country is actually like — geography, history, language, and the rhythms of daily life — before you arrive.'
    ),
  },
  departments: [
    dept(
      'd1',
      'travelTipCategory-practical-essentials',
      'Visas, money, connectivity, health — the handful of things to settle before you go.'
    ),
    dept(
      'd2',
      'travelTipCategory-getting-around',
      'Trains, domestic flights, taxis and apps — moving between the cities without friction.'
    ),
    dept(
      'd3',
      'travelTipCategory-culture-and-money',
      'Dress, tipping, Ramadan, and the small courtesies that make the days smoother.'
    ),
    dept(
      'd4',
      'travelTipCategory-when-to-go',
      'Season by season — heat, crowds, and the windows worth planning around.'
    ),
    dept('d5', 'travelTipCategory-food', 'What to eat, what to drink, and how to do both well.'),
    dept(
      'd6',
      'travelTipCategory-traveler-segments',
      'Families, solo travellers, accessibility — tips for the way you actually travel.'
    ),
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
