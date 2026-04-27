/**
 * WPML translation-linkage via rendered-HTML hreflang scraping.
 *
 * Why: the WP REST API does not expose translation linkage on this install
 * even with admin auth (verified — see migration/MIGRATION_MAPPING.md §2).
 * The rendered <head> always carries <link rel="alternate" hreflang="…">
 * because Google needs them for indexing, so they're a reliable source.
 *
 * Cache: migration/.cache/hreflang/{wpId}.json. Invalidate with
 * --rescrape-hreflang.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

import type { WpClient } from './wp-client.js';
import type { HreflangMap, Locale } from './types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_DIR = join(ROOT, 'migration/.cache/hreflang');

mkdirSync(CACHE_DIR, { recursive: true });

const KNOWN_LOCALES = new Set<Locale | 'x-default'>(['en', 'es', 'ja', 'x-default']);

export async function getHreflangMap(
  client: WpClient,
  enEntity: { id: number; link: string },
  opts: { rescrape?: boolean } = {}
): Promise<HreflangMap> {
  const cachePath = join(CACHE_DIR, `${enEntity.id}.json`);
  if (!opts.rescrape && existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, 'utf8'));
  }

  const html = await client.getHtml(enEntity.link);
  const links = extractHreflangs(html);
  const map: HreflangMap = { wpId: enEntity.id, links };
  writeFileSync(cachePath, JSON.stringify(map));
  return map;
}

/**
 * Parse <link rel="alternate" hreflang="…" href="…"> tags from a rendered HTML page.
 * Only retains the locales we care about (en/es/ja/x-default).
 */
export function extractHreflangs(html: string): HreflangMap['links'] {
  const out: HreflangMap['links'] = {};
  const root = parse(html, { lowerCaseTagName: false });
  const heads = root.querySelectorAll('link[rel="alternate"]');
  for (const link of heads) {
    const hreflang = link.getAttribute('hreflang')?.toLowerCase();
    const href = link.getAttribute('href');
    if (!hreflang || !href) continue;
    // Match short forms: `en`, `es`, `ja`. Some sites emit `en-US` etc; reduce to root.
    const short = hreflang.split('-')[0] as Locale;
    const key = (KNOWN_LOCALES.has(short) ? short : KNOWN_LOCALES.has(hreflang as any) ? hreflang : null) as
      | Locale
      | 'x-default'
      | null;
    if (!key) continue;
    out[key] = href;
  }
  return out;
}
