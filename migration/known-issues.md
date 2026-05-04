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

### Pin framework versions to the actual installed major+minor

Version range mismatches between `package.json` and the lockfile produce
silent integration drift. Session 5.5 found `package.json` declared
`next: ^15.1.4` but the lockfile resolved 15.5.15. Next 15.5's stricter
root-layout validator broke a pattern that 15.1 tolerated — but the gap
was invisible until a non-existent route triggered the `_not-found`
chunk compilation, which then poisoned the entire dev bundle (every
route returned HTTP 500). Fresh worktrees can pull different resolutions
from the same caret range; the lockfile is authoritative locally but
the next `npm install` on a peer machine may pin elsewhere.

Standing rule: pin major+minor versions on framework-level packages
(Next, React, TypeScript) where strict-mode validation tightens across
minor versions. `^15.5.15` instead of `^15.1.4`. Detection: when bumping
a framework-level package, audit the actual range vs. installed; if
they diverge by minor or higher, narrow the range to match.

### Use rendered DOM, not HTML grep, for dev-mode error-surface detection

In dev mode, Next.js bundles error-component classes (`next-error-h1`,
prefetched not-found body text) into every page's HTML for fast-refresh
and client-side navigation. HTML-grep-based detection logic that looks
for these markers will produce false positives on legitimate pages and
false negatives on actually-rendered error surfaces.

Session 5.5's catchall verification matrix initially mis-flagged a
working catchall as serving Next's default 404 because the grep matched
bundled chunks rather than rendered DOM. Resolution: prefer
`preview_inspect` on the actual rendered element (e.g., the page's H1
text) or visual screenshots. HTML-grep works for production builds but
not for dev-mode validation runs.

Standing rule: when validating dev-mode UI surfaces, use rendered-DOM
inspection (computed styles, element text, screenshots) rather than
raw HTML grep. The dev bundle is not a faithful representation of what
the user sees.

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

**Complementary rule — investigation artifacts written before branching:**
when running pre-flight probes (Gate A, Gate C, etc.), write outputs into
the session worktree, not main. Files created in main pre-branch become
untracked phantoms that block subsequent merges (the tracked twin on the
branch can't overwrite the untracked twin in main's working tree, even
when bytes are identical). Verify with `pwd` before any `> file.json`
redirect; if in main when about to write a session artifact, branch first.
Session 5 close hit this with `migration/.diffs/elementor-data-probe.json`
written in main 17 minutes before the session 5 branch was cut.

### Field classification is about provenance authority, not mapper output

When deciding whether a field is WP-sourced or editorial-only, the question
isn't "does the mapper produce a value" — it's "is the mapper's value
canonical or default?" Mapper-produced seed defaults that exist to satisfy
schema requirements (e.g., `author = legacy-archive`, the two-bucket
`category` heuristic, classifier-inferred `section`) should be classified
editorial-only when editorial assignment is the canonical authority. Strict
Q3 "WP overwrites where WP has a value" applies to canonical WP fields
(title, body, slug, hero), not to mapper-generated defaults. Surfaced in
session 6 Phase 2 when classifying article and guideArticle fields:
`author`, `category`, `section` are all mapper-produced but editorial-only
by provenance. The corollary is that `mergeCityDoc`'s editorial-only
contract evolved from "WP can't write" to "WP can't OVERWRITE editor's
value" — strictly additive on CREATE-first, identical on UPDATE.

### When classifier output conflicts with schema reality, schema wins

Re-route to the natural schema home rather than loosening the schema or
creating synthetic refs to satisfy the classifier. Classifier heuristics
are slug-pattern-based; schema design encodes editorial intent. Editorial
intent is canonical. Session 6 Phase 3 example: 18 country-level slugs
(`airports-in-egypt`, `transportation-in-egypt`, `tipping-in-egypt`, …)
were classified `guideArticle` by the *-egypt deferred-list heuristic,
but `guideArticle.parentCity` is `Rule.required`. Re-routed to `travelTip`
(which has no parentCity requirement, schema description: "Practical,
factual travel tips") rather than loosening guideArticle's requirement
or fabricating a synthetic "Egypt" parent city doc.

### Drift signals require root-cause investigation before remediation

When a drift assertion flags deviation, the assertion's job is to surface
the signal, not to attribute cause. Investigation must distinguish:
(a) **code-introduced drift** — recent changes broke something; fix the
code; (b) **environment-introduced drift** — cold cache, stale state,
missing context; fix the environment or run conditions; (c) **real-but-
explained drift** — intentional content change between baselines; accept
and document. The five-lines-of-evidence pattern from session 6 Phase 4
is the canonical example: single field affected → unmodified code in
suspect area → semantic equivalence on UPDATE path → field classification
excludes merge logic from the suspect signal → cleanly-passing reference
cases under same code prove the engine works. Without this discipline,
a false-positive drift signal leads to a wasted remediation cycle on
code that's actually fine.

### Spec contract evolution during test-triad work is normal and good

When test-triad work reveals a spec contract that's hard to assert
against, the spec is wrong, not the tests. Session 6.5a Phase 2 specified
`null` returns for deferred-editorial slugs in `routeToMapper`; Phase 3
test-triad work surfaced that null is functionally equivalent to a
structured no-op MapperResult but is unassertable as an event. The fix
was structural — explicit `{ docs: [], redirects: [], logEntries: [{
level: 'info', data: { code: 'editorial-defer', ... } }] }` — preserving
runtime behavior (importPages already short-circuits on falsy result;
persistResult is a no-op for empty docs/redirects) while making the
deferral a first-class assertable signal. Visible beats invisible.
Tests, dry-runs, and integration verification refine the spec; they
don't fight it.

### Cohort math compounds across investigations; reality is the source of truth

Phase amendment specs that quote cohort numbers across multiple
investigation findings are draft-quality. Reconciliation against actual
classifier output via dry-run is mandatory before close. Session 6.5a
Phase 4 spec said 420 guideArticle / 2 article; reality was 417 / 4
(cohort math: `422 - 1 (egypt-weather-guide) - 1 (dahab-historical-guide-4
deferred) - 3 (private-car-and-guide override) = 417`; `2 EXPLICIT_PAGE_ROUTING
+ 2 pre-existing ^egyptian- editorial pattern = 4`). The pre-existing
`^egyptian-` pattern matches surfaced for the first time when
`--filter-by-template article` was scoped against the page corpus —
classifier rule had been active since session 5 but never previously
exercised by template-filter. Don't trust spec cohort numbers; verify
via dry-run before close.

### Editorial routing overrides as data, not rules

Investigation findings often surface "this slug should route differently
than the classifier says." Implementing as data-driven override maps
(`EXPLICIT_PAGE_ROUTING`, `EXPLICIT_SLUG_OVERRIDES`,
`EXPLICIT_SECTION_OVERRIDES`, `EXPLICIT_PARENT_CITY_OVERRIDES`,
`EXPLICIT_DEFER_SLUGS`) beats implementing as new classifier rules.
Override maps: (1) make editorial decisions visible and auditable in
one location; (2) compose cleanly without rule-priority arguments
(each map is a single lookup); (3) test-trivially as map-membership
checks; (4) carry no risk of over-matching unrelated slugs (exact-key
lookup, not pattern). Reserve classifier rule additions for genuinely
new heuristic patterns; encode editorial decisions as override maps.
Session 6.5a Phase 2 amendment is the canonical example: 5 maps,
~16 entries total, replaced what would have been ~5 new classifier
rules each with rule-priority and over-match concerns.

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

## Session 5.5 close (2026-05-01)

Brand swap (Ring 2). All four phases per `migration/.brand-inputs/
travel2egypt-brand-inputs.md` Section 10 complete + a not-found build
error fix that surfaced mid-session.

### Brand applied (locked)

- **Palette:** limestone (`#EDE4D0` / `#E8DFCC` / `#D4C8AC`), faience
  (`#1B4965` / `#0F3550` / faience-soft rgba), sand (`#C9A961` /
  `#B8924D` — dark-bg only), night (`#13110A` / `#2A2620`), paper
  (`#FAF6EC`). Rule colors `rgba(19,17,10,0.12)` and `…0.24`.
- **Type system:** Cormorant Garamond (display) + Inter (body) for
  EN/ES with `latin-ext` subset; Noto Serif JP + Noto Sans JP for JA.
  Locale font override declared outside `@layer base` so it wins over
  Tailwind `.font-serif` / `.font-sans` utilities. Fluid `clamp()`
  type scale per brand-inputs Section 2.
- **Wordmark:** "Travel" + italic faience "2" + "Egypt", Cormorant
  Garamond, 1.5rem header / 1.75rem footer. Replaces the T2E
  orange-circle badge across header and footer.
- **Tailwind v4 `@theme`:** all brand tokens declared as `--color-*`,
  `--text-*`, `--space-*` etc. inside `@theme {}` in
  `src/app/globals.css`. Legacy aliases (`cream`, `ink`, `orange`,
  `line`, `gold`, `terra`) kept active to avoid breaking unmigrated
  page templates; planned removal in session 6 alongside the broader
  page-template sweep.

### Components updated

- **Buttons:** `.btn-primary` (paper-on-night, sand hover) and
  `.btn-secondary` (paper text-link, sand hover). Sharp edges only,
  no shadows, no rounded corners. Plus `.btn-secondary-light` for
  light backgrounds.
- **Cards:** ArticleCard / TourCard / PackageCard / GuideRefCard
  re-skinned to 4/5 vertical aspect, no borders/shadows, brand
  hover (translateY + image scale 1.03). WikiCard shifted from
  image-led to bordered text+count knowledge-card pattern per
  brand-inputs Section 4.
- **SectionHeader:** new component with Roman numeral (i. ii. iii.)
  italic faience prefix, optional `<em>` italic faience accent in
  title, right-aligned arrow link, bottom-rule.
- **PortableText (`Body.tsx`):** operator-note redesigned to single
  visual language across four tones (limestone bg, large faience
  italic opening quote mark, italic Cormorant body) + italic faience
  eyebrow tone label ("HONEST TAKE / CAUTION / INSIDER TIP /
  CONTEXT"); pull-quote with anchored faience opening mark; side-image
  de-rounded; internal-link mark on rule-strong border + faience hover.
- **ConciergeCTA:** new reusable section with night background, sand
  uppercase eyebrow, italic-sand headline accent, three Roman-numbered
  process steps, `.btn-primary` + `.btn-secondary` actions. Optional
  `tourSlug` prop wires per-tour context.
- **Wordmark.tsx:** new factored component supporting `header` /
  `footer` / `hero` sizes, `asHeading` prop for the footer brand block.

### Pages updated

- **Homepage:** brand signature hero ("Egypt asks more of you / *than
  its postcards admit.*" — straight + italic-faience-second-line) +
  4/5 limestone color-block placeholder figure + standfirst section
  with sand italic accent + ConciergeCTA. Real photography swaps in
  post-cutover.
- **City detail page:** with-hero / no-hero parity (both render paths
  cleanly). No-hero variant uses italic faience oversized city
  initial (`clamp(5rem, 13vw, 9rem)`) above region eyebrow and H1 as a
  publishing-grade typographic anchor. Empty-keyFacts hide. Section
  header on related-tours block. ConciergeCTA at page bottom.
- **Blog/journal landing:** brand sweep — fluid display heading,
  italic Cormorant lede, rule-bordered category nav (italic Cormorant
  categories with faience hover) replacing the rounded-pill nav.
- **404 surface:** consolidated to `(site)/[locale]/not-found.tsx`
  swept to brand tokens. Root `app/not-found.tsx` deleted; locale
  catchall (`(site)/[locale]/[...rest]/page.tsx`) added so unmatched
  paths reach the branded 404 instead of Next's built-in white 404.

### Photography strategy

- **Cities with `featured_media`:** real WP-migrated photography
  renders in the with-hero variant (verified on Cairo, Aswan, Luxor on
  production; Akhmim on staging).
- **Cities without `featured_media`:** no-hero variant with italic
  faience initial typographic anchor — no image, intentional restraint
  per brand-inputs Section 8 fallback strategy.
- **Homepage figure:** 4/5 limestone-warm color-block placeholder with
  sand-gradient overlay + italic Cormorant caption. Swappable for real
  imagery via siteSettings or a homepage Sanity document post-cutover.
- **Favicon:** italic Cormorant faience "2" on paper at `app/icon.svg`
  (Next.js auto-generates `<link rel="icon">`).

### Lighthouse scores (final, against `migration-staging`)

| Page | Accessibility | Best Practices |
|---|---:|---:|
| `/` | 100 | 100 |
| `/guide/cairo` | 100 | 100 |
| `/guide/aswan` | 100 | 100 |
| `/guide/bahariya-oasis` | 100 | 100 |

`valid-source-maps` audit fails are dev-mode artifacts; production
builds emit maps and the audit clears.

### WCAG contrast (dark sections)

All foreground/background pairings on dark sections (concierge CTA,
standfirst) measured ≥ 7:1 (AAA). Sand on night = 8.31:1; paper on
night = 17.5:1; paper @ 70% on night = 12.6:1. Sand on paper is the
expected fail (2.11:1) and is forbidden by the brand spec — no
implementation uses it.

### Decision log

Decisions made during the session that diverged from or extended
brand-inputs:

1. **Operator-note tone differentiation kept (not collapsed).**
   Brand-inputs Section 5 prescribed a single operator-note variant;
   the existing schema has four tones (honest / caution / insider /
   context) that signal meaningfully different kinds of authority
   claim. Resolution: single visual language across tones, italic
   faience eyebrow label per tone — preserves editorial information
   without surface differentiation.
2. **No-hero variant typographic anchor.** Brand-inputs prescribed
   limestone color block for missing photography. Phase 2 review
   judged the bare title-block read as missing-something. Resolution:
   italic faience oversized city initial (publishing convention from
   Cereal / NYT T Magazine / brand-inputs Section 5 italic-as-accent)
   above the title.
3. **Brand documents path.** Brief specified `~/t2e/migration/
   .brand-inputs/`; placed in session worktree path instead so reads
   work from session CWD per the methodology rule about session
   artifacts. `.gitignore` covers all worktrees. Audited at session
   start.
4. **Sans-serif swap.** Existing code used Public Sans; brand-inputs
   Section 2 specifies Inter. Approved swap; baseline metrics tighter
   but no layout breaks observed.
5. **Tailwind v4 `@theme`-in-CSS interpretation.** Brand-inputs
   Section 1 used Tailwind v3 config syntax; this project uses v4 with
   `@theme` block in CSS. Ported the same semantic tokens; idiomatic
   for v4.
6. **Legacy aliases retained.** Plan said remove in Phase 2; broader
   page-template sweep deferred to session 6, so aliases stay active
   to prevent unmigrated pages from rendering broken. Removal is
   session 6 cleanup work.
7. **Standfirst whitespace at desktop.** Phase 4 surfaced the 200px
   labeled-column pattern leaves visible whitespace below the eyebrow
   at 1280. Verdict: keep — faithful to homepage v2 reference and the
   Aesop/Hermès/Cereal labeled-column editorial pattern.

### Known follow-ups (for session 6 handoff)

- Tour / wiki / packages list page templates still carry legacy color
  classes from the Phase 2 sweep deferral. Need brand sweep.
- Tour detail page concierge CTA + section headers (depends on tour
  template; tour template itself needs brand sweep).
- "Recently designed trips" + Knowledge / Wiki sections from homepage
  v2 (depend on real content + a homepage Sanity document).
- JA-locale Cairo slug 404s on staging (pre-existing dataset issue;
  flag for migration triage). Production has working JA Cairo.
- Legacy aliases removal once unmigrated page templates are swept.

---

## Session 6 close (2026-05-03)

Pre-flight defects resolved for the 449-subpage write cohort. **Pre-flight
only — no actual subpage writes in session 6.** The 449-subpage actual
write is session 6.5, separate session, separate brief, separate session
worktree. Per the brief's Phase 3 split decision, this session's scope
stops at "pre-flight verified, ready for session 6.5."

### Pre-flight defects resolved

| Defect | Commit | Description |
|---|---|---|
| 1 | `038649e` | `--filter-by-template` posts narrowing fix. Closes the session 5 Step 8 scope-anomaly trap by extending scope-narrowing to all corpora. New `--type=both` value; `--type` now required when `--filter-by-template` is set. New `scripts/wp-import/scope.ts` with pure `decideScope` + `validateScopeFlags` + `ScopeFlagError`. |
| 2 | `72b8840` | `mergeArticleDoc` + `mergeGuideArticleDoc` + `applyMerge` dispatcher + `MERGE_REGISTRY`. Single dispatch site in `persistResult` via `isMergeableType` → `applyMerge` → registry lookup. Loud-failure on unregistered `_type`. `applyCityMerge` retained as backward-compat facade for the diff path. |
| 3 | `4b5d3a3` | 27 `*-egypt` deferred slugs triage. Decision-only artifact at `migration/.diffs/destination-hub-misclassified-resolved.md`. Five locked decisions D1–D5; per-slug routing table; session 6.5 prerequisites flagged. |

### Field classification tables (canonical reference for session 6.5)

`scripts/wp-import/merge.ts`:

```ts
ARTICLE_EDITORIAL_ONLY_FIELDS = [
  'author', 'category', 'featured', 'updatedAt',
  'relatedArticles', 'relatedTours', 'relatedCities',
] as const;

GUIDE_ARTICLE_EDITORIAL_ONLY_FIELDS = [
  'section', 'orderRank', 'relatedTours', 'seo',
] as const;
```

**Reasoning** (lesson 15): mapper-produced acknowledged-defaults treated
as editorial-only because editorial assignment is canonical authority,
not classifier output. `author = legacy-archive` is a schema-requirement
default; `category` is a 2-bucket slug heuristic default; `section` is
a classifier-inferred default. Editorial reassignment in Studio overlays
canonical authority and must survive re-imports.

**Pre-staged for session 6.5** (when the travelTip mapper lands):

```ts
TRAVEL_TIP_EDITORIAL_ONLY_FIELDS = [
  'category', 'relatedTips', 'seo',
] as const;
```

`category` editorial-only by the same provenance principle as article /
guideArticle. `relatedTips` and `seo` are mapper-not-produced.

### `mergeCityDoc` semantic refinement

Contract evolved from **"editorial-only ⇒ WP can't write"** to
**"editorial-only ⇒ WP can't OVERWRITE editor's value."** On CREATE-first
(`existing === null`) the WP value is allowed through to seed the field;
on UPDATE the existing-side value is preserved.

- Strictly additive on CREATE-first path; UPDATE semantics identical.
- All 42 existing `mergeCityDoc` tests still green.
- **Future risk** (flag for awareness): if a city mapper change starts
  producing fields currently in `CITY_EDITORIAL_ONLY_FIELDS`
  (`placesToGo`, `coordinates`, `region`, `orderRank`, `gallery`),
  CREATE-first runs would now write that mapper value where previously
  they dropped it. Probably correct behavior, but a behavior shift any
  future mapper change should weigh.

### Test triad results

| Suite | Assertions | Status |
|---|---:|---|
| `npm run test:merge` (city contract) | 42 | ✓ green |
| `npm run test:merge-dispatch` (article + guideArticle + registry) | 50 | ✓ green |
| `npm run test:scope` (filter-by-template scope) | 42 | ✓ green |
| **Total** | **134** | ✓ |

`tsc --noEmit`: clean.

### Drift assertion baseline result (cold-cache)

Ran the session 5 invocation pattern as `--dry-run-diff-only` from this
fresh worktree:

```
npm run wp-import -- --filter-by-template destination-hub \
  --slug-pattern '*-travel-guide' --slug-exclude 'egypt-travel-guide' \
  --type page --dry-run-diff-only
```

Results: 41/41 cities enumerated. **24 no-hero cities + Cairo: 0 changed
lines** (matched approved-shape `befec11adfcbd6f2` / `e79be18948f1d1ca`).
**17 hero-bearing cities: 2 changed lines each, all isolated to
`heroImage.asset._ref`** (real Sanity asset hash on existing-side vs.
`image-dryrun-{wpId}` placeholder on mapper-output side).

**Root cause: cold worktree cache.** `migration/.cache/media/` is
gitignored and not propagated from main; without cached asset refs the
dry-run media path returns the placeholder at
[`scripts/wp-import/media.ts:124`](../scripts/wp-import/media.ts).
**Not Phase 1/2-introduced drift.** Five-lines-of-evidence attribution
per lesson 17:

1. Single field affected (`heroImage.asset._ref` only)
2. `media.ts` unmodified by Phase 1/2
3. mergeCityDoc UPDATE semantics unchanged (refinement is CREATE-first only)
4. `heroImage` not in `CITY_EDITORIAL_ONLY_FIELDS` — flows through Q3 rule 1 same as before
5. 24 no-hero cities + Cairo pass cleanly under same code path

Session 5 close's "41/41 cities, 0 changed line(s)" result remains
canonical (was achieved with hot cache immediately post-Step-8 actual
write). The fresh-worktree summary regenerated by this run was reverted
to preserve the session 5 historical record.

### Operational notes

#### Cold-cache vs. hot-cache asset ref divergence

`--dry-run-diff-only` against a fresh worktree's cold
`migration/.cache/media/` produces placeholder asset refs
(`image-dryrun-{wpId}`) that diverge from real Sanity asset content
hashes. Drift assertions in fresh worktrees show false-positive drift
on cities (or any docs) with hero / asset references.

Two paths:

1. **Run drift assertion only after actual writes in the same worktree**
   (cache hot from the upload pass, refs real). Standing pattern for
   post-write drift assertions.
2. **Pre-populate the cache from current Sanity state.** Needed only if
   a session does drift-assertion-only work in a fresh worktree.

For session 6.5: option 1 — the post-write drift assertion follows the
449-doc actual write, asset cache is hot.

#### `wp-import` test-side-effects on `migration-summary.md` / `migration-log.jsonl`

The regression-guard test in `scripts/wp-import/__tests__/scope.test.ts`
(case c2: `--type page --dry-run --limit 0`) invokes the full importer
as a subprocess. Even with `--dry-run --limit 0`, the importer still
writes `migration/migration-summary.md` and appends to
`migration/migration-log.jsonl` at run end. These files are tracked
historical records (session 5 close state), so test runs in a fresh
worktree pollute them.

**Mitigation for now:** revert the files before commit (`git checkout
HEAD -- migration/migration-log.jsonl migration/migration-summary.md`).
**Future fix candidate** (deferred to session 6.5+): add a
`--no-summary` flag that suppresses summary + log writes, OR have the
test invoke through a wrapper that redirects to `/tmp`. Logging here
so future sessions don't waste cycles re-investigating the same drift
signal.

#### CLI flag form: `--type` accepts space-separated only

`--type page` parses; `--type=page` does not parse (the wp-import
parseCli loop only matches `case '--type':` then advances to next argv
entry). Surfaced during session 6 Phase 4.1 drift run. Session 6.5
authors should use the space-separated form. (Same applies to
`--filter-by-template`, `--slug-pattern`, etc. — all CLI flags that
take a value use the space-separated form in this codebase.)

### Decision log — five locked decisions D1–D5

Cross-referenced to `migration/.diffs/destination-hub-misclassified-resolved.md`:

| ID | Slug(s) | Decision |
|---|---|---|
| D1 | All 20 originally-classified guideArticles | 2 → guideArticle (`reaching-{siwa,sohag}-egypt`), 18 → travelTip (lesson 16: schema wins over classifier) |
| D2 | `about-egypt` | Decision-deferred post-cutover; default redirect `/`; 500-word body sample captured for editorial review |
| D3 | `month-by-month-guide-to-egypt` | travelTip / `when-to-go` |
| D4 | `currency-in-egypt` | travelTip / `culture-and-money` with 3,000-char post-strip fallback to redirect |
| D5 | `hassle-free-egypt` | Redirect `/tours/`, don't migrate (Q5 `egypt-travel-guide` precedent) |

### Methodology lessons committed in session 6 (commit cross-reference)

| Commit | Lesson |
|---|---|
| `72b8840` | Lesson 15 — Field classification is about provenance authority, not mapper output |
| `4b5d3a3` | Lesson 16 — When classifier output conflicts with schema reality, schema wins |
| (Phase 4 surface) | Lesson 17 — Drift signals require root-cause investigation before remediation |

Lessons live in the top-level "Methodology lessons (carry forward)"
section of this file.

### Counts at session 6 close (canonical)

| Metric | Value | Note |
|---|---:|---|
| Cities in `migration-staging` | **41** | unchanged from session 5 close |
| Articles in `migration-staging` | **495** | unchanged from session 5 close (165 EN + 165 ES + 165 JA) |
| `guideArticle` in `migration-staging` | **0** | session 6.5 will write the cohort |
| `editorialCategory` in `migration-staging` | **21** | 19 wp-imports + 2 seed docs (`category-planning`, `category-destination`) — session 5's "19" referred to wp-imports only |
| `translation.metadata` in `migration-staging` | **0** | also 0 on production; per Investigation 1 the prior 163-165 figures were transient post-write counts; article-side i18n is intact via per-locale `language` field (165 EN + 165 ES + 165 JA articles) |

### Cutover blockers timeline

Session 8 close deadline for production-only city enrichments still
holds (per session 5.5 close). Session 6 doesn't open new blockers
(pre-flight only). No tightening needed.

### Session 6 done; session 6.5 ready

- Pre-flight gates verified at session start (worktree-CWD, drift refs,
  brand-inputs, corpus-fact GROQ probes via direct curl, `tsc` clean)
- Three pre-flight defects landed (commits `038649e` / `72b8840` /
  `4b5d3a3`)
- 134 test assertions across 3 suites green
- Decision artifact written, drift baseline explained, session 6.5
  handoff prepared at `migration/.handoffs/session-6.5-subpage-write.md`
- No actual subpage writes; that is session 6.5 scope.

### Branch state at session 6 close

Branch `claude/magical-wiles-511a5a` (harness-generated; the brief's
illustrative `claude/session-6-preflight` was not used — actual branch
name is canonical for this session's references). Merged to `main` at
session 6 close per workflow rule 1.

## Session 6.5a close (2026-05-04)

Session 6.5 was split into 6.5a (preparation + investigations + override
maps) and 6.5b (actual 451-doc write). 6.5a is preparation-only — no
writes to staging beyond Phase 1's seeding of 6 `travelTipCategory` docs.

### Phase commits

| Phase | Commit | Description |
|---|---|---|
| Phase 1 | `dc64ccb` | Seeded 6 `travelTipCategory` docs to migration-staging via `scripts/seed-travel-tip-categories.ts` |
| Phase 2 | `81f0f34` | `travelTip` mapper + classifier extension (predicate-based rule firing before `*-egypt`) + dispatch wire-in |
| Phase 3 | `aa1cfd5` | `mergeTravelTipDoc` + `MERGE_REGISTRY` entry + 22 new merge-dispatch assertions |
| Phase 2 amendment | `517e389` | 5 override maps in `wp-classifier.ts`; classifier override checks at top of `classifyPageBySlug`; slug/section/parentCity overrides in `mapGuideArticle`; `TRAVEL_TIP_SLUG_TO_CATEGORY` extended 18 → 30; `routeToMapper` deferred-editorial returns structured `MapperResult` |
| Phase 3 amendment | `03499b0` | New `classifier-overrides.test.ts` (105 assertions) + `npm run test:overrides` script |
| Phase 4 | (no commit — dry-run only) | Validated final cohorts: 417 guideArticle, 30 travelTip, 4 article; 1 deferred slug; 3 dahab cleanups verified; D4 currency-in-egypt MIGRATE confirmed (3,351 chars ≥ 3,000 threshold) |

### Investigations completed

- **Investigation 1** — 33-vs-18 travelTip cohort. Enumerated the
  `egypt-travel-tips` hub tile-grid (33 unique canonical slugs after
  dead-link resolution); identified 14 case-D content gaps; routed 13
  into the travelTip cohort across existing 6 buckets (Q1: no new
  bucket — `health-and-safety` folds into `practical-essentials`);
  `tips-for-families` becomes a redirect target rather than a separate
  doc per editorial decision (content merges into `traveling-with-kids`).
- **Investigation 2** — `egypt-weather-guide` + `month-by-month-guide-to-egypt`.
  Verified both as WP **pages** (not posts); session 5 article import
  scope was complete (165 EN posts × 3 locales = 495 articles, no gap);
  both routed to `article` via `EXPLICIT_PAGE_ROUTING`. Supersedes
  session 6 Phase 3 D3 decision for `month-by-month-guide-to-egypt`.
- **Investigation 3** — Topic-suffix audit on the 422 destination-subpage
  cohort. Surfaced 7 misroutes: 3 `*-private-car-and-guide` slugs
  (tour products) → `tour-or-package` via override; 4
  `dahab-historical-guide-N` slug-collision junk → 1 deferred
  (`dahab-historical-guide-4` → `EXPLICIT_DEFER_SLUGS`) + 3 cleanups
  with slug/section/parent overrides (`-3` → colored-canyon /
  while-you-are-there; `-5` → blue-hole / others; `-6` →
  dahab-restaurants / others; all parent=dahab).
- **Pre-Phase-5 audit** — `^egyptian-` page-corpus enumeration. 3 matches:
  1 routes to `tour-or-package` correctly via tour-pattern rule
  (`egyptian-museum-and-bazaar-tour`); 2 to `article` via pre-existing
  editorial pattern (`...-citadel-and-khan-el-khalili-bazaar`,
  `...-textile-museum`). Confirms article cohort = 4 final.

### 5 override maps in `scripts/wp-classifier.ts`

Each fires before generic classification rules; encodes editorial
decisions as data, not rules (lesson 20).

| Map | Entries | Use |
|---|---:|---|
| `EXPLICIT_PAGE_ROUTING` | 6 | Route slug → spec'd `PageType` (Inv 2 + Inv 3) |
| `EXPLICIT_SLUG_OVERRIDES` | 3 | Sanity slug differs from WP database slug (dahab cleanups) |
| `EXPLICIT_SECTION_OVERRIDES` | 3 | `guideArticle.section` when classifier heuristic can't determine bucket (dahab cleanups) |
| `EXPLICIT_PARENT_CITY_OVERRIDES` | 3 | `guideArticle.parentCity` defensive override (dahab cleanups) |
| `EXPLICIT_DEFER_SLUGS` | 1 | No-write defer; cutover redirect at session 9 (`dahab-historical-guide-4`) |

Override application is editorial-only; protected by
`mergeGuideArticleDoc` field-level i18n preservation; deferred path
returns structured `MapperResult` with `data.code = 'editorial-defer'`
log entry (assertable as a first-class event per lesson 18).

### Decision log — 6.5a routing decisions

| ID | Decision |
|---|---|
| 6.5a-D1 | 33-vs-18 → **30 travelTip cohort** (Inv 1: 17 from etp tile grid + 13 case-D additions; `tips-for-families` redirects to `traveling-with-kids`; `egypt-travel-tips` hub becomes the new `/travel-tips/` index route) |
| 6.5a-D2 | `egypt-weather-guide` → `article` via `EXPLICIT_PAGE_ROUTING` (Inv 2: blog-post-shaped; lives in journal) |
| 6.5a-D3 (supersedes session-6 D3) | `month-by-month-guide-to-egypt` → `article` (supersedes session 6 Phase 3 D3 routing to travelTip; lives in journal as blog post per Inv 2 narrative shape) |
| 6.5a-D4 | 3 `*-private-car-and-guide` → `tour-or-package` (Inv 3: tour products; routing override; defer write to session 8 alongside the existing 5 deferred tour rows from session 6 Phase 3 D5) |
| 6.5a-D5 | 4 `dahab-historical-guide-N` (Inv 3): `-4` deferred (content merges editorially to `/guide/abu-simbel/only-in-abu-simbel/`); `-3`, `-5`, `-6` migrate with slug rewrites (`colored-canyon`, `blue-hole`, `dahab-restaurants`) and section/parent overrides |
| 6.5a-D6 | `egypt-travel-faqs` → defer + new schema design later; no migration, no redirect, 404 at cutover (Q6) |
| 6.5a-D7 | `movement-guide` → `service-or-utility` stub (no write); manual redirect to `/guide/taba/ways-to-get-to-taba/` |

### Test triad results

| Suite | Assertions | Status |
|---|---:|---|
| `test:merge` | 42 | ✓ |
| `test:merge-dispatch` | 72 | ✓ |
| `test:scope` | 42 | ✓ |
| `test:overrides` | 105 | ✓ (new file) |
| **Total** | **261** | ✓ all green |

`tsc --noEmit`: clean.

### Methodology lessons committed in session 6.5a

| Commit (post-amendment) | Lesson |
|---|---|
| `03499b0` | Lesson 18 — Spec contract evolution during test-triad work is normal and good |
| `03499b0` (Phase 4 surface) | Lesson 19 — Cohort math compounds across investigations; reality is the source of truth |
| `517e389` | Lesson 20 — Editorial routing overrides as data, not rules |

### Final cohort numbers (canonical, supersedes session 6 close)

| Metric | Value | Note |
|---|---:|---|
| Cities in `migration-staging` | **41** | unchanged |
| Articles in `migration-staging` | **495** | unchanged (165 × 3 locales) |
| `guideArticle` in `migration-staging` | **0** | 6.5b will write **417** |
| `travelTip` in `migration-staging` | **0** | 6.5b will write **30** |
| `travelTipCategory` in `migration-staging` | **6** | seeded in 6.5a Phase 1 |
| `editorialCategory` in `migration-staging` | **21** | unchanged |

Pending session 6.5b actual writes: **451 docs** (417 guideArticle + 30
travelTip + 4 article). 0 to staging from 6.5a beyond the 6
`travelTipCategory` Phase 1 seeds.

### Operational note for 6.5b authors

When `--filter-by-template article` is invoked against the page corpus
(which 6.5b does for the 4 article migrations), pre-existing
`^egyptian-` editorial pattern matches surface in addition to the 2
`EXPLICIT_PAGE_ROUTING` overrides. Document so future authors don't
read 4 and assume defect. Source of truth: classifier rule 5 in
`scripts/wp-classifier.ts`. The 4 final article slugs:

1. `egypt-weather-guide` (wp-page-73355) — `EXPLICIT_PAGE_ROUTING` (Inv 2)
2. `month-by-month-guide-to-egypt` (wp-page-61367) — `EXPLICIT_PAGE_ROUTING` (Inv 2)
3. `egyptian-museum-citadel-and-khan-el-khalili-bazaar` (wp-page-87870) — pre-existing rule 5 (editorial pattern `^egyptian-`)
4. `egyptian-textile-museum` (wp-page-63575) — pre-existing rule 5

A 5th `^egyptian-` page (`egyptian-museum-and-bazaar-tour`,
wp-page-87729) routes to `tour-or-package` via tour-pattern rule 4
which fires before rule 5 (correct: title is "Egyptian Museum and
Bazaar Tour" — a tour product).

### Cutover blockers timeline

Session 8 close deadline for production-only city enrichments still
holds. Session 6.5a (preparation only) opens no new blockers. No
tightening needed.

### Branch state at session 6.5a close

Branch `claude/hopeful-dhawan-e5c186` (harness-generated). 5 commits
ahead of `main` at close (3 from prior session-6-5a-prep work
fast-forwarded into this worktree at session start: `dc64ccb` /
`81f0f34` / `aa1cfd5`; plus 2 amendment commits in this session:
`517e389` / `03499b0`). Merged to `main` at session 6.5a close per
workflow rule 1.
