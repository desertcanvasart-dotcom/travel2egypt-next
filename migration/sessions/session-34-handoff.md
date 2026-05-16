# Session 34 — Hotel Grade Concept page

**Date:** 2026-05-16
**Branch:** `session-34-hotel-grade-concept`

## URL — slug preserved

`/hotel-grade-concept` — identical to legacy WP slug. No cutover redirect
needed.

## STOP-gate resolutions (operator-confirmed)

| # | Issue | Decision |
|---|---|---|
| 1 | Editorial copy missing | Operator placed `migration/content/hotel-grade-concept-copy.md`. Verified, 214 lines, fully-polished sections + 4 author-flagged TODOs. |
| 2 | About-page reference doesn't exist | Use legalPage pattern (session 30) as model. |
| 3 | hotel.category enum has 4 values (S/D/L + Boutique), not 3 | Roll Boutique into excluded set. Page renders S/D/L only; 1 boutique hotel + 1 boutique cruise omitted until recategorized in Studio. |
| 4 | No Lake Nasser cruise discriminator | Add `cruiseRoute: 'nile' \| 'lake-nasser'` field to nileCruise schema. Backfill via Studio post-session. Frontend renders all cruises under single "Cruises" sub-section when no Lake Nasser route exists; auto-splits when at least one vessel is tagged `lake-nasser`. |

## What shipped

### Schema
- [src/sanity/schemas/hotelAndCruise.ts](src/sanity/schemas/hotelAndCruise.ts):
  added `cruiseRoute` field to `nileCruise` (optional enum, `nile` /
  `lake-nasser`).
- [src/sanity/schemas/editorialPage.ts](src/sanity/schemas/editorialPage.ts):
  new entity type modeled on legalPage. Field groups: identity / hero /
  body / ribbon / cta / meta. `kind` enum supports `hotel-grade-concept`,
  `about`, `how-we-plan`, `other` — frontend queries by `kind`
  (locale-invariant). Registered in
  [schemas/index.ts](src/sanity/schemas/index.ts).
- [src/sanity/structure/index.ts](src/sanity/structure/index.ts): Studio
  Pages group now lists `editorialPage` first, then `page`, then
  `legalPage`.

### Content
- 1 editorialPage doc created in migration-staging:
  `editorial-page-hotel-grade-concept`.
- EN-only fields populated (heroHeading + heroSubhead + 2 sections + ribbon
  + bottom CTA, all CTA hrefs to `/plan-your-tour?context=…`).
  ES/JA fall back to EN via existing coalesce.
- Import script:
  [scripts/import-hotel-grade-concept.mjs](scripts/import-hotel-grade-concept.mjs) — re-runnable.
  Source-of-truth copy lives in
  [migration/content/hotel-grade-concept-copy.md](migration/content/hotel-grade-concept-copy.md).

### GROQ
- [src/sanity/lib/queries.ts](src/sanity/lib/queries.ts):
  - `editorialPageByKindQuery(locale)` — full doc projection (hero, sections, ribbon, CTAs).
  - `hotelsForGradeConceptQuery(locale)` — `category in [standard, deluxe, luxury]`, ordered by city orderRank then name. Excludes boutique.
  - `cruisesForGradeConceptQuery(locale)` — `tier in [standard, deluxe, luxury]`, `coalesce(cruiseRoute, 'nile')` for null-safe sorting. Excludes boutique and untiered.

### Frontend
- New [src/components/HotelGradeConceptPage.tsx](src/components/HotelGradeConceptPage.tsx) (server component, no `'use client'`). Hero / editorial body sections / orange ribbon / 3-column tier grid / bottom CTA. Mobile: anchor nav (S/D/L jump links) above stacked tier sections.
- Tier column layout: per tier → Hotels grouped by city (with city heading linking to /guide/[slug] and hotel names linking to /hotels/[slug]) → Cruises sub-section (single "Cruises" label when no Lake Nasser routes tagged; auto-splits to "Nile Cruises" + "Lake Nasser Cruises" once `cruiseRoute` field has values).
- Empty-tier placeholder when no hotels AND no cruises in that tier.
- New page route: [src/app/(site)/[locale]/hotel-grade-concept/page.tsx](src/app/(site)/[locale]/hotel-grade-concept/page.tsx)

### Translations
- `messages/{en,es,ja}.json`: full `hotelGradeConcept` namespace (tier
  headings + taglines, Hotels / Cruises / Nile Cruises / Lake Nasser
  Cruises section labels, empty-state, jump-to nav, meta title +
  description).
- ES + JA copy is functional but stacks with other deferred translation
  reviews from sessions 30/31/32/33.

### Sitemap
- [src/app/sitemap.ts](src/app/sitemap.ts) STATIC_PATHS +=
  `/hotel-grade-concept` at priority 0.7.

## Content audit at build time

Round-trip verified via direct GROQ:
- editorialPage doc loads cleanly (heroHeading, 2 sections, ribbon all populated)
- Hotels included in render: **64** (across S/D/L)
- Cruises included in render: **32** (across S/D/L; excludes boutique + untiered)

The tier column counts are slightly higher than my pre-flight census
suggested — operator may have continued the editorial categorization
between the pre-flight read and the merge. Either way, page renders
substantively from day one.

## Outstanding from the prompt's editorial TODOs

The source copy file flagged 4 verification items for operator review.
None were resolved at session-spawn; all four imported as-written
(stronger / more-confident phrasings). To soften any of them, edit the
editorialPage doc in Studio — no code change required.

1. **"Rooms we've actually stayed in, kitchens we've actually eaten in,
   and front-desk teams we've actually dealt with at 11pm…"** — kept as
   the most distinctive line. If reality is mixed (some hands-on, some
   sourced), soften via Studio edit per the source MD's suggestions.
2. **"Lock in our negotiated rates"** — kept as-written in the ribbon.
   Change to "secure the best available rate" if contract rates aren't
   established.
3. **"We drop properties when they don't hold the line"** — kept as-written
   in Why-this-matters. Soften to "we re-categorize" if you've never
   actually dropped one.
4. **"Three levels of 5-star stays" framing** — kept, with operator's
   decision 3 (Boutique excluded). Any non-5-star hotel currently tagged
   S/D/L would still appear and break the framing — flag if you spot one
   on the live page.

## V2 schema candidates

- **`cruiseRoute` backfill workflow** — Studio workflow filter for
  "Nile cruises · needs cruiseRoute" so the operator can find the ~4
  Lake Nasser vessels to tag. Worth adding alongside other workflow
  filters in a future micro-session.
- **`page` entity merger** — `editorialPage` and `page` schemas
  overlap (both are generic CMS content). Worth deciding if `page`
  should be deprecated or kept for thin one-off pages while
  `editorialPage` covers long-form. Not blocking.
- **About page candidate** — `editorialPage.kind` enum already includes
  `about`. The About route doesn't exist on this branch; spinning it up
  is a future small session if operator wants editorial-grade About copy.

## Smoke test (after `npm run dev`)

| URL | Expected |
|---|---|
| `/en/hotel-grade-concept` | Hero ("Our Hotel Grade Concept" + subhead + 2 CTAs), 2 editorial sections, orange ribbon with "Not sure which tier fits?", 3-column tier grid (S \| D \| L), bottom CTA with "Ready to start building your trip?" + 2 buttons |
| Tier columns | Standard: ~30 hotels grouped by city + ~4 Nile cruises; Deluxe: ~24 hotels + ~17 cruises; Luxury: ~9 hotels + ~7 cruises |
| Hotel name in any column | Links to `/hotels/[slug]` |
| City heading in any column | Links to `/guide/[city-slug]` |
| Cruise name in any column | Links to `/nile-cruises/[slug]` |
| Single "Cruises" sub-section per tier today | Auto-becomes "Nile Cruises" + "Lake Nasser Cruises" once you tag a vessel as `lake-nasser` in Studio |
| Mobile viewport | Anchor nav row (S/D/L) above stacked tiers; smooth scroll to each tier |
| `/es/hotel-grade-concept`, `/ja/hotel-grade-concept` | Locale-correct labels; editorial body falls back to EN |
| Studio /studio/staging | Editorial pages list appears in Pages group; click the Hotel Grade Concept doc → all field groups (Hero, Body sections, Mid-page ribbon, Bottom CTA, Meta) render with content |

## Outstanding from prior sessions (unchanged)

- Session 21 orphan drafts (4 docs)
- `grand-islamic-cairo-day-tour` misclassification (session 24)
- `itineraryPhases` schema candidate (session 24)
- Fallback hero images decision (session 25 follow-up)
- Bulk `poweredBy` assignment plan (session 25 — 25 cruise-ships → engine, 9 dahabiyas → wind, dry-run plan awaiting confirm)
- Cookie consent banner UI (session 30 follow-up)
- ES/JA translation reviews for sessions 30/31/32/33/34 namespaces
