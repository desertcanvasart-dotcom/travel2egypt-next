import type { ReactNode } from 'react';

/**
 * Sales homepage copy, per language. EN is the owner's English spec as built
 * 2026-11-08; ES and JA are the owner's translations
 * (travel2egypt-homepage-es.md / -ja.md, 2026-11-08), entered verbatim.
 *
 * Structure (which products, in what order) lives in ./config.ts and is shared
 * by every language; this file holds only words and the per-language links.
 * Prices are never typed here: each price slot receives a live <Price> node.
 */
export type HomeLocale = 'en' | 'es' | 'ja';

export function homeLocale(l?: string | null): HomeLocale {
  return l === 'es' || l === 'ja' ? l : 'en';
}

type P = ReactNode;

export interface HomeCopy {
  metaTitle: string;
  /** Meta description; prices are preformatted strings (null when unknown). */
  metaDescription: (tourFrom: string | null, dayFrom: string | null) => string;
  itemListName: string;

  /** "from $X" / "desde X €" / "¥X〜" */
  from: (price: P) => ReactNode;
  /** "from $X per person" / "desde X € por persona" / "1名様 ¥X〜" */
  fromPerPerson: (price: P) => ReactNode;
  days: (n: number) => string;
  hours: (n: number) => string;
  priceOnRequest: string;
  /** Added to price lines when the guide-language price is shown ('' in EN). */
  guideNote: string;

  hero: {
    eyebrow: string;
    h1: string;
    sub: (multiDayFrom: P | null, dayFrom: P | null) => ReactNode;
    primary: string;
    secondary: string;
    tripadvisor: (rating: string | number, count: number) => string;
    trips: string;
  };
  finder: {
    label: string;
    want: string;
    tour: string;
    day: string;
    cruise: string;
    lengthLabel: string;
    anyLength: string;
    lengths: Record<'3-5' | '6-9' | '10-14' | '15+', string>;
    cityLabel: string;
    go: string;
  };
  tours: {
    eyebrow: string;
    h2: string;
    intro: string;
    basis: string;
    view: string;
    customise: string;
    seeAll: string;
    smallGroup: string;
    /** Badge + route line per featured product (keyed by EN slug). */
    cards: Record<string, { badge: string; route: string }>;
  };
  promises: { h2: string; items: Array<{ h3: string; p: string }> };
  dayTours: {
    eyebrow: string;
    h2: string;
    intro: string;
    tabsLabel: string;
    check: string;
    private: string;
    smallGroup: string;
    /** Tab label + "see all" link text per city key. */
    cities: Record<string, { label: string; seeAll: string }>;
    /** Card name per product (keyed by EN slug). */
    labels: Record<string, string>;
  };
  nile: {
    eyebrow: string;
    h2: string;
    intro: string;
    rows: { what: string; nights: string; bestFor: string; from: string };
    ship: { name: string; what: string; nights: string; bestFor: string; compare: string };
    dahabiya: { name: string; what: string; nights: string; bestFor: string; compare: string };
    /** Value cell: price node + days. */
    shipFrom: (price: P, days: number | null) => ReactNode;
    dahabiyaFrom: (price: P, days: number | null) => ReactNode;
  };
  styles: {
    eyebrow: string;
    h2: string;
    /** Title + line per style card (keyed by the card's EN href). */
    cards: Record<string, { title: string; line: string }>;
  };
  planning: {
    eyebrow: string;
    h2: string;
    intro: string;
    readAll: string;
    /** Title per guide link (keyed by the link's EN href). */
    links: Record<string, string>;
  };
  close: {
    eyebrow: string;
    h2: string;
    free: string;
    preferChat: string;
    stillExploring: string;
    concierge: string;
  };
  /**
   * EN href → this language's href, for links next-intl doesn't localize
   * (Sanity-slug pages) and for the quick finder, which pushes literal paths
   * (a query string on a pathnames-mapped route isn't localized by the router).
   */
  hrefs: Record<string, string>;
}

const EN: HomeCopy = {
  metaTitle: 'Egypt Tours & Nile Cruises — Private, Priced Openly | Travel2Egypt',
  metaDescription: (t, d) =>
    `${t && d ? `Private Egypt tours from ${t} and day tours from ${d}: ` : 'Private Egypt tours and day tours: '}Cairo, the Nile, Luxor, Aswan and Abu Simbel, customised to your dates. Guiding since 1993.`,
  itemListName: 'Egypt tours to start with',
  from: (p) => <>from {p}</>,
  fromPerPerson: (p) => <>from {p} per person</>,
  days: (n) => `${n} days`,
  hours: (n) => `${n} hours`,
  priceOnRequest: 'Price on request',
  guideNote: '',
  hero: {
    eyebrow: 'Licensed Egyptian operator · Guiding since 1993',
    h1: 'Private Egypt tours, planned by the people who guide them.',
    sub: (m, d) => (
      <>
        Multi-day tours {m && <>from {m}</>} and day tours {d && <>from {d}</>}, priced openly, built around your dates,
        and run on the ground by our own Cairo team.
      </>
    ),
    primary: 'Get my free itinerary',
    secondary: 'Browse Egypt tours →',
    tripadvisor: (r, n) => `${r} on Tripadvisor (${n} reviews)`,
    trips: 'About 230 private trips a year',
  },
  finder: {
    label: 'Find a tour',
    want: 'I want',
    tour: 'A multi-day tour',
    day: 'A day tour',
    cruise: 'A Nile cruise',
    lengthLabel: 'for',
    anyLength: 'Any length',
    lengths: { '3-5': '3–5 days', '6-9': '6–9 days', '10-14': '10–14 days', '15+': '15+ days' },
    cityLabel: 'in',
    go: 'Show tours',
  },
  tours: {
    eyebrow: 'Egypt tours',
    h2: 'Egypt tours to start with',
    intro: 'Every tour is private and can be changed: dates, hotels, pace and sites.',
    basis: 'per person, 2 sharing, 4★/5★ hotels',
    view: 'View tour',
    customise: 'Customise',
    seeAll: 'See all Egypt tours →',
    smallGroup: 'Small-group departures →',
    cards: {
      'epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs': { badge: 'First visit', route: 'Cairo · Nile cruise · Luxor · Aswan' },
      '10-days-nile-dreamer-tour-experience': { badge: 'The full Nile', route: 'Cairo · sleeper train · 3-night cruise · Luxor' },
      '10-day-egypt-travel-journey-through-history': { badge: 'With Abu Simbel & Alexandria', route: 'Cairo · Alexandria · Luxor · Aswan · Abu Simbel' },
      '9-day-classic-egypt-family-adventure': { badge: 'Families', route: 'Cairo · Nile cruise · Aswan, paced for children' },
      '10-day-nile-and-western-desert-tour': { badge: 'Nile & desert', route: 'Cairo · Bahariya · White Desert · the Nile' },
      '4-day-history-culture-escape': { badge: 'Short on time', route: 'Pyramids · Grand Egyptian Museum · Old Cairo' },
    },
  },
  promises: {
    h2: 'What you can count on',
    items: [
      { h3: 'The price before the conversation', p: 'Every tour shows its starting price. Your quote lists every inclusion, with no surprises on arrival.' },
      {
        h3: 'A plan back by the next morning',
        p: 'Send your dates and we reply by 8 PM Cairo time the same day, or by 10 AM the next morning, seven days a week, with a day-by-day itinerary and a firm price.',
      },
      {
        h3: 'Licensed Egyptologist guides',
        p: 'Every private and small-group tour is guided by an Egyptologist licensed by the Ministry of Tourism, and the team that plans your trip is the team that runs it.',
      },
      { h3: 'People on the ground while you travel', p: 'A Cairo team on WhatsApp from arrival to departure. If something goes wrong, we fix it the same day.' },
    ],
  },
  dayTours: {
    eyebrow: 'Day tours',
    h2: 'Day tours in Cairo, Luxor and Aswan',
    intro:
      'Private or small-group, with a licensed Egyptologist guide. Every tour lists exactly what’s included. Pick a date and we confirm it.',
    tabsLabel: 'Day tours by city',
    check: 'Check this date',
    private: 'Private',
    smallGroup: 'Small group',
    cities: {
      cairo: { label: 'Cairo & Giza', seeAll: 'See all Cairo & Giza day tours →' },
      luxor: { label: 'Luxor', seeAll: 'See all Luxor day tours →' },
      aswan: { label: 'Aswan & Abu Simbel', seeAll: 'See all Aswan & Abu Simbel day tours →' },
      alexandria: { label: 'Alexandria', seeAll: 'See all Alexandria day tours →' },
    },
    labels: {
      'pyramids-of-giza-and-grand-egyptian-museum': 'Giza Pyramids & the Grand Egyptian Museum',
      'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara': 'Giza, Memphis & Saqqara',
      'pyramids-of-giza-and-sphinx-group-day-tour': 'The Pyramids & the Sphinx',
      'day-tour-to-karnak-luxor-temples-luxor-museum': 'Karnak, Luxor Temple & the Luxor Museum',
      'grand-west-bank-group-day-tour-luxor': 'The Grand West Bank',
      'skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience': 'Luxor sunrise balloon',
      'abu-simbel-by-car-from-aswan': 'Abu Simbel by car from Aswan',
      'nubian-temples-day-tour-from-aswan': 'Nubian temples: Kalabsha & Beit el-Wali',
      'aswan-felucca-adventure': 'Felucca sail with a Nile-side lunch',
      '2-day-pyramids-mediterranean-tour': 'Alexandria in a day: catacombs & the coast',
      'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo': 'Alexandria from Cairo',
    },
  },
  nile: {
    eyebrow: 'On the Nile',
    h2: 'Sail the Nile between Luxor and Aswan',
    intro: 'Five-star cruise ships or small sailing dahabiyas. We only sell the boats we would put our own families on.',
    rows: { what: 'What it is', nights: 'Nights', bestFor: 'Best for', from: 'Starting at' },
    ship: { name: 'Nile cruise', what: 'A five-star ship with a pool', nights: '3 or 4', bestFor: 'A first visit, families, value', compare: 'Compare cruise ships →' },
    dahabiya: { name: 'Dahabiya', what: 'A small sailing boat with only a few cabins', nights: '4 to 7', bestFor: 'Quiet, slow travel, couples', compare: 'Compare dahabiyas →' },
    shipFrom: (p, d) => (
      <>
        <strong>from {p}</strong>
        {d ? `, ${d} days Aswan to Luxor` : ''}
      </>
    ),
    dahabiyaFrom: (p, d) => (
      <>
        <strong>from {p}</strong>
        {d ? `, ${d} days` : ''}
      </>
    ),
  },
  styles: {
    eyebrow: 'Travel styles',
    h2: 'Not sure which tour? Start with how you travel.',
    cards: {
      '/journeys/first-time-in-egypt': { title: 'First time in Egypt', line: 'Cairo, a Nile cruise, Luxor and Aswan: the essential story without rushing.' },
      '/journeys/the-cultural-traveller': { title: 'The cultural traveller', line: 'Islamic and Coptic Cairo, Abydos, Nubian Aswan, the monasteries.' },
      '/journeys/travelling-as-a-family': { title: 'Travelling as a family', line: 'Hotels with pools, shorter days, guides who know children.' },
      '/journeys/desert-and-quiet': { title: 'Desert & quiet', line: 'Bahariya, the White Desert and Fayoum.' },
      '/journeys/travelling-in-style': { title: 'Luxury hotels & boats', line: 'Mena House, top-tier Nile ships and dahabiyas, private throughout.' },
      '/journeys/coming-back': { title: 'Coming back', line: 'Middle Egypt, Alexandria, the oases: the sites a first trip leaves out.' },
    },
  },
  planning: {
    eyebrow: 'Planning',
    h2: 'Planning your Egypt trip',
    intro: 'Straight answers from the people who run the trips.',
    readAll: 'Read the full Egypt travel guide →',
    links: {
      '/blog/the-best-egypt-travel-itineraries': 'How many days do you need in Egypt?',
      '/travel-tips/egypt-weather-guide': 'Best time to visit Egypt, month by month',
      '/travel-tips/attractions-entrance-fees': 'What the sites cost to enter',
      '/nile-cruises': 'Cruise ship or dahabiya: which is for you?',
    },
  },
  close: {
    eyebrow: 'Free itinerary',
    h2: 'Tell us your dates. We’ll send a plan and a price.',
    free: 'Free, with no obligation.',
    preferChat: 'Prefer to chat?',
    stillExploring: 'Not sure yet?',
    concierge: 'Get advice from our Egypt travel specialists →',
  },
  hrefs: {},
};

const ES: HomeCopy = {
  metaTitle: 'Viajes privados a Egipto y cruceros por el Nilo | Travel2Egypt',
  metaDescription: (t, d) =>
    `${t && d ? `Viajes privados por Egipto desde ${t} y excursiones de un día desde ${d}: ` : 'Viajes privados por Egipto y excursiones de un día: '}El Cairo, el Nilo, Luxor, Asuán y Abu Simbel, a tu medida. Guías desde 1993.`,
  itemListName: 'Viajes por Egipto para empezar',
  from: (p) => <>desde {p}</>,
  fromPerPerson: (p) => <>desde {p} por persona</>,
  days: (n) => `${n} días`,
  hours: (n) => `${n} horas`,
  priceOnRequest: 'Precio a consultar',
  guideNote: 'con guía de habla hispana',
  hero: {
    eyebrow: 'Operador egipcio con licencia · Guías desde 1993',
    h1: 'Viajes privados por Egipto, planificados por quienes los guían.',
    sub: (m, d) => (
      <>
        Circuitos de varios días {m && <>desde {m}</>} y excursiones de un día {d && <>desde {d}</>}, con precios claros,
        adaptados a tus fechas y operados sobre el terreno por nuestro propio equipo de El Cairo.
      </>
    ),
    primary: 'Quiero mi itinerario gratis',
    secondary: 'Ver viajes por Egipto →',
    tripadvisor: (r, n) => `${String(r).replace('.', ',')} en Tripadvisor (${n} opiniones)`,
    trips: 'Unos 230 viajes privados al año',
  },
  finder: {
    label: 'Buscar un viaje',
    want: 'Quiero',
    tour: 'Un viaje de varios días',
    day: 'Una excursión de un día',
    cruise: 'Un crucero por el Nilo',
    lengthLabel: 'de',
    anyLength: 'Cualquier duración',
    lengths: { '3-5': '3–5 días', '6-9': '6–9 días', '10-14': '10–14 días', '15+': '15 días o más' },
    cityLabel: 'en',
    go: 'Ver viajes',
  },
  tours: {
    eyebrow: 'Viajes por Egipto',
    h2: 'Viajes por Egipto para empezar',
    intro: 'Todos los viajes son privados y se pueden cambiar: fechas, hoteles, ritmo y visitas.',
    basis: 'por persona, en habitación doble, hoteles de 4★/5★',
    view: 'Ver viaje',
    customise: 'Personalizar',
    seeAll: 'Ver todos los viajes por Egipto →',
    smallGroup: 'Salidas en grupo reducido →',
    cards: {
      'epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs': { badge: 'Primera visita', route: 'El Cairo · crucero por el Nilo · Luxor · Asuán' },
      '10-days-nile-dreamer-tour-experience': { badge: 'El Nilo completo', route: 'El Cairo · tren nocturno · crucero de 3 noches · Luxor' },
      '10-day-egypt-travel-journey-through-history': { badge: 'Con Abu Simbel y Alejandría', route: 'El Cairo · Alejandría · Luxor · Asuán · Abu Simbel' },
      '9-day-classic-egypt-family-adventure': { badge: 'Familias', route: 'El Cairo · crucero por el Nilo · Asuán, al ritmo de los niños' },
      '10-day-nile-and-western-desert-tour': { badge: 'Nilo y desierto', route: 'El Cairo · Bahariya · Desierto Blanco · el Nilo' },
      '4-day-history-culture-escape': { badge: 'Poco tiempo', route: 'Pirámides · Gran Museo Egipcio · El Cairo antiguo' },
    },
  },
  promises: {
    h2: 'Con qué puedes contar',
    items: [
      {
        h3: 'El precio antes de la conversación',
        p: 'Cada viaje muestra su precio de partida. Tu presupuesto detalla todo lo incluido, sin sorpresas a la llegada.',
      },
      {
        h3: 'Un plan antes de la mañana siguiente',
        p: 'Envíanos tus fechas y te respondemos antes de las 20:00 (hora de El Cairo) el mismo día, o antes de las 10:00 de la mañana siguiente, los siete días de la semana, con un itinerario día a día y un precio cerrado.',
      },
      {
        h3: 'Guías egiptólogos con licencia',
        p: 'Todos los viajes privados y en grupo reducido van con un egiptólogo con licencia del Ministerio de Turismo, y el equipo que planifica tu viaje es el mismo que lo opera.',
      },
      {
        h3: 'Un equipo sobre el terreno mientras viajas',
        p: 'Un equipo en El Cairo, disponible por WhatsApp desde tu llegada hasta tu salida. Si algo falla, lo resolvemos el mismo día.',
      },
    ],
  },
  dayTours: {
    eyebrow: 'Excursiones de un día',
    h2: 'Excursiones de un día en El Cairo, Luxor y Asuán',
    intro:
      'Privadas o en grupo reducido, con un guía egiptólogo con licencia. Cada excursión indica exactamente qué incluye. Elige una fecha y te la confirmamos.',
    tabsLabel: 'Excursiones por ciudad',
    check: 'Consultar esta fecha',
    private: 'Privada',
    smallGroup: 'Grupo reducido',
    cities: {
      cairo: { label: 'El Cairo y Guiza', seeAll: 'Ver todas las excursiones en El Cairo y Guiza →' },
      luxor: { label: 'Luxor', seeAll: 'Ver todas las excursiones en Luxor →' },
      aswan: { label: 'Asuán y Abu Simbel', seeAll: 'Ver todas las excursiones en Asuán y Abu Simbel →' },
      alexandria: { label: 'Alejandría', seeAll: 'Ver todas las excursiones en Alejandría →' },
    },
    labels: {
      'pyramids-of-giza-and-grand-egyptian-museum': 'Pirámides de Guiza y Gran Museo Egipcio',
      'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara': 'Guiza, Menfis y Saqqara',
      'pyramids-of-giza-and-sphinx-group-day-tour': 'Las pirámides y la Esfinge',
      'day-tour-to-karnak-luxor-temples-luxor-museum': 'Karnak, el templo de Luxor y el Museo de Luxor',
      'grand-west-bank-group-day-tour-luxor': 'La gran orilla occidental',
      'skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience': 'Globo al amanecer en Luxor',
      'abu-simbel-by-car-from-aswan': 'Abu Simbel en coche desde Asuán',
      'nubian-temples-day-tour-from-aswan': 'Templos nubios: Kalabsha y Beit el-Wali',
      'aswan-felucca-adventure': 'Faluca con almuerzo a orillas del Nilo',
      '2-day-pyramids-mediterranean-tour': 'Alejandría en un día: catacumbas y costa',
      'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo': 'Alejandría desde El Cairo',
    },
  },
  nile: {
    eyebrow: 'En el Nilo',
    h2: 'Navega el Nilo entre Luxor y Asuán',
    intro: 'Barcos de crucero de cinco estrellas o pequeñas dahabiyas de vela. Solo vendemos los barcos en los que subiríamos a nuestras propias familias.',
    rows: { what: 'Qué es', nights: 'Noches', bestFor: 'Ideal para', from: 'Desde' },
    ship: {
      name: 'Crucero por el Nilo',
      what: 'Un barco de cinco estrellas con piscina',
      nights: '3 o 4',
      bestFor: 'Una primera visita, familias, buena relación calidad-precio',
      compare: 'Comparar barcos de crucero →',
    },
    dahabiya: {
      name: 'Dahabiya',
      what: 'Un pequeño velero con pocas cabinas',
      nights: 'De 4 a 7',
      bestFor: 'Viajar despacio y en calma, parejas',
      compare: 'Comparar dahabiyas →',
    },
    shipFrom: (p, d) => (
      <>
        <strong>{p}</strong>
        {d ? `, ${d} días de Asuán a Luxor` : ''}
      </>
    ),
    dahabiyaFrom: (p, d) => (
      <>
        <strong>{p}</strong>
        {d ? `, ${d} días` : ''}
      </>
    ),
  },
  styles: {
    eyebrow: 'Estilos de viaje',
    h2: '¿No sabes qué viaje elegir? Empieza por cómo viajas.',
    cards: {
      '/journeys/first-time-in-egypt': { title: 'Primera vez en Egipto', line: 'El Cairo, un crucero por el Nilo, Luxor y Asuán: la historia esencial, sin prisas.' },
      '/journeys/the-cultural-traveller': { title: 'El viajero cultural', line: 'El Cairo islámico y copto, Abidos, la Asuán nubia, los monasterios.' },
      '/journeys/travelling-as-a-family': { title: 'Viajar en familia', line: 'Hoteles con piscina, jornadas más cortas y guías que saben tratar con niños.' },
      '/journeys/desert-and-quiet': { title: 'Desierto y calma', line: 'Bahariya, el Desierto Blanco y El Fayum.' },
      '/journeys/travelling-in-style': { title: 'Hoteles y barcos de lujo', line: 'Mena House, los mejores barcos del Nilo y dahabiyas, todo en privado.' },
      '/journeys/coming-back': { title: 'Volver a Egipto', line: 'El Egipto Medio, Alejandría, los oasis: lo que un primer viaje deja fuera.' },
    },
  },
  planning: {
    eyebrow: 'Planificación',
    h2: 'Planifica tu viaje a Egipto',
    intro: 'Respuestas claras de quienes organizan los viajes.',
    readAll: 'Leer la guía de viaje completa de Egipto →',
    links: {
      '/blog/the-best-egypt-travel-itineraries': '¿Cuántos días necesitas en Egipto?',
      '/travel-tips/egypt-weather-guide': 'La mejor época para visitar Egipto, mes a mes',
      '/travel-tips/attractions-entrance-fees': 'Cuánto cuesta la entrada a los monumentos',
      '/nile-cruises': 'Barco de crucero o dahabiya: ¿cuál es para ti?',
    },
  },
  close: {
    eyebrow: 'Itinerario gratis',
    h2: 'Cuéntanos tus fechas. Te enviamos un plan y un precio.',
    free: 'Gratis y sin compromiso.',
    preferChat: '¿Prefieres chatear?',
    stillExploring: '¿Aún no lo tienes claro?',
    concierge: 'Pide consejo a nuestros especialistas en Egipto →',
  },
  hrefs: {
    '/egypt-travel-packages': '/paquetes-de-viaje-a-egipto',
    '/private-day-tours': '/excursiones-privadas-de-un-dia',
    '/cairo-private-day-tours': '/el-cairo-visitas-privadas-de-un-dia',
    '/luxor-private-day-tours': '/luxor-excursiones-privadas-de-un-dia',
    '/aswan-private-day-tours': '/excursiones-privadas-de-un-dia-por-asuan',
    '/alexandria-private-day-tours': '/excursiones-privadas-de-un-dia-por-alejandria',
    '/journeys/first-time-in-egypt': '/journeys/primera-vez-en-egipto',
    '/journeys/the-cultural-traveller': '/journeys/el-viajero-cultural',
    '/journeys/travelling-as-a-family': '/journeys/viajar-en-familia',
    '/journeys/desert-and-quiet': '/journeys/desierto-y-calma',
    '/journeys/travelling-in-style': '/journeys/viajar-con-estilo',
    '/journeys/coming-back': '/journeys/volver-a-egipto',
    '/blog/the-best-egypt-travel-itineraries': '/blog/los-mejores-itinerarios-de-viaje-por-egipto',
    '/travel-tips/egypt-weather-guide': '/travel-tips/el-clima-de-egipto-zonas-climaticas-estaciones-y-cuando-visitar',
    '/travel-tips/attractions-entrance-fees': '/travel-tips/entradas-a-los-monumentos-de-egipto-que-presupuestar-y-que-priorizar',
  },
};

const JA: HomeCopy = {
  metaTitle: 'エジプト旅行・ナイル川クルーズ｜完全プライベート・料金明示｜Travel2Egypt',
  metaDescription: (t, d) =>
    `${t && d ? `エジプトのプライベートツアーは${t}〜、日帰りツアーは${d}〜。` : 'エジプトのプライベートツアーと日帰りツアー。'}1993年からガイドを続けるカイロの現地オペレーターが、カイロ、ナイル川、ルクソール、アスワン、アブ・シンベルをご希望の日程に合わせて手配します。`,
  itemListName: 'まずはここから、エジプトツアー',
  from: (p) => <>{p}〜</>,
  fromPerPerson: (p) => <>1名様 {p}〜</>,
  days: (n) => `${n}日間`,
  hours: (n) => `${n}時間`,
  priceOnRequest: '料金はお問い合わせください',
  guideNote: '日本語ガイド付き',
  hero: {
    eyebrow: 'エジプト観光省認可の現地オペレーター · 1993年からガイド',
    h1: 'エジプトのプライベートツアーを、実際に案内する私たちが計画します。',
    sub: (m, d) => (
      <>
        複数日のツアーは{m && <>{m}〜</>}、日帰りツアーは{d && <>{d}〜</>}
        。料金を明示し、ご希望の日程に合わせて組み立て、カイロの自社チームが現地で運営します。
      </>
    ),
    primary: '無料で旅程を受け取る',
    secondary: 'エジプトツアーを見る →',
    tripadvisor: (r, n) => `Tripadvisor ${r}（口コミ${n}件）`,
    trips: '年間約230件のプライベート旅行を手配',
  },
  finder: {
    label: 'ツアーを探す',
    want: '旅のタイプ',
    tour: '複数日のツアー',
    day: '日帰りツアー',
    cruise: 'ナイル川クルーズ',
    lengthLabel: '日数',
    anyLength: '指定なし',
    lengths: { '3-5': '3〜5日', '6-9': '6〜9日', '10-14': '10〜14日', '15+': '15日以上' },
    cityLabel: '都市',
    go: 'ツアーを探す',
  },
  tours: {
    eyebrow: 'エジプトツアー',
    h2: 'まずはここから、エジプトツアー',
    intro: 'すべてプライベートツアーです。日程、ホテル、ペース、訪問地を自由に変更できます。',
    basis: '2名1室利用時の1名様料金・4つ星／5つ星ホテル',
    view: '詳細を見る',
    customise: 'カスタマイズ',
    seeAll: 'エジプトツアーをすべて見る →',
    smallGroup: '少人数グループの出発日 →',
    cards: {
      'epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs': { badge: 'はじめての方に', route: 'カイロ · ナイル川クルーズ · ルクソール · アスワン' },
      '10-days-nile-dreamer-tour-experience': { badge: 'ナイルを満喫', route: 'カイロ · 寝台列車 · 3泊のクルーズ · ルクソール' },
      '10-day-egypt-travel-journey-through-history': { badge: 'アブ・シンベルとアレクサンドリアも', route: 'カイロ · アレクサンドリア · ルクソール · アスワン · アブ・シンベル' },
      '9-day-classic-egypt-family-adventure': { badge: 'ご家族向け', route: 'カイロ · ナイル川クルーズ · アスワン（お子さまのペースで）' },
      '10-day-nile-and-western-desert-tour': { badge: 'ナイルと砂漠', route: 'カイロ · バハレイヤ · 白砂漠 · ナイル川' },
      '4-day-history-culture-escape': { badge: '短い日程で', route: 'ピラミッド · 大エジプト博物館 · オールドカイロ' },
    },
  },
  promises: {
    h2: '私たちのお約束',
    items: [
      {
        h3: '相談の前に、料金を',
        p: 'すべてのツアーに最低料金を表示しています。お見積もりには含まれるものをすべて明記するので、現地で思わぬ追加料金に驚くことはありません。',
      },
      {
        h3: '翌朝までにプランをお届け',
        p: '日程をお送りいただければ、カイロ時間の当日20時まで、または翌朝10時までに、日ごとの旅程と確定料金をご返信します（年中無休）。',
      },
      {
        h3: '観光省認可のエジプト学者ガイド',
        p: 'プライベートツアーと少人数グループツアーはすべて、観光省認可のエジプト学者ガイドがご案内します。旅を計画するチームが、そのまま現地で運営します。',
      },
      {
        h3: '旅行中も現地チームが対応',
        p: 'ご到着からご出発まで、カイロのチームがWhatsAppで対応します。万一トラブルがあっても、その日のうちに解決します。',
      },
    ],
  },
  dayTours: {
    eyebrow: '日帰りツアー',
    h2: 'カイロ、ルクソール、アスワンの日帰りツアー',
    intro:
      'プライベートまたは少人数グループで、観光省認可のエジプト学者ガイドがご案内します。含まれるものは各ツアーのページに明記しています。日付を選んでいただければ、空き状況を確認してご連絡します。',
    tabsLabel: '都市別の日帰りツアー',
    check: 'この日付で確認',
    private: 'プライベート',
    smallGroup: '少人数グループ',
    cities: {
      cairo: { label: 'カイロ・ギザ', seeAll: 'カイロ・ギザの日帰りツアーをすべて見る →' },
      luxor: { label: 'ルクソール', seeAll: 'ルクソールの日帰りツアーをすべて見る →' },
      aswan: { label: 'アスワン・アブ・シンベル', seeAll: 'アスワン・アブ・シンベルの日帰りツアーをすべて見る →' },
      alexandria: { label: 'アレクサンドリア', seeAll: 'アレクサンドリアの日帰りツアーをすべて見る →' },
    },
    labels: {
      'pyramids-of-giza-and-grand-egyptian-museum': 'ギザのピラミッドと大エジプト博物館',
      'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara': 'ギザ、メンフィス、サッカラ',
      'pyramids-of-giza-and-sphinx-group-day-tour': 'ギザのピラミッドとスフィンクス',
      'day-tour-to-karnak-luxor-temples-luxor-museum': 'カルナック神殿、ルクソール神殿、ルクソール博物館',
      'grand-west-bank-group-day-tour-luxor': 'ルクソール西岸をめぐる一日',
      'skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience': 'ルクソール、夜明けの熱気球',
      'abu-simbel-by-car-from-aswan': 'アスワンから車で行くアブ・シンベル',
      'nubian-temples-day-tour-from-aswan': 'ヌビアの神殿：カラブシャとベイト・エル＝ワリ',
      'aswan-felucca-adventure': 'フェルッカ・セーリングとナイル河畔の昼食',
      '2-day-pyramids-mediterranean-tour': '一日で巡るアレクサンドリア：カタコンベと海岸',
      'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo': 'カイロ発、アレクサンドリア日帰り',
    },
  },
  nile: {
    eyebrow: 'ナイル川',
    h2: 'ルクソールとアスワンの間を、ナイル川で',
    intro: '5つ星のクルーズ船か、小さな帆船ダハビーヤか。私たちが扱うのは、自分の家族を乗せたいと思える船だけです。',
    rows: { what: 'どんな船？', nights: '泊数', bestFor: 'おすすめ', from: '料金' },
    ship: {
      name: 'ナイル川クルーズ',
      what: 'プール付きの5つ星客船',
      nights: '3泊または4泊',
      bestFor: 'はじめての方、ご家族、コスト重視の方',
      compare: 'クルーズ船を比較する →',
    },
    dahabiya: {
      name: 'ダハビーヤ',
      what: '客室数の少ない小さな帆船',
      nights: '4〜7泊',
      bestFor: '静かにゆっくり旅したい方、カップル',
      compare: 'ダハビーヤを比較する →',
    },
    shipFrom: (p, d) => (
      <>
        <strong>{p}〜</strong>
        {d ? `（アスワン発ルクソール着・${d}日間）` : ''}
      </>
    ),
    dahabiyaFrom: (p, d) => (
      <>
        <strong>{p}〜</strong>
        {d ? `（${d}日間）` : ''}
      </>
    ),
  },
  styles: {
    eyebrow: '旅のスタイル',
    h2: '迷ったら、旅のスタイルから。',
    cards: {
      '/journeys/first-time-in-egypt': { title: 'はじめてのエジプト', line: 'カイロ、ナイル川クルーズ、ルクソール、アスワン。欠かせない物語を、急がずに。' },
      '/journeys/the-cultural-traveller': { title: '文化を旅する人へ', line: 'イスラム地区とコプト地区のカイロ、アビドス、ヌビアのアスワン、修道院。' },
      '/journeys/travelling-as-a-family': { title: '家族で旅する', line: 'プール付きのホテル、短めの行程、子どもに慣れたガイド。' },
      '/journeys/desert-and-quiet': { title: '砂漠と静けさ', line: 'バハレイヤ、白砂漠、ファイユーム。' },
      '/journeys/travelling-in-style': { title: 'ラグジュアリーなホテルと船', line: 'メナハウス、最上級のナイル客船とダハビーヤ。すべてプライベートで。' },
      '/journeys/coming-back': { title: 'ふたたびのエジプト', line: '中エジプト、アレクサンドリア、オアシス。初めての旅では省かれる場所へ。' },
    },
  },
  planning: {
    eyebrow: '旅の計画',
    h2: 'エジプト旅行の計画',
    intro: '旅を運営する私たちが、率直にお答えします。',
    readAll: 'エジプト旅行ガイドを読む →',
    links: {
      '/blog/the-best-egypt-travel-itineraries': 'エジプト旅行には何日必要？',
      '/travel-tips/egypt-weather-guide': 'エジプト旅行のベストシーズン（月別）',
      '/travel-tips/attractions-entrance-fees': '遺跡・博物館の入場料',
      '/nile-cruises': 'クルーズ船とダハビーヤ、どちらを選ぶ？',
    },
  },
  close: {
    eyebrow: '無料の旅程作成',
    h2: '日程を教えてください。プランと料金をお送りします。',
    free: '無料・義務なし。',
    preferChat: 'チャットがお好みなら：',
    stillExploring: '迷ったら、',
    concierge: 'エジプト旅行の専門スタッフにご相談ください →',
  },
  hrefs: {
    '/egypt-travel-packages': '/ejiputo-ryoko-pakkeeji',
    '/private-day-tours': '/puraibeeto-deitsuaa',
    '/cairo-private-day-tours': '/kairo-puraibeto-dei-tsua',
    '/luxor-private-day-tours': '/rukusoru-puraibeto-dei-tsua',
    '/aswan-private-day-tours': '/asuwan-puraibeto-dei-tsua',
    '/alexandria-private-day-tours': '/arekisandoria-puraibeto-dei-tsua',
    '/journeys/first-time-in-egypt': '/journeys/hajimete-no-ejiputo',
    '/journeys/the-cultural-traveller': '/journeys/bunka-o-tabisuru-hito-e',
    '/journeys/travelling-as-a-family': '/journeys/kazoku-de-tabisuru',
    '/journeys/desert-and-quiet': '/journeys/sabaku-to-shizukesa',
    '/journeys/travelling-in-style': '/journeys/joshitsu-ni-tabisuru',
    '/journeys/coming-back': '/journeys/futatabi-no-ejiputo',
    '/blog/the-best-egypt-travel-itineraries': '/blog/ejiputo-ryoko-no-nissu-betsu-moderu-kosu',
    '/travel-tips/egypt-weather-guide': '/travel-tips/ejiputo-no-tenko-gaido',
    '/travel-tips/attractions-entrance-fees': '/travel-tips/ejiputo-tabi-no-keikaku-nyujo-ryo-2026',
  },
};

export const HOME_COPY: Record<HomeLocale, HomeCopy> = { en: EN, es: ES, ja: JA };

/** This language's href for an EN href (identity when unmapped). */
export function localHref(c: HomeCopy, href: string): string {
  const [path, qs] = href.split('?');
  const local = c.hrefs[path] ?? path;
  return qs ? `${local}?${qs}` : local;
}
