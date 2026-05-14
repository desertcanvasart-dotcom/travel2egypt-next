/**
 * WP hotel `page` → Sanity `hotel`.
 *
 * Required schema fields enforced here:
 *   - name, slug, summary: from WP entity
 *   - city: full-slug token-boundary scan against the city inventory
 *     (mirrors tour.ts resolver); falls back to Cairo with
 *     migration.cityResolution='default-cairo' for operator review.
 *   - category: placeholder 'standard'; migration.categoryResolution=
 *     'default-standard' for operator review in Studio.
 *
 * Optional fields (starRating, body content beyond summary, operatorNotes,
 * gallery, seo) left for operator authoring.
 */

import type { SanityClient } from '@sanity/client';

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
import { fetchCityRefsBySlug, resolveTopLevelCities } from './tour.js';
import type { Classification, LocaleGroup, MapperResult, SanityDoc } from '../types.js';

interface HotelMapperOpts {
  classification: Classification;
  dryRun?: boolean;
  priorityScore?: number;
  cityRefsBySlug?: Map<string, string>;
}

export async function mapHotel(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: HotelMapperOpts
): Promise<MapperResult> {
  const en = group.en;
  const slug = en.slug;

  // City reference — full-slug token-boundary scan; default to Cairo if no match.
  // Hotel schema requires `city` (singular reference), so we always emit one.
  const cityRefsBySlug = opts.cityRefsBySlug ?? (await fetchCityRefsBySlug(client));
  const { cities, resolution: cityResolution } = resolveTopLevelCities(slug, cityRefsBySlug);
  const firstCity = cities[0];
  const cityRef = firstCity
    ? { _type: 'reference' as const, _ref: firstCity._ref }
    : null;

  const hero = await buildHeroImage(client, wp, group, opts);

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'hotel',
    name: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
    summary: i18nString(group, (e) => plainText(e.excerpt?.rendered).slice(0, 240)),
    body: i18nBody(group),
    category: 'standard',
    ...(cityRef ? { city: cityRef } : {}),
    ...(hero ? { heroImage: hero } : {}),
    migration: buildMigrationMeta(group, undefined, {
      cityResolution,
      categoryResolution: 'default-standard',
    }),
  };

  const redirects = buildRedirects(
    group,
    (locale, slugIn) => {
      const decoded = decodeURIComponent(slugIn);
      return locale === 'en' ? `/hotels/${decoded}` : `/${locale}/hotels/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}
