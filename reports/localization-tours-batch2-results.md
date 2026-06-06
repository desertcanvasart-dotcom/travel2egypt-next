# Phase 3 — TOURS batch 2 (body-confirm + import)

Branch `feat/localization-sweep`. Importer: `scripts/import-tours-high2.ts` (reuses marked + htmlToPortableText;
additive es/ja; en untouched; raw client). Body-confirmed each candidate against the Sanity EN body/day-grid first.

## PART A — body-confirm results

### Imported (3) ✅ — body clearly confirms same tour
| # | Sanity slug | ← corpus | confirmation | es/ja body blocks |
|---|---|---|---|---|
| #3 | 18-day-grand-egypt-holiday-package | tour-of-egypt | Day grid matches: Cairo/Coptic+citadel → Abu Simbel → Nile cruise (Kom Ombo/Edfu) → 3d Hurghada → ferry to Sharm → St Catherine. Both **18d private**. | 34 / 36 |
| #4 | bahariya-and-siwa-oasis-vacation | desert-horizons-7-day-bahariya-siwa-oasis-tour | Both **7d private** two-oasis: White Desert, Great Sand Sea, Siwa. | 34 / 36 |
| #8 | shared-seas-full-day-snorkeling-tour | dolphin-house-shared-snorkeling-day-from-hurghada | Both **shared/group**, Hurghada, **Dolphin House / Sha'ab El Erg**, spinner dolphins, snorkelling. | 25 / 12 |

**Verification:** all 3 have es+ja **summary+body**; **en untouched** (en body blocks unchanged: 18-day=21, bahariya=3, shared-seas=1); **0 overwrites**; es+ja render **6/6 → 200**. Imported es summaries:
- **#3:** "Dieciocho días con todo el país: el barrio copto y la ciudadela, Abu Simbel y el crucero por el Nilo, tres días en Hurghada y el mar Rojo, el ferry al…"
- **#4:** "Un viaje privado de siete días desde El Cairo hasta el oeste profundo de Egipto —el Desierto Blanco, el Gran Mar de Arena y la ciudad-oasis donde Alej…"
- **#8:** "Jornada compartida en yate hacia Sha'ab el-Erg — la laguna arrecifal al noreste de Hurghada conocida por sus grupos residentes de delfines tornillo…"

### NOT imported — body discrepancy (flagged)
| # | Sanity slug | candidate | Discrepancy → why not imported |
|---|---|---|---|
| #1 | abu-simbel-temples-day-tour (**private**) | abu-simbel-temples-day-tour-from-aswan | Corpus is **"shared-departure"/group** from Aswan; Sanity is **private**. Same site, **mode mismatch**. A private Abu Simbel corpus file likely exists separately (`private-tour-abu-simble-by-bus-from-aswan` / `abu-simble-by-plane-from-aswan`) — needs owner pick. |
| #7 | 10-days-eternal-egypt-tour | egypt-and-the-nile-tour | **Different 10-day itinerary.** Sanity grid includes **Alexandria (D3)** and **no Nile cruise**; corpus is a **Nile-cruise** itinerary (Edfu/Kom Ombo river days) with **Saqqara, no Alexandria**. Not the same tour. |

## PART B — conflicts (read-only; for owner decision; nothing written)

### #5 / #6 — two Sanity docs share ONE 3-day Cairo corpus file
**Corpus `cairo-weekend-city-break-2-nights-3-days`** — *"Cairo Weekend City Break: 3 Days in the Egyptian Capital… the Giza plateau, the oldest pyramid at Saqqara, the medieval citadel and bazaar… a city break, not a country tour."* (neutral, no persona)

| Sanity doc | EN title | summary angle |
|---|---|---|
| #5 `3-days-cairo-highlights-for-friends` (package·3d·private) | 3 Days – Cairo Highlights for Friends | "…long weekend **with friends**… Great Pyramids, buzzing bazaar…" |
| #6 `cairo-in-3-days-insider-edition-solo-traveller` (package·3d·private) | Cairo in 3 Days — Insider Edition (Solo Traveller) | "…designed with the **solo traveller** in mind…" |

**Read:** Both Sanity products are the **same 3-day private Cairo itinerary** (Giza, Saqqara, citadel, bazaar) differentiated **only by audience persona** (friends vs solo) — not distinct itineraries, not exact duplicates. The corpus has one neutral version.
**Owner decision:** (a) seed **both** es/ja body from the one corpus file (identical body for both — fine since the itinerary is identical, loses persona flavour); (b) author persona-specific es/ja for each; (c) import one, author the other.

### #9 — origin + mode conflict
**Sanity `safaga-to-luxor-full-day-group-ancient-city-adventure`** [dayTour·1d·**group**] — internally mixed: EN **title** "Luxor Day Trip **from Hurghada**… Group Tour"; **slug/summary** "**Safaga** to Luxor… Group."

| Corpus candidate | origin | mode | sites |
|---|---|---|---|
| safaga-to-luxor-full-day-ancient-city-exploration | **Safaga** port | (not group) | Karnak, Luxor Temple, VoK, Hatshepsut, Colossi |
| luxor-highlights-group-day-tour-from-hurghada | **Hurghada** | **shared/group** | Karnak, Luxor Temple, VoK, Valley of Queens/Nefertari, Colossi, Hatshepsut |

**Read:** By **mode (group)** + EN title (Hurghada), the match is **`luxor-highlights-group-day-tour-from-hurghada`**. The Safaga file matches the slug/summary wording but is a different origin (and likely a separate private doc). **Owner decision:** confirm intended **origin (Safaga vs Hurghada)** and that this is the **group** product → then it maps to the Hurghada group file.

### #11 — Valley of Kings: scope vs mode
**Sanity `private-tour-valley-of-kings-temples-day-tour`** [dayTour·1d·**private**] — "Luxor's **West Bank**… pharaonic…"

| Corpus candidate | mode | scope |
|---|---|---|
| the-ultimate-luxor-day-tour | private | **Both banks** — Karnak (east) → Valley of the Kings (west); "six monuments" |
| grand-west-bank-group-day-tour-luxor | **group** | **West Bank only** — VoK (3 tombs), Valley of Queens/Nefertari, Colossi, Hatshepsut, Medinet Habu |

**Read:** Neither is clean. `the-ultimate-luxor-day-tour` matches **mode (private)** but scope is **both banks** (Sanity is West-Bank-focused). `grand-west-bank…` matches **scope (West Bank)** but is **group** (Sanity is private). **Owner decision:** accept the private/both-banks file, the west-bank/group file, or author a private West-Bank version.

## #2 + #10 — flagged for authoring (no action taken)
- **#2 nile-love-journey-luxor-aswan** (3-day romance) — corpus only has 4/5-day generic cruises; author.
- **#10 2-day-pyramids-mediterranean-tour** (2-day Cairo↔Alexandria) — corpus only has 1-day day-trip or 5-day break; author.

## Running tally (tours es+ja summary+body)
Batch 1: 6 imported · Batch 2: **3 imported** (#3,#4,#8) · still open: #1,#7 (re-pick candidate), #5/#6/#9/#11 (owner decision), #2/#10 (author).
