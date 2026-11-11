# Journey pages, Phase B2: Families, owner review (EN)

**Page:** `/journeys/travelling-as-a-family`. Nothing here renders until you approve it.

**How to review:**
- Tick ☐ → ☑ to approve a row.
- To correct a row, write the corrected wording after it (e.g. `→ The Red Sea, to exhale`).
- Rows you leave unticked and uncorrected are rejected and deleted.
- A section with nothing approved doesn't render at all.

**Sources:**
- Every sentence is copied word for word, or trimmed, from the journey essay or a site page. The exact source sentence and its URL are given for each one; every trim is named.
- **Essay:** https://travel2egypt.org/journeys/travelling-as-a-family. Paragraph numbers below count from 1, in reading order.

**Images:**
- All images are existing Sanity assets, at least 1600px wide, chosen after viewing each one. Alt text is the asset's existing alt, from the page named.
- None has a credit or source field. The 8 published assets that carry Creative Commons credits were excluded.
- Most came over from the WordPress library with no metadata, so Sanity can't prove who took them. **Ownership is yours to confirm (owner only)** on every image row.

**ES and JA:** nothing here shows on `/es` or `/ja` until their own review files (`-es.md`, `-ja.md`) are produced from the approved EN and approved in turn.

---

## 1. Route map

A plain outline map of Egypt with the Nile. The stops are numbered and joined in order by a line.

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Stops | Cairo → Aswan → Luxor → Hurghada | Approved Route fact "Cairo · Nile cruise · Red Sea". "Nile cruise" is the Aswan → Luxor leg (as on the First-time map), not a place. "Red Sea" is drawn as Hurghada, the coast the essay's own weave links (`/guide/hurghada`). | ☐ |
| Heading | The route | New label (same as First time) | ☐ |

**Notes:**
- **Cruise direction is not stated in the essay.** The map sails north, Aswan → Luxor, so the line can run on from Luxor to the Red Sea. If your family boats sail south, write `→ Cairo → Luxor → Aswan → Hurghada` (the line then crosses back).
- **Hurghada is a choice.** The essay says only "the Red Sea". Cross out and name another resort if you prefer.
- **New coordinates:** Hurghada (27.26 N, 33.81 E) was added to `src/lib/places/coords.ts`, with the Sanity city names (EN/ES Hurghada, JA ハルガダ).
- **No travel-mode labels.** No product has `routeLegs` yet.

## 2. Days selector

**Heading (fixed by the spec):** "How many days do you have?"

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Chips | **4 days** · **9 days** · **11 days** | The approved picks' own durations (Sanity `durationDays`): Four Days for Families, Cairo and Alexandria = 4; 9-Day Classic Egypt Family Tour = 9; 11-Day Splendour of Egypt = 11 | ☐ |
| Line under the chips | 10–12 days (8 without the Red Sea) | Your approved Length fact (curation.ts) | ☐ |

**What a chip does:** scrolls to and highlights the matching card, and pre-sets "How many days?" (4 → 3–5 days; 9 → 6–9 days; 11 → 10–14 days).

**Note:** the 4-day chip sits well under the line's 8–12. It is a real pick (the short Cairo-and-Alexandria trip), so it is shown, but tell me if you'd rather the line and chips not disagree.

## 3. Three signature experiences

**Heading (new label, after First time's "Three moments that make a first trip"):** "Three moments that make a family trip" ☐

The three are the essay's "three movements" in order: Cairo (paragraph 3), the Nile (paragraph 4), the Red Sea (paragraph 5).

| # | Title (≤ 6 words) | Text | Source (exact essay sentences) | Link | Image | Approve? |
|---|---|---|---|---|---|---|
| 1 | Cairo in short, vivid strikes | Cairo first, taken in short, vivid strikes: the Giza plateau early, one pyramid interior while it is still cool, the Tutankhamun galleries taken at a child's speed — which is fast through some rooms and transfixed in others — and the afternoon at the hotel pool, on purpose. Two anchors a day is our rule for adults; with children it is one, and it happens in the morning. | Paragraph 3, sentences 2–3, word for word. (Trimmed: "So the family trip we build has three movements.") | `/guide/giza/the-great-pyramid-of-khufu` (the essay's own weave link) | `image-b4af83c55481b9230163d764f2cf78b68c644345-3000x1999-jpg` (3000×1999) [view](https://cdn.sanity.io/images/ufallvd2/production/b4af83c55481b9230163d764f2cf78b68c644345-3000x1999.jpg?w=480). A boy in a straw hat looking at the Sphinx. Alt (existing, "Historical Egypt trips for families" article): "Young boy in a straw hat sitting cross-legged, gazing at the Great Sphinx and a pyramid at Giza". Ownership: **owner only** — it shows a child, so please also confirm you hold the right to use the photo of him. | ☐ |
| 2 | Unpack once, on the Nile | A cruise means unpacking once. It means the pool is thirty metres from the temple gangway, the kitchen already knows what your children eat, and the distances between sites cross themselves while everyone sleeps. Temples come one per morning — Kom Ombo's crocodiles and Edfu's falcon are reliable hits — and the deck does the rest. | Paragraph 4, sentences 2–4, word for word. (Trimmed: "Then the Nile, which is where Egypt solves family travel almost by itself." and the closing sentences on how we choose the boat.) Title from "A cruise means unpacking once." | `/nile-cruises` (the essay's own weave link) | `image-00569fd84a0dc0b81185b77f8eed59fc35e12a3d-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/00569fd84a0dc0b81185b77f8eed59fc35e12a3d-3000x2000.jpg?w=480). A cruise ship moored below Kom Ombo temple. Alt (existing, 7-day Epic Egyptian Escape tour): "Nile cruise ship moored below the riverside ruins of Kom Ombo Temple in golden evening light". Ownership: **owner only** | ☐ |
| 3 | The Red Sea, last | Ending there, rather than starting, gives the trip somewhere to exhale. Three or four nights of reef and pool after the sites are done, when the early mornings have been earned and nobody has to set an alarm. Children remember Egypt as the place with the mummies and the fish, which is a better souvenir than any itinerary can print. | Paragraph 5, sentences 2–4, word for word. (Trimmed: "Last, the Red Sea — and the order matters.") | `/guide/hurghada` (the essay's own weave link) | `image-1d907d8b7a7b24d585ba9abbb195287c671a6bea-3000x1999-jpg` (3000×1999) [view](https://cdn.sanity.io/images/ufallvd2/production/1d907d8b7a7b24d585ba9abbb195287c671a6bea-3000x1999.jpg?w=480). Orange anthias over a coral reef. Alt (existing, 11-day Explore Egypt & Red Sea tour): "Shoals of orange anthias and reef fish above a coral reef in the clear Red Sea." Ownership: **owner only** | ☐ |

**Notes:**
- **Card 1 is already widely used:** the families article, the "Is Egypt safe?" article and the 12-day family tour, in all three languages.
- **Card 2's image is also on the First-time pick** "Epic Egyptian Escape" (its gallery, not its hero).
- **Alternate images:**
  - Card 2: `image-77b6fee43b6a…-1920x980-jpg`, a cruise sun deck with a small pool (Oberoi Philae — names a specific ship).
  - Card 3: `image-5de1335d39ea…-3000x1999-jpg`, a snorkeller over a reef; `image-7f6de3e32bb0…-3000x2000-jpg`, a Hurghada beach with parasols.
- **Card titles 2 and 3:** "The Red Sea, last" repeats your approved subheading; tell me if you want a different title so the two don't sit on one page.

## 4. Essay images

Each image sits after the paragraph quoted, at the full width of the text column, with its caption. Captions describe the image and add no claims.

| # | After paragraph | Image | Caption | Approve? |
|---|---|---|---|---|
| 1 | 2: "Consider what this country offers an eight-year-old…" (it names "Tombs painted with snakes and crocodile gods") | `image-c920272660003276cfbddadf34a65f7f93490d63-3000x1999-jpg` (3000×1999) [view](https://cdn.sanity.io/images/ufallvd2/production/c920272660003276cfbddadf34a65f7f93490d63-3000x1999.jpg?w=480). Rows of painted hieroglyphs and figures. Alt (existing, hieroglyphs article): "Painted tomb wall covered in rows of colourful ancient Egyptian hieroglyphs and figures". Ownership: **owner only** | A painted tomb wall, covered in rows of hieroglyphs and figures. | ☐ |
| 2 | 4: "Then the Nile…" (it names "Edfu's falcon") | `image-46e54696e8dd7dc627e89df20f34ee58d3cebbe5-3000x1992-jpg` (3000×1992) [view](https://cdn.sanity.io/images/ufallvd2/production/46e54696e8dd7dc627e89df20f34ee58d3cebbe5-3000x1992.jpg?w=480). A relief of falcon-headed Horus facing a goddess. Alt (existing, Esna–Edfu–Kom Ombo day tour): "Sunlit temple relief of a crowned goddess facing the falcon-headed god Horus, carved in pale stone". Ownership: **owner only** | A temple relief of the falcon-headed god Horus. | ☐ |

**Notes:**
- **Image 2's temple isn't named** in Sanity (it comes from an Esna–Edfu–Kom Ombo tour), so the caption doesn't say Edfu.
- **Alternate:** image 1 → `image-8740f787a4d1…-2600x1785-jpg`, a painted royal tomb ceiling in the Valley of the Kings.

## 5. Pull quote

| Quote (exact) | Position | Approve? |
|---|---|---|
| "Children do not need Egypt explained to them; they need it paced for them." (paragraph 2) | After paragraph 3 (Cairo), before the "The Nile does the work" subheading | ☐ |

**Alternate:** "Egypt is extraordinary with children." (paragraph 1), placed after paragraph 2.

## 6. Questions families ask

**Heading (new label):** "Questions families ask" ☐

**How it works:** an accordion, first question open; answers in the page HTML, no FAQPage schema; each ends with "Read more →" to its source page.

| # | Question | Answer (≤ 80 words) | Source (exact sentences, with URLs) | Approve? |
|---|---|---|---|---|
| 1 | What does a day look like with young children? | The single most useful adjustment for travelling in Egypt with young children is shifting the day's centre of gravity earlier. Be at a major site — the Pyramids, Karnak, Luxor Temple, the Valley of the Kings — by 7:00 am, in the first hour after gates open. Be back at the hotel by 11:00 am. Pool time, lunch, and nap or quiet hour through the hottest part of the day, roughly noon to 4:00 pm. (75 words) | https://travel2egypt.org/travel-tips/traveling-with-kids ("The Daily Rhythm"): the four sentences are word for word (trimmed: the wake-up and breakfast times between them, and the rest of the paragraph) | ☐ |
| 2 | Is a Nile cruise good for children? | Nile cruises are particularly well-suited to families with children aged five to nine. The boat provides routine, predictable meals, a pool, evening entertainment, and a fixed bedroom that does not need to be repacked each night. The cruise pace — one or two temple visits per day with substantial onboard downtime — matches young children's stamina better than a land-based itinerary covering the same sites would. (66 words) | https://travel2egypt.org/travel-tips/traveling-with-kids ("Transport with Kids"): the whole paragraph, word for word | ☐ |
| 3 | Which sites work best for children? | The Pyramids of Giza are the obvious entry point and work for all ages. The Grand Egyptian Museum is the most child-friendly major museum in Egypt. Karnak allows roaming. The Valley of the Kings is harder for under-fives. Children from about seven upwards usually engage well, particularly if given specific tombs to focus on. Red Sea snorkelling is the most reliably joyful family activity in Egypt. (66 words) | https://travel2egypt.org/travel-tips/traveling-with-kids ("Sites That Work for Under-Tens"): the first sentence of five site paragraphs. (Trimmed: the Valley of the Kings sentence's dash clause "— narrow tomb corridors, heat, photography restrictions, and a degree of patience required to appreciate the painting") | ☐ |
| 4 | What about food and water? | Egyptian food is generally accessible to young palates, though the specific dishes that work for adults are not always the dishes that work for children. Bottled water always, for everyone in the family. Carry more bottled water than seems necessary; Egyptian heat dehydrates children faster than the conditions feel from inside an air-conditioned car or hotel lobby. (57 words) | https://travel2egypt.org/travel-tips/traveling-with-kids ("Food, Water, and the Illness Question"): the three sentences, word for word | ☐ |

### Source caveats (worth knowing before you approve)

- **The kids page is written for under-tens**, and Q2 says cruises suit ages "five to nine". The essay builds for "school-age children, roughly six and up". They don't conflict, but the answers lean younger than the essay.
- **Q1's 7:00 am start** is the kids page's advice; the essay says only that the one anchor "happens in the morning".

### Dropped questions

- **"Is Egypt safe for children?" is held back, not proposed.** One page answers it: https://travel2egypt.org/blog/safety-guide-for-travelers-to-egypt ("Women travellers and families"): "For families, Egypt receives warmly. Children get called to often, with help when stuck. Sites aren't stroller-friendly. With sand, steps, narrow tomb passages, and few handrails, small children need carriers or close adult watching." Its English reads like a stiff translation, so it isn't put in front of you as an answer. `/travel-tips/health-and-safety` and `/blog/is-egypt-safe` don't address children. Tell me if you want it anyway (as a fifth question).
- **Car seats** (the kids page: "Car seats are not standard in Egyptian taxis, private hires, or rental cars.") was left out as too operational for this page. Tell me if you want it.
