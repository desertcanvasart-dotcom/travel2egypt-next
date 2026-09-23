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
  // Disable automatic cookie/Accept-Language locale redirects. Sanity content
  // localizes its SLUGS per locale (a tour's EN slug differs from its JA slug),
  // so next-intl's default detection — which redirects an unprefixed canonical
  // URL to /<locale>/<same-slug> based on the NEXT_LOCALE cookie — sends e.g.
  // /siwa-oasis-adventure-tour → /ja/siwa-oasis-adventure-tour, which 404s
  // because the JA doc's slug is different. Canonical root URLs always serve
  // EN; language is chosen via the switcher, which links to the correctly
  // localized slug.
  localeDetection: false,
  // Sanity translates dynamic slugs. Prefix-only HTTP alternates invent 404s
  // and conflict with the document-aware metadata and sitemap alternates.
  alternateLinks: false,
  pathnames: {
    // Commercial category landings — localized leaves (2026-07-18, owner call).
    // Deliberate exception to the shared-English-path chrome policy above: these
    // four are marketing/index pages where a translated (ES) / Egypt-branded
    // Hepburn-romaji (JA) leaf was reinstated. The JA romaji slugs had been
    // retired on Jun 17 and 301'd to the English leaf; that direction is now
    // reversed in migration/redirect-map.csv (English leaf → localized), and
    // the JA `egypt-travel-packages` leaf was rebranded from the old
    // `puraibeeto-pakkeeji` to `ejiputo-ryoko-pakkeeji`. The shared-English
    // policy still stands for every OTHER static route.
    '/private-day-tours': {
      en: '/private-day-tours',
      es: '/excursiones-privadas-de-un-dia',
      ja: '/puraibeeto-deitsuaa',
    },
    '/group-day-tours': {
      en: '/group-day-tours',
      es: '/excursiones-en-grupo-de-un-dia',
      ja: '/shoninzu-guruupu-deitsuaa',
    },
    '/egypt-travel-packages': {
      en: '/egypt-travel-packages',
      es: '/paquetes-de-viaje-a-egipto',
      ja: '/ejiputo-ryoko-pakkeeji',
    },
    '/small-group-travel-packages': {
      en: '/small-group-travel-packages',
      es: '/paquetes-en-grupo-reducido',
      ja: '/shoninzu-guruupu-pakkeeji',
    },
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
