# Product extraction — review batches

**Batch order.** The spec asks for last-90-days pageviews from GA4 or server logs. Neither is reachable from this environment (no GA4 Data API credentials; Railway request logs are not exported), so batches 2+ are ordered by a stand-in: the number of other published documents that link to the product (internal links, Sanity references), highest first, then by slug. Re-order once pageview data is available.

**Batch 1** (17): the homepage products — epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs, 10-days-nile-dreamer-tour-experience, 10-day-egypt-travel-journey-through-history, 9-day-classic-egypt-family-adventure, 10-day-nile-and-western-desert-tour, 4-day-history-culture-escape, pyramids-of-giza-and-grand-egyptian-museum, private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara, pyramids-of-giza-and-sphinx-group-day-tour, day-tour-to-karnak-luxor-temples-luxor-museum, grand-west-bank-group-day-tour-luxor, skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience, private-tour-abu-simble-by-bus-from-aswan, nubian-temples-day-tour-from-aswan, aswan-felucca-adventure, 2-day-pyramids-mediterranean-tour, alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo.

## Batch 02 (30)

| # | slug | type | inbound links |
|---|---|---|---|
| 1 | cairo-dinner-cruise-with-belly-dancing-show | day tour | 50 |
| 2 | esna-temple-and-el-kab-day-tour-from-luxor | day tour | 36 |
| 3 | islamic-cairo-day-tour | day tour | 33 |
| 4 | nmec-royal-mummies-old-cairo | day tour | 33 |
| 5 | esna-edfu-kom-ombo-temples-group-day-tour-from-luxor | day tour | 31 |
| 6 | 10-days-unforgettable-egypt-tour | package | 30 |
| 7 | the-egypt-royal-vacation-tour | package | 29 |
| 8 | pyramids-of-giza-and-sphinx | day tour | 27 |
| 9 | dendera-and-abydos-temples-from-luxor | day tour | 26 |
| 10 | abu-simbel-temples-day-tour-from-aswan | day tour | 23 |
| 11 | abu-simble-by-plane-from-aswan | day tour | 21 |
| 12 | 8-day-cairo-and-egypt-desert-safari | package | 20 |
| 13 | private-tour-full-day-to-grand-west-bank | day tour | 20 |
| 14 | 10-days-felucca-journey-through-egypt | package | 19 |
| 15 | 8-days-ultimate-trip-to-sharm-el-sheikh | package | 17 |
| 16 | 10-days-the-splendid-minya-tour | package | 13 |
| 17 | private-tour-alexandria-day-tour | day tour | 13 |
| 18 | 15-day-luxor-nile-cruise-vacation | package | 12 |
| 19 | 11-day-cairo-and-nile-cruise-round-trip | package | 11 |
| 20 | 11-day-egypt-tour-of-history-adventure-relaxation | package | 11 |
| 21 | 14-night-nile-cruise-and-hurghada-stay | package | 11 |
| 22 | sunrise-hot-air-balloon-ride-over-luxors-ancient-landmarks | day tour | 11 |
| 23 | white-desert-wonders-4-day-cairo-and-white-desert-tour | package | 11 |
| 24 | 9-day-egypt-bird-watching-adventure | package | 10 |
| 25 | cairo-and-alexandria-4-days-family-package | package | 10 |
| 26 | private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar | day tour | 10 |
| 27 | alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili | day tour | 9 |
| 28 | luxor-personalized-vacation | package | 9 |
| 29 | private-day-trip-to-memphis-saqqara-and-dahshur-from-alexandria | day tour | 9 |
| 30 | private-tour-2-day-trip-to-alexandria-from-cairo | day tour | 9 |

## Batch 03 (30)

| # | slug | type | inbound links |
|---|---|---|---|
| 1 | 14-day-egypt-luxury-family-holiday | package | 8 |
| 2 | 3-day-siwa-journey-from-alexandria | package | 8 |
| 3 | 4-days-city-break | package | 8 |
| 4 | cairo-and-nile-cruise-tour | package | 8 |
| 5 | 7-days-luxury-dahabiya-cruise-on-the-nile | package | 7 |
| 6 | private-tour-memphis-saqqara-and-dahshur | day tour | 7 |
| 7 | 11-day-egypt-group-tour-cairo-red-sea-nile | package | 6 |
| 8 | 15-day-nile-cruise-and-hurghada-tour | package | 6 |
| 9 | 7-days-dahabiya-nile-cruise-from-aswan-to-luxor | package | 6 |
| 10 | 7-days-luxury-dahabiya-nile-cruise | package | 6 |
| 11 | 8-day-luxor-to-luxor-cruise | package | 6 |
| 12 | a-9-day-egypt-tour-of-culture-and-history | package | 6 |
| 13 | aswan-and-abu-simbel-from-luxor | package | 6 |
| 14 | memphis-saqqara-and-dahshur-group-day-tour | day tour | 6 |
| 15 | memphis-saqqara-citadel-khan-tour | day tour | 6 |
| 16 | private-tour-2-days-1-night-trip-to-saint-catherine-from-cairo | package | 6 |
| 17 | 15-day-ultimate-nile-cruise-from-cairo-to-aswan | package | 5 |
| 18 | 4-days-cruise-from-aswan-to-luxor | package | 5 |
| 19 | 5-day-lake-nasser-cruise-from-aswan | package | 5 |
| 20 | 7-days-of-splendor-exploring-the-nile-on-a-roman-dahabiya | package | 5 |
| 21 | 8-day-egypt-golf-tour | package | 5 |
| 22 | day-tour-to-esna-edfu-kom-ombo-from-luxor | day tour | 5 |
| 23 | egyptian-museum-and-bazaar-tour | day tour | 5 |
| 24 | fayoum-oasis-including-pyramids-of-meydum-hawara | day tour | 5 |
| 25 | overnight-sataya-dolphin-reef-safari | package | 5 |
| 26 | private-tour-aswan-bird-watching-tour | day tour | 5 |
| 27 | private-tour-karnak-temple-luxor-temple | day tour | 5 |
| 28 | the-elegant-cairo-4-days-tour | package | 5 |
| 29 | 11-day-explore-egypt-and-red-sea-tour | package | 4 |
| 30 | 4-days-white-desert-wadi-al-hittan-exploration | package | 4 |

## Batch 04 (30)

| # | slug | type | inbound links |
|---|---|---|---|
| 1 | 7-days-in-egypt-pyramids-temples-and-timeless-wonders | package | 4 |
| 2 | aswan-private-car-and-guide | day tour | 4 |
| 3 | cairo-alexandria-city-break-5-days | package | 4 |
| 4 | egyptian-museum-citadel-and-khan-el-khalili-bazaar | day tour | 4 |
| 5 | nubian-life-private-nubian-village-and-nile-tour-with-motor-boat | day tour | 4 |
| 6 | the-white-desert-and-djara-cave | package | 4 |
| 7 | 4-days-lake-nasser-cruise-from-abu-simbel | package | 3 |
| 8 | 8-days-egypt-panorama-tour | package | 3 |
| 9 | adelaide-dahabiya-nile-cruise | package | 3 |
| 10 | aswan-full-day-city-tour | day tour | 3 |
| 11 | aswan-personalized-vacation | package | 3 |
| 12 | cairo-weekend-city-break-2-nights-3-days | package | 3 |
| 13 | egypt-and-the-nile-tour | package | 3 |
| 14 | egypt-and-the-red-sea-paradise | package | 3 |
| 15 | el-kab-and-esna-temple-day-tour-from-aswan | day tour | 3 |
| 16 | essential-egypt | package | 3 |
| 17 | full-day-trip-to-cairo-by-plane-from-luxor | day tour | 3 |
| 18 | giza-pyramids-the-citadel-cairo-bazaar-day-tour | day tour | 3 |
| 19 | private-tour-sound-light-show-at-philae-temple | day tour | 3 |
| 20 | private-tour-the-grand-old-cairo-tour | day tour | 3 |
| 21 | the-giza-sound-and-light-show-experience | day tour | 3 |
| 22 | the-grand-islamic-day-tour | day tour | 3 |
| 23 | the-great-pharaohs-and-white-desert | package | 3 |
| 24 | tour-of-egypt | package | 3 |
| 25 | 10-day-egypt-group-tour-cairo-nile-red-sea | package | 2 |
| 26 | 10-day-marvelous-abu-simbel-ancient-egypt-tour | package | 2 |
| 27 | 11-day-nile-cruise-from-luxor-to-cairo | package | 2 |
| 28 | 13-day-impressive-egypt-tour | package | 2 |
| 29 | 14-day-long-nile-cruise-aswan-cairo | package | 2 |
| 30 | 2-day-tour-to-al-minya-from-cairo | package | 2 |

## Batch 05 (30)

| # | slug | type | inbound links |
|---|---|---|---|
| 1 | 3-day-nubian-fishing-safari | package | 2 |
| 2 | 4-day-ultimate-lake-nasser-experience | package | 2 |
| 3 | 5-day-river-cruise-from-luxor | package | 2 |
| 4 | cairo-and-nile-cruise-8-day-family-package | package | 2 |
| 5 | fayoum-desert-adventure | day tour | 2 |
| 6 | kom-ombo-and-edfu-temples-day-tour-from-aswan | day tour | 2 |
| 7 | luxor-2-day-tour-by-plane-from-cairo | package | 2 |
| 8 | marriott-mena-house-4-days-stay | package | 2 |
| 9 | nubian-museum-local-market-tour-in-aswan | day tour | 2 |
| 10 | private-tour-day-tour-to-alexandria-from-cairo | day tour | 2 |
| 11 | secret-sanctuaries-13-day-mysterious-oases-and-the-nile-tour | package | 2 |
| 12 | the-holy-family-trip-in-egypt | package | 2 |
| 13 | the-pearl-of-red-sea-hurghada | package | 2 |
| 14 | the-romantic-egypt-tour | package | 2 |
| 15 | the-ultimate-luxor-day-tour | day tour | 2 |
| 16 | 10-days-eternal-egypt-tour | package | 1 |
| 17 | 11-day-the-splendor-of-egypt-tour | package | 1 |
| 18 | 12-day-amazing-family-vacation-in-egypt | package | 1 |
| 19 | 12-day-egypt-group-tour-cairo-dahabiya-red-sea | package | 1 |
| 20 | 13-day-nile-cruise-from-cairo-to-luxor | package | 1 |
| 21 | 5-day-the-obeiyed-cave-safari-tour | package | 1 |
| 22 | 8-days-best-of-egypt-tour-package | package | 1 |
| 23 | 9-days-egypt-prestigious-vacation | package | 1 |
| 24 | aswan-to-el-kab-and-edfu-temple-tour | day tour | 1 |
| 25 | cairo-private-car-and-guide | day tour | 1 |
| 26 | full-day-trip-to-luxor-by-plane-from-cairo | day tour | 1 |
| 27 | luxor-private-car-and-guide | day tour | 1 |
| 28 | mount-sinai-pilgrimage-2-day-trip-to-saint-catherine-from-cairo | package | 1 |
| 29 | private-tour-local-market-with-horse-carriage | day tour | 1 |
| 30 | private-tour-memphis-and-saqqara | day tour | 1 |

## Batch 06 (18)

| # | slug | type | inbound links |
|---|---|---|---|
| 1 | private-tour-memphis-saqqara-citadel-and-khan-el-khalili-bazaar | day tour | 1 |
| 2 | sound-light-show-at-karnak-temple-in-luxor | day tour | 1 |
| 3 | 02-day-luxor-tour-by-plane-from-cairo | package | 0 |
| 4 | 2-day-egypt-s-majestic-trio-aswan-and-abu-simbel-from-luxor | package | 0 |
| 5 | 2-day-nubian-desert-nature-wildlife-retreat | package | 0 |
| 6 | 3-day-bahariya-white-desert-tour | package | 0 |
| 7 | 7-days-luxor-to-aswan-dahabiya-cruise | package | 0 |
| 8 | 9-day-egypt-group-tour-cairo-abu-simbel-nile | package | 0 |
| 9 | agatha-dahabiya-journey-along-the-nile | package | 0 |
| 10 | bahariya-and-siwa-oasis-vacation | package | 0 |
| 11 | cairo-sky-adventure | day tour | 0 |
| 12 | desert-horizons-7-day-bahariya-siwa-oasis-tour | package | 0 |
| 13 | desert-oasis-2-day-bahariya-oasis-private-tour-from-cairo | package | 0 |
| 14 | fayoum-meidum-hawara-pyramids-group-day-tour | day tour | 0 |
| 15 | minya-day-tour | day tour | 0 |
| 16 | private-tour-2-day-trip-to-bahariya-oasis | package | 0 |
| 17 | siwa-oasis-adventure-tour | package | 0 |
| 18 | sufi-dance-tanoura-show-in-the-wikala-of-el-ghoury | day tour | 0 |

## Excluded from the batches (55) — Red Sea excursions and airport transfers

| slug | why |
|---|---|
| 4wd-desert-safari-dinner-and-show-from-hurghada | Red Sea excursion |
| aqua-park-cleo-park | Red Sea excursion |
| aswan-airport-transfer | airport transfer |
| aswan-city-tour-from-marsa-alam | Red Sea excursion |
| cairo-by-bus-group-day-tour-from-hurghada | Red Sea excursion |
| dahab-blue-hole-desert-snorkel-group-day-tour-from-sharm | Red Sea excursion |
| dendera-and-abydos-temple-day-tour-from-hurghada | Red Sea excursion |
| dendera-and-abydos-temples-day-tour | Red Sea excursion |
| dendera-and-abydos-temples-from-al-gouna | Red Sea excursion |
| desert-quad-bike-safari-to-bedouin-village-from-hurghada | Red Sea excursion |
| diving-sea-trip-in-sharm-el-sheikh | Red Sea excursion |
| dolphin-full-day-snorkeling-tour-from-hurghada | Red Sea excursion |
| dolphin-house-shared-snorkeling-day-from-hurghada | Red Sea excursion |
| dolphin-show-sharm-el-sheikh | Red Sea excursion |
| dolphins-dance-group-shared-seas-full-day-snorkeling-tour | Red Sea excursion |
| exclusive-chartered-experience-private-boat-journey-to-orange-bay | Red Sea excursion |
| full-day-trip-to-cairo-by-plane-from-hurghada | Red Sea excursion |
| full-day-trip-to-cairo-by-plane-from-sharm-el-sheikh | Red Sea excursion |
| gateway-to-the-past-luxor-airport-transfer | airport transfer |
| giftun-island-shared-snorkeling-day-from-hurghada | Red Sea excursion |
| giftun-island-snorkeling-day-trip-from-hurghada | Red Sea excursion |
| group-snorkeling-adventure-in-marsa-alam | Red Sea excursion |
| hurghada-airport-transfer | airport transfer |
| hurghada-dolphin-show-tickets-and-transfer-from-hurghada | airport transfer |
| hurghada-quad-bike-tour | Red Sea excursion |
| jerusalem-dead-sea-bethlehem-group-day-tour-from-sharm | Red Sea excursion |
| luxor-day-tour-from-al-gouna | Red Sea excursion |
| luxor-day-tour-from-hurghadafull-day | Red Sea excursion |
| luxor-full-day-excursion-from-marsa-alam | Red Sea excursion |
| luxor-highlights-group-day-tour-from-hurghada | Red Sea excursion |
| marsa-alam-to-cairo-full-day-tour-by-plane | Red Sea excursion |
| mount-sinai-and-st-catherine-full-day-tour-from-sharm | Red Sea excursion |
| mount-sinai-sunrise-trek-group-day-tour | Red Sea excursion |
| nefertari-submarine-adventure-and-sunset-dinner-cruise-from-marsa-alam | Red Sea excursion |
| private-tour-transfer-from-aswan-to-luxor-by-bus | airport transfer |
| private-tour-transfer-from-hurghada-to-luxor | airport transfer |
| private-tour-transfer-from-luxor-to-aswan-by-bus | airport transfer |
| private-tour-transfer-from-luxor-to-hurghada-by-bus | airport transfer |
| private-tour-transfer-from-luxor-to-marsa-alam-by-car | airport transfer |
| quad-bike-tour-at-sunset-sharm-el-sheikh | Red Sea excursion |
| ramasside-tours | Red Sea excursion |
| ramasside-tours-desert-adventure-snorkeling-experience | Red Sea excursion |
| royal-sea-scope | Red Sea excursion |
| royal-seascope-submarine-hurghada | Red Sea excursion |
| sacred-sands-unveiling-dendera-and-abydos-from-hurghada | Red Sea excursion |
| safaga-to-luxor-full-day-ancient-city-exploration | Red Sea excursion |
| safaga-to-luxor-full-day-group-ancient-city-adventure | Red Sea excursion |
| sataya-reef-marsa-alam-dolphin-house | Red Sea excursion |
| semi-submarine-adventure-in-marsa-alam | Red Sea excursion |
| sharm-el-sheikh-airport-transfer | airport transfer |
| sindbad-submarine-red-sea-tour-from-hurghada | Red Sea excursion |
| snorkeling-adventure-on-the-nefertari-submarine | Red Sea excursion |
| swimming-with-dolphins | Red Sea excursion |
| transfer-from-cairo-airport-to-hotel | airport transfer |
| transfer-from-hotel-to-airport | airport transfer |
