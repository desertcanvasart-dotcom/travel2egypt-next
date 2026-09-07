import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { PRODUCTION_URL, isProductionHost } from '@/lib/site';
import { ROBOTS_DISALLOW_PATHS } from '@/lib/robotsPolicy';
import { routing } from '@/i18n/routing';

/**
 * Runtime-gated robots.txt.
 *
 * Non-production hosts (the Railway preview URL pre-cutover) are fully
 * blocked — every crawler, AI crawlers included, since that host is
 * preview-only and must never be indexed or scraped.
 *
 * Production allows search indexing and user-requested AI retrieval,
 * with the same private/deferred-path exclusions for every allowed bot.
 * Training crawlers are disallowed, matching the Cloudflare policy.
 *
 * The host check lifts the block automatically at DNS cutover — no
 * redeploy or env-var change needed.
 *
 * This route replaces the former static `public/robots.txt`, which
 * could not host-gate (it served `Allow: /` on every host).
 */

const AI_SEARCH_AND_ASSISTANTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
];

const AI_TRAINING_CRAWLERS = [
  'anthropic-ai',
  'ClaudeBot',
  'GPTBot',
  'Google-Extended',
  'CCBot',
];

// Keep locale-prefixed routes under the same policy as their EN originals.
const disallowPaths = [
  ...ROBOTS_DISALLOW_PATHS,
  ...routing.locales
    .filter((locale) => locale !== routing.defaultLocale)
    .flatMap((locale) => ROBOTS_DISALLOW_PATHS.map((path) => `/${locale}${path}`)),
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host');

  if (!isProductionHost(host)) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        // Specific groups do not inherit '*'; share one rule set instead.
        userAgent: ['*', ...AI_SEARCH_AND_ASSISTANTS],
        allow: '/',
        // SSOT — shared with the concierge link-map indexability guard.
        disallow: disallowPaths,
      },
      { userAgent: AI_TRAINING_CRAWLERS, disallow: '/' },
    ],
    sitemap: `${PRODUCTION_URL}/sitemap.xml`,
  };
}
