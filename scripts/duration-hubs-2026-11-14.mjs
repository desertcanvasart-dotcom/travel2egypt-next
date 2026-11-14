// Owner-locked 2026-11-14 ("Lock it, build them"): review/content/duration-hubs-2026-11-14-en.md
// Builds 4 duration hubs (themes + tourLanding) — EN only.
// node scripts/duration-hubs-2026-11-14.mjs [--apply] [--publish=4,10]   (repo root)
//   --apply            write themes (published, inert) + landings as DRAFTS
//   --publish=a,b      publish those hubs (by key: 4, 7, 10, 14)
// Canon Gate A: every visible string must byte-match the locked file (after
// straight→curly apostrophe normalisation); mismatch aborts.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2025-02-19',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const apply = process.argv.includes('--apply');
const publishKeys = (process.argv.find((a) => a.startsWith('--publish=')) ?? '').slice(10).split(',').filter(Boolean);
const curly = (s) => s.replace(/'/g, '’');
const LOCKED = curly(readFileSync('review/content/duration-hubs-2026-11-14-en.md', 'utf8'));
if (!LOCKED.includes('LOCKED by owner')) { console.error('file not locked'); process.exit(1); }

const FAQ = [
  ['Private or small group?', 'Private journeys start on any date and run at your pace. Small-group tours run on fixed departure dates with a capped group. Where a small-group departure exists at this length, it’s listed here.'],
  ['Do prices change by season?', 'Yes. Christmas, New Year and Easter are peak dates in Egypt. Scheduled departures on those dates usually cost 30% more, and private journeys cost more over the same dates too.'],
  ['Nile cruise, or flights and hotels?', 'A cruise between Luxor and Aswan combines travel and accommodation, so you don’t move your luggage every day, and it stops at Edfu, Kom Ombo and Esna on the way. The trade-off is flexibility: the boat sets the timetable. Flying, or driving with a private car, lets you set your own.'],
];
const BEST_ITIN = 'wp-post-136112-en'; // "Egypt Travel Itineraries by Day Count"

const HUBS = {
  4: {
    slug: '4-days-egypt-tours', range: [3, 5], themeName: 'Short breaks', guide: 'wp-post-152503-en',
    featured: ['wp-page-153242', 'wp-page-86851', 'wp-page-237730'],
    metaTitle: '4-Day Egypt Tours: Short Breaks of 3 to 5 Days',
    metaDescription: 'Short Egypt tours of three to five days: Cairo and the pyramids, Alexandria, a stretch of the Nile or the Western Desert. Private, and starting on any date.',
    title: '4-Day Egypt Tours',
    summary: 'Four days is enough for Cairo and Giza with one more thing added, not for the whole country. The tours here run three to five days, and each keeps to one region: Cairo and the pyramids, Alexandria on the Mediterranean, a stretch of the Nile, or the Western Desert.',
    whyHeading: 'What fits in four days',
    why: [
      'Egypt takes more travel time than the map suggests: Cairo traffic, airports, domestic flights and the walking at each site all eat into the day. On a short trip, one region done well beats several done in a hurry.',
      'With four days, add one major thing to Cairo and Giza. That could be Saqqara, Dahshur and Memphis, which show how pyramid-building developed, or a day or a night in Alexandria.',
      'With five days, a northern trip of Cairo, Giza, Saqqara and Alexandria works without strain. So does a trip based in Aswan, for Philae, the Nubian Museum and Abu Simbel. Fitting Cairo, Luxor, Aswan and Abu Simbel all into five days leaves too much of it in transit.',
    ],
  },
  7: {
    slug: '7-days-egypt-tours', range: [7, 8], themeName: 'One week', guide: null, // resolved below: experience-egypt-in-7-days
    featured: ['wp-page-136566', 'wp-page-89558', 'wp-page-89895'],
    metaTitle: '7-Day Egypt Tours: One Week in Cairo, Luxor and Aswan',
    metaDescription: 'One-week Egypt tours of seven or eight days: Cairo and the pyramids with Luxor, Aswan and the Nile, by road, by air or on a cruise. Private, and starting on any date.',
    title: '7-Day Egypt Tours',
    summary: 'Seven days is the shortest trip that properly connects Cairo with the temples of Upper Egypt. Eight makes room for Abu Simbel. The tours here run seven or eight days, by road, by air or on the Nile.',
    whyHeading: 'What fits in a week',
    why: [
      'A week usually splits into two or three days in Cairo and Giza and four or five in Luxor and Aswan. In Cairo, choose between the pyramids, the museum and Saqqara rather than trying to see everything.',
      'In Luxor, the east bank (Karnak and Luxor Temple) and the west bank (the Valley of the Kings, Hatshepsut’s temple and the Colossi of Memnon) are the core. Seeing the whole west bank in one day is tiring, so decide what to see in depth.',
      'With eight days, Abu Simbel fits more easily: two days each in Cairo, Luxor and Aswan, one for Abu Simbel and one for travel. Several of the seven-day journeys here are dahabiya cruises between Luxor and Aswan.',
    ],
  },
  10: {
    slug: '10-days-egypt-tours', range: [9, 11], themeName: 'Ten days', guide: 'wp-post-136767-en',
    featured: ['wp-page-156539', 'tour.10-day-egypt-group-tour-cairo-nile-red-sea', 'wp-page-113005'],
    metaTitle: '10-Day Egypt Tours: Cairo, the Nile and Abu Simbel in Depth',
    metaDescription: 'Egypt tours of nine to eleven days: Cairo, Luxor, Aswan and Abu Simbel without the rush, with private journeys on any date and small-group departures on fixed dates.',
    title: '10-Day Egypt Tours',
    summary: 'Ten days is where an Egypt trip stops being a race. Cairo, Luxor, Aswan and Abu Simbel connect without strain, with time to go deeper at each. The tours here run nine to eleven days.',
    whyHeading: 'What ten days adds',
    why: [
      'In Cairo, there’s time beyond Giza: Saqqara or Dahshur make the history of the pyramids three-dimensional, and the museums and Islamic Cairo show the city beyond antiquity.',
      'In Luxor, the west bank no longer has to fit into one day. The Valley of the Kings, Hatshepsut’s temple, Medinet Habu and Deir el-Medina, the village of the tomb-builders, can be split by interest.',
      'At eleven days, the Red Sea or Sinai becomes possible as an addition to the Nile valley. Choose one; including both scatters the trip.',
    ],
  },
  14: {
    slug: '14-days-egypt-tours', range: [12, 15], themeName: 'Two weeks', guide: 'wp-post-136729-en',
    featured: ['tour.12-day-egypt-group-tour-cairo-dahabiya-red-sea', 'wp-page-89524', 'wp-page-113004'],
    metaTitle: '14-Day Egypt Tours: Two Weeks Across the Nile and Beyond',
    metaDescription: 'Two-week Egypt tours of twelve to fifteen days: the Nile valley plus the Red Sea, Sinai, Alexandria or the Western Desert. Private journeys and small-group departures.',
    title: '2-Week Egypt Tours',
    summary: 'Two weeks lets you see Egypt as a country of regions rather than a chain of sights: the Nile valley plus the Red Sea, Sinai, Alexandria or the Western Desert. The tours here run twelve to fifteen days.',
    whyHeading: 'What two weeks allows',
    why: [
      'One way to build it: three days in Cairo and Giza, three in Luxor, three in Aswan and Abu Simbel, three on the Red Sea, and the rest for travel. That gives time to the sites, the river, the sea and the city.',
      'The Western Desert (Bahariya, the White Desert and the Black Desert) needs a private car, permits and local arrangements, so it’s planned separately from ordinary travel between cities.',
      'There’s no need to include every region. Egypt rewards a return visit, and deciding what to see in depth this time makes for a better trip.',
    ],
  },
};
HUBS[7].guide = await c.fetch(`*[_type=="article" && language=="en" && slug.current=="experience-egypt-in-7-days"][0]._id`);

// ── Pre-flight ──────────────────────────────────────────────────────────
let bad = 0;
for (const [k, h] of Object.entries(HUBS)) {
  for (const s of [h.metaTitle, h.metaDescription, h.title, h.summary, h.whyHeading, ...h.why, `/${h.slug}`]) {
    if (!LOCKED.includes(curly(s))) { console.error(`PRE-FLIGHT MISMATCH [${k}]: ${s}`); bad++; }
  }
}
for (const s of FAQ.flat()) if (!LOCKED.includes(curly(s))) { console.error(`PRE-FLIGHT MISMATCH [faq]: ${s}`); bad++; }
if (bad) process.exit(1);
console.log('pre-flight: all strings match the locked file');

let n = 0;
const key = (p) => `${p}${(n++).toString(36)}`;
const en = (v, t = 'internationalizedArrayStringValue') => [{ _key: 'en', _type: t, value: curly(v) }];
const block = (text, style = 'normal') => ({ _key: key('b'), _type: 'block', style, markDefs: [], children: [{ _key: key('s'), _type: 'span', marks: [], text: curly(text) }] });

const tx = c.transaction();
for (const [k, h] of Object.entries(HUBS)) {
  const pool = await c.fetch(
    `*[_type=="tour" && type=="package" && !(_id in path("drafts.**")) && durationDays >= $a && durationDays <= $b] | order(durationDays asc, _createdAt desc)._id`,
    { a: h.range[0], b: h.range[1] },
  );
  for (const f of h.featured) if (!pool.includes(f)) throw new Error(`[${k}] featured ${f} not in ${h.range} pool`);
  const ordered = [...h.featured, ...pool.filter((id) => !h.featured.includes(id))];
  if (!h.guide) throw new Error(`[${k}] guide not found`);
  const themeId = `theme-duration-${k}`;
  tx.createOrReplace({ _id: themeId, _type: 'theme', name: [{ _key: 'en', value: h.themeName }], slug: [{ _key: 'en', value: { _type: 'slug', current: `duration-${k}` } }], orderRank: 100 + Number(k) });
  tx.createOrReplace({
    _id: `drafts.tourLanding.${h.slug}`,
    _type: 'tourLanding',
    category: { _type: 'reference', _ref: 'tourCategory.private-package' },
    themeRef: { _type: 'reference', _ref: themeId },
    title: en(h.title),
    slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: h.slug } }],
    summary: en(h.summary),
    intro: [{ _key: 'en', value: [block(h.whyHeading, 'h2'), ...h.why.map((t) => block(t))] }],
    faq: FAQ.map(([q, a], i) => ({ _key: `faq-dur${k}-${i + 1}`, _type: 'landingFaqItem', question: en(q), answer: [{ _key: 'en', value: [block(a)] }] })),
    relatedTours: ordered.map((id) => ({ _key: key('t'), _type: 'reference', _ref: id })),
    journalRefs: [h.guide, BEST_ITIN].map((id) => ({ _key: key('j'), _type: 'reference', _ref: id })),
    seo: { metaTitle: en(h.metaTitle), metaDescription: en(h.metaDescription, 'internationalizedArrayTextValue') },
  });
  console.log(`[${k}] /${h.slug}: ${ordered.length} tours (days ${h.range.join('–')}), guide ${h.guide}`);
}
if (apply) console.log('committed', (await tx.commit()).transactionId);
else if (!publishKeys.length) console.log('dry run — pass --apply');
for (const k of publishKeys) {
  const id = `tourLanding.${HUBS[k].slug}`;
  const r = await c.action({ actionType: 'sanity.action.document.publish', draftId: `drafts.${id}`, publishedId: id });
  console.log('published', id, r.transactionId);
}
