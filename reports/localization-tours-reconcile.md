# Phase 3 — TOURS reconciliation (read-only)

Branch `feat/localization-sweep`. The 25 `tour` docs missing **es+ja summary AND body** (titles are
already localized; only summary+body are absent in both locales). Matched Sanity EN/es/ja **title** vs
corpus **title**, confirmed with **body** where close. Corpus: `~/Downloads/All 3 langs/{es,ja}/tours/`
(177 es + 177 ja files, slugs remapped in the rebuild). **No writes.**

Fields each match would fill (all 25): `summary[es]`, `summary[ja]` (← corpus `description:`), `body[es]`,
`body[ja]` (← corpus md body). Conservative: a generic title alone never qualifies as HIGH.

## Counts
| Class | Count |
|---|---|
| HIGH-CONFIDENCE (import) | **6** |
| AMBIGUOUS (owner eye) | **11** |
| GENUINE VOID (author) | **8** |
| **Total** | **25** |

---

## HIGH-CONFIDENCE — import (es+ja both present; title+body confirmed)
| Sanity slug | Sanity EN | → corpus es / ja file (slug stem) | Evidence |
|---|---|---|---|
| mount-sinai-sunrise-trek | Mount Sinai Sunrise Trek | `mount-sinai-sunrise-trek-group-day-tour` | es 0.84; es/ja titles = "Caminata al amanecer…Santa Catalina" / "シナイ山サンライズ"; same slug stem |
| dendera-and-abydos-temples-tour-from-safaga | Dendera and Abydos Temples Tour from Safaga | `dendera-and-abydos-temples-day-tour` [Safaga] | es 0.60 / ja 0.80; same Safaga folder + slug stem |
| memphis-saqqara-citadel-khan-tour | Memphis, Saqqara, Citadel, & Khan El-Khalili | `private-tour-memphis-saqqara-citadel-and-khan-el-khalili-bazaar` | body confirms the **4 sites** (Citadel+Khan, **not** the Dahshur variant) |
| grand-islamic-cairo-day-tour | Islamic Insights: The Grand Islamic Cairo Day Tour | `the-grand-islamic-day-tour` | es 0.64 / ja 0.58; "El gran tour por el Cairo islámico: siete siglos" / "一日で六世紀" |
| luxor-2-day-tour-by-plane-from-cairo | Aerial Odyssey: Luxor 2-Day Tour by Plane from Cairo | `02-day-luxor-tour-by-plane-from-cairo` | body confirms "dos días **desde El Cairo a Luxor**, vuelos internos" (NOT the reverse Cairo-from-Luxor file) |
| snorkeling-sea-trip-in-sharm-el-sheikh | (Exclusive Escape) Private Snorkeling Sea Trip in Sharm El Sheikh | `diving-sea-trip-in-sharm-el-sheikh` | body = "snorkel **privado** en Sharm…Tirán o Ras Mohamed"; diving↔snorkeling rename, same private sea-trip |

> ⚠ Import caveat for `luxor-2-day…`: the naive title-matcher's TOP hit is the **reverse** tour
> (`full-day-trip-to-cairo-by-plane-from-luxor`, 0.80). The correct source is `02-day-luxor-tour-by-plane-from-cairo`.
> Any importer must map by the **explicit corpus slug above**, not by top fuzzy score.

## AMBIGUOUS — needs owner eye (plausible rebrand/duration/variant; do NOT auto-import)
| Sanity slug | Sanity EN | Closest corpus | Why ambiguous |
|---|---|---|---|
| abu-simbel-temples-day-tour | Majestic Abu Simbel Temples Day Tour | `abu-simbel-temples-day-tour-from-aswan` | several Abu Simbel variants (by-plane, by-bus, group, from-Aswan) — which is "the" day tour? |
| nile-love-journey-luxor-aswan | Nile Love Journey — Luxor Aswan | `4-days-cruise-from-aswan-to-luxor` / `5-day-river-cruise-from-luxor` (es 0.71–0.75) | generic Nile cruise; the "Love/romance" framing isn't in any corpus title |
| 18-day-grand-egypt-holiday-package | 18-Day Grand Egypt Holiday Package from India | `tour-of-egypt` ("Gran tour privado de Egipto en 18 días", 0.53) | 18-day duration matches; "from India" market variant — verify itinerary parity |
| bahariya-and-siwa-oasis-vacation | Unforgettable Bahariya and Siwa Oasis Vacation from India | `desert-horizons-7-day-bahariya-siwa-oasis-tour` (0.38) | same two oases; duration & "from India" framing differ |
| 3-days-cairo-highlights-for-friends | 3 Days – Cairo Highlights for Friends | `cairo-weekend-city-break-2-nights-3-days` (0.44) | both 3-day Cairo; "for friends" is a segment rebrand — confirm same itinerary |
| cairo-in-3-days-insider-edition-solo-traveller | Cairo in 3 Days — Insider Edition (Solo Traveller) | (3-day Cairo break, weak ≤0.53) | "insider/solo" branding; no clear 1:1 corpus file |
| 10-days-eternal-egypt-tour | Timeless Wonders: 10-Days Eternal Egypt Tour | `egypt-and-the-nile-tour` ("…Egipto y el Nilo en 10 días", 0.42) | 10-day match but several 10-day itineraries; needs itinerary check |
| shared-seas-full-day-snorkeling-tour | Dolphins Dance Group: Shared Seas Full Day Snorkeling (Hurghada) | `dolphin-house-shared-snorkeling-day-from-hurghada` / `giftun-island-shared-snorkeling…` | multiple Hurghada shared-snorkeling variants; "Dolphins Dance/Shared Seas" branding unmatched |
| safaga-to-luxor-full-day-group-ancient-city-adventure | Luxor Day Trip from Hurghada: Group Tour of Ancient Sites | `safaga-to-luxor-full-day-ancient-city-exploration` / `luxor-highlights-group-day-tour-from-hurghada` | slug says Safaga, EN title says Hurghada; multiple Luxor-from-coast variants |
| 2-day-pyramids-mediterranean-tour | Cairo to Alexandria: 2-Day Pyramids & Mediterranean Tour | (Cairo↔Alex **day** tours; no clean 2-day package) | corpus has Alexandria day-tours, not a 2-day Cairo-Alex package |
| private-tour-valley-of-kings-temples-day-tour | Valley of Kings & Temples Day Tour | (`the-ultimate-luxor-day-tour` / west-bank tours, ≤0.42) | no exact "Valley of Kings day tour"; may overlap a Luxor west-bank tour |

## GENUINE VOID — author (no corpus match; top scores low / different tour)
| Sanity slug | Sanity EN | Note |
|---|---|---|
| aswan-and-abu-simbel-from-luxor | 2-Day Egypt's Majestic Trio: Aswan and Abu Simbel from Luxor | no 2-day Luxor→Aswan+Abu Simbel package in corpus (top is an 8-day tour) |
| siwa-oasis-adventure-tour | 3-Day Enchanting Siwa Oasis Adventure Tour | only a 7-day Bahariya+Siwa exists |
| 2-day-desert-nature-wildlife-retreat | 2-Day Nubian Desert Nature & Wildlife Retreat | es 0.00 — no match (title not even localized in Sanity) |
| sunrise-hot-air-balloon-ride-over-luxors-ancient-landmarks | Sunrise Hot-Air Balloon Ride over Luxor's Ancient Landmarks | no balloon tour in corpus |
| ramasside-tours | Ramasside Tours: Desert Adventure & Snorkeling Experience | no "Ramasside" match |
| 5-days-cairo-luxor-romance-edition | 5 Days – Cairo Luxor Romance Edition | only generic multi-day Cairo+Luxor; no romance edition |
| private-tour-2-days-1-night-trip-to-saint-catherine-from-cairo | Mount Sinai Pilgrimage: 2-Day Trip to Saint Catherine from Cairo | corpus St Catherine tours are Sharm-based day trips, not a 2-day-from-Cairo package |
| private-tour-2-day-trip-to-bahariya-oasis | Desert Oasis: 2-Day Bahariya Oasis Private Tour From Cairo | corpus desert safaris are 5–8 day; no clean 2-day Bahariya |

---

## Recommendation
1. **Import the 6 HIGH** (es+ja summary+body) using the explicit corpus slugs above — additive, same guards
   as the hotel/cruise batches. (Note the luxor-2-day reverse-file caveat.)
2. **Owner review the 11 AMBIGUOUS** — most look like rebrands/duration variants; a quick yes/no per row turns
   several into imports.
3. **Author the 8 VOID** in the AI-draft batch (re-authored es + ja; JA marked for human review). These are the
   genuinely new/renamed tours with no source copy.

No writes performed.
