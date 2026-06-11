import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { PRODUCTION_URL, isProductionHost } from '@/lib/site';
import { ROBOTS_DISALLOW_PATHS } from '@/lib/robotsPolicy';

/**
 * Runtime-gated robots.txt.
 *
 * Non-production hosts (the Railway preview URL pre-cutover) are fully
 * blocked — every crawler, AI crawlers included, since that host is
 * preview-only and must never be indexed or scraped.
 *
 * On the production host the full crawl policy applies. The AI-crawler
 * groups are ALLOW by deliberate brand decision: editorial content is a
 * strategic asset and LLM citation is a distribution channel we want
 * (see public/llms.txt). To opt out of AI training later, switch the
 * AI-crawler `allow` entries to `disallow`.
 *
 * The host check lifts the block automatically at DNS cutover — no
 * redeploy or env-var change needed.
 *
 * This route replaces the former static `public/robots.txt`, which
 * could not host-gate (it served `Allow: /` on every host).
 */

const AI_CRAWLERS = [
  'anthropic-ai',
  'ClaudeBot',
  'GPTBot',
  'ChatGPT-User',
  'Google-Extended',
  'PerplexityBot',
  'CCBot',
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
        userAgent: '*',
        allow: '/',
        // SSOT — shared with the concierge link-map indexability guard.
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: `${PRODUCTION_URL}/sitemap.xml`,
  };
}
