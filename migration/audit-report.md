# Travel2Egypt WordPress Audit Report

Generated: 2026-04-26T23:00:47.559Z
Source: `https://travel2egypt.org/wp-json/wp/v2/`
Read-only inventory. No writes to Sanity.

---

## 1. Total counts

| Entity | EN | ES | JA |
|---|---:|---:|---:|
| Posts | 163 | 166 | 164 |
| Pages | 1246 | 1239 | 1211 |

| Other | Total |
|---|---:|
| Media (attachments) | 5540 |
| Categories | 26 |
| Tags | 24 |

> **Note on counts:** WP REST returns each translated post/page as a separate entity. Totals sum to ~493 posts and ~3696 pages across all locales. EN is canonical (per architectural decision in README §1).

## 2. Multilingual plugin detection

**Detected:** WPML (confirmed).

Evidence:
- `/wp-json/` namespaces include `wpml/v1`, `wpml/tm/v1`, `wpml/ate/v1`, `wpml/st/v1`.
- The `?lang=` query parameter on standard endpoints filters results per-language (works on `/wp/v2/posts` and `/wp/v2/pages`).
- No Polylang routes are registered.

**Important caveat:** Translation linkage is **not exposed in the public REST API**. Specifically:
- Single-document responses contain no `lang`, `translations`, or `wpml_current_locale` field.
- The `/wpml/v1/languages` endpoint returns 404 (likely auth-only).
- The `/wpml/tm/*` namespaces are write-side translation-management routes, not public.

**Implication for migration:** EN ↔ ES ↔ JA grouping will need to be reconstructed by enumerating `?lang=es` and `?lang=ja`, then matching translated entities back to their EN counterpart by some other key. Two viable strategies, both heuristic:
1. **Slug-pattern matching** — works for fully transliterated slugs (e.g., `/es/cairo` ↔ `/cairo`) but fails when slugs are translated into native script (JA uses encoded Japanese characters; ES uses translated Spanish slugs like `/los-precios-en-egipto`).
2. **wpml-context attempt** — try fetching with `?context=edit` or appending `&_fields=*` or sniffing `wpml-config` via post meta. This may work on some installs.

The cleanest approach is to **request a WPML write-token from the site admin** and use `/wpml/v1/translations/{id}`, but that requires a credentials handoff. Without it, expect imperfect locale linkage and surface uncertain matches in the migration log for manual review.

## 3. Custom post types and taxonomies

Native types only — **no custom content types in production use**. The CPTs registered in the WP REST schema are either Elementor/RankMath/ElementSkit infrastructure or empty:

| CPT | REST count | Notes |
|---|---:|---|
| `post` | 163 (EN) | Blog content |
| `page` | 1246 (EN) | All "real" content lives here |
| `featured_tour` | 0 | Empty in REST (likely `show_in_rest=false` or unused) |
| `reviews` | 0 | Empty in REST |
| `elementor_library`, `elementor_snippet`, `elementskit_*`, `rm_content_editor`, `e-floating-buttons`, `wp_block`, `wp_template`, `wp_navigation` | various | Page-builder/system infrastructure — not migration content |

**Taxonomies:** `category` (post-only, 26 terms), `post_tag` (24 terms), plus system-only `nav_menu` and `wp_pattern_category`. **No custom taxonomies** for things like "destination", "tour-type", "theme" — those concepts are encoded in slugs only.

**This is a strong signal that the brief's expectation — that pages have a "template" or CPT field that distinguishes hub / sub-page / monument / tour / package — does not hold.** Classification must be done from slug + body content. See §15.

## 4. Post categories

| Slug | Name | Count |
|---|---|---:|
| tours | Tours | 135 |
| tips-tricks | Tips &amp; Tricks | 49 |
| places-in-egypt | Places In Egypt | 48 |
| culture | Culture | 43 |
| history | History | 39 |
| egypt-travel-guide | Egypt Travel Guide | 38 |
| things-to-do | Things to do | 36 |
| adventure | adventure | 35 |
| creative | Creative | 31 |
| hotels | Hotels | 26 |
| luxury-stay | Luxury Stay | 25 |
| lifestyle | Lifestyle | 20 |
| safety | Safety | 16 |
| nile-cruise | Nile Cruise | 13 |
| pharaoh-monuments | pharaoh monuments | 12 |
| islamic-monuments | Islamic monuments | 7 |
| coptic-monuments | Coptic monuments | 2 |
| wellness | wellness | 2 |
| food | Food | 1 |
| company-insight | Company Insight | 0 |
| day-tours | Day Tours | 0 |
| macedonian-monuments | macedonian monuments | 0 |
| ptolemic-monuments | Ptolemic monuments | 0 |
| roman-monuments | roman monuments | 0 |
| travel-packages | Travel Packages | 0 |
| uncategorized | Uncategorized | 0 |

## 5. Custom taxonomies (beyond category/tag)

None registered as public taxonomies via REST. (`nav_menu` and `wp_pattern_category` exist but are system internals, not editorial taxonomy.)

## 6. Sample of 10 random posts

| WP ID | Slug | Title (EN) | Categories | Word count |
|---:|---|---|---|---:|
| 132240 | `a-history-buffs-guide-to-cairo` | A History Buff s Guide to Cairo | 94, 72 | 1088 |
| 235225 | `the-1922-discovery-of-tutankhamuns-tomb-why-it-matters-the-ultimate-guide` | The 1922 Discovery of Tutankhamun’s Tomb   Why It Matters: The Ultimate Guide | 72 | 1863 |
| 115456 | `egyptian-gods` | Egyptian Gods: The Most Significant Gods in Egyptian Mythology | 74 | 2273 |
| 205621 | `wellness-and-medical-tourism-in-egypt` | Wellness and Medical Tourism In Egypt : Ancient Traditions and Modern Retreats | 21 | 5567 |
| 202843 | `nubian-lodges-in-aswan-abu-simbel` | Best Nubian Lodges in Aswan   Abu Simbel | 74 | 2696 |
| 131153 | `the-grand-egyptian-museum-2024-insider-guide` | Explore the Grand Egyptian Museum 2025: An Insider Guide | 19, 77, 73, 74 | 1327 |
| 116015 | `middle-kingdom-pharaohs` | Middle Kingdom Pharaohs: Achievements and Legacy | 74 | 1519 |
| 235766 | `the-story-of-king-tutankhamun-tomb` | The Story of King Tutankhamun Tomb: Why It Became So Famous | 72 | 1898 |
| 230423 | `personalize-your-egypt-adventure` | How to Personalize Your Egypt Adventure: Insider Tips for Tailor-Made Travel | 75 | 1049 |
| 151996 | `islamic-cairo-and-its-religious-significance` | Islamic Cairo and its Religious Significance | 354 | 1698 |

## 7. Sample of 10 random pages

| WP ID | Slug | Title (EN) | Parent | Template | Word count | Classify |
|---:|---|---|---:|---|---:|---|
| 86851 | `the-elegant-cairo-4-days-tour` | The Elegant Cairo 4-Days Tour | 0 | elementor_header_footer | 1515 | tour-or-package (high) |
| 86817 | `al-gouna-private-day-tours` | Al-Gouna Private Day Tours | 0 | (default) | 719 | destination-subpage (med) |
| 160983 | `egypt-tours-from-spain` | Egypt Tours from Spain | 0 | elementor_header_footer | 1462 | unclassified (low) |
| 60771 | `naama-bay-sharm-el-sheikh-guide` | Naama Bay Sharm El Sheikh Guide: Beach   Nightlife | 0 | elementor_header_footer | 827 | unclassified (low) |
| 61528 | `wadi-el-rayan` | Wadi El Rayan | 0 | elementor_header_footer | 428 | unclassified (low) |
| 61545 | `the-pyramid-of-hawara` | The Pyramid Of Hawara | 0 | (default) | 367 | monument (high) |
| 88427 | `private-tour-day-tour-to-alexandria-from-cairo` | Coastal Citadel: Private Day Tour to Alexandria from Cairo | 0 | elementor_header_footer | 722 | tour-or-package (high) |
| 88560 | `hurghada-airport-transfer` | Swift Departure: Hurghada Airport Transfer Service | 0 | elementor_header_footer | 599 | unclassified (low) |
| 63606 | `coptic-cairo` | coptic cairo | 0 | elementor_header_footer | 706 | unclassified (low) |
| 58693 | `how-to-go-to-al-quseir` | How To Go To Al Quseir | 0 | elementor_header_footer | 492 | destination-subpage (med) |

## 8. Image inventory

- **Total attachments:** 5540
- **Estimated disk size (extrapolated from sample of a sample of media items):** ~433.2 MB (avg 80.1 KB per file)
- **Oldest in sample:** 2020-11-18T03:29:38
- **Newest in sample:** 2026-04-15T13:13:47

> Rough working assumption: media is shared across WPML languages by file (one upload, many `alt_text` translations). Spot check confirms: an image at `/wp-content/uploads/2026/04/edfu-temple-interiors.jpg` returned a Japanese `alt_text` field. The importer must take care to fetch alt per-language and store all locale alts on the same Sanity asset reference.

## 9. Internal linking (WP Internal Links / Link Whisper)

Sample of 50 random pages:
- **Pages with `data-wpil-monitor-id` attributes:** 41 of 50 (82.0%)
- **Total `data-wpil-monitor-id` occurrences in sample:** 198

The plugin is active (the `link-whisper` namespace appears in `/wp-json/`). Links are decorated with monitor attributes — these are noise-strippable in the migration without losing the link itself.

## 10. Elementor usage

Sample of 50 random pages:
- **Pages with detectable Elementor markers** (`elementor-*`, `e-con`, `e-flex`, `wpr-`, `data-element_type`): 50 of 50 (**100.0%**)

Effectively every page-class entity uses Elementor + Royal Elementor Addons. The default page template is `elementor_header_footer`. Posts (blog) use the classic editor more often, but the audit did not stratify-sample posts separately — assume importer must handle both.

**Implication:** The importer's HTML-to-Portable-Text conversion must aggressively strip Elementor wrappers before extracting semantic content. See Phase B mapping doc for the full rule set.

## 11. Content shape distribution

Sample of 50 random pages, word counts:
- Min: 150
- Median: 600
- Mean: 658
- Max: 1791

Word count is computed by stripping all HTML tags then splitting on whitespace — so it counts editorial words, not Elementor markup. Wide variance is expected: tour itineraries are long, persona pages are short.

## 12. Date distribution (last 5+ years)

**Posts by year (EN):**

| Year | Count |
|---|---:|
| 2017 | 9 |
| 2018 | 5 |
| 2019 | 1 |
| 2020 | 1 |
| 2024 | 110 |
| 2025 | 37 |

**Pages by year (EN):**

| Year | Count |
|---|---:|
| 2020 | 11 |
| 2023 | 570 |
| 2024 | 530 |
| 2025 | 128 |
| 2026 | 7 |

## 13. Top 50 URLs by historical traffic (pre-block)

From `migration/seo-data/seo-priority-urls-pre-block.csv` (April–December 2025). Joined against the WP REST inventory.

Of 1000 URLs in the CSV, **742 matched** to live WP entities (74.2%); **258 did not resolve** in the WP REST API and may be deleted, slug-changed, or outside WP (e.g., taxonomy archive URLs).

Top 50 matched, ranked by historical clicks:

| # | Clicks | Impressions | Lang | Kind | Type | WP ID | Slug |
|---:|---:|---:|---|---|---|---:|---|
| 1 | 7360 | 348156 | en | post | destination-hub | 152484 | `/how-to-choose-a-sim-card-for-your-trip-to-egypt/` |
| 2 | 6500 | 348010 | en | post | destination-hub | 69273 | `/alcohol-in-egypt/` |
| 3 | 2738 | 259051 | en | post | unclassified | 129653 | `/are-there-crocodiles-in-the-nile-river/` |
| 4 | 1997 | 36415 | ja | page | unclassified | 162262 | `/ja/エジプトのチップ文化（バクシーシ）/` |
| 5 | 1821 | 134872 | en | page | unclassified | 60906 | `/water-safety-in-egypt-advice-for-travelers/` |
| 6 | 1310 | 94974 | en | post | destination-hub | 1470 | `/faux-pas-to-avoid-in-egypt/` |
| 7 | 1215 | 60407 | es | post | unclassified | 144412 | `/es/hay-cocodrilos-en-el-rio-nilo/` |
| 8 | 1049 | 22983 | en | post | destination-hub | 236678 | `/escorts-in-egypt/` |
| 9 | 861 | 62379 | ja | post | unclassified | 162348 | `/ja/エジプトで避けるべき失礼な行動/` |
| 10 | 831 | 24565 | es | page | unclassified | 179330 | `/es/tu-nombre-en-jeroglificos/` |
| 11 | 777 | 53060 | en | page | destination-hub | 60949 | `/toilets-in-egypt/` |
| 12 | 730 | 18403 | ja | page | unclassified | 162722 | `/ja/エジプトの水安全-旅行者へのアドバイス/` |
| 13 | 689 | 96612 | en | page | unclassified | 72256 | `/attractions-entrance-fees/` |
| 14 | 660 | 27357 | es | page | unclassified | 144220 | `/es/propinas-en-egipto/` |
| 15 | 636 | 18133 | es | post | unclassified | 144323 | `/es/alcohol-en-egipto/` |
| 16 | 576 | 18140 | en | post | unclassified | 205297 | `/antique-market-in-cairo-the-diana-market/` |
| 17 | 575 | 94334 | en | post | unclassified | 206205 | `/egypt-transportation-tips/` |
| 18 | 550 | 269026 | en | post | destination-hub | 205894 | `/safety-guide-for-travelers-to-egypt/` |
| 19 | 541 | 41963 | en | post | destination-hub | 134691 | `/why-january-is-the-perfect-month-to-visit-egypt/` |
| 20 | 494 | 16415 | en | page | unclassified | 60776 | `/the-heavenly-cathedral/` |
| 21 | 457 | 6703 | ja | post | unclassified | 164256 | `/ja/エジプト・ナイルクルーズ完全ガイド/` |
| 22 | 443 | 68976 | en | page | persona-or-system | 352 | `/` |
| 23 | 442 | 14952 | ja | page | unclassified | 162609 | `/ja/エジプトのトイレ情報/` |
| 24 | 417 | 47665 | ja | post | unclassified | 178177 | `/ja/エジプトの神々：エジプト神話で最も重要な神々/` |
| 25 | 414 | 64591 | en | post | monument | 152485 | `/cave-church-cairo/` |
| 26 | 411 | 148406 | en | page | unclassified | 60910 | `/opening-hours-and-public-holidays/` |
| 27 | 389 | 48702 | en | post | unclassified | 65709 | `/cinematic-guide-to-egypts-film-sites/` |
| 28 | 382 | 16014 | es | post | unclassified | 144430 | `/es/tumbas-imprescindibles-del-valle-de-los-reyes/` |
| 29 | 376 | 19496 | en | post | unclassified | 153699 | `/wadi-feiran/` |
| 30 | 374 | 52873 | en | page | unclassified | 59429 | `/dahab-seasonal-guide/` |
| 31 | 366 | 33800 | en | page | tour-or-package | 87832 | `/private-tour-2-days-1-night-trip-to-saint-catherine-from-cairo/` |
| 32 | 365 | 89230 | es | post | unclassified | 144414 | `/es/los-coptos-de-egipto-guardianes-de-una-antigua-fe/` |
| 33 | 365 | 43124 | en | post | unclassified | 134663 | `/visiting-egypt-in-july/` |
| 34 | 363 | 15281 | en | page | destination-subpage | 60458 | `/how-to-go-to-saint-catherine/` |
| 35 | 356 | 32431 | en | post | unclassified | 130539 | `/myths-and-facts-about/` |
| 36 | 354 | 7551 | ja | post | unclassified | 170205 | `/ja/エジプト旅行に最適なsimカードの選び方/` |
| 37 | 350 | 63634 | en | post | unclassified | 116015 | `/middle-kingdom-pharaohs/` |
| 38 | 341 | 19776 | es | page | unclassified | 144203 | `/es/telefonos-en-egipto/` |
| 39 | 335 | 58346 | en | post | unclassified | 153508 | `/siwa-salt-lakes/` |
| 40 | 329 | 44193 | en | post | unclassified | 134564 | `/places-to-visit-in-cairo-at-night/` |
| 41 | 303 | 2381 | ja | page | unclassified | 177490 | `/ja/ルクソールの移動手段あれこれ/` |
| 42 | 289 | 12085 | es | page | unclassified | 144207 | `/es/precios-de-las-entradas-a-las-atracciones-de-luxor/` |
| 43 | 288 | 11399 | ja | post | unclassified | 162458 | `/ja/古代エジプトに関する14の誤解と真実/` |
| 44 | 275 | 25922 | en | post | unclassified | 109929 | `/sacred-places-in-egypt-temples-mosques-and-religious-sites-to-explore/` |
| 45 | 273 | 1662 | ja | page | unclassified | 161911 | `/ja/エジプトの値段交渉/` |
| 46 | 272 | 89684 | en | post | unclassified | 131117 | `/the-copts-of-egypt-guardians-of-an-ancient-faith/` |
| 47 | 268 | 8964 | ja | post | unclassified | 162836 | `/ja/エジプトの映画撮影地への映画ガイド/` |
| 48 | 263 | 92173 | en | page | destination-hub | 60914 | `/telephones-in-egypt/` |
| 49 | 252 | 7050 | ja | post | unclassified | 170588 | `/ja/ナイル川にワニはいますか？/` |
| 50 | 247 | 25043 | en | page | destination-hub | 73387 | `/cultural-etiquette-in-egypt/` |

## 14. Pre-block CSV URLs that don't resolve in WP REST

Total unresolved: **258** of 1000.

Possible reasons:
- The URL was deleted from WP after the click data was captured.
- The slug was changed.
- The URL is a category/tag/author archive (not a single `post` or `page` — those archive URLs do not resolve via `/wp/v2/posts` or `/wp/v2/pages`).
- The URL has trailing-slash or encoding inconsistency this lookup didn't normalize.

Top 30 unresolved by historical clicks (manual triage candidates):

| Clicks | Impressions | URL |
|---:|---:|---|
| 494 | 14387 | `/es/las-bebidas-alcoholicas-en-egipto/` |
| 271 | 7433 | `/sharm-el-sheikh-travel-guide/the-heavenly-cathedral/` |
| 227 | 11228 | `/how-to-go-to-faiyum/` |
| 213 | 48041 | `/giza-travel-guide/the-black-pyramid/` |
| 203 | 17740 | `/sharm-el-sheikh-travel-guide/getting-around/` |
| 196 | 1670 | `/ja/ルクソール旅行ガイド/移動手段あれこれ/` |
| 189 | 21367 | `/dahab-travel-guide/when-to-visit-dahab/` |
| 170 | 23198 | `/exploring-the-great-sphinx-of-giza/` |
| 170 | 8630 | `/es/tumbas-imprescindibles-del-valle-de-los-reyes-2024-joyas-ocultas-y-consejos-ineditos-para-los-visitantes/` |
| 153 | 6986 | `/aswan-travel-guide/culinary-feasting/` |
| 151 | 16505 | `/best-time-to-cruise-the-nile-2/` |
| 116 | 3694 | `/es/explora-el-gran-museo-egipcio-2024-guia-para-iniciados/` |
| 100 | 5347 | `/es/las-mejores-opciones-de-tarjetas-sim-para-viajar-a-egipto/` |
| 98 | 5328 | `/nile-link-private-cartransfer-from-aswan-to-luxor/` |
| 96 | 1377 | `/fi/kuinka-pukeutua-vieraillessa-egyptissa/` |
| 95 | 3654 | `/es/restaurantes-con-vistas-al-nilo-en-zamalek-el-cairo/` |
| 94 | 8443 | `/es/guia-cinematografica-de-los-sitios-de-cine-de-egipto/` |
| 93 | 1248 | `/ja/美食の饗宴/` |
| 89 | 8113 | `/ancient-egypt-myths/` |
| 89 | 2292 | `/ja/7月にエジプトを訪れる-4o-mini/` |
| 88 | 2088 | `/egypt-bird-watching-tour/` |
| 87 | 3626 | `/saint-catherine-travel-guide/pilgrims-travel-guide/` |
| 85 | 25836 | `/saint-catherine-travel-guide/moses-mountain/` |
| 81 | 30043 | `/marsa-alam-travel-guide/weather-travel-guide/` |
| 79 | 5197 | `/marriott-mena-house-stay-of-distinction/` |
| 78 | 1130 | `/fi/liikkuminen-egyptissa/` |
| 76 | 5463 | `/14-myths-and-facts-about-ancient-egypt/` |
| 75 | 7108 | `/nile-cruise-luxor-to-cairo/` |
| 72 | 37097 | `/es/dioses-egipcios-los-dioses-mas-significativos-de-la-mitologia-egipcia/` |
| 72 | 2734 | `/ja/ナイルのお祭り/` |

## 14b. Recovering CSV (last 7 days, post-block)

From `migration/seo-data/seo-priority-urls-recovering.csv`. 1000 URLs total; 752 matched (75.2%). 248 unresolved.

Top 30 by recent impressions:

| Impressions | Clicks | Lang | Kind | Type | WP ID | Slug |
|---:|---:|---|---|---|---:|---|
| 3888 | 14 | en | post | unclassified | 129653 | `/are-there-crocodiles-in-the-nile-river/` |
| 3234 | 41 | en | page | unclassified | 60906 | `/water-safety-in-egypt-advice-for-travelers/` |
| 2959 | 5 | en | post | destination-hub | 205894 | `/safety-guide-for-travelers-to-egypt/` |
| 2726 | 14 | en | post | destination-hub | 69273 | `/alcohol-in-egypt/` |
| 1932 | 30 | ja | post | unclassified | 178177 | `/ja/エジプトの神々：エジプト神話で最も重要な神々/` |
| 1565 | 4 | en | post | destination-hub | 152484 | `/how-to-choose-a-sim-card-for-your-trip-to-egypt/` |
| 1311 | 4 | en | page | destination-hub | 60914 | `/telephones-in-egypt/` |
| 1262 | 2 | en | page | unclassified | 72256 | `/attractions-entrance-fees/` |
| 1252 | 4 | en | post | unclassified | 206205 | `/egypt-transportation-tips/` |
| 1028 | 3 | es | post | unclassified | 144414 | `/es/los-coptos-de-egipto-guardianes-de-una-antigua-fe/` |
| 1021 | 12 | en | post | unclassified | 153217 | `/restaurants-in-zamalek/` |
| 1002 | 1 | en | post | monument | 243401 | `/the-curse-of-king-tuts-tomb/` |
| 984 | 18 | es | page | unclassified | 179330 | `/es/tu-nombre-en-jeroglificos/` |
| 949 | 0 | en | page | destination-hub | 60892 | `/airports-in-egypt/` |
| 794 | 23 | en | post | destination-hub | 236678 | `/escorts-in-egypt/` |
| 777 | 0 | en | page | unclassified | 60910 | `/opening-hours-and-public-holidays/` |
| 759 | 8 | es | post | unclassified | 144323 | `/es/alcohol-en-egipto/` |
| 717 | 8 | en | page | destination-hub | 60949 | `/toilets-in-egypt/` |
| 670 | 0 | en | page | tour-or-package | 57684 | `/egypt-travel-packages/` |
| 659 | 4 | en | post | unclassified | 153508 | `/siwa-salt-lakes/` |
| 657 | 2 | ja | post | unclassified | 170207 | `/ja/古代エジプトの王たち：エジプトのファラオたち/` |
| 648 | 1 | en | post | destination-hub | 205417 | `/how-to-dress-when-visiting-egypt/` |
| 643 | 1 | en | page | unclassified | 78394 | `/when-to-go-marsa-alam/` |
| 625 | 4 | ja | post | unclassified | 170585 | `/ja/時の守護者：ギザの大スフィンクスを探索する/` |
| 611 | 8 | en | page | persona-or-system | 352 | `/` |
| 597 | 3 | en | post | unclassified | 65709 | `/cinematic-guide-to-egypts-film-sites/` |
| 595 | 5 | en | page | unclassified | 59171 | `/where-to-eat-in-alexandria/` |
| 590 | 12 | en | post | unclassified | 205297 | `/antique-market-in-cairo-the-diana-market/` |
| 583 | 2 | en | post | destination-hub | 204425 | `/animals-in-ancient-egypt/` |
| 575 | 1 | en | page | unclassified | 77776 | `/distance-between-egyptian-cities/` |

## 15. Travel Guide structure detection — **major deviation from brief**

**The WP page hierarchy is essentially flat.** Of 1246 EN pages, only **22** have a non-zero `parent` field; **1224** are at `parent=0`. Sub-pages do **not** live at `/{destination}/{topic}/` — they live at `/{some-flat-slug}/` and the destination/topic relationship is encoded in the slug itself.

Examples observed:
- `/getting-around-suez/` — sub-page of Suez (topic = Getting Around)
- `/how-to-get-to-giza/` — sub-page of Giza (topic = Plan Your Trip)
- `/kharga-oasis-only-here/` — sub-page of Kharga Oasis (topic = Others / "only here")
- `/the-temple-of-kom-ombo/` — monument page (Places To Go for the relevant city)
- `/pyramids-of-giza-and-grand-egyptian-museum/` — monument page (Places To Go for Giza)

This means **destination hubs and sub-pages must be classified by slug-pattern matching, not by URL path or WP parent reference.** The classifier in this audit uses the following heuristic order:

1. Slug exactly equals a known destination token (e.g., `cairo`, `luxor`) OR ends in `-travel-guide` OR ends in `-egypt` → **destination-hub**.
2. Slug starts with a topic-prefix (`getting-around-`, `how-to-get-to-`, `where-to-stay-`, `history-`, `weather-`, etc.) → **destination-subpage** (high confidence if the trailing token is a known destination).
3. Slug ends with a topic-suffix (`-history`, `-only-here`, `-where-to-stay`, etc.) → **destination-subpage**.
4. Slug matches a tour pattern (`^\d+-day`, `-package`, `-vacation`, `-cruise`, `-itinerary`) → **tour-or-package**.
5. Slug starts with a monument hint (`temple-of-`, `tomb-of-`, `pyramids-of-`, `great-temple-`, etc.) OR contains a monument keyword → **monument** (Places To Go target).
6. Slug is a known persona/system page (`just-me`, `about`, `contact`, `tailored-tours`) → **persona-or-system**.
7. Slug is numeric, ends in `-2`, or matches `testing` → **test-or-junk**.
8. Otherwise → **unclassified** (manual triage required).

### Auto-classification distribution across all 1246 EN pages:

| Type | Count | % |
|---|---:|---:|
| unclassified | 589 | 47.3% |
| destination-subpage | 240 | 19.3% |
| tour-or-package | 194 | 15.6% |
| monument | 135 | 10.8% |
| destination-hub | 69 | 5.5% |
| persona-or-system | 12 | 1.0% |
| test-or-junk | 7 | 0.6% |

### Confidence breakdown:

| Type / Confidence | Count |
|---|---:|
| unclassified/low | 589 |
| tour-or-package/high | 194 |
| destination-subpage/high | 129 |
| destination-subpage/med | 111 |
| monument/med | 78 |
| destination-hub/high | 69 |
| monument/high | 57 |
| persona-or-system/high | 12 |
| test-or-junk/high | 7 |

> **What this means for Phase B mapping:** The unclassified bucket is the manual-review surface. Roughly that many pages will need an editor (or a content-aware LLM pass) to determine whether they're destination sub-pages with non-standard slugs, monument pages with names that don't match the keyword list, or genuinely miscellaneous content (legal, contact, drafts).

**The brief assumed sub-pages live under hub URLs (e.g., `/cairo/where-to-stay`) — they don't.** The mapping doc in Phase B must treat `parentCity` resolution as a slug-pattern inference (extract destination token from the slug), not a URL-path traversal. This will be reflected in the importer's classifier.

## 16. Honest reporting — surprises and structural concerns

Things found during audit that contradict expectations or need decisions:

1. **WPML translation linkage is private.** As described in §2, the public REST API does not expose translation groups. Without an admin-handoff, the importer will reconstruct EN ↔ ES ↔ JA via slug-similarity for posts (works for transliterated slugs, less reliable for native-script JA slugs and translated ES slugs). All uncertain matches will be logged for manual review. Recommendation: get a WPML admin token from the site owner before Phase D test runs.

2. **Page count mismatches across locales.** EN/ES/JA pages = 1246/1239/1211. Posts = 163/166/164. Translations are not 1:1; some EN content has no JA equivalent and some ES posts may not have EN originals. Plan: import each locale independently against the same Sanity `_id` namespace, then run a reconciliation pass that flags singletons.

3. **Flat URL structure (§15).** The biggest deviation from the brief. Sub-pages are not at `/{destination}/{topic}/` — they're at `/{slug}/` with the destination encoded in the slug. The classifier handles this, but the redirect map will need to map flat WP URLs (`/getting-around-suez/`) to nested Next.js paths (`/guide/suez/getting-around`). A small number of pages will resist auto-classification and need editorial triage.

4. **No "destination hub" pages found at `/{token}-travel-guide/`** in the search probe. Hubs may instead be at single-token slugs (`/cairo/`, `/luxor/`) — those exist but were not in the date-desc sample. The classifier covers both forms; the actual hub slugs will surface in the full classification distribution above.

5. **No native CPTs distinguish tour / package / monument / hub / sub-page.** Every "non-blog" entity is type `page`. All semantic distinction is in the slug or body content. Custom-post-types like `featured_tour` and `reviews` exist in the schema but contain zero published items in REST — likely not used for production content.

6. **Elementor saturation: ~100% of sampled pages** have detectable Elementor markup. The HTML body is heavily structural. The importer's stripping pass must be aggressive (remove all class-prefixed wrappers), and pull-quote / side-image detection (per Phase B brief) will work on the post-strip semantic shape, not the raw markup.

7. **Internal linking via Link Whisper.** The plugin is active (~82.0% of pages have its monitor attributes). `data-wpil-monitor-id` attributes are pure noise — strip during HTML normalization. The actual `<a href>` is what the relinker needs.

8. **Spanish posts (166) outnumber English posts (163).** Three ES-only posts exist with no EN equivalent. Same direction in JA (164 > 163). These will surface as singletons in the reconciliation pass. They need editorial decision: translate to EN before migration, or import as ES/JA-only.

9. **Test/junk pages exist.** `testing`, `233278-2`, `home-2` and similar slugs were observed. These should not be migrated. The classifier flags them as `test-or-junk`; the importer should skip with a warning unless `--include-junk` is passed.

10. **Media is one-asset-per-file, alt is per-language.** A spot-checked image had an English filename and a Japanese `alt_text`. Either WPML returns the alt for the "current" locale (which on a default REST call is whichever the site's default language is set to — likely EN, but the response we got had JA alt, so probably the alt was authored in JA on that media record). The importer must fetch each media item once per locale to capture all language-specific alts, but must reuse a single Sanity asset reference across locales.

---

## End of Phase A — STOP

This is a read-only inventory. No Sanity writes have occurred. No importer code has been built.

Awaiting approval to proceed to Phase B (mapping doc).
