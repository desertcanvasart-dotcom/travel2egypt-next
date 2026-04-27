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
  | 'service-or-utility'
  | 'persona-or-system'
  | 'unclassified'
  | 'test-or-junk';

export type Confidence = 'high' | 'med' | 'low';

export interface Classification {
  type: PageType;
  reason: string;
  confidence: Confidence;
  /** Slug token of the parent destination, when inferable. */
  inferredParentCity?: string;
  /** Section value for destination-subpage (introducing|plan-your-trip|while-you-are-there|places-to-go|others). */
  inferredSection?:
    | 'introducing'
    | 'plan-your-trip'
    | 'while-you-are-there'
    | 'places-to-go'
    | 'others';
}

// ---------- Lookup tables ----------------------------------------------

/** Single-token destination identifiers. Order matters for prefix-matching: longer first. */
export const DESTINATIONS = [
  'sharm-el-sheikh', 'sharm', 'abu-simbel', 'marsa-alam', 'el-gouna', 'al-gouna',
  'st-catherine', 'saint-catherine', 'kharga-oasis',
  'cairo', 'luxor', 'aswan', 'alexandria', 'giza',
  'hurghada', 'dahab', 'taba', 'nuweiba', 'sinai', 'suez', 'siwa',
  'bahariya', 'kharga', 'dakhla', 'farafra', 'fayoum', 'fayyoum', 'el-fayoum',
  'edfu', 'kom-ombo', 'abydos', 'dendera', 'sohag', 'asyut', 'beni-suef',
  'port-said', 'ismailia', 'mansoura', 'tanta', 'rashid', 'rosetta',
  'el-minya', 'minya', 'el-alamein', 'alamein', 'al-quseir', 'el-quseir', 'quseir',
];

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
  'wadi-el-natrun': { parent: 'farafra', reason: 'Western Desert — Wadi El Natrun (Coptic monasteries)' },
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
  // Match longest first.
  for (const d of DESTINATIONS) {
    if (slug === d) return d;
    if (slug.startsWith(d + '-')) return d;
    if (slug.endsWith('-' + d)) return d;
    if (slug.includes('-' + d + '-')) return d;
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

// ---------- Main classifier --------------------------------------------

export function classifyPageBySlug(rawSlug: string): Classification {
  const s = rawSlug.toLowerCase();

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
      inferredParentCity: dist.parent,
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
      inferredParentCity: dest ?? undefined,
    };
  }

  // 1b-bis. Nile cruise vessels — must run BEFORE the hotel rule because hotel
  // brand tokens (movenpick, oberoi, etc.) often own cruise vessels too.
  // Vessel signals: m-s- prefix, -dahabiya suffix, -nile-cruise suffix, or
  // explicit vessel-name tokens.
  if (
    /^m-s-/.test(s) ||
    /-dahabiya(-|$)/.test(s) ||
    /-nile-cruise$/.test(s) ||
    /^nile-cruise-/.test(s) ||
    s === 'nile-cruise'
  ) {
    return {
      type: 'nile-cruise',
      reason: 'Nile cruise vessel pattern (m-s-/dahabiya/nile-cruise)',
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
        inferredParentCity: dest ?? undefined,
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
          inferredParentCity: dest ?? undefined,
        };
      }
    }
  }

  // 1g. Wadi-* explicit parent inference (approved Phase B decision).
  if (s in WADI_TO_PARENT) {
    const w = WADI_TO_PARENT[s];
    return {
      type: 'destination-subpage',
      reason: `wadi-* explicit inference: ${w.reason}`,
      confidence: 'high',
      inferredParentCity: w.parent,
      // section deliberately unset — let editor decide (these are nature/heritage sites)
    };
  }

  // ---- Existing destination-hub / topic / tour rules ----

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
        inferredParentCity: dest ?? undefined,
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
        inferredParentCity: dest ?? undefined,
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
          inferredParentCity: dest,
        };
      }
      return {
        type: 'destination-subpage',
        reason: `Destination "${dest}" prefix + topical tail (no section keyword match)`,
        confidence: 'low',
        inferredParentCity: dest,
        // inferredSection deliberately undefined — editor assigns post-migration
      };
    }
    if (dest && s.endsWith('-' + dest)) {
      return {
        type: 'destination-subpage',
        reason: `Destination "${dest}" suffix (no section keyword match)`,
        confidence: 'low',
        inferredParentCity: dest,
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
