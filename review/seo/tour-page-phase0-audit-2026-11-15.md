# Tour page template: Phase 0 audit (no code changes), 2026-11-15

**Reference:** `/private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara`.
**Sources:** `main` at the time of writing; live-site measurements in Chrome at 1425×763 (the largest this screen allows); exact 1440×900 and 1280×720 through viewport emulation on a local build of the same code against production content.

> ⚠️ **Freeze conflict.** Phase 1 changes the buying path, which is frozen until 12 Dec (mentor's measurement window, agreed 15 Nov). See "Recommendation" at the end.

## 1. Components that render each part

Day tours render through `src/components/tour-system/SingleTourView.tsx`. Packages render through `PackageView.tsx`, which has the same rail pattern ("shape of the journey").

| Part | Component | Where |
|---|---|---|
| Eyebrow, H1, italic intro | inline header | `SingleTourView.tsx:220-224`: `<header className="head pdp-head">` with `.t2e-kicker`, `<h1>{tour.title}</h1>`, `<p className="dek">{tour.summary}</p>` |
| Hero image | `JourneyImage` | `SingleTourView.tsx:226-228` (`figure.pdp-hero`) |
| Decision panel (right column, top) | `DayTourPanel` | `SingleTourView.tsx:231-240` → `src/components/product/ProductPanels.tsx:158` |
| "Make it your own" | `MakeItYourOwn` | `SingleTourView.tsx:241-249` → `src/components/product/RightColumn.tsx` (renders only with approved options) |
| Sticky enquiry card | `CompactStickyCard` + `StickyCardShell` | `SingleTourView.tsx:250-258` → `RightColumn.tsx:96`; show/hide logic in `src/components/product/StickyCardShell.tsx` |
| Itinerary body | `ProductFactsBlock` + `TourProse` + timeline / notes + `MidCta` | `SingleTourView.tsx:261-311` |
| "The shape of the day" card | inline | `SingleTourView.tsx:314-324` (inside `.pdp-details`) |
| "Why book with us" card | inline | `SingleTourView.tsx:325-329` (inside `.pdp-details`) |
| "Plan your trip" band | `EndBlock` (heading "Check a date for this day.", carries `data-end-form`) | `SingleTourView.tsx:335-343` → `ProductPanels.tsx:309` |

## 2. Two-column layout, and why the card isn't visible beside the two cards

**Your belief needs correcting.** The two cards are **inside** the two-column container.
- `.pdp` is the grid (`src/styles/product-page.css:6-35`): `minmax(0,1fr) 380px` from 1024px up.
- `.pdp-main` (column 1) holds the body *and* `.pdp-details` (the two cards), at `SingleTourView.tsx:313`.
- `.pdp-side` (column 2) stretches the full height of that row (`product-page.css:208`).
- Both columns end together at the bottom of `.pdp`, at `SingleTourView.tsx:332`. `EndBlock` follows outside the grid.

**The real cause is the hide trigger**, `StickyCardShell.tsx:64`:

```ts
const endInView = end ? end.getBoundingClientRect().top < window.innerHeight : false;
```

The card hides as soon as the **top edge** of the end block enters the bottom of the viewport. On the reference page the two cards sit right above the end block (cards 4,908–5,302px, end block from 5,342px). So whenever they're on screen, the end block is already peeking in and the card has switched off.

Live scan at 1425×763:

| Scroll position | Card state |
|---|---|
| 1,800 → 4,500px | on |
| from 4,800px | off |
| 4,150 → 5,300px | the two cards are on screen |

The card also stays hidden until the whole decision panel has scrolled away (≈1,800px), by design (`StickyCardShell.tsx` header comment). So between about 1,050 and 1,800px the right column shows the panel, then nothing until the card fades in.

**Fix direction for Phase 1:** hide only when the end block reaches the card's *bottom edge*, not the viewport bottom. That's a one-line change; the grid is fine.

## 3. Sanity fields for "The shape of the day" and tour type

`SingleTourView.tsx:125-139`; query `src/sanity/lib/queries.ts:482` (`shapeOfDay{…}`).

| Row | Primary field | Fallback when empty |
|---|---|---|
| Where | `shapeOfDay.where` (localized) | the `cities[]` names joined, else the city name |
| Duration | `shapeOfDay.duration` | `durationLabel`, else "N days" from `durationDays` |
| Character | `shapeOfDay.character` | track label (Private / Small group) + `groupSize` |

**Tour type exists:** `tourMode` (`private` | `group`), queries.ts:261. Every tour has it: 0 missing. Content type is `type` (`dayTour` | `package`).

**Important for ROUTE.**
- The reference tour has **no `shapeOfDay.where`**. Its card shows the fallback "Cairo", so "Giza → Memphis → Saqqara" is not in the data.
- The 114 day tours that *do* have "Where" hold long sentences, not short routes. Two examples:
  - "Sharm El Sheikh → Taba/Eilat border crossing → Jerusalem Old City (Mount of Olives, Western Wall, …) → Dead Sea shore → Bethlehem … → Sharm El Sheikh"
  - "Aswan → Abu Simbel (Great Temple of Ramses II and Temple of Hathor) → Aswan, along the western shore of Lake Nasser"
- `routeLegs` (the structured, review-gated route field) is filled on **0 day tours** and 4 packages.
- A clean ROUTE row therefore needs either a new short field, or a rule that keeps only the "A → B → C" stops (dropping the brackets). **Decision for you.**

## 4. "From" price source and currency

- **Page:** `fromAmount = tour.priceFrom ?? priceTiers[0].price` (`SingleTourView.tsx:109-112`).
- **Search snippet:** `tour.priceFrom` only (`[...rest]/page.tsx`, `priceFromEur: tour.priceFrom`).
- **Both** read `priceFrom` through `guidePrice(locale)` (`src/sanity/lib/guidePrice.ts`). On ES/JA pages that is `guideLanguagePrices.es|ja` when set (Spanish- or Japanese-guide price), otherwise `priceFrom`. The page's tier fallback only matters when `priceFrom` is empty, and no day tour has an empty `priceFrom`.
- **Currency:** the page renders through `<Price eur>` (`src/components/Price.tsx:13`), which converts on the client with the visitor's `t2e_ccy` choice and the daily ECB rate. The server render uses the locale default (EN USD, ES EUR, JA JPY). The snippet always uses the locale default.
- **A hero price** should use the same `fromAmount` with `<Price>`, as the panel already does, so the switcher works.

## 5. Does the top decision panel already show route, duration or price?

**Yes, all but the route.** `DayTourPanel` (`ProductPanels.tsx:158`; facts built at `SingleTourView.tsx:193-199`) shows:
- **Type:** Private / Small group
- **Duration:** "Full day · about 9 hours"
- **Starts from:** only when `departsFrom` is set (empty on the reference)
- **From price**
- **Buttons:** "Check this date" and WhatsApp

It sits below the hero: 1,033px from the top at 1280×720, so off-screen on first view.

**So a hero facts block would duplicate the panel's Type, Duration and Price.** Phase 1 should either slim or remove the panel's duplicate rows, or have the hero block *replace* the panel at the top of the right column. Otherwise the page states the same facts twice, one screen apart.

## 6. Sticky enquiry card size and offset

| | 1440×900 | 1280×720 | Live 1425×763 |
|---|---|---|---|
| Card height (full, incl. trust line) | 266px | 266px | 266px |
| Right column width | 380px | 380px | 380px |
| Sticky top | `104px` in CSS (`product-page.css:240`). Set live to "visible header height + 24px", which is **24px** once the nav has scrolled away (measured live) | same | same |
| H1 | 76px, 2 lines, 209–361px | 69px, 2 lines, 209–347px | 76px, 2 lines |
| Hero image top | 531px | 517px | 525px |
| Decision panel | 1,053–1,683px (630 tall) | 1,033–1,663px (630 tall) | 1,047–1,677px |

- **Size budget:** at 266px, the card leaves about 384px of the 650px budget for the trust block.
- **Above the fold today:** at 1280×720 the image top is visible (517px), but no price or button is.

## 7. Tours on these templates and missing fields (production, published)

| Template | Tours | Private / group | Missing `shapeOfDay.where` | Missing a route entirely (no Where and no cities) | Missing duration | Missing tour type | Missing from price |
|---|---|---|---|---|---|---|---|
| Day tours (`SingleTourView`) | **117** | 98 / 19 | 3 (incl. the reference) | 0 | 0 | 0 | 0 |
| Packages (`PackageView`) | **90** | 86 / 4 | 85 | **19** | 0 | 0 | **9** |

The "Character" row (the Phase 1 §3 risk) is authored on 114 day tours and 5 packages. For example, the reference tour's Character holds *"includes a Giza camel ride … pyramid interior descent at Menkaure … tiered pricing"*. Whether those details also appear in inclusions or itinerary has to be checked per tour in Phase 1, before the card is removed.

## 8. GA4 events for enquiry CTAs (`src/lib/analytics.ts`, `ProductActions.tsx`, `LeadProvider.tsx`)

| Event | Fired by | Key params |
|---|---|---|
| `form_open` | `ProductLeadButton` click (`ProductActions.tsx:38`) | `location`, `tour` |
| `lead_form_open` | form pop-up opens (`LeadProvider.tsx:86`) | — |
| `select_item` | request from a product card (`LeadProvider.tsx:189`, `RelatedTourActions.tsx`) | `item_list_name`, `item_id`, `action` |
| `generate_lead` (Key event) | form submitted (`LeadForm.tsx:189`) | `form_location`, … |
| `test_lead` | test-mode submission (`LeadForm.tsx:184`) | — |
| `contact` | WhatsApp from product CTAs (`ProductActions.tsx:66`) | `method: 'whatsapp'`, `location`, `tour` |
| `concierge_open` | `ProductActions.tsx:80` | `location`, `tour` |
| `view_item` | product view (`ProductActions.tsx:101`) | — |

Existing `location` values: `product_panel`, `product_options`, `product_sticky_card`, `product_mid`, `product_end`. The convention for a hero button is therefore `form_open` with **`location: 'product_hero'`**, which also flows into `leads.form_location`.

> **Note:** the CTAs **open a form pop-up** (`ProductLeadButton` → `LeadProvider`). They don't scroll to an on-page form. Only `EndBlock` carries an inline form, and only on desktop. "Scroll to the enquiry form" would therefore be a new behaviour; matching the other CTAs would mean the hero button opens the same pop-up. **Decision for you.**

## Decisions needed before Phase 1
1. **ROUTE:** add a short route field per tour, or derive it from "Where" by keeping only the A → B → C stops? (Neither exists in clean form today.)
2. **Duplication:** does the hero facts block replace the decision panel's Type, Duration and Price rows, or does the panel stay as it is?
3. **Hero button:** open the pop-up like every other CTA, or scroll to the end-block form?
4. **Scope:** day tours only (117), or packages too (90, which have more gaps)?
5. **Timing:** see below.

## Recommendation on the freeze
- **Now, safely:** this audit and **Phase 2** (H1 proposals table). Both change nothing.
- **Phase 1:** build it as a PR **but don't merge before 13 Dec**. That's compatible with "do not merge; I approve the diff". It ships right after the December reading, so the measurement window stays clean, and it becomes the first change measured in the *next* window.
- If you'd rather ship it during the freeze, log the release date in `/admin/report` → site changes. The 13 Dec reading would then mix two changes, which is what the mentor warned against.
