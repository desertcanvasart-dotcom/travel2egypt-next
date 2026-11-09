# Product page template — report (2026-11-09)

Report only; nothing here was changed.

## 1. Published products with no price (10)

These show "Price on request" in the decision panel and emit no `offers`.

| slug | title | type | locales |
|---|---|---|---|
| 02-day-luxor-tour-by-plane-from-cairo | Luxor by Air: A Two-Day Tour from Cairo | package | en, es, ja |
| 7-days-luxor-to-aswan-dahabiya-cruise | 7-Day Luxor to Aswan Dahabiya Nile Cruise Aboard Malouka | package | en, es, ja |
| 7-days-luxury-dahabiya-cruise-on-the-nile | 7-Day Dahabiya Cruise on the Nile: Luxor to Aswan | package | en, es, ja |
| 7-days-of-splendor-exploring-the-nile-on-a-roman-dahabiya | 7-Day Nile Dahabiya Cruise: Luxor to Aswan Aboard Roman | package | en, es, ja |
| 8-days-best-of-egypt-tour-package | 8-Day Egypt Highlights: Cairo, Abu Simbel, the Nile and Luxor | package | en, es, ja |
| adelaide-dahabiya-nile-cruise | 7-Day Dahabiya Nile Cruise from Luxor to Aswan Aboard Adelaïde | package | en, es, ja |
| agatha-dahabiya-journey-along-the-nile | 7-Day Dahabiya Nile Journey from Luxor to Aswan Aboard Agatha | package | en, es, ja |
| cairo-weekend-city-break-2-nights-3-days | Cairo Weekend City Break: 3 Days in the Egyptian Capital | package | en, es, ja |
| desert-oasis-2-day-bahariya-oasis-private-tour-from-cairo | Two Days from Cairo into the Western Desert: Bahariya, Black and White | package | en, es, ja |
| the-pearl-of-red-sea-hurghada | 8-Day Red Sea Hurghada Tour: The Pearl of the Red Sea | package | en, es, ja |

## 4. Nights consistency (multi-day)

Stored length = `durationDays` (the page shows days − 1 nights; there is no separate nights field). Listed: every "N nights / N-night / N days" phrase in the title, dek, meta description and narrative that disagrees with the stored length — a phrase longer than the whole trip, or a total-trip day count that differs. Partial phrases ("a 3-night cruise" inside a 10-day trip) are listed only when they exceed the total. Itinerary-at-a-glance night counts will be added once extraction runs.

| slug | stored days / nights | phrase | where |
|---|---|---|---|
| 11-day-cairo-and-nile-cruise-round-trip | 11 / 10 | "…ot scenery but transport. Seven of the eleven nights are spent aboard a five-star …" (more nights than the trip has) | narrative |
| 14-night-nile-cruise-and-hurghada-stay | 14 / 13 | "…nds & the Red Sea Duration · 15 days / 14 nights — 7 nights aboard a five-star…" (more nights than the trip has) | narrative |
| 14-night-nile-cruise-and-hurghada-stay | 14 / 13 | "…iftun Islands & the Red Sea Duration · 15 days / 14 nights — 7 nights aboard a five-star…" (total disagrees) | narrative |
| 2-day-pyramids-mediterranean-tour | 2 / 1 | "…ame circuit pairs naturally with one or two nights at an Alexandria seafront hot…" (more nights than the trip has) | narrative |

## 5. Breadcrumb / category labels on package pages

Packages show "Home › Packages › {theme} › {title}". Theme names as stored (EN), with product counts. The ones marked ⚠ read like marketing tags rather than categories.

| theme (breadcrumb label) | packages | |
|---|---|---|
| Special Interest | 16 | ⚠ reads like a marketing tag |
| Egypt on the Go | 14 | ⚠ reads like a marketing tag |
| Nile Cruise | 13 |  |
| Egypt In Depth | 10 |  |
| Adventure | 8 |  |
| Egypt and the Red Sea | 8 |  |
| Dahabiya Nile Cruise | 7 |  |
| Hassle Free | 6 | ⚠ reads like a marketing tag |
| Family Egypt | 6 |  |
| Luxury | 5 |  |

## 6. Related products — automatic selection

Product pages have no automatic related-product selection: "Journeys like this" / "More days from {city}" list only the products hand-picked in each product's `relatedTours` field. Nothing to exclude; the transfer / show / Red Sea rule is therefore not applied anywhere yet. Hand-picked lists that include such products are left as editors chose them.

