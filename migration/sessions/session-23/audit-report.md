# Tour entity — schema vs frontend parity audit

**Date:** 2026-05-15
**Dataset:** `migration-staging`
**Scope:** read-only audit of the `tour` document type (covers both day tours and packages — they share the schema).
**Total tour docs:** 194 (100 dayTour, 94 package)

## Summary

| Class | Top-level fields | Day-sub fields | Notes |
|---|---:|---:|---|
| **Match** (data + rendering) | 13 | 0 | Working as intended |
| **Gap A** (no data, no render) | 1 | 10 | Schema-only; defer |
| **Gap B** (DATA but NO RENDERING — *invisible work*) | **1** | **3** | Operator + migration work that doesn't surface |
| **Gap C** (rendered but no data — editorial backlog) | 9 | 0 | Frontend ready, backlog |

**Headline number — invisible work doc-cells:** **2,654**

Breakdown:
- 189 tours have a populated `days[]` array — frontend never reads it
- 823 day-objects total inside those arrays
- of those, 823 have `dayNumber`, 819 have `title`, 823 have `morning` (PT narrative)
- 189 + 823 + 819 + 823 = **2,654 populated cells that are invisible to end users**

For context: the entire tour entity has roughly (194 docs × 24 fields) ≈ 4,656 maximum doc-cells. **~57% of the populated, non-trivial editorial surface in `days[]` is dark.**

## Gap B — Invisible work (priority to fix)

Fields where data exists in Sanity but no frontend reads it.

| Field | Type | Populated docs/cells | Should render in | Recommendation |
|---|---|---:|---|---|
| `days` | array<tourDay> | **189 tours** | tour + package detail pages | **Wire structured day-by-day rendering. Replace the legacy `itinerary` PT renderer.** |
| `days[].dayNumber` | number | 823 day-objects | day section header | Render alongside title |
| `days[].title` | i18n string | 819 day-objects | day section heading | "Day N — {title}" |
| `days[].morning` | i18n PT | 823 day-objects | day section body | The actual editorial narrative — currently buried in Sanity, not on any page |

These four are coupled: they're all inside `days[]`. One frontend change unlocks all of them.

The cause: schema migration moved freeform tour itineraries into structured `days[]` (one of the early reorganization sessions); the deprecated `itinerary` PT field was kept "temporarily so production tours keep rendering" (per the schema description at [src/sanity/schemas/tour.ts:357](src/sanity/schemas/tour.ts:357)). Frontend was never updated to read `days[]`. The deprecated field has 0 data — so today the frontend reads nothing, even though the data is sitting in `days[]`.

**Note on day sub-fields:** `cities`, `lunch`, `afternoon`, `meals`, `accommodation`, `highlights`, `transport`, `suggestedActivities`, `paceRating`, `photoSpots` all have 0 data — Gap A for now. They become Gap C the moment day-rendering ships, since the renderer would naturally consume them.

## Gap C — Editorial backlog (frontend ready, data pending)

Fields with rendering wired but zero or near-zero data. Operator can fill in Studio to surface immediately.

| Field | Type | Pop | Total opportunity |
|---|---|---:|---|
| `durationLabel` | i18n string | 0/194 | Heavy: rendered in 5 places (cards + detail pages + JSON-LD) |
| `highlights` | i18n string array | 0/194 | Detail page bullet section |
| `inclusions` | i18n PT | 0/194 | Detail page side-by-side block |
| `exclusions` | i18n PT | 0/194 | Detail page side-by-side block |
| `relatedTours` | refArray | 0/194 | Detail page cross-reference grid |
| `relatedGuides` | refArray | 0/194 | Detail page (auto-derived `relatedGuideArticles` partially fills the slot) |
| `relatedTravelerStories` | refArray | 0/194 | Quote block grid |
| `seo` | obj | 0/194 | Metadata override (default builds from title+summary) |
| `durationHours` | number | 7/100 dayTours | Session-22 addition; 93 dayTours need fill |

These are all optional. None are blocking; user-facing pages render fine without them. Operator picks the order based on editorial priority.

## Gap A — Schema-only fields (no immediate action)

Fields with no data and no rendering. Defer until a business need surfaces.

| Field | Type | Notes |
|---|---|---|
| `gallery` | imageArray | No GROQ projection, no detail-page renderer. |
| `days[].cities` | refArray | Becomes Gap C if day-rendering lands. |
| `days[].lunch` | i18n string | Same. |
| `days[].afternoon` | i18n PT | Same. |
| `days[].meals` | i18n string | Same. |
| `days[].accommodation` | i18n string | Same. |
| `days[].highlights` | i18n string array | Same. |
| `days[].transport` | i18n string | Same. |
| `days[].suggestedActivities` | i18n string array | Same. |
| `days[].paceRating` | number | Same. |
| `days[].photoSpots` | i18n string array | Same. |

## Match — Working correctly

13 top-level fields work end-to-end. Notable margins:

| Field | Pop | Note |
|---|---:|---|
| `type`, `cities`, `durationDays`, `title`, `slug`, `migration` | 194/194 | Fully populated, fully rendered |
| `theme` | 94/94 packages | All packages have a theme (per validation) |
| `tourMode` | 156/194 | **38 docs missing required field** — schema validation runs in Studio, not on import. Editorial backlog. |
| `summary`, `body` | 186/194 | 8 docs missing — backlog. |
| `heroImage` | 109/194 | 85 missing — already surfaced in Studio's "Missing hero image" workflow filter. |
| `priceIndication` | 3/194 | Low pop is by design; operator fills selectively. |
| `durationHours` | 7/100 dayTours | Session-22 field; 93 day-tours pending fill. |
| `migration` | 194/194 | Internal field, intentionally non-rendering. |

## Recommendations

**Gap B impact: 2,654 invisible doc-cells, dominated by structured day-by-day content.** That's well over the spec's "100 doc-cells" threshold for scheduling a frontend close-up session.

### Recommended scope for Session 24

**Wire structured days[] rendering on tour + package detail pages.** Concretely:

1. Update GROQ projection in [src/sanity/lib/queries.ts](src/sanity/lib/queries.ts) — `tourBySlugQuery`. Add `days[]` projection with city resolution and PT bodies for `morning`/`afternoon` (mirror the cruise itinerary projection added in session 22 — [src/sanity/lib/queries.ts:436-471](src/sanity/lib/queries.ts:436)).
2. Add an itinerary section to tour + package detail pages reading `tour.days`. Pattern is already proven in [src/app/(site)/[locale]/nile-cruises/[slug]/page.tsx](src/app/(site)/[locale]/nile-cruises/[slug]/page.tsx) — copy that day-by-day block and adapt.
3. Either (a) remove the legacy `itinerary` PT renderer + `PhasedItinerary` helper in `packages/[slug]/page.tsx` since the legacy field has zero data, OR (b) keep the legacy renderer as a fallback for the (currently zero) docs that have legacy data. Operator's call.
4. **Do not delete the `itinerary` schema field yet** — schema removals deserve their own session, after the frontend cutover ships and we confirm zero data dependency.

Estimated impact: **2,654 cells instantly visible** to end users with no editorial work required (the data already exists from migration). The cleanest single-session "schema-frontend parity" win available.

### Defer

- Gap C work is operator-paced, no engineering blocker.
- Gap A `gallery` and the unfilled day-sub-fields (lunch/afternoon/meals/accommodation/transport/etc.) — wait for Gap B fix to ship; they'll auto-promote to Gap C once the day renderer reads them.
- The 38 `tourMode`-missing docs and 8 `summary`/`body`-missing docs are existing backlog (already addressable via Studio workflow filters or via a small validation pass).

## Methodology

- Population queries used `pt::text(<field>[_key=="en"][0].value)` for locale-keyed PT fields (the correct path that session 21's deletion script got wrong).
- Day-sub-field counts use per-doc projections (`days[predicate]` then sum in JS) because GROQ's `*[].days[]` flattening behavior across documents is unreliable. Verified by spot-check: `dayNumber` populated on all 823 day-objects (matches migration-script invariant).
- Frontend rendering inventory built by reading the 6 tour-related files: detail pages (tours + packages), list pages, cards (TourCard + PackageCard), `ToursFilter`. Auxiliary references (sitemap, structured-data builders) inspected for completeness.
