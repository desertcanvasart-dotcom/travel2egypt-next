import repairs from '../../migration/seo-repairs-2026-09-22.json';

const destinations = new Map(repairs.redirects.map((row) => [row.source, row.destination]));

/** Rewrite only audited aliases, without changing the underlying CMS content. */
export function canonicalContentHref(href: string | undefined): string | undefined {
  if (!href || (!href.startsWith('/') && !/^https?:\/\//i.test(href))) return href;
  try {
    const url = new URL(href, 'https://travel2egypt.org');
    if (!['travel2egypt.org', 'www.travel2egypt.org'].includes(url.hostname)) return href;
    if (url.username || url.password || url.port) return href;
    const path = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/';
    const destination = destinations.get(path) ?? legacyTourPath(path);
    if (!destination) return href;
    return `${destination}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

/**
 * /tours/<slug> and /packages/<slug> (any locale) are legacy route prefixes
 * that only 308 to the root, where tours and packages are canonical (see
 * pathFromDoc). Structural, so safe to rewrite without an audit row.
 */
function legacyTourPath(path: string): string | undefined {
  const match = /^((?:\/(?:es|ja))?)\/(?:tours|packages)\/([^/]+)$/.exec(path);
  return match ? `${match[1]}/${match[2]}` : undefined;
}
