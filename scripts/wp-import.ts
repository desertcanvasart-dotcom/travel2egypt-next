/**
 * WordPress → Sanity importer (entry point).
 *
 * Run: `npm run wp-import -- [flags]` (see migration/MIGRATION_MAPPING.md §13).
 *
 * High-level flow for `--phase=import`:
 *   1. Load env (loud failure if anything missing or dataset != migration-staging).
 *   2. Read SEO CSVs to build a priority index.
 *   3. Enumerate WP entities (posts/pages/categories) per --type filter,
 *      paginated, EN-locale via authenticated WP REST.
 *   4. For each EN entity: run classifier, decide skip-or-import, fetch
 *      hreflang to assemble the locale group, fetch ES/JA full bodies, run
 *      the appropriate mapper, write to Sanity (or just-log under --dry-run).
 *   5. Reconcile city.placesToGo references against imported wikiMonuments.
 *   6. Build redirect-map.csv from accumulated entries + historic URLs.
 *   7. Write migration-summary.md.
 *
 * For `--phase=relink`:
 *   1. Load env.
 *   2. Walk Sanity for documents with pending internal-link refs, resolve
 *      against Sanity by migration.wpUrl, patch.
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SanityClient } from '@sanity/client';

import { classifyPageBySlug, type PageType } from './wp-classifier.js';
import { loadEnv } from './wp-import/env.js';
import { WpClient, WordfenceHaltError } from './wp-import/wp-client.js';
import { makeSanityClient, findCityByEnSlug } from './wp-import/sanity.js';
import { getMissingAttachments, getUploadExhausted } from './wp-import/media.js';
import { getAmbiguousMediaMatches } from './wp-import/mappers/_shared.js';
import { applyCityMerge } from './wp-import/merge.js';
import { getHreflangMap } from './wp-import/hreflang.js';
import { mapArticle } from './wp-import/mappers/article.js';
import { mapCity } from './wp-import/mappers/city.js';
import { mapGuideArticle } from './wp-import/mappers/guideArticle.js';
import { mapWikiMonument } from './wp-import/mappers/wikiMonument.js';
import { mapTour } from './wp-import/mappers/tour.js';
import { mapHotel } from './wp-import/mappers/hotel.js';
import { mapNileCruise } from './wp-import/mappers/nileCruise.js';
import { mapEditorialCategory } from './wp-import/mappers/editorialCategory.js';
import { mapServiceStub } from './wp-import/mappers/serviceStub.js';
import { runRelinkPhase } from './wp-import/relink.js';
import { buildRedirectMap, buildPriorityIndex, writeRedirectMap } from './wp-import/redirect-map.js';
import { emptyStats, logEvent, logToStderr, writeSummary, type MigrationStats } from './wp-import/log.js';
import type {
  CliOptions,
  HreflangMap,
  Locale,
  LocaleGroup,
  MapperResult,
  RedirectEntry,
  ReviewFlag,
  SanityDoc,
  WpEntityFull,
  WpEntityLite,
} from './wp-import/types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- CLI parsing -----------------------------------------------

function parseCli(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dryRun: false,
    type: 'all',
    language: 'all',
    continueOnError: false,
    verbose: false,
    phase: 'import',
    includeJunk: false,
    rescrapeHreflang: false,
    rate: 4,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--dry-run': opts.dryRun = true; break;
      case '--limit': opts.limit = Number(next()); break;
      case '--type': opts.type = next() as CliOptions['type']; break;
      case '--filter-by-template': opts.filterByTemplate = next() as PageType; break;
      case '--slug-pattern': opts.slugPattern = next(); break;
      case '--slug-exclude': opts.slugExclude = next(); break;
      case '--slug-include': opts.slugInclude = next(); break;
      case '--dry-run-diff-only': opts.dryRunDiffOnly = true; break;
      case '--adversarial': opts.adversarial = true; break;
      case '--since': opts.since = next(); break;
      case '--language': opts.language = next() as CliOptions['language']; break;
      case '--continue-on-error': opts.continueOnError = true; break;
      case '--verbose': opts.verbose = true; break;
      case '--phase': opts.phase = next() as CliOptions['phase']; break;
      case '--include-junk': opts.includeJunk = true; break;
      case '--rescrape-hreflang': opts.rescrapeHreflang = true; break;
      case '--rate': opts.rate = Number(next()); break;
      case '-h':
      case '--help': printHelp(); process.exit(0);
      default:
        process.stderr.write(`Unknown flag: ${a}\n`);
        printHelp();
        process.exit(2);
    }
  }
  return opts;
}

function printHelp(): void {
  process.stderr.write(`
Usage: npm run wp-import -- [flags]

Flags:
  --dry-run                   Preview mode; no Sanity writes, no media uploads.
  --limit N                   Process at most N entities.
  --type <kind>               post | page | attachment | category | all
  --filter-by-template <T>    destination-hub | destination-subpage | monument |
                              tour-or-package | hotel | nile-cruise |
                              service-or-utility | article | unclassified
  --slug-pattern <glob>       Optional slug filter combining with --filter-by-template.
                              Single \`*\` wildcard at start, end, or both. Examples:
                              \`*-travel-guide\` (suffix), \`reaching-*\` (prefix),
                              \`*-egypt-*\` (contains), \`exact-slug\` (exact).
  --slug-exclude <list>       Comma-separated glob-lite patterns to EXCLUDE.
                              Same grammar as --slug-pattern. Page is excluded
                              if it matches any pattern. Example:
                              \`egypt-travel-guide,*-archive\`.
  --slug-include <list>       Comma-separated EXACT slug list (no globbing).
                              When set, replaces --slug-pattern entirely
                              (override warning emitted if both supplied).
                              Use to write a deterministic specific set:
                              \`cairo-travel-guide,luxor-travel-guide,...\`.
  --dry-run-diff-only         Run city safety-net diff infrastructure with NO
                              Sanity writes. Emits per-locale diffs + references
                              report + fingerprint summary to migration/.diffs/.
                              Required for city UPDATE work (session 5+).
  --adversarial               With --dry-run-diff-only: pick 5-sample adversarially
                              (cairo + oldest/newest/longest/shortest body).
  --since YYYY-MM-DD          Only entities modified on/after this date.
  --language en|es|ja|all     Locale filter (default: all).
  --continue-on-error         Log errors and continue.
  --verbose                   Verbose stderr output.
  --phase import|relink       Default: import.
  --include-junk              Write stubs for skip-listed entries.
  --rescrape-hreflang         Invalidate hreflang cache.
  --rate N                    Override read pace (req/sec). Default 4.
`);
}

// ---------- Skip rules -------------------------------------------------

const SKIP_SLUGS = new Set([
  // persona-or-system explicit skips
  'home', 'home-2', 'about', 'about-us', 'contact', 'contact-us',
  'tailored-tours', 'plan-your-trip', 'plan-your-tour',
  'just-me', 'me-and-my-partner', 'families-with-kids', 'friends-private-group',
  'privacy-policy', 'terms-of-service', 'terms-and-conditions', 'cookie-policy',
  'cookie-notice', 'terms-conditions', 'sitemap', 'thank-you', 'testing',
  'blog', 'tbt', 'tailor', 'family', 'add_services', 'entrada-booking',
  'subscriptions', 'newsletter',
  // promotional / interactive
  'your-name-in-hieroglyphics',
  'weekly-flash-deals', 'summer-escapes', 'cairo-sky-adventure',
]);

const SKIP_PROMOTIONAL = /^(.*-flash-deals|.*-deal-of-the-week)$/;
const SKIP_TEST_JUNK = /^(\d+(-\d+)*|.*-2|elementor-\d+|elementskit-.*|\d+-paivan-.*)$/;
const SKIP_INTERACTIVE_TOOL = new Set(['your-name-in-hieroglyphics']);
const SKIP_PROMO_EXPLICIT = new Set(['weekly-flash-deals', 'summer-escapes', 'cairo-sky-adventure']);

interface SkipDecision {
  skip: boolean;
  /** Stub flag if the URL should still emit a stub doc + redirect (not a hard skip). */
  stubFlag?: ReviewFlag;
}

function shouldSkip(slug: string, classification: { type: PageType }, opts: CliOptions): SkipDecision {
  if (opts.includeJunk) return { skip: false };
  if (SKIP_TEST_JUNK.test(slug)) return { skip: true };
  if (classification.type === 'persona-or-system' || SKIP_SLUGS.has(slug)) return { skip: true };
  if (SKIP_INTERACTIVE_TOOL.has(slug)) return { skip: false, stubFlag: 'interactive-tool' };
  if (SKIP_PROMO_EXPLICIT.has(slug) || SKIP_PROMOTIONAL.test(slug)) return { skip: false, stubFlag: 'promotional-marketing' };
  if (classification.type === 'service-or-utility') return { skip: false, stubFlag: 'service-deferred' };
  return { skip: false };
}

// ---------- Main flows -------------------------------------------------

async function main(): Promise<void> {
  const cli = parseCli(process.argv.slice(2));

  // --dry-run-diff-only delegates to the city safety-net entry. No Sanity writes.
  if (cli.dryRunDiffOnly) {
    if (cli.filterByTemplate !== 'destination-hub') {
      process.stderr.write(`[wp-import] --dry-run-diff-only currently supports --filter-by-template destination-hub only (got "${cli.filterByTemplate ?? 'none'}")\n`);
      process.exit(2);
    }
    const { runDiff } = await import('./wp-import-diff.js');
    await runDiff({
      filterByTemplate: cli.filterByTemplate,
      slugPattern: cli.slugPattern,
      slugExclude: cli.slugExclude,
      slugInclude: cli.slugInclude,
      limit: cli.limit,
      adversarial: cli.adversarial ?? false,
      rate: cli.rate,
    });
    return;
  }

  const env = loadEnv();
  const stats = emptyStats(process.argv.slice(2));

  process.stderr.write(`[wp-import] phase=${cli.phase} dataset=${env.sanityDataset} dryRun=${cli.dryRun}\n`);

  const sanity = makeSanityClient(env);
  const wp = new WpClient(env, cli.rate);

  try {
    if (cli.phase === 'relink') {
      await runRelinkOnly(sanity, cli, stats);
    } else {
      await runImportPhase(sanity, wp, cli, stats);
    }
  } catch (e) {
    if (e instanceof WordfenceHaltError) {
      process.stderr.write(`\n[wp-import] HALT: ${e.message}\n`);
      stats.errors++;
    } else {
      process.stderr.write(`\n[wp-import] FATAL: ${(e as Error).stack}\n`);
      stats.errors++;
      process.exitCode = 1;
    }
  }

  stats.missingAttachments = getMissingAttachments();
  stats.uploadExhausted = getUploadExhausted();
  stats.ambiguousMatches = getAmbiguousMediaMatches();
  writeSummary(stats);
  process.stderr.write(`[wp-import] summary written → migration/migration-summary.md\n`);
}

/**
 * Idempotently ensure the migration-staging dataset has the seed docs that
 * imported articles reference: a "Travel2Egypt Archive" author + the two
 * curated editorialCategory documents (planning / destination).
 *
 * `createIfNotExists` ensures we never clobber editorial work in Studio.
 * If the production seed.ts is later re-run against staging, its
 * `createOrReplace` will overwrite our minimal stubs with the curated copy —
 * which is the desired behavior.
 */
async function ensureMigrationStagingSeed(sanity: SanityClient): Promise<void> {
  const archiveBio =
    'Articles attributed to the Travel2Egypt Archive were imported from our legacy content library and are undergoing editorial review. Where original authorship can be verified, articles will be reassigned to their authors over time.';
  const ptBlock = (text: string, keyHint: string) => [
    {
      _type: 'block',
      _key: `bio-${keyHint}`,
      style: 'normal',
      children: [{ _type: 'span', _key: `span-${keyHint}`, text, marks: [] }],
      markDefs: [],
    },
  ];
  const i18nString = (en: string, es: string, ja: string) => [
    { _key: 'en', value: en },
    { _key: 'es', value: es },
    { _key: 'ja', value: ja },
  ];
  const i18nSlug = (en: string, es: string, ja: string) => [
    { _key: 'en', _type: 'object', value: { _type: 'slug', current: en } },
    { _key: 'es', _type: 'object', value: { _type: 'slug', current: es } },
    { _key: 'ja', _type: 'object', value: { _type: 'slug', current: ja } },
  ];

  await sanity.createIfNotExists({
    _id: 'author-legacy-archive',
    _type: 'author',
    name: 'Travel2Egypt Archive',
    slug: { _type: 'slug', current: 'travel2egypt-archive' },
    bio: [{ _key: 'en', _type: 'object', value: ptBlock(archiveBio, 'en') }],
  } as any);

  await sanity.createIfNotExists({
    _id: 'category-planning',
    _type: 'editorialCategory',
    name: i18nString('Planning advice', 'Consejos de planificación', '旅の計画'),
    slug: i18nSlug('planning-advice', 'consejos-de-planificacion', 'planning-advice'),
    orderRank: 10,
  } as any);

  await sanity.createIfNotExists({
    _id: 'category-destination',
    _type: 'editorialCategory',
    name: i18nString('Destination depth', 'Profundidad de destino', '訪問先を深く知る'),
    slug: i18nSlug('destination-depth', 'profundidad-de-destino', 'destination-depth'),
    orderRank: 20,
  } as any);
}

/**
 * Fetch WP id→slug maps for categories and users once at startup. Cheap
 * (~1 page each) and avoids per-post round-trips. Used by mapArticle to
 * preserve original WP author + category provenance on the migration object,
 * and to feed the two-bucket category-routing heuristic.
 */
async function fetchWpMaps(wp: WpClient): Promise<{
  categoryById: Map<number, string>;
  authorById: Map<number, string>;
}> {
  const categoryById = new Map<number, string>();
  const authorById = new Map<number, string>();
  try {
    const cats = await wp.getPaginated<{ id: number; slug: string }>(
      '/wp-json/wp/v2/categories',
      { _fields: 'id,slug' }
    );
    for (const c of cats) categoryById.set(c.id, c.slug);
  } catch (e) {
    process.stderr.write(`[wp-import] failed to fetch WP categories: ${(e as Error).message}\n`);
  }
  try {
    const users = await wp.getPaginated<{ id: number; slug: string }>(
      '/wp-json/wp/v2/users',
      { _fields: 'id,slug' }
    );
    for (const u of users) authorById.set(u.id, u.slug);
  } catch (e) {
    process.stderr.write(`[wp-import] failed to fetch WP users: ${(e as Error).message}\n`);
  }
  return { categoryById, authorById };
}

async function runImportPhase(
  sanity: SanityClient,
  wp: WpClient,
  cli: CliOptions,
  stats: MigrationStats
): Promise<void> {
  // Idempotently ensure migration-staging holds the seed docs that imported
  // articles reference (legacy-archive author + 2 editorialCategory docs).
  if (!cli.dryRun) {
    await ensureMigrationStagingSeed(sanity);
    process.stderr.write(`[wp-import] migration-staging seed (legacy-archive author + 2 categories) ensured\n`);
  }

  // Fetch WP id→slug maps once for author + category provenance.
  const wpMaps = await fetchWpMaps(wp);
  process.stderr.write(`[wp-import] WP maps loaded: ${wpMaps.categoryById.size} categories, ${wpMaps.authorById.size} users\n`);

  // Categories are simple enough to run in their own pass.
  if (cli.type === 'all' || cli.type === 'category') {
    await importCategories(sanity, wp, cli, stats);
    if (cli.type === 'category') return;
  }

  // Build priority scoring index from SEO CSVs.
  const priorityIndex = buildPriorityIndex();

  const allRedirects: RedirectEntry[] = [];
  const liveUrlToPath = new Map<string, { to_path: string; locale: Locale; legacy_wp_id: number }>();

  // Posts: WP `post` → article.
  if (cli.type === 'all' || cli.type === 'post') {
    await importPosts(sanity, wp, cli, stats, priorityIndex, allRedirects, liveUrlToPath, wpMaps);
  }

  // Pages: classified per scripts/wp-classifier.ts; routed to per-type mappers.
  if (cli.type === 'all' || cli.type === 'page') {
    await importPages(sanity, wp, cli, stats, priorityIndex, allRedirects, liveUrlToPath);
  }

  // Reconciliation pass: append wikiMonument refs to city.placesToGo.
  await reconcilePlacesToGo(sanity, cli, stats);

  // Build & write redirect map.
  const { entries, orphans } = buildRedirectMap({
    liveEntries: allRedirects,
    liveUrlToPath,
    priorityIndex,
  });
  if (!cli.dryRun) writeRedirectMap(entries, orphans);
  stats.redirects.total = entries.length;
  stats.redirects.orphans = orphans.length;
}

async function importCategories(
  sanity: SanityClient,
  wp: WpClient,
  cli: CliOptions,
  stats: MigrationStats
): Promise<void> {
  process.stderr.write(`[wp-import] importing categories...\n`);
  const cats = (await wp.getPaginated('/wp-json/wp/v2/categories', { _fields: 'id,slug,name,description,count' })) as Array<{
    id: number;
    slug: string;
    name: string;
    description?: string;
    count?: number;
  }>;
  for (const c of cats) {
    if ((c.count ?? 0) === 0) {
      bump(stats, 'editorialCategory', 'skipped');
      continue;
    }
    const result = mapEditorialCategory(sanity, c);
    await persistResult(sanity, cli, stats, result);
  }
}

async function importPosts(
  sanity: SanityClient,
  wp: WpClient,
  cli: CliOptions,
  stats: MigrationStats,
  priorityIndex: Map<string, number>,
  allRedirects: RedirectEntry[],
  liveUrlToPath: Map<string, { to_path: string; locale: Locale; legacy_wp_id: number }>,
  wpMaps: { categoryById: Map<number, string>; authorById: Map<number, string> }
): Promise<void> {
  process.stderr.write(`[wp-import] enumerating EN posts...\n`);
  const params: Record<string, string> = { lang: 'en', _fields: 'id,slug,date,modified,modified_gmt,link,template,categories,tags,featured_media,title' };
  if (cli.since) params.modified_after = cli.since + 'T00:00:00';
  const posts = (await wp.getPaginated<WpEntityLite>('/wp-json/wp/v2/posts', params)).slice(0, cli.limit ?? Infinity);

  for (const lite of posts) {
    try {
      const group = await assembleLocaleGroup(wp, 'posts', lite, cli, stats);
      if (!group) continue;
      const priority = scoreFor(group.en.link, priorityIndex);
      const result = await mapArticle(sanity, wp, group, {
        priorityScore: priority,
        dryRun: cli.dryRun,
        wpCategoryById: wpMaps.categoryById,
        wpAuthorById: wpMaps.authorById,
      });
      await persistResult(sanity, cli, stats, result);
      collect(allRedirects, liveUrlToPath, result);
    } catch (e) {
      handleEntityError(e, lite, cli, stats);
    }
  }
}

async function importPages(
  sanity: SanityClient,
  wp: WpClient,
  cli: CliOptions,
  stats: MigrationStats,
  priorityIndex: Map<string, number>,
  allRedirects: RedirectEntry[],
  liveUrlToPath: Map<string, { to_path: string; locale: Locale; legacy_wp_id: number }>
): Promise<void> {
  process.stderr.write(`[wp-import] enumerating EN pages...\n`);
  const params: Record<string, string> = { lang: 'en', _fields: 'id,slug,date,modified,modified_gmt,link,parent,template,categories,tags,featured_media,title' };
  if (cli.since) params.modified_after = cli.since + 'T00:00:00';
  let pages = await wp.getPaginated<WpEntityLite>('/wp-json/wp/v2/pages', params);

  // Classify everything once up front.
  const classified = pages.map((p) => ({ p, c: classifyPageBySlug(p.slug) }));

  // --filter-by-template
  let filtered = classified;
  if (cli.filterByTemplate) {
    filtered = classified.filter((x) => x.c.type === cli.filterByTemplate);
    process.stderr.write(`[wp-import] filtered ${classified.length} → ${filtered.length} by template=${cli.filterByTemplate}\n`);
  }
  // --slug-include wins over --slug-pattern when both are supplied.
  if (cli.slugInclude) {
    if (cli.slugPattern) {
      process.stderr.write(`[wp-import] WARNING: --slug-include is set; --slug-pattern="${cli.slugPattern}" is ignored.\n`);
    }
    const includeSet = compileSlugInclude(cli.slugInclude);
    const before = filtered.length;
    filtered = filtered.filter((x) => includeSet.has(x.p.slug));
    process.stderr.write(`[wp-import] filtered ${before} → ${filtered.length} by slug-include exact list (${includeSet.size} slug${includeSet.size === 1 ? '' : 's'})\n`);
  } else if (cli.slugPattern) {
    // --slug-pattern only applies when --slug-include is not set.
    const matcher = compileSlugPattern(cli.slugPattern);
    const before = filtered.length;
    filtered = filtered.filter((x) => matcher(x.p.slug));
    process.stderr.write(`[wp-import] filtered ${before} → ${filtered.length} by slug-pattern="${cli.slugPattern}"\n`);
  }
  // --slug-exclude (any match excludes the page). Applies regardless of include vs pattern.
  if (cli.slugExclude) {
    const excluders = compileSlugExclude(cli.slugExclude);
    const before = filtered.length;
    filtered = filtered.filter((x) => !excluders.some((m) => m(x.p.slug)));
    process.stderr.write(`[wp-import] filtered ${before} → ${filtered.length} by slug-exclude="${cli.slugExclude}"\n`);
  }
  if (cli.limit) filtered = filtered.slice(0, cli.limit);

  // Two-pass ordering: cities (hubs) BEFORE everything else, so subpages can resolve parentCity.
  const hubs = filtered.filter((x) => x.c.type === 'destination-hub');
  const rest = filtered.filter((x) => x.c.type !== 'destination-hub');

  for (const { p, c } of [...hubs, ...rest]) {
    try {
      const decision = shouldSkip(p.slug, c, cli);
      if (decision.skip) {
        bump(stats, 'skipped', 'skipped');
        continue;
      }

      const group = await assembleLocaleGroup(wp, 'pages', p, cli, stats);
      if (!group) continue;
      const priority = scoreFor(group.en.link, priorityIndex);

      let result: MapperResult | null = null;
      if (decision.stubFlag) {
        result = mapServiceStub(sanity, wp, group, { reviewFlag: decision.stubFlag, priorityScore: priority });
      } else {
        result = await routeToMapper(sanity, wp, group, c, priority, cli);
      }

      if (result) {
        await persistResult(sanity, cli, stats, result);
        collect(allRedirects, liveUrlToPath, result);
      }
    } catch (e) {
      handleEntityError(e, p, cli, stats);
    }
  }
}

async function routeToMapper(
  sanity: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  classification: ReturnType<typeof classifyPageBySlug>,
  priorityScore: number,
  cli: CliOptions
): Promise<MapperResult | null> {
  const opts = { dryRun: cli.dryRun, priorityScore };
  switch (classification.type) {
    case 'destination-hub':
      return mapCity(sanity, wp, group, opts);
    case 'destination-subpage':
      return mapGuideArticle(sanity, wp, group, { ...opts, classification });
    case 'monument':
      return mapWikiMonument(sanity, wp, group, { ...opts, classification });
    case 'tour-or-package':
      return mapTour(sanity, wp, group, opts);
    case 'hotel':
      return mapHotel(sanity, wp, group, { ...opts, classification });
    case 'nile-cruise':
      return mapNileCruise(sanity, wp, group, opts);
    case 'article':
      return mapArticle(sanity, wp, group, opts);
    case 'unclassified':
      return mapArticle(sanity, wp, group, { ...opts, reviewFlag: 'unclassified-as-article' });
    case 'service-or-utility':
      // Already handled via shouldSkip().stubFlag — defensive fallthrough.
      return mapServiceStub(sanity, wp, group, { reviewFlag: 'service-deferred', priorityScore });
    case 'persona-or-system':
    case 'test-or-junk':
      return null;
    default:
      return null;
  }
}

// ---------- Locale-group assembly --------------------------------------

export async function assembleLocaleGroup(
  wp: WpClient,
  rest: 'posts' | 'pages',
  enLite: WpEntityLite,
  cli: CliOptions,
  stats: MigrationStats
): Promise<LocaleGroup | null> {
  stats.hreflang.entitiesProbed++;

  // Fetch full EN entity.
  let en: WpEntityFull;
  try {
    en = (await wp.getEntity(rest, enLite.id, 'en')) as WpEntityFull;
  } catch (e) {
    process.stderr.write(`[wp-import] could not fetch ${rest}/${enLite.id} EN: ${(e as Error).message}\n`);
    stats.errors++;
    return null;
  }

  // Hreflang scrape.
  let hreflang: HreflangMap;
  try {
    hreflang = await getHreflangMap(wp, { id: en.id, link: en.link }, { rescrape: cli.rescrapeHreflang });
  } catch (e) {
    process.stderr.write(`[wp-import] hreflang scrape failed for ${en.link}: ${(e as Error).message}\n`);
    hreflang = { wpId: en.id, links: { en: en.link } };
  }

  const group: LocaleGroup = { en, hreflang, singleton: true };

  // Resolve ES/JA from hreflang URLs (lookup by URL → REST).
  for (const loc of ['es', 'ja'] as const) {
    const url = hreflang.links[loc];
    if (!url) continue;
    // The URL embeds the slug — we need the WP ID. Easiest: hit /wp-json/wp/v2/{rest}?slug=... with lang.
    const slug = extractSlug(url);
    if (!slug) continue;
    try {
      const found = (await wp.getJson(`/wp-json/wp/v2/${rest}?slug=${encodeURIComponent(slug)}&lang=${loc}&context=edit`, {
        cacheKey: `${rest}-bySlug-${slug}-${loc}`,
      })) as WpEntityFull[];
      if (Array.isArray(found) && found.length > 0) {
        group[loc] = found[0];
        group.singleton = false;
      }
    } catch {
      // Locale variant not findable; surface as broken hreflang.
      stats.hreflang.broken++;
    }
  }

  if (group.singleton) stats.hreflang.singletons++;
  else stats.hreflang.multiLocaleGroups++;

  return group;
}

function extractSlug(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    // Strip /es or /ja prefix if present.
    const tail = parts[parts.length - 1];
    return decodeURIComponent(tail);
  } catch {
    return null;
  }
}

// ---------- Persist + bookkeeping --------------------------------------

/**
 * Sanity transient-error guard. Mirrors the Wordfence-backoff pattern on the
 * write side: retry on 5xx-class transient errors and ECONNRESET-style network
 * blips with exponential backoff (1s, 4s, 16s). Halts only after the 3rd
 * attempt fails. Detected by message-string sniffing because the @sanity/client
 * surface doesn't expose a typed error class for these.
 */
function isTransientSanityError(e: unknown): boolean {
  const msg = (e as Error)?.message ?? '';
  return (
    /invalid response was received from the upstream server/i.test(msg) ||
    /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|network/i.test(msg) ||
    /\b5\d\d\b/.test(msg)
  );
}

async function createOrReplaceWithRetry(
  sanity: SanityClient,
  doc: SanityDoc,
  stats: MigrationStats
): Promise<void> {
  const delays = [1_000, 4_000, 16_000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      await sanity.createOrReplace(doc as any);
      return;
    } catch (e) {
      if (attempt < delays.length && isTransientSanityError(e)) {
        const wait = delays[attempt];
        stats.sanityRetries++;
        const msg = (e as Error).message?.slice(0, 120) ?? '';
        process.stderr.write(`[sanity-retry] ${doc._id} attempt ${attempt + 1}/${delays.length} in ${wait}ms (${msg})\n`);
        logEvent({
          level: 'warn',
          message: `sanity-retry ${doc._id} attempt=${attempt + 1} delay=${wait}ms err=${msg}`,
        });
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw e;
    }
  }
}

async function persistResult(
  sanity: SanityClient,
  cli: CliOptions,
  stats: MigrationStats,
  result: MapperResult
): Promise<void> {
  for (const doc of result.docs) {
    if (cli.dryRun) {
      bump(stats, doc._type, 'written');
      if (cli.verbose) process.stderr.write(`[dry-run] would create/replace ${doc._type} ${doc._id}\n`);
      countReviewFlag(stats, doc);
      continue;
    }
    try {
      // Q3 merge rule: for city docs, fetch existing state and apply
      // mergeCityDoc before write so editorial-only fields (region,
      // coordinates, orderRank, gallery, placesToGo) the mapper doesn't
      // produce are preserved. Path A wiring per session-5 critical-bug
      // fix. The dry-run-diff-only path goes through the same helper so
      // both paths converge on identical semantics.
      const docToWrite = doc._type === 'city'
        ? ((await applyCityMerge(sanity, doc)).merged as SanityDoc)
        : doc;
      await createOrReplaceWithRetry(sanity, docToWrite, stats);
      bump(stats, doc._type, 'written');
      countReviewFlag(stats, doc);
    } catch (e) {
      bump(stats, doc._type, 'failed');
      logEvent({ level: 'error', message: `createOrReplace failed for ${doc._id}: ${(e as Error).message}` });
      if (!cli.continueOnError) throw e;
    }
  }
  if (result.htmlStats) {
    stats.htmlPipeline.operatorNotes += result.htmlStats.operatorNotes;
    stats.htmlPipeline.pullQuotes += result.htmlStats.pullQuotes;
    stats.htmlPipeline.sideImages += result.htmlStats.sideImages;
    stats.htmlPipeline.images += result.htmlStats.images;
    stats.htmlPipeline.tablesFlattened += result.htmlStats.tablesFlattened;
    stats.stripRules.tourPromo += result.htmlStats.tourPromoStripped;
    stats.stripRules.categoryGrid += result.htmlStats.categoryGridStripped;
    stats.stripRules.backlink += result.htmlStats.backlinkStripped;
    stats.stripRules.carouselSwiper += result.htmlStats.carouselSwiperStripped;
    stats.stripRules.carouselPremiumAdv += result.htmlStats.carouselPremiumAdvStripped;
    stats.stripRules.bdtImg += result.htmlStats.bdtImgStripped;
    stats.stripRules.titleH1 += result.htmlStats.titleH1Stripped;
    stats.stripRules.metadataLine += result.htmlStats.metadataLineStripped;
    stats.stripRules.sectionNavBlock += result.htmlStats.sectionNavBlockStripped;
    stats.stripRules.linkMarkConvertedToPendingRef += result.htmlStats.linkMarkConvertedToPendingRef;
    stats.stripRules.linkMarkKeptAsExternal += result.htmlStats.linkMarkKeptAsExternal;
    stats.stripRules.linkMarkStrippedMalformed += result.htmlStats.linkMarkStrippedMalformed;
    stats.stripRules.linkMarkStrippedAnchor += result.htmlStats.linkMarkStrippedAnchor;
    stats.stripRules.linkMarkStrippedMailto += result.htmlStats.linkMarkStrippedMailto;
    // Per-article strip counter event for editorial triage. Only emit when at
    // least one rule fired, so the log doesn't get drowned in zeros.
    const totalStripped =
      result.htmlStats.tourPromoStripped +
      result.htmlStats.categoryGridStripped +
      result.htmlStats.backlinkStripped +
      result.htmlStats.carouselSwiperStripped +
      result.htmlStats.carouselPremiumAdvStripped +
      result.htmlStats.bdtImgStripped +
      result.htmlStats.titleH1Stripped +
      result.htmlStats.metadataLineStripped +
      result.htmlStats.sectionNavBlockStripped;
    if (totalStripped > 0) {
      const enDoc = result.docs.find((d) => d._type !== 'translation.metadata');
      logEvent({
        level: 'info',
        message: `strip-counts ${enDoc?._id ?? 'unknown'}`,
        data: {
          docId: enDoc?._id,
          tourPromo: result.htmlStats.tourPromoStripped,
          categoryGrid: result.htmlStats.categoryGridStripped,
          backlink: result.htmlStats.backlinkStripped,
          carouselSwiper: result.htmlStats.carouselSwiperStripped,
          carouselPremiumAdv: result.htmlStats.carouselPremiumAdvStripped,
          bdtImg: result.htmlStats.bdtImgStripped,
          titleH1: result.htmlStats.titleH1Stripped,
          metadataLine: result.htmlStats.metadataLineStripped,
          sectionNavBlock: result.htmlStats.sectionNavBlockStripped,
        },
      });
    }
  }
  if (result.discardedCarousels?.length) {
    for (const dc of result.discardedCarousels) stats.discardedCarousels.push(dc);
  }
  if (result.duplicateSrcRemappings) {
    stats.duplicateSrcRemappings += result.duplicateSrcRemappings;
  }
  if (result.mediaUploaded) {
    if (cli.dryRun) stats.media.uploaded += result.mediaUploaded;
    else stats.media.uploaded += result.mediaUploaded;
  }
}

function countReviewFlag(stats: MigrationStats, doc: SanityDoc): void {
  const flag = (doc.migration as any)?.reviewFlag as ReviewFlag | undefined;
  const key = flag ?? 'none';
  stats.reviewFlags[key] = (stats.reviewFlags[key] ?? 0) + 1;
}

function bump(stats: MigrationStats, type: string, status: 'written' | 'skipped' | 'failed'): void {
  stats.bySanityType[type] = stats.bySanityType[type] ?? { written: 0, skipped: 0, failed: 0 };
  stats.bySanityType[type][status]++;
}

function collect(
  allRedirects: RedirectEntry[],
  liveUrlToPath: Map<string, { to_path: string; locale: Locale; legacy_wp_id: number }>,
  result: MapperResult
): void {
  for (const r of result.redirects) {
    allRedirects.push(r);
    if (r.legacy_wp_id !== null) {
      const decoded = decodeURIComponent(r.from_url).replace(/\/$/, '');
      liveUrlToPath.set(decoded, { to_path: r.to_path, locale: r.locale, legacy_wp_id: r.legacy_wp_id });
    }
  }
}

function scoreFor(url: string, priorityIndex: Map<string, number>): number {
  const decoded = decodeURIComponent(url).replace(/\/$/, '');
  return priorityIndex.get(decoded) ?? 0;
}

/**
 * Compile a glob-lite slug pattern into a matcher function. Supports a single
 * `*` wildcard at start, end, or both. Anything else is treated as exact match.
 *
 *   "*-travel-guide" → suffix match
 *   "reaching-*"     → prefix match
 *   "*-egypt-*"      → contains match
 *   "exact-slug"     → exact match
 *
 * The narrow grammar is intentional: full glob/regex would invite shell-quoting
 * surprises and obscure the corpus-split semantics this flag is meant to
 * express. Used in session 5 to subset destination-hubs to `*-travel-guide`
 * without mutating the classifier.
 */
function compileSlugPattern(pattern: string): (slug: string) => boolean {
  const startsWildcard = pattern.startsWith('*');
  const endsWildcard = pattern.endsWith('*');
  const core = pattern.replace(/^\*/, '').replace(/\*$/, '');
  if (core.includes('*')) {
    process.stderr.write(`[wp-import] --slug-pattern: only one leading and/or trailing '*' supported, got "${pattern}"\n`);
    process.exit(2);
  }
  if (startsWildcard && endsWildcard) return (s) => s.includes(core);
  if (startsWildcard) return (s) => s.endsWith(core);
  if (endsWildcard) return (s) => s.startsWith(core);
  return (s) => s === core;
}

/**
 * Compile a comma-separated list of slug-exclude patterns into matcher functions.
 * Each pattern follows the same glob-lite grammar as --slug-pattern. The caller
 * applies them as `slugs.filter(s => !excluders.some(m => m(s)))`.
 *
 * Whitespace around commas is trimmed. Empty entries are skipped.
 */
function compileSlugExclude(list: string): Array<(slug: string) => boolean> {
  return list
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => compileSlugPattern(p));
}

/** Compile a comma-separated exact-slug list into a Set for O(1) lookup. No
 * globbing; the caller asks for these exact slugs. Whitespace trimmed; empty
 * entries skipped. Used for deterministic "write exactly these N slugs"
 * operations like the Step 5 actual-write. */
function compileSlugInclude(list: string): Set<string> {
  return new Set(list.split(',').map((s) => s.trim()).filter(Boolean));
}

function handleEntityError(e: unknown, lite: WpEntityLite, cli: CliOptions, stats: MigrationStats): void {
  stats.errors++;
  const msg = `[wp-import] entity wpId=${lite.id} slug=${lite.slug} failed: ${(e as Error).message}`;
  process.stderr.write(msg + '\n');
  logEvent({ level: 'error', wpId: lite.id, url: lite.link, message: msg });
  if (!cli.continueOnError) throw e;
}

// ---------- Reconciliation: city.placesToGo -----------------------------

async function reconcilePlacesToGo(
  sanity: SanityClient,
  cli: CliOptions,
  stats: MigrationStats
): Promise<void> {
  // Find every wikiMonument that has an inferred parent city slug encoded in
  // its migration provenance (or via a derived lookup). We embed parentSlug
  // by re-classifying from the slug — works because WP slug is preserved.
  const monuments = (await sanity.fetch(
    `*[_type == "wikiMonument" && defined(migration.wpId)]{ _id, "slug": slug[_key=="en"][0].value.current }`
  )) as Array<{ _id: string; slug?: string }>;

  // Group monuments by inferredParentCity slug.
  const byCitySlug = new Map<string, string[]>(); // citySlug → [monumentIds]
  for (const m of monuments) {
    if (!m.slug) continue;
    const c = classifyPageBySlug(m.slug);
    if (!c.inferredParentCity) continue;
    const arr = byCitySlug.get(c.inferredParentCity) ?? [];
    arr.push(m._id);
    byCitySlug.set(c.inferredParentCity, arr);
  }

  for (const [citySlug, monumentIds] of byCitySlug.entries()) {
    const city = await findCityByEnSlug(sanity, citySlug);
    if (!city) continue;
    if (cli.dryRun) {
      stats.reconciliation.citiesUpdated++;
      stats.reconciliation.placesToGoAdded += monumentIds.length;
      continue;
    }
    // Read current placesToGo, dedupe by _ref, then patch.
    const current = (await sanity.fetch(`*[_id == $id][0].placesToGo`, { id: city._id })) as Array<{ _ref: string }> | null;
    const existing = new Set((current ?? []).map((r) => r._ref));
    const newRefs = monumentIds
      .filter((id) => !existing.has(id))
      .map((id) => ({ _key: id.replace(/[^\w]/g, '').slice(0, 24), _type: 'reference', _ref: id }));
    if (newRefs.length === 0) continue;

    await sanity
      .patch(city._id)
      .setIfMissing({ placesToGo: [] })
      .insert('after', 'placesToGo[-1]', newRefs)
      .commit();

    stats.reconciliation.citiesUpdated++;
    stats.reconciliation.placesToGoAdded += newRefs.length;
  }
}

// ---------- Relink-only flow -------------------------------------------

async function runRelinkOnly(
  sanity: SanityClient,
  cli: CliOptions,
  stats: MigrationStats
): Promise<void> {
  process.stderr.write(`[wp-import] running relink phase...\n`);
  const summary = await runRelinkPhase(sanity, { dryRun: cli.dryRun });
  stats.relink = summary;
}

// Only run main() when this file is the entrypoint, not when imported by
// another script (e.g. scripts/wp-import-diff.ts re-uses helpers from here).
const __thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] === __thisFile) {
  main().catch((e) => {
    process.stderr.write(`\n[wp-import] uncaught: ${(e as Error).stack}\n`);
    process.exit(1);
  });
}

// Reference to satisfy lint: ROOT is used for path-based imports inside subscripts.
void ROOT;
