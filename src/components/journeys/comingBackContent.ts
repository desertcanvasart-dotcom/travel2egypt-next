import type { JourneyContent } from './JourneyPage';

/**
 * Locked page copy for /journeys/coming-back (traveller-type page #2).
 *
 * VERBATIM from the owner-approved draft (journeys-coming-back.md v1). DO NOT
 * rewrite, tighten, or expand. Square-bracketed items in the draft were wiring
 * decisions, resolved here (confirmed live slugs; owner picks: Siwa slot-1
 * package, Abydos slot-4, "Egypt Beyond the Pyramids" journal).
 *
 * Same co-located, version-controlled pattern as firstTimeContent — no Sanity
 * schema, no production writes; the route is i18n-wired so localization is
 * later content work.
 *
 * Essay note: the Western Desert paragraph carries an inline cross-reference —
 * "Desert & quiet" links to /#desert-and-quiet for now (implementation note 1;
 * update to /journeys/desert-and-quiet when that page ships), so that
 * paragraph is a segment array rather than a plain string.
 */
export const comingBackContent: JourneyContent = {
  meta: {
    title: 'Coming Back to Egypt',
    description:
      'Planning a return to Egypt — Middle Egypt, Alexandria, Siwa and the far oases. How we plan a second trip around what the first one did not hold.',
  },

  masthead: {
    eyebrow: 'A STARTING POINT · COMING BACK',
    headlineLead: 'The second trip is when Egypt stops introducing itself.',
    headlineAccent: 'And starts talking.',
    standfirst:
      'Middle Egypt, Alexandria, Siwa and the far oases — the country that waits behind the famous one. If you have already done Cairo and the river, the map opens. This is how we plan a return: what the first trip earned you, and where to spend it.',
  },

  essay: [
    'Somewhere on your first trip — probably on the West Bank at Luxor, possibly on a boat deck at sunset — you noticed that Egypt was larger than your itinerary. Most travellers notice it. Fewer act on it. The ones who do are the travellers we most enjoy planning for, because the second trip is where our work gets interesting.',
    'Here is what the first trip bought you: you have seen the essential story, so you no longer need it. No committee in your head insisting on the Pyramids, no guilt about skipping Karnak. The second trip does not have to survey anything. It can go deep into one region and stay there — and Egypt holds at least three regions worth an entire trip.',
    'The first is Middle Egypt, the stretch of the Nile valley that tour buses pass overhead at 30,000 feet. Beni Hasan, where the Middle Kingdom governors cut their tombs into the cliff and painted them with wrestlers and bird-catchers; Amarna, the capital Akhenaten built in five years and history abandoned in fifteen; Tuna el-Gebel and its underground galleries; and at the southern end, Abydos and Dendera — the finest surviving relief carving in Egypt and a ceiling that still carries its original paint. The reason first trips leave this out is not quality. It is geometry: the sites are scattered across two hundred kilometres of valley with thin hotel choices, so the region rewards exactly what a returning traveller has — patience, and no checklist.',
    'The second is Alexandria and the Mediterranean edge, which is less a different region than a different country. Greco-Roman instead of pharaonic, sea light instead of desert light, a corniche instead of a river bank. The catacombs at Kom el-Shoqafa, where Egyptian gods wear Roman armour; the fortress standing on the footprint of the lighthouse; fish restaurants where the menu is whatever the boats brought in. Alexandria is two and a half hours from Cairo by road and a century away in temperament. It pairs naturally with the Delta and the Wadi El Natrun monasteries if you want a northern trip with some quiet in it.',
    [
      'The third is the one we know from the inside: the Western Desert oases. This company was born in Siwa, and we will tell you plainly that it is not on the way to anything — eight hours from Cairo, close to the Libyan border, Berber-speaking, and organised around date gardens, salt lakes and the ruins of an oracle Alexander the Great crossed the desert to consult. That inconvenience is the point. Siwa is what Egypt is like when nothing is arranged for an audience. Beyond it, Dakhla and Kharga carry the old caravan routes south — mud-brick towns, Roman forts, a pace set by wells rather than flights. (If it is the White Desert’s rock formations and a night under the stars you are after, that is its own kind of trip — we plan it under ',
      { text: 'Desert & quiet', hash: 'desert-and-quiet' },
      '.)',
    ],
    'Which of the three is yours depends on what the first trip left you wanting — more of ancient Egypt but deeper, a different Egypt entirely, or an older and quieter one. That is a better conversation than a comparison table, and it is the first question our concierge will ask.',
  ],

  operatorNote: {
    label: 'Insider tip',
    body: 'Returning travellers over-plan. You have done the logistics of Egypt once and know it takes effort, so the instinct is to build the second trip with the same armour. Resist it. One region, one unhurried route through it, and at least one day with nothing scheduled at all. The second trip is where Egypt starts treating you like a guest instead of an audience — give it the room to.',
  },

  spine: {
    heading: 'The shape of the trip',
    rows: [
      { label: 'Length', value: '7–10 days for one region done properly; combining two is possible and we will say what it costs' },
      { label: 'The arc', value: 'one of three: Middle Egypt · Alexandria and the north · Siwa and the far oases' },
      { label: 'The pace', value: 'slower than the first trip, by design; one anchor a day is often enough' },
      { label: 'The season', value: 'October to April for the valley and the oases; Alexandria is at its best when Cairo is at its warmest' },
      { label: 'Best suited to', value: 'travellers who have done Cairo and the river and want the country behind the famous one' },
      { label: 'How it begins', value: 'tell the concierge what your first trip held; we plan around what it didn’t' },
    ],
  },

  weave: {
    heading: 'Where this usually leads',
    items: [
      {
        label: 'The 3-day private Siwa journey from Alexandria',
        href: '/3-day-siwa-journey-from-alexandria',
        sentence: 'The oasis this company comes from, planned by people who do not need a map of it.',
      },
      {
        label: 'Alexandria destination guide',
        href: '/guide/alexandria',
        sentence: 'The Mediterranean city that answers to a different history, and how to give it more than a day trip.',
      },
      {
        label: 'Siwa destination guide',
        href: '/guide/siwa-oasis',
        sentence: 'Eight hours from Cairo and worth every one of them; what to know before you commit.',
      },
      {
        label: 'The temple of Abydos',
        href: '/guide/sohag/abydos-temple',
        sentence: 'The finest carving in Egypt stands in a temple most itineraries never reach.',
      },
    ],
  },

  journal: {
    heading: 'One journal thread',
    card: {
      title: 'Egypt Beyond the Pyramids',
      deck: 'Fayoum, Siwa, Middle Egypt, and the small pyramid fields outside Giza — places easily missed on a first trip, ordered by why they reward the detour.',
      href: '/blog/hidden-gems-of-egypt',
    },
  },

  close: {
    heading: 'The second trip starts from what the first one taught you.',
    body: "Tell the concierge where you have already been and what stayed with you — the temple you didn't want to leave, the afternoon that felt too short. It will plan the return around what your first trip didn't hold, not repeat what it did.",
    ctaLabel: 'Start the conversation',
    ctaHref: '/plan-your-tour',
  },

  crossRef: {
    lead: 'Not quite you? There are ',
    linkText: 'five other places to start',
    hash: 'where-to-begin',
  },
};
