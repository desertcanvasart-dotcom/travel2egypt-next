# Day-tour hubs: report (9 Nov 2026)

**In scope:** `/tours`, `/private-day-tours`, `/group-day-tours`, and the Nile Valley city hubs (Cairo, Luxor and
Aswan private and small group, plus Alexandria private). The ES and JA versions of all of these are covered too.

**Unchanged:** the Red Sea city hubs (Hurghada, Sharm El Sheikh, Marsa Alam, El Gouna, Safaga). They still
render the previous layout.

## 1. Files changed

| File | What |
|---|---|
| `src/components/day-hubs/DayHubList.tsx` (new) | The shared list. It has the Mode, City, Length and Budget filters, the sort and the result count. It keeps the state in the URL, shows the empty state, and puts the Red Sea section below the main list. |
| `src/components/day-hubs/buildDayHub.tsx` (new) | Server side of the list. It sorts tours into the Recommended order, renders one card per tour, and builds the city options. It also reads `responseTimeFull` from site settings. |
| `src/components/day-hubs/dayHubData.ts` (new) | City grouping (Cairo & Giza merged, the Red Sea set) and the Recommended order. It also holds the budget buckets for each language. |
| `src/components/day-hubs/DayHubEnd.tsx` (new) | The end block: the homepage's inline itinerary form, with `source=day_tour_hub` and `hub={page slug}`. On city hubs the notes are pre-filled with the city. |
| `src/components/home-sales/DayTourCard.tsx` (new) | The homepage day-tour card, moved into a shared component. Hubs add the city line and the one-line description. |
| `src/components/home-sales/SalesHomeView.tsx` | Uses `DayTourCard`. The homepage output is unchanged. |
| `src/components/tour-system/CategoryView.tsx` | `/private-day-tours` and `/group-day-tours`, rebuilt in the new order. |
| `src/components/tour-system/SubcategoryView.tsx` | Nile Valley city hubs get the new order. Red Sea hubs keep the old layout. |
| `src/app/(site)/[locale]/tours/page.tsx` | `/tours` rebuilt on the shared list. The Mode filter is now in the browser, so the page is static again. `ToursFilter.tsx` is removed. |
| `src/components/tour-system/retiredEssaySections.ts` (new) | Drops "How to use this page" when the page is drawn; it isn't deleted in Sanity. Shared with the packages hub. |
| `src/sanity/lib/queries.ts` | The tour card query adds `priceFrom` and the EN slugs for each tour and city. The landing query adds the same for its tours and its city. |
| `src/components/leads/LeadForm.tsx`, `LeadProvider.tsx` | New optional `hub` on the form. It is sent with `generate_lead` and `lead_form_open`. Buttons can fire an extra `form_open {location:'hub_card'}`. |
| `src/lib/leads/schema.ts` | New lead source `day_tour_hub`. |
| `src/components/packages-hub/*` | Uses the shared helper for "How to use this page". Same fix to the URL state as below. |
| `src/styles/day-hubs.css` (new) | Hub styles. |
| `messages/{en,es,ja}.json` | New `dayHub` strings, word for word from the spec. |

### Notes on the implementation

- **Red Sea vs Nile Valley.** Each tour goes by its *first* tagged city. Only one day tour has two cities,
  and those are Giza and Cairo.
- **Recommended order.**
  - Cities run Cairo & Giza, then Luxor, Aswan, Alexandria, then any other Nile Valley place.
  - Within each city, the homepage day-tour products come first, in homepage order. The rest follow by price, low to high.
  - Unpriced tours always sort last.
- **Most booked.** The homepage day-tour list isn't a Sanity reference list. It is `DAY_TOUR_CITIES` in
  `src/components/home-sales/config.ts`. The hubs read it and keep this page's mode:
  - **Private:** 6 cards.
  - **Group:** the 4 group tours on that list.
- **City hub picks.** "Days we would not miss." keeps the same three tours the live pages show today. None
  of the Nile Valley hubs has curated `tourPresentation` in Sanity, so the picks are the first three tours
  in the hub's default order. Section 8.5 lists them.
- **Budget filter.** Per person, on the numeric `priceFrom`, converted at today's ECB rate into the currency
  of the bucket labels: USD for EN, EUR for ES, JPY for JA.
- **URL state.**
  - Parameters: `?mode=&city=&length=half|full|extended&budget=lt100|100-200|200+&sort=price_asc|price_desc|duration`.
  - `?city=giza` and `?city=cairo` select Cairo & Giza, and each language's own city slugs are accepted too.
  - The homepage tab links go to the city hubs, which still work.
- **URL-state fix.** In development, React runs effects twice, and the "write to URL" step could wipe an
  incoming query before it was read. The list now writes to the URL only after the visitor changes
  something. The packages hub index (#177) had the same pattern and got the same fix.
- **Structured data.** Each hub's `ItemList` covers the main (Nile Valley) list only, in Recommended order.
  It has no offers, and the Red Sea items are left out. Breadcrumbs are unchanged.
- **GA4.**
  - `select_item` uses `item_list_name` = `day_hub_most_booked`, `day_hub_index`, `day_hub_red_sea` or `city_hub_picks`.
  - Check this date on a hub card also fires `form_open {location:'hub_card', hub}`.
  - `generate_lead` and `lead_form_open` carry `form_location=day_tour_hub` and `hub`.
  - I didn't see these events fire, because GA isn't configured on the local dev server.
- **Japanese.** There are no concierge links: none in the end block, and the floating concierge already hides for JA.
- **Mobile.** The Nile Valley city hub hero had no side margin on phones, so its text touched the screen edge.
  That's fixed on those hubs. The Red Sea hubs still have the problem, because they were out of scope.

## 2. Checked (local dev server, 1440×782 and 375×812)

- **First card is Nile Valley** on `/tours`, `/private-day-tours` and `/group-day-tours` (Giza Pyramids & GEM).
  Red Sea tours appear only in the bottom section, or when a Red Sea city is selected:
  - `/tours`: 70 in the main list, 47 Red Sea
  - `/private-day-tours`: 62 main, 36 Red Sea
  - `/group-day-tours`: 8 main, 11 Red Sea
- **Prices:** every card shows a price. All 117 published day tours have one, so "Price on request" never appears.
- **City filter:** All · Cairo & Giza · Luxor · Aswan & Abu Simbel · Alexandria │ RED SEA RESORTS │ El Gouna ·
  Hurghada · Marsa Alam · Safaga · Sharm El Sheikh.
- **URL state:**
  - `?city=giza` selects Cairo & Giza (32 tours).
  - `?mode=group&budget=lt100&sort=price_desc` survives a reload: 3 tours, $80 → $70.
  - Clicking a filter updates the URL.
  - With no match, the empty state appears and offers the dialog.
- **Check this date** opens the day-tour dialog with the tour filled in and the estimate line ("Estimated: $260 for 2 adults").
- **Cairo city hub order:** hero with "From $40 per person…", then the picks (priced, with Check this date), then
  "Every Cairo day" (Length, Budget, sort, count: 28), then the editorial, then the inline form with
  "Interested in: Cairo day tours" filled in, then the footband and FAQ.
- **No sideways scroll** at 375px on `/tours`, `/private-day-tours`, the Cairo hub (EN) or the JA Cairo hub.
- **ES and JA** copy matches the spec. The JA Cairo hub has no concierge link.
- `tsc` passes.

**Not done:** I didn't submit a lead. `/api/lead` has no `@test.travel2egypt.org` test mode, so a submission
creates a real lead and emails info@. I checked everything up to the point of sending instead.

Screenshots: `docs/day-tour-hubs-2026-11-09/`.

## 3. Report only (nothing fixed)

### 8.1 Multi-day products on day-tour hubs

| Hub | Slug | Stored duration | Note |
|---|---|---|---|
| `/cairo-private-day-tours` (also `/tours`, `/private-day-tours`) | `private-tour-2-day-trip-to-alexandria-from-cairo` | 2 days | A 2-day product stored as a day tour. |
| `/cairo-private-day-tours` (also `/tours`, `/private-day-tours`) | `fayoum-desert-adventure` ("Fayoum Desert: Two Days Between Wadi al-Hitan, Wadi al-Rayan, and Lake Qarun") | **1 day** | The title says two days, but the duration is stored as 1, so it shows as a full day. |

### 8.2 Day tours with no price

None. All 117 published day tours have a `priceFrom`.

### 8.3 No city, or a city that doesn't match the title

- No day tour lacks a city.
- `memphis-saqqara-citadel-khan-tour` (Private Day Tour: Memphis, Saqqara, the Citadel of Saladin & Khan El-Khalili *from Cairo*)
  is tagged **Giza first**, then Cairo. On the hubs it groups under Cairo & Giza, so nothing visible changes.
- The title check covered "from {city}" for every city and found no other mismatch.

### 8.4 Day tours tagged with both Cairo and Giza

- `memphis-saqqara-citadel-khan-tour` (private), as above.

### 8.5 Nile Valley city hub picks ("Days we would not miss.")

None of them includes a Red Sea product or a stored multi-day product. Several lead with something that isn't
a sightseeing day, though:

| Hub | Picks (in order) |
|---|---|
| `cairo-private-day-tours` | **`transfer-from-hotel-to-airport` (an airport transfer)**, `egyptian-museum-and-bazaar-tour`, `private-tour-memphis-saqqara-and-dahshur` |
| `luxor-private-day-tours` | **`sound-light-show-at-karnak-temple-in-luxor` (an evening show)**, `esna-temple-and-el-kab-day-tour-from-luxor`, `private-tour-full-day-to-grand-west-bank` |
| `aswan-private-day-tours` | `nubian-life-private-nubian-village-and-nile-tour-with-motor-boat`, `el-kab-and-esna-temple-day-tour-from-aswan`, `private-tour-aswan-bird-watching-tour` |
| `alexandria-private-day-tours` | `private-tour-alexandria-day-tour`, `private-day-trip-to-memphis-saqqara-and-dahshur-from-alexandria`, `alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili` |
| `cairo-small-group-day-tours` | `pyramids-of-giza-and-sphinx-group-day-tour`, `memphis-saqqara-and-dahshur-group-day-tour`, `fayoum-meidum-hawara-pyramids-group-day-tour` |
| `luxor-small-group-day-tours` | `esna-edfu-kom-ombo-temples-group-day-tour-from-luxor`, `grand-west-bank-group-day-tour-luxor` |
| `aswan-small-group-day-tours` | `nubian-temples-day-tour-from-aswan`, `abu-simbel-temples-day-tour-from-aswan` |

These picks come from the hubs' default order (shortest first, then newest), because no Nile Valley hub has
curated picks. To choose them, set `tourPresentation` on each hub in Sanity, or ask me to pin them to the
homepage list.

### Other things worth a look

- **21 "day tours" are services, not tours.** Airport transfers, intercity transfers, car-and-guide days,
  sound-and-light and Tanoura shows, and Dolphin shows are all stored as private day tours. They appear in
  the hub lists, and the transfers' low prices set the "From $20 / $40" lines.
- **4 day tours have no hero image:**
  - `gateway-to-the-past-luxor-airport-transfer`
  - `private-tour-transfer-from-luxor-to-hurghada-by-bus`
  - `jerusalem-dead-sea-bethlehem-group-day-tour-from-sharm`
  - `mount-sinai-sunrise-trek-group-day-tour`

- **Alexandria** has no small-group hub. Its one group tour (`alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo`) is tagged Cairo.
