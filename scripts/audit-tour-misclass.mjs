#!/usr/bin/env node
/**
 * Session 18 — Tour misclassification pre-flight audit.
 *
 * Reads every `tour` doc, runs slug-pattern matching against four
 * heuristic groups, inspects body shape for tour-like vs guide-like
 * signals, and cross-checks against existing `guideArticle` docs for
 * topic+city conflicts.
 *
 * Outputs:
 *   - migration/sessions/session-18-audit/tour-misclassification-candidates.json
 *   - migration/sessions/session-18-audit/tour-misclassification-summary.json
 *
 * Read-only. No mutations.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'migration/sessions/session-18-audit');

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
    })
);

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token: env.SANITY_API_READ_TOKEN || env.SANITY_AUTH_TOKEN,
  useCdn: false,
});

const PATTERN_GROUPS = [
  {
    name: 'A',
    label: 'Generic destination-tour patterns',
    patterns: [
      /^private-tours-in-/,
      /^tours-in-/,
      /^tours-of-/,
      /^cultural-tours-in-/,
      /^excursions-from-/,
      /^day-trips-from-/,
      /^.+-tour-packages?$/,
    ],
  },
  {
    name: 'B',
    label: 'Listicle / things-to-do patterns',
    patterns: [
      /^things-to-do-in-/,
      /^top-(?:\d+-)?(?:tours|things|activities)-in-/,
      /^best-.*-(?:tours|excursions|trips|things-to-do)-in-/,
      /^\d+-days?-egypt-tours?$/,
    ],
  },
  {
    name: 'C',
    label: 'Activity / experience patterns',
    patterns: [/^activities-in-/, /^.+-experiences-in-/],
  },
  {
    name: 'D',
    label: 'Editorial framing patterns',
    patterns: [/^discover-/, /^explore-/, /^.+-guide$/, /^.+-guide-to-/],
  },
];

function matchGroup(slug) {
  for (const group of PATTERN_GROUPS) {
    for (const pat of group.patterns) {
      if (pat.test(slug)) {
        return { group: group.name, pattern: pat.source };
      }
    }
  }
  return null;
}

function inferCity(slug) {
  const m =
    slug.match(/^(?:private|cultural)?-?tours?-(?:in|of|from)-(.+)$/) ||
    slug.match(/^(?:excursions|day-trips)-from-(.+)$/) ||
    slug.match(/^(.+)-tour-packages?$/) ||
    slug.match(/^(?:things-to-do|activities)-in-(.+)$/) ||
    slug.match(/^top-(?:\d+-)?(?:tours|things|activities)-in-(.+)$/) ||
    slug.match(/^best-.*-(?:tours|excursions|trips|things-to-do)-in-(.+)$/) ||
    slug.match(/^.+-experiences-in-(.+)$/) ||
    slug.match(/^(?:discover|explore)-(.+)$/) ||
    slug.match(/^(.+)-guide(?:-to-.+)?$/);
  if (!m) return null;
  return m[1].replace(/-egypt$/, '').replace(/-by-.+$/, '');
}

function bodyText(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((b) => b?._type === 'block' && Array.isArray(b.children))
    .map((b) => b.children.map((c) => (typeof c.text === 'string' ? c.text : '')).join(' '))
    .join('\n');
}

function bodySignal(text) {
  if (!text) return { signal: 'ambiguous', evidence: [], tourScore: 0, guideScore: 0 };
  const lower = text.toLowerCase();
  const evidence = [];

  const dayMatches = lower.match(/\bday\s*\d+\b/g) || [];
  if (dayMatches.length >= 2) evidence.push(`day-by-day(${dayMatches.length})`);
  if (/\binclusions?\b/.test(lower) && /\bexclusions?\b/.test(lower))
    evidence.push('inclusions+exclusions');
  if (/\bfrom\s*[\$€£]\s*\d/.test(lower) || /\bpriced?\s+from\b/.test(lower))
    evidence.push('price-from');
  if (/\bpickup\b|\bpick-up\b/.test(lower) && /\bhotel\b/.test(lower))
    evidence.push('pickup-mention');

  if (/\btop\s+\d+\b/.test(lower)) evidence.push('top-N');
  if (/\bmust-?(see|visit|do)\b/.test(lower)) evidence.push('must-see');
  if (/\bthings\s+to\s+do\b/.test(lower)) evidence.push('things-to-do');
  if (/\bbest\s+(time|way|place|of)\b/.test(lower)) evidence.push('best-X');
  if (/\bhighlights?\s+of\b/.test(lower)) evidence.push('highlights-of');
  if (/\b(recommend|option|variet|alternative)/.test(lower)) evidence.push('recommend/options');

  const tourScore = evidence.filter((e) =>
    /^(day-by-day|inclusions|price-from|pickup-mention)/.test(e)
  ).length;
  const guideScore = evidence.filter((e) =>
    /^(top-N|must-see|things-to-do|best-X|highlights-of|recommend)/.test(e)
  ).length;

  let signal;
  if (tourScore >= 2 && tourScore > guideScore) signal = 'tour-shape';
  else if (guideScore >= 2 && guideScore > tourScore) signal = 'guide-shape';
  else if (tourScore === 0 && guideScore === 0) signal = 'ambiguous';
  else if (tourScore === guideScore) signal = 'ambiguous';
  else signal = tourScore > guideScore ? 'tour-shape' : 'guide-shape';

  return { signal, evidence, tourScore, guideScore };
}

function recommendTarget(group, signal, bodyLen) {
  // Empty/near-empty body + listing-style slug = a shell page that should
  // either become an editorial guide stub or be deleted.
  if (bodyLen < 200 && (group === 'A' || group === 'B')) return 'shell-empty→guideArticle-or-delete';
  if (signal === 'tour-shape') return 'tour-keep';
  if (group === 'B' || group === 'D') return 'guideArticle';
  if (signal === 'guide-shape') return 'guideArticle';
  if (bodyLen < 200) return 'shell-empty→review';
  return 'unclear';
}

async function main() {
  console.error('Fetching all tour docs…');
  const tours = await client.fetch(`
    *[_type == "tour" && !(_id in path("drafts.**"))]{
      _id,
      type,
      tourMode,
      "slug": slug[_key=="en"][0].value.current,
      "allSlugs": slug[]{ _key, "current": value.current },
      "title": coalesce(title[_key=="en"][0].value, title),
      "body": body[_key=="en"][0].value,
      "summary": coalesce(summary[_key=="en"][0].value, summary),
      "cityRefs": cities[]->{ _id, "slug": slug[_key=="en"][0].value.current, "name": coalesce(name[_key=="en"][0].value, name) }
    }
  `);
  console.error(`Loaded ${tours.length} tour docs`);

  console.error('Fetching guideArticles for conflict cross-check…');
  const guides = await client.fetch(`
    *[_type == "guideArticle" && !(_id in path("drafts.**"))]{
      _id,
      "slug": slug[_key=="en"][0].value.current,
      "title": coalesce(title[_key=="en"][0].value, title),
      "parentCitySlug": parentCity->slug[_key=="en"][0].value.current
    }
  `);
  console.error(`Loaded ${guides.length} guideArticle docs`);

  const candidates = [];
  for (const t of tours) {
    if (!t.slug) continue;
    const m = matchGroup(t.slug);
    if (!m) continue;

    const text = bodyText(t.body);
    const sig = bodySignal(text);
    const city = inferCity(t.slug);

    let conflict = null;
    if (city && guides.length) {
      const match = guides.find((g) => {
        if (!g.slug) return false;
        if (g.parentCitySlug && g.parentCitySlug === city) return true;
        if (g.slug.includes(city)) return true;
        return false;
      });
      if (match) conflict = { _id: match._id, slug: match.slug, title: match.title };
    }

    candidates.push({
      wpId: t._id,
      slug: t.slug,
      title: typeof t.title === 'string' ? t.title : null,
      type: t.type,
      tourMode: t.tourMode ?? null,
      cityRefs: (t.cityRefs ?? []).map((c) => ({
        slug: c.slug,
        name: typeof c.name === 'string' ? c.name : null,
      })),
      body_sample: text.slice(0, 500),
      body_length_chars: text.length,
      matched_pattern_group: `Group ${m.group}`,
      matched_pattern: m.pattern,
      content_signal: sig.signal,
      content_signal_evidence: sig.evidence,
      content_signal_scores: { tour: sig.tourScore, guide: sig.guideScore },
      city_inference: city,
      existing_guide_conflict: conflict,
      empty_body: text.length < 200,
      recommended_target: recommendTarget(m.group, sig.signal, text.length),
    });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'tour-misclassification-candidates.json'),
    JSON.stringify(candidates, null, 2) + '\n'
  );

  const summary = {
    totalTours: tours.length,
    totalCandidates: candidates.length,
    byGroup: {},
    bySignal: { 'tour-shape': 0, 'guide-shape': 0, ambiguous: 0 },
    byRecommendation: {},
    conflictsWithExistingGuide: 0,
  };
  for (const c of candidates) {
    summary.byGroup[c.matched_pattern_group] = (summary.byGroup[c.matched_pattern_group] || 0) + 1;
    summary.bySignal[c.content_signal]++;
    summary.byRecommendation[c.recommended_target] =
      (summary.byRecommendation[c.recommended_target] || 0) + 1;
    if (c.existing_guide_conflict) summary.conflictsWithExistingGuide++;
  }
  fs.writeFileSync(
    path.join(OUT_DIR, 'tour-misclassification-summary.json'),
    JSON.stringify(summary, null, 2) + '\n'
  );

  console.error('Done.');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
