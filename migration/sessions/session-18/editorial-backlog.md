# Session 18 — Editorial backlog reference

26 misclassified tour shells deleted from migration-staging on 2026-05-14.
Operator: when revising travel guide content in Studio, use this list
to identify pages that need to be recreated as proper guideArticles
or hotel docs in their correct entity homes.

Source audit: [migration/sessions/session-18-audit/audit-report.md](../session-18-audit/audit-report.md)

## Cities with missing tour-section content

These were WP aggregator pages with empty bodies. Each city's travel
guide section may need a corresponding "Things to do" / "Tours" page.
Tour counts below show how many bookable tours currently exist for
each city in migration-staging — when count > 0, the new page can
simply list those; when count = 0 the operator may want to surface
monuments / activities instead.

### Abu Simbel
- WP URL: https://travel2egypt.org/top-tours-in-abu-simbel/  
  Title: "Top Tours in Abu Simbel" · type=dayTour
  Existing same-city guide: `abu-simbel-historical-overview` ("Abu Simbel historical overview")
- Surviving tour count for Abu Simbel: **8**

### Al Wadi Al Gadid
- WP URL: https://travel2egypt.org/top-tours-in-al-wadi-al-gadid/  
  Title: "Top Tours in Al Wadi Al Gadid" · type=dayTour
  Existing same-city guide: `history-of-al-wadi-al-gadid` ("History Of Al Wadi Al Gadid")
- Surviving tour count for Al Wadi Al Gadid: **1**

### Dahab
- WP URL: https://travel2egypt.org/private-tours-in-dahab/  
  Title: "Private Tours In Dahab" · type=dayTour
  Existing same-city guide: `dahab-restaurants` ("Culinary Journey")
- Surviving tour count for Dahab: **1**

### Edfu
- WP URL: https://travel2egypt.org/private-tours-in-edfu/  
  Title: "Private Tours In Edfu" · type=dayTour
  Existing same-city guide: `edfu-historical-guide` ("Edfu Historical Guide")
- Surviving tour count for Edfu: **6**

### Giza
- WP URL: https://travel2egypt.org/top-tours-in-giza/  
  Title: "Top Tours In Giza" · type=dayTour
  Existing same-city guide: `how-to-get-to-giza` ("How to Get to Giza")
- Surviving tour count for Giza: **8**

### Kharga Oasis
- WP URL: https://travel2egypt.org/top-tours-in-kharga-oasis/  
  Title: "Top Tours In Kharga Oasis" · type=dayTour
  Existing same-city guide: `how-to-go-to-kharga-oasis` ("How to Go to Kharga Oasis")
- Surviving tour count for Kharga Oasis: **1**

### Nuweiba
- WP URL: https://travel2egypt.org/nuweiba-tour-packages/  
  Title: "Nuweiba Tour Packages" · type=dayTour
  Existing same-city guide: `how-to-go-to-nuweiba` ("How to go to Nuweiba")
- Surviving tour count for Nuweiba: **1**

### Port Said
- WP URL: https://travel2egypt.org/private-tours-in-port-said/  
  Title: "Private Tours In Port Said" · type=dayTour
  Existing same-city guide: `port-said-historical-guide` ("Port Said Historical Guide")
- Surviving tour count for Port Said: **1**

### Qena
- WP URL: https://travel2egypt.org/top-tours-in-qena/  
  Title: "Top Tours In Qena" · type=dayTour
  Existing same-city guide: `qena-historical-overview` ("Qena Historical Overview")
- Surviving tour count for Qena: **1**

### Sharm El Sheikh
- WP URL: https://travel2egypt.org/top-tours-in-sharm-el-sheikh/  
  Title: "Top Tours in Sharm El Sheikh: Explore with Local Experts" · type=dayTour
  Existing same-city guide: `sharm-el-sheikh-small-group-day-tours` ("Sharm El-Sheikh Small Group Day Tours")
- Surviving tour count for Sharm El Sheikh: **7**

### Siwa Oasis
- WP URL: https://travel2egypt.org/siwa-tour-packages/  
  Title: "Siwa Tour Packages" · type=dayTour
  Existing same-city guide: `adventure-activities-in-siwa-oasis` ("Unleashing the Thrill: Top Adventure Activities in Siwa Oasis")
- Surviving tour count for Siwa Oasis: **7**

### Sohag
- WP URL: https://travel2egypt.org/sohag-tour-packages/  
  Title: "Sohag Tour Packages" · type=dayTour
  Existing same-city guide: `sohag-weather-guide` ("Seasons Travel Guide")
- Surviving tour count for Sohag: **1**

### Suez
- WP URL: https://travel2egypt.org/cultural-tours-in-suez/  
  Title: "Cultural Tours In Suez" · type=dayTour
  Existing same-city guide: `getting-around-suez` ("Getting Around Suez")
- Surviving tour count for Suez: **1**

### Taba
- WP URL: https://travel2egypt.org/cultural-tours-in-taba/  
  Title: "Cultural Tours In Taba" · type=dayTour
  Existing same-city guide: `getting-around-taba` ("Getting Around Taba")
- Surviving tour count for Taba: **1**

## Duration-based aggregators (operator: decide if needed)

These were WP listicle pages aggregating tours by trip duration.
Most likely not needed in new structure; the `/tours` landing with
duration filter serves the same intent. 12 entries:

- https://travel2egypt.org/10-days-egypt-tours/  
  (was: `10 Days Egypt Tours` · type=package)
- https://travel2egypt.org/11-days-egypt-tours/  
  (was: `11 Days Egypt Tours` · type=package)
- https://travel2egypt.org/12-days-egypt-tours/  
  (was: `12 Days Egypt Tours` · type=package)
- https://travel2egypt.org/13-days-egypt-tours/  
  (was: `13 Days Egypt Tours` · type=package)
- https://travel2egypt.org/14-days-egypt-tours/  
  (was: `14 Days Egypt Tours` · type=package)
- https://travel2egypt.org/15-days-egypt-tours/  
  (was: `15 Days Egypt Tours` · type=package)
- https://travel2egypt.org/2-days-egypt-tours/  
  (was: `2 Days Egypt Tours` · type=package)
- https://travel2egypt.org/5-days-egypt-tours/  
  (was: `5 Days Egypt Tours` · type=package)
- https://travel2egypt.org/7-days-egypt-tours/  
  (was: `7 Days Egypt Tours` · type=package)
- https://travel2egypt.org/8-days-best-of-egypt-tour-package/  
  (was: `Egypt Highlights: 8-Days Best of Egypt Tour Package` · type=package)
- https://travel2egypt.org/8-days-egypt-tours/  
  (was: `8 Days Egypt Tours` · type=package)
- https://travel2egypt.org/9-days-egypt-tours/  
  (was: `9 Days Egypt Tours` · type=package)

## Outliers — operator-supplied, not in this deletion batch

The two URLs below were called out in the session-18 operator brief
as needing manual recreation in their correct entity homes. They
have empty bodies but were not flagged by the audit's slug-pattern
regex (no listing-style shape), so they are **not** part of the 26
deletions in this session. Operator handles them in Studio.

- https://travel2egypt.org/off-road-from-farafra-to-dakhla/
  → Should be guideArticle in Farafra travel guide, "Places To Go" section
  → Slug suggestion: `places-to-go-in-farafra` (or operator's choice)

- https://travel2egypt.org/taziry-ecolodge-siwa-safari-paradise/
  → Should be hotel entity, city=siwa, category=standard (or operator's choice)
  → Brand name: Taziry Ecolodge (or operator's preferred name)

## Summary

| Bucket | Count |
|---|---:|
| City-shape shells (deleted, this session) | 14 |
| Duration aggregators (deleted, this session) | 12 |
| Outliers (operator handles separately) | 2 |
| **Total in this reference list** | **28** |

---

## §D — Session 21 editorial cleanups (deleted docs needing follow-up)

Source: session-21 deletion-log.json (transaction `11ceQugRC4GuR1GhSnZmOC`, 2026-05-15).
Operator's editorial review — enabled by sessions 19 (Studio enhancement) +
20 (schema reconcile) — surfaced 8 docs across hotel + nileCruise. All 8 had
empty body, no slug, and zero inbound references.

### Tour package to recreate (operator Studio work)

- **4-Days Stay at Marriott Mena House**
  - Former hotel doc: `wp-page-86853` (deleted session 21)
  - Locale names captured for re-creation:
    - EN: "4-Days Stay at Marriott Mena House"
    - ES: "Retiro real de 4 días en Marriott Mena House"
    - JA: "ロイヤルリトリート：マリオット・メナ・ハウスでの4日間の滞在"
  - Operator creates as new tour doc:
    - type: package
    - tourMode: private
    - durationDays: 4
    - city: cairo (or giza — Mena House sits at the Giza pyramids)
    - theme: operator picks
  - The actual hotel `wp-page-63651` ("Marriott Mena House Hotel") was
    preserved and is the natural `relatedHotels` ref for this future tour.

### Future deploy-time redirect (operator decision)

- **Hilton Sharm Shark's Bay** (former hotel `wp-page-72456`, deleted session 21)
  - Pre-deletion the doc already had ES/JA locale fields renamed to "Double
    Tree Sharks Bay Resort" — partial in-flight rename, EN never updated.
  - Redirect target: **Double Tree Sharks Bay Resort** (existing hotel
    `wp-page-77042`, verified live).
  - To add at deploy time. Original WP slug TBD by operator (no slug field
    populated on the deleted doc).

### Theme hub pages to create (operator Studio work)

- **Nile Cruise Holidays** (former cruise `wp-page-86752`, deleted session 21)
  - Locale names: EN "Nile Cruise Holidays" / ES "Vacaciones en un crucero
    por el Nilo" / JA "ナイルクルーズの休日"
  - Operator creates theme content separately (theme hub architecture TBD).

- **Dahabiya Nile Cruise** (former cruise `wp-page-86704`, deleted session 21)
  - Locale names: EN "Dahabiya Nile Cruise" / ES "Crucero Dahabiya por el
    Nilo" / JA "ダハビーヤ・ナイルクルーズ"
  - Same as above.

### Duplicate vessels removed (no operator follow-up needed)

| Vessel | Canonical kept | Duplicate deleted | Rationale |
|---|---|---|---|
| Malouka Dahabiya | `wp-page-64203` ("Malouka Dahabiya") | `wp-page-65309` ("Nour El Nil Malouka Dahabiya") | cleaner name without vendor prefix |
| Adelaïde Dahabiya | `wp-page-83685` ("Adelaïde Dahabiya") | `wp-page-106202` ("Adelaïde Dahabiya: A Journey Along the Nile") | concise vs verbose marketing title |
| Agatha Dahabiya | `wp-page-83686` ("Agatha Dahabiya") | `wp-page-106203` ("Agatha Dahabiya: Journey Along the Nile") | concise vs verbose marketing title |
| Nour El Nil Meroe Dahabiya | `wp-page-64190` | `wp-page-70064` (leading-space name) | data-quality (whitespace prefix) |

### Operator Studio rename pending

- **Pickalbatros Palace Sharm Aqua Park** (hotel `wp-page-72466`)
  - Current EN/ES name carries an odd "8 " prefix: "8 Pickalbatros Palace
    Sharm Aqua Park". JA name is clean.
  - Suggested rename: "Pickalbatros Palace Sharm Resort" (operator's call).
  - Edit in Studio: Hotels & cruises → All hotels → click doc → edit name
    field per locale (EN/ES/JA) → Publish.
