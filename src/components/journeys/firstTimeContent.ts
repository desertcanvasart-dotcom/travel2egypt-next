/**
 * Locked page copy for /journeys/first-time-in-egypt (traveller-type page #1).
 *
 * VERBATIM from the owner-approved draft (journeys-first-time-in-egypt.md v1).
 * DO NOT rewrite, tighten, or expand. Square-bracketed wiring items from the
 * draft are resolved here (confirmed live slugs; flagship + journal picks made
 * by the owner in Phase 1). If a line ever needs to change, that is a copy
 * decision for the owner, not an edit to make in passing.
 *
 * Per the approved template decision (Phase 1): the copy lives here as a
 * co-located, version-controlled module rather than in Sanity — no schema, no
 * production writes. Localization later (ES/JA) adds locale variants of this
 * module; the route itself is already i18n-wired.
 */

export interface WeaveItem {
  label: string;
  href: string;
  sentence: string;
}

export interface SpineRow {
  label: string;
  value: string;
}

export const firstTimeContent = {
  // Standard SEO metadata (composed for this page — not part of the locked
  // body copy; buildStaticMetadata appends the " — Travel2Egypt" brand suffix).
  meta: {
    title: 'First Time in Egypt',
    description:
      'How we plan a first trip to Egypt — the Cairo-and-the-river arc, the pacing most first trips get wrong, and why the order matters more than the list.',
  },

  // § 1 — Masthead. Headline is the homepage signature construction: a plain
  // line, then an italic line on its own (rendered <h1>{lead} <em>{accent}</em>).
  masthead: {
    eyebrow: 'A STARTING POINT · FIRST TIME IN EGYPT',
    headlineLead: 'Egypt has been rehearsing this introduction for five thousand years.',
    headlineAccent: 'You can afford to take it slowly.',
    standfirst:
      'Cairo, the Nile, Luxor and Aswan — the arc almost every first trip should follow, and the pacing almost every first trip gets wrong. This is how we plan a first Egypt: what belongs in it, what can wait for the second one, and why the order matters more than the list.',
  },

  // § 2 — The essay (paragraphs, in order).
  essay: [
    'There is a version of the first Egypt trip we are asked to build several times a week. It has one night in Cairo, a dawn flight south, four temples a day on the river, and Abu Simbel folded in as a half-day errand. On paper it sees everything. In practice it experiences very little, and its owner comes home tired in a way that has nothing to do with the heat.',
    'So before anything else, one working principle: the first trip is not an inventory. Egypt holds more than any single visit can carry — that is simply true, and pretending otherwise is how itineraries go wrong. The first trip has one job, and it is a good one: the essential story, told in order, at a speed that lets it land.',
    'The essential story runs along the river. Cairo for the beginning — the Giza plateau, the museum halls where the objects from the tombs you are about to visit actually live, and a first evening learning how the city sounds. Then Upper Egypt: the stretch of Nile between Aswan and Luxor, which holds Philae, Kom Ombo, Edfu, Karnak, and the Valley of the Kings in the space of a few unhurried days. That arc — Cairo and the river — is the first trip. It needs eight to ten days to be told properly. It can be compressed into six, and we will tell you plainly what the compression costs.',
    'Two decisions shape everything else.',
    "The first is Cairo. Most itineraries give it a single day, because the Pyramids photograph like a morning's work. They are not. The plateau deserves an unhurried half day on its own, the museum another, and the city — the reason seventeen million people live beside these monuments — an evening at minimum. We plan two full days in Cairo and have rarely met a traveller who regretted the second one.",
    "The second is the order. The conventional route lands in Cairo, does it briskly, and flies to Luxor. We often reverse it: Cairo's opening days, then a flight to Aswan — the gentlest city on the Egyptian Nile — before the boat carries you downstream to Luxor's density. Aswan gives you the river at its calmest while you are still finding your feet: granite islands, Nubian villages, feluccas moving without engines. Luxor, which holds more of ancient Egypt per square kilometre than anywhere on earth, is better met once you have learned to read a temple rather than photograph one. Ending there, rather than starting, changes what you see in it.",
    "Between the two, take the boat. A three- or four-night sailing between Aswan and Luxor remains the best answer to a first trip's middle chapters — not for the deck chairs, but because the temples along this stretch were built to be approached from the water, and arriving the way they were designed to be arrived at is a difference you feel rather than notice.",
    "And then, the harder half of planning: what to leave out. Alexandria, the White Desert, Sinai, the monasteries, Middle Egypt's painted tombs — all of it is real, and none of it belongs in a first trip of ordinary length. Not because it isn't worth your time, but because it is worth more time than a first trip can spare. Egypt rewards the traveller who returns; we have built an entire way of travelling around that fact. Leave something for the person you'll be when you come back.",
  ],

  // Operator note (tone: honest → design-system label "Honest take"), placed
  // at the end of the essay.
  operatorNote: {
    label: 'Honest take',
    body: 'Most first itineraries we are asked to repair share the same flaw: a day too little in Cairo and a site too many everywhere else. If your draft plan has you seeing three temples after lunch, the plan is writing cheques your attention cannot cash. Two anchors a day. The afternoon belongs to the pool, the deck, or the souk — that is not lost time, it is where the morning settles.',
  },

  // § 3 — The shape of the trip (fact spine; sans labels, serif values).
  spine: {
    heading: 'The shape of the trip',
    rows: [
      { label: 'Length', value: '8–10 days told properly; 7 at a push, and we will say what the push costs' },
      { label: 'The arc', value: 'Cairo · Aswan · the river · Luxor' },
      { label: 'The pace', value: 'two anchors a day, afternoons unscheduled by design' },
      { label: 'The season', value: 'October to April is Egypt at its kindest; summer is workable on the water with early mornings and honest planning' },
      { label: 'Best suited to', value: 'travellers who want the essential story told well, not a checklist cleared' },
      { label: 'How it begins', value: 'a conversation with our Cairo concierge, not a checkout' },
    ] as SpineRow[],
  },

  // § 4 — Where this usually leads (curated weave; labels resolve the draft's
  // bracketed wiring — flagship = 10-day Nile Dreamer, the Aswan-first private
  // package that matches the essay's argued order).
  weave: {
    heading: 'Where this usually leads',
    items: [
      {
        label: 'The classic first-time private package',
        href: '/10-days-nile-dreamer-tour-experience',
        sentence: 'The route described above, built privately and paced the way we have argued it should be.',
      },
      {
        label: 'Cairo destination guide',
        href: '/guide/cairo',
        sentence: 'Two days is our minimum; here is what they hold, and what the city asks of you beyond the plateau.',
      },
      {
        label: 'Luxor destination guide',
        href: '/guide/luxor',
        sentence: 'The densest ancient landscape on earth, and how to meet it without going numb by the third tomb.',
      },
      {
        label: 'Nile cruises',
        href: '/nile-cruises',
        sentence: 'The boats we actually put people on, from dahabiyas under sail to the larger ships, and how to choose between them.',
      },
    ] as WeaveItem[],
  },

  // § 5 — One journal thread (single featured piece; owner pick). Title + deck
  // mirror the live article; the slug is the fixed editorial selection.
  journal: {
    heading: 'One journal thread',
    card: {
      title: 'The Giza Plateau Before the Crowd',
      deck: 'What it actually takes to see the Giza pyramids quietly. Early-morning visits, interior tickets, the Sphinx, and the reality of special-access arrangements.',
      href: '/blog/exclusive-access-to-the-giza-pyramid',
    },
  },

  // § 6 — The concierge close. CTA is a plain link to /plan-your-tour (the
  // draft's "first-time context pre-loaded" parenthetical is out of scope).
  close: {
    heading: 'Every first trip we plan begins the same way.',
    body: "Not with dates or a deposit — with a conversation about what you want Egypt to be. Tell the concierge it's your first time. It will ask the questions that matter, in whatever order suits you, and a plan will begin to take shape from the answers.",
    ctaLabel: 'Start the conversation',
    ctaHref: '/plan-your-tour',
  },

  // § 7 — The quiet cross-reference. Links back to the homepage traveller
  // section (#where-to-begin, added to HomeView for this link).
  crossRef: {
    lead: 'Not quite you? There are ',
    linkText: 'five other places to start',
    hash: 'where-to-begin',
  },
} as const;
