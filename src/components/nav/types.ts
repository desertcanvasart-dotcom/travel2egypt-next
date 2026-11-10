/**
 * Site navigation model (header/footer rebuild, 2026-11-10). Built on the
 * server by `getNavData` (src/lib/nav/navData.ts) and rendered by the desktop
 * header, the mobile menu and the footer, so all three share one source.
 */

export interface NavLeaf {
  /** Stable id for analytics (`nav_click.item`). */
  id: string;
  label: string;
  href: string;
  /** "From" price in EUR (min price of the published products behind the link). */
  fromEur?: number | null;
  /** Outbound link (opens in a new tab with rel="noopener"). */
  external?: boolean;
}

export interface NavGroup {
  /** Group label (small caps, not a link). Omitted for an unlabelled group. */
  label?: string;
  id: string;
  items: NavLeaf[];
}

export interface NavMenu {
  id: 'packages' | 'daytours' | 'cruises' | 'guide' | 'about';
  label: string;
  /** The top-level label's own link (unchanged from the previous menu). */
  href: string;
  /** "All …" link shown first in the dropdown. */
  all?: NavLeaf;
  groups: NavGroup[];
  /** Closing "Not sure? Get a free itinerary →" action (opens the dialog). */
  leadCta?: string;
}

export interface NavChrome {
  menus: NavMenu[];
  lead: string;
  whatsappHref: string;
  /** Visible "WhatsApp" label next to the icon. */
  whatsappLabel: string;
  /** aria-label: "WhatsApp +20 155 177 2258". */
  whatsappAria: string;
  /** Full-width secondary button text in the mobile menu. */
  whatsappButton: string;
  /** "from {price}" template; {price} is replaced with the formatted price. */
  fromTemplate: string;
  openMenu: string;
  closeMenu: string;
  primaryNavLabel: string;
}
