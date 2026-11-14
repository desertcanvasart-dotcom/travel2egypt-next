# Page-2 → page-1 pass — EN review (2026-11-14)

**Status: AWAITING OWNER APPROVAL.** Nothing below has been written to Sanity or code.

Source: Google Search Console, last 3 months (Aug 12 – Nov 11, 2026), each query matched exactly, broken down by page. In-content link counts come from a crawl of all 1,430 EN pages, counting links inside `<main>` only (nav and footer excluded).

## What the data shows

1. **Old URL versions still split rankings, but the redirects are fine.** Every trailing-slash and old WordPress URL already 308s to the right page with a correct canonical. Google is still dropping the old versions and will merge them on its own over the next weeks. **No action needed**; I'm noting it so the numbers below make sense.
   - e.g. `/group-day-tours` sits at 20.6, while `/group-day-tours/` drags at 77.9.
2. **Several of our own pages compete for the same search.** Dahabiya (4 pages), Cairo tours (guide vs two hubs), small-group tours (day-tour hub vs the multi-day product) and Oberoi (an old URL ranking ahead of the ship page). Google can't tell which page is the answer, so none of them reaches page 1.
3. **The guide → tour links are thin where it matters:**
   - 24 of 25 Luxor guide pages don't link to `/luxor-private-day-tours`.
   - 16 of 16 Sharm guide pages don't link to the Sharm package.
   - 50 of 50 Nile cruise ship pages don't link to `/nile-cruise-holidays`.
   - The Oberoi Zahra ship page has 1 incoming link; the blog post about the Oberoi Zahra doesn't link to it.
4. **Some search snippets are weak or break Canon rules:**
   - The dahabiya blog's meta description is leftover WordPress filler ("Explore Egypt in style… exclusive tours"), which breaks the Part II §5 filler ban.
   - The Siwa and Sharm guide meta descriptions are one cut-off sentence ("Siwa divides naturally into two kinds of travel.").

## A — SEO title and meta description changes (Sanity `seo.metaTitle` / `seo.metaDescription`)

These fields change only the Google snippet. The visible page title, H1 and body stay as they are. " — Travel2Egypt" is added automatically. Every claim below is taken from the page's existing copy.

| # | Page | Query (impressions @ position) | Current | Proposed |
|---|---|---|---|---|
| A1 | `/luxor-private-day-tours` | luxor private tours 304 @ 17.7 · luxor day tours 346 @ 23.5 | T: Luxor Private Day Tours and Day Trips | **T: Luxor Private Tours: Day Trips with Your Own Guide** · D: *Private Luxor day tours with your own guide: Karnak, Luxor Temple and the Valley of the Kings, plus day trips to Dendera, Edfu, Kom Ombo and Aswan.* |
| A2 | `/guide/cairo/cairo-tours` | cairo tours 121 @ 16.1 | T: Cairo Tours · D: cut-off excerpt ending "…" | **T: Cairo Tours: The Pyramids, Museums, Old Cairo and Day Trips** · D: *Cairo's sites are spread across a large city with heavy traffic, so most visitors book tours, at minimum for the Pyramids and the museums. Every option, from Saqqara to Fayoum.* |
| A3 | `/guide/siwa-oasis/tours-in-siwa-oasis` | siwa tours 228 @ 17.7 (shared with the 4-day tour page) | D: "Siwa divides naturally into two kinds of travel." | **T: Siwa Tours: Local Circuits, Salt Lakes and Great Sand Sea Safaris** · D: *Siwa divides into two kinds of travel: half-day circuits around Shali, the Oracle, the springs and the salt lakes, and 4×4 trips into the Great Sand Sea. How to choose, and when to go.* |
| A4 | `/guide/sharm-el-sheikh/tours-in-sharm-el-sheikh` | sharm el sheikh tours 60 @ 14.6 · excursions 42 @ 12.7 | D: "Sharm El Sheikh sells excursions everywhere." | **T: Sharm El Sheikh Tours and Excursions: What's Worth Booking** · D: *Sharm sells excursions on every corner. Which are worth it: Ras Mohammed and Tiran by boat, the Thistlegorm, desert safaris, Mount Sinai and Saint Catherine's, Cairo by plane.* |
| A5 | `/blog/dahabiya-nile-cruises-wind-powered-journey` | dahabiya nile cruise(s) 196 @ 17.9 (4 pages competing) | D: WordPress filler (breaks Canon) | **T: What Is a Dahabiya? Routes, Season and Who It Suits** · D: **clear the field** so the existing summary is used (*"A dahabiya is a small sailing vessel for travelling the Nile slowly…"*). This hands the commercial "dahabiya nile cruise" term to A6. |
| A6 | `/authentic-dahabiya-nile-cruise` (dahabiya theme hub) | same | T: Dahabiya Nile Cruises: Luxor and Aswan ✓ · D: *The Nile under sail where the wind allows — a handful of cabins and the moorings the big boats can't reach.* | **No change.** The title already targets the term; this page wins once A5 stops the blog competing and B5 sends links here. |
| A7 | `/nile-cruise-holidays` | nile cruise holidays 88 @ 16.8 | T: Nile Cruise Holidays | **T: Nile Cruise Holidays: Luxor–Aswan, Lake Nasser and Cairo Routes** · D unchanged |
| A8 | `/group-day-tours` | egypt small group tours: ranks for multi-day searches at 20.6 | T: Small Group Day Tours | **T: Small Group Day Tours in Egypt** (makes the *day-tour* scope explicit so the multi-day page can take "Egypt small group tours") |
| A9 | `/small-group-travel-packages` | small group egypt tours 557 @ 52 | T: Small Group Egypt Tours: 9 to 12 Days ✓ | Title stays. **H1 "Small-group departures" → "Small Group Egypt Tours"** (visible copy, so this needs your OK). The real fix is links (B4). |

Skipped on purpose:
- **"essential egypt tour" (227 @ 19.6).** This is almost certainly people searching for another operator's tour called "Essential Egypt", so it's low value.
- **Oberoi.** The ship page's title is good editorial; the fix there is links (B3).

## B — Internal links

| # | What | Pages affected | How |
|---|---|---|---|
| B1 | Under the existing 3-tour block on **city guide pages**, add a hub link: **"See all Luxor day tours →"**. Same pattern for each city. | ~25 Luxor, 16 Sharm, plus Cairo, Aswan, Hurghada, Alexandria, Siwa guides (one template change, every city) | **Code**: reuses the wording already approved on the homepage (`home-sales/copy.tsx` `seeAll`), so no new copy. ES/JA strings already exist there. |
| B2 | On every **Nile cruise ship page**, add a link to `/nile-cruise-holidays` next to the existing `/nile-cruises` link | 50 ship pages | **Code**, one template. Link text needs your OK: suggest **"Nile cruise holidays and itineraries →"** |
| B3 | `/blog/experiencing-egypt-aboard-the-oberoi-zahra` → link to `/nile-cruises/oberoi-zahra-nile-cruise`; link the sister ship Oberoi Philae ↔ Zahra | 2–3 pages | **Sanity body edit**: one inline link on the existing words "Oberoi Zahra" (no new copy) |
| B4 | `/group-day-tours` → prominent link to `/small-group-travel-packages` ("Small group Egypt tours of 9–12 days →"). Also from `/cairo-small-group-day-tours`. | 2 pages | **Code** (hub template). Link text needs your OK. |
| B5 | Dahabiya: the blog post's "Tours to go with this" section and the 2 seven-day dahabiya tours → link to the hub `/authentic-dahabiya-nile-cruise` | 3 pages | Sanity body edit, link on existing words |
| B6 | Siwa: the 3 multi-day Siwa/Bahariya tours + 3 Siwa hotel pages → link to `/siwa-oasis-adventure-tour` | 6 pages | Sanity body edit, link on existing words |

## C — Decisions only you can make

1. **"nile cruise" has two hubs:** `/nile-cruises` (directory of ships) and `/nile-cruise-holidays` (cruise itineraries). Which one should own the head term "nile cruise"? My suggestion is `/nile-cruise-holidays` (it's the one that sells), with `/nile-cruises` as "the boats".
2. **"cairo tours" is held by the guide page**, not a sales hub. Leave it there and push from the guide to `/cairo-private-day-tours` and `/cairo-small-group-day-tours` (my suggestion), or retarget the term to a hub?

## After approval

1. Write A (EN) via a staging script with the verbatim pre-flight against this file (Canon Gate A).
2. Ship B1/B2/B4 as one PR.
3. Do the B3/B5/B6 body links.
4. Browser-verify.
5. ES/JA versions of A come in a separate review file.
6. Re-check positions in GSC in about 4 weeks.
