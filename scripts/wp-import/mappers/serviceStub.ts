/**
 * Service-or-utility (e.g. airport-transfer) → stub `article` document with
 * reviewFlag = "service-deferred". Body empty. Redirect points to
 * /plan-your-tour (concierge entry) per MIGRATION_MAPPING §11.
 *
 * Same pattern is reused for "interactive-tool" and "promotional-marketing"
 * stub flags — caller passes the appropriate reviewFlag.
 */

import type { SanityClient } from '@sanity/client';

import { htmlToPortableText } from '../../wp-import-html.js';
import type { WpClient } from '../wp-client.js';
import { buildMigrationMeta, decodeTitle, plainText } from './_shared.js';
import type { LocaleGroup, MapperResult, ReviewFlag, SanityDoc } from '../types.js';

interface ServiceStubOpts {
  reviewFlag: ReviewFlag;
  redirectPath?: string; // default: /plan-your-tour
  priorityScore?: number;
}

export function mapServiceStub(_client: SanityClient, _wp: WpClient, group: LocaleGroup, opts: ServiceStubOpts): MapperResult {
  const en = group.en;
  const docs: SanityDoc[] = [];
  // Preserve the WP body on stubs so editors retain "what was this page?" context
  // when triaging the redirect target later. Per Phase C feedback: don't delete information.
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e) continue;
    const html = e.content?.rendered ?? '';
    const pt = html ? htmlToPortableText(html) : { blocks: [], stats: {} };
    docs.push({
      _id: `wp-page-${e.id}-${loc}`,
      _type: 'article',
      language: loc,
      title: decodeTitle(e.title?.rendered),
      slug: { _type: 'slug', current: decodeURIComponent(e.slug) },
      excerpt: plainText(e.excerpt?.rendered),
      body: pt.blocks,
      migration: buildMigrationMeta(group, opts.reviewFlag),
    });
  }
  const redirectPath = opts.redirectPath ?? '/plan-your-tour';
  return {
    docs,
    redirects: [
      {
        from_url: en.link,
        to_path: redirectPath,
        locale: 'en',
        status_code: 301,
        legacy_wp_id: en.id,
        priority_score: opts.priorityScore ?? 0,
      },
    ],
  };
}
