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

## Scripts

- `scripts/audit-raw-links-2026-07-17.cjs` — read-only recount
- `scripts/resolve-raw-links-2026-07-17.cjs` — resolver, emits resolution-plan.json
- `scripts/apply-raw-link-repoint-2026-07-17.cjs` — dry-run by default, `--apply` to patch
