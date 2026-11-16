/**
 * 7-Day tour (wp-page-136519, /epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs)
 * in the multi-day itinerary format, EN. Text is copied verbatim from the
 * owner-approved reference draft "7-day-egypt-tour-itinerary.md" (2026-11-16);
 * owner facts from the brief's section 6 applied. Imported as approved
 * (needsReview: false), per the brief §4.1.
 *
 * Essay block keys (EN body) referenced by the expanders:
 *   03 05 07 09  essay introduction  → "More about this route"
 *   2f 31 33 35  "The shape of the journey" list → "More about this route"
 *   0d → Day 1 · 0f → Day 2 · 13 15 17 19 → Day 3 · 1d 1f → Day 4
 *   21 → Day 5 · 25 27 → Day 6 · 2b → Day 7 · 2d = the closing line
 *   Headings 01 0b 11 1b 23 29 are replaced by the day headings (brief §0 rule).
 */

const k = (n) => `0000000000${n}`;

// EN Not-included rows (existing _keys) that a day's extras point at.
export const EXCL = {
  pyramidInterior: 'y2sxl9wr3q',
  mummiesRoom: 'uymzrznkg4',
  museumSwap: 'w1q8ecn1vn',
  tombs: 'r5efoza5az',
  // New rows (owner facts §6.3 and §6.4).
  cairoHours: 'itin7cairohrs',
  abuSimbel: 'itin7abusimbel',
};

// Guide pages (EN slugs shown in the review file; the reference resolves per language).
const G = {
  khufu: 'guideArticle.giza.the-great-pyramid-of-khufu',
  sphinx: 'guideArticle.giza.the-great-sphinx',
  egyptianMuseum: 'guideArticle.cairo.egyptian-museum-of-antiquities',
  khan: 'guideArticle.cairo.khan-el-khalili',
  highDam: 'wp-page-59236',
  philae: 'guideArticle.aswan.the-philae-temple',
  obelisk: 'guideArticle.aswan.the-unfinished-obelisk',
  komOmbo: 'guideArticle.kom-ombo.the-temple-of-kom-ombo',
  edfu: 'guideArticle.edfu.edfu-temple',
  valley: 'guideArticle.luxor.valley-of-the-kings',
  hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut',
  memnon: 'guideArticle.luxor.the-colossi-of-memnon',
  karnak: 'guideArticle.luxor.the-karnak-temple',
  luxorTemple: 'guideArticle.luxor.the-luxor-temple',
  muizz: 'guideArticle.cairo.sharia-al-muizz-li-din-allah',
};
export const GUIDE_IDS = Object.values(G);

const site = (name, id) => ({ _type: 'daySite', name, ...(id ? { guideRef: { _type: 'reference', _ref: id, _weak: true } } : {}) });
const meal = (m, extra = {}) => ({ _type: 'dayMeal', meal: m, ...extra });
const para = (text) => ({ _type: 'block', style: 'normal', markDefs: [], children: [{ _type: 'span', text, marks: [] }] });
const seg = (label, text, heading) => ({ _type: 'daySegment', label, ...(heading ? { heading } : {}), text });
const opt = (text, cost, exclusionRef) => ({ _type: 'dayOptional', text, ...(cost ? { cost } : {}), exclusionRef });

/** EN days. Existing EN row _keys are kept so the patch replaces in place. */
export const DAYS_EN = [
  {
    day: 1,
    place: 'Cairo',
    title: 'Arrival and a welcome dinner',
    body: [para("You're met at Cairo International Airport and taken to your hotel. There's no sightseeing today, just arrival. Cairo is a city of twenty million people, and an evening to take in its noise and pace isn't wasted. In the evening, a welcome dinner at a restaurant.")],
    sites: [site('Arrival'), site('welcome dinner')],
    overnight: 'Cairo hotel',
    meals: [meal('dinner')],
    travel: 'Meet and greet at the airport, private transfer to your hotel',
    pace: 'Easy',
    narrativeRefs: [k('0d')],
  },
  {
    day: 2,
    place: 'Cairo → sleeper train',
    title: 'Giza, the Egyptian Museum and Khan el-Khalili',
    segments: [
      seg('morning', 'The Giza plateau: the pyramids of Khufu, Khafre and Menkaure, built around 2500 BC, and the Great Sphinx below them.'),
      seg('afternoon', 'The Egyptian Museum on Tahrir Square, one of the densest collections of pharaonic material anywhere: statuary, papyri and the Tanis royal gold. Lunch is at a local restaurant.'),
      seg('evening', 'Khan el-Khalili, the bazaar quarter that has traded continuously since the fourteenth century. Then you board the overnight sleeper train south towards Aswan, with dinner served on board.'),
    ],
    sites: [site('Giza pyramids', G.khufu), site('Great Sphinx', G.sphinx), site('Egyptian Museum (Tahrir)', G.egyptianMuseum), site('Khan el-Khalili', G.khan)],
    overnight: 'Sleeper train',
    meals: [meal('breakfast'), meal('lunch'), meal('dinner', { note: 'on the train' })],
    travel: 'Private transfers · overnight train Cairo → Aswan',
    pace: 'The longest day of the trip, with the most moving parts',
    optional: [
      opt('Inside one of the pyramids (Khufu, Khafre or Menkaure): a steep, narrow descent, extra ticket', 'extraTicket', EXCL.pyramidInterior),
      opt('The Mummies Room at the Egyptian Museum: extra ticket', 'extraTicket', EXCL.mummiesRoom),
      opt("The Grand Egyptian Museum (Tutankhamun's complete tomb contents) or the National Museum of Egyptian Civilisation (the royal mummies) instead of the Tahrir museum: extra cost, on request", 'extraCost', EXCL.museumSwap),
    ],
    narrativeRefs: [k('0f')],
  },
  {
    day: 3,
    place: 'Aswan',
    title: 'Board the cruise: the High Dam, Philae and the Unfinished Obelisk',
    body: [
      para("You arrive in Aswan in the morning and board the Nile cruise ship that will be your hotel for the next three nights. Aswan sits where the Nile narrows towards the first cataract, and it's the country's most unhurried city."),
      para('In the afternoon, the Aswan High Dam, completed in 1970: the project that controlled the annual flood and created Lake Nasser. Then the Temple of Philae, dedicated mainly to Isis and rebuilt block by block on Agilkia Island during the UNESCO rescue of the 1960s and 1970s. You reach it by a short boat crossing. Last, the Unfinished Obelisk, still lying in its granite quarry, abandoned around 1500 BC when a crack appeared in the stone.'),
    ],
    sites: [site('Aswan High Dam', G.highDam), site('Temple of Philae', G.philae), site('Unfinished Obelisk', G.obelisk)],
    overnight: 'Nile cruise ship',
    meals: [meal('breakfast', { note: 'on the train' }), meal('lunch'), meal('dinner')],
    travel: 'Arrive by sleeper train · boat crossing to Philae',
    pace: 'Arrival morning, sightseeing afternoon',
    narrativeRefs: [k('13'), k('15'), k('17'), k('19')],
  },
  {
    day: 4,
    place: 'On the Nile',
    title: 'Sailing north to Kom Ombo',
    body: [
      para('The most leisurely day of the trip. The cruise sails north from Aswan, and the hours on deck are as much the point as the stop: desert cliffs, palm-lined banks, the occasional village and heron.'),
      para('At Kom Ombo, a Ptolemaic temple built for two gods at once, Sobek the crocodile god and Horus the Elder, laid out in perfect symmetry with duplicate halls and sanctuaries for each. It also holds one of the few surviving ancient Egyptian calendars carved in relief, and a small museum of mummified crocodiles found nearby.'),
    ],
    sites: [site('Nile sailing'), site('Temple of Kom Ombo', G.komOmbo), site('Crocodile Museum')],
    overnight: 'Nile cruise ship',
    meals: [meal('breakfast'), meal('lunch'), meal('dinner')],
    travel: 'By cruise',
    pace: 'Relaxed sailing with a shore visit',
    narrativeRefs: [k('1d'), k('1f')],
  },
  {
    day: 5,
    place: 'On the Nile → Luxor',
    title: 'The Temple of Horus at Edfu',
    body: [
      para('The morning is spent at Edfu, the most completely preserved temple in Egypt, built between 237 and 57 BC. Its walls, roof, forecourt and inner sanctuary are largely intact, so you can follow the processional route from the open courtyard through the hypostyle hall to the sanctuary where the statue of Horus stood. Two granite falcons guard the entrance pylon, and the walls carry reliefs of the struggle between Horus and Set.'),
      para('The afternoon is unscheduled, and the ship reaches Luxor by evening.'),
    ],
    sites: [site('Temple of Horus at Edfu', G.edfu), site('sailing to Luxor')],
    overnight: 'Nile cruise ship',
    meals: [meal('breakfast'), meal('lunch'), meal('dinner')],
    travel: 'By cruise',
    pace: 'Morning visit, free afternoon',
    narrativeRefs: [k('21')],
  },
  {
    day: 6,
    place: 'Luxor → Cairo',
    title: 'The West Bank, Karnak and Luxor Temple, then the flight to Cairo',
    segments: [
      seg('morning', 'The Valley of the Kings, with more than sixty royal tombs cut into the limestone and painted with scenes of the afterlife. Then the terraced Mortuary Temple of Hatshepsut at Deir el-Bahari, and the Colossi of Memnon, all that stands above ground of a once-enormous mortuary temple.', 'Morning: the West Bank'),
      seg('midday', 'Karnak, a temple city built and rebuilt over about 1,500 years. Its Great Hypostyle Hall has 134 columns rising to 21 metres. Lunch is at a local restaurant.', 'Midday: the East Bank'),
      seg('afternoon', 'Luxor Temple, linked to Karnak by the Avenue of Sphinxes, then a domestic flight to Cairo. In the evening, Muizz Street in Old Cairo, the spine of the medieval Fatimid city and busy until late, followed by a farewell dinner at a restaurant.', 'Afternoon and evening'),
    ],
    sites: [
      site('Valley of the Kings', G.valley),
      site('Temple of Hatshepsut', G.hatshepsut),
      site('Colossi of Memnon', G.memnon),
      site('Karnak', G.karnak),
      site('Luxor Temple', G.luxorTemple),
      site('Muizz Street', G.muizz),
    ],
    overnight: 'Cairo hotel',
    meals: [meal('breakfast', { note: 'on the cruise' }), meal('lunch'), meal('dinner', { label: 'farewell dinner' })],
    travel: 'Private transfers · domestic flight Luxor → Cairo · private transfer to your hotel',
    pace: 'The fullest day of the trip, with an early start',
    optional: [opt('The tombs of Tutankhamun, Sety I and Ramses VI in the Valley of the Kings: extra tickets, one each', 'extraTicket', EXCL.tombs)],
    narrativeRefs: [k('25'), k('27')],
  },
  {
    day: 7,
    place: 'Cairo',
    title: 'Departure',
    body: [para('A final breakfast and the transfer to Cairo International Airport.')],
    overnight: null,
    meals: [meal('breakfast')],
    travel: 'Private transfer to the airport',
    pace: 'Easy',
    optional: [opt('With a late flight, a few more hours in Cairo can be arranged. This is an optional extra, planned around your flight time.', 'extraCost', EXCL.cairoHours)],
    narrativeRefs: [k('2b')],
  },
];

export const INTRO_EN = {
  _type: 'itineraryIntro',
  lang: 'en',
  opening:
    "A private week that runs the length of Egypt: Cairo, the sleeper train south, three nights on the Nile between Aswan and Luxor, and the temples of ancient Thebes. You won't see everything in seven days, and no one does. You will see Cairo, the river and Luxor in an order where each place adds context to the next.",
  whyRoute:
    "You travel south from Cairo to Aswan by overnight sleeper train, then north along the Nile by cruise to Luxor, then back to Cairo by domestic flight. Sailing north, the current is with you, and each temple adds context for the one before. Aswan, Egypt's southernmost city and its most relaxed, makes an easy arrival point. Luxor's great concentrated monuments come last, on the fullest day of the trip. Cairo bookends the week: one short night at the start, one night at the end.",
  whyRouteRefs: [k('03'), k('05'), k('07'), k('09'), k('2f'), k('31'), k('33'), k('35')],
  closingLine: 'Seven days is not enough to know Egypt. It is enough to begin — and this itinerary makes sure the beginning counts.',
  closingRef: k('2d'),
  stayAndTravel: {
    hotels: 'two nights in a five-star Cairo hotel. Standard is Hilton or Sheraton class. Deluxe (Kempinski or Fairmont class) and Luxury (Four Seasons or St. Regis class) are available on request.',
    river: 'three nights aboard a five-star cruise ship between Aswan and Luxor, full board.',
    train: 'the overnight train from Cairo to Aswan, with dinner and breakfast on board.',
    flight: 'a domestic flight from Luxor back to Cairo.',
    everyDay: 'a licensed English-speaking Egyptologist, and private air-conditioned transfers. The trip is private, operated for your party alone and never shared with a group.',
  },
  fitFor: [
    'are visiting Egypt for the first time and want its essential route in one week',
    'prefer three nights on a cruise to moving between hotels',
    'have one week and want to spend it properly',
  ],
  worthKnowing: [
    "Days 2 and 6 are long and start early. That's what makes Cairo, the river and Luxor possible in seven days.",
    'Day 4 is slow by design, with most of it spent sailing.',
    'The pyramid interior, if you choose it, is a steep, narrow, airless descent.',
  ],
  makeItYoursIntro: 'This is a private journey, built around your party. Common changes:',
  source: 'Owner-approved reference draft "7-day-egypt-tour-itinerary.md" (2026-11-16), imported as approved.',
  needsReview: false,
};

/** Owner fact §6.1: the meals inclusion, EN + ES + JA (existing row _keys). */
export const MEALS_INCLUSION = {
  iwycmmxpn4: 'Breakfast from day two; lunch on every sightseeing day; welcome dinner on day one; farewell dinner on day six',
  mghr4rsmpv: 'Desayuno desde el segundo día; almuerzo cada día de visitas; cena de bienvenida el primer día; cena de despedida el sexto día',
  mefqr3opql: '2日目からの朝食、観光日の昼食、初日のウェルカムディナー、6日目のお別れの夕食',
};

/** New EN Not-included rows (owner facts §6.3, §6.4). */
export const NEW_EXCLUSIONS_EN = [
  { _key: EXCL.abuSimbel, _type: 'productFact', lang: 'en', text: 'Abu Simbel: optional extra', seeSection: 'make-it-yours', source: 'Owner fact (brief §6.4): Abu Simbel is not included; it is an optional extra.', needsReview: false },
  { _key: EXCL.cairoHours, _type: 'productFact', lang: 'en', text: 'Extra hours in Cairo before a late departure: optional', source: 'Owner fact (brief §6.3): extra hours in Cairo before a late flight are optional, depending on flight time.', needsReview: false },
];

/** EN "Make it your own" options, as in the reference (replace the 4 EN rows in review). */
export const OPTIONS_EN = [
  "Add Abu Simbel while you're in Aswan (optional extra)",
  'See the Grand Egyptian Museum instead of the Tahrir museum',
  'Fly south instead of taking the sleeper train',
  'Upgrade the hotels to Deluxe or Luxury class',
];
