# Session 17 — hotel quality audit

**Date:** 2026-05-14
**Dataset:** migration-staging
**Total hotels:** 66

## Operator action required

### 1. Category placeholder review (HIGH PRIORITY)

All 66 hotels imported with `category = 'standard'` placeholder
(`migration.categoryResolution = 'default-standard'`). The mapper does not
infer category from slug — this is editorial judgement.

Operator workflow in Studio:
1. Filter Hotels list by `migration.categoryResolution == 'default-standard'`.
2. For each, assign correct category: `standard` / `deluxe` / `luxury` / `boutique`.
3. Use the EN name + slug as primary signal; cross-check against star rating
   if known.
4. Once assigned, the placeholder flag can be cleared (or left as audit trail).

### 2. City resolution review (24.2% breach)

16 of 66 hotels (24.2%) got `city = cairo`
via `default-cairo` fallback because the slug had no top-level city token.
Many of these have implied cities via sub-locality names not in the 41-city
Sanity inventory (Mena House → Giza, Sharks Bay → Sharm el-Sheikh, Old
Cataract / Isis Island → Aswan, Soma Bay / Magawish → Hurghada, Montazah /
San Stefano → Alexandria, Al-Tarfa → Dakhla Oasis, etc.).

| wpId | slug | implied real city |
|---|---|---|
| 83679 | al-tarfa-desert-sanctuary-lodge | (operator-assess) |
| 83680 | bedouin-castle-hotel | (operator-assess) |
| 92774 | benben-by-dhara-hotels-adults-only | (operator-assess) |
| 62455 | catherine-plaza-hotel | (operator-assess) |
| 77042 | double-tree-sharks-bay-resort | (operator-assess) |
| 83188 | el-beyt-hotel | (operator-assess) |
| 64837 | le-meridien-pyramids-hotel-and-spa | (operator-assess) |
| 86853 | marriott-mena-house-4-days-stay | (operator-assess) |
| 64007 | pyramisa-isis-island-hotel | (operator-assess) |
| 63592 | rixos-premium-magawish-suites-and-villas | (operator-assess) |
| 63666 | sheraton-montazah-hotel | (operator-assess) |
| 64025 | sofitel-legend-old-cataract | (operator-assess) |
| 131827 | sunrise-montemare-resort | (operator-assess) |
| 63663 | the-four-seasons-hotel-san-stephano | (operator-assess) |
| 84962 | the-nile-ritz-carlton | (operator-assess) |
| 63628 | the-westin-soma-bay-golf-resort-spa | (operator-assess) |

Operator decisions per row:
1. Confirm Cairo is correct → no change needed.
2. Re-assign to correct city in Studio.
3. Add slug to a future `SLUG_CITY_OVERRIDES` mapping if many hotels share
   the same sub-locality (e.g., everything mentioning Sharks Bay → Sharm).

### 3. Missing optional fields

| Field | Missing count | % |
|---|---:|---:|
| `starRating` | 66 | 100.0% |
| `body` (EN) | 0 | 0.0% |
| `heroImage` | 61 | 92.4% |

`starRating` is universally null — WP source has no machine-readable star
field. Operator fills in Studio.



Hotels missing hero image (61):
- wp-page-72466 `8-pickalbatros-palace-sharm-aqua-park`
- wp-page-83679 `al-tarfa-desert-sanctuary-lodge`
- wp-page-64066 `badawiya-hotel-el-dakhla-oasis`
- wp-page-83680 `bedouin-castle-hotel`
- wp-page-92774 `benben-by-dhara-hotels-adults-only`
- wp-page-63597 `cairo-hotel-pyramids`
- wp-page-62471 `cairo-marriott-hotel-and-omar-khayyam-casino`
- wp-page-77008 `casa-cook-el-gouna`
- wp-page-62455 `catherine-plaza-hotel`
- wp-page-77074 `cleopatra-luxury-resort-sharm-el-sheikh`
- wp-page-83681 `daniela-village-saint-catherine-hotel`
- wp-page-77042 `double-tree-sharks-bay-resort`
- wp-page-64075 `dream-lodge-hotel-siwa-oasis`
- wp-page-83188 `el-beyt-hotel`
- wp-page-63831 `fairmont-nile-city-hotel-cairo`
- wp-page-63826 `four-seasons-hotel-cairo-first-residence`
- wp-page-63689 `four-seasons-hotel-cairo-nile-plaza`
- wp-page-63598 `four-seasons-resort-sharm-alsheikh`
- wp-page-63883 `grand-nile-tower-hotel-cairo`
- wp-page-63660 `helnan-palestine-hotel-alexandria`
- wp-page-63657 `hilton-alexandria-corniche-hotel`
- wp-page-61923 `hilton-alexandria-green-plaza`
- wp-page-63552 `hilton-luxor-resort-spa`
- wp-page-72456 `hilton-sharm-sharks-bay`
- wp-page-63630 `hurghada-marriott-red-sea-resort`
- wp-page-63623 `hyatt-regency-sharm-el-sheikh`
- wp-page-63932 `jw-marriott-cairo-hotel`
- wp-page-63871 `kempinski-nile-hotel-cairo`
- wp-page-63635 `kempinski-soma-bay-hurghada`
- wp-page-63908 `le-meridien-cairo-airport-hotel`
- wp-page-64837 `le-meridien-pyramids-hotel-and-spa`
- wp-page-63665 `le-passage-cairo-hotel-and-casino`
- wp-page-63581 `maritim-jolie-ville-kings-island-luxor`
- wp-page-86853 `marriott-mena-house-4-days-stay`
- wp-page-63651 `marriott-mena-house-hotel-cairo`
- wp-page-63589 `meraki-resort-sharm-el-sheikh-adults-only`
- wp-page-63523 `mercure-luxor-karnak-resort`
- wp-page-63972 `movenpick-resort-aswan`
- wp-page-76997 `movenpick-resort-spa-el-gouna`
- wp-page-61925 `novotel-sharm-el-sheikh-hotel`
- wp-page-63506 `premier-le-reve-hotel-hurghada`
- wp-page-63673 `pyramids-park-resort-cairo`
- wp-page-63678 `ramses-hilton-cairo-hotel`
- wp-page-62469 `renaissance-sharm-el-sheikh-resort`
- wp-page-63592 `rixos-premium-magawish-suites-and-villas`
- wp-page-62450 `rixos-seagate-sharm-hotel`
- wp-page-63683 `royal-maxim-palace-kempinski-cairo`
- wp-page-131814 `sandrose-hotel-bahariya`
- wp-page-63512 `sharm-dreams-resort-sharm-el-sheikh`
- wp-page-62463 `sharm-el-sheikh-fayrouz-resort`
- wp-page-63666 `sheraton-montazah-hotel`
- wp-page-63645 `sofitel-pavillon-winter-luxor`
- wp-page-64114 `sol-y-mar-pioneers-hotel-al-kharga-oasis`
- wp-page-63641 `sonesta-st-george-luxor`
- wp-page-64287 `steigenberger-cecil-hotel-alexandria`
- wp-page-64598 `steigenberger-nile-palace-luxor-hotel`
- wp-page-131827 `sunrise-montemare-resort`
- wp-page-63663 `the-four-seasons-hotel-san-stephano`
- wp-page-84962 `the-nile-ritz-carlton`
- wp-page-63628 `the-westin-soma-bay-golf-resort-spa`
- wp-page-63984 `westin-cairo-golf-resort-and-spa`


## Imported hotels — full ledger

| _id | slug | city | cityResolution |
|---|---|---|---|
| wp-page-72466 | 8-pickalbatros-palace-sharm-aqua-park | sharm-el-sheikh | full-slug-scan |
| wp-page-83679 | al-tarfa-desert-sanctuary-lodge | cairo | default-cairo |
| wp-page-64066 | badawiya-hotel-el-dakhla-oasis | dakhla-oasis | full-slug-scan |
| wp-page-76293 | basma-hotel-aswan | aswan | full-slug-scan |
| wp-page-83680 | bedouin-castle-hotel | cairo | default-cairo |
| wp-page-92774 | benben-by-dhara-hotels-adults-only | cairo | default-cairo |
| wp-page-63597 | cairo-hotel-pyramids | cairo | full-slug-scan |
| wp-page-62471 | cairo-marriott-hotel-and-omar-khayyam-casino | cairo | full-slug-scan |
| wp-page-77008 | casa-cook-el-gouna | al-gouna | full-slug-scan |
| wp-page-62455 | catherine-plaza-hotel | cairo | default-cairo |
| wp-page-77074 | cleopatra-luxury-resort-sharm-el-sheikh | sharm-el-sheikh | full-slug-scan |
| wp-page-83681 | daniela-village-saint-catherine-hotel | saint-catherine | full-slug-scan |
| wp-page-77042 | double-tree-sharks-bay-resort | cairo | default-cairo |
| wp-page-64075 | dream-lodge-hotel-siwa-oasis | siwa-oasis | full-slug-scan |
| wp-page-83188 | el-beyt-hotel | cairo | default-cairo |
| wp-page-63831 | fairmont-nile-city-hotel-cairo | cairo | full-slug-scan |
| wp-page-63826 | four-seasons-hotel-cairo-first-residence | cairo | full-slug-scan |
| wp-page-63689 | four-seasons-hotel-cairo-nile-plaza | cairo | full-slug-scan |
| wp-page-63598 | four-seasons-resort-sharm-alsheikh | sharm-el-sheikh | full-slug-scan |
| wp-page-63883 | grand-nile-tower-hotel-cairo | cairo | full-slug-scan |
| wp-page-63660 | helnan-palestine-hotel-alexandria | alexandria | full-slug-scan |
| wp-page-63657 | hilton-alexandria-corniche-hotel | alexandria | full-slug-scan |
| wp-page-61923 | hilton-alexandria-green-plaza | alexandria | full-slug-scan |
| wp-page-63552 | hilton-luxor-resort-spa | luxor | full-slug-scan |
| wp-page-72456 | hilton-sharm-sharks-bay | sharm-el-sheikh | full-slug-scan |
| wp-page-63630 | hurghada-marriott-red-sea-resort | hurghada | full-slug-scan |
| wp-page-63623 | hyatt-regency-sharm-el-sheikh | sharm-el-sheikh | full-slug-scan |
| wp-page-63932 | jw-marriott-cairo-hotel | cairo | full-slug-scan |
| wp-page-63871 | kempinski-nile-hotel-cairo | cairo | full-slug-scan |
| wp-page-63635 | kempinski-soma-bay-hurghada | hurghada | full-slug-scan |
| wp-page-63908 | le-meridien-cairo-airport-hotel | cairo | full-slug-scan |
| wp-page-64837 | le-meridien-pyramids-hotel-and-spa | cairo | default-cairo |
| wp-page-63665 | le-passage-cairo-hotel-and-casino | cairo | full-slug-scan |
| wp-page-63581 | maritim-jolie-ville-kings-island-luxor | luxor | full-slug-scan |
| wp-page-86853 | marriott-mena-house-4-days-stay | cairo | default-cairo |
| wp-page-63651 | marriott-mena-house-hotel-cairo | cairo | full-slug-scan |
| wp-page-63589 | meraki-resort-sharm-el-sheikh-adults-only | sharm-el-sheikh | full-slug-scan |
| wp-page-63523 | mercure-luxor-karnak-resort | luxor | full-slug-scan |
| wp-page-63972 | movenpick-resort-aswan | aswan | full-slug-scan |
| wp-page-76997 | movenpick-resort-spa-el-gouna | al-gouna | full-slug-scan |
| wp-page-61925 | novotel-sharm-el-sheikh-hotel | sharm-el-sheikh | full-slug-scan |
| wp-page-63506 | premier-le-reve-hotel-hurghada | hurghada | full-slug-scan |
| wp-page-63673 | pyramids-park-resort-cairo | cairo | full-slug-scan |
| wp-page-64007 | pyramisa-isis-island-hotel | cairo | default-cairo |
| wp-page-63678 | ramses-hilton-cairo-hotel | cairo | full-slug-scan |
| wp-page-62469 | renaissance-sharm-el-sheikh-resort | sharm-el-sheikh | full-slug-scan |
| wp-page-63592 | rixos-premium-magawish-suites-and-villas | cairo | default-cairo |
| wp-page-62450 | rixos-seagate-sharm-hotel | sharm-el-sheikh | full-slug-scan |
| wp-page-63683 | royal-maxim-palace-kempinski-cairo | cairo | full-slug-scan |
| wp-page-131814 | sandrose-hotel-bahariya | bahariya-oasis | full-slug-scan |
| wp-page-63512 | sharm-dreams-resort-sharm-el-sheikh | sharm-el-sheikh | full-slug-scan |
| wp-page-62463 | sharm-el-sheikh-fayrouz-resort | sharm-el-sheikh | full-slug-scan |
| wp-page-63666 | sheraton-montazah-hotel | cairo | default-cairo |
| wp-page-64025 | sofitel-legend-old-cataract | cairo | default-cairo |
| wp-page-63645 | sofitel-pavillon-winter-luxor | luxor | full-slug-scan |
| wp-page-64114 | sol-y-mar-pioneers-hotel-al-kharga-oasis | kharga-oasis | full-slug-scan |
| wp-page-63641 | sonesta-st-george-luxor | luxor | full-slug-scan |
| wp-page-64287 | steigenberger-cecil-hotel-alexandria | alexandria | full-slug-scan |
| wp-page-64598 | steigenberger-nile-palace-luxor-hotel | luxor | full-slug-scan |
| wp-page-131827 | sunrise-montemare-resort | cairo | default-cairo |
| wp-page-63663 | the-four-seasons-hotel-san-stephano | cairo | default-cairo |
| wp-page-84962 | the-nile-ritz-carlton | cairo | default-cairo |
| wp-page-63890 | the-st-regis-cairo | cairo | full-slug-scan |
| wp-page-63628 | the-westin-soma-bay-golf-resort-spa | cairo | default-cairo |
| wp-page-64016 | tolip-aswan-hotel | aswan | full-slug-scan |
| wp-page-63984 | westin-cairo-golf-resort-and-spa | cairo | full-slug-scan |
