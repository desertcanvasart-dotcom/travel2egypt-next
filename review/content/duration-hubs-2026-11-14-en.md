# Duration hubs: "X-day Egypt tours" (plan + EN draft copy, 2026-11-14)

**Status: LOCKED by owner 2026-11-14 ("Lock it, build them").** Canon Gate A source of truth.

## Why

**Demand (GSC, 16 months).** Duration searches got **42,000 impressions** and **5 clicks**, at average position **50**:

| Length | Impressions (top-100 queries) | Examples |
|---|---|---|
| 10 days | ~7,470 | egypt itinerary 10 days 1,086 · 10 day egypt tours 931 |
| 14 days / 2 weeks | ~6,040 | 14 day egypt tours 1,173 · 2 week egypt tour 682 |
| 7 days | ~5,050 | 7 day egypt tour 1,067 · 7 day egypt tours 1,053 |
| 4 days | ~4,730 | 4 day egypt tour 851 · 4 days egypt tour 845 |
| 12 days | ~3,890 | 12 day egypt tour 939 |
| 8 days | ~3,360 | 8 day egypt tour 1,328 |

**What happened to the old pages.** The WordPress site had duration hubs, and Google still credits their URLs:

| Old URL | Impressions | Today |
|---|---|---|
| `/7-days-egypt-tours/` | 4,665 | redirects to **one** 7-day tour |
| `/4-days-egypt-tours/` | 4,427 | **404** |
| `/8-days-egypt-tours/` | 3,909 | redirects to Essential Egypt |
| `/12-days-egypt-tours/` | 3,877 | redirects to one 12-day tour |
| `/14-days-egypt-tours/` | 3,151 | redirects to one 14-day tour |
| `/10-days-egypt-tours/`, `/5-days-…`, `/15-days-…` | — | **404** |

People searching "7 day egypt tours" want a *choice*. A single tour, or a 404, can't rank for that.

## Plan: 4 hubs at the old URLs (same template as Family Holidays and Christmas)

| Hub | URL (reclaims old) | Lists | Tours today |
|---|---|---|---|
| Short breaks | `/4-days-egypt-tours` | all 3–5-day packages | 20 |
| One week | `/7-days-egypt-tours` | all 7–8-day packages | 23 |
| Ten days | `/10-days-egypt-tours` | all 9–11-day packages (incl. 3 small-group) | 23 |
| Two weeks | `/14-days-egypt-tours` | all 12–15-day packages (incl. 1 small-group) | 13 |

**Redirect changes** (in the migration redirect map, with the regenerator guard respected):
- **Remove** the old redirects for `/7-days-egypt-tours` and `/14-days-egypt-tours`. The hubs live there now.
- **Repoint** to the matching hub:
  - `/8-days-egypt-tours` → 7-day hub
  - `/5-days-egypt-tours` → 4-day hub
  - `/9-days-egypt-tours` and `/11-days-egypt-tours` → 10-day hub
  - `/12-days-egypt-tours` and `/15-days-egypt-tours` → 14-day hub
- **Keep** `/explore-egypt-in-10-days` → the "Ten Days in Egypt" blog, since that's an itinerary guide, not a list.

**Tour lists are data-driven.** The build script selects packages by `durationDays` at write time. The first three are the featured picks below, in this order; please confirm or swap.
- **4 days:** 4-Day History & Culture Escape · The Elegant Cairo 4 Days · Cairo and Alexandria 4-Day Family Package
- **7 days:** 7 Days in Egypt: Pyramids, Temples and Timeless Wonders · 8-Day Essential Egypt · 8-Day Cairo and Nile Cruise
- **10 days:** 10-Day Egypt Travel Journey Through History · 10-Day Egypt Group Tour (Cairo, Nile, Red Sea) · 9-Day Classic Egypt Family Adventure
- **2 weeks:** 12-Day Egypt Group Tour (Cairo, Dahabiya, Red Sea) · 13-Day Impressive Egypt Tour · 14-Day Luxury Egypt Family Holiday

**Cross-links.** Each hub links to the matching itinerary guide (e.g. 2-week hub ↔ "Two Weeks in Egypt"), and each guide links back.

## Copy sources
- **Itinerary facts** come from your published "Egypt Travel Itineraries by Day Count" guide.
- **Peak dates** come from your facts of 2026-11-14.
- That guide's own English reads like a rough translation (e.g. "Premise more than half a day for transfer"). The copy below is rewritten cleanly from the same facts, which is why it needs your lock. Tidying the guide itself would be a separate task.

---

## Hub 1: `/4-days-egypt-tours`
**SEO title:** 4-Day Egypt Tours: Short Breaks of 3 to 5 Days
**Meta description:** Short Egypt tours of three to five days: Cairo and the pyramids, Alexandria, a stretch of the Nile or the Western Desert. Private, and starting on any date.
**H1:** 4-Day Egypt Tours

**Lede:** Four days is enough for Cairo and Giza with one more thing added, not for the whole country. The tours here run three to five days, and each keeps to one region: Cairo and the pyramids, Alexandria on the Mediterranean, a stretch of the Nile, or the Western Desert.

**Heading:** What fits in four days
> Egypt takes more travel time than the map suggests: Cairo traffic, airports, domestic flights and the walking at each site all eat into the day. On a short trip, one region done well beats several done in a hurry.
>
> With four days, add one major thing to Cairo and Giza. That could be Saqqara, Dahshur and Memphis, which show how pyramid-building developed, or a day or a night in Alexandria.
>
> With five days, a northern trip of Cairo, Giza, Saqqara and Alexandria works without strain. So does a trip based in Aswan, for Philae, the Nubian Museum and Abu Simbel. Fitting Cairo, Luxor, Aswan and Abu Simbel all into five days leaves too much of it in transit.

## Hub 2: `/7-days-egypt-tours`
**SEO title:** 7-Day Egypt Tours: One Week in Cairo, Luxor and Aswan
**Meta description:** One-week Egypt tours of seven or eight days: Cairo and the pyramids with Luxor, Aswan and the Nile, by road, by air or on a cruise. Private, and starting on any date.
**H1:** 7-Day Egypt Tours

**Lede:** Seven days is the shortest trip that properly connects Cairo with the temples of Upper Egypt. Eight makes room for Abu Simbel. The tours here run seven or eight days, by road, by air or on the Nile.

**Heading:** What fits in a week
> A week usually splits into two or three days in Cairo and Giza and four or five in Luxor and Aswan. In Cairo, choose between the pyramids, the museum and Saqqara rather than trying to see everything.
>
> In Luxor, the east bank (Karnak and Luxor Temple) and the west bank (the Valley of the Kings, Hatshepsut's temple and the Colossi of Memnon) are the core. Seeing the whole west bank in one day is tiring, so decide what to see in depth.
>
> With eight days, Abu Simbel fits more easily: two days each in Cairo, Luxor and Aswan, one for Abu Simbel and one for travel. Several of the seven-day journeys here are dahabiya cruises between Luxor and Aswan.

## Hub 3: `/10-days-egypt-tours`
**SEO title:** 10-Day Egypt Tours: Cairo, the Nile and Abu Simbel in Depth
**Meta description:** Egypt tours of nine to eleven days: Cairo, Luxor, Aswan and Abu Simbel without the rush, with private journeys on any date and small-group departures on fixed dates.
**H1:** 10-Day Egypt Tours

**Lede:** Ten days is where an Egypt trip stops being a race. Cairo, Luxor, Aswan and Abu Simbel connect without strain, with time to go deeper at each. The tours here run nine to eleven days.

**Heading:** What ten days adds
> In Cairo, there's time beyond Giza: Saqqara or Dahshur make the history of the pyramids three-dimensional, and the museums and Islamic Cairo show the city beyond antiquity.
>
> In Luxor, the west bank no longer has to fit into one day. The Valley of the Kings, Hatshepsut's temple, Medinet Habu and Deir el-Medina, the village of the tomb-builders, can be split by interest.
>
> At eleven days, the Red Sea or Sinai becomes possible as an addition to the Nile valley. Choose one; including both scatters the trip.

## Hub 4: `/14-days-egypt-tours`
**SEO title:** 14-Day Egypt Tours: Two Weeks Across the Nile and Beyond
**Meta description:** Two-week Egypt tours of twelve to fifteen days: the Nile valley plus the Red Sea, Sinai, Alexandria or the Western Desert. Private journeys and small-group departures.
**H1:** 2-Week Egypt Tours

**Lede:** Two weeks lets you see Egypt as a country of regions rather than a chain of sights: the Nile valley plus the Red Sea, Sinai, Alexandria or the Western Desert. The tours here run twelve to fifteen days.

**Heading:** What two weeks allows
> One way to build it: three days in Cairo and Giza, three in Luxor, three in Aswan and Abu Simbel, three on the Red Sea, and the rest for travel. That gives time to the sites, the river, the sea and the city.
>
> The Western Desert (Bahariya, the White Desert and the Black Desert) needs a private car, permits and local arrangements, so it's planned separately from ordinary travel between cities.
>
> There's no need to include every region. Egypt rewards a return visit, and deciding what to see in depth this time makes for a better trip.

---

## FAQ (same 3 on all four hubs)
1. **Private or small group?** Private journeys start on any date and run at your pace. Small-group tours run on fixed departure dates with a capped group. Where a small-group departure exists at this length, it's listed here.
2. **Do prices change by season?** Yes. Christmas, New Year and Easter are peak dates in Egypt. Scheduled departures on those dates usually cost 30% more, and private journeys cost more over the same dates too.
3. **Nile cruise, or flights and hotels?** A cruise between Luxor and Aswan combines travel and accommodation, so you don't move your luggage every day, and it stops at Edfu, Kom Ombo and Esna on the way. The trade-off is flexibility: the boat sets the timetable. Flying, or driving with a private car, lets you set your own.

*(FAQ 1 is the template's existing wording on fixed departure dates. FAQ 2 is your peak facts. FAQ 3 comes from the itineraries guide's Nile cruise section. No new facts.)*

## After the lock
1. Build the 4 hubs as drafts with a word-for-word check against this file.
2. Make the redirect-map edits plus the guide cross-links in one PR. CI runs `test:redirect-map-integrity`.
3. Publish after the deploy, check live, and request indexing for all 4.
4. ES/JA versions come in a separate review.
