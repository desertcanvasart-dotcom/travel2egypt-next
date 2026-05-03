/**
 * WP page → Sanity `travelTip` (FIELD-LEVEL i18n).
 *
 * Pattern mirrors `mapGuideArticle`: one document with internationalizedArray
 * fields per locale, mapper produces title / slug / summary / body all keyed
 * by `_key: 'en' | 'es' | 'ja'`.
 *
 * Scope: country-level practical-tip slugs (`airports-in-egypt`,
 * `tipping-in-egypt`, `transportation-in-egypt`, …) routed by the classifier
 * to `travelTip` per session 6 Phase 3 routing decisions in
 * `migration/.diffs/destination-hub-misclassified-resolved.md`.
 *
 * Reference target for editorial-only fields (per session 6.5a Phase 3 wiring):
 * `category`, `relatedTips`, `seo` are editorial-only → mapper-produced
 * `category` is acknowledged-default (lesson 15); editorial reassignment in
 * Studio is canonical authority.
 *
 * D4 fallback (per resolved.md): if EN slug is `currency-in-egypt` AND the
 * post-strip body length falls below 3,000 characters, the mapper emits a
 * warning + skips writing this slug; the slug is then handled at cutover via
 * a manual redirect (session 9 step 13).
 */

import type { SanityClient } from '@sanity/client';

import type { PtBlock } from '../../wp-import-html.js';
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
  summedHtmlStats,
} from './_shared.js';
import type { LocaleGroup, MapperResult, SanityDoc } from '../types.js';

interface TravelTipMapperOpts {
  dryRun?: boolean;
  priorityScore?: number;
}

/**
 * Slug → travelTipCategory `_id` map. Hardcoded from session 6 Phase 3
 * routing decisions in `migration/.diffs/destination-hub-misclassified-resolved.md`
 * "Per-slug routing table". Editorial reassignment in Studio overlays this
 * acknowledged-default per `TRAVEL_TIP_EDITORIAL_ONLY_FIELDS` classification
 * (session 6 close + 6.5a Phase 3).
 *
 * Keys are EN slugs only — locale slug variants resolve to the same WP `_id`
 * and route here unchanged.
 */
export const TRAVEL_TIP_SLUG_TO_CATEGORY: Record<string, string> = {
  // getting-around
  'airports-in-egypt': 'travelTipCategory-getting-around',
  'transportation-in-egypt': 'travelTipCategory-getting-around',
  // practical-essentials
  'electricity-in-egypt': 'travelTipCategory-practical-essentials',
  'wifi-in-egypt': 'travelTipCategory-practical-essentials',
  'telephones-in-egypt': 'travelTipCategory-practical-essentials',
  'time-in-egypt': 'travelTipCategory-practical-essentials',
  'language-in-egypt': 'travelTipCategory-practical-essentials',
  'toilets-in-egypt': 'travelTipCategory-practical-essentials',
  // culture-and-money
  'bargaining-in-egypt': 'travelTipCategory-culture-and-money',
  'tipping-in-egypt': 'travelTipCategory-culture-and-money',
  'touts-in-egypt': 'travelTipCategory-culture-and-money',
  'cultural-etiquette-in-egypt': 'travelTipCategory-culture-and-money',
  'currency-in-egypt': 'travelTipCategory-culture-and-money',
  // when-to-go
  'ramadan-in-egypt': 'travelTipCategory-when-to-go',
  'month-by-month-guide-to-egypt': 'travelTipCategory-when-to-go',
  // food
  'culinary-journey-in-egypt': 'travelTipCategory-food',
  // traveler-segments
  'solo-woman-traveler-in-egypt': 'travelTipCategory-traveler-segments',
  'vegetarian-travelers-to-egypt': 'travelTipCategory-traveler-segments',
};

/**
 * Predicate the classifier uses to identify travelTip-routable slugs. Single
 * source of truth: membership in `TRAVEL_TIP_SLUG_TO_CATEGORY`. The classifier
 * imports this rather than enumerating slugs separately so the two never drift.
 */
export function isTravelTipSlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(TRAVEL_TIP_SLUG_TO_CATEGORY, slug);
}

/** D4 fallback threshold per `migration/.diffs/destination-hub-misclassified-resolved.md`. */
const CURRENCY_IN_EGYPT_MIN_BODY_CHARS = 3000;
const CURRENCY_IN_EGYPT_SLUG = 'currency-in-egypt';

/** Walk a PT array and concatenate all span `text` to a single string. Used for
 * post-strip body-length measurement (D4). Mirrors `_shared.plainText` output
 * shape but operates on parsed PT blocks rather than raw HTML. */
function ptToPlainText(blocks: PtBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const children = (block as { children?: Array<{ text?: string }> }).children;
    if (!Array.isArray(children)) continue;
    for (const child of children) {
      if (typeof child?.text === 'string') parts.push(child.text);
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export async function mapTravelTip(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: TravelTipMapperOpts = {}
): Promise<MapperResult> {
  const en = group.en;
  const enSlug = decodeURIComponent(en.slug);

  const categoryId = TRAVEL_TIP_SLUG_TO_CATEGORY[enSlug];
  if (!categoryId) {
    // Defensive: scope flags should prevent unrelated slugs reaching here.
    // Loud failure (lesson 1) — silent skip would mask a routing bug.
    process.stderr.write(
      `[mapTravelTip] WARNING: slug "${enSlug}" routed to travelTip but has no category mapping. Routing bug. Skipping.\n`
    );
    return {
      docs: [],
      redirects: [],
      logEntries: [
        {
          level: 'warn',
          wpId: en.id,
          url: en.link,
          message: `mapTravelTip: slug "${enSlug}" not in TRAVEL_TIP_SLUG_TO_CATEGORY; routing bug`,
        },
      ],
    };
  }

  // Build hero (uses media cache; dry-run yields placeholder).
  const hero = await buildHeroImage(client, wp, group, opts);

  // Build i18n body — applies tourPromo / categoryGrid strip rules via the
  // default `htmlToPortableText` invocation inside i18nBody.
  const body = i18nBody(group);
  const htmlStats = summedHtmlStats(group);

  // D4: post-strip body-length check for `currency-in-egypt`. The deferred
  // file flagged this slug as aggregator/listing (4 tour-titles in headings).
  // After strip rules remove the tour-promo blocks, the residual body length
  // determines whether there's substantive currency content to migrate.
  if (enSlug === CURRENCY_IN_EGYPT_SLUG) {
    const enBody = body.find((b) => b._key === 'en');
    const enBodyText = enBody ? ptToPlainText(enBody.value) : '';
    const len = enBodyText.length;
    if (len < CURRENCY_IN_EGYPT_MIN_BODY_CHARS) {
      process.stderr.write(
        `[mapTravelTip] D4 FALLBACK: currency-in-egypt post-strip EN body length ${len} < ${CURRENCY_IN_EGYPT_MIN_BODY_CHARS}; SKIPPING write. Per resolved.md D4 — falls through to redirect at cutover (manual-redirects.csv, session 9 step 13).\n`
      );
      return {
        docs: [],
        redirects: [],
        logEntries: [
          {
            level: 'warn',
            wpId: en.id,
            url: en.link,
            message: `D4 fallback: currency-in-egypt post-strip body length ${len} < ${CURRENCY_IN_EGYPT_MIN_BODY_CHARS}; not migrated; redirect at cutover per resolved.md D4`,
            data: { postStripLength: len, threshold: CURRENCY_IN_EGYPT_MIN_BODY_CHARS },
          },
        ],
        htmlStats,
      };
    }
    // Above threshold — proceed with migration. Surface the measured length
    // in the run log so the 6.5b author has the value visible in the surface.
    process.stderr.write(
      `[mapTravelTip] D4: currency-in-egypt post-strip EN body length ${len} ≥ ${CURRENCY_IN_EGYPT_MIN_BODY_CHARS}; migrating as travelTip.\n`
    );
  }

  // Summary fallback: WP excerpt → first 240 chars of body plain text if
  // excerpt is empty. travelTip.summary is Rule.required(), so an empty
  // array would fail Studio validation post-write (Studio renders the
  // field-level i18n entry as required for all locales, but Sanity stores
  // the doc regardless). Best-effort: at least ensure EN has a summary.
  const summary = i18nString(group, (e) => {
    const fromExcerpt = plainText(e.excerpt?.rendered);
    if (fromExcerpt) return fromExcerpt.slice(0, 240);
    // Fall back to body-derived for this locale.
    const localeBody = body.find((b) => b._key === ((e === group.en) ? 'en' : (e === group.es) ? 'es' : 'ja'));
    return localeBody ? ptToPlainText(localeBody.value).slice(0, 240) : '';
  });

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'travelTip',
    title: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
    summary,
    body,
    ...(hero ? { heroImage: hero } : {}),
    category: { _type: 'reference', _ref: categoryId },
    migration: buildMigrationMeta(group),
  };

  const redirects = buildRedirects(
    group,
    (locale, slug) => {
      const decoded = decodeURIComponent(slug);
      return locale === 'en' ? `/travel-tips/${decoded}` : `/${locale}/travel-tips/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects, htmlStats };
}
