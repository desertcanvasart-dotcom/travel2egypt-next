# Session 17 — nileCruise quality audit

**Date:** 2026-05-14
**Dataset:** migration-staging
**Total nileCruise docs:** 40

## Operator action required

### 1. Type-inference review

`26` of 40 cruises (65.0%) got
`type = 'cruise-ship'` via `default-cruise-ship` fallback (no `-dahabiya` /
`-felucca` keyword in slug). Mostly M/S-prefixed motor ships — almost
certainly correct. But some default-cruise-ship docs might actually be
dahabiyas or feluccas where the slug doesn't carry the keyword. Operator
should spot-check in Studio.

The 14 dahabiya-keyword docs are confidently typed; the 0 felucca-keyword
shows the operator-domain assumption that felucca vessels are tour-only,
not vessel-listed individually — confirm.

Edge case to verify: `nile-cruise-holidays` (wp-page-86752) — slug shape
is a generic marketing/listing page, not a specific vessel. Consider
deferring or unpublishing.

### 2. Tier assignment

All 40 of 40 cruise docs have `tier = null`.
The mapper does not infer tier — this is editorial judgement based on
operator's knowledge of the vessel (standard / deluxe / luxury / boutique).

Operator workflow:
1. Filter nileCruise list by `!defined(tier)`.
2. For each vessel, assign tier.
3. Hint: brand prefixes (Movenpick, Sonesta, Oberoi, Steigenberger) often
   correlate with deluxe+; "boutique" should be reserved for small specialty
   dahabiyas.

### 3. Missing optional fields

| Field | Missing count | % |
|---|---:|---:|
| `tier` | 40 | 100.0% |
| `capacity` (cabins) | 40 | 100.0% |
| `body` (EN) | 0 | 0.0% |
| `heroImage` | 33 | 82.5% |



Cruises missing hero image (33):
- wp-page-83685 `adelaide-dahabiya`
- wp-page-83686 `agatha-dahabiya`
- wp-page-86704 `authentic-dahabiya-nile-cruise`
- wp-page-65281 `el-nil-dahabiya`
- wp-page-64459 `m-s-al-kahila-nile-cruise`
- wp-page-64354 `m-s-alexander-the-great-nile-cruise`
- wp-page-64104 `m-s-amwaj-livingstone-nile-cruise`
- wp-page-65217 `m-s-historia-nile-cruise`
- wp-page-65210 `m-s-mayfair`
- wp-page-65203 `m-s-mayflower-nile-cruise`
- wp-page-64340 `m-s-moon-goddess-nile-cruise`
- wp-page-64441 `m-s-nubian-sea`
- wp-page-64150 `m-s-nubian-sea-lake-nasser-cruise`
- wp-page-64289 `m-s-sonesta-st-george-nile-cruise`
- wp-page-64426 `m-s-sonesta-star-goddess-nile-cruise`
- wp-page-64341 `m-s-steigenberger-legacy-nile-cruise`
- wp-page-64268 `m-s-steigenberger-minerva-nile-cruise`
- wp-page-64259 `m-s-steigenberger-omar-el-khayam`
- wp-page-64203 `malouka-dahabiya`
- wp-page-70064 `meroe-dahabiya`
- wp-page-64312 `movenpick-ms-darakum-nile-cruise`
- wp-page-64295 `movenpick-ms-hamees-nile-cruise`
- wp-page-64322 `movenpick-ms-royal-lotus-nile-cruise`
- wp-page-64331 `movenpick-ms-sun-ray-nile-cruise`
- wp-page-64228 `movenpick-prince-abbas-cruise`
- wp-page-64450 `movenpick-sb-feddya-dahabiya`
- wp-page-64294 `ms-esplanade-nile-cruise`
- wp-page-86752 `nile-cruise-holidays`
- wp-page-65309 `nour-el-nil-malouka-dahabiya`
- wp-page-64250 `oberoi-zahra-nile-cruise`
- wp-page-83684 `roman-dahabiya`
- wp-page-64176 `sonesta-amirat-dahabiya`
- wp-page-64129 `the-nile-goddess-cruise`


## Imported cruises — full ledger

| _id | slug | type | typeInference |
|---|---|---|---|
| wp-page-83685 | adelaide-dahabiya | dahabiya | slug-keyword |
| wp-page-106202 | adelaide-dahabiya-nile-cruise | dahabiya | slug-keyword |
| wp-page-83686 | agatha-dahabiya | dahabiya | slug-keyword |
| wp-page-106203 | agatha-dahabiya-journey-along-the-nile | dahabiya | slug-keyword |
| wp-page-86704 | authentic-dahabiya-nile-cruise | dahabiya | slug-keyword |
| wp-page-65281 | el-nil-dahabiya | dahabiya | slug-keyword |
| wp-page-64216 | kasr-ibrim-cruise-ship | cruise-ship | default-cruise-ship |
| wp-page-64278 | m-s-al-jamila-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64459 | m-s-al-kahila-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64354 | m-s-alexander-the-great-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64104 | m-s-amwaj-livingstone-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-65217 | m-s-historia-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-65210 | m-s-mayfair | cruise-ship | default-cruise-ship |
| wp-page-65203 | m-s-mayflower-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64340 | m-s-moon-goddess-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64441 | m-s-nubian-sea | cruise-ship | default-cruise-ship |
| wp-page-64150 | m-s-nubian-sea-lake-nasser-cruise | cruise-ship | default-cruise-ship |
| wp-page-64289 | m-s-sonesta-st-george-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64426 | m-s-sonesta-star-goddess-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64341 | m-s-steigenberger-legacy-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64268 | m-s-steigenberger-minerva-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64259 | m-s-steigenberger-omar-el-khayam | cruise-ship | default-cruise-ship |
| wp-page-64203 | malouka-dahabiya | dahabiya | slug-keyword |
| wp-page-70064 | meroe-dahabiya | dahabiya | slug-keyword |
| wp-page-64312 | movenpick-ms-darakum-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64295 | movenpick-ms-hamees-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64322 | movenpick-ms-royal-lotus-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64331 | movenpick-ms-sun-ray-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64228 | movenpick-prince-abbas-cruise | cruise-ship | default-cruise-ship |
| wp-page-64450 | movenpick-sb-feddya-dahabiya | dahabiya | slug-keyword |
| wp-page-64294 | ms-esplanade-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-86752 | nile-cruise-holidays | cruise-ship | default-cruise-ship |
| wp-page-65273 | nour-el-nil-assouan-dahabiya | dahabiya | slug-keyword |
| wp-page-65309 | nour-el-nil-malouka-dahabiya | dahabiya | slug-keyword |
| wp-page-64190 | nour-el-nil-meroe-dahabiya | dahabiya | slug-keyword |
| wp-page-64250 | oberoi-zahra-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-83684 | roman-dahabiya | dahabiya | slug-keyword |
| wp-page-64176 | sonesta-amirat-dahabiya | dahabiya | slug-keyword |
| wp-page-64053 | swiss-inn-radamis-ii-nile-cruise | cruise-ship | default-cruise-ship |
| wp-page-64129 | the-nile-goddess-cruise | cruise-ship | default-cruise-ship |
