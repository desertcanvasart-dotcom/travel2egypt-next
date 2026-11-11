/**
 * Product page template (owner spec §0.4) — writes the EN review file for a
 * batch from the extraction cache (migration/product-extraction), plus the
 * extraction reports (§10 items 2 and 3) for every product.
 *
 *   node scripts/product-review-files-2026-11-09.mjs --batch 01
 *
 * Batch 01 = the 17 homepage products; later batches read their product list
 * from review/product-extraction/batches-plan.md.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const CACHE = 'migration/product-extraction';
const batch = process.argv.includes('--batch') ? process.argv[process.argv.indexOf('--batch') + 1].padStart(2, '0') : '01';

const BATCH1 = [
  'epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs', '10-days-nile-dreamer-tour-experience', '10-day-egypt-travel-journey-through-history',
  '9-day-classic-egypt-family-adventure', '10-day-nile-and-western-desert-tour', '4-day-history-culture-escape',
  'pyramids-of-giza-and-grand-egyptian-museum', 'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara', 'pyramids-of-giza-and-sphinx-group-day-tour',
  'day-tour-to-karnak-luxor-temples-luxor-museum', 'grand-west-bank-group-day-tour-luxor', 'skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience',
  'private-tour-abu-simble-by-bus-from-aswan', 'nubian-temples-day-tour-from-aswan', 'aswan-felucca-adventure',
  '2-day-pyramids-mediterranean-tour', 'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo',
];
function batchSlugs() {
  if (batch === '01') return BATCH1;
  const plan = fs.readFileSync('review/product-extraction/batches-plan.md', 'utf8');
  const sec = plan.split(/^## /m).find((s) => s.startsWith(`Batch ${batch} `));
  if (!sec) throw new Error(`batch ${batch} not in the plan`);
  return [...sec.matchAll(/^\| \d+ \| ([^ |]+) \|/gm)].map((m) => m[1]);
}

const tours = await c.fetch(`*[_type=="tour" && !(_id in path("drafts.**")) && hidden != true]{
  _id, type, durationDays, "slug": slug[_key=="en"][0].value.current, "title": title[_key=="en"][0].value
}`);
const bySlug = new Map(tours.map((t) => [t.slug, t]));
const cache = (id, l) => {
  const f = path.join(CACHE, `${id}.${l}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
};
const esc = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');

const lines = [
  `# Product extraction — batch ${batch} (EN)`,
  '',
  'How to review: tick ☐ → ☑ to approve a row. To correct a row, write the corrected wording after the item (e.g. `→ Four nights in five-star hotels`). Rows you leave unticked and uncorrected are rejected and deleted. Nothing here is on the site until you approve it.',
  '',
  'Every row quotes the exact sentence from the product page it was taken from; rows that could not be quoted were not created.',
  '',
];
for (const slug of batchSlugs()) {
  const t = bySlug.get(slug);
  if (!t) {
    lines.push(`## ${slug}`, '', '_Not a published product — skipped._', '');
    continue;
  }
  const k = cache(t._id, 'en')?.kept;
  const days = t.durationDays ?? null;
  const itin = k?.itinerary ?? [];
  const itinNights = itin.filter((r) => r.overnight).length;
  lines.push(`## ${t.title}`, '', `\`${slug}\` · https://travel2egypt.org/${slug}`, '');
  if (t.type === 'package') {
    const stored = days ? `${days} days · ${days - 1} nights` : 'no duration stored';
    const check = !itin.length
      ? 'itinerary could not be mapped from the text' + (k?.itineraryRejected ? ` (${k.itineraryRejected})` : '')
      : itinNights === (days ?? 0) - 1
        ? `nights add up (${itinNights} nights in the itinerary)`
        : `⚠ nights do NOT add up: ${itinNights} nights in the itinerary`;
    lines.push(`**Stored:** ${stored} · **Check:** ${check}`, '');
  } else lines.push(`**Stored:** day tour`, '');
  const rows = [];
  for (const x of k?.inclusions ?? []) rows.push(['inclusions', x.text, x.source]);
  for (const x of k?.exclusions ?? []) rows.push(['exclusions', x.text, x.source]);
  for (const r of itin) rows.push(['itineraryDays', `Day ${r.day} · ${r.title} · ${r.overnight ? `Night: ${r.overnight}` : 'Departure'}`, r.source]);
  if (!rows.length) {
    lines.push('_Nothing could be extracted with a quotable source sentence._', '');
    continue;
  }
  lines.push('| # | Field | Extracted item | Source sentence (exact quote from the page) | Approve? |', '|---|---|---|---|---|');
  rows.forEach(([f, item, src], i) => lines.push(`| ${i + 1} | ${f} | ${esc(item)} | "${esc(src)}" | ☐ |`));
  if (slug === '10-days-nile-dreamer-tour-experience')
    lines.push('', '_Nile Dreamer: the nights (Cairo ×2, sleeper train, Aswan hotel, cruise ×3, Cairo ×2, departure) are the ones you confirmed and are already approved; only the day titles above need your review._');
  lines.push('');
}
fs.mkdirSync('review/product-extraction', { recursive: true });
const out = `review/product-extraction/batch-${batch}-en.md`;
fs.writeFileSync(out, lines.join('\n') + '\n');

// §10 items 2 and 3 — across every product in the cache
const noIncl = [];
const noItin = [];
for (const t of tours) {
  const k = cache(t._id, 'en')?.kept;
  if (!cache(t._id, 'en')) continue;
  if (!k || (k.inclusions.length === 0)) noIncl.push(t);
  if (t.type === 'package' && (!k || k.itinerary.length === 0)) noItin.push({ ...t, why: k?.itineraryRejected ?? 'page text too short' });
}
const rep = [
  '## 2. Products where extraction found no inclusions (EN)',
  '',
  `${noIncl.length} products.`,
  '',
  '| slug | type |',
  '|---|---|',
  ...noIncl.sort((a, b) => a.slug.localeCompare(b.slug)).map((t) => `| ${t.slug} | ${t.type === 'dayTour' ? 'day tour' : 'package'} |`),
  '',
  '## 3. Multi-day products whose itinerary at a glance could not be populated without guessing (EN)',
  '',
  `${noItin.length} products.`,
  '',
  '| slug | days stored | why |',
  '|---|---|---|',
  ...noItin.sort((a, b) => a.slug.localeCompare(b.slug)).map((t) => `| ${t.slug} | ${t.durationDays ?? '—'} | ${esc(t.why)} |`),
  '',
];
fs.writeFileSync('docs/product-extraction-report-2026-11-09.md', '# Product extraction — report (2026-11-09)\n\nReport only.\n\n' + rep.join('\n') + '\n');
console.log(`${out} written · no inclusions: ${noIncl.length} · itinerary not mapped: ${noItin.length}`);
