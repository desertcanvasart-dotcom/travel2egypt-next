# Session 6.5b — Actual write (451 docs)

Handoff input from session 6.5a close (2026-05-04). Pre-flight prep
and editorial-routing investigations are done; this brief covers only
the **actual writes** + drift assertion + close-to-session-7 handoff.

**Scope:** 451 docs across 3 cohorts — 417 guideArticle, 30 travelTip,
4 article (page corpus). Plus 1 deferred slug (no write) and 9 manual
redirect rows for session 9.

**Out of scope:** classifier or mapper code changes (6.5a closed all
investigation findings); test-triad changes (261 assertions are the
inherited surface); brand sweeps; non-subpage migrations. New code in
6.5b should be a vanishing surface — verification scripts at most.

---

## Inputs from 6.5a (canonical)

### 6.5a phase commits

| Phase | Commit |
|---|---|
| Phase 1 — seed travelTipCategory docs | `dc64ccb` |
| Phase 2 — travelTip mapper + classifier extension | `81f0f34` |
| Phase 3 — mergeTravelTipDoc + test triad | `aa1cfd5` |
| Phase 2 amendment — 5 override maps + extended TRAVEL_TIP_SLUG_TO_CATEGORY | `517e389` |
| Phase 3 amendment — classifier-overrides.test.ts | `03499b0` |
| 6.5a merge-to-main | (see `git log --oneline main` post-merge — should be the merge commit immediately following `03499b0`) |

### Source-of-truth documents

- **`migration/known-issues.md` "Session 6.5a close" section** — final
  cohort numbers, decision log (6.5a-D1 through D7), override map
  inventory, methodology lessons 18–20. **Read this before any
  invocation work.** Trust this over any other narrative claim.
- `migration/.diffs/destination-hub-misclassified-resolved.md` — session
  6 Phase 3 D1–D5 routing decisions for the original 27-slug
  *-egypt deferred list. Still canonical for those decisions; 6.5a-D3
  (`month-by-month-guide-to-egypt`) supersedes the session-6 D3 row.
- `scripts/wp-classifier.ts` — 5 override maps (`EXPLICIT_PAGE_ROUTING`,
  `EXPLICIT_SLUG_OVERRIDES`, `EXPLICIT_SECTION_OVERRIDES`,
  `EXPLICIT_PARENT_CITY_OVERRIDES`, `EXPLICIT_DEFER_SLUGS`). Editorial
  decisions are encoded as data; do not migrate to rule additions.

### 6.5a investigations (all completed; no follow-ups)

- Investigation 1: 33-vs-18 travelTip cohort — resolved
- Investigation 2: `egypt-weather-guide` + `month-by-month-guide-to-egypt`
  routing as page-corpus articles — resolved
- Investigation 3: topic-suffix audit on 422 destination-subpage cohort
  — resolved (7 misroutes triaged)
- Pre-Phase-5 audit: `^egyptian-` page-corpus enumeration — resolved
  (article cohort = 4 final)

---

## Cohort scope (451 total writes)

| Cohort | Count | Sanity type |
|---|---:|---|
| destination-subpage → guideArticle | 417 | `guideArticle` |
| travelTip | 30 | `travelTip` |
| page-corpus article | 4 | `article` |
| **Total** | **451** | |

Of the 4 page-corpus articles: 2 from `EXPLICIT_PAGE_ROUTING`
(`egypt-weather-guide`, `month-by-month-guide-to-egypt`) + 2 from
pre-existing `^egyptian-` editorial pattern rule
(`egyptian-museum-citadel-and-khan-el-khalili-bazaar`,
`egyptian-textile-museum`). All 4 migrate cleanly per Phase 4C dry-run.

Pre-existing `^egyptian-` matches surface for the first time when
`--filter-by-template article` is scoped against pages — classifier
rule has been active since session 5 but never previously exercised
by template-filter. Don't read 4 and assume defect.

---

## Pre-flight gates for 6.5b start

Standing pattern from session 5 / 5.5 / 6 / 6.5a. Run **all** before any
actual write. This should be a verification-only gate; no new code expected.

1. **Worktree-CWD verification** — confirm working in the worktree, not
   main. Lesson 11 / lesson 13 standing protocol.
2. **Brand-inputs path verification** — `migration/.brand-inputs/`
   sourced from `~/Desktop/travel2egypt-brand/` if any brand reference
   needed. Probably none for 6.5b.
3. **Corpus-fact verification via direct curl** — cleaner pattern from
   session 6:
   ```bash
   # 6 travelTipCategory docs in staging?
   curl -s --get "https://ufallvd2.api.sanity.io/v2024-12-01/data/query/migration-staging" \
     --data-urlencode 'query=count(*[_type=="travelTipCategory"])' | jq '.result'
   # Expected: 6
   ```
4. **`tsc --noEmit` clean** — no new code expected; this should pass
   trivially. Lesson 11.
5. **261 test assertions still green:**
   ```bash
   npm run test:merge && npm run test:merge-dispatch && \
     npm run test:scope && npm run test:overrides
   ```
6. **Override-map sanity check** — verify 5 maps loaded:
   ```bash
   tsx -e "import('./scripts/wp-classifier.js').then(m => console.log({
     PAGE_ROUTING: Object.keys(m.EXPLICIT_PAGE_ROUTING).length,
     SLUG: Object.keys(m.EXPLICIT_SLUG_OVERRIDES).length,
     SECTION: Object.keys(m.EXPLICIT_SECTION_OVERRIDES).length,
     PARENT: Object.keys(m.EXPLICIT_PARENT_CITY_OVERRIDES).length,
     DEFER: m.EXPLICIT_DEFER_SLUGS.size,
   }))"
   # Expected: { PAGE_ROUTING: 6, SLUG: 3, SECTION: 3, PARENT: 3, DEFER: 1 }
   ```
7. **Drift assertion (cold cache)** — fresh worktree expected to
   produce false-positive hero-asset placeholder drift on the
   destination-subpage diff path. Document and proceed (lesson 17:
   distinguish env-introduced drift from code-introduced). Hot-cache
   re-run after the actual write should produce 0 changed lines for the
   merged cohort (lesson 12 standing protocol).

---

## Invocation patterns for the 3 cohorts

`--type page` is **required** when `--filter-by-template` is set
(session-6 Phase 1 fix). `--type=page` (equals form) does NOT parse —
use space-separated. Same for all CLI flags taking a value.

```bash
# Cohort 1 — guideArticle (417 docs, including 3 dahab cleanups via
# overrides; excludes dahab-historical-guide-4 deferred via
# EXPLICIT_DEFER_SLUGS short-circuit in routeToMapper)
npm run wp-import -- --type page --filter-by-template destination-subpage

# Cohort 2 — travelTip (30 docs)
npm run wp-import -- --type page --filter-by-template travelTip

# Cohort 3 — article from page corpus (4 docs:
# 2 EXPLICIT_PAGE_ROUTING + 2 pre-existing ^egyptian- pattern)
npm run wp-import -- --type page --filter-by-template article
```

Do not collapse the 3 invocations into a single `--type page` run
without `--filter-by-template` — that would also pull in unclassified
slugs (egypt-travel-faqs, egypt-travel-tips hub, movement-guide etc.)
which are intentionally out-of-scope and editorially deferred per
session 6.5a-D6 / D7. The session-5 Step 8 trap.

### Expected outcomes per cohort

- **guideArticle (417):** 0 errors. `section-needs-assignment` review
  flag count: 115 (3 dahab cleanups receive `section` via override and
  drop the flag). Multi-locale groups: 416 (1 singleton).
- **travelTip (30):** 0 errors. **D4 currency-in-egypt: MIGRATE**
  (post-strip EN body length 3,351 ≥ 3,000 threshold; surfaced as a
  stderr line `[mapTravelTip] D4: ... ≥ 3000; migrating as travelTip.`).
  All review flags: `none`.
- **article (4):** 0 errors. 12 article docs (4 × 3 locales) + 4
  `translation.metadata` docs cross-linking each group. Mapper-default
  `category` = `category-destination` (acknowledged-default per
  lesson 15; editorial Studio reassignment to `category-planning`
  post-write is canonical and protected by `ARTICLE_EDITORIAL_ONLY_FIELDS`).
- **1 deferred slug (`dahab-historical-guide-4`):** does not appear in
  any cohort enumeration (the destination-subpage filter excludes it
  because it now classifies as `unclassified`). If the 6.5b author
  invokes against the unclassified template explicitly, `routeToMapper`
  short-circuits with `{ docs: [], redirects: [], logEntries: [{ data:
  { code: 'editorial-defer', ... } }] }` per lesson 18. Cutover redirect
  is session 9 manual work.

### Override applications to verify post-write

The 3 dahab cleanups:

| WP slug | Sanity slug (all 3 locales) | section | parentCity (EN slug) |
|---|---|---|---|
| `dahab-historical-guide-3` | `colored-canyon` | `while-you-are-there` | `dahab` |
| `dahab-historical-guide-5` | `blue-hole` | `others` | `dahab` |
| `dahab-historical-guide-6` | `dahab-restaurants` | `others` | `dahab` |

Post-write GROQ probe:
```bash
curl -s --get "https://ufallvd2.api.sanity.io/v2024-12-01/data/query/migration-staging" \
  --data-urlencode 'query=*[_id in ["wp-page-59458","wp-page-59426","wp-page-59422"]]{_id, "slug":slug[_key=="en"][0].value.current, section, "parent":parentCity->slug[_key=="en"][0].value.current}'
# Expected: 3 docs with override slugs/sections; parent="dahab"
```

---

## Manual redirects for session 9 (manual-redirects.csv)

| From | To | Source decision |
|---|---|---|
| `/hassle-free-egypt/` | `/tours/` | session 6 Phase 3 D5 |
| `/about-egypt/` | `/` | session 6 Phase 3 D2 |
| `/tips-for-families/` | `/travel-tips/traveling-with-kids/` | 6.5a-D1 |
| `/egypt-travel-tips/` | `/travel-tips/` | 6.5a-D1 (hub becomes new index route) |
| `/movement-guide/` | `/guide/taba/ways-to-get-to-taba/` | 6.5a-D7 |
| `/dahab-historical-guide-3/` | `/guide/dahab/colored-canyon/` | 6.5a-D5 |
| `/home/dahab-historical-guide-4/` | `/guide/abu-simbel/only-in-abu-simbel/` | 6.5a-D5 (deferred slug) |
| `/dahab-historical-guide-5/` | `/guide/dahab/blue-hole/` | 6.5a-D5 |
| `/dahab-historical-guide-6/` | `/guide/dahab/dahab-restaurants/` | 6.5a-D5 |

The dahab-3/5/6 redirects are also emitted automatically by
`mapGuideArticle.buildRedirects` (override slug applied to `to_path`,
WP link as `from_url`) — capture in csv as well for cutover surface.
The deferred `-4` slug has no automatic emission; the manual row is
the only redirect record.

---

## Out-of-scope carry-forwards

- Tour / wiki / packages list-template brand sweep (post-cutover or future session).
- 8 deferred tour-or-package docs (5 from session-6 Phase 3 D5 + 3 from
  6.5a Inv 3 `*-private-car-and-guide`) → session 8 cohort.
- `egypt-travel-faqs` FAQ schema design + content authoring → post-cutover
  session (6.5a-D6).
- `dahab-historical-guide-N` junk-slug editorial cleanup on WP side
  (rename slugs in WP, then re-import in follow-up); 6.5b's slug overrides
  paper over the WP-side mess but the WP slugs remain editorially
  unfortunate.
- Region values on remaining staging cities (Siwa, Sharm El Sheikh,
  Hurghada, Alexandria) — opportunistic during 6.5b city update if natural.
- JA-locale Cairo slug 404 triage on staging (pre-existing, not blocking).
- Legacy `@theme` alias removal — depends on broader page-template sweep.
- Diff path extension (`--dry-run-diff-only`) to `guideArticle` /
  `travelTip` — currently destination-hub-only (`scripts/wp-import.ts:195`).
  Future infrastructure work, not 6.5b blocker.

---

## Methodology lessons in force for 6.5b

Especially: **8** (safety-net runtime convergence), **9** (every
safety-net component requires its own end-to-end integration test),
**12** (post-write drift assertion), **15** (mapper output is
acknowledged-default, not canonical assignment), **16** (schema wins
over classifier), **17** (drift signals require root-cause investigation
before remediation), **18** (spec contract evolution during test-triad
work is normal and good), **19** (cohort math compounds across
investigations; reality is the source of truth), **20** (editorial
routing overrides as data, not rules).

Full lesson text in `migration/known-issues.md` "Methodology lessons
(carry forward)" section.
