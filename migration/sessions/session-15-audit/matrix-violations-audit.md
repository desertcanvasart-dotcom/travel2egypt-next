# Matrix Violations Audit — Session 15

## Operator action required

Per-doc decision on **48 group day tours** assigned to cities outside the 6-city allowed set. Each is a candidate for: keep as group, reclassify to `tourMode: 'private'`, or unpublish.

## Background

Operator matrix:
- **Group day tours** allowed in 6 cities: Aswan, Cairo, Hurghada, Luxor, Marsa Alam, Sharm El-Sheikh.
- **Private day tours** allowed in 9 cities (the 6 above + Al-Gouna, Alexandria, Safaga).
- **Packages** bypass matrix entirely.

The mapper assigns `tourMode: 'group'` for any non-private-car-and-guide day tour slug. Many WP-source group tours visit cities outside the operator's group-departure allowed set.

## Note on detection coverage

The `migration.matrixViolation` field was added to the mapper at commit f69b251 (after Batch 1 dayTour imports landed via ee0fb13). All 117 dayTours in migration-staging therefore have `matrixViolation: null` from the import path — detection never ran on them.

This audit was computed **retroactively** by re-applying `detectMatrixViolation` logic to every `dayTour && tourMode='group'` doc (114 candidates) using the cities[] refs already in Sanity. Findings: **48 violations** across **23** unique non-allowed cities.

If you want the matrixViolation meta backfilled in Sanity for these 48, that's a one-shot patch script (similar shape to `scripts/reclassify-batch-1-audit.ts`). Tracked in data-quality-gaps-audit.md.

## Violations by destination city (top 10)

| city | violations |
|---|---|
| giza | 7 |
| edfu | 6 |
| alexandria | 6 |
| safaga | 4 |
| abu-simbel | 4 |
| kom-ombo | 4 |
| esna | 4 |
| al-fayoum | 3 |
| siwa-oasis | 3 |
| al-gouna | 2 |

## Full violation list

| _id | slug | violating cities | all cities |
|---|---|---|---|
| `wp-page-110952` | `the-giza-sound-and-light-show-experience` | giza | giza |
| `wp-page-113193` | `aswan-to-el-kab-and-edfu-temple-tour` | edfu | aswan, edfu |
| `wp-page-113456` | `day-tour-to-visit-cairo-from-alexandria` | alexandria | cairo, alexandria |
| `wp-page-115614` | `safaga-to-luxor-full-day-group-ancient-city-adventure` | safaga | safaga, luxor |
| `wp-page-118521` | `memphis-saqqara-dahshur-tour-from-alexandria` | alexandria | alexandria |
| `wp-page-118678` | `cairo-day-tour-from-alexandria` | alexandria | cairo, alexandria |
| `wp-page-121250` | `safaga-to-luxor-full-day-ancient-city-exploration` | safaga | safaga, luxor |
| `wp-page-145857` | `group-day-trip-to-cairo-from-safaga` | safaga | cairo, safaga |
| `wp-page-145867` | `group-day-tour-to-cairo-from-al-gouna` | al-gouna | cairo, al-gouna |
| `wp-page-156014` | `fayoum-desert-adventure` | al-fayoum | al-fayoum |
| `wp-page-238599` | `desert-oasis-siwa-retreat-solo-traveller` | siwa-oasis | siwa-oasis |
| `wp-page-239597` | `pyramids-of-giza-and-grand-egyptian-museum` | giza | giza |
| `wp-page-57833` | `top-tours-in-abu-simbel` | abu-simbel | abu-simbel |
| `wp-page-58751` | `top-tours-in-al-wadi-al-gadid` | al-wadi-al-gadid | al-wadi-al-gadid |
| `wp-page-59421` | `private-tours-in-dahab` | dahab | dahab |
| `wp-page-59589` | `private-tours-in-edfu` | edfu | edfu |
| `wp-page-59658` | `off-road-from-farafra-to-dakhla` | farafra-oasis, dakhla-oasis | farafra-oasis, dakhla-oasis |
| `wp-page-59741` | `top-tours-in-kharga-oasis` | kharga-oasis | kharga-oasis |
| `wp-page-60079` | `top-tours-in-giza` | giza | giza |
| `wp-page-60302` | `nuweiba-tour-packages` | nuweiba | nuweiba |
| `wp-page-60334` | `top-tours-in-qena` | qena | qena |
| `wp-page-60352` | `private-tours-in-port-said` | port-said | port-said |
| `wp-page-60538` | `sohag-tour-packages` | sohag | sohag |
| `wp-page-60562` | `cultural-tours-in-suez` | suez | suez |
| `wp-page-60584` | `cultural-tours-in-taba` | taba | taba |
| `wp-page-64105` | `taziry-ecolodge-siwa-safari-paradise` | siwa-oasis | siwa-oasis |
| `wp-page-75623` | `siwa-tour-packages` | siwa-oasis | siwa-oasis |
| `wp-page-87273` | `luxor-day-tour-from-al-gouna` | al-gouna | luxor, al-gouna |
| `wp-page-87309` | `private-tour-alexandria-day-tour` | alexandria | alexandria |
| `wp-page-87460` | `abu-simbel-temples-day-tour` | abu-simbel | abu-simbel |
| `wp-page-87484` | `group-day-tour-to-kom-ombo-and-edfu-temples-from-aswan` | kom-ombo, edfu | kom-ombo, edfu, aswan |
| `wp-page-87510` | `esna-edfu-kom-ombo-day-tour` | esna, edfu, kom-ombo | esna, edfu, kom-ombo |
| `wp-page-87558` | `dendera-and-abydos-temples-tour-from-safaga` | safaga | safaga |
| `wp-page-87761` | `minya-day-tour` | al-minya | al-minya |
| `wp-page-87765` | `pyramids-of-giza-sphinx-memphis-and-saqqara-tour` | giza | giza |
| `wp-page-87766` | `pyramids-of-giza-sphinx-egyptian-museum-khan-el-khalili-tour` | giza | giza |
| `wp-page-87829` | `giza-pyramids-the-citadel-cairo-bazaar-day-tour` | giza | giza, cairo |
| `wp-page-87835` | `fayoum-oasis-including-pyramids-of-meydum-hawara` | al-fayoum | al-fayoum |
| `wp-page-88093` | `pyramids-of-giza-and-sphinx` | giza | giza |
| `wp-page-88108` | `alexandria-day-tour` | alexandria | alexandria |
| `wp-page-88109` | `fayoum-oasis-and-beni-suef-pyramids-tour` | al-fayoum, beni-suef | al-fayoum, beni-suef |
| `wp-page-88167` | `esna-temple-and-el-kab-day-tour-from-luxor` | esna | esna, luxor |
| `wp-page-88179` | `day-tour-to-esna-edfu-kom-ombo-from-luxor` | esna, edfu, kom-ombo | esna, edfu, kom-ombo, luxor |
| `wp-page-88427` | `private-tour-day-tour-to-alexandria-from-cairo` | alexandria | alexandria, cairo |
| `wp-page-88483` | `el-kab-and-esna-temple-day-tour-from-aswan` | esna | esna, aswan |
| `wp-page-88502` | `abu-simbel-car-day-tour-from-aswan` | abu-simbel | abu-simbel, aswan |
| `wp-page-88607` | `abu-simbel-by-plane-from-aswan` | abu-simbel | abu-simbel, aswan |
| `wp-page-88609` | `kom-ombo-and-edfu-temples-day-tour-from-aswan` | kom-ombo, edfu | kom-ombo, edfu, aswan |

## Pattern guide for operator triage

| Pattern | Likely operator action |
|---|---|
| Visits Giza only (Pyramids tour) | Probably keep as group — Giza is operationally part of Cairo |
| Visits Edfu/Kom Ombo/Esna/Abu Simbel | Often Nile-cruise day-trip stops between Aswan/Luxor — package candidate? |
| Visits Alexandria as full-day from Cairo | Reclassify to `private` — Alexandria isn't a group-departure city |
| Visits Safaga / Al-Gouna (port departures) | Reclassify to `private` — port-side dispatching, not group |
| Visits Siwa / Bahariya / Farafra / Dakhla / Kharga | Usually multi-day; consider re-typing to `package` |

## Packages — 0 violations expected

By design: `detectMatrixViolation` returns null when `type !== 'dayTour'`. No package can violate the matrix. Verified: 0 matrix violations on the 105 packages in migration-staging.
