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

  writeSummary(stats);
  process.stderr.write(`[wp-import] summary written → migration/migration-summary.md\n`);
}

async function runImportPhase(
  sanity: SanityClient,
  wp: WpClient,
  cli: CliOptions,
  stats: MigrationStats
): Promise<void> {
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
    await importPosts(sanity, wp, cli, stats, priorityIndex, allRedirects, liveUrlToPath);
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
  liveUrlToPath: Map<string, { to_path: string; locale: Locale; legacy_wp_id: number }>
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
      const result = await mapArticle(sanity, wp, group, { priorityScore: priority, dryRun: cli.dryRun });
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

async function assembleLocaleGroup(
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
      await sanity.createOrReplace(doc as any);
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

main().catch((e) => {
  process.stderr.write(`\n[wp-import] uncaught: ${(e as Error).stack}\n`);
  process.exit(1);
});

// Reference to satisfy lint: ROOT is used for path-based imports inside subscripts.
void ROOT;
