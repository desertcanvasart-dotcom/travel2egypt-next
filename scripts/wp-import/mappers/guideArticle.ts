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

import {
  EXPLICIT_PARENT_CITY_OVERRIDES,
  EXPLICIT_SECTION_OVERRIDES,
  EXPLICIT_SLUG_OVERRIDES,
} from '../../wp-classifier.js';
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
import type { Classification, I18nSlug, LocaleGroup, MapperResult, SanityDoc } from '../types.js';

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
  const wpEnSlug = decodeURIComponent(en.slug);

  // Editorial overrides (session 6.5a Investigation 3). Each falls back to the
  // classifier-derived value when no override is present, so existing 422-cohort
  // slugs pass through unchanged.
  const slugOverride = EXPLICIT_SLUG_OVERRIDES[wpEnSlug];
  const sectionOverride = EXPLICIT_SECTION_OVERRIDES[wpEnSlug];
  const parentCityOverride = EXPLICIT_PARENT_CITY_OVERRIDES[wpEnSlug];

  const effectiveParentCity = parentCityOverride ?? cls.inferredParentCity;
  const effectiveSection = sectionOverride ?? cls.inferredSection;

  // Resolve parentCity reference (look up existing city doc by EN slug).
  let parentCityRef: { _ref: string; _type: 'reference' } | null = null;
  let parentCitySlug: string | null = null;
  if (effectiveParentCity && !opts.dryRun) {
    const found = await findCityByEnSlug(client, effectiveParentCity);
    if (found) {
      parentCityRef = { _type: 'reference', _ref: found._id };
      parentCitySlug = effectiveParentCity;
    }
  } else if (effectiveParentCity) {
    parentCitySlug = effectiveParentCity;
  }

  // Determine review flag. Section-needs-assignment OR low-confidence carry it.
  const reviewFlag = effectiveSection ? undefined : 'section-needs-assignment';

  const hero = await buildHeroImage(client, wp, group, opts);
  const body = i18nBody(group);

  // Slug array: when an editorial override applies, write the override slug
  // to all locale variants (Investigation 3 decision is single-slug across
  // EN/ES/JA — clean URLs are intentionally locale-symmetric for these 3
  // dahab cleanups). Otherwise use the per-locale WP slugs as usual.
  const slug: I18nSlug = slugOverride
    ? (['en', 'es', 'ja'] as const)
        .filter((loc) => Boolean(group[loc]))
        .map((loc) => ({ _key: loc, value: { _type: 'slug' as const, current: slugOverride } }))
    : i18nSlug(group);

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'guideArticle',
    title: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug,
    summary: i18nString(group, (e) => plainText(e.excerpt?.rendered).slice(0, 240)),
    body,
    ...(hero ? { heroImage: hero } : {}),
    ...(parentCityRef ? { parentCity: parentCityRef } : {}),
    ...(effectiveSection ? { section: effectiveSection } : {}),
    migration: buildMigrationMeta(group, reviewFlag),
  };

  const redirects = buildRedirects(
    group,
    (locale, wpSlug) => {
      // The path-on-Sanity uses the override slug when present (so the
      // redirect lands on the editorial-correct URL); the path-from URL is
      // still the WP slug, which `buildRedirects` reads from the entry's
      // `link` independently of this builder.
      const targetSlug = slugOverride ?? decodeURIComponent(wpSlug);
      // If we don't know the parent city, fall back to /blog/ (article-shaped redirect).
      // Phase 2 redirect-orphan triage will assign the right path.
      if (!parentCitySlug) return locale === 'en' ? `/blog/${targetSlug}` : `/${locale}/blog/${targetSlug}`;
      return locale === 'en' ? `/guide/${parentCitySlug}/${targetSlug}` : `/${locale}/guide/${parentCitySlug}/${targetSlug}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}
