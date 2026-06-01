import { redirects } from '../../migration/redirect-map.generated';
import { routing } from '@/i18n/routing';

/**
 * Set of every redirect `source` path (from the generated WP redirect map that
 * next.config feeds to `redirects()`).
 *
 * Some live docs were reclassified and now have a redirect at their old path
 * (e.g. a wikiMonument slug that 308s to a guide article). During `next build`
 * a path that is BOTH statically generated AND a redirect source makes the
 * static export error. Routes whose `generateStaticParams` could emit such a
 * slug must drop it — the redirect handles that path at runtime anyway.
 */
const REDIRECT_SOURCES = new Set(redirects.map((r) => r.source));

/** Locale-prefixed path for a route, matching `localePrefix: 'as-needed'`. */
export function localizedPath(locale: string, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === routing.defaultLocale ? clean : `/${locale}${clean}`;
}

/** True if `path` (already locale-prefixed) is a redirect source. */
export function isRedirectSource(path: string): boolean {
  return REDIRECT_SOURCES.has(path);
}

/**
 * Drop {locale, slug} params whose route path is a redirect source, so the
 * static export doesn't collide with `redirects()`. `toPath` builds the
 * unprefixed route path from a slug, e.g. `(s) => /wiki/monuments/${s}`.
 */
export function withoutRedirectedParams<T extends { locale: string; slug: string }>(
  params: T[],
  toPath: (slug: string) => string
): T[] {
  return params.filter((p) => !isRedirectSource(localizedPath(p.locale, toPath(p.slug))));
}
