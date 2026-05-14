# Data Quality Gaps Audit — Session 15

## Operator action required

Six gap categories surfaced during Batch 1 + Batch 2 import. Most are editorial fills in Studio. One is investigative.

---

## A. Package-placeholder `durationDays` (2 docs from Batch 2)

These imported with `durationDays = 7` placeholder because neither slug nor title carried an N-day signal. Mapper recorded `migration.durationDaysSource = 'package-placeholder'` for Step 5 surfacing.

| _id | slug | title | currentDays |
|---|---|---|---|
| `wp-page-158052` | `egypt-tours` | Egypt Tours from the UK | 7 |
| `wp-page-160129` | `bahariya-and-siwa-oasis-vacation` | An Unforgettable Bahariya and Siwa Oasis Vacation from India | 7 |

**Operator action**: verify correct duration via WP source content; update in Studio.

---

## B. Reclassification placeholder `durationDays` (2 docs from sub-step 3.5a-redo)

From commit 877c602 — operator-decision placeholders for docs without N-day signals in slug/title:

| _id | slug | title | duration |
|---|---|---|---|
| `wp-page-113521` | `3-day-siwa-journey-from-alexandria` | 3-Day Siwa Journey From Alexandria | 3d (null) |
| `wp-page-130027` | `2-day-desert-nature-wildlife-retreat` | 2-Day Nubian Desert Nature & Wildlife Retreat | 2d (null) |
| `wp-page-130067` | `4-day-ultimate-lake-nasser-experience` | 4-Day Ultimate Lake Nasser Experience | 4d (null) |
| `wp-page-131889` | `5-day-the-obeiyed-cave-safari-tour` | Desert Adventure: 5-Day The Obeiyed Cave Safari Tour | 5d (null) |
| `wp-page-136519` | `epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs` | Epic Egyptian Escape: A 7-Day Adventure from Pyramids to Pharaohs | 7d (null) |
| `wp-page-136566` | `7-days-in-egypt-pyramids-temples-and-timeless-wonders` | 7 Days in Egypt: Pyramids, Temples, and Timeless Wonders | 7d (null) |
| `wp-page-145910` | `2-day-pyramids-mediterranean-tour` | Cairo to Alexandria: 2-Day Pyramids & Mediterranean Tour | 2d (null) |
| `wp-page-153242` | `4-day-history-culture-escape` | Short Break in Cairo: 4-Day History Culture Escape | 4d (null) |
| `wp-page-155539` | `desert-horizons-7-day-bahariya-siwa-oasis-tour` | Desert Horizons: 7-Day Bahariya Siwa Oasis Tour – Travel2Egypt | 7d (null) |
| `wp-page-155692` | `a-western-desert-expedition` | Desert Trails: A Western Desert Expedition | 3d (null) |
| `wp-page-238357` | `5-days-cairo-luxor-romance-edition` | 5 Days – Cairo Luxor Romance Edition | 5d (null) |
| `wp-page-238371` | `nile-love-journey-luxor-aswan` | Nile Love Journey — Luxor Aswan | 3d (null) |
| `wp-page-238461` | `3-days-cairo-highlights-for-friends` | 3 Days – Cairo Highlights for Friends | 3d (null) |
| `wp-page-86790` | `luxor-2-day-tour-by-plane-from-cairo` | Aerial Odyssey: Luxor 2-Day Tour by Plane from Cairo | 2d (null) |
| `wp-page-86846` | `4-days-city-break` | 4-Days City Break | 4d (null) |
| `wp-page-87830` | `2-day-tour-to-al-minya-from-cairo` | Minya s Secrets: 2-Day Minya Tour from Cairo | 2d (null) |
| `wp-page-87834` | `private-tour-2-day-trip-to-bahariya-oasis` | Desert Oasis: 2-Day Bahariya Oasis Private Tour From Cairo | 2d (null) |
| `wp-page-87976` | `private-tour-2-day-trip-to-alexandria-from-cairo` | Mediterranean Heritage: 2-Day Alexandria Private Tour from Cairo | 2d (null) |
| `wp-page-89411` | `white-desert-wonders-4-day-cairo-and-white-desert-tour` | White Desert Wonders: 4-Day Cairo and White Desert Tour – Travel2Egypt | 4d (null) |
| `wp-page-89439` | `bahariya-oasis-and-white-desert-3-day-tour` | Desert Oasis: Bahariya Oasis And White Desert 3-Day Adventure | 3d (null) |
| `wp-page-90402` | `4-days-cruise-from-aswan-to-luxor` | Nile Discovery: 4-Days Cruise from Aswan to Luxor | 4d (null) |
| `wp-page-90411` | `5-day-river-cruise-from-luxor` | Nile Majesty: 5-Day River Cruise from Luxor | 5d (null) |
| `wp-page-90425` | `5-day-lake-nasser-cruise-from-aswan` | 5-Day Lake Nasser Cruise from Aswan | 5d (null) |
| `wp-page-90443` | `4-days-lake-nasser-cruise-from-abu-simbel` | Lake Nasser Explorer: 4-Day Lake Nasser Cruise from Abu Simbel | 4d (null) |

**Operator action**: confirm exact duration in Studio.

---

## C. Missing `heroImage` (110 docs across all tour types)

Source-side: WP `featured_media = 0` for these docs — no image to upload at import time.

| Type | Count |
|---|---|
| dayTour | 51 |
| package | 59 |
| **Total** | **110** |

**Operator action**: add hero images via Studio if/when source assets become available.

Full list (truncated to first 30; query Sanity for full set):

| _id | type | slug |
|---|---|---|
| `wp-page-110952` | dayTour | `the-giza-sound-and-light-show-experience` |
| `wp-page-112993` | package | `12-day-amazing-family-vacation-in-egypt` |
| `wp-page-113004` | package | `14-day-egypt-luxury-family-holiday` |
| `wp-page-113005` | package | `9-day-classic-egypt-family-adventure` |
| `wp-page-113061` | package | `siwa-oasis-adventure-tour` |
| `wp-page-113193` | dayTour | `aswan-to-el-kab-and-edfu-temple-tour` |
| `wp-page-113206` | dayTour | `aswan-felucca-adventure` |
| `wp-page-115566` | dayTour | `semi-submarine-adventure-in-marsa-alam` |
| `wp-page-115573` | dayTour | `snorkeling-adventure-on-the-nefertari-submarine` |
| `wp-page-115615` | dayTour | `nefertari-submarine-adventure-and-sunset-dinner-cruise-from-marsa-alam` |
| `wp-page-130027` | package | `2-day-desert-nature-wildlife-retreat` |
| `wp-page-133412` | dayTour | `sunrise-hot-air-balloon-ride-over-luxors-ancient-landmarks` |
| `wp-page-145910` | package | `2-day-pyramids-mediterranean-tour` |
| `wp-page-154883` | dayTour | `overnight-sataya-dolphin-reef-safari` |
| `wp-page-158702` | package | `8-days-egypt-tours` |
| `wp-page-159000` | package | `9-days-egypt-tours` |
| `wp-page-159022` | package | `11-days-egypt-tours` |
| `wp-page-159038` | package | `10-days-egypt-tours` |
| `wp-page-159097` | package | `12-days-egypt-tours` |
| `wp-page-159124` | package | `7-days-egypt-tours` |
| `wp-page-159175` | package | `14-days-egypt-tours` |
| `wp-page-159581` | package | `15-days-egypt-tours` |
| `wp-page-159590` | package | `13-days-egypt-tours` |
| `wp-page-159756` | package | `2-days-egypt-tours` |
| `wp-page-159772` | package | `5-days-egypt-tours` |
| `wp-page-160044` | package | `14-day-egypt-tour-package-for-families` |
| `wp-page-160072` | package | `8-day-egypt-holiday-package` |
| `wp-page-160149` | package | `egypt-nile-cruise-vacation-from-india` |
| `wp-page-160182` | package | `luxury-14-day-egypt-tour-package-from-australia-for-families` |
| `wp-page-160209` | package | `8-day-sharm-el-sheikh-holiday-package-from-australia` |

(... and 80 more — run `*[_type=="tour" && !defined(heroImage.asset)]{_id, type, "slug": slug[_key=="en"][0].value.current}` to enumerate.)

---

## D. Missing summary

**0 docs** in the current state. Body extraction succeeded for every imported tour; `buildSummaryFromExtractedBody` produced output for all 222.

---

## E. Matrix violation meta backfill candidate (48 dayTour docs)

The `migration.matrixViolation` field was added to the mapper at commit f69b251, after Batch 1 dayTours had already imported (via ee0fb13). All 117 dayTours therefore have `matrixViolation: null` from the import path even though 48 of them are in fact violations (group dayTours visiting cities outside the allowed 6-city set).

Retroactive analysis is in `matrix-violations-audit.md`. To backfill the meta in Sanity, write a small one-shot patch script:

1. Re-fetch each `*[_type=="tour" && type=="dayTour" && tourMode=="group"]` doc.
2. Apply `detectMatrixViolation(type, tourMode, cities, cityIdToSlug)`.
3. Patch `migration.matrixViolation` if non-null.

Pattern: same shape as `scripts/reclassify-batch-1-audit.ts`. Estimated 48 patches.

**Operator action**: optional — surface this for Step 5 reviewer if matrix violations need to be queryable from Sanity (e.g. for a Studio dashboard). Otherwise live with the audit-report-only view.

---

## F. Cross-locale slug consolidation (12 docs)

`EN_SLUG_OVERRIDES_BY_WP_ID` only rewrites the EN-locale slug by design. JA + ES slugs for the 11 B3 canonicals + interpunct rename retain their raw WP source slugs (typically still country-suffixed for B3 canonicals).

**Operational implication**: `/en/packages/egypt-tours` and `/ja/packages/egypt-tours-from-the-uk` resolve to the same Sanity doc via different locale-specific slugs.

| _id | EN slug (override applied) | title |
|---|---|---|
| `wp-page-158052` | `egypt-tours` | Egypt Tours from the UK |
| `wp-page-160044` | `14-day-egypt-tour-package-for-families` | Luxury 14-Day Egypt Tour Package from India for Families |
| `wp-page-160059` | `4-day-cairo-travel-package` | Egypt Escape: 4-Day Cairo Travel Package from India |
| `wp-page-160072` | `8-day-egypt-holiday-package` | Sharm s Delight: 8-Day Egypt Holiday Package from India |
| `wp-page-160096` | `18-day-grand-egypt-holiday-package` | 18-Day Grand Egypt Holiday Package from India |
| `wp-page-160107` | `8-day-customized-aswan-travel-deal` | 8-Day Customized Aswan Travel Deal from India |
| `wp-page-160116` | `10-day-romantic-egypt-travel-deals` | Love on the Nile: 10-Day Romantic Egypt Travel Deals from India |
| `wp-page-160129` | `bahariya-and-siwa-oasis-vacation` | An Unforgettable Bahariya and Siwa Oasis Vacation from India |
| `wp-page-160139` | `9-day-prestigious-egypt-vacation` | Luxury & Legacy: 9-Day Prestigious Egypt Vacation from India |
| `wp-page-160357` | `luxor-to-cairo-egypt-nile-cruise-vacation` | 11 Day Luxor To Cairo Egypt Nile Cruise Vacation from Australia |
| `wp-page-160477` | `11-day-luxor-to-cairo-egypt-nile-cruise-vacation` | 11 Day Luxor To Cairo Egypt Nile Cruise Vacation from Canada |
| `wp-page-238471` | `9-days-cairo-st-catherine-sharm-el-sheikh` | 9 Days – Cairo · St. Catherine · Sharm El Sheikh |

**Operator action**: per-doc edit JA + ES slug fields in Studio to match the canonical pattern (suffix-stripped).

---

## G. Orchestrator-skipped doc

`wp-page-239040` `cairo-sky-adventure` was skipped during Batch 1 import via the `SKIP_PROMO_EXPLICIT` set in `scripts/wp-import.ts` (treated as promotional / interactive content rather than a real tour). It does not appear in migration-staging.

**Operator action**: investigate WP source — is it a real tour worth migrating, or a defunct promotional landing page? If real, remove from `SKIP_PROMO_EXPLICIT` and re-import; otherwise leave skipped.
