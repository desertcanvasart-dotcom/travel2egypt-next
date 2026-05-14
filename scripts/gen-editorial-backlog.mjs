#!/usr/bin/env node
/**
 * Session 18 — Editorial backlog generator (read-only).
 *
 * Builds migration/sessions/session-18/editorial-backlog.md from the
 * audit candidates. Enriches per-city sections with the current tour count
 * for that city by querying Sanity.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CANDIDATES = path.join(ROOT, 'migration/sessions/session-18-audit/tour-misclassification-candidates.json');
const OUT = path.join(ROOT, 'migration/sessions/session-18/editorial-backlog.md');

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
  token: env.SANITY_API_READ_TOKEN || env.SANITY_AUTH_TOKEN,
  useCdn: false,
});

const WP_BASE = 'https://travel2egypt.org';
const all = JSON.parse(fs.readFileSync(CANDIDATES, 'utf8'));
const shells = all.filter((c) => String(c.recommended_target).startsWith('shell-empty'));

// Bucket by shape
const N_DAYS_RE = /^\d+-days?-egypt-tours?$/;
const SINGLETON_RE = /^\d+-days?-best-of-egypt-tour-package$/;
const cityShape = [];
const nDays = [];
const singleton = [];
for (const c of shells) {
  if (N_DAYS_RE.test(c.slug)) nDays.push(c);
  else if (SINGLETON_RE.test(c.slug)) singleton.push(c);
  else cityShape.push(c);
}

// Resolve canonical city slug per row (prefer cityRefs[0].slug, fall back to city_inference)
function citySlugOf(c) {
  return (c.cityRefs && c.cityRefs[0]?.slug) || c.city_inference || null;
}
function cityNameOf(c) {
  return (c.cityRefs && c.cityRefs[0]?.name) || c.city_inference || 'Unknown';
}
function titleCase(s) {
  return s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Count surviving tours per city slug
const cityKeys = [...new Set(cityShape.map(citySlugOf).filter(Boolean))];
const tourCounts = {};
for (const slug of cityKeys) {
  const n = await client.fetch(
    `count(*[_type=="tour" && !(_id in path("drafts.**")) && references(*[_type=="city" && slug[_key=="en"][0].value.current==$slug][0]._id)])`,
    { slug }
  );
  tourCounts[slug] = n;
}

const today = new Date().toISOString().slice(0, 10);

let md = `# Session 18 — Editorial backlog reference\n\n`;
md += `26 misclassified tour shells deleted from migration-staging on ${today}.\n`;
md += `Operator: when revising travel guide content in Studio, use this list\n`;
md += `to identify pages that need to be recreated as proper guideArticles\n`;
md += `or hotel docs in their correct entity homes.\n\n`;
md += `Source audit: [migration/sessions/session-18-audit/audit-report.md](../session-18-audit/audit-report.md)\n\n`;
md += `## Cities with missing tour-section content\n\n`;
md += `These were WP aggregator pages with empty bodies. Each city's travel\n`;
md += `guide section may need a corresponding "Things to do" / "Tours" page.\n`;
md += `Tour counts below show how many bookable tours currently exist for\n`;
md += `each city in migration-staging — when count > 0, the new page can\n`;
md += `simply list those; when count = 0 the operator may want to surface\n`;
md += `monuments / activities instead.\n\n`;

// Group cityShape entries by city slug
const byCity = {};
for (const c of cityShape) {
  const slug = citySlugOf(c) || '__unknown__';
  (byCity[slug] ||= []).push(c);
}
const orderedCities = Object.keys(byCity).sort();
for (const slug of orderedCities) {
  const rows = byCity[slug];
  const displayName = rows[0].cityRefs?.[0]?.name || titleCase(slug);
  const count = slug === '__unknown__' ? '—' : (tourCounts[slug] ?? 'TBD');
  md += `### ${displayName}\n`;
  for (const r of rows) {
    md += `- WP URL: ${WP_BASE}/${r.slug}/  \n`;
    md += `  Title: "${r.title}" · type=${r.type}\n`;
    if (r.existing_guide_conflict?.slug) {
      md += `  Existing same-city guide: \`${r.existing_guide_conflict.slug}\` ("${r.existing_guide_conflict.title}")\n`;
    } else {
      md += `  Existing same-city guide: none surfaced by audit\n`;
    }
  }
  md += `- Surviving tour count for ${displayName}: **${count}**\n\n`;
}

md += `## Duration-based aggregators (operator: decide if needed)\n\n`;
md += `These were WP listicle pages aggregating tours by trip duration.\n`;
md += `Most likely not needed in new structure; the \`/tours\` landing with\n`;
md += `duration filter serves the same intent. ${nDays.length + singleton.length} entries:\n\n`;
for (const c of [...nDays, ...singleton].sort((a, b) => a.slug.localeCompare(b.slug))) {
  md += `- ${WP_BASE}/${c.slug}/  \n`;
  md += `  (was: \`${c.title}\` · type=${c.type})\n`;
}
md += `\n`;

md += `## Outliers — operator-supplied, not in this deletion batch\n\n`;
md += `The two URLs below were called out in the session-18 operator brief\n`;
md += `as needing manual recreation in their correct entity homes. They\n`;
md += `have empty bodies but were not flagged by the audit's slug-pattern\n`;
md += `regex (no listing-style shape), so they are **not** part of the 26\n`;
md += `deletions in this session. Operator handles them in Studio.\n\n`;
md += `- ${WP_BASE}/off-road-from-farafra-to-dakhla/\n`;
md += `  → Should be guideArticle in Farafra travel guide, "Places To Go" section\n`;
md += `  → Slug suggestion: \`places-to-go-in-farafra\` (or operator's choice)\n\n`;
md += `- ${WP_BASE}/taziry-ecolodge-siwa-safari-paradise/\n`;
md += `  → Should be hotel entity, city=siwa, category=standard (or operator's choice)\n`;
md += `  → Brand name: Taziry Ecolodge (or operator's preferred name)\n\n`;

md += `## Summary\n\n`;
md += `| Bucket | Count |\n|---|---:|\n`;
md += `| City-shape shells (deleted, this session) | ${cityShape.length} |\n`;
md += `| Duration aggregators (deleted, this session) | ${nDays.length + singleton.length} |\n`;
md += `| Outliers (operator handles separately) | 2 |\n`;
md += `| **Total in this reference list** | **${cityShape.length + nDays.length + singleton.length + 2}** |\n`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
console.error(`Wrote ${OUT}`);
console.error(`Buckets: cityShape=${cityShape.length}, nDays=${nDays.length}, singleton=${singleton.length}`);
console.error(`Per-city tour counts:`, tourCounts);
