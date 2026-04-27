/**
 * WP nile-cruise `page` → Sanity `nileCruise`.
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
import type { LocaleGroup, MapperResult, SanityDoc } from '../types.js';

interface NileCruiseMapperOpts {
  dryRun?: boolean;
  priorityScore?: number;
}

export async function mapNileCruise(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: NileCruiseMapperOpts = {}
): Promise<MapperResult> {
  const en = group.en;
  const hero = await buildHeroImage(client, wp, group, opts);

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'nileCruise',
    name: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
    summary: i18nString(group, (e) => plainText(e.excerpt?.rendered).slice(0, 240)),
    description: i18nBody(group),
    ...(hero ? { heroImage: hero } : {}),
    migration: buildMigrationMeta(group),
  };

  const redirects = buildRedirects(
    group,
    (locale, slug) => {
      const decoded = decodeURIComponent(slug);
      return locale === 'en' ? `/cruises/${decoded}` : `/${locale}/cruises/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}
