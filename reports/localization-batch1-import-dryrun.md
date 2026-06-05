# Phase 3 Batch 1 — ES hotel/cruise IMPORT dry-run + void recheck

**Read-only. No Sanity writes this session.** Script: `scripts/import-es-hotel-cruise-dryrun.mjs`.
Source: `~/Downloads/All 3 langs/es/{hotels,cruises}/` frontmatter `title:`→`name[es]`, `description:`→`summary[es]`.
Field types: `name`=internationalizedArrayString, `summary`=internationalizedArrayText. Plan: set **es key only**,
fill **only where null**, additive (never touch en/ja, never overwrite a non-empty es value).

## Part A — slug-matched, import-ready

| Type | Gaps | Slug-matched (import) | Integrity flags |
|---|---|---|---|
| Hotels | 72 | **50** | 0 |
| Cruises | 48 | **28** | 0 |

**0 integrity flags** = every matched file has both `title` and `description`, and no doc already has a
non-empty es value to collide with. Safe additive import for all 78. Sample (full list via the script):

- `adr-re-amellal-ecolodge-siwa` → name[es] "Adrère Amellal Desert Ecolodge, Siwa: sin electricidad, sin Wi-Fi"
- `dusit-thani-lake-view` → "Dusit Thani LakeView Cairo: lujo tailandés en New Cairo"
- `la-maison-bleue-el-gouna` → "La Maison Bleue El Gouna: Relais & Châteaux solo adultos"
- `amawaterways-amadahlia-nile-cruise` → "AmaWaterways AmaDahlia" + native ES summary
- `la-flaneuse-du-nil-dahabiya` → "La Flâneuse du Nil" + native ES summary

Copy reads as native, re-authored Spanish (not calque). All 78 are slug-exact (after leading-zero/separator
normalization) — no normalized-slug ⚠ flags fired.

## Part B — void recheck by TITLE (the "voids" are mostly remapped-slug matches)

The fuzzy token-overlap is **indicative, not authoritative** — high score ≠ guaranteed same property.
Each candidate below needs a 1-line human confirm before import. **Known false positives called out.**

### Hotels — 22 slug-voids → ~15 real import candidates, 1 genuine void
**Strong (verified-looking) corpus matches under remapped slugs → IMPORT after slug-map confirm:**
sharm-el-sheikh-fayrouz-resort→`fayrouz-resort-sharm-el-sheikh`, renaissance-sharm-el-sheikh-resort→`renaissance-sharm-el-sheikh`,
cairo-marriott-hotel-and-omar-khayyam-casino→`cairo-marriott-hotel-casino`, maritim-jolie-ville-kings-island-luxor→`maritim-jolie-ville-kings-island-hotel`,
the-cascades-soma-bay→file titled "The Cascades Golf Resort…Soma Bay" (corpus *slug* is mislabeled `westin…` but title matches),
hurghada-marriott-red-sea-resort→`hurghada-marriott-resort`, helnan-palestine-hotel-alexandria→`helnan-royal-palestine-hotel-montazah-gardens`,
the-four-seasons-hotel-san-stephano→`the-four-seasons-san-stefano`, royal-maxim-palace-kempinski-cairo→`royal-maxim-palace-kempinski`,
four-seasons-hotel-cairo-nile-plaza→`four-seasons-nile-plaza-hotel`, four-seasons-hotel-cairo-first-residence→`four-seasons-first-residence`,
westin-cairo-golf-resort-and-spa→`westin-cairo-golf-resort-spa`, badawiya-hotel-el-dakhla-oasis→`badawiya-dakhla-hotel`,
sol-y-mar-pioneers-hotel-al-kharga-oasis→`sol-y-mar-pioneers-al-kharga`, the-nile-ritz-carlton→`the-nile-ritz-carlton-hotel`,
cairo-hotel-pyramids→`cairo-pyramids-hotel`, marriott-mena-house-hotel-cairo→`marriott-mena-house-hotel`,
hilton-alexandria-corniche-hotel→`hilton-alexandria-corniche`, steigenberger-nile-palace-luxor-hotel→`steigenberger-nile-palace-hotel`,
movenpick-resort-spa-el-gouna→`m-venpick-resort-spa-el-gouna` (ö→ascii slug quirk).

**⚠ FALSE POSITIVE (do NOT import):** sunrise-montemare-resort→`meraki-resort…` (0.71 on shared "resort/sharm" tokens — different hotel).
**GENUINE VOID (author later):** movenpick-resort-aswan (no real corpus match).

### Cruises — 20 slug-voids → ~12 real candidates, 3 genuine voids
**Strong corpus matches under remapped slugs → IMPORT after confirm:**
swiss-inn-radamis-ii-nile-cruise→`swiss-inn-radamis-ii`, m-s-amwaj-livingstone-nile-cruise→`m-s-amwaj-livingstone`,
sonesta-amirat-dahabiya→`amirat-dahabiya`, nour-el-nil-meroe-dahabiya→`meroe-dahabiya`, movenpick-prince-abbas-cruise→`m-venpick-prince-abbas`,
m-s-steigenberger-omar-el-khayam→`m-s-omar-el-khayam`, m-s-sonesta-st-george-nile-cruise→`m-s-sonesta-st-george`,
movenpick-ms-sun-ray-nile-cruise→`m-venpick-m-s-sun-ray`, m-s-steigenberger-legacy-nile-cruise→`steigenberger-legacy-nile-cruise`,
m-s-alexander-the-great-nile-cruise→`y-s-alexander-the-great`, m-s-sonesta-star-goddess-nile-cruise→`m-s-sonesta-star-goddess`,
m-s-mayfair→`m-s-mayfair-nile-cruise`.

**⚠ FALSE POSITIVES (matcher latched onto generic "dahabiya"/"steigenberger" tokens — do NOT import as-shown):**
- m-s-steigenberger-minerva-nile-cruise → matched `steigenberger-legacy` (Minerva ≠ Legacy; **Minerva likely a true void**)
- movenpick-sb-feddya-dahabiya → matched `eyaru-dahabiya` (wrong)
- adelaide-dahabiya → matched `eyaru-dahabiya` (wrong)
- el-nil-dahabiya → matched `malouka-dahabiya` (wrong; real candidate is `nour-el-nil-el-nil-dahabiya` "Nour El Nil – El Nil")
- nour-el-nil-assouan-dahabiya → matched `nour-el-nil-el-nil-dahabiya` (same-fleet, but Assouan ≠ El Nil — verify which vessel)

**GENUINE VOIDS (author later):** movenpick-ms-hamees-nile-cruise, movenpick-ms-darakum-nile-cruise, movenpick-ms-royal-lotus-nile-cruise
(+ likely m-s-steigenberger-minerva pending confirm).

## Net effect on the author backlog
The slug-only Phase-2 numbers (22 hotel + 20 cruise voids) **overcounted** — most are remapped-slug corpus
matches that should be **imported**, not authored. Revised:

| | Import (slug-exact) | Import (remapped, confirm) | Genuine void (author) |
|---|---|---|---|
| Hotels | 50 | ~15 | ~1 (movenpick-resort-aswan) |
| Cruises | 28 | ~12 | ~3–4 (movenpick hamees/darakum/royal-lotus, ?minerva) |

## Recommended next step
1. **Approve Part A import (78 docs, slug-exact, 0 conflicts)** — safest, no slug ambiguity.
2. Confirm the Part-B remapped-slug list (I'll add the corpus slug→Sanity slug map to the script and
   re-dry-run those specific docs for your sign-off **before** writing).
3. The handful of genuine voids fold into the later authoring batch.

**No writes performed.**
