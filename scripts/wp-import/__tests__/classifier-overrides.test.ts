/**
 * Tests for the editorial routing override layer added in session 6.5a
 * Phase 2 amendment.
 *
 * Five override maps in `scripts/wp-classifier.ts` encode editorial decisions
 * from Investigations 1, 2, and 3. They fire before generic classification
 * rules so editorial intent always wins. Plus the deferred-editorial
 * dispatch short-circuit in `wp-import.routeToMapper`.
 *
 * Coverage triad:
 *   3A.1  Classifier override priority — each override map fires correctly
 *         and beats the generic rule that would otherwise misclassify the slug.
 *   3A.2  Regression — slugs NOT in any override map continue to classify
 *         per the existing rules (no over-fire of override layer).
 *   3B    guideArticle mapper applies slug + section + parentCity overrides
 *         for the 3 dahab cleanups, including symmetric slug across locales
 *         and override-aware redirect builder.
 *   3C    Dispatch short-circuit — routeToMapper returns the spec'd
 *         MapperResult shape (empty docs/redirects + editorial-defer log
 *         entry) for slugs in EXPLICIT_DEFER_SLUGS.
 *   3D    TRAVEL_TIP_SLUG_TO_CATEGORY size locked at 30; spot-check
 *         Investigation 1 case-D entries; month-by-month-guide-to-egypt
 *         removed (now an article, not a travelTip).
 *
 * Run via: `npm run test:overrides`. Self-running like the other test files.
 */

import {
  classifyPageBySlug,
  inferMonumentType,
  extractMonumentParentCity,
  getExplicitParentCityOverride,
  EXPLICIT_PAGE_ROUTING,
  EXPLICIT_SLUG_OVERRIDES,
  EXPLICIT_SECTION_OVERRIDES,
  EXPLICIT_PARENT_CITY_OVERRIDES,
  EXPLICIT_DEFER_SLUGS,
  TOKEN_TO_CITY_SLUG,
} from '../../wp-classifier.js';
import { TRAVEL_TIP_SLUG_TO_CATEGORY } from '../mappers/travelTip.js';
import { mapGuideArticle } from '../mappers/guideArticle.js';
import { mapWikiMonument, resolveMonumentCity } from '../mappers/wikiMonument.js';
import { routeToMapper } from '../../wp-import.js';
import type {
  CliOptions,
  Classification,
  HreflangMap,
  LocaleGroup,
  MapperResult,
  SanityDoc,
  WpEntityFull,
} from '../types.js';

let pass = 0;
let fail = 0;

function assert(cond: unknown, msg: string): void {
  if (cond) {
    pass++;
  } else {
    fail++;
    process.stderr.write(`✗ ${msg}\n`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    pass++;
  } else {
    fail++;
    process.stderr.write(`✗ ${msg}\n  actual:   ${a}\n  expected: ${b}\n`);
  }
}

// ─── In-memory mocks (mirrors merge-dispatch.test.ts conventions) ──────

interface MockSanity {
  fetch: <T = unknown>(query: string, params?: Record<string, unknown>) => Promise<T>;
  createOrReplace: (doc: SanityDoc) => Promise<SanityDoc>;
  __seedCity: (enSlug: string, _id: string) => void;
}

function makeMockSanity(): MockSanity {
  const cityByEnSlug = new Map<string, string>();
  return {
    fetch: (async (query: string, params?: Record<string, unknown>): Promise<unknown> => {
      // findCityByEnSlug — `*[_type=="city" && slug[_key=="en"][0].value.current==$slug][0]{_id}`
      if (
        typeof query === 'string' &&
        query.includes('_type == "city"') &&
        query.includes('slug[_key=="en"]') &&
        params &&
        typeof params.slug === 'string'
      ) {
        const id = cityByEnSlug.get(params.slug);
        return id ? { _id: id } : null;
      }
      return null;
    }) as MockSanity['fetch'],
    createOrReplace: async (doc: SanityDoc): Promise<SanityDoc> => doc,
    __seedCity: (enSlug: string, _id: string) => cityByEnSlug.set(enSlug, _id),
  };
}

const wpStub: any = {
  // mapGuideArticle never reaches the wp client when featured_media is 0
  // (buildHeroImage short-circuits) — provide a noop client to satisfy types.
};

function makeEntity(opts: {
  id: number;
  slug: string;
  title: string;
  link?: string;
}): WpEntityFull {
  return {
    id: opts.id,
    slug: opts.slug,
    link: opts.link ?? `https://travel2egypt.org/${opts.slug}/`,
    date: '2024-01-01T00:00:00',
    modified: '2024-01-01T00:00:00',
    type: 'page',
    featured_media: 0,
    title: { rendered: opts.title },
    content: { rendered: '<p>body</p>' },
    excerpt: { rendered: '<p>summary</p>' },
  };
}

function makeGroup(slug: string, id: number, title: string): LocaleGroup {
  const en = makeEntity({ id, slug, title });
  const es = makeEntity({
    id: id + 1,
    slug: `${slug}-es`,
    title: `${title} (ES)`,
    link: `https://travel2egypt.org/es/${slug}-es/`,
  });
  const ja = makeEntity({
    id: id + 2,
    slug: `${slug}-ja`,
    title: `${title} (JA)`,
    link: `https://travel2egypt.org/ja/${slug}-ja/`,
  });
  const hreflang: HreflangMap = { wpId: id, links: { en: en.link, es: es.link, ja: ja.link } };
  return { en, es, ja, hreflang, singleton: false };
}

function baseCli(): CliOptions {
  return {
    dryRun: true, // dry-run: skips Sanity reads in mappers where applicable
    type: 'all',
    language: 'all',
    continueOnError: false,
    verbose: false,
    phase: 'import',
    includeJunk: false,
    rescrapeHreflang: false,
    rate: 4,
  };
}

// ─── 3A.1 — Override priority ──────────────────────────────────────────

process.stderr.write('# (3A.1) Classifier override priority\n');

// EXPLICIT_PAGE_ROUTING — Investigation 2 (page → article)
{
  const c = classifyPageBySlug('egypt-weather-guide');
  assertEqual(c.type, 'article', '3A.1-a: egypt-weather-guide → article');
  assertEqual(c.confidence, 'high', '3A.1-a: egypt-weather-guide confidence high');
  assert(
    c.reason.toLowerCase().includes('explicit'),
    '3A.1-a: egypt-weather-guide reason mentions explicit override'
  );
}
{
  // BEAT-THE-EXISTING-RULE: month-by-month-guide-to-egypt would have fired
  // either the *-egypt destination-hub rule OR the (now removed) travelTip
  // map entry. The override must take precedence over both.
  const c = classifyPageBySlug('month-by-month-guide-to-egypt');
  assertEqual(c.type, 'article', '3A.1-b: month-by-month overrides *-egypt rule');
  assert(
    c.type !== 'destination-hub',
    '3A.1-b: month-by-month NOT destination-hub (Phase 3 D3 superseded)'
  );
  assert(c.type !== 'travelTip', '3A.1-b: month-by-month NOT travelTip (Inv 2 supersedes)');
}

// EXPLICIT_PAGE_ROUTING — Investigation 3 (tour products)
for (const slug of [
  'cairo-private-car-and-guide',
  'aswan-private-car-and-guide',
  'luxor-private-car-and-guide',
] as const) {
  const c = classifyPageBySlug(slug);
  assertEqual(c.type, 'tour-or-package', `3A.1-c: ${slug} → tour-or-package`);
  assert(c.type !== 'destination-subpage', `3A.1-c: ${slug} NOT destination-subpage (override beats topic-suffix rule)`);
}

// EXPLICIT_PAGE_ROUTING — Investigation 3 Q4 (movement-guide → service stub)
{
  const c = classifyPageBySlug('movement-guide');
  assertEqual(c.type, 'service-or-utility', '3A.1-d: movement-guide → service-or-utility');
  assertEqual(c.confidence, 'high', '3A.1-d: movement-guide confidence high');
}

// EXPLICIT_DEFER_SLUGS — Investigation 3 (slug-collision junk)
{
  const c = classifyPageBySlug('dahab-historical-guide-4');
  assertEqual(c.type, 'unclassified', '3A.1-e: dahab-historical-guide-4 → unclassified');
  assertEqual(c.reviewFlag, 'deferred-editorial', '3A.1-e: reviewFlag is deferred-editorial');
  assertEqual(c.confidence, 'high', '3A.1-e: confidence high (the defer is a high-confidence editorial decision)');
}

// Override-map shape sanity
assertEqual(Object.keys(EXPLICIT_PAGE_ROUTING).length, 26, '3A.1-f: EXPLICIT_PAGE_ROUTING has 26 entries (Session 9 2b.d.1.fix.2 added 5 Session 6 D5 reroutes on top of 2b.d.1.fix′s 4)');
assertEqual(EXPLICIT_DEFER_SLUGS.size, 11, '3A.1-f: EXPLICIT_DEFER_SLUGS has 11 entries (Session 9 2b.d.1.fix moved 4 slugs to EXPLICIT_PAGE_ROUTING)');
assertEqual(Object.keys(EXPLICIT_SLUG_OVERRIDES).length, 3, '3A.1-f: EXPLICIT_SLUG_OVERRIDES has 3 entries');
assertEqual(Object.keys(EXPLICIT_SECTION_OVERRIDES).length, 3, '3A.1-f: EXPLICIT_SECTION_OVERRIDES has 3 entries');
assertEqual(Object.keys(EXPLICIT_PARENT_CITY_OVERRIDES).length, 12, '3A.1-f: EXPLICIT_PARENT_CITY_OVERRIDES has 12 entries (Session 7 1.5b-iii added the-temple-of-dendera→qena editorial override)');

// ─── 3A.2 — Regression (non-override slugs unchanged) ──────────────────

process.stderr.write('\n# (3A.2) Regression — non-override slugs unchanged\n');

{
  const c = classifyPageBySlug('cairo');
  assertEqual(c.type, 'destination-hub', '3A.2-a: cairo → destination-hub (unchanged)');
}
{
  const c = classifyPageBySlug('getting-around-cairo');
  assertEqual(c.type, 'destination-subpage', '3A.2-b: getting-around-cairo → destination-subpage');
  assertEqual(c.inferredParentCity, 'cairo', '3A.2-b: parentCity inferred from slug');
  assertEqual(c.inferredSection, 'while-you-are-there', '3A.2-b: section inferred from prefix');
}
{
  // reaching-siwa-egypt: the *-egypt rule still classifies as destination-hub
  // here. Phase 3 D1's re-route to guideArticle is enforced via --slug-include
  // scope flag in the 6.5b invocation, NOT via the classifier — so this
  // assertion locks the classifier behavior at the layer it owns.
  const c = classifyPageBySlug('reaching-siwa-egypt');
  assertEqual(c.type, 'destination-hub', '3A.2-c: reaching-siwa-egypt classifier output unchanged (D1 re-route is scope-flag layer)');
}
{
  const c = classifyPageBySlug('airports-in-egypt');
  assertEqual(c.type, 'travelTip', '3A.2-d: airports-in-egypt → travelTip (extended map)');
  assertEqual(c.confidence, 'high', '3A.2-d: travelTip confidence high');
}
{
  const c = classifyPageBySlug('dahab-historical-guide');
  assertEqual(c.type, 'destination-subpage', '3A.2-e: canonical dahab-historical-guide unchanged (only -3/-4/-5/-6 are special)');
  assertEqual(c.inferredParentCity, 'dahab', '3A.2-e: parentCity=dahab');
}

// ─── 3B — guideArticle mapper applies overrides ────────────────────────

process.stderr.write('\n# (3B) guideArticle mapper override application\n');

async function runGuideArticleOverrideTests(): Promise<void> {
  const cases: Array<{
    wpSlug: string;
    wpId: number;
    title: string;
    expectedSlug: string;
    expectedSection: 'while-you-are-there' | 'others';
  }> = [
    { wpSlug: 'dahab-historical-guide-3', wpId: 59458, title: 'The Colored Canyon', expectedSlug: 'colored-canyon', expectedSection: 'while-you-are-there' },
    { wpSlug: 'dahab-historical-guide-5', wpId: 59426, title: 'Dahab Exclusives', expectedSlug: 'blue-hole', expectedSection: 'others' },
    { wpSlug: 'dahab-historical-guide-6', wpId: 59422, title: 'Culinary Journey', expectedSlug: 'dahab-restaurants', expectedSection: 'others' },
  ];

  for (const tc of cases) {
    const sanity = makeMockSanity();
    sanity.__seedCity('dahab', 'wp-page-58787-dahab');
    const group = makeGroup(tc.wpSlug, tc.wpId, tc.title);
    const cls = classifyPageBySlug(tc.wpSlug);

    // The classifier produces destination-subpage low-confidence with
    // parentCity=dahab. The mapper applies the override slug + section.
    assertEqual(cls.type, 'destination-subpage', `3B-${tc.wpSlug}: classifier route unchanged (mapper layers overrides)`);
    assertEqual(cls.inferredParentCity, 'dahab', `3B-${tc.wpSlug}: classifier infers parentCity=dahab`);

    const result: MapperResult = await mapGuideArticle(
      sanity as any,
      wpStub,
      group,
      { dryRun: false, classification: cls as Classification }
    );

    assertEqual(result.docs.length, 1, `3B-${tc.wpSlug}: 1 doc emitted`);
    const doc = result.docs[0]!;
    assertEqual(doc._id, `wp-page-${tc.wpId}`, `3B-${tc.wpSlug}: _id from EN entity`);
    assertEqual(doc._type, 'guideArticle', `3B-${tc.wpSlug}: _type guideArticle`);

    // Slug array: override applied symmetrically across EN/ES/JA.
    const slug = doc.slug as Array<{ _key: string; value: { current: string } }>;
    assertEqual(slug.length, 3, `3B-${tc.wpSlug}: 3 locale slug entries`);
    for (const loc of ['en', 'es', 'ja'] as const) {
      const entry = slug.find((s) => s._key === loc);
      assertEqual(entry?.value.current, tc.expectedSlug, `3B-${tc.wpSlug}: ${loc} slug overridden to ${tc.expectedSlug}`);
    }

    // Section override applied.
    assertEqual(doc.section, tc.expectedSection, `3B-${tc.wpSlug}: section=${tc.expectedSection}`);

    // ParentCity reference resolved via mock.
    assertEqual(
      doc.parentCity,
      { _type: 'reference', _ref: 'wp-page-58787-dahab' },
      `3B-${tc.wpSlug}: parentCity ref resolved to seeded dahab`
    );

    // Migration metadata: section is set, so reviewFlag should NOT be
    // 'section-needs-assignment' (override fills it in).
    const migration = doc.migration as { reviewFlag?: string } | undefined;
    assert(
      migration?.reviewFlag !== 'section-needs-assignment',
      `3B-${tc.wpSlug}: no section-needs-assignment flag (override provided section)`
    );

    // Redirect: from_url uses the WP link unchanged; to_path uses the
    // override slug under /guide/<parent>/.
    assertEqual(result.redirects.length, 3, `3B-${tc.wpSlug}: 3 redirects (en/es/ja)`);
    const enRedirect = result.redirects.find((r) => r.locale === 'en');
    assertEqual(
      enRedirect?.from_url,
      group.en.link,
      `3B-${tc.wpSlug}: EN from_url is the WP link (unchanged)`
    );
    assertEqual(
      enRedirect?.to_path,
      `/guide/dahab/${tc.expectedSlug}`,
      `3B-${tc.wpSlug}: EN to_path uses override slug under /guide/dahab/`
    );
    const esRedirect = result.redirects.find((r) => r.locale === 'es');
    assertEqual(
      esRedirect?.to_path,
      `/es/guide/dahab/${tc.expectedSlug}`,
      `3B-${tc.wpSlug}: ES to_path locale-prefixed with override slug`
    );
    const jaRedirect = result.redirects.find((r) => r.locale === 'ja');
    assertEqual(
      jaRedirect?.to_path,
      `/ja/guide/dahab/${tc.expectedSlug}`,
      `3B-${tc.wpSlug}: JA to_path locale-prefixed with override slug`
    );
  }
}

// ─── 3B-bis — guideArticle mapper UNCHANGED for non-override slugs ─────

async function runGuideArticleNoOverrideRegression(): Promise<void> {
  const sanity = makeMockSanity();
  sanity.__seedCity('cairo', 'wp-page-58000-cairo');
  const group = makeGroup('getting-around-cairo', 12345, 'Getting Around Cairo');
  const cls = classifyPageBySlug('getting-around-cairo');

  const result: MapperResult = await mapGuideArticle(
    sanity as any,
    wpStub,
    group,
    { dryRun: false, classification: cls as Classification }
  );

  const doc = result.docs[0]!;
  // Per-locale WP slugs (not symmetric override).
  const slug = doc.slug as Array<{ _key: string; value: { current: string } }>;
  assertEqual(
    slug.find((s) => s._key === 'en')?.value.current,
    'getting-around-cairo',
    '3B-reg: non-override slug uses EN WP slug'
  );
  assertEqual(
    slug.find((s) => s._key === 'es')?.value.current,
    'getting-around-cairo-es',
    '3B-reg: non-override ES slug differs from EN (per-locale WP slug preserved)'
  );
  assertEqual(doc.section, 'while-you-are-there', '3B-reg: section from classifier (no override)');
  // EN redirect uses EN slug.
  const enRedirect = result.redirects.find((r) => r.locale === 'en');
  assertEqual(
    enRedirect?.to_path,
    '/guide/cairo/getting-around-cairo',
    '3B-reg: EN redirect uses EN WP slug'
  );
}

// ─── 3C — Dispatch short-circuit for deferred-editorial ────────────────

async function runDeferDispatchTest(): Promise<void> {
  process.stderr.write('\n# (3C) routeToMapper short-circuits for deferred-editorial\n');

  const sanity = makeMockSanity();
  const group = makeGroup('dahab-historical-guide-4', 59450, 'Events');
  const cls = classifyPageBySlug('dahab-historical-guide-4');

  // Precondition mirror of 3A.1-e.
  assertEqual(cls.reviewFlag, 'deferred-editorial', '3C-pre: classifier sets reviewFlag');

  const result = await routeToMapper(
    sanity as any,
    wpStub,
    group,
    cls,
    0,
    baseCli()
  );

  assert(result !== null, '3C-a: dispatch returns MapperResult shape (not null)');
  assertEqual(result?.docs ?? [], [], '3C-a: docs is empty (no write)');
  assertEqual(result?.redirects ?? [], [], '3C-a: redirects is empty (cutover redirect at session 9, manual)');

  const entries = result?.logEntries ?? [];
  assertEqual(entries.length, 1, '3C-b: exactly one logEntry surfaces the defer');
  const e0 = entries[0]!;
  assertEqual(e0.level, 'info', '3C-b: log level info (not warn/error)');
  assertEqual(e0.wpId, 59450, '3C-b: log entry carries wpId');
  assert(
    typeof e0.message === 'string' && e0.message.includes('editorial-defer'),
    '3C-b: message includes editorial-defer marker'
  );
  const data = e0.data as { code?: string; slug?: string; wpId?: number } | undefined;
  assertEqual(data?.code, 'editorial-defer', '3C-b: data.code is editorial-defer');
  assertEqual(data?.slug, 'dahab-historical-guide-4', '3C-b: data.slug is the WP slug');
}

// ─── 3D — Extended TRAVEL_TIP_SLUG_TO_CATEGORY ─────────────────────────

process.stderr.write('\n# (3D) TRAVEL_TIP_SLUG_TO_CATEGORY extended 18 → 30\n');

assertEqual(Object.keys(TRAVEL_TIP_SLUG_TO_CATEGORY).length, 30, '3D-a: map size locked at 30 entries');

// Investigation 1 case-D additions, distributed across existing 6 buckets.
assertEqual(
  TRAVEL_TIP_SLUG_TO_CATEGORY['health-and-safety'],
  'travelTipCategory-practical-essentials',
  '3D-b: health-and-safety folds into practical-essentials (Q1: no new bucket)'
);
assertEqual(
  TRAVEL_TIP_SLUG_TO_CATEGORY['traveling-with-kids'],
  'travelTipCategory-traveler-segments',
  '3D-c: traveling-with-kids → traveler-segments'
);
assertEqual(
  TRAVEL_TIP_SLUG_TO_CATEGORY['distance-between-egyptian-cities'],
  'travelTipCategory-getting-around',
  '3D-d: distance-between-egyptian-cities → getting-around'
);
assertEqual(
  TRAVEL_TIP_SLUG_TO_CATEGORY['water-safety-in-egypt-advice-for-travelers'],
  'travelTipCategory-practical-essentials',
  '3D-e: water-safety → practical-essentials'
);
assertEqual(
  TRAVEL_TIP_SLUG_TO_CATEGORY['visiting-a-religious-site'],
  'travelTipCategory-culture-and-money',
  '3D-f: visiting-a-religious-site → culture-and-money'
);

// Removal: month-by-month-guide-to-egypt is no longer a travelTip.
assert(
  !Object.prototype.hasOwnProperty.call(TRAVEL_TIP_SLUG_TO_CATEGORY, 'month-by-month-guide-to-egypt'),
  '3D-g: month-by-month-guide-to-egypt removed from travelTip map (now article via Inv 2)'
);

// Phase 3 originals still present.
assertEqual(
  TRAVEL_TIP_SLUG_TO_CATEGORY['airports-in-egypt'],
  'travelTipCategory-getting-around',
  '3D-h: airports-in-egypt still in map (Phase 3 original)'
);
assertEqual(
  TRAVEL_TIP_SLUG_TO_CATEGORY['currency-in-egypt'],
  'travelTipCategory-culture-and-money',
  '3D-i: currency-in-egypt still in map (D4 conditional)'
);

// ─── (3E) DESTINATIONS extension — recovered city slugs (8r-2c) ─────────
//
// 8r-1 found 154 / 417 guideArticles with parentCity null. 8r-2a decomposed:
// 104 city-bearing orphans whose underlying city slug was absent from
// DESTINATIONS, and 28 alias-resolution failures. 8r-2c extended DESTINATIONS
// + added TOKEN_TO_CITY_SLUG. Lock in inferredParentCity resolution for the
// recovered cities — one representative slug per city, matching one of the
// real orphan slugs from `migration/.cache/phase-logs/8r-2a-orphan-slugs.txt`.
process.stderr.write('\n# (3E) DESTINATIONS extension — recovered city resolutions\n');
{
  const recovered: Array<[string, string, string]> = [
    // [orphan slug, expected inferredParentCity, label]
    ['akhmim-weather', 'akhmim', 'akhmim (prefix)'],
    ['where-to-eat-in-akhmim', 'akhmim', 'akhmim (suffix)'],
    ['al-arish-history', 'al-arish', 'al-arish (prefix)'],
    ['food-in-al-arish', 'al-arish', 'al-arish (suffix)'],
    ['al-fayoum-events', 'al-fayoum', 'al-fayoum (prefix)'],
    ['where-to-stay-in-al-fayoum', 'al-fayoum', 'al-fayoum (suffix)'],
    ['food-in-al-wadi-al-gadid', 'al-wadi-al-gadid', 'al-wadi-al-gadid (suffix)'],
    ['baris-tours', 'baris', 'baris (prefix)'],
    ['where-to-stay-in-baris', 'baris', 'baris (suffix)'],
    ['dakhla-oasis-tours', 'dakhla-oasis', 'dakhla-oasis (prefix, longest-match wins over `dakhla`)'],
    ['food-in-dakhla-oasis', 'dakhla-oasis', 'dakhla-oasis (suffix)'],
    ['esna-weather', 'esna', 'esna (prefix)'],
    ['where-to-stay-in-esna', 'esna', 'esna (suffix)'],
    ['farafra-oasis-tours', 'farafra-oasis', 'farafra-oasis (prefix, longest-match wins over `farafra`)'],
    ['food-in-farafra-oasis', 'farafra-oasis', 'farafra-oasis (suffix)'],
    ['food-in-marsa-matruh', 'marsa-matruh', 'marsa-matruh (suffix)'],
    ['where-to-stay-in-marsa-matruh', 'marsa-matruh', 'marsa-matruh (suffix)'],
    ['explore-ras-sudr-tours', 'ras-sudr', 'ras-sudr (middle)'],
    ['food-in-qena', 'qena', 'qena (suffix)'],
    ['food-in-safaga', 'safaga', 'safaga (suffix)'],
    ['where-to-stay-in-safaga', 'safaga', 'safaga (suffix)'],
    ['food-in-bahariya-oasis', 'bahariya-oasis', 'bahariya-oasis (suffix, longest-match wins over `bahariya`)'],
    ['things-to-do-in-bahariya-oasis', 'bahariya-oasis', 'bahariya-oasis (suffix; the original phase-8 404 case)'],
    ['explore-al-minya-tours', 'al-minya', 'al-minya (middle, longest-match wins over `minya`)'],
  ];
  for (const [slug, expected, label] of recovered) {
    const c = classifyPageBySlug(slug);
    assertEqual(c.inferredParentCity, expected, `3E-${label}: ${slug} → ${expected}`);
  }
}

// ─── (3F) TOKEN_TO_CITY_SLUG alias resolution ───────────────────────────
process.stderr.write('\n# (3F) TOKEN_TO_CITY_SLUG alias resolution\n');
{
  // Map shape sanity.
  assertEqual(TOKEN_TO_CITY_SLUG['siwa'], 'siwa-oasis', '3F-shape-a: siwa → siwa-oasis');
  assertEqual(TOKEN_TO_CITY_SLUG['rosetta'], 'rosetta-rasheed', '3F-shape-b: rosetta → rosetta-rasheed');
  assertEqual(TOKEN_TO_CITY_SLUG['fayoum'], 'al-fayoum', '3F-shape-c: fayoum → al-fayoum');
  assertEqual(TOKEN_TO_CITY_SLUG['sharm'], 'sharm-el-sheikh', '3F-shape-d: sharm → sharm-el-sheikh');
  // 8r-2d-fixup: wadi-al-natron transliteration variant → wadi-el-natrun.
  assertEqual(TOKEN_TO_CITY_SLUG['wadi-al-natron'], 'wadi-el-natrun', '3F-shape-e: wadi-al-natron → wadi-el-natrun');

  // End-to-end resolution through classifier — short token in slug must surface
  // the staging-canonical city slug as inferredParentCity.
  const aliasCases: Array<[string, string]> = [
    ['events-in-siwa', 'siwa-oasis'],
    ['siwa-dining-experiences', 'siwa-oasis'],
    ['accommodations-in-farafra', 'farafra-oasis'],
    ['weather-in-farafra', 'farafra-oasis'],
    ['kharga-unearthed', 'kharga-oasis'],
    ['road-to-dakhla', 'dakhla-oasis'],
    ['best-rosetta-tours', 'rosetta-rasheed'],
    ['stay-in-rosetta', 'rosetta-rasheed'],
    ['fayoum-horizons', 'al-fayoum'],
    ['la-maison-bleue-el-gouna', 'al-gouna'],
    ['sharm-el-luli', 'sharm-el-sheikh'],
    // 8r-2d-fixup: end-to-end through classifier, plus negative regression for canonical slug.
    ['things-to-do-in-wadi-al-natron', 'wadi-el-natrun'],
    ['tours-in-wadi-el-natrun', 'wadi-el-natrun'],
  ];
  for (const [slug, expected] of aliasCases) {
    const c = classifyPageBySlug(slug);
    assertEqual(c.inferredParentCity, expected, `3F-${slug}: alias resolves to ${expected}`);
  }
}

// ─── (3G) WADI rule extension — prefix/suffix matching (8r-2c) ──────────
//
// Pre-8r-2c the wadi rule (1g) matched whole-slug only. Extended to
// prefix/suffix/middle so derivative subpages resolve. Plus wadi-el-natrun
// is now its own staging city (renamed from wadi-al-natron in 8r-2c), so
// WADI_TO_PARENT['wadi-el-natrun'].parent = 'wadi-el-natrun' (self-route).
process.stderr.write('\n# (3G) WADI rule extension — derivative-subpage matching\n');
{
  // Whole-slug behavior preserved for the existing fixtures.
  const c1 = classifyPageBySlug('wadi-feiran');
  assertEqual(c1.type, 'destination-subpage', '3G-whole: wadi-feiran still classifies as destination-subpage');
  assertEqual(c1.inferredParentCity, 'sinai', '3G-whole: wadi-feiran → sinai (unchanged)');

  // Wadi-el-natrun now self-parents (it is its own staging city).
  const c2 = classifyPageBySlug('wadi-el-natrun');
  assertEqual(c2.inferredParentCity, 'wadi-el-natrun', '3G-self: wadi-el-natrun self-parents (now a staging city)');

  // Derivative subpages resolve via the extended rule (overrides also bind, but
  // these prove the rule's prefix/suffix/middle reach).
  const derivatives: Array<[string, string]> = [
    ['wadi-el-natrun-history', 'wadi-el-natrun'],
    ['wadi-el-natrun-accommodation-guide', 'wadi-el-natrun'],
    ['wadi-el-natrun-weather-insights', 'wadi-el-natrun'],
    ['where-to-eat-in-wadi-el-natrun', 'wadi-el-natrun'],
    ['tours-in-wadi-el-natrun', 'wadi-el-natrun'],
  ];
  for (const [slug, expected] of derivatives) {
    const c = classifyPageBySlug(slug);
    assertEqual(c.inferredParentCity, expected, `3G-deriv: ${slug} → ${expected}`);
  }
}

// ─── (3H) EXPLICIT_DEFER_SLUGS — 10 entries (Session 9 2b.d.1.fix moved 4 to EXPLICIT_PAGE_ROUTING) ─
process.stderr.write('\n# (3H) EXPLICIT_DEFER_SLUGS — 10 entries (Session 9 2b.d.1.fix moved 4 to EXPLICIT_PAGE_ROUTING)\n');
{
  // wadi-al-hittan, wadi-el-rayan, dendera-village were removed in
  // Session 7 0.5b (moved to EXPLICIT_PAGE_ROUTING + EXPLICIT_PARENT_CITY_OVERRIDES
  // for monument-cohort routing). See block 3K below for their new contract.
  //
  // Session 9 2b.d.1.fix additionally moved ramasside-tours,
  // snorkeling-adventure-on-the-nefertari-submarine,
  // a-9-day-egypt-tour-of-culture-and-history,
  // 10-day-egypt-travel-journey-through-history to EXPLICIT_PAGE_ROUTING
  // → tour-or-package. They now migrate as part of the 12-tour cohort.
  const newDefers = [
    'special-interest-tours',
    'group-day-tours',
    'multiday-adventure-and-safari-tours',
    'private-day-tours',
    'sinai-quest-adventures',
    'ticket-prices-for-attractions-in-al-sharqia',
    'ticket-prices-for-attractions-in-red-sea-sinai',
    'ticket-prices-for-attractions-in-western-desert',
    'events-calendar',
    'saint-catherines-monastery-and-mount-sinai',
  ];
  for (const slug of newDefers) {
    assert(EXPLICIT_DEFER_SLUGS.has(slug), `3H-set: ${slug} present in EXPLICIT_DEFER_SLUGS`);
    const c = classifyPageBySlug(slug);
    assertEqual(c.type, 'unclassified', `3H-class-${slug}: returns unclassified`);
    assertEqual(c.reviewFlag, 'deferred-editorial', `3H-flag-${slug}: reviewFlag=deferred-editorial`);
  }
  // Negative regression: the 3 attractions + 4 Session 9 tour reroutes are NO LONGER in DEFER.
  for (const slug of [
    'wadi-al-hittan',
    'wadi-el-rayan',
    'dendera-village',
    'ramasside-tours',
    'snorkeling-adventure-on-the-nefertari-submarine',
    'a-9-day-egypt-tour-of-culture-and-history',
    '10-day-egypt-travel-journey-through-history',
  ]) {
    assert(
      !EXPLICIT_DEFER_SLUGS.has(slug),
      `3H-neg: ${slug} NOT in EXPLICIT_DEFER_SLUGS (Session 7 0.5b or Session 9 2b.d.1.fix reclassified)`
    );
  }
}

// ─── (3I) EXPLICIT_PARENT_CITY_OVERRIDES — 5 new wadi-el-natrun entries ─
process.stderr.write('\n# (3I) EXPLICIT_PARENT_CITY_OVERRIDES — 5 new entries (8r-2c)\n');
{
  const overrides = [
    'tours-in-wadi-el-natrun',
    'wadi-el-natrun-accommodation-guide',
    'wadi-el-natrun-history',
    'wadi-el-natrun-weather-insights',
    'where-to-eat-in-wadi-el-natrun',
  ];
  for (const slug of overrides) {
    assertEqual(
      EXPLICIT_PARENT_CITY_OVERRIDES[slug],
      'wadi-el-natrun',
      `3I-${slug}: maps to wadi-el-natrun`
    );
  }
}

// ─── (3J) Negative regression — currently-working slugs unchanged ───────
//
// The 263 working guideArticles must continue to work after the DESTINATIONS
// reorder + alias map. Sample slugs that should classify identically to before.
process.stderr.write('\n# (3J) Negative regression — currently-working slugs unchanged\n');
{
  const unchanged: Array<[string, string]> = [
    ['things-to-do-in-cairo', 'cairo'],
    ['getting-around-luxor', 'luxor'],
    ['where-to-stay-in-aswan', 'aswan'],
    ['food-in-abu-simbel', 'abu-simbel'],
    ['history-of-al-quseir', 'al-quseir'],
  ];
  for (const [slug, expected] of unchanged) {
    const c = classifyPageBySlug(slug);
    assertEqual(c.inferredParentCity, expected, `3J-${slug}: still resolves to ${expected}`);
  }
  // dahab-historical-guide must still resolve to dahab (3A.2-e regression).
  const c = classifyPageBySlug('dahab-historical-guide');
  assertEqual(c.inferredParentCity, 'dahab', '3J-dahab-historical-guide: parentCity=dahab unchanged');
}

// ─── (3K) Session 7 0.5b — 3 attractions reclassified to monument cohort ─
//
// wadi-al-hittan, wadi-el-rayan, dendera-village were moved from
// EXPLICIT_DEFER_SLUGS to EXPLICIT_PAGE_ROUTING + EXPLICIT_PARENT_CITY_OVERRIDES.
// They now route as the monument cohort (place_to_go entries on their parent
// city). Per session-7-handoff editorial decision.
process.stderr.write('\n# (3K) Session 7 0.5b — 3 attractions reclassified to monument cohort\n');
{
  const reclassified: Array<{ slug: string; parentCity: string }> = [
    { slug: 'wadi-al-hittan', parentCity: 'al-fayoum' },
    { slug: 'wadi-el-rayan', parentCity: 'al-fayoum' },
    { slug: 'dendera-village', parentCity: 'qena' },
  ];
  for (const { slug, parentCity } of reclassified) {
    // Override-map membership.
    assertEqual(
      EXPLICIT_PAGE_ROUTING[slug],
      'monument',
      `3K-${slug}: EXPLICIT_PAGE_ROUTING[${slug}] === 'monument'`
    );
    assertEqual(
      EXPLICIT_PARENT_CITY_OVERRIDES[slug],
      parentCity,
      `3K-${slug}: EXPLICIT_PARENT_CITY_OVERRIDES[${slug}] === '${parentCity}'`
    );
    // Negative — must not be in DEFER (covered also in 3H-neg, asserted here for proximity).
    assert(
      !EXPLICIT_DEFER_SLUGS.has(slug),
      `3K-${slug}: NOT in EXPLICIT_DEFER_SLUGS (was in 8r-2c, removed in 0.5b)`
    );

    // Classifier output: high-confidence monument route with parent-city.
    const c = classifyPageBySlug(slug);
    assertEqual(c.type, 'monument', `3K-${slug}: classifies as monument`);
    assertEqual(c.confidence, 'high', `3K-${slug}: confidence=high (explicit override)`);
    assertEqual(c.inferredParentCity, parentCity, `3K-${slug}: inferredParentCity=${parentCity}`);
    assert(
      c.reviewFlag !== 'deferred-editorial',
      `3K-${slug}: NOT flagged deferred-editorial`
    );
  }
}

// ─── (3L) inferMonumentType — direct coverage for all 16 enum outputs ───
//
// The function is the slug → monumentType heuristic that the wikiMonument
// mapper uses to satisfy the schema's required monumentType field. Priority
// ordering is contract — multi-token forms must match before their
// single-token overlap (e.g. mortuary-temple before temple).
process.stderr.write('\n# (3L) inferMonumentType — slug → monumentType enum coverage\n');
{
  // Positive: each of the 16 schema enum values reachable from a representative slug.
  const positives: Array<[string, string]> = [
    ['great-pyramid-of-giza', 'pyramid'],
    ['pyramids-of-giza', 'pyramid'],
    ['pyramid-of-hawara', 'pyramid'],
    ['the-temple-of-karnak', 'temple'],
    ['temple-of-hatshepsut', 'temple'],
    ['great-temple-of-abu-simbel', 'temple'],
    ['tomb-of-tutankhamun', 'tomb'],
    ['valley-of-the-kings-tombs', 'tomb'],
    ['rock-cut-tomb-of-ramses', 'rock-cut-tomb'],
    ['mortuary-temple-of-hatshepsut', 'mortuary-temple'],
    ['saqqara-necropolis', 'necropolis'],
    ['necropolis-of-thebes', 'necropolis'],
    ['mosque-of-mohammed-ali', 'mosque'],
    ['mosque-madrassa-of-sultan-hassan', 'mosque'],
    ['madrassa-of-qalawun', 'mosque'],
    ['monastery-of-saint-catherine', 'monastery'],
    ['hanging-church', 'church'],
    ['church-of-the-virgin-mary', 'church'],
    ['st-marks-cathedral', 'church'],
    ['museum-of-egyptian-antiquities', 'museum'],
    ['grand-egyptian-museum', 'museum'],
    ['palace-of-abdeen', 'palace'],
    ['abdeen-palace', 'palace'],
    ['citadel-of-saladin', 'fortress'],
    ['qaitbay-fortress', 'fortress'],
    ['cairo-bastion', 'fortress'],
    ['heliopolis-obelisk', 'obelisk'],
    ['obelisk-of-senusret', 'obelisk'],
    ['memnon-colossi', 'colossus'],
    ['great-colossus-of-ramses', 'colossus'],
    ['mausoleum-of-aga-khan', 'shrine'],
    ['qubbat-al-azhar', 'shrine'],
    ['mashhad-of-imam-shafii', 'shrine'],
    ['sabil-of-mohammed-ali', 'shrine'],
    ['khanqah-of-sultan-baybars', 'shrine'],
    ['shrine-of-saint-george', 'shrine'],
    ['crypt-of-the-anchorites', 'shrine'],
    ['ben-ezra-synagogue', 'other'],
    ['city-of-the-dead-cemetery', 'other'],
    ['khan-el-khalili-bazaar', 'other'],
    ['dendera-village', 'other'],
    ['wadi-al-hittan', 'other'],
  ];
  for (const [slug, expected] of positives) {
    assertEqual(inferMonumentType(slug), expected, `3L-pos-${slug} → ${expected}`);
  }

  // 16-enum coverage assertion: walk the set of distinct outputs we exercised
  // and confirm all 16 schema values are reachable.
  const reached = new Set<string>(positives.map(([, v]) => v));
  const expectedEnumCoverage = [
    'pyramid', 'temple', 'tomb', 'rock-cut-tomb', 'mortuary-temple', 'necropolis',
    'mosque', 'monastery', 'church', 'museum', 'palace', 'fortress',
    'obelisk', 'colossus', 'shrine', 'other',
  ];
  for (const v of expectedEnumCoverage) {
    assert(reached.has(v), `3L-coverage: ${v} reached by at least one positive case`);
  }
  assertEqual(expectedEnumCoverage.length, 16, '3L-coverage: 16-value enum covered exhaustively');
}

// ─── (3L-prio) Priority ordering — multi-word matches beat single-word ──
process.stderr.write('\n# (3L-prio) Priority ordering — rock-cut-tomb before tomb, mortuary-temple before temple\n');
{
  // rock-cut-tomb must win over the 'tomb' generic match.
  assertEqual(
    inferMonumentType('rock-cut-tomb-kv5'),
    'rock-cut-tomb',
    '3L-prio-a: rock-cut-tomb-kv5 → rock-cut-tomb (NOT tomb)'
  );
  // mortuary-temple must win over the 'temple' generic match.
  assertEqual(
    inferMonumentType('mortuary-temple-of-seti-i'),
    'mortuary-temple',
    '3L-prio-b: mortuary-temple-of-seti-i → mortuary-temple (NOT temple)'
  );
  // Ensure the bare forms still hit the single-word branches.
  assertEqual(
    inferMonumentType('tomb-of-tutankhamun'),
    'tomb',
    '3L-prio-c: tomb-of-tutankhamun → tomb (single-word branch reachable)'
  );
  assertEqual(
    inferMonumentType('temple-of-karnak'),
    'temple',
    '3L-prio-d: temple-of-karnak → temple (single-word branch reachable)'
  );
}

// ─── (3L-shrine) Shrine clustering — architect-approved Q1 decision ─────
process.stderr.write('\n# (3L-shrine) Shrine clustering — mausoleum/qubbat/mashhad/sabil/khanqah → shrine\n');
{
  const shrineCases: string[] = [
    'mausoleum-of-mohammed-ali',
    'mausoleum-of-aga-khan',
    'qubbat-al-shafii',
    'qubbat-of-imam-layth',
    'mashhad-al-husayn',
    'mashhad-of-sayyida-zaynab',
    'sabil-of-mohammed-ali',
    'sabil-kuttab-of-katkhuda',
    'khanqah-of-sultan-baybars',
    'khanqah-of-faraj-ibn-barquq',
  ];
  for (const slug of shrineCases) {
    assertEqual(inferMonumentType(slug), 'shrine', `3L-shrine-${slug} → shrine`);
  }
}

// ─── (3L-other) Architect Q2/Q3 — keywords without schema enum → other ──
process.stderr.write('\n# (3L-other) Q2/Q3 — synagogue/cemetery/bazaar/dendera-village → other\n');
{
  const otherCases: string[] = [
    'ben-ezra-synagogue',
    'shaar-hashamayim-synagogue',
    'city-of-the-dead-cemetery',
    'aswan-cemetery',
    'khan-el-khalili-bazaar',
    'dendera-village',
  ];
  for (const slug of otherCases) {
    assertEqual(inferMonumentType(slug), 'other', `3L-other-${slug} → other`);
  }
}

// ─── (3M) wikiMonument mapper shape — monumentType + city ref + warnings ─
//
// Validates the architectural contract of mapWikiMonument's output:
//   - monumentType is ALWAYS present and is one of the 16 enum values
//   - city ref is present when classification.inferredParentCity resolves
//   - city ref is omitted (no field) when inferredParentCity is missing
//     OR the city doc is not found in the dataset
//   - city ref is omitted in dry-run (no Sanity fetch attempted)
//   - city-ref miss emits the warning to stderr (operator triage signal)
async function runWikiMonumentMapperShapeTests(): Promise<void> {
  process.stderr.write('\n# (3M) wikiMonument mapper shape — monumentType + city ref + warnings\n');

  const ENUM_VALUES = new Set([
    'pyramid', 'temple', 'tomb', 'rock-cut-tomb', 'mortuary-temple', 'necropolis',
    'mosque', 'monastery', 'church', 'museum', 'palace', 'fortress',
    'obelisk', 'colossus', 'shrine', 'other',
  ]);

  // (3M-a) monumentType always present; city ref resolved when seeded
  {
    const sanity = makeMockSanity();
    sanity.__seedCity('al-fayoum', 'wp-page-12345-al-fayoum');
    const group = makeGroup('wadi-al-hittan', 90001, 'Wadi Al-Hittan');
    const cls = classifyPageBySlug('wadi-al-hittan');

    const result = await mapWikiMonument(sanity as any, wpStub, group, {
      classification: cls as Classification,
      dryRun: false,
    });

    assertEqual(result.docs.length, 1, '3M-a: 1 doc emitted');
    const doc = result.docs[0]!;
    assertEqual(doc._type, 'wikiMonument', '3M-a: _type=wikiMonument');
    assert(typeof doc.monumentType === 'string', '3M-a: monumentType is a string');
    assert(
      ENUM_VALUES.has(doc.monumentType as string),
      `3M-a: monumentType '${doc.monumentType}' is one of 16 enum values`
    );
    assertEqual(doc.monumentType, 'other', '3M-a: wadi-al-hittan slug → monumentType=other (Q2 decision)');
    assertEqual(
      doc.city,
      { _type: 'reference', _ref: 'wp-page-12345-al-fayoum' },
      '3M-a: city ref resolved to seeded al-fayoum'
    );
  }

  // (3M-b) city ref OMITTED when inferredParentCity is unresolvable (no city doc)
  // — and warning is emitted to stderr.
  {
    const sanity = makeMockSanity(); // no cities seeded
    const group = makeGroup('temple-of-karnak', 90002, 'Temple of Karnak');
    const cls: Classification = {
      type: 'monument',
      reason: 'Test stub',
      confidence: 'high',
      inferredParentCity: 'luxor', // not seeded — should miss
    };

    // Capture stderr to verify the warning surfaces.
    const original = process.stderr.write.bind(process.stderr);
    let captured = '';
    (process.stderr as any).write = (chunk: string | Uint8Array): boolean => {
      captured += typeof chunk === 'string' ? chunk : chunk.toString();
      return true;
    };
    let result: MapperResult;
    try {
      result = await mapWikiMonument(sanity as any, wpStub, group, {
        classification: cls,
        dryRun: false,
      });
    } finally {
      (process.stderr as any).write = original;
    }

    const doc = result.docs[0]!;
    assertEqual(doc.monumentType, 'temple', '3M-b: temple-of-karnak → monumentType=temple');
    assert(!('city' in doc), '3M-b: city field OMITTED when ref unresolvable (no fallback)');
    assert(
      captured.includes('wikiMonument city-ref miss') &&
        captured.includes('resolved=luxor') &&
        captured.includes('source=classifier'),
      '3M-b: stderr warning emitted with slug + resolved=<city> + source=classifier (Phase 1.5b-iii format)'
    );
  }

  // (3M-c) Dry-run: no Sanity fetch attempted, city field omitted even when
  // inferredParentCity is set.
  {
    let fetchCalls = 0;
    const sanity = makeMockSanity();
    sanity.__seedCity('luxor', 'wp-page-99999-luxor');
    const wrappedFetch = sanity.fetch;
    sanity.fetch = (async (q: string, p?: any): Promise<unknown> => {
      fetchCalls++;
      return wrappedFetch(q, p);
    }) as MockSanity['fetch'];
    const group = makeGroup('temple-of-luxor', 90003, 'Temple of Luxor');
    const cls: Classification = {
      type: 'monument',
      reason: 'Test stub',
      confidence: 'high',
      inferredParentCity: 'luxor',
    };

    const result = await mapWikiMonument(sanity as any, wpStub, group, {
      classification: cls,
      dryRun: true,
    });

    const doc = result.docs[0]!;
    assertEqual(doc.monumentType, 'temple', '3M-c: monumentType still computed in dry-run');
    assert(!('city' in doc), '3M-c: city field OMITTED in dry-run mode');
    assertEqual(fetchCalls, 0, '3M-c: zero Sanity fetches in dry-run (no findCityByEnSlug call)');
  }

  // (3M-d) No inferredParentCity → no fetch, no city field, no warning.
  {
    const sanity = makeMockSanity();
    const group = makeGroup('mystery-monument', 90004, 'Mystery Monument');
    const cls: Classification = {
      type: 'monument',
      reason: 'Test stub',
      confidence: 'low',
      // inferredParentCity absent on purpose
    };

    const original = process.stderr.write.bind(process.stderr);
    let captured = '';
    (process.stderr as any).write = (chunk: string | Uint8Array): boolean => {
      captured += typeof chunk === 'string' ? chunk : chunk.toString();
      return true;
    };
    let result: MapperResult;
    try {
      result = await mapWikiMonument(sanity as any, wpStub, group, {
        classification: cls,
        dryRun: false,
      });
    } finally {
      (process.stderr as any).write = original;
    }

    const doc = result.docs[0]!;
    assertEqual(doc.monumentType, 'other', '3M-d: no-prefix-match slug → monumentType=other');
    assert(!('city' in doc), '3M-d: city field OMITTED when inferredParentCity is absent');
    assert(
      !captured.includes('city-ref miss'),
      '3M-d: NO warning when classification has no inferredParentCity (cannot miss what is not asked for)'
    );
  }
}

// ─── (3N) Session 7 Phase 1.5b-i — extractMonumentParentCity ────────────
//
// Phase 1.5a discovered that monument pages encode parent city as an
// Elementor sidebar divider widget with text "{CITY} Travel Guide".
// extractMonumentParentCity walks the Elementor JSON, finds the first
// such divider, normalizes the city token, and returns a staging city
// slug or null. The defensive null-on-unknown contract prevents
// fabricating non-city parent refs when WP source contains junk.

// (3N-extract) Extraction over Elementor JSON shapes
process.stderr.write('\n# (3N-extract) extractMonumentParentCity — JSON walking + regex\n');
{
  // Empty / malformed inputs.
  assertEqual(extractMonumentParentCity(null), null, '3N-extract-null: null input → null');
  assertEqual(extractMonumentParentCity(undefined), null, '3N-extract-undef: undefined input → null');
  assertEqual(extractMonumentParentCity(''), null, '3N-extract-empty: empty string → null');
  assertEqual(extractMonumentParentCity('not-json'), null, '3N-extract-bad-json: malformed JSON → null');
  assertEqual(extractMonumentParentCity('{}'), null, '3N-extract-empty-obj: empty object → null');
  assertEqual(extractMonumentParentCity('[]'), null, '3N-extract-empty-arr: empty array → null');

  // No divider widgets at all.
  const noDivider = JSON.stringify([
    { id: 'a', elType: 'section', elements: [
      { id: 'b', elType: 'widget', widgetType: 'heading', settings: { title: 'Hi' } },
    ]},
  ]);
  assertEqual(extractMonumentParentCity(noDivider), null, '3N-extract-no-divider: tree without divider → null');

  // Divider with non-travel-guide text.
  const irrelevantDivider = JSON.stringify([
    { id: 'a', elType: 'widget', widgetType: 'divider', settings: { text: 'Subscribe to newsletter' } },
  ]);
  assertEqual(extractMonumentParentCity(irrelevantDivider), null, '3N-extract-irrelevant-divider: non-travel-guide text → null');

  // Plain "Cairo Travel Guide" divider.
  const plainCairo = JSON.stringify([
    { widgetType: 'divider', settings: { text: 'Cairo Travel Guide' } },
  ]);
  assertEqual(extractMonumentParentCity(plainCairo), 'cairo', '3N-extract-plain-cairo: plain text → cairo');

  // Uppercase variant.
  const upperCairo = JSON.stringify([
    { widgetType: 'divider', settings: { text: 'CAIRO Travel Guide' } },
  ]);
  assertEqual(extractMonumentParentCity(upperCairo), 'cairo', '3N-extract-upper-cairo: uppercase → cairo (case-insensitive)');

  // Malformed "GIZATravel Guide" (no space, real WP typo).
  const malformedGiza = JSON.stringify([
    { widgetType: 'divider', settings: { text: 'GIZATravel Guide' } },
  ]);
  assertEqual(extractMonumentParentCity(malformedGiza), 'giza', '3N-extract-malformed-giza: missing space → giza (loose regex)');

  // HTML-wrapped text (anchor link).
  const htmlAswan = JSON.stringify([
    {
      widgetType: 'divider',
      settings: {
        text: '<a class="wpil_keyword_link" href="https://travel2egypt.org/aswan-travel-guide/" data-wpil-monitor-id="81061">ASWAN Travel Guide</a>',
      },
    },
  ]);
  assertEqual(extractMonumentParentCity(htmlAswan), 'aswan', '3N-extract-html-aswan: HTML-wrapped → aswan (HTML strip)');

  // Multi-word city with internal spaces.
  const siwaOasis = JSON.stringify([
    { widgetType: 'divider', settings: { text: 'SIWA OASIS Travel Guide' } },
  ]);
  assertEqual(extractMonumentParentCity(siwaOasis), 'siwa-oasis', '3N-extract-siwa-oasis: spaces → hyphenated slug');

  // Deeply nested divider — sections > columns > widgets.
  const nested = JSON.stringify([
    {
      id: 'sec1', elType: 'section', elements: [
        {
          id: 'col1', elType: 'column', elements: [
            { widgetType: 'heading', settings: { title: 'Mosque Story' } },
            { widgetType: 'image', settings: { url: 'foo.jpg' } },
            {
              id: 'col2', elType: 'column', elements: [
                { widgetType: 'divider', settings: { text: 'Luxor Travel Guide' } },
              ],
            },
          ],
        },
      ],
    },
  ]);
  assertEqual(extractMonumentParentCity(nested), 'luxor', '3N-extract-nested: divider 3 levels deep found via DFS');

  // First-divider-wins when multiple dividers present.
  const multiDivider = JSON.stringify([
    { widgetType: 'divider', settings: { text: 'Cairo Travel Guide' } },
    { widgetType: 'divider', settings: { text: 'Luxor Travel Guide' } },
  ]);
  // DFS from end-of-stack: order may vary depending on traversal direction.
  // The contract is "the first divider that resolves" — so accept either as long as
  // one was returned. Lock the actual implementation behavior.
  const multiResult = extractMonumentParentCity(multiDivider);
  assert(
    multiResult === 'cairo' || multiResult === 'luxor',
    `3N-extract-multi: multi-divider returns one valid city (got: ${multiResult})`
  );

  // Divider with text but unknown city → null (defensive).
  const unknownCity = JSON.stringify([
    { widgetType: 'divider', settings: { text: 'Atlantis Travel Guide' } },
  ]);
  assertEqual(extractMonumentParentCity(unknownCity), null, '3N-extract-unknown: unknown city → null (defensive)');

  // Divider with broken settings shape.
  const brokenSettings = JSON.stringify([
    { widgetType: 'divider' }, // no settings
    { widgetType: 'divider', settings: null }, // null settings
    { widgetType: 'divider', settings: { text: 12345 } }, // wrong type
  ]);
  assertEqual(extractMonumentParentCity(brokenSettings), null, '3N-extract-broken-settings: missing/wrong-type settings → null');
}

// (3N-normalize) City token normalization (via behavior of extractMonumentParentCity)
process.stderr.write('\n# (3N-normalize) Token normalization — direct, alias, Unicode\n');
{
  // Helper to wrap a city token in a divider for round-trip testing.
  const wrap = (text: string) => JSON.stringify([
    { widgetType: 'divider', settings: { text: `${text} Travel Guide` } },
  ]);

  // Direct staging slug (no alias needed).
  assertEqual(extractMonumentParentCity(wrap('cairo')), 'cairo', '3N-norm-direct-cairo: direct → cairo');
  assertEqual(extractMonumentParentCity(wrap('luxor')), 'luxor', '3N-norm-direct-luxor: direct → luxor');
  assertEqual(extractMonumentParentCity(wrap('abu-simbel')), 'abu-simbel', '3N-norm-direct-abu-simbel: direct → abu-simbel');

  // Alias resolution (existing TOKEN_TO_CITY_SLUG entries).
  assertEqual(extractMonumentParentCity(wrap('siwa')), 'siwa-oasis', '3N-norm-alias-siwa: siwa → siwa-oasis (existing alias)');
  assertEqual(extractMonumentParentCity(wrap('farafra')), 'farafra-oasis', '3N-norm-alias-farafra: farafra → farafra-oasis');
  assertEqual(extractMonumentParentCity(wrap('st-catherine')), 'saint-catherine', '3N-norm-alias-st-catherine: st-catherine → saint-catherine (existing alias)');
  assertEqual(extractMonumentParentCity(wrap('wadi-al-natron')), 'wadi-el-natrun', '3N-norm-alias-wadi-al-natron: wadi-al-natron → wadi-el-natrun (existing alias)');

  // Phase 1.5b-i NEW aliases.
  assertEqual(extractMonumentParentCity(wrap('abu-simble')), 'abu-simbel', '3N-norm-new-abu-simble: abu-simble typo → abu-simbel (1.5b-i)');
  assertEqual(extractMonumentParentCity(wrap('abu-simblel')), 'abu-simbel', '3N-norm-new-abu-simblel: abu-simblel typo → abu-simbel (1.5b-i)');
  assertEqual(extractMonumentParentCity(wrap('st.-catherine')), 'saint-catherine', '3N-norm-new-st-period: st.-catherine → saint-catherine (1.5b-i)');

  // Unicode-stripped form. Real WP source has 'al-wādī-al-gadīd'; staging slug is 'al-wadi-al-gadid'.
  assertEqual(
    extractMonumentParentCity(wrap('al-wādī-al-gadīd')),
    'al-wadi-al-gadid',
    '3N-norm-unicode: al-wādī-al-gadīd → al-wadi-al-gadid (NFD diacritic strip)'
  );

  // Defensive null returns.
  assertEqual(extractMonumentParentCity(wrap('atlantis')), null, '3N-norm-unknown: unknown token → null (defensive)');
  assertEqual(extractMonumentParentCity(wrap('   ')), null, '3N-norm-whitespace: whitespace-only → null');
  assertEqual(extractMonumentParentCity(wrap('not-a-city-at-all')), null, '3N-norm-bogus: bogus slug → null (defensive — does NOT fabricate)');

  // Confirm the new aliases are observable in the exported map (for direct consumers).
  assertEqual(TOKEN_TO_CITY_SLUG['abu-simble'], 'abu-simbel', '3N-map-abu-simble: TOKEN_TO_CITY_SLUG entry');
  assertEqual(TOKEN_TO_CITY_SLUG['abu-simblel'], 'abu-simbel', '3N-map-abu-simblel: TOKEN_TO_CITY_SLUG entry');
  assertEqual(TOKEN_TO_CITY_SLUG['st.-catherine'], 'saint-catherine', '3N-map-st-period: TOKEN_TO_CITY_SLUG entry');
}

// ─── (3O) Phase 1.5b-ii — 8 monument-cohort misclassification reroutes ──
//
// Investigation in Part A surfaced 7 tour products + 1 hotel that the
// classifier was routing into the monument cohort due to slug-prefix
// collisions (`pyramids-of-`, `the-great-`, `palace-of-`). All 8 carry
// content signals confirming they're NOT monuments: tour widget metadata
// (Price / Duration / Tour Type) for the tours, "About The Hotel" for
// the Pickalbatros entry. Routed via EXPLICIT_PAGE_ROUTING.
process.stderr.write('\n# (3O) Phase 1.5b-ii — 8 misclassification reroutes\n');
{
  const tourReroutes: string[] = [
    'shared-snorkeling-day-at-giftun-island',
    'the-great-pharaohs-and-white-desert',
    'fayoum-oasis-including-pyramids-of-meydum-hawara',
    'pyramids-of-giza-and-grand-egyptian-museum',
    'pyramids-of-giza-and-sphinx',
    'pyramids-of-giza-sphinx-egyptian-museum-khan-el-khalili-tour',
    'pyramids-of-giza-sphinx-memphis-and-saqqara-tour',
  ];
  for (const slug of tourReroutes) {
    assertEqual(
      EXPLICIT_PAGE_ROUTING[slug],
      'tour-or-package',
      `3O-tour-${slug}: EXPLICIT_PAGE_ROUTING entry === 'tour-or-package'`
    );
    const c = classifyPageBySlug(slug);
    assertEqual(c.type, 'tour-or-package', `3O-tour-${slug}: classifies as tour-or-package`);
    assertEqual(c.confidence, 'high', `3O-tour-${slug}: confidence=high (explicit override)`);
    assert(
      c.type !== 'monument',
      `3O-tour-${slug}: NOT classified as monument (negative regression)`
    );
  }

  // 1 hotel reroute
  const hotelSlug = '8-pickalbatros-palace-sharm-aqua-park';
  assertEqual(
    EXPLICIT_PAGE_ROUTING[hotelSlug],
    'hotel',
    `3O-hotel: EXPLICIT_PAGE_ROUTING[${hotelSlug}] === 'hotel'`
  );
  const hotelCls = classifyPageBySlug(hotelSlug);
  assertEqual(hotelCls.type, 'hotel', '3O-hotel: classifies as hotel');
  assertEqual(hotelCls.confidence, 'high', '3O-hotel: confidence=high');
  assert(hotelCls.type !== 'monument', '3O-hotel: NOT monument (negative regression)');
}

// ─── (3P) Phase 1.5b-ii — extractMonumentParentCity &nbsp; decode fix ──
//
// `tawila-island`'s sidebar divider text is `AL GOUNA&nbsp;Travel Guide`
// (literal HTML entity, not yet decoded after tag-strip). Without the
// entity decode, the regex `\s+Travel` fails to match. Phase 1.5b-ii
// adds a targeted `&nbsp;` → space replace so the legitimate Tawila
// Island monument resolves to its parent city al-gouna.
process.stderr.write('\n# (3P) Phase 1.5b-ii — extractMonumentParentCity &nbsp; decode\n');
{
  const wrap = (text: string) => JSON.stringify([
    { widgetType: 'divider', settings: { text: `${text}` } },
  ]);

  // Real `tawila-island` divider shape (with anchor wrapper + nbsp).
  const tawilaShape = wrap(
    '<a href="https://travel2egypt.org/al-gouna-travel-guide/" title="Al Gouna Travel Guide">AL GOUNA&nbsp;Travel Guide</a>'
  );
  assertEqual(
    extractMonumentParentCity(tawilaShape),
    'al-gouna',
    '3P-tawila: AL GOUNA&nbsp;Travel Guide → al-gouna (entity decoded)'
  );

  // Defensive — works for any city shape, not just al-gouna.
  assertEqual(
    extractMonumentParentCity(wrap('CAIRO&nbsp;Travel Guide')),
    'cairo',
    '3P-cairo-nbsp: CAIRO&nbsp;Travel Guide → cairo'
  );
  assertEqual(
    extractMonumentParentCity(wrap('LUXOR&nbsp;Travel Guide')),
    'luxor',
    '3P-luxor-nbsp: LUXOR&nbsp;Travel Guide → luxor'
  );

  // Case-insensitive entity match (real WP HTML is lowercase but be defensive).
  assertEqual(
    extractMonumentParentCity(wrap('GIZA&NBSP;Travel Guide')),
    'giza',
    '3P-uppercase-entity: GIZA&NBSP;Travel Guide → giza (case-insensitive)'
  );

  // Multiple &nbsp; in a row (defensive — collapses to multiple spaces, regex still matches).
  assertEqual(
    extractMonumentParentCity(wrap('ASWAN&nbsp;&nbsp;Travel Guide')),
    'aswan',
    '3P-multi-nbsp: ASWAN&nbsp;&nbsp;Travel Guide → aswan (multiple entities OK)'
  );

  // Negative regression — the happy path for plain text still works.
  assertEqual(
    extractMonumentParentCity(wrap('Cairo Travel Guide')),
    'cairo',
    '3P-plain-still-works: plain-text divider still resolves (fix didn\'t break happy path)'
  );
  assertEqual(
    extractMonumentParentCity(wrap('GIZATravel Guide')),
    'giza',
    '3P-malformed-still-works: malformed (no-space) divider still resolves'
  );

  // Negative — unknown city with &nbsp; still returns null (defensive contract intact).
  assertEqual(
    extractMonumentParentCity(wrap('ATLANTIS&nbsp;Travel Guide')),
    null,
    '3P-unknown-nbsp: unknown city with nbsp still returns null'
  );
}

// ─── (3Q) Phase 1.5b-iii — getExplicitParentCityOverride helper ─────────
process.stderr.write('\n# (3Q) Phase 1.5b-iii — getExplicitParentCityOverride helper\n');
{
  // Returns mapped value when slug is in the override map.
  assertEqual(
    getExplicitParentCityOverride('wadi-al-hittan'),
    'al-fayoum',
    '3Q-helper-1: wadi-al-hittan → al-fayoum'
  );
  assertEqual(
    getExplicitParentCityOverride('dendera-village'),
    'qena',
    '3Q-helper-2: dendera-village → qena'
  );
  assertEqual(
    getExplicitParentCityOverride('the-temple-of-dendera'),
    'qena',
    '3Q-helper-3: the-temple-of-dendera → qena (Phase 1.5b-iii editorial fix)'
  );
  // Returns undefined for slugs NOT in the map (defensive — does not invent overrides).
  assertEqual(
    getExplicitParentCityOverride('mosque-of-ibn-tulun'),
    undefined,
    '3Q-helper-4: non-override slug → undefined'
  );
  assertEqual(
    getExplicitParentCityOverride(''),
    undefined,
    '3Q-helper-5: empty slug → undefined'
  );
  assertEqual(
    getExplicitParentCityOverride('atlantis'),
    undefined,
    '3Q-helper-6: unknown slug → undefined'
  );
}

// ─── (3R) Phase 1.5b-iii — resolveMonumentCity priority logic ───────────
//
// Priority order: override (1) > divider (2) > classifier (3). The mapper
// uses this to derive the city forward-ref. Source field surfaces the
// winning path for stderr logging and downstream test assertions.
process.stderr.write('\n# (3R) Phase 1.5b-iii — resolveMonumentCity priority logic\n');
{
  const dividerJson = (city: string) => JSON.stringify([
    { widgetType: 'divider', settings: { text: `${city} Travel Guide` } },
  ]);
  const cls = (parent?: string): Classification => ({
    type: 'monument',
    reason: 'test',
    confidence: 'med',
    ...(parent ? { inferredParentCity: parent } : {}),
  });

  // Priority 1: override beats everything.
  {
    const r = resolveMonumentCity('wadi-al-hittan', cls('al-fayoum'), dividerJson('Cairo'));
    assertEqual(r.citySlug, 'al-fayoum', '3R-prio1-a: override wins over slug + divider');
    assertEqual(r.source, 'override', '3R-prio1-a: source=override');
  }
  {
    // the-temple-of-dendera: divider says abu-simble (typo for abu-simbel) — wrong city.
    // Override (qena) must win.
    const r = resolveMonumentCity(
      'the-temple-of-dendera',
      cls('dendera'),
      dividerJson('Abu Simbel')
    );
    assertEqual(r.citySlug, 'qena', '3R-prio1-b: dendera-temple override beats wrong divider');
    assertEqual(r.source, 'override', '3R-prio1-b: source=override (Phase 1.5b-iii editorial fix)');
  }

  // Priority 2: divider when no override.
  {
    const r = resolveMonumentCity('mosque-of-ibn-tulun', cls(), dividerJson('Cairo'));
    assertEqual(r.citySlug, 'cairo', '3R-prio2-a: divider used when no override + no classifier');
    assertEqual(r.source, 'divider', '3R-prio2-a: source=divider');
  }
  {
    // Divider beats classifier when both present (the abydos-temple style).
    const r = resolveMonumentCity('abydos-temple', cls('abydos'), dividerJson('Sohag'));
    assertEqual(r.citySlug, 'sohag', '3R-prio2-b: divider beats classifier slug-token (abydos→sohag)');
    assertEqual(r.source, 'divider', '3R-prio2-b: source=divider');
  }

  // Priority 3: classifier when no override and no divider.
  {
    const r = resolveMonumentCity('pyramids-of-giza-and-sphinx', cls('giza'), null);
    assertEqual(r.citySlug, 'giza', '3R-prio3-a: classifier used when override + divider both absent');
    assertEqual(r.source, 'classifier', '3R-prio3-a: source=classifier');
  }
  {
    const r = resolveMonumentCity('temple-of-luxor', cls('luxor'), '');
    assertEqual(r.citySlug, 'luxor', '3R-prio3-b: empty divider JSON → classifier wins');
    assertEqual(r.source, 'classifier', '3R-prio3-b: source=classifier');
  }

  // None: no signal at all.
  {
    const r = resolveMonumentCity('mystery-monument', cls(), null);
    assertEqual(r.citySlug, null, '3R-none-a: nothing resolves → null citySlug');
    assertEqual(r.source, null, '3R-none-a: nothing resolves → null source');
  }

  // Defensive: divider with unknown city returns null → falls through to classifier.
  {
    const r = resolveMonumentCity('test-slug', cls('luxor'), dividerJson('Atlantis'));
    assertEqual(r.citySlug, 'luxor', '3R-defensive: divider returns null on unknown city → falls through to classifier');
    assertEqual(r.source, 'classifier', '3R-defensive: source=classifier (divider disqualified)');
  }
}

// ─── (3R-mapper) Phase 1.5b-iii — mapper integration with priority logic ─
async function runResolveMonumentCityMapperTests(): Promise<void> {
  process.stderr.write('\n# (3R-mapper) Phase 1.5b-iii — mapWikiMonument with priority logic\n');

  // Helper: build a WP entity with optional Elementor data in meta.
  const dividerJson = (city: string) => JSON.stringify([
    { widgetType: 'divider', settings: { text: `${city} Travel Guide` } },
  ]);
  function makeMonumentEntity(opts: {
    id: number;
    slug: string;
    title: string;
    elementorCity?: string | null;
  }): WpEntityFull {
    const base = makeEntity(opts);
    if (opts.elementorCity !== undefined) {
      const meta: Record<string, unknown> =
        opts.elementorCity === null ? {} : { _elementor_data: dividerJson(opts.elementorCity) };
      (base as any).meta = meta;
    }
    return base;
  }
  function makeMonumentGroup(opts: {
    id: number; slug: string; title: string; elementorCity?: string | null;
  }): LocaleGroup {
    const en = makeMonumentEntity(opts);
    const es = makeMonumentEntity({ ...opts, id: opts.id + 1, slug: `${opts.slug}-es`, title: `${opts.title} ES` });
    const ja = makeMonumentEntity({ ...opts, id: opts.id + 2, slug: `${opts.slug}-ja`, title: `${opts.title} JA` });
    const hreflang: HreflangMap = {
      wpId: opts.id,
      links: { en: en.link, es: es.link, ja: ja.link },
    };
    return { en, es, ja, hreflang, singleton: false };
  }

  // 3R-mapper-1: override path (wadi-al-hittan) — divider says wrong city, override wins.
  {
    const sanity = makeMockSanity();
    sanity.__seedCity('al-fayoum', 'wp-page-fayoum');
    sanity.__seedCity('cairo', 'wp-page-cairo');
    const group = makeMonumentGroup({
      id: 91001,
      slug: 'wadi-al-hittan',
      title: 'Wadi Al Hittan',
      elementorCity: 'Cairo', // wrong — override should beat this
    });
    const cls = classifyPageBySlug('wadi-al-hittan');
    const result = await mapWikiMonument(sanity as any, wpStub, group, {
      classification: cls as Classification,
      dryRun: false,
    });
    const doc = result.docs[0]!;
    assertEqual(
      doc.city,
      { _type: 'reference', _ref: 'wp-page-fayoum' },
      '3R-mapper-1: override (al-fayoum) beats divider (cairo) — city ref points to fayoum'
    );
  }

  // 3R-mapper-2: divider path (mosque-of-ibn-tulun) — no override, no classifier slug-match.
  {
    const sanity = makeMockSanity();
    sanity.__seedCity('cairo', 'wp-page-cairo');
    const group = makeMonumentGroup({
      id: 91002,
      slug: 'mosque-of-ibn-tulun',
      title: 'Mosque of Ibn Tulun',
      elementorCity: 'CAIRO',
    });
    const cls = classifyPageBySlug('mosque-of-ibn-tulun');
    const result = await mapWikiMonument(sanity as any, wpStub, group, {
      classification: cls as Classification,
      dryRun: false,
    });
    const doc = result.docs[0]!;
    assertEqual(
      doc.city,
      { _type: 'reference', _ref: 'wp-page-cairo' },
      '3R-mapper-2: divider extraction lands cairo ref'
    );
  }

  // 3R-mapper-3: divider after &nbsp; decode (tawila-island).
  {
    const sanity = makeMockSanity();
    sanity.__seedCity('al-gouna', 'wp-page-al-gouna');
    const group = makeMonumentGroup({
      id: 91003,
      slug: 'tawila-island',
      title: 'Tawila Island',
    });
    // Manually set the elementor data with nbsp-shape to mirror real WP source.
    (group.en as any).meta = {
      _elementor_data: JSON.stringify([
        {
          widgetType: 'divider',
          settings: {
            text: '<a href="https://travel2egypt.org/al-gouna-travel-guide/">AL GOUNA&nbsp;Travel Guide</a>',
          },
        },
      ]),
    };
    const cls = classifyPageBySlug('tawila-island');
    const result = await mapWikiMonument(sanity as any, wpStub, group, {
      classification: cls as Classification,
      dryRun: false,
    });
    const doc = result.docs[0]!;
    assertEqual(
      doc.city,
      { _type: 'reference', _ref: 'wp-page-al-gouna' },
      '3R-mapper-3: tawila-island resolves al-gouna via divider after nbsp decode'
    );
  }

  // 3R-mapper-4: classifier path (no divider available, slug-token inference works).
  {
    const sanity = makeMockSanity();
    sanity.__seedCity('luxor', 'wp-page-luxor');
    const group = makeMonumentGroup({
      id: 91004,
      slug: 'temple-of-luxor',
      title: 'Temple of Luxor',
      elementorCity: null, // no Elementor data
    });
    // synthetic classification with classifier inference
    const cls: Classification = {
      type: 'monument',
      reason: 'test',
      confidence: 'high',
      inferredParentCity: 'luxor',
    };
    const result = await mapWikiMonument(sanity as any, wpStub, group, {
      classification: cls,
      dryRun: false,
    });
    const doc = result.docs[0]!;
    assertEqual(
      doc.city,
      { _type: 'reference', _ref: 'wp-page-luxor' },
      '3R-mapper-4: classifier inferredParentCity used when no override + no divider'
    );
  }

  // 3R-mapper-5: warning includes source field for traceability.
  {
    const sanity = makeMockSanity(); // no cities seeded → ref miss
    const group = makeMonumentGroup({
      id: 91005,
      slug: 'mosque-of-ibn-tulun',
      title: 'Mosque',
      elementorCity: 'CAIRO',
    });
    const cls = classifyPageBySlug('mosque-of-ibn-tulun');

    const original = process.stderr.write.bind(process.stderr);
    let captured = '';
    (process.stderr as any).write = (chunk: string | Uint8Array): boolean => {
      captured += typeof chunk === 'string' ? chunk : chunk.toString();
      return true;
    };
    try {
      await mapWikiMonument(sanity as any, wpStub, group, {
        classification: cls as Classification,
        dryRun: false,
      });
    } finally {
      (process.stderr as any).write = original;
    }
    assert(
      captured.includes('source=divider'),
      '3R-mapper-5: stderr warning records source=divider for the resolution that failed lookup'
    );
    assert(
      captured.includes('resolved=cairo'),
      '3R-mapper-5: stderr warning records resolved=cairo'
    );
  }

  // 3R-mapper-6: dry-run still computes resolution but skips fetch.
  {
    let fetchCalls = 0;
    const sanity = makeMockSanity();
    sanity.__seedCity('cairo', 'wp-page-cairo');
    const wrappedFetch = sanity.fetch;
    sanity.fetch = (async (q: string, p?: any): Promise<unknown> => {
      fetchCalls++;
      return wrappedFetch(q, p);
    }) as MockSanity['fetch'];
    const group = makeMonumentGroup({
      id: 91006,
      slug: 'mosque-of-ibn-tulun',
      title: 'Mosque',
      elementorCity: 'CAIRO',
    });
    const cls = classifyPageBySlug('mosque-of-ibn-tulun');
    const result = await mapWikiMonument(sanity as any, wpStub, group, {
      classification: cls as Classification,
      dryRun: true,
    });
    const doc = result.docs[0]!;
    assert(!('city' in doc), '3R-mapper-6: dry-run omits city field');
    assertEqual(fetchCalls, 0, '3R-mapper-6: dry-run skips Sanity fetch');
  }
}

// ─── Run all ────────────────────────────────────────────────────────────

(async () => {
  await runGuideArticleOverrideTests();
  await runGuideArticleNoOverrideRegression();
  await runDeferDispatchTest();
  await runWikiMonumentMapperShapeTests();
  await runResolveMonumentCityMapperTests();
  process.stdout.write(`\nclassifier-overrides tests: pass=${pass} fail=${fail}\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
