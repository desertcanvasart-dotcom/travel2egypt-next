/**
 * WP tour-or-package `page` → Sanity `tour`.
 *
 * Reads `meta._elementor_data` JSON and extracts:
 *   - top-level `body` from the Overview tab (modern) / Overview heading +
 *     following text-editor (older) / single-tab accordion content for
 *     `*-private-car-and-guide` slugs.
 *     ⚠ NOTE: the `body` field is NOT declared on the tour schema as of
 *     Phase 2a-i. Output here is forward-looking; surfaced for follow-up.
 *   - `days[]` from the itinerary accordion (empty for private-car-and-guide)
 *   - `priceIndication` from Dates & Prices tab (modern) / "Tour Pricing
 *     Options" html widget (private-car-and-guide) / empty (other older)
 *   - `gallery` placeholder entries from image-carousel + image widgets
 *     (older only). Stored as `{ _type: 'localizedImage', sourceUrl, alt }`
 *     stubs — real Sanity asset upload happens in a follow-up phase.
 *
 * Type discriminator: `package` if slug matches `package|vacation|itinerary|
 * cruise-vacation` OR `\d+-day` where N > 7; `dayTour` otherwise. `tourMode`
 * defaults: `private` for `*-private-car-and-guide` slugs, `group` for other
 * dayTours, unset for packages.
 *
 * Strip rules (LQ5–LQ7) are encoded structurally rather than as explicit
 * filters: the extractors only pull `text-editor`, `accordion`, `image`, and
 * `image-carousel` widgets. `html` widgets (Bokun, Forminator, generic) are
 * never collected. The single deliberate exception is the "Tour Pricing
 * Options" html widget in `extractPrivateCarAndGuide`, which is pulled by
 * content match BEFORE the structural strip applies.
 */

import type { SanityClient } from '@sanity/client';

import { TOKEN_TO_CITY_SLUG } from '../../wp-classifier.js';
import type { WpClient } from '../wp-client.js';
import {
  buildHeroImage,
  buildMigrationMeta,
  buildRedirects,
  decodeTitle,
  i18nSlug,
  i18nString,
  plainText,
} from './_shared.js';
import { htmlToPortableText, type PtBlock } from '../../wp-import-html.js';
import type { LocaleGroup, Locale, MapperResult, SanityDoc, WpEntityFull } from '../types.js';
import { LOCALES } from '../types.js';

// -- Elementor source shapes (narrow ad-hoc types; the upstream blob is loose) -

interface ElementorBlock {
  id?: string;
  elType?: string;
  widgetType?: string;
  settings?: Record<string, any>;
  elements?: ElementorBlock[];
}

interface AccordionTab {
  tab_title?: string;
  tab_content?: string;
  _id?: string;
  tab_id?: string;
}

// -- Per-locale extraction intermediate shape -----------------------------------

interface PerLocaleContent {
  body?: string;
  days: Array<{ num: number; title: string; content: string }>;
  priceText?: string;
  gallery: Array<{ id?: number; url: string; alt?: string }>;
}

interface ExtractedContent {
  body: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }>;
  days: TourDayDoc[];
  priceIndication: Array<{ _key: Locale; value: string }>;
  gallery: Array<{ _type: 'localizedImage'; _key: string; sourceUrl: string; alt?: string }>;
}

interface TourDayDoc {
  _type: 'tourDay';
  _key: string;
  dayNumber: number;
  title?: Array<{ _key: Locale; value: string }>;
  cities?: Array<{ _type: 'reference'; _ref: string; _key: string }>;
  morning?: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }>;
}

// -- Mapper options & entry -----------------------------------------------------

interface TourMapperOpts {
  dryRun?: boolean;
  priorityScore?: number;
  /** Pre-fetched city slug → _id map. If omitted, the mapper fetches once per call. */
  cityRefsBySlug?: Map<string, string>;
}

export async function mapTour(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: TourMapperOpts = {}
): Promise<MapperResult> {
  const en = group.en;
  const slug = en.slug.toLowerCase();

  // Type discriminator. Operator-curated WP-ID override consulted first
  // (operator clarification: type = duration. The slug-pattern heuristic
  // below has a known ~22% miss rate on multi-day docs without explicit
  // package keywords or N-days prefix > 7 — see SLUG_TYPE_OVERRIDES_BY_WP_ID).
  const overriddenType = SLUG_TYPE_OVERRIDES_BY_WP_ID[en.id];
  const isPackage = overriddenType
    ? overriddenType === 'package'
    : /-package(-|$)|-vacation(-|$)|-itinerary(-|$)|cruise-vacation/.test(slug) ||
      daysFromSlug(slug) > 7;
  const tourType: 'dayTour' | 'package' = isPackage ? 'package' : 'dayTour';

  const isPrivateCarAndGuide = /-private-car-and-guide$/.test(slug);
  const tourMode: 'private' | 'group' | undefined =
    tourType === 'package' ? undefined : isPrivateCarAndGuide ? 'private' : 'group';

  // City refs (full-slug token-boundary scan; Cairo last resort).
  const cityRefsBySlug = opts.cityRefsBySlug ?? (await fetchCityRefsBySlug(client));
  const { cities, resolution: cityResolution } = resolveTopLevelCities(slug, cityRefsBySlug);

  // Reverse map id → slug for matrix-violation detection below.
  const cityIdToSlug = new Map<string, string>();
  for (const [s, id] of cityRefsBySlug.entries()) cityIdToSlug.set(id, s);

  // Per-locale Elementor extraction.
  const extracted = extractContent(group, isPrivateCarAndGuide);

  // Hero image (preserved).
  const hero = await buildHeroImage(client, wp, group, opts);

  // Theme — required for packages. Day tours get the heuristic too so the audit
  // report has uniform coverage, but the schema only enforces required-ness on
  // packages (see src/sanity/schemas/tour.ts).
  const titleEn = decodeTitle(en.title?.rendered) ?? '';
  const themeMatch = inferTheme(slug, titleEn);
  const themeRef = { _type: 'reference' as const, _ref: themeMatch.themeId };

  // durationDays — multi-source resolver (sub-step 3.5+ tweak).
  // Required field on packages; mapTour now always emits a value with
  // explicit source provenance so Step 5 audit can flag placeholders.
  const duration = resolveDurationDays(slug, titleEn, tourType);

  // Matrix violation — flag group dayTours assigned to non-allowed cities.
  const matrixViolation = detectMatrixViolation(tourType, tourMode, cities, cityIdToSlug);

  // EN slug override (operator-curated clean form, e.g. URL-encoded-char fixups).
  const slugArray = i18nSlug(group);
  const enOverride = EN_SLUG_OVERRIDES_BY_WP_ID[en.id];
  if (enOverride) {
    const enEntry = slugArray.find((s) => s._key === 'en');
    if (enEntry) enEntry.value = { _type: 'slug', current: enOverride };
  }

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'tour',
    type: tourType,
    ...(tourMode ? { tourMode } : {}),
    title: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: slugArray,
    summary: buildSummaryFromExtractedBody(extracted.body),
    // `body` is forward-looking — not currently declared on tour schema (see header note).
    ...(extracted.body.length > 0 ? { body: extracted.body } : {}),
    ...(extracted.days.length > 0 ? { days: extracted.days } : {}),
    ...(extracted.priceIndication.length > 0 ? { priceIndication: extracted.priceIndication } : {}),
    // gallery emission disabled — Phase 2b.e or later will wire asset upload via ensureAssetUploaded
    cities,
    durationDays: duration.value,
    // Always attach theme (required for packages, useful provenance for day tours).
    theme: themeRef,
    ...(hero ? { heroImage: hero } : {}),
    migration: buildMigrationMeta(group, undefined, {
      cityResolution,
      themeMatchedPattern: themeMatch.matchedPattern,
      durationDaysSource: duration.source,
      ...(matrixViolation ? { matrixViolation } : {}),
    }),
  };

  const redirects = buildRedirects(
    group,
    (locale, slugIn) => {
      // For EN: prefer the operator-curated override slug if present, so the
      // redirect destination matches the doc's actual slug (gap #2 fix).
      // For ES/JA: no override mechanism exists — decode the raw WP slug.
      const finalSlug = locale === 'en' && enOverride
        ? enOverride
        : decodeURIComponent(slugIn);
      const base = tourType === 'package' ? 'packages' : 'tours';
      return locale === 'en' ? `/${base}/${finalSlug}` : `/${locale}/${base}/${finalSlug}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}

function daysFromSlug(slug: string): number {
  const m = /^(\d+)-?days?-/.exec(slug) ?? /(\d+)-day-/.exec(slug);
  return m ? Number(m[1]) : 0;
}

/**
 * Multi-source resolver for `durationDays`. Required because some packages
 * (notably the egypt-tours B3 canonical and other slug-keyword-classified
 * packages) have no N-days prefix in the slug, leaving the field unset and
 * tripping schema-required validation.
 *
 * Resolution priority:
 *   1. slug-leading pattern (^N-days?-)
 *   2. slug-anywhere pattern (-N-days?-)
 *   3. title pattern (N-Day / N Day / N-Night / N Night)
 *   4. type=dayTour default → 1
 *   5. type=package fallback → 7 (placeholder, recorded as
 *      `durationDaysSource: 'package-placeholder'` in migration meta;
 *      Step 5 audit surfaces these for operator Studio review)
 *
 * The source string is recorded in `migration.durationDaysSource` so the
 * audit pipeline can distinguish parsed-from-source values from heuristic
 * fallbacks. Always returns a value > 0.
 */
export type DurationSource =
  | 'slug-leading'
  | 'slug-anywhere'
  | 'title'
  | 'daytour-default'
  | 'package-placeholder';

export interface DurationResolution { value: number; source: DurationSource }

export function resolveDurationDays(
  slug: string,
  title: string,
  type: 'dayTour' | 'package'
): DurationResolution {
  const slugLeading = /^(\d+)-?days?-/.exec(slug);
  if (slugLeading) return { value: Number(slugLeading[1]), source: 'slug-leading' };
  const slugAny = /-(\d+)-?days?-/.exec(slug);
  if (slugAny) return { value: Number(slugAny[1]), source: 'slug-anywhere' };
  const titleMatch = /(\d+)[\s-](?:day|night)s?\b/i.exec(title);
  if (titleMatch) return { value: Number(titleMatch[1]), source: 'title' };
  if (type === 'dayTour') return { value: 1, source: 'daytour-default' };
  return { value: 7, source: 'package-placeholder' };
}

/**
 * Tour-slug → city-slug overrides for cases where slug-prefix matching gives the
 * wrong city (typically water-based or named-attraction tours whose slug doesn't
 * mention the geographic city). Consulted before slug-prefix scan; Cairo
 * last-resort still applies if neither this map nor prefix match yields a city.
 */
const SLUG_CITY_OVERRIDES: Record<string, string> = {
  'snorkeling-adventure-on-the-nefertari-submarine': 'marsa-alam',
};

/**
 * WP ID → clean EN slug override. Applied after i18nSlug builds the localized
 * slug array. The WP URL → Sanity path redirect still flows through buildRedirects
 * using the original WP slug, so legacy URLs continue to redirect to the new
 * clean Sanity path.
 */
export const EN_SLUG_OVERRIDES_BY_WP_ID: Record<number, string> = {
  // wp-page-238471 — original WP slug contains URL-encoded middle-dot interpuncts
  // (`9-days-cairo-%c2%b7-st-catherine-%c2%b7-sharm-el-sheikh`). Operator decision
  // at session 15 sub-step C: rename to a clean hyphenated form.
  238471: '9-days-cairo-st-catherine-sharm-el-sheikh',
  // B3 country-variant cluster canonicals (10 entries). consolidateCountryVariants
  // designates the suffix-stripped form as canonical; without these overrides the
  // canonical doc would import with its WP source slug (e.g. `egypt-tours-from-the-uk`)
  // instead of the consolidated form (e.g. `egypt-tours`), defeating B3.
  // Source: scripts/session-15-prepare-batch-2.ts canonical output.
  160477: '11-day-luxor-to-cairo-egypt-nile-cruise-vacation',
  160139: '9-day-prestigious-egypt-vacation',
  160129: 'bahariya-and-siwa-oasis-vacation',
  160116: '10-day-romantic-egypt-travel-deals',
  160107: '8-day-customized-aswan-travel-deal',
  160096: '18-day-grand-egypt-holiday-package',
  160072: '8-day-egypt-holiday-package',
  160059: '4-day-cairo-travel-package',
  160357: 'luxor-to-cairo-egypt-nile-cruise-vacation',
  158052: 'egypt-tours',
  // Sub-step 4c.1 — added when B3 regex extended for `-for-families` qualifier.
  // Cluster of 6 country-targeted family packages collapses to this canonical.
  160044: '14-day-egypt-tour-package-for-families',
};

/**
 * WP ID → operator-curated type discriminator. Consulted in mapTour BEFORE the
 * slug-pattern heuristic. Use when the slug-pattern would misclassify a doc
 * whose actual product is multi-day (or vice versa) — operator's authoritative
 * rule: package = multi-day, dayTour = 1-day.
 *
 * Session 15 entries (11) — all multi-day egypt-tours archive variants that the
 * slug pattern misses. They were previously held in EXCLUDED_TOUR_WP_IDS as
 * "listing pages" but operator review reclassified them as legitimate
 * SEO-targeted package pages (8 country variants of egypt-tours, 3 N-day
 * variants). They consolidate via consolidateCountryVariants (B3) where
 * applicable.
 */
export const SLUG_TYPE_OVERRIDES_BY_WP_ID: Record<number, 'dayTour' | 'package'> = {
  // 8 country-targeted variants of egypt-tours
  161314: 'package', // egypt-tours-from-germany
  160983: 'package', // egypt-tours-from-spain
  160833: 'package', // egypt-tours-from-usa
  160669: 'package', // egypt-tours-from-turkey
  160423: 'package', // egypt-tours-from-canada
  160172: 'package', // egypt-tours-from-australia
  160026: 'package', // egypt-tours-from-india
  158052: 'package', // egypt-tours-from-the-uk
  // 3 N-days variants of egypt-tours
  159772: 'package', // 5-days-egypt-tours
  159756: 'package', // 2-days-egypt-tours
  159124: 'package', // 7-days-egypt-tours
};

/**
 * Orchestrator-level exclusion set. WP IDs in this set never reach mapTour.
 * Plumbed via the importer's shouldSkip() — see scripts/wp-import.ts.
 *
 * Composition (session 15, post sub-step 3.5):
 *   - 1 archive page (small-group-travel-packages — true listicle, not a product)
 *   - 3 listing-style placeholders surfaced at sub-step 2.5d: enchanting-expeditions,
 *     cultural-immersions, exclusive-deals
 *   - 11 docs reclassified to package at sub-step 2g.1 (already imported as packages,
 *     must not be re-imported by Batch 2)
 *   - 4 docs deleted at sub-step 3.5a (don't belong under `tour` entity at all):
 *     2 cruise-vessel pages → hotelAndCruise; 2 'Planning Your Trip' info pages
 *     → article/guide. Defense-in-depth against accidental re-import.
 *
 * The 11 egypt-tours archive variants formerly in this set moved to
 * SLUG_TYPE_OVERRIDES_BY_WP_ID after operator clarified they are legitimate
 * SEO-targeted packages, not listicles.
 *
 * Total: 19 entries.
 */
export const EXCLUDED_TOUR_WP_IDS: ReadonlySet<number> = new Set<number>([
  // True archive page (1)
  149374, // small-group-travel-packages
  // 2.5d listing-style placeholders (3)
  103567, 99402, 94331,
  // 2g.1 reclassified — already in Sanity as packages (11)
  102370, 87832, 113061, 238546, 86851, 238562,
  89510, 89895, 89015, 89619, 86875,
  // 3.5a deleted — don't belong under `tour` (4)
  64129, // the-nile-goddess-cruise → hotelAndCruise
  64216, // kasr-ibrim-cruise-ship → hotelAndCruise
  59425, // planning-your-trip-to-dahab → article/guide
  60348, // planning-your-trip-to-port-said → article/guide
]);

// -- Theme heuristic ------------------------------------------------------------

/**
 * Slug-keyword based theme inference for packages. Match order is most-specific
 * first; first match wins. Falls back to `theme-egypt-in-depth`.
 *
 * Returns the matched pattern alongside the chosen theme so the migration meta
 * can record provenance for the Step 5 audit report (operator review of
 * heuristic-assigned themes).
 */
export interface ThemeMatch { themeId: string; matchedPattern: string }

const THEME_RULES: Array<{ re: RegExp; themeId: string; label: string }> = [
  { re: /family/i, themeId: 'theme-family-egypt', label: 'family' },
  { re: /dahabiya/i, themeId: 'theme-dahabiya-nile-cruise', label: 'dahabiya' },
  { re: /holy-family|pilgrimage|biblical/i, themeId: 'theme-special-interest', label: 'holy-family|pilgrimage|biblical' },
  // nile-cruise / felucca after dahabiya so dahabiya wins.
  { re: /nile-cruise|felucca/i, themeId: 'theme-nile-cruise', label: 'nile-cruise|felucca' },
  { re: /luxury|deluxe|prestigious|legacy/i, themeId: 'theme-luxury', label: 'luxury|deluxe|prestigious|legacy' },
  { re: /red-sea|snorkel|hurghada-and-|sharm-and-/i, themeId: 'theme-egypt-red-sea', label: 'red-sea|snorkel|hurghada-and-|sharm-and-' },
  { re: /adventure|desert|safari/i, themeId: 'theme-adventure', label: 'adventure|desert|safari' },
  { re: /on-the-go|short-|quick-/i, themeId: 'theme-egypt-on-the-go', label: 'on-the-go|short-|quick-' },
  { re: /-from-(germany|spain|usa|the-uk|canada|australia|india|turkey|united-kingdom)/i, themeId: 'theme-hassle-free', label: 'from-{country}' },
  { re: /essential|grand-tour|in-depth/i, themeId: 'theme-egypt-in-depth', label: 'essential|grand-tour|in-depth' },
];

export function inferTheme(slug: string, title: string): ThemeMatch {
  const haystack = `${slug} ${title}`.toLowerCase();
  for (const rule of THEME_RULES) {
    if (rule.re.test(haystack)) {
      return { themeId: rule.themeId, matchedPattern: rule.label };
    }
  }
  return { themeId: 'theme-egypt-in-depth', matchedPattern: 'fallback' };
}

// -- Matrix violation detection -------------------------------------------------

/** Cities approved for group day-tour departures (operator decision, session 14). */
export const ALLOWED_GROUP_DAYTOUR_CITIES: ReadonlySet<string> = new Set<string>([
  'aswan', 'cairo', 'hurghada', 'luxor', 'marsa-alam', 'sharm-el-sheikh',
]);

export interface MatrixViolation { reason: string; cities: string[] }

/**
 * Flag group dayTours whose resolved cities include any outside the allowed set.
 * Returns null when the doc is compliant. Packages and private dayTours never
 * violate (matrix only applies to group day-tour departures).
 */
export function detectMatrixViolation(
  type: 'dayTour' | 'package',
  tourMode: 'private' | 'group' | undefined,
  cityRefIds: Array<{ _ref: string }>,
  cityIdToSlug: Map<string, string>
): MatrixViolation | null {
  if (type !== 'dayTour' || tourMode !== 'group') return null;
  const offending: string[] = [];
  for (const c of cityRefIds) {
    const slug = cityIdToSlug.get(c._ref);
    if (slug && !ALLOWED_GROUP_DAYTOUR_CITIES.has(slug)) offending.push(slug);
  }
  if (offending.length === 0) return null;
  return { reason: 'group-day-tour-in-non-allowed-city', cities: offending };
}

// -- Country-variant consolidation (B3) -----------------------------------------

/**
 * Candidate shape from migration/sessions/session-15-audit/candidates.json
 * (and any external caller that constructs equivalent structures).
 */
export interface ConsolidationCandidate {
  wpId: number;
  slug: string;
  title?: string;
}

export interface ConsolidationResult {
  canonical: ConsolidationCandidate[];
  redirects: Array<{ fromSlug: string; toSlug: string; fromWpId: number; toWpId: number }>;
  clusters: Array<{
    baseSlug: string;
    canonical: { wpId: number; slug: string };
    droppedVariants: Array<{ wpId: number; slug: string; sourceCountry: string }>;
  }>;
}

// Trailing qualifier suffixes that may follow the country segment. These are
// preserved in the canonical slug (so e.g. `…-from-germany-for-families` →
// canonical `…-for-families`, not just `…`). Append-only — add new known
// qualifiers as the corpus surfaces them.
const COUNTRY_QUALIFIERS = ['for-families'] as const;
const COUNTRY_SUFFIX_RE = new RegExp(
  `-from-(germany|spain|usa|the-uk|canada|australia|india|turkey|united-kingdom)(-(?:${COUNTRY_QUALIFIERS.join('|')}))?$`,
  'i',
);

/**
 * Group candidates by base slug (slug minus `-from-{country}` and any trailing
 * known qualifier). Within each cluster of ≥2 variants, pick canonical =
 * lowest WP ID (oldest); other variants are dropped and a redirect is emitted
 * from the variant slug to the canonical slug.
 *
 * If a base slug appears in the candidate list WITHOUT a country suffix, that
 * suffix-less doc wins canonical regardless of WP-ID age, and its slug is used
 * verbatim as the canonical slug.
 *
 * For clusters where members carry a qualifier (e.g. `-for-families`), the
 * canonical slug is `{base}-{qualifier}` so the qualifier is preserved on the
 * surviving URL. Members within a cluster are assumed to share a qualifier
 * (the grouping key strips both country AND qualifier, so qualifier mismatch
 * within a "cluster" would be a corpus anomaly worth surfacing).
 *
 * Candidates with no country suffix and no cluster pass through unchanged.
 */
export function consolidateCountryVariants(candidates: ConsolidationCandidate[]): ConsolidationResult {
  // Per-candidate parse: extract country + qualifier + group key.
  type Parsed = { c: ConsolidationCandidate; country?: string; qualifier?: string; groupKey: string };
  const parsed: Parsed[] = candidates.map((c) => {
    const m = COUNTRY_SUFFIX_RE.exec(c.slug);
    if (!m) return { c, groupKey: c.slug };
    const country = m[1];
    // m[2] is the captured trailing-qualifier group including its leading '-'
    // (e.g. '-for-families'); m[3] (inner non-capturing) we don't need.
    const qualifier = m[2] ? m[2].slice(1) : undefined;
    const groupKey = c.slug.slice(0, c.slug.length - m[0].length);
    return { c, country, qualifier, groupKey };
  });

  const clusters = new Map<string, Parsed[]>();
  for (const p of parsed) {
    if (!clusters.has(p.groupKey)) clusters.set(p.groupKey, []);
    clusters.get(p.groupKey)!.push(p);
  }

  const canonical: ConsolidationCandidate[] = [];
  const redirects: ConsolidationResult['redirects'] = [];
  const log: ConsolidationResult['clusters'] = [];

  for (const [groupKey, members] of clusters.entries()) {
    if (members.length === 1) {
      canonical.push(members[0].c);
      continue;
    }
    // Resolve the canonical slug: a member whose own slug equals the groupKey
    // (suffix-less and qualifier-less) wins verbatim; otherwise compose
    // `{groupKey}-{qualifier}` from the first member that carries a qualifier,
    // falling back to plain groupKey if none do (the original B3 behavior).
    const naked = members.find((m) => m.c.slug === groupKey);
    const qualifier = members.find((m) => m.qualifier)?.qualifier;
    const canonicalSlug = naked ? naked.c.slug : qualifier ? `${groupKey}-${qualifier}` : groupKey;
    const canonicalCandidate =
      naked?.c ?? [...members].sort((a, b) => a.c.wpId - b.c.wpId)[0].c;
    canonical.push({ ...canonicalCandidate, slug: canonicalSlug });
    const dropped = members
      .filter((m) => m.c.wpId !== canonicalCandidate.wpId)
      .map((m) => {
        redirects.push({ fromSlug: m.c.slug, toSlug: canonicalSlug, fromWpId: m.c.wpId, toWpId: canonicalCandidate.wpId });
        return { wpId: m.c.wpId, slug: m.c.slug, sourceCountry: m.country ?? 'unknown' };
      });
    log.push({
      baseSlug: groupKey,
      canonical: { wpId: canonicalCandidate.wpId, slug: canonicalSlug },
      droppedVariants: dropped,
    });
  }
  return { canonical, redirects, clusters: log };
}

// -- City resolution ------------------------------------------------------------

export async function fetchCityRefsBySlug(client: SanityClient): Promise<Map<string, string>> {
  const cities: Array<{
    _id: string;
    slug?: Array<{ _key: string; value?: { current?: string } }>;
  }> = await client.fetch(`*[_type=="city" && defined(slug)]{ _id, slug }`);
  const map = new Map<string, string>();
  for (const c of cities) {
    const enSlug = c.slug?.find((s) => s._key === 'en')?.value?.current;
    if (enSlug) map.set(enSlug.toLowerCase(), c._id);
  }
  return map;
}

export type CityResolution = 'override' | 'full-slug-scan' | 'default-cairo';

/**
 * Full-slug token-boundary scan against the 41-city Sanity inventory.
 *
 * For each city slug (longest-first), find token-aligned occurrences in the
 * tour slug, consuming matched character positions so an `abu-simbel` match
 * isn't double-counted as a separate `abu` or `simbel` if those were also
 * in inventory. Multiple distinct cities can match — returned in match order.
 *
 * `SLUG_CITY_OVERRIDES` wins absolutely. Falls back to Cairo if nothing matches.
 */
export function resolveTopLevelCities(
  slug: string,
  cityRefsBySlug: Map<string, string>
): { cities: Array<{ _type: 'reference'; _ref: string; _key: string }>; resolution: CityResolution } {
  // Explicit override first.
  const overrideCitySlug = SLUG_CITY_OVERRIDES[slug];
  if (overrideCitySlug) {
    const id = cityRefsBySlug.get(overrideCitySlug);
    if (id) {
      return {
        cities: [{ _type: 'reference', _ref: id, _key: id }],
        resolution: 'override',
      };
    }
    // Override pointed to a slug not in inventory — fall through to scan.
  }

  // Sort longest-first so multi-word cities (abu-simbel, marsa-alam, siwa-oasis)
  // are matched before any bare token that overlaps.
  const sortedCitySlugs = [...cityRefsBySlug.keys()].sort((a, b) => b.length - a.length);

  // Character-position mask. A position consumed by a longer match is unavailable
  // for any subsequent (shorter) match.
  const consumed = new Array<boolean>(slug.length).fill(false);
  const matched: Array<{ slug: string; id: string; at: number }> = [];

  for (const citySlug of sortedCitySlugs) {
    const escaped = citySlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|-)(${escaped})(?:-|$)`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(slug)) !== null) {
      const tokenStart = m.index + (m[0].startsWith('-') ? 1 : 0);
      const tokenEnd = tokenStart + m[1].length;
      let overlap = false;
      for (let i = tokenStart; i < tokenEnd; i++) {
        if (consumed[i]) { overlap = true; break; }
      }
      if (overlap) continue;
      for (let i = tokenStart; i < tokenEnd; i++) consumed[i] = true;
      const id = cityRefsBySlug.get(citySlug)!;
      matched.push({ slug: citySlug, id, at: tokenStart });
      break; // one match per city slug
    }
  }

  // Alias pass — handles operator-domain Egyptian-geography variants where
  // slugs use bare tokens (siwa, fayoum, dakhla, …) but Sanity inventory uses
  // multi-word canonical forms (siwa-oasis, al-fayoum, …). Source of truth is
  // TOKEN_TO_CITY_SLUG in the classifier; we import it to stay in sync.
  for (const [aliasToken, canonicalSlug] of Object.entries(TOKEN_TO_CITY_SLUG)) {
    if (matched.some((m) => m.slug === canonicalSlug)) continue;
    const canonicalId = cityRefsBySlug.get(canonicalSlug);
    if (!canonicalId) continue;
    const escaped = aliasToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|-)(${escaped})(?:-|$)`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(slug)) !== null) {
      const tokenStart = m.index + (m[0].startsWith('-') ? 1 : 0);
      const tokenEnd = tokenStart + m[1].length;
      let overlap = false;
      for (let i = tokenStart; i < tokenEnd; i++) {
        if (consumed[i]) { overlap = true; break; }
      }
      if (overlap) continue;
      for (let i = tokenStart; i < tokenEnd; i++) consumed[i] = true;
      matched.push({ slug: canonicalSlug, id: canonicalId, at: tokenStart });
      break;
    }
  }

  if (matched.length === 0) {
    const cairoId = cityRefsBySlug.get('cairo');
    if (cairoId) {
      return {
        cities: [{ _type: 'reference', _ref: cairoId, _key: cairoId }],
        resolution: 'default-cairo',
      };
    }
    return { cities: [], resolution: 'default-cairo' };
  }

  // Return cities in left-to-right slug order for deterministic, readable output.
  matched.sort((a, b) => a.at - b.at);
  return {
    cities: matched.map((m) => ({ _type: 'reference' as const, _ref: m.id, _key: m.id })),
    resolution: 'full-slug-scan',
  };
}

// -- Locale entry accessor (LocaleGroup uses discrete keys, not index) ----------

function localeEntry(group: LocaleGroup, locale: Locale): WpEntityFull | undefined {
  if (locale === 'en') return group.en;
  if (locale === 'es') return group.es;
  return group.ja;
}

// -- Top-level extraction orchestrator ------------------------------------------

function extractContent(group: LocaleGroup, isPrivateCarAndGuide: boolean): ExtractedContent {
  const perLocale: Record<Locale, PerLocaleContent> = {
    en: { days: [], gallery: [] },
    es: { days: [], gallery: [] },
    ja: { days: [], gallery: [] },
  };

  for (const locale of LOCALES) {
    const entry = localeEntry(group, locale);
    if (!entry) continue;
    const raw = entry.meta?.['_elementor_data'];
    if (typeof raw !== 'string' || raw.length === 0) continue;
    let parsed: ElementorBlock[];
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) continue;

    if (isPrivateCarAndGuide) {
      perLocale[locale] = extractPrivateCarAndGuide(parsed);
    } else if (detectLayout(parsed) === 'modern') {
      perLocale[locale] = extractModern(parsed);
    } else {
      perLocale[locale] = extractOlder(parsed);
    }
  }

  const result: ExtractedContent = { body: [], days: [], priceIndication: [], gallery: [] };

  // body (i18n PT)
  for (const locale of LOCALES) {
    const lc = perLocale[locale];
    if (lc.body) {
      const blocks = htmlToPortableText(lc.body, { locale }).blocks;
      if (blocks.length > 0) result.body.push({ _key: locale, _type: 'object', value: blocks });
    }
  }

  // priceIndication (i18n string)
  for (const locale of LOCALES) {
    const lc = perLocale[locale];
    if (lc.priceText) result.priceIndication.push({ _key: locale, value: lc.priceText });
  }

  // days[] — aligned by EN index; ES/JA filled where same index exists.
  const enDays = perLocale.en.days;
  for (let i = 0; i < enDays.length; i++) {
    const enDay = enDays[i];
    const titles: Array<{ _key: Locale; value: string }> = [];
    const mornings: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }> = [];
    for (const locale of LOCALES) {
      const localeDay = perLocale[locale].days[i];
      if (!localeDay) continue;
      if (localeDay.title) titles.push({ _key: locale, value: localeDay.title });
      if (localeDay.content) {
        const blocks = htmlToPortableText(localeDay.content, { locale }).blocks;
        if (blocks.length > 0) mornings.push({ _key: locale, _type: 'object', value: blocks });
      }
    }
    const day: TourDayDoc = {
      _type: 'tourDay',
      _key: `day-${enDay.num}`,
      dayNumber: enDay.num,
    };
    if (titles.length > 0) day.title = titles;
    if (mornings.length > 0) day.morning = mornings;
    result.days.push(day);
  }

  // gallery: EN-only. WP image data is locale-invariant; per-locale alt could
  // be revisited if/when ES/JA gallery captions diverge.
  result.gallery = perLocale.en.gallery.map((g, i) => ({
    _type: 'localizedImage' as const,
    _key: `gallery-${g.id ?? i}`,
    sourceUrl: g.url,
    ...(g.alt ? { alt: g.alt } : {}),
  }));

  return result;
}

// -- Layout detection -----------------------------------------------------------

function detectLayout(blocks: ElementorBlock[]): 'modern' | 'older' {
  function hasNestedTabs(arr: ElementorBlock[]): boolean {
    for (const el of arr) {
      if (el.widgetType === 'nested-tabs') return true;
      if (el.elements && hasNestedTabs(el.elements)) return true;
    }
    return false;
  }
  return hasNestedTabs(blocks) ? 'modern' : 'older';
}

// -- Tree walkers ---------------------------------------------------------------

function findFirst(
  arr: ElementorBlock[],
  predicate: (el: ElementorBlock) => boolean
): ElementorBlock | null {
  for (const el of arr) {
    if (predicate(el)) return el;
    if (el.elements) {
      const inner = findFirst(el.elements, predicate);
      if (inner) return inner;
    }
  }
  return null;
}

function findAll(
  arr: ElementorBlock[],
  predicate: (el: ElementorBlock) => boolean
): ElementorBlock[] {
  const out: ElementorBlock[] = [];
  function rec(items: ElementorBlock[]) {
    for (const el of items) {
      if (predicate(el)) out.push(el);
      if (el.elements) rec(el.elements);
    }
  }
  rec(arr);
  return out;
}

function collectTextEditorHtml(blocks: ElementorBlock[]): string {
  const editors = findAll(blocks, (el) => el.widgetType === 'text-editor');
  return editors.map((e) => String(e.settings?.editor ?? '')).join('\n\n');
}

// -- Accordion helpers ----------------------------------------------------------

function extractAccordionDays(
  accordion: ElementorBlock | null
): Array<{ num: number; title: string; content: string }> {
  if (!accordion) return [];
  const tabs: AccordionTab[] = (accordion.settings?.tabs ?? []) as AccordionTab[];
  const out: Array<{ num: number; title: string; content: string }> = [];
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const parsed = parseTabTitle(tab.tab_title ?? '', i);
    if (!parsed) continue;
    out.push({ num: parsed.num, title: parsed.title, content: tab.tab_content ?? '' });
  }
  return out;
}

function parseTabTitle(html: string, fallbackIndex?: number): { num: number; title: string } | null {
  // Canonical: <span class="bold">…Day N </span> <Day Title>
  const primary = /<span[^>]*class="[^"]*\bbold\b[^"]*"[^>]*>[\s\S]*?Day\s+(\d+)\s*<\/span>\s*(.*)/is.exec(html);
  if (primary) {
    return { num: Number(primary[1]), title: cleanDayTitle(primary[2]) };
  }
  // Secondary: any "Day N" with a trailing title.
  const fallback = /Day\s+(\d+)\b[^<]*(?:<\/[^>]+>)?\s*([\s\S]*)/is.exec(html);
  if (fallback) {
    return { num: Number(fallback[1]), title: cleanDayTitle(fallback[2]) };
  }
  // Tertiary: malformed source — use positional index, extract whatever plaintext survives.
  if (fallbackIndex !== undefined) {
    const plain = cleanDayTitle(html);
    if (plain) {
      return { num: fallbackIndex + 1, title: plain };
    }
  }
  return null;
}

/** Strip inline HTML then leading punctuation/whitespace that sat outside the bold span. */
function cleanDayTitle(rawHtml: string): string {
  return stripInlineTagsToPlain(rawHtml).trim().replace(/^[\s:;\-–—]+/, '').trim();
}

/**
 * Build per-locale summary from the first substantive PT block of body. Replaces
 * the prior WP-excerpt-based summary which leaked Elementor nav labels ("Overview
 * Itinerary Dates & Prices …", "Gallery Video Customizable Itinerary …") because
 * those labels live in the rendered page HTML that excerpt sampled.
 */
function buildSummaryFromExtractedBody(
  bodyByLocale: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }>
): Array<{ _key: Locale; value: string }> {
  const out: Array<{ _key: Locale; value: string }> = [];
  for (const entry of bodyByLocale) {
    const text = summaryFromBody(entry.value);
    if (text) out.push({ _key: entry._key, value: text });
  }
  return out;
}

function summaryFromBody(bodyPt: PtBlock[] | undefined): string | undefined {
  if (!bodyPt?.length) return undefined;
  let text = '';
  for (const block of bodyPt) {
    if ((block as any)._type !== 'block') continue;
    const blockText = ((block as any).children ?? [])
      .filter((c: any) => c._type === 'span')
      .map((c: any) => c.text ?? '')
      .join('')
      .trim();
    if (blockText) {
      text = blockText;
      if (text.length >= 50) break;
    }
  }
  if (!text) return undefined;
  text = text.replace(/^[\s:;\-–—]+/, '').trim();
  if (text.length <= 240) return text;
  const truncated = text.slice(0, 240);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 200 ? truncated.slice(0, lastSpace) : truncated).trim();
}

function stripInlineTagsToPlain(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// -- Per-layout extractors ------------------------------------------------------

function extractModern(blocks: ElementorBlock[]): PerLocaleContent {
  const nestedTabs = findFirst(blocks, (el) => el.widgetType === 'nested-tabs');
  if (!nestedTabs || !nestedTabs.elements) {
    return { days: [], gallery: [] };
  }

  // Convention: nested-tabs content lives in widget.elements[N], indexed
  // positionally by settings.tabs[]. Tabs are: 0=Overview, 1=Itinerary,
  // 2=Dates & Prices, 3=FAQs (FAQs intentionally not consumed).
  const overviewContainer = nestedTabs.elements[0];
  const itineraryContainer = nestedTabs.elements[1];
  const datesContainer = nestedTabs.elements[2];

  const body = overviewContainer
    ? collectTextEditorHtml(overviewContainer.elements ?? []) || undefined
    : undefined;

  const accordion = itineraryContainer
    ? findFirst(itineraryContainer.elements ?? [], (el) => el.widgetType === 'accordion')
    : null;
  const days = extractAccordionDays(accordion);

  // Dates & Prices: only text-editor prose. html widgets (all Bokun here)
  // are skipped structurally.
  // Dates & Prices tab is transactional pricing-schedule content (per-departure
  // dates, EUR amounts, "X Left" availability). Per Phase 2b.d.4 operator review,
  // this is not editorial content and should not migrate. Operator authors
  // priceIndication manually during editorial if desired.
  void datesContainer;
  const priceText: string | undefined = undefined;

  return { body, days, priceText, gallery: [] };
}

function extractOlder(blocks: ElementorBlock[]): PerLocaleContent {
  // Older layout is flat. Body is the first text-editor following an
  // "Overview" heading.
  const flat = findAll(blocks, (el) => !!el.widgetType);
  let body: string | undefined;
  for (let i = 0; i < flat.length; i++) {
    const el = flat[i];
    if (
      el.widgetType === 'heading' &&
      /^overview\s*$/i.test(stripInlineTagsToPlain(String(el.settings?.title ?? '')))
    ) {
      const next = flat[i + 1];
      if (next?.widgetType === 'text-editor') {
        body = String(next.settings?.editor ?? '') || undefined;
        break;
      }
    }
  }

  const accordion = findFirst(blocks, (el) => el.widgetType === 'accordion');
  const days = extractAccordionDays(accordion);

  // Gallery: image-carousel + image widgets.
  const carousels = findAll(blocks, (el) => el.widgetType === 'image-carousel');
  const singleImages = findAll(blocks, (el) => el.widgetType === 'image');
  const gallery: Array<{ id?: number; url: string; alt?: string }> = [];
  for (const c of carousels) {
    const imgs = (c.settings?.carousel ?? []) as Array<{ id?: number; url?: string; alt?: string }>;
    for (const img of imgs) {
      if (img.url) gallery.push({ id: img.id, url: img.url, alt: img.alt });
    }
  }
  for (const s of singleImages) {
    const img = s.settings?.image as { id?: number; url?: string; alt?: string } | undefined;
    if (img?.url) gallery.push({ id: img.id, url: img.url, alt: img.alt });
  }

  return { body, days, priceText: undefined, gallery };
}

function extractPrivateCarAndGuide(blocks: ElementorBlock[]): PerLocaleContent {
  // Single-tab "Suggested Itinerary Ideas" accordion → top-level body, not days[].
  const accordion = findFirst(blocks, (el) => el.widgetType === 'accordion');
  const tabs: AccordionTab[] = (accordion?.settings?.tabs ?? []) as AccordionTab[];
  const body = tabs.length > 0 ? (tabs[0].tab_content ?? undefined) : undefined;

  // Pricing: extract from "Tour Pricing Options" html widget BEFORE strip rules
  // would discard it. This is the only `html` widget the extractors pull.
  const pricingWidget = findFirst(
    blocks,
    (el) =>
      el.widgetType === 'html' &&
      typeof el.settings?.html === 'string' &&
      /Tour Pricing Options|tour-options-module|tour-booking-section|Choose Your (Package|Experience)/i.test(el.settings.html as string)
  );
  // Keep the package descriptions ("Tour Pricing Options Choose Your Package…",
  // "Choose Your Experience Select Package…") but drop the per-pax pricing matrix
  // ("Group Size 1 2 3 … Price (€) …"). The "Group Size" header reliably marks the
  // transactional boundary across all three private-car tours.
  let priceText: string | undefined;
  if (pricingWidget) {
    const fullText = plainText(pricingWidget.settings!.html as string);
    const groupSizeIdx = fullText.search(/\bGroup Size\b/i);
    priceText = (groupSizeIdx > 50 ? fullText.slice(0, groupSizeIdx) : fullText.slice(0, 500)).trim();
  }

  return { body, days: [], priceText, gallery: [] };
}
