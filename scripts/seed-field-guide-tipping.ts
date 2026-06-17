/**
 * Seed Field Guide No. 03 — "Tipping, Honestly" — into Sanity.
 *
 * Idempotent (createOrReplace), dry-run by default, --commit to write.
 * First user of the generic `fieldGuide` doctype. Editorial copy
 * follows the spec — prose intro + five sections (framework, small
 * notes, consolidated tips, grey areas, currency) + closing reflection.
 *
 *   pnpm tsx scripts/seed-field-guide-tipping.ts
 *   pnpm tsx scripts/seed-field-guide-tipping.ts --commit
 */

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2';
const DOC_ID = 'fieldGuide-tipping-honestly';

const commit = process.argv.includes('--commit');

function die(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function getClient(): SanityClient {
  const isProd = DATASET === 'production';
  const token = isProd
    ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
      process.env.SANITY_API_WRITE_TOKEN
    : process.env.SANITY_STAGING_API_WRITE_TOKEN ||
      process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die(`No write token in env for dataset "${DATASET}"`);
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    token,
    useCdn: false,
  });
}

// ── i18n shape helpers ──────────────────────────────────────────────────
const en = (value: string) => [{ _key: 'en', value }];
const enSlug = (current: string) => [
  { _key: 'en', value: { _type: 'slug' as const, current } },
];

// ── Content ─────────────────────────────────────────────────────────────
const INTRO = `Most travel sites won't tell you how tipping works in Egypt. Some avoid it because they're worried it sounds mercenary; some include it as a vague "tipping is appreciated" line and move on. Neither serves you. The truth is that tipping in Egypt is woven into the service economy in a way that's different from most Western countries — service staff at hotels, on cruises, on tours, and in restaurants depend on it as part of their income. Knowing the framework before you arrive lets you participate gracefully rather than guess your way through it.

What follows is the framework we explain to our own travelers. It's specific, in current Egyptian pounds, and honest about the grey areas.`;

const SECTION_FRAMEWORK_BODY = `Tip small notes for short interactions as they happen. Tip larger, consolidated amounts at the end for people who worked with you across multiple days. Carry small denominations of Egyptian pounds — 10s, 20s, 50s — at all times; trying to tip with a 200-pound note when 20 is appropriate creates an awkward situation for everyone.

Don't tip in foreign currency unless you have nothing else. Egyptian pounds are what the recipient actually uses; euros and dollars require a trip to a money changer who'll take a cut. The exception is high-value end-of-trip tips for guides, where larger-denomination foreign currency is sometimes welcome.`;

const SECTION_GREY_BODY = `The "special access" tip at sites — a guard at a monument offers to take you to a normally-closed area, or to let you photograph a spot where photography is restricted — is technically corruption of site staff, and you're under no obligation to participate. The honest answer: it happens, locals navigate it pragmatically, and travelers should feel free to decline politely. If you do participate, 50-100 EGP is the going rate. We don't encourage it.

The "helper" who appears uninvited is the second uncomfortable case. Someone at a site walks up, starts explaining things you didn't ask about, then expects a tip. Polite firmness — "Lā shukran" with a smile, kept walking — works. If you allowed several minutes of explanation, 20-50 EGP is fair.

The persistent vendor isn't tipping but is related: vendors at sites sometimes follow you persistently. The cultural norm is firm "lā shukran" repeated calmly, not anger.

Tipping for photos with people — if someone offered to be in your photo (camel handler, costumed performer), 20-50 EGP is expected. If you took someone's photo without asking, don't. Ask first, expect to tip.`;

const SECTION_CURRENCY_BODY = `Before you arrive in Egypt, change a small amount of foreign currency to Egyptian pounds at your home country's exchange — enough for the first day of tipping. Once in Egypt, withdraw from ATMs (much better rates than hotels). Ask for small denominations when withdrawing; ATMs sometimes dispense only 200-pound notes, which are useless for most tipping situations.

Keep tip money separate from your spending money. A small zippered compartment with 10s, 20s, and 50s prevents the "do I really want to break this 100 for a 20-pound tip?" moment that creates awkwardness.`;

const CLOSING = `Egypt's tipping culture is real, pervasive, and not going away. Most first-time travelers find it overwhelming for the first day or two, and then it becomes background — small notes given as part of the rhythm of moving through a country where service work is still largely cash-based and personally compensated.

The framework above is what we tell our own travelers before they arrive. It's specific, sometimes uncomfortable, and honest. We'd rather you know than guess.`;

// ── Tip-row data ────────────────────────────────────────────────────────
type TipRowSpec = { recipient: string; amount: string; context?: string };

const SMALL_NOTES_ROWS: TipRowSpec[] = [
  {
    recipient: 'Porters at hotels',
    amount: '20–50 EGP per bag',
    context: 'On arrival and on departure. The going rate climbs with luggage size, not status of the hotel.',
  },
  {
    recipient: 'Hotel housekeeping',
    amount: '50–100 EGP per night',
    context: 'Left on the pillow on the last day, or daily if housekeeping rotates between staff.',
  },
  {
    recipient: 'Taxi drivers (street, not pre-arranged)',
    amount: 'Round up the fare',
    context: 'Add 20–50 EGP if they helped with luggage. Pre-arranged drivers are handled at end-of-trip.',
  },
  {
    recipient: 'Restaurant servers',
    amount: '10% of the bill',
    context: 'At standard restaurants. Service charge on the bill is real and goes to staff; at better places an extra 5–10% in cash is customary on top of it.',
  },
  {
    recipient: 'Café and street food',
    amount: 'A few coins',
    context: 'Not strictly necessary but appreciated. Small notes work too if you have them.',
  },
  {
    recipient: 'Bathroom attendants',
    amount: '5–10 EGP',
    context: 'On leaving. Universal in public spaces and at tourist sites; expected even when there\'s no tray on the counter.',
  },
  {
    recipient: 'Site staff with a "special" view or unlocked room',
    amount: '20–50 EGP',
    context: 'Optional. Navigate carefully — see "The grey areas" below.',
  },
];

const CONSOLIDATED_ROWS: TipRowSpec[] = [
  {
    recipient: 'Egyptologist guide on a multi-day tour',
    amount: '$30–60 USD per day, per party',
    context: 'Given as a single envelope at the end of the trip. Adjust upward for exceptional service or large parties.',
  },
  {
    recipient: 'Driver on a multi-day tour',
    amount: '$15–25 USD per day, per party',
    context: 'Same end-of-trip envelope convention as the guide; drivers often work the full circuit with the same party.',
  },
  {
    recipient: 'Nile cruise crew (collective)',
    amount: '$30–50 USD per traveler',
    context: 'For a 3–4 night cruise. Often distributed via a tip box on the ship or handed to the cruise manager to allocate.',
  },
  {
    recipient: 'Cabin attendant on a cruise',
    amount: '$20–30 USD per traveler',
    context: 'For a 3–4 night cruise. Given separately to the cabin steward, not in the crew pool.',
  },
  {
    recipient: 'Day-tour guide',
    amount: '$20–30 USD per party, per day',
    context: 'Handed at the end of the day. If multiple parties share the guide, each party tips its share.',
  },
];

const SMALL_NOTES_OP = `The 5–10 EGP bathroom-attendant tip catches every first-time visitor off guard. Carry enough small notes that you're never digging for change. The amounts are small but the frequency is real.`;

const CONSOLIDATED_OP = `These are guidelines, not rules. What matters most is the gesture's honesty — give what reflects the quality of service you received. Underpaying when service was excellent is felt; overpaying when service was poor sets unrealistic expectations for the next traveler. Most guides and drivers won't ask, but their economic dependence on tips is real.`;

const GREY_OP = `These situations frustrate travelers more than the standard tips because they feel like extraction rather than service. The cultural reality is that many of these workers are paid badly or not at all, and tips bridge the gap. That doesn't obligate you to participate in every interaction, but it helps to understand the economics behind them.`;

// ── Build the document ──────────────────────────────────────────────────
const rows = (specs: TipRowSpec[], keyPrefix: string) =>
  specs.map((r, i) => ({
    _key: `${keyPrefix}-${i}`,
    _type: 'tipRow',
    recipient: en(r.recipient),
    amount: r.amount,
    context: r.context ? en(r.context) : undefined,
  }));

const doc = {
  _id: DOC_ID,
  _type: 'fieldGuide',
  title: en('Tipping,'),
  titleAccent: en('Honestly'),
  slug: enSlug('tipping-honestly'),
  seriesNumber: 'No. 03',
  order: 30,
  region: en('Egypt, end to end'),
  tagSummary: en('Tipping'),
  standfirstLead: en('Egypt runs on small notes.'),
  standfirstAccent: en(
    "Here's how much, when, and to whom — written by people who've watched it from both sides.",
  ),
  intro: en(INTRO),
  sections: [
    {
      _key: 'framework',
      _type: 'section',
      title: en('The framework, in one paragraph'),
      body: en(SECTION_FRAMEWORK_BODY),
      emphasized: false,
    },
    {
      _key: 'smallNotes',
      _type: 'section',
      title: en('Small notes, as you go'),
      tipRows: rows(SMALL_NOTES_ROWS, 'small'),
      operatorNote: en(SMALL_NOTES_OP),
      emphasized: false,
    },
    {
      _key: 'consolidated',
      _type: 'section',
      title: en('Consolidated tips, at the end'),
      tipRows: rows(CONSOLIDATED_ROWS, 'cons'),
      operatorNote: en(CONSOLIDATED_OP),
      emphasized: false,
    },
    {
      _key: 'greyAreas',
      _type: 'section',
      title: en('The grey areas'),
      body: en(SECTION_GREY_BODY),
      operatorNote: en(GREY_OP),
      emphasized: true,
    },
    {
      _key: 'currency',
      _type: 'section',
      title: en('A note on currency'),
      body: en(SECTION_CURRENCY_BODY),
      emphasized: false,
    },
  ],
  closing: en(CLOSING),
  colophonNote: en(
    'Field guide · current Egyptian pounds · honest about the grey areas',
  ),
};

async function run() {
  const mode = commit ? 'COMMIT' : 'DRY-RUN';
  console.log(`\n— Tipping, Honestly seed (${mode}) —`);
  console.log(`  dataset:  ${DATASET}`);
  console.log(`  doc:      ${DOC_ID}`);
  console.log(`  slug:     tipping-honestly`);
  console.log(`  sections: ${doc.sections.length}`);
  const totalRows = doc.sections.reduce(
    (n, s) => n + ((s as any).tipRows?.length ?? 0),
    0,
  );
  console.log(`  tipRows:  ${totalRows}\n`);

  if (!commit) {
    console.log(`(dry-run — re-run with --commit to write)`);
    return;
  }

  const client = getClient();
  await client.createOrReplace(doc as any);
  console.log(`  ✓ ${DOC_ID}`);
  console.log(`\nDone.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
