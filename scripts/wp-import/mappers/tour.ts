/**
 * WP tour-or-package `page` → Sanity `tour`.
 *
 * Type discriminator:
 *   - `package` if slug contains `package | vacation | itinerary | cruise-vacation`
 *     OR matches `\d+-day` where N > 7
 *   - `dayTour` otherwise
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

interface TourMapperOpts {
  dryRun?: boolean;
  priorityScore?: number;
}

export async function mapTour(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: TourMapperOpts = {}
): Promise<MapperResult> {
  const en = group.en;
  const slug = en.slug.toLowerCase();

  // Determine type.
  const isPackage =
    /-package(-|$)|-vacation(-|$)|-itinerary(-|$)|cruise-vacation/.test(slug) ||
    daysFromSlug(slug) > 7;
  const tourType: 'dayTour' | 'package' = isPackage ? 'package' : 'dayTour';

  // Mine durationDays.
  const durationDays = daysFromSlug(slug);

  const hero = await buildHeroImage(client, wp, group, opts);

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'tour',
    type: tourType,
    title: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
    summary: i18nString(group, (e) => plainText(e.excerpt?.rendered).slice(0, 240)),
    description: i18nBody(group),
    ...(durationDays > 0 ? { durationDays } : {}),
    ...(hero ? { heroImage: hero } : {}),
    migration: buildMigrationMeta(group),
  };

  const redirects = buildRedirects(
    group,
    (locale, slug) => {
      const decoded = decodeURIComponent(slug);
      const base = tourType === 'package' ? 'packages' : 'tours';
      return locale === 'en' ? `/${base}/${decoded}` : `/${locale}/${base}/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}

function daysFromSlug(slug: string): number {
  const m = /^(\d+)-?days?-/.exec(slug) ?? /(\d+)-day-/.exec(slug);
  if (!m) return 0;
  return Number(m[1]);
}
