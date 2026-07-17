# Raw travel2egypt.org link sweep — round 2 (2026-07-17)

Follow-up to the corpus-wide sweep: fresh full-document recount, visibility
analysis, and a validated re-point batch. All raw absolute
`travel2egypt.org` links break (or degrade) at DNS cutover, so this is
launch-blocking hygiene.

## Recount (full-document scan, not just `body[].value[].markDefs`)

12,277 raw instances across 441 published docs — but visibility matters:

| bucket | instances | why it matters |
| --- | --- | --- |
| wikiMonument on redirected-away pages | 8,619 | pages never render (their `/wiki/monuments/<slug>` routes are redirect-mapped to /guide) — **moot** |
| hidden guideArticles | 2,006 | `hidden: true`, never render — **moot** |
| **user-visible** | **1,652** | guideArticle 1,046 · tour 353 · article 245 · hotel 6 · misc 2 |

Two body shapes the original sweep's detection missed entirely:
- `tour.days[].{morning,afternoon,…}[].value[]` itinerary links (353)
- `article.body[].markDefs` flat blog bodies (245)

## Applied (2026-07-17, production Sanity)

- Resolver: static alias → redirect-map → `migration.wpUrl` exact →
  wpUrl locale-variant (blog `-en/-es/-ja` siblings) → unique per-locale slug.
- 172 distinct URLs resolved → **357 href changes across 111 docs applied**.
- Every distinct target (164) live-validated HTTP 200 on the dev server
  before writing; `_key`-addressed patches; only `href` strings changed.
- 2 docs held (pending drafts): `wp-page-63523`, `wp-page-131814`.
- Rollback: `backups/raw-link-repoint-rollback-2026-07-17.json` (gitignored).
- Post-verify: all 111 docs re-scanned, 0 resolved URLs remain; rendered
  spot-check on `/es/guide/el-cairo/madraza-y-mausoleo-de-qalawun` shows the
  swapped internal link live.

## Remaining (parked for owner triage)

552 distinct URLs / 1,294 visible instances did not resolve 1:1 —
`unresolved-visible-urls-triage.csv` lists them with carrier docs, ranked by
instance count. Dominated by old ES hierarchical guide-topic URLs
(`/es/guia-de-viaje-de-<city>/<topic>`) whose topics map only into
broader-scoped pages — same class as the previously parked ambiguous set.

Also still owed from round 1: 4 pre-draft docs (3 are hidden, only the hotel
renders), and the unroutable category/theme targets (subset of the parked CSV).

## Triage-resolution round (same day, rounds 2–4 + strips)

Worked the parked triage list down with four additional evidence-gated tiers,
all applied to production and post-verified:

| round | method | applied |
| --- | --- | --- |
| 2 | fuzzy city+topic / flat token match, hand-curated (all 119 machine matches reviewed; 14 city-page fallbacks replaced with correct tour/guide targets, 6 ambiguous rejected) + 35 manual overrides | **255 instances / 122 docs** |
| 3 | old-site 301 chase (WP still knows the renames) + JA title-match tier (JA slugs are romaji; Japanese-script URLs match JA *titles*) | **305 instances / 138 docs** |
| 4 | dead-on-old-site URLs that still have a 1:1 new-site home (20 hand-verified, incl. the 12-instance Aga Khan Mausoleum ES link) | **46 instances / 34 docs** |
| strip | dead on the old site (404) AND no unique new-site target — markDef removed, text kept | **52 links / 36 docs** |

Every re-point target was live-validated 200 on dev before writing.
Old-site probe evidence: `round2-4/parked-oldsite-probe.json` (control-tested).

**Side find, fixed separately:** the redirect map carried its only cycle —
`/es/abu-simbel-en-avion-desde-asuan` ⇄ `/es/abu-simble-by-plane-from-aswan`
(ERR_TOO_MANY_REDIRECTS live) — PR #73.

**Closing state: user-visible raw links are down from 1,652 → 637 instances
(262 distinct URLs).** The remainder is the genuine owner-triage class: old
WP pages that still return 200 on the old site, whose topics only exist
inside broader-scoped new pages (plus a handful on the 2 draft-held docs).
`unresolved-visible-urls-triage.csv` is regenerated with old-site status per
URL — sortable evidence for case-by-case decisions.

**Dedup debris spotted along the way (owner FYI, not touched):** duplicate
Cairo guideArticles (`mosque-madrasa-of-al-ghouri` vs
`mosque-madrassa-of-al-ghouri`; `mosque-of-al-nasir-muhammad-ibn-qalawun` vs
`mosque-of-al-nasir-mohammed-ben-qalawoon`), duplicate Siwa food pages
(`gastronomia-en-siwa` vs `gastronomia-del-oasis-de-siwa`).

## Scripts

- `scripts/audit-raw-links-2026-07-17.cjs` — read-only recount
- `scripts/resolve-raw-links-2026-07-17.cjs` — resolver, emits resolution-plan.json
- `scripts/apply-raw-link-repoint-2026-07-17.cjs` — dry-run by default, `--apply` to patch
