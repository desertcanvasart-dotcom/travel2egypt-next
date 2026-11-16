/**
 * Giza Pyramids & Grand Egyptian Museum (wp-page-239597,
 * /pyramids-of-giza-and-grand-egyptian-museum) in the day-tour format, EN.
 * Text copied verbatim from the owner-approved reference
 * "day tours/giza-pyramids-gem-day-tour.md" (final, 16 Nov), owner facts
 * applied. Imported as approved (needsReview: false), brief §5.1.
 *
 * The essay (EN body) goes, unchanged, into "More about this day"; block
 * …2b ("Both, in the same day, is the right answer.") is the closing line.
 */

const G = {
  khufu: 'guideArticle.giza.the-great-pyramid-of-khufu',
  khafre: 'guideArticle.giza.pyramid-of-khafre',
  menkaure: 'guideArticle.giza.pyramid-of-menkaure',
  sphinx: 'guideArticle.giza.the-great-sphinx',
};
export const GUIDE_IDS = Object.values(G);

const site = (name, id) => ({ _type: 'dayTourSite', name, ...(id ? { guideRef: { _type: 'reference', _ref: id, _weak: true } } : {}) });
const stop = (x) => ({ _type: 'dayTourStop', ...x });
let n = 0;
const keyed = (arr) => arr.map((x) => ({ _key: `k${++n}`, ...x }));

const CAMEL_LINE = 'We work with handlers we know, whose animals are in good condition, and the ride is entirely your choice.';

export const TIMELINE_EN = [
  {
    period: 'morning',
    periodLabel: 'The Giza Plateau',
    stops: [
      stop({ time: '08:00', title: 'Pickup from your hotel', glanceLabel: 'Pickup', text: 'Your driver and Egyptologist collect you. On the way, your guide asks what matters most to you today (history, photography, pace) and plans the day around it.' }),
      stop({
        time: '09:00',
        title: 'The three pyramids',
        glanceLabel: 'Giza Plateau',
        text: "Khufu, Khafre and Menkaure were built within about eighty years of each other, around 2500 BC. They're the only surviving wonder of the ancient world. You start in front of the Great Pyramid of Khufu, 146 metres tall when it was finished. Then Khafre, the only one where some original casing stones survive near the top. Then Menkaure, the smallest, with granite casing brought from Aswan.",
        sites: [site('Great Pyramid of Khufu', G.khufu), site('Pyramid of Khafre', G.khafre), site('Pyramid of Menkaure', G.menkaure)],
        includedNote: 'Inside a pyramid (included). You go inside the pyramid of Khafre or Menkaure, subject to site rules and availability on the day.',
      }),
      stop({ time: '10:30', title: 'The panorama viewpoint', glanceLabel: 'Panorama', text: 'A rise in the desert south-west of the plateau, where all three pyramids line up in one frame. This is the photography stop.' }),
      stop({
        time: '11:15',
        title: 'The Great Sphinx and the Valley Temple',
        glanceLabel: 'Sphinx & Valley Temple',
        text: 'The Sphinx, carved from the bedrock most probably under Khafre, and the Valley Temple beside it, one of the oldest stone buildings in Egypt. Your guide explains what the Sphinx meant to its builders and to the Egyptians who came after.',
        sites: [site('Great Sphinx', G.sphinx), site('Valley Temple of Khafre')],
      }),
      stop({
        time: '12:30',
        title: "Optional extras, if you've chosen them",
        skipGlance: true,
        optional: keyed([
          { _type: 'dayTourOptional', text: 'Inside the Great Pyramid of Khufu: extra ticket, subject to availability and site rules on the day', cost: 'extraTicket' },
          { _type: 'dayTourOptional', text: 'A camel ride at the panorama area: extra cost.', cost: 'extraCost', note: CAMEL_LINE },
        ]),
      }),
    ],
  },
  {
    period: 'midday',
    periodLabel: 'Lunch',
    stops: [
      stop({ time: '13:15', title: 'Lunch at a local restaurant (included)', glanceLabel: 'Lunch', text: "Chosen for quality and reliability. Dietary requirements can be catered for with advance notice. Drinks aren't included." }),
    ],
  },
  {
    period: 'afternoon',
    periodLabel: 'The Grand Egyptian Museum',
    stops: [
      stop({
        time: '14:30',
        title: 'The Grand Egyptian Museum',
        glanceLabel: 'Grand Egyptian Museum',
        text: "Fully open since 1 November 2025, at the north-east edge of the plateau. It's the largest archaeological museum in the world by floor area, so the visit is focused, not comprehensive. The centrepiece is the Tutankhamun galleries: his complete burial equipment, reassembled for the first time, including the golden throne, the shrines, the canopic equipment and the chariots. After that, your guide follows your interests: Old Kingdom statuary, everyday objects, the grand staircase lined with royal statues.",
        sites: [site('Grand Egyptian Museum'), site('Tutankhamun galleries')],
      }),
      stop({ time: '17:00–18:00', title: 'Back to your hotel', glanceLabel: 'Back', text: "Around 17:00 if you're staying near the pyramids, later for central Cairo. You're back in time to freshen up before dinner, and your guide can suggest an evening plan if you'd like one." }),
    ],
  },
].map((p, i) => ({
  _key: `dt-en-${i + 1}`,
  _type: 'dayTourPeriod',
  lang: 'en',
  ...p,
  stops: p.stops.map((s, j) => ({ _key: `s${i + 1}-${j + 1}`, ...s, ...(s.sites ? { sites: s.sites.map((x, k) => ({ _key: `x${i + 1}${j + 1}${k}`, ...x })) } : {}) })),
  source: 'Owner-approved reference draft "giza-pyramids-gem-day-tour.md" (final, 2026-11-16), imported as approved.',
  needsReview: false,
}));

export const INTRO_EN = {
  _key: 'dti-en',
  _type: 'dayTourIntro',
  lang: 'en',
  opening:
    "The pyramids of Giza in the morning, the Grand Egyptian Museum in the afternoon. In one private day you stand at the base of the largest stone structure ever built, go inside one of the pyramids, look the Great Sphinx in the face, and see Tutankhamun's complete burial equipment, displayed together for the first time. It's a full day, and it moves.",
  whyThisOrder:
    "The plateau comes first, before the heat builds. The museum's air-conditioned halls come in the afternoon, when you'll want them. The 08:00 pickup is early for a reason: Cairo traffic is unpredictable, and the buffer it creates is real. Because the tour is private, your Egyptologist paces the day around you. Linger at Khufu, or move quickly across the plateau and save your energy for the museum.",
  pickupTime: '08:00',
  returnNote: "around 17:00–18:00, depending on your hotel's location",
  lunch: { status: 'included', text: 'included, at a local restaurant' },
  fitFor: [
    'are visiting for the first time and want the essential Cairo day done properly',
    'last visited before the Grand Egyptian Museum opened and want to see what has changed',
    'are travelling with older children who enjoy a well-told history day',
  ],
  worthKnowing: [
    "It's about nine hours. That's a lot for very young children.",
    "The plateau is uneven desert ground, and the pyramid passages are steep and narrow. The museum is very large. It's demanding for anyone with limited mobility.",
    "Cairo traffic can shift the times above. They're approximate.",
    'Children under 12 pay half price.',
  ],
  closingLine: 'Both, in the same day, is the right answer.',
  closingRef: '00000000002b',
  source: 'Owner-approved reference draft "giza-pyramids-gem-day-tour.md" (final, 2026-11-16), imported as approved.',
  needsReview: false,
};

const fact = (prefix, i, text) => ({ _key: `${prefix}${i + 1}`, _type: 'productFact', lang: 'en', text, source: 'Owner-approved reference draft (2026-11-16) and owner rules.', needsReview: false });

export const INCLUDED_EN = [
  'Private tour for your party',
  'A licensed Egyptologist guide in your language (English, Spanish or Japanese)',
  'Transport in a modern air-conditioned car, with pickup and return to your hotel in Cairo or Giza',
  'Entrance to the Giza Plateau, including the Great Sphinx, the Valley Temple and the panorama viewpoint',
  'Entry inside one pyramid: Khafre or Menkaure',
  'Entrance to the Grand Egyptian Museum, including the Tutankhamun galleries',
  'Lunch at a local restaurant',
  'A bottle of water per person',
  'Tipping for your driver',
].map((t, i) => fact('gzin', i, t));

export const NOT_INCLUDED_EN = [
  'Inside the Great Pyramid of Khufu: extra ticket',
  'Camel ride: extra cost',
  'Drinks',
  'Tipping for your guide: not obligatory, but recommended',
  'Pickup from New Cairo, the New Administrative Capital, Sheikh Zayed or 6th of October: extra charge',
].map((t, i) => fact('gzout', i, t));

export const OPTIONS_EN = [
  'Take it slower, or split the pyramids and the museum across two easier days',
  'Tell us which museum wings matter most to you',
  'Add the Great Pyramid of Khufu or a camel ride',
].map((t, i) => fact('gzopt', i, t));
