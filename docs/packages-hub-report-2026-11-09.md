# Packages hub rebuild: report (9 Nov 2026)

Scope: `/egypt-travel-packages`, `/es/paquetes-de-viaje-a-egipto`, `/ja/ejiputo-ryoko-pakkeeji`.
`/packages` and `/small-group-travel-packages` were not changed, except that the
developer note removed in section 1 also showed on the small-group hub.

## 1. Internal note and other visible developer notes

Shipped separately in **PR #176** (branch `fix/remove-dev-note-2026-11-09`).

- "A budget filter can sit here too, now that prices are numbers…" came from the
  locale files (`tourSystem.pkgCatLenHint`) in EN, ES and JA. It is now removed.
- The sweep covered the code, the locale files and all 2,235 published Sanity documents. It found and removed
  these in Sanity, with a backup at `migration/dev-notes-2026-11-09/backup.json`:
  - El-Khokha, the Ramesseum and Sheikh Abd el-Qurna had editor revision logs at the end of their EN bodies,
    for example "Notes on judgment calls", "Things to verify before publishing" and "Cluster cross-references locked".
    44, 41 and 14 paragraphs were removed, from both the published documents and their drafts.
  - The Nectanebo Mammisi page had "What you should know about this piece:" followed by a five-point note to the
    editor. 6 paragraphs were removed.
  - On the Old Cataract hotel page, "should be confirmed before publishing or booking" now reads "before booking".
- **Open:** after its own Final Word, the Nectanebo Mammisi page carries a complete second article on the
  Temple of Hathor, in both EN and ES. It looks like two pages pasted into one. This needs the owner's decision.

## 2. Files changed (hub rebuild)

| File | What |
|---|---|
| `src/app/(site)/[locale]/egypt-travel-packages/page.tsx` | New data: packages with `priceFrom`, the homepage products, response time and live FX. New meta description. |
| `src/components/packages-hub/PackagesHubView.tsx` | New page, in the order hero → most booked → themes → index → how our journeys work → form → footband. |
| `src/components/packages-hub/PackagesIndex.tsx` | Index with prices, Length and Budget filters, sort, and state kept in the URL. |
| `src/styles/packages-hub.css` | Hub styles. |
| `src/components/home-sales/TourCard.tsx` | The homepage tour card, moved into its own component so the hub can share it. |
| `src/components/home-sales/SalesHomeView.tsx` | Uses `TourCard`. The homepage output is unchanged. |
| `src/components/tour-system/MastheadStats.tsx` | Counter values can be a price. |
| `src/lib/leads/schema.ts` | New lead source `packages_hub`. |
| `messages/{en,es,ja}.json` | New `packagesHub` strings, word for word from the spec. |

### Notes on the implementation

- **Most-booked list.** The homepage list isn't a Sanity reference list. It is `FEATURED_TOURS` in
  `src/components/home-sales/config.ts`, so the hub reads that same array, in the same order. To change
  both pages, edit that one list.
- **Budget filter.** It filters on the numeric `priceFrom`, converted at today's ECB rate into the currency of
  the bucket labels: USD for EN, EUR for ES, JPY for JA (25万 / 40万 / 60万 yen).
- **URL state.** The parameters are `?length=3-5|6-9|10-14|15+&budget=lt1500|1500-2500|2500-4000|4000+&sort=price_asc|price_desc`.
  Length sorting is the default, so it isn't written to the URL. The homepage finder's `?length=` link still
  works, and the old bucket names (`le5`, `6to9` and so on) are accepted too.
- **"How to use this page"** is dropped when the page is drawn, not deleted in Sanity. The rest of the
  intro essay is moved down unchanged. Its ES text still uses *usted* ("le muestra"), as the spec asked for it unchanged.
- **First screen at 1440×782.** The card prices end at y≈776. To get there, the hero is tighter, and the card
  images on the hub use a 9:4 crop on desktop instead of the homepage's 3:2. The homepage card itself is unchanged.
- **GA4.**
  - `generate_lead` and `lead_form_open` carry `form_location=packages_hub` from the inline form, the hero
    button, "Not sure which one?", the empty state and the card Customise buttons.
  - `select_item` carries `item_list_name=packages_most_booked` from the cards and `packages_index` from the index rows.
  - I didn't see these events fire, because GA isn't configured on the local dev server.
- **Japanese.** There are no concierge links: the end block has none, and the floating concierge already hides for JA.
  The counters read ツアー 87 / 料金 ¥20,000〜 / ガイド 1993年から. The spec's labels are split across the
  counter's label and value columns.
- **Test leads.** `/api/lead` has no `@test.travel2egypt.org` test mode, so a test submission would create a
  real lead and email info@. I checked everything up to sending only: the hero, theme and empty-state buttons
  open the dialog, and the card Customise opens it with the tour and its length filled in.

## 3. Screenshots

`docs/packages-hub-2026-11-09/`:
- `en-1440x782-first-screen.jpg`
- `en-375-top.jpg`
- `en-375-index.jpg`
- `ja-375-top.jpg`
- `ja-375-most-booked.jpg`

## 4. Data problems (report only, nothing fixed)

All 89 published private packages were checked, using their EN titles. Prices are the stored EUR `priceFrom`.

### 4.1 Same-titled duplicate products

| Slug | Title | Theme | Price (EUR) |
|---|---|---|---|
| `desert-oasis-2-day-bahariya-oasis-private-tour-from-cairo` | Two Days from Cairo into the Western Desert: Bahariya, Black and White | Special Interest | none |
| `private-tour-2-day-trip-to-bahariya-oasis` | Two Days from Cairo into the Western Desert: Bahariya, Black and White | Adventure | 220 |
| `mount-sinai-pilgrimage-2-day-trip-to-saint-catherine-from-cairo` | Two Days from Cairo to Mount Sinai and Saint Catherine's | Egypt on the Go | 325 |
| `private-tour-2-days-1-night-trip-to-saint-catherine-from-cairo` | Two Days from Cairo to Mount Sinai and Saint Catherine's | Adventure | 325 |

All four are published. The hub's journey counter counts each title once (87, not 89).

### 4.2 Near-duplicates

| Pair | Why |
|---|---|
| `02-day-luxor-tour-by-plane-from-cairo` (Luxor by Air: A Two-Day Tour from Cairo, no price) and `luxor-2-day-tour-by-plane-from-cairo` (Aerial Odyssey: Luxor 2-Day Tour by Plane from Cairo) | Same trip: 2 days, Luxor by air from Cairo. |
| `desert-horizons-7-day-bahariya-siwa-oasis-tour` (7-Day Bahariya & Siwa Oasis Tour, €1,460, Special Interest) and `bahariya-and-siwa-oasis-vacation` (Desert Horizons: Seven Days into Egypt's Deep West, €1,700, Adventure) | Same 7 days, same two oases. The title "Desert Horizons" sits on the *other* product's slug. |
| `7-days-luxury-dahabiya-cruise-on-the-nile` (7-Day Dahabiya Cruise on the Nile: Luxor to Aswan, no price) | A generic Luxor→Aswan dahabiya week alongside five boat-named versions of the same route (Adelaïde, Agatha, Malouka, Roman, Meroe). It may be redundant. |

### 4.3 Duration mismatches

| Slug | Title | Listed | Problem |
|---|---|---|---|
| `2-day-pyramids-mediterranean-tour` | Alexandria in a Day: Catacombs, Columns & the Mediterranean Coast | 2 days | The title says one day, and the slug says "pyramids". **It is also the cheapest package (€115), so it sets the hub's "From $130 / ¥20,000" counter and the "Egypt on the Go" theme's "from" price.** Fixing its duration or moving it to day tours would raise both. |

### 4.4 One-day products in the multi-day index

Only the Alexandria product above. Every other package has 2 days or more.

### 4.5 Theme names that read as marketing tags

- **Hassle Free** (6 journeys). Left as it is, as the spec says.
- **Egypt on the Go** (14 journeys). This also reads as a tag rather than a kind of trip.

### 4.6 Other things worth a look

- **10 packages have no price** and show "Price on request" in the index:
  - Luxor by Air
  - the Special Interest Bahariya duplicate
  - Cairo Weekend City Break
  - 5 of the 7 dahabiya weeks (all but Meroe and the Aswan→Luxor one)
  - 8-Day Egypt Highlights
  - 8-Day Red Sea Hurghada
- **`5-day-lake-nasser-cruise-from-aswan` is priced €186** for 5 days, which looks low. Please check it.

## 5. Not done, and why

- **No live lead was submitted.** `/api/lead` has no test mode (see above).
- **GA4 events weren't observed firing.** GA isn't configured on the local dev server. The calls are the
  same `track()` helpers the homepage uses.
- **Section 8 issues aren't fixed.** The spec says report only, so they wait for the owner's decision and
  the recrawl redirects.
