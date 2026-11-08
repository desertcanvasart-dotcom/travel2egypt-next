/**
 * English product-first navigation (owner spec, 2026-11-08): Egypt Tours ▾ ·
 * Day Tours ▾ · Nile Cruises · Travel Guide ▾ · About. Shared by the desktop
 * header and the mobile sheet. ES/JA keep the editorial nav until the
 * translation pass.
 */
export interface NavItem {
  label: string;
  href: string;
  strong?: boolean;
}
export interface NavGroup {
  label: string;
  href?: string;
  items?: NavItem[];
}

export const SALES_NAV: NavGroup[] = [
  {
    label: 'Egypt Tours',
    href: '/egypt-travel-packages',
    items: [
      { label: 'First-time Egypt', href: '/journeys/first-time-in-egypt' },
      { label: 'Family', href: '/journeys/travelling-as-a-family' },
      { label: 'Nile & desert', href: '/journeys/desert-and-quiet' },
      { label: 'Short breaks', href: '/egypt-travel-packages?length=3-5' },
      { label: 'Luxury hotels & boats', href: '/journeys/travelling-in-style' },
      { label: 'Small-group departures', href: '/small-group-travel-packages' },
      { label: 'All tours →', href: '/egypt-travel-packages', strong: true },
    ],
  },
  {
    label: 'Day Tours',
    href: '/private-day-tours',
    items: [
      { label: 'Cairo & Giza', href: '/cairo-private-day-tours' },
      { label: 'Luxor', href: '/luxor-private-day-tours' },
      { label: 'Aswan & Abu Simbel', href: '/aswan-private-day-tours' },
      { label: 'Alexandria', href: '/alexandria-private-day-tours' },
      { label: 'Small-group day tours', href: '/group-day-tours' },
      { label: 'All day tours →', href: '/private-day-tours', strong: true },
    ],
  },
  { label: 'Nile Cruises', href: '/nile-cruises' },
  {
    label: 'Travel Guide',
    href: '/guide',
    items: [
      { label: 'Egypt guide', href: '/guide' },
      { label: 'Journal', href: '/blog' },
      { label: 'Travel tips', href: '/travel-tips' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  { label: 'About', href: '/about' },
];
