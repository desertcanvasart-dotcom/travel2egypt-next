# Related-links — APPLY report

_Mode: **COMMIT**. Backup: `backups/migration-staging-20260605-012336.tar.gz`. Eligible fields only (tour.relatedTours, hotel.relatedTours). Published docs with an EMPTY field, re-verified live; existing refs never overwritten._

## tour.relatedTours
- render: RENDERS (SingleTourView L277-284 + PackageView L421-428) → ELIGIBLE
- empty published docs: **228** | proposed: 229 | **written: 228**
- skipped (already populated — NOT overwritten): **1**
- skipped (not published / vanished): 0
- write-targets that ALSO have a draft (divergence risk): **0**
- incidental dropped-destination refs included (flagged, kept per policy): 40
- already-populated (skipped): Sharm El Sheikh Sunset Quad Bike Tour: Desert, Dunes & Bedouin Culture (`wp-page-87637`)
- sample written:
  - **Luxor by Air: A Two-Day Tour from Cairo** (`tour.02-day-luxor-tour-by-plane-from-cairo`) → tour.alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo, tour.transfer-from-cairo-airport-to-hotel, tour.cairo-dinner-cruise-with-belly-dancing-show, tour.nmec-royal-mummies-old-cairo
  - **10-Day Egypt Group Tour: Cairo, the Nile & the Red Sea** (`tour.10-day-egypt-group-tour-cairo-nile-red-sea`) → wp-page-88992, wp-page-87255, wp-page-156539, wp-page-89005
  - **11-Day Egypt Group Tour: Cairo, the Red Sea & the Nile** (`tour.11-day-egypt-group-tour-cairo-red-sea-nile`) → wp-page-89343, wp-page-90450, wp-page-156550, wp-page-113004
  - **Two Days from Luxor to Abu Simbel — With a Night in Between** (`tour.2-day-egypt-s-majestic-trio-aswan-and-abu-simbel-from-luxor`) → wp-page-156421, wp-page-136566, wp-page-88992, tour.10-day-egypt-group-tour-cairo-nile-red-sea
  - **Two Days in the Nubian Desert: A Quiet Retreat near Lake Nasser** (`tour.2-day-nubian-desert-nature-wildlife-retreat`) → tour.4-days-white-desert-wadi-al-hittan-exploration, tour.the-white-desert-and-djara-cave, wp-page-87974, wp-page-89435

## hotel.relatedTours
- render: RENDERS (hotels/[slug]/page.tsx L191-197) → ELIGIBLE
- empty published docs: **78** | proposed: 76 | **written: 76**
- skipped (already populated — NOT overwritten): **0**
- skipped (not published / vanished): 0
- write-targets that ALSO have a draft (divergence risk): **0**
- incidental dropped-destination refs included (flagged, kept per policy): 13
- sample written:
  - **Adrere Amellal Desert Ecolodge, Siwa: No Electricity, No Wi-Fi** (`hotel.adr-re-amellal-ecolodge-siwa`) → wp-page-113521
  - **Al Tabuna Camp, Dakhla Oasis: Rooted in Oasis Food Culture** (`hotel.al-tabuna-camp-dakhla-oasis`) → wp-page-89005
  - **Barcelo Tiran Sharm: 1,100 Metres of Private Beach** (`hotel.barcelo-tiran-sharm-resort`) → wp-page-86867, tour.aqua-park-cleo-park, tour.dahab-blue-hole-desert-snorkel-group-day-tour-from-sharm, tour.dolphin-show-sharm-el-sheikh
  - **Dusit Thani LakeView Cairo: Thai Luxury in New Cairo** (`hotel.dusit-thani-lake-view`) → wp-page-86857, wp-page-87255, wp-page-156539, wp-page-89376
  - **Ghaliet Ecolodge, Siwa: Solar-Powered, Spring-Fed** (`hotel.ghaliet-siwa-ecolodge`) → wp-page-113521

## Cutover audit — incidental dropped-destination tours (kept as targets)

These tours include a dropped stop (Siwa/Bahariya/Fayoum/Wadi-Natrun/Wadi-al-Gadid) as a MINORITY among otherwise-live cities, so they were kept in the target pool and flagged here for the cutover review:

- **Three Days from Alexandria to Siwa — Coast, Desert War, Oracle** (`3-day-siwa-journey-from-alexandria`) — dropped stops: Siwa Oasis of 2 cities
- **8-Day Cairo and Egypt Desert Safari: Pyramids, Oases, and the Western Desert** (`8-day-cairo-and-egypt-desert-safari`) — dropped stops: Bahariya Oasis of 2 cities
- **10-Day Nile and Western Desert Tour: Cairo, the Oases, and Luxor** (`10-day-nile-and-western-desert-tour`) — dropped stops: Bahariya Oasis of 4 cities

> NB: Bahariya & Fayoum are treated as dropped per this session's policy list, which differs from the homepage "Desert & quiet" (kept them live). Reconcile before cutover.