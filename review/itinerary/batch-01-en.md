# Itinerary format — Batch 1 review (EN)

Brief: "Travel2Egypt: new itinerary format for multi-day product pages" (owner, 2026-11-16).
Batch 1 = the 17 homepage products. The 7-Day tour is imported from the owner-approved
reference (see `7-day-report-2026-11-16.md`); this file covers the other 16.

**Drafted (5 multi-day packages).** Each section below lists every sentence with its
source quote (product → part → sentence → source), then where every essay block
lands, so no essay text is lost or repeated. Drafts are in `drafts/*.draft.json`.

**Not drafted (owner decision 2026-11-16: the format is for multi-day pages):**

| Product | Why not drafted |
|---|---|
| pyramids-of-giza-and-grand-egyptian-museum | single-day tour |
| private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara | single-day tour |
| pyramids-of-giza-and-sphinx-group-day-tour | single-day tour |
| day-tour-to-karnak-luxor-temples-luxor-museum | single-day tour |
| grand-west-bank-group-day-tour-luxor | single-day tour |
| skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience | single-day tour |
| private-tour-abu-simble-by-bus-from-aswan | single-day tour |
| nubian-temples-day-tour-from-aswan | single-day tour |
| aswan-felucca-adventure | single-day tour |
| alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo | single-day tour |
| 2-day-pyramids-mediterranean-tour | 2 days, but set up as a day tour (day-tour page template) |

**How approval works.** Nothing is written to Sanity yet. After the owner's OK,
`scripts/itinerary-format/stage-batch-2026-11-16.mjs --apply review/itinerary/drafts/*.draft.json`
stores each draft with `needsReview: true`; the page keeps its current layout until
the journey intro and every day of that language are approved. Open questions per
product are in `batch-01-owner-input-en.md`.

Checks run on every draft: day count = product length; every non-heading essay block
used exactly once; every "Optional on this day" points at a real Not-included row.

---

## 10-days-nile-dreamer-tour-experience

_id: `wp-page-89376` · https://travel2egypt.org/10-days-nile-dreamer-tour-experience

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Opening | A private journey that treats the Nile as the spine of the trip rather than transport between sites: Cairo by car, Cairo to Aswan by sleeper train, three nights cruising from Aswan to Luxor, and the flight from Luxor back to Cairo. | essay 000000000003: "A private journey that treats the Nile not as transport between sites but as the spine of the trip — Cairo by car, Cairo to Aswan by sleeper train, Aswan to Luxor by cruise across three nights, and Luxor to Cairo by flight" |
| Opening | Egypt has two spines, and this tour follows both of them. | essay 000000000005: "Egypt has two spines, and this tour follows both of them." |
| Why this route works | The first spine is the Nile, the river that made Egyptian civilisation possible and still the most logical way to move between the monuments of the south. | essay 000000000007: "The first is the Nile itself — the river that made Egyptian civilisation possible … and that remains, even now, the most logical way to move between the monuments of the south." |
| Why this route works | The second is time: a sequence that begins with the familiar landmarks of Cairo, moves deep into Upper Egypt and returns. | essay 000000000007: "The second is time: a sequence that begins with the familiar landmarks of Cairo, moves deep into Upper Egypt, and returns…" |
| Why this route works | You travel south from Cairo to Aswan by overnight train, board a Nile cruise for three nights, sail north through Kom Ombo and Edfu to Luxor, then fly back to Cairo. | essay 000000000009: "This itinerary moves south from Cairo to Aswan by overnight train, boards a Nile cruise for three nights, sails north through Kom Ombo and Edfu to Luxor, and then returns to Cairo by flight to close." |
| Why this route works | The cruise is the centre of the journey, not a luxury appendage: three nights on the river reframe what you saw in Cairo and prepare you for Luxor. | essay 00000000000b: "The cruise is the centre of the journey, not a luxury appendage. Three nights on the Nile … reframes everything you saw in Cairo and prepares everything you will see in Luxor." |
| Why this route works | Ten days is enough to do this properly, if the structure is right. | essay 000000000007: "Ten days is enough to do this properly, if the structure is right." |
| Closing line | Ten days cannot show you all of Egypt — the country is too old and too large for that. What this journey does instead is rarer: it puts you on the river itself, and lets the monuments come to you. | essay 000000000031 (verbatim) |
| Day 1 place/title | Cairo · Arrival at Cairo airport and transfer to your hotel | itin day 1 "Arrival in Cairo"; essay 00000000000f "You are met at Cairo International Airport and transferred to your hotel" |
| Day 1 body | You are met at Cairo International Airport and transferred to your hotel. | essay 00000000000f: "You are met at Cairo International Airport and transferred to your hotel." |
| Day 1 body | The first day is short and exists to set up what follows: lunch and dinner are provided, and the schedule asks nothing more. | essay 00000000000f: "The first day is short and exists to set up what follows. … Lunch and dinner are provided, and the schedule asks nothing more." |
| Day 1 body | Cairo is a large, loud, layered city, and it benefits from a single quiet arrival before the programme begins. | essay 00000000000f (verbatim) |
| Day 1 body | Use the afternoon to get your bearings: the scale of the streets, the sound of the call to prayer, the light. | essay 00000000000f: "Use the afternoon to get your bearings — the scale of the streets, the sound of the call to prayer, the light" |
| Day 1 body | Tomorrow starts early. | essay 00000000000f: "because tomorrow starts early and does not slow down" |
| Day 1 Overnight | Cairo | itin day 1 overnight "Cairo" |
| Day 1 Meals | Lunch · dinner | inclusion zf2j891tsq "Lunch and dinner on day one"; essay 00000000000f "Lunch and dinner are provided" |
| Day 1 Travel | Airport meeting and transfer to your hotel | inclusion 5y0lju7c8k "Airport meeting and transfer to hotel on arrival" |
| Day 1 Pace | Short: an arrival day, and the schedule asks nothing more | essay 00000000000f: "The first day is short … the schedule asks nothing more" |
| Day 2 place/title | Cairo · The Giza pyramids, the Great Sphinx and the Egyptian Museum | itin day 2 "Giza pyramids, Sphinx and Egyptian Museum"; overnight "Cairo" |
| Day 2 body | The day begins at Giza. | essay 000000000011: "It begins at Giza" |
| Day 2 body | The three pyramids of the Old Kingdom, Khufu, Khafre and Menkaure, were built around 2500 BC, with the Great Sphinx below them, carved from a single limestone outcrop, its function still debated. | essay 000000000011: "the three pyramids of the Old Kingdom — Khufu, Khafre, and Menkaure, built around 2500 BC … The Great Sphinx sits below them, carved from a single limestone outcrop, its function still debated." |
| Day 2 body | After lunch the day moves into the city, to the Egyptian Museum on Tahrir Square. | essay 000000000011: "After lunch the day moves into the city. The Egyptian Museum on Tahrir Square" |
| Day 2 body | This is the original museum of antiquities, and it still houses one of the densest collections of pharaonic material on earth. | essay 000000000011: "the original museum of antiquities … still houses one of the densest collections of pharaonic material on earth" |
| Day 2 body | It is not the newer Grand Egyptian Museum at Giza, which holds the complete Tutankhamun collection. | essay 000000000011: "not the newer Grand Egyptian Museum at Giza, which holds the complete Tutankhamun collection" |
| Day 2 body | The night is spent again at your Cairo hotel. | essay 000000000011: "The night is spent again at your Cairo hotel." |
| Day 2 The day | Pyramid of Khufu · Pyramid of Khafre · Pyramid of Menkaure · Great Sphinx · Egyptian Museum (Tahrir Square) | essay 000000000011 (names as above) |
| Day 2 Overnight | Cairo | itin day 2 overnight "Cairo" |
| Day 2 Meals | Breakfast · lunch · dinner | inclusion sw40fimxwz "full board" (scope on hotel days: see owner-input); lunch also essay 000000000011 "After lunch" |
| Day 2 Travel | Private air-conditioned transfers | inclusion w9xm71zp9w "private air-conditioned transfers throughout" |
| Day 2 Pace | The most demanding day of the trip, with an early start | essay 000000000011: "The second day is the most demanding of the trip"; essay 00000000000f: "tomorrow starts early and does not slow down" |
| Day 3 place/title | Cairo → sleeper train · The Citadel, the Mosque of Muhammad Ali, Khan el-Khalili and the overnight train | itin day 3 "Citadel, Khan el-Khalili, overnight train"; essay r2day3 |
| Day 3 body | Day three stays in Cairo. | essay r2day3 (verbatim) |
| Day 3 body | It climbs to the Saladin Citadel, the medieval fortification that has anchored Cairo's skyline since the twelfth century, and the Mosque of Muhammad Ali inside it. | essay r2day3: "The day climbs to the Saladin Citadel, the medieval fortification that has anchored Cairo's skyline since the twelfth century, and the Mosque of Muhammad Ali inside it." |
| Day 3 body | The afternoon ends in Khan el-Khalili, the bazaar quarter that has traded continuously since the fourteenth century. | essay r2day3 (verbatim) |
| Day 3 body | In the evening you board the overnight train to Aswan, with dinner served on board. | essay r2day3: "In the evening you board the overnight train to Aswan, with dinner served onboard." |
| Day 3 body | The train is both transport and transition: by the time you arrive in the morning, the Cairo chapter will already feel like a different country. | essay r2day3: "The train is both transport and transition — by the time you arrive in the morning, the Cairo chapter will already feel like a different country." |
| Day 3 The day | Saladin Citadel · Mosque of Muhammad Ali · Khan el-Khalili | essay r2day3 |
| Day 3 Overnight | Sleeper train | itin day 3 overnight "Sleeper train" |
| Day 3 Meals | Breakfast · lunch · dinner (on the train) | inclusion sw40fimxwz "full board"; inclusion 7w1k8punsi "with dinner onboard" |
| Day 3 Travel | Private air-conditioned transfers · overnight train Cairo → Aswan | inclusion w9xm71zp9w; inclusion 7w1k8punsi "one overnight train journey (Cairo to Aswan…)" |
| Day 3 Pace | A full day in Cairo, then the overnight train | essay 00000000001b: "after two full days in Cairo"; essay r2day3 "In the evening you board the overnight train" |
| Day 4 place/title | Aswan · The Aswan High Dam, the Unfinished Obelisk and Philae Temple | itin day 4 "High Dam, Unfinished Obelisk, Philae Temple" |
| Day 4 body | You wake on the train to breakfast and the landscape of Upper Egypt outside the window. | essay 000000000015: "On day four you wake on the train to breakfast and the landscape of Upper Egypt outside the window" |
| Day 4 body | Aswan is Egypt's southernmost major city, where the Nile narrows toward the first cataract. | essay 000000000015: "Aswan is Egypt's southernmost major city, where the Nile narrows toward the first cataract" |
| Day 4 body | The day takes three sites in sequence. | essay 000000000017 (verbatim) |
| Day 4 body | The Aswan High Dam, completed in 1970, reshaped modern Egypt's agriculture and economy and created Lake Nasser. | essay 000000000017: "The Aswan High Dam, completed in 1970, is the engineering project that reshaped modern Egypt's agriculture and economy, and that created Lake Nasser" |
| Day 4 body | The Unfinished Obelisk, still lying in its quarry where a crack forced its abandonment, shows precisely how obelisks were carved from the living rock. | essay 000000000017: "The Unfinished Obelisk, still lying in its quarry where a crack forced its abandonment … it shows precisely how obelisks were carved from the living rock." |
| Day 4 body | Philae Temple, dedicated to Isis, was dismantled and reassembled on higher ground in the 1970s to save it from the rising waters. | essay 000000000017: "The Philae Temple, dedicated to Isis … was dismantled and reassembled on higher ground in the 1970s to save it from the waters rising behind the new dam." |
| Day 4 body | It now sits on Agilkia Island, reached by a short boat crossing. | essay 000000000017: "It now sits on Agilkia Island, reached by a short boat crossing" |
| Day 4 body | Tonight is spent in a hotel in Aswan. | essay 000000000017: "Tonight is spent in a hotel in Aswan" |
| Day 4 The day | Aswan High Dam · Unfinished Obelisk · Philae Temple | essay 000000000017; itin day 4 title |
| Day 4 Overnight | Aswan hotel | itin day 4 overnight "Aswan hotel" |
| Day 4 Meals | Breakfast (on the train) · lunch · dinner | essay 000000000015 "you wake on the train to breakfast"; inclusion sw40fimxwz "full board" |
| Day 4 Travel | Arrive by sleeper train · private air-conditioned transfers · short boat crossing to Philae | essay 000000000015 "you wake on the train"; inclusion w9xm71zp9w; essay 000000000017 "reached by a short boat crossing" |
| Day 4 Pace | (empty) | no pace statement in the essay — see owner-input |
| Day 5 place/title | Aswan · on the Nile · Boarding the Nile cruise | itin day 5 "Board your Nile cruise"; essay 00000000001b |
| Day 5 body | After breakfast you board your Nile cruise, a vessel with a pool deck, a spa and onboard entertainment, moving at the river's pace. | essay 00000000001b: "After breakfast you board your Nile cruise — a vessel with a pool deck, a spa, and onboard entertainment, moving at the river's pace." |
| Day 5 body | It will carry you for three nights. | essay 00000000001b: "The cruise will carry you for three nights" |
| Day 5 body | The day is deliberately unstructured, and there are no sites on the programme. | essay 00000000001b: "The day is deliberately unstructured. There are no sites on the programme" |
| Day 5 body | After two full days in Cairo and a day of Aswan monuments, a day of open water, fine dining and the riverbanks drifting past is a recalibration, not a gap in the itinerary. | essay 00000000001b: "after two full days in Cairo and a day of Aswan monuments, a day of open water, fine dining, and the riverbanks drifting past is not a gap in the itinerary but a recalibration" |
| Day 5 body | This first afternoon is for settling in. | essay 00000000001b: "this first afternoon is for settling into it" |
| Day 5 Overnight | Cruise | itin day 5 overnight "Cruise" |
| Day 5 Meals | Breakfast · lunch · dinner | essay 00000000001b "After breakfast"; owner-confirmed cruise rule (lunch first on embarkation day); inclusion sw40fimxwz "full board" |
| Day 5 Travel | Private air-conditioned transfer to the ship · by cruise | inclusion w9xm71zp9w "private air-conditioned transfers throughout"; essay 00000000001b "you board your Nile cruise" |
| Day 5 Pace | Deliberately unstructured, with no sites on the programme | essay 00000000001b: "The day is deliberately unstructured. There are no sites on the programme" |
| Day 6 place/title | On the Nile: Kom Ombo → Edfu · The temples of Kom Ombo and Edfu | itin day 6 "Kom Ombo and Edfu"; route leg via ["Kom Ombo","Edfu"] |
| Day 6 body | The cruise moves north to the heart of its monument programme. | essay 00000000001d: "Day six is the heart of the cruise's monument programme, and it moves north." |
| Day 6 body | The first stop is Kom Ombo, a temple dedicated to two deities at once: Sobek, the crocodile god, and Horus the Elder, the hawk-headed sky god. | essay 00000000001d: "The first stop is Kom Ombo, a temple unusual in Egypt for being dedicated to two deities simultaneously: Sobek, the crocodile god, and Horus the Elder — the hawk-headed sky god" |
| Day 6 body | It is laid out in perfect bilateral symmetry, each half a mirror of the other, to honour both cults equally. | essay 00000000001d: "The temple is laid out in perfect bilateral symmetry, each half a mirror of the other, to honour both cults equally." |
| Day 6 body | From Kom Ombo the cruise continues to Edfu and the Temple of Horus, the best-preserved temple in Egypt, its walls, roof, inner sanctuary and pylons largely intact. | essay 00000000001f: "From Kom Ombo the cruise continues to Edfu, home to the Temple of Horus — the best-preserved temple in Egypt, its walls, roof, inner sanctuary, and pylons largely intact." |
| Day 6 body | Built between roughly 237 and 57 BC, it shows how a functioning temple operated more clearly than almost any other site. | essay 00000000001f: "gives a clearer picture of how a functioning temple actually operated than almost any other site in the country. It was built during the Ptolemaic period, between roughly 237 and 57 BC" |
| Day 6 body | Dinner is on board as the cruise continues toward Luxor. | essay 00000000001f: "Dinner is taken onboard as the cruise continues toward Luxor." |
| Day 6 The day | Temple of Kom Ombo · Temple of Horus at Edfu | essay 00000000001d, 00000000001f |
| Day 6 Overnight | Cruise | itin day 6 overnight "Cruise" |
| Day 6 Meals | Breakfast · lunch · dinner | inclusion sw40fimxwz "full board"; essay 00000000001f "Dinner is taken onboard" |
| Day 6 Travel | By cruise | essay 00000000001f "the cruise continues to Edfu"; route leg mode nile_cruise |
| Day 6 Pace | (empty) | no pace statement — see owner-input |
| Day 7 place/title | Luxor · East Bank · Karnak, Luxor Temple and the Avenue of Sphinxes | itin day 7 "Luxor East Bank: Karnak, Luxor Temple"; essay 000000000023 |
| Day 7 body | The cruise arrives in Luxor, ancient Thebes, the religious capital of the New Kingdom, and the day is given to the East Bank. | essay 000000000023: "On day seven the cruise arrives in Luxor — ancient Thebes, the religious capital of the New Kingdom — and the day is given to the East Bank." |
| Day 7 body | Karnak is a complex of temples, sanctuaries, pylons and processional avenues, built and enlarged by successive pharaohs across roughly 1,500 years. | essay 000000000023: "It is a complex of temples, sanctuaries, pylons, and processional avenues built and enlarged by successive pharaohs across roughly 1,500 years" |
| Day 7 body | Its Great Hypostyle Hall, a forest of 134 columns with the tallest rising to 21 metres, rewards slow walking, which the day's pace allows. | essay 000000000023: "Its Great Hypostyle Hall — a forest of 134 columns, the tallest rising to 21 metres … It rewards slow walking, which this day's pace allows." |
| Day 7 body | Luxor Temple is Karnak's smaller, architecturally refined counterpart, and the remains of the Avenue of Sphinxes once connected the two over two kilometres. | essay 000000000023: "Luxor Temple, the smaller but architecturally refined counterpart to Karnak, and the remains of the Avenue of Sphinxes that once connected the two complexes over two kilometres" |
| Day 7 body | In the evening there is free time aboard the cruise or in the town, with the West Bank cliffs going gold across the water at dusk. | essay 000000000023: "In the evening there is free time aboard the cruise or in the town, with the West Bank's limestone cliffs going gold across the water at dusk." |
| Day 7 The day | Karnak Temple · Luxor Temple · Avenue of Sphinxes | essay 000000000023 |
| Day 7 Overnight | Cruise | itin day 7 overnight "Cruise" |
| Day 7 Meals | Breakfast · lunch · dinner | inclusion sw40fimxwz "full board"; cruise full day |
| Day 7 Travel | By cruise to Luxor · private air-conditioned transfers | essay 000000000023 "the cruise arrives in Luxor"; inclusion w9xm71zp9w |
| Day 7 Pace | Unhurried at Karnak, with free time in the evening | essay 000000000023: "It rewards slow walking, which this day's pace allows"; "In the evening there is free time" |
| Day 8 place/title | Luxor · West Bank → Cairo · The Valley of the Kings, the Temple of Hatshepsut and the Colossi of Memnon, then the flight to Cairo | itin day 8 "West Bank, flight back to Cairo"; essay 000000000025 |
| Day 8 Morning (label) | "Morning" | essay 000000000025: "Day eight is for the West Bank … and it deserves the morning it gets"; "In the afternoon you disembark" |
| Day 8 Morning | The West Bank is where the New Kingdom pharaohs buried their dead. | essay 000000000025: "the West Bank, where the New Kingdom pharaohs buried their dead" |
| Day 8 Morning | The Valley of the Kings holds more than sixty royal tombs cut into the desert hills, their corridors and burial chambers painted with scenes of the afterlife. | essay 000000000025: "The Valley of the Kings holds more than sixty royal tombs cut into the desert hills, their corridors and burial chambers painted with dense scenes of the afterlife." |
| Day 8 Morning | Tutankhamun's tomb is here, modest in scale, along with the grander tombs of Ramses VI, Seti I and the Thutmosid rulers. | essay 000000000025: "Tutankhamun's tomb is here — modest in scale … but the grander tombs of Ramses VI, Seti I, and the Thutmosid rulers" |
| Day 8 Morning | The Mortuary Temple of Hatshepsut rises in three colonnaded terraces against the cliff at Deir el-Bahari. | essay 000000000025: "The Mortuary Temple of Hatshepsut rises in three colonnaded terraces against the cliff at Deir el-Bahari" |
| Day 8 Morning | The Colossi of Memnon, two seated quartzite figures of Amenhotep III eighteen metres tall, are the only visible remains of what was once the largest mortuary temple in Thebes. | essay 000000000025: "The Colossi of Memnon, two seated quartzite figures of Amenhotep III standing eighteen metres tall, are the only visible remains of a mortuary temple that was, in its time, the largest in Thebes." |
| Day 8 Afternoon | You disembark and transfer to Luxor Airport for the short domestic flight back to Cairo, where your driver meets you and takes you to your hotel for the night. | essay 000000000025: "In the afternoon you disembark and transfer to Luxor Airport for the short domestic flight back to Cairo, where your driver meets you and takes you to your hotel for the night." |
| Day 8 The day | Valley of the Kings · Mortuary Temple of Hatshepsut · Colossi of Memnon | essay 000000000025 |
| Day 8 Overnight | Cairo | itin day 8 overnight "Cairo" |
| Day 8 Meals | Breakfast (on the cruise) · lunch · dinner | owner-confirmed cruise rule (breakfast last on disembarkation day); inclusion sw40fimxwz "full board" (lunch/dinner placement: see owner-input) |
| Day 8 Travel | Transfer to Luxor Airport · domestic flight Luxor → Cairo · met by your driver and taken to your hotel | essay 000000000025 (as above); inclusion tiv8ly8xwz "a Luxor–Cairo domestic flight" |
| Day 8 Pace | (empty) | no pace statement — see owner-input |
| Day 9 place/title | Memphis, Saqqara and Dahshur → Cairo · Memphis, Saqqara, Dahshur and a Nile dinner cruise | itin day 9 "Memphis, Saqqara, Dahshur and dinner cruise" |
| Day 9 body | The final full day reaches back to the beginning of pyramid building. | essay 000000000029: "Day nine, the final full day, reaches back to the very beginning of the pyramid-building sequence." |
| Day 9 body | Memphis was the first capital of a unified Egypt, established around 3100 BC, and its open-air museum holds the colossal fallen statue of Ramses II. | essay 000000000029: "Memphis was the first capital of a unified Egypt, established around 3100 BC, and its open-air museum holds the colossal fallen statue of Ramses II" |
| Day 9 body | At Saqqara stands the Step Pyramid of Djoser, built around 2650 BC by the architect Imhotep, the oldest large stone structure in the world. | essay 000000000029: "Saqqara … holds the Step Pyramid of Djoser — the oldest large stone structure in the world, built around 2650 BC by the architect Imhotep" |
| Day 9 body | At Dahshur, the Bent Pyramid and the Red Pyramid show the architects learning to manage the angles of the smooth-sided pyramid. | essay 000000000029: "the smooth-sided pyramid came later, worked out by trial and adjustment at Dahshur, where the Bent Pyramid and the Red Pyramid record the architects learning — visibly, in stone — how to manage the angles" |
| Day 9 body | The rest of the day is yours, deliberately: revisit a Cairo site, explore on your own, or use the hotel pool. | essay 00000000002b: "The rest of the day belongs to you. … this is deliberate. You can return to any Cairo site that deserved more time … or explore on your own … or the hotel pool" |
| Day 9 body | The day ends with a dinner cruise on the Nile, the lit city moving past the windows. | essay 00000000002b: "The day ends with a dinner cruise on the Nile in Cairo, the lit city moving past the windows" |
| Day 9 The day | Memphis open-air museum · Step Pyramid of Djoser · Saqqara · Bent Pyramid · Red Pyramid · Nile dinner cruise | essay 000000000029, 00000000002b |
| Day 9 Overnight | Cairo | itin day 9 overnight "Cairo"; essay 00000000002b "The night is spent at your Cairo hotel" |
| Day 9 Meals | Breakfast · lunch · farewell Nile dinner cruise | inclusion sw40fimxwz "full board"; inclusion xzh3yuxliq "a farewell Nile dinner cruise in Cairo" |
| Day 9 Travel | Private air-conditioned transfers | inclusion w9xm71zp9w |
| Day 9 Pace | Sightseeing, then the rest of the day free by design | essay 00000000002b: "The rest of the day belongs to you. The programme makes no further demands … this is deliberate." |
| Day 10 place/title | Cairo · Departure | itin day 10 "Departure" |
| Day 10 body | A final breakfast and the transfer to Cairo International Airport. | essay 00000000002f: "Day ten is the departure: a final breakfast and the transfer to Cairo International Airport" |
| Day 10 body | With a later flight there is room for additional arrangements, so your last hours in Egypt are not spent in a terminal. | essay 00000000002f: "with later flights giving room for additional arrangements so the last hours in Egypt are not spent in a terminal" |
| Day 10 Overnight | — (null) | itin day 10 overnight null |
| Day 10 Meals | Breakfast | essay 00000000002f "a final breakfast" |
| Day 10 Travel | Transfer to Cairo International Airport | inclusion e84cx8c70d "Transfer to Cairo International Airport on departure" |
| Day 10 Pace | (empty) | no pace statement — see owner-input |
| Stay: hotels | Five nights in carefully selected five-star hotels: four in Cairo and one in Aswan. | inclusion 07gxo6cnwn "Five nights in carefully selected five-star hotels"; itin overnights days 1, 2, 8, 9 "Cairo", day 4 "Aswan hotel"; essay 000000000037 "5 hotel nights" |
| Stay: river | Three nights aboard a five-star cruise vessel with onboard pool, spa and entertainment, sailing from Aswan to Luxor via Kom Ombo and Edfu. | inclusion 0kz914duu4 "three nights aboard a five-star cruise vessel with onboard pool, spa, and entertainment"; route leg Aswan → Luxor via Kom Ombo, Edfu |
| Stay: river | A traditional felucca sail at Aswan and a farewell Nile dinner cruise in Cairo are included. | inclusions rvuf6p3kmr "a traditional felucca sail at Aswan", xzh3yuxliq "a farewell Nile dinner cruise in Cairo" |
| Stay: train | One overnight train journey from Cairo to Aswan, with dinner on board and breakfast on waking. | inclusion 7w1k8punsi "one overnight train journey (Cairo to Aswan, with dinner onboard)"; essay 000000000015 "you wake on the train to breakfast" |
| Stay: flight | A domestic flight from Luxor back to Cairo. | inclusion tiv8ly8xwz "a Luxor–Cairo domestic flight" |
| Stay: every day | A licensed English-speaking Egyptologist at every site, private air-conditioned transfers throughout, and full board. | inclusions g41tygfgl5, w9xm71zp9w, sw40fimxwz (verbatim wording) |
| Stay: every day | The trip is private, operated for your party alone and never shared with a group. | essay 00000000002f: "This is a private departure — operated for your party alone, never a shared group."; tourMode "private" |
| Fit for | are visiting Egypt for the first time and want the country in proper depth | audience: "First-timers wanting the country in proper depth" |
| Fit for | prefer a cruise to repeated hotel moves | audience: "travellers who prefer the cruise to repeated hotel moves" |
| Fit for | want the river itself to be the point | audience: "anyone for whom the river itself is the point" |
| Worth knowing | Day 2 is the most demanding day of the trip, and it starts early. | essay 000000000011 "The second day is the most demanding of the trip"; essay 00000000000f "tomorrow starts early" |
| Worth knowing | Day 5 is deliberately unstructured: no sites, just settling into the cruise. | essay 00000000001b "The day is deliberately unstructured. There are no sites on the programme … this first afternoon is for settling into it" |
| Worth knowing | The pace is full but not punishing. | essay 00000000002f: "The pace is full but not punishing" |
| Worth knowing | The free part of Day 9 is built in as recovery, not padding. | essay 00000000002f: "with free time after the cruise built in as recovery rather than padding"; essay 00000000002b (Day 9 "The rest of the day belongs to you … this is deliberate"). Mapping to Day 9 is an inference — see owner-input |
| Worth knowing | On Day 10, a later flight leaves room for additional arrangements before the airport. | essay 00000000002f: "with later flights giving room for additional arrangements" |
| Make it yours intro | This is a private journey, built around your party. Common changes: | concierge: "A private journey is built around your party, not the other way around." |
| Option | Add Abu Simbel at Aswan | opts[0] "Add Abu Simbel at Aswan" |
| Option | Swap the Tahrir museum for the Grand Egyptian Museum or the National Museum of Egyptian Civilisation | opts[1] "Swap the Tahrir museum for the GEM or NMEC" (names spelled out per essay 000000000011) |
| Option | Add a hot-air balloon over the West Bank | opts[2]; concierge "a hot-air balloon over the West Bank" |
| Option | Fly south instead of taking the sleeper train | opts[3] "Fly south instead of the sleeper train" |
| Optional on this day | (none) | the product has no exclusion rows (`excl` is empty), so no day extras and `excludedSeeDay` is empty — see owner-input |

### Essay block → where it appears

| _key | style | Where |
|---|---|---|
| 000000000001 | h2 | dropped (heading) |
| 000000000003 | normal | whyRouteRefs (intro; source of Opening) |
| 000000000005 | normal | whyRouteRefs (intro; source of Opening) |
| 000000000007 | normal | whyRouteRefs (route logic) |
| 000000000009 | normal | whyRouteRefs (route logic) |
| 00000000000b | normal | whyRouteRefs (route logic: the cruise as centre) |
| 00000000000d | h3 | dropped (heading) |
| 00000000000f | normal | Day 1 narrativeRefs |
| 000000000011 | normal | Day 2 narrativeRefs |
| r2day3 | normal | Day 3 narrativeRefs |
| 000000000013 | h3 | dropped (heading) |
| 000000000015 | normal | Day 4 narrativeRefs |
| 000000000017 | normal | Day 4 narrativeRefs |
| 000000000019 | h3 | dropped (heading) |
| 00000000001b | normal | Day 5 narrativeRefs |
| 00000000001d | normal | Day 6 narrativeRefs |
| 00000000001f | normal | Day 6 narrativeRefs |
| 000000000021 | h3 | dropped (heading) |
| 000000000023 | normal | Day 7 narrativeRefs |
| 000000000025 | normal | Day 8 narrativeRefs |
| 000000000027 | h3 | dropped (heading) |
| 000000000029 | normal | Day 9 narrativeRefs |
| 00000000002b | normal | Day 9 narrativeRefs |
| 00000000002d | h3 | dropped (heading) |
| 00000000002f | normal | Day 10 narrativeRefs (departure; also source of stayAndTravel and worthKnowing) |
| 000000000031 | normal | closingRef |
| 000000000033 | normal | whyRouteRefs ("The shape of the journey" label line) |
| 000000000035 | bullet | whyRouteRefs (shape of the journey) |
| 000000000037 | bullet | whyRouteRefs (shape of the journey) |
| 000000000039 | bullet | whyRouteRefs (shape of the journey) |

All 23 non-heading blocks land exactly once; no day uses continuesInDay.

Guide links: not proposed here (no guide-page index supplied); every site in "The day" rows is currently unmatched.

Note for reviewer: Day 8 afternoon segment (29 words), Day 9 second paragraph (38 words) and Day 10 (32 words) are below 60 words; Day 10 is a departure day and the essay has no further facts for the other two. Day 9's two paragraphs total 120 words.

---

## 10-day-egypt-travel-journey-through-history

_id: `wp-page-156539` · https://travel2egypt.org/10-day-egypt-travel-journey-through-history

Note: this product has **no exclusions** (`excl` is empty) and no FAQ or access note, so no "Optional on this day" rows and no "see Day" links were produced. `stayAndTravel.road` is an extra key (the schema has no road slot; this product's road journeys are an inclusion).

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Opening | A private ten-day journey through Cairo's older layers, Alexandria, Abu Simbel and the temples of Luxor, with the pyramids, the Sphinx and the Egyptian Museum reserved for the closing day. | "A private journey through Cairo's older layers, Alexandria, Abu Simbel, and the temples of Luxor — with the pyramids, the Sphinx, and the Egyptian Museum reserved for the closing day" (essay 000000000003) |
| Opening | Most Egypt itineraries open with Giza; this one does not. | "Most Egypt itineraries open with Giza." (000000000005) + "This one does not." (000000000007) |
| Opening | You see the country first, then the headline. | "You see the country first; then the headline." (000000000007) |
| Why route | Arriving at Giza on day one risks turning everything that follows into descent, so the route is built around a reversal. | "arriving on day one risks turning everything that follows into descent" (000000000007); "The route is built around that reversal." (000000000009) |
| Why route | Cairo opens not at Giza but at the layers around it: the first capital at Memphis, the earliest pyramid at Saqqara, the Coptic churches inside the Roman Babylon Fortress, and the Citadel of Saladin. | "Cairo opens not at Giza but at the layers around it: the first capital at Memphis, the earliest pyramid at Saqqara, the Coptic churches inside the Roman Babylon Fortress, and the medieval Citadel of Saladin" (000000000009) |
| Why route | Alexandria gets day three, while you are still fresh and before the deeper south claims your attention. | same words (000000000009) |
| Why route | A morning flight takes you to Aswan and the road to Abu Simbel; Luxor follows, with two days on either side of the river and a sunrise hot air balloon over the West Bank. | "A morning flight on day four carries you to Aswan" (000000000019); "Aswan and Abu Simbel get a long climb to the Nubian shore. Luxor follows, with two days on either side of the river and a sunrise hot air balloon over the West Bank." (000000000009) |
| Why route | The sleeper train carries you north for a single closing day: the pyramids, the Egyptian Museum on Tahrir, Khan el-Khalili and Al-Muizz Street. | "The sleeper train carries you north for a single charged closing day: the pyramids, the Egyptian Museum on Tahrir, Khan el-Khalili, and Al-Muizz Street." (000000000009) |
| Closing | Ten days that save for last what most itineraries put first. By the time you reach Giza, you have seen the country that produced it. | "Ten days that save for last what most itineraries put first. … by the time you reach Giza, you have seen the country that produced it." (00000000002b) |
| D1 title | Arrival, airport transfer and hotel check-in | itin day 1 "Arrival in Cairo"; inclusion "Airport transfer and hotel check-in on arrival" |
| D1 body | Day one is given to arrival: an airport transfer, hotel check-in and a gentle introduction to Cairo's atmosphere. | "Day one is given to arrival. Airport transfer, hotel check-in, and a gentle introduction to Cairo's atmosphere" (00000000000d) |
| D1 body | The city is loud and layered, and not best met after a long flight, so there's no sightseeing today. | "the city is loud, layered, and not best met after a long flight" (00000000000d); "no sightseeing" = day given to arrival only (00000000000d) |
| D1 body | The first evening is for rest. | same (00000000000d) |
| D1 overnight | Cairo hotel | itin day 1 overnight "Cairo"; "hotel check-in" (00000000000d) |
| D1 travel | Private airport transfer and hotel check-in | inclusions "Airport transfer and hotel check-in on arrival", "Private transfers throughout" |
| D1 pace | Gentle; the first evening is for rest | "a gentle introduction… The first evening is for rest." (00000000000d) |
| D2 title | Memphis, Saqqara, the Coptic quarter and the Citadel | itin day 2 "Memphis, Saqqara, Coptic quarter, Citadel" |
| D2 morning | The day reaches south of the city to where pyramid-building began. | "The second day reaches south of the city to where pyramid-building began." (00000000000f) |
| D2 morning | Memphis was the first capital of a unified Egypt, and its open-air museum keeps the colossal fallen statue of Ramses II and the great alabaster sphinx. | "Memphis was the first capital of a unified Egypt, and its open-air museum preserves the colossal fallen statue of Ramses II and the great alabaster sphinx." (00000000000f) |
| D2 morning | At Saqqara stands the Step Pyramid of Djoser, built around 2650 BC under the architect Imhotep: the oldest large stone structure in the world, and the building in which the pyramid form was invented. | "Saqqara holds the Step Pyramid of Djoser, built around 2650 BC under the architect Imhotep — the oldest large stone structure in the world, and the building in which the pyramid form was invented." (00000000000f) |
| D2 afternoon | Back in central Cairo, the Coptic quarter: the Hanging Church, suspended above the gatehouse of Babylon Fortress, the fifth-century Coptic Orthodox church of Saint Sergius, and the Ben Ezra Synagogue, one of the oldest in Egypt. | "The afternoon returns to central Cairo for the Coptic quarter — the Hanging Church suspended above the gatehouse of Babylon Fortress, the fifth-century Coptic Orthodox church of Saint Sergius, and the Ben Ezra Synagogue, one of the oldest in Egypt" (00000000000f) |
| D2 afternoon | Then up to the Citadel of Saladin on the Muqattam hills, begun in 1176 to defend Cairo and Fustat, with the nineteenth-century Mosque of Muhammad Ali at its centre. | "climbs to the Citadel of Saladin on the Muqattam hills, with the nineteenth-century Mosque of Muhammad Ali at its centre. The Citadel was begun in 1176 to defend Cairo and Fustat" (00000000000f) |
| D2 afternoon | From its walls the modern city unfolds in every direction. | same (00000000000f) |
| D2 sites | Memphis · Saqqara · Step Pyramid of Djoser · Hanging Church · Church of Saint Sergius · Ben Ezra Synagogue · Citadel of Saladin · Mosque of Muhammad Ali | 00000000000f |
| D2 overnight | Cairo hotel | itin day 2 "Cairo" |
| D2 travel | Private transfers | inclusion "Private transfers throughout" |
| D2 pace | A deliberately full day | "It is a deliberately full day" (00000000000f) |
| D3 title | Kom el-Shoqafa, Pompey's Pillar, the Greco-Roman Museum and the Bibliotheca Alexandrina | 000000000015; itin day 3 "Desert highway north to Alexandria" |
| D3 body | The desert highway runs north to Alexandria, founded by Alexander the Great in 331 BC and, under the Ptolemies, the intellectual capital of the ancient world. | "The third day takes the desert highway north to Alexandria — the city Alexander the Great founded in 331 BC and that, under the Ptolemies, became the intellectual capital of the ancient world." (000000000013) |
| D3 body | It feels Mediterranean rather than Nilotic, Greek and Roman in its architectural memory. | "Alexandria has always felt different from the rest of Egypt: Mediterranean rather than Nilotic, Greek and Roman in its architectural memory" (000000000013) |
| D3 body | The Catacombs of Kom el-Shoqafa, a Roman-era burial complex of the first century AD, blend Egyptian, Greek and Roman traditions in a single underground space. | "The Catacombs of Kom el-Shoqafa, a Roman-era burial complex of the first century AD, show Egyptian, Greek, and Roman artistic traditions blending in a single underground space." (000000000015) |
| D3 body | Pompey's Pillar, actually a column raised in honour of Diocletian in AD 297, stands above the ancient acropolis. | same (000000000015) |
| D3 body | The Greco-Roman Museum holds the city's classical antiquities, and the Bibliotheca Alexandrina, built on the site of the ancient library, is a tilted disc of Aswan granite inscribed with scripts from around the world. | "The Greco-Roman Museum holds the city's classical antiquities. And the modern Bibliotheca Alexandrina, built on the site of the ancient library… a tilted disc of Aswan granite inscribed with scripts from around the world." (000000000015) |
| D3 body | Lunch is seafood on the waterfront, and you return to Cairo in the evening. | "Lunch is seafood on the waterfront. You return to Cairo in the evening." (000000000015) |
| D3 sites | Catacombs of Kom el-Shoqafa · Pompey's Pillar · Greco-Roman Museum · Bibliotheca Alexandrina | 000000000015 |
| D3 overnight | Cairo hotel | itin day 3 "Cairo"; "You return to Cairo in the evening." (000000000015) |
| D3 meals | Lunch (seafood on the waterfront) | "Lunch is seafood on the waterfront." (000000000015) |
| D3 travel | Private transfers by the desert highway, Cairo → Alexandria, returning to Cairo in the evening | "takes the desert highway north to Alexandria" (000000000013); "You return to Cairo in the evening" (000000000015); inclusion "Private transfers throughout" |
| D3 pace | A comfortable pace | "The tour covers the major landmarks at a comfortable pace." (000000000015) |
| D4 title | Flight to Aswan, the High Dam and Philae Temple | itin day 4 "Morning flight to Aswan"; 000000000019 |
| D4 body | A morning flight takes you south to Aswan, Egypt's southernmost major city: golden light, granite outcrops, Nubian culture and a calm Nile after the urgency of Cairo. | "A morning flight on day four carries you to Aswan — the southernmost major city of Egypt, with golden light, granite outcrops, Nubian culture, and a calm Nile after the urgency of Cairo." (000000000019) |
| D4 body | The first stop is the High Dam, completed in 1970, which reshaped the hydrology of Egypt and created the largest artificial lake in the world, at the cost of submerged Nubian villages, lost annual sediment and relocated monuments. | "The first stop is the High Dam, completed in 1970, which reshaped the hydrology of Egypt and created the largest artificial lake in the world. … the costs — submerged Nubian villages, lost annual sediment, the relocation of monuments" (000000000019) |
| D4 body | In the afternoon a short boat ride crosses to Philae Temple on Agilkia Island, moved there between 1972 and 1980 to save it from rising water. | "The afternoon crosses by short boat ride to Philae Temple, on its current home on Agilkia Island after the relocation between 1972 and 1980 that saved it from rising water." (000000000019) |
| D4 body | Dedicated to Isis, it was one of the goddess's last functioning sanctuaries, closed by Byzantine decree only in the sixth century AD. | same (000000000019) |
| D4 sites | Aswan High Dam · Philae Temple | 000000000019 |
| D4 overnight | Aswan hotel | itin day 4 "Aswan"; inclusion "5-star accommodation throughout" |
| D4 travel | Morning domestic flight Cairo → Aswan · private transfers · short boat ride to Philae | inclusion "Domestic flight Cairo–Aswan"; "A morning flight on day four" + "short boat ride" (000000000019); inclusion "Private transfers throughout" |
| D5 title | The road to the Abu Simbel temples | itin day 5 "The road to Abu Simbel" |
| D5 body | The road to Abu Simbel runs roughly 280 km south of Aswan, along the western shore of Lake Nasser through open Nubian desert. | same (00000000001b) |
| D5 body | Ramses II had the two temples carved directly into a sandstone cliff in the thirteenth century BC: the Great Temple, fronted by four seated figures of the king each twenty metres high, and the smaller Temple of Nefertari. | "a pair of temples Ramses II had carved directly into a sandstone cliff in the thirteenth century BC — the Great Temple, fronted by four colossal seated figures of the king each twenty metres high, and the smaller Temple of Nefertari" (00000000001b) |
| D5 body | Between 1964 and 1968, with Lake Nasser rising, an international campaign cut them into 807 numbered blocks and rebuilt them 65 metres higher and 200 metres back from the water. | "between 1964 and 1968, with the rising waters of Lake Nasser threatening to submerge the complex, an international campaign cut the temples into 807 numbered blocks and reassembled the entire structure 65 metres higher and 200 metres back from the water" (00000000001b) |
| D5 body | The sanctuary still illuminates twice a year, around 22 February and 22 October. | "the sanctuary still illuminates twice a year, around 22 February and 22 October" (00000000001b) |
| D5 body | The drive then returns to Aswan for a restful evening. | "After the visit, the drive returns to Aswan for a restful evening." (00000000001b) |
| D5 sites | Great Temple of Abu Simbel · Temple of Nefertari | 00000000001b |
| D5 overnight | Aswan hotel | itin day 5 "Aswan"; "the drive returns to Aswan" (00000000001b) |
| D5 travel | Road journey Aswan → Abu Simbel, roughly 280 km, and back to Aswan | inclusion "Road journeys Aswan–Abu Simbel and Aswan–Luxor"; "roughly 280 km south of Aswan" (00000000001b) |
| D5 pace | The longest single day of the trip, with a restful evening | "Day five is the longest single day of the trip"; "a restful evening" (00000000001b) |
| D6 title | The road north along the Nile to Luxor | itin day 6 "Travelling day from Aswan to Luxor"; "The road from Aswan to Luxor follows the Nile north" (00000000001f) |
| D6 body | A travelling day. | "Day six is a travelling day." (00000000001f) |
| D6 body | The road from Aswan to Luxor follows the Nile north for roughly four hours. | same (00000000001f) |
| D6 body | There's the option to stop on the way at the Temple of Horus at Edfu, built between 237 and 57 BC and the most completely preserved temple in Egypt, and at the double temple of Kom Ombo, dedicated to Sobek the crocodile god and Horus the Elder at once, with mummified crocodiles in its galleries. | "with the option to stop at the Temple of Horus at Edfu — built during the Ptolemaic period between 237 and 57 BC and the most completely preserved temple in Egypt — and the unusual double temple at Kom Ombo, dedicated to Sobek the crocodile god and Horus the Elder simultaneously, with a remarkable collection of mummified crocodiles in its galleries" (00000000001f) |
| D6 body | You reach Luxor in the afternoon, and the evening is free: ancient Thebes was the religious capital of the New Kingdom, and it deserves a quiet first night. | "You reach Luxor in the afternoon, and the evening is free — ancient Thebes was the religious capital of the New Kingdom, and the city deserves a quiet first night" (00000000001f) |
| D6 sites | (none: Edfu and Kom Ombo are optional) | 00000000001f; opts "Stop at Edfu and Kom Ombo on the drive to Luxor" |
| D6 overnight | Luxor hotel | itin day 6 "Luxor" |
| D6 travel | Road journey Aswan → Luxor, roughly four hours | inclusion "Road journeys … Aswan–Luxor"; "roughly four hours" (00000000001f) |
| D6 pace | A travelling day; the evening is free | 00000000001f |
| D7 title | Sunrise balloon over the West Bank, the Valley of the Kings, Hatshepsut's temple and the Colossi of Memnon | itin day 7 "Hot air balloon over the West Bank"; 000000000021 |
| D7 body | The day starts before dawn with a hot air balloon over the West Bank. | "The seventh day starts before dawn with a hot air balloon over the West Bank." (000000000021) |
| D7 body | Sunrise is the only practical time for ballooning here, as the winds are calmest before the heat builds. | "Sunrise is the only practical time for ballooning here — winds are calmest before the heat builds" (000000000021) |
| D7 body | From above you see the West Bank as a whole: the Valley of the Kings cut into the desert cliffs, Hatshepsut's mortuary temple stepped against the same cliff face, green fields running to the Nile, and the Colossi of Memnon in their farmland. | "From above you see the structure of the West Bank as a whole: the Valley of the Kings cut into the desert cliffs, Hatshepsut's mortuary temple stepped against the same cliff face, the green fields running to the Nile, and the Colossi of Memnon stranded in their farmland." (000000000021) |
| D7 body | Back on the ground, you visit each of those sites: the Valley of the Kings with its painted tombs cut into the limestone, Hatshepsut's three colonnaded terraces at Deir el-Bahri, and the two seated colossi of Amenhotep III that mark what was once the largest mortuary temple in Thebes. | "Back on the ground, the day continues with each of those sites at ground level — the Valley of the Kings with its painted tombs cut into the limestone, Hatshepsut's three colonnaded terraces at Deir el-Bahri, and the two seated colossi of Amenhotep III that mark what was once the largest mortuary temple in Thebes." (000000000021) |
| D7 sites | Hot air balloon over the West Bank · Valley of the Kings · Temple of Hatshepsut · Colossi of Memnon | 000000000021; inclusion "Sunrise hot air balloon over Luxor's West Bank" |
| D7 overnight | Luxor hotel | itin day 7 "Luxor" |
| D7 travel | Private transfers | inclusion "Private transfers throughout" |
| D7 pace | Starts before dawn | "The seventh day starts before dawn" (000000000021) |
| D8 title | Karnak, Luxor Temple and the sleeper train to Cairo | itin day 8 "East Bank and sleeper train"; 000000000023 |
| D8 body | The day crosses to the East Bank, the living side of ancient Thebes. | "The eighth day crosses to the East Bank — the living side of ancient Thebes." (000000000023) |
| D8 body | The main subject is Karnak, the temple complex built and extended by successive pharaohs across roughly 1,500 years. | same (000000000023) |
| D8 body | Its Great Hypostyle Hall has 134 massive columns covering more than 5,000 square metres, the tallest 21 metres high. | "Its Great Hypostyle Hall — 134 massive columns covering more than 5,000 square metres, the tallest 21 metres high" (000000000023) |
| D8 body | Luxor Temple, smaller and more elegant, sits in the heart of the modern city and is best seen in the late afternoon or early evening, when the columns hold warm light. | same (000000000023) |
| D8 body | In the evening you transfer to Luxor railway station for the sleeper train to Cairo: a private cabin with two berths, with dinner and breakfast on board. | "In the evening, the transfer is to Luxor railway station for the sleeper train back to Cairo — a private cabin with two berths, dinner and breakfast served on board" (000000000023) |
| D8 sites | Karnak · Luxor Temple | 000000000023 |
| D8 overnight | Sleeper train | itin day 8 "Sleeper train" |
| D8 meals | Dinner (on the train) | inclusion "Sleeper train Luxor–Cairo, private cabin with two berths, dinner and breakfast on board" |
| D8 travel | Private transfers · transfer to Luxor railway station · overnight sleeper train Luxor → Cairo, private cabin with two berths | 000000000023; inclusions "Private transfers throughout", "Sleeper train Luxor–Cairo, private cabin with two berths" |
| D9 title | Giza, the Egyptian Museum, Khan el-Khalili and Al-Muizz Street | itin day 9 "Giza, Egyptian Museum, Khan el-Khalili"; Al-Muizz Street from 000000000029 / 00000000002f |
| D9 morning | The sleeper train arrives in Cairo in the morning. | same (000000000027) |
| D9 morning | After a hotel transfer and breakfast, the day begins at Giza: the Great Pyramid of Khufu, the Pyramid of Khafre with its remaining apex casing, the smaller Pyramid of Menkaure, and the Sphinx crouched below them, all built around 2500 BC. | "After a hotel transfer and breakfast, the day begins at Giza — the Great Pyramid of Khufu, the Pyramid of Khafre with its remaining apex casing, the smaller Pyramid of Menkaure, and the Sphinx crouched below them. These were built around 2500 BC" (000000000027) |
| D9 morning | By now you have seen Memphis, Saqqara, the temples of Luxor and the Nubian shore, and the pyramids read as the apex of a building tradition you have watched develop. | "By this point in the trip you have seen Memphis, Saqqara, the architecture of the south, the temples of Luxor, and the Nubian shore. The pyramids read against all of that: the apex of a building tradition you have watched develop" (000000000027) |
| D9 afternoon | The afternoon continues to the Egyptian Museum on Tahrir Square, opened in 1902, with pharaonic antiquities from the Narmer Palette to the gold of the Tanis royal tombs. | "The afternoon continues to the Egyptian Museum on Tahrir Square, opened in 1902 and still holding an accumulation of pharaonic antiquity … from the Narmer Palette to the gold of the Tanis royal tombs." (000000000029) |
| D9 afternoon | From there to Khan el-Khalili, the bazaar quarter that has traded continuously since the Mamluk sultan Barquq established it in 1382, and along Al-Muizz Street, the city's medieval spine, lined with mosques, madrasas and Mamluk-era facades. | "From there to Khan el-Khalili, the medieval bazaar quarter that has traded continuously since the Mamluk sultan Barquq established it in 1382, and along Al-Muizz Street, the city's medieval spine, lined with mosques, madrasas, and Mamluk-era facades." (000000000029) |
| D9 sites | Great Pyramid of Khufu · Pyramid of Khafre · Pyramid of Menkaure · Sphinx · Egyptian Museum (Tahrir) · Khan el-Khalili · Al-Muizz Street | 000000000027, 000000000029 |
| D9 overnight | Cairo hotel | itin day 9 "Cairo"; "hotel transfer" (000000000027) |
| D9 meals | Breakfast (on the train) | inclusion "dinner and breakfast on board" (sleeper train). Conflicts with essay "After a hotel transfer and breakfast" (000000000027): see owner-input |
| D9 travel | Arrive by sleeper train · private transfer to the hotel · private transfers | 000000000027; inclusion "Private transfers throughout" |
| D9 pace | A long, charged day | "it is a long, charged one" (000000000027) |
| D10 title | Departure | itin day 10 "Airport transfer for departure flight" |
| D10 body | The final day is the airport transfer for your departure flight. | "The final day, day ten, is the airport transfer for the departure flight." (000000000029) |
| D10 overnight | — (null) | itin day 10 overnight null |
| D10 travel | Private airport transfer for the departure flight | inclusion "Airport transfer for the departure flight"; "Private transfers throughout" |
| Stay: hotels | Five-star accommodation throughout: three nights in Cairo at the start, two in Aswan, two in Luxor, and a final night in Cairo. | inclusion "5-star accommodation throughout"; itin overnights days 1–3 Cairo, 4–5 Aswan, 6–7 Luxor, 9 Cairo |
| Stay: train | The overnight sleeper train from Luxor to Cairo, in a private cabin with two berths, with dinner and breakfast on board. | inclusion "Sleeper train Luxor–Cairo, private cabin with two berths, dinner and breakfast on board" |
| Stay: flight | A morning domestic flight from Cairo to Aswan on day four. | inclusion "Domestic flight Cairo–Aswan"; "A morning flight on day four" (000000000019) |
| Stay: road | Road journeys from Aswan to Abu Simbel and back, and from Aswan to Luxor; a day on the desert highway from Cairo to Alexandria and back. | inclusion "Road journeys Aswan–Abu Simbel and Aswan–Luxor"; 000000000013, 000000000015 |
| Stay: every day | Your own Egyptologist guide and private transfers throughout. | inclusions "Your own Egyptologist guide", "Private transfers throughout" |
| Stay: every day | The journey is fully private: one departure, operated for your party alone. | "One private departure, operated for your party alone" (000000000009); "Fully private" (000000000033) |
| Fit for | are visiting Egypt for the first time and would rather not front-load the pyramids | audience "First-time visitors who want Egypt without front-loading the pyramids" |
| Fit for | prefer the night train to a fifth flight | audience "travellers who prefer the night train over a fifth flight" |
| Fit for | want Giza as the closing experience rather than the opening one | audience "anyone who wants Giza as the closing experience rather than the opening one" |
| Worth knowing | Day 2 is deliberately full: Memphis, Saqqara, the Coptic quarter and the Citadel in one day. | "It is a deliberately full day" (00000000000f); itin day 2 title |
| Worth knowing | Day 5 is the longest single day of the trip, with the road to Abu Simbel running roughly 280 km south of Aswan and back. | "Day five is the longest single day of the trip … roughly 280 km south of Aswan … the drive returns to Aswan" (00000000001b) |
| Worth knowing | Day 6 is a travelling day, roughly four hours by road from Aswan to Luxor. | "Day six is a travelling day. The road from Aswan to Luxor follows the Nile north for roughly four hours" (00000000001f) |
| Worth knowing | Day 7 starts before dawn, for the sunrise balloon. | "The seventh day starts before dawn with a hot air balloon" (000000000021) |
| Worth knowing | Day 9 is long and charged: you arrive by sleeper train in the morning and see Giza, the Egyptian Museum, Khan el-Khalili and Al-Muizz Street the same day. | "it is a long, charged one. The sleeper train arrives in Cairo in the morning" (000000000027); 000000000029 |
| Make it yours intro | A private journey is built around your party, not the other way around. Common changes: | concierge "A private journey is built around your party, not the other way around." |
| Option | Stop at Edfu and Kom Ombo on the drive to Luxor | opts; "with the option to stop at the Temple of Horus at Edfu … and … Kom Ombo" (00000000001f) |
| Option | Add a Nile cruise between Luxor and Aswan | opts; concierge "a Nile cruise added between Luxor and Aswan" |
| Option | Spend more time at Alexandria | opts; concierge "more time at Alexandria" |
| Option | Pace the closing day differently | opts; concierge "the closing day paced differently" |

### Essay block → where it appears

| _key | Style | Destination |
|---|---|---|
| 000000000001 | h2 | dropped (heading) |
| 000000000003 | normal | whyRouteRefs (intro) |
| 000000000005 | normal | whyRouteRefs (intro) |
| 000000000007 | normal | whyRouteRefs (route logic) |
| 000000000009 | normal | whyRouteRefs (route logic) |
| 00000000000b | h3 | dropped (heading) |
| 00000000000d | normal | Day 1 narrativeRefs |
| 00000000000f | normal | Day 2 narrativeRefs |
| 000000000011 | h3 | dropped (heading) |
| 000000000013 | normal | Day 3 narrativeRefs |
| 000000000015 | normal | Day 3 narrativeRefs |
| 000000000017 | h3 | dropped (heading) |
| 000000000019 | normal | Day 4 narrativeRefs |
| 00000000001b | normal | Day 5 narrativeRefs |
| 00000000001d | h3 | dropped (heading) |
| 00000000001f | normal | Day 6 narrativeRefs |
| 000000000021 | normal | Day 7 narrativeRefs |
| 000000000023 | normal | Day 8 narrativeRefs |
| 000000000025 | h3 | dropped (heading) |
| 000000000027 | normal | Day 9 narrativeRefs |
| 000000000029 | normal | Day 9 narrativeRefs (its last sentence covers Day 10; Day 10 has continuesInDay: 9) |
| 00000000002b | normal | closingRef |
| 00000000002d | normal ("The shape of the journey" label) | whyRouteRefs (shape of the journey) |
| 00000000002f | bullet | whyRouteRefs (shape of the journey) |
| 000000000031 | bullet | whyRouteRefs (shape of the journey) |
| 000000000033 | bullet | whyRouteRefs (shape of the journey) |

---

## 9-day-classic-egypt-family-adventure

_id: `wp-page-113005` · https://travel2egypt.org/9-day-classic-egypt-family-adventure

Note: this product has **no exclusions** (`excl: []`), **no FAQ**, **no access note**, **no stored day list** (`itin: []`) and only three inclusions (guide, transfers, bottled water). Day boundaries come from the essay's own sequence ("the first day", "the first afternoon", "the first full day", "the second Luxor day", "the day begins", "the morning brings", "the following morning").

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Opening | A private, family-paced run at Egypt's classic itinerary: Cairo, a Nile cruise from Luxor to Aswan, and Cairo again. | essay 000000000003: "A family-paced run at Egypt's classic itinerary — Cairo, a Nile cruise from Luxor to Aswan, and Cairo again"; "private" from 00000000002f: "This is a private family departure" |
| Opening | What families need is not a simplified Egypt but a paced one, with a structure that alternates intensity with recovery and gives children something to do with their hands as well as their eyes. | essay 000000000005: "What families actually need is not a simplified Egypt but a paced one — a structure that alternates intensity with recovery, gives children something to do with their hands as well as their eyes" |
| Why route | The journey moves through three registers: Cairo and the Giza plateau to open, a Nile cruise from Luxor south to Aswan, and a return to Cairo to close. | essay 000000000007: "This itinerary moves through three registers: Cairo and the Giza plateau to open; a Nile cruise from Luxor south to Aswan … and a return to Cairo to close." |
| Why route | The cruise is the spine. | 000000000007: "The cruise is the structural spine" |
| Why route | It moves you between Luxor, Edfu, Kom Ombo and Aswan without repacking a suitcase each night, and its onboard downtime (pool, cooking class, hieroglyphics workshop) makes the shore days sustainable for children. | 000000000007: "it handles the logistics of moving between Luxor, Edfu, Kom Ombo, and Aswan without repacking a suitcase each night, and it provides the onboard downtime (pool, cooking class, hieroglyphics workshop) that makes the shore days sustainable"; 00000000002f: "sustainable for children" |
| Why route | Sailing from Luxor to Aswan, you travel upstream against the current and meet the temples roughly in the order their builders understood: the state religion of Thebes first, then the older sites further south, arriving at Aswan, the edge of the ancient Egyptian world, at the end. | 000000000007: "The route is Luxor-to-Aswan, which means you travel upstream against the current and meet the temples in roughly the order their builders understood: the state religion of Thebes first, then the older sites further south, arriving at Aswan — the edge of the ancient Egyptian world — at the end rather than the beginning." |
| Closing line | Nine days is not enough to exhaust Egypt. Done this way, it is enough to give a family a version of the country they will not need to correct later. | essay 000000000031 (verbatim) |
| Day 1 place/title | Cairo · Arrival, the Giza plateau, the Grand Egyptian Museum and the Sound and Light Show | 00000000000b "met at Cairo International Airport … the first day moves into its main business: the Giza plateau"; 00000000000d "The afternoon moves to the Grand Egyptian Museum"; 00000000000f "the Sound and Light Show at the pyramids closes the day" |
| Day 1 morning | You're met at Cairo International Airport and transferred to your hotel, and the first day moves straight to its main business: the Giza plateau. | 00000000000b: "You are met at Cairo International Airport and transferred to your hotel, and the first day moves into its main business: the Giza plateau". Label "morning" inferred from 00000000000d "The afternoon moves to…" (see owner-input) |
| Day 1 morning | The three pyramids of Khufu, Khafre and Menkaure stand above the desert beside the Great Sphinx. | 00000000000b: "the three pyramids of Khufu, Khafre, and Menkaure stand above the desert beside the Great Sphinx" |
| Day 1 morning | Built around 2500 BC, they are not the oldest monuments in Egypt, but they set the terms of every visit. | 00000000000b: "Built around 2500 BC, these are not the oldest monuments in Egypt but they are the ones that set the terms of every visit." |
| Day 1 afternoon | The Grand Egyptian Museum, at the edge of the Giza plateau and a short hop from the pyramids, opened fully on 1 November 2025. | 00000000000d: "the Grand Egyptian Museum, which opened fully on 1 November 2025 at the edge of the Giza plateau — a short hop from the morning's pyramids" |
| Day 1 afternoon | It holds the complete Tutankhamun collection, displayed together for the first time: the gold mask, the nested shrines and the objects packed into his tomb. | 00000000000d: "now holds the complete Tutankhamun collection: the gold mask, the nested shrines, and the objects packed into a tomb … displayed together for the first time" |
| Day 1 afternoon | The original Egyptian Museum on Tahrir Square can be substituted or combined on request. | 00000000000d: "The original Egyptian Museum on Tahrir Square … can be substituted or combined on request." |
| Day 1 evening | As the light goes, the Sound and Light Show at the pyramids closes the day: the plateau narrated against floodlit stone. | 00000000000f: "As the light goes, the Sound and Light Show at the pyramids closes the day … the plateau narrated against floodlit stone" |
| Day 1 evening | It is theatrical, and younger travellers tend to find it memorable. | 00000000000f: "It is theatrical … younger travellers tend to find it memorable." |
| Day 1 the day | Giza pyramids · Great Sphinx · Grand Egyptian Museum · Sound and Light Show at the pyramids | 00000000000b, 00000000000d, 00000000000f |
| Day 1 overnight | Cairo hotel | 00000000000b: "transferred to your hotel" |
| Day 1 meals | (empty) | nothing stated — owner-input |
| Day 1 travel | Meet at Cairo International Airport, private transfer to your hotel | 00000000000b "You are met at Cairo International Airport and transferred to your hotel"; inclusion i28r84lbt8 "Private air-conditioned transfers" |
| Day 1 pace | (empty) | no pace statement |
| Day 2 place/title | Cairo → Luxor · Flight to Luxor and boarding the Nile cruise | 000000000013: "A domestic flight delivers you to Luxor … You transfer to the Nile cruise ship" |
| Day 2 body | A domestic flight takes you to Luxor, the site of ancient Thebes and religious capital of the New Kingdom empire, and you transfer to the Nile cruise ship that will be your home on the river. | 000000000013: "A domestic flight delivers you to Luxor — Egypt's open-air museum, the site of ancient Thebes, religious capital of the New Kingdom empire. You transfer to the Nile cruise ship that will be home for the next four nights." (night count left out — see owner-input) |
| Day 2 body | The first afternoon is given over to the ship: the pool, cultural programmes and the Nile passing the windows, a useful decompression after the density of Cairo. | 000000000013: "The first afternoon is given over to the ship: pool, cultural programmes, the Nile passing the windows, useful decompression after the density of Cairo." |
| Day 2 body | Dinner is on board as the ship begins south. | 000000000013 (verbatim) |
| Day 2 overnight | Nile cruise ship | 000000000013 "the Nile cruise ship that will be home" |
| Day 2 meals | Lunch (first meal on the cruise) · dinner (on board) | lunch: owner-confirmed cruise rule (lunch first on embarkation day); dinner: 000000000013 "Dinner is on board" |
| Day 2 travel | Domestic flight Cairo → Luxor · private transfer to the cruise ship | 000000000013 "A domestic flight delivers you to Luxor … You transfer to the Nile cruise ship"; route leg Cairo→Luxor flight; inclusion i28r84lbt8 "Private air-conditioned transfers" |
| Day 2 pace | An afternoon on board after the density of Cairo | 000000000013: "The first afternoon is given over to the ship … useful decompression after the density of Cairo" |
| Day 3 place/title | Luxor · The West Bank: the Valley of the Kings, Hatshepsut and the Colossi of Memnon | 000000000015 |
| Day 3 morning | The West Bank is the side the ancient Egyptians dedicated to the dead. | 000000000015: "The first full day of temples is on the West Bank, the side the ancient Egyptians dedicated to the dead." |
| Day 3 morning | In the Valley of the Kings, New Kingdom pharaohs were buried from the sixteenth century BC onward, in tombs whose corridors and chambers are still painted with scenes of the journey through the underworld. | 000000000015: "the desert valley in which the New Kingdom pharaohs were buried from the sixteenth century BC onward, their tombs cut into the limestone with corridors and chambers still covered in painted scenes of the journey through the underworld" |
| Day 3 morning | More than sixty have been found; several are open on any given day, and the guides direct the family to the most significant and accessible. | 000000000015: "More than sixty tombs have been found; several are open on any given day, and the guides direct the family to the most significant and accessible." |
| Day 3 morning | Then the Mortuary Temple of Hatshepsut at Deir el-Bahari, rising in three colonnaded terraces against the cliff, and the Colossi of Memnon, two seated figures of Amenhotep III. | 000000000015: "The morning also takes in the Mortuary Temple of Hatshepsut at Deir el-Bahari — … rising in three colonnaded terraces against the cliff face … — and the Colossi of Memnon, the two colossal seated figures of Amenhotep III" |
| Day 3 afternoon | Back on the ship, children can take part in a hieroglyphics workshop, learning the basic system of ancient Egyptian writing and producing their own inscribed messages, while adults use the ship's amenities. | 000000000015: "The afternoon returns to the ship: children can take part in a hieroglyphics workshop — learning the basic system of ancient Egyptian writing and producing their own inscribed messages — while adults use the ship's amenities." |
| Day 3 afternoon | The evening is on the river. | 000000000015 (verbatim) |
| Day 3 the day | Valley of the Kings · Mortuary Temple of Hatshepsut · Colossi of Memnon · Hieroglyphics workshop on board | 000000000015 |
| Day 3 overnight | Nile cruise ship | 000000000015 "The afternoon returns to the ship … The evening is on the river." |
| Day 3 meals | (empty) | not stated — owner-input |
| Day 3 travel | Private transfers to the West Bank and back to the ship | 000000000015 "on the West Bank … The afternoon returns to the ship"; inclusion i28r84lbt8 "Private air-conditioned transfers" |
| Day 3 pace | (empty) | no pace statement |
| Day 4 place/title | Luxor → sailing toward Edfu · The East Bank: Karnak, Luxor Temple and the Avenue of Sphinxes | 000000000017 |
| Day 4 body | The second Luxor day stays on the East Bank, the living side. | 000000000017: "The second Luxor day stays on the living side." + "The East Bank also holds Luxor Temple" |
| Day 4 body | Karnak is a temple precinct built and rebuilt by successive pharaohs over roughly 1,500 years. | 000000000017: "Karnak is not a single temple but a temple precinct, built and rebuilt by successive pharaohs over roughly 1,500 years" |
| Day 4 body | Its Great Hypostyle Hall holds 134 columns, the tallest 21 metres high, and this day leaves time to walk it without urgency. | 000000000017: "Its Great Hypostyle Hall, a forest of 134 columns 21 metres high at the tallest … walking it without urgency, which this day allows" |
| Day 4 body | Luxor Temple follows, with the Avenue of Sphinxes that once connected it to Karnak, a processional road some three kilometres long and now walkable for much of its length. | 000000000017: "The East Bank also holds Luxor Temple itself and the Avenue of Sphinxes that once connected it to Karnak — a processional road some three kilometres long, recently excavated and now walkable for much of its length." |
| Day 4 body | The guides use both sites to explain how the state religion worked: the processions, the festivals and the inner sanctuaries only priests could enter. | 000000000017: "The guides use both sites to explain how the state religion of ancient Egypt actually worked: the processions, the festivals, the relationship between the temple's public spaces and the innermost sanctuaries only priests were permitted to enter." |
| Day 4 body | In the afternoon the ship sails on toward Edfu. | 000000000017: "The afternoon sail toward Edfu continues." |
| Day 4 the day | Karnak · Luxor Temple · Avenue of Sphinxes | 000000000017 |
| Day 4 overnight | Nile cruise ship | 000000000017 "The afternoon sail toward Edfu" |
| Day 4 meals | (empty) | owner-input |
| Day 4 travel | Private transfers · afternoon sailing toward Edfu | inclusion i28r84lbt8; 000000000017 "The afternoon sail toward Edfu continues." |
| Day 4 pace | Time to walk Karnak without urgency | 000000000017: "walking it without urgency, which this day allows" |
| Day 5 place/title | Edfu → Kom Ombo · The Temple of Horus at Edfu and a cooking class on board | 00000000001b |
| Day 5 body | The Temple of Horus at Edfu is the best-preserved temple in Egypt. | 00000000001b: "The Temple of Horus at Edfu is the best-preserved temple in Egypt" |
| Day 5 body | Its walls, roof and inner sanctuary survive, so standing inside shows how an Egyptian temple worked as a building: how light was controlled and how the spaces contracted toward the sanctuary. | 00000000001b: "walls, roof, and inner sanctuary survive, and standing inside it gives a clearer picture of how an Egyptian temple functioned as a building — how light was controlled, how the spaces contracted toward the sanctuary" |
| Day 5 body | It was built between 237 and 57 BC, but in a rigorously traditional form, which makes it a key for reading the older temples you have already seen. | 00000000001b: "It was built in the Ptolemaic period, between 237 and 57 BC, but its form is rigorously traditional, a deliberate archaism that makes it a useful key for reading the older temples you have already seen." |
| Day 5 body | The afternoon sails on to Kom Ombo, and in the evening there's an Egyptian cooking class on board: traditional dishes taught and then eaten. | 00000000001b: "The afternoon sails on to Kom Ombo, and the evening features an Egyptian cooking class on board — traditional dishes taught and then eaten" |
| Day 5 the day | Temple of Horus at Edfu · Cooking class on board | 00000000001b |
| Day 5 overnight | Nile cruise ship | 00000000001b "sails on to Kom Ombo … cooking class on board" |
| Day 5 meals | (empty) | owner-input (is the cooking class the dinner?) |
| Day 5 travel | By cruise, Edfu to Kom Ombo | 00000000001b "The afternoon sails on to Kom Ombo"; route via Edfu, Kom Ombo |
| Day 5 pace | (empty) | no pace statement |
| Day 6 place/title | Kom Ombo → Aswan · The Temple of Kom Ombo and the Crocodile Museum | 00000000001d |
| Day 6 body | Kom Ombo sits above the east bank where the river bends. | 00000000001d (verbatim) |
| Day 6 body | Its temple was dedicated to two gods at once, Sobek the crocodile deity and Horus the Elder, and its whole plan is doubled: two parallel axes run side by side through identical halls and sanctuaries, in an exact symmetry that is slightly uncanny once you notice it. | 00000000001d: "it was dedicated simultaneously to two gods, Sobek the crocodile deity and Horus the Elder, and its entire plan is doubled — two parallel axes running side by side through identical halls and sanctuaries. The effect is exact symmetry, slightly uncanny when you notice it." |
| Day 6 body | Next to the temple, the crocodile museum holds mummified crocodiles from a nearby necropolis, and it tends to be what younger travellers remember most. | 00000000001d: "The crocodile museum adjacent to the temple, holding mummified crocodiles from a nearby necropolis, tends to be the element younger travellers remember most specifically." |
| Day 6 body | In the afternoon the ship continues south toward Aswan. | 00000000001d: "The afternoon continues south toward Aswan." |
| Day 6 the day | Temple of Kom Ombo · Crocodile Museum | 00000000001d |
| Day 6 overnight | Nile cruise ship | 00000000001d + 000000000029 "The morning brings disembarkation" (after the Aswan day) |
| Day 6 meals | (empty) | owner-input |
| Day 6 travel | By cruise, Kom Ombo to Aswan | 00000000001d "The afternoon continues south toward Aswan"; route leg Luxor→Aswan nile_cruise |
| Day 6 pace | (empty) | no pace statement |
| Day 7 place/title | Aswan · Philae, a felucca around Elephantine Island and Nubian music | 000000000023, 000000000025 |
| Day 7 morning | Aswan is Egypt's southernmost significant city, set where the Nile narrows toward the first cataract, smaller and slower than Cairo and Luxor. | 000000000021: "Aswan is Egypt's southernmost significant city, set where the Nile narrows toward the first cataract — smaller, slower than Cairo and Luxor" |
| Day 7 morning | The day begins at the Temple of Isis on Philae Island, reached by motorboat. | 000000000023 (verbatim) |
| Day 7 morning | The temple was reassembled here in the 1970s to save it from the rising waters of Lake Nasser, in the same UNESCO rescue that lifted Abu Simbel, and the worship of Isis continued here into the fifth century AD. | 000000000023: "reassembled here in the 1970s after being dismantled to save it from the rising waters of Lake Nasser — the same UNESCO rescue operation that lifted Abu Simbel … The temple's dedication to Isis … continued into the fifth century AD" |
| Day 7 afternoon | A felucca, the traditional white-sailed Nile boat, takes you around Elephantine Island at the wind's pace, past the corniche and the botanical gardens of Kitchener's Island. | 000000000025: "The afternoon is a felucca around Elephantine Island — the traditional Nile sailboat, white-sailed, moving at the wind's pace past the corniche and the botanical gardens of Kitchener's Island." |
| Day 7 afternoon | The contrast with the temple mornings is the point. | 000000000025 (verbatim) |
| Day 7 evening | The day closes with a Nubian music and dance session, an introduction to the Nubian people, whose homeland was flooded by Lake Nasser and who rebuilt their communities on the banks around Aswan. | 000000000025: "The day closes with a Nubian music and dance session: an introduction to the culture of the Nubian people, whose homeland was flooded by Lake Nasser and who rebuilt their distinctive communities on the banks around Aswan." |
| Day 7 evening | Children tend to find the participatory rhythms more engaging than any temple explanation. | 000000000025 (verbatim) |
| Day 7 the day | Temple of Isis at Philae · Felucca around Elephantine Island · Nubian music and dance | 000000000023, 000000000025 |
| Day 7 overnight | Nile cruise ship | 000000000029: "The morning brings disembarkation" (next day) |
| Day 7 meals | (empty) | owner-input |
| Day 7 travel | Motorboat to Philae · felucca around Elephantine Island | 000000000023 "reached by motorboat"; 000000000025 "a felucca around Elephantine Island" |
| Day 7 pace | (empty) | no pace statement |
| Day 8 place/title | Aswan → Cairo · Flight to Cairo, Khan el-Khalili and a farewell Nile dinner cruise | 000000000029, 00000000002b |
| Day 8 morning | Disembarkation, and a flight north to Cairo. | 000000000029: "The morning brings disembarkation and a flight north to Cairo." |
| Day 8 afternoon | Khan el-Khalili, the medieval bazaar quarter of Islamic Cairo, trading continuously since the fourteenth century: dense, noisy, negotiable and very good for souvenirs, from brass and copper work and spices sold by weight from open sacks to cotton, papyrus and jewellery. | 000000000029: "The afternoon is Khan el-Khalili, the medieval bazaar quarter in Islamic Cairo trading continuously since the fourteenth century: dense, noisy, negotiable, and very good for souvenirs — brass and copper work, spices sold by weight from open sacks, cotton, papyrus, jewellery." |
| Day 8 afternoon | The guides know which parts of the market are worth the time and which are not. | 000000000029 (verbatim) |
| Day 8 evening | A farewell Nile dinner cruise closes the trip, with the lit city on both banks and minarets and bridges moving past as the boat turns: a formal close to a journey that began with the Nile in a different mood, at a different latitude. | 00000000002b: "The evening closes the trip with a farewell Nile dinner cruise — the lit city on both banks, minarets and bridges moving past as the boat turns. It is a formal close to a journey that began with the Nile in a different mood, at a different latitude." |
| Day 8 the day | Khan el-Khalili · Farewell Nile dinner cruise | 000000000029, 00000000002b |
| Day 8 overnight | Cairo | 00000000002b: "The following morning, a transfer to the airport" (hotel not named — owner-input) |
| Day 8 meals | Breakfast (last meal on the cruise) · farewell dinner (on a Nile dinner cruise) | breakfast: owner-confirmed cruise rule (breakfast last on disembarkation day); dinner: 00000000002b "a farewell Nile dinner cruise" |
| Day 8 travel | Domestic flight Aswan → Cairo · private transfers | 000000000029 "a flight north to Cairo"; route leg Aswan→Cairo flight; inclusion i28r84lbt8 |
| Day 8 pace | (empty) | no pace statement |
| Day 9 place/title | Cairo · Departure | 00000000002b "The following morning, a transfer to the airport" |
| Day 9 body | A transfer to the airport. | 00000000002b: "The following morning, a transfer to the airport" |
| Day 9 body | For families with a later departure, the guides can suggest options. | 00000000002b: "for families with a later departure, the guides can suggest options." |
| Day 9 overnight | — | departure day |
| Day 9 travel | Private transfer to the airport | 00000000002b + inclusion i28r84lbt8 |
| Day 9 expander | Continues in Day 8 | 00000000002b shown under Day 8 |
| Stay: hotels | A hotel in Cairo on the first night. | 00000000000b "transferred to your hotel" |
| Stay: river | A Nile cruise ship from Luxor south to Aswan, by way of Edfu and Kom Ombo, with a pool, a hieroglyphics workshop and a cooking class on board. | 000000000007 "a Nile cruise from Luxor south to Aswan … (pool, cooking class, hieroglyphics workshop)"; route via Edfu, Kom Ombo (night count left out — see owner-input) |
| Stay: flight | A domestic flight from Cairo to Luxor at the start of the river journey, and one from Aswan back to Cairo at the end. | 000000000013 "A domestic flight delivers you to Luxor"; 000000000029 "a flight north to Cairo"; route legs |
| Stay: every day | A licensed English-speaking Egyptologist guide, private air-conditioned transfers and bottled water. | inclusions 7ledm9lhdw, i28r84lbt8, g73it27o7t; 00000000002f "included throughout" |
| Stay: every day | The trip is private, operated for your party alone and never shared with a group, and it scales to any party size. | 00000000002f: "This is a private family departure — operated for your party alone, never a shared group — and it scales to any party size." |
| Fit for | are a family with school-age children meeting Egypt for the first time | audience: "Families with school-age children meeting Egypt for the first time" |
| Fit for | want the classic Cairo-and-cruise shape, paced for a party that includes children | audience: "travellers who want the classic Cairo-and-cruise shape paced for a party that includes children" |
| Worth knowing | Day 1 combines arrival with the Giza plateau, the Grand Egyptian Museum and the Sound and Light Show at the pyramids. | 00000000000b, 00000000000d, 00000000000f (see Day 1) |
| Worth knowing | The days alternate temple visits with time on board: pool, a hieroglyphics workshop and a cooking class make the Luxor and Aswan days sustainable for children. | 000000000005 "a structure that alternates intensity with recovery"; 00000000002f "The cruise carries its own onboard rhythm of pool time, hieroglyphics workshop, and cooking class precisely because … is what makes the dense Luxor and Aswan days sustainable for children." |
| Worth knowing | The programme does not ask everyone to be on site at seven in the morning for nine days running. | 000000000005: "does not ask everyone to be on site at seven in the morning for nine days running" |
| Worth knowing | Child pricing and room-sharing are arranged on request. | 00000000002f (verbatim) |
| Make it yours intro | A private journey is built around your party, not the other way around. Common changes: | concierge: "A private journey is built around your party, not the other way around." |
| Option | Combine the Grand Egyptian Museum with the Tahrir Egyptian Museum, or substitute the Tahrir museum | opts: "Substitute or combine with the Tahrir Egyptian Museum"; 00000000000d |
| Option | Extend the Cairo opening | opts: "Extend the Cairo opening"; concierge "a longer Cairo opening" |
| Option | Upgrade to a higher-grade cruise ship | opts (verbatim); concierge "a higher-grade cruise ship" |
| Option | Add an Abu Simbel day at Aswan | opts (verbatim); concierge "an Abu Simbel day added at Aswan" |

### Essay block → where it appears

| Block _key | Style | Destination |
|---|---|---|
| 000000000001 | h2 | dropped (heading) |
| 000000000003 | normal | whyRouteRefs (opening) |
| 000000000005 | normal | whyRouteRefs (opening, worth knowing) |
| 000000000007 | normal | whyRouteRefs (why route) |
| 000000000009 | h3 | dropped (heading) |
| 00000000000b | normal | Day 1 |
| 00000000000d | normal | Day 1 |
| 00000000000f | normal | Day 1 |
| 000000000011 | h3 | dropped (heading) |
| 000000000013 | normal | Day 2 |
| 000000000015 | normal | Day 3 |
| 000000000017 | normal | Day 4 |
| 000000000019 | h3 | dropped (heading) |
| 00000000001b | normal | Day 5 |
| 00000000001d | normal | Day 6 |
| 00000000001f | h3 | dropped (heading) |
| 000000000021 | normal | Day 7 |
| 000000000023 | normal | Day 7 |
| 000000000025 | normal | Day 7 |
| 000000000027 | h3 | dropped (heading) |
| 000000000029 | normal | Day 8 |
| 00000000002b | normal | Day 8 (Day 9: continuesInDay 8) |
| 00000000002d | h3 | dropped (heading) |
| 00000000002f | normal | whyRouteRefs ("How this journey works": stay and travel, worth knowing) |
| 000000000031 | normal | closingRef |
| 000000000033 | normal ("The shape of the journey" label) | whyRouteRefs |
| 000000000035 | bullet | whyRouteRefs |
| 000000000037 | bullet | whyRouteRefs |
| 000000000039 | bullet | whyRouteRefs |

### Guide links (proposed, not yet matched)

Sites to match by name: Giza pyramids, Great Sphinx, Grand Egyptian Museum, Sound and Light Show at the pyramids, Valley of the Kings, Mortuary Temple of Hatshepsut, Colossi of Memnon, Karnak, Luxor Temple, Avenue of Sphinxes, Temple of Horus at Edfu, Temple of Kom Ombo, Crocodile Museum, Temple of Isis at Philae, Felucca around Elephantine Island, Nubian music and dance, Khan el-Khalili. Activity rows (hieroglyphics workshop, cooking class, farewell Nile dinner cruise) likely have no guide page.

---

## 10-day-nile-and-western-desert-tour

_id: wp-page-89005 · https://travel2egypt.org/10-day-nile-and-western-desert-tour

Note: this product has NO inclusions, exclusions, itin day titles, overnights, route legs or FAQ in its data. The day split below follows the essay's order of places only; it is a draft for the owner to confirm (see owner-input file).

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Opening | A private journey that insists on the Egypt beyond the river: the oases, the White Desert, and the silence between two historical bookends. | "A private journey that insists on the Egypt beyond the river — the oases, the White Desert, and the silence between two historical bookends." (essay 000000000003) |
| Opening | Egypt is usually understood as a river country, and this journey insists on the rest of it. | "Egypt is usually understood as a river country. This journey insists on the rest of it." (essay 000000000005) |
| Opening | The Nile is here, with Giza, Saqqara, the temples of Luxor and the Egyptian Museum, but the engine of these ten days is the Western Desert. | "The Nile is here — Giza, Saqqara, the temples of Luxor, the Egyptian Museum — but the engine of these ten days is the Western Desert" (essay 000000000007) |
| Why route | The route is roughly circular, and its logic is geographic rather than chronological. | "The shape of the trip is roughly circular, and the logic is geographic rather than chronological." (essay 000000000009) |
| Why route | It opens in Cairo with the monuments the Nile made possible, turns west into the desert for four days through Bahariya, the White Desert, Dakhla and Kharga, pivots at Kharga toward Luxor and the Nile again, and closes back in Cairo. | "It opens in Cairo with the monuments the Nile made possible, turns west into the desert for the four days most travelers end up remembering most clearly, pivots at Kharga toward Luxor and the Nile again, and closes back in Cairo." (essay 000000000009); "Where · Cairo → Bahariya → White Desert → Dakhla → Kharga → Luxor → Cairo" (essay 000000000029) |
| Why route | The oases, inhabited since prehistory, are not detours: they are the reason to take ten days rather than five, and the whole route is built around them. | "a chain of inhabited oases occupied since prehistory… These are not detours. They are the reason to take ten days rather than five, and the whole route is built around them." (essay 000000000007) |
| Why route | What it gives you is a sense of Egypt's actual geography, not just the thin green ribbon along the river but the enormous quiet beyond it. | "What it gives you is a sense of Egypt's actual geography — not just the thin green ribbon everyone photographs, but the enormous quiet beyond it." (essay 000000000009) |
| Closing line | Most Egypt itineraries follow the Nile and call it the whole country. This one goes where the Nile does not — and comes back changed. | verbatim (essay 000000000025) |
| Day 1 place | Cairo | "It opens in Cairo" (essay 000000000009) |
| Day 1 title | Arrival in Cairo | Structural (first day of a journey that "opens in Cairo", essay 000000000009). Arrival details not in source — owner-input. |
| Day 1 body | The journey opens in Cairo, with the monuments the Nile made possible. | "It opens in Cairo with the monuments the Nile made possible" (essay 000000000009) |
| Day 2 place | Cairo | "Cairo: the monuments the river made" (heading 00000000000b) |
| Day 2 title | Giza, Memphis and Saqqara | sites named in essay 00000000000d |
| Day 2 body | The journey begins with the Old Kingdom at full scale. | "The journey begins with the Old Kingdom at full scale." (essay 00000000000d) |
| Day 2 body | At Giza you see what was built around 2500 BC: Khufu's pyramid, Khafre's behind it and the Sphinx crouched below. | "the sheer physical fact of what was built around 2500 BC, Khufu's pyramid with Khafre behind it and the Sphinx crouched below" (essay 00000000000d) |
| Day 2 body | Memphis, the first capital of a unified Egypt, holds the fallen colossus of Ramses II. | "Memphis, the first capital of a unified Egypt, holds the fallen colossus of Ramses II." (essay 00000000000d) |
| Day 2 body | At Saqqara stands the Step Pyramid of Djoser, built around 2650 BC and the oldest large stone structure on earth, where Imhotep worked out in stages how to turn a stack of mastabas into a pyramid. | "Saqqara reorders everything: the Step Pyramid of Djoser, around 2650 BC, is the oldest large stone structure on earth — the building where Imhotep worked out, in stages, how to turn a stack of mastabas into a pyramid." (essay 00000000000d) |
| Day 2 body | Giza is the perfection of the idea and Saqqara is where it began, and your Egyptologist sets them side by side so you hold the whole sequence at once. | "Giza is the perfection of the idea; Saqqara is where the idea began. Your Egyptologist will set them side by side so you hold the whole sequence at once." (essay 00000000000d) |
| Day 2 the day | Giza pyramids · Great Sphinx · Memphis · Step Pyramid of Djoser (Saqqara) | essay 00000000000d |
| Day 3 place | Cairo → Bahariya | "Where · Cairo → Bahariya" (essay 000000000029) |
| Day 3 title | Into the Western Desert: Bahariya Oasis | "West into the desert: the oases" (heading 00000000000f); "Bahariya, the gateway oasis" (essay 000000000013) |
| Day 3 body | The route leaves the Nile valley, and the character of the trip changes entirely. | "Then the route leaves the valley, and the character of the trip changes entirely." (essay 000000000011) |
| Day 3 body | Bahariya, the gateway oasis, sits in a depression some 370 kilometres from Cairo, with Pyramid Mountain on its skyline. | "Bahariya, the gateway oasis, sits in a depression some 370 kilometres from Cairo — Pyramid Mountain on its skyline" (essay 000000000013) |
| Day 3 body | Here are an ethnographic museum of oasis life and the Valley of the Golden Mummies, a Graeco-Roman necropolis that has yielded more than 250 gilded mummies since its discovery in 1996. | "an ethnographic museum of oasis life, and the Valley of the Golden Mummies, a Graeco-Roman necropolis that has yielded more than 250 gilded mummies since its discovery in 1996" (essay 000000000013) |
| Day 3 body | Alexander the Great was crowned pharaoh here in 332 BC, and a temple to him still stands. | "Alexander the Great was crowned pharaoh here in 332 BC; a temple to him still stands." (essay 000000000013) — accuracy flagged in owner-input |
| Day 3 the day | Ethnographic museum · Valley of the Golden Mummies · Temple of Alexander the Great | essay 000000000013 |
| Day 3 travel | Desert drive with your desert drivers | "your own Egyptologist + desert drivers… long desert drives" (essay 00000000002d); "the desert drives are long" (essay 000000000023) — mode for this leg not stated explicitly; owner to confirm |
| Day 3 pace | Long desert drive | "the desert drives are long" (essay 000000000023); "demanding pace, long desert drives" (essay 00000000002d) |
| Day 4 place | Black Desert → White Desert | "By 4×4 through the Black Desert… and into the White Desert" (essay 000000000015) |
| Day 4 title | By 4×4 through the Black Desert to a night camping in the White Desert | essay 000000000015; "one night camping in the White Desert" (essay 00000000002d) |
| Day 4 body | The desert days are the heart of the journey. | "The desert days themselves are the heart of the journey." (essay 000000000015) |
| Day 4 body | By 4×4 you cross the Black Desert, its hills coated in dark basalt, and enter the White Desert, a protected expanse where wind has carved the chalk into sculptural forms, some like mushrooms or animals, some simply abstract. | "By 4×4 through the Black Desert, its hills coated in dark basalt, and into the White Desert — a protected expanse where wind has carved the chalk into sculptural forms, some like mushrooms or animals, some simply abstract." (essay 000000000015) |
| Day 4 body | Tonight you camp there, far from any city, under the desert sky. | "The night camped there, at that distance from any city, under that sky" (essay 000000000015) |
| Day 4 body | This night is not incidental to the trip: for most travelers it is the thing they describe first when they get home. | "is not incidental to the trip. For most travelers it is the thing they describe first when they get home." (essay 000000000015) |
| Day 4 the day | Black Desert · White Desert | essay 000000000015 |
| Day 4 overnight | Desert camp (White Desert) | "one night camping in the White Desert" (essay 00000000002d) |
| Day 4 travel | By 4×4 | "By 4×4 through the Black Desert" (essay 000000000015) |
| Day 5 place | White Desert → Dakhla | "Where · … White Desert → Dakhla" (essay 000000000029) |
| Day 5 title | Dakhla: Deir el-Haggar and Qasr Dakhla | essay 000000000017 |
| Day 5 body | The route continues south to Dakhla, the second of the three inhabited oases on this journey, after Bahariya and before Kharga. | "South to Dakhla" (essay 000000000017); "a chain of inhabited oases occupied since prehistory. Bahariya, Dakhla, Kharga." (essay 000000000007) |
| Day 5 body | It is larger and greener, with the smell of date palms instead of traffic. | "larger and greener, with the smell of date palms instead of traffic" (essay 000000000017) |
| Day 5 body | The Roman temple of Deir el-Haggar survives remarkably intact, and the medieval village of Qasr Dakhla is still inhabited, still threaded with mudbrick lanes. | "the Roman temple of Deir el-Haggar remarkably intact, the inhabited medieval village of Qasr Dakhla still threaded with mudbrick lanes" (essay 000000000017) |
| Day 5 the day | Deir el-Haggar · Qasr Dakhla | essay 000000000017 |
| Day 5 travel | Desert drive with your desert drivers | essay 00000000002d / 000000000023 (as Day 3) |
| Day 5 pace | Long desert drive | essay 000000000023 / 00000000002d (as Day 3) |
| Day 6 place | Dakhla → Kharga | "Then east to Kharga" (essay 000000000017); route bullet 000000000029 |
| Day 6 title | Kharga: the Hibis Temple and El-Bagawat | essay 000000000017 |
| Day 6 body | East to Kharga, the largest of the oases, at the head of the Darb el-Arba'in, the Forty Days Road that once carried caravans to sub-Saharan Africa. | "Then east to Kharga, the largest of the oases, sitting at the head of the Darb el-Arba'in, the Forty Days Road that once carried caravans to sub-Saharan Africa." (essay 000000000017) |
| Day 6 body | The Hibis Temple is the best-preserved ancient temple in the Western Desert, its sanctuary still painted. | "the Hibis Temple — the best-preserved ancient temple in the Western Desert, its sanctuary still painted" (essay 000000000017) |
| Day 6 body | El-Bagawat is one of the oldest Christian cemeteries in the world: hundreds of mudbrick funerary chapels on a desert ridge, with painted interiors surviving from the third to seventh centuries. | "El-Bagawat, one of the oldest Christian cemeteries in the world, hundreds of mudbrick funerary chapels on a desert ridge, painted interiors surviving from the third to seventh centuries" (essay 000000000017) |
| Day 6 body | These are sites most Egypt itineraries never reach. | verbatim (essay 000000000017) |
| Day 6 the day | Hibis Temple · El-Bagawat | essay 000000000017 |
| Day 6 travel | Desert drive with your desert drivers | essay 00000000002d / 000000000023 (as Day 3) |
| Day 6 pace | Long desert drive | essay 000000000023 / 00000000002d (as Day 3) |
| Day 7 place | Kharga → Luxor | "pivots at Kharga toward Luxor" (essay 000000000009); route bullet 000000000029 |
| Day 7 title | Back to the Nile: Luxor and Karnak | "Back to the river: Luxor" (heading 000000000019); Karnak (essay 00000000001b) — Karnak on this day is a placement guess, owner to confirm |
| Day 7 body | From the desert's edge the route turns to Luxor: ancient Thebes, the religious capital of the New Kingdom, with more monumental architecture per square kilometre than almost anywhere on earth. | "From the desert's edge the route turns to Luxor — ancient Thebes, the religious capital of the New Kingdom, more monumental architecture per square kilometre than almost anywhere on earth." (essay 00000000001b) |
| Day 7 body | Karnak is not a single temple but a complex built and rebuilt across 1,500 years, and its Hypostyle Hall is a forest of 134 columns. | "Karnak is not a temple but a complex built and rebuilt across 1,500 years, its Hypostyle Hall a forest of 134 columns." (essay 00000000001b) |
| Day 7 body | After the desert's silence, Luxor's density lands differently: you arrive understanding the river that made all of it possible. | "After the desert's silence, Luxor's density lands differently — you arrive understanding the river that made all of it possible." (essay 00000000001b) |
| Day 7 the day | Karnak | essay 00000000001b |
| Day 8 place | Luxor | essay 00000000001b |
| Day 8 title | The West Bank: the Valley of the Kings, Hatshepsut's temple and the Colossi of Memnon | "Across the Nile, the land of the dead: the Valley of the Kings…, Hatshepsut's terraced temple…, the Colossi of Memnon" (essay 00000000001b) |
| Day 8 body | Across the Nile lies the land of the dead. | "Across the Nile, the land of the dead" (essay 00000000001b) |
| Day 8 body | The Valley of the Kings holds its painted afterlife corridors, Hatshepsut's terraced temple rises against the cliff, and the Colossi of Memnon stand alone in the fields. | "the Valley of the Kings with its painted afterlife corridors, Hatshepsut's terraced temple rising against the cliff, the Colossi of Memnon alone in the fields" (essay 00000000001b) |
| Day 8 body | Luxor is the finale of the route, one of its fixed points alongside the oasis chain and the desert night. | "The circular route, the oasis chain, the desert night, the Luxor finale: those are the spine." (essay 000000000023) |
| Day 8 the day | Valley of the Kings · Temple of Hatshepsut · Colossi of Memnon | essay 00000000001b |
| Day 9 place | Luxor → Cairo | "A flight returns the journey to Cairo" (essay 00000000001f) |
| Day 9 title | Flight to Cairo: the Egyptian Museum and Khan el-Khalili | essay 00000000001f |
| Day 9 body | A flight returns the journey to Cairo for its final chapter. | "A flight returns the journey to Cairo for its final chapter" (essay 00000000001f) |
| Day 9 body | At the Egyptian Museum, the objects pulled from the sites you have spent the journey walking through are gathered together; Tutankhamun's treasure is now at the Grand Egyptian Museum, which can be added on request. | "the Egyptian Museum, where the objects pulled from the sites you've spent ten days walking through are gathered (Tutankhamun's treasure now at the Grand Egyptian Museum, addable on request)" (essay 00000000001f) |
| Day 9 body | Then the medieval bazaar of Khan el-Khalili, trading continuously since the fourteenth century. | "and the medieval bazaar of Khan el-Khalili, trading continuously since the fourteenth century" (essay 00000000001f) |
| Day 9 the day | Egyptian Museum · Khan el-Khalili | essay 00000000001f |
| Day 9 travel | Flight Luxor → Cairo | "A flight returns the journey to Cairo" (essay 00000000001f) |
| Day 10 place | Cairo | "closes back in Cairo" (essay 000000000009) |
| Day 10 title | Departure | Structural (last day). No source text — owner-input. |
| Day 10 overnight | — | departure day |
| Stay · flight | A flight from Luxor returns the journey to Cairo for its final chapter. | essay 00000000001f |
| Stay · camp | One night camping in the White Desert. | "one night camping in the White Desert" (essay 00000000002d) |
| Stay · every day | Fully private, operated for your party alone and never a shared group, with your own Egyptologist and desert drivers. | "Fully private · your own Egyptologist + desert drivers" (essay 00000000002d); "operated for your party alone, never a shared group" (essay 000000000023) |
| Fit for | want to see the Egypt beyond the Nile | "Travelers who want Egypt beyond the Nile" (audience) |
| Fit for | are a repeat visitor to Egypt | "repeat visitors" (audience) |
| Fit for | are drawn to desert and silence as much as to monuments | "anyone drawn to desert and silence as much as monuments" (audience) |
| Worth knowing | This is a demanding itinerary: the desert drives are long, and the rewards are proportional. | "It is a demanding itinerary, honestly; the desert drives are long and the rewards are proportional." (essay 000000000023) |
| Worth knowing | Long drives suit older children best. | "Long drives suit older children best." (audience) |
| Worth knowing | One night is spent camping in the White Desert. | "one night camping in the White Desert" (essay 00000000002d) |
| Worth knowing | Tutankhamun's treasure is now at the Grand Egyptian Museum, not the Egyptian Museum; it can be added on request. | "(Tutankhamun's treasure now at the Grand Egyptian Museum, addable on request)" (essay 00000000001f) |
| Worth knowing | About 10 days and 9 nights, and the shape is a starting point rather than a fixed schedule. | "Duration · ≈10 days / 9 nights — adjustable" (essay 00000000002b); "the shape above is a starting point, not a fixed schedule" (essay 000000000023) |
| Make it yours intro | This is a private journey, built around your party, not the other way around. Common changes: | "A private journey is built around your party, not the other way around." (concierge) |
| Option | Add the Grand Egyptian Museum to the Cairo days | opts; "the Grand Egyptian Museum added" (concierge); "whether the Grand Egyptian Museum joins the Cairo days" (essay 000000000023) |
| Option | Spend more time in the oases | opts; "more time in the oases" (concierge) |
| Option | Pace the desert driving differently | opts; "the desert driving paced differently" (concierge); "how the desert driving is paced for your party" (essay 000000000023) |

### Essay block → where it appears

| Block _key | Style | Destination |
|---|---|---|
| 000000000001 | h2 | dropped (heading) |
| 000000000003 | normal | whyRouteRefs (intro; used in opening) |
| 000000000005 | normal | whyRouteRefs (intro; used in opening) |
| 000000000007 | normal | whyRouteRefs (intro; used in opening + whyRoute) |
| 000000000009 | normal | whyRouteRefs (route logic) |
| 00000000000b | h3 | dropped (heading) |
| 00000000000d | normal | Day 2 narrativeRefs |
| 00000000000f | h3 | dropped (heading) |
| 000000000011 | normal | Day 3 narrativeRefs |
| 000000000013 | normal | Day 3 narrativeRefs |
| 000000000015 | normal | Day 4 narrativeRefs |
| 000000000017 | normal | Day 5 narrativeRefs (Dakhla + Kharga; Day 6 continuesInDay 5) |
| 000000000019 | h3 | dropped (heading) |
| 00000000001b | normal | Day 7 narrativeRefs (Luxor East + West Bank; Day 8 continuesInDay 7) |
| 00000000001d | h3 | dropped (heading) |
| 00000000001f | normal | Day 9 narrativeRefs |
| 000000000021 | h3 | dropped (heading) |
| 000000000023 | normal | whyRouteRefs ("How this journey works": spine of route; feeds worthKnowing / everyDay) |
| 000000000025 | normal | closingRef |
| 000000000027 | normal | whyRouteRefs ("The shape of the journey" label) |
| 000000000029 | bullet | whyRouteRefs (shape bullet) |
| 00000000002b | bullet | whyRouteRefs (shape bullet) |
| 00000000002d | bullet | whyRouteRefs (shape bullet) |

Guide links: not proposed in this draft (no site-page index supplied). Sites to match: Giza pyramids, Great Sphinx, Memphis, Step Pyramid of Djoser (Saqqara), Ethnographic museum (Bahariya), Valley of the Golden Mummies, Temple of Alexander the Great (Bahariya), Black Desert, White Desert, Deir el-Haggar, Qasr Dakhla, Hibis Temple, El-Bagawat, Karnak, Valley of the Kings, Temple of Hatshepsut, Colossi of Memnon, Egyptian Museum, Khan el-Khalili.

---

## 4-day-history-culture-escape

_id: `wp-page-153242` · https://travel2egypt.org/4-day-history-culture-escape

| Part | Sentence | Source (exact quote + where) |
|---|---|---|
| Opening | Four private days in Cairo, read as a single five-thousand-year argument in stone: the Giza plateau, the Grand Egyptian Museum, Saqqara and Memphis, and the Coptic and Islamic city. | essay 000000000003: "A short private city break that reads Cairo as a single five-thousand-year argument in stone — Saqqara to Giza, Giza to the Grand Egyptian Museum, museum to Coptic and Islamic city." Places reordered to match the days (see owner-input). Memphis: essay 000000000023 "Where · Cairo (Giza · Grand Egyptian Museum · Saqqara · Memphis · Coptic Cairo · Islamic Cairo)" |
| Opening | A weekend can show you Cairo's headlines. Four days can show you its sequence. | essay 000000000005: "A weekend can show you Cairo's headlines. Four days can show you its sequence" |
| Why this route works | Cairo accumulates. The Step Pyramid is older than the Great Pyramid, … and the Citadel is older than the bazaar that still trades beneath its walls. | essay 000000000007: "Cairo accumulates. The Step Pyramid is older than the Great Pyramid; … the Citadel is older than the bazaar that still trades beneath its walls." |
| Why this route works | Most short itineraries pick one or two of these; this one runs the whole line. | essay 000000000007: "Most short itineraries pick one or two of these and call it Egypt. This one runs the whole line." |
| Why this route works | At its centre is the Grand Egyptian Museum, which opened fully on 1 November 2025 on the edge of the Giza plateau. | essay 000000000009: "The Grand Egyptian Museum, which opened fully on 1 November 2025 on the edge of the Giza plateau, is now the centre of gravity for that argument." |
| Why this route works | A serious museum day set against a serious plateau day is the spine of the trip. | essay 000000000009: "A serious museum day, set against a serious plateau day, is the spine of any modern Cairo break — and this itinerary builds around it." |
| Day 1 place/title | Giza · The Giza pyramids, the Sphinx and the Sound and Light Show | essay 00000000000d: "The first day goes straight to Giza"; "the Great Sphinx below them"; "the Sound and Light Show at the pyramids closes the day"; itin day 1 title "The Giza plateau" |
| Day 1 body | The trip starts on the Giza plateau, where most people's idea of Egypt was formed. | essay 00000000000d: "The first day goes straight to Giza, because the plateau is where most people's idea of Egypt was formed" |
| Day 1 body | The pyramids of Khufu, Khafre and Menkaure were built across roughly fifty years around 2500 BC, with the Great Sphinx below them, carved from a single limestone outcrop. | essay 00000000000d: "The Great Pyramid of Khufu, the Pyramid of Khafre, and the Pyramid of Menkaure were built across roughly fifty years around 2500 BC, with the Great Sphinx below them carved from a single limestone outcrop." |
| Day 1 body | The scale is what photographs fail to convey: the plateau is large and the stones are enormous. | essay 00000000000d: "The scale of the complex is what photographs consistently fail to convey: the plateau is large, the stones are enormous" |
| Day 1 body | Entry into the Pyramid of Khafre, a low, steep passage into the body of the structure, is available for those who want it. | essay 00000000000d: "The option to enter the Pyramid of Khafre — a low, steep passage into the body of the structure — is available for those who want it." |
| Day 1 body | As the light changes, the Sound and Light Show closes the day, the plateau's history narrated against floodlit stone. | essay 00000000000d: "As the afternoon light changes, the Sound and Light Show at the pyramids closes the day, the plateau's history narrated against floodlit stone." |
| Day 1 The day | Great Pyramid of Khufu · Pyramid of Khafre · Pyramid of Menkaure · Great Sphinx · Sound and Light Show | essay 00000000000d (names as above) |
| Day 1 Overnight | Cairo | itin day 1 overnight "Cairo"; inclusion 8oe8qw5k3x "three nights' accommodation" |
| Day 1 Meals | (empty) | not mappable: arrival time not stated — see owner-input |
| Day 1 Travel | Private air-conditioned transfers | inclusion pwq5gc2vdb "private air-conditioned transfers" |
| Day 1 Pace | Early start, to avoid the worst of the midday heat at Giza | essay 00000000001d: "early starts protect you from the worst of the midday heat at Giza and Saqqara" |
| Day 2 place/title | Giza · A full day at the Grand Egyptian Museum | essay 000000000011: "The second day belongs to the collection"; essay 000000000009 "on the edge of the Giza plateau"; itin day 2 title "The Grand Egyptian Museum" |
| Day 2 body | A full day at the Grand Egyptian Museum, the largest archaeological museum in the world. | essay 000000000011: "The second day belongs to the collection. The Grand Egyptian Museum is the largest archaeological museum in the world" |
| Day 2 body | Its permanent galleries bring together objects once scattered across several institutions, many of them in storage for decades. | essay 000000000011: "its permanent galleries finally bring together objects that were previously scattered across several institutions — many in storage for decades" |
| Day 2 body | The treasures of Tutankhamun are here, reassembled and shown in full for the first time since their excavation a century ago, alongside statuary, papyri, reconstructed chariots and furniture. | essay 000000000011: "The treasures of Tutankhamun are here, reassembled and presented in full for the first time since their excavation a century ago. The statuary, the papyri, the reconstructed chariots, the furniture" |
| Day 2 body | The museum rewards depth over coverage, so your Egyptologist shapes the route to your interests rather than walking you through every gallery. | essay 000000000011: "the museum rewards depth over coverage, and our Egyptologist will shape the route to your interests rather than walking you through every gallery" |
| Day 2 body | The royal mummies are not here: they remain at the National Museum of Egyptian Civilisation. | essay 000000000011: "(The royal mummies remain at the National Museum of Egyptian Civilisation in Old Cairo…)" |
| Day 2 The day | Grand Egyptian Museum · Tutankhamun collection | essay 000000000011; essay 000000000009 "The complete Tutankhamun collection is here" |
| Day 2 Overnight | Cairo | itin day 2 overnight "Cairo"; inclusion 8oe8qw5k3x |
| Day 2 Meals | Breakfast · lunch · dinner | inclusion ybbk6xpqbj "full board"; essay 00000000001d "three nights' accommodation, and full board are included throughout" |
| Day 2 Travel | Private air-conditioned transfers | inclusion pwq5gc2vdb |
| Day 2 Pace | A day for slowing down: depth over coverage | essay 000000000011: "This is a day for slowing down; the museum rewards depth over coverage" |
| Day 3 place/title | Saqqara and Memphis → Old Cairo · The Step Pyramid, Memphis, Coptic Cairo and a Tanoura performance | essay 000000000015 (Saqqara, Memphis, "The afternoon moves into Old Cairo", "Tanoura performance"); itin day 3 title "Saqqara and Old Cairo" |
| Day 3 Morning | Saqqara is where the pyramid was invented. | essay 000000000015: "Saqqara is where the pyramid was invented" |
| Day 3 Morning | The Step Pyramid of Djoser, built around 2650 BC under the architect Imhotep, is the oldest large stone structure in the world, and the structural experiment from which Giza would follow. | essay 000000000015: "the Step Pyramid of Djoser, built around 2650 BC under the architect Imhotep, is the oldest large stone structure in the world — … the structural experiment from which Giza would eventually follow" |
| Day 3 Morning | The surrounding necropolis is large and only partly excavated, and new finds continue to emerge. | essay 000000000015: "The surrounding necropolis is large and only partially excavated; new finds continue to emerge." |
| Day 3 Morning | Nearby Memphis, the ancient capital, preserves the colossal fallen statue of Ramses II and a large alabaster sphinx. | essay 000000000015: "Memphis nearby preserves the colossal fallen statue of Ramses II and a large alabaster sphinx from the ancient capital that once stood here." |
| Day 3 Morning (label) | "Morning" | essay 000000000015 places Old Cairo in "The afternoon"; essay 00000000001d "early starts protect you from … the midday heat at … Saqqara" |
| Day 3 Afternoon | The day moves forward to Cairo's older inhabited layers. | essay 000000000015: "then forward to Cairo's older inhabited layers" |
| Day 3 Afternoon | In the Coptic quarter, the Hanging Church and the Church of St Sergius and Bacchus record Egypt's Christian centuries. | essay 000000000015: "The afternoon moves into Old Cairo — the Coptic quarter, where the Hanging Church and the Church of St Sergius and Bacchus record Egypt's Christian centuries" |
| Day 3 Afternoon | The Ben Ezra Synagogue was rebuilt on a site associated with a Jewish presence in Cairo going back well over a thousand years. | essay 000000000015: "the Ben Ezra Synagogue, rebuilt on a site associated with a Jewish presence in Cairo going back well over a thousand years" |
| Day 3 Evening | The day ends at Wekalet El-Ghoury, an Ottoman-era caravanserai in the heart of Islamic Cairo, for a Tanoura performance: the Sufi spinning ritual that has been part of Cairo's cultural fabric for centuries. | essay 000000000015: "The day ends at Wekalet El-Ghoury, an Ottoman-era caravanserai in the heart of Islamic Cairo, for a Tanoura performance — the Sufi spinning ritual that has been part of Cairo's cultural fabric for centuries." Label "evening": concierge "the Tanoura evening" |
| Day 3 The day | Step Pyramid of Djoser · Saqqara necropolis · Memphis · Hanging Church · Church of St Sergius and Bacchus · Ben Ezra Synagogue · Wekalet El-Ghoury | essay 000000000015 (names as above) |
| Day 3 Overnight | Cairo | itin day 3 overnight "Cairo"; inclusion 8oe8qw5k3x |
| Day 3 Meals | Breakfast · lunch · dinner | inclusion ybbk6xpqbj "full board"; essay 00000000001d "full board are included throughout" |
| Day 3 Travel | Private air-conditioned transfers | inclusion pwq5gc2vdb |
| Day 3 Pace | Early start, to avoid the worst of the midday heat at Saqqara | essay 00000000001d: "early starts protect you from the worst of the midday heat at Giza and Saqqara" |
| Day 4 place/title | Cairo · The Citadel, the Mosque of Muhammad Ali and Khan el-Khalili, then departure | essay 000000000019; itin day 4 title "The Citadel and the bazaar" |
| Day 4 body | The last day is for medieval Cairo before the airport. | essay 000000000019: "The final day belongs to medieval Cairo before the airport transfer." |
| Day 4 body | The Saladin Citadel, built in the twelfth century AD on a spur of the Mokattam hills, has commanded the skyline for eight hundred years. | essay 000000000019 (verbatim) |
| Day 4 body | Inside stands the Mosque of Muhammad Ali, completed in the 1840s in the Ottoman style, its twin minarets visible from most of the city below. | essay 000000000019: "Inside it stands the Mosque of Muhammad Ali, completed in the 1840s in Ottoman style, its twin minarets visible from most of the city below." |
| Day 4 body | The Citadel also offers one of the better elevated views open to visitors. | essay 000000000019: "offers one of the better elevated views available to visitors" |
| Day 4 body | Then down into Khan el-Khalili, the bazaar quarter that has traded continuously since the fourteenth century. | essay 000000000019: "From there the day moves down into Khan el-Khalili, the bazaar quarter that has traded continuously since the fourteenth century" |
| Day 4 body | A final lunch, then the transfer to the airport. | essay 000000000019: "A final lunch, and the transfer to the airport follows." |
| Day 4 The day | Saladin Citadel · Mosque of Muhammad Ali · Khan el-Khalili | essay 000000000019 |
| Day 4 Overnight | — (null) | itin day 4 overnight null; departure day |
| Day 4 Meals | Breakfast · lunch (final lunch) | lunch: essay 000000000019 "A final lunch"; breakfast: inclusion ybbk6xpqbj "full board" after night 3 (essay 00000000001d "throughout") — confirm in owner-input |
| Day 4 Travel | Private air-conditioned transfers · private transfer to the airport | inclusion pwq5gc2vdb; essay 000000000019 "the transfer to the airport follows" |
| Day 4 Pace | (empty) | no statement in essay |
| Stay: hotels | Three nights' accommodation in Cairo, full board. | inclusions 8oe8qw5k3x "three nights' accommodation", ybbk6xpqbj "full board"; itin overnights "Cairo" |
| Stay: every day | A licensed English-speaking Egyptologist, and private air-conditioned transfers. | inclusions 1ceycp94sj "A licensed English-speaking Egyptologist", pwq5gc2vdb "private air-conditioned transfers" |
| Stay: every day | The trip is private, operated for your party alone and never shared with a group. | essay 00000000001d: "This is a private departure — operated for your party alone, never a shared group." |
| Fit for | are visiting for the first time and want Cairo properly read | audience: "First-timers wanting Cairo properly read" |
| Fit for | are returning to Egypt for the new Grand Egyptian Museum | audience: "repeat visitors returning for the new Grand Egyptian Museum" |
| Fit for | prefer one city done well over several done lightly | audience: "travellers who prefer one city done well over several done lightly" |
| Worth knowing | The schedule is full. Early starts protect you from the worst of the midday heat at Giza (Day 1) and Saqqara (Day 3). | essay 00000000001d: "The schedule is full but not loose — early starts protect you from the worst of the midday heat at Giza and Saqqara" |
| Worth knowing | Day 2 is slower by design: the museum rewards depth over coverage, and your Egyptologist shapes the route to your interests. | essay 000000000011: "This is a day for slowing down; the museum rewards depth over coverage, and our Egyptologist will shape the route to your interests" |
| Worth knowing | The royal mummies are not at the Grand Egyptian Museum; they remain at the National Museum of Egyptian Civilisation. | essay 000000000011: "(The royal mummies remain at the National Museum of Egyptian Civilisation…)" |
| Worth knowing | The Pyramid of Khafre interior, if you choose it, is a low, steep passage. | essay 00000000000d: "The option to enter the Pyramid of Khafre — a low, steep passage" |
| Worth knowing | Children are welcome on request. | essay 00000000001d: "children are welcome on request" |
| Make it yours intro | This is a private journey, built around your party. Common changes: | concierge: "A private journey is built around your party, not the other way around." |
| Option | Spend a longer day at the Grand Egyptian Museum | opts; concierge "a longer GEM day" |
| Option | Add a visit to Dahshur | opts; concierge "a Dahshur add-on" |
| Option | Swap the Tanoura evening for a dinner cruise | opts; concierge "the Tanoura evening swapped for a dinner cruise" |
| Option | Enter the Pyramid of Khafre | opts; essay 00000000000d "The option to enter the Pyramid of Khafre" |
| Closing line | Four days will not exhaust Cairo. What they give you is the right four days — the monuments in the right order, with enough time at each to make them mean something. | essay 00000000001f (verbatim) |
| Excluded → see Day | (none) | `excl` is empty — no exclusion rows to place |

### Essay block → where it appears

| _key | Style | Destination |
|---|---|---|
| 000000000001 | h2 | dropped (heading) |
| 000000000003 | normal | whyRouteRefs (intro; also source of Opening) |
| 000000000005 | normal | whyRouteRefs (intro; also source of Opening) |
| 000000000007 | normal | whyRouteRefs (route logic) |
| 000000000009 | normal | whyRouteRefs (route logic) |
| 00000000000b | h3 | dropped (heading) |
| 00000000000d | normal | Day 1 narrativeRefs |
| 00000000000f | h3 | dropped (heading) |
| 000000000011 | normal | Day 2 narrativeRefs |
| 000000000013 | h3 | dropped (heading) |
| 000000000015 | normal | Day 3 narrativeRefs |
| 000000000017 | h3 | dropped (heading) |
| 000000000019 | normal | Day 4 narrativeRefs |
| 00000000001b | h3 | dropped (heading) |
| 00000000001d | normal | whyRouteRefs (general "how it works" passage; source of stayAndTravel, pace, worthKnowing) |
| 00000000001f | normal | closingRef |
| 000000000021 | normal | whyRouteRefs ("The shape of the journey" label line) |
| 000000000023 | bullet | whyRouteRefs (shape of the journey) |
| 000000000025 | bullet | whyRouteRefs (shape of the journey) |
| 000000000027 | bullet | whyRouteRefs (shape of the journey) |

Guide links: not proposed here (no guide-page index supplied); every site in "The day" rows is currently unmatched.

Note for reviewer: Day 3 afternoon (51 words) and evening (33 words) segments are below the 60-word target; the essay has no further facts for them.
