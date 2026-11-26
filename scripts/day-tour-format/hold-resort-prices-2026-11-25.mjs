/**
 * Hold the prices on the Sharm El Sheikh and Hurghada excursions (owner, 25 Nov: "let us not put any prices
 * for now, as I will create them inside Autoura"). Removes priceFrom, the guide-language prices, price tiers
 * and the price note; nothing else. Transfers and multi-day packages are not touched. The old figures are in
 * the rollback snapshot written before the change.
 *
 *   node --env-file=<.env> scripts/day-tour-format/hold-resort-prices-2026-11-25.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/hold-resort-prices-2026-11-25.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const SLUGS = [
  // Hurghada
  'exclusive-chartered-experience-private-boat-journey-to-orange', 'cairo-by-bus-group-day-tour-from-hurghada',
  'dendera-and-abydos-temple-day-tour-from-hurghada', 'sacred-sands-unveiling-dendera-and-abydos-from-hurghada',
  'dolphin-house-shared-snorkeling-day-from-hurghada', 'dolphins-dance-group-shared-seas-full-day-snorkeling-tour',
  'full-day-trip-to-cairo-by-plane-from-hurghada', 'dolphin-full-day-snorkeling-tour-from-hurghada',
  'giftun-island-shared-snorkeling-day-from-hurghada', 'giftun-island-snorkeling-day-trip-from-hurghada',
  '4wd-desert-safari-dinner-and-show-from-hurghada', 'hurghada-quad-bike-tour',
  'hurghada-dolphin-show-tickets-and-transfer-from-hurghada', 'royal-seascope-submarine-hurghada',
  'luxor-day-tour-from-hurghadafull-day', 'luxor-highlights-group-day-tour-from-hurghada',
  'desert-quad-bike-safari-to-bedouin-village-from-hurghada', 'sindbad-submarine-red-sea-tour-from-hurghada',
  // Sharm El Sheikh
  'aqua-park-cleo-park', 'dahab-blue-hole-desert-snorkel-group-day-tour-from-sharm', 'dolphin-show-sharm-el-sheikh',
  'full-day-trip-to-cairo-by-plane-from-sharm-el-sheikh', 'jerusalem-dead-sea-bethlehem-group-day-tour-from-sharm',
  'mount-sinai-sunrise-trek-group-day-tour', 'ramasside-tours', 'diving-sea-trip-in-sharm-el-sheikh', 'royal-sea-scope',
  'quad-bike-tour-at-sunset-sharm-el-sheikh', 'mount-sinai-and-st-catherine-full-day-tour-from-sharm',
  'ramasside-tours-desert-adventure-snorkeling-experience', 'swimming-with-dolphins',
];
const FIELDS = ['priceFrom', 'guideLanguagePrices', 'priceTiers', 'priceNote', 'basePrice'];

const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-05-23', useCdn: false, perspective: 'raw', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });

// The chartered Orange Bay slug is long; match it by its start.
const docs = await client.fetch(
  '*[_type == "tour" && !(_id match "drafts.*") && hidden != true && (slug[_key=="en"][0].value.current in $slugs || slug[_key=="en"][0].value.current match "exclusive-chartered-experience*")]',
  { slugs: SLUGS },
);
const slugOf = (d) => d.slug.find((s) => s._key === 'en').value.current;
const found = new Set(docs.map(slugOf).map((s) => (s.startsWith('exclusive-chartered') ? SLUGS[0] : s)));
const missing = SLUGS.filter((s) => !found.has(s));
if (missing.length || docs.length !== SLUGS.length) throw new Error(`expected ${SLUGS.length}, found ${docs.length}; missing: ${missing.join(', ')}`);

const drafts = []; // unpublished Studio edits: strip the prices there too, or publishing one would bring them back
for (const d of docs.sort((a, b) => slugOf(a).localeCompare(slugOf(b)))) {
  const draft = await client.getDocument(`drafts.${d._id}`);
  if (draft) { drafts.push(draft); console.log(`  (draft exists, edited ${draft._updatedAt}: prices removed there too, nothing published)`); }
  const there = FIELDS.filter((f) => d[f] !== undefined);
  console.log(`${slugOf(d)} | ${d.tourMode} | €${d.priceFrom ?? '—'} | removes ${there.join(', ')}${d.priceNote ? ` | note: ${JSON.stringify(d.priceNote).slice(0, 200)}` : ''}${d.priceTiers ? ` | tiers: ${JSON.stringify(d.priceTiers.map((t) => t.price))}` : ''}`);
}
console.log(`\n${docs.length} tours`);

if (!apply) { console.log('dry run (--apply writes production)'); process.exit(0); }
await writeRollback(client, [...docs, ...drafts].map((d) => d._id), 'before-price-hold');
const tx = client.transaction();
for (const d of [...docs, ...drafts]) tx.patch(d._id, (p) => p.ifRevisionId(d._rev).unset(FIELDS));
await tx.commit();
console.log(`APPLIED: prices removed from ${docs.length} tours`);
