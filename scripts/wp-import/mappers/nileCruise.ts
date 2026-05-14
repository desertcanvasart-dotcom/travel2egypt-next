/**
 * WP nile-cruise `page` → Sanity `nileCruise`.
 *
 * Required schema fields enforced here:
 *   - name, slug, summary: from WP entity
 *   - type: inferred from slug keywords (dahabiya / felucca) or defaults to
 *     'cruise-ship'. Recorded in migration.typeInference for audit.
 *
 * Optional fields (tier, capacity, body content, operatorNotes, gallery,
 * seo) left for operator authoring. tier is null at import; operator
 * assigns standard/deluxe/luxury/boutique in Studio.
 *
 * Redirect path: /nile-cruises/[slug] (matches schema convention).
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

function inferVesselType(slug: string): {
  type: 'cruise-ship' | 'dahabiya' | 'felucca';
  source: 'slug-keyword' | 'default-cruise-ship';
} {
  const s = slug.toLowerCase();
  if (/(^|-)dahabiya(-|$)/.test(s)) return { type: 'dahabiya', source: 'slug-keyword' };
  if (/(^|-)felucca(-|$)/.test(s)) return { type: 'felucca', source: 'slug-keyword' };
  return { type: 'cruise-ship', source: 'default-cruise-ship' };
}

export async function mapNileCruise(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: NileCruiseMapperOpts = {}
): Promise<MapperResult> {
  const en = group.en;
  const { type: vesselType, source: typeInference } = inferVesselType(en.slug);

  const hero = await buildHeroImage(client, wp, group, opts);

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'nileCruise',
    name: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
    type: vesselType,
    summary: i18nString(group, (e) => plainText(e.excerpt?.rendered).slice(0, 240)),
    body: i18nBody(group),
    ...(hero ? { heroImage: hero } : {}),
    migration: buildMigrationMeta(group, undefined, {
      typeInference,
    }),
  };

  const redirects = buildRedirects(
    group,
    (locale, slugIn) => {
      const decoded = decodeURIComponent(slugIn);
      return locale === 'en' ? `/nile-cruises/${decoded}` : `/${locale}/nile-cruises/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}
