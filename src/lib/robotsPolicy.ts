/**
 * Single source of truth for the production crawl-disallow paths.
 *
 * Imported by BOTH `app/robots.ts` (the actual robots.txt) and the concierge
 * link-map validator, so "is this page indexable?" is derived from one list.
 * When v2 lifts the wiki disallow (deities/dynasties/people), both the
 * robots.txt and the link map's indexability guard update together — no drift,
 * and those link-map entries auto-include with no link-map code change.
 */

export const ROBOTS_DISALLOW_PATHS = [
  '/studio',
  '/studio/',
  '/admin',
  '/admin/',
  '/api/',
  '/wiki/deities',
  '/wiki/dynasties',
  '/wiki/people',
] as const;

/**
 * True if a locale-relative path (no locale prefix, e.g. `/wiki/people/x`) is
 * under a robots-disallowed prefix. Prefix matching is boundary-aware so
 * `/wiki/people` does not also disallow a hypothetical `/wiki/peopleish`.
 */
export function isRobotsDisallowed(path: string): boolean {
  return ROBOTS_DISALLOW_PATHS.some((d) => {
    if (path === d) return true;
    const prefix = d.endsWith('/') ? d : `${d}/`;
    return path.startsWith(prefix);
  });
}
