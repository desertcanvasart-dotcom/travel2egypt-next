import { defineRouting } from 'next-intl/routing';

/**
 * Locale routing for the site.
 *
 * EN is canonical and lives at the root (no /en prefix).
 * /es and /ja are locale-prefixed.
 *
 * `pathnames` declares the static (non-Sanity) routes. All three locales
 * share the same English-language path — the previous JA romaji-slug
 * strategy (/ja/jaanaru, /ja/watashitachi-ni-tsuite, …) was retired in
 * favour of stable URLs that survive sharing, external linking, and
 * indexing. Legacy romaji paths still resolve via 301 redirects defined
 * in migration/redirect-map.csv.
 *
 * Sanity-driven content (tours, packages, guide, …) localizes its slugs
 * via the CMS and is not listed here.
 */
export const routing = defineRouting({
  locales: ['en', 'es', 'ja'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  pathnames: {
    '/private-day-tours': '/private-day-tours',
    '/group-day-tours': '/group-day-tours',
    '/egypt-travel-packages': '/egypt-travel-packages',
    '/small-group-travel-packages': '/small-group-travel-packages',
    '/packages': '/packages',
    '/tours': '/tours',
    '/nile-cruises': '/nile-cruises',
    '/hotels': '/hotels',
    '/guide': '/guide',
    '/blog': '/blog',
    '/travel-tips': '/travel-tips',
    '/faq': '/faq',
    '/about': '/about',
    '/contact': '/contact',
    '/plan-your-tour': '/plan-your-tour',
    '/wiki': '/wiki',
    '/your-name-in-hieroglyphs': '/your-name-in-hieroglyphs',
    '/distance-between-egyptian-cities': '/distance-between-egyptian-cities',
    '/hotel-grade-concept': '/hotel-grade-concept',
    '/responsible-travel': '/responsible-travel',
  },
});

export type Locale = (typeof routing.locales)[number];
