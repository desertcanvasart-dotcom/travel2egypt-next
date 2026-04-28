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
  prepareBodyImageResolver,
} from './_shared.js';
import type { DiscardedCarousel, HtmlPipelineStats, LocaleGroup, MapperResult, ReviewFlag, SanityDoc } from '../types.js';

interface ArticleMapperOpts {
  reviewFlag?: ReviewFlag;
  /** Override _type — defaults to "article". */
  sanityType?: string;
  dryRun?: boolean;
  priorityScore?: number;
  /** WP category id → slug map, fetched once at startup. */
  wpCategoryById?: Map<number, string>;
  /** WP author id → slug map, fetched once at startup. */
  wpAuthorById?: Map<number, string>;
}

/** WP category slugs that route an article to "Planning advice" rather than "Destination depth". */
const PLANNING_CATEGORY_SLUGS = new Set(['tips-tricks', 'egypt-travel-guide', 'safety']);
const DEFAULT_AUTHOR_REF = 'author-legacy-archive';
const PLANNING_CATEGORY_REF = 'category-planning';
const DESTINATION_CATEGORY_REF = 'category-destination';

export async function mapArticle(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: ArticleMapperOpts = {}
): Promise<MapperResult> {
  const _type = opts.sanityType ?? 'article';
  const docs: SanityDoc[] = [];
  const htmlStats: HtmlPipelineStats = {
    operatorNotes: 0, pullQuotes: 0, sideImages: 0, images: 0, tablesFlattened: 0, pendingInternalLinks: 0,
    tourPromoStripped: 0, categoryGridStripped: 0, backlinkStripped: 0,
    carouselSwiperStripped: 0, carouselPremiumAdvStripped: 0, bdtImgStripped: 0,
  };
  const discardedCarousels: DiscardedCarousel[] = [];
  let mediaUploaded = 0;
  let duplicateSrcRemappings = 0;

  // Resolve original WP author + categories from id→slug maps for migration meta.
  const wpAuthorSlug = opts.wpAuthorById?.get(group.en.author ?? -1);
  const wpCategorySlugs: string[] = (group.en.categories ?? [])
    .map((id) => opts.wpCategoryById?.get(id))
    .filter((s): s is string => Boolean(s));
  const categoryRef = wpCategorySlugs.some((s) => PLANNING_CATEGORY_SLUGS.has(s))
    ? PLANNING_CATEGORY_REF
    : DESTINATION_CATEGORY_REF;

  const enSlug = decodeURIComponent(group.en.slug);

  // Build the hero once — same Sanity asset reference is reused on every
  // locale doc (Sanity dedupes by content hash; we just hand back the same _ref).
  const hero = await buildHeroImage(client, wp, group, { ...opts, referrerSlug: enSlug, referrerLocale: 'en' });
  if (hero) mediaUploaded++;

  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e) continue;
    const html = e.content?.rendered ?? '';
    const refSlug = decodeURIComponent(e.slug);
    // Pre-upload all body attachments referenced via wp-image-{ID} class so
    // the HTML→PT pipeline can substitute Sanity asset refs for the WP src URLs.
    const { resolver, uploaded: bodyUploads, duplicateSrcRemappings: bodyDups } = await prepareBodyImageResolver(client, wp, html, {
      ...opts, referrerSlug: refSlug, referrerLocale: loc,
    });
    mediaUploaded += bodyUploads;
    duplicateSrcRemappings += bodyDups;
    const pt = htmlToPortableText(html, { attachmentResolver: resolver, localeShape: 'string' });
    for (const k of Object.keys(htmlStats) as Array<keyof HtmlPipelineStats>) htmlStats[k] += pt.stats[k];

    // Capture discarded carousels per locale (sample srcs preserved for editorial triage).
    const docId = `wp-post-${e.id}-${loc}`;
    for (const [widget, key] of [
      ['swiper', 'carouselSwiperStripped'],
      ['premium-adv', 'carouselPremiumAdvStripped'],
      ['bdt-img', 'bdtImgStripped'],
    ] as const) {
      const count = pt.stats[key];
      if (count > 0) {
        const samples =
          widget === 'swiper' ? pt.discardedCarouselSrcs.swiper :
          widget === 'premium-adv' ? pt.discardedCarouselSrcs.premiumAdv :
          pt.discardedCarouselSrcs.bdtImg;
        discardedCarousels.push({ docId, slug: refSlug, locale: loc, widget, count, sampleSrcs: samples });
      }
    }

    const meta = {
      ...buildMigrationMeta(group, opts.reviewFlag),
      ...(group.en.author !== undefined ? { wpAuthorId: group.en.author } : {}),
      ...(wpAuthorSlug ? { wpAuthorSlug } : {}),
      ...(wpCategorySlugs.length ? { wpCategorySlugs } : {}),
    };

    docs.push({
      _id: docId,
      _type,
      language: loc,
      title: decodeTitle(e.title?.rendered),
      slug: { _type: 'slug', current: decodeURIComponent(e.slug) },
      ...(hero ? { heroImage: hero } : {}),
      deck: plainText(e.excerpt?.rendered),
      body: pt.blocks,
      publishedAt: e.date,
      author: { _type: 'reference', _ref: DEFAULT_AUTHOR_REF },
      category: { _type: 'reference', _ref: categoryRef },
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

  return { docs, redirects, htmlStats, mediaUploaded, discardedCarousels, duplicateSrcRemappings };
}
