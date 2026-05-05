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
  EXPLICIT_PAGE_ROUTING,
  EXPLICIT_SLUG_OVERRIDES,
  EXPLICIT_SECTION_OVERRIDES,
  EXPLICIT_PARENT_CITY_OVERRIDES,
  EXPLICIT_DEFER_SLUGS,
  TOKEN_TO_CITY_SLUG,
} from '../../wp-classifier.js';
import { TRAVEL_TIP_SLUG_TO_CATEGORY } from '../mappers/travelTip.js';
import { mapGuideArticle } from '../mappers/guideArticle.js';
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
assertEqual(Object.keys(EXPLICIT_PAGE_ROUTING).length, 6, '3A.1-f: EXPLICIT_PAGE_ROUTING has 6 entries');
assertEqual(EXPLICIT_DEFER_SLUGS.size, 18, '3A.1-f: EXPLICIT_DEFER_SLUGS has 18 entries (8r-2c added 17)');
assertEqual(Object.keys(EXPLICIT_SLUG_OVERRIDES).length, 3, '3A.1-f: EXPLICIT_SLUG_OVERRIDES has 3 entries');
assertEqual(Object.keys(EXPLICIT_SECTION_OVERRIDES).length, 3, '3A.1-f: EXPLICIT_SECTION_OVERRIDES has 3 entries');
assertEqual(Object.keys(EXPLICIT_PARENT_CITY_OVERRIDES).length, 8, '3A.1-f: EXPLICIT_PARENT_CITY_OVERRIDES has 8 entries (8r-2c added 5)');

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

// ─── (3H) EXPLICIT_DEFER_SLUGS — 17 new entries from 8r-2c ──────────────
process.stderr.write('\n# (3H) EXPLICIT_DEFER_SLUGS — 17 new entries (8r-2b/8r-2c)\n');
{
  const newDefers = [
    'special-interest-tours',
    'group-day-tours',
    'multiday-adventure-and-safari-tours',
    'private-day-tours',
    'sinai-quest-adventures',
    'ramasside-tours',
    'snorkeling-adventure-on-the-nefertari-submarine',
    'a-9-day-egypt-tour-of-culture-and-history',
    '10-day-egypt-travel-journey-through-history',
    'ticket-prices-for-attractions-in-al-sharqia',
    'ticket-prices-for-attractions-in-red-sea-sinai',
    'ticket-prices-for-attractions-in-western-desert',
    'events-calendar',
    'saint-catherines-monastery-and-mount-sinai',
    'wadi-al-hittan',
    'wadi-el-rayan',
    'dendera-village',
  ];
  for (const slug of newDefers) {
    assert(EXPLICIT_DEFER_SLUGS.has(slug), `3H-set: ${slug} present in EXPLICIT_DEFER_SLUGS`);
    const c = classifyPageBySlug(slug);
    assertEqual(c.type, 'unclassified', `3H-class-${slug}: returns unclassified`);
    assertEqual(c.reviewFlag, 'deferred-editorial', `3H-flag-${slug}: reviewFlag=deferred-editorial`);
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

// ─── Run all ────────────────────────────────────────────────────────────

(async () => {
  await runGuideArticleOverrideTests();
  await runGuideArticleNoOverrideRegression();
  await runDeferDispatchTest();
  process.stdout.write(`\nclassifier-overrides tests: pass=${pass} fail=${fail}\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
