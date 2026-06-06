# Phase 3 — TOURS re-pick #1 & #7

Branch `feat/localization-sweep`. Importer: `scripts/import-tours-repick.ts` (reuses marked +
htmlToPortableText; additive es/ja; en untouched). Both re-picks found a CLEAR corpus match → imported.

## #1 abu-simbel-temples-day-tour → `private-tour-abu-simble-by-bus-from-aswan` ✅ IMPORTED
Prior (group) candidate rejected for mode. Sanity doc is **private · dayTour · 1d · from Aswan · by road**
(body says "drive"/"from Aswan"). The corpus file is **private · day-tour · from Aswan by desert road
(dawn convoy, afternoon return) · Abu Simbel twin rock-cut temples** — mode + origin + transport + sites + duration all match. es+ja files present.
- es summary: "Una ida y vuelta de siete horas al sur profundo de Egipto que termina en dos templos rupestres que Ramsés II talló…"
- (Not picked: `abu-simble-by-plane-from-aswan` — wrong transport; group `…-from-aswan` — wrong mode.)

## #7 10-days-eternal-egypt-tour → `10-days-unforgettable-egypt-tour` ✅ IMPORTED
Prior (`egypt-and-the-nile-tour`) rejected: it was a **Nile-cruise** route with Saqqara and **no Alexandria**.
The correct match is the **flights-based** 10-day private tour: Cairo/Coptic, **Alexandria** (Mediterranean day),
Giza/pyramids, Luxor (two days, both banks), Aswan + Nubian south, **Abu Simbel round-trip from Aswan**,
internal flights Cairo–Luxor / Aswan–Cairo. **No multi-day cruise** (only an evening *dinner* cruise in Cairo).
Same site-set as Sanity #7's day grid (Cairo · Cairo historic · Alexandria · Giza · Abu Simbel · Aswan · Luxor · West Bank · Cairo spiritual), 10d, private.
- es summary: "Diez días que toman la forma esencial del país —Guiza y el barrio copto, Alejandría sobre el Mediterráneo, los templos de Luxor, el sur nubio y Abu Simbel…"
- (Not picked: `10-day-marvelous-abu-simbel…` — Saqqara/Dahshur + Kom Ombo/Edfu river route, different itinerary.)

## Verification
| slug | enSum | jaSum | en body (untouched) | es body | ja body | es+ja render |
|---|---|---|---|---|---|---|
| abu-simbel-temples-day-tour | ✓ | ✓ | 1 | 28 | 27 | 200/200 |
| 10-days-eternal-egypt-tour | ✓ | ✓ | 11 | 29 | 31 | 200/200 |

0 overwrites; en untouched. **No voids** — both re-picks resolved.

## Tours es+ja summary+body tally
Batch 1: 6 · Batch 2: 3 · Re-pick: **2** = **11 imported**. Still open: #5/#6, #9, #11 (owner decision); #2/#10 (author).
