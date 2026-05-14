# City Resolution Audit — Session 15

## Operator action required

Verify cities for **72 docs flagged `cityResolution: 'default-cairo'`**. The fallback fired because no city slug-token was found in the slug. Some are correctly Cairo (Pyramids tours, Cairo-departure trips); others may legitimately visit a different city.

## Counts

| Resolution source | Count | Note |
|---|---|---|
| `full-slug-scan` | 138 | City slug-token matched in tour slug |
| `default-cairo` | 72 | Fallback — no city signal in slug |
| (unset) | 12 | Session 14 baseline (pre-dates cityResolution field) |
| Total | 222 | |

Multi-city tours (`cities.length > 1`): **54** of 222 (24%). Of these, all use `full-slug-scan` resolution.

## A. `default-cairo` fallback list — 72 docs

Per-doc check: does the title or operational reality imply a non-Cairo city? Examples expected to be correct (Cairo-departure, Cairo-themed, Pyramids-of-Giza-area):

| _id | type | slug | title |
|---|---|---|---|
| `wp-page-113004` | package | `14-day-egypt-luxury-family-holiday` | 14-Day Egypt Luxury Family Holiday |
| `wp-page-113005` | package | `9-day-classic-egypt-family-adventure` | 9-Day Classic Egypt Family Adventure |
| `wp-page-115168` | dayTour | `shared-seas-full-day-snorkeling-tour` | Dolphins Dance Group: Shared Seas Full Day Snorkeling Tour |
| `wp-page-115196` | dayTour | `shared-snorkeling-day-at-giftun-island` | Coral Companions: Shared Snorkeling Day at Giftun Island |
| `wp-page-121071` | dayTour | `exclusive-chartered-experience-private-boat-journey-to-orange-bay` | Exclusive Chartered Experience: Private Boat Journey to Orange Bay |
| `wp-page-129996` | dayTour | `3-day-nubian-fishing-safari` | 3- Day Nubian Fishing Safari |
| `wp-page-130027` | package | `2-day-desert-nature-wildlife-retreat` | 2-Day Nubian Desert Nature & Wildlife Retreat |
| `wp-page-130067` | package | `4-day-ultimate-lake-nasser-experience` | 4-Day Ultimate Lake Nasser Experience |
| `wp-page-131889` | package | `5-day-the-obeiyed-cave-safari-tour` | Desert Adventure: 5-Day The Obeiyed Cave Safari Tour |
| `wp-page-133412` | dayTour | `sunrise-hot-air-balloon-ride-over-luxors-ancient-landmarks` | Sunrise Hot-Air Balloon Ride over Luxor s Ancient Landmarks |
| `wp-page-136519` | package | `epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs` | Epic Egyptian Escape: A 7-Day Adventure from Pyramids to Pharaohs |
| `wp-page-136566` | package | `7-days-in-egypt-pyramids-temples-and-timeless-wonders` | 7 Days in Egypt: Pyramids, Temples, and Timeless Wonders |
| `wp-page-145910` | package | `2-day-pyramids-mediterranean-tour` | Cairo to Alexandria: 2-Day Pyramids & Mediterranean Tour |
| `wp-page-145919` | dayTour | `mount-sinai-sunrise-trek` | Mount Sinai Sunrise Trek |
| `wp-page-153242` | package | `4-day-history-culture-escape` | Short Break in Cairo: 4-Day History Culture Escape |
| `wp-page-154883` | dayTour | `overnight-sataya-dolphin-reef-safari` | Overnight Sataya Dolphin Reef Safari |
| `wp-page-155692` | package | `a-western-desert-expedition` | Desert Trails: A Western Desert Expedition |
| `wp-page-156550` | package | `11-day-egypt-tour-of-history-adventure-relaxation` | 11-Day Egypt Tour of History, Adventure & Relaxation |
| `wp-page-158052` | package | `egypt-tours` | Egypt Tours from the UK |
| `wp-page-158702` | package | `8-days-egypt-tours` | 8 Days Egypt Tours |
| `wp-page-159000` | package | `9-days-egypt-tours` | 9 Days Egypt Tours |
| `wp-page-159022` | package | `11-days-egypt-tours` | 11 Days Egypt Tours |
| `wp-page-159038` | package | `10-days-egypt-tours` | 10 Days Egypt Tours |
| `wp-page-159097` | package | `12-days-egypt-tours` | 12 Days Egypt Tours |
| `wp-page-159124` | package | `7-days-egypt-tours` | 7 Days Egypt Tours |
| `wp-page-159175` | package | `14-days-egypt-tours` | 14 Days Egypt Tours |
| `wp-page-159581` | package | `15-days-egypt-tours` | 15 Days Egypt Tours |
| `wp-page-159590` | package | `13-days-egypt-tours` | 13 Days Egypt Tours |
| `wp-page-159756` | package | `2-days-egypt-tours` | 2 Days Egypt Tours |
| `wp-page-159772` | package | `5-days-egypt-tours` | 5 Days Egypt Tours |
| `wp-page-160044` | package | `14-day-egypt-tour-package-for-families` | Luxury 14-Day Egypt Tour Package from India for Families |
| `wp-page-160072` | package | `8-day-egypt-holiday-package` | Sharm s Delight: 8-Day Egypt Holiday Package from India |
| `wp-page-160096` | package | `18-day-grand-egypt-holiday-package` | 18-Day Grand Egypt Holiday Package from India |
| `wp-page-160116` | package | `10-day-romantic-egypt-travel-deals` | Love on the Nile: 10-Day Romantic Egypt Travel Deals from India |
| `wp-page-160139` | package | `9-day-prestigious-egypt-vacation` | Luxury & Legacy: 9-Day Prestigious Egypt Vacation from India |
| `wp-page-160149` | package | `egypt-nile-cruise-vacation-from-india` | 11 Day Luxor To Cairo Egypt Nile Cruise Vacation from India |
| `wp-page-160182` | package | `luxury-14-day-egypt-tour-package-from-australia-for-families` | Luxury 14-Day Egypt Tour Package from Australia for Families |
| `wp-page-160630` | package | `10-day-romantic-egypt-deals-from-spain` | 10-Day Romantic Egypt Deals From Spain |
| `wp-page-238377` | package | `9-days-red-sea-desert-escape` | 9 Days – Red Sea & Desert Escape |
| `wp-page-238436` | package | `12-day-red-sea-desert-friends-escape` | 12 Day Red Sea & Desert Friends Escape |
| `wp-page-86836` | package | `11-day-the-splendor-of-egypt-tour` | 11-Day The Splendor of Egypt Tour |
| `wp-page-86844` | package | `8-days-egypt-panorama-tour` | 8-Days Egypt Panorama Tour |
| `wp-page-86846` | package | `4-days-city-break` | 4-Days City Break |
| `wp-page-86855` | package | `9-days-egypt-prestigious-vacation` | 9-Days Egypt Prestigious Vacation |
| `wp-page-86857` | package | `the-egypt-royal-vacation-tour` | Regal Escape: 10-Day The Egypt Royal Vacation Tour |
| `wp-page-86877` | dayTour | `ancient-egypt-and-the-red-sea-tour` | Ancient Egypt And The Red Sea Tour |
| `wp-page-87255` | package | `10-days-unforgettable-egypt-tour` | Memories Eternal: 10-Days Unforgettable Egypt Tour |
| `wp-page-87527` | dayTour | `the-grand-west-bank-tour` | West Bank Wonders: The Grand West Bank Tour |
| `wp-page-87729` | dayTour | `egyptian-museum-and-bazaar-tour` | Egyptian Museum and Bazaar Tour |
| `wp-page-87756` | dayTour | `private-tour-memphis-saqqara-and-dahshur` | Private Tour: Memphis, Saqqara and Dahshur |
| `wp-page-87757` | dayTour | `group-day-tour-of-the-pyramids-and-sphinx` | Giza’s Grandeur: Group Day Tour of the Pyramids and Sphinx |
| `wp-page-87758` | dayTour | `private-tour-memphis-and-saqqara` | Private Tour: Memphis and Saqqara |
| `wp-page-87839` | dayTour | `the-grand-islamic-day-tour` | The Grand Islamic Day Tour |
| `wp-page-87840` | dayTour | `memphis-saqqara-citadel-khan-tour` | Memphis, Saqqara, Citadel, & Khan El-Khalili |
| `wp-page-88107` | dayTour | `group-day-tour-to-memphis-saqqara-and-dahshur` | Old Kingdom Trio: Group Day Tour to Memphis, Saqqara, and Dahshur |
| `wp-page-88170` | dayTour | `private-tour-full-day-to-grand-west-bank` | Valley of Nobles: Full Day to Grand West Bank Private Tour |
| `wp-page-88176` | dayTour | `private-tour-valley-of-kings-temples-day-tour` | Valley of Kings & Temples Day Tour |
| `wp-page-88412` | dayTour | `private-tour-local-market-with-horse-carriage` | Private Tour: Local Market With Horse Carriage |
| `wp-page-88602` | dayTour | `private-tour-nubian-village-with-motor-boat` | Nubian Life: Private Nubian Village and Nile Tour with Motor Boat |
| `wp-page-88604` | dayTour | `private-tour-sound-light-show-at-philae-temple` | Sound & Light Show in Aswan s Philae Temple |
| `wp-page-88994` | package | `secret-sanctuaries-13-day-mysterious-oases-and-the-nile-tour` | Secret Sanctuaries: 13-Day Mysterious Oases and the Nile Tour |
| `wp-page-89005` | package | `10-day-nile-and-western-desert-tour` | Desert Rivers: 10-Day Nile and Western Desert Tour |
| `wp-page-89015` | package | `the-romantic-egypt-tour` | Love on the Nile: 10-Day The Romantic Egypt Tour |
| `wp-page-89175` | package | `8-days-best-of-egypt-tour-package` | Egypt Highlights: 8-Days Best of Egypt Tour Package |
| `wp-page-89284` | package | `11-day-explore-egypt-and-red-sea-tour` | 11-Day Explore Egypt and Red Sea Tour |
| `wp-page-89376` | package | `10-days-nile-dreamer-tour-experience` | 10-Days Nile Dreamer Tour Experience |
| `wp-page-89435` | package | `9-day-egypt-bird-watching-adventure` | Avian Wonders: 9-Day Egypt Bird Watching Adventure |
| `wp-page-89436` | package | `8-day-egypt-golf-tour` | Fairways & Pharaohs: 8-Day Egypt Golf Tour |
| `wp-page-89510` | package | `the-great-pharaohs-and-white-desert` | Desert Dynasties: 6-Day Great Pharaohs White Desert Tour |
| `wp-page-89524` | package | `13-day-impressive-egypt-tour` | Pharaonic Odyssey: 13-Day Impressive Egypt Tour |
| `wp-page-89602` | package | `10-days-eternal-egypt-tour` | Timeless Wonders: 10-Days Eternal Egypt Tour |
| `wp-page-89619` | package | `egypt-and-the-nile-tour` | Pharaohs Legacy: 10-Day Egypt and The Nile Tour Package |

## B. Multi-city resolution sample — top 12 by city count

Verify alias matching and full-slug-scan worked correctly. If a city is missing from `cities`, the slug didn't carry that city's slug-token (or a TOKEN_TO_CITY_SLUG alias).

| _id | type | slug | citiesCount | cities |
|---|---|---|---|---|
| `wp-page-88179` | dayTour | `day-tour-to-esna-edfu-kom-ombo-from-luxor` | 4 | esna, edfu, kom-ombo, luxor |
| `wp-page-102370` | package | `aswan-and-abu-simbel-from-luxor` | 3 | aswan, abu-simbel, luxor |
| `wp-page-238471` | package | `9-days-cairo-st-catherine-sharm-el-sheikh` | 3 | cairo, saint-catherine, sharm-el-sheikh |
| `wp-page-87484` | dayTour | `group-day-tour-to-kom-ombo-and-edfu-temples-from-aswan` | 3 | kom-ombo, edfu, aswan |
| `wp-page-87510` | dayTour | `esna-edfu-kom-ombo-day-tour` | 3 | esna, edfu, kom-ombo |
| `wp-page-88609` | dayTour | `kom-ombo-and-edfu-temples-day-tour-from-aswan` | 3 | kom-ombo, edfu, aswan |
| `wp-page-113193` | dayTour | `aswan-to-el-kab-and-edfu-temple-tour` | 2 | aswan, edfu |
| `wp-page-113456` | dayTour | `day-tour-to-visit-cairo-from-alexandria` | 2 | cairo, alexandria |
| `wp-page-113521` | package | `3-day-siwa-journey-from-alexandria` | 2 | siwa-oasis, alexandria |
| `wp-page-115522` | dayTour | `group-trip-to-cairo-by-bus-from-hurghada` | 2 | cairo, hurghada |
| `wp-page-115614` | dayTour | `safaga-to-luxor-full-day-group-ancient-city-adventure` | 2 | safaga, luxor |
| `wp-page-118678` | dayTour | `cairo-day-tour-from-alexandria` | 2 | cairo, alexandria |

## C. Methodology note

Resolver: full-slug-scan + `TOKEN_TO_CITY_SLUG` aliases (imported from classifier per b85bfe2). Captures structurally meaningful city tokens; doesn't capture descriptive language. Examples that fall to default-cairo by design:

- "Western Desert Expedition" — no city slug-token, defaults to Cairo (operator may want Bahariya or Farafra)
- "Egypt Tours" — no city signal at all (B3-canonical archive page; conceptually "all of Egypt")
- "Royal Vacation" / "Eternal Egypt" — purely descriptive titles
