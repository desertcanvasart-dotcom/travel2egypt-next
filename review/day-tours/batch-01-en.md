# Day-tour format — Batch 1 review (EN)

Brief: "Travel2Egypt: new format for day-tour product pages" (owner, 2026-11-16).
Batch 1 = the homepage day tours. Giza Pyramids & GEM is imported from the owner-approved
reference (see `giza-gem-report-2026-11-16.md`); this file covers the other 9 single-day tours.
**2-day-pyramids-mediterranean-tour** is not drafted: it is a 2-day product filed as a day
tour, and the timeline model is one day. Owner to decide (package page, or a day-tour page
per day).

Each section lists every sentence and panel value with its source quote, then whether
clock times exist in the text. Drafts are in `drafts/*.draft.json`.

**Checks on every draft:**
- every clock time appears in the product's own text. Abu Simbel's "around 04:00" is the essay's "around 4 a.m.";
- `pickupTime` holds only a clock time. Sentences some drafts put there were removed; their questions are in the owner-input file;
- the closing line is a real essay block.

**Times missing (period headings only):**
- private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara
- alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo
- day-tour-to-karnak-luxor-temples-luxor-museum
- skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience
- nubian-temples-day-tour-from-aswan
- aswan-felucca-adventure

Pickup time only (other stops untimed): pyramids-of-giza-and-sphinx-group-day-tour (09:00),
grand-west-bank-group-day-tour-luxor (09:00), abu-simbel-by-car-from-aswan (around 04:00).

**How approval works.**
- Nothing is written to Sanity yet.
- After the owner's OK, `scripts/day-tour-format/stage-batch-2026-11-16.mjs --apply review/day-tours/drafts/*.draft.json` stores the intro and timeline with `needsReview: true`.
- All 9 products already have EN Included / options rows. The draft lists in each section below are for the owner to merge by hand (the script never overwrites them).

---

## private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara

_id: `tour.private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara` · https://travel2egypt.org/private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Panel · Pickup | (no time) from your hotel in Cairo or Giza, including Cairo airport hotels; New Cairo, New Administrative Capital, Sheikh Zayed, 6th of October: extra charge | Owner rule §6.5. No pickup time in the text: "the day starts early" (essay 000000000007) only |
| Panel · Back | (empty) | No return time in the text; owner input |
| Panel · Lunch | unknown (row hidden) | Lunch not mentioned anywhere; owner input |
| Panel · Children | Children under 12: 50% off | Owner rule §6.2 |
| Panel · Guide speaks | English (page language) | Owner rule §6.1 |
| Opening | Giza, Memphis and Saqqara in one private day. | title "Giza, Memphis & Saqqara: Egypt's Oldest Miles in One Day"; tourMode "private" |
| Opening | Within forty kilometres of central Cairo, you stand before the only surviving wonder of the ancient world, walk through the open-air ruins of Egypt's first capital, and descend into the necropolis where the idea of the pyramid was invented. | essay 000000000003: "Within a forty-kilometre radius of central Cairo, you can stand before the only surviving wonder of the ancient world, walk through the open-air ruins of Egypt's first capital, and descend into a necropolis where the idea of the pyramid was invented." |
| Opening | It's a long, full day, honest about its pace. | essay 000000000003: "a long, full day, honest about its pace" |
| Why this order | The day moves south with purpose. | essay 000000000005: "The itinerary moves south with purpose" |
| Why this order | Giza comes first, in the morning light when the plateau is at its clearest; then Memphis, a quiet archaeological park south of Mit Rahina; then Saqqara. | essay 000000000005: "Giza first, in the morning light when the plateau is at its clearest; then Memphis, now a quiet archaeological park south of the modern suburb of Mit Rahina; then Saqqara" |
| Why this order | The driving between sites is modest: about thirty kilometres from Giza to Memphis, another ten to Saqqara. | essay 000000000007: "The driving time between sites is modest — Giza to Memphis is roughly thirty kilometres; Memphis to Saqqara is another ten" |
| Why this order | As routed, the day runs history backwards, from Khufu's perfection to Djoser's first attempt. | concierge: "As routed, the day runs history backwards — you begin at Giza's finished perfection and end at Djoser's first attempt." |
| Why this order | Because the tour is private, we can flip the order so the plateau becomes your finale. | concierge: "the private format lets us flip the order so the plateau becomes your finale" |
| Morning · label | The Giza Plateau | essay 00000000000b–00000000001f; "Giza first, in the morning light" (000000000005) |
| Stop: Pickup from your hotel | The day starts early. | essay 000000000007: "the day starts early" |
| Stop: Pickup | A private vehicle connects all three sites, and a knowledgeable guide accompanies you throughout. | essay 000000000005: "A private vehicle connects all three, and a knowledgeable guide accompanies you throughout." |
| Stop: Three pyramids | Three pyramids built across roughly seventy years, from around 2560 to 2490 BC. | essay 000000000011: "three pyramids built across roughly seventy years — from around 2560 to 2490 BC" |
| Stop: Three pyramids | The Great Pyramid of Khufu was the tallest man-made structure on earth for nearly four thousand years. | essay 000000000011: "the Great Pyramid of Khufu, was the tallest man-made structure on earth for nearly four thousand years" |
| Stop: Three pyramids | Khafre's keeps a band of its original polished casing at the apex, the only one on the plateau to do so; Menkaure's, from around 2510 BC, is the smallest. | essay 000000000017: "retains a band of its original polished limestone casing at the apex — the only pyramid on the plateau to do so. The Pyramid of Menkaure, the smallest of the three, dates to around 2510 BC" |
| Stop: Three pyramids · Sites | Great Pyramid of Khufu · Pyramid of Khafre · Pyramid of Menkaure | essay 000000000011, 000000000017 |
| Stop: Three pyramids · inside | NOT marked included | essay 000000000017 says Menkaure "is the one you enter", but the inclusions list doesn't include it; §6.7 needs per-product owner confirmation → owner input |
| Stop: Great Sphinx | 73 metres long and 20 metres high, carved from a single limestone outcrop during Khafre's reign. | essay 00000000001b: "73 metres long, 20 metres high, carved from a single limestone outcrop during Khafre's reign" |
| Stop: Great Sphinx | It is the largest monolithic statue in the world, and standing before it at ground level resets your sense of its size. | essay 00000000001b: "it is the largest monolithic statue in the world, and standing before it at ground level … resets your sense of its size" |
| Stop: Camel ride | Before leaving the plateau, a camel ride gives a panoramic view of all three pyramids in alignment, the angle from which their proportions become legible. | essay 00000000001f: "Before leaving the plateau, there is a camel ride across the desert flank of Giza, which gives a panoramic view of all three pyramids in alignment — the angle from which their proportional relationship becomes legible" |
| Stop: Camel ride | The photographs from here are the ones that convey the site's geography. | essay 00000000001f: "the photographs from that position are the ones that actually convey the site's geography" |
| Stop: Camel ride · includedNote | Camel ride (included). It's easy to skip on the day. | inclusion nh2jsc6x3i "Camel ride"; essay 000000000049: "The camel ride is included but easy to skip on the day." (§6.6 welfare line NOT used: it's for camel extras, and here the ride is included → owner input) |
| Afternoon · label | Memphis and Saqqara | essay 000000000027, 00000000002f. Period choice is by route order only (Giza is "morning"); no time given for Memphis/Saqqara |
| Stop: Memphis | Egypt's first capital, founded around 3100 BC by Narmer and a major city for three thousand years. | essay 000000000027: "founded around 3100 BC by Narmer … as the administrative capital of a newly unified Egypt. It remained a major city for three thousand years"; 000000000003 "Egypt's first capital" |
| Stop: Memphis | What survives is an open-air museum in a palm-shaded garden: a colossal limestone statue of Ramses II, displayed lying down because its legs are missing, and the Alabaster Sphinx of Memphis, carved in a single piece of calcite alabaster. | essay 000000000027: "an open-air museum in a palm-shaded garden … a colossal limestone statue of Ramses II … displayed horizontally in an enclosure because its legs are missing … the Alabaster Sphinx of Memphis … carved in a single piece of calcite alabaster" |
| Stop: Memphis · Sites | Memphis · Colossus of Ramses II · Alabaster Sphinx of Memphis | essay 000000000027 |
| Stop: Step Pyramid | Built around 2650 BC by the architect Imhotep for the pharaoh Djoser, it is the world's oldest large-scale cut-stone structure and the first pyramid: six mastabas of decreasing size stacked to rise 62 metres above the desert, inside a 10-metre-high perimeter wall. | essay 00000000002f: "built around 2650 BC by the architect Imhotep for the Third Dynasty pharaoh Djoser. It is the world's oldest large-scale cut-stone structure and the first pyramid … stacked six mastabas of decreasing size … rising 62 metres above the desert … enclosed within a 10-metre-high perimeter wall" |
| Stop: Step Pyramid · Sites | Saqqara · Step Pyramid of Djoser | essay 00000000002f |
| Stop: Mastabas | Less visited than the pyramids and, for many travellers, more affecting. | essay 000000000033: "less visited and, for many travellers, more affecting than the pyramids themselves" |
| Stop: Mastabas | Their walls carry painted reliefs of daily life in the Old Kingdom (farming, fishing, bread-making, cattle herding), in pigments that survived because the tombs were sealed and buried for thousands of years. | essay 000000000033: "their interior walls carry painted reliefs depicting daily life in the Old Kingdom — agricultural scenes, fishing, bread-making, cattle herding — in pigments that have survived because the tombs were sealed and buried for thousands of years" |
| Stop: Mastabas · Sites | Saqqara mastaba tombs | essay 000000000033 |
| (no return stop) | — | No return time or note in the text |
| Included | Private tour for your party | tourMode "private"; concierge "the private format" |
| Included | A knowledgeable guide throughout, in your language (English, Spanish or Japanese) | inclusion lwoegi36du "Knowledgeable guide throughout" + §6.1 |
| Included | A private vehicle connecting all three sites, with pickup and return to your hotel in Cairo or Giza, including Cairo airport hotels | inclusion mklxohe060 "Private vehicle connecting all three sites" + §6.5 |
| Included | Camel ride at Giza (easy to skip on the day) | inclusion nh2jsc6x3i "Camel ride"; essay 000000000049 |
| Included | A bottle of water per person | §6.4 |
| Included | Tipping for your driver | §6.3 |
| Not included | Inside the Great Pyramid of Khufu: extra | §6.7 "Khufu is always an extra" |
| Not included | Tipping for your guide: not obligatory, but recommended | §6.3 |
| Not included | Pickup from New Cairo, the New Administrative Capital, Sheikh Zayed or 6th of October: extra charge | §6.5 |
| Fit for | have limited time in Cairo and want more than a photograph in front of the Giza pyramids | essay 000000000005: "It suits travellers who have limited time in Cairo and want more than a photograph in front of the Giza pyramids." |
| Fit for | want all three Old Kingdom anchors in one day, from Khufu's perfection back to Djoser's invention | audience: "Travellers who want all three Old Kingdom anchors in chronological reverse — from Khufu's perfection back to Djoser's invention" |
| Fit for | want to understand why Egypt's Old Kingdom, roughly 2700 to 2200 BC, built monuments that still set the terms four and a half millennia later | essay 000000000009: "It is for those who want to understand why Egypt's Old Kingdom — roughly 2700 to 2200 BC — produced a civilisation so architecturally confident that its monuments still set the terms of the conversation four and a half millennia later." |
| Worth knowing | It's a long, full day, about 9 to 10 hours. This is not a tour for anyone wanting a gentle half-morning. | durationLabel "Full day · ~9–10 hrs"; essay 000000000009: "This is not a tour for anyone wanting a gentle half-morning." |
| Worth knowing | The day starts early and the sites are physically demanding. Wear comfortable shoes; the desert sun at Giza is strong. | essay 000000000007: "the day starts early and the sites are physically demanding. Wear comfortable shoes. … The desert sun at Giza is not metaphorical." |
| Worth knowing | Children under 12 pay half price. | §6.2 |
| Make it yours | Flip the order so the day ends at the Giza Plateau | opt "Flip the order to end at the Giza Plateau"; concierge |
| Make it yours | Skip the camel ride on the day | opt "Skip the camel ride on the day" |
| Closing line | One day is not enough. It is, however, a start. | essay 00000000003b (verbatim). Note: the essay's last non-empty block is 000000000049 (camel note), not the closing line |
| More about this day | full essay, unchanged | body blocks 000000000001 – 00000000004c |

Times: none in the text — period headings only

---

## pyramids-of-giza-and-sphinx-group-day-tour

_id: `tour.pyramids-of-giza-and-sphinx-group-day-tour` · https://travel2egypt.org/pyramids-of-giza-and-sphinx-group-day-tour

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Panel · Pickup | 09:00 from your hotel in Cairo or Giza, including Cairo airport hotels; New Cairo, New Administrative Capital, Sheikh Zayed, 6th of October: extra charge | essay 00000000000f: "09:00 pickup from your hotel in Cairo"; inclusion 34flwtt0qh; zones §6.5 |
| Panel · Back | by early to mid-afternoon, at your hotel | essay 000000000015: "Drop-off at your hotel by early to mid-afternoon."; inclusion 6hn3weu1mm "Drop-off at your hotel" |
| Panel · Lunch | unknown (row hidden) | Lunch not mentioned; owner input |
| Panel · Children | Children under 12: 50% off | §6.2 |
| Panel · Guide speaks | English (page language) | §6.1 (see owner input: group departure) |
| Opening | The only surviving wonder of the ancient world, in the morning while the air is still cool. | essay 000000000003: "The only surviving wonder of the ancient world, in the morning while the air is still cool" |
| Opening | This is the shared-departure version: a small group, a licensed Egyptologist guide, an air-conditioned vehicle, and the three pyramids and the Great Sphinx before the plateau heats up and the coaches arrive. | essay 000000000009: "This is the shared-departure version of the morning. Group capped at small size, licensed Egyptologist guide, air-conditioned vehicle, an early start before the plateau heats and before the coaches arrive."; summary "the three pyramids of Khufu, Khafre, and Menkaure, the Great Sphinx" |
| Opening | By early to mid-afternoon you're back at your hotel. | essay 000000000015 "by early to mid-afternoon" (000000000009 says "By mid-afternoon") |
| Why this order | The early start is the point: you reach the plateau before it heats and before the coaches arrive. | essay 000000000009: "an early start before the plateau heats and before the coaches arrive" |
| Why this order | Your guide moves the group through the three pyramids in sequence, then the panorama viewpoint, then the Sphinx and its valley temple. | essay 000000000011: "The guide moves the group through the three pyramids in sequence, then the panorama viewpoint, then the Sphinx and its valley temple." |
| Why this order | Two to three hours on the plateau is enough to absorb the scale without losing the group to the heat. | essay 000000000011: "Two to three hours on the plateau; enough to absorb the scale without losing the group to the heat." |
| Morning · label | The Giza Plateau | essay 000000000003 "in the morning"; 000000000011 |
| Stop: 09:00 Pickup | Pickup from your hotel, then the drive to the Giza Plateau through the morning traffic, roughly thirty to forty-five minutes depending on the day. | essay 00000000000f: "09:00 pickup from your hotel in Cairo. Drive to the Giza Plateau through the morning traffic — roughly thirty to forty-five minutes depending on the day." |
| Stop: Three pyramids | The Great Pyramid of Khufu, completed around 2560 BC, stood at 146 metres for the next four thousand years, built from about 2.3 million blocks aligned to true north. | essay 000000000005: "completed around 2560 BC, stood at 146 metres for the next four thousand years, and is built from approximately 2.3 million limestone and granite blocks aligned to true north within a fraction of a degree" |
| Stop: Three pyramids | Khafre's, slightly smaller and on higher ground, still carries a band of original white Tura limestone casing at the apex. | essay 000000000005: "Khafre's pyramid, slightly smaller and on higher ground, still carries a band of original white Tura limestone casing at the apex" |
| Stop: Three pyramids | Menkaure's, the smallest, finishes the line. | essay 000000000005: "Menkaure's, the smallest, finishes the line." |
| Stop: Three pyramids · Sites | Great Pyramid of Khufu · Pyramid of Khafre · Pyramid of Menkaure | essay 000000000005 |
| Stop: Panorama | From the pyramids, your guide takes the group on to the panorama viewpoint. | essay 000000000011: "through the three pyramids in sequence, then the panorama viewpoint" (the text says nothing more about it) |
| Stop: Sphinx | The Sphinx sits at the plateau's eastern edge, carved from a single limestone outcrop, generally dated to Khafre's reign around 2500 BC. | essay 000000000007: "The Sphinx sits at the plateau's eastern edge, carved from a single limestone outcrop, generally agreed to be from Khafre's reign around 2500 BC." |
| Stop: Sphinx | It is the largest monolithic statue in the world. | essay 000000000007 (verbatim) |
| Stop: Sphinx | The missing nose has nothing to do with Napoleon's artillery, despite the legend. | essay 000000000007: "the missing nose has nothing to do with Napoleon's artillery, despite the persistence of the legend" |
| Stop: Sphinx · Sites | Great Sphinx · Valley Temple of Khafre | essay 000000000011 "the Sphinx and its valley temple" |
| Stop: Optional extras | Available on site at additional cost, and not part of the package. | essay 000000000013: "available on site at additional cost and are not part of the package" |
| Optional | Entry inside a pyramid: additional cost, on site (extraTicket) | essay 000000000013 "Optional inside-pyramid entry"; exclusion d10mus6ga8; opt "Add entry inside a pyramid (extra cost, on site)" |
| Optional | A camel or horse ride: additional cost, on site (extraCost) + welfare note | essay 000000000013; exclusion 6u8gkw5zzi; opt "Add a camel or horse ride (extra cost, on site)"; note = §6.6 approved line (Giza camel extra) |
| Afternoon · label | Back to Cairo | essay 000000000015 "Return drive to central Cairo" |
| Stop: Back | The return drive to central Cairo, with drop-off at your hotel by early to mid-afternoon. | essay 000000000015: "Return drive to central Cairo. Drop-off at your hotel by early to mid-afternoon." |
| Included | Shared group departure, with the group capped at a small size | essay 000000000009: "shared-departure … Group capped at small size"; tourMode "group" |
| Included | A licensed Egyptologist guide, in your language (English, Spanish or Japanese) | inclusion 3jni3wom0k "licensed Egyptologist guide" + §6.1 |
| Included | An air-conditioned vehicle | inclusion v5y6qg2f13 "air-conditioned vehicle" |
| Included | 09:00 pickup from your hotel in Cairo or Giza, including Cairo airport hotels, and drop-off at your hotel | inclusions 34flwtt0qh "09:00 pickup from your hotel in Cairo", 6hn3weu1mm "Drop-off at your hotel" + §6.5 |
| Included | A bottle of water per person | §6.4 |
| Included | Tipping for your driver | §6.3 |
| Not included | Entry inside a pyramid: additional cost, on site (the Great Pyramid of Khufu is always an extra) | exclusion d10mus6ga8 "Optional inside-pyramid entry (additional cost, not part of the package)" + §6.7 |
| Not included | Camel or horse ride: additional cost, on site | exclusion 6u8gkw5zzi "Camel or horse rides (additional cost, not part of the package)" |
| Not included | Tipping for your guide: not obligatory, but recommended | §6.3 |
| Not included | Pickup from New Cairo, the New Administrative Capital, Sheikh Zayed or 6th of October: extra charge | §6.5 |
| Fit for | are visiting for the first time, with a single Cairo morning | audience: "First-time visitors with a single Cairo morning" |
| Fit for | want the Old Kingdom canon read by a qualified guide | audience: "who want the Old Kingdom canon read by a qualified guide" |
| Fit for | prefer a shared departure with a small group | essay 000000000009: "shared-departure version … Group capped at small size" |
| Worth knowing | It's a half day, about 5 to 6 hours. | durationLabel "Half day · ~5–6 hrs" |
| Worth knowing | The drive to the plateau takes roughly thirty to forty-five minutes, depending on the morning traffic. | essay 00000000000f |
| Worth knowing | You spend two to three hours on the plateau, in a group. | essay 000000000011 "Two to three hours on the plateau"; tourMode group |
| Worth knowing | Children under 12 pay half price. | §6.2 |
| Make it yours | Add entry inside a pyramid (extra cost, on site) | opt (verbatim) |
| Make it yours | Add a camel or horse ride (extra cost, on site) | opt (verbatim) |
| Make it yours | Pair it with the Grand Egyptian Museum (fully open since 1 November 2025) for a full Old Kingdom day | opt "Pair with the Grand Egyptian Museum"; concierge: "A natural pairing with the new Grand Egyptian Museum (fully opened 1 November 2025) for a full Old Kingdom day" |
| Make it yours | Extend to Memphis, Saqqara and Dahshur on a second day in town | opt "Extend to Memphis–Saqqara–Dahshur on a second day"; concierge "if you have a second day in town" |
| Closing line | The reason the day still matters is the same reason it has always mattered: standing in front of the thing. | essay 00000000001b (verbatim) |
| More about this day | full essay, unchanged | body blocks 000000000001 – 00000000001b |

Times: sourced (09:00 pickup only; every other stop has no clock time)

---

## alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo

_id: `tour.alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo` · https://travel2egypt.org/alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Panel · Type | Group (shared departure) | `tourMode: "group"`; summary "A shared-departure day from Cairo to Alexandria" — **but see contradiction in owner-input (vehicle/"private")** |
| Panel · Duration | Extended, about 13 hours | `durationLabel` "Extended · ~13 hrs"; `durationHours` 13 |
| Panel · Children | Children under 12: 50% off | owner rule §6.2 |
| Panel · Pickup | From your hotel in Cairo or Giza, including Cairo airport hotels. New Cairo, the New Administrative Capital, Sheikh Zayed and 6th of October: extra charge (no time) | owner rule §6.5; no pickup time in text (block 00000000000d says only "Early departure from Cairo") |
| Panel · Back | Drop-off at your hotel in Cairo in the evening (no time) | block 00000000001b "Return drive to Cairo. Drop-off at your hotel in the evening."; incl "Drop-off at your hotel in the evening"; summary "Back in Cairo by evening" |
| Panel · Lunch | (empty: unknown) | not stated; concierge lists "a fish lunch by the harbour" among things the day doesn't include time for → owner-input |
| Panel · Guide speaks | English | owner rule §6.1 |
| Opening | A long day north on the desert highway to the city Alexander founded in 331 BC. | block 000000000003 "A long day north on the desert highway to the city Alexander founded in 331 BC" |
| Opening | Almost none of ancient Alexandria is visible above ground, so the day reads what survives: the Catacombs of Kom el-Shoqafa, Pompey's Pillar, the Greco-Roman Museum and the Roman amphitheatre at Kom el-Dikka. | block 000000000005 "almost none of it visible above ground"; summary "the Catacombs of Kom el-Shoqafa, the column wrongly named for Pompey, the Greco-Roman Museum, and the Roman amphitheatre at Kom el-Dikka"; block 000000000021 "enough to read what is left" |
| Opening | Back in Cairo by evening. | summary "Back in Cairo by evening." |
| Why this order | The modern city was built directly over the ancient one, and what survives is what was underground, too heavy to move, excavated below street level, or collected since. | block 000000000005 "The modern city was built directly over the ancient one … what survives is what was underground (the catacombs), too heavy to move (Pompey's Pillar), excavated below modern street level (the amphitheatre), or collected since" |
| Why this order | Four sites tell one story about a city's afterlife. | block 000000000007 "Four sites, a single coherent narrative about a city's afterlife" |
| Why this order | The drive is roughly 220 kilometres each way, around two and a half to three hours in normal traffic, so the day starts early and reaches Alexandria mid-morning. | block 00000000000d "runs roughly 220 kilometres; the drive takes around two and a half to three hours in normal traffic … Early departure … allows arrival in Alexandria mid-morning"; "each way" from block 000000000007 "a long drive there and back" |
| Return note | Drop-off at your hotel in Cairo in the evening. | block 00000000001b |
| Fit for | are reading Egypt's Greco-Roman and late-antique chapter, the city that survives mostly underground | audience "Travellers reading Egypt's Greco-Roman and late-antique chapter — the city that survives mostly underground" |
| Worth knowing | It's about 13 hours, and as a day-return from Cairo it's genuinely long. | `durationHours` 13; block 000000000030 "Alexandria as a day-return is genuinely long" |
| Worth knowing | The drive is around two and a half to three hours each way in normal traffic. | block 00000000000d (as above) + 000000000007 "a long drive there and back" |
| Worth knowing | The Greco-Roman Museum has had phased restoration; your guide will tell you which galleries are open on the day. | block 000000000016 "The museum has had phased restoration in recent years; the guide will indicate which galleries are open the day of your visit." |
| Worth knowing | The lowest level of the catacombs is periodically flooded. | block 000000000010 "(the lowest is periodically flooded)" |
| Worth knowing | Children under 12 pay half price. | owner rule §6.2 |
| Morning · label | The drive north and Kom el-Shoqafa | block 000000000003 "A long day north"; block 000000000010. **Period split inferred** (arrival "mid-morning", catacombs listed first) — owner to confirm |
| Stop · Early departure | An early start on the Cairo-Alexandria Desert Highway, roughly 220 kilometres, around two and a half to three hours in normal traffic, in an air-conditioned vehicle. | block 00000000000d "Early departure from Cairo. The Cairo-Alexandria Desert Highway runs roughly 220 kilometres; the drive takes around two and a half to three hours in normal traffic. The vehicle is private and air-conditioned" ("private" dropped — see contradiction) |
| Stop · Early departure | The schedule allows arrival in Alexandria mid-morning. | block 00000000000d "the schedule allows arrival in Alexandria mid-morning" |
| Stop · Catacombs | The largest known Greco-Roman burial complex in Egypt, found in 1900 when a donkey fell through a collapsed passage, cut into bedrock on three descending levels. | block 000000000010 "The largest known Greco-Roman burial complex in Egypt, discovered in 1900 when a donkey fell through a collapsed passage. Cut into bedrock on three descending levels" |
| Stop · Catacombs | Egyptian funerary deities, Anubis, Sobek and Thoth, are rendered in Hellenistic and Roman style, including the famous panel of Anubis in Roman armour. | block 000000000010 "Egyptian funerary deities — Anubis, Sobek, Thoth — rendered in Hellenistic and Roman style, including the famous panel of Anubis dressed in Roman armour" |
| Sites | Catacombs of Kom el-Shoqafa | block 000000000010 |
| Afternoon · label | Greco-Roman Alexandria | title/essay; **period assignment inferred** from site order — owner to confirm |
| Stop · Pompey's Pillar | A 26.85-metre monolithic column of red Aswan granite, erected in 297 AD in honour of the Emperor Diocletian; the name is a medieval mistake. | block 000000000013 "A 26.85-metre monolithic column of red Aswan granite … The name is a medieval mistake — it was erected in 297 AD in honour of the Emperor Diocletian, not Pompey" |
| Stop · Pompey's Pillar | It marks the centre of the destroyed Serapeum, the temple of Serapis. | block 000000000013 "It marks the centre of the destroyed Serapeum, the great temple of Serapis" |
| Stop · Pompey's Pillar | The temple was destroyed in 391 AD; the column survived. | block 000000000013 (verbatim) |
| Sites | Pompey's Pillar · Serapeum | block 000000000013 |
| Stop · Museum | Objects from roughly 300 BC through the seventh century AD: portrait sculpture, terracotta figurines, papyrus fragments, coins, sarcophagi. | block 000000000016 "The collection of objects from roughly 300 BC through the seventh century AD — portrait sculpture, terracotta figurines, papyrus fragments, coins, sarcophagi" |
| Stop · Museum | The museum has had phased restoration; your guide will tell you which galleries are open on the day. | block 000000000016 (as above) |
| Sites | Greco-Roman Museum | block 000000000016 |
| Stop · Kom el-Dikka | The only excavated Roman-period theatre in Egypt, built in the fourth century AD, with thirteen tiers of white marble seating around a small orchestra. | block 000000000019 "The only excavated Roman-period theatre in Egypt. Built in the fourth century AD, thirteen tiers of white marble seating still in place around a small orchestra" |
| Stop · Kom el-Dikka | Around it, Roman housing, bath complexes and lecture halls: the actual texture of late antique Alexandria. | block 000000000019 "The surrounding excavation includes Roman housing, bath complexes, and lecture halls — the actual texture of late antique Alexandria" |
| Sites | Roman Amphitheatre at Kom el-Dikka | block 000000000019 |
| Evening · label | Back to Cairo | block 00000000001b |
| Stop · Return | The return drive to Cairo, with drop-off at your hotel in the evening. | block 00000000001b "Return drive to Cairo. Drop-off at your hotel in the evening." |
| Included | A guide in your language (English) | incl "Guide"; owner rule §6.1 (no "Egyptologist" claim — text says only "Guide") |
| Included | Transport in an air-conditioned vehicle | incl "Private air-conditioned vehicle"; block 00000000000d — "private" withheld pending owner answer (group tour) |
| Included | Pickup from your hotel in Cairo or Giza, including Cairo airport hotels | owner rule §6.5 (product text says only "Early departure from Cairo") |
| Included | Drop-off at your hotel in the evening | incl "Drop-off at your hotel in the evening" |
| Included | A bottle of water per person | owner rule §6.4 |
| Included | Tipping for your driver | owner rule §6.3 |
| Not included | Tipping for your guide: not obligatory, but recommended | owner rule §6.3 |
| Not included | Pickup from New Cairo, the New Administrative Capital, Sheikh Zayed or 6th of October: extra charge | owner rule §6.5 |
| Option | Make it an overnight with a seafront stay | opts "Make it an overnight with a seafront stay"; block 000000000030 "we can also build it as an overnight with a seafront stay if the schedule allows" |
| Option | Book a private return trip built around your wishes, such as the fortress, the new Library or a fish lunch by the harbour | opts "Book a private return trip built around your wishes"; concierge "the city keeps more — the fortress, the new Library, a fish lunch by the harbour … we can build a private return" |
| Closing line | One long day from Cairo is enough to read what is left. | block 000000000021 (verbatim). Note: not the essay's last block — 000000000030 (overnight note) follows; that note is used in Worth knowing + Make it yours |
| More about this day | full essay, unchanged | `body` blocks 000000000001 → 000000000030 |

**Guide-link candidates (unverified):** Catacombs of Kom el-Shoqafa · Pompey's Pillar · Serapeum · Greco-Roman Museum · Roman Amphitheatre at Kom el-Dikka — matches not checked in this pass.

Times: none in the text — period headings only

---

## day-tour-to-karnak-luxor-temples-luxor-museum

_id: tour.day-tour-to-karnak-luxor-temples-luxor-museum · https://travel2egypt.org/day-tour-to-karnak-luxor-temples-luxor-museum

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Panel · Type | Private | tourMode "private"; essay 000000000015 "This is a private tour, operated for your party alone" |
| Panel · Duration | Full day, about 8 hours | durationLabel "Full day · ~8 hrs" |
| Panel · Children | (not shown) | Not applied: essay 000000000015 "The minimum age is 18." conflicts with owner rule §6.2 (see owner-input) |
| Panel · Pickup | (empty) | No pickup time or place in the text |
| Panel · Back | You finish in time to spend the evening on your own terms. | essay 000000000005 "before finishing in time to spend the evening on your own terms" |
| Panel · Lunch | Included in the Base + Entrance Fees & Lunch tier only (status: unknown, tier-dependent) | inclusion 8if5f5ojqk "Midday meal (Base + Entrance Fees & Lunch tier only)" |
| Panel · Guide speaks | English | inclusion 1hv8gvfs6m "Licensed, English-speaking Egyptologist guide"; owner rule §6.1 |
| Opening | Karnak, Luxor Temple and the Luxor Museum: the three strongest reasons to spend a day on Luxor's east bank. | essay 000000000003 "This eight-hour tour covers the three strongest reasons to spend a day on the east bank: the Karnak complex, Luxor Temple, and the Luxor Museum." |
| Opening | Together they form the most coherent single-day argument for why the ancient Egyptians built the way they did. | essay 000000000003 "Together they form the most coherent single-day argument for why the ancient Egyptians built the way they did" |
| Opening | It's a private tour, operated for your party alone. | essay 000000000015 "This is a private tour, operated for your party alone" |
| Why this order | Luxor in summer is brutally hot by mid-morning, so the tour begins early, … | essay 000000000007 "Luxor in summer is brutally hot by mid-morning. The tour begins early for good reason." |
| Why this order | … and the day opens at Karnak, because no other site in Egypt prepares you for quite what this complex turns out to be. | essay 000000000021 "The day opens at Karnak — and rightly so, because no other site in Egypt prepares you for quite what this complex turns out to be." |
| Why this order | The afternoon concludes at the Luxor Museum. | essay 000000000029 "The afternoon concludes at the Luxor Museum" |
| Why this order | Because the day is yours, the order and the dwell times bend to your party: more temple, less museum, or the reverse. | concierge "Because the day is yours, the order and the dwell times bend to your party — more temple, less museum, or the reverse." |
| Timeline · period | Morning · Karnak and Luxor Temple | essay 000000000005 "on your feet for most of the morning and into early afternoon, across two outdoor complexes and one museum"; order from 000000000021/25/27. Luxor Temple's placement in the morning is inferred (see owner-input) |
| Stop · Karnak | Closer to a religious city than a temple, built up across roughly 1,500 years. | essay 000000000021 "What they find is closer to a religious city, accumulated across roughly 1,500 years" |
| Stop · Karnak | You enter the Precinct of Amun-Ra through pylons that increase in age as you move inward, into the Great Hypostyle Hall: 134 sandstone columns in 16 rows, the central ones nearly 21 metres tall. | essay 000000000021 "the Precinct of Amun-Ra, entered through a sequence of pylons that increase in age as you move inward … Great Hypostyle Hall … 134 sandstone columns arranged in 16 rows, the central columns rising to nearly 21 metres" |
| Stop · Karnak | Beyond are the obelisks of Thutmose I and Hatshepsut, the sacred lake and the Festival Temple of Thutmose III. | essay 000000000023 "obelisks raised by Thutmose I and Hatshepsut, a sacred lake, the Festival Temple of Thutmose III" |
| Stop · Avenue | From Karnak, the tour moves south along the Avenue of Sphinxes, the 2.7-kilometre processional road connecting the two great temples of ancient Thebes. | essay 000000000025 "From Karnak, the tour moves south along what was once the Avenue of Sphinxes — the 2.7-kilometre processional road connecting the two great temples of ancient Thebes" |
| Stop · Avenue | Ram-headed sphinxes line the Karnak end, human-headed sphinxes the Luxor Temple end. | essay 000000000025 "lined with ram-headed sphinxes at the Karnak end and human-headed sphinxes near Luxor Temple" |
| Stop · Luxor Temple | Raised by Amenhotep III and added to by Ramses II, whose pylon carries scenes from the Battle of Kadesh. | essay 000000000027 "The core of the structure was raised by Amenhotep III … Ramses II added substantially to the entrance — including a pylon decorated with scenes from the Battle of Kadesh" |
| Stop · Luxor Temple | One of its two obelisks still stands; the other has been in the Place de la Concorde in Paris since 1836. | essay 000000000027 "One obelisk still stands; the other has been in the Place de la Concorde in Paris since 1836." |
| Stop · Luxor Temple | The mosque of Abu Haggag sits in the northeast corner: the temple never fully disappeared from use. | essay 000000000027 "The mosque of Abu Haggag sits embedded in the northeast corner … Luxor Temple was not rediscovered so much as it never fully disappeared from use" |
| Timeline · period | Afternoon · The Luxor Museum | essay 000000000029 "The afternoon concludes at the Luxor Museum" |
| Stop · Museum | A small, exceptionally well-curated museum on the Corniche, concentrating on New Kingdom material from Thebes. | essay 000000000029 "a small, exceptionally well-curated institution on the Corniche … concentrates on New Kingdom material from Thebes" |
| Stop · Museum | Highlights include the reconstructed Akhenaten wall …, the statuary cache found beneath the Luxor Temple courtyard in 1989, and military equipment and chariots from the reigns of Ahmose I and Thutmose III. | essay 000000000029 "the reconstructed Akhenaten wall from a dismantled Aten temple at Karnak … the cache of statuary discovered beneath the Luxor Temple courtyard in 1989 … military equipment and chariots from the reigns of Ahmose I and Thutmose III" |
| Stop · End | You finish in time to spend the evening on your own terms. | essay 000000000005 "finishing in time to spend the evening on your own terms" |
| Included | Private tour for your party, from one traveller, with no minimum group size | essay 000000000015 "operated for your party alone … it runs for as few as one traveller, with no minimum group size" |
| Included | A licensed, English-speaking Egyptologist guide | inclusion 1hv8gvfs6m "Licensed, English-speaking Egyptologist guide (every tier)" |
| Included | A private, air-conditioned vehicle | inclusion ev8iy67nw "Private, air-conditioned vehicle (every tier)" |
| Included | One bottle of mineral water per person | inclusion b5hcai870n "One bottle of mineral water per person (every tier)"; owner rule §6.4 |
| Included | All logistics | inclusion sulto0ij1p "All logistics (Base package)" |
| Included | Entry to all three sites (Base + Entrance Fees and Base + Entrance Fees & Lunch tiers) | inclusion e4gn7ostru "Entry to all three sites (Base + Entrance Fees and Base + Entrance Fees & Lunch tiers only)" |
| Included | A midday meal (Base + Entrance Fees & Lunch tier) | inclusion 8if5f5ojqk "Midday meal (Base + Entrance Fees & Lunch tier only)" |
| Included | Tipping for your driver | owner rule §6.3 |
| Not included | Entrance fees to the three sites: not in the Base package | essay 00000000001d "a Base package (private vehicle, guide, water, and all logistics); Base + Entrance Fees (the same, plus entry to all three sites)" |
| Not included | Lunch: not in the Base or Base + Entrance Fees tiers | inclusion 8if5f5ojqk "(Base + Entrance Fees & Lunch tier only)" |
| Not included | Tipping for your guide: not obligatory, but recommended | owner rule §6.3 |
| Fit for | want the East Bank done properly: Karnak's accumulated 1,500 years, Luxor Temple's continuous sacred use, and a museum that edits the story rather than overwhelming it | audience (verbatim, minus "Adults who") |
| Fit for | have a genuine interest in ancient history and want a guide who can explain why a hypostyle hall was built to that proportion | essay 000000000005 "people who want a guide who can explain why a hypostyle hall was built to that proportion"; "adults with a genuine interest in ancient history" |
| Worth knowing | The minimum age is 18. | essay 000000000015 "The minimum age is 18." |
| Worth knowing | It's about eight hours. You're on your feet for most of the morning and into early afternoon, across two outdoor complexes and one museum. The pace is full but not punishing. | essay 000000000003 "This eight-hour tour"; 000000000005 "The pace is full but not punishing. You will be on your feet for most of the morning and into early afternoon, across two outdoor complexes and one museum" |
| Worth knowing | Luxor in summer is brutally hot by mid-morning. The tour begins early for good reason. | essay 000000000007 (verbatim) |
| Worth knowing | Entrance fees and lunch depend on the tier you choose. Egyptian entrance fees are revised often, so they're kept separate. Tier prices are shown at booking. | essay 00000000001d "Egyptian entrance fees are revised often, so keeping them separate keeps the base fare honest. Tier prices are shown at booking." |
| Make it yours | Add entrance fees to all three sites | opts |
| Make it yours | Add a midday lunch with the entrance fees | opts |
| Make it yours | Sequence the day to dodge Karnak's midday heat | opts; essay 00000000003b "The concierge can sequence the day to dodge the midday heat at Karnak's open courts." |
| Make it yours | Change the order: more temple or more museum | opts; concierge |
| Make it yours | Tell our concierge where the West Bank sits in your plans, and we'll place this day accordingly | concierge "Tell our concierge where the West Bank sits in your plans and we'll place this day accordingly." |
| Closing line | Karnak, Luxor Temple, and the museum between them contain a larger proportion of surviving ancient Egyptian history than any other single day's itinerary can offer. | essay 00000000002b (verbatim); see owner-input on choice vs 00000000002d |
| More about this day | Full essay, unchanged | body blocks 000000000001–00000000003e |

Times: none in the text — period headings only

---

## grand-west-bank-group-day-tour-luxor

_id: tour.grand-west-bank-group-day-tour-luxor · https://travel2egypt.org/grand-west-bank-group-day-tour-luxor

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Panel · Type | Group (shared departure) | tourMode "group"; summary "A shared-departure day across Luxor's West Bank" |
| Panel · Duration | Full day, about 8 hours | durationLabel "Full day · ~8 hrs" |
| Panel · Children | Children under 12: 50% off | owner rule §6.2 |
| Panel · Pickup | 09:00 from your hotel in Luxor | essay 00000000000d "09:00 pickup from your hotel in Luxor."; inclusion 3us8z9jfwq |
| Panel · Back | Drop-off at your hotel in the late afternoon | essay 00000000001e "Drop-off at your hotel in the late afternoon." |
| Panel · Lunch | (empty, status unknown) | Not in the text |
| Panel · Guide speaks | (not shown) | The text never mentions a guide; owner rule §6.1 held until confirmed (see owner-input) |
| Opening | The full western circuit: the royal necropolis, the queens' tombs and the mortuary temples, on the side of the river where the dead were the architecture. | essay 000000000003 "The full western circuit: the royal necropolis, the queens' tombs, the mortuary temples, and the side of the river where the dead were the architecture" |
| Opening | This is the full-day version of the West Bank, five major sites in a single day, on a shared departure. | essay 000000000007 "This is the full-day version of the West Bank: five major sites in a single day."; summary "A shared-departure day" |
| Opening | It's the option for travellers who want one day on the West Bank rather than two. | essay 000000000007 "The capping option for travellers who want one day on the West Bank rather than two." |
| Why this order | The West Bank is the side of the Nile the New Kingdom pharaohs built for the afterlife. | essay 000000000005 (verbatim) |
| Why this order | The royal tombs were cut into the limestone of the Theban hills, and the mortuary temples placed at the cliff base. | essay 000000000005 "The royal tombs were cut into the limestone of the Theban hills … The mortuary temples were placed at the cliff base" |
| Why this order | The day starts in the Valley of the Kings, moves a short drive south to the Valley of the Queens, then takes in the Colossi of Memnon, the Temple of Hatshepsut and Medinet Habu before the drive back to the East Bank. | essay order 000000000010 → 000000000013 ("A short drive south.") → 000000000016 → 000000000019 → 00000000001c → 00000000001e "Return drive to the East Bank." |
| Timeline · period | Morning · The royal valleys | 09:00 pickup (00000000000d) is morning; placing both valleys in the morning is inferred from the order (see owner-input) |
| Stop · Pickup (09:00) | Pickup from your hotel in Luxor, then a fifteen-minute drive across the bridge to the West Bank. | essay 00000000000d "09:00 pickup from your hotel in Luxor. Drive across the bridge to the West Bank — fifteen minutes." |
| Stop · Valley of the Kings | The royal necropolis of the New Kingdom pharaohs, from Thutmose I to Ramses XI, used from the 16th to the 11th century BC. | essay 000000000010 "The royal necropolis used from the 16th to the 11th century BC for the pharaohs of the New Kingdom — Thutmose I to Ramses XI." |
| Stop · Valley of the Kings | Sixty-three tombs have been identified. | essay 000000000010 "Sixty-three tombs identified" |
| Stop · VoK included note | Access to three tombs (included), on the daily rotation set to manage conservation pressure. | essay 000000000010 "access to three is included in the standard ticket, with the daily rotation set to manage conservation pressure"; inclusion g9rje283zu |
| Stop · VoK optional | Tutankhamun's tomb (KV62): additional ticket, available separately on site | essay 000000000010 "Tutankhamun's tomb (KV62) and Seti I (KV17) require additional tickets, available separately on site"; exclusion fma1sykiwl |
| Stop · VoK optional | Seti I (KV17): additional ticket, available separately on site | same as above |
| Stop · VoK optional | Ramses VI: extra ticket | concierge "If you want the extra-ticket tombs — Seti I, Ramses VI" |
| Stop · Valley of the Queens | A short drive south: the burial ground of the queens and royal children of the New Kingdom. | essay 000000000013 "A short drive south. The burial ground of the queens and royal children of the New Kingdom." |
| Stop · VoQ optional | The tomb of Nefertari (QV66): on request only, extra fee, sometimes a separate permit. Ask us when you book. | essay 000000000013 "It is available on request only: entry carries an extra fee and sometimes requires a separate permit, so ask us when you book."; exclusion gyyiufetyp |
| Timeline · period | Afternoon · The mortuary temples | essay 00000000001e "late afternoon"; placing the three temples in the afternoon is inferred (see owner-input) |
| Stop · Colossi | Two seated quartzite figures of Amenhotep III, each around 18 metres tall, that once flanked the entrance to his mortuary temple, the largest ever built. | essay 000000000016 "Two seated quartzite figures of Amenhotep III, each around 18 metres tall, that once flanked the entrance to his mortuary temple."; 000000000005 "the largest mortuary temple ever built (Amenhotep III's)" |
| Stop · Colossi | A brief stop. | essay 000000000016 "A brief stop" |
| Stop · Hatshepsut | At Deir el-Bahari, set against an amphitheatre of vertical limestone cliffs. | essay 000000000019 "At Deir el-Bahari, set against an amphitheatre of vertical limestone cliffs." |
| Stop · Hatshepsut | Three colonnaded terraces, designed by her architect Senenmut, rise toward a sanctuary cut into the cliff. | essay 000000000019 "The three colonnaded terraces, designed by her architect Senenmut, rise toward a sanctuary cut into the cliff." |
| Stop · Hatshepsut | The Punt expedition reliefs on the middle terrace are the centrepiece. | essay 000000000019 "The Punt expedition reliefs on the middle terrace are the architectural and historical centrepiece." |
| Stop · Medinet Habu | Ramses III's mortuary temple, from around 1180 BC: the second-largest in Egypt after Karnak, and arguably the best-preserved. | essay 00000000001c "Ramses III's mortuary temple from around 1180 BC. The second-largest mortuary temple in Egypt after Karnak, and arguably the best-preserved." |
| Stop · Medinet Habu | Reliefs of the Sea Peoples' invasion cover the outer walls, and the inner chambers keep pigment most other Ramesside sites have lost. | essay 00000000001c "Reliefs of the Sea Peoples' invasion on the outer walls; the inner chambers retain pigment that most other Ramesside sites have lost." |
| Stop · Back | The drive back to the East Bank, with drop-off at your hotel in the late afternoon. | essay 00000000001e "Return drive to the East Bank. Drop-off at your hotel in the late afternoon." |
| Included | Shared group day tour | tourMode "group"; summary "A shared-departure day" |
| Included | 09:00 pickup from your hotel in Luxor, and drop-off at your hotel | inclusions 3us8z9jfwq "09:00 pickup from your hotel in Luxor", ki7muyqqre "Drop-off at your hotel" |
| Included | Access to three tombs in the Valley of the Kings | inclusion g9rje283zu (verbatim) |
| Included | A bottle of water per person | owner rule §6.4 |
| Included | Tipping for your driver | owner rule §6.3 |
| Not included | Tutankhamun's tomb (KV62) and Seti I (KV17): additional tickets | exclusion fma1sykiwl "Tutankhamun's tomb (KV62) and Seti I (KV17) require additional tickets" |
| Not included | Ramses VI: extra ticket | concierge "the extra-ticket tombs — Seti I, Ramses VI" |
| Not included | Nefertari's tomb: extra entry fee, sometimes a separate permit | exclusion gyyiufetyp "Nefertari's tomb (extra entry fee, sometimes a separate permit)" |
| Not included | Tipping for your guide: not obligatory, but recommended | owner rule §6.3 (guide itself unconfirmed, see owner-input) |
| Fit for | are giving Luxor only one West Bank day and want all five major sites covered | audience "Travellers giving Luxor only one West Bank day who want all five major sites covered" |
| Fit for | want one day on the West Bank rather than two | essay 000000000007 "for travellers who want one day on the West Bank rather than two" |
| Worth knowing | Three tombs are the day's ration in the Valley of the Kings; the valley holds more. | concierge "Three tombs are the day's ration; the valley holds more." |
| Worth knowing | The tombs open follow a daily rotation set to manage conservation pressure. | essay 000000000010 "with the daily rotation set to manage conservation pressure" |
| Worth knowing | Nefertari's tomb is available on request only. It carries an extra fee and sometimes needs a separate permit, so ask us when you book. | essay 000000000013 "available on request only: entry carries an extra fee and sometimes requires a separate permit, so ask us when you book" |
| Worth knowing | It's a full day, about eight hours. | durationLabel "Full day · ~8 hrs" |
| Worth knowing | Children under 12 pay half price. | owner rule §6.2 |
| Make it yours | Add Nefertari's tomb on request (extra fee, permit) | opts; essay 000000000024 |
| Make it yours | Add extra-ticket tombs such as KV62 and KV17 | opts; essay 000000000033 "add the supplementary tickets for KV62 and KV17" |
| Make it yours | Pair with a Karnak and Luxor Temple East Bank day | opts; essay 000000000033 "pair this with a separate Karnak-and-Luxor-Temple East Bank day" |
| Make it yours | Add a dawn balloon, or go at a private pace | opts; concierge "a dawn balloon before the vans roll, or the same ground at a private pace" |
| Closing line | The West Bank is where the New Kingdom buried its kings, its queens, and the architectural ambition that gave the New Kingdom its name. | essay 000000000022 (verbatim); not the last block, see owner-input |
| More about this day | Full essay, unchanged | body blocks 000000000001–000000000033 |

Times: sourced (09:00 pickup only; every other stop untimed)

---

## skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience

_id `wp-page-133463` · https://travel2egypt.org/skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Opening | The West Bank from a thousand feet up, at the moment the cliff face above the Valley of the Kings catches the first light. | "The West Bank from a thousand feet up, at the moment the cliff face above the Valley of the Kings catches the first light." (essay 000000000003) |
| Opening | From the ground it is a series of separate visits; from a hot-air balloon at sunrise, it is one map. | "From the ground it is a series of separate visits … From a hot-air balloon at sunrise, it is one map." (essay 000000000005) |
| Opening | Thirty minutes of flight, two to three hours from pickup to drop-off. | "Thirty minutes of flight" (essay 000000000003) + "the full trip from pickup to drop-off is two to three hours" (essay 000000000007). Note: 000000000003 also says "two hours of trip"; used the 2–3 h wording (matches durationLabel "~2–3 hrs") |
| Why this order | The sun sets the schedule: the flights launch with the sun, so pickup is well before dawn and the briefing and inflation take place in the dark. | "The sun sets the schedule" (concierge) + "Pickup is well before dawn — the flights launch with the sun, and the briefing and inflation take place in the dark." (essay 00000000000b) |
| Why this order | The weather holds the veto, and a flight can be postponed on the morning itself. | "the weather holds the veto — a flight can be postponed on the morning itself" (concierge) |
| Why this order | We usually pair the flight with the standard West Bank day, so the ground-level visits arrive with the aerial map already in your head. | "we usually pair this with the standard West Bank day so the ground-level visits arrive with the aerial map already in your head" (essay 000000000023) |
| Panel: Pickup | Well before dawn, from your Luxor hotel or your moored Nile boat | "Pickup is well before dawn" (essay 00000000000b) + "pre-dawn pickup from your Luxor hotel or your moored Nile boat" (inclusion bsjfuoq57l; essay 000000000007). No clock time in the text |
| Panel: Back | Back at your hotel or boat; the full trip from pickup to drop-off is two to three hours | "transfer returns you to your hotel or boat" (essay 00000000000f) + "the full trip from pickup to drop-off is two to three hours" (essay 000000000007) |
| Panel: Lunch | (omitted) | No lunch in the text; owner input |
| Panel: Children | (omitted) | §6.2 not applied: "flyers must be eighteen or over" (concierge). Owner input |
| Panel: Guide | (omitted) | No guide in the text. Owner input |
| Stop 1 title | Pickup from your hotel or Nile boat | inclusion bsjfuoq57l |
| Stop 1 | Pickup is well before dawn, because the flights launch with the sun. | "Pickup is well before dawn — the flights launch with the sun" (essay 00000000000b) |
| Stop 1 | You're collected from your Luxor hotel or your moored Nile boat. | "pre-dawn pickup from your Luxor hotel or your moored Nile boat" (essay 000000000007; inclusion bsjfuoq57l) |
| Stop 2 title | Ferry to the West Bank launch field | "You ride a small ferry across the Nile to the West Bank launch field" (essay 00000000000b) |
| Stop 2 | You ride a small ferry across the Nile to the launch field on the West Bank, where the ground crew is already inflating the envelope. | "You ride a small ferry across the Nile to the West Bank launch field, where the ground crew is already inflating the envelope." (essay 00000000000b) |
| Stop 2 | The pilot runs a short safety briefing while the basket is held to the ground. | "The pilot runs the safety briefing while the basket is held to the ground." (essay 00000000000b) + "a short pre-flight briefing" (essay 000000000007; inclusion pjcakoa4yj) |
| Stop 3 title | Sunrise balloon flight over the West Bank | title / summary "A pre-dawn private hot-air balloon flight from the Luxor West Bank" |
| Stop 3 | Ascent comes as the sky begins to brighten, and within a minute or two you're at flying altitude, typically 300–500 metres, depending on wind. | "Ascent happens at the moment the sky begins to brighten. Within a minute or two the basket is at flying altitude — typically between three hundred and five hundred metres depending on wind." (essay 00000000000d) |
| Stop 3 | As the light comes up: the green edge of the cultivated band against the desert, then the Colossi of Memnon, Hatshepsut's terraced temple, the valley leading to the Valley of the Kings, and the Nile and Karnak beyond. | "the line of the cultivated band against the desert edge … Then, in roughly this order as the light comes up: the Colossi of Memnon … Hatshepsut's temple at Deir el-Bahari … the dry valley behind it leading to the Valley of the Kings … and beyond it all, the Nile and Karnak on the east bank." (essay 00000000000d) |
| Stop 3 | The flight lasts roughly thirty minutes. | "The flight itself is roughly thirty minutes" (essay 000000000007) |
| Stop 3 sites | Colossi of Memnon · Temple of Hatshepsut at Deir el-Bahari · Valley of the Kings · Karnak | essay 00000000000d. Seen from the air, not visited. Guide-link matching not done here |
| Stop 4 title | Landing and return to the East Bank | essay 00000000000f |
| Stop 4 | Landing is on agricultural land, with the chase vehicles already in position. | "Landing is on agricultural land, with the chase vehicles already in position." (essay 00000000000f) |
| Stop 4 | A short return ferry brings you back to the East Bank, and a transfer returns you to your hotel or boat. | "A short return ferry brings you back to the East Bank, where transfer returns you to your hotel or boat." (essay 00000000000f) |
| Included | Private hot-air balloon flight, roughly thirty minutes | "balloon flight" (inclusion ljv40vlrj9) + "A pre-dawn private hot-air balloon flight" (summary) + "roughly thirty minutes" (essay 000000000007). "Private" flagged in owner input |
| Included | Pre-dawn pickup from your Luxor hotel or your moored Nile boat | inclusion bsjfuoq57l |
| Included | All transportation, including the transfer to the launch field on the West Bank | inclusions ds6epbwzlb "all transportation" + d5jzzbx7yl "transfer to the launch field on the West Bank" |
| Included | A short pre-flight briefing | inclusion pjcakoa4yj |
| Included | Light refreshments | inclusion ygdi3oz8hk |
| Included | A celebratory glass of sparkling juice | inclusion pxzoaxxt17 |
| Included | A souvenir certificate | inclusion u1ipmsvcr7 |
| Not included | (empty) | No exclusions in the data; §6.3/§6.4 not applied (no guide; unclear whether a driver tip / water apply). Owner input |
| Fit for | are spending a full day on the West Bank and want the landscape's geography legible before you walk it | "Travellers already spending a full day on the West Bank who want the landscape's geography legible before they walk it" (audience) |
| Fit for | want to see the Nile at first light from above | "anyone who wants the Nile at first light from above" (audience) |
| Worth knowing | Flyers must be eighteen or over. | "flyers must be eighteen or over" (concierge) |
| Worth knowing | The flight is weather-dependent and can be postponed on the morning itself. | "The flight is weather-dependent" (essay 000000000023) + "a flight can be postponed on the morning itself" (concierge) |
| Worth knowing | If your dates have any slack, tell us which mornings could work. | "If your dates have any slack, tell our concierge which mornings could work" (concierge) |
| Worth knowing | Pickup is well before dawn. | essay 00000000000b |
| Worth knowing | The flight itself is roughly thirty minutes; the whole trip is two to three hours. | essay 000000000007 |
| Worth knowing | The direction of the flight depends on the morning's wind. | "The flight drifts north-east or south depending on the morning's wind." (essay 00000000000f) |
| Make it yours | Pair the flight with the standard West Bank day; our concierge can sequence both | opt "Pair the flight with the standard West Bank day" + "The concierge can sequence both." (essay 000000000023) |
| Make it yours | Give us flexible mornings, so a postponed flight still has somewhere to go | opt "Give flexible mornings to allow for postponement" + "we'll place the flight where a postponement still has somewhere to go" (concierge) |
| Closing line | The line between green and yellow is where the Nile flood used to stop. Everything you came for is on the yellow side. | essay 000000000015. Note: it is the last narrative block; it is followed by the practical note 000000000023 and an empty block 000000000026 |
| More about this day | full essay, unchanged | body (all blocks) |

Times: none in the text — period headings only

---

## abu-simbel-by-car-from-aswan

_id `tour.private-tour-abu-simble-by-bus-from-aswan` · https://travel2egypt.org/abu-simbel-by-car-from-aswan

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Opening | Roughly three and a half hours south of Aswan, on the desert road to Sudan, the road descends, the water draws close, and Abu Simbel appears: two temples cut directly into a sandstone cliff, their four colossal seated figures of Ramses II staring across Lake Nasser. | "roughly three and a half hours south of Aswan on the desert road to Sudan … Then the road descends, the water draws close, and Abu Simbel appears: two temples cut directly into a sandstone cliff face, their four colossal seated figures of Ramses II staring across the lake" (essay 000000000003) |
| Opening | This is a long day, and the drive is not particularly scenic. | "This is a long day." + "The drive is not particularly scenic" (essay 000000000005) |
| Opening | None of that diminishes what you find when you get there. | "None of that diminishes what you find when you get there." (essay 000000000005) |
| Why this order | Departure is early, typically around 4 a.m., because the Egyptian authorities organise road travel to Abu Simbel in escorted convoys, and the timing is fixed by that schedule rather than preference. | "Departure from your Aswan hotel is early, typically around 4 a.m., to coincide with convoy hours; the Egyptian authorities organise road travel to Abu Simbel in escorted groups, and the timing is fixed by that schedule rather than preference." (essay 00000000001f) |
| Why this order | Arriving early matters: by mid-morning tour buses from across Upper Egypt have arrived and the temple interiors fill quickly, and the sun can be punishing by late morning. | "You reach Abu Simbel before the site becomes crowded, which matters. By mid-morning, tour buses from across Upper Egypt have arrived, and the interiors of the temples … fill quickly." (essay 000000000021) + "the sun at Abu Simbel can be punishing by late morning" (essay 000000000005) |
| Why this order | Because the tour is private, the pace at the temples is yours to set. | "It is a private tour … which means the pace at the temples is yours to set." (essay 000000000013) |
| Panel: Pickup | Around 04:00 from your Aswan hotel, timed to the convoy | "Departure from your Aswan hotel is early, typically around 4 a.m., to coincide with convoy hours" (essay 00000000001f); "The four o'clock convoy" (concierge). 4 a.m. written as 04:00 |
| Panel: Back | Back in Aswan typically late afternoon, depending on departure time and any stops along the road | "Arrival in Aswan is typically late afternoon, depending on departure time and any stops along the road." (essay 00000000002b); "the late-afternoon return" (audience). CONTRADICTION: essay 000000000005 says "return to the city by mid-afternoon" — owner input |
| Panel: Lunch | unknown — Included in the Base + Entrance Fees & Lunch tier only (a midday meal) | "Midday meal (Base + Entrance Fees & Lunch tier only)" (inclusion hl1y9x6bf5); essay 00000000001b |
| Panel: Guide | English (EN page) | "Licensed, English-speaking Egyptologist guide (every tier)" (inclusion 6fmjkrvb3e); §6.1. ES/JA in owner input |
| Panel: Children | (omitted) | §6.2 not applied: "the minimum age for this tour is 18" (essay 000000000013). Owner input |
| Stop 1 | around 04:00 · Pickup from your Aswan hotel | essay 00000000001f "typically around 4 a.m." |
| Stop 1 | Departure is early, to coincide with convoy hours: the Egyptian authorities organise road travel to Abu Simbel in escorted groups. | essay 00000000001f (same quote as above) |
| Stop 1 | You travel in a private, air-conditioned vehicle. | "Private, air-conditioned vehicle (every tier)" (inclusion ka45uezam2) |
| Stop 2 title | The road along Lake Nasser | essay 00000000001f |
| Stop 2 | The road south runs along the western bank of Lake Nasser through open desert. | "The road south runs along the western bank of Lake Nasser through open desert." (essay 00000000001f) |
| Stop 2 | It is a smooth, well-maintained highway, and the drive takes approximately three and a half hours. | "It is a smooth, well-maintained highway, and the drive takes approximately three and a half hours each way." (essay 00000000001f) |
| Stop 2 sites | Lake Nasser | essay 00000000001f, 000000000031 |
| Stop 3 title | The Great Temple of Ramses II | "The Great Temple is the larger of the two, built by Ramses II" (essay 000000000023) |
| Stop 3 | You reach Abu Simbel before the site becomes crowded, with time in the great hypostyle hall before the crowds press in. | "You reach Abu Simbel before the site becomes crowded … An early arrival gives you time in the great hypostyle hall of the Great Temple before the crowds press in." (essay 000000000021) |
| Stop 3 | Four seated statues of Ramses II, each roughly twenty metres tall, flank the entrance. | "Four seated statues of the pharaoh, each roughly twenty metres tall, flank the entrance" (essay 000000000023) |
| Stop 3 | Inside are eight Osiride pillars, reliefs of the Battle of Kadesh, and the inner sanctuary that the sun reaches every 22 February and 22 October. | "Inside, eight Osiride pillars … the walls carry detailed reliefs of the Battle of Kadesh … The inner sanctuary … It is this chamber that the solar alignment illuminates every 22 February and 22 October" (essay 000000000023) |
| Stop 3 sites | Great Temple of Ramses II, Abu Simbel | essay 000000000023. Guide-link matching not done here |
| Stop 3 includedNote | Admission to both temples is included in the Base + Entrance Fees and Base + Entrance Fees & Lunch tiers, not in the Base package. | "Admission to both temples (Base + Entrance Fees and Base + Entrance Fees & Lunch tiers only)" (inclusion 6rraudsa6r); essay 00000000001b |
| Stop 4 title | The Small Temple of Nefertari and Hathor | "Built to honour Nefertari, Ramses's principal wife, and the goddess Hathor" (essay 000000000025) |
| Stop 4 | Roughly a hundred metres to the north, it is the only Egyptian temple in which a queen's statues are carved at the same scale as the pharaoh's, and its reliefs include some of the best-preserved colour in any Nubian monument. | "The Small Temple stands roughly a hundred metres to the north … it is the only Egyptian temple in which a queen's statues are carved at the same scale as the pharaoh's … its reliefs include some of the best-preserved colour in any Nubian monument." (essay 000000000025) |
| Stop 4 | Your guide moves you through both temples in sequence; plan for two to two and a half hours on site. | "Your guide will move you through both temples in sequence … Plan for two to two and a half hours on site" (essay 000000000027). Minor conflict with "two to three hours at the site" (essay 000000000005) — owner input |
| Stop 4 sites | Small Temple of Nefertari and Hathor, Abu Simbel | essay 000000000025 |
| Stop 5 title | Drive back to Aswan | essay 00000000002b |
| Stop 5 | After the temples you return to your vehicle for the drive back north. | "After the temples, you return to your vehicle for the drive back north." (essay 00000000002b) |
| Stop 5 | Arrival in Aswan is typically late afternoon, depending on departure time and any stops along the road. | essay 00000000002b (see contradiction above) |
| Included | Private tour for your party alone, with your own vehicle and guide | "operated for your party alone — your own vehicle and guide" (essay 000000000013) |
| Included | A private, air-conditioned vehicle | inclusion ka45uezam2 |
| Included | A licensed, English-speaking Egyptologist guide | inclusion 6fmjkrvb3e |
| Included | One bottle of mineral water per person | inclusion apmvvt58qp; §6.4 |
| Included | All driving and logistics | inclusion tfqll6nyke |
| Included | Admission to both temples (Base + Entrance Fees and Base + Entrance Fees & Lunch tiers) | inclusion 6rraudsa6r |
| Included | A midday meal (Base + Entrance Fees & Lunch tier only) | inclusion hl1y9x6bf5 |
| Included | Tipping for your driver | owner rule §6.3 |
| Not included | Admission to the temples: not in the Base package | "a Base package (private vehicle, guide, water, and all driving and logistics); Base + Entrance Fees (the same, plus admission to both temples)" (essay 00000000001b) |
| Not included | Lunch: not in the Base or Base + Entrance Fees tiers | "Midday meal (Base + Entrance Fees & Lunch tier only)" (inclusion hl1y9x6bf5); essay 00000000001b |
| Not included | Tipping for your guide: not obligatory, but recommended | owner rule §6.3 |
| Fit for | don't have an extra night in Aswan but still want the depth a road approach gives | "Travellers without an extra night in Aswan who still want the depth a road approach gives" (audience) |
| Fit for | prefer a late-afternoon return to a flight schedule | "and the late-afternoon return rather than a flight schedule" (audience) |
| Fit for | have the patience for a long drive and want to see one of Egypt's most important sites without committing to a Nile cruise | "suits anyone who has the patience for a long drive and wants to see one of Egypt's most important sites without committing to a Nile cruise or an overnight stay in Aswan" (essay 000000000013) — "overnight stay in Aswan" dropped, see owner input |
| Worth knowing | The minimum age is 18, given the 4 a.m. convoy departure, the long desert drive and the exposed site. | "Given the 4 a.m. convoy departure, the long desert drive, and the exposed site, the minimum age for this tour is 18." (essay 000000000013) |
| Worth knowing | It's about seven hours on the road, roughly three and a half each way, and the drive is not particularly scenic. | "seven hours on the road" (essay 000000000033) + "approximately three and a half hours each way" (essay 00000000001f) + "The drive is not particularly scenic" (essay 000000000005) |
| Worth knowing | The sun at Abu Simbel can be punishing by late morning. | essay 000000000005 |
| Worth knowing | The departure time is set by the convoy schedule, not by us. | "the departure is not ours to move" (concierge); "the timing is fixed by that schedule rather than preference" (essay 00000000001f) |
| Worth knowing | It's private, so it runs for as few as one traveller, with no minimum group size. | "Because it is private, it runs for as few as one traveller, with no minimum group size" (essay 000000000013) |
| Make it yours | Add admission to both temples (Base + Entrance Fees tier) | opt "Add admission to both temples (Entrance Fees tier)"; essay 00000000001b |
| Make it yours | Add a midday lunch with the entrance fees (Base + Entrance Fees & Lunch tier) | opt "Add a midday lunch with entrance fees"; essay 00000000001b |
| Make it yours | Ask our concierge to arrange a gentle evening before and a slow morning after the early start | opt "Arrange a gentle evening before and slow morning after"; concierge "a gentle evening before, a slow morning after, an Aswan schedule that absorbs the early start" |
| Make it yours | Ask our concierge whether your dates match the sun-alignment days, around 22 February and 22 October | "sun-alignment dates fall around 22 February and 22 October. The concierge can advise on whether your dates match." (essay 000000000043) |
| Closing line | What you find at the end of that drive has no equivalent anywhere else in Egypt. | essay 000000000035. Followed by the practical note 000000000043 and an empty block 000000000046 |
| More about this day | full essay, unchanged | body (all blocks) |

Times: sourced (only the ~04:00 departure; all other stops have no time)

---

## nubian-temples-day-tour-from-aswan

_id: `tour.nubian-temples-day-tour-from-aswan` · https://travel2egypt.org/nubian-temples-day-tour-from-aswan

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Opening | The temples south of the Aswan High Dam are not where they used to be. | "The temples south of the Aswan High Dam are not where they used to be." (essay `000000000005`) |
| Opening | When Lake Nasser was filled in the late 1960s, several Nubian monuments were saved: cut into blocks, lifted and reassembled on higher ground. | "When Lake Nasser was filled in the late 1960s… Several were saved — cut into blocks, lifted, and reassembled on higher ground." (essay `000000000005`) |
| Opening | On New Kalabsha island, just upstream of the dam, you visit three of them: the Temple of Kalabsha, the rock-cut Temple of Beit el-Wali and the small Roman-period Kiosk of Kertassi. | "The cluster on New Kalabsha island, immediately upstream of the dam, holds three of them: the Temple of Kalabsha, the rock-cut Temple of Beit el-Wali, and the small Roman-period Kiosk of Kertassi." (essay `000000000005`) |
| Why this order | On the island, the guide takes the three structures in sequence. | "On the island, the licensed guide moves through the three structures in sequence" (essay `000000000011`) |
| Why this order | Kalabsha comes first, because it's the largest and the longest visit. | "Kalabsha first (the largest, the longest visit)" (essay `000000000011`) |
| Why this order | Then Beit el-Wali, about twenty minutes for the painted reliefs, and last the Kertassi kiosk at the water's edge for the closing photograph. | "then Beit el-Wali (twenty minutes for the painted reliefs), then the Kertassi kiosk at the water's edge for the closing photograph" (essay `000000000011`) |
| Panel: Pickup | Morning, from your hotel in Aswan | "Morning pickup from your hotel in Aswan." (essay `00000000000f`; inclusion `c4hnwr1n89`). No clock time in the text. Note: value is a period, not a clock time. |
| Panel: Back | Hotel drop-off by early afternoon | "Hotel drop-off by early afternoon." (essay `000000000013`) |
| Panel: Lunch | (empty, status unknown) | Not stated. Concierge only says "ask about lunch in a Nubian village on the way back". Asked in owner-input. |
| Panel: Guide speaks | English (page language) | "the licensed guide" (essay `000000000011`) + owner rule §6.1 |
| Panel: Children | Children under 12: 50% off | owner rule §6.2 |
| Fit for | are already in Aswan and want the quieter UNESCO-rescue chapter that Abu Simbel usually crowds out | "Travellers already in Aswan who want the quieter UNESCO-rescue chapter Abu Simbel usually crowds out" (audience) |
| Fit for | want a half day to go with Philae or Abu Simbel | "A natural half-day complement to Philae or Abu Simbel" (essay `000000000028`) |
| Fit for | like a short crossing and thin crowds | "the crossing is short and the crowds stay thin" (concierge) |
| Worth knowing | This is a shared-departure group tour. | "A shared-departure day to the Nubian temples" (summary); tourMode `group` |
| Worth knowing | The crossing to the island is by motor boat, roughly fifteen minutes across open water. | "Motor-boat crossing to New Kalabsha island — roughly fifteen minutes across open water" (essay `00000000000f`) |
| Worth knowing | The temples are intact in form, but the setting is engineered: a man-made island in a man-made lake, with the dam wall visible to the north. | "The temples are intact in form… but the landscape around them is engineered: a man-made island in a man-made lake, with the dam wall visible to the north." (essay `000000000007`) |
| Worth knowing | You spend roughly two to two and a half hours on the island. | "Roughly two to two and a half hours on the island in total." (essay `000000000011`) |
| Worth knowing | Children under 12 pay half price. | owner rule §6.2 |
| Morning heading | Morning · New Kalabsha island | "Morning pickup" (essay `00000000000f`); island name from `000000000005`. Island visits placed in Morning because pickup is in the morning and drop-off is "by early afternoon" (`000000000013`); no times given. |
| Stop: Pickup | A short drive south through the city to the dock just above the High Dam. | "Short drive south through the city to the dock immediately above the High Dam." (essay `00000000000f`) |
| Stop: Pickup sites | Aswan High Dam | essay `00000000000f` |
| Stop: Crossing | Roughly fifteen minutes across open water, with the dam wall to one side. | "roughly fifteen minutes across open water with the dam wall to one side" (essay `00000000000f`) |
| Stop: Crossing sites | Lake Nasser · New Kalabsha island | essay `000000000005`, `00000000000f` |
| Stop: Kalabsha | The first and longest visit. | "Kalabsha first (the largest, the longest visit)" (essay `000000000011`) |
| Stop: Kalabsha | Augustus built it around 30 BC over the foundations of an older Ptolemaic temple, for the Nubian deity Mandulis, a local form of Horus. | "Kalabsha was built by the Roman emperor Augustus around 30 BC over the foundations of an older Ptolemaic temple, dedicated to the Nubian deity Mandulis (a local form of Horus)." (essay `000000000009`) |
| Stop: Kalabsha | It's the largest free-standing Nubian temple outside Abu Simbel. | "It is the largest free-standing Nubian temple outside of Abu Simbel." (essay `000000000009`) |
| Stop: Beit el-Wali | About twenty minutes at a small rock-cut chapel built by Ramses II in the early thirteenth century BC. | "then Beit el-Wali (twenty minutes for the painted reliefs)" (`000000000011`); "a small rock-cut chapel built by Ramses II in the early thirteenth century BC" (`000000000009`) |
| Stop: Beit el-Wali | Its reliefs of his Nubian campaigns keep unusual pigment. | "with relief carvings of his Nubian campaigns that retain unusual pigment" (essay `000000000009`) |
| Stop: Kertassi | What remains of a Roman-period rest-station: four columns and a graceful entablature at the water's edge. | "The Kertassi kiosk is what remains of a Roman-period rest-station, four columns and a graceful entablature against the lake." (`000000000009`); "at the water's edge" (`000000000011`) |
| Stop: Kertassi | This is the stop for the closing photograph. | "the Kertassi kiosk at the water's edge for the closing photograph" (essay `000000000011`) |
| Afternoon heading | Afternoon · Back to Aswan | "Hotel drop-off by early afternoon." (essay `000000000013`) |
| Stop: Return | The boat returns to the dock, then it's a short drive back into central Aswan. | "Return boat to the dock and short drive back into central Aswan." (essay `000000000013`; inclusion `gbxztre9u3`) |
| Stop: Return | Hotel drop-off by early afternoon. | essay `000000000013`; inclusion `oxrn0nh1va` |
| Included | Shared-departure group tour | summary "A shared-departure day"; tourMode `group` |
| Included | A licensed guide in your language (English, Spanish or Japanese) | inclusion `ebyxudsmac` "Licensed guide" + owner rule §6.1 |
| Included | Morning pickup from your hotel in Aswan, and drop-off back at your hotel | inclusions `c4hnwr1n89` "Morning pickup from your hotel in Aswan", `oxrn0nh1va` "Hotel drop-off" |
| Included | Motor-boat crossing to New Kalabsha island and back | inclusions `4c185j5ia2` "Motor-boat crossing to New Kalabsha island", `gbxztre9u3` "Return boat to the dock…" |
| Included | A bottle of water per person | owner rule §6.4 |
| Included | Tipping for your driver | owner rule §6.3 (a drive is part of the day: essay `00000000000f`, `000000000013`) |
| Not included | Tipping for your guide: not obligatory, but recommended | owner rule §6.3 |
| Make it yours | Pair it with Philae the same afternoon | "Pair it with Philae the same afternoon" (concierge); opts "Pair the tour with Philae the same afternoon" |
| Make it yours | Ask about lunch in a Nubian village on the way back | "ask about lunch in a Nubian village on the way back" (concierge); opts "Add lunch in a Nubian village on the way back" |
| Make it yours | Time the boat around your Aswan hotel or your Nile cruise berth | "we can arrange the boat timings around an Aswan hotel base or a Nile cruise berth" (essay `000000000028`); opts "Time the boat around your hotel or Nile cruise berth" |
| Closing line | Half a day on the new island is enough to give them their own chapter. | essay `000000000019` (closingRef). Note: the essay's very last block is `000000000028`, a practical note ("A natural half-day complement…"), which stays in "More about this day". |
| More about this day | full essay, unchanged | essay blocks `000000000001`–`000000000028` |

Sites with no guide-link match checked yet: Aswan High Dam · Lake Nasser · New Kalabsha island · Temple of Kalabsha · Temple of Beit el-Wali · Kiosk of Kertassi (match in the guide-link pass).

Times: none in the text — period headings only

---

## aswan-felucca-adventure

_id: `wp-page-113206` · https://travel2egypt.org/aswan-felucca-adventure

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Opening | Three hours on the Nile at Aswan in a felucca, Egypt's traditional lateen-rigged sailing boat. | "The felucca, Egypt's traditional lateen-rigged sailing boat, has worked this stretch of the Nile" (essay `000000000003`); "This is a three-hour sailing experience" (essay `000000000005`) |
| Opening | This is a sailing experience, not a sightseeing tour: no temples to enter, no ticket queues. | "This is a three-hour sailing experience, not a sightseeing tour. There are no temples to enter, no ticket queues, no commentary tracks." (essay `000000000005`) |
| Opening | You watch the Corniche slide past, track the birds above the river and let the wind do the work. | "watching the city's Corniche slide past, tracking the birds above the river, letting the wind do the work" (essay `000000000005`) |
| Why this order | The boat is privately yours, so it can drift longer around the islands or turn back early. | "The boat is privately yours, though — it can drift longer around the islands or turn back early without apology." (concierge) |
| Why this order | Feluccas move with the wind, which at Aswan is generally reliable but never hurried. | "Feluccas move with the wind, which on the Nile at Aswan is generally reliable but never hurried." (essay `000000000009`) |
| Why this order | From October through April temperatures are moderate and the northerly breeze is consistent; from May onward, morning sails are noticeably cooler than afternoon ones. | "The best sailing conditions… occur from October through April, when temperatures are moderate and the northerly breeze that pushes boats upstream is consistent." (essay `000000000027`); "morning sails are noticeably cooler than afternoon ones from May onward" (essay `000000000039`) |
| Panel: Pickup | From your agreed meeting point, with a short transfer to the Aswan Corniche | "a pick-up from your agreed meeting point and a short transfer to the Aswan Corniche" (essay `000000000019`; inclusion `mvm8g4axnb`). No clock time; value is a place, not a time. |
| Panel: Back | Back at the docking point on the Corniche roughly three hours after embarkation | "arriving back at the docking point on the Corniche after roughly three hours from embarkation" (essay `000000000021`) |
| Panel: Lunch | not included · Optional Nile Feast package, on board or at a riverside restaurant, chosen at booking | "a lunch (onboard or riverside) is an optional add-on, chosen at booking" (essay `000000000015`); "Nile Feast package" (essay `00000000001f`) |
| Panel: Guide speaks | (none: the product has an assistant, not a guide) | "An English-speaking assistant" (essay `000000000015`; inclusion `rlifoed1uq`). §6.1 not applied; asked in owner-input. |
| Panel: Children | Children under 12: 50% off | owner rule §6.2 |
| Fit for | have already seen, or will see, Philae, the High Dam and the Unfinished Obelisk, and want one unstructured morning or afternoon that belongs to the river | audience "Travellers who have already (or will) cover Philae, the High Dam, and the Unfinished Obelisk and want one unstructured morning belonging to the river"; "one morning or afternoon that belongs to the river" (essay `000000000005`) |
| Fit for | are travelling alone or as a small party: the sail takes bookings from a single person upward, with no minimum group | "the sail takes bookings from a single person upward, with no minimum group" (essay `000000000015`) |
| Fit for | are travelling as a family: there's no minimum age | "There is no minimum age — families are welcome" (essay `000000000015`) |
| Worth knowing | A felucca has no shade canopy. | "a felucca carries no shade canopy" (concierge) |
| Worth knowing | It's an open boat on open water, so plan around young children and sun exposure. | "it is an open boat on open water with no shade canopy, so plan around young children and sun exposure" (essay `000000000015`) |
| Worth knowing | It isn't a fast-moving trip. | "this is not a fast-moving trip" (essay `000000000009`) |
| Worth knowing | If you're travelling with restless children or need structured commentary throughout, temper your expectations. | "If you are travelling with restless children or need structured commentary throughout, temper expectations accordingly." (essay `000000000009`) |
| Worth knowing | There are no temples to enter on this sail. | "There are no temples to enter" (essay `000000000005`) |
| Worth knowing | In May and June the heat intensifies and the wind can be variable. | "In May and June, the heat intensifies and the wind can be variable" (essay `000000000027`) |
| Worth knowing | Morning departures are significantly more comfortable in the warmer months. | "morning departures are significantly more comfortable than afternoon ones in the warmer months" (essay `000000000027`) |
| Worth knowing | Children under 12 pay half price. | owner rule §6.2 |
| Morning heading | Morning · The Nile at Aswan | audience "one unstructured morning belonging to the river". The sail can also run in the afternoon (essay `000000000005`, opts) — period choice asked in owner-input. |
| Stop: Pickup | A short transfer from your agreed meeting point to the Corniche, the broad riverside promenade on the east bank. | "a pick-up from your agreed meeting point and a short transfer to the Aswan Corniche — the broad riverside promenade that runs along the east bank of the Nile" (essay `000000000019`) |
| Stop: Pickup | Your English-speaking assistant meets you there and walks you down to the felucca. | "Your English-speaking assistant meets you there and walks you down to the felucca." (essay `000000000019`) |
| Stop: Pickup sites | Aswan Corniche | essay `000000000019` |
| Stop: Sailing | A traditional wooden-hulled boat with a single triangular sail. | "The boat is a traditional wooden-hulled craft, rigged with a single triangular sail." (essay `00000000001b`) |
| Stop: Sailing | You pass the riverbanks on both sides, palm-fringed islands mid-channel and Aswan's rocky shoreline, while the assistant talks about the felucca's place in Egyptian life. | "takes in the riverbanks on both sides, the palm-fringed islands mid-channel, and the characteristic rocky shoreline" (essay `00000000001d`); "The assistant provides context on the felucca's place in Egyptian life" (essay `00000000001b`) |
| Stop: Sailing | Ask questions, or say nothing at all. | "ask questions, or say nothing at all" (essay `00000000001b`) |
| Stop: Nile Feast | Served at about the midpoint of the sail, on board or at a riverside restaurant. | "lunch is served at approximately the midpoint of the sail… a table at a riverside restaurant overlooking the water, or a meal served directly on the felucca" (essay `00000000001f`) |
| Stop: Nile Feast | Freshly baked Egyptian bread, baba ghanoush and tahini, then grilled chicken or seasoned meat with aromatic rice and seasonal vegetables. | "The menu runs to freshly baked Egyptian bread, baba ghanoush and tahini for dipping, followed by grilled chicken or seasoned meat with aromatic rice and seasonal vegetables." (essay `00000000001f`) |
| Stop: Nile Feast | Soft drinks and mineral water come with it. | "Soft drinks and mineral water are included." (essay `00000000001f`); inclusion `v0b5ofe3q8` "Soft drinks and mineral water (Nile Feast lunch package)" |
| Stop: Nile Feast optional | Nile Feast lunch, on board or at a riverside restaurant: optional add-on, chosen at booking (extraCost) | "a lunch (onboard or riverside) is an optional add-on, chosen at booking" (essay `000000000015`). "extraCost" follows from "add-on"; no price in the text (owner-input). |
| Stop: Return | The return leg follows the same river in reverse, back to the docking point on the Corniche roughly three hours after embarkation. | "The return leg follows the same river in reverse, arriving back at the docking point on the Corniche after roughly three hours from embarkation." (essay `000000000021`) |
| Included | Private felucca for your party, never shared with other guests | "The felucca is hired privately for your party — never shared with other guests" (essay `000000000015`); inclusion `498vbv75gv` |
| Included | An English-speaking assistant | inclusion `rlifoed1uq`; essay `000000000015` |
| Included | Pickup from your agreed meeting point and a short transfer to the Aswan Corniche | inclusion `mvm8g4axnb` |
| Included | One bottle of mineral water per person | inclusion `tdp8h9vhac`; essay `000000000015`; matches owner rule §6.4 |
| Included | Tipping for your driver | owner rule §6.3 (a transfer is part of the day: essay `000000000019`). Confirm in owner-input. |
| Not included | Nile Feast lunch, on board or at a riverside restaurant, with soft drinks and mineral water: optional add-on, chosen at booking | essay `000000000015`, `00000000001f`; inclusion `v0b5ofe3q8` moved here because the drinks come only with the package |
| Make it yours | Add the Nile Feast lunch, on board or at a riverside restaurant | opts "Add the Nile Feast lunch package", "Choose lunch onboard or at a riverside restaurant" |
| Make it yours | Drift longer around the islands, or turn back early | opts "Drift longer around the islands or turn back early"; concierge |
| Make it yours | Choose a morning or afternoon sail; the concierge can recommend the best window | opts "Choose a morning or afternoon sailing window"; "The concierge can recommend the best window" (essay `000000000039`) |
| Make it yours | Tell us how you'd like the three hours to feel | "Say how you'd like the three hours to feel" (concierge) |
| Closing line | Three hours on a felucca is the quietest argument for noticing. | essay `00000000002b` (closingRef). Note: after it the essay has `000000000039` (a Nile Feast/concierge note) and an empty block `00000000003c`; both stay in "More about this day". |
| More about this day | full essay, unchanged | essay blocks `000000000001`–`00000000003c` |

Not listed as sites: Elephantine Island (the essay mentions it in a description of Aswan's light, not as a point on the route) and the first cataract ("You are unlikely to reach the cataract proper"). Site to match in the guide-link pass: Aswan Corniche.

Times: none in the text — period headings only
