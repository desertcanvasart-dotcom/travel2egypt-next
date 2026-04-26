import { defineRouting } from 'next-intl/routing';

/**
 * Locale routing for the site.
 *
 * EN is canonical and lives at the root (no /en prefix).
 * /es and /ja are locale-prefixed.
 *
 * If Finnish is reintroduced later, add 'fi' to locales and update the
 * pathnames map. Sanity schemas already accept any 2-letter locale code.
 */
export const routing = defineRouting({
  locales: ['en', 'es', 'ja'],
  defaultLocale: 'en',
  localePrefix: {
    mode: 'as-needed',
    prefixes: {
      en: '/',
      es: '/es',
      ja: '/ja',
    },
  },
});

export type Locale = (typeof routing.locales)[number];
