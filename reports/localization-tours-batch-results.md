# Phase 3 — TOURS batch results

Branch `feat/localization-sweep`. Dataset `migration-staging`. Importer: `scripts/import-tours-high.ts`
(reuses `marked` + `htmlToPortableText`; additive es/ja only; en untouched; raw @sanity/client).

## PART A — 6 HIGH-confidence tours IMPORTED ✅

Each: `summary[es]`←es file `description:`, `summary[ja]`←ja file `description:`, `body[es]`/`body[ja]`←corpus
MD body via the canonical MD→HTML→PortableText conversion. Items match existing conventions: summary `{_key,value}`,
body `{_key,_type:'object',value:blocks}`.

| Sanity slug | ← corpus | es body / ja body (blocks) |
|---|---|---|
| mount-sinai-sunrise-trek | mount-sinai-sunrise-trek-group-day-tour | 28 / 13 |
| dendera-and-abydos-temples-tour-from-safaga | dendera-and-abydos-temples-day-tour (Safaga) | 28 / 28 |
| memphis-saqqara-citadel-khan-tour | private-tour-memphis-saqqara-citadel-and-khan-el-khalili-bazaar | 26 / 26 |
| grand-islamic-cairo-day-tour | the-grand-islamic-day-tour | 26 / 26 |
| luxor-2-day-tour-by-plane-from-cairo | 02-day-luxor-tour-by-plane-from-cairo (NOT the reverse) | 24 / 25 |
| snorkeling-sea-trip-in-sharm-el-sheikh | diving-sea-trip-in-sharm-el-sheikh | 27 / 27 |

**Verification**
- Re-query: all 6 have es+ja **summary AND body** populated; **en untouched** (en summary still present; en body block counts unchanged); body items carry `_type:'object'` with valid `block` children; **0 overwrites** (no "already set" skips).
- Rendered all 6 in **es AND ja** → 12/12 HTTP 200; JA pages carry 22k–30k JA chars (localized body renders).
- **snorkelling-not-diving confirmed** (the corpus file is *named* "diving" but the copy is snorkel):
  - **ES:** "Barco privado, guía experto y dos de los mejores sitios de **snorkel** del mar Rojo: el estrecho de Tirán o Ras Mohamed. Un día, sin multitudes."
  - **JA:** "プライベートのボート、熟練のガイド、そして紅海屈指の二つの**シュノーケリング**・スポット——ティラン海峡またはラス・ムハンマド。混雑のない、まる一日。"

## PART B — 11 AMBIGUOUS (read-only; nothing written) — owner decides yes/no per row

Distinguishing body excerpt per candidate. Verdict = my read; **your call.**

| # | Sanity doc (EN, type·dur) | Candidate corpus | Distinguishing detail | Verdict |
|---|---|---|---|---|
| 1 | Majestic Abu Simbel Temples Day Tour (dayTour·1d) | abu-simbel-temples-day-tour-from-aswan | "Excursión **en grupo** a Abu Simbel **desde Asuán**… Cuatro colosos de Ramsés II" | **likely import** if this is the group/from-Aswan day tour; corpus is group-from-Aswan (also exist by-plane / by-bus variants). Confirm mode+origin. |
| 2 | Nile Love Journey — Luxor Aswan (package·**3d**) | 4-days-cruise-from-aswan-to-luxor / 5-day-river-cruise-from-luxor | both are generic Nile cruises (**4d / 5d**); no "Love/romance" framing | **likely AUTHOR** — duration mismatch (3d) + distinct romance angle; different tour. |
| 3 | 18-Day Grand Egypt Holiday Package **from India** (package·18d) | tour-of-egypt | "Gran tour privado de Egipto en **18 días**… Cairo, Nilo, mar Rojo, Sinaí" | **likely import** (same 18-day private grand tour); confirm the India-market itinerary matches. |
| 4 | Unforgettable Bahariya and Siwa Oasis Vacation **from India** (package·7d) | desert-horizons-7-day-bahariya-siwa-oasis-tour | "viaje privado de dos oasis… **7 días**… Desierto Blanco, Gran Mar de Arena, Siwa" | **likely import** (same 7-day two-oasis); confirm India-market variant. |
| 5 | 3 Days – Cairo Highlights **for Friends** (package·3d) | cairo-weekend-city-break-2-nights-3-days | "escapada urbana… **3 días**… meseta faraónica, ciudadela, bazar" | **likely import** (same 3-day Cairo break, "for friends" rebrand). ⚠ see #6. |
| 6 | Cairo in 3 Days — Insider Edition (**Solo Traveller**) (package·3d) | cairo-weekend-city-break-2-nights-3-days | **same file as #5** | **COLLISION** — #5 and #6 both map to the one 3-day Cairo-break corpus file. They're persona rebrands of one base itinerary; decide whether to seed both from it or author the persona variants. |
| 7 | Timeless Wonders: 10-Days Eternal Egypt Tour (package·10d) | egypt-and-the-nile-tour | "Egipto y el Nilo en **10 días**… monumental, fluvial, ciudad medieval" | **likely import** (same 10-day); several 10-day itineraries exist — confirm route parity. |
| 8 | Dolphins Dance Group: Shared Seas Full Day Snorkeling (dayTour·1d) | dolphin-house-shared-snorkeling-day-from-hurghada / giftun-island-shared-snorkeling-day-from-hurghada | dolphin-house = "Sha'ab el-Erg… grupos residentes de **delfines**"; giftun = island reef, no dolphins | **likely import → dolphin-house** ("Dolphins Dance" ⇒ the dolphin/Sha'ab el-Erg trip). Confirm vs Giftun. |
| 9 | Luxor Day Trip from Hurghada: Group Tour of Ancient Sites (dayTour·1d) | safaga-to-luxor-full-day-ancient-city-exploration / luxor-highlights-group-day-tour-from-hurghada | safaga = **private**, from Safaga; hurghada = **group**, from Hurghada | **ambiguous** — slug says "safaga…group", EN title says "Hurghada…group". Title matches `luxor-highlights-group-day-tour-from-hurghada`; the Safaga-private file is likely a *different* Sanity doc. Pick by intended origin/mode. |
| 10 | Cairo to Alexandria: 2-Day Pyramids & Mediterranean (package·**2d**) | alexandria-to-cairo-private-day-tour-… (**1d**) / cairo-alexandria-city-break-5-days (**5d**) | one is a 1-day day-trip, the other a 5-day break | **likely AUTHOR** — no 2-day Cairo↔Alex package in corpus (duration mismatch both ways). |
| 11 | Valley of Kings & Temples Day Tour (dayTour·1d) | the-ultimate-luxor-day-tour / grand-west-bank-group-day-tour-luxor | ultimate = **both banks, private**; west-bank = **VoK/west bank, group** | **ambiguous** — "Valley of Kings & Temples" leans west-bank content but neither is an exact private VoK-only day tour. Pick mode (private vs group) / scope. |

### Suggested split from Part B
- **Likely import (confirm):** #1, #3, #4, #5, #7, #8 (6 rows).
- **Resolve first:** #6 (collision w/ #5), #9 (origin/mode), #11 (mode/scope).
- **Likely author:** #2 (romance 3-day), #10 (2-day Cairo-Alex).

Tell me yes/no (and which candidate) per row and I'll import the approved ones the same additive way.
