/**
 * WP destination-hub `page` → Sanity `city` (UPDATE existing or CREATE).
 *
 * Critical behaviour: if a Sanity city doc already exists for this destination's
 * EN slug (from Phase 1 seed data), we PATCH onto that doc rather than create
 * a duplicate with `wp-page-{wpId}`. Detection: query Sanity for
 * `*[_type=="city" && slug[_key=="en"][0].value.current == $slug][0]`.
 */

import type { SanityClient } from '@sanity/client';

import { mineKeyFacts } from '../../wp-import-html.js';
import { findCityByEnSlug } from '../sanity.js';
import type { WpClient } from '../wp-client.js';
import {
  buildHeroImage,
  buildMigrationMeta,
  buildRedirects,
  i18nBody,
  i18nSlug,
  i18nString,
  decodeTitle,
  plainText,
} from './_shared.js';
import type { LocaleGroup, MapperResult, SanityDoc } from '../types.js';

interface CityMapperOpts {
  dryRun?: boolean;
  priorityScore?: number;
}

export async function mapCity(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: CityMapperOpts = {}
): Promise<MapperResult> {
  const en = group.en;
  const enSlug = decodeURIComponent(en.slug);

  // Find existing city in Sanity. If present, reuse its _id.
  let _id = `wp-page-${en.id}`;
  if (!opts.dryRun) {
    const existing = await findCityByEnSlug(client, enSlug);
    if (existing) _id = existing._id;
  }

  const hero = await buildHeroImage(client, wp, group, opts);
  const overview = i18nBody(group);

  // Mine keyFacts from the EN body. Empty when detection fails.
  const keyFactsRaw = mineKeyFacts(en.content?.rendered ?? '');
  const hasFacts = keyFactsRaw.bestSeason || keyFactsRaw.gettingThere || keyFactsRaw.daysNeeded;
  const keyFacts = hasFacts
    ? {
        ...(keyFactsRaw.bestSeason ? { bestSeason: [{ _key: 'en', value: keyFactsRaw.bestSeason }] } : {}),
        ...(keyFactsRaw.gettingThere ? { gettingThere: [{ _key: 'en', value: keyFactsRaw.gettingThere }] } : {}),
        ...(keyFactsRaw.daysNeeded ? { daysNeeded: [{ _key: 'en', value: keyFactsRaw.daysNeeded }] } : {}),
      }
    : null;

  const doc: SanityDoc = {
    _id,
    _type: 'city',
    name: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
    summary: i18nString(group, (e) => plainText(e.excerpt?.rendered).slice(0, 280)),
    overview,
    ...(keyFacts ? { keyFacts } : {}),
    ...(hero ? { heroImage: hero } : {}),
    migration: buildMigrationMeta(group, hasFacts ? undefined : 'keyfacts-mining-failed'),
  };

  const redirects = buildRedirects(
    group,
    (locale, slug) => {
      const decoded = decodeURIComponent(slug);
      return locale === 'en' ? `/guide/${decoded}` : `/${locale}/guide/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}
