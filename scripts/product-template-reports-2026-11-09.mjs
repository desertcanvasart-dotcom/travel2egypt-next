/**
 * Product page template (owner spec, 2026-11-09) — §10 report-only items and
 * the review-batch plan. Changes nothing.
 * Writes docs/product-template-report-2026-11-09.md and
 * review/product-extraction/batches-plan.md.
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const P = '_type=="tour" && !(_id in path("drafts.**")) && hidden != true';
const tours = await c.fetch(`*[${P}]{
  _id, type, tourMode, durationDays, priceFrom, basePrice, "tiers": count(priceTiers),
  "slug": slug[_key=="en"][0].value.current,
  "title": title[_key=="en"][0].value,
  "locales": slug[defined(value.current)]._key,
  "dek": summary[_key=="en"][0].value,
  "meta": seo.metaDescription[_key=="en"][0].value,
  "body": pt::text(body[_key=="en"][0].value),
  "cities": cities[]->name[_key=="en"][0].value,
  "theme": theme->name[_key=="en"][0].value,
  "refs": count(*[references(^._id) && !(_id in path("drafts.**"))])
} | order(slug asc)`);

const out = [];
const md = (s) => out.push(s);
md('# Product page template — report (2026-11-09)\n');
md('Report only; nothing here was changed.\n');

// 1. No price
const unpriced = tours.filter((t) => !(t.priceFrom > 0) && !(t.basePrice > 0) && !(t.tiers > 0));
md(`## 1. Published products with no price (${unpriced.length})\n`);
md('These show "Price on request" in the decision panel and emit no `offers`.\n');
md('| slug | title | type | locales |\n|---|---|---|---|');
for (const t of unpriced) md(`| ${t.slug} | ${t.title} | ${t.type === 'dayTour' ? 'day tour' : 'package'} | ${(t.locales ?? []).join(', ')} |`);

// 4. Nights consistency (candidates)
md('\n## 4. Nights consistency (multi-day)\n');
md('Stored length = `durationDays` (the page shows days − 1 nights; there is no separate nights field). Listed: every "N nights / N-night / N days" phrase in the title, dek, meta description and narrative that disagrees with the stored length — a phrase longer than the whole trip, or a total-trip day count that differs. Partial phrases ("a 3-night cruise" inside a 10-day trip) are listed only when they exceed the total. Itinerary-at-a-glance night counts will be added once extraction runs.\n');
md('| slug | stored days / nights | phrase | where |\n|---|---|---|---|');
const WORD = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15 };
let mism = 0;
for (const t of tours.filter((x) => x.type === 'package')) {
  const days = t.durationDays ?? 0;
  const nights = days > 0 ? days - 1 : 0;
  const places = { title: t.title, dek: t.dek, meta: t.meta, narrative: t.body };
  for (const [where, text] of Object.entries(places)) {
    if (!text) continue;
    const num = (w) => (/\d/.test(w) ? Number(w) : WORD[w.toLowerCase()]);
    const flag = (m, why) => {
      mism++;
      const ctx = text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 30).replace(/\s+/g, ' ').replace(/\|/g, '/');
      md(`| ${t.slug} | ${days} / ${nights} | "…${ctx}…" (${why}) | ${where} |`);
    };
    const N = '(\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)';
    // a) a nights figure larger than the whole trip
    for (const m of text.matchAll(new RegExp(`\\b${N}[\\s-]nights?\\b`, 'gi'))) {
      if (days > 0 && num(m[1]) > nights) flag(m, 'more nights than the trip has');
    }
    // b) a stated total "N days / M nights" that disagrees
    for (const m of text.matchAll(new RegExp(`\\b${N}[\\s-]days?\\s*[/,·–-]\\s*${N}[\\s-]nights?\\b`, 'gi'))) {
      if (days > 0 && (num(m[1]) !== days || num(m[2]) !== nights) && !/extend/i.test(text.slice(m.index - 30, m.index))) flag(m, 'total disagrees');
    }
    // c) the title's "N-Day" disagrees
    if (where === 'title') for (const m of text.matchAll(new RegExp(`\\b${N}[\\s-]days?\\b`, 'gi'))) {
      if (days > 0 && num(m[1]) !== days) flag(m, 'title length disagrees');
    }
  }
}
if (!mism) md('| — | — | none found | — |');

// 5. Breadcrumb labels
md('\n## 5. Breadcrumb / category labels on package pages\n');
md('Packages show "Home › Packages › {theme} › {title}". Theme names as stored (EN), with product counts. The ones marked ⚠ read like marketing tags rather than categories.\n');
md('| theme (breadcrumb label) | packages | |\n|---|---|---|');
const themes = {};
for (const t of tours.filter((x) => x.type === 'package' && x.theme)) themes[t.theme] = (themes[t.theme] ?? 0) + 1;
const MARKETING = /hassle|on the go|escape|dream|ultimate|best|special/i;
for (const [name, n] of Object.entries(themes).sort((a, b) => b[1] - a[1])) md(`| ${name} | ${n} | ${MARKETING.test(name) ? '⚠ reads like a marketing tag' : ''} |`);

// 6. Related products: automatic selection
md('\n## 6. Related products — automatic selection\n');
md('Product pages have no automatic related-product selection: "Journeys like this" / "More days from {city}" list only the products hand-picked in each product\'s `relatedTours` field. Nothing to exclude; the transfer / show / Red Sea rule is therefore not applied anywhere yet. Hand-picked lists that include such products are left as editors chose them.\n');

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/product-template-report-2026-11-09.md', out.join('\n') + '\n');

// ── Batch plan ──
const BATCH1 = [
  'epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs', '10-days-nile-dreamer-tour-experience', '10-day-egypt-travel-journey-through-history',
  '9-day-classic-egypt-family-adventure', '10-day-nile-and-western-desert-tour', '4-day-history-culture-escape',
  'pyramids-of-giza-and-grand-egyptian-museum', 'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara', 'pyramids-of-giza-and-sphinx-group-day-tour',
  'day-tour-to-karnak-luxor-temples-luxor-museum', 'grand-west-bank-group-day-tour-luxor', 'skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience',
  'private-tour-abu-simble-by-bus-from-aswan', 'nubian-temples-day-tour-from-aswan', 'aswan-felucca-adventure',
  '2-day-pyramids-mediterranean-tour', 'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo',
];
const RED_SEA = /hurghada|sharm|marsa alam|el gouna|dahab|safaga|soma bay|makadi|el quseir|taba|nuweiba|ras sudr|ain sokhna|sahl hasheesh/i;
const isExcluded = (t) => {
  if (/transfer/i.test(t.slug) || /transfer/i.test(t.title ?? '')) return 'airport transfer';
  if (t.type === 'dayTour' && (t.cities ?? []).some((n) => RED_SEA.test(n ?? ''))) return 'Red Sea excursion';
  return null;
};
const rest = tours.filter((t) => !BATCH1.includes(t.slug));
const excluded = rest.filter(isExcluded);
const ranked = rest.filter((t) => !isExcluded(t)).sort((a, b) => b.refs - a.refs || a.slug.localeCompare(b.slug));
const plan = ['# Product extraction — review batches\n'];
plan.push('**Batch order.** The spec asks for last-90-days pageviews from GA4 or server logs. Neither is reachable from this environment (no GA4 Data API credentials; Railway request logs are not exported), so batches 2+ are ordered by a stand-in: the number of other published documents that link to the product (internal links, Sanity references), highest first, then by slug. Re-order once pageview data is available.\n');
plan.push(`**Batch 1** (${BATCH1.length}): the homepage products — ${BATCH1.join(', ')}.\n`);
for (let i = 0; i < ranked.length; i += 30) {
  const b = ranked.slice(i, i + 30);
  plan.push(`## Batch ${String(i / 30 + 2).padStart(2, '0')} (${b.length})\n`);
  plan.push('| # | slug | type | inbound links |\n|---|---|---|---|');
  b.forEach((t, j) => plan.push(`| ${j + 1} | ${t.slug} | ${t.type === 'dayTour' ? 'day tour' : 'package'} | ${t.refs} |`));
  plan.push('');
}
plan.push(`## Excluded from the batches (${excluded.length}) — Red Sea excursions and airport transfers\n`);
plan.push('| slug | why |\n|---|---|');
for (const t of excluded) plan.push(`| ${t.slug} | ${isExcluded(t)} |`);
fs.mkdirSync('review/product-extraction', { recursive: true });
fs.writeFileSync('review/product-extraction/batches-plan.md', plan.join('\n') + '\n');
console.log(`unpriced ${unpriced.length} | nights mismatches ${mism} | themes ${Object.keys(themes).length} | batches ${Math.ceil(ranked.length / 30)} after batch 1 | excluded ${excluded.length}`);
