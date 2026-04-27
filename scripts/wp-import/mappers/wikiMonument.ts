/**
 * WP monument `page` → Sanity `wikiMonument` (+ city.placesToGo backref).
 *
 * Single source of truth — never both wikiMonument AND guideArticle for the
 * same source content. After all monuments imported, a reconciliation pass
 * (in wp-import.ts) appends each wikiMonument ref to its parent city's
 * placesToGo array. The reconciliation is de-duped and idempotent.
 */

import type { SanityClient } from '@sanity/client';

import { mineVisitorInfo } from '../../wp-import-html.js';
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

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'wikiMonument',
    name: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
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

  void opts.classification; // Used by reconciliation step (in wp-import.ts) to read inferredParentCity.

  return { docs: [doc], redirects };
}
