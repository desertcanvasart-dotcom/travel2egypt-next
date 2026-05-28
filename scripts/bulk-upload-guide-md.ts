/**
 * Bulk upload — guide MD corpus → migration-staging.
 *
 * Reads the 668-file MD corpus at "/Users/islamhussein/Downloads/All 3 langs/"
 * and applies the reconciled plan from scripts/audit-guide-md-corpus.ts.
 *
 * Operates in three phases:
 *   B.1 — guideArticle writes (creates + updates, including kind/section retag)
 *   B.2 — city.overview replacement (41 cities × 3 locales)
 *   B.3 — supporting writes:
 *     • Type 2 single-tour docs: set `hidden: true` (sidebar suppression)
 *     • Known-keep hotels + ticket-prices: set `city._ref` (cleanup pass)
 *   C   — delete + redirect (6 orphans)
 *
 * Mechanics:
 *   • MD → HTML via `marked`, then HTML → PortableText via the existing
 *     `htmlToPortableText` converter (avoids divergent generator).
 *   • Each guideArticle write covers all 3 locales in one transaction
 *     (en/es/ja arrays built together for title/slug/summary/body).
 *   • SEO populated from the "Meta title:" / "Meta description:" block at
 *     the top of MD files when present (~554 of 668 files have it).
 *   • Existing-doc slug is preserved (URL-stable); only title/body/seo
 *     change on update. For creates, the canonical slug (slugBuilder[0])
 *     is used.
 *   • Idempotent: re-running with --commit produces no diff if data is
 *     already correct.
 *
 * Usage:
 *   npx tsx scripts/bulk-upload-guide-md.ts --dry-run [--phase=B1|B2|B3|C|all]
 *   npx tsx scripts/bulk-upload-guide-md.ts --commit  [--phase=B1|B2|B3|C|all]
 *
 * Default phase is `all` (B1 → B2 → B3 → C in sequence).
 *
 * Prereq: Studio redeployed with the new `kind: things-to-do` value and
 * `hidden: boolean` field on guideArticle (Phase A).
 *
 * Refuses to run against any dataset other than migration-staging.
 */
import { createClient, type SanityClient, type SanityDocument } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, readdirSync, statSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { marked } from 'marked';

import { htmlToPortableText } from './wp-import-html.js';

loadEnv();

// ──────────────────────────────────────────────────────────────────────────
// Config (kept in sync with audit-guide-md-corpus.ts)
// ──────────────────────────────────────────────────────────────────────────

const CORPUS_ROOT = '/Users/islamhussein/Downloads/All 3 langs';
const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');

// City folder → Sanity city slug. (Same map as the audit script.)
const CITY_FOLDER_TO_SLUG: Record<string, string> = {
  'ABU SIMBEL': 'abu-simbel', AKHMIM: 'akhmim', 'AL ARISH': 'al-arish',
  'AL FAYOUM': 'al-fayoum', 'AL GOUNA': 'al-gouna', 'AL QUSEIR': 'al-quseir',
  'AL WADI AL GADID': 'al-wadi-al-gadid', ASYUT: 'asyut', 'Al Minya': 'al-minya',
  Alexandria: 'alexandria', Aswan: 'aswan', BAHARIYA: 'bahariya-oasis',
  'BARIS OASIS': 'baris', 'Beni Suef': 'beni-suef', Cairo: 'cairo',
  DAHAB: 'dahab', Edfu: 'edfu', 'El Dakhla Oasis': 'dakhla-oasis', Esna: 'esna',
  'Farafra Oasis': 'farafra-oasis', Giza: 'giza', ISMAILIA: 'ismailia',
  'KHARGA OASIS': 'kharga-oasis', 'KOM OMBO': 'kom-ombo', 'MARSA ALAM': 'marsa-alam',
  'MARSA MATRUH': 'marsa-matruh', Nuweiba: 'nuweiba', 'Port Said': 'port-said',
  Qena: 'qena', 'Ras Sudr': 'ras-sudr', 'Rosetta Rasheed': 'rosetta-rasheed',
  'SAINTE CATHERINE': 'saint-catherine', 'SHARM EL-SHEIKH': 'sharm-el-sheikh',
  SOHAG: 'sohag', SUEZ: 'suez', Safaga: 'safaga', 'Siwa Oasis': 'siwa-oasis',
  TABA: 'taba', 'WADI AL-NATRON': 'wadi-el-natrun', hurghada: 'hurghada', luxor: 'luxor',
};

interface KindMapping {
  kind: string;
  section: string;
  slugBuilder: (citySlug: string) => string[];
  label: string;
}

const FILE_PATTERNS: Array<{ match: RegExp; mapping: KindMapping | 'city-overview' }> = [
  { match: /\btravel guide\b/i, mapping: 'city-overview' },
  { match: /^things to do( in .+)?\.md$/i, mapping: { kind: 'things-to-do', section: 'while-you-are-there', slugBuilder: (c) => [`things-to-do-in-${c}`, `activities-in-${c}`, `what-to-do-in-${c}`, `experiences-in-${c}`, `adventure-activities-in-${c}`, `${c}-unforgettable-moments`], label: 'Things to Do' } },
  { match: /^(.+ )?tours\.md$/i, mapping: { kind: 'tours', section: 'others', slugBuilder: (c) => [`tours-in-${c}`, `${c}-tours`, `${c}-guided-tours`, `best-${c}-tours`, `discover-${c}-with-tours`, `explore-${c}-tours`], label: 'Tours' } },
  { match: /^events?( in .+)?\.md$/i, mapping: { kind: 'events', section: 'others', slugBuilder: (c) => [`upcoming-events-in-${c}`, `events-in-${c}`, `${c}-events`, `annual-events-in-${c}`, `cultural-events-in-${c}`, `${c}-festivals-and-celebrations`], label: 'Events' } },
  { match: /^(.+ )?food( guide)?\.md$/i, mapping: { kind: 'food', section: 'while-you-are-there', slugBuilder: (c) => [`food-in-${c}`, `${c}-food-guide`, `${c}-food-and-drink`, `${c}-local-cuisine`, `${c}-restaurants`, `${c}-flavors`, `${c}-dining-experiences`, `eating-out-in-${c}`, `top-restaurants-in-${c}`, `traditional-food-in-${c}`, `what-to-eat-in-${c}`, `where-to-eat-in-${c}`], label: 'Food' } },
  { match: /^getting around( .+)?\.md$/i, mapping: { kind: 'transport-around', section: 'while-you-are-there', slugBuilder: (c) => [`getting-around-in-${c}`, `getting-around-${c}`, `getting-around-to-${c}`, `${c}-getting-around-guide`, `${c}-local-transport-guide`, `how-to-get-around-${c}`, `navigating-${c}`, `public-transport-in-${c}`], label: 'Getting Around' } },
  { match: /^(how to go|getting here|how to get to .+)\.md$/i, mapping: { kind: 'transport-to', section: 'plan-your-trip', slugBuilder: (c) => [`how-to-go-in-${c}`, `getting-here-in-${c}`, `how-to-get-to-${c}`, `how-to-go-to-${c}`, `how-to-reach-${c}`, `arrival-in-${c}`, `getting-to-${c}`, `${c}-arrival-guide`, `transport-to-${c}`, `travel-to-${c}`, `ways-to-get-to-${c}`], label: 'How to Go' } },
  { match: /^history( of .+)?\.md$/i, mapping: { kind: 'heritage', section: 'introducing', slugBuilder: (c) => [`${c}-historical-overview`, `${c}-history-overview`, `${c}-historical-guide`, `history-of-${c}`, `${c}-history`, `${c}-ancient-past`, `discover-${c}-history`, `past-and-present-${c}`, `story-of-${c}`], label: 'History' } },
  { match: /^only (here|in .+)\.md$/i, mapping: { kind: 'signature', section: 'others', slugBuilder: (c) => [`only-in-${c}`, `only-here-in-${c}`, `${c}-only-here`, `unique-sites-in-${c}`], label: 'Only Here' } },
  { match: /^unique sites\.md$/i, mapping: { kind: 'signature', section: 'others', slugBuilder: (c) => [`unique-sites-in-${c}`, `only-in-${c}`], label: 'Unique Sites (Signature)' } },
  { match: /^weather( in .+)?\.md$/i, mapping: { kind: 'climate', section: 'plan-your-trip', slugBuilder: (c) => [`weather-in-${c}`, `${c}-weather`, `${c}-weather-guide`, `${c}-weather-overview`, `${c}-weather-insights`, `${c}-travel-weather`, `${c}-seasonal-guide`, `${c}-climate`, `${c}-temperature-trends`, `when-to-explore-${c}`, `when-to-go-${c}`], label: 'Weather' } },
  { match: /^where to stay( in .+)?\.md$/i, mapping: { kind: 'accommodation', section: 'while-you-are-there', slugBuilder: (c) => [`top-hotels-in-${c}`, `where-to-stay-in-${c}`, `where-to-sleep-in-${c}`, `accommodation-options-${c}`, `accommodations-in-${c}`, `${c}-accommodation-guide`, `${c}-hotel-guide`, `${c}-hotels`, `hotels-in-${c}`, `lodging-in-${c}`, `best-places-to-stay-${c}`, `places-to-stay-in-${c}`, `stay-in-${c}`], label: 'Where to Stay' } },
];

const SLUG_OVERRIDES: Record<string, Partial<Record<string, string>>> = {
  'dakhla-oasis': { climate: 'when-to-explore-dakhla-oasis' },
};

const ATTRACTION_OVERRIDES: Record<string, Record<string, string>> = {
  edfu: { 'Temple of Horus': 'edfu-temple' },
};

const SLUG_TO_CITY_OVERRIDES: Record<string, string> = {
  'suez-canal-house': 'port-said',
};

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

const KNOWN_HOTELS = new Set([
  'al-tabuna-camp-el-dakhla-oasis',
  'dusit-thani-lake-view-cairo',
  'shamsiya-camp-dakhla-oasis',
  'the-pearl-of-red-sea-hurghada',
  'tropitel-naama-bay-sharm-el-sheikh',
]);

function isTicketPricesSlug(slug: string): boolean {
  return slug.startsWith('ticket-prices-for-attractions-in-');
}

// Delete + redirect cleanup (Phase C). Map from slug-to-delete to redirect target.
// Targets that start with `/` are absolute paths (hubs); otherwise they're slugs
// (mapped to /guide/<city>/<slug>).
const DELETE_AND_REDIRECT: Array<{ slug: string; redirectTo: string; targetCity?: string }> = [
  { slug: 'luxor-off-the-beaten-path', redirectTo: 'only-in-luxor', targetCity: 'luxor' },
  { slug: 'places-to-go-in-marsa-matruh', redirectTo: '/guide/marsa-matruh', targetCity: 'marsa-matruh' },
  { slug: 'places-to-go-in-safaga', redirectTo: '/guide/safaga', targetCity: 'safaga' },
  { slug: 'kharga-oasis-only-here', redirectTo: '/guide/kharga-oasis', targetCity: 'kharga-oasis' },
  { slug: 'annual-events-in-asyut', redirectTo: '/guide/asyut', targetCity: 'asyut' },
  // Note: `dakhla-oasis-seasonal-guide` was previously listed here but doesn't
  // exist in the dataset. The actual second climate doc for Dakhla is
  // `weather-in-dakhla-oasis`, which surfaces as an orphan because the slug
  // override sends Weather.md to `when-to-explore-dakhla-oasis`.
  { slug: 'weather-in-dakhla-oasis', redirectTo: 'when-to-explore-dakhla-oasis', targetCity: 'dakhla-oasis' },
];

// ──────────────────────────────────────────────────────────────────────────
// CLI / args
// ──────────────────────────────────────────────────────────────────────────

interface Args {
  commit: boolean;
  dryRun: boolean;
  phase: 'B1' | 'B2' | 'B3' | 'C' | 'all';
  limit: number | null;
}

function parseArgs(argv: string[]): Args {
  let commit = false;
  let dryRun = false;
  let phase: Args['phase'] = 'all';
  let limit: number | null = null;
  for (const arg of argv.slice(2)) {
    if (arg === '--commit') commit = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg.startsWith('--phase=')) {
      const p = arg.slice(8) as Args['phase'];
      if (!['B1', 'B2', 'B3', 'C', 'all'].includes(p)) die(`Unknown phase: ${p}`);
      phase = p;
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.slice(8), 10);
      if (!Number.isFinite(limit) || limit <= 0) die(`Invalid --limit value: ${arg}`);
    } else die(`Unknown argument: ${arg}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun, phase, limit };
}

function die(msg: string): never {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set in .env');
  if (dataset !== 'migration-staging') die(`Refusing to run against "${dataset}". migration-staging only.`);
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) die('SANITY_STAGING_API_WRITE_TOKEN must be set in .env');
  return createClient({
    projectId, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

// ──────────────────────────────────────────────────────────────────────────
// MD parsing + conversion
// ──────────────────────────────────────────────────────────────────────────

interface ParsedMd {
  metaTitle: string | null;
  metaDescription: string | null;
  h1: string | null;
  bodyMd: string; // markdown body (after stripping meta block + H1)
}

function parseMd(text: string): ParsedMd {
  let metaTitle: string | null = null;
  let metaDescription: string | null = null;
  let rest = text;
  // Strip Meta block at top if present
  const metaTitleMatch = /^Meta title:\s*(.+)$/m.exec(text.slice(0, 800));
  const metaDescMatch = /^Meta description:\s*(.+)$/m.exec(text.slice(0, 1200));
  if (metaTitleMatch) metaTitle = metaTitleMatch[1].trim();
  if (metaDescMatch) metaDescription = metaDescMatch[1].trim();
  // Remove the meta lines from the body before further parsing
  rest = rest.replace(/^Meta title:.*$/m, '').replace(/^Meta description:.*$/m, '');
  // Try H1 first (EN convention: "# Title"). Fall back to "**Title**" leading
  // bold paragraph (ES/JA convention) when no H1 is present.
  let h1: string | null = null;
  const h1Match = /^#\s+(.+)$/m.exec(rest);
  if (h1Match) {
    h1 = h1Match[1].trim();
    rest = rest.replace(h1Match[0], '');
  } else {
    // Bold-paragraph fallback: look for the FIRST non-empty line that's a
    // bold-wrapped paragraph and treat it as the title.
    const stripped = rest.replace(/^\s*\n+/, '');
    const boldMatch = /^\*\*([^*\n]+)\*\*\s*$/m.exec(stripped.split(/\n\n/)[0] ?? '');
    if (boldMatch) {
      h1 = boldMatch[1].trim();
      // Drop the matched bold paragraph from the body
      rest = stripped.replace(boldMatch[0], '');
    }
  }
  // Clean trailing italic Created/Updated footer
  rest = rest.replace(/\n\*Created:[^\n]*Updated:[^\n]*\*\s*$/m, '');
  // Trim
  rest = rest.replace(/^\s*\n+/, '').trimEnd();
  return { metaTitle, metaDescription, h1, bodyMd: rest };
}

interface PortableBlock {
  _key: string;
  _type: string;
  [k: string]: unknown;
}

function mdToPortableText(md: string): PortableBlock[] {
  if (!md.trim()) return [];
  // marked is synchronous when no async extensions are registered
  const html = marked.parse(md, { async: false }) as string;
  const result = htmlToPortableText(html);
  return result.blocks as PortableBlock[];
}

// ──────────────────────────────────────────────────────────────────────────
// File walking — per-locale, paired by relpath
// ──────────────────────────────────────────────────────────────────────────

interface FileTriple {
  cityFolder: string;
  citySlug: string;
  relPath: string; // canonical EN-spine relpath
  filename: string;
  isPlacesToGo: boolean;
  paths: Record<Locale, string | null>; // absolute paths per locale (null if missing)
}

function walkLocale(locale: Locale): Map<string, { absPath: string; basename: string }> {
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
        out.set(`${cityFolder}/${entry}`, { absPath: abs, basename: entry.trim() });
      } else if (s.isDirectory() && entry.toLowerCase() === 'places to go') {
        for (const place of readdirSync(abs)) {
          if (!place.endsWith('.md')) continue;
          out.set(`${cityFolder}/Places to Go/${place}`, { absPath: join(abs, place), basename: place.trim() });
        }
      }
    }
  }
  return out;
}

function buildFileTriples(): FileTriple[] {
  const byLocale: Record<Locale, Map<string, { absPath: string; basename: string }>> = {
    en: walkLocale('en'),
    es: walkLocale('es'),
    ja: walkLocale('ja'),
  };
  const triples: FileTriple[] = [];
  for (const [rel, { absPath, basename }] of byLocale.en) {
    const cityFolder = rel.split('/')[0];
    const citySlug = CITY_FOLDER_TO_SLUG[cityFolder];
    if (!citySlug) {
      console.error(`! unknown city folder "${cityFolder}" — skipping`);
      continue;
    }
    triples.push({
      cityFolder, citySlug,
      relPath: rel,
      filename: basename,
      isPlacesToGo: rel.includes('/Places to Go/'),
      paths: {
        en: absPath,
        es: byLocale.es.get(rel)?.absPath ?? null,
        ja: byLocale.ja.get(rel)?.absPath ?? null,
      },
    });
  }
  return triples;
}

// ──────────────────────────────────────────────────────────────────────────
// Classification (same logic as audit)
// ──────────────────────────────────────────────────────────────────────────

function classifyFile(filename: string): KindMapping | 'city-overview' | null {
  for (const { match, mapping } of FILE_PATTERNS) {
    if (match.test(filename)) return mapping;
  }
  return null;
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase().normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ──────────────────────────────────────────────────────────────────────────
// Sanity-side data fetched once at startup
// ──────────────────────────────────────────────────────────────────────────

interface CityRow {
  _id: string;
  slug: string;
}

interface GuideArticleRow {
  _id: string;
  slug: string;
  kind: string | null;
  section: string | null;
  cityRef: string | null;
}

async function loadSanityState(client: SanityClient): Promise<{
  cities: Map<string, CityRow>;
  guideArticles: GuideArticleRow[];
  byCity: Map<string, GuideArticleRow[]>;
}> {
  const cities = await client.fetch<CityRow[]>(
    `*[_type=="city" && !(_id in path("drafts.**"))]{ _id, "slug": slug[_key=="en"][0].value.current }`
  );
  const guideArticles = await client.fetch<GuideArticleRow[]>(
    `*[_type=="guideArticle" && !(_id in path("drafts.**"))]{ _id, "slug": slug[_key=="en"][0].value.current, kind, section, "cityRef": parentCity._ref }`
  );
  const citySlugs = new Set(cities.map((c) => c.slug));
  const byCity = new Map<string, GuideArticleRow[]>();
  for (const ga of guideArticles) {
    if (!ga.slug) continue;
    let cityKey: string | null = SLUG_TO_CITY_OVERRIDES[ga.slug] ?? null;
    // Prefer document-ID pattern `guideArticle.<city>.*` — robust against
    // slugs that don't contain the city name (e.g. "the-temple-of-amada"
    // in abu-simbel). Previous heuristic missed these and caused the
    // May-2026 duplicate-create bug.
    if (!cityKey) {
      const idMatch = /^guideArticle\.([a-z0-9-]+)\./.exec(ga._id);
      if (idMatch && citySlugs.has(idMatch[1])) cityKey = idMatch[1];
    }
    if (!cityKey) {
      // Fallback: longest city-slug substring of the article slug.
      let bestLen = 0;
      for (const s of citySlugs) {
        if (ga.slug.includes(s) && s.length > bestLen) { cityKey = s; bestLen = s.length; }
      }
    }
    if (cityKey) {
      if (!byCity.has(cityKey)) byCity.set(cityKey, []);
      byCity.get(cityKey)!.push(ga);
    }
  }
  return { cities: new Map(cities.map((c) => [c.slug, c])), guideArticles, byCity };
}

// ──────────────────────────────────────────────────────────────────────────
// Logging
// ──────────────────────────────────────────────────────────────────────────

function appendLog(entry: Record<string, unknown>): void {
  mkdirSync(resolve(process.cwd(), 'migration'), { recursive: true });
  appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

// ──────────────────────────────────────────────────────────────────────────
// Phase B.1 — guideArticle writes
// ──────────────────────────────────────────────────────────────────────────

interface DocPlan {
  action: 'create' | 'update' | 'update-retag';
  targetId: string;
  targetSlug: string;
  citySlug: string;
  cityRef: string;
  kind: string;
  section: string;
  needsCityRefSet: boolean;
  needsRetag: { kind?: string; section?: string };
  byLocale: Record<Locale, ParsedMd | null>;
  isPlacesToGo: boolean;
  relPath: string;
}

function planForGuideArticleFile(
  triple: FileTriple,
  parsed: Record<Locale, ParsedMd | null>,
  state: { cities: Map<string, CityRow>; byCity: Map<string, GuideArticleRow[]> },
): DocPlan | null {
  const cityDoc = state.cities.get(triple.citySlug);
  if (!cityDoc) {
    console.error(`! city doc missing for slug=${triple.citySlug} (file ${triple.relPath}) — skipping`);
    return null;
  }
  const pool = state.byCity.get(triple.citySlug) ?? [];

  if (triple.isPlacesToGo) {
    const filenameBare = triple.filename.replace(/\.md$/, '').replace(/^(the|a|an)\s+/i, '');
    const attrOverride = ATTRACTION_OVERRIDES[triple.citySlug]?.[filenameBare];
    const fromFilename = slugifyTitle(filenameBare);
    const h1 = parsed.en?.h1 ?? null;
    const fromH1 = h1 ? slugifyTitle(h1.replace(/^(the|a|an)\s+/i, '')) : null;
    const candidates: string[] = [];
    if (attrOverride) candidates.push(attrOverride);
    candidates.push(fromFilename);
    if (fromH1 && fromH1 !== fromFilename) candidates.push(fromH1);

    let existing: GuideArticleRow | undefined;
    for (const c of candidates) {
      existing = pool.find((g) => g.slug === c);
      if (existing) break;
    }
    if (!existing) {
      for (const c of candidates) {
        existing = pool.find((g) => g.slug && (g.slug.endsWith(`-${c}`) || g.slug.startsWith(`${c}-`)));
        if (existing) break;
      }
    }
    if (!existing && fromH1) {
      const tokens = fromH1.split('-').filter((t) => t.length > 3);
      existing = pool.find((g) => g.slug && tokens.every((t) => g.slug.includes(t)) && g.kind === 'attraction');
    }

    const targetSlug = existing?.slug ?? fromFilename;
    const targetId = existing?._id ?? `guideArticle.${triple.citySlug}.${targetSlug}`;
    const retag: DocPlan['needsRetag'] = {};
    if (existing && existing.kind !== 'attraction') retag.kind = 'attraction';
    if (existing && existing.section !== 'places-to-go') retag.section = 'places-to-go';
    return {
      action: existing ? (Object.keys(retag).length ? 'update-retag' : 'update') : 'create',
      targetId, targetSlug, citySlug: triple.citySlug, cityRef: cityDoc._id,
      kind: 'attraction', section: 'places-to-go',
      needsCityRefSet: existing ? existing.cityRef === null : true,
      needsRetag: retag, byLocale: parsed,
      isPlacesToGo: true, relPath: triple.relPath,
    };
  }

  const mapping = classifyFile(triple.filename);
  if (!mapping || mapping === 'city-overview') return null;

  const override = SLUG_OVERRIDES[triple.citySlug]?.[mapping.kind];
  const builderCandidates = mapping.slugBuilder(triple.citySlug);
  const candidates = override ? [override, ...builderCandidates] : builderCandidates;
  let existing: GuideArticleRow | undefined;
  for (const c of candidates) {
    existing = pool.find((g) => g.slug === c);
    if (existing) break;
  }

  const canonicalSlug = override ?? builderCandidates[0];
  const targetSlug = existing?.slug ?? canonicalSlug;
  const targetId = existing?._id ?? `guideArticle.${triple.citySlug}.${canonicalSlug}`;
  const retag: DocPlan['needsRetag'] = {};
  if (existing && existing.kind !== mapping.kind) retag.kind = mapping.kind;
  if (existing && existing.section !== mapping.section) retag.section = mapping.section;
  return {
    action: existing ? (Object.keys(retag).length ? 'update-retag' : 'update') : 'create',
    targetId, targetSlug, citySlug: triple.citySlug, cityRef: cityDoc._id,
    kind: mapping.kind, section: mapping.section,
    needsCityRefSet: existing ? existing.cityRef === null : true,
    needsRetag: retag, byLocale: parsed,
    isPlacesToGo: false, relPath: triple.relPath,
  };
}

function buildLocalized<T>(plan: DocPlan, build: (md: ParsedMd) => T | null): Array<{ _key: string; value: T }> {
  const out: Array<{ _key: string; value: T }> = [];
  for (const loc of LOCALES) {
    const md = plan.byLocale[loc];
    if (!md) continue;
    const v = build(md);
    if (v === null || v === undefined) continue;
    out.push({ _key: loc, value: v });
  }
  return out;
}

interface SanityWritePayload {
  _id: string;
  _type: 'guideArticle';
  parentCity: { _type: 'reference'; _ref: string };
  kind: string;
  section: string;
  hidden?: boolean;
  title: Array<{ _key: string; value: string }>;
  slug: Array<{ _key: string; value: { _type: 'slug'; current: string } }>;
  summary?: Array<{ _key: string; value: string }>;
  body?: Array<{ _key: string; _type: 'object'; value: PortableBlock[] }>;
  seo?: {
    title?: Array<{ _key: string; value: string }>;
    description?: Array<{ _key: string; value: string }>;
  };
}

function buildPayload(plan: DocPlan): SanityWritePayload {
  const title = buildLocalized(plan, (md) => md.h1 ?? null);
  const slug = LOCALES.map((loc) => ({ _key: loc, value: { _type: 'slug' as const, current: plan.targetSlug } }));
  // Summary: first non-empty paragraph from the body (a single sentence-ish blurb)
  const summary = buildLocalized(plan, (md) => {
    const firstPara = md.bodyMd.split(/\n\n+/).find((p) => p.trim().length > 0 && !p.startsWith('#'));
    if (!firstPara) return null;
    // Keep summary short: max ~250 chars to one sentence boundary
    const trimmed = firstPara.replace(/\s+/g, ' ').trim();
    if (trimmed.length <= 280) return trimmed;
    const cut = trimmed.slice(0, 280);
    const lastDot = cut.lastIndexOf('.');
    return (lastDot > 100 ? cut.slice(0, lastDot + 1) : cut + '…');
  });
  const body = buildLocalized(plan, (md) => mdToPortableText(md.bodyMd));
  // SEO from Meta block when present (EN only requires it; other locales optional)
  const seoTitles = buildLocalized(plan, (md) => md.metaTitle ?? null);
  const seoDescs = buildLocalized(plan, (md) => md.metaDescription ?? null);
  const seo: SanityWritePayload['seo'] | undefined =
    seoTitles.length || seoDescs.length
      ? { ...(seoTitles.length ? { title: seoTitles } : {}), ...(seoDescs.length ? { description: seoDescs } : {}) }
      : undefined;

  const payload: SanityWritePayload = {
    _id: plan.targetId,
    _type: 'guideArticle',
    parentCity: { _type: 'reference', _ref: plan.cityRef },
    kind: plan.kind,
    section: plan.section,
    title,
    slug,
    summary,
    body: body.map((b) => ({ _key: b._key, _type: 'object', value: b.value })),
  };
  if (seo) payload.seo = seo;
  return payload;
}

async function runPhaseB1(client: SanityClient, args: Args, state: Awaited<ReturnType<typeof loadSanityState>>) {
  console.log('\n=== Phase B.1 — guideArticle writes ===\n');
  const triples = buildFileTriples();
  const plans: DocPlan[] = [];
  for (const t of triples) {
    const parsed: Record<Locale, ParsedMd | null> = { en: null, es: null, ja: null };
    for (const loc of LOCALES) {
      const p = t.paths[loc];
      if (p) {
        try { parsed[loc] = parseMd(readFileSync(p, 'utf8')); } catch (e) { console.error(`! parse failed ${p}: ${(e as Error).message}`); }
      }
    }
    // Skip files with no H1 in EN — they're editorial drafts
    if (!parsed.en?.h1) continue;
    const plan = planForGuideArticleFile(t, parsed, state);
    if (plan) plans.push(plan);
  }

  const stats = { create: 0, update: 0, retag: 0, cityRefRepair: 0 };
  for (const p of plans) {
    stats[p.action === 'create' ? 'create' : p.action === 'update-retag' ? 'retag' : 'update']++;
    if (p.needsCityRefSet) stats.cityRefRepair++;
  }
  console.log(`Plans: ${plans.length} total — create=${stats.create}, update=${stats.update}, update+retag=${stats.retag}, city._ref repairs=${stats.cityRefRepair}`);

  // Apply --limit if set (controlled first-batch verification)
  const activePlans = args.limit ? plans.slice(0, args.limit) : plans;
  if (args.limit) console.log(`(--limit=${args.limit} active: writing first ${activePlans.length} plans only)`);

  if (args.dryRun) {
    console.log('\nDry-run sample (first 5 plans):\n');
    for (const p of plans.slice(0, 5)) {
      const payload = buildPayload(p);
      console.log(`  ${p.action.padEnd(13)} ${p.relPath}`);
      console.log(`    → _id: ${p.targetId}`);
      console.log(`    → slug: ${p.targetSlug}`);
      console.log(`    → title.en: "${payload.title.find((t) => t._key === 'en')?.value ?? '∅'}"`);
      if (p.needsRetag.kind || p.needsRetag.section) {
        console.log(`    → retag: ${JSON.stringify(p.needsRetag)}`);
      }
      console.log('');
    }
    return;
  }

  // COMMIT — batch in transactions of 25 docs
  const BATCH = 25;
  let written = 0;
  for (let i = 0; i < activePlans.length; i += BATCH) {
    const batch = activePlans.slice(i, i + BATCH);
    let tx = client.transaction();
    for (const p of batch) {
      tx = tx.createOrReplace(buildPayload(p) as unknown as SanityDocument);
    }
    try {
      await tx.commit({ visibility: 'async' });
      written += batch.length;
      console.log(`  ✓ wrote ${written}/${activePlans.length}`);
      for (const p of batch) appendLog({ phase: 'B1', action: p.action, _id: p.targetId, slug: p.targetSlug });
    } catch (err) {
      console.error(`  ✗ batch starting at ${i} failed: ${(err as Error).message}`);
      for (const p of batch) appendLog({ phase: 'B1', action: 'FAILED', _id: p.targetId, slug: p.targetSlug, error: (err as Error).message });
      throw err;
    }
  }
  console.log(`\nPhase B.1 done. Wrote ${written} guideArticle docs.`);
}

// ──────────────────────────────────────────────────────────────────────────
// Phase B.2 — city.overview replacement
// ──────────────────────────────────────────────────────────────────────────

async function runPhaseB2(client: SanityClient, args: Args, state: Awaited<ReturnType<typeof loadSanityState>>) {
  console.log('\n=== Phase B.2 — city.overview replacement ===\n');
  const triples = buildFileTriples().filter((t) => !t.isPlacesToGo && classifyFile(t.filename) === 'city-overview');

  const writes: Array<{ cityId: string; citySlug: string; overview: SanityWritePayload['body']; relPath: string }> = [];
  for (const t of triples) {
    const cityDoc = state.cities.get(t.citySlug);
    if (!cityDoc) { console.error(`! city missing: ${t.citySlug}`); continue; }
    const overviewArr: SanityWritePayload['body'] = [];
    for (const loc of LOCALES) {
      const p = t.paths[loc];
      if (!p) continue;
      const md = parseMd(readFileSync(p, 'utf8'));
      const blocks = mdToPortableText(md.bodyMd);
      overviewArr!.push({ _key: loc, _type: 'object', value: blocks });
    }
    writes.push({ cityId: cityDoc._id, citySlug: t.citySlug, overview: overviewArr, relPath: t.relPath });
  }
  console.log(`Plans: ${writes.length} city.overview replacements`);

  if (args.dryRun) {
    console.log('\nDry-run sample (first 3):');
    for (const w of writes.slice(0, 3)) {
      console.log(`  ${w.citySlug}  ← ${w.relPath}`);
      console.log(`    locales present: ${w.overview!.map((b) => b._key).join(', ')}`);
      console.log(`    block counts: ${w.overview!.map((b) => `${b._key}=${(b.value as PortableBlock[]).length}`).join(', ')}`);
    }
    return;
  }

  const BATCH = 10;
  let written = 0;
  for (let i = 0; i < writes.length; i += BATCH) {
    const batch = writes.slice(i, i + BATCH);
    let tx = client.transaction();
    for (const w of batch) {
      tx = tx.patch(w.cityId, (p) => p.set({ overview: w.overview }));
    }
    try {
      await tx.commit({ visibility: 'async' });
      written += batch.length;
      console.log(`  ✓ ${written}/${writes.length}`);
      for (const w of batch) appendLog({ phase: 'B2', action: 'city-overview', _id: w.cityId, citySlug: w.citySlug });
    } catch (err) {
      console.error(`  ✗ batch starting at ${i} failed: ${(err as Error).message}`);
      throw err;
    }
  }
  console.log(`\nPhase B.2 done. Wrote ${written} city.overview replacements.`);
}

// ──────────────────────────────────────────────────────────────────────────
// Phase B.3 — Type 2 hidden + known-keep city._ref repair
// ──────────────────────────────────────────────────────────────────────────

async function runPhaseB3(client: SanityClient, args: Args, state: Awaited<ReturnType<typeof loadSanityState>>) {
  console.log('\n=== Phase B.3 — Type 2 hidden + known-keep city._ref repair ===\n');

  // Type 2: set hidden=true on the 16 single-tour docs
  const type2Patches: Array<{ _id: string; slug: string }> = [];
  for (const ga of state.guideArticles) {
    if (TYPE_2_SINGLE_TOURS.has(ga.slug)) {
      type2Patches.push({ _id: ga._id, slug: ga.slug });
    }
  }

  // Known-keep city._ref repair: hotels + ticket-prices that have null cityRef
  const keepCityRefRepairs: Array<{ _id: string; slug: string; cityRef: string }> = [];
  for (const ga of state.guideArticles) {
    if (ga.cityRef !== null) continue; // already set
    if (KNOWN_HOTELS.has(ga.slug) || isTicketPricesSlug(ga.slug)) {
      // Resolve city from slug → SLUG_TO_CITY_OVERRIDES first, then longest-substring
      let cityKey = SLUG_TO_CITY_OVERRIDES[ga.slug] ?? null;
      if (!cityKey) {
        let bestLen = 0;
        for (const s of state.cities.keys()) {
          if (ga.slug.includes(s) && s.length > bestLen) { cityKey = s; bestLen = s.length; }
        }
      }
      const cityDoc = cityKey ? state.cities.get(cityKey) : null;
      if (cityDoc) keepCityRefRepairs.push({ _id: ga._id, slug: ga.slug, cityRef: cityDoc._id });
    }
  }

  console.log(`Type 2 hidden flag:  ${type2Patches.length} docs`);
  console.log(`city._ref repairs:    ${keepCityRefRepairs.length} (hotels + ticket-prices)`);

  if (args.dryRun) return;

  if (type2Patches.length) {
    let tx = client.transaction();
    for (const p of type2Patches) tx = tx.patch(p._id, (pp) => pp.set({ hidden: true }));
    await tx.commit({ visibility: 'sync' });
    for (const p of type2Patches) appendLog({ phase: 'B3', action: 'hidden=true', _id: p._id, slug: p.slug });
    console.log(`  ✓ Set hidden=true on ${type2Patches.length} docs`);
  }
  if (keepCityRefRepairs.length) {
    let tx = client.transaction();
    for (const r of keepCityRefRepairs) {
      tx = tx.patch(r._id, (pp) => pp.set({ parentCity: { _type: 'reference', _ref: r.cityRef } }));
    }
    await tx.commit({ visibility: 'sync' });
    for (const r of keepCityRefRepairs) appendLog({ phase: 'B3', action: 'city._ref', _id: r._id, slug: r.slug, cityRef: r.cityRef });
    console.log(`  ✓ Set parentCity._ref on ${keepCityRefRepairs.length} known-keep docs`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Phase C — delete + redirect
// ──────────────────────────────────────────────────────────────────────────

async function runPhaseC(client: SanityClient, args: Args, state: Awaited<ReturnType<typeof loadSanityState>>) {
  console.log('\n=== Phase C — delete + redirect ===\n');

  const slugToDoc = new Map<string, GuideArticleRow>();
  for (const ga of state.guideArticles) if (ga.slug) slugToDoc.set(ga.slug, ga);

  const toDelete: Array<{ doc: GuideArticleRow; redirectTo: string; targetCity: string }> = [];
  for (const { slug, redirectTo, targetCity } of DELETE_AND_REDIRECT) {
    const doc = slugToDoc.get(slug);
    if (!doc) { console.log(`  - skip ${slug} (already deleted or never existed)`); continue; }
    toDelete.push({ doc, redirectTo, targetCity: targetCity ?? '' });
  }
  console.log(`Pending deletes: ${toDelete.length}`);

  // Build redirect CSV rows (3 locales × N deletions)
  const redirectRows: string[] = [];
  for (const { doc, redirectTo, targetCity } of toDelete) {
    for (const loc of LOCALES) {
      // Source path: /<loc>/guide/<city>/<slug>  (or just / if locale is en/default)
      const localePrefix = loc === 'en' ? '' : `/${loc}`;
      const sourcePath = `${localePrefix}/guide/${targetCity}/${doc.slug}`;
      const targetPath = redirectTo.startsWith('/')
        ? `${localePrefix}${redirectTo}`
        : `${localePrefix}/guide/${targetCity}/${redirectTo}`;
      redirectRows.push(`${sourcePath},${targetPath},301`);
    }
  }
  console.log(`Redirect rows to append: ${redirectRows.length}`);

  if (args.dryRun) {
    console.log('\nDry-run sample redirects:');
    for (const r of redirectRows.slice(0, 6)) console.log(`  ${r}`);
    return;
  }

  // Append redirect rows
  if (redirectRows.length) {
    appendFileSync(REDIRECT_CSV_PATH, '\n' + redirectRows.join('\n') + '\n', 'utf8');
    console.log(`  ✓ Appended ${redirectRows.length} redirect rows`);
  }

  // Delete docs
  if (toDelete.length) {
    let tx = client.transaction();
    for (const { doc } of toDelete) tx = tx.delete(doc._id);
    await tx.commit({ visibility: 'sync' });
    for (const { doc, redirectTo } of toDelete) appendLog({ phase: 'C', action: 'delete', _id: doc._id, slug: doc.slug, redirectTo });
    console.log(`  ✓ Deleted ${toDelete.length} docs`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Bulk upload — guide MD corpus ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}   phase: ${args.phase}`);

  const client = getClient();
  console.log('\nLoading current Sanity state…');
  const state = await loadSanityState(client);
  console.log(`  ${state.cities.size} cities, ${state.guideArticles.length} guideArticles`);

  const phases = args.phase === 'all' ? (['B1', 'B2', 'B3', 'C'] as const) : ([args.phase] as const);
  for (const p of phases) {
    if (p === 'B1') await runPhaseB1(client, args, state);
    else if (p === 'B2') await runPhaseB2(client, args, state);
    else if (p === 'B3') await runPhaseB3(client, args, state);
    else if (p === 'C') await runPhaseC(client, args, state);
  }

  console.log(`\n${args.commit ? '✓ committed' : 'dry-run complete'} — log: ${LOG_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
