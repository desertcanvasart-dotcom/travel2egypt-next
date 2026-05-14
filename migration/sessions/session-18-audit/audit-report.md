# Session 18 — Tour misclassification pre-flight audit

**Date**: 2026-05-14
**Scope**: read-only audit of 222 `tour` documents in migration-staging.
**Trigger**: operator flagged `private-tours-in-edfu` as a destination
guide that was wrongly imported as a tour.
**Outputs**:
- [tour-misclassification-candidates.json](tour-misclassification-candidates.json) — full 29-row JSON
- [tour-misclassification-summary.json](tour-misclassification-summary.json) — tallies
- [audit-report.md](audit-report.md) — this file

## TL;DR

The headline finding is **not** "tours got misclassified as something
else" — it's that **26 of the 222 tour docs (~12%) are empty shell pages
that were never real tours to begin with**. They are aggregator/landing
husks from the WP site (e.g. `top-tours-in-giza` with 0 chars of body).

| Bucket | Count | What they are |
|---|---:|---|
| Empty shell pages with listing-style slugs | 26 | Aggregator/landing husks — `top-tours-in-X`, `N-days-egypt-tours`, `private-tours-in-X`, `X-tour-packages`, `cultural-tours-in-X` |
| Real tours flagged by `-guide$` false-positive | 3 | `{aswan,cairo,luxor}-private-car-and-guide` — actual concierge services, the "guide" is human |
| **Total candidates surfaced** | **29** | |

**No real tour content was misclassified as something else.** Bodies
that look tour-shaped are tour-shaped; the slugs that *look* listicle
have no body to be misclassified.

## Distribution by pattern group

| Group | Pattern theme | Count |
|---|---|---:|
| A | Generic destination-tour (`private-tours-in-`, `tours-of-`, `X-tour-packages`, `cultural-tours-in-`) | 9 |
| B | Listicle / aggregator (`top-tours-in-`, `N-days-egypt-tours`) | 17 |
| D | Editorial framing (`-guide$`, `discover-`, `explore-`) | 3 |
| C | Activity/experience patterns | 0 |

Group C returned no matches — `activities-in-X` and `-experiences-in-X`
slugs don't exist in the current tour corpus.

## Body-content signal

All 29 candidates resolved to `ambiguous` because:
- 26 have 0-character bodies (no signal to extract)
- 3 (`*-private-car-and-guide`) have content but none of the strong
  tour-shape phrases (no "Day 1/Day 2", no "Inclusions/Exclusions"
  side-by-side, no "from $X") — they're concierge-service one-pagers
  with itinerary suggestions

This is itself useful — **body emptiness is the strongest single
signal**. Of the 222 tours, the empty-body subset overlaps almost
entirely with listing-style slug patterns.

## Conflicts with existing guideArticle (same city)

14 of 29 candidates have a same-city guideArticle already published. Notable conflicts:

| Empty tour shell | Existing guide that already covers the city |
|---|---|
| `private-tours-in-edfu` | `edfu-historical-guide` |
| `private-tours-in-port-said` | `port-said-historical-guide` |
| `top-tours-in-abu-simbel` | `abu-simbel-historical-overview` |
| `top-tours-in-al-wadi-al-gadid` | `history-of-al-wadi-al-gadid` |
| `top-tours-in-giza` | `how-to-get-to-giza` |
| `top-tours-in-kharga-oasis` | `how-to-go-to-kharga-oasis` |
| `top-tours-in-qena` | `qena-historical-overview` |
| `top-tours-in-sharm-el-sheikh` | `sharm-el-sheikh-small-group-day-tours` |
| `cultural-tours-in-suez` | `getting-around-suez` |
| `cultural-tours-in-taba` | `getting-around-taba` |
| `nuweiba-tour-packages` | `how-to-go-to-nuweiba` |
| `siwa-tour-packages` | `adventure-activities-in-siwa-oasis` |
| `sohag-tour-packages` | `sohag-weather-guide` |
| `private-tours-in-dahab` | `dahab-restaurants` |

These 14 are the strongest candidates for "delete the empty tour shell,
let the existing guideArticle stand". The remaining 12 have no obvious
sibling guideArticle and would need either a fresh stub or a redirect.

## Sample 10 candidates with full context

### 1. `private-tours-in-edfu` (Group A, empty body) — operator's flag
- Title: "Private Tours In Edfu"
- City refs: edfu
- Body: empty (0 chars)
- Existing guide conflict: [edfu-historical-guide](https://example.tld/guide/edfu/edfu-historical-guide)
- **Recommendation**: delete the tour shell; existing guide already serves the city

### 2. `private-tours-in-dahab` (Group A, empty body)
- Title: "Private Tours In Dahab"
- City refs: dahab
- Body: empty
- Conflict: `dahab-restaurants` (weak match — different topic, same city)
- **Recommendation**: delete the tour shell; consider stubbing a `dahab-tours-overview` guide if SEO traffic warrants

### 3. `private-tours-in-port-said` (Group A, empty body)
- Body: empty
- Conflict: `port-said-historical-guide`
- **Recommendation**: delete the tour shell

### 4. `top-tours-in-giza` (Group B, empty body)
- Title: "Top Tours In Giza"
- City refs: giza
- Body: empty
- Conflict: `how-to-get-to-giza` (weak — logistics guide, not tour-listing)
- **Recommendation**: delete the tour shell; consider stubbing a `top-tours-in-giza` guideArticle if the WP slug had SEO equity (preserve via redirect)

### 5. `top-tours-in-sharm-el-sheikh` (Group B, empty body)
- Title: "Top Tours In Sharm El Sheikh"
- Body: empty
- Conflict: `sharm-el-sheikh-small-group-day-tours` (strong — same intent)
- **Recommendation**: delete the tour shell; the existing guide is a near-duplicate

### 6. `10-days-egypt-tours` (Group B, empty body)
- Title: "10 Days Egypt Tours"
- Body: empty
- Conflict: none — this is country-level, not city-level
- **Recommendation**: 1-of-10 in a `N-days-egypt-tours` family. Either build a single "Egypt by trip length" hub guide or delete; do not migrate 10 separate empty stubs to guideArticle

### 7. `nuweiba-tour-packages` (Group A, empty body)
- Title: "Nuweiba Tour Packages"
- Body: empty
- Conflict: `how-to-go-to-nuweiba`
- **Recommendation**: delete; existing guide serves the city. Note: type=dayTour despite "packages" in slug — this is the WP shell oddity

### 8. `cultural-tours-in-suez` (Group A, empty body)
- Title: "Cultural Tours In Suez"
- Body: empty
- Conflict: `getting-around-suez`
- **Recommendation**: delete the tour shell

### 9. `aswan-private-car-and-guide` (Group D, **false positive**)
- Title: "Discover Aswan: Private Car and Personal Guide for a Day"
- Body: 1543 chars — real itinerary content with hotel pickup, 8-hour service description
- Body-signal evidence: pickup mentioned but didn't trigger the `pickup+hotel` rule due to phrasing variations
- **Recommendation**: **keep as tour**. Slug ends in `-guide` but refers to a human guide, not editorial content. The Group D `-guide$` regex is too permissive. This is a real concierge service.

### 10. `cairo-private-car-and-guide` (Group D, **false positive**)
- Title: "Private Car and Guide for a Day"
- Body: 1305 chars — "Suggested Itinerary Ideas", museum/site descriptions, real service
- **Recommendation**: **keep as tour**. Same false-positive class as #9.

## Estimated Phase-2 (migration) scope

If operator wants to act on this audit:

### Bucket 1 — Delete-and-redirect (recommended for the 14 with conflicts)
- 14 empty tour shells where a same-city guideArticle already exists
- Action: delete the tour doc, write a 301 redirect from
  `/tours/<slug>` → `/guide/<city>/<guide-slug>` (or
  `/guide/<city>` if no specific guide is a clean target)
- Effort: 1 batch script, ~30 minutes including redirects

### Bucket 2 — Delete-only (12 with no conflict)
- 9× `N-days-egypt-tours` country-level listicles
- 1× `8-days-best-of-egypt-tour-package` (no conflict but same family)
- 2× others without conflicts (re-check JSON)
- Action: delete; if SEO equity exists, redirect to `/tours` landing
  (filtered by duration where applicable)
- Effort: same batch as bucket 1

### Bucket 3 — No action (3 false positives)
- `{aswan,cairo,luxor}-private-car-and-guide`
- Real tour content. The "guide" in the slug refers to a human guide.

### Bucket 4 — Classifier refinement (Phase 3)
The slug patterns that surfaced these shells should be added to the
WP-import classifier so that future re-imports do not re-create them.
Suggested classifier rules:
- empty-body OR <200 chars body + listing-style slug → skip-import (or
  route to `editorial-shell-review` queue)
- `-tour-packages?$` → not a single tour; aggregator
- `top-tours-in-*` → aggregator
- `^\d+-days?-egypt-tours?$` → aggregator
- `-private-car-and-guide` → real tour (whitelist)

## Suggested decisions for operator review

1. **Confirm bucket strategy** — is "delete the 26 empty shells and
   redirect where guides exist" the right move, or do you want to
   preserve some as editorial stubs (in case the WP slug carries SEO
   weight)?
2. **Decide on country-level listicles** (`N-days-egypt-tours`) —
   delete entirely, or consolidate into a single "trip planning by
   duration" hub?
3. **Classifier rule changes** — pre-approve the rules above, or want
   a Phase-3-only deeper review?
4. **Re-import safety** — any deletes need to also update the import
   manifest/classifier so a future WP sync doesn't reintroduce them.

## Audit limitations

- **No N+1 sweep**: the `tour-shape` heuristic looks at the EN body
  only. ES/JA bodies could carry tour content for the empty-EN docs,
  but the migration importer treats EN as canonical so this is
  vanishingly unlikely.
- **Conflict cross-check is keyword-based**: `existing_guide_conflict`
  uses parentCity match or substring overlap. Some conflicts surfaced
  are weak (e.g. `dahab-restaurants` is a restaurant guide, not a
  tour-coverage guide); operator should treat the conflict field as
  "is there *something* for this city" not "is this a true duplicate".
- **No traffic data**: this audit doesn't know which slugs carry SEO
  equity. Delete-vs-redirect decisions should be cross-referenced with
  Search Console data before the redirects ship.
- **False-positive class**: the `-guide$` regex picked up 3 real tours
  whose slug ends in `-guide` because "guide" = human. The audit
  surfaces them but the recommendation is correct (keep). No automated
  action should fire on these.
