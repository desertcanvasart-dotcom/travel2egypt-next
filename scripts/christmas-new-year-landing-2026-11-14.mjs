// Owner-locked 2026-11-14 ("Lock it, build page"):
// review/content/christmas-new-year-page-2026-11-14-en.md (EN only; ES/JA later).
// node scripts/christmas-new-year-landing-2026-11-14.mjs [--apply] [--publish]
//   --apply    writes the theme (published; it renders nothing by itself) and the
//              landing as a DRAFT (drafts.tourLanding…), so nothing goes live.
//   --publish  also publishes the landing (only after the owner OKs the FAQ 2 fix).
// Canon Gate A: every visible string must byte-match the locked file
// (after straight→curly apostrophe normalisation); any mismatch aborts.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const apply = process.argv.includes('--apply');
const publish = process.argv.includes('--publish');
const curly = (s) => s.replace(/'/g, '’');
const LOCKED = curly(readFileSync('review/content/christmas-new-year-page-2026-11-14-en.md', 'utf8'));

const COPY = {
  metaTitle: 'Christmas and New Year in Egypt: Holiday Tours and Departures',
  metaDescription: "Spend Christmas and New Year in Egypt: scheduled small-group departures from 23 December, or a private journey on your own dates. Book early. It's the busiest fortnight of the year.",
  title: 'Christmas and New Year in Egypt',
  summary: "The fortnight from Christmas to New Year is the busiest of Egypt's year. That isn't a reason to avoid it; it's a reason to book early. The weather is at its easiest, Nile cruises are in their main season, and a ten-day break is enough for Cairo, the river and Aswan.",
  whyHeading: 'Why Egypt at Christmas',
  why: [
    'Winter is the season that makes Egypt easiest to see: the heat drops, and the Giza plateau, Karnak and the Valley of the Kings can be read rather than endured.',
    'The trade-off is crowds. December into January is peak season. Hotels, boats and guides fill, and the popular dahabiyas go first.',
    "Egypt's own Christmas comes later. 7 January is Christmas for the Coptic Orthodox Church. If you're in Cairo then, Coptic Cairo gains depth, but it's a time of worship, not a tourist event.",
  ],
  faq: [
    ['When should we book a Christmas trip to Egypt?', 'At least 60 days ahead for Christmas and New Year. Hotels, boats and guides fill first over this fortnight. Closer than that, ask us anyway: availability is limited, but not always gone.'],
    ['Are prices higher over Christmas and New Year?', 'Yes. Christmas, New Year and Easter are peak dates in Egypt. Scheduled departures on those dates usually cost 30% more. Private journeys cost more over the same dates too.'],
    ["Is there a gala dinner on Christmas Eve or New Year's Eve?", "Most Egyptian hotels hold a gala dinner on Christmas Eve (24 December) and on New Year's Eve, and it is compulsory, charged on top of the room rate with no exception. On a Nile cruise the gala dinner is included in the cruise price. That difference is worth knowing when you compare a hotel stay with a cruise over the holidays."],
    ['Is December a good time for a Nile cruise?', 'Yes. Winter is the main Nile cruise season. Ships and quays are busier, so confirm the boat, cabin and sightseeing times in advance. For a quieter river, dahabiyas sail in winter too, but the popular boats fill early.'],
    ['What is Coptic Christmas?', "7 January is Christmas for Egypt's Coptic Orthodox Church, with services at churches across the country, including St. Mark's Cathedral in Abbasiya. It's a religious occasion, not a tourist event; dress and behave as you would at any place of worship."],
    ['Can we do a shorter trip over the holidays?', "Yes. A private journey can start on any date. Tell us the days you have and we'll shape it around them."],
  ],
};
// Locked tour picks, in page order (holiday group departures by date, then private).
const TOURS = [
  'tour.10-day-egypt-group-tour-cairo-nile-red-sea', // 23 Dec
  'tour.9-day-egypt-group-tour-cairo-abu-simbel-nile', // 26 Dec
  'tour.11-day-egypt-group-tour-cairo-red-sea-nile', // 27 Dec
  'wp-page-89558', // essential-egypt
  'wp-page-89895', // cairo-and-nile-cruise-tour
  'tour.7-days-luxury-dahabiya-nile-cruise',
  'wp-page-113005', // 9-day-classic-egypt-family-adventure
];
// Hero: the winter guide's image (viewed 2026-11-14: camel in a Santa hat on a
// Red Sea beach; no watermark), with its existing approved alt text.
const HERO_ASSET = 'image-b215818ade530481a5cdccbbab4ac8e3646f4737-3000x2000-jpg';
const HERO_ALT = 'A camel in a red Santa hat and colourful tassels stands on a Red Sea beach at dusk';

// ── Pre-flight ──────────────────────────────────────────────────────────
const strings = [COPY.metaTitle, COPY.metaDescription, COPY.title, COPY.summary, COPY.whyHeading, ...COPY.why, ...COPY.faq.flat()];
const bad = strings.filter((s) => !LOCKED.includes(curly(s)));
if (bad.length) { bad.forEach((s) => console.error('PRE-FLIGHT MISMATCH:', s)); process.exit(1); }
console.log(`pre-flight: ${strings.length} strings match the locked file`);
for (const id of TOURS) if (!(await c.getDocument(id))) throw new Error(`missing tour ${id}`);
if (!(await c.getDocument(HERO_ASSET))) throw new Error('missing hero asset');

// ── Build ───────────────────────────────────────────────────────────────
let k = 0;
const key = (p) => `${p}${(k++).toString(36)}`;
const en = (value, type = 'internationalizedArrayStringValue') => [{ _key: 'en', _type: type, value: curly(value) }];
const block = (text, style = 'normal') => ({
  _key: key('b'), _type: 'block', style, markDefs: [],
  children: [{ _key: key('s'), _type: 'span', marks: [], text: curly(text) }],
});

const theme = {
  _id: 'theme-christmas-new-year',
  _type: 'theme',
  name: [{ _key: 'en', value: 'Christmas and New Year' }],
  slug: [{ _key: 'en', value: { _type: 'slug', current: 'christmas-new-year' } }],
  orderRank: 90,
};
const landing = {
  _id: 'drafts.tourLanding.christmas-and-new-year-in-egypt',
  _type: 'tourLanding',
  category: { _type: 'reference', _ref: 'tourCategory.private-package' },
  themeRef: { _type: 'reference', _ref: 'theme-christmas-new-year' },
  title: en(COPY.title),
  slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: 'christmas-and-new-year-in-egypt' } }],
  summary: en(COPY.summary),
  intro: [{ _key: 'en', value: [block(COPY.whyHeading, 'h2'), ...COPY.why.map((t) => block(t))] }],
  faq: COPY.faq.map(([q, a], i) => ({
    _key: `faq-xmas-${i + 1}`,
    _type: 'landingFaqItem',
    question: en(q),
    answer: [{ _key: 'en', value: [block(a)] }],
  })),
  relatedTours: TOURS.map((id) => ({ _key: key('t'), _type: 'reference', _ref: id })),
  heroImage: {
    _type: 'localizedImage',
    asset: { _type: 'reference', _ref: HERO_ASSET },
    hotspot: { _type: 'sanity.imageHotspot', x: 0.55, y: 0.35, width: 0.6, height: 0.7 },
    alt: [{ _key: 'en', _type: 'object', value: HERO_ALT }],
  },
  seo: {
    metaTitle: en(COPY.metaTitle),
    metaDescription: en(COPY.metaDescription, 'internationalizedArrayTextValue'),
  },
};

console.log(`theme ${theme._id}; landing ${landing._id} — ${landing.relatedTours.length} tours, ${landing.faq.length} FAQs`);
if (!apply) { console.log('dry run — pass --apply'); process.exit(0); }
const tx = c.transaction().createOrReplace(theme).createOrReplace(landing);
console.log('committed', (await tx.commit()).transactionId);
if (publish) {
  // The Actions API needs apiVersion ≥ 2024-05-23 (2024-01-01 returns 404).
  const r = await c.withConfig({ apiVersion: '2025-02-19' }).action({ actionType: 'sanity.action.document.publish', draftId: landing._id, publishedId: landing._id.replace(/^drafts\./, '') });
  console.log('published', r.transactionId);
}
