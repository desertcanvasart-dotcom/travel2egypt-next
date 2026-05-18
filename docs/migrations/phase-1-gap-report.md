# Phase 1 — Global Destination-Pages Gap Audit

**Session 48 · 2026-05-18 · read-only audit (no system changed)**

Scope: the 211 `migrate` URLs in `migration/content/destination-pages-inventory.csv`, audited against the `migration-staging` and `production` Sanity datasets and the Railway Next.js deployment. Inputs: the inventory CSV (old WP URL + category + disposition) and 41 per-destination xlsx files (old→new URL context). The live WordPress site is bot-walled (HTTP 403 + JS challenge on every path); all WP-side facts here come from the xlsx files, per the operator-approved workaround.

---

## 1. Executive summary

The CSV holds **219 rows**: 211 `migrate`, 5 `redirect-to-parent`, 2 `unknown` (Baris/Esna), 1 `note-only` (Giza). The 211 `migrate` rows contain **4 exact duplicates**, leaving **207 unique destination URLs** audited.

| Result | Count | Share of 207 |
|---|---|---|
| Migrated into `migration-staging` | **116** | **56%** |
| Absent from `migration-staging` | **91** | **44%** |
| Present in `production` dataset | 0 | 0% |
| Old flat URL routed on Railway (200/301) | 0 of 212 | 0% |

> ### ⚠ THRESHOLD BREACH — operator strategy decision flagged
>
> The brief set a STOP trigger at *">30% of URLs absent in both Sanity and Railway."* The audit finds **91/207 = 44% absent** from `migration-staging`, and **0 of 212 old URLs routed on Railway**. The 30% line is crossed.
>
> The audit was completed in full rather than halted, because (a) the gap report *is* the artifact needed to make the strategy call, and (b) the bulk of the audit work was already done when the breach became measurable. **No strategy decision has been made — this is surfaced for the operator.** See §8.

**Top-line findings:**

1. **116 of 207 destination pages are already migrated** — every one as a `guideArticle`, every one with full EN/ES/JA locales and substantial EN body (1,144–8,295 characters). Migration quality where it exists is high.
2. **91 of 207 are absent.** 71 of the 91 are individual `attraction` pages (specific monuments/sites — Valley of the Kings, Catacombs of Kom El Shuqafa, Biahmu, etc.). These are **not** in `guideArticle`, `wikiMonument` (134 curated monuments, none matching), `tour`, `city`, or any other content type.
3. **The old→new redirect layer does not exist.** All 212 old flat WP URLs (`travel2egypt.org/<slug>/`) return **HTTP 404** on Railway — including the 116 pages whose content *is* migrated. With slug-normalisation off the table, every one of these needs a 301 to its new `/guide/<city>/<slug>` location, and none is wired yet.
4. **The gap is content, not model.** The `/guide/<city>/<slug>` + `/wiki/monuments/<slug>` architecture is built and working; 116 pages prove the pipeline. What is missing is documents, not schema. See §7.
5. **Baris and Esna are not a discovery gap** — both are already migrated (8 `guideArticle` pages each, plus one `wikiMonument` each). See §4.
6. **The `production` dataset is a stale skeleton** (95 docs total; 0 of 207 destination pages). It is irrelevant to this migration and is not called out per-row below.

**Absent pages by category:**

| Category | Absent | Total | Notes |
|---|---|---|---|
| attraction | 71 | 93 | individual monument/site pages — the core gap |
| tours | 12 | 15 | tour-listing pages; `tour` type exists (235 docs) but not these index pages |
| heritage | 3 | 8 | history/heritage pages missing for Siwa, Sohag, Nuweiba |
| transport-around | 2 | 11 | Dahab, Port Said |
| transport-to | 2 | 12 | Siwa, Sohag |
| accommodation | 1 | 14 | Dakhla (nested-path URL) |

**Absent pages by destination** (destinations with the largest gaps):

| Destination | Migrated | Absent |
|---|---|---|
| Farafra Oasis | 3 | 8 |
| Alexandria | 3 | 7 |
| Siwa Oasis | 1 | 7 |
| Al Minya | 3 | 5 |
| Bahariya Oasis | 1 | 5 |
| Marsa Alam | 6 | 5 |
| Qena | 3 | 5 |
| Dakhla Oasis | 2 | 4 |
| Al Fayoum | 2 | 3 |
| Al Arish | 2 | 3 |
| Al Quseir | 1 | 3 |
| Hurghada | 5 | 3 |
| Kom Ombo | 5 | 3 |
| Luxor | 7 | 3 |
| Nuweiba | 2 | 3 |
| Dahab | 1 | 3 |
| Abu Simbel | 4 | 2 |
| Al Gouna | 4 | 2 |
| Beni Suef | 2 | 2 |
| Port Said | 4 | 2 |
| Sharm El Sheikh | 3 | 2 |
| Sohag | 1 | 2 |
| Aswan | 6 | 1 |
| Asyut | 2 | 1 |
| Edfu | 2 | 1 |
| Giza | 3 | 1 |
| Kharga Oasis | 0 | 1 |
| Rosetta Rasheed | 2 | 1 |
| Saint Catherine | 2 | 1 |
| Suez | 4 | 1 |
| Al Wadi Al Gadid | 1 | 1 |

Destinations with **no** gap (fully migrated): Akhmim, Cairo, Ismailia, Marsa Matruh, Ras Sudr, Safaga, Taba, Wadi Al Natron.

---

## 2. Per-URL gap table

All 207 unique `migrate` URLs, grouped by destination. Columns:

- **migration-staging** — `guideArticle/<doc-id>` if migrated (exact slug match on the EN `slug[].value.current`), else `ABSENT`.
- **EN body** — character count of the EN portable-text body (migrated rows only).
- **Railway** — every old flat URL returns **404** (uniform; see §7), so the per-row Railway-old column is omitted. Where a per-destination xlsx supplied a `Best New URL`, that new URL was curled — **all 97 mapped new URLs returned 200**.

`production` is omitted as a column: **all 207 are absent from `production`.**

### Abu Simbel

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `how-to-go-in-abu-simbel` | transport-to | guideArticle/wp-page-57810 | 2586ch |
| `only-in-abu-simbel` | signature | guideArticle/wp-page-57843 | 2764ch |
| `qasr-ibrim` | attraction | **ABSENT** | - |
| `the-small-temple-of-abu-simbel` | attraction | guideArticle/wp-page-57871 | 2669ch |
| `top-hotels-in-abu-simbel` | accommodation | guideArticle/wp-page-57815 | 5718ch |
| `top-tours-in-abu-simbel` | tours | **ABSENT** | - |

### Akhmim

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `only-in-akhmim` | signature | guideArticle/wp-page-58415 | 2246ch |
| `unique-sites-in-akhmim` | attraction | guideArticle/wp-page-72890 | 2423ch |

### Al Arish

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `bardawil-lake` | attraction | **ABSENT** | - |
| `only-in-al-arish` | signature | guideArticle/wp-page-58615 | 1545ch |
| `the-ancient-city-of-pelusium` | attraction | **ABSENT** | - |
| `the-fortress-of-al-arish` | attraction | guideArticle/wp-page-58608 | 2924ch |
| `the-protected-area-of-zaranik` | attraction | **ABSENT** | - |

### Al Fayoum

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `al-fayoum-waterwheels` | attraction | guideArticle/wp-page-61666 | 3056ch |
| `biahmu` | attraction | **ABSENT** | - |
| `kom-ushim-karanis` | attraction | **ABSENT** | - |
| `medinet-madi` | attraction | **ABSENT** | - |
| `only-here-in-al-fayoum` | signature | guideArticle/wp-page-58544 | 1740ch |

### Al Gouna

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `al-gouna-festivals-and-celebrations` | events | guideArticle/wp-page-58799 | 1554ch |
| `al-gouna-travel-guide/mangroovy-beach` | attraction | **ABSENT** | - |
| `how-to-reach-al-gouna` | transport-to | guideArticle/wp-page-58801 | 1144ch |
| `only-in-al-gouna` | signature | guideArticle/wp-page-58738 | 1339ch |
| `traditional-food-in-al-gouna` | food | guideArticle/wp-page-58803 | 2190ch |
| `zeytouna-beach` | attraction | **ABSENT** | - |

### Al Minya

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `beni-hassan` | attraction | **ABSENT** | - |
| `el-ashmunein` | attraction | **ABSENT** | - |
| `getting-around-in-al-minya` | transport-around | guideArticle/wp-page-58645 | 2264ch |
| `only-here-in-al-minya` | signature | guideArticle/wp-page-58655 | 3264ch |
| `tal-el-amarna` | attraction | **ABSENT** | - |
| `tihna-el-gebel` | attraction | **ABSENT** | - |
| `top-restaurants-in-al-minya` | food | guideArticle/wp-page-58652 | 2091ch |
| `tuna-el-gebel` | attraction | **ABSENT** | - |

### Al Quseir

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `biahmu` | attraction | **ABSENT** | - |
| `bir-umm-fawakhir` | attraction | **ABSENT** | - |
| `only-here-in-al-quseir` | signature | guideArticle/wp-page-58704 | 2602ch |
| `the-port-of-myos-hormos` | attraction | **ABSENT** | - |

### Al Wadi Al Gadid

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `how-to-go-in-al-wadi-al-gadid` | transport-to | guideArticle/wp-page-58735 | 1922ch |
| `top-tours-in-al-wadi-al-gadid` | tours | **ABSENT** | - |

### Alexandria

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `catacombs-of-kom-el-shuqafa` | attraction | **ABSENT** | - |
| `getting-to-alexandria` | transport-to | guideArticle/wp-page-59169 | 2440ch |
| `how-to-get-around-alexandria` | transport-around | guideArticle/wp-page-59170 | 2319ch |
| `necropolis-of-anfushi` | attraction | **ABSENT** | - |
| `only-here-in-alexandria` | signature | guideArticle/wp-page-59172 | 3626ch |
| `pompeys-pillar` | attraction | **ABSENT** | - |
| `qaitbey-fort` | attraction | **ABSENT** | - |
| `the-pharos-lighthouse` | attraction | **ABSENT** | - |
| `the-roman-amphitheater` | attraction | **ABSENT** | - |
| `the-royal-palaces` | attraction | **ABSENT** | - |

### Aswan

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `aswan-festivals-and-celebrations` | events | guideArticle/wp-page-59225 | 2246ch |
| `aswan-high-dam` | attraction | guideArticle/wp-page-59236 | 2492ch |
| `aswan-local-market` | attraction | guideArticle/wp-page-59253 | 2372ch |
| `how-to-reach-aswan` | transport-to | guideArticle/wp-page-59212 | 3681ch |
| `the-botanical-garden` | attraction | **ABSENT** | - |
| `tombs-of-the-nobles-in-aswan` | attraction | guideArticle/wp-page-59229 | 2604ch |
| `traditional-food-in-aswan` | food | guideArticle/wp-page-59209 | 2391ch |

### Asyut

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `convent-of-the-holy-virgin-at-dorunka` | attraction | **ABSENT** | - |
| `only-here-in-asyut` | signature | guideArticle/wp-page-59262 | 2745ch |
| `what-to-eat-in-asyut` | food | guideArticle/wp-page-59258 | 2894ch |

### Bahariya Oasis

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `al-qasr-village` | attraction | **ABSENT** | - |
| `bawiti` | attraction | **ABSENT** | - |
| `el-hayz` | attraction | **ABSENT** | - |
| `only-here-in-bahariya-oasis` | signature | guideArticle/wp-page-59288 | 3179ch |
| `the-crystal-mountain` | attraction | **ABSENT** | - |
| `valley-of-the-golden-mummies` | attraction | **ABSENT** | - |

### Beni Suef

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `dishasha` | attraction | **ABSENT** | - |
| `ehnasya-el-medina` | attraction | **ABSENT** | - |
| `how-to-reach-beni-suef` | transport-to | guideArticle/wp-page-59347 | 1766ch |
| `only-here-in-beni-suef` | signature | guideArticle/wp-page-59348 | 1847ch |

### Cairo

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `only-here-in-cairo` | signature | guideArticle/wp-page-59391 | 3877ch |

### Dahab

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `abu-galum-protectorate` | attraction | **ABSENT** | - |
| `experiences-in-dahab` | overview | guideArticle/wp-page-59427 | 8295ch |
| `planning-your-trip-to-dahab` | transport-around | **ABSENT** | - |
| `private-tours-in-dahab` | tours | **ABSENT** | - |

### Dakhla Oasis

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `al-mezauwaqa` | attraction | **ABSENT** | - |
| `dakhla-oasis/deir-el-hagar` | attraction | **ABSENT** | - |
| `egypt-travel-guide/dakhla-oasis/food-2` | attraction | **ABSENT** | - |
| `egypt-travel-guide/dakhla-oasis/where-to-stay` | accommodation | **ABSENT** | - |
| `only-here-in-dakhla-oasis` | signature | guideArticle/wp-page-59496 | 3162ch |
| `weather-in-dakhla-oasis` | climate | guideArticle/wp-page-94706 | 3671ch |

### Edfu

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `edfu-food-and-drink` | food | guideArticle/wp-page-59590 | 2478ch |
| `popular-tours-in-edfu` | tours | **ABSENT** | - |
| `what-to-do-in-edfu` | tours | guideArticle/wp-page-59588 | 2316ch |

### Farafra Oasis

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `accommodations-in-farafra` | accommodation | guideArticle/wp-page-59636 | 5319ch |
| `crystal-mountain-and-agabat` | attraction | **ABSENT** | - |
| `el-qaf` | attraction | **ABSENT** | - |
| `ghard-abu-muharrik-and-the-sand-volcano` | attraction | **ABSENT** | - |
| `off-road-from-farafra-to-dakhla` | attraction | **ABSENT** | - |
| `palm-groves` | attraction | **ABSENT** | - |
| `qasr-al-farafra` | attraction | guideArticle/wp-page-59654 | 2013ch |
| `road-to-dakhla` | attraction | guideArticle/wp-page-59655 | 2167ch |
| `the-hidden-valley-and-the-new-white-desert` | attraction | **ABSENT** | - |
| `the-white-desert` | attraction | **ABSENT** | - |
| `white-desert-national-park` | attraction | **ABSENT** | - |

### Giza

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `navigating-giza` | transport-around | guideArticle/wp-page-60075 | 3249ch |
| `only-in-giza` | signature | guideArticle/wp-page-60081 | 2374ch |
| `top-hotels-in-giza` | accommodation | guideArticle/wp-page-60072 | 5509ch |
| `top-tours-in-giza` | tours | **ABSENT** | - |

### Hurghada

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `abu-nuhas-shipwreck-sites` | attraction | **ABSENT** | - |
| `giftun-islands` | attraction | **ABSENT** | - |
| `hurghada-aquarium` | attraction | guideArticle/wp-page-59711 | 2026ch |
| `hurghada-marina` | attraction | guideArticle/wp-page-59712 | 1918ch |
| `public-transport-in-hurghada` | transport-around | guideArticle/wp-page-59698 | 1914ch |
| `straits-of-gubal` | attraction | **ABSENT** | - |
| `what-to-eat-in-hurghada` | food | guideArticle/wp-page-59706 | 3024ch |
| `where-to-sleep-in-hurghada` | accommodation | guideArticle/wp-page-59695 | 5020ch |

### Ismailia

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `accommodation-options-ismailia` | accommodation | guideArticle/wp-page-60122 | 4530ch |
| `ismailia-flavors` | food | guideArticle/wp-page-60130 | 4569ch |
| `navigating-ismailia` | transport-around | guideArticle/wp-page-60123 | 1629ch |
| `only-here-in-ismailia` | signature | guideArticle/wp-page-60133 | 3716ch |

### Kharga Oasis

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `top-tours-in-kharga-oasis` | tours | **ABSENT** | - |

### Kom Ombo

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `annual-events-in-kom-ombo` | events | guideArticle/wp-page-78375 | 6797ch |
| `explore-kom-ombo-activities` | tours | **ABSENT** | - |
| `gebel-el-silsila` | attraction | **ABSENT** | - |
| `kom-ombo-unforgettable-moments` | attraction | guideArticle/wp-page-60631 | 2540ch |
| `public-transport-in-kom-ombo` | transport-around | guideArticle/wp-page-78784 | 2912ch |
| `the-speos-of-horemheb` | attraction | **ABSENT** | - |
| `what-to-eat-in-kom-ombo` | food | guideArticle/wp-page-78380 | 2875ch |
| `where-to-sleep-in-kom-ombo` | accommodation | guideArticle/wp-page-78376 | 3738ch |

### Luxor

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `cultural-events-in-luxor` | events | guideArticle/wp-page-60661 | 1852ch |
| `deir-el-madina` | attraction | **ABSENT** | - |
| `luxor-ancient-past` | heritage | guideArticle/wp-page-60643 | 2792ch |
| `luxor-climate` | climate | guideArticle/wp-page-60647 | 2240ch |
| `luxor-off-the-beaten-path` | heritage | guideArticle/wp-page-60658 | 2312ch |
| `the-valley-of-the-kings` | attraction | **ABSENT** | - |
| `the-valley-of-the-queens` | attraction | **ABSENT** | - |
| `top-restaurants-in-luxor` | food | guideArticle/wp-page-60657 | 4658ch |
| `travel-to-luxor` | transport-to | guideArticle/wp-page-60644 | 2855ch |
| `what-to-do-in-luxor` | tours | guideArticle/wp-page-60648 | 2159ch |

### Marsa Alam

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `abu-dabbab-beach` | attraction | **ABSENT** | - |
| `hamata-islands-qulaan-archipelago` | attraction | **ABSENT** | - |
| `marsa-alam-flavors` | food | guideArticle/wp-page-78403 | 2419ch |
| `only-in-marsa-alam` | signature | guideArticle/wp-page-60706 | 3369ch |
| `port-ghalib-marina` | attraction | **ABSENT** | - |
| `sataya-reef` | attraction | **ABSENT** | - |
| `sharm-el-luli` | attraction | guideArticle/wp-page-146102 | 4428ch |
| `the-camel-market-at-shalateen` | attraction | **ABSENT** | - |
| `the-town-of-marsa-alam` | attraction | guideArticle/wp-page-60695 | 2258ch |
| `wadi-el-gamal-national-park` | attraction | guideArticle/wp-page-60689 | 1916ch |
| `when-to-go-marsa-alam` | climate | guideArticle/wp-page-78394 | 3238ch |

### Marsa Matruh

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `marsa-matruh-events` | events | guideArticle/wp-page-60238 | 1859ch |
| `places-to-go-in-marsa-matruh` | overview | guideArticle/wp-page-77873 | 2184ch |

### Nuweiba

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `nuweiba-hotel-guide` | accommodation | guideArticle/wp-page-60299 | 4920ch |
| `only-in-nuweiba` | signature | guideArticle/wp-page-60304 | 1779ch |
| `the-tarabin-beach` | attraction | **ABSENT** | - |
| `tours-in-nuweiba` | tours | **ABSENT** | - |
| `uncovering-nuweiba-heritage` | heritage | **ABSENT** | - |

### Port Said

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `lodging-in-port-said` | accommodation | guideArticle/wp-page-60349 | 4792ch |
| `planning-your-trip-to-port-said` | transport-around | **ABSENT** | - |
| `port-said-food-and-drink` | food | guideArticle/wp-page-60353 | 2159ch |
| `suez-canal-house` | attraction | guideArticle/wp-page-76463 | 1953ch |
| `tours-to-enjoy-in-port-said` | tours | **ABSENT** | - |
| `waterfront-quarter-port-said` | attraction | guideArticle/wp-page-76458 | 2515ch |

### Qena

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `hathor-and-bes` | attraction | **ABSENT** | - |
| `hypostyle-ceiling` | attraction | **ABSENT** | - |
| `navigating-qena` | transport-around | guideArticle/wp-page-60324 | 2307ch |
| `only-in-qena` | signature | guideArticle/wp-page-60340 | 3337ch |
| `roman-mammisi` | attraction | **ABSENT** | - |
| `sacred-lake` | attraction | **ABSENT** | - |
| `the-roof-chapels-of-hathor` | attraction | **ABSENT** | - |
| `upcoming-events-in-qena` | events | guideArticle/wp-page-76533 | 2151ch |

### Ras Sudr

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `explore-ras-sudr-tours` | tours | guideArticle/wp-page-60386 | 2328ch |
| `only-in-ras-sudr` | signature | guideArticle/wp-page-60388 | 1838ch |
| `places-to-stay-in-ras-sudr` | accommodation | guideArticle/wp-page-60382 | 5571ch |
| `places-to-visit-in-ras-sudr` | overview | guideArticle/wp-page-76469 | 2615ch |
| `ras-sudr-ancient-past` | heritage | guideArticle/wp-page-60370 | 2609ch |
| `ras-sudr-climate` | climate | guideArticle/wp-page-60380 | 2824ch |
| `ras-sudr-local-transport-guide` | transport-around | guideArticle/wp-page-60383 | 2269ch |
| `top-restaurants-in-ras-sudr` | food | guideArticle/wp-page-75745 | 2916ch |
| `travel-to-ras-sudr` | transport-to | guideArticle/wp-page-60381 | 1968ch |

### Rosetta Rasheed

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `only-in-rosetta` | signature | guideArticle/wp-page-60426 | 2157ch |
| `outstanding-islamic-and-ottoman-places-in-rosetta` | attraction | **ABSENT** | - |
| `taste-of-rosetta` | food | guideArticle/wp-page-60425 | 2182ch |

### Safaga

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `only-in-safaga` | signature | guideArticle/wp-page-60445 | 3464ch |

### Saint Catherine

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `moses-mountain` | attraction | **ABSENT** | - |
| `only-in-saint-catherine` | signature | guideArticle/wp-page-60464 | 2145ch |
| `saint-catherine-mountain` | attraction | guideArticle/wp-page-60744 | 2254ch |

### Sharm El Sheikh

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `accommodations-in-sharm-el-sheikh` | accommodation | guideArticle/wp-page-60485 | 4978ch |
| `naama-bay-sharm-el-sheikh-guide` | attraction | guideArticle/wp-page-60771 | 4522ch |
| `nabq-national-park` | attraction | guideArticle/wp-page-60770 | 2169ch |
| `ras-mohamed-national-park` | attraction | **ABSENT** | - |
| `top-tours-in-sharm-el-sheikh` | tours | **ABSENT** | - |

### Siwa Oasis

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `cleopatra-pool` | attraction | **ABSENT** | - |
| `dakrour-mountain` | attraction | **ABSENT** | - |
| `mountain-of-the-dead` | attraction | **ABSENT** | - |
| `reaching-siwa-egypt` | transport-to | **ABSENT** | - |
| `salt-lakes` | attraction | **ABSENT** | - |
| `siwa-hotel-guide` | accommodation | guideArticle/wp-page-60508 | 5460ch |
| `tours-in-siwa` | tours | **ABSENT** | - |
| `uncovering-siwa-heritage` | heritage | **ABSENT** | - |

### Sohag

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `reaching-sohag-egypt` | transport-to | **ABSENT** | - |
| `sohag-hotel-guide` | accommodation | guideArticle/wp-page-60535 | 2585ch |
| `uncovering-sohag-heritage` | heritage | **ABSENT** | - |

### Suez

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `cultural-tours-in-suez` | tours | **ABSENT** | - |
| `eating-out-in-suez` | food | guideArticle/wp-page-60563 | 1641ch |
| `story-of-suez` | heritage | guideArticle/wp-page-60551 | 3079ch |
| `suez-temperature-trends` | climate | guideArticle/wp-page-60557 | 3055ch |
| `ways-to-get-to-suez` | transport-to | guideArticle/wp-page-60558 | 3111ch |

### Taba

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `best-places-to-stay-taba` | accommodation | guideArticle/wp-page-60581 | 2840ch |
| `eating-out-in-taba` | food | guideArticle/wp-page-60585 | 1816ch |
| `only-in-taba` | signature | guideArticle/wp-page-60586 | 3830ch |
| `story-of-taba` | heritage | guideArticle/wp-page-60577 | 3011ch |
| `taba-heights` | attraction | guideArticle/wp-page-78152 | 1887ch |
| `taba-temperature-trends` | climate | guideArticle/wp-page-60579 | 2947ch |
| `ways-to-get-to-taba` | transport-to | guideArticle/wp-page-60582 | 2758ch |

### Wadi Al Natron

| slug_path | category | migration-staging | EN body |
|---|---|---|---|
| `how-to-get-around-wadi-el-natrun` | transport-around | guideArticle/wp-page-60600 | 2340ch |
| `only-in-wadi-al-natron` | signature | guideArticle/wp-page-60604 | 2245ch |
| `where-to-eat-in-wadi-el-natrun` | attraction | guideArticle/wp-page-60603 | 2749ch |

---
## 3. Redirect-to-parent verification

The CSV marks 5 URLs `redirect-to-parent`. All 4 distinct parent targets exist in `migration-staging` — each as a **`city`** document (not `guideArticle`):

| Parent (CSV `redirect_target`) | Resolves to | Doc type | Doc ID |
|---|---|---|---|
| `/nuweiba-travel-guide/` | `nuweiba` | city | `wp-page-58892` |
| `/safaga-travel-guide/` | `safaga` | city | `wp-page-58920` |
| `/sharm-el-sheikh-travel-guide/` | `sharm-el-sheikh` | city | `wp-page-58927` |
| `/taba-travel-guide/` | `taba` | city | `wp-page-58939` |

No blockers: every redirect parent exists. The `<city>-travel-guide` literal slug is **not** itself a document — the parent is the bare-city `city` doc, new URL `/guide/<city>`.

**⚠ Conflict to resolve — 4 of the 5 children are already migrated as standalone pages.** The operator marked these 5 child URLs for redirection *into* the parent, but checking them against the 431 `guideArticle` slugs shows the content already exists as its own page:

| Child URL (CSV) | Disposition | Already a `guideArticle`? |
|---|---|---|
| `cultural-events-in-nuweiba` | redirect-to-parent | **Yes** — slug exists |
| `places-to-go-in-safaga` | redirect-to-parent | **Yes** — slug exists |
| `annual-events-in-safaga` | redirect-to-parent | **Yes** — slug exists |
| `only-in-sharm-el-sheikh` | redirect-to-parent | **Yes** — slug exists |
| `cultural-tours-in-taba` | redirect-to-parent | No |

Decision needed (Phase 2/4): for the 4 that exist, either (a) honour the redirect-to-parent decision and retire the standalone `guideArticle`, or (b) keep the standalone page and drop the redirect. The audit does not change anything — flagging only.

---

## 4. Baris and Esna discoveries

The CSV lists Baris and Esna with disposition `unknown` ("no URLs listed"). Discovery via the `Baris Destination Links.xlsx` (10 rows) and `Esna Destination Links.xlsx` (15 rows) — the WP-recon substitute — plus a Sanity cross-check resolves both:

**Neither is a gap. Both are already migrated.** Baris and Esna each have a full 8-page `guideArticle` set in `migration-staging`, plus one `wikiMonument`. Discovered scope is **18 pages total** (9 per destination) — far under the 40-URL STOP threshold.

### Baris — 9 new-site pages

| New-site URL (xlsx) | last segment | category | in `migration-staging`? |
|---|---|---|---|
| `guide/baris/history-of-baris` | `history-of-baris` | destination-overview | Yes — `guideArticle` |
| `guide/baris/weather-in-baris` | `weather-in-baris` | destination-overview | Yes — `guideArticle` |
| `guide/baris/how-to-get-to-baris` | `how-to-get-to-baris` | destination-overview | Yes — `guideArticle` |
| `guide/baris/where-to-stay-in-baris` | `where-to-stay-in-baris` | destination-overview | Yes — `guideArticle` |
| `guide/baris/food-in-baris` | `food-in-baris` | destination-overview | Yes — `guideArticle` |
| `guide/baris/getting-around-in-baris` | `getting-around-in-baris` | destination-overview | Yes — `guideArticle` |
| `guide/baris/things-to-do-in-baris` | `things-to-do-in-baris` | destination-overview | Yes — `guideArticle` |
| `wiki/monuments/the-roman-fortress-at-dush` | `the-roman-fortress-at-dush` | attraction | Yes — `wikiMonument` |
| `guide/baris/baris-tours` | `baris-tours` | destination-overview | Yes — `guideArticle` |

### Esna — 9 new-site pages

| New-site URL (xlsx) | last segment | category | in `migration-staging`? |
|---|---|---|---|
| `guide/esna/history-of-esna` | `history-of-esna` | destination-overview | Yes — `guideArticle` |
| `guide/esna/esna-weather` | `esna-weather` | destination-overview | Yes — `guideArticle` |
| `guide/esna/where-to-stay-in-esna` | `where-to-stay-in-esna` | destination-overview | Yes — `guideArticle` |
| `guide/esna/how-to-go-to-esna` | `how-to-go-to-esna` | destination-overview | Yes — `guideArticle` |
| `guide/esna/things-to-do-in-esna` | `things-to-do-in-esna` | destination-overview | Yes — `guideArticle` |
| `guide/esna/food-in-esna` | `food-in-esna` | destination-overview | Yes — `guideArticle` |
| `guide/esna/getting-around-in-esna` | `getting-around-in-esna` | destination-overview | Yes — `guideArticle` |
| `wiki/monuments/the-temple-of-khnum-at-esna` | `the-temple-of-khnum-at-esna` | attraction | Yes — `wikiMonument` |
| `guide/esna/tours-in-esna` | `tours-in-esna` | destination-overview | Yes — `guideArticle` |

Draft inventory rows (CSV shape) for Baris/Esna are therefore informational only — the content exists. The original WP URLs in the xlsx `Original URL` column are internally inconsistent (Esna rows reference Alexandria/Al-Fayoum/Kom-Ombo URLs — operator-side data-entry noise), so they are not promoted into the redirect map without operator confirmation.

**Operator review gate (Audit C):** the discovered set is 18 already-migrated pages. Recommendation: mark Baris and Esna `done` rather than adding 18 URLs to the migration backlog. Confirm before Phase 4 scoping.

---

## 5. Slug-variant inventory by category

Reference data for Phase 2 — characterising the slug-space. **Not a normalisation proposal**; per the operator constraint, all 10+ years of existing slugs are preserved verbatim. Each pattern shows the destination token as `X`.

### attraction — 93 URLs across 28 destinations

No shared pattern — each slug is a proper-noun place name (`the-valley-of-the-kings`, `biahmu`, `catacombs-of-kom-el-shuqafa`, `pompeys-pillar` …). 3 URLs carry a nested old path (`al-gouna-travel-guide/mangroovy-beach`, `dakhla-oasis/deir-el-hagar`, `egypt-travel-guide/dakhla-oasis/food-2`). This category is the migration's long tail and its largest gap.

### signature — 24 URLs across 24 destinations

**2 distinct slug patterns:**

- `only-in-X` — Abu Simbel, Akhmim, Al Arish, Al Gouna, Giza, Marsa Alam, Nuweiba, Qena, Ras Sudr, Rosetta Rasheed, Safaga, Saint Catherine, Taba, Wadi Al Natron
- `only-here-in-X` — Al Fayoum, Al Minya, Al Quseir, Alexandria, Asyut, Bahariya Oasis, Beni Suef, Cairo, Dakhla Oasis, Ismailia

### tours — 15 URLs across 14 destinations

**9 distinct slug patterns:**

- `top-tours-in-X` — Abu Simbel, Al Wadi Al Gadid, Giza, Kharga Oasis, Sharm El Sheikh
- `what-to-do-in-X` — Edfu, Luxor
- `tours-in-X` — Nuweiba, Siwa Oasis
- `popular-tours-in-X` — Edfu
- `explore-X-activities` — Kom Ombo
- `tours-to-enjoy-in-X` — Port Said
- `explore-X-tours` — Ras Sudr
- `cultural-tours-in-X` — Suez
- `private-tours-in-X` — Dahab

### food — 15 URLs across 15 destinations

**8 distinct slug patterns:**

- `top-restaurants-in-X` — Al Minya, Luxor, Ras Sudr
- `what-to-eat-in-X` — Asyut, Hurghada, Kom Ombo
- `X-food-and-drink` — Edfu, Port Said
- `X-flavors` — Ismailia, Marsa Alam
- `eating-out-in-X` — Suez, Taba
- `traditionX-food-in-X` — Al Gouna
- `traditional-food-in-X` — Aswan
- `taste-of-X` — Rosetta Rasheed

### accommodation — 14 URLs across 14 destinations

**9 distinct slug patterns:**

- `X-hotel-guide` — Nuweiba, Siwa Oasis, Sohag
- `top-hotels-in-X` — Abu Simbel, Giza
- `accommodations-in-X` — Farafra Oasis, Sharm El Sheikh
- `where-to-sleep-in-X` — Hurghada, Kom Ombo
- `egypt-travel-guide/X/where-to-stay` — Dakhla Oasis
- `accommodation-options-X` — Ismailia
- `lodging-in-X` — Port Said
- `places-to-stay-in-X` — Ras Sudr
- `best-places-to-stay-X` — Taba

### transport-to — 12 URLs across 12 destinations

**6 distinct slug patterns:**

- `how-to-reach-X` — Al Gouna, Aswan, Beni Suef
- `how-to-go-in-X` — Abu Simbel, Al Wadi Al Gadid
- `travel-to-X` — Luxor, Ras Sudr
- `reaching-X-egypt` — Siwa Oasis, Sohag
- `ways-to-get-to-X` — Suez, Taba
- `getting-to-X` — Alexandria

### transport-around — 11 URLs across 11 destinations

**7 distinct slug patterns:**

- `navigating-X` — Giza, Ismailia, Qena
- `public-transport-in-X` — Hurghada, Kom Ombo
- `planning-your-trip-to-X` — Dahab, Port Said
- `getting-around-in-X` — Al Minya
- `how-to-get-around-X-el-natrun` — Wadi Al Natron
- `how-to-get-around-X` — Alexandria
- `X-local-transport-guide` — Ras Sudr

### heritage — 8 URLs across 7 destinations

**4 distinct slug patterns:**

- `uncovering-X-heritage` — Nuweiba, Siwa Oasis, Sohag
- `X-ancient-past` — Luxor, Ras Sudr
- `story-of-X` — Suez, Taba
- `X-off-the-beaten-path` — Luxor

### events — 6 URLs across 6 destinations

**6 distinct slug patterns:**

- `X-festivXs-and-celebrations` — Al Gouna
- `X-festivals-and-celebrations` — Aswan
- `annual-events-in-X` — Kom Ombo
- `cultural-events-in-X` — Luxor
- `X-events` — Marsa Matruh
- `upcoming-events-in-X` — Qena

### climate — 6 URLs across 6 destinations

**4 distinct slug patterns:**

- `X-climate` — Luxor, Ras Sudr
- `X-temperature-trends` — Suez, Taba
- `weather-in-X` — Dakhla Oasis
- `when-to-go-X` — Marsa Alam

### overview — 3 URLs across 3 destinations

**3 distinct slug patterns:**

- `places-to-go-in-X` — Marsa Matruh
- `places-to-visit-in-X` — Ras Sudr
- `experiences-in-X` — Dahab

**Phase 2 takeaway:** outside `attraction`, every category uses 3–8 competing slug patterns for the same content type (e.g. `accommodation` alone: `top-hotels-in-X`, `where-to-sleep-in-X`, `accommodations-in-X`, `X-hotel-guide`, `lodging-in-X`, `places-to-stay-in-X`, `best-places-to-stay-X`, `accommodation-options-X`). The new `guideArticle` model already stores a free-form slug per document, so it absorbs this variance with no schema work — but any per-category templating or nav-generation logic in Phase 2 must not assume a predictable slug.

---

## 6. Anomaly resolutions

### 6.1 Relative-path URLs (5)

Five CSV rows carry `is_relative` and a path-only `url` (no host). Canonical URL = prepend `https://travel2egypt.org`. No WP fetch needed — the rows are simply missing the domain. Resolved:

| Destination | Relative path | Canonical URL | migration-staging |
|---|---|---|---|
| Dakhla Oasis | `/weather-in-dakhla-oasis/` | `https://travel2egypt.org/weather-in-dakhla-oasis/` | FOUND `wp-page-94706` |
| Dakhla Oasis | `/dakhla-oasis/deir-el-hagar/` | `https://travel2egypt.org/dakhla-oasis/deir-el-hagar/` | **ABSENT** |
| Dakhla Oasis | `/only-here-in-dakhla-oasis/` | `https://travel2egypt.org/only-here-in-dakhla-oasis/` | FOUND `wp-page-59496` — **also an exact duplicate**, see 6.3 |
| Nuweiba | `/tours-in-nuweiba/` | `https://travel2egypt.org/tours-in-nuweiba/` | **ABSENT** |
| Rosetta Rasheed | `/outstanding-islamic-and-ottoman-places-in-rosetta/` | `https://travel2egypt.org/outstanding-islamic-and-ottoman-places-in-rosetta/` | **ABSENT** |

### 6.2 The `biahmu` cross-reference

`biahmu` appears twice in the CSV — once under **Al Fayoum** (row 14) and once under **Al Quseir** (row 32), same slug, same implied WP URL `travel2egypt.org/biahmu/`. The per-destination xlsx files settle it: `biahmu` appears **only** in `Al Fayoum Destination Links.xlsx` (`al-fayoum-travel-guide/biahmu/`) and **not** in the Al Quseir xlsx. Biahmu (the Colossi of Biahmu) is geographically a Fayoum site.

**Resolution: canonical destination = Al Fayoum.** The Al Quseir `biahmu` row is a misclassification and should be dropped from Al Quseir's scope. Both rows are `ABSENT` from `migration-staging` regardless, so the gap count is unaffected; the unique-URL count drops from 207 to **206** once the misfiled row is removed.

### 6.3 Internal duplicates — 4 found (brief expected 3)

The 211 `migrate` rows contain **4** exact `(destination, slug_path)` duplicates, not 3:

| Destination | Duplicated slug | CSV rows |
|---|---|---|
| Wadi Al Natron | `how-to-get-around-wadi-el-natrun` | 33 & 36 |
| Aswan | `tombs-of-the-nobles-in-aswan` | 55 & 60 |
| Qena | `the-roof-chapels-of-hathor` | 163 & 164 |
| Dakhla Oasis | `only-here-in-dakhla-oasis` | 79 & 81 |

The brief named the first three. **The fourth (Dakhla Oasis) is new** — it was missed because its two rows differ in URL *form*: row 79 is the relative `/only-here-in-dakhla-oasis/` (see 6.1) and row 81 is the absolute `https://travel2egypt.org/only-here-in-dakhla-oasis/`. Same page. After deduplication: **211 → 207 unique** (→ 206 once the misfiled `biahmu`, 6.2, is also removed).

### 6.4 Giza `note-only` row

Per Decision 3, the Giza `note-only` row is excluded from the URL audit and surfaced here:

> **Operator flagged Giza as needing 2 additional redirects — specific URLs not yet identified. Follow-up needed before Phase 4 Giza work.** The CSV note reads *"2 other pages need redirect"* with no URLs attached. Giza currently has 4 migrate URLs (3 migrated, 1 absent: `top-tours-in-giza`); the 2 unspecified redirect pages are additional and must be identified from the Giza source material before Giza's redirect map is built.

### 6.5 xlsx status vs. observed state

Audit step A.5 asked whether the operator-reported xlsx `Status` (`Likely present` / `Check / missing`) matches reality. It cannot be compared row-for-row: the xlsx is organised around the **new** site's navigation, and its `Original URL` column is a loose "closest old equivalent" rather than a clean key to the CSV's old URLs (only 97 of 207 CSV rows match an xlsx row by old-URL slug). The xlsx `Status` is therefore treated as advisory context, not a row-level signal. The authoritative migrated/absent verdict in this report is the Sanity match.

---

## 7. New-URL architecture summary

Phase 1 confirmed the new site's URL architecture is **operator-built and already in place** — Phase 2 designs against it as ground truth, not from scratch.

**Routing observed (Railway, `travel2egypt-next-production.up.railway.app`):**

| New URL pattern | Backing Sanity type | Count in `migration-staging` |
|---|---|---|
| `/guide/<city>/<slug>` | `guideArticle` | 431 |
| `/wiki/monuments/<slug>` | `wikiMonument` | 134 |
| `/guide/<city>` (destination hub) | `city` | 42 |

- `guideArticle` carries a **free-form EN slug** plus ES/JA slugs (field-level i18n, `slug[]` internationalised array). The city segment of the URL is the `city` doc's slug.
- `wikiMonument` is a **curated set of 134 monuments** (Aswan temples, Cairo Islamic monuments, museums, select necropoleis). It does **not** currently cover the destination `attraction` pages in the CSV — see §8.
- All 97 xlsx-mapped new URLs that were curled returned **HTTP 200**: where the new architecture has content, it serves correctly.

**The redirect layer is absent.** All **212** old flat WP URLs (`travel2egypt.org/<slug>/`, curled verbatim on Railway) return **HTTP 404** — including the 116 whose content is fully migrated. There is no 301 from any old URL to its new `/guide/<city>/<slug>` location. With slug normalisation off the table (operator constraint — 10+ years of SEO equity), **every** old destination URL needs an explicit 301 to its new home, and currently none exists. This is the single largest Phase 4 workstream by item count.

**Old WP structure, for context:** the xlsx files show the old WP site nested destination content under `<city>-travel-guide/<sub-page>` hubs (e.g. `cairo-travel-guide/history-chronicles`) *in addition to* the flat standalone pages the CSV inventories (e.g. `only-here-in-cairo`). The new site collapses both into `/guide/<city>/<slug>`. The CSV's 211 URLs are the flat-page set; the xlsx's 666 rows are the hub-structure set. They overlap only partially — a fact Phase 2 should keep in view when reconciling the full redirect map.

---

## 8. Phase 2 input recommendations

### 8.1 Content-model implications

**The gap is content, not model.** The `guideArticle` / `wikiMonument` / `city` model already carries 116 migrated destination pages cleanly, each with full EN/ES/JA locales. Phase 2 does **not** need a new content type for destination pages. Two model-level questions do need a decision:

1. **Where do `attraction` pages live?** The 71 absent attractions are individual sites (Valley of the Kings, Catacombs of Kom El Shuqafa, Biahmu …). `wikiMonument` is the natural home, but today it is a *curated* 134-doc set that deliberately excludes them. Phase 2 must decide: (a) expand `wikiMonument` to hold every destination attraction, or (b) migrate attractions as `guideArticle` under `/guide/<city>/<slug>`. This is the single biggest Phase 2 modelling call.
2. **Tour-listing pages.** The 12 absent `tours` URLs are *index* pages (`top-tours-in-<city>`). The `tour` type (235 docs) holds individual tours, not city index pages. Phase 2 should decide whether a per-city tour index is a `guideArticle`, a generated listing, or dropped in favour of the existing tour routing.

### 8.2 Migration approach by category

| Category | Absent | Recommended Phase 4 approach |
|---|---|---|
| attraction (71) | 71 | Bulk-create as `wikiMonument` **or** `guideArticle` once 8.1(1) is decided. Batch per destination. Largest workstream. |
| tours (12) | 12 | Resolve 8.1(2) first; several may become generated indexes rather than migrated docs. |
| heritage (3) | 3 | Fill the missing history/heritage `guideArticle` for Siwa, Sohag, Nuweiba — those destinations' guide sets are simply incomplete. |
| transport-to / -around (4) | 4 | Fill missing `guideArticle` slots (Siwa, Sohag, Dahab, Port Said). |
| accommodation (1) | 1 | Single Dakhla nested-path URL — migrate as `guideArticle`. |

The 116 already-migrated pages need **no content work** — only redirects (8.3).

### 8.3 The redirect map is a first-class Phase 4 workstream

Independent of content migration: **all ~206 unique old destination URLs need a 301** to their new `/guide/<city>/<slug>` (or `/wiki/monuments/<slug>`) target, and **zero exist today**. This splits cleanly:

- **116 "redirect-only" URLs** — content already migrated; the only task is wiring the 301. These can be done immediately, before any content work.
- **~90 "migrate-then-redirect" URLs** — content must be created first, then the 301 added.

Plus the **2 unspecified Giza redirects** (§6.4) and the redirect-to-parent conflict (§3) to resolve.

### 8.4 Rough Phase 4 estimate

Indicative only — depends on the 8.1 decisions and on batch size:

| Workstream | Rough size | Rough sessions |
|---|---|---|
| Redirect-only 301s (116 migrated pages) | 116 URLs | 1–2 |
| Attraction content migration (71 pages) | 71 docs, ~28 destinations | 4–6 |
| Tour-index + topic-page gaps (~20 pages) | ~20 docs | 1–2 |
| Migrate-then-redirect 301s (~90) | ~90 URLs | folds into the above |
| Giza follow-up + redirect-to-parent conflict | small | 0.5 |

**Indicative total: roughly 7–11 Phase 4 sessions**, the bulk being attraction content. The 30%+ absence (§1) means Phase 4 is a substantial build, not a cleanup pass — this is the strategy input the threshold breach was meant to surface.

### 8.5 Open questions for the operator

1. **Threshold breach (§1)** — 44% absent crosses the 30% line. Confirm Phase 2/4 should proceed as a full content build, or revisit strategy.
2. **Attraction home (§8.1)** — `wikiMonument` expansion vs. `guideArticle`?
3. **Tour-index pages (§8.1)** — migrate, generate, or drop?
4. **Redirect-to-parent conflict (§3)** — 4 of 5 children already exist as standalone `guideArticle` pages; honour the redirect or keep the pages?
5. **Baris/Esna (§4)** — confirm both are marked `done` (already migrated), not added to the backlog.
6. **New URLs final?** — are the `/guide/<city>/<slug>` slugs in the xlsx operator-finalised, or still open to refinement before the redirect map is built?
7. **`biahmu` (§6.2)** — confirm the Al Quseir row is dropped and the page is migrated under Al Fayoum.

---

## Appendix — method & data

- **Datasets:** Sanity project `ufallvd2`, datasets `migration-staging` (~1,490 content docs) and `production` (95 docs).
- **Slug match:** batched GROQ across 9 candidate types (`guideArticle`, `article`, `tour`, `wikiMonument`, `hotel`, `city`, `nileCruise`, `travelTip`, `editorialPage`), matching both the plain `slug.current` and the internationalised `slug[].value.current` shapes. Exact matches were then drift-checked with a token-overlap fuzzy pass against all 431 `guideArticle`, 134 `wikiMonument` and 235 `tour` titles+slugs — which surfaced no additional genuine matches (only city-name coincidences).
- **Body heuristic:** EN portable-text character count. All 116 migrated pages scored 1,144–8,295 chars — 114 full (≥1,500), 2 shorter but complete (`how-to-reach-al-gouna` 1,144; `only-in-al-gouna` 1,339). None empty or partial.
- **Railway:** old URL = CSV slug curled verbatim; new URL = xlsx `Best New URL` where available. Browser User-Agent; sequential, throttled.
- **WP:** `travel2egypt.org` is bot-walled (403 + JS challenge on every path including `robots.txt`). All WP-side facts derive from the 41 per-destination xlsx files, per Decision 2.
- **Not modified:** no Sanity writes, no code changes, no redirect-map edits. Read-only audit.

