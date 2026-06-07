import { defineRouting } from 'next-intl/routing';

/**
 * Locale routing for the site.
 *
 * EN is canonical and lives at the root (no /en prefix).
 * /es and /ja are locale-prefixed.
 *
 * `pathnames` localizes the JA URL for the static (non-Sanity) routes —
 * EN/ES keep the English path; JA gets a romaji slug. Sanity-driven content
 * (tours, packages, guide, …) localizes its slugs via the CMS instead and is
 * not listed here.
 */
export const routing = defineRouting({
  locales: ['en', 'es', 'ja'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  pathnames: {
    '/private-day-tours': { en: '/private-day-tours', es: '/private-day-tours', ja: '/puraibeeto-deitsuaa' },
    '/group-day-tours': { en: '/group-day-tours', es: '/group-day-tours', ja: '/shoninzu-guruupu-deitsuaa' },
    '/egypt-travel-packages': { en: '/egypt-travel-packages', es: '/egypt-travel-packages', ja: '/puraibeeto-pakkeeji' },
    '/small-group-travel-packages': { en: '/small-group-travel-packages', es: '/small-group-travel-packages', ja: '/shoninzu-guruupu-pakkeeji' },
    '/packages': { en: '/packages', es: '/packages', ja: '/pakkeeji' },
    '/tours': { en: '/tours', es: '/tours', ja: '/dei-tsuaa' },
    '/nile-cruises': { en: '/nile-cruises', es: '/nile-cruises', ja: '/nairu-gawa-kuruuzu' },
    '/hotels': { en: '/hotels', es: '/hotels', ja: '/hoteru' },
    '/guide': { en: '/guide', es: '/guide', ja: '/ryokou-gaido' },
    '/blog': { en: '/blog', es: '/blog', ja: '/jaanaru' },
    '/travel-tips': { en: '/travel-tips', es: '/travel-tips', ja: '/tabi-no-hinto' },
    '/faq': { en: '/faq', es: '/faq', ja: '/yoku-aru-shitsumon' },
    '/about': { en: '/about', es: '/about', ja: '/watashitachi-ni-tsuite' },
    '/contact': { en: '/contact', es: '/contact', ja: '/otoiawase' },
    '/wiki': { en: '/wiki', es: '/wiki', ja: '/ejiputo-hyakka' },
    '/your-name-in-hieroglyphs': { en: '/your-name-in-hieroglyphs', es: '/your-name-in-hieroglyphs', ja: '/hierogurifu-namae' },
    '/distance-between-egyptian-cities': { en: '/distance-between-egyptian-cities', es: '/distance-between-egyptian-cities', ja: '/toshikan-kyori' },
    '/hotel-grade-concept': { en: '/hotel-grade-concept', es: '/hotel-grade-concept', ja: '/hoteru-gureedo' },
    '/responsible-travel': { en: '/responsible-travel', es: '/responsible-travel', ja: '/sekinin-aru-ryokou' },
  },
});

export type Locale = (typeof routing.locales)[number];
