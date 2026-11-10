# Journey pages, Phase A: owner review (EN) — INDEPENDENT AUDIT

**What this is:** an independent second check of `review/journeys/journeys-phase-a-en.md` (main @ dab7544), done on 2026-11-10. Every row keeps its original content and gains three columns: **Recommendation** (Approve / Correct / Reject / Owner only), **Reason** and **Corrected value**. No ☐ box is ticked, and `curation.ts` is unchanged. The owner decides.

**Evidence base:**
- **Live EN pages:** fetched 2026-11-10 from https://travel2egypt.org. Every product URL below returned 200, and every price is the USD figure shown in its sidebar ("From $X per person, 2 sharing").
- **Sanity `production`:** read-only queries for audience notes, summaries, body text, themes and image assets. Products were resolved by slug (`scripts/check-journey-picks.ts`: all 18 picks resolve to published, priced, private multi-day packages).
- **Essays:** `src/components/journeys/*Content.ts` (EN).
- **Homepage cards:** "Travel styles" on https://travel2egypt.org/. Per `src/lib/journeys/data.ts`, once picks are approved a card shows the **lowest approved pick's price**, replacing today's source (`STYLE_CARDS` in `src/components/home-sales/config.ts`).

**Note:** the original file lists prices in EUR as stored. The site shows USD converted at live ECB rates, so this audit gives USD as displayed.

---

## Owner decisions (10 Nov 2026, after the audit)

These are the owner's replies to this audit, recorded here. Nothing is applied to `curation.ts` yet; that needs a separate change.

| # | Decision | Status |
|---|---|---|
| 1 | **First time:** use `10-days-nile-dreamer-tour-experience` ($2,480) instead of `essential-egypt`. | **Agreed by owner.** The why line proposed below stands: "Cairo, the sleeper train south, three nights cruising from Aswan to Luxor, and the Theban temples." |
| 2 | **Desert ↔ Coming back swap:** `4-days-white-desert-wadi-al-hittan-exploration` moves to Desert & quiet, and `3-day-siwa-journey-from-alexandria` moves to Coming back. | **Agreed by owner.** Approve both journeys together. |
| 3 | **Culture & history:** the owner pointed to https://travel2egypt.org/a-9-day-egypt-tour-of-culture-and-history and will find further tours. | The 9-day ($2,650) stands as the Culture pick (already **Approve**). The other Culture picks wait for the owner's choice. If only this pick is approved, the Culture card shows **$2,650**, against $1,350 today (+96%). |
| 4 | **Families, a tour with the Red Sea in the latter part:** the owner suggested https://travel2egypt.org/egypt-and-the-red-sea-paradise. | **Not recommended for Families.** See the check below. |
| 5 | **Families pick 3:** use `11-day-the-splendor-of-egypt-tour` ($3,500) **instead of** `14-day-egypt-luxury-family-holiday`. | **Agreed by owner.** Why line: "Eleven family-paced days from the Giza plateau to Abu Simbel, Luxor's two banks, and the Red Sea." Families picks are now 4 / 9 / 11 days at $750 / $2,340 / $3,500; the card stays at $750. The 14-day becomes an alternate. The page's "Where this usually leads" link to the 14-day is essay copy and is left unchanged. |

### Check: `egypt-and-the-red-sea-paradise`

The page is live (200): 12 days, **$3,650**, theme "Egypt & Red Sea" (not Family). It fails what the owner asked for on two counts:

- **The Red Sea is in the middle, not the latter part.** The product's own text says: "The Red Sea days sit in the middle as deliberate release", with the route "Cairo → Hurghada → Luxor… → Abu Simbel → sleeper train → Alexandria → … → Cairo". The family essay asks for the opposite: "Last, the Red Sea — and the order matters."
- **It has no family pacing in its own text.** Audience note: "Travellers who want maximum geographic range in twelve days; first or second visits hungry for the full sweep". Body: "The pace is demanding in the middle". It also includes Alexandria.

### Family products whose own text puts the Red Sea in the latter part

| Slug | Days | Price (USD, live) | Route (product's own "Where" line) | Family text | Fit |
|---|---|---|---|---|---|
| `14-day-egypt-luxury-family-holiday` (already pick 3) | 14 | $4,240 | Cairo → Aswan → Kom Ombo → Edfu → Luxor → **Hurghada** → Cairo | "Families with children of mixed ages…" | Red Sea in the latter part (4 nights), then a Cairo close. Keep it, with the corrected why line. |
| `11-day-the-splendor-of-egypt-tour` | 11 | **$3,500** | Cairo → Abu Simbel → Aswan → Edfu → Kom Ombo → Luxor → **Hurghada** → Cairo (Memphis, Saqqara, Dahshur) | "Families with children who want both the deep archaeological south and a real coastal pause"; "family-paced… three days on the Red Sea" | **Best match for the owner's ask.** The Red Sea comes after the Nile, and 11 days sits inside the essay's "10–12 days with the Red Sea close". It could replace the 14-day (spread 4 / 9 / 11 days at $750 / $2,340 / $3,500), or be added as a fourth option. Owner's choice. Suggested why line, trimmed from its summary: "Eleven family-paced days from the Giza plateau to Abu Simbel, Luxor's two banks, and the Red Sea." |
| `12-day-amazing-family-vacation-in-egypt` | 12 | $3,700 | Cairo → **Hurghada** → Luxor → … → Aswan → Cairo | "Families with children of mixed ages…" | The Red Sea comes early, so it doesn't match the ask. |

---

## 5. Summary

### 5.1 Per journey

| Journey | Picks: Approve / Correct / Reject / Owner only | Hero image | Subheadings | Facts row | "From" after approval as proposed | "From" after this audit's recommendations | Homepage card today |
|---|---|---|---|---|---|---|---|
| First time | 1 / 1 / 1 / 0 | Owner only (fit OK) | 4 Approve, 1 Correct | 2 Approve, 3 Correct | $1,450 (0%) | $1,450 (0%) | $1,450 |
| Culture & history | 1 / 0 / 2 / 0 | Owner only; better image proposed | 4 Approve, 1 Correct | 3 Approve, 2 Correct | $1,910 (**+41%**) | $2,370 (**+76%**) | $1,350 (owner-stated €1,200) |
| Families | 2 / 1 / 0 / 0 | Owner only; **no people in image**, replacement proposed | 4 Approve, 1 Correct | 4 Approve, 1 Correct | $750 (0%) | $750 (0%) | $750 |
| Desert & quiet | 1 / 1 / 1 / 0 | Owner only (fit OK; possibly upscaled stock) | 2 Approve, 1 Correct | 3 Approve, 2 Correct | $400 (**−44%**) | $400 (**−44%**) | $720 |
| Luxury | 2 / 0 / 0 / 1 | Owner only; **likely Marriott press photo** | 3 Approve, 2 Correct | 1 Approve, 4 Correct | $2,130 (0%) | $2,130 (0%); $2,620 (+23%) if Mena House is dropped | $2,130 |
| Coming back | 0 / 2 / 1 / 0 | Owner only (fit OK) | 4 Approve | 0 Approve, 5 Correct | $720 (**−47%**) | $560 (**−59%**) | $1,350 (owner-stated €1,200) |

Replacement picks proposed here, all live (200), multi-day and priced:

| Journey | Proposed replacement | Price as displayed (USD) |
|---|---|---|
| First time | `10-days-nile-dreamer-tour-experience` | $2,480 |
| Culture & history | `10-day-egypt-travel-journey-through-history` | $2,370 |
| Desert & quiet | `4-days-white-desert-wadi-al-hittan-exploration` (moved from Coming back) | $720 |
| Coming back | `3-day-siwa-journey-from-alexandria` (moved from Desert) | $560 |

### 5.2 Blocking issues

These would put a wrong or misleading claim, image or price on the live site if approved as they are.

1. **Coming back, pick 1 contradicts its own essay.** `4-days-white-desert-wadi-al-hittan-exploration` is a White Desert trip. The Coming back essay says: "If it is the White Desert's rock formations and a night under the stars you are after, that is its own kind of trip — we plan it under [Desert & quiet]." Move it to Desert & quiet.
2. **First time, pick 2 includes what the essay says to leave out.** `essential-egypt` includes "Alexandria on the Mediterranean" (summary). The essay says: "Alexandria, the White Desert, Sinai… none of it belongs in a first trip of ordinary length." The product's audience note also sells "early starts in exchange for breadth", against the essay's "Two anchors a day".
3. **Five "why it suits" lines claim more than their source:**
   - **Family, 14-day:** "Red Sea close". The product ends in Cairo ("four nights on the Red Sea, and a Coptic and Islamic close in Cairo").
   - **Culture, 7-day:** "each given a real day". The source gives a real day to "the Pyramids, the High Dam, and the Theban west bank", not to each city.
   - **First time, 10-day:** "classic arc" is not in the source.
   - **Coming back, 7-day:** the line quotes the essay, not the product.
   - **Coming back, 10-day:** "who already know the river" comes from a different product's audience note.
4. **Culture & history price and fit.** The 7-day pick is a first-timer product, below the essay's "9–12 days; the layers do not compress well". The 18-day pick adds "three days at Hurghada and the Red Sea, the ferry south to Sharm El Sheikh" and Sinai, 50% beyond the stated length. Approving as proposed also raises the card 41%, from $1,350 to $1,910.
5. **Luxury hero is probably not the company's photo.** The asset's original filename is `caimn-exterior.jpg`, which looks like hotel-chain press-photo naming (a property code plus "exterior"). Every other hero in this file is named after the product slug. Don't publish it without a licence.
6. **Family hero has no people.** The proposed felucca image shows boats only, but the brief requires people for Families (ideally a family or child).
7. **Three homepage cards move by more than 15%** if picks are approved: Culture (+41% as proposed), Desert (−44%) and Coming back (−47% as proposed, −59% as recommended). Culture and Coming back today show an owner-stated €1,200, so approving any picks replaces the owner's figure.

### 5.3 Owner-only items

- **Ownership of all six hero images** (and of any replacement proposed here). Sanity has no credit, source or EXIF data for any of them. I couldn't run a reverse image search (no tool available), so stock status is judged by eye only.
- **Luxury, `marriott-mena-house-4-days-stay`:** a perfect style fit, but 4 days against the essay's "10–14 days, unhurried by design". Keep it as a short-stay entry point (the card stays $2,130) or drop it (the card goes to $2,620, +23%).
- **Culture & history "from" price:** no Egypt In Depth multi-day product that fits the essay is priced near the current €1,200. The cheapest fitting pick is $2,370. Decide whether the card should rise or the owner figure stay (by not approving picks yet).
- **Coming back and Desert card prices fall** to $560 and $400. Decide whether that is acceptable.
- **Culture & history gets only two picks** in this audit's version: the hub has no 11–12-day product that fits. Optional third, if you want a longer or Middle Egypt option: `10-days-the-splendid-minya-tour` ($2,900).
- **ES/JA page titles:** I checked them for sense, not as a native speaker.

### 5.4 Recommended approval order

1. **Families: safe now**, with one correction (the 14-day why line) and a different hero.
2. **First time: after one swap** (`essential-egypt` → `10-days-nile-dreamer-tour-experience`) and one why-line correction. The price is unchanged.
3. **Luxury:** approve the 9-day and 10-day picks now. The Mena House pick and the hero need your decisions (length; licence).
4. **Desert & quiet and Coming back: approve together**, because they swap one pick each. Approving only one of them leaves the White Desert or Siwa tour on the wrong page.
5. **Culture & history: last.** It needs two pick changes and a decision on the price jump.

Subheadings, facts and titles can be approved independently of the picks for every journey, using the corrected values below.

---

**How to review** *(original text, unchanged)*: tick ☐ → ☑ to approve a row. To correct a row, write the corrected wording after it (e.g. `→ 8–10 days`). Rows you leave unticked and uncorrected are rejected and deleted. Nothing here renders on the site until you approve it.

**How the tours were ranked** *(original)*:
- **Rule:** published, priced, private multi-day packages from the paired theme hub, ranked by GA4 pageviews (last 90 days), then by price spread.
- **Caveat:** GA4 volumes are very low, so treat the ranking as a weak tie-breaker.
- **Quotes:** each "why it suits" line is written from the product's own text, with the source sentence quoted exactly.
- **Prices:** shown in EUR as stored (the site converts them).

**Images** *(original)*: each hero is an existing Sanity image from one of the proposed tours. Sanity stores no credit or source for these assets. Please confirm ownership before approving.

---

## First time in Egypt  ·  `/journeys/first-time-in-egypt`  ·  hub `/hassle-free-egypt`

### 1. Proposed tours

_Owner decision (10 Nov): the homepage's "First visit" 7-day tour is the first pick._ Essay reference: "8–10 days told properly; 7 at a push", in the order Cairo, then Aswan, then the boat to Luxor, with Alexandria, the White Desert and Sinai left out.

| # | Slug | Title | Days | From (EUR, file) | From (USD, live) | Theme | GA4 views (90d) | Why it suits this traveller | Source sentence (exact quote) | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs` | 7-Day Egypt Tour: Cairo, the Nile Cruise, Luxor and Aswan | 7 | €1,290 | $1,450 | Egypt on the Go (not the paired hub; owner decision) | — | Egypt's essential spine in one week — Cairo, the night train south, a three-night Nile cruise and Luxor. | "First-timers wanting Egypt's spine without an extended trip; travellers who prefer the cruise to repeated hotel moves; anyone with one week to spend properly" (audience note) · "Seven private days that compress Egypt's spine into one week — Cairo's plateau, the overnight train south, a three-night Nile cruise from Aswan to Luxor, and a final day at the Theban temples." (summary) | ☐ | **Approve** | Required by the owner decision, and it is the homepage "First visit" tour ($1,450 = card). It follows the essay's argued order ("a flight to Aswan… before the boat carries you downstream to Luxor"), going south by train instead. The why line is a faithful trim of the summary. | — |
| 2 | `essential-egypt` | 8-Day Essential Egypt Tour: Cairo, Alexandria, Aswan and Luxor | 8 | €1,655 | $1,860 | Hassle Free | 3 | The full first arc in eight days — Giza, Alexandria, Abu Simbel, Aswan and Luxor. | "First-time visitors who want the full arc rather than the edited highlights; travellers willing to accept early starts in exchange for breadth" (audience note) | ☐ | **Reject** | The summary includes "Alexandria on the Mediterranean", and the essay says "Alexandria, the White Desert, Sinai… none of it belongs in a first trip of ordinary length". "Early starts in exchange for breadth" also runs against the essay's "Two anchors a day". Replace it with the tour the essay itself links ("The route described above, built privately and paced the way we have argued it should be"): https://travel2egypt.org/10-days-nile-dreamer-tour-experience, 10 days, **$2,480**, audience note "First-timers wanting the country in proper depth…". | Replace with `10-days-nile-dreamer-tour-experience`. Why: "Cairo, the sleeper train south, three nights cruising from Aswan to Luxor, and the Theban temples." (trimmed from its summary: "Ten private days that take the Nile as the throughline — Cairo, the sleeper train south, three nights cruising from Aswan to Luxor, the Theban temples, and the flight back to Cairo to close.") |
| 3 | `egypt-and-the-nile-tour` | Pharaohs' Legacy: A 10-Day Egypt and Nile Tour | 10 | €2,650 | $2,970 | Hassle Free | 0 | The classic arc with time for Coptic and Islamic Cairo, for a first trip that wants depth as well as breadth. | "First-time visitors who want depth alongside breadth; travellers drawn to Coptic Cairo and the cultural layers as much as the monuments" (audience note) | ☐ | **Correct** | The fit is good: 10 days, no Alexandria or Sinai in the text, and it is the top of the price spread. But "classic arc" is not in the source, and "Islamic Cairo" comes from the summary ("the Christian and medieval city in Coptic and Islamic Cairo"), not the quoted audience note. | Why: "Ten days for a first trip that wants depth alongside breadth, with Coptic and Islamic Cairo." (sources: audience note + summary) |

**Spread after the swap:** 7 / 10 / 10 days at $1,450 / $2,480 / $2,970. The two 10-day picks differ clearly in price and focus (river vs Cairo's layers).

**Alternates** *(original)*: `13-day-impressive-egypt-tour` (13 days, $3,810 live; adds Sinai, so it is rightly excluded), `10-days-eternal-egypt-tour` ($2,410; its summary is unedited day-1 text, so it is not usable), `the-romantic-egypt-tour` ($2,740; includes Alexandria).

### 2. Proposed hero image

| Asset | Thumbnail | Alt text (EN, existing) | Why it fits | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|
| `image-138b5c47b76cd8adafa1cb16b9cee3d2baf4da04-3000x2000-jpg` (from `essential-egypt`) | [view](https://cdn.sanity.io/images/ufallvd2/production/138b5c47b76cd8adafa1cb16b9cee3d2baf4da04-3000x2000.jpg?w=480) | A motorboat on the Nile passes the Old Cataract hotel on the Aswan riverbank. | The essay argues for meeting Aswan, "the gentlest city on the Egyptian Nile", early; this is the Nile at Aswan with the Old Cataract. | ☐ | **Owner only** | Fit is OK: the image shows the Nile at Aswan, matching the essay's "Aswan gives you the river at its calmest". The alt text matches the image (a passenger boat in front of the Old Cataract), and at 3000 px wide it meets the size requirement. It has no watermark and looks like a natural, non-stock shot. It can stay even if `essential-egypt` is dropped as a pick. Confirm this is the company's own photo. | — |

### 3. Proposed essay subheadings

| # | Subheading | Sits above the paragraph starting | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| 1 | The itinerary we are asked for | ¶1: "There is a version of the first Egypt trip…" | ☐ | **Approve** | ¶1 describes the over-packed trip "we are asked to build several times a week". 6 words, plain. | — |
| 2 | Cairo and the river | ¶3: "The essential story runs along the river…" | ☐ | **Approve** | A real topic change to the route; the essay itself says "That arc — Cairo and the river — is the first trip." | — |
| 3 | Two decisions | ¶4: "Two decisions shape everything else." | ☐ | **Approve** | Introduces ¶5 (Cairo) and ¶6 (the order). | — |
| 4 | Between the two, the boat | ¶7: "Between the two, take the boat…" | ☐ | **Correct** | As a stand-alone heading, "the two" has no referent: it means Aswan and Luxor from ¶6. | Between Aswan and Luxor, the boat |
| 5 | What to leave out | ¶8: "And then, the harder half of planning…" | ☐ | **Approve** | ¶8: "what to leave out". | — |

### 4. Facts row values

**Format used across all six journeys:**
- **Length:** "N–M days", plus an optional "(qualifier)".
- **Route:** places separated by " · " (the separator the site already uses for product routes in `data.ts`).
- **Pace:** two clauses joined by ";".
- **Season:** "October–April; …".
- **Suits:** starts with who it suits ("Travellers who…" / "Families…" / "Readers…").

| Field | Current text (quoted) | Proposed | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| Length | "8–10 days told properly; 7 at a push, and we will say what the push costs" | 8–10 days (7 at a push) | ☐ | **Approve** | Same meaning; this is the brief's own example. | — |
| Route | "Cairo · Aswan · the river · Luxor" | (unchanged) | ☐ | **Correct** | "the river" is a poetic phrase. The essay names it as "A three- or four-night sailing between Aswan and Luxor". | Cairo · Aswan · Nile cruise · Luxor |
| Pace | "two anchors a day, afternoons unscheduled by design" | Two anchors a day, afternoons free | ☐ | **Correct** | The meaning is kept; only the separator changes, for consistency with the other pace rows. | Two anchors a day; afternoons free |
| Best season | "October to April is Egypt at its kindest; summer is workable on the water with early mornings and honest planning" | October–April; summer works on the water | ☐ | **Approve** | Meaning kept; 40 characters. | — |
| Suits | "travellers who want the essential story told well, not a checklist cleared" | The essential story told well, not a checklist | ☐ | **Correct** | The proposed value describes the trip, not who it suits. The correction restates it as a traveller, consistent with the other journeys (56 characters). | Travellers who want the essential story, not a checklist |

### 5. Page title

| Locale | `<title>` | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|
| EN | First Trip to Egypt: How to Plan It, with Tours We'd Choose \| Travel2Egypt | (spec) | — | Spec, not for review. | — |
| ES | Primer viaje a Egipto: cómo planificarlo, con los viajes que elegiríamos \| Travel2Egypt | ☐ | **Approve** | Faithful to EN; no tú/usted form is involved. It is long (about 87 characters with the brand), the same pattern as EN. | — |
| JA | はじめてのエジプト旅行：計画のしかたと私たちが選ぶツアー \| Travel2Egypt | ☐ | **Approve** | Faithful to EN and natural. Not checked by a native speaker. | — |

---

## Culture & history  ·  `/journeys/the-cultural-traveller`  ·  hub `/egypt-in-depth`

Essay reference: "9–12 days; the layers do not compress well". The route takes in Coptic and Islamic Cairo, the monasteries, "Abydos…; Karnak taken as an archive", and Nubian Aswan.

| # | Slug | Title | Days | From (EUR, file) | From (USD, live) | Theme | GA4 views (90d) | Why it suits this traveller | Source sentence (exact quote) | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `7-days-in-egypt-pyramids-temples-and-timeless-wonders` | Seven Days in Egypt: Cairo, Alexandria, Aswan, Luxor | 7 | €1,700 | $1,910 | Egypt In Depth | 1 | A week for the four headline cities, each given a real day. | "First-time visitors with a week; travellers who want the four headline cities done well rather than a dozen done shallow" (audience note) | ☐ | **Reject** | It is a first-timer product ("First-time visitors with a week"), and at 7 days it falls below "9–12 days; the layers do not compress well". The why line overclaims: the summary gives a real day to "the Pyramids, the High Dam, and the Theban west bank", not to each city. It also raises the card +41% ($1,350 → $1,910). Replace it with the tour the essay itself links ("The 10-day private layered-history route"): https://travel2egypt.org/10-day-egypt-travel-journey-through-history, 10 days, **$2,370**. | Replace with `10-day-egypt-travel-journey-through-history`. Why: "Cairo's older layers, Alexandria, the Nubian south and Luxor on both banks, with the pyramids reserved for the closing day." (trimmed from its summary) |
| 2 | `a-9-day-egypt-tour-of-culture-and-history` | A 9-Day Egypt Tour of Culture and History | 9 | €2,360 | $2,650 | Egypt In Depth | 5 | Luxor, Edfu, Kom Ombo and Aswan by river, then Saqqara and Old Cairo to close. | "Nine private days: Cairo and Giza, a flight to Luxor, a Nile cruise south past Edfu and Kom Ombo to Aswan, the night train back, and Saqqara and Old Cairo to close." (summary) | ☐ | **Approve** | Inside the 9–12-day range, and it includes Old Cairo. The why line is a fair trim of the summary. Note that the body text is thin (about 1,500 characters) and there is no audience note. | — |
| 3 | `tour-of-egypt` | 18-Day Grand Tour of Egypt: Cairo, the Nile, the Red Sea and Sinai | 18 | €4,175 | $4,680 | Egypt In Depth | 1 | The whole country in one trip, from the Coptic quarter to Saint Catherine's Monastery. | "Travellers who want the whole country in one trip, with real decompression days built into it; first-timers with the time for it; anyone drawn to the combination of monuments, river, sea, and Sinai mountains in a single arc." (audience note) | ☐ | **Reject** | 18 days is 50% beyond "9–12 days". It includes "three days at Hurghada and the Red Sea, the ferry south to Sharm El Sheikh" (summary), beach time the essay never mentions. The essay's monastery is St Anthony's, not Saint Catherine's. The hub has no 11–12-day product that fits, so I recommend two picks (9 and 10 days, $2,650 / $2,370). Optional third, a Middle Egypt depth option: `10-days-the-splendid-minya-tour` ($2,900; audience "travellers drawn to the Amarna heresy, to the social record at Beni Hassan"). | Drop (two picks), or `10-days-the-splendid-minya-tour` (owner's choice) |

**Price:** the minimum after this audit's version is $2,370, against a $1,350 card (+76%); as proposed it is $1,910 (+41%). Today's card is the owner-stated €1,200 (`OWNER_FROM_EUR.cultural`). This is an owner decision.

**Alternates** *(original)*: `10-days-unforgettable-egypt-tour` ($2,530; includes "Giza and the Coptic quarter, Alexandria…, the Nubian south", also a good fit), `10-day-egypt-travel-journey-through-history` (now recommended as a pick).

### 2. Proposed hero image

| Asset | Thumbnail | Alt text (EN, existing) | Why it fits | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|
| `image-f453f47b2d0a1c863c20271e32313e322886a539-3000x2000-jpg` (from `a-9-day-egypt-tour-of-culture-and-history`) | [view](https://cdn.sanity.io/images/ufallvd2/production/f453f47b2d0a1c863c20271e32313e322886a539-3000x2000.jpg?w=480) | Crowds walk the ram-headed sphinx avenue between the towering pylons of Karnak Temple, Luxor. | The essay asks for "Karnak taken as an archive rather than a backdrop"; this is Karnak's sphinx avenue. Note the alt says "crowds". | ☐ | **Owner only (prefer the alternative)** | The alt text is accurate and the image is 3000 px wide. But the image is a dense tourist crowd, which works against the essay's "fewer sites, longer at each" and "read, not toured". It also shows only the pharaonic layer of a page whose H1 is "Egypt is five civilizations deep". The muted, filtered grade could be stock. A better asset from the same library is the Coptic Cairo courtyard (hero of `the-elegant-cairo-4-days-tour`), which matches essay ¶2, "Start where the layers are thickest… Coptic Cairo". Confirm ownership of either image. | `image-a414e342977ee8a015dd4f902f0b14dad871dd9f-3000x2000-jpg` · [view](https://cdn.sanity.io/images/ufallvd2/production/a414e342977ee8a015dd4f902f0b14dad871dd9f-3000x2000.jpg?w=480) · existing alt: "Courtyard of a Coptic church in Old Cairo with twin bell towers and saintly icons." |

### 3. Proposed essay subheadings

| # | Subheading | Sits above the paragraph starting | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| 1 | Cairo in layers | ¶2: "Start where the layers are thickest…" | ☐ | **Approve** | ¶2: "Start where the layers are thickest" (Coptic and Islamic Cairo). | — |
| 2 | The desert monasteries | ¶3: "Then the desert, for the chapter most itineraries skip…" | ☐ | **Approve** | ¶3: "Then the desert… Monasticism… began in the Egyptian desert". | — |
| 3 | The ancient sites, read | ¶4: "The ancient sites are still on this trip…" | ☐ | **Correct** | The phrase is clipped. The essay says "read, not toured", and the facts row says "read closely". | The ancient sites, read closely |
| 4 | Nubian Aswan | ¶5: "And Aswan for the living culture…" | ☐ | **Approve** | ¶5: "Aswan for the living culture…: Nubia". | — |
| 5 | The guide | ¶6: "A trip like this stands or falls on one thing…" | ☐ | **Approve** | ¶6: "It is the guide." | — |

### 4. Facts row values

| Field | Current text (quoted) | Proposed | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| Length | "9–12 days; the layers do not compress well, and we will say which chapter to cut if you must" | 9–12 days | ☐ | **Approve** | Drops only the aside, as First time does. | — |
| Route | "Cairo in layers · the desert monasteries · Luxor and Abydos, read closely · Nubian Aswan" | Cairo · desert monasteries · Luxor & Abydos · Aswan | ☐ | **Correct** | Uses "&" where no other route does. Keep the original wording "Luxor and Abydos". | Cairo · desert monasteries · Luxor and Abydos · Aswan |
| Pace | "fewer sites, longer at each; the guide sets the depth" | Fewer sites, longer at each | ☐ | **Approve** | Core meaning kept. | — |
| Best season | "October to April; Ramadan reshapes Islamic Cairo's rhythm rather than closing it — see the note above" | October–April (Ramadan reshapes, not closes) | ☐ | **Correct** | It drops what Ramadan reshapes (Islamic Cairo), and uses parentheses where the other journeys use ";". The correction is 58 characters. | October–April; Ramadan reshapes, not closes, Islamic Cairo |
| Suits | "travellers who read before they travel and want a guide who goes off-script" | Readers who want a guide who goes off-script | ☐ | **Approve** | "Readers" fairly compresses "travellers who read before they travel"; 44 characters. | — |

### 5. Page title

| Locale | `<title>` | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|
| EN | Cultural Tours of Egypt: How to Plan a Deeper Trip \| Travel2Egypt | (spec) | — | Spec. | — |
| ES | Viajes culturales por Egipto: cómo planificar un viaje más profundo \| Travel2Egypt | ☐ | **Approve** | Faithful to EN. | — |
| JA | エジプトの文化・歴史の旅：深く巡る旅の計画 \| Travel2Egypt | ☐ | **Approve** | Faithful to EN; not checked by a native speaker. | — |

---

## Families  ·  `/journeys/travelling-as-a-family`  ·  hub `/egypt-family-holidays`

Essay reference: "10–12 days with the Red Sea close; 8 without it", route "Cairo · the Nile by boat · the Red Sea".

**Cheapest-family check:** `cairo-and-alexandria-4-days-family-package` (€665, shown as **$750**) is the cheapest priced family-theme package. A Sanity query for every published package whose theme, title, summary or audience mentions families returns it first (the next are an €799 Sharm-only Red Sea product, which is excluded, and the €1,850 8-day family package). It is also the homepage card's current price source ($750).

| # | Slug | Title | Days | From (EUR, file) | From (USD, live) | Theme | GA4 views (90d) | Why it suits this traveller | Source sentence (exact quote) | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `cairo-and-alexandria-4-days-family-package` | Four Days for Families: Cairo and Alexandria, Slowed Down | 4 | €665 | $750 | Family Egypt | 1 | A short Cairo-and-Alexandria trip paced for children roughly 5 to 14. | "Families with children roughly 5–14; first-time-in-Egypt parents; multi-generational parties wanting Cairo without exhaustion" (audience note) | ☐ | **Approve** | It is the cheapest priced family product, so the "from" price is honest ($750 = card). The summary says "paced for families… enough air between sites for the children to keep up", and the why line is supported. It is short against the essay's length, but it is required as the entry pick. | — |
| 2 | `9-day-classic-egypt-family-adventure` | 9-Day Classic Egypt Family Tour: Cairo, the Nile and Aswan | 9 | €2,090 | $2,340 | Family Egypt | 11 | The classic Cairo-and-cruise shape, paced for school-age children on a first visit. | "Families with school-age children meeting Egypt for the first time; travellers who want the classic Cairo-and-cruise shape paced for a party that includes children" (audience note) | ☐ | **Approve** | Matches the essay's "8 without [the Red Sea]" shape and its "school-age children". The why line is a faithful trim. | — |
| 3 | `14-day-egypt-luxury-family-holiday` | 14-Day Egypt Luxury Family Holiday: Cairo, Nile Cruise, Luxor and the Red Sea | 14 | €3,780 | $4,240 | Family Egypt | 2 | The full family arc, Nile cruise and Red Sea close included, at the top hotel and cruise grades. | "Families with children of mixed ages travelling at the top hotel and cruise grades; first-time visitors who want the full first arc with built-in rest days and a final lighter morning before departure" (audience note) | ☐ | **Correct** | Good fit: it is the essay's own linked tour ("The 14-day private family journey: Cairo, a Nile cruise and the Red Sea"). But the trip does **not** close on the Red Sea. Its summary reads "…four nights on the Red Sea, and a Coptic and Islamic close in Cairo". | Why: "The full first arc with a Nile cruise and four nights on the Red Sea, at the top hotel and cruise grades." |

**Spread:** 4 / 9 / 14 days at $750 / $2,340 / $4,240, which is good.

**Alternates** *(original)*: `cairo-and-nile-cruise-8-day-family-package` ($2,070), `12-day-amazing-family-vacation-in-egypt` ($3,700).

### 2. Proposed hero image

| Asset | Thumbnail | Alt text (EN, existing) | Why it fits | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|
| `image-92932570f3ee70b7b294ec8ba6d62bfd33d0f92c-3000x2000-jpg` (from `9-day-classic-egypt-family-adventure`) | [view](https://cdn.sanity.io/images/ufallvd2/production/92932570f3ee70b7b294ec8ba6d62bfd33d0f92c-3000x2000.jpg?w=480) | Traditional felucca sailing boats on the calm Nile at Aswan with desert hills beyond | Feluccas on the Nile at Aswan: the essay's "boat that is also the hotel" chapter. The family hub's own hero (`child-on-beach-holiday.jpg`) may be a stock photo, so it is not proposed. | ☐ | **Reject (replace; ownership Owner only)** | The alt text is accurate and the image is 3000 px wide, but **there are no people in it**. A family page needs a family or child. Best library candidate with alt text, at 3000 px: a boy at the Sphinx and pyramid (hero of `12-day-amazing-family-vacation-in-egypt`), which matches essay ¶3, "the Giza plateau early". **Caution:** its original filename is `is-egypt-safe.jpg` (a blog image) and its composition looks like stock, so confirm the licence. A second candidate is a father and daughter at the Giza pyramids (`image-d513c71d4a54cf8addc404127abd551ccd2b22f2-3000x2000-jpg`, [view](https://cdn.sanity.io/images/ufallvd2/production/d513c71d4a54cf8addc404127abd551ccd2b22f2-3000x2000.jpg?w=480), filename `tips-for-first-time-family-visitors-to-egypt.jpg`). It has **no alt text in Sanity**, so the owner would need to write one, and it also looks like stock. | `image-b4af83c55481b9230163d764f2cf78b68c644345-3000x1999-jpg` · [view](https://cdn.sanity.io/images/ufallvd2/production/b4af83c55481b9230163d764f2cf78b68c644345-3000x1999.jpg?w=480) · existing alt: "Young boy in a sun hat sits gazing at the Great Sphinx and pyramid at Giza" |

### 3. Proposed essay subheadings

| # | Subheading | Sits above the paragraph starting | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| 1 | Two worries | ¶1: "Families arrive at us carrying one of two worries…" | ☐ | **Approve** | ¶1: "Families arrive at us carrying one of two worries". | — |
| 2 | Cairo, in short strikes | ¶3: "So the family trip we build has three movements…" | ☐ | **Approve** | ¶3: "Cairo first, taken in short, vivid strikes". | — |
| 3 | The Nile does the work | ¶4: "Then the Nile, which is where Egypt solves family travel…" | ☐ | **Approve** | ¶4: "the Nile, which is where Egypt solves family travel almost by itself… the deck does the rest". | — |
| 4 | The Red Sea, last | ¶5: "Last, the Red Sea — and the order matters…" | ☐ | **Approve** | ¶5: "Last, the Red Sea — and the order matters." | — |
| 5 | Two practical truths | ¶6: "Two practical truths, stated plainly…" | ☐ | **Correct** | Vague. ¶6's two truths are named in the text: "Ages matter… And seasons matter". | Ages and seasons |

### 4. Facts row values

| Field | Current text (quoted) | Proposed | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| Length | "10–12 days with the Red Sea close; 8 without it, and we will tell you which nights to protect" | 10–12 days (8 without the Red Sea) | ☐ | **Approve** | Meaning kept. | — |
| Route | "Cairo · the Nile by boat · the Red Sea" | (unchanged) | ☐ | **Correct** | "the Nile by boat" is a phrase; ¶4 says "A cruise means unpacking once". | Cairo · Nile cruise · Red Sea |
| Pace | "one anchor a morning; afternoons belong to the pool" | One anchor a morning; afternoons at the pool | ☐ | **Approve** | Meaning kept. | — |
| Best season | "October to April; Christmas and Easter weeks book out first, so those plans start earliest" | October–April; Christmas and Easter book first | ☐ | **Approve** | 46 characters; meaning kept. | — |
| Suits | "families with school-age children; travelling with toddlers changes the trip, and we will say how" | Families with school-age children | ☐ | **Approve** | Drops only the "we will say how" aside. | — |

### 5. Page title

| Locale | `<title>` | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|
| EN | Egypt with Kids: How to Plan a Family Trip \| Travel2Egypt | (spec) | — | Spec. | — |
| ES | Egipto con niños: cómo planificar un viaje en familia \| Travel2Egypt | ☐ | **Approve** | Faithful. | — |
| JA | 子ども連れのエジプト：家族旅行の計画のしかた \| Travel2Egypt | ☐ | **Approve** | Faithful; not checked by a native speaker. | — |

---

## Desert & quiet  ·  `/journeys/desert-and-quiet`  ·  hub `/multiday-adventure-and-safari-tours`

Essay reference: the White Desert night via Bahariya (¶2–3), "the gentler desert" of Fayoum and Wadi El Hitan (¶4), and "four to five days if the desert is the trip". Siwa and the far oases "continue it. We plan those under [Coming back]."

| # | Slug | Title | Days | From (EUR, file) | From (USD, live) | Theme | GA4 views (90d) | Why it suits this traveller | Source sentence (exact quote) | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `3-day-bahariya-white-desert-tour` | 3-Day Western Desert Private Tour: Bahariya Oasis and the White Desert | 3 | €355 | $400 | Adventure | 8 | The night camped in the White Desert that the essay describes. | "Travellers extending a Nile itinerary with three days west; photographers willing to swap a hotel for a desert camp; anyone who wants Egypt's other landscape, not only the temples" (audience note) | ☐ | **Correct** | Exact fit: it is the essay's own linked tour ("The 3-day private White Desert camp from Cairo"). But the why line cites the essay, not the product, and "that the essay describes" reads oddly on the page itself. Trim it from the summary: "Bahariya Oasis, the geology of the Black and White Deserts, and one night camped under the stars in the White Desert National Park." | Why: "Bahariya, the Black and White Deserts, and one night camped under the stars in the White Desert." |
| 2 | `3-day-siwa-journey-from-alexandria` | Three Days from Alexandria to Siwa — Coast, Desert War, Oracle | 3 | €500 | $560 | Adventure | 9 | Oasis culture and the Great Sand Sea, starting from the Mediterranean. | "Travellers who want Egypt beyond the Nile; anyone drawn to oasis culture, the desert war, or the Alexander legend." (audience note) | ☐ | **Reject (move to Coming back)** | The Desert essay hands Siwa to Coming back ("Siwa and the far oases continue it. We plan those under [Coming back]"). The Coming back essay links this exact tour ("The 3-day private Siwa journey from Alexandria"). It is also near-identical in length to pick 1 (3 days and 3 days). Replace it with the trip that covers essay ¶4's Fayoum and Valley of the Whales plus the White Desert: https://travel2egypt.org/4-days-white-desert-wadi-al-hittan-exploration, 4 days, **$720**. That is today's Desert card price source, though the product sits in the Special Interest hub. | Replace with `4-days-white-desert-wadi-al-hittan-exploration`. Why: "From the fossil whales of Fayoum to the chalk formations of the White Desert, in a short window." (summary: "A four-day private journey from the fossil whales of Fayoum to the chalk formations of the White Desert"; audience: "anyone wanting the Egypt beyond the Nile in a short window") |
| 3 | `bahariya-and-siwa-oasis-vacation` | Desert Horizons: Seven Days into Egypt's Deep West | 7 | €1,700 | $1,910 | Adventure | 1 | A week where the desert is the destination rather than a detour. | "Travellers who want the desert as the destination rather than a detour from the Nile; repeat visitors who already know the river; anyone drawn to silence, oasis culture, and Alexander's oracle. Long drives suit older children best." (audience note) | ☐ | **Approve** | The desert is the whole trip, and the essay says "if the desert is the trip… the White Desert is the beginning of a longer road, and Siwa… continue[s] it". It is longer than "four to five days", but it is the essay's "longer road". The why line is faithful. | — |

**Spread after the swap:** 3 / 4 / 7 days at $400 / $720 / $1,910. The card moves from $720 to $400 (−44%). That happens with the original proposal too, because the 3-day pick is cheaper than today's card source.

**Alternates** *(original)*: `private-tour-2-day-trip-to-bahariya-oasis` ($250; matches "two days and a night"), `white-desert-wonders-4-day-cairo-and-white-desert-tour` ($670).

### 2. Proposed hero image

| Asset | Thumbnail | Alt text (EN, existing) | Why it fits | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|
| `image-9ab09b35633ce1d0aafb1837f6c56786d370ddf7-3000x2000-jpg` (from `3-day-bahariya-white-desert-tour`) | [view](https://cdn.sanity.io/images/ufallvd2/production/9ab09b35633ce1d0aafb1837f6c56786d370ddf7-3000x2000.jpg?w=480) | Wind-carved chalk rock formations rising from golden dunes in Egypt's White Desert. | The White Desert chalk formations: the essay's central night and dawn. | ☐ | **Owner only** | Desert, with the White Desert chalk the essay centres on; the alt text is accurate; 3000 px wide. **However**, at full size it shows the over-smoothed texture typical of a small image upscaled, and the composition looks like stock. Confirm it is the company's own photo at native resolution. | — |

### 3. Proposed essay subheadings

| # | Subheading | Sits above the paragraph starting | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| 1 | A night in the White Desert | ¶2: "That night usually happens in the White Desert…" | ☐ | **Approve** | ¶2: "That night usually happens in the White Desert." | — |
| 2 | The gentler desert | ¶4: "Then there is the gentler desert…" | ☐ | **Correct** | Accurate, but doesn't name the place. ¶4 is about Fayoum. | Fayoum, the gentler desert |
| 3 | How much of the trip? | ¶5: "How much of a trip should this be?…" | ☐ | **Approve** | ¶5 opens "How much of a trip should this be?" A plain question, not clickbait. | — |

### 4. Facts row values

| Field | Current text (quoted) | Proposed | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| Length | "two days and a night for the White Desert; one long day or a soft overnight for Fayoum; four to five days if the desert is the trip" | 2 days, 1 night (4–5 if the desert is the trip) | ☐ | **Correct** | It drops the Fayoum option entirely (one of three stated lengths), and "2 days, 1 night" doesn't say it refers to the White Desert. | 2 days for the White Desert, 1–2 for Fayoum (4–5 if the desert is the trip) |
| Route | "Cairo · Bahariya · the White Desert — or Cairo · Fayoum for the version with a roof" | Cairo · Bahariya · White Desert (or Fayoum) | ☐ | **Approve** | Plain places, both options kept. | — |
| Pace | "one long drive out, then almost nothing scheduled; that is the product" | One long drive, then almost nothing scheduled | ☐ | **Approve** | Meaning kept. | — |
| Best season | "October to April; winter nights near zero, so pack for a hot noon and a cold midnight in the same bag" | October–April; winter nights near zero | ☐ | **Approve** | 38 characters. | — |
| Suits | "travellers who want the counterweight to the temples, and sleep better under stars than deadlines" | A counterweight to the temples | ☐ | **Correct** | Describes the trip, not who it suits; inconsistent with the other journeys. 50 characters. | Travellers who want a counterweight to the temples |

### 5. Page title

| Locale | `<title>` | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|
| EN | Egypt's Western Desert: Planning a Desert Trip \| Travel2Egypt | (spec) | — | Spec. | — |
| ES | El Desierto Occidental de Egipto: cómo planificar un viaje al desierto \| Travel2Egypt | ☐ | **Approve** | Faithful. | — |
| JA | エジプト西方砂漠：砂漠の旅の計画 \| Travel2Egypt | ☐ | **Approve** | Faithful; not checked by a native speaker. | — |

---

## Luxury  ·  `/journeys/travelling-in-style`  ·  hub `/egypt-luxury-holidays`

Essay reference: "10–14 days, unhurried by design"; dahabiyas and "hotels that are themselves sites": Mena House, the Old Cataract, the Winter Palace. Each pick's own text was checked for luxury, five-star hotels, dahabiyas or landmark hotels.

| # | Slug | Title | Days | From (EUR, file) | From (USD, live) | Theme | GA4 views (90d) | Why it suits this traveller | Source sentence (exact quote) | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `marriott-mena-house-4-days-stay` | Royal Retreat: 4-Day Stay at the Marriott Mena House | 4 | €1,900 | $2,130 | Luxury | 4 | A short stay where the Mena House is part of the trip, not a base camp. | "Travellers who want a great hotel to be part of the trip rather than a base camp; first-time visitors with limited time; anyone who would rather see two cities well than five in passing" (audience note) | ☐ | **Owner only** | Style fit is exact. The body reads "A short luxury stay built around a single legendary hotel", and the essay names "Mena House with the Pyramids filling its garden windows". The why line is faithful, and the price equals today's card ($2,130). But 4 days is far outside "10–14 days, unhurried by design". Decide whether a short-stay entry point belongs on this page. If dropped, the card rises to $2,620 (+23%). | — |
| 2 | `9-days-egypt-prestigious-vacation` | Prestigious Egypt Vacation: 9-Day Luxor, the Nile, Aswan and Cairo | 9 | €3,775 | $4,230 | Luxury | 3 | The full arc without rushing, including a real stay at the Old Cataract (Mandarin Oriental) in Aswan. | "First-time visitors who want the full arc without rushing it; travellers who prefer the New Kingdom encountered before the Old; anyone drawn to the river and to a real Aswan stay rather than a brief disembarkation" (audience note) | ☐ | **Approve** | The essay's own linked tour ("The 9-day private itinerary: Cairo, the river and the Old Cataract"). The body reads "The hotels are five-star throughout… at Aswan the trip stays at the storied Old Cataract — from 1 May 2026 operating under the Mandarin Oriental flag", so the why line is supported. | — |
| 3 | `the-egypt-royal-vacation-tour` | Egypt Royal Vacation: 10-Day Aswan, the Nile, and Luxor | 10 | €2,335 | $2,620 | Luxury | 0 | Aswan and Luxor in depth, with a yacht on the river and a flexible itinerary. | "Travellers who want the river without rushing it; repeat visitors who already know Cairo and want depth in Aswan and Luxor instead; anyone for whom flexibility is more valuable than a packed day-by-day" (audience note) | ☐ | **Approve** | 10 days, inside the range. Its text describes luxury: "five-star hotels and a private yacht on the river". The why line is supported by the audience note and the summary ("two days aboard the Alexander the Great Yacht… The itinerary is yours to shape"). | — |

**Spread:** 4 / 9 / 10 days at $2,130 / $4,230 / $2,620. The 9-day and 10-day picks are close in length but differ clearly in price and direction.

**Alternates** *(original)*: `the-elegant-cairo-4-days-tour` ($1,630; its text mentions Four Seasons and Mena House). `4-days-city-break` ($730) is rightly excluded, because its luxury rests on one summary word only.

### 2. Proposed hero image

| Asset | Thumbnail | Alt text (EN, existing) | Why it fits | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|
| `image-7c494d6b99d05164005da7df3e982ed9d897d1bb-4000x2667-jpg` (from `marriott-mena-house-4-days-stay`) | [view](https://cdn.sanity.io/images/ufallvd2/production/7c494d6b99d05164005da7df3e982ed9d897d1bb-4000x2667.jpg?w=480) | Lamplit palm gardens of a Giza hotel at dusk with the floodlit pyramids rising behind | The Mena House garden with the pyramids behind: the essay names it first among "hotels that are themselves sites". | ☐ | **Owner only — do not approve without a licence** | The fit is excellent and the alt text accurate (4000 px wide). But the asset's original filename is `caimn-exterior.jpg`, unlike every other hero here, which is named after its product slug. The name and the polished twilight composition look like a hotel-chain press photo, not the company's own. Confirm that you own it or are licensed to use it as a page hero. If not, use `9-days-egypt-prestigious-vacation`'s own hero (Karnak), which also needs an ownership check. | — |

### 3. Proposed essay subheadings

| # | Subheading | Sits above the paragraph starting | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| 1 | The river under sail | ¶2: "Start with the river…" | ☐ | **Approve** | ¶2: "Start with the river… a dahabiya… moving under canvas". | — |
| 2 | Hotels that are sites | ¶3: "Then the hotels…" | ☐ | **Approve** | ¶3: "hotels that are themselves sites". | — |
| 3 | One Egyptologist, throughout | ¶4: "Guiding, at this register…" | ☐ | **Approve** | ¶4: "one Egyptologist who is yours for the duration". | — |
| 4 | The part you never see | ¶5: "Underneath all of it runs the choreography…" | ☐ | **Correct** | Slightly teasing. Use the essay's own words: "the choreography you should never notice". | The choreography you never notice |
| 5 | A register above | ¶6: "One more thing, said plainly…" | ☐ | **Correct** | Opaque on its own. ¶6 is about a level above this one and the sister house the company hands those trips to ("our family has a dedicated house"). | A register above, and our sister house |

### 4. Facts row values

| Field | Current text (quoted) | Proposed | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| Length | "10–14 days, unhurried by design" | 10–14 days, unhurried | ☐ | **Correct** | Meaning kept; only the format changes, to match "N–M days (qualifier)". | 10–14 days (unhurried) |
| Route | "bespoke, but its spine is usually Cairo · the Nile under sail · Aswan, with the desert or the coast added as the trip asks" | Cairo · the Nile under sail · Aswan | ☐ | **Correct** | "usually" is lost, which makes a typical route look fixed. "the Nile under sail" is poetic: ¶2 names it a dahabiya. | Usually Cairo · Nile by dahabiya · Aswan |
| Pace | "the sites at their best hour, and as empty as timing can make them" | Sites at their best hour, as empty as timing allows | ☐ | **Approve** | Meaning kept. | — |
| Best season | "October to April; the dahabiyas and the landmark hotels' best rooms book out first, so these plans start earliest of all" | October–April; dahabiyas book out first | ☐ | **Correct** | It drops the landmark hotels, half the original point. 55 characters. | October–April; dahabiyas and landmark hotels book first |
| Suits | "travellers who measure a trip by how little they had to think about it" | Those who want to think about nothing | ☐ | **Correct** | "think about nothing" overstates the original and reads oddly. 56 characters. | Travellers who want as little to think about as possible |

### 5. Page title

| Locale | `<title>` | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|
| EN | Luxury Egypt Travel: How to Plan It \| Travel2Egypt | (spec) | — | Spec. | — |
| ES | Viajes de lujo a Egipto: cómo planificarlos \| Travel2Egypt | ☐ | **Approve** | Faithful. | — |
| JA | エジプトのラグジュアリー旅行：計画のしかた \| Travel2Egypt | ☐ | **Approve** | Faithful; not checked by a native speaker. | — |

---

## Coming back  ·  `/journeys/coming-back`  ·  hub `/special-interest-tours`

Essay reference: one of three regions, each done in "7–10 days": Middle Egypt; Alexandria and the north; Siwa and the far oases ("Dakhla and Kharga"). The essay says: "If it is the White Desert's rock formations and a night under the stars you are after… we plan it under [Desert & quiet]."

| # | Slug | Title | Days | From (EUR, file) | From (USD, live) | Theme | GA4 views (90d) | Why it suits this traveller | Source sentence (exact quote) | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `4-days-white-desert-wadi-al-hittan-exploration` | 4-Day White Desert & Wadi Al Hittan Tour: Fayoum to Bahariya | 4 | €645 | $720 | Special Interest | 2 | A short return that trades monuments for the Valley of the Whales and the White Desert. | "Travellers drawn to geology, palaeontology and silence rather than monuments; second-time visitors; anyone wanting the Egypt beyond the Nile in a short window" (audience note) | ☐ | **Reject (move to Desert & quiet)** | None of the essay's three regions, and the essay sends the White Desert to Desert & quiet in so many words. Replace it with the tour this essay itself links ("The 3-day private Siwa journey from Alexandria"): https://travel2egypt.org/3-day-siwa-journey-from-alexandria, 3 days, **$560**. It covers Alexandria and Siwa, regions two and three. | Replace with `3-day-siwa-journey-from-alexandria`. Why: "From the Mediterranean down to Siwa Oasis: El Alamein, the Great Sand Sea and the Oracle Alexander travelled to consult." (trimmed from its summary) |
| 2 | `desert-horizons-7-day-bahariya-siwa-oasis-tour` | 7-Day Bahariya & Siwa Oasis Tour: Egypt's Western Desert | 7 | €1,460 | $1,640 | Special Interest | 11 | The deep Western Desert and Siwa, the region the essay calls "the one we know from the inside". | "Travellers wanting the deepest legitimate Western Desert experience; readers of Alexander and the Hellenistic world; repeat visitors to Egypt; anyone drawn to silence and scale rather than monuments alone" (audience note) | ☐ | **Correct** | Region three (Siwa), and its audience note names "repeat visitors". But the why line quotes the essay, not the product. | Why: "The White Desert, the Great Sand Sea and Siwa, for repeat visitors drawn to silence and scale." (summary + audience note) |
| 3 | `10-day-nile-and-western-desert-tour` | 10-Day Nile and Western Desert Tour: Cairo, the Oases, and Luxor | 10 | €2,470 | $2,770 | Special Interest | 4 | The oases and the White Desert between two Nile bookends, for travellers who already know the river. | "Travelers who want Egypt beyond the Nile; repeat visitors; anyone drawn to desert and silence as much as monuments. Long drives suit older children best." (audience note) | ☐ | **Correct** | Fits: the trip goes through Dakhla (the essay's "Dakhla and Kharga carry the old caravan routes"), it doesn't just repeat the classic circuit, and its audience note says "repeat visitors". But "who already know the river" is not in this product's text (it comes from `bahariya-and-siwa-oasis-vacation`), and "Nile bookends" overstates its summary's "two historical bookends". | Why: "The Western Desert oases and the White Desert between two historical bookends, for repeat visitors." |

**Spread after the swap:** 3 / 7 / 10 days at $560 / $1,640 / $2,770. The card moves from $1,350 (owner-stated €1,200) to $560 (−59%); as proposed it would be $720 (−47%). This is an owner decision.

**Not covered:** Middle Egypt (region one). The only multi-day option is `10-days-the-splendid-minya-tour` ($2,900; audience "Repeat visitors…"), and it also returns to Abu Simbel and Luxor.

**Alternates** *(original)*: `10-days-the-splendid-minya-tour` ($2,900), `3-day-nubian-fishing-safari` ($500; not one of the essay's three regions).

### 2. Proposed hero image

| Asset | Thumbnail | Alt text (EN, existing) | Why it fits | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|---|
| `image-bb2e3ad0026632ec09a1659559ff66f97c87b04e-3000x2000-jpg` (from `desert-horizons-7-day-bahariya-siwa-oasis-tour`) | [view](https://cdn.sanity.io/images/ufallvd2/production/bb2e3ad0026632ec09a1659559ff66f97c87b04e-3000x2000.jpg?w=480) | A small group rests on a desert dune at sunset beside a 4x4 in Egypt's Western Desert. | A dune at sunset in the Western Desert: the third region the essay offers, and the company's own home ground (Siwa). | ☐ | **Owner only** | Fit is OK: sand-sea dunes (not the White Desert chalk), matching the essay's oases region and the product it comes from. The alt text is accurate and the image is 3000 px wide. It looks like a genuine trip photo, not stock. Confirm ownership. | — |

### 3. Proposed essay subheadings

| # | Subheading | Sits above the paragraph starting | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| 1 | What the first trip bought you | ¶2: "Here is what the first trip bought you…" | ☐ | **Approve** | ¶2 opens with these words; 6 words. | — |
| 2 | Middle Egypt | ¶3: "The first is Middle Egypt…" | ☐ | **Approve** | ¶3: "The first is Middle Egypt". | — |
| 3 | Alexandria and the sea | ¶4: "The second is Alexandria and the Mediterranean edge…" | ☐ | **Approve** | ¶4: "Alexandria and the Mediterranean edge". | — |
| 4 | The Western Desert oases | ¶5: "The third is the one we know from the inside…" | ☐ | **Approve** | ¶5: "the Western Desert oases". Note that the closing ¶6 ("Which of the three is yours…") will sit under this heading. That's acceptable, but an owner could add a sixth H2 there later. | — |

### 4. Facts row values

| Field | Current text (quoted) | Proposed | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|---|
| Length | "7–10 days for one region done properly; combining two is possible and we will say what it costs" | 7–10 days for one region | ☐ | **Correct** | Meaning kept; format aligned to "N–M days (qualifier)". | 7–10 days (one region) |
| Route | "one of three: Middle Egypt · Alexandria and the north · Siwa and the far oases" | Middle Egypt · Alexandria · Siwa (choose one) | ☐ | **Correct** | Without a lead-in, "·" reads as a route in order, but these are alternatives. "Siwa" also drops the far oases. | One of: Middle Egypt · Alexandria · Siwa and the oases |
| Pace | "slower than the first trip, by design; one anchor a day is often enough" | Slower than the first trip; one anchor a day | ☐ | **Correct** | It drops "often", turning a guide into a rule. | Slower than the first trip; often one anchor a day |
| Best season | "October to April for the valley and the oases; Alexandria is at its best when Cairo is at its warmest" | October–April; Alexandria best when Cairo is hottest | ☐ | **Correct** | "hottest" is stronger than the original "warmest". 52 characters. | October–April; Alexandria best when Cairo is warmest |
| Suits | "travellers who have done Cairo and the river and want the country behind the famous one" | Those who have done Cairo and the river | ☐ | **Correct** | Aligned with the "Travellers who…" format. 44 characters. | Travellers who have done Cairo and the river |

### 5. Page title

| Locale | `<title>` | Approve? | Recommendation | Reason | Corrected value |
|---|---|---|---|---|---|
| EN | Returning to Egypt: Planning a Second Trip \| Travel2Egypt | (spec) | — | Spec. | — |
| ES | Volver a Egipto: cómo planificar un segundo viaje \| Travel2Egypt | ☐ | **Approve** | Faithful. | — |
| JA | ふたたびのエジプト：2度目の旅の計画 \| Travel2Egypt | ☐ | **Approve** | Faithful; not checked by a native speaker. | — |

---

## What this audit could not check

- **Reverse image search** for stock or ownership: no tool was available. Stock and upscaling flags come from visual inspection and filenames only.
- **GA4 view counts:** taken from the original file, not re-pulled.
- **ES/JA titles:** read for meaning only, not by a native speaker.
- **Prices:** USD figures are as displayed on 2026-11-10. They move with ECB rates.
