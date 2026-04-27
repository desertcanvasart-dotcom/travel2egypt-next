/**
 * WP `post` → Sanity `article` (DOCUMENT-LEVEL i18n).
 *
 * One Sanity document per locale. Documents are linked via the
 * @sanity/document-internationalization plugin's translationsRef field.
 *
 * Also used for:
 *  - WP pages classified as `article` (pharaohs/ancient/egyptian editorial slugs).
 *  - WP pages classified as `unclassified` (with reviewFlag = "unclassified-as-article").
 */

import type { SanityClient } from '@sanity/client';

import { htmlToPortableText } from '../../wp-import-html.js';
import type { WpClient } from '../wp-client.js';
import {
  buildHeroImage,
  buildMigrationMeta,
  buildRedirects,
  decodeTitle,
  NOW,
  plainText,
} from './_shared.js';
import type { HtmlPipelineStats, LocaleGroup, MapperResult, ReviewFlag, SanityDoc } from '../types.js';

interface ArticleMapperOpts {
  reviewFlag?: ReviewFlag;
  /** Override _type — defaults to "article". */
  sanityType?: string;
  dryRun?: boolean;
  priorityScore?: number;
}

export async function mapArticle(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: ArticleMapperOpts = {}
): Promise<MapperResult> {
  const _type = opts.sanityType ?? 'article';
  const docs: SanityDoc[] = [];
  const htmlStats: HtmlPipelineStats = { operatorNotes: 0, pullQuotes: 0, sideImages: 0, images: 0, tablesFlattened: 0, pendingInternalLinks: 0 };
  let mediaUploaded = 0;

  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e) continue;
    const html = e.content?.rendered ?? '';
    const pt = htmlToPortableText(html);
    for (const k of Object.keys(htmlStats) as Array<keyof HtmlPipelineStats>) htmlStats[k] += pt.stats[k];
    const hero = loc === 'en' ? await buildHeroImage(client, wp, group, opts) : null;
    if (hero) mediaUploaded++;
    const meta = buildMigrationMeta(group, opts.reviewFlag);

    docs.push({
      _id: `wp-post-${e.id}-${loc}`,
      _type,
      language: loc,
      title: decodeTitle(e.title?.rendered),
      slug: { _type: 'slug', current: decodeURIComponent(e.slug) },
      ...(loc === 'en' && hero ? { heroImage: hero } : {}),
      excerpt: plainText(e.excerpt?.rendered),
      body: pt.blocks,
      publishedAt: e.date,
      ...((e.meta as any)?.rank_math_title || (e.meta as any)?.rank_math_description
        ? {
            seo: {
              metaTitle: (e.meta as any)?.rank_math_title ?? undefined,
              metaDescription: (e.meta as any)?.rank_math_description ?? undefined,
            },
          }
        : {}),
      migration: meta,
    });
  }

  // Cross-link via document-internationalization metadata document.
  // The plugin uses its own translation.metadata documents; the importer can
  // either populate them directly (one per group) or rely on Studio UI to
  // link. For Phase D test runs we'll create the metadata doc explicitly.
  const metaDocId = `translation.metadata.wp-post-${group.en.id}`;
  const translations = docs
    .filter((d) => d.language)
    .map((d) => ({
      _key: d.language as string,
      _type: 'internationalizedArrayReferenceValue',
      value: { _type: 'reference', _ref: d._id },
    }));

  if (translations.length > 1) {
    docs.push({
      _id: metaDocId,
      _type: 'translation.metadata',
      translations,
      schemaTypes: [_type],
    });
  }

  const redirects = buildRedirects(
    group,
    (locale, slug) => {
      const decoded = decodeURIComponent(slug);
      return locale === 'en' ? `/blog/${decoded}` : `/${locale}/blog/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs, redirects, htmlStats, mediaUploaded };
}
