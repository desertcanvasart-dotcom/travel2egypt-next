import type { WeaveItem } from '@/components/ArticleConnective';

/**
 * Build the city cross-link set used in the subcategory foot band's third
 * column (and reused by the single-tour page): the city guide, hotels in the
 * city, and the OTHER day-tour track for the same city (private ↔ group).
 *
 * Pure href assembly — callers pass already-localized labels. The other-track
 * entry is included only when that landing exists (caller resolves its slug).
 */
export function buildCityCrossLinks(opts: {
  citySlug: string;
  cityGuideTitle: string;
  cityGuideKicker?: string;
  hotelsTitle: string;
  hotelsKicker?: string;
  otherTrack?: { slug: string; title: string; kicker?: string };
}): WeaveItem[] {
  const items: WeaveItem[] = [
    {
      id: 'city-guide',
      title: opts.cityGuideTitle,
      kicker: opts.cityGuideKicker,
      href: `/guide/${opts.citySlug}`,
    },
    {
      id: 'hotels',
      title: opts.hotelsTitle,
      kicker: opts.hotelsKicker,
      href: `/hotels?city=${opts.citySlug}`,
    },
  ];
  if (opts.otherTrack?.slug) {
    items.push({
      id: 'other-track',
      title: opts.otherTrack.title,
      kicker: opts.otherTrack.kicker,
      href: `/${opts.otherTrack.slug}`,
    });
  }
  return items;
}
