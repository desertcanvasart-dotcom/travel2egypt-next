# WP "Places to visit" sampling (informational, session 5 step 1)

Goal: characterize whether destination-hub WP pages contain editorial commentary about
Places to visit (worth preserving; would surface to Islam as a session-7 input) vs. listy
monument names (safe to discard since session 7 owns placesToGo from monument reverse-refs).

**Sampled 2026-04-28.**

## 83284 — `cairo-travel-guide`

**Title:** Cairo Travel Guide
**Why sampled:** major destination, prime places-to-visit candidate
**Modified:** 2025-04-08
**Body length:** 27698 chars
**All headings (2):** ['Discover the Heart of Egypt: A Comprehensive Cairo Travel Guide', 'Etymology and the Essence of Cairo']
**Places-to-visit candidate headings (0):** []

---

## 58932 — `siwa-oasis-travel-guide`

**Title:** Siwa Oasis Travel Guide
**Why sampled:** smaller/oasis destination, recently modified
**Modified:** 2026-04-12
**Body length:** 20178 chars
**All headings (1):** ['Siwa Oasis Travel Guide']
**Places-to-visit candidate headings (0):** []

---

## 58927 — `sharm-el-sheikh-travel-guide`

**Title:** Sharm El Sheikh Travel Guide
**Why sampled:** major resort destination
**Modified:** 2026-04-12
**Body length:** 20608 chars
**All headings (1):** ['Sharm El Sheikh Travel Guide']
**Places-to-visit candidate headings (0):** []

---

## 73387 — `cultural-etiquette-in-egypt`

**Title:** Cultural Etiquette In Egypt
**Why sampled:** topic-hub article, not a city
**Modified:** 2025-05-15
**Body length:** 6677 chars
**All headings (13):** ['Introduction to Egyptian Etiquette', 'Dress Code', 'Modesty is Paramount', 'Adapting to the Climate', 'Social Etiquette', 'Greetings', 'Language', 'Hospitality', 'Dining Etiquette', 'Negotiating and Shopping', 'Respecting Religious Practices', 'Tips for a Respectful and Enjoyable Visit', 'Conclusion']
**Places-to-visit candidate headings (0):** []

---

## 112993 — `12-day-amazing-family-vacation-in-egypt`

**Title:** 12-Day Amazing Family Vacation in Egypt
**Why sampled:** tour package misclassified as destination-hub
**Modified:** 2025-09-22
**Body length:** 66205 chars
**All headings (7):** ['12-Day Amazing Family Vacation in Egypt', 'Customizable Itinerary', 'Overview', 'Note:', 'Included', 'Excluded', '12-Day Amazing Family Vacation in Egypt Tour Plan']
**Places-to-visit candidate headings (0):** []

---


## Deeper scan of Cairo (the only sample worth disambiguating)

`cairo-travel-guide` has 27KB body but only 2 native `<h2>/<h3>` headings. A
deeper substring scan reveals:

- `Things To Do` — 1 occurrence, inside an Elementor tabs widget
  (`elementor-tab-title`, tab id 2564). Editorial content sits inside the
  tab pane, not under a native heading.
- `highlights` — 1 occurrence, inline prose: "Highlights include the
  awe-inspiring Pyramids of Giza, the treasure trove of the Egyptian
  Museum of…"
- `sightseeing` — 1 occurrence, also an Elementor tab title.

**Implication for Q3.1 placesToGo:** Cairo's "Things To Do" content is
**not lost** by leaving placesToGo untouched. It lives in the `overview`
body field that the Q3 unified rule overwrites from WP. The HTML→PT
pipeline strips Elementor tab wrappers but preserves inner text. The
editorial commentary about places-to-visit migrates as ordinary body
content; session 7's monument reverse-refs populate the structured
`placesToGo` array separately. No discard cost.

**Outcome:** Step 1's central question ("purely listy → lossless, vs.
editorial commentary → editorial-loss decision needed") resolves to
**lossless**. Q3.1 placesToGo-out-of-scope remains the right call.

---

## Classifier categorical finding (session-5-discovered)

The 69 destination-hubs the classifier picked for session 5 split as:

- **42 `*-travel-guide`** pages — true destination guides (cairo-travel-guide, dahab-travel-guide, etc.). These are the legitimate city documents.
- **27 `*-egypt`** pages — mixed bag. Some are topic articles (cultural-etiquette-in-egypt, wifi-in-egypt, toilets-in-egypt) that fit guideArticle better than city. Some are tour packages (12-day-amazing-family-vacation-in-egypt, essential-egypt, tour-of-egypt) that fit tour-or-package.
- **0 true-destination slugs** — slugs like `cairo`, `luxor` directly do not exist in the page corpus.

The `*-egypt` suffix rule in `scripts/wp-classifier.ts:408` overshoots. ~27/69 = ~39% of the "city" import will be writing the wrong _type for the content. This is a session-5-pre-flight discovery worth Islam-direction. Options: (a) accept and clean up editorially post-migration, (b) tighten classifier in this session, (c) split the run into 42 travel-guide pages now and surface the 27 *-egypt for re-classification before writing them as cities.
