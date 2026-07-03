import type { JourneyContent } from './JourneyPage';

/**
 * Locked page copy for /journeys/desert-and-quiet (traveller-type page #3).
 *
 * VERBATIM from the owner-approved draft (journeys-desert-and-quiet.md v1). DO
 * NOT rewrite, tighten, or soften — the caution operator note especially stays
 * word-for-word. Square-bracketed draft items were wiring decisions, resolved
 * here (confirmed live slugs; owner picks: 3-day White Desert camp package,
 * "Egypt's Western Desert" journal). Same co-located pattern as the other two
 * journeys pages — no Sanity schema, no production writes.
 *
 * Flagship (weave slot 1): the 2-day Bahariya package overnights at an oasis
 * lodge, not camped in the chalk ("does not overnight in the White Desert"),
 * so per the owner's rule the featured package is the 3-day tour, which camps
 * one night under the stars in the White Desert — matching the locked sentence.
 *
 * Essay note: the "Coming back" cross-reference is an inline link to the live
 * /journeys/coming-back route, so that paragraph is a segment array.
 */
export const desertAndQuietContent: JourneyContent = {
  meta: {
    title: 'Desert & Quiet in Egypt',
    description:
      "Bahariya, the White Desert and Fayoum — Egypt's western silence. How we plan a night camped in the chalk, and the gentler desert for those who want a roof.",
  },

  masthead: {
    eyebrow: 'A STARTING POINT · DESERT & QUIET',
    headlineLead: 'Not everything in Egypt was built.',
    headlineAccent: 'Some of it was left alone.',
    standfirst:
      "Bahariya, the White Desert and Fayoum — the country's western silence, four hours from Cairo's noise. Two days out there change how the rest of Egypt sounds. This is how we plan them: what a night in the chalk actually involves, and the gentler desert for those who want a roof.",
  },

  essay: [
    'Every itinerary we build is, in the end, a sequence of loud places. The temples have crowds, the crowds have guides, the guides have microphones, and Cairo underneath it all runs its permanent engine. None of this is a complaint — the noise is part of what Egypt is. But when travellers tell us, months later, which part of the trip they find themselves returning to at odd moments, a surprising number name the same thing: the night the itinerary went silent.',
    "That night usually happens in the White Desert. The trip is simple to describe. You leave Cairo in the morning and drive southwest — four hours to Bahariya, an oasis of date palms and hot springs where lunch happens and the road ends. From there it is 4x4s: through the Black Desert's dark-capped hills, past Crystal Mountain's ridge of quartz, and into the White Desert by late afternoon, when the low sun starts doing things to the chalk. What the wind has carved there — mushrooms, spires, shapes the guides have named and shapes they haven't — photographs like another planet and behaves like one too. Camp goes up among the formations. Dinner is cooked over fire. A fennec fox will very likely visit, because they have learned what camps mean. And then the main event, which is nothing at all: no light on any horizon, the Milky Way at full strength, and a silence so complete most people realise they have never actually heard one before.",
    'Dawn in the chalk is the other half of the argument. The formations turn from grey to white to gold in about twenty minutes, and you have them to yourself, because there is no gate, no queue, and no one to share them with beyond your own camp.',
    'Then there is the gentler desert. Fayoum is barely two hours from Cairo and holds an astonishing amount in a small compass: Wadi El Rayan’s waterfalls, the lake at Qarun that has been attracting Cairenes since the pharaohs, the pottery village of Tunis, and — the reason we send almost everyone — Wadi El Hitan, the Valley of the Whales, where forty-million-year-old skeletons lie in the open sand, whales with the last traces of the legs they were in the process of losing. Evolution, written where you can walk up and read it. Fayoum works as a long day from Cairo or, better, as a soft overnight in Tunis with a hotel bed, which makes it the desert for travellers who want the silence without the sleeping bag.',
    [
      'How much of a trip should this be? There are two honest answers. For most first visits, the desert is the counterweight: two days folded into the classic itinerary, placed where the temple fatigue would otherwise set in, doing for the trip what a rest note does for music. But for some travellers the desert turns out to be the point — in which case the White Desert is the beginning of a longer road, and Siwa and the far oases continue it. We plan those under ',
      { text: 'Coming back', href: '/journeys/coming-back' },
      '; the two trips are cousins.',
    ],
  ],

  operatorNote: {
    label: 'Caution',
    body: 'Comfortable camping is still camping. Dinner is cooked, the mattresses are thick, the blankets are heavy — and the nearest wall is forty kilometres away. December and January nights touch zero, and the facilities are the desert itself. If that paragraph excites you, this trip is yours. If it gives you pause, take Fayoum and the Tunis overnight instead — the silence is nearly as good, and it comes with a shower.',
  },

  spine: {
    heading: 'The shape of the trip',
    rows: [
      { label: 'Length', value: 'two days and a night for the White Desert; one long day or a soft overnight for Fayoum; four to five days if the desert is the trip' },
      { label: 'The arc', value: 'Cairo · Bahariya · the White Desert — or Cairo · Fayoum for the version with a roof' },
      { label: 'The pace', value: 'one long drive out, then almost nothing scheduled; that is the product' },
      { label: 'The season', value: 'October to April; winter nights near zero, so pack for a hot noon and a cold midnight in the same bag' },
      { label: 'Best suited to', value: 'travellers who want the counterweight to the temples, and sleep better under stars than deadlines' },
      { label: 'How it begins', value: 'tell the concierge one thing first: stars overhead, or a roof' },
    ],
  },

  weave: {
    heading: 'Where this usually leads',
    items: [
      {
        label: 'The 3-day private White Desert camp from Cairo',
        href: '/3-day-bahariya-white-desert-tour',
        sentence: 'The two days and the night this page has been describing, planned by people who know which campsite catches the dawn.',
      },
      {
        label: 'Bahariya destination guide',
        href: '/guide/bahariya-oasis',
        sentence: 'The oasis where the road ends and the 4x4s begin — springs, palms, and the last hot lunch before the chalk.',
      },
      {
        label: 'Fayoum destination guide',
        href: '/guide/al-fayoum',
        sentence: 'The gentler desert two hours from Cairo, and how to give it more than the standard day trip.',
      },
      {
        label: 'The Valley of the Whales',
        href: '/guide/al-fayoum/wadi-al-hittan',
        sentence: 'Whales that still remember having legs, lying in open sand you are allowed to walk.',
      },
    ],
  },

  journal: {
    heading: 'One journal thread',
    card: {
      title: "Egypt's Western Desert",
      deck: 'Egypt’s Western Desert holds oases, the White Desert, Black Desert, ancient caravan routes, Roman temples, and landscapes near Nubia and Libya. Sights and cautions for travellers.',
      href: '/blog/the-western-desert-in-egypt',
    },
  },

  close: {
    heading: 'The desert asks one question before any itinerary does.',
    body: "Stars overhead, or a roof — everything else follows from that. Tell the concierge which traveller you are, and whether the desert is your trip's counterweight or its whole point. The plan will be shaped around the answer.",
    ctaLabel: 'Start the conversation',
    ctaHref: '/plan-your-tour',
  },

  crossRef: {
    lead: 'Not quite you? There are ',
    linkText: 'five other places to start',
    hash: 'where-to-begin',
  },
};
