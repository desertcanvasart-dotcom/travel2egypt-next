import type { MetadataRoute } from 'next';
import { isRedirectSource } from './redirect-sources';

/** Only advertise canonical entries and alternates actually emitted here. */
export function finalizeSitemap(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const canonical = entries.filter((entry) =>
    !isRedirectSource(decodeURIComponent(new URL(entry.url).pathname)));
  const urls = new Set(canonical.map((entry) => entry.url));
  return canonical.map((entry) => {
    if (!entry.alternates?.languages) return entry;
    const languages = Object.fromEntries(Object.entries(entry.alternates.languages)
      .filter(([, url]) => typeof url === 'string' && urls.has(url)));
    return { ...entry, alternates: { ...entry.alternates, languages } };
  });
}
