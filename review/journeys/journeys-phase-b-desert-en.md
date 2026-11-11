# Journey pages, Phase B2: Desert & quiet, owner review (EN)

**Page:** `/journeys/desert-and-quiet`. Nothing here renders until you approve it.

**How to review:**
- Tick ☐ → ☑ to approve a row.
- To correct a row, write the corrected wording after it (e.g. `→ Camp among the chalk`).
- Rows you leave unticked and uncorrected are rejected and deleted.
- A section with nothing approved doesn't render at all.

**Sources:**
- Every sentence is copied word for word, or trimmed, from the journey essay or a site page. The exact source sentence and its URL are given for each one; every trim is named.
- **Essay:** https://travel2egypt.org/journeys/desert-and-quiet. Paragraph numbers below count from 1, in reading order.

**Images:**
- All images are existing Sanity assets, at least 1600px wide, chosen after viewing each one. Alt text is the asset's existing alt, from the page named.
- None has a credit or source field. The 8 published assets that carry Creative Commons credits were excluded.
- Most came over from the WordPress library with no metadata, so Sanity can't prove who took them. **Ownership is yours to confirm (owner only)** on every image row.
- **The library has no White Desert camp, night-sky or dawn photo with alt text.** That shaped sections 3 and 4 (see their notes).

**ES and JA:** nothing here shows on `/es` or `/ja` until their own review files (`-es.md`, `-ja.md`) are produced from the approved EN and approved in turn.

---

## 1. Route map

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Stops | Cairo → Bahariya → White Desert → Cairo | Approved Route fact "Cairo · Bahariya · White Desert (or Fayoum)". Essay paragraph 2: "You leave Cairo in the morning and drive southwest — four hours to Bahariya… and into the White Desert by late afternoon". The return to Cairo is the round trip the 3-day pick makes. | ☐ |
| Heading | The route | New label (same as First time) | ☐ |

**Notes:**
- **Fayoum is not drawn.** "(or Fayoum)" is an alternative to the White Desert, not a stop on the same trip; one line can't show "or". Fayoum appears as experience card 2 instead. If you want it on the map anyway, write `→ Cairo → Fayoum → Bahariya → White Desert → Cairo` (the 4-day pick's shape).
- **Return leg.** Do all three picks end in Cairo? The 7-day Bahariya and Siwa pick may not; cross out the final "→ Cairo" if it shouldn't show.
- **The Black Desert and Crystal Mountain** (named in paragraph 2) are not stops; they lie on the Bahariya → White Desert road.
- **Coordinates** were already in `src/lib/places/coords.ts` (Bahariya, White Desert). No new places.

## 2. Days selector

**Heading (fixed by the spec):** "How many days do you have?"

| Item | Proposal | Source | Approve? |
|---|---|---|---|
| Chips | **3 days** · **4 days** · **7 days** | The approved picks' own durations (Sanity `durationDays`): 3-Day Western Desert Private Tour = 3; 4-Day White Desert & Wadi Al Hittan = 4; Desert Horizons (Bahariya and Siwa) = 7 | ☐ |
| Line under the chips | 2 days for the White Desert, 1–2 for Fayoum (4–5 if the desert is the trip) | Your approved Length fact (curation.ts) | ☐ |

**What a chip does:** scrolls to and highlights the matching card, and pre-sets "How many days?" (3 and 4 → 3–5 days; 7 → 6–9 days).

**Note:** the line is long for a line under chips (17 words). A shorter cut of the same fact would be "2 days for the White Desert (4–5 if the desert is the trip)" — tell me if you want it.

## 3. Three signature experiences

**Heading (new label, after First time's "Three moments that make a first trip"):** "Three moments that make a desert trip" ☐

The three are the night in the White Desert (paragraph 2), Fayoum (paragraph 4) and its Valley of the Whales (paragraph 4).

| # | Title (≤ 6 words) | Text | Source (exact essay sentences) | Link | Image | Approve? |
|---|---|---|---|---|---|---|
| 1 | A night in the White Desert | What the wind has carved there — mushrooms, spires, shapes the guides have named and shapes they haven't — photographs like another planet and behaves like one too. Camp goes up among the formations. Dinner is cooked over fire. A fennec fox will very likely visit, because they have learned what camps mean. | Paragraph 2, four consecutive sentences, word for word. (The paragraph's last sentence, "And then the main event…", is kept for the pull quote.) Title = your approved subheading. | `/guide/farafra-oasis/white-desert-national-park` | `image-a96cbad739d78a9ad2ecfdc2cf2d64d424b8e4f2-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/a96cbad739d78a9ad2ecfdc2cf2d64d424b8e4f2-3000x2000.jpg?w=480). Two tea pots on a campfire. Alt (existing, Remal El Rayan glamp article): "Two blackened tea pots warming beside a desert campfire on the sand at dusk". Ownership: **owner only** | ☐ |
| 2 | Fayoum, the gentler desert | Fayoum is barely two hours from Cairo and holds an astonishing amount in a small compass. Fayoum works as a long day from Cairo or, better, as a soft overnight in Tunis with a hotel bed, which makes it the desert for travellers who want the silence without the sleeping bag. | Paragraph 4: "Fayoum is barely two hours from Cairo and holds an astonishing amount in a small compass: Wadi El Rayan's waterfalls, the lake at Qarun…, the pottery village of Tunis, and — the reason we send almost everyone — Wadi El Hitan…" (trimmed: the list after the colon) · "Fayoum works as a long day from Cairo or, better, as a soft overnight in Tunis…" (word for word). Title = your approved subheading. | `/guide/al-fayoum` (the essay's own weave link) | `image-cfe2b087d7a14487156df17977e622578d4480dc-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/cfe2b087d7a14487156df17977e622578d4480dc-3000x2000.jpg?w=480). Sandstone bluffs above Lake Qarun. Alt (existing, Fayoum Oasis tour): "Sandstone bluffs overlook the still blue waters of Lake Qarun in Egypt's Fayoum depression." Ownership: **owner only** | ☐ |
| 3 | The Valley of the Whales | Wadi El Hitan, the Valley of the Whales, where forty-million-year-old skeletons lie in the open sand, whales with the last traces of the legs they were in the process of losing. Evolution, written where you can walk up and read it. | Paragraph 4, word for word from "Wadi El Hitan, the Valley of the Whales, where…" to "…in the process of losing.", then the next sentence. (The first part is the end of the list sentence, so it reads as a fragment, as the essay's own "Evolution, written…" does.) | `/guide/al-fayoum/wadi-al-hittan` (the essay's own weave link) | `image-04baa4450af912d360e6637d76637c278559f2c0-3000x2001-jpg` (3000×2001) [view](https://cdn.sanity.io/images/ufallvd2/production/04baa4450af912d360e6637d76637c278559f2c0-3000x2001.jpg?w=480). A fossil whale skeleton. Alt (existing, Fayoum desert adventure tour): "A fossilised whale skeleton on display in the Wadi al-Hitan museum in Fayoum." Ownership: **owner only** | ☐ |

**Notes:**
- **Card 1's image is from Fayoum, not the White Desert.** It comes from the Wadi El Rayan glamp article. Its alt says only "a desert campfire", so nothing on the page is false, but the card is about the White Desert. The library has no White Desert camp photo; an alternate is `image-a49d8db347e3…-3000x2000-jpg` (White Desert formations with tyre tracks), close in subject to this page's hero.
- **Card 3's skeleton is in the site museum**, while the text says "lie in the open sand". Alternate: `image-0d73182e8751…-3000x2001-jpg`, a Wadi Al Hittan rock formation and stone-lined path, with no whale in it.
- **Dawn in the chalk (paragraph 3) is not a card.** It is short and has no dawn image; the chalk formations appear as essay image 2 instead.

## 4. Essay images

Each image sits after the paragraph quoted, at the full width of the text column, with its caption. Captions describe the image and add no claims.

| # | After paragraph | Image | Caption | Approve? |
|---|---|---|---|---|
| 1 | 2: "That night usually happens in the White Desert…" (it names "the Black Desert's dark-capped hills") | `image-8ff5fe847168778859f87211f296dc12e5d9a0c4-3000x2000-jpg` (3000×2000) [view](https://cdn.sanity.io/images/ufallvd2/production/8ff5fe847168778859f87211f296dc12e5d9a0c4-3000x2000.jpg?w=480). The Black Desert's dark hills. Alt (existing, Bahariya and the Black Desert article): "Sweeping view of the Black Desert's dark volcanic hills over golden sand under a cloud-streaked sky". Ownership: **owner only** | The dark hills of the Black Desert. | ☐ |
| 2 | 3: "Dawn in the chalk is the other half of the argument…" | `image-ae477d9e60860b06c910e194d3ed6eb2b7df0077-3000x2010-jpg` (3000×2010) [view](https://cdn.sanity.io/images/ufallvd2/production/ae477d9e60860b06c910e194d3ed6eb2b7df0077-3000x2010.jpg?w=480). Chalk "mushroom" formations under a blue sky. Alt (existing, White Desert and Djara Cave tour): "Wind-carved white chalk rock formations, one shaped like a mushroom, on the desert floor under a blue sky". Ownership: **owner only** | Wind-carved chalk formations, one shaped like a mushroom. | ☐ |

**Notes:**
- **Image 2 is daylight, not dawn.** The caption doesn't claim dawn. It is close in subject to this page's hero (also chalk formations, a different photo).
- **Alternate:** image 2 → `image-d6a998befc76…-3000x2000-jpg`, a camel caravan passing a chalk formation.

## 5. Pull quote

| Quote (exact) | Position | Approve? |
|---|---|---|
| "And then the main event, which is nothing at all: no light on any horizon, the Milky Way at full strength, and a silence so complete most people realise they have never actually heard one before." (paragraph 2) | After paragraph 4 (Fayoum), before the "How much of the trip?" subheading | ☐ |

**Notes:** it is long for a pull quote (36 words). **Alternate:** "Dawn in the chalk is the other half of the argument." (paragraph 3), placed after paragraph 3.

## 6. Questions desert travellers ask

**Heading (new label):** "Questions desert travellers ask" ☐

**How it works:** an accordion, first question open; answers in the page HTML, no FAQPage schema; each ends with "Read more →" to its source page.

| # | Question | Answer (≤ 80 words) | Source (exact sentences, with URLs) | Approve? |
|---|---|---|---|---|
| 1 | Is a day visit enough, or should I camp? | A one-night camp is the minimum experience that does the landscape justice. The difference between arriving for a late afternoon visit and spending a night among the formations — watching the light change through dusk, seeing the chalk glow under moonlight, waking to the formations at sunrise — is not marginal. Guides provide food, water, camping equipment, and route knowledge. There are no facilities inside the park in the ordinary sense. (71 words) | https://travel2egypt.org/guide/farafra-oasis/white-desert-national-park ("Visiting"): the whole paragraph, word for word | ☐ |
| 2 | How cold are desert nights? | Day and night temperature swings can be sharp, often fifteen to twenty degrees Celsius between afternoon and midnight. In the White Desert, which lies 45 kilometres north of Qasr al-Farafra, winter nights can drop sharply toward freezing — cold enough that camping requires a proper sleeping bag rated for low temperatures, not a summer bag. Bring real warm layers, not just a light scarf. (64 words) | https://travel2egypt.org/guide/farafra-oasis/weather-in-farafra-oasis: three sentences, word for word, from three paragraphs | ☐ |
| 3 | When is the best time to go? | October through April is the sensible season. November to February are the best months for camping. Summer temperatures regularly exceed 45 degrees Celsius; camping is not advisable, and most safari operators suspend or severely reduce desert operations. (37 words) | https://travel2egypt.org/guide/farafra-oasis/white-desert-national-park ("Best Time"): word for word (trimmed: the full-moon sentence) | ☐ |
| 4 | Are there rules in the White Desert? | Rules that remain in effect: vehicles must stay on designated tracks; no fires except in designated camping areas; no removal of rocks, fossils, chalk, crystals, or any natural material; no littering. The formations look strong. They are not. (38 words) | https://travel2egypt.org/guide/farafra-oasis/white-desert-national-park ("Conservation Rules"): the whole paragraph, word for word | ☐ |

### Source caveats (worth knowing before you approve)

- **The White Desert pages sit under Farafra** in the guide (`/guide/farafra-oasis/…`), while this page's trips reach it from Bahariya. The answers don't mention Farafra except Q2's "45 kilometres north of Qasr al-Farafra".
- **Q1 and card 1 meet at the fennec fox:** the essay says one "will very likely visit"; the park page (not quoted) adds "Do not feed them."

### Dropped questions

None dropped. Fayoum questions were not added because card 2 covers Fayoum and its guide links from there.
