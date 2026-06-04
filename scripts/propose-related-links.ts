/**
 * DRY-RUN generator for the related[] / "further reading" population pass.
 *
 * READ-ONLY. Makes NO Sanity writes. Fetches published docs from
 * migration-staging, applies deterministic rules (cap 4 / hard-max 6, exclude
 * self, dedupe, published-with-slug targets only), and emits two reports:
 *   reports/related-links-proposal.json   (machine-readable)
 *   reports/related-links-proposal.md     (human review)
 *
 * Rules (verified against schema 2026-06):
 *   guideArticle.relatedTours : tours whose cities[] include parentCity;
 *                               order = city-focus (sole/primary first).
 *   tour.relatedTours         : other tours sharing theme OR overlapping
 *                               cities[]; prefer same/adjacent length bucket;
 *                               skip self + already-linked.
 *   hotel.relatedTours        : tours whose cities[] include hotel.city.
 *   nileCruise.relatedTours   : Nile/cruise-theme tours first, else tours
 *                               including departureCity/returnCity.
 *   article.relatedArticles   : same editorialCategory + same language; stable.
 *   article.relatedTours/Cities, city.placesToGo : REPORT ONLY (deferred / audit).
 *
 * Run:  npx tsx scripts/propose-related-links.ts
 */
import { writeFileSync } from 'node:fs';
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const CAP = 4;
const HARD_MAX = 6;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'published',
  useCdn: false,
});

// Dropped destinations per the cutover policy (this WRITE session's list):
// Siwa, Bahariya, Fayoum, Wadi al-Natrun, Al Wadi al-Gadid.
// NOTE: Bahariya & Fayoum differ from the homepage's "Desert & quiet" treatment
// (which kept them live) — flagged for reconciliation in the report.
const DROPPED_RE = /(siwa|bahariya|fayoum|natrun|wadi-al-gadid|al-gadid|new-valley)/i;
const NILE_THEMES = new Set(['theme-nile-cruise', 'theme-dahabiya-nile-cruise']);

type Slugs = { en?: string; es?: string; ja?: string };
interface Tour { _id: string; type?: string; theme?: string; cities: string[]; durationDays?: number; durationHours?: number; title?: string; slug: Slugs; existing: string[]; }
interface Doc { _id: string; title?: string; slug: Slugs; }

const hasEn = (s: Slugs) => !!s.en;
const missingEs = (s: Slugs) => !s.es;
const missingJa = (s: Slugs) => !s.ja;

// Unified length-bucket ordinal (day → 0 … 15+ days → 4).
function bucket(t: Tour): number {
  const d = t.durationDays;
  if (typeof d === 'number') {
    if (d <= 1) return 0;
    if (d <= 5) return 1;
    if (d <= 9) return 2;
    if (d <= 14) return 3;
    return 4;
  }
  if (t.type === 'dayTour') return 0;
  return 2; // unknown multi-day → middle bucket
}

function targetRef(d: { _id: string; title?: string; slug: Slugs; cities?: string[] }, droppedCityIds: Set<string>) {
  const droppedTarget = (d.cities ?? []).some((c) => droppedCityIds.has(c));
  return { targetId: d._id, title: d.title ?? '(untitled)', slug: d.slug.en ?? null, missingEs: missingEs(d.slug), missingJa: missingJa(d.slug), droppedDest: droppedTarget };
}

async function main() {
  console.log('propose-related-links — DRY RUN (no writes) — dataset=' + client.config().dataset + '\n');

  // ── Fetch published universes ──
  const SLUG = `{ "en": slug[_key=="en"][0].value.current, "es": slug[_key=="es"][0].value.current, "ja": slug[_key=="ja"][0].value.current }`;
  const tours: Tour[] = await client.fetch(
    `*[_type=="tour" && defined(slug[_key=="en"][0].value.current)]{ _id, type, "theme": theme._ref, "cities": coalesce(cities[]._ref, []), durationDays, durationHours, "title": coalesce(title[_key=="en"][0].value, title[_key=="es"][0].value), "slug": ${SLUG}, "existing": coalesce(relatedTours[]._ref, []) }`);
  const guideArticles: Array<Doc & { parentCity?: string; existing: string[] }> = await client.fetch(
    `*[_type=="guideArticle" && defined(slug[_key=="en"][0].value.current)]{ _id, "parentCity": parentCity._ref, "title": coalesce(title[_key=="en"][0].value, title[_key=="es"][0].value), "slug": ${SLUG}, "existing": coalesce(relatedTours[]._ref, []) }`);
  const hotels: Array<Doc & { city?: string; existing: string[] }> = await client.fetch(
    `*[_type=="hotel" && defined(slug[_key=="en"][0].value.current)]{ _id, "city": city._ref, "title": coalesce(name[_key=="en"][0].value, name[_key=="es"][0].value), "slug": ${SLUG}, "existing": coalesce(relatedTours[]._ref, []) }`);
  const cruises: Array<Doc & { depCity?: string; retCity?: string; existing: string[] }> = await client.fetch(
    `*[_type=="nileCruise" && defined(slug[_key=="en"][0].value.current)]{ _id, "depCity": departureCity._ref, "retCity": returnCity._ref, "title": coalesce(name[_key=="en"][0].value, name[_key=="es"][0].value), "slug": ${SLUG}, "existing": coalesce(relatedTours[]._ref, []) }`);
  const articles: Array<{ _id: string; language?: string; category?: string; title?: string; publishedAt?: string; slug: { en?: string }; existing: string[] }> = await client.fetch(
    `*[_type=="article" && defined(slug.current)]{ _id, language, "category": category._ref, "title": title, publishedAt, "slug": { "en": slug.current }, "existing": coalesce(relatedArticles[]._ref, []) }`);
  const cities: Array<{ _id: string; slug?: string; name?: string; placesToGo: number }> = await client.fetch(
    `*[_type=="city"]{ _id, "slug": slug[_key=="en"][0].value.current, "name": coalesce(name[_key=="en"][0].value, name[_key=="es"][0].value), "placesToGo": count(placesToGo) }`);
  const attractionGuides: Array<{ _id: string; parentCity?: string; title?: string }> = await client.fetch(
    `*[_type=="guideArticle" && kind=="attraction" && defined(slug[_key=="en"][0].value.current)]{ _id, "parentCity": parentCity._ref, "title": coalesce(title[_key=="en"][0].value, title[_key=="es"][0].value) }`);

  const droppedCityIds = new Set(cities.filter((c) => c.slug && DROPPED_RE.test(c.slug)).map((c) => c._id));
  const cityNameById = new Map(cities.map((c) => [c._id, c.name]));

  // Dropped-destination policy. cities[] has no documented lead/primary ordering,
  // so we do NOT trust cities[0] as the primary destination. Fallback signal:
  // a candidate tour is EXCLUDED from target pools when dropped cities are the
  // SOLE or strict-MAJORITY (>50%) of its cities[]; KEPT + flagged "incidental"
  // when a dropped stop is a minority among otherwise-live cities.
  const incidentalFlags: any[] = [];
  const excludedTourIds = new Set<string>();
  for (const t of tours) {
    const dc = t.cities.filter((c) => droppedCityIds.has(c));
    const n = t.cities.length;
    if (n > 0 && (dc.length === n || dc.length / n > 0.5)) {
      excludedTourIds.add(t._id);
    } else if (dc.length > 0) {
      incidentalFlags.push({ tourId: t._id, title: t.title, slug: t.slug.en, droppedStops: dc.map((id) => cityNameById.get(id) ?? id), totalCities: n });
    }
  }
  const eligibleTarget = (t: Tour) => !excludedTourIds.has(t._id);

  const report: any = {
    generatedAt: 'DRY-RUN', cap: CAP, hardMax: HARD_MAX,
    droppedCityIds: [...droppedCityIds],
    renderEligibility: {
      tour_relatedTours: 'RENDERS (SingleTourView L277-284 + PackageView L421-428) → ELIGIBLE',
      hotel_relatedTours: 'RENDERS (hotels/[slug]/page.tsx L191-197) → ELIGIBLE',
      guideArticle_relatedTours: 'PROJECTS-ONLY, NOT RENDERED (CityGuideSidebar has no relatedTours prop) → SKIP',
      article_relatedArticles: 'NON-RENDERING (dynamic weave) → SKIP',
      nileCruise_relatedTours: 'DEFERRED (homogeneous output, route-blind rule) → DEFER',
    },
    types: {},
  };

  // ── guideArticle.relatedTours ──
  {
    const proposals: any[] = []; let empty = 0; let capHit = 0; const empties: string[] = [];
    for (const g of guideArticles) {
      if (!g.parentCity) { empty++; empties.push(g.title + ' (no parentCity)'); continue; }
      const cands = tours.filter((t) => t.cities.includes(g.parentCity!) && eligibleTarget(t));
      const ranked = cands.map((t) => {
        const focus = t.cities.length === 1 && t.cities[0] === g.parentCity ? 0 : t.cities[0] === g.parentCity ? 1 : 2;
        return { t, focus, n: t.cities.length };
      }).sort((a, b) => a.focus - b.focus || a.n - b.n || (a.t.title ?? '').localeCompare(b.t.title ?? ''));
      if (ranked.length === 0) { empty++; if (empties.length < 25) empties.push(g.title ?? g._id); continue; }
      if (ranked.length > CAP) capHit++;
      const refs = ranked.slice(0, Math.min(CAP, HARD_MAX)).map((r) => targetRef({ ...r.t, slug: r.t.slug, cities: r.t.cities }, droppedCityIds));
      proposals.push({ docId: g._id, title: g.title, candidateCount: ranked.length, refs });
    }
    report.types.guideArticle_relatedTours = { source: guideArticles.length, wouldFill: proposals.length, wouldRemainEmpty: empty, capHitCount: capHit, emptiesSample: empties.slice(0, 15), proposals };
  }

  // ── tour.relatedTours ──
  {
    const proposals: any[] = []; let empty = 0; let capHit = 0; const empties: string[] = [];
    for (const t of tours) {
      const myBucket = bucket(t);
      const cityset = new Set(t.cities);
      const cands = tours.filter((o) => o._id !== t._id && !t.existing.includes(o._id) && eligibleTarget(o) &&
        ((t.theme && o.theme === t.theme) || o.cities.some((c) => cityset.has(c))));
      const ranked = cands.map((o) => {
        const overlap = o.cities.filter((c) => cityset.has(c)).length;
        const dist = Math.abs(bucket(o) - myBucket);
        const sharedTheme = t.theme && o.theme === t.theme ? 1 : 0;
        return { o, overlap, dist, sharedTheme };
      }).sort((a, b) => a.dist - b.dist || b.overlap - a.overlap || b.sharedTheme - a.sharedTheme || (a.o.title ?? '').localeCompare(b.o.title ?? ''));
      if (ranked.length === 0) { empty++; if (empties.length < 25) empties.push(t.title ?? t._id); continue; }
      if (ranked.length > CAP) capHit++;
      const refs = ranked.slice(0, CAP).map((r) => targetRef({ ...r.o, slug: r.o.slug, cities: r.o.cities }, droppedCityIds));
      proposals.push({ docId: t._id, title: t.title, type: t.type, candidateCount: ranked.length, refs });
    }
    report.types.tour_relatedTours = { source: tours.length, wouldFill: proposals.length, wouldRemainEmpty: empty, capHitCount: capHit, emptiesSample: empties.slice(0, 15), proposals };
  }

  // ── hotel.relatedTours ──
  {
    const proposals: any[] = []; let empty = 0; let capHit = 0; const empties: string[] = [];
    for (const h of hotels) {
      if (!h.city) { empty++; empties.push((h.title ?? h._id) + ' (no city)'); continue; }
      const cands = tours.filter((t) => t.cities.includes(h.city!) && eligibleTarget(t))
        .sort((a, b) => a.cities.length - b.cities.length || (a.title ?? '').localeCompare(b.title ?? ''));
      if (cands.length === 0) { empty++; if (empties.length < 25) empties.push(h.title ?? h._id); continue; }
      if (cands.length > CAP) capHit++;
      const refs = cands.slice(0, CAP).map((t) => targetRef({ ...t, slug: t.slug, cities: t.cities }, droppedCityIds));
      proposals.push({ docId: h._id, title: h.title, candidateCount: cands.length, refs });
    }
    report.types.hotel_relatedTours = { source: hotels.length, wouldFill: proposals.length, wouldRemainEmpty: empty, capHitCount: capHit, emptiesSample: empties.slice(0, 15), proposals };
  }

  // ── nileCruise.relatedTours ──
  {
    const proposals: any[] = []; let empty = 0; let capHit = 0; const empties: string[] = [];
    for (const c of cruises) {
      const cityIds = [c.depCity, c.retCity].filter(Boolean) as string[];
      const nileTours = tours.filter((t) => t.theme && NILE_THEMES.has(t.theme) && eligibleTarget(t));
      const cityTours = tours.filter((t) => cityIds.some((id) => t.cities.includes(id)) && eligibleTarget(t) && !(t.theme && NILE_THEMES.has(t.theme)));
      const ranked = [...nileTours.sort((a, b) => a.cities.length - b.cities.length || (a.title ?? '').localeCompare(b.title ?? '')),
                      ...cityTours.sort((a, b) => a.cities.length - b.cities.length || (a.title ?? '').localeCompare(b.title ?? ''))];
      if (ranked.length === 0) { empty++; if (empties.length < 25) empties.push(c.title ?? c._id); continue; }
      if (ranked.length > CAP) capHit++;
      const refs = ranked.slice(0, CAP).map((t) => targetRef({ ...t, slug: t.slug, cities: t.cities }, droppedCityIds));
      proposals.push({ docId: c._id, title: c.title, candidateCount: ranked.length, refs });
    }
    report.types.nileCruise_relatedTours = { source: cruises.length, wouldFill: proposals.length, wouldRemainEmpty: empty, capHitCount: capHit, emptiesSample: empties.slice(0, 15), proposals };
  }

  // ── article.relatedArticles (same category + language) — NON-RENDERING (flagged) ──
  {
    const proposals: any[] = []; let empty = 0; let capHit = 0; const empties: string[] = [];
    const byCatLang = new Map<string, typeof articles>();
    for (const a of articles) {
      if (!a.category || !a.language) continue;
      const k = a.language + '|' + a.category;
      if (!byCatLang.has(k)) byCatLang.set(k, []);
      byCatLang.get(k)!.push(a);
    }
    for (const a of articles) {
      if (!a.category || !a.language) { empty++; continue; }
      const pool = (byCatLang.get(a.language + '|' + a.category) ?? [])
        .filter((o) => o._id !== a._id && !a.existing.includes(o._id))
        .sort((x, y) => (y.publishedAt ?? '').localeCompare(x.publishedAt ?? '') || (x.title ?? '').localeCompare(y.title ?? ''));
      if (pool.length === 0) { empty++; if (empties.length < 25) empties.push((a.title ?? a._id) + ' [' + a.language + ']'); continue; }
      if (pool.length > CAP) capHit++;
      const refs = pool.slice(0, CAP).map((o) => ({ targetId: o._id, title: o.title ?? '(untitled)', slug: o.slug.en ?? null, language: o.language }));
      proposals.push({ docId: a._id, title: a.title, language: a.language, candidateCount: pool.length, refs });
    }
    report.types.article_relatedArticles = { source: articles.length, wouldFill: proposals.length, wouldRemainEmpty: empty, capHitCount: capHit, NON_RENDERING: true, note: 'Blog detail computes a dynamic weave; the stored relatedArticles field is not rendered. Populate only after a component change.', emptiesSample: empties.slice(0, 15), proposals };
  }

  // ── city.placesToGo audit (report only) ──
  {
    const empties = cities.filter((c) => c.placesToGo === 0).map((c) => {
      const candidates = attractionGuides.filter((g) => g.parentCity === c._id);
      return { cityId: c._id, name: c.name, slug: c.slug, dropped: !!c.slug && DROPPED_RE.test(c.slug), attractionGuidesAvailable: candidates.length, sample: candidates.slice(0, 4).map((g) => g.title) };
    });
    report.types.city_placesToGo_audit = { totalCities: cities.length, populated: cities.filter((c) => c.placesToGo > 0).length, empty: empties.length, emptyCities: empties };
  }

  // ── Anomaly aggregation ──
  const anomalies = { droppedDestTargets: 0, crossLocaleDeadLinks_es: 0, crossLocaleDeadLinks_ja: 0 };
  for (const key of ['guideArticle_relatedTours', 'tour_relatedTours', 'hotel_relatedTours', 'nileCruise_relatedTours']) {
    for (const p of report.types[key].proposals) for (const r of p.refs) {
      if (r.droppedDest) anomalies.droppedDestTargets++;
      if (r.missingEs) anomalies.crossLocaleDeadLinks_es++;
      if (r.missingJa) anomalies.crossLocaleDeadLinks_ja++;
    }
  }
  report.anomalies = anomalies;
  report.droppedPolicy = {
    droppedCities: cities.filter((c) => c.slug && DROPPED_RE.test(c.slug)).map((c) => ({ id: c._id, name: c.name, slug: c.slug })),
    excludedFromPool_soleOrMajority: excludedTourIds.size,
    incidentalKeptAndFlagged: incidentalFlags.length,
    incidentalFlags: incidentalFlags.slice(0, 50),
  };

  // ── Write JSON ──
  writeFileSync('reports/related-links-proposal.json', JSON.stringify(report, null, 2));
  console.log('wrote reports/related-links-proposal.json');

  // ── Write Markdown (summary + samples) ──
  const md: string[] = [];
  md.push('# Related-links population — DRY-RUN proposal\n');
  md.push('_Generated by `scripts/propose-related-links.ts` against `migration-staging` (published perspective). **No Sanity writes were made.** Cap 4 / hard-max 6, self excluded, deduped, published-with-en-slug targets only._\n');
  md.push('## Step 1 — residual verification\n');
  md.push('- **1a. Article related-module render:** the blog detail (`articleBySlugQuery`) projects `relatedArticles`/`relatedTours` but the page renders **neither** — only `relatedCities` (as location name-tags). The visible "Read next" weave is **computed dynamically** (`articleRelatedWeaveQuery`: same-category + city-matched tours + recent), not from stored fields. → **`article.relatedArticles` is non-rendering; populating it is inert until a component is built.**');
  md.push('- **1b. Slug coverage (published) — cross-locale dead targets:** hotel 78 total → en 77 / es 77 / **ja 75** (3 missing ja, 1 missing es); nileCruise 50 → **complete**; travelTip 31 → en/es 31 / **ja 30** (1 missing ja).\n');
  md.push('## Per-type summary\n');
  md.push('| Field | source docs | would fill | would remain empty | cap-hit (>4 cands) | render path |');
  md.push('|---|---:|---:|---:|---:|---|');
  const renderPath: Record<string, string> = {
    guideArticle_relatedTours: 'unverified module',
    tour_relatedTours: 'RENDERS (SingleTourView "more days")',
    hotel_relatedTours: 'referenced in hotel page',
    nileCruise_relatedTours: 'referenced in cruise page',
    article_relatedArticles: '**NON-RENDERING** (dynamic weave)',
  };
  for (const k of ['guideArticle_relatedTours', 'tour_relatedTours', 'hotel_relatedTours', 'nileCruise_relatedTours', 'article_relatedArticles']) {
    const s = report.types[k];
    md.push(`| ${k} | ${s.source} | ${s.wouldFill} | ${s.wouldRemainEmpty} | ${s.capHitCount} | ${renderPath[k]} |`);
  }
  md.push('\n**Deferred (no structural signal — flagged, not filled):** `article.relatedTours`, `article.relatedCities` — inference territory for the later in-body wave.\n');
  md.push('## Anomalies\n');
  md.push(`- Proposed targets among dropped destinations (Siwa/Fayoum/Wadi Natrun/New Valley): **${anomalies.droppedDestTargets}**`);
  md.push(`- Proposed targets missing an **es** slug (cross-locale dead link): **${anomalies.crossLocaleDeadLinks_es}**`);
  md.push(`- Proposed targets missing a **ja** slug (cross-locale dead link): **${anomalies.crossLocaleDeadLinks_ja}**`);
  md.push('- Self-matches: excluded by `_id` (tour.relatedTours). Unpublished targets: excluded at fetch (published perspective + en-slug filter).\n');
  md.push('## city.placesToGo audit\n');
  const ca = report.types.city_placesToGo_audit;
  md.push(`${ca.populated}/${ca.totalCities} cities populated; **${ca.empty} empty**:\n`);
  for (const e of ca.emptyCities) md.push(`- **${e.name}** (\`${e.slug}\`)${e.dropped ? ' _[dropped destination]_' : ''} — attraction guideArticles available: **${e.attractionGuidesAvailable}**${e.sample.length ? ' → ' + e.sample.join('; ') : ''}`);
  md.push('');
  // Reviewable samples (~10/type)
  for (const k of ['guideArticle_relatedTours', 'tour_relatedTours', 'hotel_relatedTours', 'nileCruise_relatedTours', 'article_relatedArticles']) {
    md.push(`## Sample — ${k} (first 10)\n`);
    for (const p of report.types[k].proposals.slice(0, 10)) {
      md.push(`**${p.title}**${p.candidateCount > CAP ? ` _(cap: ${p.candidateCount} candidates → 4)_` : ''}`);
      for (const r of p.refs) {
        const flags = [r.missingEs ? '⚠no-es' : '', r.missingJa ? '⚠no-ja' : '', r.droppedDest ? '⛔dropped' : ''].filter(Boolean).join(' ');
        md.push(`  - → ${r.title} \`${r.slug ?? '?'}\`${flags ? ' ' + flags : ''}`);
      }
      md.push('');
    }
  }
  writeFileSync('reports/related-links-proposal.md', md.join('\n'));
  console.log('wrote reports/related-links-proposal.md');

  // ── Console summary ──
  console.log('\n=== SUMMARY (no writes) ===');
  for (const k of ['guideArticle_relatedTours', 'tour_relatedTours', 'hotel_relatedTours', 'nileCruise_relatedTours', 'article_relatedArticles']) {
    const s = report.types[k];
    console.log(`  ${k}: fill ${s.wouldFill}/${s.source}, empty ${s.wouldRemainEmpty}, capHit ${s.capHitCount}`);
  }
  console.log(`  city.placesToGo empty: ${report.types.city_placesToGo_audit.empty}`);
  console.log(`  anomalies: dropped-targets ${anomalies.droppedDestTargets}, no-es ${anomalies.crossLocaleDeadLinks_es}, no-ja ${anomalies.crossLocaleDeadLinks_ja}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
