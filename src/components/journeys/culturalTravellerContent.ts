import type { JourneyContent } from './JourneyPage';

/**
 * Locked page copy for /journeys/the-cultural-traveller (traveller-type page #5).
 *
 * VERBATIM from the owner-approved draft (journeys-the-cultural-traveller.md
 * v1) with two owner-side amendments applied verbatim: the slot-1 weave
 * sentence and the slot-3 weave sentence (both marked below). DO NOT rewrite,
 * tighten, or soften — the Ramadan operator note and the guide paragraph stay
 * word-for-word, and the "five civilizations" headline count stays as written
 * (pharaonic, Greco-Roman, Coptic Christian, Islamic, Nubian). Same co-located
 * pattern as the other journeys pages — no Sanity schema, no production writes.
 * No inline essay links on this page.
 *
 * Flagship (weave slot 1): there is no purpose-built "layered/five-
 * civilizations" package in the catalogue (a real product gap). Owner chose
 * the closest genuine fit, verified: 10-day-egypt-travel-journey-through-
 * history has real older-layer Cairo content (Coptic quarter — Hanging Church,
 * Abu Serga, Ben Ezra; Islamic — Citadel of Saladin, Mosque of Muhammad Ali,
 * Al-Muizz Street) and real Nubian content (two days: Aswan + Abu Simbel
 * through Nubian desert), private, own Egyptologist, pyramids reserved for the
 * closing day. Labelled for what it is — a layered-history route — not a
 * "cultural product".
 */
export const culturalTravellerContent: JourneyContent = {
  meta: {
    title: 'The Cultural Traveller in Egypt',
    description:
      'Egypt in layers — Islamic and Coptic Cairo, the desert monasteries, Nubian Aswan, and the ancient sites read not toured. The cultural trip, built around the guide.',
  },

  masthead: {
    eyebrow: 'A STARTING POINT · THE CULTURAL TRAVELLER',
    headlineLead: 'Egypt is five civilizations deep.',
    headlineAccent: 'Most trips visit one.',
    standfirst:
      'Islamic and Coptic Cairo, the desert monasteries where monasticism was invented, Nubian Aswan, and the ancient sites read rather than photographed. This is the trip for the traveller who wants the layers — and it is built, more than any other we plan, around who is standing next to you explaining them.',
  },

  essay: [
    'Egypt has a strange problem for a country so rich: its most famous civilization eclipses the other four. The pharaohs are the reason most people come, and fair enough — but they are the first chapter of a book that kept being written. Greco-Roman Alexandria, Christian Egypt inventing monasticism in its deserts, a thousand years of Islamic Cairo, and Nubia running through all of it like a second river. The cultural traveller is the one who wants the whole book. This page is for you, and we should say at the outset that these are the trips our best guides ask to be assigned to.',
    'Start where the layers are thickest. In one Cairo city block — Coptic Cairo, inside the walls of a Roman fortress — stands a synagogue that was once a church, churches built over the fortress gates, and beneath one of them a crypt where tradition holds the Holy Family sheltered. That block is the whole argument for this trip in miniature: nothing in Egypt replaced what came before it; everything moved in upstairs. A twenty-minute drive away, Islamic Cairo runs it forward another millennium — Ibn Tulun’s ninth-century calm, the engineered audacity of Sultan Hassan, al-Muizz street running past six hundred years of facades that are not exhibits but addresses. We walk it with guides who read the inscriptions over the doors, because in this city the buildings are still talking.',
    'Then the desert, for the chapter most itineraries skip entirely. Monasticism — the whole idea of it — began in the Egyptian desert, and the communities that began it are still there. Wadi El Natrun’s monasteries between Cairo and Alexandria; St. Anthony’s by the Red Sea hills, arguably the oldest working monastery on earth. These are not museums with opening hours. They are living houses that receive visitors, which changes how you should arrive: with time, with a little patience for the rhythm of the place, and ideally with our guide who knows which monk likes to talk history.',
    'The ancient sites are still on this trip — but read, not toured. Abydos for Seti I’s reliefs, carved shallow and fine enough that the painters barely needed to help; Karnak taken as an archive rather than a backdrop; the Valley of the Kings with a guide who can stand in front of a wall of text and tell you what it says, which turns out to be the difference between visiting ancient Egypt and meeting it. If you have been to Luxor before, this is the trip on which it becomes a different place.',
    'And Aswan for the living culture the itineraries flatten into a photo stop: Nubia. A Nubian village visited properly — with time, over tea, through someone who belongs there — plus Elephantine’s layered ruins and the Nubian Museum, which is the best-told story in any Egyptian museum and criminally under-visited. Nubian Aswan is also simply the gentlest place on this itinerary, and we place it last for that reason.',
    'A trip like this stands or falls on one thing, and it is not the hotel. It is the guide. Everything this page promises — inscriptions read, monks drawn out, layers separated — happens through a person, and Egyptology-trained guides who can move from hieroglyphs to Mamluk architecture to Coptic liturgy are not interchangeable. We assign them to these trips by name. It is the single most important line in this trip’s plan, and the one we protect first.',
  ],

  operatorNote: {
    label: 'Insider tip',
    body: 'If your trip touches Ramadan, do not route around Islamic Cairo — reroute your days. Site hours shorten, but the evenings become the event: the streets around al-Muizz fill after sunset in a way no other month can show you, and an iftar taken seriously is worth any monument. We shift these itineraries to late mornings and long evenings, and travellers who trusted us on this rank those nights with the tombs.',
  },

  spine: {
    heading: 'The shape of the trip',
    rows: [
      { label: 'Length', value: '9–12 days; the layers do not compress well, and we will say which chapter to cut if you must' },
      { label: 'The arc', value: 'Cairo in layers · the desert monasteries · Luxor and Abydos, read closely · Nubian Aswan' },
      { label: 'The pace', value: 'fewer sites, longer at each; the guide sets the depth' },
      { label: 'The season', value: "October to April; Ramadan reshapes Islamic Cairo's rhythm rather than closing it — see the note above" },
      { label: 'Best suited to', value: 'travellers who read before they travel and want a guide who goes off-script' },
      { label: 'How it begins', value: 'tell the concierge which centuries pull at you; the itinerary follows from the answer' },
    ],
  },

  weave: {
    heading: 'Where this usually leads',
    items: [
      {
        // Owner-amended slot-1 sentence (replaces the draft's original).
        label: 'The 10-day private layered-history route',
        href: '/10-day-egypt-travel-journey-through-history',
        sentence: 'The closest route in the catalogue to the trip this page describes — layered, unhurried, and finished where most trips begin.',
      },
      {
        label: 'Walking Islamic Cairo',
        href: '/guide/cairo/from-al-azhar-to-the-citadel-walking-islamic-cairo',
        sentence: 'A thousand years of architecture that still has addresses, and how to walk it in the right order.',
      },
      {
        // Owner-amended slot-3 sentence + target (Wadi El Natrun monastery,
        // this page's most distinctive territory).
        label: 'The Monastery of St. Macarius the Great',
        href: '/guide/wadi-el-natrun/monastery-of-saint-macarius-the-great',
        sentence: 'The desert houses where monasticism began — still living, still receiving visitors, and this is the one we usually start with.',
      },
      {
        label: 'The Nubian Museum',
        href: '/guide/aswan/the-nubian-museum',
        sentence: "The living culture at the itinerary's gentle end, and how to visit it with the time it deserves.",
      },
    ],
  },

  journal: {
    heading: 'One journal thread',
    card: {
      title: 'A History Reader’s Cairo',
      deck: 'Cairo is a city where the ancient, Coptic, Islamic, medieval, and modern periods all sit on top of each other. A guide for readers of history on how to walk it.',
      href: '/blog/a-history-buffs-guide-to-cairo',
    },
  },

  close: {
    heading: 'This trip starts from a different first question.',
    body: 'Not where you want to go — which Egypt you want. Tell the concierge the centuries that pull at you, the last thing you read about this country, the site you would trade three others to see properly. The itinerary, and more importantly the guide, follow from that.',
    ctaLabel: 'Start the conversation',
    ctaHref: '/plan-your-tour',
  },

  crossRef: {
    lead: 'Not quite you? There are ',
    linkText: 'five other places to start',
    hash: 'where-to-begin',
  },
};
