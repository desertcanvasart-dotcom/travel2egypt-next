# Migration summary

- **Started:** 2026-04-29T11:12:52.737Z
- **Finished:** 2026-04-29T12:15:56.334Z
- **Argv:** `--filter-by-template destination-hub --slug-pattern *-travel-guide --slug-exclude egypt-travel-guide --continue-on-error`
- **Errors:** 2

## By Sanity type

| Type | Written | Skipped | Failed |
|---|---:|---:|---:|
| article | 489 | 0 | 0 |
| city | 41 | 0 | 0 |
| editorialCategory | 19 | 7 | 0 |
| translation.metadata | 163 | 0 | 0 |

## Review flags applied

| Flag | Count |
|---|---:|
| none | 672 |
| keyfacts-mining-failed | 40 |

## HTML pipeline detections

- Operator notes: 0
- Pull quotes: 0
- Side images: 0
- Inline images: 2794
- Tables flattened: 3

## Locale linkage (hreflang)

- Entities probed: 206
- Multi-locale groups (EN+ES+JA): 206
- Singletons (EN-only): 0
- Broken hreflang (URL not in REST cache): 0

## Strip rule activity

| Rule | Instances removed |
|---|---:|
| tour-promo CTA (`.elementor-cta`) | 1804 |
| category-grid (`.e-grid` w/ internal-only anchors) | 200 |
| duplicate-paragraph backlink | 106 |
| swiper carousel (`swiper-slide-image`) | 0 |
| premium-adv carousel (`premium-adv-carousel__item-img`) | 0 |
| bdt-img tour-promo (`bdt-img`) | 18 |
| title-matching H1 (Fix 1) | 60 |
| metadata lines `Created/Updated On…` (Fix 2) | 75 |
| section nav blocks `INTRODUCING …` (Fix 3) | 41 |
| link-mark → `_pendingInternalRef` (URL validator fix) | 13433 |
| link-mark kept as `externalLink` | 827 |
| link-mark stripped (malformed/empty) | 5 |
| link-mark stripped (`#anchor` only) | 1 |
| link-mark stripped (bare mailto:/tel:) | 0 |

## Stripped carousels

_None._

## Ambiguous filename matches

Filename fallback could not pick a candidate cleanly. Layer 0 (exact source_url) and layer 1 (exact path-tail) didn't produce a single match. Layer 2 (year/month directory) either disambiguated among multiple year/month candidates (`year-month`) or failed to find any (`rejected` — left as `_pendingImage`).

| Article slug | Locale | base filename | layer | chosen wpId | rejection reason | src URL |
|---|---|---|---|---:|---|---|
| visiting-egypt-in-july | en | Nour | rejected | — | no exact-tail (0 matches), year-month=/2024/07/ matched 0 of 10 | http://travel2egypt.org/wp-content/uploads/2024/07/Nour.jpg |
| viajes-historicos-a-egipto-para-familias | es | 2-1 | rejected | — | no exact-tail (2 matches), year-month=/2024/05/ matched 0 of 10 | http://travel2egypt.org/wp-content/uploads/2024/05/2-1-1024x576.jpg |
| old-kingdom-pharaohs | en | 10 | rejected | — | no exact-tail (0 matches), year-month=/2024/05/ matched 0 of 10 | http://travel2egypt.org/wp-content/uploads/2024/05/10.jpg |
| historical-sites-visited-by-a-nile-cruise | en | nile-cruise | rejected | — | no exact-tail (0 matches), year-month=/2024/05/ matched 0 of 10 | http://travel2egypt.org/wp-content/uploads/2024/05/nile-cruise.jpg |
| sacred-places-in-egypt-temples-mosques-and-religious-sites-to-explore | en | Kom-Ombo%E2%80%8B-temple | year-month | 61478 | 2 candidates within /2024/01/ (no exact-tail match) | http://travel2egypt.org/wp-content/uploads/2024/01/Kom-Ombo​-temple.jpg |
| sacred-places-in-egypt-temples-mosques-and-religious-sites-to-explore | en | 3-25 | year-month | 101539 | 2 candidates within /2024/03/ (no exact-tail match) | http://travel2egypt.org/wp-content/uploads/2024/03/3-25.png |
| places-in-egypt | en | aswan | rejected | — | no exact-tail (0 matches), year-month=/2024/05/ matched 0 of 10 | http://travel2egypt.org/wp-content/uploads/2024/05/aswan.jpg |
| historicos-de-egipto | es | 1-4 | rejected | — | no exact-tail (6 matches), year-month=/2024/03/ matched 0 of 10 | http://travel2egypt.org/wp-content/uploads/2024/03/1-4.jpg |

## Sanity write resilience

- Transient retries (5xx / ECONNRESET, succeeded after retry): 0

## Media

- Uploaded: 2673
- Reused (idempotent): 0
- Failed: 0
- Duplicate `<img src>` remappings (same wpId, different src): 0

## Missing source attachments

Editorial triage: source URL returned 404, image silently skipped.

| Article slug | Locale | WP attachment ID | Source URL |
|---|---|---:|---|
| 129-reasons-to-visit-karnak-temple | en | 135884 | https://travel2egypt.org/wp-content/uploads/2024/07/Karnak-Temple-Ruins.png |
| 129-razones-para-visitar-el-templo-de-karnak | es | 135884 | https://travel2egypt.org/wp-content/uploads/2024/07/Karnak-Temple-Ruins.png |
| カルナック神殿を訪れる129の理由 | ja | 135884 | https://travel2egypt.org/wp-content/uploads/2024/07/Karnak-Temple-Ruins.png |
| egypt-group-holidays-for-couples | en | 135885 | https://travel2egypt.org/wp-content/uploads/2024/07/Luxor-Temple-at-Sunset.png |
| vacaciones-en-grupo-en-egipto-para-parejas | es | 135885 | https://travel2egypt.org/wp-content/uploads/2024/07/Luxor-Temple-at-Sunset.png |
| カップル向けエジプトグループ旅行 | ja | 135885 | https://travel2egypt.org/wp-content/uploads/2024/07/Luxor-Temple-at-Sunset.png |
| discover-siwa-oasis | en | 137130 | https://travel2egypt.org/wp-content/uploads/2024/08/Untitled-design-4.png |
| discover-siwa-oasis | en | 137129 | https://travel2egypt.org/wp-content/uploads/2024/08/Untitled-design-5.png |
| descubre-el-oasis-de-siwa | es | 137130 | https://travel2egypt.org/wp-content/uploads/2024/08/Untitled-design-4.png |
| descubre-el-oasis-de-siwa | es | 137129 | https://travel2egypt.org/wp-content/uploads/2024/08/Untitled-design-5.png |
| シワオアシスを発見：エジプトの砂漠の楽園での | ja | 137130 | https://travel2egypt.org/wp-content/uploads/2024/08/Untitled-design-4.png |
| シワオアシスを発見：エジプトの砂漠の楽園での | ja | 137129 | https://travel2egypt.org/wp-content/uploads/2024/08/Untitled-design-5.png |
| 8-day-egypt-tour-itinerary | en | 135885 | https://travel2egypt.org/wp-content/uploads/2024/07/Luxor-Temple-at-Sunset.png |
| 8-day-egypt-tour-itinerary | en | 96314 | https://travel2egypt.org/wp-content/uploads/2024/03/1-9.png |
| itinerario-definitivo-de-8-dias-por-egipto-un-viaje-en-el-tiempo | es | 135885 | https://travel2egypt.org/wp-content/uploads/2024/07/Luxor-Temple-at-Sunset.png |
| itinerario-definitivo-de-8-dias-por-egipto-un-viaje-en-el-tiempo | es | 96314 | https://travel2egypt.org/wp-content/uploads/2024/03/1-9.png |
| 究極の8日間エジプトツアー旅程：時を超える旅 | ja | 135885 | https://travel2egypt.org/wp-content/uploads/2024/07/Luxor-Temple-at-Sunset.png |
| 究極の8日間エジプトツアー旅程：時を超える旅 | ja | 96314 | https://travel2egypt.org/wp-content/uploads/2024/03/1-9.png |
| the-best-egypt-travel-itineraries | en | 96185 | https://travel2egypt.org/wp-content/uploads/2024/03/4-5.png |
| the-best-egypt-travel-itineraries | en | 135820 | https://travel2egypt.org/wp-content/uploads/2024/07/Tranquil-Nile-River-in-Aswan.png |
| the-best-egypt-travel-itineraries | en | 135880 | https://travel2egypt.org/wp-content/uploads/2024/07/Ancient-Egyptian-Relief.png |
| the-best-egypt-travel-itineraries | en | 96314 | https://travel2egypt.org/wp-content/uploads/2024/03/1-9.png |
| explore-egypt-in-november | en | 99274 | https://travel2egypt.org/wp-content/uploads/2024/03/2-25.png |
| explora-egipto-en-noviembre | es | 99274 | https://travel2egypt.org/wp-content/uploads/2024/03/2-25.png |
| 11月に行くエジプトの旅-神秘と歴史が息づく季 | ja | 99274 | https://travel2egypt.org/wp-content/uploads/2024/03/2-25.png |
| places-to-visit-in-cairo-at-night | en | 99274 | https://travel2egypt.org/wp-content/uploads/2024/03/2-25.png |
| lugares-que-visitar-en-el-cairo-de-noche | es | 99274 | https://travel2egypt.org/wp-content/uploads/2024/03/2-25.png |
| 夜のカイロで訪れたいおすすめスポット | ja | 99274 | https://travel2egypt.org/wp-content/uploads/2024/03/2-25.png |
| the-pyramids-of-egypt | en | 96162 | https://travel2egypt.org/wp-content/uploads/2024/03/5-4.png |
| the-pyramids-of-egypt | en | 96186 | https://travel2egypt.org/wp-content/uploads/2024/03/5-5.png |
| 古代の驚異：明らかにされたエジプトのピラミッ | ja | 96162 | https://travel2egypt.org/wp-content/uploads/2024/03/5-4.png |
| 古代の驚異：明らかにされたエジプトのピラミッ | ja | 96186 | https://travel2egypt.org/wp-content/uploads/2024/03/5-5.png |
| must-visit-islamic-places-in-cairo | en | 99274 | https://travel2egypt.org/wp-content/uploads/2024/03/2-25.png |
| islamicos-de-visita-obligada-en-el-cairo | es | 99274 | https://travel2egypt.org/wp-content/uploads/2024/03/2-25.png |
| カイロの必見イスラム教の名所 | ja | 99274 | https://travel2egypt.org/wp-content/uploads/2024/03/2-25.png |
| discover-the-hidden-treasures | en | 131338 | https://travel2egypt.org/wp-content/uploads/2024/06/boussa69_A_realistic_image_of_a_couple_having_a_morning_walk_in_desert.png |
| excursiones-de-un-dia-desde-hurghada | es | 131338 | https://travel2egypt.org/wp-content/uploads/2024/06/boussa69_A_realistic_image_of_a_couple_having_a_morning_walk_in_desert.png |
| historical-egypt-travel | en | 96314 | https://travel2egypt.org/wp-content/uploads/2024/03/1-9.png |
| viajes-al-egipto-historico | es | 96314 | https://travel2egypt.org/wp-content/uploads/2024/03/1-9.png |
| 過去の響き：歴史を巡るエジプト旅行 | ja | 96314 | https://travel2egypt.org/wp-content/uploads/2024/03/1-9.png |
| luxury-resorts-in-egypt | en | 129746 | https://travel2egypt.org/wp-content/uploads/2024/05/the-old-cataract-aswan.png |
| centros-turisticos-de-lujo-en-egipto-junto-al-nilo | es | 129746 | https://travel2egypt.org/wp-content/uploads/2024/05/the-old-cataract-aswan.png |
| 輝かしき贅沢：ナイル川沿いのエジプトのラグジ | ja | 129746 | https://travel2egypt.org/wp-content/uploads/2024/05/the-old-cataract-aswan.png |
| エジプトの歴史的名所：時を超えた旅 | ja | 186950 | https://travel2egypt.org/wp-content/uploads/2024/03/1-9.png |
| エジプトの歴史的名所：時を超えた旅 | ja | 191998 | https://travel2egypt.org/wp-content/uploads/2024/07/Tranquil-Nile-River-in-Aswan.png |
| alcohol-in-egypt | en | 97732 | https://travel2egypt.org/wp-content/uploads/2024/03/alcohol-in-egypt.png |
| alcohol-en-egipto | es | 97732 | https://travel2egypt.org/wp-content/uploads/2024/03/alcohol-in-egypt.png |
| エジプトのアルコール | ja | 97732 | https://travel2egypt.org/wp-content/uploads/2024/03/alcohol-in-egypt.png |

## Upload exhaustions (Sanity side)

Sanity asset upload either threw a non-transient error or exhausted the 5-attempt retry. Doc was either skipped (--continueOnError) or run halted. Mirror of MISSING_ATTACHMENTS for symmetry per session 5 methodology rule 1 (loud failures).

| Article slug | Locale | WP attachment ID | Filename | Attempts | Source URL | Last error |
|---|---|---:|---|---:|---|---|
| the-best-egypt-travel-itineraries | en | 100051 | 3-25-1.jpg | 1 | https://travel2egypt.org/wp-content/uploads/2024/03/3-25-1.jpg | An invalid response was received from the upstream server |
| october-escapes-discovering-egypt-in-autumn | en | 88742 | Dolphin-Full-Day-Snorkeling-Tour-from-Hurghada.jpg | 1 | https://travel2egypt.org/wp-content/uploads/2024/02/Dolphin-Full-Day-Snorkeling-Tour-from-Hurghada.jpg | An invalid response was received from the upstream server |

## Redirects

- Total entries: 742
- Live URL matches: 0
- Historic nested URL matches: 0
- Orphans (manual triage): 496

## Relink phase

- Documents scanned: 0
- Internal links resolved: 0
- Orphaned (kept as external): 0
- Documents patched: 0

## City reconciliation

- Cities updated: 0
- Places-to-go references added: 0
