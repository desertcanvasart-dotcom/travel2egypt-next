# Journey pages, Phase B2: Coming back, owner review (EN)

**Page:** `/journeys/coming-back`. Nothing here renders until you approve it.

**How to review:**
- Tick ☐ → ☑ to approve a row.
- To correct a row, write the corrected wording after it (e.g. `→ Siwa, eight hours west`).
- Rows you leave unticked and uncorrected are rejected and deleted.
- A section with nothing approved doesn't render at all.

**Sources:**
- Every sentence is copied word for word, or trimmed, from the journey essay or a site page. The exact source sentence and its URL are given for each one; every trim is named.
- **Essay:** https://travel2egypt.org/journeys/coming-back. Paragraph numbers below count from 1, in reading order.

**Images:**
- All images are existing Sanity assets, at least 1600px wide, chosen after viewing each one. Alt text is the asset's existing alt, from the page named.
- None has a credit or source field. The 8 published assets that carry Creative Commons credits were excluded.
- Most came over from the WordPress library with no metadata, so Sanity can't prove who took them. **Ownership is yours to confirm (owner only)** on every image row.

**ES and JA:** nothing here shows on `/es` or `/ja` until their own review files (`-es.md`, `-ja.md`) are produced from the approved EN and approved in turn.

---

## 1. Route map — left out

**Not proposed.** Your approved Route fact is "One of: Middle Egypt · Alexandria · Siwa and the oases". That is a choice of three regions, not one route, and the essay says the second trip should "go deep into one region and stay there". The map joins its stops in order with one line, so any stop list would draw a trip the essay argues against.

`phaseB.ts` has `route: null` for this journey, so nothing renders. If you want a map anyway, the options are:
- **One region's route**, e.g. Alexandria → Siwa (the 3-day pick's shape). This would favour one region over the other two.
- **Three separate maps**, one per region. This needs a component change (the map takes one route), so it is a new task, not a review row.

## 2. Days selector

**Heading (fixed by the spec):** "How many days do you have?"

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Chips | **3 days** · **7 days** · **10 days** | The approved picks' own durations (Sanity `durationDays`): Three Days from Alexandria to Siwa = 3; 7-Day Bahariya & Siwa Oasis Tour = 7; 10-Day Nile and Western Desert Tour = 10 | ☐ |
| Line under the chips | 7–10 days (one region) | Your approved Length fact (curation.ts) | ☐ |

**What a chip does:** scrolls to and highlights the matching card, and pre-sets "How many days?" (3 → 3–5 days; 7 → 6–9 days; 10 → 10–14 days).

**Note:** the 3-day chip sits under the line's 7–10. All three picks are Western Desert trips; none is a Middle Egypt or Alexandria-only trip, so the chips don't speak for those two regions.

## 3. Three signature experiences

**Heading (new label):** "Three regions worth an entire trip" ☐ — from paragraph 2: "Egypt holds at least three regions worth an entire trip".

The three are the essay's three regions, in its order: Middle Egypt (paragraph 3), Alexandria (paragraph 4), Siwa and the oases (paragraph 5).

| # | Title (≤ 6 words) | Text | Source (exact essay sentences) | Link | Image | Approve? |
|---|---|---|---|---|---|---|
| 1 | Middle Egypt, with no checklist | Beni Hasan, where the Middle Kingdom governors cut their tombs into the cliff and painted them with wrestlers and bird-catchers; Amarna, the capital Akhenaten built in five years and history abandoned in fifteen. The reason first trips leave this out is not quality. It is geometry: the sites are scattered across two hundred kilometres of valley with thin hotel choices, so the region rewards exactly what a returning traveller has — patience, and no checklist. | Paragraph 3: "Beni Hasan, where the Middle Kingdom governors…; Amarna, the capital Akhenaten built in five years and history abandoned in fifteen; Tuna el-Gebel and its underground galleries; and at the southern end, Abydos and Dendera — …" (trimmed after Amarna, so it reads as a fragment, like the essay's own list) · the last two sentences word for word | `/guide/al-minya` | `image-b9ebafc3c263853c9910caa842b276e4bb30b342-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/b9ebafc3c263853c9910caa842b276e4bb30b342-3000x2000.jpg?w=480). The Nile at Minya below limestone cliffs. Alt (existing, Minya weather guide): "The Nile at Al-Minya, palm groves and green fields along the water with the limestone cliffs of Middle Egypt rising behind". Ownership: **owner only** | ☐ |
| 2 | Alexandria and the sea | Alexandria and the Mediterranean edge is less a different region than a different country. Greco-Roman instead of pharaonic, sea light instead of desert light, a corniche instead of a river bank. Alexandria is two and a half hours from Cairo by road and a century away in temperament. | Paragraph 4: "The second is Alexandria and the Mediterranean edge, which is less a different region than a different country." (**trimmed and joined**: "The second is" and ", which" removed — the only sentence in this file that isn't a straight cut; cross it out if you'd rather start the card at "Greco-Roman…") · the next sentence word for word · "Alexandria is two and a half hours from Cairo by road and a century away in temperament." word for word. Title = your approved subheading. | `/guide/alexandria` (the essay's own weave link) | `image-c2f23960cecdfc5bc85caecd2c085dbccf2ba76d-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/c2f23960cecdfc5bc85caecd2c085dbccf2ba76d-3000x2000.jpg?w=480). The Qaitbay citadel from the air, the city behind. Alt (existing, Alexandria day tour): "Aerial view of the Citadel of Qaitbay guarding Alexandria's harbour and city skyline." Ownership: **owner only** | ☐ |
| 3 | Siwa, not on the way | This company was born in Siwa, and we will tell you plainly that it is not on the way to anything — eight hours from Cairo, close to the Libyan border, Berber-speaking, and organised around date gardens, salt lakes and the ruins of an oracle Alexander the Great crossed the desert to consult. That inconvenience is the point. Siwa is what Egypt is like when nothing is arranged for an audience. | Paragraph 5: "The third is the one we know from the inside: the Western Desert oases." (trimmed) · the next three sentences word for word | `/guide/siwa-oasis` (the essay's own weave link) | `image-8facb16f0510e5e5fd021ba11ad7186d46abfd83-4096x1460-jpg` (4096×1460) [view](https://cdn.sanity.io/images/ufallvd2/production/8facb16f0510e5e5fd021ba11ad7186d46abfd83-4096x1460.jpg?w=480). The ruined Temple of the Oracle. Alt (existing, the Siwa city page hero): "Ruined mudbrick remains of the Temple of the Oracle above palm groves at Siwa Oasis." Ownership: **owner only** | ☐ |

**Notes:**
- **No Beni Hasan or Amarna photo exists** in the library with alt text, so card 1 shows the Nile valley at Minya.
- **Card 1's link.** Middle Egypt has no single guide page; `/guide/al-minya` covers Beni Hasan, Amarna and Tuna el-Gebel. The essay's own weave link here is Abydos (`/guide/sohag/abydos-temple`), an alternate.
- **Card 3's "eight hours from Cairo"** is the essay's figure; the Siwa getting-there page says a private transfer takes "around eight to ten hours".
- **Card 3's image is a wide panorama** (4096×1460); the card crops it.
- **Alternate images:** card 2 → `image-7d6e5fac793b…-3000x2000-jpg`, a sphinx beside Pompey's Pillar; card 3 → `image-c3b647e8fd38…-3000x2000-jpg`, bathers in a turquoise Siwa salt lake.

## 4. Essay images

Each image sits after the paragraph quoted, at the full width of the text column, with its caption. Captions describe the image and add no claims.

| # | After paragraph | Image | Caption | Approve? |
|---|---|---|---|---|
| 1 | 1: "Somewhere on your first trip — probably on the West Bank at Luxor…" | `image-184ef2efa39f30e1be0d403ac57f0462ec1f471d-2752x1536-jpg` (2752×1536) [view](https://cdn.sanity.io/images/ufallvd2/production/184ef2efa39f30e1be0d403ac57f0462ec1f471d-2752x1536.jpg?w=480). The Colossi of Memnon, visitors tiny below. Alt (existing, "Myths and facts" article): "The two weathered Colossi of Memnon standing on the desert plain near Luxor with tiny visitors below". Ownership: **owner only** | The Colossi of Memnon on the West Bank at Luxor. | ☐ |
| 2 | 3: "The first is Middle Egypt…" (it ends on Dendera, "a ceiling that still carries its original paint") | `image-85767da3913bceab3d103155a69c01583c98ad34-3000x2003-jpg` (3000×2003) [view](https://cdn.sanity.io/images/ufallvd2/production/85767da3913bceab3d103155a69c01583c98ad34-3000x2003.jpg?w=480). Looking up at Dendera's painted columns and ceiling. Alt (existing, "Historical Egypt travel" article): "Upward view of Dendera temple's painted columns and ceiling, covered in colourful hieroglyphs and Hathor capitals". Ownership: **owner only** | Painted columns and ceiling inside the temple at Dendera. | ☐ |

**Alternate:** image 1 → `image-1c2ac1b2b773…-3000x2000-jpg`, Hatshepsut's temple below the Deir el-Bahari cliffs (also the West Bank).

## 5. Pull quote

| Quote (exact) | Position | Approve? |
|---|---|---|
| "Here is what the first trip bought you: you have seen the essential story, so you no longer need it." (paragraph 2) | After paragraph 4 (Alexandria), before the "The Western Desert oases" subheading | ☐ |

**Alternate:** "Siwa is what Egypt is like when nothing is arranged for an audience." (paragraph 5). It is already the last line of card 3, so it would repeat on the page unless card 3 is cut.

## 6. Questions returning travellers ask

**Heading (new label):** "Questions returning travellers ask" ☐

**How it works:** an accordion, first question open; answers in the page HTML, no FAQPage schema; each ends with "Read more →" to its source page.

| # | Question | Answer (≤ 80 words) | Source (exact sentences, with URLs) | Approve? |
|---|---|---|---|---|
| 1 | How do I get to Siwa? | There is no airport, no railway, and no quick final hop that makes the distance disappear. From Cairo, Alexandria, or the north coast, travellers first reach Marsa Matruh on the Mediterranean, then continue inland across the desert to Siwa. The final leg covers around 300 kilometres and takes roughly four to four and a half hours depending on stops, road conditions, and checkpoint delays. (64 words) | https://travel2egypt.org/guide/siwa-oasis/how-to-go-in-siwa-oasis: three sentences, word for word, from two paragraphs | ☐ |
| 2 | When is the best time for Siwa? | For most visitors, October to March is the safest and most comfortable window. October and November offer the best all-round balance. The worst heat has passed, days become warm rather than punishing, nights are comfortable, and desert excursions are more pleasant. October also overlaps with the date harvest, one of the oasis's important agricultural rhythms, and with the Siyaha Festival at Dakrour Mountain. (63 words) | https://travel2egypt.org/guide/siwa-oasis/weather-in-siwa-oasis: "Best Time to Visit" (first two sentences) and the October–November paragraph (last two), word for word | ☐ |
| 3 | How do I get to Alexandria? | The city sits about 220 kilometres northwest of Cairo on the Mediterranean coast. The train is usually the best balance of comfort and ease. A private car is the simplest door-to-door option. Faster modern trains can make the trip in roughly two and a half hours; older express services often take three to four hours depending on stops and delays. (60 words) | https://travel2egypt.org/guide/alexandria/getting-to-alexandria: word for word from the intro and "By Train from Cairo" (trimmed: the bus and air sentences) | ☐ |
| 4 | Will there be a police escort in Middle Egypt? | Foreign visitors in Middle Egypt may encounter tourist police coordination, checkpoints, or an escort for some routes. This can feel surprising if you have only travelled in Cairo or Luxor, but it is a normal feature of travel in parts of Middle Egypt. It does not necessarily indicate immediate danger. It does mean that timings may be affected and that independent improvisation can be harder than it looks on paper. (70 words) | https://travel2egypt.org/guide/al-minya/getting-around-in-al-minya ("Police Escorts and Local Formalities"): word for word | ☐ |

### Source caveats (worth knowing before you approve)

- **Q1 doesn't give a door-to-door time.** The page's totals vary by mode (overnight bus "roughly 10 to 12 hours"; private transfer "around eight to ten hours"); the essay says "eight hours". Q1 quotes only the fixed facts and the final leg.
- **Q2 says October and November are best**, while your Season fact for this page says "Alexandria best when Cairo is warmest". They're about different regions, but read together they may confuse. Cross out Q2 if so.
- **Q3's "two and a half hours"** is by fast train; the essay says Alexandria is "two and a half hours from Cairo by road". Both appear on the page if card 2 and Q3 are approved.
- **Q4 is safety-adjacent.** The site answers it directly, so it is proposed (the spec drops only safety questions the site doesn't answer). It is also the most likely surprise for a returning traveller.

### Dropped questions

None dropped beyond the route map (section 1).
