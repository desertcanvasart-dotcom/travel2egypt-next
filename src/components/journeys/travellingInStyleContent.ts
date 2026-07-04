import type { JourneyContent, LocalizedJourney } from './JourneyPage';

/**
 * Locked page copy for /journeys/travelling-in-style (traveller-type page #6, the
 * final one). VERBATIM from the owner-approved draft (journeys-travelling-in-style.md
 * v1) with three owner-side amendments applied verbatim:
 *
 *   1. Slot-1 weave sentence — amended to drop "under sail" (no catalogue product is
 *      dahabiya-built; the flagship is the 9-day Prestigious itinerary, which stays at
 *      the Old Cataract but cruises rather than sails). Descriptor label names the hotel.
 *   2. Essay hotels paragraph — Winter Palace clause amended to note it is "under
 *      restoration as this is written" (closed to July 2027; the page must not imply
 *      present bookability).
 *   3. Weave dropped from four slots to THREE (within the 3–5 skeleton spec): there is
 *      no genuine private-access/site-timing guide article, and the exclusive-access
 *      Giza journal piece is reserved by first-time. No placeholder, no substitute.
 *
 * WORLD B strategy (implementation note 1): the essay acknowledges the sister brand
 * Sillage exactly ONCE — a single inline external link in the final essay paragraph,
 * carrying https://sillage-egypte.com/ with target="_blank" rel="noopener noreferrer"
 * to match the sister-brand strip in Footer.tsx. There is no second Sillage reference
 * anywhere (no logo, no banner, not in the weave or the close). The paragraph's closing
 * line deliberately reclaims the page for Travel2Egypt. This is the first and only
 * journey page to use JourneyPage's external-link segment branch.
 *
 * The operator-note thesis line ("The suite is where you sleep; the hour is what you
 * remember") is protected, word-for-word. Same co-located pattern as the other journeys
 * pages — no Sanity schema, no production writes.
 */
export const travellingInStyleContent: LocalizedJourney = {
  en: {
    meta: {
      title: 'Travelling in Style in Egypt',
      description:
        'Dahabiyas under sail, the landmark hotels, a private Egyptologist, and the invisible choreography that makes Egypt effortless. Travel2Egypt at its fullest register — in practice, not adjectives.',
    },

    masthead: {
      eyebrow: 'A STARTING POINT · TRAVELLING IN STYLE',
      headlineLead: 'The rarest luxury in Egypt is not a suite.',
      headlineAccent: 'It is the right hour.',
      standfirst:
        'Dahabiyas under sail, the landmark hotels, a private Egyptologist, and the invisible choreography that makes a complicated country feel effortless. This is Travel2Egypt at its fullest register — and here is what that means in practice, rather than in adjectives.',
    },

    essay: [
      'Egypt is a country where logistics show. Most places can absorb a mediocre plan; here, the difference between a trip that glides and a trip that grinds is decided by a hundred small arrangements you should never have to see. So when we say travelling in style, we do not primarily mean marble. We mean the version of Egypt where nothing is your problem — and where the one resource money genuinely buys in this country, which is timing, has been spent lavishly.',
      "Start with the river, because this is where the choice matters most. The five-star ships are comfortable and we use the best of them, but the fullest version of the Nile is a dahabiya: a shallow-draught sailing boat of eight or ten cabins, or chartered whole, moving under canvas at the river's own speed. A dahabiya moors where the big ships cannot — at islands, at small temples with no queue because there is no dock, at a sandbank for dinner ashore — and it crosses the water in something the ships never offer: quiet. The boats are not interchangeable, their crews less so, and knowing which is which is precisely the kind of thing we are for.",
      'Then the hotels, which in Egypt include a category most countries do not have: hotels that are themselves sites. Mena House with the Pyramids filling its garden windows; the Old Cataract above the First Cataract at Aswan, still trading on the afternoon light that Agatha Christie wrote by; the Winter Palace at Luxor — under restoration as this is written — with a century of arrivals in its corridors. Staying in them is not a room upgrade, it is an extra monument on the itinerary — and they hold few rooms facing the things you came for, which is why these trips are the ones we plan earliest of all.',
      'Guiding, at this register, means one Egyptologist who is yours for the duration — the same person at Giza and at Philae, building on what you saw yesterday instead of restarting the introduction. And it means access spent where it counts: the site at opening when the light is low and the coaches have not arrived, the tomb visited at the quiet hour, the occasional door that opens early or stays open late. Egypt sells no shortage of private-access moments; the craft is knowing which are worth it and which are theatre.',
      "Underneath all of it runs the choreography you should never notice: met at the aircraft door, luggage that migrates on its own, a car already cool, our own people in every city rather than a subcontractor's promise. Twenty years of running this country's ground is the unglamorous asset this entire page rests on, and it is the part no photograph can show.",
      [
        'One more thing, said plainly because the architecture of this house should be visible. There is a register above even this — trips built around a handful of places and almost nothing else, at a cost that stops being a consideration. For those, our family has a dedicated house: ',
        { text: 'Sillage', url: 'https://sillage-egypte.com/' },
        ', rooted in Aswan, smaller and slower than we are. When a plan belongs there, we say so and hand you across personally. Everything below that line — which is nearly everything — is ours, and we are very good at it.',
      ],
    ],

    operatorNote: {
      label: 'Honest take',
      body: 'What money cannot buy in Egypt: a cooler August, a private Valley of the Kings at ten in the morning, or a Giza plateau without the city beside it. What it buys, superbly, is the hour — the temple at first light, the dahabiya mooring the ships cannot reach, the table on the terrace where the sunset actually happens. When budgets are genuinely open, we put the money on the guide and the timing before the suite. The suite is where you sleep; the hour is what you remember.',
    },

    spine: {
      heading: 'The shape of the trip',
      rows: [
        { label: 'Length', value: '10–14 days, unhurried by design' },
        { label: 'The arc', value: 'bespoke, but its spine is usually Cairo · the Nile under sail · Aswan, with the desert or the coast added as the trip asks' },
        { label: 'The pace', value: 'the sites at their best hour, and as empty as timing can make them' },
        { label: 'The season', value: "October to April; the dahabiyas and the landmark hotels' best rooms book out first, so these plans start earliest of all" },
        { label: 'Best suited to', value: 'travellers who measure a trip by how little they had to think about it' },
        { label: 'How it begins', value: 'describe a perfect day to the concierge; we build the trip backwards from it' },
      ],
    },

    weave: {
      heading: 'Where this usually leads',
      items: [
        {
          // Flagship (owner pick): the 9-day Prestigious itinerary — the only route that
          // puts you inside a named landmark hotel (Old Cataract) and on the river.
          // Sentence amended by owner to drop "under sail" (the itinerary cruises).
          label: 'The 9-day private itinerary: Cairo, the river and the Old Cataract',
          href: '/9-days-egypt-prestigious-vacation',
          sentence: 'The fullest single itinerary in the catalogue today — the river, and nights in a hotel that is itself a site.',
        },
        {
          // Slot 2 (dahabiya): the overview article, not a single boat or the general
          // /nile-cruises archive. Locked sentence, unchanged.
          label: 'Dahabiyas — the Nile under sail',
          href: '/blog/dahabiya-nile-cruises-wind-powered-journey',
          sentence: 'Why the smallest boats on the river are the best ones, and how the handful we trust differ.',
        },
        {
          // Slot 3 (landmark hotels): the /hotels archive. Locked sentence, unchanged.
          label: 'The landmark hotels',
          href: '/hotels',
          sentence: 'The hotels that count as monuments, and which rooms face the reason you came.',
        },
      ],
    },

    journal: {
      heading: 'One journal thread',
      card: {
        title: 'Historical Hotels in Egypt',
        deck: 'Mena House, Old Cataract, Winter Palace, Le Metropole, the Windsor — a guide to choosing hotels in Egypt where history shapes the stay itself, not the décor.',
        href: '/blog/historical-hotels-in-egypt',
      },
    },

    close: {
      heading: 'The conversation is the same one. The answers get longer.',
      body: 'Describe the perfect day to the concierge — the hour you like to wake, the point at which a site is yours, what dinner should look like when it goes right — and the trip is built backwards from the answer. Dates, boats and rooms follow; the day comes first.',
      ctaLabel: 'Start the conversation',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: 'Not quite you? There are ',
      linkText: 'five other places to start',
      hash: 'where-to-begin',
    },
  },
};
