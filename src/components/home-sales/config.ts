/**
 * English sales homepage (owner spec, 2026-11-08) — which products appear,
 * in what order, with what badge and route line.
 *
 * PRICES ARE NEVER TYPED HERE. Every "from" price is read live from the
 * product document (`priceFrom`, EUR, rendered by <Price>), per Content
 * Canon rule 7. The only exception is OWNER_FROM_EUR below — owner-stated
 * starting prices for trip *types* that have no single product (2026-11-08).
 *
 * Badges describe fit, not rank (owner chose neutral wording 2026-11-08;
 * Canon rule 3 forbids unverified superlatives such as "most-booked").
 *
 * To change what the homepage features: edit the slug lists. A slug that
 * doesn't resolve to a published product is skipped, never rendered empty.
 */

export interface FeaturedTour {
  slug: string;
  badge: string;
  route: string;
}

export const FEATURED_TOURS: FeaturedTour[] = [
  { slug: 'epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs', badge: 'First visit', route: 'Cairo · Nile cruise · Luxor · Aswan' },
  { slug: '10-days-nile-dreamer-tour-experience', badge: 'The full Nile', route: 'Cairo · sleeper train · 3-night cruise · Luxor' },
  { slug: '10-day-egypt-travel-journey-through-history', badge: 'With Abu Simbel & Alexandria', route: 'Cairo · Alexandria · Luxor · Aswan · Abu Simbel' },
  { slug: '9-day-classic-egypt-family-adventure', badge: 'Families', route: 'Cairo · Nile cruise · Aswan, paced for children' },
  { slug: '10-day-nile-and-western-desert-tour', badge: 'Nile & desert', route: 'Cairo · Bahariya · White Desert · the Nile' },
  { slug: '4-day-history-culture-escape', badge: 'Short on time', route: 'Pyramids · Grand Egyptian Museum · Old Cairo' },
];

export interface DayTourCity {
  key: string;
  label: string;
  /** City landing ("See all … day tours →"). */
  href: string;
  tours: Array<{ slug: string; label: string; format: 'Private' | 'Small group' | null }>;
}

export const DAY_TOUR_CITIES: DayTourCity[] = [
  {
    key: 'cairo',
    label: 'Cairo & Giza',
    href: '/cairo-private-day-tours',
    tours: [
      { slug: 'pyramids-of-giza-and-grand-egyptian-museum', label: 'Giza Pyramids & the Grand Egyptian Museum', format: 'Private' },
      { slug: 'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara', label: 'Giza, Memphis & Saqqara', format: 'Private' },
      { slug: 'pyramids-of-giza-and-sphinx-group-day-tour', label: 'The Pyramids & the Sphinx', format: 'Small group' },
    ],
  },
  {
    key: 'luxor',
    label: 'Luxor',
    href: '/luxor-private-day-tours',
    tours: [
      { slug: 'day-tour-to-karnak-luxor-temples-luxor-museum', label: 'Karnak, Luxor Temple & the Luxor Museum', format: 'Private' },
      { slug: 'grand-west-bank-group-day-tour-luxor', label: 'The Grand West Bank', format: 'Small group' },
      { slug: 'skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience', label: 'Luxor sunrise balloon', format: null },
    ],
  },
  {
    key: 'aswan',
    label: 'Aswan & Abu Simbel',
    href: '/aswan-private-day-tours',
    tours: [
      { slug: 'private-tour-abu-simble-by-bus-from-aswan', label: 'Abu Simbel by car from Aswan', format: 'Private' },
      { slug: 'nubian-temples-day-tour-from-aswan', label: 'Nubian temples: Kalabsha & Beit el-Wali', format: null },
      { slug: 'aswan-felucca-adventure', label: 'Felucca sail with a Nile-side lunch', format: null },
    ],
  },
  {
    key: 'alexandria',
    label: 'Alexandria',
    href: '/alexandria-private-day-tours',
    tours: [
      // Stored as a 2-day package (slug says 2-day; the page is one day) — the
      // card shows no duration until the product data is corrected.
      { slug: '2-day-pyramids-mediterranean-tour', label: 'Alexandria in a day: catacombs & the coast', format: 'Private' },
      { slug: 'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo', label: 'Alexandria from Cairo', format: 'Small group' },
    ],
  },
];

/** The 3-/4-night ship cruise whose price anchors the cruise panel. */
export const CRUISE_SLUG = '4-days-cruise-from-aswan-to-luxor';

export interface StyleCard {
  title: string;
  line: string;
  href: string;
  /** Product whose live price is the card's "from"… */
  priceSlug?: string;
  /** …or an owner-stated starting price (EUR) for a trip type. */
  ownerFromEur?: number;
}

/** Owner-stated starting prices (EUR per person sharing), 2026-11-08. */
export const OWNER_FROM_EUR = { cultural: 1200, comingBack: 1200 } as const;

export const STYLE_CARDS: StyleCard[] = [
  { title: 'First time in Egypt', line: 'Cairo, a Nile cruise, Luxor and Aswan: the essential story without rushing.', href: '/journeys/first-time-in-egypt', priceSlug: 'epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs' },
  { title: 'The cultural traveller', line: 'Islamic and Coptic Cairo, Abydos, Nubian Aswan, the monasteries.', href: '/journeys/the-cultural-traveller', ownerFromEur: OWNER_FROM_EUR.cultural },
  { title: 'Travelling as a family', line: 'Hotels with pools, shorter days, guides who know children.', href: '/journeys/travelling-as-a-family', priceSlug: 'cairo-and-alexandria-4-days-family-package' },
  { title: 'Desert & quiet', line: 'Bahariya, the White Desert and Fayoum.', href: '/journeys/desert-and-quiet', priceSlug: '4-days-white-desert-wadi-al-hittan-exploration' },
  { title: 'Luxury hotels & boats', line: 'Mena House, top-tier Nile ships and dahabiyas, private throughout.', href: '/journeys/travelling-in-style', priceSlug: 'marriott-mena-house-4-days-stay' },
  { title: 'Coming back', line: 'Middle Egypt, Alexandria, the oases: the sites a first trip leaves out.', href: '/journeys/coming-back', ownerFromEur: OWNER_FROM_EUR.comingBack },
];

export const GUIDE_LINKS: Array<{ title: string; href: string }> = [
  { title: 'How many days do you need in Egypt?', href: '/blog/the-best-egypt-travel-itineraries' },
  { title: 'Best time to visit Egypt, month by month', href: '/travel-tips/egypt-weather-guide' },
  { title: 'What the sites cost to enter', href: '/travel-tips/attractions-entrance-fees' },
  { title: 'Cruise ship or dahabiya: which is for you?', href: '/nile-cruises' },
];

/** Every product slug the page needs, for one batched query. */
export function allHomeSlugs(): string[] {
  const s = new Set<string>();
  FEATURED_TOURS.forEach((t) => s.add(t.slug));
  DAY_TOUR_CITIES.forEach((c) => c.tours.forEach((t) => s.add(t.slug)));
  s.add(CRUISE_SLUG);
  STYLE_CARDS.forEach((c) => c.priceSlug && s.add(c.priceSlug));
  return [...s];
}
