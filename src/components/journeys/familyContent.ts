import type { JourneyContent, LocalizedJourney } from './JourneyPage';

/**
 * Locked page copy for /journeys/travelling-as-a-family (traveller-type page #4).
 *
 * VERBATIM from the owner-approved draft (journeys-travelling-as-a-family.md
 * v1). DO NOT rewrite, tighten, or soften — the toddler honesty and the
 * Christmas/Easter booking note stay word-for-word. Square-bracketed draft
 * items were wiring decisions, resolved here (confirmed live slugs; owner
 * picks). Same co-located pattern as the other journeys pages — no Sanity
 * schema, no production writes. No inline essay links on this page.
 *
 * Flagship (weave slot 1): the essay's middle movement is a Nile CRUISE
 * ("unpacking once", "the pool thirty metres from the temple gangway"). The
 * 11-day candidate's Nile leg is a drive Aswan→Luxor with hotel stays (its
 * own body: "The drive from Aswan to Luxor… pauses twice"; character line
 * "five-star hotels and a Red Sea resort"; cruise offered only as an upsell),
 * so per the owner's rule the featured package is the 14-day, whose Nile leg
 * is an actual cruise ("A Nile cruise carries you north past Kom Ombo and
 * Edfu to Luxor… the cruise ship luxury-grade"), with the Red Sea after the
 * sites.
 */
export const familyContent: LocalizedJourney = {
  en: {
    meta: {
      title: 'Travelling as a Family in Egypt',
      description:
        'Egypt with children — Cairo in short morning strikes, the Nile by boat, a Red Sea close. How we pace a family trip: one anchor a morning, afternoons for the pool.',
    },

    masthead: {
      eyebrow: 'A STARTING POINT · TRAVELLING AS A FAMILY',
      headlineLead: 'Egypt was practically designed for children.',
      headlineAccent: 'Itineraries rarely are.',
      standfirst:
        "Mummies, pyramids you can go inside, a hotel that sails — no destination we know holds a child's attention like this one. The craft is in the pacing: short mornings at the sites, afternoons that belong to the pool, and a trip that ends at the Red Sea instead of in an airport queue. This is how we build Egypt for families.",
    },

    essay: [
      'Families arrive at us carrying one of two worries, and they are opposites. The first: that Egypt will be too much for the children — the heat, the crowds, the distances. The second: that travelling with children means a diluted Egypt, the real trip postponed until they are older. Thirty years of family departures have convinced us both worries are wrong, and for the same reason. Egypt is extraordinary with children. It just cannot be the adult itinerary with children attached.',
      'Consider what this country offers an eight-year-old: a real mummy, not a picture of one. A pyramid with a passage you are allowed to climb down. Tombs painted with snakes and crocodile gods. A boat that is also the hotel. Children do not need Egypt explained to them; they need it paced for them. The attention that evaporates in the third museum hall is bottomless at the rail of a boat watching the riverbank go by.',
      'So the family trip we build has three movements. Cairo first, taken in short, vivid strikes: the Giza plateau early, one pyramid interior while it is still cool, the Tutankhamun galleries taken at a child’s speed — which is fast through some rooms and transfixed in others — and the afternoon at the hotel pool, on purpose. Two anchors a day is our rule for adults; with children it is one, and it happens in the morning.',
      'Then the Nile, which is where Egypt solves family travel almost by itself. A cruise means unpacking once. It means the pool is thirty metres from the temple gangway, the kitchen already knows what your children eat, and the distances between sites cross themselves while everyone sleeps. Temples come one per morning — Kom Ombo’s crocodiles and Edfu’s falcon are reliable hits — and the deck does the rest. We choose the boat deliberately for families: pool size, cabin configuration, and whether the crew are the kind who remember names. They are not all alike, and we know which are which.',
      'Last, the Red Sea — and the order matters. Ending there, rather than starting, gives the trip somewhere to exhale. Three or four nights of reef and pool after the sites are done, when the early mornings have been earned and nobody has to set an alarm. Children remember Egypt as the place with the mummies and the fish, which is a better souvenir than any itinerary can print.',
      'Two practical truths, stated plainly. Ages matter: the trip above is built for school-age children, roughly six and up, who can walk a site in the morning heat and be bribed through the last twenty minutes. It can be built for toddlers, but it becomes a different trip — shorter mornings, more Cairo, less desert — and we will say so rather than sell you the standard one. And seasons matter twice over for families: October to April is Egypt at its kindest, but Christmas and Easter weeks are when every family in Europe has the same idea, so those departures are the ones to settle earliest.',
    ],

    operatorNote: {
      label: 'Honest take',
      body: "A child who spent the morning inside a pyramid does not need the afternoon in a museum. The families who enjoy Egypt most are the ones who accept, on day one, that the pool at four o'clock is part of the itinerary and not a failure of it. Plan one anchor a day for the adults' Egypt. The children's Egypt — the boat rail, the hotel cats, the mango juice — takes care of itself.",
    },

    spine: {
      heading: 'The shape of the trip',
      rows: [
        { label: 'Length', value: '10–12 days with the Red Sea close; 8 without it, and we will tell you which nights to protect' },
        { label: 'The arc', value: 'Cairo · the Nile by boat · the Red Sea' },
        { label: 'The pace', value: 'one anchor a morning; afternoons belong to the pool' },
        { label: 'The season', value: 'October to April; Christmas and Easter weeks book out first, so those plans start earliest' },
        { label: 'Best suited to', value: 'families with school-age children; travelling with toddlers changes the trip, and we will say how' },
        { label: 'How it begins', value: 'tell the concierge the ages; everything else follows from them' },
      ],
    },

    weave: {
      heading: 'Where this usually leads',
      items: [
        {
          label: 'The 14-day private family journey: Cairo, a Nile cruise and the Red Sea',
          href: '/14-day-egypt-luxury-family-holiday',
          sentence: 'The three movements this page describes, built privately and paced for the youngest person on it.',
        },
        {
          label: 'Hurghada destination guide',
          href: '/guide/hurghada',
          sentence: 'Where the trip exhales — the reef, the pool, and which stretch of coast suits families best.',
        },
        {
          label: 'Nile cruises',
          href: '/nile-cruises',
          sentence: 'Not all boats are equal with children aboard; pool size, cabins and crew temperament, and how we choose among them.',
        },
        {
          label: 'The Great Pyramid of Khufu',
          href: '/guide/giza/the-great-pyramid-of-khufu',
          sentence: 'The morning strike that starts the whole trip, and how to time it.',
        },
      ],
    },

    journal: {
      heading: 'One journal thread',
      card: {
        title: 'Egypt with Children',
        deck: 'How to build an Egypt family trip — age, heat, how to show the sites, Nile cruises, the Red Sea, and the desert handled practically.',
        href: '/blog/family-adventures-in-egypt',
      },
    },

    close: {
      heading: 'Every family trip we build starts with the same question.',
      body: 'The ages. Tell the concierge who is coming — six and nine travel differently from thirteen and fifteen — and the pacing, the boat, the hotels and the things worth skipping all follow from the answer.',
      ctaLabel: 'Start the conversation',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: 'Not quite you? There are ',
      linkText: 'five other places to start',
      hash: 'where-to-begin',
    },
  },

  // ES — re-authored per the locked register (journeys-es-travelling-as-a-family.md v1).
  es: {
    meta: {
      title: 'Viajar en familia',
      description:
        'El Cairo en golpes breves, un crucero por el Nilo donde la maleta se deshace una vez y el mar Rojo para exhalar: cómo armamos Egipto al ritmo de los niños.',
    },

    masthead: {
      eyebrow: 'UN PUNTO DE PARTIDA · VIAJAR EN FAMILIA',
      headlineLead: 'Egipto se diseñó prácticamente para niños.',
      headlineAccent: 'Los itinerarios, rara vez.',
      standfirst:
        'Momias, pirámides por dentro, un hotel que navega — ningún destino que conozcamos sostiene la atención de un niño como este. El oficio está en el ritmo: mañanas cortas en los sitios, tardes que son de la piscina, y un viaje que termina en el mar Rojo y no en la cola de un aeropuerto. Así construimos Egipto para familias.',
    },

    essay: [
      'Las familias llegan a nosotros cargando una de dos preocupaciones, y son opuestas. La primera: que Egipto sea demasiado para los niños — el calor, las multitudes, las distancias. La segunda: que viajar con niños signifique un Egipto diluido, el viaje de verdad aplazado hasta que crezcan. Dos décadas de salidas familiares nos han convencido de que ambas están equivocadas, y por la misma razón. Egipto es extraordinario con niños. Solo que no puede ser el itinerario de adultos con niños adjuntos.',
      'Piensa en lo que este país le ofrece a un niño de ocho años: una momia de verdad, no una foto de una. Una pirámide con un pasadizo por el que está permitido bajar. Tumbas pintadas con serpientes y dioses cocodrilo. Un barco que además es el hotel. Los niños no necesitan que les expliquen Egipto; necesitan que se lo pongan a su ritmo. La atención que se evapora en la tercera sala de museo es infinita en la barandilla de un barco viendo pasar la orilla.',
      'Así que el viaje familiar que armamos tiene tres movimientos. Primero El Cairo, tomado en golpes breves y vívidos: la meseta de Guiza temprano, el interior de una pirámide mientras aún refresca, las galerías de Tutankamón al paso de un niño — que es rápido en unas salas y absorto en otras — y la tarde en la piscina del hotel, a propósito. Dos visitas de peso al día es nuestra regla con adultos; con niños es una, y ocurre por la mañana.',
      'Después el Nilo, que es donde Egipto resuelve el viaje familiar casi por sí solo. Un crucero significa deshacer la maleta una vez. Significa que la piscina está a treinta metros de la pasarela del templo, que la cocina ya sabe qué comen tus hijos y que las distancias entre sitios se cruzan solas mientras todos duermen. Los templos llegan de uno en uno por la mañana — los cocodrilos de Kom Ombo y el halcón de Edfu son éxitos fiables — y la cubierta hace el resto. Elegimos el barco deliberadamente para familias: tamaño de la piscina, configuración de los camarotes y si la tripulación es de la que recuerda nombres. No todos son iguales, y sabemos cuál es cuál.',
      'Al final, el mar Rojo — y el orden importa. Terminar allí, en lugar de empezar, le da al viaje un sitio donde exhalar. Tres o cuatro noches de arrecife y piscina cuando los sitios ya están hechos, los madrugones ya se ganaron y nadie tiene que poner alarma. Los niños recuerdan Egipto como el lugar de las momias y los peces, que es mejor recuerdo del que cualquier itinerario puede imprimir.',
      'Dos verdades prácticas, dichas claras. La edad importa: el viaje de arriba está hecho para niños en edad escolar, de unos seis en adelante, capaces de caminar un sitio con el calor de la mañana y de dejarse sobornar los últimos veinte minutos. Puede armarse con niños más pequeños, pero se vuelve otro viaje — mañanas más cortas, más Cairo, menos desierto — y te lo diremos en vez de venderte el estándar. Y la temporada importa dos veces para las familias: de octubre a abril es Egipto en su versión más amable, pero las semanas de Navidad y Semana Santa son cuando media Europa tiene la misma idea, así que esas salidas son las que se cierran antes.',
    ],

    operatorNote: {
      label: 'Opinión honesta',
      body: 'Un niño que pasó la mañana dentro de una pirámide no necesita la tarde en un museo. Las familias que más disfrutan Egipto son las que aceptan, desde el primer día, que la piscina a las cuatro es parte del itinerario y no un fracaso del plan. Planifica una visita de peso al día para el Egipto de los adultos. El Egipto de los niños — la barandilla del barco, los gatos del hotel, el zumo de mango — se cuida solo.',
    },

    spine: {
      heading: 'La forma del viaje',
      rows: [
        { label: 'Duración', value: 'de 10 a 12 días con el cierre en el mar Rojo; 8 sin él, y te diremos qué noches proteger' },
        { label: 'El arco', value: 'El Cairo · el Nilo en barco · el mar Rojo' },
        { label: 'El ritmo', value: 'una visita de peso por mañana; las tardes son de la piscina' },
        { label: 'La temporada', value: 'de octubre a abril; las semanas de Navidad y Semana Santa se agotan primero: esos planes empiezan antes' },
        { label: 'Para quién', value: 'familias con niños en edad escolar; viajar con niños pequeños cambia el viaje, y te diremos cómo' },
        { label: 'Cómo empieza', value: 'dile al concierge las edades; todo lo demás se deriva de ellas' },
      ],
    },

    weave: {
      heading: 'A dónde suele llevar',
      items: [
        {
          label: 'El viaje familiar privado de 11 días: El Cairo, el Nilo y el mar Rojo',
          href: '/el-esplendor-de-egipto-en-11-dias',
          sentence: 'Los tres movimientos que esta página describe, construidos en privado y al ritmo del más pequeño a bordo.',
        },
        {
          label: 'La guía de Hurgada',
          href: '/guide/hurghada',
          sentence: 'Donde el viaje exhala — el arrecife, la piscina y qué tramo de costa conviene más a las familias.',
        },
        {
          label: 'Cruceros por el Nilo',
          href: '/nile-cruises',
          sentence: 'No todos los barcos son iguales con niños a bordo; piscina, camarotes y el carácter de la tripulación, y cómo elegimos entre ellos.',
        },
        {
          label: 'La Gran Pirámide de Keops',
          href: '/guide/guiza/la-gran-piramide-de-keops',
          sentence: 'El golpe de la primera mañana que arranca todo el viaje, y cómo elegir su hora.',
        },
      ],
    },

    journal: {
      heading: 'Un hilo del Diario',
      card: {
        title: 'Egipto con niños',
        deck: 'Guía práctica para organizar un viaje familiar por Egipto: edades, calor, monumentos, crucero por el Nilo, mar Rojo, desierto, salud y ritmo realista.',
        href: '/blog/aventuras-familiares-en-egipto',
      },
    },

    close: {
      heading: 'Cada viaje familiar que construimos empieza con la misma pregunta.',
      body: 'Las edades. Dile al concierge quién viene — seis y nueve viajan distinto que trece y quince — y el ritmo, el barco, los hoteles y lo que conviene saltarse se derivan de la respuesta.',
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
