# Session 15 — Candidate Inventory

Generated: 2026-05-13T21:03:47.745Z
Source: live WP REST + scripts/wp-classifier.ts `classifyPageBySlug`

## Counts

| Bucket | Count |
|---|---:|
| EN pages total | 1246 |
| Classified `tour-or-package` | 286 |
| Already imported (session 14 baseline) | 12 |
| **Bulk-import candidates** | **274** |
| → dayTour | 167 |
|   • `*-private-car-and-guide` | 0 |
|   • other day tours | 167 |
| → package | 107 |

## Confidence (classifier)

high: 274 | med: 0 | low: 0

## Day tours — private-car-and-guide (0)

| WP ID | Slug | Title | Days | Reason | Conf |
|---:|---|---|---:|---|---|

## Day tours — other (will get tourMode=group) (167)

| WP ID | Slug | Title | Days | Reason | Conf |
|---:|---|---|---:|---|---|
| 239597 | `pyramids-of-giza-and-grand-egyptian-museum` | Pyramids of Giza and Grand Egyptian Museum (GEM) Private Tour |  | Explicit editorial routing override | high |
| 239040 | `cairo-sky-adventure` | Cairo Sky Adventure |  | Matches tour pattern /-adventure(-\|$)/ | high |
| 238599 | `desert-oasis-siwa-retreat-solo-traveller` | Desert &amp; Oasis — Siwa Retreat (Solo Traveller) |  | Matches tour pattern /-retreat(-\|$)/ | high |
| 238562 | `nile-in-5-days-luxor-aswan-solo-traveller` | Nile in 5 Days — Luxor &amp; Aswan (Solo Traveller) |  | Matches tour pattern /\d+-days?-/ | high |
| 238546 | `cairo-in-3-days-insider-edition-solo-traveller` | Cairo in 3 Days — Insider Edition (Solo Traveller) |  | Matches tour pattern /\d+-days?-/ | high |
| 238461 | `3-days-cairo-highlights-for-friends` | 3 Days – Cairo Highlights for Friends | 3 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 238371 | `nile-love-journey-luxor-aswan` | Nile Love Journey — Luxor &#038; Aswan |  | Matches tour pattern /-journey(-\|$)/ | high |
| 238357 | `5-days-cairo-luxor-romance-edition` | 5 Days – Cairo &#038; Luxor Romance Edition | 5 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161314 | `egypt-tours-from-germany` | Egypt Tours from Germany |  | egypt-tours-from-{country} pattern | high |
| 160983 | `egypt-tours-from-spain` | Egypt Tours from Spain |  | egypt-tours-from-{country} pattern | high |
| 160833 | `egypt-tours-from-usa` | Egypt Tours from USA |  | egypt-tours-from-{country} pattern | high |
| 160669 | `egypt-tours-from-turkey` | Egypt Tours from Turkey |  | egypt-tours-from-{country} pattern | high |
| 160423 | `egypt-tours-from-canada` | Egypt Tours from Canada |  | egypt-tours-from-{country} pattern | high |
| 160172 | `egypt-tours-from-australia` | Egypt Tours from australia |  | egypt-tours-from-{country} pattern | high |
| 160026 | `egypt-tours-from-india` | Egypt Tours from India |  | egypt-tours-from-{country} pattern | high |
| 159772 | `5-days-egypt-tours` | 5 Days Egypt Tours | 5 | N-day Egypt tours listing page | high |
| 159756 | `2-days-egypt-tours` | 2 Days Egypt Tours | 2 | N-day Egypt tours listing page | high |
| 159124 | `7-days-egypt-tours` | 7 Days Egypt Tours | 7 | N-day Egypt tours listing page | high |
| 158052 | `egypt-tours-from-the-uk` | Egypt Tours from the UK |  | egypt-tours-from-{country} pattern | high |
| 156014 | `fayoum-desert-adventure` | Fayoum Desert Adventure |  | Matches tour pattern /-adventure(-\|$)/ | high |
| 155692 | `a-western-desert-expedition` | Desert Trails: A Western Desert Expedition |  | Matches tour pattern /-expedition(-\|$)/ | high |
| 155539 | `desert-horizons-7-day-bahariya-siwa-oasis-tour` | Desert Horizons: 7-Day Bahariya &#038; Siwa Oasis Tour – Travel2Egypt | 7 | Matches tour pattern /\d+-days?-/ | high |
| 154883 | `overnight-sataya-dolphin-reef-safari` | Overnight Sataya Dolphin Reef Safari |  | Matches tour pattern /-safari(-\|$)/ | high |
| 153242 | `4-day-history-culture-escape` | Short Break in Cairo: 4-Day History &#038; Culture Escape | 4 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 151868 | `group-tour-luxor-hurghada` | Luxor Highlights: One-Day Group Tour from Hurghada |  | Matches tour pattern /-tour(s)?(-\|$)/ | high |
| 151754 | `cairo-group-tour` | Cairo Group Tour: Pyramids, Museum &amp; Khan El Khalili |  | Matches tour pattern /-tour(s)?(-\|$)/ | high |
| 151510 | `dendera-and-abydos-temple-tour-hurghada` | Sands of History: Dendera and Abydos Temple Tour Hurghada |  | Matches tour pattern /-tour(s)?(-\|$)/ | high |
| 149374 | `small-group-travel-packages` | Small Group Travel Packages |  | Matches tour pattern /^small-group/ | high |
| 145919 | `mount-sinai-sunrise-trek` | Mount Sinai Sunrise Trek |  | Matches tour pattern /-trek(-\|$)/ | high |
| 145910 | `2-day-pyramids-mediterranean-tour` | Cairo to Alexandria: 2-Day Pyramids &amp; Mediterranean Tour | 2 | Matches tour pattern /^\d+-day(s)?-/ | high |
| _… +137 more_ | | | | | |

## Packages (107)

| WP ID | Slug | Title | Days | Reason | Conf |
|---:|---|---|---:|---|---|
| 238471 | `9-days-cairo-%c2%b7-st-catherine-%c2%b7-sharm-el-sheikh` | 9 Days – Cairo · St. Catherine · Sharm El Sheikh | 9 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 238436 | `12-day-red-sea-desert-friends-escape` | 12 Day Red Sea &amp; Desert Friends Escape | 12 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 238377 | `9-days-red-sea-desert-escape` | 9 Days – Red Sea &amp; Desert Escape | 9 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 237730 | `cairo-and-alexandria-4-days-family-package` | Cairo and Alexandria 4-Days Family Package |  | Matches tour pattern /-package(-\|$)/ | high |
| 237732 | `cairo-and-nile-cruise-8-day-family-package` | Cairo and Nile Cruise 8-Day Family Package | 8 | Matches tour pattern /-package(-\|$)/ | high |
| 218448 | `11-day-luxor-to-cairo-egypt-nile-cruise-vacation-from-germany` | 11 Day Luxor To Cairo Egypt Nile Cruise Vacation from Germany | 11 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 218432 | `9-day-prestigious-egypt-vacation-from-germany` | 9-Day Prestigious Egypt Vacation from Germany | 9 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161593 | `bahariya-and-siwa-oasis-vacation-from-germany` | An Unforgettable Bahariya and Siwa Oasis Vacation from Germany |  | Matches tour pattern /-vacation/ | high |
| 161561 | `10-day-romantic-egypt-travel-deals-from-germany` | Love on the Nile: 10-Day Romantic Egypt Travel Deals from Germany | 10 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161535 | `8-day-customized-aswan-travel-deal-from-germany` | 8 Day Customized Aswan Travel Deal from Germany | 8 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161513 | `18-day-grand-egypt-holiday-package-from-germany` | 18 Day Grand Egypt Holiday Package from Germany | 18 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161486 | `8-day-egypt-holiday-package-from-germany` | Sharm&#8217;s Delight: 8-Day Egypt Holiday Package from Germany | 8 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161448 | `4-day-cairo-travel-package-from-germany` | Egypt Escape: 4-Day Cairo Travel Package from Germany | 4 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161359 | `14-day-egypt-tour-package-from-germany-for-families` | Luxury 14-Day Egypt Tour Package from Germany for Families | 14 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 160630 | `10-day-romantic-egypt-deals-from-spain` | 10-Day Romantic Egypt Deals From Spain | 10 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161192 | `8-day-customized-aswan-travel-deal-from-spain` | 8 Day Customized Aswan Travel Deal from Spain | 8 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161143 | `18-day-grand-egypt-holiday-package-from-spain` | 18 Day Grand Egypt Holiday Package from Spain | 18 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161128 | `8-day-egypt-holiday-package-from-spain` | Sharm&#8217;s Delight: 8-Day Egypt Holiday Package from spain | 8 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161111 | `bahariya-and-siwa-oasis-vacation-from-spain` | An Unforgettable Bahariya and Siwa Oasis Vacation from spain |  | Matches tour pattern /-vacation/ | high |
| 161093 | `11-day-luxor-to-cairo-egypt-nile-cruise-vacation-from-spain` | 11 Day Luxor To Cairo Egypt Nile Cruise Vacation from Spain | 11 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161079 | `9-day-prestigious-egypt-vacation-from-spain` | Luxury &amp; Legacy: 9-Day Prestigious Egypt Vacation from Spain | 9 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161041 | `4-day-cairo-travel-package-from-spain` | Egypt Escape: 4-Day Cairo Travel Package from Spain | 4 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 161017 | `14-day-egypt-tour-package-from-spain-for-families` | Luxury 14-Day Egypt Tour Package from Spain for Families | 14 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 160965 | `9-day-prestigious-egypt-vacation-from-usa` | Luxury &amp; Legacy: 9-Day Prestigious Egypt Vacation from USA | 9 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 160953 | `bahariya-and-siwa-oasis-vacation-from-usa` | An Unforgettable Bahariya and Siwa Oasis Vacation from USA |  | Matches tour pattern /-vacation/ | high |
| 160943 | `luxor-to-cairo-egypt-nile-cruise-vacation-from-usa` | 11 Day Luxor To Cairo Egypt Nile Cruise Vacation from USA |  | Matches tour pattern /-vacation/ | high |
| 160918 | `10-day-romantic-egypt-travel-deals-from-usa` | Love on the Nile: 10-Day Romantic Egypt Travel Deals from USA | 10 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 160906 | `8-day-customized-aswan-travel-deal-from-usa` | 8 Day Customized Aswan Travel Deal from USA | 8 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 160894 | `18-day-grand-egypt-holiday-package-from-usa` | 18 Day Grand Egypt Holiday Package from USA | 18 | Matches tour pattern /^\d+-day(s)?-/ | high |
| 160877 | `8-day-egypt-holiday-package-from-usa` | Sharm&#8217;s Delight: 8-Day Egypt Holiday Package from USA | 8 | Matches tour pattern /^\d+-day(s)?-/ | high |
| _… +77 more_ | | | | | |
