/**
 * The sample pages: one per page type, given by its ENGLISH address. The Spanish and
 * Japanese addresses are read from the page's own hreflang links, so a renamed slug
 * never needs updating here. Add a page type by adding a line.
 */
export type PageType = 'home' | 'listing' | 'dayTour' | 'carAndGuide' | 'transfer' | 'package' | 'guide';

export interface SamplePage {
  type: PageType;
  label: string;
  en: string;
  /** A product page: a price and the primary booking button must show. */
  product: boolean;
}

export const PAGES: SamplePage[] = [
  { type: 'home', label: 'Home', en: '/', product: false },
  { type: 'listing', label: 'Private day tours (listing)', en: '/private-day-tours', product: false },
  { type: 'dayTour', label: 'Day tour — Giza & GEM', en: '/pyramids-of-giza-and-grand-egyptian-museum', product: true },
  { type: 'carAndGuide', label: 'Car & guide — Aswan', en: '/aswan-private-car-and-guide', product: true },
  { type: 'transfer', label: 'Airport transfer — Cairo', en: '/transfer-from-cairo-airport-to-hotel', product: true },
  { type: 'package', label: 'Package — 7-day Epic Escape', en: '/epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs', product: true },
  { type: 'guide', label: 'Guide article — Khan El Khalili', en: '/guide/cairo/khan-el-khalili', product: false },
];

export const LOCALES = ['en', 'es', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

/** WCAG 2.2 AA "target size (minimum)": 24 × 24 CSS px. */
export const MIN_TAP = 24;
