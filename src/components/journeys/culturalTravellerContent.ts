import type { JourneyContent, LocalizedJourney } from './JourneyPage';

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
export const culturalTravellerContent: LocalizedJourney = {
  en: {
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
  },

  // ES — re-authored per the locked register (journeys-es-the-cultural-traveller.md v1).
  es: {
    meta: {
      title: 'El viajero cultural',
      description:
        'El Cairo islámico y copto, los monasterios donde empezó el monacato, la Asuán nubia y los sitios antiguos leídos de cerca: el Egipto de cinco civilizaciones, con el guía como pieza central.',
    },

    masthead: {
      eyebrow: 'UN PUNTO DE PARTIDA · EL VIAJERO CULTURAL',
      headlineLead: 'Egipto tiene cinco civilizaciones de fondo.',
      headlineAccent: 'La mayoría de los viajes visita una.',
      standfirst:
        'El Cairo islámico y copto, los monasterios del desierto donde se inventó el monacato, la Asuán nubia, y los sitios antiguos leídos en vez de fotografiados. Este es el viaje para quien quiere las capas — y se construye, más que ningún otro que planifiquemos, alrededor de quién está a tu lado explicándolas.',
    },

    essay: [
      'Egipto tiene un problema extraño para un país tan rico: su civilización más famosa eclipsa a las otras cuatro. Los faraones son la razón por la que viene casi todo el mundo, y es comprensible — pero son el primer capítulo de un libro que siguió escribiéndose. La Alejandría grecorromana, el Egipto cristiano inventando el monacato en sus desiertos, mil años de Cairo islámico, y Nubia corriendo por debajo de todo como un segundo río. El viajero cultural es el que quiere el libro entero. Esta página es para ti, y conviene decirlo desde el principio: estos son los viajes que nuestros mejores guías piden que les asignen.',
      'Empieza donde las capas son más gruesas. En una sola manzana de El Cairo — el Cairo copto, dentro de los muros de una fortaleza romana — hay una sinagoga que fue iglesia, iglesias construidas sobre las puertas de la fortaleza, y bajo una de ellas una cripta donde la tradición sitúa el refugio de la Sagrada Familia. Esa manzana es el argumento entero de este viaje en miniatura: en Egipto nada reemplazó lo que había antes; todo se mudó al piso de arriba. A veinte minutos en coche, el Cairo islámico lo prolonga otro milenio — la calma del siglo nueve de Ibn Tulun, la audacia de ingeniería de Sultán Hasán, la calle al-Muizz corriendo entre seiscientos años de fachadas que no son piezas de museo sino direcciones. La caminamos con guías que leen las inscripciones sobre las puertas, porque en esta ciudad los edificios siguen hablando.',
      'Después el desierto, para el capítulo que casi todos los itinerarios se saltan entero. El monacato — la idea misma — empezó en el desierto egipcio, y las comunidades que lo empezaron siguen allí. Los monasterios de Wadi El Natrun entre El Cairo y Alejandría; San Antonio junto a las colinas del mar Rojo, posiblemente el monasterio en activo más antiguo de la tierra. No son museos con horario. Son casas vivas que reciben visitantes, lo que cambia cómo conviene llegar: con tiempo, con algo de paciencia por el ritmo del lugar, e idealmente con nuestro guía, que sabe a qué monje le gusta hablar de historia.',
      'Los sitios antiguos siguen en este viaje — pero leídos, no recorridos. Abidos por los relieves de Seti I, tallados tan finos y tan someros que los pintores apenas tuvieron que ayudar; Karnak tomado como archivo y no como decorado; el Valle de los Reyes con un guía capaz de pararse frente a una pared de texto y decirte qué dice, que resulta ser la diferencia entre visitar el Egipto antiguo y conocerlo. Si ya estuviste en Luxor, este es el viaje en el que se convierte en otro lugar.',
      'Y Asuán por la cultura viva que los itinerarios aplanan en una parada de fotos: Nubia. Una aldea nubia visitada como es debido — con tiempo, con té de por medio, a través de alguien que pertenece allí — más las ruinas estratificadas de Elefantina y el Museo Nubio, que es la historia mejor contada de cualquier museo egipcio y está criminalmente poco visitado. La Asuán nubia es además, sencillamente, el lugar más amable de este itinerario, y por eso lo dejamos para el final.',
      'Un viaje así se sostiene o se cae por una sola cosa, y no es el hotel. Es el guía. Todo lo que promete esta página — inscripciones leídas, monjes que se animan a contar, capas separadas — ocurre a través de una persona, y los guías formados en egiptología capaces de pasar de los jeroglíficos a la arquitectura mameluca y a la liturgia copta no son intercambiables. Los asignamos a estos viajes por nombre. Es la línea más importante del plan de este viaje, y la primera que protegemos.',
    ],

    operatorNote: {
      label: 'Consejo del operador',
      body: 'Si tu viaje toca Ramadán, no esquives el Cairo islámico — reordena tus días. Los horarios de los sitios se acortan, pero las noches se convierten en el acontecimiento: las calles alrededor de al-Muizz se llenan después del atardecer como ningún otro mes puede enseñarte, y un iftar tomado en serio vale cualquier monumento. Movemos estos itinerarios hacia mañanas tardías y noches largas, y los viajeros que nos hicieron caso ponen esas noches a la altura de las tumbas.',
    },

    spine: {
      heading: 'La forma del viaje',
      rows: [
        { label: 'Duración', value: 'de 9 a 12 días; las capas no se comprimen bien, y te diremos qué capítulo cortar si no hay más remedio' },
        { label: 'El arco', value: 'El Cairo en capas · los monasterios del desierto · Luxor y Abidos, leídos de cerca · la Asuán nubia' },
        { label: 'El ritmo', value: 'menos sitios, más tiempo en cada uno; el guía marca la profundidad' },
        { label: 'La temporada', value: 'de octubre a abril; Ramadán reordena el ritmo del Cairo islámico en vez de cerrarlo — ver la nota' },
        { label: 'Para quién', value: 'viajeros que leen antes de viajar y quieren un guía que se salga del guion' },
        { label: 'Cómo empieza', value: 'dile al concierge qué siglos te tiran; el itinerario se deriva de la respuesta' },
      ],
    },

    weave: {
      heading: 'A dónde suele llevar',
      items: [
        {
          label: 'La ruta privada de 10 días por las capas de la historia',
          href: '/patrimonio-egipcio-descubrimiento-cultural-de-10-dias',
          sentence: 'La ruta del catálogo más cercana al viaje que esta página describe — estratificada, sin prisa, y terminada donde la mayoría empieza.',
        },
        {
          label: 'El Cairo islámico, a pie',
          href: '/guide/el-cairo/de-al-azhar-a-la-ciudadela-recorrido-a-pie-por-el-cairo-islamico',
          sentence: 'Mil años de arquitectura que todavía tiene direcciones, y cómo caminarla en el orden correcto.',
        },
        {
          label: 'El monasterio de San Macario',
          href: '/guide/wadi-al-natron/monasterio-de-san-macario-el-grande',
          sentence: 'Las casas del desierto donde empezó el monacato — aún vivas, aún recibiendo, y esta es por la que solemos empezar.',
        },
        {
          label: 'El Museo Nubio',
          href: '/guide/asuan/el-museo-nubio',
          sentence: 'La cultura viva en el final amable del itinerario, y cómo visitarla con el tiempo que merece.',
        },
      ],
    },

    journal: {
      heading: 'Un hilo del Diario',
      card: {
        title: 'El Cairo para amantes de la historia',
        deck: 'El Cairo no pertenece a una sola época: Guiza, el barrio copto, la ciudad islámica, la Ciudadela y el Cairo moderno se superponen en una misma capital.',
        href: '/blog/guia-de-el-cairo-para-aficionados-a-la-historia',
      },
    },

    close: {
      heading: 'Este viaje empieza por una pregunta distinta.',
      body: 'No a dónde quieres ir — qué Egipto quieres. Dile al concierge los siglos que te tiran, lo último que leíste sobre este país, el sitio que cambiarías por otros tres con tal de verlo bien. El itinerario, y sobre todo el guía, se derivan de eso.',
      ctaLabel: 'Empieza la conversación',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: '¿No es lo tuyo? Hay ',
      linkText: 'otros cinco lugares donde empezar',
      hash: 'where-to-begin',
    },
  },
};
