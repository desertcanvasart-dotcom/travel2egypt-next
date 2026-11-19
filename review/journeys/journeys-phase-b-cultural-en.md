# Journey pages, Phase B2: Culture & history, owner review (EN)

**Page:** `/journeys/the-cultural-traveller`. Nothing here renders until you approve it.

**How to review:**
- Tick ☐ → ☑ to approve a row.
- To correct a row, write the corrected wording after it (e.g. `→ Coptic Cairo, layer on layer`).
- Rows you leave unticked and uncorrected are rejected and deleted.
- A section with nothing approved doesn't render at all.

**Sources:**
- Every sentence is copied word for word, or trimmed, from the journey essay or a site page. The exact source sentence and its URL are given for each one; every trim is named.
- **Essay:** https://travel2egypt.org/journeys/the-cultural-traveller. Paragraph numbers below count from 1, in reading order.

**Images:**
- All images are existing Sanity assets, at least 1600px wide, chosen after viewing each one. Alt text is the asset's existing alt, from the page named.
- None has a credit or source field. The 8 published assets that carry Creative Commons credits (all Islamic Cairo guide pages) were excluded.
- Most came over from the WordPress library with no metadata, so Sanity can't prove who took them. **Ownership is yours to confirm (owner only)** on every image row.

**ES and JA:** nothing here shows on `/es` or `/ja` until their own review files (`-es.md`, `-ja.md`) are produced from the approved EN and approved in turn.

---

## 1. Route map

A plain outline map of Egypt with the Nile. The stops are numbered and joined in order by a line.

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Stops | Cairo → Wadi El Natrun → Abydos → Luxor → Aswan | Approved Route fact "Cairo · desert monasteries · Luxor and Abydos · Aswan". "Desert monasteries" is drawn as Wadi El Natrun, the monasteries the essay names first (paragraph 3: "Wadi El Natrun's monasteries between Cairo and Alexandria"). | ☐ |
| Heading | The route | New label (same as First time) | ☐ |

**Notes:**
- **Abydos comes before Luxor** on the map because the line runs south. The Route fact says "Luxor and Abydos"; Abydos is normally a day out from Luxor. Cross out and write `→ Luxor → Abydos` if you prefer the fact's order (the line then doubles back north).
- **St. Anthony's is not drawn.** The essay also names St. Anthony's "by the Red Sea hills". It is far east of the Nile and the line would cross the desert to reach it. Tell me if you want it as a stop.
- **New coordinates:** Wadi El Natrun (30.32 N, 30.36 E, at Deir Anba Bishoy) was added to `src/lib/places/coords.ts`. ES uses the essay's "Wadi El Natrun"; JA uses the essay's ワディ・エル・ナトルン.
- **No travel-mode labels.** No product has `routeLegs` yet, so the map draws one plain line, as on First time.

## 2. Days selector

**Heading (fixed by the spec):** "How many days do you have?"

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Chips | **9 days** · **10 days** | The approved picks' own durations (Sanity `durationDays`): A 9-Day Egypt Tour of Culture and History = 9; 10-Day Egypt Private Tour (journey through history) = 10 | ☐ |
| Line under the chips | 9–12 days | Your approved Length fact (curation.ts). Essay spine: "9–12 days; the layers do not compress well…" | ☐ |

**What a chip does:** it scrolls to the matching card and highlights it, and pre-sets "How many days?" in the Plan my trip dialog and the end form (9 → 6–9 days; 10 → 10–14 days).

**Note:** no chip above 10 days. The line says up to 12, but no approved pick is longer than 10, so no chip is invented.

## 3. Three signature experiences

**Heading (new label, after First time's "Three moments that make a first trip"):** "Three moments that make a cultural trip" ☐

The three are the essay's layers beyond the pharaohs: Coptic Cairo (paragraph 2), the desert monasteries (paragraph 3), and Nubian Aswan (paragraph 5). The ancient sites (paragraph 4) appear as an essay image instead (section 4).

| # | Title (≤ 6 words) | Text | Source (exact essay sentences) | Link | Image | Approve? |
|---|---|---|---|---|---|---|
| 1 | Coptic Cairo, inside the fortress | In one Cairo city block — Coptic Cairo, inside the walls of a Roman fortress — stands a synagogue that was once a church, churches built over the fortress gates, and beneath one of them a crypt where tradition holds the Holy Family sheltered. That block is the whole argument for this trip in miniature: nothing in Egypt replaced what came before it; everything moved in upstairs. | Paragraph 2, sentences 2–3, word for word. | `/guide/cairo/coptic-cairo` | `image-811897b6964d78b4c247dfac539ff79414881cf0-3000x2199-jpg` (3000×2199) [view](https://cdn.sanity.io/images/ufallvd2/production/811897b6964d78b4c247dfac539ff79414881cf0-3000x2199.jpg?w=480). The Hanging Church's twin bell towers. Alt (existing, "Exploring Coptic Cairo" article): "Twin white bell towers with crosses above the Hanging Church in Coptic Cairo under a blue sky". Ownership: **owner only** | ☐ |
| 2 | Monasteries that still receive visitors | Monasticism — the whole idea of it — began in the Egyptian desert, and the communities that began it are still there. Wadi El Natrun's monasteries between Cairo and Alexandria; St. Anthony's by the Red Sea hills, arguably the oldest working monastery on earth. These are not museums with opening hours. They are living houses that receive visitors. | Paragraph 3, sentences 2–5, word for word. (Trimmed: "Then the desert, for the chapter most itineraries skip entirely." and the closing sentence about arriving with our guide.) | `/guide/wadi-el-natrun/monastery-of-saint-macarius-the-great` (the essay's own weave link) | `image-5c8413fd36cfa8d10544c07e61557728660bcb4e-2752x1536-jpg` (2752×1536) [view](https://cdn.sanity.io/images/ufallvd2/production/5c8413fd36cfa8d10544c07e61557728660bcb4e-2752x1536.jpg?w=480). Mud-brick monastery domes and bell towers among palms. Alt (existing, Wadi El Natrun accommodation guide): "Cream mud-brick Coptic monastery domes and cross-topped bell towers rising among palm trees under a blue sky". Ownership: **owner only** | ☐ |
| 3 | Nubian Aswan, visited properly | A Nubian village visited properly — with time, over tea, through someone who belongs there — plus Elephantine's layered ruins and the Nubian Museum, which is the best-told story in any Egyptian museum and criminally under-visited. Nubian Aswan is also simply the gentlest place on this itinerary, and we place it last for that reason. | Paragraph 5, sentences 2–3, word for word. (Trimmed: "And Aswan for the living culture the itineraries flatten into a photo stop: Nubia.") | `/guide/aswan/the-nubian-museum` (the essay's own weave link) | `image-17aad626d5700a2c586389f7e22c961f37a88131-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/17aad626d5700a2c586389f7e22c961f37a88131-3000x2000.jpg?w=480). Painted Nubian houses with domed roofs and yellow doors. Alt (existing, Nubian village tour): "Brightly painted Nubian houses with domed roofs, arched yellow doors and blue-washed steps in a riverside village". Ownership: **owner only** | ☐ |

**Notes:**
- **Card 2 names St. Anthony's**, which the route map doesn't draw (see section 1).
- **Alternate experience:** the ancient sites, read (paragraph 4: "Abydos for Seti I's reliefs, carved shallow and fine enough that the painters barely needed to help…"), linked to `/guide/sohag/abydos-temple`.
- **Alternate images:**
  - Card 1: `image-017966eadb86…-3000x2000-jpg`, the Hanging Church's courtyard and stair (Holy Family tour).
  - Card 3: `image-0d242c372a76…-3000x2000-jpg`, domed Nubian rooftops by the Nile (shows a tourist with a backpack); `image-90afd9f7b60c…-3000x2000-jpg`, Kushite statues inside the Nubian Museum.
- **The Nubian Museum page has no usable hero:** its own image (above alternate) shows statues only.

## 4. Essay images

Each image sits after the paragraph quoted, at the full width of the text column, with its caption. Captions describe the image and add no claims.

| # | After paragraph | Image | Caption | Approve? |
|---|---|---|---|---|
| 1 | 2: "Start where the layers are thickest…" (it names "Ibn Tulun's ninth-century calm") | `image-ff28778d999ed5a1c12cfebb25fdc87fa8ab15c0-2752x1536-jpg` (2752×1536) [view](https://cdn.sanity.io/images/ufallvd2/production/ff28778d999ed5a1c12cfebb25fdc87fa8ab15c0-2752x1536.jpg?w=480). The Ibn Tulun courtyard, fountain and spiral minaret. Alt (existing, Ibn Tulun guide page): "Courtyard of the Mosque of Ibn Tulun in Cairo, with its domed fountain and spiral minaret." Ownership: **owner only** (no credit field; not one of the CC-credited Islamic Cairo set) | The courtyard of the Mosque of Ibn Tulun, Cairo, with its spiral minaret. | ☐ |
| 2 | 4: "The ancient sites are still on this trip — but read, not toured…" (it names Abydos and Seti I) | `image-61b5ef1b3881b909321799ca23108d45c1c1f4dc-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/61b5ef1b3881b909321799ca23108d45c1c1f4dc-3000x2000.jpg?w=480). Carved hieroglyphs, the Seti I temple beyond at dusk. Alt (existing, Dendera & Abydos day tour): "Hieroglyph-carved temple wall at Abydos catching warm light, the colonnaded Temple of Seti I beyond at dusk". Ownership: **owner only** | Carved hieroglyphs at Abydos, with the Temple of Seti I beyond. | ☐ |

**Alternates:** image 1 → `image-5732073fa9f3…-3000x2000-jpg`, al-Muizz street floodlit at night (the paragraph names al-Muizz). Image 2 → `image-8feb1dc42cc7…-3000x2000-jpg`, the staircase to the Seti I temple façade.

## 5. Pull quote

A single sentence copied exactly from the essay, shown large between two paragraphs.

| Quote (exact) | Position | Approve? |
|---|---|---|
| "The cultural traveller is the one who wants the whole book." (paragraph 1) | After paragraph 3 (the desert monasteries), before the "The ancient sites, read closely" subheading | ☐ |

**Alternate:** "That block is the whole argument for this trip in miniature: nothing in Egypt replaced what came before it; everything moved in upstairs." (paragraph 2). It is already in experience card 1, so it would repeat on the page.

## 6. Questions cultural travellers ask

**Heading (new label):** "Questions cultural travellers ask" ☐

**How it works:** an accordion, first question open; answers in the page HTML, no FAQPage schema; each ends with "Read more →" to its source page.

| # | Question | Answer (≤ 80 words) | Source (exact sentences, with URLs) | Approve? |
|---|---|---|---|---|
| 1 | What should I wear to mosques, churches and monasteries? | Cover shoulders and knees, for both men and women, at every religious site — mosque, church, or monastery. Loose, lightweight clothing handles both the modesty expectation and the heat. Women entering mosques are generally expected to cover their hair; carrying a light scarf solves this and is useful at unexpectedly conservative churches too. Many major mosques lend wraps or robes at the entrance to visitors who arrive underdressed. (68 words) | https://travel2egypt.org/travel-tips/visiting-a-religious-site: "Dress. Cover shoulders and knees, for both men and women, at every religious site — mosque, church, or monastery. This is more relaxed than full traditional dress and more conservative than typical Western summer wear; loose, lightweight clothing handles both the modesty expectation and the heat. Women entering mosques… Many major mosques lend wraps or robes…" (trimmed: the "This is more relaxed…" clause before the semicolon; "loose" capitalised) | ☐ |
| 2 | Can non-Muslims visit mosques? | Most historic mosques welcome non-Muslim visitors outside prayer times. The major prayer of the week is the Friday midday congregational prayer, when mosques are busiest and visitor access is most restricted. Visitors should expect to remove their shoes before entering the prayer hall — carrying them, or leaving them at the designated rack — and to move quietly around the edges of the space rather than across the centre, particularly if anyone is praying. (74 words) | https://travel2egypt.org/travel-tips/visiting-a-religious-site: the same three sentences, word for word (trimmed: the closing sentence on the shoe-minding fee) | ☐ |
| 3 | Can I visit the desert monasteries? | The Monastery of Saint Macarius is normally visited by private car or as part of a Wadi Al-Natron monastery day from Cairo, around 92 kilometres from the capital. As with all working monasteries, access is shaped by liturgical schedules, fasting seasons, monastic needs, security arrangements, and restoration work. Visitors should dress modestly, speak quietly, avoid photography unless clearly permitted, and accept that some churches or internal areas may be closed without notice. (72 words) | https://travel2egypt.org/guide/wadi-el-natrun/monastery-of-saint-macarius-the-great ("Visiting"): "The Monastery of Saint Macarius lies in the southern part of Wadi Al-Natron, near the Cairo–Alexandria Desert Road. It is normally visited by private car or as part of a Wadi Al-Natron monastery day from Cairo, around 92 kilometres from the capital." · "As with all working monasteries, access is shaped by…" · "Visitors should dress modestly…" (trimmed: the first sentence's location clause, joining "The Monastery of Saint Macarius" to "is normally visited") | ☐ |
| 4 | What changes during Ramadan? | Ramadan rearranges the Egyptian day more completely than any other period of the year. Museums and archaeological sites usually stay open but frequently on reduced schedules. For a visitor, the practical effect is that mornings are the productive window and the hour around sunset belongs to iftar, the breaking of the fast. Travelling during Ramadan is not difficult, but it rewards planning around the shifted rhythm rather than against it. (70 words) | https://travel2egypt.org/travel-tips/opening-hours-and-public-holidays ("Ramadan and the Shifted Day"): the first two sentences are word for word; "For a visitor, the practical effect is that mornings are the productive window and the hour around sunset belongs to iftar, the breaking of the fast — a time when streets briefly empty, traffic thins, and almost everything pauses. Travelling during Ramadan is not difficult, but it rewards planning around the shifted rhythm rather than against it." (trimmed: the dash clause) | ☐ |

### Source caveats (worth knowing before you approve)

- **Q3 spells it "Wadi Al-Natron"** (the guide page's spelling), while the essay and the map say "Wadi El Natrun". Correct to `→ Wadi El Natrun` if you want one spelling on the page.
- **Q4 vs the essay's insider tip.** The opening-hours page says "mornings are the productive window"; this page's own insider tip says we shift Ramadan itineraries "to late mornings and long evenings". Both are true, but you may prefer to cut Q4's third sentence.
- **No Ramadan dates are quoted.** The opening-hours page gives 2026 dates, which would date the answer.

### Dropped questions

None dropped. A fifth question ("How long should a cultural trip be?") was not proposed because the days selector already answers it.
