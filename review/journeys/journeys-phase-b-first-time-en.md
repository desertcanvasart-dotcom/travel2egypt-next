# Journey pages, Phase B1: First time in Egypt, owner review (EN)

**Page:** `/journeys/first-time-in-egypt`. Nothing here renders until you approve it.

**How to review:**
- Tick ☐ → ☑ to approve a row.
- To correct a row, write the corrected wording after it (e.g. `→ Two days in Cairo`).
- Rows you leave unticked and uncorrected are rejected and deleted.
- A section with nothing approved doesn't render at all.

**Sources:**
- Every sentence is copied word for word, or trimmed, from the journey essay or a site page. The exact source sentence and its URL are given for each one.
- **Essay:** https://travel2egypt.org/journeys/first-time-in-egypt. Paragraph numbers below count from 1, in reading order.

**Images:**
- All images are existing Sanity assets, at least 1600px wide, chosen after viewing each one.
- None has a credit or source field. The 9 assets that carry Creative Commons credits were excluded.
- Most came over from the WordPress library with no metadata, so Sanity can't prove who took them. **Ownership is yours to confirm (owner only)** on every image row.

**ES and JA:** nothing here shows on `/es` or `/ja` until their own review files (`-es.md`, `-ja.md`) are produced from the approved EN and approved in turn.

---

## 1. Route map

A plain outline map of Egypt with the Nile. The stops are numbered and joined in order by a line.

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Stops | Cairo → Aswan → Luxor → Cairo | Approved Route fact "Cairo · Aswan · Nile cruise · Luxor", plus the return to Cairo given in the spec. "Nile cruise" is the Aswan → Luxor leg, not a place. | ☐ |
| Heading | The route | New label (section heading only) | ☐ |

**Notes:**
- **No travel-mode labels.** No product has `routeLegs` (travel mode per leg) yet, so the map draws one plain line with no train, cruise or flight labels. Nothing is guessed.
- **Return leg.** Do all three tours end in Cairo? If a tour flies home from Luxor, cross out the final "→ Cairo".
- **Coordinates** are well-known public coordinates, rounded to 2 decimals (`src/lib/places/coords.ts`).

## 2. Days selector

**Heading (fixed by the spec):** "How many days do you have?"

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Chips | **7 days** · **10 days** | The approved picks' own durations (Sanity `durationDays`): 7-Day Egypt Tour = 7; 10-Day Nile Dreamer = 10; Pharaohs' Legacy 10-Day = 10 | ☐ |
| Line under the chips | 8–10 days (7 at a push) | Your approved Length fact (curation.ts). Essay, paragraph 3: "It needs eight to ten days to be told properly." | ☐ |

**What a chip does:**
- It scrolls to the matching card and highlights it. **10 days** highlights both 10-day tours.
- It pre-sets "How many days?" in the Plan my trip dialog and the end form (7 → 6–9 days; 10 → 10–14 days).

**Notes:**
- **Only two chips.** The spec's example (7 · 8 · 10) assumed `essential-egypt`, which you replaced with Nile Dreamer.
- **No chip for 8–10 days.** The line under the chips says 8–10, but no approved pick is 8 days, so no chip is invented for it.

## 3. Three signature experiences

**Heading (fixed by the spec):** "Three moments that make a first trip"

The three are the essay's longest-argued choices: two days in Cairo (paragraph 5), Aswan before Luxor (paragraph 6), and the boat (paragraph 7).

| # | Title (≤ 6 words) | Text | Source (exact essay sentences) | Link | Image | Approve? |
|---|---|---|---|---|---|---|
| 1 | Two full days in Cairo | The plateau deserves an unhurried half day on its own, the museum another, and the city an evening at minimum. We plan two full days in Cairo and have rarely met a traveller who regretted the second one. | Paragraph 5: "The plateau deserves an unhurried half day on its own, the museum another, and the city — the reason seventeen million people live beside these monuments — an evening at minimum. We plan two full days in Cairo and have rarely met a traveller who regretted the second one." (trimmed: the dash clause) | `/guide/cairo` | `image-deff6c1486c9f3708f13bc8f552f147b9c186dc7-3840x2552-jpg` (3840×2552) [view](https://cdn.sanity.io/images/ufallvd2/production/deff6c1486c9f3708f13bc8f552f147b9c186dc7-3840x2552.jpg?w=480). All three Giza pyramids under a clear sky. Alt (existing, from the "Pyramids of Egypt" article): "The three Pyramids of Giza rising from golden desert sand beneath a clear pale-blue sky". Ownership: **owner only** | ☐ |
| 2 | Aswan, the river at its calmest | Cairo's opening days, then a flight to Aswan — the gentlest city on the Egyptian Nile — before the boat carries you downstream to Luxor's density. Aswan gives you the river at its calmest while you are still finding your feet: granite islands, Nubian villages, feluccas moving without engines. | Paragraph 6: "We often reverse it: Cairo's opening days, then a flight to Aswan — the gentlest city on the Egyptian Nile — before the boat carries you downstream to Luxor's density. Aswan gives you the river at its calmest while you are still finding your feet: granite islands, Nubian villages, feluccas moving without engines." (trimmed: "We often reverse it:") | `/guide/aswan` | `image-e99821270cbedea94709a56a413cb7d61fc732da-3000x1999-jpg` (3000×1999) [view](https://cdn.sanity.io/images/ufallvd2/production/e99821270cbedea94709a56a413cb7d61fc732da-3000x1999.jpg?w=480). Two feluccas between granite boulders and dunes. Alt (existing, from the felucca article): "Two white-sailed feluccas gliding down the Nile past golden dunes and rocky green banks". Ownership: **owner only** | ☐ |
| 3 | Temples approached from the water | A three- or four-night sailing between Aswan and Luxor remains the best answer to a first trip's middle chapters. The temples along this stretch were built to be approached from the water, and arriving the way they were designed to be arrived at is a difference you feel rather than notice. | Paragraph 7: "A three- or four-night sailing between Aswan and Luxor remains the best answer to a first trip's middle chapters — not for the deck chairs, but because the temples along this stretch were built to be approached from the water, and arriving the way they were designed to be arrived at is a difference you feel rather than notice." (trimmed: "— not for the deck chairs, but because"; split into two sentences) | `/nile-cruises` | `image-dfa2b0caf6abaa07f7aac3ea8fcb80c81a2f611c-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/dfa2b0caf6abaa07f7aac3ea8fcb80c81a2f611c-3000x2000.jpg?w=480). Cruise ships moored at Luxor, with Luxor Temple's colonnade reflected in the water. Alt (existing, from the 5-day Luxor cruise): "Nile cruise ships moored at Luxor with Luxor Temple's colonnade reflected in the water." Ownership: **owner only** | ☐ |

**Notes:**
- **Card 2 says "a flight to Aswan".** That is the essay's wording, but two of the approved tours go south on the sleeper train. Either cross out the first sentence, keeping only "Aswan gives you the river…", or approve it as the essay's general advice.
- **Alternate images:**
  - Card 1: `image-8692e316…-2752x1536-jpg`, Khafre and the Sphinx at sunset. This is on your own-photo list in `scripts/cairo-guide-heroes-2026-11-10.mjs`.
  - Card 3: `image-22fafe84…-6000x1945-jpg`, Philae from the water.
  - No Kom Ombo or Edfu image taken from the water exists in the library.
- **Alternate experience:** Luxor, met last (paragraph 6: "Luxor … is better met once you have learned to read a temple rather than photograph one").

## 4. Essay images

Each image sits after the paragraph quoted, at the full width of the text column, with its caption. Captions describe the image and add no claims.

| # | After paragraph | Image | Caption | Approve? |
|---|---|---|---|---|
| 1 | 5: "The first is Cairo. Most itineraries give it a single day…" (it names "the museum") | `image-9e07424760c96832dbf9aca42b91a508a05b787a-3000x2250-jpg` (3000×2250) [view](https://cdn.sanity.io/images/ufallvd2/production/9e07424760c96832dbf9aca42b91a508a05b787a-3000x2250.jpg?w=480). Ramesses II in the Grand Egyptian Museum atrium. Alt (existing, GEM article): "Colossal statue of Ramses II standing in the vast sunlit atrium of the Grand Egyptian Museum". Ownership: **owner only** | The colossal statue of Ramesses II in the atrium of the Grand Egyptian Museum. | ☐ |
| 2 | 6: "The second is the order. The conventional route lands in Cairo…" (it ends on Luxor, "better met once you have learned to read a temple") | `image-02a120aeff72e3f72895c601bc0aa6a995618549-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/02a120aeff72e3f72895c601bc0aa6a995618549-3000x2000.jpg?w=480). The ram-headed sphinx avenue at Karnak. Alt (existing, Karnak day tour): "The avenue of ram-headed sphinxes leading to the first pylon of Karnak Temple in Luxor." Ownership: **owner only** | The avenue of ram-headed sphinxes leading to the first pylon of Karnak, Luxor. | ☐ |

**Notes:**
- **Image 2** is close in subject to the Culture & history hero (also the Karnak sphinx avenue, a different photo). An alternate is `image-96da5f50…` (Valley of the Kings valley floor; paragraph 3 names "the Valley of the Kings").
- **Only two images are proposed.** A third would repeat the Giza, Aswan or cruise subjects already used in the experiences.

## 5. Pull quote

A single sentence copied exactly from the essay, shown large between two paragraphs.

| Quote (exact) | Position | Approve? |
|---|---|---|
| "The first trip has one job, and it is a good one: the essential story, told in order, at a speed that lets it land." (paragraph 2) | After paragraph 3 ("The essential story runs along the river…"), before the "Two decisions" subheading | ☐ |

**Alternate:** "Leave something for the person you'll be when you come back." (paragraph 8, the essay's last line), placed after paragraph 7.

## 6. Questions first-time travellers ask

**Heading (new label):** "Questions first-time travellers ask" ☐

**How it works:**
- An accordion, with the first question open.
- Answers are in the page HTML, with no FAQPage schema.
- Each answer ends with "Read more →", linking to its source page.

| # | Question | Answer (≤ 80 words) | Source (exact sentences, with URLs) | Approve? |
|---|---|---|---|---|
| 1 | How many days do I need? | One week combines Cairo, Luxor, and Aswan. 7 days is the shortest length to combine Cairo and Upper Egypt meaningfully. 10 or more days makes room to add Abu Simbel, a Nile cruise, the Red Sea, or Sinai to match purpose. (41 words) | https://travel2egypt.org/blog/the-best-egypt-travel-itineraries: "Short trips, narrowed to Cairo and Giza, satisfy more. One week combines Cairo, Luxor, and Aswan. 10 or more days makes room to add Abu Simbel, a Nile cruise, the Red Sea, or Sinai to match purpose." · "7 days is the shortest length to combine Cairo and Upper Egypt meaningfully." | ☐ |
| 2 | When is the best time to go? | For inland sightseeing — Cairo, Luxor, Aswan, the West Bank temples — the optimal window is late October through early March. The November-through-February core is the most comfortable. December and January carry the highest prices and tightest bookings, particularly the Christmas-New Year fortnight. Late March through April is workable but Khamsin-prone. May is too hot for most travellers. (58 words) | https://travel2egypt.org/travel-tips/egypt-weather-guide: "For inland sightseeing — Cairo, Luxor, Aswan, the West Bank temples — the optimal window is late October through early March. The November-through-February core is the most comfortable; October and early March bring slightly higher temperatures but smaller crowds. December and January carry the highest prices and tightest bookings, particularly the Christmas-New Year fortnight. Late March through April is workable but Khamsin-prone. May is too hot for most travellers." (trimmed: the clause after the semicolon) | ☐ |
| 3 | Do I need a visa? | Egypt requires a passport valid for at least six months beyond the date of departure. For most nationalities — including citizens of the UK, the US, the EU countries, Canada, Australia, Japan, and South Korea — Egypt offers two practical routes: an e-Visa obtained online before departure, or a visa on arrival bought at the airport. Both produce the same thing: a single-entry tourist visa that generally allows a stay of up to 30 days. (75 words) | https://travel2egypt.org/travel-tips/passport-and-visa (updated 10 October 2026): "Egypt requires a passport valid for at least six months beyond the date of departure." · "For most nationalities — including citizens of the UK, the US, the EU countries, Canada, Australia, Japan, and South Korea — Egypt offers two practical routes: an e-Visa obtained online before departure, or a visa on arrival bought at the airport. Both produce the same thing: a single-entry tourist visa that generally allows a stay of up to 30 days." | ☐ |
| 4 | How much are entrance fees? *(reworded from "What does a first trip cost?")* | Egypt's entrance fees are not particularly expensive by international standards. Ticket prices at Egyptian sites have increased periodically and sometimes significantly in recent years. Transport, guides, food, and incidentals are additional. Entrance fees in Egypt are ultimately the smallest variable in what makes a trip work. (46 words) | https://travel2egypt.org/travel-tips/attractions-entrance-fees: "Egypt's entrance fees are not particularly expensive by international standards." · "Ticket prices at Egyptian sites have increased periodically and sometimes significantly in recent years." · "These figures cover entrance fees only. Transport, guides, food, and incidentals are additional." · "Entrance fees in Egypt are ultimately the smallest variable in what makes a trip work." | ☐ |

### Dropped questions (no source page)

**"Is it safe to travel independently, or should I go private?" is dropped.** No site page addresses independent versus private travel as a safety question. The search covered:
- `/travel-tips/health-and-safety`, which says Egypt is "safer for foreign visitors than the country's reputation often suggests" but says nothing about independent versus private travel.
- `/blog/group-tours-vs-private-tours`, which compares group with private tours, not independent travel. For first-timers it leans towards a well-organised group tour.
- Sanity article bodies for "independently", "independent travel" and "travel independently" (11 hits, none framed as safety).

The spec says to drop safety questions that the site's pages don't answer.
- **Possible replacement:** "Should I go on a group or a private tour?", answered from the group-vs-private post.
- **Caveat:** that post points first-timers to group tours, while this page sells private ones. Tell me if you want it.

**"What does a first trip cost?" is reworded, not answered.**
- The site has no whole-trip cost page (no "Real Prices" page exists).
- The entrance-fees guide only covers tickets, hence question 4's new wording.
- A whole-trip figure could only come from the tours' live "from" prices. These are already shown on the cards above, and they change with the exchange rate, so they aren't typed into an answer.

### Source caveats (worth knowing before you approve)

- **Q1's source** is a legacy article with the byline "Travel2Egypt Archive", marked as undergoing editorial review.
  - Its English reads like a stiff translation. The awkward sentences ("satisfy more", "10 days stabilises Egypt travel considerably") are left out of the answer.
  - It lists "a Nile cruise" as a 10-day add-on, while this essay treats the boat as core. You may prefer to cut the last sentence.
- **Q3 differs in Japanese.** EN and ES say six months beyond the date of **departure**; the JA visa page says six months from the date of **entry** (入国日時点). This needs a fix on the JA page before the JA review.
- **Q4's page is dated inconsistently.** The header reads "ENTRANCE FEES 2025", while the footer says "Updated: 19 May 2026". No figures are quoted in the answer.
