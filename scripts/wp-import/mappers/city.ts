/**
 * WP destination-hub `page` → Sanity `city` (UPDATE existing or CREATE).
 *
 * Critical behaviour: if a Sanity city doc already exists for this destination's
 * EN slug (from Phase 1 seed data), we PATCH onto that doc rather than create
 * a duplicate with `wp-page-{wpId}`. Detection: query Sanity for
 * `*[_type=="city" && slug[_key=="en"][0].value.current == $slug][0]`.
 */

import type { SanityClient } from '@sanity/client';

import { htmlToPortableText, mineKeyFacts } from '../../wp-import-html.js';
import { findCityByEnSlug } from '../sanity.js';
import type { WpClient } from '../wp-client.js';
import {
  buildHeroImage,
  buildMigrationMeta,
  buildRedirects,
  i18nString,
  decodeTitle,
  plainText,
} from './_shared.js';
import type { HtmlPipelineStats, I18nSlug, Locale, LocaleGroup, MapperResult, SanityDoc } from '../types.js';

/**
 * Locale-aware slug stripper for destination-hub WP pages.
 *
 * WP renders destination-hub pages with locale-specific "travel guide" naming
 * patterns (verified across all 41 *-travel-guide pages × 3 locales in
 * session 5 pre-flight):
 *
 *   EN: ends with "-travel-guide"             — 41/41 conform
 *   JA: ends with 旅行ガイド (40/41 cities) or 観光ガイド (al-minya only —
 *        translator variant). Alternation handles both.
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
    // JA suffix variants: 旅行ガイド ("travel guide" — 40/41 cities), 観光ガイド
    // ("tourism guide" — al-Minya), の宿泊情報 ("accommodation info" — Dahab outlier).
    if (/(?:旅行|観光)ガイド$/.test(decoded)) return { stripped: decoded.replace(/(?:旅行|観光)ガイド$/, ''), matched: true };
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

/**
 * Fix 4 — strip "Travel Guide" suffix (locale-aware) from the city `name`
 * field. Mirrors the slug-strip rules:
 *
 *   EN: `^(.+?)\s+Travel Guide$` (case-insensitive) → group 1
 *   ES: `^Guía de viaje[s]?\s+(?:de(?:l)?\s+)?(?:la\s+|el\s+)?(.+?)$` → group 1
 *   JA: `^(.+?)(?:旅行|観光)ガイド$` → capture group 1. Handles both
 *       旅行ガイド (travel guide) and 観光ガイド (tourism guide) translator variants.
 *
 * If a locale's title doesn't match the expected pattern, the raw title is
 * kept (don't blank). The fallback is logged so editorial can review.
 *
 * Plus the JA outlier (`の宿泊情報` = "Accommodation Info") gets a parallel
 * strip — same rationale as the slug stripper.
 */
function stripCityNameSuffix(rawName: string, locale: Locale): { stripped: string; matched: boolean } {
  const trimmed = rawName.trim();
  if (locale === 'en') {
    const m = /^(.+?)\s+Travel\s+Guide$/i.exec(trimmed);
    if (m) return { stripped: m[1].trim(), matched: true };
  } else if (locale === 'ja') {
    // Same JA suffix variants as the slug stripper: 旅行ガイド, 観光ガイド, の宿泊情報.
    const m = /^(.+?)(?:旅行|観光)ガイド$/.exec(trimmed);
    if (m) return { stripped: m[1].trim(), matched: true };
    const m2 = /^(.+?)の宿泊情報$/.exec(trimmed);
    if (m2) return { stripped: m2[1].trim(), matched: true };
  } else if (locale === 'es') {
    // "Guía de viaje de El Cairo", "Guía de viaje del Oasis de Siwa",
    // "Guía de Safaga", "Guía de viajes de Marsa Matruh"
    const m = /^Guía\s+(?:de\s+(?:viaje[s]?\s+)?)?de(?:l)?\s+(?:oasis\s+de\s+)?(.+?)$/i.exec(trimmed);
    if (m) return { stripped: m[1].trim(), matched: true };
  }
  process.stderr.write(`[city] name-strip pattern miss locale=${locale} raw="${trimmed}" (kept verbatim)\n`);
  return { stripped: trimmed, matched: false };
}

/**
 * Fix 5 — summary cleanup. Build summary from the FIRST text-block of the
 * post-strip overview body (NOT from WP excerpt, which carries the H1 prefix
 * that Fix 1's pipeline strip can't reach).
 *
 * Logic:
 *   1. Walk overview blocks for the locale. Find the first `_type: 'block'`
 *      with non-empty children (the first prose paragraph after Fix 1
 *      stripped the title H1).
 *   2. Concatenate its span texts.
 *   3. Sentence-aware truncate to ≤2 sentences. Delimiters: `. `, `? `, `! `
 *      (Western), `。` (JA). Append `…` if truncated.
 *
 * Falls back to plainText(WP excerpt) only if the body has no usable text
 * blocks. The WP-excerpt path is the legacy session-1-seed behaviour and
 * still useful for entity types that don't have overview bodies.
 */
function buildCitySummaryFromOverview(
  overviewBlocks: unknown[],
  fallbackText: string,
  locale: Locale,
): string {
  // Step 1: find first prose paragraph in overview body.
  let prose = '';
  for (const block of overviewBlocks) {
    if (!block || typeof block !== 'object') continue;
    const b = block as { _type?: string; style?: string; children?: Array<{ text?: string }> };
    if (b._type !== 'block') continue;
    // Skip headings — they're navigation, not summary material.
    if (b.style && /^h[1-6]$/i.test(b.style)) continue;
    const text = (b.children ?? []).map((c) => c.text ?? '').join('').trim();
    if (text.length < 30) continue; // skip too-short fragments
    prose = text;
    break;
  }
  // Fallback to WP excerpt if no usable prose found.
  let text = (prose || fallbackText).replace(/\s+/g, ' ').trim();
  if (!text) return '';

  // Step 2: sentence-aware truncate to ≤2 sentences.
  const max = 2;
  let segments: string[];
  if (locale === 'ja') {
    segments = text.split(/(?<=。)/).filter((s) => s.trim().length > 0);
  } else {
    segments = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  }
  if (segments.length <= max) return text;
  const kept = segments.slice(0, max).join(' ').trim();
  return kept.endsWith('…') ? kept : `${kept}…`;
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

  // Build per-locale page titles for use by Fixes 1 (HTML pipeline title-H1
  // strip) and Fix 5 (summary title-prefix bleed strip). Decoded titles are
  // used for substring matching against body content.
  const titles: Partial<Record<Locale, string>> = {};
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (e) titles[loc] = decodeTitle(e.title?.rendered) ?? '';
  }

  // Build overview body per locale, threading pageTitle through so the HTML
  // pipeline's Fix 1 (title-matching H1 strip) fires per locale.
  // Accumulate HtmlPipelineStats across the 3 locales for run-summary aggregation.
  const overview: Array<{ _key: Locale; _type: 'object'; value: unknown[] }> = [];
  const overviewBlocksPerLocale: Partial<Record<Locale, unknown[]>> = {};
  const htmlStats: HtmlPipelineStats = {
    operatorNotes: 0, pullQuotes: 0, sideImages: 0, images: 0, tablesFlattened: 0, pendingInternalLinks: 0,
    tourPromoStripped: 0, categoryGridStripped: 0, backlinkStripped: 0,
    carouselSwiperStripped: 0, carouselPremiumAdvStripped: 0, bdtImgStripped: 0,
    titleH1Stripped: 0, metadataLineStripped: 0, sectionNavBlockStripped: 0,
    linkMarkConvertedToPendingRef: 0, linkMarkKeptAsExternal: 0,
    linkMarkStrippedMalformed: 0, linkMarkStrippedAnchor: 0, linkMarkStrippedMailto: 0,
  };
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e?.content?.rendered) continue;
    const r = htmlToPortableText(e.content.rendered, { pageTitle: titles[loc] ?? '' });
    overview.push({ _key: loc, _type: 'object', value: r.blocks });
    overviewBlocksPerLocale[loc] = r.blocks;
    for (const k of Object.keys(htmlStats) as Array<keyof HtmlPipelineStats>) htmlStats[k] += r.stats[k];
  }

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

  // Fix 4: strip locale-specific "Travel Guide" suffix from name. Built per-locale
  // explicitly because i18nString's pick callback doesn't carry locale context.
  const name: Array<{ _key: Locale; value: string }> = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e) continue;
    const raw = decodeTitle(e.title?.rendered) ?? '';
    if (!raw) continue;
    const stripped = stripCityNameSuffix(raw, loc).stripped;
    if (stripped) name.push({ _key: loc, value: stripped });
  }

  // Fix 5: summary built from first prose paragraph of post-strip overview
  // body (Fix 1 already removed the title H1, so the first paragraph is the
  // actual content). Falls back to WP excerpt only if body has no usable
  // prose blocks. ≤2 sentences, locale-aware delimiters, ellipsis on truncate.
  const summary: Array<{ _key: Locale; value: string }> = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e) continue;
    const overviewBlocks = overviewBlocksPerLocale[loc] ?? [];
    const fallback = plainText(e.excerpt?.rendered ?? '');
    const built = buildCitySummaryFromOverview(overviewBlocks, fallback, loc);
    if (built) summary.push({ _key: loc, value: built });
  }

  const doc: SanityDoc = {
    _id,
    _type: 'city',
    name,
    slug: cityI18nSlug(group),
    summary,
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

  return { docs: [doc], redirects, htmlStats };
}
