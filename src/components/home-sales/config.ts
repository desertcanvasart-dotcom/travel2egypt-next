/**
 * Sales homepage (owner spec, 2026-11-08) — which products appear and in what
 * order, shared by EN/ES/JA. The words (badges, route lines, card names) are
 * per language in ./copy.tsx, keyed by the EN slug / EN href used here.
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
  /** EN slug — the product's stable key. */
  slug: string;
}

export const FEATURED_TOURS: FeaturedTour[] = [
  { slug: 'epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs' },
  { slug: '10-days-nile-dreamer-tour-experience' },
  { slug: '10-day-egypt-travel-journey-through-history' },
  { slug: '9-day-classic-egypt-family-adventure' },
  { slug: '10-day-nile-and-western-desert-tour' },
  { slug: '4-day-history-culture-escape' },
];

export interface DayTourCity {
  key: string;
  /** City landing ("See all … day tours →"), EN path; copy.hrefs localizes it. */
  href: string;
  tours: Array<{ slug: string; format: 'private' | 'group' | null }>;
}

export const DAY_TOUR_CITIES: DayTourCity[] = [
  {
    key: 'cairo',
    href: '/cairo-private-day-tours',
    tours: [
      { slug: 'pyramids-of-giza-and-grand-egyptian-museum', format: 'private' },
      { slug: 'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara', format: 'private' },
      { slug: 'pyramids-of-giza-and-sphinx-group-day-tour', format: 'group' },
    ],
  },
  {
    key: 'luxor',
    href: '/luxor-private-day-tours',
    tours: [
      { slug: 'day-tour-to-karnak-luxor-temples-luxor-museum', format: 'private' },
      { slug: 'grand-west-bank-group-day-tour-luxor', format: 'group' },
      { slug: 'skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience', format: null },
    ],
  },
  {
    key: 'aswan',
    href: '/aswan-private-day-tours',
    tours: [
      { slug: 'private-tour-abu-simble-by-bus-from-aswan', format: 'private' },
      { slug: 'nubian-temples-day-tour-from-aswan', format: null },
      { slug: 'aswan-felucca-adventure', format: null },
    ],
  },
  {
    key: 'alexandria',
    href: '/alexandria-private-day-tours',
    tours: [
      // Stored as a 2-day package (slug says 2-day; the page is one day) — the
      // card shows no duration until the product data is corrected.
      { slug: '2-day-pyramids-mediterranean-tour', format: 'private' },
      { slug: 'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo', format: 'group' },
    ],
  },
];

/** The 3-/4-night ship cruise whose price anchors the cruise panel. */
export const CRUISE_SLUG = '4-days-cruise-from-aswan-to-luxor';

export interface StyleCard {
  /** EN journey path — the card's key in copy.tsx; copy.hrefs localizes it. */
  href: string;
  /** Product whose live price is the card's "from"… */
  priceSlug?: string;
  /** …or an owner-stated starting price (EUR) for a trip type. */
  ownerFromEur?: number;
}

/** Owner-stated starting prices (EUR per person sharing), 2026-11-08. */
export const OWNER_FROM_EUR = { cultural: 1200, comingBack: 1200 } as const;

export const STYLE_CARDS: StyleCard[] = [
  { href: '/journeys/first-time-in-egypt', priceSlug: 'epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs' },
  { href: '/journeys/the-cultural-traveller', ownerFromEur: OWNER_FROM_EUR.cultural },
  { href: '/journeys/travelling-as-a-family', priceSlug: 'cairo-and-alexandria-4-days-family-package' },
  { href: '/journeys/desert-and-quiet', priceSlug: '4-days-white-desert-wadi-al-hittan-exploration' },
  { href: '/journeys/travelling-in-style', priceSlug: 'marriott-mena-house-4-days-stay' },
  { href: '/journeys/coming-back', ownerFromEur: OWNER_FROM_EUR.comingBack },
];

/** EN paths; titles per language in copy.tsx, localized paths in copy.hrefs. */
export const GUIDE_LINKS: Array<{ href: string }> = [
  { href: '/blog/the-best-egypt-travel-itineraries' },
  { href: '/travel-tips/egypt-weather-guide' },
  { href: '/travel-tips/attractions-entrance-fees' },
  { href: '/nile-cruises' },
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
