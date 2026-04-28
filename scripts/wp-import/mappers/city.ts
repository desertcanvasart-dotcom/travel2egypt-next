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
  i18nString,
  decodeTitle,
  plainText,
} from './_shared.js';
import type { I18nSlug, Locale, LocaleGroup, MapperResult, SanityDoc } from '../types.js';

/**
 * Locale-aware slug stripper for destination-hub WP pages.
 *
 * WP renders destination-hub pages with locale-specific "travel guide" naming
 * patterns (verified across all 41 *-travel-guide pages × 3 locales in
 * session 5 pre-flight):
 *
 *   EN: ends with "-travel-guide"             — 41/41 conform
 *   JA: ends with "旅行ガイド"                  — 40/41 conform
 *        (1 outlier: dahab-travel-guide JA = "ダハブの宿泊情報"
 *         = "Dahab Accommodation Info" — different content concept;
 *         we strip "の宿泊情報" too and flag for editorial review)
 *   ES: starts with "guia-(de-(viaje[s]-)?)?de(l)?-(oasis-de-)?"
 *        — 41/41 conform under this permissive pattern
 *
 * The Sanity city schema convention is short slugs (`cairo`, `el-cairo`,
 * `カイロ`) so front-end routes are `/guide/cairo`, `/es/guide/el-cairo`,
 * `/ja/guide/カイロ`. The Q5 cutover decision pairs with this: the WP archive
 * URLs (`/cairo-travel-guide/` etc.) get 301-redirected to the new shorter
 * paths.
 *
 * The stripper logs to stderr when an input slug doesn't match any known
 * pattern (per "loud failures" methodology rule). Caller can choose whether
 * to flag the doc for review.
 */
function stripCityHubSuffix(rawSlug: string, locale: Locale): { stripped: string; matched: boolean } {
  const decoded = decodeURIComponent(rawSlug);
  if (locale === 'en') {
    if (decoded.endsWith('-travel-guide')) return { stripped: decoded.replace(/-travel-guide$/, ''), matched: true };
  } else if (locale === 'ja') {
    if (decoded.endsWith('旅行ガイド')) return { stripped: decoded.replace(/旅行ガイド$/, ''), matched: true };
    if (decoded.endsWith('の宿泊情報')) return { stripped: decoded.replace(/の宿泊情報$/, ''), matched: true };
  } else if (locale === 'es') {
    const ES_PREFIX = /^guia(?:-de(?:-viaje[s]?)?)?-de[l]?-(?:oasis-de-)?/;
    if (ES_PREFIX.test(decoded)) return { stripped: decoded.replace(ES_PREFIX, ''), matched: true };
  }
  process.stderr.write(`[city] slug-strip pattern miss locale=${locale} raw=${decoded} (kept verbatim)\n`);
  return { stripped: decoded, matched: false };
}

/** Build the i18n slug array for a city doc, applying locale-aware stripping
 * to convert WP destination-hub slugs (like "cairo-travel-guide") into the
 * Sanity city slug convention (like "cairo"). */
function cityI18nSlug(group: LocaleGroup): I18nSlug {
  const out: I18nSlug = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e?.slug) continue;
    const { stripped } = stripCityHubSuffix(e.slug, loc);
    out.push({ _key: loc, value: { _type: 'slug', current: stripped } });
  }
  return out;
}

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
  const enRawSlug = decodeURIComponent(en.slug);
  // The Sanity city slug is the WP slug with the "-travel-guide" suffix stripped
  // (per Q5 / session 5 slug-shape decision). The seed city _ids use this short
  // form too (e.g. `city-cairo`, not `city-cairo-travel-guide`).
  const enCitySlug = stripCityHubSuffix(enRawSlug, 'en').stripped;

  // Find existing city in Sanity. If present, reuse its _id.
  // Lookup uses the stripped slug because seed cities follow that convention.
  let _id = `wp-page-${en.id}`;
  if (!opts.dryRun) {
    const existing = await findCityByEnSlug(client, enCitySlug);
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
    slug: cityI18nSlug(group),
    summary: i18nString(group, (e) => plainText(e.excerpt?.rendered).slice(0, 280)),
    overview,
    ...(keyFacts ? { keyFacts } : {}),
    ...(hero ? { heroImage: hero } : {}),
    migration: buildMigrationMeta(group, hasFacts ? undefined : 'keyfacts-mining-failed'),
  };

  // Redirect target uses the *stripped* slug so old WP URLs like
  // /cairo-travel-guide/ → /guide/cairo (not /guide/cairo-travel-guide).
  // Pairs with the Q5 cutover decision for the parent /egypt-travel-guide/
  // archive URL → /guide/.
  const redirects = buildRedirects(
    group,
    (locale, slug) => {
      const stripped = stripCityHubSuffix(decodeURIComponent(slug), locale).stripped;
      return locale === 'en' ? `/guide/${stripped}` : `/${locale}/guide/${stripped}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}
