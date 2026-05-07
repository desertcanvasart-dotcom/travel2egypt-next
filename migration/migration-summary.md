# Migration summary

- **Started:** 2026-05-07T22:30:44.683Z
- **Finished:** 2026-05-07T22:30:57.086Z
- **Argv:** `--filter-by-template destination-hub --slug-pattern *-travel-guide --slug-exclude egypt-travel-guide --type page --dry-run --limit 0`
- **Errors:** 0

## By Sanity type

| Type | Written | Skipped | Failed |
|---|---:|---:|---:|
| city | 41 | 0 | 0 |

## Review flags applied

| Flag | Count |
|---|---:|
| keyfacts-mining-failed | 40 |
| none | 1 |

## HTML pipeline detections

- Operator notes: 0
- Pull quotes: 0
- Side images: 0
- Inline images: 258
- Tables flattened: 0

## Locale linkage (hreflang)

- Entities probed: 41
- Multi-locale groups (EN+ES+JA): 41
- Singletons (EN-only): 0
- Broken hreflang (URL not in REST cache): 0

## Strip rule activity

| Rule | Instances removed |
|---|---:|
| tour-promo CTA (`.elementor-cta`) | 0 |
| category-grid (`.e-grid` w/ internal-only anchors) | 0 |
| duplicate-paragraph backlink | 0 |
| swiper carousel (`swiper-slide-image`) | 0 |
| premium-adv carousel (`premium-adv-carousel__item-img`) | 0 |
| bdt-img tour-promo (`bdt-img`) | 18 |
| title-matching H1 (Fix 1) | 60 |
| metadata lines `Created/Updated On…` (Fix 2) | 75 |
| section nav blocks `INTRODUCING …` (Fix 3) | 41 |
| link-mark → `_pendingInternalRef` (URL validator fix) | 1942 |
| link-mark kept as `externalLink` | 110 |
| link-mark stripped (malformed/empty) | 0 |
| link-mark stripped (`#anchor` only) | 1 |
| link-mark stripped (bare mailto:/tel:) | 0 |

## Stripped carousels

_None._

## Ambiguous filename matches

_None._

## Sanity write resilience

- Transient retries (5xx / ECONNRESET, succeeded after retry): 0

## Media

- Uploaded: 0
- Reused (idempotent): 0
- Failed: 0
- Duplicate `<img src>` remappings (same wpId, different src): 0

## Missing source attachments

_None._

## Upload exhaustions (Sanity side)

_None._

## Redirects

- Total entries: 253
- Live URL matches: 0
- Historic nested URL matches: 0
- Orphans (manual triage): 691

## Relink phase

- Documents scanned: 0
- Internal links resolved: 0
- Orphaned (kept as external): 0
- Documents patched: 0

## City reconciliation

- Cities updated: 27
- Places-to-go references added: 134
