# Theme Heuristic Audit — Session 15

## Operator action required

Re-theme via Studio if the heuristic default doesn't match operational intent. **Operator review queue: ~62 docs**:

- **A.** 28 packages assigned `theme-egypt-in-depth` via fallback (Batch 2).
- **B.** 24 packages reclassified at sub-step 3.5a (commit 877c602), all assigned `theme-egypt-in-depth` placeholder.
- **C.** 3 placeholder themes from session 14 sub-step 2g.1 (already operator-confirmed; listed for completeness).

## A. Heuristic fallback assignments — 28 Batch 2 packages

These docs landed on `theme-egypt-in-depth` because no specific keyword in slug or title matched a more specific theme rule. Re-theme to `theme-luxury`, `theme-special-interest`, `theme-nile-cruise`, etc. as appropriate.

| _id | slug | title |
|---|---|---|
| `wp-page-158702` | `8-days-egypt-tours` | 8 Days Egypt Tours |
| `wp-page-159000` | `9-days-egypt-tours` | 9 Days Egypt Tours |
| `wp-page-159022` | `11-days-egypt-tours` | 11 Days Egypt Tours |
| `wp-page-159038` | `10-days-egypt-tours` | 10 Days Egypt Tours |
| `wp-page-159097` | `12-days-egypt-tours` | 12 Days Egypt Tours |
| `wp-page-159124` | `7-days-egypt-tours` | 7 Days Egypt Tours |
| `wp-page-159175` | `14-days-egypt-tours` | 14 Days Egypt Tours |
| `wp-page-159581` | `15-days-egypt-tours` | 15 Days Egypt Tours |
| `wp-page-159590` | `13-days-egypt-tours` | 13 Days Egypt Tours |
| `wp-page-159756` | `2-days-egypt-tours` | 2 Days Egypt Tours |
| `wp-page-159772` | `5-days-egypt-tours` | 5 Days Egypt Tours |
| `wp-page-238471` | `9-days-cairo-st-catherine-sharm-el-sheikh` | 9 Days – Cairo · St. Catherine · Sharm El Sheikh |
| `wp-page-86836` | `11-day-the-splendor-of-egypt-tour` | 11-Day The Splendor of Egypt Tour |
| `wp-page-86844` | `8-days-egypt-panorama-tour` | 8-Days Egypt Panorama Tour |
| `wp-page-86857` | `the-egypt-royal-vacation-tour` | Regal Escape: 10-Day The Egypt Royal Vacation Tour |
| `wp-page-86867` | `8-days-ultimate-trip-to-sharm-el-sheikh` | Sharm’s Delight: 8-Days The Ultimate Trip to Sharm El Sheikh |
| `wp-page-87255` | `10-days-unforgettable-egypt-tour` | Memories Eternal: 10-Days Unforgettable Egypt Tour |
| `wp-page-88972` | `luxor-personalized-vacation` | Custom Luxor Retreat: 8-Day Personalized Vacation |
| `wp-page-88992` | `10-day-marvelous-abu-simbel-ancient-egypt-tour` | 10-Day Marvelous Abu Simbel Ancient Egypt Tour |
| `wp-page-88994` | `secret-sanctuaries-13-day-mysterious-oases-and-the-nile-tour` | Secret Sanctuaries: 13-Day Mysterious Oases and the Nile Tour |
| `wp-page-89175` | `8-days-best-of-egypt-tour-package` | Egypt Highlights: 8-Days Best of Egypt Tour Package |
| `wp-page-89343` | `10-days-the-splendid-minya-tour` | Minya’s Majesty: 10-Days The Splendid Minya Tour |
| `wp-page-89376` | `10-days-nile-dreamer-tour-experience` | 10-Days Nile Dreamer Tour Experience |
| `wp-page-89436` | `8-day-egypt-golf-tour` | Fairways & Pharaohs: 8-Day Egypt Golf Tour |
| `wp-page-89524` | `13-day-impressive-egypt-tour` | Pharaonic Odyssey: 13-Day Impressive Egypt Tour |
| `wp-page-89602` | `10-days-eternal-egypt-tour` | Timeless Wonders: 10-Days Eternal Egypt Tour |
| `wp-page-89649` | `aswan-personalized-vacation` | Aswan Tailored Retreat: 8-Day Personalized Vacation |
| `wp-page-90416` | `8-day-luxor-to-luxor-cruise` | Nile Circumnavigation: 8-Day Luxor to Luxor Cruise |

### Naming-pattern suggestions
| Title pattern | Likely theme |
|---|---|
| Royal / Splendor / Eternal / Imperial / Elegant | `theme-luxury` |
| Panorama / Highlights / Comprehensive / Essential | `theme-egypt-in-depth` (likely correct) |
| Religious / Heritage / Holy / Sacred | `theme-special-interest` |
| Multi-day Nile-focused without "cruise" keyword | `theme-nile-cruise` candidate |

## B. Batch 1 reclassifications with placeholder theme — 24 docs (commit 877c602)

All 24 reclassified at sub-step 3.5a-redo with `theme-egypt-in-depth` placeholder. Several look like clear candidates for re-theming:

| _id | slug | title | duration | themeRef |
|---|---|---|---|---|
| `wp-page-113521` | `3-day-siwa-journey-from-alexandria` | 3-Day Siwa Journey From Alexandria | 3d (null) | theme-egypt-in-depth |
| `wp-page-130027` | `2-day-desert-nature-wildlife-retreat` | 2-Day Nubian Desert Nature & Wildlife Retreat | 2d (null) | theme-egypt-in-depth |
| `wp-page-130067` | `4-day-ultimate-lake-nasser-experience` | 4-Day Ultimate Lake Nasser Experience | 4d (null) | theme-egypt-in-depth |
| `wp-page-131889` | `5-day-the-obeiyed-cave-safari-tour` | Desert Adventure: 5-Day The Obeiyed Cave Safari Tour | 5d (null) | theme-egypt-in-depth |
| `wp-page-136519` | `epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs` | Epic Egyptian Escape: A 7-Day Adventure from Pyramids to Pharaohs | 7d (null) | theme-egypt-in-depth |
| `wp-page-136566` | `7-days-in-egypt-pyramids-temples-and-timeless-wonders` | 7 Days in Egypt: Pyramids, Temples, and Timeless Wonders | 7d (null) | theme-egypt-in-depth |
| `wp-page-145910` | `2-day-pyramids-mediterranean-tour` | Cairo to Alexandria: 2-Day Pyramids & Mediterranean Tour | 2d (null) | theme-egypt-in-depth |
| `wp-page-153242` | `4-day-history-culture-escape` | Short Break in Cairo: 4-Day History Culture Escape | 4d (null) | theme-egypt-in-depth |
| `wp-page-155539` | `desert-horizons-7-day-bahariya-siwa-oasis-tour` | Desert Horizons: 7-Day Bahariya Siwa Oasis Tour – Travel2Egypt | 7d (null) | theme-egypt-in-depth |
| `wp-page-155692` | `a-western-desert-expedition` | Desert Trails: A Western Desert Expedition | 3d (null) | theme-egypt-in-depth |
| `wp-page-238357` | `5-days-cairo-luxor-romance-edition` | 5 Days – Cairo Luxor Romance Edition | 5d (null) | theme-egypt-in-depth |
| `wp-page-238371` | `nile-love-journey-luxor-aswan` | Nile Love Journey — Luxor Aswan | 3d (null) | theme-egypt-in-depth |
| `wp-page-238461` | `3-days-cairo-highlights-for-friends` | 3 Days – Cairo Highlights for Friends | 3d (null) | theme-egypt-in-depth |
| `wp-page-86790` | `luxor-2-day-tour-by-plane-from-cairo` | Aerial Odyssey: Luxor 2-Day Tour by Plane from Cairo | 2d (null) | theme-egypt-in-depth |
| `wp-page-86846` | `4-days-city-break` | 4-Days City Break | 4d (null) | theme-egypt-in-depth |
| `wp-page-87830` | `2-day-tour-to-al-minya-from-cairo` | Minya s Secrets: 2-Day Minya Tour from Cairo | 2d (null) | theme-egypt-in-depth |
| `wp-page-87834` | `private-tour-2-day-trip-to-bahariya-oasis` | Desert Oasis: 2-Day Bahariya Oasis Private Tour From Cairo | 2d (null) | theme-egypt-in-depth |
| `wp-page-87976` | `private-tour-2-day-trip-to-alexandria-from-cairo` | Mediterranean Heritage: 2-Day Alexandria Private Tour from Cairo | 2d (null) | theme-egypt-in-depth |
| `wp-page-89411` | `white-desert-wonders-4-day-cairo-and-white-desert-tour` | White Desert Wonders: 4-Day Cairo and White Desert Tour – Travel2Egypt | 4d (null) | theme-egypt-in-depth |
| `wp-page-89439` | `bahariya-oasis-and-white-desert-3-day-tour` | Desert Oasis: Bahariya Oasis And White Desert 3-Day Adventure | 3d (null) | theme-egypt-in-depth |
| `wp-page-90402` | `4-days-cruise-from-aswan-to-luxor` | Nile Discovery: 4-Days Cruise from Aswan to Luxor | 4d (null) | theme-egypt-in-depth |
| `wp-page-90411` | `5-day-river-cruise-from-luxor` | Nile Majesty: 5-Day River Cruise from Luxor | 5d (null) | theme-egypt-in-depth |
| `wp-page-90425` | `5-day-lake-nasser-cruise-from-aswan` | 5-Day Lake Nasser Cruise from Aswan | 5d (null) | theme-egypt-in-depth |
| `wp-page-90443` | `4-days-lake-nasser-cruise-from-abu-simbel` | Lake Nasser Explorer: 4-Day Lake Nasser Cruise from Abu Simbel | 4d (null) | theme-egypt-in-depth |

Operator-domain re-themeing candidates from this batch:
- `siwa-oasis-adventure-tour`, `bahariya-oasis-and-white-desert`, `great-pharaohs-and-white-desert` → `theme-adventure`
- `*-cruise-*` slugs (lake-nasser-cruise, river-cruise) → `theme-nile-cruise`
- `elegant-cairo` → possibly `theme-luxury`

## C. Session 14 placeholder themes (3 docs)

From session 14 sub-step 2g.1 — already operator-confirmed. Listed for completeness:
- `wp-page-89558` essential-egypt → `theme-egypt-in-depth` ✓
- `wp-page-89452` sacred-journey-holy-family → `theme-special-interest` ✓
- `wp-page-89353` pharaohs-epic-grand-tour → `theme-egypt-in-depth` ✓

## D. By-theme groupings (105 packages with theme set)

For each theme, total count and 3 sample slugs. Helps operator verify each bucket is internally coherent.

### `theme-egypt-in-depth` — 68 docs
  - `wp-page-102370` aswan-and-abu-simbel-from-luxor
  - `wp-page-113061` siwa-oasis-adventure-tour
  - `wp-page-113521` 3-day-siwa-journey-from-alexandria
  - `wp-page-130027` 2-day-desert-nature-wildlife-retreat
  - `wp-page-130067` 4-day-ultimate-lake-nasser-experience

### `theme-hassle-free` — 10 docs
  - `wp-page-158052` egypt-tours
  - `wp-page-160059` 4-day-cairo-travel-package
  - `wp-page-160072` 8-day-egypt-holiday-package
  - `wp-page-160096` 18-day-grand-egypt-holiday-package
  - `wp-page-160107` 8-day-customized-aswan-travel-deal

### `theme-nile-cruise` — 10 docs
  - `wp-page-160149` egypt-nile-cruise-vacation-from-india
  - `wp-page-160357` luxor-to-cairo-egypt-nile-cruise-vacation
  - `wp-page-160477` 11-day-luxor-to-cairo-egypt-nile-cruise-vacation
  - `wp-page-249752` 15-day-nile-cruise-and-hurghada-tour
  - `wp-page-89177` 11-day-nile-cruise-from-luxor-to-cairo

### `theme-family-egypt` — 5 docs
  - `wp-page-112993` 12-day-amazing-family-vacation-in-egypt
  - `wp-page-113004` 14-day-egypt-luxury-family-holiday
  - `wp-page-113005` 9-day-classic-egypt-family-adventure
  - `wp-page-237730` cairo-and-alexandria-4-days-family-package
  - `wp-page-237732` cairo-and-nile-cruise-8-day-family-package

### `theme-adventure` — 4 docs
  - `wp-page-156550` 11-day-egypt-tour-of-history-adventure-relaxation
  - `wp-page-87974` 8-day-cairo-and-egypt-desert-safari
  - `wp-page-89005` 10-day-nile-and-western-desert-tour
  - `wp-page-89435` 9-day-egypt-bird-watching-adventure

### `theme-luxury` — 4 docs
  - `wp-page-160044` 14-day-egypt-tour-package-for-families
  - `wp-page-160139` 9-day-prestigious-egypt-vacation
  - `wp-page-160182` luxury-14-day-egypt-tour-package-from-australia-for-families
  - `wp-page-86855` 9-days-egypt-prestigious-vacation

### `theme-egypt-red-sea` — 3 docs
  - `wp-page-238377` 9-days-red-sea-desert-escape
  - `wp-page-238436` 12-day-red-sea-desert-friends-escape
  - `wp-page-89284` 11-day-explore-egypt-and-red-sea-tour

### `theme-special-interest` — 1 docs
  - `wp-page-89452` the-holy-family-trip-in-egypt


## E. Methodology note

Pattern `essential|grand-tour|in-depth` matched **0/68** in Batch 2. Dead code in the heuristic. Recommend removal in a future maintenance pass — it was added on the assumption that "essential"/"grand"/"in-depth" titles would map to the egypt-in-depth bucket, but that bucket is now driven entirely by fallback.
