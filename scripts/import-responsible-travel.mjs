#!/usr/bin/env node
/**
 * Session 36 — Create the Responsible Travel editorialPage doc.
 *
 * Source copy: migration/content/responsible-travel-prep.md (operator
 * polished, FINAL). Sections are hand-mapped — same approach as the
 * Hotel Grade Concept import (session 34): the source has authoring
 * notes + a decisions log we don't import.
 *
 * Usage:
 *   node scripts/import-responsible-travel.mjs            # dry-run
 *   node scripts/import-responsible-travel.mjs --commit   # write to Sanity
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
const DOC_ID = 'editorial-page-responsible-travel';
const WHATSAPP_CTA_HREF =
  'https://wa.me/201158011600?text=' +
  encodeURIComponent(
    "Hi Travel2Egypt, I read your Responsible Travel page and would like to plan a trip that reflects these values."
  );

const k = () => randomBytes(6).toString('hex');

/** Build PT block. Supports **bold** + *italic* inline marks. */
function ptBlock(text, style = 'normal', listItem) {
  // Tokenize bold and italic. Bold takes priority (longer pattern).
  const spans = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index), marks: [] });
    if (m[2]) spans.push({ text: m[2], marks: ['strong'] });
    else if (m[4]) spans.push({ text: m[4], marks: ['em'] });
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), marks: [] });
  if (spans.length === 0) spans.push({ text, marks: [] });
  const block = {
    _type: 'block',
    _key: k(),
    style,
    markDefs: [],
    children: spans.map((s) => ({ _type: 'span', _key: k(), text: s.text, marks: s.marks })),
  };
  if (listItem) {
    block.listItem = listItem;
    block.level = 1;
  }
  return block;
}

// ── Section bodies — sourced from migration/content/responsible-travel-prep.md ──

const sectionWhatWeMean = [
  ptBlock(
    "\"Responsible travel\" is a phrase that gets used loosely. For us, it means something specific and measurable: the people who actually deliver your trip — guides, drivers, hotel staff, boat crews, restaurant cooks — are local, fairly paid, and stable in their work. The income from your trip stays in Egypt."
  ),
  ptBlock("That's the core of it."),
  ptBlock(
    "We're not running a comprehensive sustainability program. We don't have a formal carbon offset partnership or a third-party ESG audit. What we have is three decades of operating in Egypt and knowing which suppliers treat their people well and which don't — and choosing the first kind."
  ),
];

const sectionWhereMoneyGoes = [
  ptBlock('Prioritizing locally owned businesses', 'h3'),
  ptBlock(
    "We work with locally owned hotels, family-run guesthouses, Egyptian-managed Nile boats, and restaurants where the kitchen is run by someone who lives in the same town."
  ),
  ptBlock(
    "International brands have their place in our shortlist — Sofitel Old Cataract in Aswan, Four Seasons properties, the iconic addresses on the Nile — those are tier-defining properties for a reason. But the bulk of our supplier base is Egyptian-owned. When you book a \"local restaurant for lunch in Aswan\" with us, it's actually local. The income from your meal stays with the family who runs the kitchen."
  ),

  ptBlock('Fair employment practices', 'h3'),
  ptBlock(
    "The Egyptian tourism economy runs on seasonal cycles — busy from October to April, quiet through summer. The suppliers we work with are ones that keep their staff employed year-round, not the ones that lay off drivers and waiters in May."
  ),
  ptBlock(
    "The workers booked through us have insurance and safe working conditions, not gig-economy precarity. We pay rates that allow our suppliers to do the same with their staff."
  ),
  ptBlock(
    "This costs more than the alternative. We pass that cost through honestly in our pricing rather than absorbing it by paying suppliers less."
  ),

  ptBlock("Women's empowerment", 'h3'),
  ptBlock(
    "Egyptian tourism remains male-dominated, especially in guide and driver roles. Where female-led businesses exist, we actively work with them:"
  ),
  ptBlock('Women-run culinary workshops and home-cooking experiences', 'normal', 'bullet'),
  ptBlock('Female guides where we can place them', 'normal', 'bullet'),
  ptBlock('Craft cooperatives organized by women in oasis communities', 'normal', 'bullet'),
  ptBlock('Women-led hospitality businesses', 'normal', 'bullet'),
  ptBlock(
    "This is a slower-than-we'd-like trend in the industry. The path forward is to use what we book to support the businesses that exist, and we do."
  ),

  ptBlock('Community projects we support', 'h3'),
  ptBlock('Concrete things we contribute to, alongside our normal trip operations:'),
  ptBlock(
    '**School support** in oasis communities — educational supplies, basic infrastructure, materials',
    'normal',
    'bullet'
  ),
  ptBlock('**Village clean-up campaigns**', 'normal', 'bullet'),
  ptBlock(
    '**Palm tree planting projects** — palms are economic infrastructure as well as cultural heritage in oasis regions',
    'normal',
    'bullet'
  ),
  ptBlock(
    '**Medical caravans** in remote areas where access to healthcare is limited',
    'normal',
    'bullet'
  ),
  ptBlock(
    '**Educational support for children** in under-served communities',
    'normal',
    'bullet'
  ),
  ptBlock(
    "These aren't marketing programs. They're things we do because we've been operating in these communities for 30+ years and the relationships matter more than the photo opportunities."
  ),
];

const sectionEconomicRealities = [
  ptBlock(
    "The contrast between the cost of a luxury Egyptian holiday and the daily wages of the people delivering it can be striking. A 5-star Nile cruise cabin can cost more per night than a Nile boat crew member earns in a week."
  ),
  ptBlock(
    "We don't think travelers should be uncomfortable about this. But we don't think it should be invisible either."
  ),
  ptBlock(
    "The path forward isn't to charge less — Egypt's hospitality industry needs foreign tourism revenue to function. The path forward is to make sure the money you spend supports the people doing the work. That's why we choose suppliers carefully, pay them fairly, and have the relationships to know what's actually happening on the ground."
  ),
  ptBlock(
    "Tourism done right is one of the most direct ways foreign capital reaches Egyptian families. Done badly, it's an extraction industry that benefits distant shareholders and leaves communities worse off. We try to do it right."
  ),
];

const sectionWhatThisIsnt = [
  ptBlock("A few things you might expect to see here that we haven't claimed:"),
  ptBlock(
    "**Carbon offsetting.** We don't have a formal offset program. Nile cruises in particular are emissions-heavy per passenger, and we won't pretend otherwise. If carbon footprint is central to your travel decisions, dahabiya cruises (wind-powered, traditional sailing) are the lower-impact alternative — ask us about them."
  ),
  ptBlock(
    "**Third-party sustainability certifications.** We're members of established industry associations (JATA, IATA, ASTA, ETAA). We haven't pursued a B-Corp or similar third-party sustainability certification. It's a future possibility we've considered but haven't acted on."
  ),
  ptBlock(
    "**Comprehensive ESG reporting.** We're a small founder-led operation, not a public company. Our practices are what we describe on this page, not a formal annual report."
  ),
  ptBlock(
    "This is what we honestly do. It's a real program, not greenwashing. It's also not the full story of what responsible tourism in Egypt could look like — there's more we could do, and we know it."
  ),
];

const sectionIfValuesMatch = [
  ptBlock(
    "If you want a trip designed around suppliers who treat their people well, in communities where your spending makes a difference, just tell us. Every itinerary we propose is hand-built around the operators we trust, and we're happy to lean further into community-focused options if that's what you're looking for."
  ),
];

const i18nText = (value) => [{ _key: 'en', value }];
const i18nPt = (blocks) => [{ _key: 'en', _type: 'object', value: blocks }];

const doc = {
  _id: DOC_ID,
  _type: 'editorialPage',
  kind: 'responsible-travel',
  title: 'Responsible Travel',
  slug: [{ _key: 'en', value: { _type: 'slug', current: 'responsible-travel' } }],
  lastUpdated: '2026-05-16',

  heroHeading: i18nText('Responsible Travel'),
  heroSubhead: i18nText(
    'What it means when you travel with us — and where your money actually goes.'
  ),
  heroPrimaryCta: {
    label: i18nText('Talk to us on WhatsApp'),
    href: WHATSAPP_CTA_HREF,
  },
  // Hero secondary CTA omitted — single CTA is cleaner than a second weak link.

  sections: [
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('What we mean by responsible travel'),
      body: i18nPt(sectionWhatWeMean),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('Where your money goes'),
      body: i18nPt(sectionWhereMoneyGoes),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('The economic realities behind your trip'),
      body: i18nPt(sectionEconomicRealities),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText("What this page isn't"),
      body: i18nPt(sectionWhatThisIsnt),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('If these values match yours'),
      body: i18nPt(sectionIfValuesMatch),
    },
  ],

  // No mid-page ribbon for this page — the editorial reads better as
  // continuous prose without a persuasion band interrupting it.

  bottomCtaHeading: i18nText('Plan a trip that reflects these values'),
  bottomCtaBody: i18nText(
    "Tell us what matters to you — community impact, local suppliers, lower-emission cruise options. We'll build the itinerary around it."
  ),
  bottomCtaPrimary: {
    label: i18nText('Talk to us on WhatsApp'),
    href: WHATSAPP_CTA_HREF,
  },
};

console.log(`Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}`);
console.log(`Dataset: ${env.NEXT_PUBLIC_SANITY_DATASET}`);
console.log(`Doc _id: ${doc._id}`);
console.log(`Sections: ${doc.sections.length}`);
for (const s of doc.sections) {
  const blocks = s.body[0].value;
  const totalChars = blocks.reduce(
    (acc, b) => acc + b.children.reduce((a, c) => a + (c.text?.length || 0), 0),
    0
  );
  const counts = blocks.reduce((acc, b) => {
    const key = b.listItem ? `list-${b.listItem}` : b.style;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  console.log(`  ${s.heading[0].value.padEnd(45)} ${blocks.length} blocks, ${totalChars} chars, ${JSON.stringify(counts)}`);
}
console.log(`Hero primary CTA: ${doc.heroPrimaryCta.href.slice(0, 80)}…`);
console.log(`Bottom CTA: ${doc.bottomCtaPrimary.href.slice(0, 80)}…`);

if (!COMMIT) {
  console.log('Re-run with --commit to write to Sanity.');
  process.exit(0);
}

const result = await client.createOrReplace(doc, { visibility: 'sync' });
console.log(`\n=== Wrote ${result._id} ===`);
