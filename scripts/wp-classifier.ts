// Imported lazily as a value so the classifier can route by slug membership
// without duplicating the slug list. Co-locating the canonical map in the
// mapper file keeps the routing source-of-truth in one place.
import { isTravelTipSlug } from './wp-import/mappers/travelTip.js';
import type { ReviewFlag } from './wp-import/types.js';

/**
 * Slug classifier for Travel2Egypt WordPress migration.
 *
 * Used by both scripts/wp-audit.ts (for inventory reporting) and scripts/wp-import.ts
 * (for routing each WP entity to its target Sanity schema). Single source of truth
 * for "what kind of thing is this WP page?"
 *
 * The brief assumed nested URLs (`/cairo/where-to-stay/`); the actual WP install
 * uses flat URLs (`/getting-around-cairo/`). Classification is therefore done
 * from the slug pattern, not the URL path or WP `parent` field.
 *
 * Rules are applied in priority order — first match wins.
 */

export type PageType =
  | 'destination-hub'
  | 'destination-subpage'
  | 'monument'
  | 'tour-or-package'
  | 'hotel'
  | 'nile-cruise'
  | 'article'
  | 'travelTip'
  | 'service-or-utility'
  | 'persona-or-system'
  | 'unclassified'
  | 'test-or-junk';

export type Confidence = 'high' | 'med' | 'low';

/** Section values for `guideArticle` (subset matching the schema's options.list). */
export type GuideArticleSection =
  | 'introducing'
  | 'plan-your-trip'
  | 'while-you-are-there'
  | 'places-to-go'
  | 'others';

export interface Classification {
  type: PageType;
  reason: string;
  confidence: Confidence;
  /** Slug token of the parent destination, when inferable. */
  inferredParentCity?: string;
  /** Section value for destination-subpage. */
  inferredSection?: GuideArticleSection;
  /**
   * Review flag set by the classifier itself (rather than by the orchestrator).
   * Only used today for editorial-defer slugs (session 6.5a Investigation 3) so
   * the dispatch can route them to a no-op exit before any mapper runs.
   */
  reviewFlag?: ReviewFlag;
}

// ---------- Lookup tables ----------------------------------------------

/** Single-token destination identifiers. Order matters for prefix-matching: longer first. */
export const DESTINATIONS = [
  // Long-form / multi-word staging-canonical slugs first so longest-match wins.
  'sharm-el-sheikh', 'rosetta-rasheed', 'al-wadi-al-gadid', 'wadi-el-natrun', 'wadi-al-natron',
  'bahariya-oasis', 'farafra-oasis', 'dakhla-oasis', 'kharga-oasis', 'siwa-oasis',
  'saint-catherine', 'st-catherine',
  'abu-simbel', 'marsa-alam', 'marsa-matruh', 'al-gouna', 'el-gouna',
  'al-arish', 'al-fayoum', 'al-quseir', 'al-minya',
  'el-fayoum', 'el-minya', 'el-quseir', 'el-alamein',
  'beni-suef', 'kom-ombo', 'port-said', 'ras-sudr',
  'cairo', 'luxor', 'aswan', 'alexandria', 'giza',
  'hurghada', 'dahab', 'taba', 'nuweiba', 'sinai', 'suez', 'siwa', 'sharm',
  'bahariya', 'kharga', 'dakhla', 'farafra', 'fayoum', 'fayyoum',
  'edfu', 'esna', 'qena', 'akhmim', 'baris', 'safaga', 'ismailia',
  'abydos', 'dendera', 'sohag', 'asyut', 'mansoura', 'tanta', 'rashid', 'rosetta',
  'minya', 'alamein', 'quseir',
];

/**
 * Maps classifier-recognized tokens to canonical staging city EN slugs where they differ.
 * Reason: the classifier accepts multiple transliteration / short-form variants
 * (siwa, farafra, rosetta, etc.), but the city docs in migration-staging use specific
 * canonical slugs (siwa-oasis, farafra-oasis, rosetta-rasheed, …). This alias keeps
 * the pattern-matching surface broad while making slug resolution explicit.
 *
 * Used by `findDestinationToken`: when a token matches, the alias (if any) replaces
 * it before being returned, so callers (and `inferredParentCity`) always see the
 * staging-canonical slug.
 */
export const TOKEN_TO_CITY_SLUG: Record<string, string> = {
  siwa: 'siwa-oasis',
  farafra: 'farafra-oasis',
  dakhla: 'dakhla-oasis',
  bahariya: 'bahariya-oasis',
  kharga: 'kharga-oasis',
  rosetta: 'rosetta-rasheed',
  rashid: 'rosetta-rasheed',
  fayoum: 'al-fayoum',
  'el-fayoum': 'al-fayoum',
  fayyoum: 'al-fayoum',
  'el-gouna': 'al-gouna',
  'el-minya': 'al-minya',
  minya: 'al-minya',
  'el-quseir': 'al-quseir',
  quseir: 'al-quseir',
  'st-catherine': 'saint-catherine',
  sharm: 'sharm-el-sheikh',
  // 8r-2d-fixup: transliteration variant of wadi-el-natrun surfaced in 8r-2d's first re-emit
  // (the slug `things-to-do-in-wadi-al-natron` uses al-natron rather than el-natrun).
  'wadi-al-natron': 'wadi-el-natrun',
  // Session 7 Phase 1.5b-i: normalization aliases for monument-divider city
  // extraction (`extractMonumentParentCity`). The Elementor sidebar widget
  // text "{CITY} Travel Guide" carries the parent-city signal but with
  // editorial typos / abbreviations that don't match staging slugs.
  'abu-simble': 'abu-simbel',
  'abu-simblel': 'abu-simbel',
  'st.-catherine': 'saint-catherine',
};

/** Districts/neighborhoods that resolve to a parent destination. */
export const DISTRICT_TO_PARENT: Record<string, string> = {
  // Sharm El-Sheikh districts
  'naama-bay': 'sharm-el-sheikh',
  'hadaba': 'sharm-el-sheikh',
  'nabq': 'sharm-el-sheikh',
  'dahar': 'hurghada', // Dahar is the old town district of Hurghada (not Sharm) — see audit notes
  // Cairo neighborhoods (treated as places-to-go for the cairo hub)
  'coptic-cairo': 'cairo',
  'islamic-cairo': 'cairo',
  'old-cairo': 'cairo',
  'khan-el-khalili': 'cairo',
  'zamalek': 'cairo',
  'maadi': 'cairo',
  'heliopolis': 'cairo',
  'giza-plateau': 'giza', // approved Phase B addition
  'garden-city': 'cairo', // approved Phase B addition
};

/**
 * Wadi-* (valley) parent inference by region of Egypt.
 * Approved Phase B decision: Sinai wadis → sinai, Western Desert wadis → fayoum,
 * White Desert wadis → farafra (or bahariya). Each entry logs the inference reason.
 */
export const WADI_TO_PARENT: Record<string, { parent: string; reason: string }> = {
  // Sinai wadis
  'wadi-feiran': { parent: 'sinai', reason: 'Sinai — Wadi Feiran in central Sinai' },
  'wadi-mukattab': { parent: 'sinai', reason: 'Sinai — Wadi Mukattab (Sinai inscriptions valley)' },
  'wadi-nasb': { parent: 'sinai', reason: 'Sinai — Wadi Nasb' },
  'wadi-hammamat': { parent: 'sinai', reason: 'Eastern Desert (treated as sinai-region for guide purposes)' },
  // Western Desert / Fayoum
  'wadi-el-rayan': { parent: 'fayoum', reason: 'Western Desert — Wadi El Rayan in Fayoum protectorate' },
  'wadi-el-hitan': { parent: 'fayoum', reason: 'Western Desert — Wadi El Hitan (Whale Valley) in Fayoum' },
  'wadi-al-hittan': { parent: 'fayoum', reason: 'Variant slug for Wadi El Hitan in Fayoum' },
  // White Desert (Farafra/Bahariya region)
  // 8r-2c: parent updated from 'farafra' to 'wadi-el-natrun' — wadi-el-natrun is its
  // own staging city (renamed from wadi-al-natron in 8r-2c).
  'wadi-el-natrun': { parent: 'wadi-el-natrun', reason: 'Wadi El Natrun is its own staging city (Coptic monasteries)' },
  // Red Sea / Eastern Desert (mapped to nearest coastal hub)
  'wadi-el-gamal-national-park': { parent: 'marsa-alam', reason: 'Wadi El Gemal National Park — gateway is Marsa Alam' },
  'wadi-el-gamal': { parent: 'marsa-alam', reason: 'Wadi El Gemal — gateway is Marsa Alam' },
};

const TOPIC_PREFIX_TO_SECTION: Array<{ prefix: string; section: Classification['inferredSection'] }> = [
  { prefix: 'getting-around-', section: 'while-you-are-there' },
  { prefix: 'how-to-get-to-', section: 'plan-your-trip' },
  { prefix: 'how-to-go-to-', section: 'plan-your-trip' },
  { prefix: 'where-to-stay-in-', section: 'plan-your-trip' },
  { prefix: 'where-to-stay-', section: 'plan-your-trip' },
  { prefix: 'places-to-stay-in-', section: 'plan-your-trip' },
  { prefix: 'stay-in-', section: 'plan-your-trip' },
  { prefix: 'where-to-eat-in-', section: 'while-you-are-there' },
  { prefix: 'things-to-do-in-', section: 'while-you-are-there' },
  { prefix: 'things-to-do-', section: 'while-you-are-there' },
  { prefix: 'when-to-go-', section: 'plan-your-trip' },
  { prefix: 'when-to-visit-', section: 'plan-your-trip' },
  { prefix: 'best-time-to-', section: 'plan-your-trip' },
  { prefix: 'arrival-in-', section: 'plan-your-trip' },
  { prefix: 'ticket-prices-for-attractions-in-', section: 'plan-your-trip' },
  { prefix: 'weather-in-', section: 'plan-your-trip' },
  { prefix: 'weather-', section: 'plan-your-trip' },
  { prefix: 'history-of-', section: 'introducing' },
  { prefix: 'history-', section: 'introducing' },
  { prefix: 'past-and-present-', section: 'introducing' },
  { prefix: 'food-in-', section: 'while-you-are-there' },
  { prefix: 'food-', section: 'while-you-are-there' },
  { prefix: 'events-in-', section: 'others' },
  { prefix: 'events-', section: 'others' },
  { prefix: 'upcoming-events-in-', section: 'others' },
  { prefix: 'tours-in-', section: 'others' },
  { prefix: 'tours-from-', section: 'others' },
  { prefix: 'transport-in-', section: 'while-you-are-there' },
  { prefix: 'transport-', section: 'while-you-are-there' },
  { prefix: 'introduction-to-', section: 'introducing' },
  { prefix: 'overview-of-', section: 'introducing' },
];

const TOPIC_SUFFIX_TO_SECTION: Array<{ suffix: string; section: Classification['inferredSection'] }> = [
  { suffix: '-history', section: 'introducing' },
  { suffix: '-historical-guide', section: 'introducing' },
  { suffix: '-weather', section: 'plan-your-trip' },
  { suffix: '-weather-guide', section: 'plan-your-trip' },
  { suffix: '-weather-insights', section: 'plan-your-trip' },
  { suffix: '-introduction', section: 'introducing' },
  { suffix: '-unearthed', section: 'introducing' },
  { suffix: '-only-here', section: 'others' },
  { suffix: '-where-to-stay', section: 'plan-your-trip' },
  { suffix: '-accommodation-guide', section: 'plan-your-trip' },
  { suffix: '-arrival-guide', section: 'plan-your-trip' },
  { suffix: '-events', section: 'others' },
  { suffix: '-food', section: 'while-you-are-there' },
  { suffix: '-food-guide', section: 'while-you-are-there' },
  { suffix: '-local-cuisine', section: 'while-you-are-there' },
  { suffix: '-dining-experiences', section: 'while-you-are-there' },
  { suffix: '-culinary-feasting', section: 'while-you-are-there' },
  { suffix: '-getting-around', section: 'while-you-are-there' },
  { suffix: '-getting-around-guide', section: 'while-you-are-there' },
  { suffix: '-tours', section: 'others' },
  { suffix: '-transport', section: 'while-you-are-there' },
  { suffix: '-overview', section: 'introducing' },
  { suffix: '-seasonal-guide', section: 'plan-your-trip' },
  { suffix: '-airport-transfer', section: 'plan-your-trip' }, // service rule below catches this first
  // Things-to-do attractions / shows / aquariums
  { suffix: '-aquarium', section: 'while-you-are-there' },
  { suffix: '-submarine', section: 'while-you-are-there' },
  { suffix: '-show', section: 'while-you-are-there' },
];

/**
 * Hotel-brand tokens. If a slug contains one of these (typically followed/preceded
 * by a city name) and is NOT clearly a tour/package, classify as `hotel`.
 */
const HOTEL_BRANDS = [
  'kempinski', 'marriott', 'sofitel', 'hilton', 'sheraton', 'hyatt',
  'movenpick', 'mövenpick', 'four-seasons', 'four-points', 'iberotel',
  'rixos', 'jaz', 'baron', 'pyramisa', 'steigenberger', 'ritz-carlton',
  'st-regis', 'fairmont', 'oberoi', 'mercure', 'novotel', 'pullman',
  'maritim', 'jolie-ville', 'sonesta', 'golden-tulip', 'fanadir',
  'mena-house', 'casa-cook', 'sandrose', 'royal-maxim', 'pavillon',
  'benben-by-dhara', 'longchamp',
];

/**
 * Hotel-shape token suffixes. If the slug contains one and a destination token,
 * route to `hotel` instead of `guideArticle`.
 */
const HOTEL_SUFFIXES = ['-hotel', '-resort', '-lodge', '-villa', '-suites'];

const MONUMENT_PREFIXES = [
  'pyramid-of-', 'pyramids-of-',
  'temple-of-', 'the-temple-of-',
  'tomb-of-', 'the-tomb-of-',
  'great-temple-', 'the-great-',
  'mosque-of-', 'church-of-', 'monastery-of-',
  'citadel-of-', 'museum-of-', 'palace-of-',
  // Cairo / Islamic-Cairo specific patterns
  'bab-', 'sabil-', 'khanqah-', 'mosque-madrassa-', 'madrassa-of-',
  'mausoleum-of-', 'qubbat-', 'mashhad-',
];
const MONUMENT_KEYWORDS = [
  'temple', 'tomb', 'pyramid', 'pyramids', 'mosque', 'church', 'monastery',
  'citadel', 'museum', 'palace', 'fortress', 'sphinx', 'obelisk',
  'colossus', 'colossi', 'necropolis', 'cathedral',
  // Added Phase B
  'synagogue', 'mausoleum', 'bazaar', 'cemetery', 'gate', 'tower', 'towers',
  'island', 'oasis-monument', 'cliff', 'wadi', 'spring', 'springs',
  'shrine', 'crypt', 'fortress', 'bastion',
];

/**
 * Maps a WP slug to one of the 16 `wikiMonument.monumentType` enum values.
 * Co-located with MONUMENT_PREFIXES / MONUMENT_KEYWORDS so prefix/keyword
 * vocabulary stays in sync with the enum-mapping vocabulary.
 *
 * Priority order — first match wins. Defaults to 'other' when no pattern
 * matches (editorial assigns the correct type post-import).
 *
 * Cluster decisions (Phase 0.5b architect review):
 * - mausoleum-of-* / qubbat-* / mashhad-* / sabil-* / khanqah-* → shrine
 *   (public-veneration shrines, operator can promote to 'tomb' in Studio).
 * - synagogue / cemetery / bazaar / gate / tower / island / oasis-monument /
 *   cliff / wadi / spring → 'other' (no schema enum value; no expansion
 *   this session — architectural restraint).
 * - dendera-village → 'other' (no special case; editorial refines).
 */
export function inferMonumentType(slug: string): string {
  const s = slug.toLowerCase();

  // Multi-word prefixes / keywords MUST come before their single-word
  // overlapping forms (e.g. mortuary-temple before temple, rock-cut-tomb
  // before tomb).
  if (/(^|-)pyramids?(-|$)/.test(s)) return 'pyramid';
  if (/(^|-)rock-cut-tomb(-|$)/.test(s)) return 'rock-cut-tomb';
  if (/(^|-)mortuary-temple(-|$)/.test(s)) return 'mortuary-temple';
  if (/(^|-)temples?(-|$)/.test(s)) return 'temple';
  if (/(^|-)tombs?(-|$)/.test(s)) return 'tomb';
  if (/(^|-)necropolis(-|$)/.test(s)) return 'necropolis';
  if (/(^|-)(mosque|madrassa)(-|$)/.test(s)) return 'mosque';
  if (/(^|-)monastery(-|$)/.test(s)) return 'monastery';
  if (/(^|-)(church|cathedral)(-|$)/.test(s)) return 'church';
  if (/(^|-)museum(-|$)/.test(s)) return 'museum';
  if (/(^|-)palace(-|$)/.test(s)) return 'palace';
  if (/(^|-)(citadel|fortress|bastion)(-|$)/.test(s)) return 'fortress';
  if (/(^|-)obelisk(-|$)/.test(s)) return 'obelisk';
  if (/(^|-)(colossus|colossi)(-|$)/.test(s)) return 'colossus';
  if (
    /^(mausoleum-of-|qubbat-|mashhad-|sabil-|khanqah-)/.test(s) ||
    /(^|-)(mausoleum|shrine|crypt)(-|$)/.test(s)
  ) {
    return 'shrine';
  }
  return 'other';
}

/**
 * Extracts parent city from a monument page's Elementor sidebar.
 *
 * Travel2Egypt monument pages embed a divider widget with text
 * "{CITY} Travel Guide" linking to the city's travel guide. Phase 1.5a
 * discovered this is the only reliable WP-source signal for monument→city
 * relationship (143 monuments, 91.6% coverage on the cohort, 100% of
 * legitimate monuments after misroute filtering).
 *
 * Walks Elementor JSON, finds the first divider widget whose text matches
 * `/Travel\s+Guide/i`, normalizes the city token, and verifies it resolves
 * to a known staging city via:
 *   1. Direct match against TOKEN_TO_CITY_SLUG values (already a city slug)
 *   2. Alias lookup via TOKEN_TO_CITY_SLUG keys ("siwa" → "siwa-oasis")
 *   3. Unicode-stripped form against either of the above
 *      (handles diacritics like "al-wādī-al-gadīd" → "al-wadi-al-gadid")
 *
 * Returns null if extraction fails OR if normalization can't resolve the
 * token to a known staging city. Defensive: rather than fabricate a non-
 * city slug (which would orphan the doc), returns null and lets the mapper
 * apply its fallback (classifier inference, then null).
 */
export function extractMonumentParentCity(
  elementorDataJson: string | null | undefined,
): string | null {
  if (!elementorDataJson) return null;

  let data: unknown;
  try {
    data = JSON.parse(elementorDataJson);
  } catch {
    return null;
  }

  // Iterative DFS over Elementor's section/column/widget tree. Sections and
  // columns nest children under `.elements`; widgets carry `widgetType` and
  // `settings`. We want the first divider whose text matches the pattern.
  const stack: unknown[] = Array.isArray(data) ? [...data] : [data];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    const obj = node as Record<string, unknown>;

    if (Array.isArray(obj.elements)) stack.push(...obj.elements);

    if (obj.widgetType === 'divider' && obj.settings && typeof obj.settings === 'object') {
      const settings = obj.settings as Record<string, unknown>;
      const rawText = typeof settings.text === 'string' ? settings.text : null;
      if (!rawText) continue;

      // Strip HTML (anchor tags wrapping the text are common), decode the
      // `&nbsp;` entity to a regular space (Phase 1.5b-ii fix — `tawila-island`'s
      // divider has `AL GOUNA&nbsp;Travel Guide` which would otherwise miss the
      // `\s+Travel` pattern), and trim.
      const stripped = rawText.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();

      // Loose pattern — handles malformed "GIZATravel Guide" (no space).
      const match = stripped.match(/^(.+?)\s*Travel\s+Guide\s*$/i);
      if (!match) continue;

      const cityRaw = match[1].trim().toLowerCase().replace(/\s+/g, '-');
      const normalized = normalizeMonumentCityToken(cityRaw);
      if (normalized) return normalized;
    }
  }

  return null;
}

/**
 * Set of canonical staging city slugs derived from DESTINATIONS minus
 * the alias keys in TOKEN_TO_CITY_SLUG. The remainders are the slugs that
 * map directly to staging city docs (cairo, luxor, giza, abu-simbel, ...).
 * Built once at module load.
 */
const CANONICAL_CITY_SLUGS: ReadonlySet<string> = new Set(
  DESTINATIONS.filter((d) => !Object.prototype.hasOwnProperty.call(TOKEN_TO_CITY_SLUG, d)),
);

/**
 * Normalizes a divider-extracted city token to a staging city slug.
 *
 * Returns null if no resolution found (defensive — caller must not
 * fabricate a city ref from an unrecognized token).
 *
 * Resolution order: direct match → alias → Unicode-stripped form.
 */
function normalizeMonumentCityToken(token: string): string | null {
  if (CANONICAL_CITY_SLUGS.has(token)) return token;
  if (Object.prototype.hasOwnProperty.call(TOKEN_TO_CITY_SLUG, token)) {
    return TOKEN_TO_CITY_SLUG[token]!;
  }

  // Diacritic-stripped fallback (NFD decomposes accents into combining marks
  // we can drop; e.g. "al-wādī-al-gadīd" → "al-wadi-al-gadid").
  const stripped = token.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (stripped !== token) {
    if (CANONICAL_CITY_SLUGS.has(stripped)) return stripped;
    if (Object.prototype.hasOwnProperty.call(TOKEN_TO_CITY_SLUG, stripped)) {
      return TOKEN_TO_CITY_SLUG[stripped]!;
    }
  }

  return null;
}

const TOUR_PATTERNS: RegExp[] = [
  /^\d+-day(s)?-/, /-day-tour/, /-package(-|$)/, /-vacation/,
  /-itinerary/, /-cruise(?!s)/, /\d+-days?-/, /^private-/,
  /-day-trip/, /^the-elegant-/, /-edition$/, /-holiday-/,
  // Phase B additions: catch tour/experience patterns mid-slug
  /-tour(s)?(-|$)/, /-trip(-|$)/, /-journey(-|$)/, /-safari(-|$)/,
  /-trek(-|$)/, /-retreat(-|$)/, /-experience(-|$)/, /-adventure(-|$)/,
  /-expedition(-|$)/, /-getaway(-|$)/, /-escape(-|$)/, /-cruise-vacation/,
  /-exploration(-|$)/, /-immersions?(-|$)/, /-hot-air-balloon/,
  /^solo-traveller/, /-solo-traveller(-|$)/, /^small-group/, /-small-group(-|$)/,
  /^group-tour/, /^group-trip/, /^overnight-/, /^chartered-/,
  /^skyward-/, /^private-/, /^exclusive-/, /^discover-/, /^enchanting-/,
  /-from-[a-z][a-z-]*-(by|via|in|to)-/,
  /-by-bus-from-/, /-from-cairo$/, /-from-luxor$/, /-from-aswan$/,
  /-from-alexandria$/, /-from-hurghada$/, /-from-marsa-alam$/, /-from-sharm/,
];

const PERSONA_SLUGS = new Set([
  'just-me', 'me-and-my-partner', 'families-with-kids', 'friends-private-group',
  'home', 'home-2', 'about', 'about-us', 'contact', 'contact-us',
  'tailored-tours', 'plan-your-trip', 'plan-your-tour',
  'privacy-policy', 'terms-of-service', 'terms-and-conditions', 'cookie-policy',
  'sitemap', 'thank-you', 'testing',
  // Phase B additions
  'blog', 'tbt', 'tailor', 'family', 'add_services',
  'entrada-booking', 'subscriptions', 'newsletter',
  'terms-conditions', 'cookie-notice',
]);

// ---------- Helpers ----------------------------------------------------

function findDestinationToken(slug: string): string | null {
  // Match longest first; DESTINATIONS is curated longest-first.
  // Returns the matched token verbatim (NOT aliased) so callers can do
  // position-relative slicing / position checks. Apply `resolveCityAlias` at
  // the `inferredParentCity` assignment site to surface the staging-canonical
  // city slug to consumers.
  for (const d of DESTINATIONS) {
    if (slug === d || slug.startsWith(d + '-') || slug.endsWith('-' + d) || slug.includes('-' + d + '-')) {
      return d;
    }
  }
  return null;
}

/** Resolve a destination token to its staging-canonical city slug via TOKEN_TO_CITY_SLUG. */
function resolveCityAlias(token: string | null | undefined): string | undefined {
  if (!token) return undefined;
  return TOKEN_TO_CITY_SLUG[token] ?? token;
}

/**
 * Same matching surface as findDestinationToken but for WADI_TO_PARENT keys.
 * Returns the parent city token if the slug equals, prefixes-with, suffixes-with,
 * or contains a wadi-* key. Used by rule 1g (extended in 8r-2c) to catch
 * derivative subpages like `tours-in-wadi-el-natrun`, `wadi-el-natrun-history`.
 */
function findWadiParent(slug: string): { wadi: string; parent: string; reason: string } | null {
  // Sort longest-first to prefer specific matches (wadi-el-natrun before wadi-el).
  const wadis = Object.keys(WADI_TO_PARENT).sort((a, b) => b.length - a.length);
  for (const w of wadis) {
    if (slug === w || slug.startsWith(w + '-') || slug.endsWith('-' + w) || slug.includes('-' + w + '-')) {
      const entry = WADI_TO_PARENT[w]!;
      return { wadi: w, parent: entry.parent, reason: entry.reason };
    }
  }
  return null;
}

function findDistrict(slug: string): { district: string; parent: string } | null {
  for (const [d, parent] of Object.entries(DISTRICT_TO_PARENT)) {
    if (slug === d) return { district: d, parent };
    if (slug.startsWith(d + '-') || slug.endsWith('-' + d) || slug.includes('-' + d + '-')) {
      return { district: d, parent };
    }
  }
  return null;
}

// ---------- Editorial overrides (session 6.5a Investigations 1/2/3) ----

/**
 * Editorial routing override: target `PageType` keyed by exact WP slug. Fires
 * before all generic rules in `classifyPageBySlug` so it always wins. Encodes
 * Investigation 2/3 decisions where the classifier's slug-pattern heuristic
 * disagrees with editorial intent.
 */
export const EXPLICIT_PAGE_ROUTING: Record<string, PageType> = {
  // Investigation 2: editorial blog-post routing (page → article).
  'egypt-weather-guide': 'article',
  'month-by-month-guide-to-egypt': 'article',
  // Investigation 3: tour products misclassified as destination-subpage.
  'cairo-private-car-and-guide': 'tour-or-package',
  'aswan-private-car-and-guide': 'tour-or-package',
  'luxor-private-car-and-guide': 'tour-or-package',
  // Session 9 Phase 2b.d.1.fix: 4 slugs previously deferred (8r-2b/8r-2c)
  // now migrate as tour cohort per Phase 1 architectural scope reversal.
  'ramasside-tours': 'tour-or-package',
  'snorkeling-adventure-on-the-nefertari-submarine': 'tour-or-package',
  'a-9-day-egypt-tour-of-culture-and-history': 'tour-or-package',
  '10-day-egypt-travel-journey-through-history': 'tour-or-package',
  // Session 9 Phase 2b.d.1.fix.2: 5 Session 6 D5 slugs ("redirect /tours/, don't
  // migrate") now migrate as tour cohort per Phase 1 Q1. Required because each
  // ends in `-egypt`, which the destination-token rule catches before
  // TOUR_PATTERNS gets a chance, misrouting these to mapCity.
  '12-day-amazing-family-vacation-in-egypt': 'tour-or-package',
  'essential-egypt': 'tour-or-package',
  'the-holy-family-trip-in-egypt': 'tour-or-package',
  '10-days-felucca-journey-through-egypt': 'tour-or-package',
  'tour-of-egypt': 'tour-or-package',
  // Investigation 3 (Q4): redirect-only stub — movement-guide → ways-to-get-to-taba
  // at cutover. service-or-utility routes through mapServiceStub which preserves
  // the WP body (editorial triage context) and emits a redirect entry.
  'movement-guide': 'service-or-utility',

  // Session 7 Phase 0.5b: editorial monument routing for 3 attractions
  // previously deferred (8r-2b/8r-2c). WADI rule (1g) and MONUMENT_KEYWORDS
  // would route wadi-al-hittan / wadi-el-rayan as destination-subpage and
  // dendera-village as unclassified — explicit routing is the editorial
  // source of truth and lands them in the wikiMonument cohort.
  'wadi-al-hittan': 'monument',
  'wadi-el-rayan': 'monument',
  'dendera-village': 'monument',

  // Session 7 Phase 1.5b-ii: tour products misclassified as monument due to
  // slug-prefix collisions with MONUMENT_PREFIXES (`pyramids-of-`, `the-great-`).
  // All 7 carry the Royal Elementor Tour widget signature in body
  // (Price / Duration / Max People / Min Age / Tour Type / Reviews).
  // See Phase 1.5b-ii Part A investigation report.
  'shared-snorkeling-day-at-giftun-island': 'tour-or-package',
  'the-great-pharaohs-and-white-desert': 'tour-or-package',
  'fayoum-oasis-including-pyramids-of-meydum-hawara': 'tour-or-package',
  'pyramids-of-giza-and-grand-egyptian-museum': 'tour-or-package',
  'pyramids-of-giza-and-sphinx': 'tour-or-package',
  'pyramids-of-giza-sphinx-egyptian-museum-khan-el-khalili-tour': 'tour-or-package',
  'pyramids-of-giza-sphinx-memphis-and-saqqara-tour': 'tour-or-package',

  // Session 7 Phase 1.5b-ii: Pickalbatros chain hotel branded as "Palace" —
  // collides with `palace-of-` MONUMENT_PREFIXES. Body opens with
  // "About The Hotel" / "resort" — clearly a hotel product.
  '8-pickalbatros-palace-sharm-aqua-park': 'hotel',
};

/**
 * Editorial slug override: Sanity slug differs from WP database slug.
 * Used only for WP slug-collision junk where the editorial-correct slug
 * doesn't match the WP slug. The mapper writes the override slug to all
 * locale variants of `guideArticle.slug`; the WP-slug-shaped redirect-from
 * URL is unchanged so the cutover redirect still fires.
 *
 * NOTE: this divergence is intentional but breaks the WP-slug == Sanity-slug
 * invariant for these 3 docs only. Documented in the close artifacts.
 */
export const EXPLICIT_SLUG_OVERRIDES: Record<string, string> = {
  'dahab-historical-guide-3': 'colored-canyon',
  'dahab-historical-guide-5': 'blue-hole',
  'dahab-historical-guide-6': 'dahab-restaurants',
};

/**
 * Editorial section override: guideArticle.section assignment when the
 * classifier heuristic can't determine the right bucket. Editorial-only
 * field; protected by `GUIDE_ARTICLE_EDITORIAL_ONLY_FIELDS` so re-imports
 * preserve subsequent Studio reassignment.
 */
export const EXPLICIT_SECTION_OVERRIDES: Record<string, GuideArticleSection> = {
  'dahab-historical-guide-3': 'while-you-are-there',
  'dahab-historical-guide-5': 'others',
  'dahab-historical-guide-6': 'others',
};

/**
 * Editorial parentCity override: assigns when the classifier can't infer
 * from slug structure. Defensive — for the 3 dahab cleanups the existing
 * destination-prefix safety fallback (rule 6) would also infer "dahab",
 * but the explicit override is the editorial source of truth.
 */
export const EXPLICIT_PARENT_CITY_OVERRIDES: Record<string, string> = {
  'dahab-historical-guide-3': 'dahab',
  'dahab-historical-guide-5': 'dahab',
  'dahab-historical-guide-6': 'dahab',

  // 8r-2c additions: belt-and-suspenders bindings of wadi-el-natrun derivatives
  // to the wadi-el-natrun staging city. The extended WADI rule (1g) would also
  // catch these, but the explicit override documents the editorial intent.
  'tours-in-wadi-el-natrun': 'wadi-el-natrun',
  'wadi-el-natrun-accommodation-guide': 'wadi-el-natrun',
  'wadi-el-natrun-history': 'wadi-el-natrun',
  'wadi-el-natrun-weather-insights': 'wadi-el-natrun',
  'where-to-eat-in-wadi-el-natrun': 'wadi-el-natrun',

  // Session 7 Phase 0.5b: parent-city for 3 attractions reclassified to
  // monument cohort (paired with EXPLICIT_PAGE_ROUTING entries above).
  // Editorial decision (session-7-handoff): place_to_go entries under their
  // respective cities — wadi-al-hittan and wadi-el-rayan under al-fayoum,
  // dendera-village under qena.
  'wadi-al-hittan': 'al-fayoum',
  'wadi-el-rayan': 'al-fayoum',
  'dendera-village': 'qena',

  // Session 7 Phase 1.5b-iii: editorial fix for `the-temple-of-dendera`. The
  // Elementor sidebar divider on this page incorrectly points to "Abu Simbel
  // Travel Guide" (editorial copy-paste error in WP source), but Dendera
  // Temple is in Qena governorate, ~800km north of Abu Simbel. Without this
  // override, mapper priority 2 (divider) would fire first and land the
  // monument under the wrong city. Override (priority 1) captures the
  // editorial truth and short-circuits divider extraction.
  'the-temple-of-dendera': 'qena',
};

/**
 * Returns the operator-curated parent city slug for a slug if present in
 * EXPLICIT_PARENT_CITY_OVERRIDES, else undefined. Exported as a tiny helper
 * so consumers (e.g. the wikiMonument mapper's priority-1 check) don't need
 * to import the map directly. Pure read access — no normalization, no
 * fallback inference.
 */
export function getExplicitParentCityOverride(slug: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(EXPLICIT_PARENT_CITY_OVERRIDES, slug)
    ? EXPLICIT_PARENT_CITY_OVERRIDES[slug]
    : undefined;
}

/**
 * Editorial defer set: slugs that should not write at all. The classifier
 * returns `unclassified` with `reviewFlag: 'deferred-editorial'`; the
 * dispatch in `routeToMapper` checks the flag and short-circuits to null
 * before any mapper runs. Cutover redirect handled at session 9.
 */
export const EXPLICIT_DEFER_SLUGS: Set<string> = new Set([
  // Investigation 3: Lake Nasser content under Dahab-shaped junk slug. Closest
  // canonical page is wp-page-57848 (`upcoming-events-in-abu-simbel`), already
  // in the 422 cohort with high-confidence Abu Simbel routing.
  'dahab-historical-guide-4',

  // 8r-2b/8r-2c: hubs and generic-tour pages → cutover redirect to /tours/.
  'special-interest-tours',
  'group-day-tours',
  'multiday-adventure-and-safari-tours',
  'private-day-tours',
  'sinai-quest-adventures',
  // (Session 9 Phase 2b.d.1.fix: ramasside-tours,
  // snorkeling-adventure-on-the-nefertari-submarine,
  // a-9-day-egypt-tour-of-culture-and-history,
  // 10-day-egypt-travel-journey-through-history moved from defer to
  // EXPLICIT_PAGE_ROUTING → tour-or-package above. They now migrate as
  // tour cohort. 8r-2b/8r-2c decision reversed by Phase 1 architectural
  // scope: "12 deferred slugs only" cohort.)

  // 8r-2b/8r-2c: regional ticket-prices pages → cutover redirect to
  // /attractions-and-ticket-prices/.
  'ticket-prices-for-attractions-in-al-sharqia',
  'ticket-prices-for-attractions-in-red-sea-sinai',
  'ticket-prices-for-attractions-in-western-desert',

  // 8r-2b/8r-2c: events-calendar redirects to a specific event page at cutover
  // (→ /the-giza-sound-and-light-show-experience/).
  'events-calendar',

  // 8r-2b/8r-2c: dead-end content; 410/404 at cutover, no redirect.
  'saint-catherines-monastery-and-mount-sinai',

  // (Session 7 Phase 0.5b: wadi-al-hittan, wadi-el-rayan, dendera-village
  // moved from defer to EXPLICIT_PAGE_ROUTING + EXPLICIT_PARENT_CITY_OVERRIDES
  // above. They now route as monument cohort with editorial parent-city.)
]);

// ---------- Main classifier --------------------------------------------

export function classifyPageBySlug(rawSlug: string): Classification {
  const s = rawSlug.toLowerCase();

  // Editorial overrides — fire before any generic rule so they always win.
  // Source of truth: session 6.5a Investigations 1/2/3.
  if (EXPLICIT_DEFER_SLUGS.has(s)) {
    return {
      type: 'unclassified',
      reason: 'Editorial defer (slug-collision junk; redirect handled at cutover)',
      confidence: 'high',
      reviewFlag: 'deferred-editorial',
    };
  }
  if (Object.prototype.hasOwnProperty.call(EXPLICIT_PAGE_ROUTING, s)) {
    return {
      type: EXPLICIT_PAGE_ROUTING[s],
      reason: 'Explicit editorial routing override',
      confidence: 'high',
      ...(Object.prototype.hasOwnProperty.call(EXPLICIT_PARENT_CITY_OVERRIDES, s)
        ? { inferredParentCity: EXPLICIT_PARENT_CITY_OVERRIDES[s] }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(EXPLICIT_SECTION_OVERRIDES, s)
        ? { inferredSection: EXPLICIT_SECTION_OVERRIDES[s] }
        : {}),
    };
  }

  // 0. Test/junk -- always first so we never misclassify garbage.
  if (
    /^\d+(-\d+)*$/.test(s) ||
    s === 'testing' ||
    /^test-/.test(s) ||
    /-2$/.test(s) ||
    /-copy$/.test(s) ||
    /^home-\d+$/.test(s) ||
    /^elementor-\d+$/.test(s) ||
    /^elementskit-/.test(s) ||
    /^\d+-paivan-/.test(s) // Finnish residue (e.g. 4-paivan-egyptin-matkat)
  ) {
    return { type: 'test-or-junk', reason: 'Numeric/test/duplicate/builder/foreign-locale-residue slug', confidence: 'high' };
  }

  // 1. Persona / system pages (Phase A behavior preserved).
  if (PERSONA_SLUGS.has(s)) {
    return { type: 'persona-or-system', reason: 'Known persona/system slug', confidence: 'high' };
  }

  // ---- Phase B expanded rules (applied BEFORE generic rules) ----

  // 1a. Cairo neighborhoods → places-to-go subpage of Cairo
  // (also covers any district configured in DISTRICT_TO_PARENT)
  const dist = findDistrict(s);
  if (dist && (s === dist.district || s.startsWith(dist.district + '-') || s === dist.district + '-guide' || s === dist.district + '-egypt')) {
    // Treat the district itself (or district+guide/egypt suffix) as a places-to-go subpage of its parent
    return {
      type: 'destination-subpage',
      reason: `District "${dist.district}" → parent ${dist.parent}, section: places-to-go`,
      confidence: 'high',
      inferredParentCity: resolveCityAlias(dist.parent),
      inferredSection: 'places-to-go',
    };
  }

  // 1b. {place}-airport-transfer → service-or-utility
  //     Also catches transfer-from-{x}-to-{y} and transfer-*-to-hotel patterns.
  if (
    /-airport-transfer$/.test(s) ||
    /^airport-transfer-/.test(s) ||
    /^transfer-from-/.test(s) ||
    /^transfer-.*-to-hotel$/.test(s)
  ) {
    const dest = findDestinationToken(s);
    return {
      type: 'service-or-utility',
      reason: 'Airport / hotel transfer operational page',
      confidence: 'high',
      inferredParentCity: resolveCityAlias(dest),
    };
  }

  // 1b-bis. Nile cruise vessels — must run BEFORE the hotel rule because hotel
  // brand tokens (movenpick, oberoi, etc.) often own cruise vessels too, AND
  // before TOUR_PATTERNS (which catches `-cruise(?!s)` generically and would
  // mis-bucket vessel slugs as tour packages).
  //
  // Vessel signals:
  //   - m-s- prefix (M/S = motor ship)
  //   - -dahabiya suffix
  //   - -nile-cruise suffix or prefix
  //   - -cruise-ship$ (explicit vessel suffix, e.g. kasr-ibrim-cruise-ship)
  //   - -cruise$ as proper-name suffix (e.g. the-nile-goddess-cruise,
  //     movenpick-prince-abbas-cruise) — guarded against tour-package shapes
  //     that start with N-day or contain transport/itinerary tokens.
  const isCruiseTourShape =
    /^\d+-days?-/.test(s) ||
    /-from-/.test(s) ||
    /-to-[a-z]/.test(s) ||
    /-tour(s)?(-|$)/.test(s) ||
    /-vacation/.test(s) ||
    /-package(-|$)/.test(s) ||
    /-itinerary/.test(s) ||
    /-journey(-|$)/.test(s) ||
    /-holiday/.test(s) ||
    /-adventure(-|$)/.test(s);
  if (
    /^m-s-/.test(s) ||
    /-dahabiya(-|$)/.test(s) ||
    /-nile-cruise$/.test(s) ||
    /^nile-cruise-/.test(s) ||
    s === 'nile-cruise' ||
    /-cruise-ship$/.test(s) ||
    (/-cruise$/.test(s) && !isCruiseTourShape)
  ) {
    return {
      type: 'nile-cruise',
      reason: 'Nile cruise vessel pattern (m-s-/dahabiya/nile-cruise/-cruise-ship/proper-name-cruise)',
      confidence: 'high',
    };
  }

  // 1c. egypt-tours-from-{country} → tour-or-package
  if (/^egypt-tours?-from-[a-z-]+$/.test(s)) {
    return { type: 'tour-or-package', reason: 'egypt-tours-from-{country} pattern', confidence: 'high' };
  }

  // 1c-bis. ^\d+-days?-egypt-tours$  ("5-days-egypt-tours" / "2-day-egypt-tours") → tour-or-package
  // Catches the generic N-day Egypt package listing pages BEFORE the -tours topic-suffix rule
  // would mis-bucket them as "destination-subpage / others".
  if (/^\d+-days?-egypt-tours?$/.test(s)) {
    return { type: 'tour-or-package', reason: 'N-day Egypt tours listing page', confidence: 'high' };
  }

  // 1d. pharaohs-of-{period}, ancient-{...}, egyptian-{...} → article
  // (only if not matching a tour pattern, which we check first below for safety)
  const articleEditorialPatterns = [
    /^pharaohs?-of-/, /^ancient-/, /^egyptian-/,
    /-pharaohs?$/, /-ancient-egypt$/,
  ];
  // Defer this match — we want the tour-pattern guard before it. Marked as candidate.
  const looksEditorial = articleEditorialPatterns.some((re) => re.test(s));

  // 1e. Monument prefixes (pyramid-of-, temple-of-, tomb-of-, mosque-of-, etc.)
  for (const h of MONUMENT_PREFIXES) {
    if (s.startsWith(h) || s.startsWith('the-' + h)) {
      const dest = findDestinationToken(s);
      return {
        type: 'monument',
        reason: `Monument prefix "${h}"`,
        confidence: 'high',
        inferredParentCity: resolveCityAlias(dest),
      };
    }
  }

  // 1f. Hotel detection. Hotel-brand token OR hotel-shape suffix + destination token.
  //     Guarded against:
  //       - "*-hotel-guide" (a guide ABOUT hotels, not a hotel — falls through to topic-suffix)
  //       - cruise vessels (handled in 1b-bis above)
  {
    if (/-hotel-guide$/.test(s) || /-hotels-guide$/.test(s) || /^top-hotels-in-/.test(s)) {
      // Falls through to topic rules; no hotel classification here.
    } else {
      const hasBrand = HOTEL_BRANDS.some((b) => s === b || s.startsWith(b + '-') || s.endsWith('-' + b) || s.includes('-' + b + '-'));
      const hasHotelSuffix = HOTEL_SUFFIXES.some((suf) => s.endsWith(suf) || s.includes(suf + '-'));
      if (hasBrand || hasHotelSuffix) {
        const dest = findDestinationToken(s);
        return {
          type: 'hotel',
          reason: hasBrand ? 'Hotel-brand token in slug' : 'Hotel-shape suffix in slug',
          confidence: 'high',
          inferredParentCity: resolveCityAlias(dest),
        };
      }
    }
  }

  // 1g. Wadi-* explicit parent inference (approved Phase B decision; extended in 8r-2c
  //      to match prefix/suffix/middle so derivative subpages like
  //      `tours-in-wadi-el-natrun` and `wadi-el-natrun-history` resolve too).
  {
    const wadi = findWadiParent(s);
    if (wadi) {
      return {
        type: 'destination-subpage',
        reason: `wadi-* explicit inference: ${wadi.reason}`,
        confidence: 'high',
        inferredParentCity: resolveCityAlias(wadi.parent),
        // section deliberately unset — let editor decide (these are nature/heritage sites)
      };
    }
  }

  // ---- Existing destination-hub / topic / tour rules ----

  // 1.5. travelTip — country-level practical-tip slugs (added in session 6.5a
  //      Phase 2 per session 6 Phase 3 routing decisions in
  //      `migration/.diffs/destination-hub-misclassified-resolved.md`).
  //      Must run BEFORE the *-egypt destination-hub rule below, which would
  //      otherwise overshoot and re-misclassify these slugs (the original
  //      session-5 trap that resolved.md re-routed away from). Single source
  //      of truth: membership in `TRAVEL_TIP_SLUG_TO_CATEGORY` (imported from
  //      the mapper to keep classifier and mapper from drifting).
  if (isTravelTipSlug(s)) {
    return {
      type: 'travelTip',
      reason: 'Slug ∈ TRAVEL_TIP_SLUG_TO_CATEGORY (session 6.5a Phase 2 routing)',
      confidence: 'high',
    };
  }

  // 2. Destination hubs (slug = token, or *-travel-guide, or *-egypt)
  if (
    DESTINATIONS.includes(s) ||
    s.endsWith('-travel-guide') ||
    s.endsWith('-egypt')
  ) {
    return { type: 'destination-hub', reason: 'Slug = destination token, or *-travel-guide / *-egypt', confidence: 'high' };
  }

  // 3. Topic-prefix → subpage (with section inference)
  for (const { prefix, section } of TOPIC_PREFIX_TO_SECTION) {
    if (s.startsWith(prefix)) {
      const rest = s.slice(prefix.length);
      const dest = findDestinationToken(rest) || findDestinationToken(s);
      return {
        type: 'destination-subpage',
        reason: `Topic-prefix "${prefix}"${dest ? ` → ${dest}` : ''}`,
        confidence: dest ? 'high' : 'med',
        inferredParentCity: resolveCityAlias(dest),
        inferredSection: section,
      };
    }
  }
  // 3b. Topic-suffix → subpage
  for (const { suffix, section } of TOPIC_SUFFIX_TO_SECTION) {
    if (s.endsWith(suffix)) {
      const head = s.slice(0, -suffix.length);
      const dest = findDestinationToken(head) || findDestinationToken(s);
      return {
        type: 'destination-subpage',
        reason: `Topic-suffix "${suffix}"${dest ? ` → ${dest}` : ''}`,
        confidence: dest ? 'high' : 'med',
        inferredParentCity: resolveCityAlias(dest),
        inferredSection: section,
      };
    }
  }

  // 4. Tour patterns. We check this BEFORE the destination-prefix subpage rule
  //    because tour slugs often start with destination tokens too.
  for (const re of TOUR_PATTERNS) {
    if (re.test(s)) {
      return { type: 'tour-or-package', reason: `Matches tour pattern ${re}`, confidence: 'high' };
    }
  }

  // 5. Editorial article patterns (pharaohs/ancient/egyptian) — now safe to fire.
  if (looksEditorial) {
    return { type: 'article', reason: 'Editorial pattern (pharaohs-of-/ancient-/egyptian-)', confidence: 'high' };
  }

  // 6. Destination-prefixed / suffixed subpages with NO topical signal.
  //    SAFETY FALLBACK (Phase B option a): we can confidently say this is a subpage
  //    of {dest}, but we don't know which section it belongs to. Leave inferredSection
  //    UNSET so the importer can flag the doc with _migrationReviewFlag =
  //    "section-needs-assignment" instead of pretending to be in "others".
  {
    const dest = findDestinationToken(s);
    if (dest && s.startsWith(dest + '-')) {
      const tail = s.slice(dest.length + 1);
      const tailIsMonument = MONUMENT_KEYWORDS.some((k) => tail.includes(k));
      if (tailIsMonument) {
        return {
          type: 'monument',
          reason: `Destination "${dest}" + monument keyword in tail`,
          confidence: 'med',
          inferredParentCity: resolveCityAlias(dest),
        };
      }
      return {
        type: 'destination-subpage',
        reason: `Destination "${dest}" prefix + topical tail (no section keyword match)`,
        confidence: 'low',
        inferredParentCity: resolveCityAlias(dest),
        // inferredSection deliberately undefined — editor assigns post-migration
      };
    }
    if (dest && s.endsWith('-' + dest)) {
      return {
        type: 'destination-subpage',
        reason: `Destination "${dest}" suffix (no section keyword match)`,
        confidence: 'low',
        inferredParentCity: resolveCityAlias(dest),
        // inferredSection deliberately undefined
      };
    }
  }

  // 7. (removed — superseded by rule 1g WADI_TO_PARENT explicit lookup)

  // 8. Monument keyword anywhere
  if (MONUMENT_KEYWORDS.some((k) => s === k || s.endsWith('-' + k) || s.includes('-' + k + '-'))) {
    return { type: 'monument', reason: 'Monument keyword in slug', confidence: 'med' };
  }

  // 9. Default — manual triage
  return { type: 'unclassified', reason: 'No heuristic matched', confidence: 'low' };
}
