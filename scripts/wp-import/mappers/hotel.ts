/**
 * WP hotel `page` → Sanity `hotel`.
 *
 * Hotel category and starRating are not auto-inferred — left empty for editor.
 * The `city` reference resolves from classifier's `inferredParentCity`.
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

interface HotelMapperOpts {
  classification: Classification;
  dryRun?: boolean;
  priorityScore?: number;
}

export async function mapHotel(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: HotelMapperOpts
): Promise<MapperResult> {
  const en = group.en;

  let cityRef: { _ref: string; _type: 'reference' } | null = null;
  if (opts.classification.inferredParentCity && !opts.dryRun) {
    const found = await findCityByEnSlug(client, opts.classification.inferredParentCity);
    if (found) cityRef = { _type: 'reference', _ref: found._id };
  }

  const hero = await buildHeroImage(client, wp, group, opts);

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'hotel',
    name: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
    summary: i18nString(group, (e) => plainText(e.excerpt?.rendered).slice(0, 240)),
    description: i18nBody(group),
    ...(cityRef ? { city: cityRef } : {}),
    ...(hero ? { heroImage: hero } : {}),
    migration: buildMigrationMeta(group),
  };

  const redirects = buildRedirects(
    group,
    (locale, slug) => {
      const decoded = decodeURIComponent(slug);
      return locale === 'en' ? `/hotels/${decoded}` : `/${locale}/hotels/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}
