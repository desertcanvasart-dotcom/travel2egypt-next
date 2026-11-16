/**
 * Giza, Memphis & Saqqara (tour.private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara)
 * in the day-tour format, EN. Every string is copied from the owner's locked file
 * review/locked/giza-memphis-saqqara-day-tour.md (2026-11-16); the import's verbatim
 * pre-flight aborts on any drift. Times only where the file gives them (08:30, 17:00).
 * Glance labels are the stop titles themselves (no new wording).
 */

const G = {
  khufu: 'guideArticle.giza.the-great-pyramid-of-khufu',
  khafre: 'guideArticle.giza.pyramid-of-khafre',
  menkaure: 'guideArticle.giza.pyramid-of-menkaure',
  sphinx: 'guideArticle.giza.the-great-sphinx',
  memphis: 'guideArticle.giza.memphis-mit-rahina',
  saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  imhotep: 'guideArticle.giza.imhotep-museum-at-saqqara',
};
export const GUIDE_IDS = Object.values(G);
export const DOC_ID = 'tour.private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara';
export const LOCKED_EN = 'review/locked/giza-memphis-saqqara-day-tour.md';
/** Essay block that is the closing line ("One day is not enough. It is, however, a start."). */
export const CLOSING_REF = '00000000003b';

const site = (name, id) => ({ _type: 'dayTourSite', name, ...(id ? { guideRef: { _type: 'reference', _ref: id, _weak: true } } : {}) });
const stop = (x) => ({ _type: 'dayTourStop', ...x });
const CAMEL = 'We work with handlers we know, whose animals are in good condition, and the ride is entirely your choice.';

const PERIODS = [
  {
    period: 'morning',
    periodLabel: 'The Giza Plateau',
    stops: [
      stop({ time: '08:30', title: 'Pickup from your hotel', text: 'Your driver and Egyptologist guide collect you.' }),
      stop({
        title: 'The three pyramids',
        text: 'Khufu, Khafre and Menkaure were built within about eighty years of each other, around 2500 BC. You start at the Great Pyramid of Khufu, the last of the Seven Wonders of the ancient world still standing. At 146 metres it was the tallest man-made structure on earth for nearly four thousand years, and it is aligned to true north within a fraction of a degree. Then Khafre, which keeps a band of its original polished casing near the top, and Menkaure, the smallest of the three.',
        sites: [site('Great Pyramid of Khufu', G.khufu), site('Pyramid of Khafre', G.khafre), site('Pyramid of Menkaure', G.menkaure)],
        includedNote: 'Inside a pyramid (included). You go inside the pyramid of Khafre or Menkaure, subject to site rules and availability on the day. A narrow descending passage leads to the burial chamber. It needs some crouching and isn’t for the claustrophobic.',
      }),
      stop({ title: 'The panorama viewpoint', text: 'A rise in the desert where all three pyramids line up in one frame, the angle that shows how they relate to each other. This is the photography stop.' }),
      stop({
        title: 'The Great Sphinx and the Valley Temple',
        text: 'The Sphinx, 73 metres long and 20 metres high, carved from a single limestone outcrop during Khafre’s reign: the largest monolithic statue in the world. Beside it, the Valley Temple.',
        sites: [site('Great Sphinx', G.sphinx), site('Valley Temple of Khafre')],
      }),
      stop({
        title: 'Optional extras, if you’ve chosen them',
        skipGlance: true,
        optional: [
          { _key: 'o1', _type: 'dayTourOptional', text: 'Inside the Great Pyramid of Khufu: extra ticket, subject to availability and site rules on the day', cost: 'extraTicket' },
          { _key: 'o2', _type: 'dayTourOptional', text: 'A camel ride at the panorama area: extra cost.', cost: 'extraCost', note: CAMEL },
        ],
      }),
    ],
  },
  {
    period: 'midday',
    periodLabel: 'Memphis and lunch',
    stops: [
      stop({
        title: 'Memphis',
        text: 'Founded around 3100 BC by Narmer (Menes in ancient sources) as the capital of a newly unified Egypt, and a major city for three thousand years. Most of it now lies under farmland; what you visit is an open-air museum in a palm-shaded garden. The centrepiece is a colossal limestone statue of Ramses II, lying on its back because its legs are missing, with fine detail in the face and torso. Nearby is the Alabaster Sphinx, carved from a single block of calcite and better preserved than the Sphinx at Giza.',
        sites: [site('Memphis open-air museum', G.memphis), site('Colossus of Ramses II'), site('Alabaster Sphinx')],
      }),
      stop({ title: 'Lunch at a local restaurant (included)', text: 'Drinks aren’t included.' }),
    ],
  },
  {
    period: 'afternoon',
    periodLabel: 'Saqqara',
    stops: [
      stop({
        title: 'The Step Pyramid of Djoser',
        text: 'Built around 2650 BC by the architect Imhotep: Egypt’s first pyramid, and the oldest large-scale cut-stone building in the world. Six levels of decreasing size rise to 62 metres. Around it, the funerary complex sits within a 10-metre enclosure wall.',
        sites: [site('Step Pyramid of Djoser'), site('Saqqara necropolis', G.saqqara), site('Imhotep Museum', G.imhotep)],
      }),
      stop({ title: 'The Imhotep Museum', text: 'The site museum at the entrance to Saqqara, named after Djoser’s architect. Included in your visit.' }),
      stop({
        title: 'Optional extra, if you’ve chosen it',
        skipGlance: true,
        optional: [
          { _key: 'o1', _type: 'dayTourOptional', text: 'The painted mastaba tombs of Mereruka, Kagemni and Ti, with reliefs of daily life in the Old Kingdom: farming, fishing, bread-making, herding cattle. Not included in the standard visit.', cost: 'extraTicket' },
        ],
      }),
      stop({ time: '17:00', title: 'Back to your hotel' }),
    ],
  },
];

export const TIMELINE_EN = PERIODS.map((p, i) => ({
  _key: `dt-en-${i + 1}`,
  _type: 'dayTourPeriod',
  lang: 'en',
  ...p,
  stops: p.stops.map((s, j) => ({ _key: `s${i + 1}-${j + 1}`, ...s, ...(s.sites ? { sites: s.sites.map((x, k) => ({ _key: `x${i + 1}${j + 1}${k}`, ...x })) } : {}) })),
  source: `Owner's locked file ${LOCKED_EN}.`,
  needsReview: true,
}));

export const INTRO_EN = {
  _key: 'dti-en',
  _type: 'dayTourIntro',
  lang: 'en',
  opening:
    'Many visitors to Cairo see Giza and go no further. This private day carries on south: to Memphis, the first capital of a unified Egypt, and to Saqqara, where Djoser’s Step Pyramid shows the idea of the pyramid a century before Giza perfected it. Three sites, all within about forty kilometres of central Cairo, in one long, full day.',
  whyThisOrder:
    'Giza comes first, in the morning, when the plateau is at its clearest and coolest. Then Memphis, now a quiet archaeological park, and finally Saqqara, whose tombs few of the crowds at Giza reach. The drives between them are short. Told in this order, the day runs history backwards, from Khufu’s finished pyramid to Djoser’s first attempt. If you’d rather hear the story forwards, the order can be flipped (see Make it your own).',
  pickupTime: '08:30',
  returnTime: '17:00',
  lunch: { status: 'included', text: 'included, at a local restaurant' },
  fitFor: [
    'have limited time in Cairo and want more than a photo in front of the pyramids',
    'want to understand Egypt’s Old Kingdom, from Khufu’s pyramid back to Djoser’s first',
  ],
  worthKnowing: [
    'It’s a long day on foot, much of it in the sun, so wear comfortable shoes and bring a hat. We supply water; drink more than you think you need.',
    'The pyramid interior means crouching in a narrow passage.',
    'Memphis is quiet and modest. Your guide’s context is what brings it to life.',
  ],
  closingLine: 'One day is not enough. It is, however, a start.',
  closingRef: CLOSING_REF,
  source: `Owner's locked file ${LOCKED_EN}.`,
  needsReview: true,
};

const fact = (prefix, i, text) => ({ _key: `${prefix}${i + 1}`, _type: 'productFact', lang: 'en', text, source: `Owner's locked file ${LOCKED_EN}.`, needsReview: true });

export const INCLUDED_EN = [
  'Private tour for your party',
  'A licensed Egyptologist guide in your language (English, Spanish or Japanese)',
  'Transport in a modern air-conditioned car, with pickup and return to your hotel in Cairo or Giza',
  'Entrance to the Giza Plateau, including the Great Sphinx, the Valley Temple and the panorama viewpoint',
  'Entry inside one pyramid: Khafre or Menkaure',
  'Entrance to the Memphis open-air museum',
  'Entrance to Saqqara: the Step Pyramid complex and the Imhotep Museum',
  'Lunch at a local restaurant',
  'A bottle of water per person',
  'Tipping for your driver',
].map((t, i) => fact('msin', i, t));

export const NOT_INCLUDED_EN = [
  'Inside the Great Pyramid of Khufu: extra ticket',
  'Camel ride: extra cost',
  'The painted mastaba tombs of Mereruka, Kagemni and Ti: optional extra, extra ticket',
  'Drinks',
  'Tipping for your guide: not obligatory, but recommended',
  'Pickup from New Cairo, the New Administrative Capital, Sheikh Zayed or 6th of October: extra charge',
].map((t, i) => fact('msout', i, t));

export const OPTIONS_EN = [
  'Run the day forwards: Saqqara and Memphis first, and the Giza plateau as your finale',
  'Add the Great Pyramid of Khufu, a camel ride, or the painted mastaba tombs at Saqqara',
].map((t, i) => fact('msopt', i, t));

/** Panel duration (canon II.7: a field). The locked panel says "Full day, about 8½ hours". */
export const DURATION_HOURS = 8.5;
