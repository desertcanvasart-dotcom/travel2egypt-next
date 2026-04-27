/**
 * WP destination-subpage `page` → Sanity `guideArticle`.
 *
 * `parentCity` resolves from the classifier's `inferredParentCity` token by
 * looking up an existing city doc by EN slug (cities must be imported BEFORE
 * subpages — the orchestrator enforces this).
 *
 * `section` from classifier's `inferredSection`. If undefined, doc is
 * imported with `migration.reviewFlag = "section-needs-assignment"`.
 */

import type { SanityClient } from '@sanity/client';

import { findCityByEnSlug } from '../sanity.js';
import type { WpClient } from '../wp-client.js';
import {
  buildHeroImage,
  buildMigrationMeta,
  buildRedirects,
  decodeTitle,
  i18nBody,
  i18nSlug,
  i18nString,
  plainText,
} from './_shared.js';
import type { Classification, LocaleGroup, MapperResult, SanityDoc } from '../types.js';

interface GuideArticleMapperOpts {
  classification: Classification;
  dryRun?: boolean;
  priorityScore?: number;
}

export async function mapGuideArticle(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: GuideArticleMapperOpts
): Promise<MapperResult> {
  const en = group.en;
  const cls = opts.classification;

  // Resolve parentCity reference (look up existing city doc by EN slug).
  let parentCityRef: { _ref: string; _type: 'reference' } | null = null;
  let parentCitySlug: string | null = null;
  if (cls.inferredParentCity && !opts.dryRun) {
    const found = await findCityByEnSlug(client, cls.inferredParentCity);
    if (found) {
      parentCityRef = { _type: 'reference', _ref: found._id };
      parentCitySlug = cls.inferredParentCity;
    }
  } else if (cls.inferredParentCity) {
    parentCitySlug = cls.inferredParentCity;
  }

  // Determine review flag. Section-needs-assignment OR low-confidence carry it.
  const reviewFlag = cls.inferredSection ? undefined : 'section-needs-assignment';

  const hero = await buildHeroImage(client, wp, group, opts);
  const body = i18nBody(group);

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'guideArticle',
    title: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
    summary: i18nString(group, (e) => plainText(e.excerpt?.rendered).slice(0, 240)),
    body,
    ...(hero ? { heroImage: hero } : {}),
    ...(parentCityRef ? { parentCity: parentCityRef } : {}),
    ...(cls.inferredSection ? { section: cls.inferredSection } : {}),
    migration: buildMigrationMeta(group, reviewFlag),
  };

  const redirects = buildRedirects(
    group,
    (locale, slug) => {
      const decoded = decodeURIComponent(slug);
      // If we don't know the parent city, fall back to /blog/ (article-shaped redirect).
      // Phase 2 redirect-orphan triage will assign the right path.
      if (!parentCitySlug) return locale === 'en' ? `/blog/${decoded}` : `/${locale}/blog/${decoded}`;
      return locale === 'en' ? `/guide/${parentCitySlug}/${decoded}` : `/${locale}/guide/${parentCitySlug}/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}
