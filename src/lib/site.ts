/**
 * Production identity for the site.
 *
 * Canonical URLs are ALWAYS the production domain, regardless of which
 * host actually serves the response — Railway before DNS cutover, the
 * real domain after. Search-engine indexing is gated separately on the
 * live request host (see `isProductionHost`), so the Railway deployment
 * stays out of search results until cutover with no env-var change.
 */

/** Canonical production origin. No trailing slash. */
export const PRODUCTION_URL = 'https://travel2egypt.org';

const PRODUCTION_HOSTS = new Set(['travel2egypt.org', 'www.travel2egypt.org']);

/**
 * True only when the request is served on the production domain.
 *
 * Exact-host match: `staging.travel2egypt.org` and any other subdomain
 * deliberately do NOT match, so they are correctly treated as
 * non-production and get noindex'd. Port is stripped; comparison is
 * case-insensitive.
 */
export function isProductionHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = host.split(':')[0].toLowerCase();
  return PRODUCTION_HOSTS.has(bare);
}
