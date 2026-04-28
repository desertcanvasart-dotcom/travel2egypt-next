# Destination-hub misclassification — *-egypt suffix deferred list

Source: session 5 pre-flight (2026-04-28). Classifier `*-egypt` rule at
`scripts/wp-classifier.ts:408` overshoots, classifying tour packages and topic
articles as destination-hub. These 27 *-egypt pages are deferred from session 5's
city import.

Each page is classified manually below as a structured input for the session that
owns the actual target type. "unclear" entries need Islam triage at the start of
their owner session.

`egypt-travel-guide` (id 56654) — surfaced separately during the *-travel-guide
spot-check — is not in this list. Decision recorded in
`migration/known-issues.md` "Cutover decisions made" Q5: WP archive/index page,
not migrated to any Sanity doc; redirect at cutover.

## Counts by target type

| Target type | Count | Owner session |
|---|---:|---|
| `tour` | 5 | session 8 (tour-or-package) |
| `guideArticle` | 20 | session 6 (destination-subpage) |
| `unclear` | 2 | needs Islam decision before owner-session work |

Total: 27 pages (the *-egypt suffix bucket from session 5 pre-flight). The
28th page (`egypt-travel-guide`) was relocated to "Cutover decisions made"
Q5 in `migration/known-issues.md` — redirected at cutover, not migrated.

## Per-page classification

| WP id | Slug | Title | Body chars | Target | Rationale |
|---:|---|---|---:|---|---|
| 614 | `about-egypt` | About Egypt | 16674 | `guideArticle` | topic signals: slug-topic-prefix |
| 60892 | `airports-in-egypt` | Airports In Egypt | 38065 | `guideArticle` | topic signals: slug-*-in-egypt, slug-topic-prefix |
| 60895 | `bargaining-in-egypt` | Bargaining in Egypt | 7351 | `guideArticle` | topic signals: slug-*-in-egypt |
| 73307 | `culinary-journey-in-egypt` | Culinary Journey in egypt | 12592 | `guideArticle` | topic signals: slug-*-in-egypt, slug-cultural/culinary |
| 73387 | `cultural-etiquette-in-egypt` | Cultural Etiquette In Egypt | 6677 | `guideArticle` | topic signals: slug-*-in-egypt, slug-cultural/culinary |
| 60953 | `electricity-in-egypt` | Electricity in Egypt | 43563 | `guideArticle` | topic signals: slug-*-in-egypt, slug-topic-prefix |
| 60909 | `language-in-egypt` | Language in Egypt | 31684 | `guideArticle` | topic signals: slug-*-in-egypt, slug-topic-prefix |
| 61367 | `month-by-month-guide-to-egypt` | Month-by-Month Guide to Egypt | 14896 | `guideArticle` | topic signals: slug-guide-to |
| 60912 | `ramadan-in-egypt` | Ramadan in Egypt | 6544 | `guideArticle` | topic signals: slug-*-in-egypt |
| 60507 | `reaching-siwa-egypt` | Reaching Siwa Egypt | 20394 | `guideArticle` | topic signals: slug-reaching-* (subpage candidate) |
| 60534 | `reaching-sohag-egypt` | Reaching Sohag Egypt | 20339 | `guideArticle` | topic signals: slug-reaching-* (subpage candidate) |
| 60931 | `solo-woman-traveler-in-egypt` | Solo Woman Traveler In Egypt | 11401 | `guideArticle` | topic signals: slug-*-in-egypt, slug-traveler(s)-* |
| 60914 | `telephones-in-egypt` | Telephones In Egypt | 19392 | `guideArticle` | topic signals: slug-*-in-egypt, slug-topic-prefix |
| 60929 | `time-in-egypt` | Time in Egypt | 8516 | `guideArticle` | topic signals: slug-*-in-egypt, slug-topic-prefix |
| 60933 | `tipping-in-egypt` | Tipping In Egypt | 9921 | `guideArticle` | topic signals: slug-*-in-egypt, slug-topic-prefix |
| 60949 | `toilets-in-egypt` | Toilets In Egypt | 42491 | `guideArticle` | topic signals: slug-*-in-egypt, slug-topic-prefix |
| 60950 | `touts-in-egypt` | Touts In Egypt | 8936 | `guideArticle` | topic signals: slug-*-in-egypt, slug-topic-prefix |
| 60934 | `transportation-in-egypt` | Transportation in Egypt | 24933 | `guideArticle` | topic signals: slug-*-in-egypt, slug-topic-prefix |
| 60951 | `vegetarian-travelers-to-egypt` | Vegetarian Travelers to Egypt | 9087 | `guideArticle` | topic signals: slug-traveler(s)-* |
| 60954 | `wifi-in-egypt` | WIFI In Egypt | 40871 | `guideArticle` | topic signals: slug-*-in-egypt, slug-topic-prefix |
| 89438 | `10-days-felucca-journey-through-egypt` | Nile Sails: 10-Days Felucca Journey Through Egypt | 44835 | `tour` | tour signals: slug-N-day-prefix, slug-vacation/holiday/trip/journey, body-included/excluded |
| 112993 | `12-day-amazing-family-vacation-in-egypt` | 12-Day Amazing Family Vacation in Egypt | 66205 | `tour` | tour signals: slug-N-day-prefix, slug-vacation/holiday/trip/journey, body-included/excluded |
| 89558 | `essential-egypt` | Egypt Unveiled: 8-Day The Essential Egypt Tour | 50844 | `tour` | tour signals: body-included/excluded, body-day-1, body-itinerary |
| 89452 | `the-holy-family-trip-in-egypt` | Sacred Journey: 15-Day The Holy Family Trip In Egypt | 52346 | `tour` | tour signals: slug-tour-of/the-N-day, slug-vacation/holiday/trip/journey, body-included/excluded |
| 89353 | `tour-of-egypt` | Pharaohs&#8217; Epic: 18-Day Grand Tour of Egypt Exploration | 57324 | `tour` | tour signals: slug-tour-of/the-N-day, body-included/excluded, body-day-1 |
| 60896 | `currency-in-egypt` | Currency in Egypt | 13752 | `unclear` | aggregator/listing: 4 tour-titles in headings (listing page); not a single tour, not a city, not a topic-article — needs Islam decision (page? tour-listing? guideArticle?) |
| 86640 | `hassle-free-egypt` | Hassle Free Egypt | 62831 | `unclear` | aggregator/listing: 6 tour-titles in headings (listing page); not a single tour, not a city, not a topic-article — needs Islam decision (page? tour-listing? guideArticle?) |

## Heuristic notes

**Tour signals** (≥2 → `tour`):
- slug starts with `<N>-day(s)-` / `<N>-night(s)-`
- slug contains `itinerary`, `package`, `tour-of-`, `the-N-day-`, `vacation`, `holiday`, `trip`, `journey`, `expedition`, `odyssey`
- body contains `Included` AND `Excluded` markers
- body contains `Day 1` / `Day-1` / `Day 1`
- body contains `Itinerary`
- body contains `Book Now`

**Topic signals** (any → `guideArticle`):
- slug ends with `-in-egypt` (strongest signal)
- slug starts with a known topic prefix (`driving-`, `wifi-`, `electricity-`, `toilets-`, `touts-`, `transportation-`, `tipping-`, `airports-`, `telephones-`, `language-`, `time-`, `about-`, etc.)
- slug contains `guide-to-` / `cultural-` / `culinary-`
- slug starts with `reaching-` (subpage candidate)
- slug contains `traveler(s)`

**Aggregator signal** (→ `unclear`):
- Body contains ≥3 `<N>-Day` tour titles in `<h2>/<h3>` headings → listing page; not a single doc, needs page/collection decision

## Per-session next steps

- **Session 6 (destination-subpage / guideArticle)**: ingest the `guideArticle` rows. Validate during session 6's own pre-flight that these slugs don't collide with destination-subpage slugs already in scope.
- **Session 8 (tour-or-package)**: ingest the `tour` rows. Same validation.
- **`unclear` rows**: Islam reviews at the start of the relevant owner session. The `aggregator` cases (`hassle-free-egypt` etc.) likely need a new `_type` decision — possibly `page` or a new `tourCollection` schema.