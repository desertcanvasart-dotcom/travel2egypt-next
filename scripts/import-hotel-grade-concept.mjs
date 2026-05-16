#!/usr/bin/env node
/**
 * Session 34 — Create the Hotel Grade Concept editorialPage doc.
 *
 * Copy source: migration/content/hotel-grade-concept-copy.md (operator
 * polished). Sections are hand-mapped to the editorialPage schema fields
 * — not a generic markdown→PT walker, because the doc has a specific
 * shape (hero / 2 body sections / ribbon / bottom CTA) and the source
 * MD has authoring comments + TODOs we don't import.
 *
 * Usage:
 *   node scripts/import-hotel-grade-concept.mjs            # dry-run summary
 *   node scripts/import-hotel-grade-concept.mjs --commit   # write to Sanity
 */
import { createClient } from '@sanity/client';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
  })
);
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const COMMIT = process.argv.includes('--commit');
const DOC_ID = 'editorial-page-hotel-grade-concept';

const k = () => randomBytes(6).toString('hex');

/** Build a simple PT block. Bold runs flagged with **markdown** in input. */
function ptBlock(text, style = 'normal') {
  // Parse **bold** runs inline
  const children = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) {
      children.push({ _type: 'span', _key: k(), text: text.slice(last, m.index), marks: [] });
    }
    children.push({ _type: 'span', _key: k(), text: m[1], marks: ['strong'] });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    children.push({ _type: 'span', _key: k(), text: text.slice(last), marks: [] });
  }
  return {
    _type: 'block',
    _key: k(),
    style,
    markDefs: [],
    children: children.length ? children : [{ _type: 'span', _key: k(), text, marks: [] }],
  };
}

// ── Section bodies (sourced from migration/content/hotel-grade-concept-copy.md) ──

const howTheGradesWorkBlocks = [
  ptBlock(
    "Not every 5-star is the same. International star ratings cover wide ground — a 5-star in Cairo may sit beside another 5-star with twice the rate and triple the polish. Travellers shouldn't have to parse that themselves."
  ),
  ptBlock(
    "We've grouped our 5-star inventory into three tiers, based on rooms we've actually stayed in, kitchens we've actually eaten in, and front-desk teams we've actually dealt with at 11pm when something needed solving."
  ),
  ptBlock(
    "**S — Standard Five-Star.** Classic international comfort. Reliable rooms, good service, mainstream brands. Best value within the 5-star tier."
  ),
  ptBlock(
    "**D — Deluxe Five-Star.** Refined style and upgraded amenities. Better rooms, dining, and service. The right step up for travellers who want a little more polish."
  ),
  ptBlock(
    "**L — Luxury Five-Star.** Top-tier properties with exceptional service and design. Flagship international brands, Egypt's iconic addresses, and a few well-kept secrets."
  ),
];

const whyThisMattersBlocks = [
  ptBlock(
    "Egypt's hotel landscape changes faster than star ratings keep up with. New brands open, old ones change hands, service drifts. Our grades reflect what the property is actually like this season, not what it was rated five years ago."
  ),
  ptBlock(
    "Every hotel on our shortlist has been visited, tested, and re-tested. We update categorization as service evolves, and we drop properties when they don't hold the line."
  ),
];

const i18nText = (value) => [{ _key: 'en', value }];
const i18nPt = (blocks) => [{ _key: 'en', _type: 'object', value: blocks }];

const doc = {
  _id: DOC_ID,
  _type: 'editorialPage',
  kind: 'hotel-grade-concept',
  title: 'Hotel Grade Concept',
  slug: [{ _key: 'en', value: { _type: 'slug', current: 'hotel-grade-concept' } }],
  lastUpdated: '2026-05-16',

  heroHeading: i18nText('Our Hotel Grade Concept'),
  heroSubhead: i18nText(
    'Three clear levels of 5-star stays across Egypt — S (Standard), D (Deluxe), and L (Luxury). Hand-picked for service and consistency.'
  ),
  heroPrimaryCta: {
    label: i18nText('Plan with an Egyptologist'),
    href: '/plan-your-tour?context=hotel-grade-concept',
  },
  heroSecondaryCta: {
    label: i18nText('See the Shortlist'),
    href: '#tiers',
  },

  sections: [
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('How the grades work'),
      body: i18nPt(howTheGradesWorkBlocks),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('Why this matters'),
      body: i18nPt(whyThisMattersBlocks),
    },
  ],

  ribbonBody: i18nText(
    "Not sure which tier fits? Tell us your comfort level and pace — we'll match you to the right hotel in every city, and lock in our negotiated rates."
  ),
  ribbonCta: {
    label: i18nText('Request a Shortlist'),
    href: '/plan-your-tour?context=hotel-grade-concept-shortlist',
  },

  bottomCtaHeading: i18nText('Ready to start building your trip?'),
  bottomCtaBody: i18nText(
    "Tell us how you like to travel — pace, style, budget — and we'll match you to the right hotels in every city. Itinerary first, hotels chosen around it."
  ),
  bottomCtaPrimary: {
    label: i18nText('Start Planning Your Journey'),
    href: '/plan-your-tour',
  },
  bottomCtaSecondary: {
    label: i18nText('Get Expert Advice'),
    href: '/plan-your-tour?context=expert-advice',
  },
};

console.log(`Mode: ${COMMIT ? 'COMMIT (writes to Sanity)' : 'DRY-RUN'}`);
console.log(`Dataset: ${env.NEXT_PUBLIC_SANITY_DATASET}`);
console.log(`Doc _id: ${doc._id}`);
console.log(`Sections: ${doc.sections.length}`);
console.log(`How-grades blocks: ${howTheGradesWorkBlocks.length}`);
console.log(`Why-matters blocks: ${whyThisMattersBlocks.length}`);
console.log(`Hero CTAs: ${doc.heroPrimaryCta.href}, ${doc.heroSecondaryCta.href}`);

if (!COMMIT) {
  console.log('Re-run with --commit to write to Sanity.');
  process.exit(0);
}

const result = await client.createOrReplace(doc, { visibility: 'sync' });
console.log(`\n=== Wrote ${result._id} ===`);
