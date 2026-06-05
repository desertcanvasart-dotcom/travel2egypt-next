# Phase 3 Part 2 — Corpus-existence check (import vs author)

**Read-only.** Gates content authoring: where re-authored ES/JA already exists in the source
corpus, **import it** (real human copy) rather than AI-generate.

**Corpora searched:** `~/Downloads/All 3 langs/{en,es,ja}/…` (parallel trees: tours, hotels,
cruises, guide, articles, travel tips, Parent pages) and `~/Desktop/T2E Multilingual docs/{T2E EN,ES,JA}`.
**Indexed:** 9,545 `.md` files, 540 unique frontmatter slugs.
**Method:** match each Sanity (A)-gap slug against corpus frontmatter `slug:` + `locale:`
(normalized, leading-zeros stripped); for tours, additionally keyword/title inspection because slugs were remapped.

## Summary table

| Category | Sanity gaps | EXISTS in corpus (import) | GENUINE VOID (author) | Verdict |
|---|---|---|---|---|
| **Hotels** ES name/summary | 72 | **50** (ES files w/ `title:`+`description:`) | 22 | **IMPORT-led** |
| **Cruises** ES name/summary | 48 | **28** | 20 | **IMPORT-led** |
| **Tours** ES+JA summary/body | 25 | slug-match 0; **partial under reworded slugs** (needs title reconciliation) | unknown until reconciled | **RECONCILE FIRST** |
| **FAQ** (24 entries + 7 cats) | 31 | **0** | 31 | **AUTHOR** |
| **Editorial** (contact, hotel-grade-concept, responsible-travel) | 3 | **0** | 3 | **AUTHOR** |

---

## Hotels — IMPORT (root cause found)
**50 of 72** missing-ES hotels have a Spanish corpus file at
`~/Downloads/All 3 langs/es/hotels/<slug>_es_2026-05.md` containing ES `title:` and `description:`
frontmatter **plus** ES body.

**Why the ES asymmetry (body present, name/summary absent):** confirmed on
`8-pickalbatros-palace-sharm-aqua-park` — Sanity has `esBody` (21 blocks) but `esName=null`,
`esSum=null`, while the corpus file carries:
```
title:       "Pickalbatros Palace Sharm & Aqua Park: todo incluido"   → name.es
description: "Un resort todo incluido en Ras Nasrani…"                  → summary.es
```
The prior ES hotel import ingested **body only** and skipped the frontmatter `title`/`description`.
JA imported all three (jaName present). → **Fix = re-import frontmatter title→name, description→summary
for the 50 ES files, additive.** No authoring needed for these.

- **22 void** (author ES name+summary): sunrise-montemare-resort, sharm-el-sheikh-fayrouz-resort,
  renaissance-sharm-el-sheikh-resort, cairo-marriott-hotel-and-omar-khayyam-casino,
  maritim-jolie-ville-kings-island-luxor, cairo-hotel-pyramids, the-cascades-soma-bay,
  hurghada-marriott-red-sea-resort, marriott-mena-house-hotel-cairo, hilton-alexandria-corniche-hotel,
  helnan-palestine-hotel-alexandria, the-four-seasons-hotel-san-stephano, royal-maxim-palace-kempinski-cairo,
  four-seasons-hotel-cairo-nile-plaza, four-seasons-hotel-cairo-first-residence, movenpick-resort-aswan,
  westin-cairo-golf-resort-and-spa, badawiya-hotel-el-dakhla-oasis, sol-y-mar-pioneers-hotel-al-kharga-oasis,
  steigenberger-nile-palace-luxor-hotel, movenpick-resort-spa-el-gouna, the-nile-ritz-carlton.
- *Caveat:* a few "void" may exist under a slightly different corpus slug — worth a name-level pass before authoring.

**Sample import path:** `~/Downloads/All 3 langs/es/hotels/8-pickalbatros-palace-sharm-aqua-park_es_2026-05.md`

## Cruises — IMPORT-led
**28 of 48** missing-ES cruises have `~/Downloads/All 3 langs/es/cruises/<slug>_es_2026-05.md`
(ES title+description). Same import path as hotels.
- **20 void** (author): swiss-inn-radamis-ii, m-s-amwaj-livingstone, sonesta-amirat-dahabiya,
  nour-el-nil-meroe-dahabiya, movenpick-prince-abbas, m-s-steigenberger-{omar-el-khayam,minerva,legacy},
  m-s-sonesta-st-george, movenpick-ms-{hamees,darakum,royal-lotus,sun-ray}, m-s-alexander-the-great,
  m-s-sonesta-star-goddess, movenpick-sb-feddya-dahabiya, m-s-mayfair, nour-el-nil-assouan-dahabiya,
  el-nil-dahabiya, adelaide-dahabiya. (Several Movenpick/Steigenberger fleet vessels — likely never written.)

**Sample import path:** `~/Downloads/All 3 langs/es/cruises/amawaterways-amadahlia-nile-cruise_es_2026-05.md`

## Tours — RECONCILE FIRST (do NOT author or import blindly)
Slug-match against the 25 gaps = **0/25** — but the corpus holds **177 ES tour files** (deeply nested:
`es/tours/{group day tours,group packages,private day tours,private packages}/<City>/…`). The 25 gap slugs
were **remapped during the tour-system rebuild**, so they don't string-match. Title/keyword inspection shows
**partial real overlap**:

| Sanity gap slug | Likely corpus match | Confidence |
|---|---|---|
| `luxor-2-day-tour-by-plane-from-cairo` | `…/Cairo/02-day-luxor-tour-by-plane-from-cairo.md` | high (same tour, reworded) |
| `mount-sinai-sunrise-trek` | `…/mount-sinai-sunrise-trek-group-day-tour.md` | high |
| `abu-simbel-temples-day-tour` | `…/Aswan/abu-simbel-temples-day-tour-from-aswan.md` | medium (from-Aswan variant) |
| `memphis-saqqara-citadel-khan-tour` | `private-tour-memphis-and-saqqara` / others | low (different composition) |
| `siwa-oasis-adventure-tour` | `desert-horizons-7-day-bahariya-siwa-oasis-tour` | low (different tour) |
| `aswan-and-abu-simbel-from-luxor` ("Majestic Trio") | none obvious | likely void |

→ **Required next step before any tour authoring:** a title-level (not slug-level) reconciliation mapping the
25 Sanity docs to corpus files, classifying each as import (reworded-slug match) vs author (true void).
Authoring the whole 25 now would duplicate human ES/JA copy that already exists under old slugs.

## FAQ — AUTHOR (genuine void)
No `faq` / `frequent` / `pregunta` / `質問` / `よくある` file in either corpus. The 24 entries + 7 categories
have no source ES/JA copy. → author (JA marked AI-draft-for-review). Pairs with the (B) faq.* UI strings.

## Editorial pages — AUTHOR (genuine void)
No `contact` / `hotel-grade` / `responsible` (or ES equivalents) file in either corpus. `Parent pages` only
holds tour-category landings. → author contact, hotel-grade-concept, responsible-travel. (about excluded per scope.)

---

## Recommended Phase-3 order (revised by this check)
1. **Import** hotel (50) + cruise (28) ES name/summary from corpus frontmatter — real copy, fast, additive. *Show samples, STOP.*
2. **Reconcile** the 25 tours by title → split import vs author; only then act.
3. **Author** FAQ (31) — highest visible void.
4. **Author** 22 hotel + 20 cruise ES name/summary voids.
5. **Author** 3 editorial pages.
6. (B) UI strings + remaining tail.
