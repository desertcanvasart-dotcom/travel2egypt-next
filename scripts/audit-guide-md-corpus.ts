/**
 * Audit the MD corpus at "/Users/islamhussein/Downloads/All 3 langs/" against
 * the live migration-staging dataset.
 *
 * Read-only. Produces:
 *   - stdout summary
 *   - migration/audit-guide-corpus.md (full report)
 *
 * What it does, per file:
 *   1. Resolves city folder → Sanity city slug (alias map, hard-coded).
 *   2. Classifies filename → kind/section (keyword patterns).
 *   3. Pulls existing guideArticles for that city from Sanity.
 *   4. Attempts to match the file to an existing doc by slug heuristics.
 *   5. Emits an action: update / update+retag / create / update-city-overview / unmapped.
 *
 * Also reports:
 *   - City-folder ↔ Sanity-city mapping (so alias issues surface).
 *   - Orphans: existing Sanity guideArticles not matched by any MD file.
 *   - city._ref repair list (existing guideArticles with city: null).
 *   - Unmapped files (FATAL — the upload script will halt on these).
 *   - Locale parity per file (en/es/ja triplet presence).
 *
 * Usage:
 *   npx tsx scripts/audit-guide-md-corpus.ts
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

loadEnv();

// ──────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────

const CORPUS_ROOT = '/Users/islamhussein/Downloads/All 3 langs';
const LOCALES = ['en', 'es', 'ja'] as const;
const REPORT_PATH = resolve(process.cwd(), 'migration/audit-guide-corpus.md');

// City folder name (as it appears in the corpus) → Sanity city slug.
// Confirmed earlier in the session against `select slug from city`.
const CITY_FOLDER_TO_SLUG: Record<string, string> = {
  'ABU SIMBEL': 'abu-simbel',
  AKHMIM: 'akhmim',
  'AL ARISH': 'al-arish',
  'AL FAYOUM': 'al-fayoum',
  'AL GOUNA': 'al-gouna',
  'AL QUSEIR': 'al-quseir',
  'AL WADI AL GADID': 'al-wadi-al-gadid',
  ASYUT: 'asyut',
  'Al Minya': 'al-minya',
  Alexandria: 'alexandria',
  Aswan: 'aswan',
  BAHARIYA: 'bahariya-oasis', // suffix added
  'BARIS OASIS': 'baris', // suffix removed
  'Beni Suef': 'beni-suef',
  Cairo: 'cairo',
  DAHAB: 'dahab',
  Edfu: 'edfu',
  'El Dakhla Oasis': 'dakhla-oasis', // alias
  Esna: 'esna',
  'Farafra Oasis': 'farafra-oasis',
  Giza: 'giza',
  ISMAILIA: 'ismailia',
  'KHARGA OASIS': 'kharga-oasis',
  'KOM OMBO': 'kom-ombo',
  'MARSA ALAM': 'marsa-alam',
  'MARSA MATRUH': 'marsa-matruh',
  Nuweiba: 'nuweiba',
  'Port Said': 'port-said',
  Qena: 'qena',
  'Ras Sudr': 'ras-sudr',
  'Rosetta Rasheed': 'rosetta-rasheed',
  'SAINTE CATHERINE': 'saint-catherine', // alias (drop trailing 'e')
  'SHARM EL-SHEIKH': 'sharm-el-sheikh',
  SOHAG: 'sohag',
  SUEZ: 'suez',
  Safaga: 'safaga',
  'Siwa Oasis': 'siwa-oasis',
  TABA: 'taba',
  'WADI AL-NATRON': 'wadi-el-natrun', // alias (al→el, Natron→Natrun)
  hurghada: 'hurghada',
  luxor: 'luxor',
};

interface KindMapping {
  kind: string;
  section: string;
  slugBuilder: (citySlug: string) => string[]; // ordered preference: try first, then second, ...
  label: string;
}

// Filename → (kind, section). Patterns are case-insensitive. The first
// match wins, so order is significant. Tightest matches first.
//
// slugBuilder returns the list of slug variants to try in priority order.
// - Position [0] is the CANONICAL slug for new creates (e.g. tours-in-X).
// - Positions [1+] are alt-slug patterns found in the existing dataset
//   from WP-era imports. Adding these here is what collapses orphans.
const FILE_PATTERNS: Array<{ match: RegExp; mapping: KindMapping | 'city-overview' }> = [
  // City-level Travel Guide → replaces city.overview, no separate doc
  {
    match: /\btravel guide\b/i,
    mapping: 'city-overview',
  },
  // Places to Go subfolder is handled separately (path-based), not here.

  // Things to Do — explicit FIRST so it doesn't fall through to tours
  {
    match: /^things to do( in .+)?\.md$/i,
    mapping: {
      kind: 'things-to-do',
      section: 'while-you-are-there',
      slugBuilder: (c) => [
        `things-to-do-in-${c}`,
        `activities-in-${c}`,
        `what-to-do-in-${c}`,
        `experiences-in-${c}`,
        `adventure-activities-in-${c}`,
        `${c}-unforgettable-moments`,
      ],
      label: 'Things to Do',
    },
  },
  // Tours — match "Tours" and "<City> Tours". Per operator decision:
  // canonical section is `others` (not `while-you-are-there`).
  {
    match: /^(.+ )?tours\.md$/i,
    mapping: {
      kind: 'tours',
      section: 'others',
      slugBuilder: (c) => [
        `tours-in-${c}`,
        `${c}-tours`,
        `${c}-guided-tours`,
        `best-${c}-tours`,
        `discover-${c}-with-tours`,
        `explore-${c}-tours`,
      ],
      label: 'Tours',
    },
  },
  {
    match: /^events?( in .+)?\.md$/i,
    mapping: {
      kind: 'events',
      section: 'others',
      slugBuilder: (c) => [
        `upcoming-events-in-${c}`,
        `events-in-${c}`,
        `${c}-events`,
        `annual-events-in-${c}`,
        `cultural-events-in-${c}`,
        `${c}-festivals-and-celebrations`,
      ],
      label: 'Events',
    },
  },
  {
    match: /^(.+ )?food( guide)?\.md$/i,
    mapping: {
      kind: 'food',
      section: 'while-you-are-there',
      slugBuilder: (c) => [
        `food-in-${c}`,
        `${c}-food-guide`,
        `${c}-food-and-drink`,
        `${c}-local-cuisine`,
        `${c}-restaurants`,
        `${c}-flavors`,
        `${c}-dining-experiences`,
        `eating-out-in-${c}`,
        `top-restaurants-in-${c}`,
        `traditional-food-in-${c}`,
        `what-to-eat-in-${c}`,
        `where-to-eat-in-${c}`,
      ],
      label: 'Food',
    },
  },
  {
    match: /^getting around( .+)?\.md$/i,
    mapping: {
      kind: 'transport-around',
      section: 'while-you-are-there',
      slugBuilder: (c) => [
        `getting-around-in-${c}`,
        `getting-around-${c}`,
        `getting-around-to-${c}`,
        `${c}-getting-around-guide`,
        `${c}-local-transport-guide`,
        `how-to-get-around-${c}`,
        `navigating-${c}`,
        `public-transport-in-${c}`,
      ],
      label: 'Getting Around',
    },
  },
  {
    match: /^(how to go|getting here|how to get to .+)\.md$/i,
    mapping: {
      kind: 'transport-to',
      section: 'plan-your-trip',
      slugBuilder: (c) => [
        `how-to-go-in-${c}`,
        `getting-here-in-${c}`,
        `how-to-get-to-${c}`,
        `how-to-go-to-${c}`,
        `how-to-reach-${c}`,
        `arrival-in-${c}`,
        `getting-to-${c}`,
        `${c}-arrival-guide`,
        `transport-to-${c}`,
        `travel-to-${c}`,
        `ways-to-get-to-${c}`,
      ],
      label: 'How to Go',
    },
  },
  {
    match: /^history( of .+)?\.md$/i,
    mapping: {
      kind: 'heritage',
      section: 'introducing',
      slugBuilder: (c) => [
        `${c}-historical-overview`,
        `${c}-history-overview`,
        `${c}-historical-guide`,
        `history-of-${c}`,
        `${c}-history`,
        `${c}-ancient-past`,
        `discover-${c}-history`,
        `past-and-present-${c}`,
        `story-of-${c}`,
        // `${c}-off-the-beaten-path` removed — operator clarified these are
        // signature-type (Only Here) content, slated for delete + redirect.
      ],
      label: 'History',
    },
  },
  {
    match: /^only (here|in .+)\.md$/i,
    mapping: {
      kind: 'signature',
      section: 'others',
      slugBuilder: (c) => [
        `only-in-${c}`,
        `only-here-in-${c}`,
        `${c}-only-here`,
        `unique-sites-in-${c}`,
      ],
      label: 'Only Here',
    },
  },
  // AKHMIM/Unique Sites.md — operator mapped this as Signature/Only-Here equivalent.
  {
    match: /^unique sites\.md$/i,
    mapping: {
      kind: 'signature',
      section: 'others',
      slugBuilder: (c) => [
        `unique-sites-in-${c}`,
        `only-in-${c}`,
      ],
      label: 'Unique Sites (Signature)',
    },
  },
  {
    match: /^weather( in .+)?\.md$/i,
    mapping: {
      kind: 'climate',
      section: 'plan-your-trip',
      slugBuilder: (c) => [
        `weather-in-${c}`,
        `${c}-weather`,
        `${c}-weather-guide`,
        `${c}-weather-overview`,
        `${c}-weather-insights`,
        `${c}-travel-weather`,
        `${c}-seasonal-guide`,
        `${c}-climate`,
        `${c}-temperature-trends`,
        `when-to-explore-${c}`,
        `when-to-go-${c}`,
      ],
      label: 'Weather',
    },
  },
  {
    match: /^where to stay( in .+)?\.md$/i,
    mapping: {
      kind: 'accommodation',
      section: 'while-you-are-there',
      slugBuilder: (c) => [
        `top-hotels-in-${c}`,
        `where-to-stay-in-${c}`,
        `where-to-sleep-in-${c}`,
        `accommodation-options-${c}`,
        `accommodations-in-${c}`,
        `${c}-accommodation-guide`,
        `${c}-hotel-guide`,
        `${c}-hotels`,
        `hotels-in-${c}`,
        `lodging-in-${c}`,
        `best-places-to-stay-${c}`,
        `places-to-stay-in-${c}`,
        `stay-in-${c}`,
      ],
      label: 'Where to Stay',
    },
  },
];

// Known orphan classifications — items that should NOT be flagged as
// generic "review me" orphans because they're already accounted for
// in the deferred-tour-migration plan.
//
// Type 2: single-tour `guideArticle` docs to migrate to `tour` doc type.
// See migration/deferred-tour-migration.md item 1.
const TYPE_2_SINGLE_TOURS = new Set([
  '4-days-white-desert-wadi-al-hittan-exploration',
  'cairo-alexandria-city-break-5-days',
  'cairo-dinner-cruise-with-belly-dancing-show',
  'cairo-weekend-city-break-2-nights-3-days',
  'dendera-and-abydos-temples-from-al-gouna',
  'dolphin-show-sharm-el-sheikh',
  'dolphins-in-sharm-el-sheikh',
  'hurghada-dolphin-show',
  'islamic-cairo-day-tour',
  'nmec-royal-mummies-old-cairo',
  'royal-seascope-submarine-hurghada',
  'saladin-citadel-khan-el-khalili-bazaar-cairo',
  'sharm-el-sheikh-to-jerusalem-and-dead-sea',
  'sharm-el-sheikh-to-mount-sinai',
  'sound-light-show-at-karnak-temple-in-luxor',
  'the-giza-sound-and-light-show',
]);

// Type 3: tour-category landing pages to migrate to `tourCategory` doc type.
// Slug-pattern match (15 docs at last count).
function isType3CategorySlug(slug: string): boolean {
  return /-(private|small-group)-day-tours$/.test(slug);
}

// Known-keep orphans — content the operator has decided to keep as-is
// (no MD-corpus equivalent, but not problematic; the upload should not
// touch them and the audit should not surface them for review).
//
// Hotels — belong to `hotel` doc type when that migration runs.
const KNOWN_HOTELS = new Set([
  'al-tabuna-camp-el-dakhla-oasis',
  'dusit-thani-lake-view-cairo',
  'shamsiya-camp-dakhla-oasis',
  'the-pearl-of-red-sea-hurghada',
  'tropitel-naama-bay-sharm-el-sheikh',
]);

// Ticket-prices overviews — per-city pricing pages. Operator decision:
// keep them, they're useful in-context info under Plan Your Trip. Future
// work could expand to all 41 cities or auto-generate from a master.
function isTicketPricesSlug(slug: string): boolean {
  return slug.startsWith('ticket-prices-for-attractions-in-');
}

// Operator-locked dispositions for the post-orphan-review cleanup.
// Each entry resolves to an action the upload script's Phase C will execute.
const DELETE_AND_REDIRECT = new Map<string, string>([
  // Slug to delete  → slug to redirect TO (within the same city)
  ['luxor-off-the-beaten-path', 'only-in-luxor'],
  ['places-to-go-in-marsa-matruh', '/guide/marsa-matruh'], // hub
  ['places-to-go-in-safaga', '/guide/safaga'], // hub (legacy "Places" overview)
  ['kharga-oasis-only-here', '/guide/kharga-oasis'], // hub
  ['annual-events-in-asyut', '/guide/asyut'], // hub
  ['weather-in-dakhla-oasis', 'when-to-explore-dakhla-oasis'], // climate consolidation
]);

// Slug → city override. The default city-from-slug heuristic (longest
// substring match) fails when a slug contains a place name that is NOT
// the actual host city — e.g., "suez-canal-house" is a Port Said
// attraction, but slug contains "suez" so substring match misroutes it.
const SLUG_TO_CITY_OVERRIDES: Record<string, string> = {
  'suez-canal-house': 'port-said',
};

// Orphans the operator has explicitly decided to keep — they belong to
// other content types (article / overview) and will be migrated later or
// stay as legacy editorial.
const KEEP_AS_IS = new Set<string>([
  'places-to-visit-in-ras-sudr', // operator: keep as-is
  'adventure-activities-in-siwa-oasis', // blog post → future article migration
]);

// Orphans that need an MD file authored before they can be matched.
const NEEDS_MD_FILE = new Set<string>([
  'events-in-saint-catherine', // SAINTE CATHERINE/Events.md missing
]);

function classifyOrphan(slug: string, kind: string | null): string {
  if (TYPE_2_SINGLE_TOURS.has(slug)) return 'Type 2 (single tour — deferred to tour migration)';
  if (isType3CategorySlug(slug)) return 'Type 3 (tour category — deferred to tourCategory migration)';
  if (KNOWN_HOTELS.has(slug)) return 'Known-keep (hotel — deferred to hotel migration)';
  if (isTicketPricesSlug(slug)) return 'Known-keep (ticket-prices overview — operator decision: keep)';
  if (DELETE_AND_REDIRECT.has(slug)) return 'Delete + redirect (operator-locked)';
  if (KEEP_AS_IS.has(slug)) return 'Keep as-is (operator decision)';
  if (NEEDS_MD_FILE.has(slug)) return 'Needs MD file authored (operator action)';
  return 'Review';
}

// Per-city slug overrides for matching. When matching a (city, kind) MD
// file, this slug is tried BEFORE the standard slugBuilder list — so a
// WP-era doc with a non-standard slug can be made canonical.
const SLUG_OVERRIDES: Record<string, Partial<Record<string, string>>> = {
  // Dakhla Weather.md → when-to-explore-dakhla-oasis (operator pick)
  'dakhla-oasis': { climate: 'when-to-explore-dakhla-oasis' },
};

// Per-city Places to Go attraction-slug overrides. Filename (no .md, case
// preserved) → canonical existing Sanity slug. Use for cases where the MD
// title is the deity/saint name but Sanity slug is the city-named form.
const ATTRACTION_OVERRIDES: Record<string, Record<string, string>> = {
  edfu: { 'Temple of Horus': 'edfu-temple' },
};

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

interface FileRecord {
  cityFolder: string;
  citySlug: string;
  relPath: string; // e.g. "ABU SIMBEL/Event.md" or "ABU SIMBEL/Places to Go/Qasr Ibrim.md"
  filename: string; // basename
  isPlacesToGo: boolean;
  exists: Record<'en' | 'es' | 'ja', boolean>;
  h1Title: string | null;
  hasMetaBlock: boolean;
}

interface FilePlan {
  file: FileRecord;
  // For root files
  mapping?: KindMapping | 'city-overview';
  // For Places to Go
  attractionSlug?: string; // derived from H1
  // Outcome
  action:
    | 'update-city-overview'
    | 'create-guideArticle'
    | 'update-guideArticle'
    | 'update-and-retag-guideArticle'
    | 'unmapped';
  existingDoc?: SanityGuideArticleRow;
  notes: string[];
}

interface SanityGuideArticleRow {
  _id: string;
  slug: string;
  kind: string | null;
  section: string | null;
  cityRef: string | null;
}

interface SanityCityRow {
  _id: string;
  slug: string;
  hasOverview: boolean;
  placesToGoCount: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Sanity client (read-only — uses the staging token for draft visibility)
// ──────────────────────────────────────────────────────────────────────────

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) throw new Error('Sanity env vars missing in .env');
  if (dataset !== 'migration-staging') {
    throw new Error(`Refusing to audit against "${dataset}". migration-staging only.`);
  }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) throw new Error('SANITY_STAGING_API_WRITE_TOKEN required for read');
  return createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false,
    token,
    perspective: 'raw',
  });
}

// ──────────────────────────────────────────────────────────────────────────
// File walking & parsing
// ──────────────────────────────────────────────────────────────────────────

function walkLocale(locale: 'en' | 'es' | 'ja'): Map<string, { absPath: string; basename: string }> {
  const root = join(CORPUS_ROOT, locale, 'guide');
  const out = new Map<string, { absPath: string; basename: string }>();
  if (!existsSync(root)) return out;
  for (const cityFolder of readdirSync(root)) {
    const cityPath = join(root, cityFolder);
    if (!statSync(cityPath).isDirectory()) continue;
    for (const entry of readdirSync(cityPath)) {
      const abs = join(cityPath, entry);
      const s = statSync(abs);
      if (s.isFile() && entry.endsWith('.md')) {
        const rel = `${cityFolder}/${entry}`;
        out.set(rel, { absPath: abs, basename: entry.trim() });
      } else if (s.isDirectory() && entry.toLowerCase() === 'places to go') {
        // Tolerate case variants — Port Said uses "Places to go" (lowercase g).
        for (const place of readdirSync(abs)) {
          if (!place.endsWith('.md')) continue;
          // Normalize the relpath to the canonical "Places to Go" casing so
          // EN/ES/JA copies of the same file under different casings still
          // collide in the en-spine Map and produce one file record.
          const rel = `${cityFolder}/Places to Go/${place}`;
          out.set(rel, { absPath: join(abs, place), basename: place.trim() });
        }
      }
    }
  }
  return out;
}

function parseMd(absPath: string): { h1: string | null; hasMeta: boolean } {
  let text: string;
  try {
    text = readFileSync(absPath, 'utf8');
  } catch {
    return { h1: null, hasMeta: false };
  }
  const hasMeta = /^Meta title:/m.test(text.slice(0, 500));
  const h1Match = text.match(/^#\s+(.+)$/m);
  return { h1: h1Match?.[1]?.trim() ?? null, hasMeta };
}

function classifyFile(rel: string): KindMapping | 'city-overview' | null {
  const filename = rel.split('/').pop() ?? '';
  // Travel Guide must check the filename only (after city folder)
  for (const { match, mapping } of FILE_PATTERNS) {
    if (match.test(filename)) return mapping;
  }
  return null;
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ──────────────────────────────────────────────────────────────────────────
// Build report
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  const client = getClient();

  // 1. Walk corpus per locale
  const corpus: Record<'en' | 'es' | 'ja', Map<string, { absPath: string; basename: string }>> = {
    en: walkLocale('en'),
    es: walkLocale('es'),
    ja: walkLocale('ja'),
  };

  // 2. Build the union of (relPath) across locales using EN as the spine.
  const fileRecords: FileRecord[] = [];
  for (const [rel, { absPath, basename }] of corpus.en) {
    const cityFolder = rel.split('/')[0];
    const citySlug = CITY_FOLDER_TO_SLUG[cityFolder];
    if (!citySlug) {
      console.error(`! unknown city folder: "${cityFolder}" — add to CITY_FOLDER_TO_SLUG`);
      continue;
    }
    const isPlacesToGo = rel.includes('/Places to Go/');
    const { h1, hasMeta } = parseMd(absPath);
    fileRecords.push({
      cityFolder,
      citySlug,
      relPath: rel,
      filename: basename,
      isPlacesToGo,
      exists: {
        en: corpus.en.has(rel),
        es: corpus.es.has(rel),
        ja: corpus.ja.has(rel),
      },
      h1Title: h1,
      hasMetaBlock: hasMeta,
    });
  }

  // 3. Pull existing Sanity state per city.
  const allSanityCities = await client.fetch<SanityCityRow[]>(`*[_type=="city" && !(_id in path("drafts.**"))]{
    _id,
    "slug": slug[_key=="en"][0].value.current,
    "hasOverview": count(overview[_key=="en"][0].value) > 0,
    "placesToGoCount": count(placesToGo)
  } | order(slug asc)`);
  const cityBySlug = new Map(allSanityCities.map((c) => [c.slug, c]));
  const citySlugsInCorpus = new Set(fileRecords.map((f) => f.citySlug));

  // 4. Pull all guideArticles whose EN slug contains a corpus city slug.
  // (Schema drift: city._ref is null on most, so we can't filter by it.)
  const allGuideArticles = await client.fetch<SanityGuideArticleRow[]>(`*[_type=="guideArticle" && !(_id in path("drafts.**"))]{
    _id,
    "slug": slug[_key=="en"][0].value.current,
    kind,
    section,
    "cityRef": city._ref
  }`);

  // Group guideArticles by city slug.
  // Priority: (1) explicit slug→city override (e.g. suez-canal-house in
  // Port Said); (2) document-ID prefix `guideArticle.<city>.*` (robust to
  // slugs that don't carry the city name, e.g. "the-temple-of-amada");
  // (3) longest city-slug substring on the article slug (fallback for
  // WP-imported docs with numeric IDs).
  const guideArticlesByCity = new Map<string, SanityGuideArticleRow[]>();
  for (const ga of allGuideArticles) {
    if (!ga.slug) continue;
    let bestCitySlug: string | null = SLUG_TO_CITY_OVERRIDES[ga.slug] ?? null;
    if (!bestCitySlug) {
      const idMatch = /^guideArticle\.([a-z0-9-]+)\./.exec(ga._id);
      if (idMatch && citySlugsInCorpus.has(idMatch[1])) bestCitySlug = idMatch[1];
    }
    if (!bestCitySlug) {
      let bestLen = 0;
      for (const slug of citySlugsInCorpus) {
        if (ga.slug.includes(slug) && slug.length > bestLen) {
          bestCitySlug = slug;
          bestLen = slug.length;
        }
      }
    }
    if (bestCitySlug) {
      if (!guideArticlesByCity.has(bestCitySlug)) guideArticlesByCity.set(bestCitySlug, []);
      guideArticlesByCity.get(bestCitySlug)!.push(ga);
    }
  }

  // Track which Sanity docs got matched, so orphans are the leftovers.
  const matchedSanityIds = new Set<string>();

  // 5. Build plans
  const plans: FilePlan[] = fileRecords.map((file) => {
    const notes: string[] = [];

    if (file.isPlacesToGo) {
      // Build a list of slug candidates from BOTH filename and H1, with the
      // leading "The/A/An" stripped. Try filename first — operators set
      // filenames deliberately to match URLs, whereas H1s may carry editorial
      // flourishes (e.g., filename "Hurghada Aquarium" + H1 "Hurghada Grand Aquarium").
      const fromFilename = slugifyTitle(file.filename.replace(/\.md$/, '').replace(/^(the|a|an)\s+/i, ''));
      const fromH1 = file.h1Title ? slugifyTitle(file.h1Title.replace(/^(the|a|an)\s+/i, '')) : null;
      const attractionSlug = fromFilename; // canonical for create/new
      // Per-city attraction override: filename (no .md, original case) → existing Sanity slug
      const filenameBare = file.filename.replace(/\.md$/, '').replace(/^(the|a|an)\s+/i, '');
      const attrOverride = ATTRACTION_OVERRIDES[file.citySlug]?.[filenameBare];
      const candidates: string[] = [];
      if (attrOverride) candidates.push(attrOverride);
      candidates.push(fromFilename);
      if (fromH1 && fromH1 !== fromFilename) candidates.push(fromH1);
      const pool = guideArticlesByCity.get(file.citySlug) ?? [];
      // Try exact match across all candidates first
      let existing: SanityGuideArticleRow | undefined;
      for (const cand of candidates) {
        existing = pool.find((g) => g.slug === cand);
        if (existing) break;
      }
      // Then suffix/prefix overlap across all candidates
      if (!existing) {
        for (const cand of candidates) {
          existing = pool.find((g) => g.slug && (g.slug.endsWith(`-${cand}`) || g.slug.startsWith(`${cand}-`)));
          if (existing) break;
        }
      }
      // Looser fallback: token overlap with both candidates
      if (!existing) {
        for (const cand of candidates) {
          const tokens = cand.split('-').filter((t) => t.length > 3);
          existing = pool.find((g) => g.slug && tokens.every((t) => g.slug.includes(t)) && g.kind === 'attraction');
          if (existing) break;
        }
      }
      let action: FilePlan['action'];
      if (existing) {
        matchedSanityIds.add(existing._id);
        if (existing.kind !== 'attraction' || existing.section !== 'places-to-go') {
          notes.push(`retag: kind=${existing.kind ?? '∅'}→attraction, section=${existing.section ?? '∅'}→places-to-go`);
          action = 'update-and-retag-guideArticle';
        } else {
          action = 'update-guideArticle';
        }
        if (existing.cityRef === null) notes.push('set city._ref (currently null)');
      } else {
        action = 'create-guideArticle';
      }
      return { file, attractionSlug, action, existingDoc: existing, notes };
    }

    const mapping = classifyFile(file.relPath);
    if (mapping === null) {
      return { file, action: 'unmapped', notes };
    }
    if (mapping === 'city-overview') {
      const cityDoc = cityBySlug.get(file.citySlug);
      if (cityDoc?.hasOverview) notes.push('existing city.overview will be REPLACED');
      return { file, mapping, action: 'update-city-overview', notes };
    }

    // Regular guideArticle file. Try each preferred slug; if any exists, match.
    // Per-city override takes precedence over the standard builder list.
    const override = SLUG_OVERRIDES[file.citySlug]?.[mapping.kind];
    const builderCandidates = mapping.slugBuilder(file.citySlug);
    const candidates = override ? [override, ...builderCandidates] : builderCandidates;
    const pool = guideArticlesByCity.get(file.citySlug) ?? [];
    let existing: SanityGuideArticleRow | undefined;
    for (const candidateSlug of candidates) {
      existing = pool.find((g) => g.slug === candidateSlug);
      if (existing) break;
    }

    let action: FilePlan['action'];
    if (existing) {
      matchedSanityIds.add(existing._id);
      const kindMismatch = existing.kind !== mapping.kind;
      const sectionMismatch = existing.section !== mapping.section;
      if (kindMismatch || sectionMismatch) {
        const bits: string[] = [];
        if (kindMismatch) bits.push(`kind=${existing.kind ?? '∅'}→${mapping.kind}`);
        if (sectionMismatch) bits.push(`section=${existing.section ?? '∅'}→${mapping.section}`);
        notes.push(`retag: ${bits.join(', ')}`);
        action = 'update-and-retag-guideArticle';
      } else {
        action = 'update-guideArticle';
      }
      if (existing.cityRef === null) notes.push('set city._ref (currently null)');
    } else {
      action = 'create-guideArticle';
      notes.push(`will create at slug=${candidates[0]}`);
    }
    return { file, mapping, action, existingDoc: existing, notes };
  });

  // 6. Orphans — Sanity guideArticles in corpus cities that no MD file claimed.
  const orphans: SanityGuideArticleRow[] = [];
  for (const [city, pool] of guideArticlesByCity) {
    if (!citySlugsInCorpus.has(city)) continue;
    for (const ga of pool) {
      if (!matchedSanityIds.has(ga._id)) orphans.push(ga);
    }
  }
  orphans.sort((a, b) => (a.slug ?? '').localeCompare(b.slug ?? ''));

  // 7. city._ref repair — every guideArticle the upload would touch that has cityRef=null
  const cityRefRepairCount = plans.filter((p) => p.existingDoc && p.existingDoc.cityRef === null).length;

  // 8. Write report
  writeReport(plans, orphans, allSanityCities, fileRecords, cityRefRepairCount);

  // 9. stdout summary
  const counts = countActions(plans);
  console.log('\n=== Guide MD Corpus Audit ===');
  console.log(`Corpus: ${fileRecords.length} unique files across ${citySlugsInCorpus.size} cities (en+es+ja each has its own copy)`);
  console.log(`Sanity cities: ${allSanityCities.length}`);
  console.log('');
  console.log('Actions:');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(34)} ${v}`);
  console.log('');
  // Classify orphans for the stdout summary
  const orphanBuckets: Record<string, number> = {};
  for (const o of orphans) {
    const b = classifyOrphan(o.slug ?? '', o.kind);
    orphanBuckets[b] = (orphanBuckets[b] ?? 0) + 1;
  }
  console.log(`Sanity orphans (no MD file claims them): ${orphans.length}`);
  for (const [b, n] of Object.entries(orphanBuckets)) console.log(`  ${b.padEnd(60)} ${n}`);
  console.log(`city._ref to set on update:              ${cityRefRepairCount}`);
  console.log(`Files with Meta SEO block:               ${fileRecords.filter((f) => f.hasMetaBlock).length}`);
  console.log(`Files with NO H1 title:                  ${fileRecords.filter((f) => !f.h1Title).length}`);
  console.log('');
  if (counts.unmapped > 0) {
    console.log(`!! ${counts.unmapped} unmapped file(s) — would HALT the upload run. See report.`);
  }
  console.log(`Full report: ${REPORT_PATH}`);
}

function countActions(plans: FilePlan[]): Record<string, number> {
  const c: Record<string, number> = {
    'update-city-overview': 0,
    'create-guideArticle': 0,
    'update-guideArticle': 0,
    'update-and-retag-guideArticle': 0,
    unmapped: 0,
  };
  for (const p of plans) c[p.action]++;
  return c;
}

function writeReport(
  plans: FilePlan[],
  orphans: SanityGuideArticleRow[],
  allSanityCities: SanityCityRow[],
  fileRecords: FileRecord[],
  cityRefRepairCount: number,
): void {
  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  push('# Guide MD Corpus Audit');
  push('');
  push(`Run: ${new Date().toISOString()}`);
  push(`Corpus root: \`${CORPUS_ROOT}\``);
  push('');

  // City mapping
  push('## City folder ↔ Sanity city mapping');
  push('');
  const citiesInCorpus = new Set(fileRecords.map((f) => f.citySlug));
  const sanityCitySlugs = new Set(allSanityCities.map((c) => c.slug));
  push('| Corpus folder | Sanity slug | Notes |');
  push('|---|---|---|');
  for (const [folder, slug] of Object.entries(CITY_FOLDER_TO_SLUG).sort()) {
    const inSanity = sanityCitySlugs.has(slug);
    const flag = !inSanity ? '⚠ slug not found in Sanity' : '';
    push(`| ${folder} | ${slug} | ${flag} |`);
  }
  push('');
  const missingInCorpus = [...sanityCitySlugs].filter((s) => !citiesInCorpus.has(s));
  if (missingInCorpus.length) {
    push(`**Sanity cities not in corpus:** ${missingInCorpus.join(', ')}`);
    push('');
  }

  // Unmapped (FATAL)
  const unmapped = plans.filter((p) => p.action === 'unmapped');
  if (unmapped.length) {
    push('## ⚠ Unmapped files (FATAL — upload would halt)');
    push('');
    for (const u of unmapped) push(`- \`${u.file.relPath}\``);
    push('');
  }

  // H1-missing (FATAL on upload — file is likely an editorial draft)
  const noH1 = fileRecords.filter((f) => !f.h1Title);
  if (noH1.length) {
    push('## ⚠ Files with no H1 title (FATAL — upload would skip these)');
    push('');
    push('These look like editorial drafts (working notes, no `# Heading` anywhere in the body). The upload should not touch them — finalize the content with a proper H1 before re-running.');
    push('');
    for (const f of noH1) push(`- \`${f.relPath}\``);
    push('');
  }

  // Per-city detail
  push('## Per-city plan');
  push('');
  const plansByCity = new Map<string, FilePlan[]>();
  for (const p of plans) {
    if (!plansByCity.has(p.file.citySlug)) plansByCity.set(p.file.citySlug, []);
    plansByCity.get(p.file.citySlug)!.push(p);
  }
  const sortedCities = [...plansByCity.keys()].sort();
  for (const city of sortedCities) {
    push(`### ${city}`);
    push('');
    push('| Action | Kind | File | Existing slug | Notes |');
    push('|---|---|---|---|---|');
    for (const p of plansByCity.get(city)!.sort((a, b) => a.file.relPath.localeCompare(b.file.relPath))) {
      const kind = p.mapping === 'city-overview'
        ? '(city.overview)'
        : p.file.isPlacesToGo
          ? 'attraction'
          : p.mapping?.kind ?? '∅';
      const existing = p.existingDoc?.slug ?? '—';
      const action = actionBadge(p.action);
      const file = p.file.relPath.replace(`${p.file.cityFolder}/`, '');
      const notes = p.notes.join('; ') || '';
      push(`| ${action} | ${kind} | \`${file}\` | \`${existing}\` | ${notes} |`);
    }
    push('');
  }

  // Orphans (classified into deferred-tour buckets vs. true "review me")
  push('## Sanity orphans (existing docs no MD file claims)');
  push('');
  const classified: Record<string, SanityGuideArticleRow[]> = {};
  for (const o of orphans) {
    const bucket = classifyOrphan(o.slug ?? '', o.kind);
    if (!classified[bucket]) classified[bucket] = [];
    classified[bucket].push(o);
  }
  const bucketOrder = [
    'Delete + redirect (operator-locked)',
    'Needs MD file authored (operator action)',
    'Keep as-is (operator decision)',
    'Type 2 (single tour — deferred to tour migration)',
    'Type 3 (tour category — deferred to tourCategory migration)',
    'Known-keep (hotel — deferred to hotel migration)',
    'Known-keep (ticket-prices overview — operator decision: keep)',
    'Review',
  ];
  if (orphans.length === 0) {
    push('_None._');
  } else {
    for (const bucket of bucketOrder) {
      const rows = classified[bucket];
      if (!rows || rows.length === 0) continue;
      push(`### ${bucket} — ${rows.length} doc(s)`);
      push('');
      push('| Slug | Kind | Section | _id |');
      push('|---|---|---|---|');
      for (const o of rows) {
        push(`| \`${o.slug}\` | ${o.kind ?? '∅'} | ${o.section ?? '∅'} | \`${o._id}\` |`);
      }
      push('');
    }
  }

  // Locale parity
  push('## Locale parity issues (en/es/ja triplet incomplete)');
  push('');
  const missingTriplets = fileRecords.filter((f) => !f.exists.en || !f.exists.es || !f.exists.ja);
  if (missingTriplets.length === 0) {
    push('_All files present in en + es + ja._');
  } else {
    push('| File | en | es | ja |');
    push('|---|---|---|---|');
    for (const f of missingTriplets) {
      push(`| \`${f.relPath}\` | ${f.exists.en ? '✓' : '✗'} | ${f.exists.es ? '✓' : '✗'} | ${f.exists.ja ? '✓' : '✗'} |`);
    }
  }
  push('');

  // Summary
  push('## Summary');
  push('');
  const counts = countActions(plans);
  push('| Action | Count |');
  push('|---|---:|');
  for (const [k, v] of Object.entries(counts)) push(`| ${k} | ${v} |`);
  push(`| Sanity orphans | ${orphans.length} |`);
  push(`| city._ref to set | ${cityRefRepairCount} |`);
  push(`| Files with Meta SEO block | ${fileRecords.filter((f) => f.hasMetaBlock).length} |`);
  push(`| Files with no H1 title | ${fileRecords.filter((f) => !f.h1Title).length} |`);
  push('');

  mkdirSync(resolve(process.cwd(), 'migration'), { recursive: true });
  writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
}

function actionBadge(a: FilePlan['action']): string {
  switch (a) {
    case 'update-city-overview': return '🟢 city.overview';
    case 'update-guideArticle': return '🔵 update';
    case 'update-and-retag-guideArticle': return '🟡 update+retag';
    case 'create-guideArticle': return '🟣 create';
    case 'unmapped': return '⛔ unmapped';
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
