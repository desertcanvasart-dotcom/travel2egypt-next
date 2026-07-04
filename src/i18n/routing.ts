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
    // Journey (traveller-type) pages — the ONE deliberate exception to the
    // shared-English-path chrome policy above. These are content pages that
    // happened to be code routes, so the leaf localizes per the site's own
    // content pattern (translated ES, Hepburn-romaji JA) while the /journeys/
    // segment stays English, matching /es/guide/el-cairo, /es/blog/<es-slug>.
    // The June-17 chrome policy stands for every other static route.
    // Legacy /es|/ja + <en-leaf> URLs: middleware 308 + explicit 301 rows in
    // migration/redirect-map.csv.
    '/journeys/first-time-in-egypt': {
      en: '/journeys/first-time-in-egypt',
      es: '/journeys/primera-vez-en-egipto',
      ja: '/journeys/hajimete-no-ejiputo',
    },
    '/journeys/the-cultural-traveller': {
      en: '/journeys/the-cultural-traveller',
      es: '/journeys/el-viajero-cultural',
      ja: '/journeys/bunka-o-tabisuru-hito-e',
    },
    '/journeys/travelling-as-a-family': {
      en: '/journeys/travelling-as-a-family',
      es: '/journeys/viajar-en-familia',
      ja: '/journeys/kazoku-de-tabisuru',
    },
    '/journeys/desert-and-quiet': {
      en: '/journeys/desert-and-quiet',
      es: '/journeys/desierto-y-calma',
      ja: '/journeys/sabaku-to-shizukesa',
    },
    '/journeys/travelling-in-style': {
      en: '/journeys/travelling-in-style',
      es: '/journeys/viajar-con-estilo',
      ja: '/journeys/joshitsu-ni-tabisuru',
    },
    '/journeys/coming-back': {
      en: '/journeys/coming-back',
      es: '/journeys/volver-a-egipto',
      ja: '/journeys/futatabi-no-ejiputo',
    },
  },
});

export type Locale = (typeof routing.locales)[number];
