# Destination-hub misclassification — `*-egypt` deferred list, RESOLVED

Source decisions: session 6 Phase 3, locked 2026-05-03.

This file supersedes the per-slug `Target` column in
`migration/.diffs/destination-hub-misclassified-deferred.md`. Session 6.5
reads from THIS file as canonical input for the 449-subpage write cohort.

The deferred file's classifier had only `tour | guideArticle | unclear`
in its target vocabulary. Phase 3 review re-routed 18 of the 20 originally
classified `guideArticle` slugs because the schema reality (guideArticle
requires `parentCity`) didn't match the country-level content shape of
those slugs. The natural target is `travelTip` (URL `/travel-tips/[slug]`,
no parent-city requirement, schema description: "Practical, factual travel
tips (visa, currency, dress, tipping, safety, etc.)").

## Phase 3 decisions (locked)

### D1 — Routing: 2 guideArticle + 18 travelTip

The 20 deferred-file `guideArticle` rows split into:

- **2 → `guideArticle`** (parent-city-bound `reaching-{siwa,sohag}-egypt`)
- **18 → `travelTip`** (country-level practical/cultural topics)

**Rationale:** schema wins when classifier output conflicts with schema
reality. Re-route to the natural schema home rather than loosening the
schema or fabricating synthetic refs to satisfy the classifier. Classifier
heuristics are slug-pattern-based; schema design encodes editorial intent.
Editorial intent is canonical.

(Methodology lesson 16 candidate — see Step 5 close note.)

### D2 — `about-egypt`: decision-deferred to post-cutover

Mark as **needing editorial review post-cutover.** Default disposition for
cutover: redirect `/about-egypt/` → `/`. Editorial decision post-cutover
whether to harvest content into homepage standfirst, create a new About
Egypt page, or simply drop.

WP body is 16,674 chars (~583 words), Elementor-wrapped. First ~500 words
captured in §"about-egypt body sample" below for editorial review.

### D3 — `month-by-month-guide-to-egypt`: travelTip with `when-to-go` category

Title semantics suggest reference content, not narrative. If post-write
inspection in 6.5 shows the body is actually narrative editorial, Studio
can re-classify (move to `article`).

### D4 — `currency-in-egypt`: travelTip with tour-promo strip + fallback threshold

Migrate as `travelTip` (likely category `practical-essentials` or
`culture-and-money`). Apply the existing `tourPromo` / `categoryGrid`
strip rules at HTML→PT conversion to remove the embedded tour list.

**Fallback threshold:** if post-strip body length < **3,000 characters**,
fall through to redirect-at-cutover (`/currency-in-egypt/` → `/travel-tips/`)
and do NOT migrate. Session 6.5 reads this threshold and decides
automatically.

### D5 — `hassle-free-egypt`: redirect at cutover, do NOT migrate

Closest precedent: known-issues Q5 `egypt-travel-guide` treatment (archive
page → redirect → don't migrate). Slug + 6 tour-titles + marketing-aggregator
copy fits the same pattern. Body is 62,831 chars, almost certainly heavy
on tour promos.

**Redirect destination:** `/hassle-free-egypt/` → `/tours/` (or whatever
the tours listing page slug is at cutover; confirm with session 9
redirect-map work).

## Per-slug routing table

23 dispositions (= 20 reclassified guideArticle rows after splitting
`about-egypt` (deferred) + `currency-in-egypt` (conditional travelTip) +
`hassle-free-egypt` (redirect) out of the bucket; the remaining 17 split
2 guideArticle + 15 travelTip).

| WP id | Slug | Target | Section / Parent / Category | Notes |
|---:|---|---|---|---|
| 60507 | `reaching-siwa-egypt` | `guideArticle` | section=`plan-your-trip`, parent=`siwa` | "reaching" = arrival logistics |
| 60534 | `reaching-sohag-egypt` | `guideArticle` | section=`plan-your-trip`, parent=`sohag` | same shape |
| 614 | `about-egypt` | **deferred** | (post-cutover review) | D2; default redirect `/` |
| 60892 | `airports-in-egypt` | `travelTip` | category=`getting-around` | |
| 60934 | `transportation-in-egypt` | `travelTip` | category=`getting-around` | |
| 60953 | `electricity-in-egypt` | `travelTip` | category=`practical-essentials` | |
| 60954 | `wifi-in-egypt` | `travelTip` | category=`practical-essentials` | |
| 60914 | `telephones-in-egypt` | `travelTip` | category=`practical-essentials` | |
| 60929 | `time-in-egypt` | `travelTip` | category=`practical-essentials` | |
| 60909 | `language-in-egypt` | `travelTip` | category=`practical-essentials` | |
| 60949 | `toilets-in-egypt` | `travelTip` | category=`practical-essentials` | |
| 60895 | `bargaining-in-egypt` | `travelTip` | category=`culture-and-money` | |
| 60933 | `tipping-in-egypt` | `travelTip` | category=`culture-and-money` | |
| 60950 | `touts-in-egypt` | `travelTip` | category=`culture-and-money` | |
| 73387 | `cultural-etiquette-in-egypt` | `travelTip` | category=`culture-and-money` | |
| 60912 | `ramadan-in-egypt` | `travelTip` | category=`when-to-go` | |
| 61367 | `month-by-month-guide-to-egypt` | `travelTip` | category=`when-to-go` | D3; re-class via Studio if narrative |
| 73307 | `culinary-journey-in-egypt` | `travelTip` | category=`food` | |
| 60931 | `solo-woman-traveler-in-egypt` | `travelTip` | category=`traveler-segments` | |
| 60951 | `vegetarian-travelers-to-egypt` | `travelTip` | category=`traveler-segments` | |
| 60896 | `currency-in-egypt` | `travelTip` (conditional) | category=`culture-and-money` | D4; fallback redirect if post-strip body < 3000 chars |
| 86640 | `hassle-free-egypt` | **redirect** | → `/tours/` | D5; don't migrate |

(Tour rows from the deferred file — `10-days-felucca-journey-through-egypt`,
`12-day-amazing-family-vacation-in-egypt`, `essential-egypt`,
`the-holy-family-trip-in-egypt`, `tour-of-egypt` — out of session 6 / 6.5
scope; session 8 owner.)

## travelTipCategory placeholder buckets (for session 6.5)

The 18 (or 17 after currency conditional) travelTips group into 6 category
buckets. **`travelTipCategory` documents do NOT yet exist in either
production or migration-staging.** Session 6.5 must address this before
the travelTip writes — see "Session 6.5 prerequisites" below.

| Category bucket | Count | Members |
|---|---:|---|
| `getting-around` | 2 | airports, transportation |
| `practical-essentials` | 6 | electricity, wifi, telephones, time, language, toilets |
| `culture-and-money` | 4–5 | bargaining, tipping, touts, cultural-etiquette, currency (conditional) |
| `when-to-go` | 2 | ramadan, month-by-month-guide |
| `food` | 1 | culinary-journey |
| `traveler-segments` | 2 | solo-woman-traveler, vegetarian-travelers |

Bucket names above are placeholder slugs. Final `travelTipCategory.name`
i18n strings (EN/ES/JA) and `slug.current` per locale are session 6.5
authoring work.

## Session 6.5 prerequisites — CRITICAL

These items must be resolved before the 18 travelTip writes can land:

### Prerequisite 1 — `travelTipCategory` docs

`travelTipCategory` is a referenced type ([travelTip.ts:69](../../src/sanity/schemas/travelTip.ts:69)).
The schema does NOT mark `category` as required (`Rule.required` absent),
so first-run writes can omit it and editorial Studio work populates later.
Two viable approaches:

- **Approach A — Pre-create the 6 category docs in 6.5 pre-flight.**
  Author EN/ES/JA names + slugs for `getting-around`,
  `practical-essentials`, `culture-and-money`, `when-to-go`, `food`,
  `traveler-segments`. Then the 18 travelTip mapper outputs reference
  them by `_id`.
- **Approach B — Write travelTips with `category` omitted.** Editorial
  Studio post-cutover triages each travelTip into the right
  travelTipCategory once those are authored.

**Recommendation:** Approach A. The 6 category buckets are already
proposed; pre-creating them is ~30 minutes of authoring vs. 18 separate
post-cutover triage decisions. Surface for session 6.5 author confirmation.

### Prerequisite 2 — `travelTip` mapper

The current importer has mappers for `article`, `city`, `guideArticle`,
`wikiMonument`, `tour`, `hotel`, `nileCruise`, `editorialCategory`,
`serviceStub`. **No `travelTip` mapper exists.** Session 6.5 must add
one (`scripts/wp-import/mappers/travelTip.ts`) following the
guideArticle / city field-level i18n pattern. Mapper must:

- Produce `_id = wp-page-${en.id}` deterministic from WP id
- Produce `_type = 'travelTip'`
- Produce `title`, `slug`, `summary`, `body` as i18n arrays per the
  schema's `internationalizedArrayString` / `internationalizedArrayText` /
  `localizedPortableTextField` types
- Optionally reference a `travelTipCategory` from the per-slug routing
  table above (gated on Prerequisite 1)
- Write `migration` provenance via `buildMigrationMeta`
- Apply `tourPromo` / `categoryGrid` strip rules during HTML→PT
  (especially load-bearing for D4 `currency-in-egypt`)

### Prerequisite 3 — `travelTip` registration in `MERGE_REGISTRY`

When the travelTip mapper lands, also add `travelTip` to the
`MERGE_REGISTRY` in [scripts/wp-import/merge.ts](../../scripts/wp-import/merge.ts)
with a `TRAVEL_TIP_EDITORIAL_ONLY_FIELDS` constant. Without registration,
the dispatcher's `isMergeableType` returns false and the write path
silently bypasses merge protection (the failure mode the registry
exists to prevent — see session 6 close note on registry-gate semantics).

Field classification proposal for review at session 6.5 Phase 2 entry:

- **Editorial-only:** `category` (mapper writes default, editorial
  reassignment canonical — same shape as article.category /
  guideArticle.section), `relatedTips`, `seo`
- **WP-sourced (Q3 rules):** `title`, `slug`, `summary`, `body`,
  `heroImage`, `migration`

### Prerequisite 4 — `--filter-by-template` value for travelTips

The 18 travelTip slugs were originally classified by the WP classifier as
`destination-hub` (which is why they appeared in the *-egypt deferred
list). Session 6.5 must invoke `wp-import` with a deterministic include
list — `--slug-include` is the right tool — to pick exactly these
17–18 slugs without re-running the misclassification trap.

Suggested invocation pattern (session 6.5 author refines):

```bash
npm run wp-import -- \
  --type=page \
  --slug-include "airports-in-egypt,transportation-in-egypt,...,vegetarian-travelers-to-egypt" \
  --dry-run
```

Or extend the classifier with a `travelTip` PageType + the suffix /
prefix rules from the heuristic notes block (deferred file lines 71-77),
then use `--filter-by-template travelTip --type=page`.

## Manual redirects for session 9

These redirects are flagged for `migration/manual-redirects.csv`
(generated in session 9 step 13 per [known-issues.md "Manual redirects
flagged for session 9"](../known-issues.md)):

- `/about-egypt/` → `/` *(default per D2; editorial may revise post-cutover)*
- `/es/<ES-slug-of-about-egypt>/` → `/es/`
- `/ja/<JA-slug-of-about-egypt>/` → `/ja/`
- `/hassle-free-egypt/` → `/tours/` *(D5; confirm tours-listing path at cutover)*
- `/es/<ES-slug-of-hassle-free-egypt>/` → `/es/tours/`
- `/ja/<JA-slug-of-hassle-free-egypt>/` → `/ja/tours/`
- `/currency-in-egypt/` → `/travel-tips/` *(conditional fallback per D4 if
  post-strip body < 3000 chars; emitted only if D4's threshold trips)*

Locale-specific WP slugs to be looked up in session 9 redirect-map work.

## about-egypt body sample (first ~500 of 583 words)

For post-cutover editorial review per D2. Source: `https://travel2egypt.org/wp-json/wp/v2/pages/614`,
fetched 2026-05-03. HTML stripped, whitespace normalized, Elementor wrapper
removed.

> Traveling in Egypt
>
> About Egypt: A Comprehensive Guide to Traveling in the Timeless Land
>
> About Egypt's timeless allure, it serves as a beacon to travelers eager
> to unravel the mysteries of its ancient past and bask in the beauty of
> its present. As you cruise down the Nile River, the lifeblood of this
> remarkable country, you're enveloped by the "Red Land" deserts. These
> natural barriers not only protected but also nurtured one of history's
> most splendid civilizations, making every moment spent in Egypt a
> profound journey through time. This river journey offers more than just
> a passage through history; it's a gateway to understanding the unique
> blend of human achievement and natural wonders that have captivated
> minds for millennia, showcasing the essence of what Egypt is about.
>
> Cairo, the vibrant heart of Egypt, stands as a testament to the
> country's layered history, from the Pharaohs to the Fatimids, Ottomans,
> and beyond. It's a city where ancient pyramids gaze upon modern hustle,
> inviting explorers to discover its secrets. Meanwhile, Sharm ElSheikh,
> with its tranquil beaches and crystal clear waters, offers a serene
> escape from the world, showcasing Egypt's ability to enchant visitors
> with its diverse landscapes.
>
> The revival of the long cruise from Cairo to Aswan epitomizes the
> essence of Egyptian travel. This journey, a blend of adventure and
> tranquility, passes through landscapes that have remained unchanged for
> centuries, offering glimpses of life along the Nile that continues as
> it has since the time of the Pharaohs. These "floating palaces" provide
> a unique vantage point from which to appreciate the enduring legacy of
> Egypt's architectural and cultural marvels.
>
> Among Egypt's many jewels are the resorts that dot its landscapes,
> providing oases of relaxation and luxury in the midst of its storied
> terrains. These resorts cater to a wide range of tastes, offering
> everything from serene beachfront escapes to luxurious havens nestled
> in the desert's embrace. Sharm ElSheikh, often hailed as a slice of
> paradise, stands out as a premier destination for those seeking both
> adventure and tranquility. Nestled on the southern tip of the Sinai
> Peninsula, it boasts some of the world's most spectacular underwater
> sceneries, making it a haven for divers and snorkelers who come to
> explore the vibrant coral reefs of the Red Sea.
>
> Exploring Egypt is to walk through chapters of human history itself,
> from the grandeur of its ancient monuments to the bustling markets of
> its cities and the peaceful sands of its deserts and beaches. Each step
> is a story, each landscape a painting, and each moment a memory waiting
> to be cherished. As you embark on this journey of discovery, we've
> compiled a comprehensive guide to assist you in navigating the wonders
> of Egypt. Below, you'll find links to all the essential travel tips
> you need for a seamless Egyptian adventure: Certainly! Here are the
> names of the travel tips for Egypt: Updated on 29 Nov, 2024 Tipping In
> Egypt Travel Insuance Airports in Egypt Travel with Disabilities Toilets
> in [...]

[--- truncated at 500 of 583 words ---]

**Editorial observation:** the tail of the body is a flat list of
travel-tip names ("Tipping In Egypt", "Travel Insurance", "Airports in
Egypt", "Travel with Disabilities", "Toilets in...") — i.e., this page
is functioning as the WP archive/index for the travel-tips collection.
Same archetype as Q5's `egypt-travel-guide`. The first 4–5 paragraphs
above ARE substantive editorial introduction prose; the listing tail is
not.

**Post-cutover editorial paths:**

- (i) Harvest the first 4–5 prose paragraphs into a homepage standfirst
  block (after the brand hero) or a new "About Egypt" landing
- (ii) Drop the listing tail; the new `/travel-tips/` landing page
  serves that function natively
- (iii) Redirect `/about-egypt/` → `/` (default per D2) until (i)/(ii)
  are decided

## Cross-reference

- Deferred file (superseded for guideArticle column):
  [migration/.diffs/destination-hub-misclassified-deferred.md](destination-hub-misclassified-deferred.md)
- Q5 `egypt-travel-guide` redirect precedent:
  [migration/known-issues.md "Cutover decisions made" Q5](../known-issues.md)
- Manual redirects mechanism (session 9 step 13):
  [migration/known-issues.md "Manual redirects flagged for session 9"](../known-issues.md)
- guideArticle schema (parentCity required):
  [src/sanity/schemas/guideArticle.ts](../../src/sanity/schemas/guideArticle.ts)
- travelTip schema (no parentCity, optional category):
  [src/sanity/schemas/travelTip.ts](../../src/sanity/schemas/travelTip.ts)

## End of Phase 3 artifact

Phase 3 contract: decision capture only, no staging writes. Session 6.5
consumes this file as canonical input for the 17–18 travelTip writes +
2 guideArticle writes + 2 (or 3 if D4 fallback trips) cutover redirects.
