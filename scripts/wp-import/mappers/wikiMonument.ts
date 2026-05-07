/**
 * WP monument `page` → Sanity `wikiMonument` (+ city.placesToGo backref).
 *
 * Single source of truth — never both wikiMonument AND guideArticle for the
 * same source content. After all monuments imported, a reconciliation pass
 * (in wp-import.ts) appends each wikiMonument ref to its parent city's
 * placesToGo array. The reconciliation is de-duped and idempotent.
 */

import type { SanityClient } from '@sanity/client';

import {
  extractMonumentParentCity,
  getExplicitParentCityOverride,
  inferMonumentType,
} from '../../wp-classifier.js';
import { mineVisitorInfo } from '../../wp-import-html.js';
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

interface WikiMonumentMapperOpts {
  classification: Classification;
  dryRun?: boolean;
  priorityScore?: number;
}

/**
 * Source of a resolved monument parent-city, for logging and tests.
 * 'override'  — operator-curated EXPLICIT_PARENT_CITY_OVERRIDES (priority 1)
 * 'divider'   — Elementor sidebar "{CITY} Travel Guide" widget (priority 2)
 * 'classifier'— slug-token inference from classifyPageBySlug (priority 3)
 * null        — none of the above produced a value
 */
type ParentCitySource = 'override' | 'divider' | 'classifier' | null;

/**
 * Hybrid priority resolution for monument parent city. Phase 1.5b-iii.
 *
 * Priority order (first non-null wins):
 *   1. EXPLICIT_PARENT_CITY_OVERRIDES — operator-curated editorial truth.
 *      Already factored into `classification.inferredParentCity` by the
 *      classifier; we re-check the map directly so the source can be
 *      reported in stderr warnings and tests can assert priority order.
 *   2. extractMonumentParentCity — Elementor sidebar widget extraction.
 *      Returns null on unrecognized cities (defensive).
 *   3. classification.inferredParentCity — slug-token inference. Lower
 *      confidence than divider because slug tokens can match destinations
 *      that are not staging cities (DESTINATIONS \ canonical-cities).
 */
export function resolveMonumentCity(
  enSlug: string,
  classification: Classification,
  elementorDataJson: string | null | undefined,
): { citySlug: string | null; source: ParentCitySource } {
  const override = getExplicitParentCityOverride(enSlug);
  if (override) return { citySlug: override, source: 'override' };

  const dividerCity = extractMonumentParentCity(elementorDataJson ?? null);
  if (dividerCity) return { citySlug: dividerCity, source: 'divider' };

  if (classification.inferredParentCity) {
    return { citySlug: classification.inferredParentCity, source: 'classifier' };
  }

  return { citySlug: null, source: null };
}

export async function mapWikiMonument(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: WikiMonumentMapperOpts
): Promise<MapperResult> {
  const en = group.en;
  const hero = await buildHeroImage(client, wp, group, opts);

  // Mine visitorInfo from EN body (conservative — empty if uncertain).
  const visitorInfoBlocks = mineVisitorInfo(en.content?.rendered ?? '');
  const visitorInfo = visitorInfoBlocks.length
    ? [{ _key: 'en', _type: 'object', value: visitorInfoBlocks }]
    : [];

  // monumentType — heuristic from slug (one of 16 enum values; defaults to
  // 'other' when no pattern matches). Schema requires this field.
  const monumentType = inferMonumentType(en.slug);

  // city — forward reference to the parent city doc. Schema requires this
  // field. Phase 1.5b-iii hybrid resolution: priority 1 override, priority 2
  // Elementor divider extraction, priority 3 classifier slug-inference.
  // Dry-run skips the lookup (no Sanity fetch) and lands the doc without
  // the ref, mirroring hotel.ts. Cache miss surfaces in stderr (with the
  // resolution source) so operator can triage during dry-run.
  const elementorJson =
    typeof en.meta?._elementor_data === 'string' ? en.meta._elementor_data : null;
  const resolved = resolveMonumentCity(en.slug, opts.classification, elementorJson);

  let cityRef: { _ref: string; _type: 'reference' } | null = null;
  if (resolved.citySlug && !opts.dryRun) {
    const found = await findCityByEnSlug(client, resolved.citySlug);
    if (found) {
      cityRef = { _type: 'reference', _ref: found._id };
    } else {
      process.stderr.write(
        `[wp-import] wikiMonument city-ref miss: slug=${en.slug} ` +
          `resolved=${resolved.citySlug} source=${resolved.source} ` +
          `(no city doc found in dataset)\n`
      );
    }
  }

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'wikiMonument',
    name: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
    monumentType,
    ...(cityRef ? { city: cityRef } : {}),
    summary: i18nString(group, (e) => plainText(e.excerpt?.rendered).slice(0, 240)),
    body: i18nBody(group),
    ...(visitorInfo.length ? { visitorInfo } : {}),
    ...(hero ? { heroImage: hero } : {}),
    migration: buildMigrationMeta(group),
  };

  const redirects = buildRedirects(
    group,
    (locale, slug) => {
      const decoded = decodeURIComponent(slug);
      return locale === 'en' ? `/wiki/monuments/${decoded}` : `/${locale}/wiki/monuments/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}
