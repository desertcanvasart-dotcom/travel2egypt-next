# Journey pages, Phase B2: Travelling in style, owner review (EN)

**Page:** `/journeys/travelling-in-style`. Nothing here renders until you approve it.

**How to review:**
- Tick ☐ → ☑ to approve a row.
- To correct a row, write the corrected wording after it (e.g. `→ The river under sail`).
- Rows you leave unticked and uncorrected are rejected and deleted.
- A section with nothing approved doesn't render at all.

**Sources:**
- Every sentence is copied word for word, or trimmed, from the journey essay or a site page. The exact source sentence and its URL are given for each one; every trim is named.
- **Essay:** https://travel2egypt.org/journeys/travelling-in-style. Paragraph numbers below count from 1, in reading order.

**Images:**
- All images are existing Sanity assets, at least 1600px wide, chosen after viewing each one. Alt text is the asset's existing alt, from the page named.
- None has a credit or source field. The 8 published assets that carry Creative Commons credits were excluded.
- Most came over from the WordPress library with no metadata, so Sanity can't prove who took them. **Ownership is yours to confirm (owner only)** on every image row.

**ES and JA:** nothing here shows on `/es` or `/ja` until their own review files (`-es.md`, `-ja.md`) are produced from the approved EN and approved in turn.

---

## 1. Route map

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Stops | Cairo → Luxor → Aswan | Approved Route fact "Usually Cairo · Nile by dahabiya · Aswan". "Nile by dahabiya" is the Luxor → Aswan leg: https://travel2egypt.org/blog/dahabiya-nile-cruises-wind-powered-journey says "The most common run is between Luxor and Aswan." | ☐ |
| Heading | The route | New label (same as First time) | ☐ |

**Notes:**
- **Luxor is added** as the dahabiya's starting point (from the dahabiya article above; the essay itself names "the Winter Palace at Luxor"). Cross it out if you want the map to show only the fact's two places.
- **Direction.** The map sails south, Luxor → Aswan, matching the 9-day Prestigious pick's title ("Luxor, the Nile, Aswan and Cairo"). That pick ends in Cairo, so you may want `→ Cairo` added at the end.
- **Coordinates** were already in `src/lib/places/coords.ts`. No new places.

## 2. Days selector

**Heading (fixed by the spec):** "How many days do you have?"

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Chips | **4 days** · **9 days** · **10 days** | The approved picks' own durations (Sanity `durationDays`): Royal Retreat, Marriott Mena House = 4; Prestigious Egypt Vacation = 9; Egypt Royal Vacation = 10 | ☐ |
| Line under the chips | 10–14 days (unhurried) | Your approved Length fact (curation.ts) | ☐ |

**What a chip does:** scrolls to and highlights the matching card, and pre-sets "How many days?" (4 → 3–5 days; 9 → 6–9 days; 10 → 10–14 days).

**Note:** only the 10-day pick falls inside the line's 10–14. The 4-day Mena House stay is a short stay by design (your Phase A "why"), so the chips and the line disagree on purpose.

## 3. Three signature experiences

**Heading (new label, after First time's "Three moments that make a first trip"):** "Three moments that make a trip in style" ☐

The three are the essay's three choices: the river (paragraph 2), the hotels (paragraph 3) and the guide (paragraph 4).

| # | Title (≤ 6 words) | Text | Source (exact essay sentences) | Link | Image | Approve? |
|---|---|---|---|---|---|---|
| 1 | The Nile under sail | The fullest version of the Nile is a dahabiya: a shallow-draught sailing boat of eight or ten cabins, or chartered whole, moving under canvas at the river's own speed. A dahabiya moors where the big ships cannot — at islands, at small temples with no queue because there is no dock, at a sandbank for dinner ashore — and it crosses the water in something the ships never offer: quiet. | Paragraph 2: "The five-star ships are comfortable and we use the best of them, but the fullest version of the Nile is a dahabiya: …" (trimmed: the clause before "but"; "the" capitalised) · the next sentence word for word. Title = your approved subheading. | `/blog/dahabiya-nile-cruises-wind-powered-journey` (the essay's own weave link) | `image-be5960e1597224e47956aeb75a8d0564731b6c83-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/be5960e1597224e47956aeb75a8d0564731b6c83-3000x2000.jpg?w=480). A twin-masted dahabiya under sail at dusk. Alt (existing, "Luxury Nile cruise" article): "Traditional twin-masted dahabiya sailing boat gliding on the Nile past green banks and desert hills at dusk". Ownership: **owner only** | ☐ |
| 2 | Hotels that are themselves sites | Mena House with the Pyramids filling its garden windows; the Old Cataract above the First Cataract at Aswan, still trading on the afternoon light that Agatha Christie wrote by. Staying in them is not a room upgrade, it is an extra monument on the itinerary. | Paragraph 3: "…Mena House with the Pyramids filling its garden windows; the Old Cataract above the First Cataract at Aswan, still trading on the afternoon light that Agatha Christie wrote by; the Winter Palace at Luxor — under restoration as this is written — with a century of arrivals in its corridors." (trimmed: the opening clause and the Winter Palace) · "Staying in them is not a room upgrade, it is an extra monument on the itinerary — and they hold few rooms facing the things you came for…" (trimmed: the dash clause) | `/hotels` (the essay's own weave link) | `image-3b78ca1ecd75ac0d22e72eb8e991af791b9c4744-3000x1320-jpg` (3000×1320) [view](https://cdn.sanity.io/images/ufallvd2/production/3b78ca1ecd75ac0d22e72eb8e991af791b9c4744-3000x1320.jpg?w=480). The Old Cataract above the river, feluccas moored below. Alt (existing, 15-day Nile cruise and Hurghada tour): "The Old Cataract hotel and moored feluccas on the Nile's granite shore at Aswan." Ownership: **owner only** | ☐ |
| 3 | One Egyptologist, throughout | Guiding, at this register, means one Egyptologist who is yours for the duration — the same person at Giza and at Philae, building on what you saw yesterday instead of restarting the introduction. And it means access spent where it counts: the site at opening when the light is low and the coaches have not arrived, the tomb visited at the quiet hour, the occasional door that opens early or stays open late. | Paragraph 4, sentences 1–2, word for word. Title = your approved subheading. | `/about` (the team page: "Egyptologist guides, drivers, operations staff…") | `image-5eb7b6bfef891fae731163bfa30495428bfa8934-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/5eb7b6bfef891fae731163bfa30495428bfa8934-3000x2000.jpg?w=480). Philae's colonnaded forecourt and pylons. Alt (existing, Philae guide page): "Colonnaded forecourt and carved pylons of Philae Temple under a pale blue sky, visitors crossing the paving". Ownership: **owner only** | ☐ |

**Notes:**
- **The Winter Palace is left out of card 2** because it is closed: the accommodation guide says it is "currently under restoration as the Mandarin Oriental Winter Palace, Luxor (reopening 2027)".
- **Card 2's image is the same hotel as First time's hero** (the Old Cataract, a different photo). Alternate: `image-989eb8595ddf…-3000x2000-jpg`, Mena House gardens with the Great Pyramid at dusk — but that is close to this page's own hero.
- **Card 3's link.** No page is about our guides as such; `/about` is the nearest. Alternate: `/guide/aswan/the-philae-temple`, to match the image.
- **Titles 1 and 3 repeat your approved subheadings.** Tell me if you want different card titles.
- **Alternate images:** card 1 → `image-1394fe0d9e73…-3000x2000-jpg`, a dahabiya with striped sails at golden sunset (the Nour El Nil Assouan page); card 3 → `image-22fafe844499…-6000x1945-jpg`, Philae from the water.

## 4. Essay images

Each image sits after the paragraph quoted, at the full width of the text column, with its caption. Captions describe the image and add no claims.

| # | After paragraph | Image | Caption | Approve? |
|---|---|---|---|---|
| 1 | 2: "Start with the river…" (it ends on "something the ships never offer: quiet") | `image-44d3a1dd7ef59cfc7d829e905eade532214a4929-3000x1992-jpg` (3000×1992) [view](https://cdn.sanity.io/images/ufallvd2/production/44d3a1dd7ef59cfc7d829e905eade532214a4929-3000x1992.jpg?w=480). A shaded deck with cane chairs as a big cruise ship passes. Alt (existing, the dahabiya article): "Cane chairs on a shaded riverboat deck as a large cruise ship passes on the Nile". Ownership: **owner only** | A shaded riverboat deck, with a large cruise ship passing on the Nile. | ☐ |
| 2 | 4: "Guiding, at this register…" (it names Giza) | `image-b620522286b15ca9299ed5d862c5ad852f856404-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/b620522286b15ca9299ed5d862c5ad852f856404-3000x2000.jpg?w=480). The Sphinx before Khafre's pyramid, few people. Alt (existing, "Exclusive access to the Giza pyramid" article): "The Great Sphinx of Giza in front of the Pyramid of Khafre under a clear pale sky". Ownership: **owner only** | The Great Sphinx before the Pyramid of Khafre, Giza. | ☐ |

**Notes:** the paragraph-3 hotels are not shown again here (card 2 has the Old Cataract; the hero has the Giza hotel gardens). Image 1 is the dahabiya article's own hero.

## 5. Pull quote

| Quote (exact) | Position | Approve? |
|---|---|---|
| "Egypt sells no shortage of private-access moments; the craft is knowing which are worth it and which are theatre." (paragraph 4) | After paragraph 5 ("Underneath all of it runs the choreography…"), before the "A register above, and our sister house" subheading | ☐ |

**Alternate:** "Egypt is a country where logistics show." (paragraph 1), placed after paragraph 1.

## 6. Questions about travelling in style

**Heading (new label):** "Questions about travelling in style" ☐

**How it works:** an accordion, first question open; answers in the page HTML, no FAQPage schema; each ends with "Read more →" to its source page.

| # | Question | Answer (≤ 80 words) | Source (exact sentences, with URLs) | Approve? |
|---|---|---|---|---|
| 1 | Does a dahabiya really sail? | Modern dahabiyas use the sail when there is wind, but they don't run on sail alone. Schedule, safety, wind direction, and river conditions sometimes require a tugboat or an engine. A trustworthy operator says so openly. (36 words) | https://travel2egypt.org/blog/dahabiya-nile-cruises-wind-powered-journey: "Don't take marketing language at face value. Modern dahabiyas use the sail…" (trimmed: the first sentence) | ☐ |
| 2 | How long is a dahabiya trip? | The most common run is between Luxor and Aswan. A stretch that large ships often handle in three or four nights, a dahabiya may travel over five to seven. Beyond the main temples, places like Esna, Elkab, and Gebel el-Silsila enter the itinerary. (43 words) | https://travel2egypt.org/blog/dahabiya-nile-cruises-wind-powered-journey ("What route they sail"): word for word (trimmed: "The longer time reads the same map at a different density." and the sentences on each site) | ☐ |
| 3 | How far ahead should I book? | For peak-season travel, book at least six to eight weeks ahead, longer for the Christmas and New Year window. Major heritage hotels — the Old Cataract in Aswan, the Marriott Mena House at Giza, the Cecil in Alexandria — fill quickest. (41 words) | https://travel2egypt.org/travel-tips/tips-on-accommodations: word for word (trimmed: the sentence on chain hotels) | ☐ |
| 4 | When is the Nile at its best? | The Nile suits travel best from autumn through spring. From around October to April, the heat is comparatively mild and time on deck is comfortable. December and January are cool and pleasant; they are also a busy period. February and March often balance temperature and crowds well. (47 words) | https://travel2egypt.org/blog/dahabiya-nile-cruises-wind-powered-journey ("Season and river conditions"): the whole paragraph, word for word | ☐ |

### Source caveats (worth knowing before you approve)

- **Q3's "six to eight weeks"** is general hotel advice; the essay says these trips are "the ones we plan earliest of all". You may prefer to cut Q3's first sentence and keep only the heritage-hotels line.
- **The Old Cataract's brand differs between pages.** The accommodation guide calls it "Sofitel Legend Old Cataract"; the historical-hotels article and your Phase A "why" call it Mandarin Oriental. No answer here names the brand.
- **The dahabiya article's English reads like a translation in places** ("return small changes on the bank to the centre of the trip"). The sentences quoted were chosen to avoid those.

### Dropped questions

- **"Is the Winter Palace open?"** is not proposed: the only source, the accommodation guide, states it in a clause ("the historic Winter Palace currently under restoration… (reopening 2027)") that can't stand alone as an answer without rewording.
