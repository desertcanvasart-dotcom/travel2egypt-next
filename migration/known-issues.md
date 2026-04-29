# WP → Sanity migration: known issues

Working document for the next session. Captures the diagnostic findings from session 4
run 2 (post-strip-rules). The 495 articles + 165 translation.metadata are in
`migration-staging` with the documented issues listed below.

---

## Cutover decisions made

Locked decisions, dated. Items leave the open-questions / cutover-blockers
list once they appear here. Future sessions trust this section over any
narrative claim elsewhere.

### Q1 — Brand swap: Ring 2, scheduled at session 5.5

**Decision (2026-04-28, Islam):** Brand swap is Ring 2 scope (typographic
hierarchy affecting Portable Text rendering — heading scales, line-heights,
pull-quote/side-image composition) and is scheduled as a dedicated
session 5.5 between sessions 5 and 6.

**Rationale:** Ring 2 timing means the swap happens *after* city UPDATE
content lands but *before* destination-subpage and entity-type rendering
patterns calcify in sessions 6-8. Brand inputs are gathered at
`~/Desktop/travel2egypt-brand/`. Session 5 writes content only, no
styling — rendering decisions in session 5 do not need to anticipate the
swap. Session 5 visual QA uses the structural-only standard; typography
mismatches are not flagged as bugs.

### Q3 — city UPDATE merge rule: WP overwrites where it has a value

**Decision (2026-04-28, Islam):** Unified rule — "WP overwrites where WP
has a value; everything else stays as-is." Operationalized as four
sub-decisions:

- Field WP has → overwrite Sanity with WP value
- Field WP doesn't have → leave Sanity untouched (NOT set to undefined)
- Field not in WP schema (editorial-only) → always leave untouched
- Locale slot WP doesn't have → leave that slot untouched (do NOT blank)
- Seed cities not in WP source → leave entirely untouched, surface in
  summary as "seed-only, not in WP"

**Sub-decision Q3.1 (placesToGo):** Out of scope for session 5. Single-
source-of-truth ownership is monument session 7. Session 5 leaves
`placesToGo` array untouched regardless of what WP destination-hub source
contains. WP "Places to visit" sampling in session 5 step 1 is
informational-only.

**Rationale:** Predictable, idempotent, low-cognitive-load. Editorial
work in Studio is preserved by default. WP source is the operational
source for migration-touched fields. The four sub-decisions cover every
edge case without ad-hoc field-level reasoning.

**Note (2026-04-28):** First-run state of migration-staging is empty for
city documents (verified by GROQ). The unified rule's "leave Sanity
untouched" clauses fire zero times on first run. They become load-bearing
on iteration 2+ when the importer re-runs against staged content.

### Q5 — `egypt-travel-guide` disposition: do not migrate, redirect at cutover

**Decision (2026-04-28, Islam):** WP page `egypt-travel-guide` (id 56654)
is the WP archive/index page for the 41 city-level travel-guides,
structurally equivalent to the Next.js front-end `/guide/` listing route.
Decision: **do not migrate to any Sanity doc type.** Redirect at cutover:

- `https://travel2egypt.org/egypt-travel-guide/` → `/guide/`
- `https://travel2egypt.org/es/guia-de-viaje-de-egipto/` (or equivalent ES slug) → `/es/guide/`
- `https://travel2egypt.org/ja/<JA-slug>/` → `/ja/guide/`

(Locale slug variants TBC during session 9 when the redirect-map generator
runs against full source data.)

**Rationale:** Migrating an archive/index page as a content doc would
create a no-purpose Sanity record that the listing route already serves.
The 41 individual travel-guide pages are the actual content; the archive
is just navigation.

**Owner:** redirect-map generation in session 9 step 13.
**Session 5 implementation:** excluded from the import via the new
`--slug-exclude` flag on `wp-import` / `wp-import-diff`.

### Q4 — Hotel/cruise/tour gallery: hero-only (B)

**Decision (2026-04-28, Islam):** Path B — first carousel `<img>` src
becomes hero image if `featured_media` is not set on the WP page.
Remaining carousel images are dropped. No `gallery: image[]` schema work.

**Rationale:** Editorial-luxury restraint over decoration. Travel2Egypt
brand voice (Black Tomato / Audley / Departures references) does not
include carousel galleries. Paying schema cost for content that may not
survive editorial review post-migration is wasted architecture. If
specific high-value hotels need richer galleries later, surgical
re-import handles them.

**Scope:** Out of session 5. Locked now to unblock session 8 mapper work
(hotel / nileCruise / tour). Carousel images discarded by hero-only logic
will be logged with sample src URLs to `migration-summary.md`'s "Stripped
carousels" section, same instrumentation as session 4's strip rules.

---

## Classifier issues

### `*-egypt` suffix rule overshoots — session 5 discovery

`scripts/wp-classifier.ts:408` classifies any page slug ending in `-egypt`
as `destination-hub`. Confirmed in session 5 pre-flight: 27 of 69
destination-hub-classified pages are misclassified. Plus 1 from the 42
`*-travel-guide` bucket (`egypt-travel-guide` — generic country-level guide,
not a destination). Total: 28 pages should not be cities.

Manual reclassification at
[migration/.diffs/destination-hub-misclassified-deferred.md](.diffs/destination-hub-misclassified-deferred.md):

- 5 → `tour` (session 8 owner)
- 21 → `guideArticle` (session 6 owner)
- 2 → `unclear` (aggregator/listing pages, need Islam decision before owner session)

**Decision pending:** tighten the rule, or accept and triage at each owner
session. Session 5 sidesteps by filtering to `*-travel-guide` only via a
new `--slug-pattern` flag; classifier logic untouched.

### Forward-flag for session 7 (placesToGo + body prose)

Session 5 imports `overview` body content from WP destination-hub pages.
Cairo's body carries "Things To Do" content inside an Elementor tabs
widget; the HTML→PT pipeline preserves the inner text in `overview` body.
Session 7 will populate `placesToGo` array from monument reverse-refs.

**Result:** monuments mentioned in prose form in `city.overview` (session 5)
AND as structured refs in `city.placesToGo` (session 7). Front-end
rendering needs to either:
- strip prose mentions of monuments that also appear in placesToGo,
- leave both (with visual differentiation between prose and structured), or
- defer placesToGo rendering to a clearly-separate section so the
  duplication is editorially obvious to readers.

Not session 5's problem to solve. Surface to session 7 (or 7.5) at session
5 close handoff.

---

## Cutover Blockers — additions identified in session 5

DOC 1 (Application Handover v3) carries the canonical Cutover Blockers
table. Session-5-discovered additions land here first, get folded into
DOC 1 at session 5 close. Each item has owner + deadline.

### Production-only city enrichments not in migration-staging

**Discovered (2026-04-28):** Direct cross-dataset GROQ probe at session 5
pre-flight showed migration-staging has zero `city` documents while
production has 3 (`city-cairo`, `city-aswan`, `city-luxor`). Production
Cairo carries `placesToGo` (1 entry) and likely Key Facts and other
editorial-only enrichments; production Aswan and Luxor carry name + slug
seed only.

After session 5 (CREATE-first city import) and session 7 (monument
reverse-refs populating placesToGo), staging will have 69 cities with
WP-sourced content + monument-derived placesToGo. **Production's
editorial enrichments on Cairo will not appear in staging post-migration
unless explicitly transferred.**

**Decision needed before cutover:** sync strategy for staging → production
cutover. Two viable shapes:

- **Merge-not-replace at cutover:** copy staging cities into production
  but preserve editorial-only fields (Key Facts, etc.) on cities that
  exist in production. Same merge rule as Q3 but inverted direction.
- **Re-seed into staging before cutover:** copy production's Cairo Key
  Facts (and any other editorial-only enrichments on Aswan/Luxor) into
  staging now, run session 5+7 against the seeded staging, then cutover
  is a clean replace.

**Owner:** Islam.
**Deadline:** before session 8 close. (Tightened from "session 9 close"
at session 5 close — session 9 should remain a closeout buffer, not absorb
blocker resolution work, per DOC 3 Step 11.)
**Action this session:** none. Surface only.

---

## Methodology lessons (carry forward)

Plain lesson statements drawn from this session's wrong turns. Future
sessions read these as context, not as actionable items.

### Loud failures over silent ones

A `try/catch` that returns `null` indistinguishably from a successful empty
result is epistemically broken — it removes the system's ability to tell you
something's wrong. The original `resolveAttachmentByFilename` swallowed every
404 from the malformed URL path, so the filename-fallback "ran" returning
zero hits while the run summary reported clean. One full re-run cycle and one
wrong diagnosis (same-wpId-different-src) cost. Pattern to use instead: every
new code path's failure modes log to stderr at minimum, ideally with the input
that triggered them. Make silence impossible.

### Sample-based corpus characterizations are probabilistic, not categorical

When sampling N articles to characterize a corpus, the honest output is "N
articles sampled show pattern X; tail cases possible." When a fix depends on
a categorical claim about the corpus, either run an exhaustive scan or
design the fix to fail loudly on the tail case rather than silently swallowing
it. Pre-flight characterization "every img has `wp-image-{ID}`" is an
overgeneralization from sample to population — what was actually true is
"every img in 8 samples has `wp-image-{ID}`." The Elementor `image.default`
widget on `travel-agency-in-egypt` rendered class-less imgs and was the
hidden tail case.

### TypeScript clean is necessary, not sufficient

`tsc --noEmit` checks types, not runtime correctness. URL strings, API
endpoints, and schema field names are not type-checked against external
systems. New code paths exercising external APIs need a one-shot exercise
against a known input before declaring clean. Adding a
`--hit-new-paths` mode to wp-import that runs each new resolver against one
seed input and asserts non-empty cache files would be small future investment
if this pattern recurs.

### Safety-net components must share runtime code with the operation they protect

Session 5 (2026-04-28): the `mergeCityDoc` function was used by the
`--dry-run-diff-only` path but NOT by the actual write path. The diff
showed Q3 merge rule preserving Akhmim's editorial `region` field. The
actual write used `client.createOrReplace(doc)` which clobbers fields the
mapper omits. Result: a verified-clean dry-run, then a live write that
silently dropped editorial state. Both paths must converge on the same
merge function or the safety net is theater.

Detection rule for any UPDATE-mode session: post-write verification query
that the editorial fields survived. The 31/31 unit tests for
`mergeCityDoc` did not catch this because they tested the function in
isolation; the integration with the write path was the missing coverage.
Add the integration assertion (write path against a mocked existing doc
with an editorial-only field set; assert post-write doc still contains
the field) to the merge test suite or as a separate test.

### Fingerprints derived from dry-run output are untrustworthy until the write path is proven to match

Session 5 corollary of the above: the safety-net fingerprint protocol
captures structural shape from the diff path. If the diff and write paths
diverge (as they did pre-Path-A wiring), fingerprints from the diff
document hypothetical behavior, not actual write output. Fingerprint
approval gates require write-path-confirmed shapes. When a diff/write
divergence is fixed mid-session, prior fingerprints must be invalidated
(deleted or marked unverified) and regenerated post-write.

### Every safety-net component requires its own end-to-end integration test

Session 5 (2026-04-29) found two integration bugs in safety-net
components on the same day:

1. `mergeCityDoc` worked in isolation (31/31 unit tests passing) but
   wasn't wired into the write path — only the dry-run-diff-only path
   used it. Live writes silently dropped editorial state.
2. `fingerprintHash` worked in isolation (produced a 16-hex-char SHA-256
   prefix) but used `JSON.stringify(fp, Object.keys(fp).sort())` where
   the second argument is interpreted as a REPLACER ARRAY filtering
   nested keys recursively. fieldTypes' nested keys (heroImage, region,
   orderRank, etc.) were stripped before hashing, producing
   collision-prone hashes. Cairo (with orderRank, no hero) and
   Wadi-al-Natron (no orderRank, with hero) hashed identically.

Both bugs would have shipped at 41-doc scale if the live verification
hadn't surfaced them. Pattern: any safety-net function with non-trivial
outputs needs:

- (a) a unit test for the function in isolation,
- (b) an integration test that exercises the function via the same code
  path the production system uses, and
- (c) a regression-guard test asserting the function discriminates
  between cases it should discriminate between.

The fingerprint collision bug was specifically the (c) gap — the unit
tests verified hashing worked but never asserted "different shapes
produce different hashes." Add this triad as the standard for any new
safety-net component in sessions 6+.

### Post-write drift assertion is a standing protocol (not a one-off)

After any actual write that uses a merge function, run a verification
query that compares the diff-predicted output against post-write-Sanity
actual output, asserting zero drift:

```bash
# After actual write completes, immediately re-run dry-run-diff-only on
# the same scope. Expected output: every diff shows "no changes" (since
# the write should have produced exactly what the diff predicted).
npm run wp-import -- <same flags> --dry-run-diff-only
```

Any non-zero drift is an integration bug between the diff and write
paths. Make this a step in every safety-net session, not a one-off check.
Session 5 surfaced two diff/write divergences post-fact; the drift
assertion catches them at the gate before scaling to N.

### Worktree-CWD verification at every session start

The Claude Code harness can launch a new session with a default Node
version (and occasionally a default working directory) that diverges from
what the prior session was running under. Silent divergence — same code,
different runtime — is an integration-drift class we already pay for in
diff/write paths; the same applies to session boundaries.

Standing rule for every session start, as the first command after entering
the worktree:

```bash
pwd
git worktree list
git branch --show-current
git log --oneline -5
node --version  # if Sanity CLI / npm-side work is on the agenda
```

If `pwd` doesn't match the expected worktree, OR if the branch isn't the
expected session branch, OR if `node --version` differs from the prior
session's runtime — STOP and surface, do not attempt recovery without
direction. Session 5 lost ~5 minutes to a silent Node v18 vs v20.20.2
divergence at the harness handoff that would have surfaced earlier under
this rule.

## Branch state

Branch `claude/awesome-shannon-3194f1` was merged to `main` at the close of
session 4. The five-commit diagnosis trail (original bundle + four follow-ups
on issue 5) is preserved in git history. See "Resolved in session 4" at the
bottom for the verification numbers.

Branch `claude/session-5-city-import` is the session 5 branch (city import
+ safety-net infrastructure + post-write drift protocol). At session 5
close (2026-04-29), 21 commits ahead of main, summarized in
"Session 5 close" below.

---

## Real but not blocking

### 2 — wrong-language bodies (10 articles)

**Symptom:** Article documents in JA / ES locales contain bodies in another
language.

**Root cause:** WPML partial translations in WP source data — translator translated
the title but not the body (most cases) or WPML fell through to a sibling locale
(at least one ES-body-under-JA-slug case).

Confirmed by direct WP REST inspection of `migration/.cache/rest/posts-bySlug-…`.
Importer is fetching `?slug=…&lang=ja` and getting back what WP returns. Not an
importer bug.

**JA offenders (6 of 165):**

| wpId | Slug | CJK ratio | Body actual language |
|---:|---|---:|---|
| 257611 | `3月のエジプトの魅力-春の冒険` | 0.000 | Spanish (WPML fallback) |
| 249618 | `エジプトのコプト教徒：古代信仰の守護者たち` | 0.0001 | English |
| 249591 | `王家の谷の必見の墓（2025年版）：隠れた名所と知` | 0.0007 | English |
| 249589 | `8月にエジプトへ旅行する` | 0.0016 | English |
| 249606 | `ベスト12日間エジプト旅行プラン` | 0.0021 | English |
| 178056 | `エジプトのグルメダイニング：ラグジュアリーホ` | 0.025 | Mostly English (partial) |

**ES offenders (4 of 164 published):**

| wpId | Slug | Body actual language |
|---:|---|---|
| 257593 | `arqueologia-subacuatica-y-buceo-en-naufragios-en-el-mar-rojo` | English |
| 144345 | `faraones-del-reino-medio-logros-y-legado` | English |
| 144410 | `gastronomia-en-egipto-hoteles` | English |
| 249446 | `la-historia-de-bab-zuweila-la-legendaria-puerta-de-la-ciudad-en-el-cairo-islamico` | English |

**Action:** editorial triage. Either strip from migration (drop these 10 docs and
mark for re-translation in WP), or import-as-is with a `reviewFlag:
'locale-content-mismatch'` on the affected docs and route to a translation
backlog. Latter probably better — migration shouldn't gate-keep editorial work.

Either way: needs a new `reviewFlag` enum value if option B is chosen
(`scripts/wp-import/types.ts:104-115`).

---

## Deferred

### Manual redirects: archive pages not migrated as docs (session 9 step 13)

Some WP pages are archive/index navigation rather than content (e.g. the
`egypt-travel-guide` listing page — see "Cutover decisions made" Q5).
These don't get a Sanity doc but DO need 301 redirects at cutover so old
URLs route to the equivalent front-end listing route.

Investigate at session 9 step 13 whether the redirect-map generator
(`scripts/wp-import/redirect-map.ts`) handles non-doc redirects
declaratively — current code derives redirects from `MapperResult.redirects`
on a per-doc basis, so non-migrated pages would slip through. If a manual-
entry mechanism doesn't exist, add one (likely a `migration/manual-redirects.csv`
ingested into the final redirect-map.csv).

Known entries (will grow as more archive/index pages surface):

- `/egypt-travel-guide/` (EN) + locale variants → `/guide/` (Q5 disposition)

### 4 — heading concatenation prevalence

GROQ can't substring-match string fields, so a precise count of
`<strong>X</strong>` followed by non-whitespace inside paragraph blocks isn't
queryable directly. Proxy metric: 30 heading blocks (h2/h3/h4) across 495 articles
have ≥2 spans (~6%) — but this counts any heading with inline marks, not all of
which are concat bugs. Most "awe-/in/spiring" cases come from the WP **Link
Whisper** plugin auto-linking words mid-token; rendering is structurally correct
PT, just visually weird. Defer until Studio walkthrough surfaces concrete count.

### 7 — sub-paragraph dedupe

Current rule (`scripts/wp-import-html.ts:153-164`) does whole-`<p>` exact-string
match — caught 108 instances cleanly. Misses two patterns:

- **Internal repeat**: `<p>X X Y</p>` (sentence X duplicated within one paragraph).
  Needs sentence-split + intra-paragraph dedup. Risky without sample data;
  intentional repetition for emphasis would over-strip.
- **Prefix overlap**: short `<p>X</p>` is an exact prefix of longer `<p>X Y Z</p>`
  elsewhere in body. Cleanly fixable: replace `Set<string>` with sorted
  longest-first list; drop candidates that are prefixes (with length-ratio guard,
  e.g. prefix ≥50% of host). ~25 lines, low false-positive risk.

**Verdict:** prefix dedup is cheap and ship-ready. Internal dedup needs 3–5
concrete examples to tune. Defer both unless editorial flags more cases.

### Earlier-deferred (still open)

- **`the-curse-of-king-tuts-tomb` body truncation** — body ends mid-sentence at
  *"…numerous pulp fiction magazines"*. Now visible in Studio image 3 as the pink
  leading block + double-H1 anomaly. Likely an HTML pre-strip pass over-removed a
  trailing structure. Investigate after the critical fixes land.
- **`129-reasons-to-visit-karnak-temple` literal `\n` escapes** — Elementor
  heading-widget handling gap; raw `\n` showing up in span text where headings
  should have line-broken cleanly.

---

## Strip-rule top-5 (informational, useful editorial signal)

Counts are sums across the en+es+ja locales of each post group.

### Top 5 by tour-promo CTA stripped

| # | Slug | Count |
|---:|---|---:|
| 1 | `top-things-to-do-in-luxor-egypt` | 48 |
| 2 | `egypt-holidays-from-uk` | 30 |
| 3 | `7-unforgettable-to-do-in-aswan` | 24 |
| 4 | `places-to-visit-in-aswan` | 24 |
| 5 | `cinematic-guide-to-egypts-film-sites` | 24 |

### Top 5 by category-grid stripped

| # | Slug | Count |
|---:|---|---:|
| 1 | `alcohol-in-egypt` | 18 |
| 2 | `visiting-egypt-in-july` | 18 |
| 3 | `egypt-package-deals` | 16 |
| 4 | `faux-pas-to-avoid-in-egypt` | 16 |
| 5 | `is-egypt-safe` | 16 |

> `is-egypt-safe` had 16 category-grid widgets stripped this run — directly
> contradicts the prior session's "step 3 verified clean" claim. The prior
> session's strip rules existed only in the handoff doc; even on `is-egypt-safe`
> the category-grids were never actually being stripped before this session.

### Top 5 by duplicate-paragraph backlink stripped

| # | Slug | Count |
|---:|---|---:|
| 1 | `must-visit-islamic-places-in-cairo` | 13 |
| 2 | `sphinxes-and-obelisks` | 11 |
| 3 | `understanding-egyptian-hieroglyphs` | 11 |
| 4 | `2-weeks-egypt-tour-itinerary` | 8 |
| 5 | `animals-in-ancient-egypt` | 6 |

Aggregate run-2 totals: 1844 tour-promo + 200 category-grid + 108 duplicate-paragraph stripped.

Run-3 (post-bundle) extends the strip set with three more rules: swiper
carousel (`swiper-slide-image`), Royal/Premium Addons carousel
(`premium-adv-carousel__item-img`), and `bdt-img` related-tour widgets.
Per-rule counters and per-article carousel-discarded src URLs surface in
`migration-summary.md`.

---

## Pre-flight gates for upcoming entity types

Distinct from the critical/not-blocking/deferred axis: these are findings
that must be resolved **before** the next entity-type mapper runs (hubs,
subpages, monuments, hotels, nile-cruises, tours).

### Hotel/cruise/tour body imagery hidden in `_elementor_data` post-meta

**Discovered while sampling 9 hotel pages adversarially.** ~33% of hotels
(`al-tarfa-desert-sanctuary-lodge`, `bedouin-castle-hotel`,
`daniela-village-saint-catherine-hotel`) return 40+ KB of `content.rendered`
with **zero `<img>` tags and zero `/wp-content/uploads/` URL references** of
any kind — neither in `<img src>`, nor inline-style `background-image`, nor
`data-image`/`data-elementor-image` attributes. The remaining 6 hotels render
imagery via the Royal/Premium Addons carousel widget
(`premium-adv-carousel__item-img`) — class-less from the importer's
perspective, but the URLs are at least present.

The implication: for ~1/3 of hotels, the imagery lives entirely in
`_elementor_data` post-meta JSON, which `content.rendered` does not include.
The current importer scrapes `content.rendered` only.

**Sample (9 hotels):**

| WP id | Slug | Body length | `<img>` count | Mechanism |
|---:|---|---:|---:|---|
| 83679 | `al-tarfa-desert-sanctuary-lodge` | small | 0 | imagery in `_elementor_data` |
| 83680 | `bedouin-castle-hotel` | 42 273 | 0 | imagery in `_elementor_data` |
| 83681 | `daniela-village-saint-catherine-hotel` | 45 330 | 0 | imagery in `_elementor_data` |
| 63657 | `hilton-alexandria-corniche-hotel` | 47 074 | 4 | premium-adv carousel |
| 63630 | `hurghada-marriott-red-sea-resort` | 48 749 | 3 | premium-adv carousel |
| 63932 | `jw-marriott-cairo-hotel` | 48 601 | 4 | premium-adv carousel |
| 63523 | `mercure-luxor-karnak-resort` | 49 457 | 4 | premium-adv carousel |
| 63666 | `sheraton-montazah-hotel` | 49 261 | 4 | premium-adv carousel |
| 64598 | `steigenberger-nile-palace-luxor-hotel` | 50 191 | 4 | premium-adv carousel |

Same pattern likely applies to nile-cruises and tour-or-package pages — both
are Elementor page-builder driven. Spot-check on at least 4 cruises + 4 tours
before locking the relevant mapper.

**Three viable paths (decision needed before hotel/cruise/tour mappers):**

1. **REST meta-field whitelist.** Register `_elementor_data` (and any related
   meta keys) as REST-readable on the WP side, then parse the Elementor JSON
   tree client-side to extract image references. Requires WP plugin or
   `mu-plugins/` change. Highest fidelity, most upstream work.
2. **Featured-only.** Use `featured_media` as the sole image source for
   these entity types. Single hero per hotel/cruise/tour; accept body-imagery
   loss for the 33% with empty `content.rendered` and the carousel imagery
   loss on the other 67%. Lowest implementation cost; matches
   editorial-luxury restraint; defensible.
3. **Live HTML scrape.** Fetch the rendered HTML page (post-PHP-render),
   parse the resolved DOM. Captures everything Elementor produces but adds
   a second fetch path with rate-limit/cache implications and is fragile to
   theme changes.

**Decision should be made together with the editorial gallery question:**
if hotel/cruise/tour content is preserved as a `gallery` array, path 1 or 3
is needed. If it collapses to single hero only, path 2 is sufficient.

### Carousel-imagery editorial review (post-strip)

Every imported article has its stripped carousel imagery surfaced in
`migration/migration-summary.md` under "Stripped carousels" with sample src
URLs (capped at 20 per widget per locale). Editorial should review
post-import and flag any high-value articles that need surgical re-import
once a gallery strategy is locked.

---

## Migration-staging-only artifacts

The following documents live **only in the migration-staging dataset** and
must NOT be promoted to the production dataset by any future sync/promote
script. They are migration-specific artifacts whose presence in production
would encode false provenance.

- `author.legacy-archive` ("Travel2Egypt Archive") — written via
  `createIfNotExists` from `scripts/wp-import.ts` on every import run.
  Referenced by every imported article as the default `author`. Honest
  transitional construct: imported articles weren't authored by editorial;
  they were imported. Editorial reassignment to real authors handles
  promotion-time correctness.

If a future "promote staging → production" script is added, it must:
- Skip docs whose `_id` is `author-legacy-archive`.
- For every article that references `author.legacy-archive`, either reassign
  to a real author before promotion OR carry the archive author across as a
  documented migration artifact (with the same caveat in production Studio).

The two `editorialCategory` seed docs (`category-planning`,
`category-destination`) are NOT staging-only — those are the curated
production taxonomy, ensured in staging only because imported articles need
them to resolve. The production `scripts/seed.ts` remains canonical.

---

## Triage matrix

| # | Issue | Severity | Notes |
|---:|---|---|---|
| 3B | alt/caption shape | **resolved** | `localeShape: 'string' \| 'i18n'` flag through `ConversionOptions`; mapArticle sets `'string'` |
| 3C | required author + category | **resolved** | `author.legacy-archive` seed + two-bucket category heuristic with `wpCategorySlugs` provenance |
| 5 | 156 images without asset | **resolved** | Carousel widgets stripped (swiper + premium-adv + bdt-img) + filename-fallback resolver with ambiguous-match registry |
| 3A | excerpt → deck rename | **resolved** | Field renamed in mapArticle |
| 2 | wrong-language bodies | not-blocking | Editorial triage; possibly + reviewFlag enum |
| 4 | heading concat | deferred | Studio sampling first |
| 7 | sub-paragraph dedupe | deferred | Prefix dedup cheap, internal needs samples |
| — | curse-of-king-tut truncation | deferred | Investigate after critical fixes |
| — | karnak-temple `\n` escapes | deferred | Elementor heading-widget gap |

---

## Session 5 close (2026-04-29)

Session-close summary. Future sessions read this for state at handoff and
the corrected canonical numbers.

### Cutover decisions made (consolidated)

Locked, dated, no further discussion this session:

- **Q1 — Brand swap: Ring 2, scheduled session 5.5.** Brand swap is
  typographic hierarchy + Portable Text rendering tier, not visual-only.
  Inputs ready at `~/Desktop/travel2egypt-brand/`. Handoff note:
  `migration/.handoffs/session-5.5-brand-swap.md`.
- **Q3 — City UPDATE merge rule: WP overwrites where WP has a value;
  everything else stays as-is.** Editorial-only fields (region, orderRank,
  Key Facts, etc.) preserved across re-imports. Implemented via
  `mergeCityDoc` (commit `2a14e25`); guarded by integration-test triad
  (commit `3dde213`); fingerprint trust hardened by drift-protocol fix
  (commit `5b3d183`).
- **Q4 — Hotel/cruise/tour gallery: hero-only (B).** No body-image
  imagery for those entity types in the initial import. Confirmed for
  sessions 6-8.
- **Q5 — `egypt-travel-guide` archive page: do not migrate, redirect at
  cutover.** Tracked under "Manual redirects" deferred section. Locale
  variants (ES/JA) follow the same disposition.

### Counts at session 5 close (canonical, supersedes DOC 1 v3)

| Metric | Value |
|---|---:|
| Cities in `migration-staging` | **41** |
| Cities with hero image | 17 |
| Cities flagged `keyfacts-mining-failed` | 40 (Sohag is the 1 success) |
| Articles in `migration-staging` | 495 |
| Articles re-written today (scope-anomaly side effect) | 489 |
| Articles untouched today | 6 |
| Total media uploaded today | 2,673 |
| `UPLOAD_EXHAUSTED` registry entries | 2 (article-side) |
| `MISSING_ATTACHMENTS` registry entries | substantial — see migration-summary.md |
| Step 8 actual write runtime | 63 minutes |
| Step 8 drift-assertion result | ✅ 41/41 cities, 0 changed line(s) |

### Corpus-fact corrections to DOC 1 (Application Handover v3)

DOC 1 v3 carried two stale claims for the `city` row that should fold into
v4 when it gets generated for session 6 prep:

1. **"Migration-staging current state" table for `city`** said:
   *"1+ Cairo (existing seed); session 5 will UPDATE 69 hubs."*
   Corrected: at session 5 start, migration-staging had 0 cities. Session 5
   wrote 41 cities (CREATE-first run; UPDATE on iteration 2+ via
   `mergeCityDoc`). The 69-hub number was the pre-`--slug-pattern` /
   pre-`--slug-exclude` page count; final scope after both filters is 41.
2. **Document type table for `city`** said:
   *"destination-hub (69 EN, UPDATE existing seed)."*
   Corrected: scope is 41 after `--slug-pattern '*-travel-guide'` and
   `--slug-exclude 'egypt-travel-guide'`. Of the original 69, 27 were
   reclassified as misclassified destination-hubs; deferred to sessions 6
   (guideArticle) and 8 (tour) per
   `migration/.diffs/destination-hub-misclassified-deferred.md`.

### Deferred reclassifications

`migration/.diffs/destination-hub-misclassified-deferred.md` contains 27
`*-egypt` slugs to be reclassified out of `destination-hub` into
`guideArticle` (session 6) or `tour` (session 8). Decision tree on a
per-slug basis lives in that file.

### Manual redirects flagged for session 9

To be added to `migration/manual-redirects.csv` (file may not exist yet —
session 9 step 13 creates the ingestion mechanism):

- `/egypt-travel-guide/` → `/guide/`
- `/es/guia-de-viaje-de-egipto/` → `/es/guide/`
- `/ja/エジプト旅行ガイド/` → `/ja/guide/`

### Methodology lessons committed in session 5 (commit cross-reference)

For traceability:

| Commit | Lesson |
|---|---|
| `a82e7ec` | Safety-net components must share runtime code with the operation they protect; fingerprints derived from dry-run output are untrustworthy until the write path is proven to match |
| `3dde213` | Every safety-net component requires its own end-to-end integration test; post-write drift assertion is a standing protocol (not a one-off) |
| `5b3d183` | Drift-protocol fix: deterministic keys + run-volatile field stripping (operationalises the assertion above) |
| (this commit) | Worktree-CWD verification at every session start (Node-version drift caught at handoff) |

### Workflow rules added in session 5

These are durable rules, not session-specific actions:

1. **Worktree-CWD verification at session start.** First command in every
   new Claude Code session: `pwd && git worktree list && git branch --show-current && git log --oneline -5 && node --version`.
   If anything diverges from the expected state, STOP and surface.
   See methodology lessons section above.
2. **Post-write drift assertion as standing protocol.** After every actual
   write that uses a merge function, immediately re-run the same scope as
   `--dry-run-diff-only`. Expected: zero changed line(s) across all docs.
   Any drift = integration bug between diff and write paths; investigate
   before scaling.

### Open items from session 5

Tracked in earlier sections of this file:

- **Session-5-discovered defects** (below): `--filter-by-template` only
  narrows pages, not posts. Article clobber risk for sessions 6-7. Must
  fix before session 6 (449 subpages).
- **Cutover Blockers**: production-only city enrichments not in staging.
  Deadline: before session 8 close (tightened this session).

### Branch state at session 5 close

`claude/session-5-city-import` is 21 commits ahead of `main`. Methodology
+ infrastructure + actual writes are all on the branch. Merge to main at
session 5 close per workflow rule 1.

---

## Session-5-discovered defects

### `--filter-by-template` only narrows pages, not posts (scope-anomaly + clobber risk)

**Discovered:** Session 5 Step 8 actual write, 2026-04-29.

**Symptom:** Step 8 was invoked with
`--filter-by-template destination-hub --slug-pattern '*-travel-guide' --slug-exclude 'egypt-travel-guide'`,
expected to narrow scope to the 41 city hub pages. Actual scope:

| Type | Written |
|---|---:|
| article | 489 |
| city | 41 |
| editorialCategory | 19 |
| translation.metadata | 163 |

(plus 2,673 media uploads, 63-minute runtime).

**Cause:** the filter flags only narrow pages. Posts (which become `article`
docs) and category/translation enumerations run unconditionally before the
page filter applies.

**Blast radius — clobber risk:** articles route via `createOrReplace` with no
`mergeArticleDoc` equivalent of `mergeCityDoc` — same failure class as the Q3
city editorial-clobber bug fixed earlier in session 5. Any editorial work on
staging articles between session 4 close (2026-04-28 14:42 UTC) and Step 8
start (2026-04-29 11:12 UTC) was silently overwritten.

**Verification at the time of writing:** technical signals show no editorial
activity on articles in that window — 0 articles with `_createdAt` in the
gap, 0 articles with `reviewFlag` set, sampled article block-key patterns
match deterministic mapper output (`000000000001`, `00000000000d`, …).
No definitive proof, but the most likely-to-fire signals are quiet. Final
recall belongs to Islam.

**Fixes needed before session 6** (which will hit this trap on ~449 subpages
with worse blast radius — guideArticle subpages have non-trivial editorial
fields):

1. Extend `--filter-by-template` to also narrow posts, OR add an explicit
   `--type=page|post` requirement when `--filter-by-template` is used.
2. Build a `mergeArticleDoc` (and `mergeGuideArticleDoc`) parallel to
   `mergeCityDoc` so editorial-only fields on articles/guideArticles are
   preserved across re-imports — same Q3 merge rule pattern.
3. Decide whether session 6 should run with a tighter scope flag set
   (e.g. `--type=page` or path-based exclusion) until #1 and #2 land.

**Related:** UPLOAD_EXHAUSTED registry (added in session 5) fired for the
first time during this run on 2 article hero images
(the-best-egypt-travel-itineraries, october-escapes-discovering-egypt-in-autumn,
both `attempts=1 transient=false` — Sanity returned non-transient upstream
errors). Surfaced in `migration-summary.md` correctly. Not a defect, just a
note that the new registry is exercised.

---

## Resolved in session 4

Diagnostic record preserved here so future sessions can trace the cause and
the verification numbers behind each resolution. Five-commit trail on
`claude/awesome-shannon-3194f1` (merged to `main`):

```
ed89dfa  Session 4 critical fixes: article schema-aligned, image resolver hardened, carousels stripped
83889d8  Issue 5 follow-up: same-wpId-different-src body image mapping
c64e0b6  Issue 5 follow-up 2: fix /wp-json/ prefix on filename-fallback path
d77baa6  Issue 5 follow-up 3: three-layer cascade for filename-fallback candidate picker
<this>   Mark session 4 critical fixes resolved
```

### 3A — excerpt → deck rename ✅

**Was:** importer wrote `excerpt`, schema declared `deck`. Studio "field
not in schema" warning on every article.

**Resolution:** field renamed in `scripts/wp-import/mappers/article.ts`.

**Verification (run #4 GROQ):**
- `articles with deck: 167` (where WP excerpt was non-empty)
- `articles with excerpt: 0`

### 3B — alt / caption shape mismatch ✅

**Was:** HTML→PT pipeline always emitted internationalized arrays for
`alt`/`caption`, but article uses document-level i18n where each locale doc
holds plain strings. Studio "Expected type String got Array" on every
article body image.

**Resolution:** `localeShape: 'string' | 'i18n'` parameter added to
`ConversionOptions` in `scripts/wp-import-html.ts`. Default `'i18n'` keeps
field-level-i18n mappers unchanged. `mapArticle` overrides to `'string'`.

**Verification:** sample article body image renders
`alt: "Outdoor dining area overlooking the Nile River…"` as plain string,
not array.

### 3C — required author + category references ✅

**Was:** schema declared both with `Rule.required()`; importer wrote
neither. Red required-validation errors on every imported article.

**Resolution:**
- Seed doc `author.legacy-archive` ("Travel2Egypt Archive") written
  idempotently to `migration-staging` via `createIfNotExists` at importer
  startup. Every imported article references it. Migration-staging-only
  artifact; not promoted to production (see "Migration-staging-only
  artifacts" above).
- Two-bucket category heuristic on `mapArticle`: WP cats intersecting
  `{tips-tricks, egypt-travel-guide, safety}` → `category-planning`, else
  `category-destination`.
- Original WP author/category provenance preserved on `migration` object
  (`wpAuthorId`, `wpAuthorSlug`, `wpCategorySlugs`) for editorial
  reassignment.

**Verification (run #4 GROQ):**
- `articles with author ref: 495 / 495`
- `articles with category ref: 495 / 495`
- Split: `category-destination: 354`, `category-planning: 141`

### 5 — body images without asset reference ✅

**Was:** 156 unresolved `_pendingImage` blocks across 81 articles. Resolver
only handled `<img>` carrying `wp-image-{ID}` class; class-less Elementor
`image.default` widget renderings were silently emitted as pending.

**Resolution (four-commit diagnosis trail):**
- **Original bundle:** filename-fallback resolver — when `wp-image-{ID}`
  absent, `/wp-json/wp/v2/media?search=<base>` to find by filename. Plus
  carousel + bdt-img strip rules (zero firings on posts; insurance for
  next session's hotel/cruise/tour entity types) and `MEDIA_SEARCH_AMBIGUOUS`
  registry.
- **Follow-up 1:** wpId → assetId map so subsequent `<img src>` URLs sharing
  the same WP attachment ID (different size suffix, http/https variants)
  resolve to the same asset instead of being skipped.
- **Follow-up 2:** `/wp/v2/media` → `/wp-json/wp/v2/media` URL prefix fix.
  The original filename-fallback never executed for two re-runs because
  every search 404'd; the silent `try/catch` swallowed the error. See
  "Methodology lessons: loud failures" above.
- **Follow-up 3:** three-layer cascade replacing naive most-recent
  tiebreaker. Layer 0 exact source_url; layer 1 exact path-tail
  (`/<base>.<ext>`); layer 2 same `/YYYY/MM/` directory; layer 3 refusal
  with full ambiguity record. WP `?search=` is full-text, so the naive
  rule was silently picking unrelated files (`pyramids-of-giza` matching
  `great-pyramids-of-giza`, `10` matching everything).

**Verification (run #4 GROQ):**
- `total resolved image blocks: 2603` (was 2515 pre-fix → +88 newly
  resolved)
- `total unresolved image blocks: 68` across 48 articles
  - 60 are no-candidate misses (equivalent to MISSING_ATTACHMENTS class —
    source attachment deleted or never had searchable metadata)
  - 8 are recorded in `MEDIA_SEARCH_AMBIGUOUS` table in
    `migration/migration-summary.md`:
    - 6 `rejected` (layer 3 refusal — left as `_pendingImage`):
      `Nour`, `10`, `aswan`, `nile-cruise`, `1-4`, `Untitled-design`-class
    - 2 `year-month` tiebreakers worth editorial spot-check:
      `Kom-Ombo-temple` (2 candidates in `/2024/01/`) and `3-25.png`
      (2 candidates in `/2024/03/`)
- Layer 2 (year/month) fired 11 times in run #4 — earned its keep.
  If future sessions show layer 2 hitting zero, simplify; if frequent,
  it's the right call.
- 0 `[media-search] FAIL` stderr entries — the loud-failure logger stays
  silent.

**The 60 no-candidate cases** are the genuine long tail: source
attachments that were deleted, renamed beyond filename-search reach, or
never had retrievable metadata. They surface to editorial as
`_pendingImage` blocks in Studio with the original src URL preserved;
editorial can re-source manually if any are high-value.
