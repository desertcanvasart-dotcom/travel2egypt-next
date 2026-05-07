/**
 * Tests for the article + guideArticle merge functions and the
 * applyMerge dispatcher / registry layer.
 *
 * Triad per methodology lesson 9, applied to BOTH new merge functions:
 *   (a) Unit — mergeArticleDoc / mergeGuideArticleDoc Q3 sub-decisions in
 *       isolation.
 *   (b) Integration — persistResult invoked end-to-end against an in-memory
 *       Sanity mock that mimics real createOrReplace clobber semantics.
 *       Pre-seed an existing doc with editorial-only fields, run a fresh
 *       mapper output through persistResult, assert the editorial fields
 *       are preserved post-write. This catches the lesson 8 bug class:
 *       merge function not wired to write path / registry missing entry /
 *       merge logic buggy.
 *   (c) Regression-guard — fingerprint discrimination per type.
 *
 * Plus a registry-throw test: applyMerge with an unregistered _type throws
 * with a clear message (methodology lesson 1: loud failures over silent).
 *
 * Run via: `npm run test:merge-dispatch`. Self-running like merge.test.ts.
 */

import {
  mergeArticleDoc,
  mergeGuideArticleDoc,
  mergeTravelTipDoc,
  mergeWikiMonumentDoc,
  applyMerge,
  isMergeableType,
  ARTICLE_EDITORIAL_ONLY_FIELDS,
  GUIDE_ARTICLE_EDITORIAL_ONLY_FIELDS,
  TRAVEL_TIP_EDITORIAL_ONLY_FIELDS,
  WIKI_MONUMENT_EDITORIAL_ONLY_FIELDS,
  type MergeFetcher,
} from '../merge.js';
import { mapArticle } from '../mappers/article.js';
import type { LocaleGroup } from '../types.js';
import { fingerprint, fingerprintHash } from '../fingerprint.js';
import { persistResult } from '../../wp-import.js';
import { emptyStats } from '../log.js';
import type { CliOptions, MapperResult, SanityDoc } from '../types.js';

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

async function assertThrowsAsync(
  fn: () => Promise<unknown>,
  expectedMessageFragment: string,
  msg: string,
): Promise<void> {
  try {
    await fn();
    fail++;
    process.stderr.write(`✗ ${msg} — expected throw, got nothing\n`);
  } catch (e) {
    if (e instanceof Error && e.message.includes(expectedMessageFragment)) {
      pass++;
    } else {
      fail++;
      process.stderr.write(
        `✗ ${msg} — threw but message mismatch\n  got: ${(e as Error).message}\n  want fragment: ${expectedMessageFragment}\n`,
      );
    }
  }
}

// ─── In-memory Sanity mock with real createOrReplace clobber semantics ──

interface MockSanity {
  fetch: <T = unknown>(query: string, params?: Record<string, unknown>) => Promise<T>;
  createOrReplace: (doc: SanityDoc) => Promise<SanityDoc>;
  /** Test helpers — not part of the SanityClient surface. */
  __seed: (doc: SanityDoc) => void;
  __get: (id: string) => SanityDoc | undefined;
  __ids: () => string[];
}

function makeMockSanity(): MockSanity {
  const store = new Map<string, SanityDoc>();
  return {
    fetch: (async (query: string, params?: Record<string, unknown>): Promise<unknown> => {
      // Support the two query shapes that applyMerge / reconcilePlacesToGo use.
      if (query.includes('_id == $id') && params && 'id' in params) {
        const doc = store.get(params.id as string);
        return doc ?? null;
      }
      // Anything else: empty array (reconcilePlacesToGo etc.).
      return [];
    }) as MockSanity['fetch'],
    createOrReplace: async (doc: SanityDoc): Promise<SanityDoc> => {
      // Real Sanity semantics: createOrReplace fully replaces the doc.
      // No field merging — caller is responsible for passing the full doc.
      // This is exactly the clobber surface the merge layer protects against.
      store.set(doc._id as string, JSON.parse(JSON.stringify(doc)));
      return doc;
    },
    __seed: (doc: SanityDoc) => store.set(doc._id as string, JSON.parse(JSON.stringify(doc))),
    __get: (id: string) => store.get(id),
    __ids: () => [...store.keys()],
  };
}

function baseCli(): CliOptions {
  return {
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
}

function emptyMapperResult(docs: SanityDoc[]): MapperResult {
  return { docs, redirects: [] };
}

// ─── (a) Unit: mergeArticleDoc ──────────────────────────────────────────

process.stderr.write('# (a-article) Unit — mergeArticleDoc Q3 sub-decisions\n');

assertEqual(
  ARTICLE_EDITORIAL_ONLY_FIELDS.slice().sort(),
  ['author', 'category', 'featured', 'relatedArticles', 'relatedCities', 'relatedTours', 'updatedAt'],
  'a-art-1: editorial-only field list locked'
);

// CREATE-first run (existing = null): mapper output is the merged doc.
{
  const wp: SanityDoc = {
    _id: 'wp-post-100-en',
    _type: 'article',
    language: 'en',
    title: 'Cairo essays',
    slug: { _type: 'slug', current: 'cairo-essays' },
    body: [{ _type: 'block', children: [{ _type: 'span', text: 'lorem' }] }],
    author: { _type: 'reference', _ref: 'author-legacy-archive' },
    category: { _type: 'reference', _ref: 'category-destination' },
    publishedAt: '2026-04-29T00:00:00Z',
  };
  const { merged } = mergeArticleDoc(null, wp);
  assertEqual(merged._id, wp._id, 'a-art-2: CREATE _id from mapper');
  assertEqual(merged.title, 'Cairo essays', 'a-art-2: CREATE title from mapper');
  assertEqual(merged.author, wp.author, 'a-art-2: CREATE author from mapper (acknowledged-default)');
}

// UPDATE: editorial-reassigned author + category MUST be preserved.
{
  const existing: SanityDoc = {
    _id: 'wp-post-100-en',
    _type: 'article',
    language: 'en',
    title: 'Stale title',
    body: [{ _type: 'block', children: [{ _type: 'span', text: 'old' }] }],
    author: { _type: 'reference', _ref: 'author-jane-doe' }, // editorial reassignment
    category: { _type: 'reference', _ref: 'category-features' }, // editorial reassignment
    featured: true, // editorial flag
    updatedAt: '2026-05-01T12:00:00Z',
    relatedArticles: [{ _type: 'reference', _ref: 'wp-post-200-en' }],
  };
  const wp: SanityDoc = {
    _id: 'wp-post-100-en',
    _type: 'article',
    language: 'en',
    title: 'Cairo essays (re-import)',
    slug: { _type: 'slug', current: 'cairo-essays' },
    body: [{ _type: 'block', children: [{ _type: 'span', text: 'fresh' }] }],
    author: { _type: 'reference', _ref: 'author-legacy-archive' }, // mapper default
    category: { _type: 'reference', _ref: 'category-destination' }, // heuristic default
    publishedAt: '2026-04-29T00:00:00Z',
  };
  const { merged, perFieldChanges } = mergeArticleDoc(existing, wp);
  assertEqual(merged.title, 'Cairo essays (re-import)', 'a-art-3: WP overwrites title (Q3 rule 1)');
  assertEqual(
    merged.author,
    { _type: 'reference', _ref: 'author-jane-doe' },
    'a-art-3: editorial author preserved (Q3 rule 3 — editorial-only)'
  );
  assertEqual(
    merged.category,
    { _type: 'reference', _ref: 'category-features' },
    'a-art-3: editorial category preserved (Q3 rule 3)'
  );
  assertEqual(merged.featured, true, 'a-art-3: editorial featured flag preserved');
  assertEqual(merged.updatedAt, '2026-05-01T12:00:00Z', 'a-art-3: editorial updatedAt preserved');
  assertEqual(
    merged.relatedArticles,
    [{ _type: 'reference', _ref: 'wp-post-200-en' }],
    'a-art-3: editorial relatedArticles preserved'
  );
  // perFieldChanges should record author/category/featured/updatedAt/relatedArticles
  // as preserved-editorial-only — the audit trail.
  const editorialChanges = perFieldChanges.filter((c) => c.outcome === 'preserved-editorial-only');
  const editorialFields = editorialChanges.map((c) => c.field).sort();
  assertEqual(
    editorialFields,
    ['author', 'category', 'featured', 'relatedArticles', 'updatedAt'],
    'a-art-3: per-field changes record editorial-only outcomes'
  );
}

// Q3 rule 4 not applicable to article (document-level i18n, no per-locale slots
// inside one doc). Field-level i18n is exercised in mergeCityDoc tests.

// ─── (a) Unit: mergeGuideArticleDoc ──────────────────────────────────────

process.stderr.write('# (a-guideArticle) Unit — mergeGuideArticleDoc Q3 sub-decisions\n');

assertEqual(
  GUIDE_ARTICLE_EDITORIAL_ONLY_FIELDS.slice().sort(),
  ['orderRank', 'relatedTours', 'section', 'seo'],
  'a-guide-1: editorial-only field list locked'
);

// UPDATE: classifier-inferred section overlaid by editorial assignment must survive.
{
  const existing: SanityDoc = {
    _id: 'wp-page-500',
    _type: 'guideArticle',
    title: [{ _key: 'en', value: 'Reaching Sohag' }],
    section: 'plan-your-trip', // editorial-locked section (Phase 3 triage equivalent)
    orderRank: 25, // editorial display order
    relatedTours: [{ _type: 'reference', _ref: 'tour-sohag-day' }],
  };
  const wp: SanityDoc = {
    _id: 'wp-page-500',
    _type: 'guideArticle',
    title: [{ _key: 'en', value: 'Reaching Sohag (refreshed)' }],
    section: 'others', // classifier seed default — would clobber the triage decision
    parentCity: { _type: 'reference', _ref: 'city-sohag' },
    body: [{ _key: 'en', value: [{ _type: 'block' }] }],
  };
  const { merged } = mergeGuideArticleDoc(existing, wp);
  assertEqual(
    merged.title,
    [{ _key: 'en', value: 'Reaching Sohag (refreshed)' }],
    'a-guide-2: WP overwrites title'
  );
  assertEqual(merged.section, 'plan-your-trip', 'a-guide-2: editorial section preserved');
  assertEqual(merged.orderRank, 25, 'a-guide-2: editorial orderRank preserved');
  assertEqual(
    merged.relatedTours,
    [{ _type: 'reference', _ref: 'tour-sohag-day' }],
    'a-guide-2: editorial relatedTours preserved'
  );
  assertEqual(
    merged.parentCity,
    { _type: 'reference', _ref: 'city-sohag' },
    'a-guide-2: WP-supplied parentCity flows through'
  );
}

// Q3 rule 4: per-locale slot preservation in i18n title.
{
  const existing: SanityDoc = {
    _id: 'wp-page-501',
    _type: 'guideArticle',
    title: [
      { _key: 'en', value: 'Tipping in Egypt' },
      { _key: 'es', value: 'Propinas en Egipto' },
      { _key: 'ja', value: 'エジプトでのチップ' },
    ],
    section: 'plan-your-trip',
  };
  const wp: SanityDoc = {
    _id: 'wp-page-501',
    _type: 'guideArticle',
    // WP only supplies EN this run (ES + JA already translated in Studio)
    title: [{ _key: 'en', value: 'Tipping in Egypt (refreshed)' }],
  };
  const { merged } = mergeGuideArticleDoc(existing, wp);
  const title = merged.title as Array<{ _key: string; value: string }>;
  const en = title.find((t) => t._key === 'en');
  const es = title.find((t) => t._key === 'es');
  const ja = title.find((t) => t._key === 'ja');
  assertEqual(en?.value, 'Tipping in Egypt (refreshed)', 'a-guide-3: EN slot overwritten by WP (rule 1)');
  assertEqual(es?.value, 'Propinas en Egipto', 'a-guide-3: ES slot preserved (rule 4)');
  assertEqual(ja?.value, 'エジプトでのチップ', 'a-guide-3: JA slot preserved (rule 4)');
  // section editorial-only, still 'plan-your-trip'.
  assertEqual(merged.section, 'plan-your-trip', 'a-guide-3: editorial section preserved');
}

// ─── (a) Unit: mergeTravelTipDoc ─────────────────────────────────────────

process.stderr.write('# (a-travelTip) Unit — mergeTravelTipDoc Q3 sub-decisions\n');

assertEqual(
  TRAVEL_TIP_EDITORIAL_ONLY_FIELDS.slice().sort(),
  ['category', 'relatedTips', 'seo'],
  'a-tip-1: editorial-only field list locked'
);

// CREATE-first: mapper-produced category seeded when existing === null.
{
  const wp: SanityDoc = {
    _id: 'wp-page-60892',
    _type: 'travelTip',
    title: [{ _key: 'en', value: 'Airports in Egypt' }],
    slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: 'airports-in-egypt' } }],
    summary: [{ _key: 'en', value: 'Airports overview…' }],
    body: [{ _key: 'en', _type: 'object', value: [{ _type: 'block' }] }],
    // Mapper-produced acknowledged-default category (resolved.md getting-around bucket).
    category: { _type: 'reference', _ref: 'travelTipCategory-getting-around' },
    migration: { wpId: 60892, source: 'wp-import' },
  };
  const { merged } = mergeTravelTipDoc(null, wp);
  assertEqual(merged._id, wp._id, 'a-tip-2: CREATE _id from mapper');
  assertEqual(merged.title, wp.title, 'a-tip-2: CREATE title from mapper');
  assertEqual(
    merged.category,
    wp.category,
    'a-tip-2: CREATE category from mapper (acknowledged-default — resolved.md routing)'
  );
}

// UPDATE: editorial-reassigned category MUST be preserved.
{
  const existing: SanityDoc = {
    _id: 'wp-page-60892',
    _type: 'travelTip',
    title: [{ _key: 'en', value: 'Airports in Egypt' }],
    // Editor moved this travelTip from getting-around to practical-essentials in Studio.
    category: { _type: 'reference', _ref: 'travelTipCategory-practical-essentials' },
    relatedTips: [{ _type: 'reference', _ref: 'wp-page-60934' }],
    seo: { metaTitle: 'Egyptian airports — operator notes' },
  };
  const wp: SanityDoc = {
    _id: 'wp-page-60892',
    _type: 'travelTip',
    title: [{ _key: 'en', value: 'Airports in Egypt (refreshed)' }],
    slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: 'airports-in-egypt' } }],
    body: [{ _key: 'en', _type: 'object', value: [{ _type: 'block' }] }],
    // Mapper writes the SLUG_TO_CATEGORY default — would clobber the editorial reassignment.
    category: { _type: 'reference', _ref: 'travelTipCategory-getting-around' },
    migration: { wpId: 60892, source: 'wp-import' },
  };
  const { merged, perFieldChanges } = mergeTravelTipDoc(existing, wp);
  assertEqual(
    merged.title,
    wp.title,
    'a-tip-3: WP overwrites title (Q3 rule 1)'
  );
  assertEqual(
    merged.category,
    { _type: 'reference', _ref: 'travelTipCategory-practical-essentials' },
    'a-tip-3: editorial category preserved (lesson 8 wire-in for travelTip)'
  );
  assertEqual(
    merged.relatedTips,
    [{ _type: 'reference', _ref: 'wp-page-60934' }],
    'a-tip-3: editorial relatedTips preserved'
  );
  assertEqual(
    merged.seo,
    { metaTitle: 'Egyptian airports — operator notes' },
    'a-tip-3: editorial seo preserved'
  );
  const editorialFields = perFieldChanges
    .filter((c) => c.outcome === 'preserved-editorial-only')
    .map((c) => c.field)
    .sort();
  assertEqual(
    editorialFields,
    ['category', 'relatedTips', 'seo'],
    'a-tip-3: per-field changes record editorial-only outcomes for all 3 fields'
  );
}

// Q3 rule 4: per-locale i18n title slot preservation (travelTip uses field-level i18n).
{
  const existing: SanityDoc = {
    _id: 'wp-page-60953',
    _type: 'travelTip',
    title: [
      { _key: 'en', value: 'Electricity in Egypt' },
      { _key: 'es', value: 'Electricidad en Egipto' },
      { _key: 'ja', value: 'エジプトの電気' },
    ],
    category: { _type: 'reference', _ref: 'travelTipCategory-practical-essentials' },
  };
  const wp: SanityDoc = {
    _id: 'wp-page-60953',
    _type: 'travelTip',
    // WP only supplies EN this run (ES + JA already polished in Studio).
    title: [{ _key: 'en', value: 'Electricity in Egypt (refreshed)' }],
    category: { _type: 'reference', _ref: 'travelTipCategory-practical-essentials' },
  };
  const { merged } = mergeTravelTipDoc(existing, wp);
  const title = merged.title as Array<{ _key: string; value: string }>;
  assertEqual(
    title.find((t) => t._key === 'en')?.value,
    'Electricity in Egypt (refreshed)',
    'a-tip-4: EN slot overwritten by WP (rule 1)'
  );
  assertEqual(
    title.find((t) => t._key === 'es')?.value,
    'Electricidad en Egipto',
    'a-tip-4: ES slot preserved (rule 4)'
  );
  assertEqual(
    title.find((t) => t._key === 'ja')?.value,
    'エジプトの電気',
    'a-tip-4: JA slot preserved (rule 4)'
  );
}

// ─── (a) Unit: mergeWikiMonumentDoc ──────────────────────────────────────
//
// Session 7 0.5c added wikiMonument to MERGE_REGISTRY. The mapper writes
// monumentType (heuristic from slug) + city (forward-ref from
// inferredParentCity) + the standard mapper-managed fields; this protects
// the 13 editorial-only fields against UPDATE-pass clobber. Same
// acknowledged-default contract as travelTip.category and
// guideArticle.section (lessons 8 + 15).

process.stderr.write('\n# (a-wikiMonument) Unit — mergeWikiMonumentDoc Q3 sub-decisions\n');

assertEqual(
  WIKI_MONUMENT_EDITORIAL_ONLY_FIELDS.slice().sort(),
  [
    'builtBy',
    'builtDuring',
    'buriedHere',
    'coordinates',
    'dedicatedTo',
    'featured',
    'gallery',
    'monumentType',
    'preciseLocation',
    'relatedArticles',
    'relatedMonuments',
    'relatedTours',
    'seo',
  ],
  'a-mon-1: editorial-only field list locked (13 fields, Session 7 0.5c)'
);

// CREATE-first: mapper-produced monumentType + city seeded when existing === null.
{
  const wp: SanityDoc = {
    _id: 'wp-page-87001',
    _type: 'wikiMonument',
    name: [{ _key: 'en', value: 'Temple of Karnak' }],
    slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: 'temple-of-karnak' } }],
    monumentType: 'temple', // mapper heuristic
    city: { _type: 'reference', _ref: 'wp-page-58000-luxor' }, // mapper forward-ref
    summary: [{ _key: 'en', value: 'A vast temple complex…' }],
    body: [{ _key: 'en', _type: 'object', value: [{ _type: 'block' }] }],
    migration: { wpId: 87001, source: 'wp-import' },
  };
  const { merged } = mergeWikiMonumentDoc(null, wp);
  assertEqual(merged._id, wp._id, 'a-mon-2: CREATE _id from mapper');
  assertEqual(merged.name, wp.name, 'a-mon-2: CREATE name from mapper');
  assertEqual(
    merged.monumentType,
    'temple',
    'a-mon-2: CREATE monumentType from mapper (acknowledged-default — slug heuristic)'
  );
  assertEqual(
    merged.city,
    { _type: 'reference', _ref: 'wp-page-58000-luxor' },
    'a-mon-2: CREATE city ref from mapper (forward-ref, mapper-managed)'
  );
}

// UPDATE: editorial-reassigned monumentType + populated wiki-relations MUST
// be preserved; mapper-managed name / body / city are refreshed from WP.
{
  const existing: SanityDoc = {
    _id: 'wp-page-87001',
    _type: 'wikiMonument',
    name: [{ _key: 'en', value: 'Temple of Karnak' }],
    // Editor refined to mortuary-temple after reading the deeper history of
    // the Khonsu temple within the precinct.
    monumentType: 'mortuary-temple',
    preciseLocation: [{ _key: 'en', value: 'East bank, Luxor' }],
    coordinates: { lat: 25.7188, lng: 32.6573 },
    builtBy: [{ _type: 'reference', _ref: 'wp-person-senusret-i' }],
    builtDuring: { _type: 'reference', _ref: 'wp-dynasty-12' },
    dedicatedTo: [{ _type: 'reference', _ref: 'wp-deity-amun-ra' }],
    relatedMonuments: [{ _type: 'reference', _ref: 'wp-page-87002' }],
    relatedTours: [{ _type: 'reference', _ref: 'wp-tour-luxor-half-day' }],
    relatedArticles: [{ _type: 'reference', _ref: 'wp-post-12345' }],
    gallery: [{ _key: 'g1', asset: { _ref: 'image-karnak-pylon' } }],
    featured: true,
    seo: { metaTitle: 'Karnak — operator notes' },
    // city was set in a prior run; editor moved it to luxor-east-bank.
    city: { _type: 'reference', _ref: 'wp-page-58050-luxor-east-bank' },
  };
  const wp: SanityDoc = {
    _id: 'wp-page-87001',
    _type: 'wikiMonument',
    name: [{ _key: 'en', value: 'Temple of Karnak (refreshed)' }],
    slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: 'temple-of-karnak' } }],
    // Mapper writes the slug-heuristic default — would clobber the editorial reassignment.
    monumentType: 'temple',
    // Mapper writes the inferredParentCity forward-ref — overwrites editor's reassignment
    // (acceptable per 0.5c architecture decision; can be promoted to editorial-only later).
    city: { _type: 'reference', _ref: 'wp-page-58000-luxor' },
    body: [{ _key: 'en', _type: 'object', value: [{ _type: 'block' }] }],
    migration: { wpId: 87001, source: 'wp-import' },
  };
  const { merged, perFieldChanges } = mergeWikiMonumentDoc(existing, wp);

  // Mapper-managed fields refreshed from WP.
  assertEqual(
    merged.name,
    wp.name,
    'a-mon-3: WP overwrites name (Q3 rule 1)'
  );
  assertEqual(
    merged.city,
    { _type: 'reference', _ref: 'wp-page-58000-luxor' },
    'a-mon-3: city ref refreshed from mapper (forward-ref is mapper-managed, NOT editorial-only)'
  );

  // Editorial-only fields preserved.
  assertEqual(
    merged.monumentType,
    'mortuary-temple',
    'a-mon-3: editorial monumentType preserved (lesson 8 wire-in for wikiMonument)'
  );
  assertEqual(
    merged.preciseLocation,
    existing.preciseLocation,
    'a-mon-3: editorial preciseLocation preserved'
  );
  assertEqual(
    merged.coordinates,
    existing.coordinates,
    'a-mon-3: editorial coordinates preserved'
  );
  assertEqual(
    merged.builtBy,
    existing.builtBy,
    'a-mon-3: editorial builtBy preserved'
  );
  assertEqual(
    merged.builtDuring,
    existing.builtDuring,
    'a-mon-3: editorial builtDuring preserved'
  );
  assertEqual(
    merged.dedicatedTo,
    existing.dedicatedTo,
    'a-mon-3: editorial dedicatedTo preserved'
  );
  assertEqual(
    merged.relatedMonuments,
    existing.relatedMonuments,
    'a-mon-3: editorial relatedMonuments preserved'
  );
  assertEqual(
    merged.gallery,
    existing.gallery,
    'a-mon-3: editorial gallery preserved'
  );
  assertEqual(merged.featured, true, 'a-mon-3: editorial featured preserved');
  assertEqual(
    merged.seo,
    { metaTitle: 'Karnak — operator notes' },
    'a-mon-3: editorial seo preserved'
  );

  // Per-field-change ledger reports the full editorial-only set.
  const editorialFields = perFieldChanges
    .filter((c) => c.outcome === 'preserved-editorial-only')
    .map((c) => c.field)
    .sort();
  assertEqual(
    editorialFields,
    [
      'builtBy',
      'builtDuring',
      'coordinates',
      'dedicatedTo',
      'featured',
      'gallery',
      'monumentType',
      'preciseLocation',
      'relatedArticles',
      'relatedMonuments',
      'relatedTours',
      'seo',
    ],
    'a-mon-3: per-field changes record editorial-only outcomes for all 12 populated editorial fields (buriedHere unset on existing — not tracked)'
  );
}

// applyMerge dispatch coverage for wikiMonument lives in the Registry block
// below: reg-4 confirms isMergeableType('wikiMonument') === true, which gates
// the persistResult call site. Direct applyMerge invocation against
// wikiMonument would require an async context not available at top level.

// ─── (b) Integration: persistResult preserves editorial-only fields ─────

process.stderr.write('\n# (b) Integration — persistResult end-to-end with clobber-semantics mock\n');

async function runIntegration(): Promise<void> {
  // b-art-1: article — pre-seed editorial state, run mapper-default mapper
  // doc through persistResult, assert editorial state survives.
  {
    const sanity = makeMockSanity();
    sanity.__seed({
      _id: 'wp-post-1001-en',
      _type: 'article',
      language: 'en',
      title: 'Old title',
      author: { _type: 'reference', _ref: 'author-jane-doe' },
      category: { _type: 'reference', _ref: 'category-features' },
      featured: true,
      relatedArticles: [{ _type: 'reference', _ref: 'wp-post-2002-en' }],
    });
    const mapperDoc: SanityDoc = {
      _id: 'wp-post-1001-en',
      _type: 'article',
      language: 'en',
      title: 'Refreshed title',
      slug: { _type: 'slug', current: 'refreshed' },
      body: [{ _type: 'block', children: [{ _type: 'span', text: 'fresh' }] }],
      author: { _type: 'reference', _ref: 'author-legacy-archive' },
      category: { _type: 'reference', _ref: 'category-destination' },
      publishedAt: '2026-04-29T00:00:00Z',
    };
    const stats = emptyStats(['--integration-test']);
    await persistResult(sanity as any, baseCli(), stats, emptyMapperResult([mapperDoc]));
    const stored = sanity.__get('wp-post-1001-en');
    assert(stored !== undefined, 'b-art-1: article persisted');
    assertEqual(stored?.title, 'Refreshed title', 'b-art-1: WP-sourced title overwrote');
    assertEqual(
      stored?.author,
      { _type: 'reference', _ref: 'author-jane-doe' },
      'b-art-1: editorial author preserved through persistResult (the lesson 8 wire-in test)'
    );
    assertEqual(
      stored?.category,
      { _type: 'reference', _ref: 'category-features' },
      'b-art-1: editorial category preserved'
    );
    assertEqual(stored?.featured, true, 'b-art-1: editorial featured flag preserved');
    assertEqual(
      stored?.relatedArticles,
      [{ _type: 'reference', _ref: 'wp-post-2002-en' }],
      'b-art-1: editorial relatedArticles preserved'
    );
  }

  // b-art-2: article CREATE-first — no existing doc, mapper output written verbatim.
  {
    const sanity = makeMockSanity();
    const mapperDoc: SanityDoc = {
      _id: 'wp-post-1002-en',
      _type: 'article',
      language: 'en',
      title: 'New article',
      slug: { _type: 'slug', current: 'new-article' },
      author: { _type: 'reference', _ref: 'author-legacy-archive' },
      category: { _type: 'reference', _ref: 'category-destination' },
    };
    await persistResult(sanity as any, baseCli(), emptyStats([]), emptyMapperResult([mapperDoc]));
    const stored = sanity.__get('wp-post-1002-en');
    assert(stored !== undefined, 'b-art-2: CREATE-first persisted');
    assertEqual(stored?.author, mapperDoc.author, 'b-art-2: CREATE-first writes mapper default');
  }

  // b-guide-1: guideArticle — section editorial-only preservation through persistResult.
  {
    const sanity = makeMockSanity();
    sanity.__seed({
      _id: 'wp-page-3001',
      _type: 'guideArticle',
      title: [{ _key: 'en', value: 'Old' }],
      section: 'plan-your-trip', // simulates Phase 3 triage assignment
      orderRank: 5,
      relatedTours: [{ _type: 'reference', _ref: 'tour-x' }],
    });
    const mapperDoc: SanityDoc = {
      _id: 'wp-page-3001',
      _type: 'guideArticle',
      title: [{ _key: 'en', value: 'Refreshed' }],
      section: 'others', // classifier seed default — would clobber Phase 3 work
      parentCity: { _type: 'reference', _ref: 'city-cairo' },
      body: [{ _key: 'en', value: [{ _type: 'block' }] }],
    };
    await persistResult(sanity as any, baseCli(), emptyStats([]), emptyMapperResult([mapperDoc]));
    const stored = sanity.__get('wp-page-3001');
    assert(stored !== undefined, 'b-guide-1: guideArticle persisted');
    const titleEn = (stored?.title as Array<{ _key: string; value: string }>).find((t) => t._key === 'en');
    assertEqual(titleEn?.value, 'Refreshed', 'b-guide-1: WP-sourced title overwrote');
    assertEqual(stored?.section, 'plan-your-trip', 'b-guide-1: editorial section preserved (Phase 3 work safe)');
    assertEqual(stored?.orderRank, 5, 'b-guide-1: editorial orderRank preserved');
    assertEqual(stored?.relatedTours, [{ _type: 'reference', _ref: 'tour-x' }], 'b-guide-1: relatedTours preserved');
    assertEqual(
      stored?.parentCity,
      { _type: 'reference', _ref: 'city-cairo' },
      'b-guide-1: WP-supplied parentCity flows through'
    );
  }

  // b-tip-1: travelTip — editorial category preservation through persistResult.
  // The lesson-8-equivalent test for travelTip: pre-seed with editor-reassigned
  // category, run mapper-default through persistResult, assert post-write doc
  // retains the editorial assignment, NOT the mapper default. This catches
  // (i) applyMerge not wired into persistResult, (ii) registry missing
  // 'travelTip' entry, (iii) merge logic buggy. All three fail cases produce
  // the same observable: editorial category lost.
  {
    const sanity = makeMockSanity();
    sanity.__seed({
      _id: 'wp-page-60892',
      _type: 'travelTip',
      title: [{ _key: 'en', value: 'Airports in Egypt' }],
      category: { _type: 'reference', _ref: 'travelTipCategory-practical-essentials' },
      relatedTips: [{ _type: 'reference', _ref: 'wp-page-60934' }],
      seo: { metaTitle: 'Egyptian airports — operator notes' },
    });
    const mapperDoc: SanityDoc = {
      _id: 'wp-page-60892',
      _type: 'travelTip',
      title: [{ _key: 'en', value: 'Airports in Egypt (refreshed)' }],
      slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: 'airports-in-egypt' } }],
      summary: [{ _key: 'en', value: 'Airports overview…' }],
      body: [{ _key: 'en', _type: 'object', value: [{ _type: 'block' }] }],
      // Mapper-default category — would clobber editorial reassignment if merge fails.
      category: { _type: 'reference', _ref: 'travelTipCategory-getting-around' },
      migration: { wpId: 60892, source: 'wp-import' },
    };
    await persistResult(sanity as any, baseCli(), emptyStats([]), emptyMapperResult([mapperDoc]));
    const stored = sanity.__get('wp-page-60892');
    assert(stored !== undefined, 'b-tip-1: travelTip persisted');
    const titleEn = (stored?.title as Array<{ _key: string; value: string }>).find((t) => t._key === 'en');
    assertEqual(titleEn?.value, 'Airports in Egypt (refreshed)', 'b-tip-1: WP-sourced title overwrote');
    assertEqual(
      stored?.category,
      { _type: 'reference', _ref: 'travelTipCategory-practical-essentials' },
      'b-tip-1: editorial category preserved (lesson 8 wire-in test for travelTip)'
    );
    assertEqual(
      stored?.relatedTips,
      [{ _type: 'reference', _ref: 'wp-page-60934' }],
      'b-tip-1: editorial relatedTips preserved'
    );
    assertEqual(
      stored?.seo,
      { metaTitle: 'Egyptian airports — operator notes' },
      'b-tip-1: editorial seo preserved'
    );
  }

  // b-tip-2: travelTip CREATE-first — no existing doc, mapper writes acknowledged-default.
  {
    const sanity = makeMockSanity();
    const mapperDoc: SanityDoc = {
      _id: 'wp-page-60953',
      _type: 'travelTip',
      title: [{ _key: 'en', value: 'Electricity in Egypt' }],
      slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: 'electricity-in-egypt' } }],
      summary: [{ _key: 'en', value: 'Plugs, voltage, what to bring.' }],
      category: { _type: 'reference', _ref: 'travelTipCategory-practical-essentials' },
      migration: { wpId: 60953, source: 'wp-import' },
    };
    await persistResult(sanity as any, baseCli(), emptyStats([]), emptyMapperResult([mapperDoc]));
    const stored = sanity.__get('wp-page-60953');
    assert(stored !== undefined, 'b-tip-2: CREATE-first travelTip persisted');
    assertEqual(
      stored?.category,
      mapperDoc.category,
      'b-tip-2: CREATE-first writes mapper default category (acknowledged-default flow)'
    );
  }

  // b-mon-1: wikiMonument — editorial monumentType + wiki-relations preservation
  // through persistResult. Lesson-8-equivalent test for wikiMonument: pre-seed
  // with editor-refined monumentType + populated wiki-relation fields, run
  // mapper-default through persistResult, assert post-write doc retains
  // editorial state. Same triple-failure surface as b-tip-1.
  {
    const sanity = makeMockSanity();
    sanity.__seed({
      _id: 'wp-page-87001',
      _type: 'wikiMonument',
      name: [{ _key: 'en', value: 'Temple of Karnak' }],
      monumentType: 'mortuary-temple', // editor refined
      preciseLocation: [{ _key: 'en', value: 'East bank, Luxor' }],
      builtBy: [{ _type: 'reference', _ref: 'wp-person-senusret-i' }],
      relatedMonuments: [{ _type: 'reference', _ref: 'wp-page-87002' }],
      featured: true,
      seo: { metaTitle: 'Karnak — operator notes' },
    });
    const mapperDoc: SanityDoc = {
      _id: 'wp-page-87001',
      _type: 'wikiMonument',
      name: [{ _key: 'en', value: 'Temple of Karnak (refreshed)' }],
      slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: 'temple-of-karnak' } }],
      // Mapper-default monumentType from slug heuristic — would clobber 'mortuary-temple' editorial.
      monumentType: 'temple',
      // Mapper-managed forward-ref city — refreshed each run.
      city: { _type: 'reference', _ref: 'wp-page-58000-luxor' },
      summary: [{ _key: 'en', value: 'A vast temple complex…' }],
      body: [{ _key: 'en', _type: 'object', value: [{ _type: 'block' }] }],
      migration: { wpId: 87001, source: 'wp-import' },
    };
    await persistResult(sanity as any, baseCli(), emptyStats([]), emptyMapperResult([mapperDoc]));
    const stored = sanity.__get('wp-page-87001');
    assert(stored !== undefined, 'b-mon-1: wikiMonument persisted');
    const nameEn = (stored?.name as Array<{ _key: string; value: string }>).find((n) => n._key === 'en');
    assertEqual(nameEn?.value, 'Temple of Karnak (refreshed)', 'b-mon-1: WP-sourced name overwrote');
    assertEqual(
      stored?.monumentType,
      'mortuary-temple',
      'b-mon-1: editorial monumentType preserved (lesson 8 wire-in test for wikiMonument)'
    );
    assertEqual(
      stored?.preciseLocation,
      [{ _key: 'en', value: 'East bank, Luxor' }],
      'b-mon-1: editorial preciseLocation preserved'
    );
    assertEqual(
      stored?.builtBy,
      [{ _type: 'reference', _ref: 'wp-person-senusret-i' }],
      'b-mon-1: editorial builtBy preserved'
    );
    assertEqual(
      stored?.relatedMonuments,
      [{ _type: 'reference', _ref: 'wp-page-87002' }],
      'b-mon-1: editorial relatedMonuments preserved'
    );
    assertEqual(stored?.featured, true, 'b-mon-1: editorial featured preserved');
    assertEqual(
      stored?.city,
      { _type: 'reference', _ref: 'wp-page-58000-luxor' },
      'b-mon-1: WP-supplied city ref flows through (mapper-managed, NOT editorial-only)'
    );
  }

  // b-non-merge: editorialCategory (a non-mergeable type) bypasses applyMerge
  // and goes through raw createOrReplace. Must not throw via the registry.
  {
    const sanity = makeMockSanity();
    const mapperDoc: SanityDoc = {
      _id: 'wp-category-99',
      _type: 'editorialCategory',
      title: [{ _key: 'en', value: 'Test category' }],
    };
    await persistResult(sanity as any, baseCli(), emptyStats([]), emptyMapperResult([mapperDoc]));
    const stored = sanity.__get('wp-category-99');
    assert(stored !== undefined, 'b-non-merge: non-mergeable type written via createOrReplace bypass');
  }

  // ─── Registry-throw — applyMerge with unregistered _type loud-fails ─────

  process.stderr.write('\n# Registry — applyMerge throws on unregistered _type (lesson 1)\n');

  const noopFetcher: MergeFetcher = { fetch: async () => null as never };
  // hotel is dispatched in routeToMapper but NOT registered in MERGE_REGISTRY
  // (no editorial-only field protection yet — future session work). Used here
  // as the canonical "registered dispatch but unmergeable type" placeholder
  // since wikiMonument graduated to mergeable in Session 7 0.5c.
  await assertThrowsAsync(
    () => applyMerge(noopFetcher, { _id: 'whatever', _type: 'hotel' } as SanityDoc),
    'no merge handler registered for _type="hotel"',
    'reg-1: applyMerge with unregistered type throws (loud failure)'
  );
  await assertThrowsAsync(
    () => applyMerge(noopFetcher, { _id: 'whatever' } as SanityDoc),
    'no merge handler registered',
    'reg-2: applyMerge with missing _type throws'
  );
  await assertThrowsAsync(
    () => applyMerge(noopFetcher, { _type: 'article' } as SanityDoc),
    'mapperDoc lacks _id',
    'reg-3: applyMerge with missing _id throws (cannot fetch existing)'
  );

  // isMergeableType predicate gates the call site in persistResult.
  assert(isMergeableType('city'), 'reg-4: city is mergeable');
  assert(isMergeableType('article'), 'reg-4: article is mergeable');
  assert(isMergeableType('guideArticle'), 'reg-4: guideArticle is mergeable');
  assert(isMergeableType('travelTip'), 'reg-4: travelTip is mergeable (Prereq 3 wired)');
  assert(isMergeableType('wikiMonument'), 'reg-4: wikiMonument is mergeable (Session 7 0.5c wired)');
  assert(!isMergeableType('editorialCategory'), 'reg-4: editorialCategory NOT mergeable');
  assert(!isMergeableType('translation.metadata'), 'reg-4: translation.metadata NOT mergeable');
  assert(!isMergeableType('hotel'), 'reg-4: hotel NOT mergeable yet (future session work)');
  assert(!isMergeableType(undefined), 'reg-4: undefined NOT mergeable');
  assert(!isMergeableType(''), 'reg-4: empty string NOT mergeable');

  // ─── (c) Regression-guard: fingerprint discrimination per type ─────────

  process.stderr.write('\n# (c) Regression — fingerprint discrimination per type\n');

  // c-art-1: different article SHAPES (different field sets) → different hashes.
  // The session 5 fingerprint bug (replacer-array stripping nested keys) made
  // every fingerprint hash to the same value. This test catches that regression.
  {
    const articleA: SanityDoc = {
      _id: 'wp-post-c1-en',
      _type: 'article',
      title: 'A',
      author: { _type: 'reference', _ref: 'author-legacy-archive' },
      migration: { wpId: 100, source: 'wp-import' },
    };
    const articleB: SanityDoc = {
      _id: 'wp-post-c2-en',
      _type: 'article',
      title: 'B',
      author: { _type: 'reference', _ref: 'author-legacy-archive' },
      migration: { wpId: 200, source: 'wp-import' },
      featured: true, // EXTRA field — different shape
      heroImage: { _type: 'image', asset: { _ref: 'image-x' } },
    };
    const fpA = fingerprint(
      [
        { field: 'title', outcome: 'unchanged' },
        { field: 'author', outcome: 'preserved-editorial-only' },
        { field: 'migration', outcome: 'overwritten' },
      ],
      articleA,
      false,
    );
    const fpB = fingerprint(
      [
        { field: 'title', outcome: 'unchanged' },
        { field: 'author', outcome: 'preserved-editorial-only' },
        { field: 'migration', outcome: 'overwritten' },
        { field: 'featured', outcome: 'preserved-editorial-only' },
        { field: 'heroImage', outcome: 'created' },
      ],
      articleB,
      false,
    );
    assert(
      fingerprintHash(fpA) !== fingerprintHash(fpB),
      'c-art-1: different article shapes → different fingerprint hashes (REGRESSION GUARD: session-5 replacer-array bug)'
    );
    const fpADup = fingerprint(
      [
        { field: 'title', outcome: 'unchanged' },
        { field: 'author', outcome: 'preserved-editorial-only' },
        { field: 'migration', outcome: 'overwritten' },
      ],
      JSON.parse(JSON.stringify(articleA)),
      false,
    );
    assertEqual(fingerprintHash(fpADup), fingerprintHash(fpA), 'c-art-2: identical article shape → identical hash');
  }

  // c-guide-1: guideArticle outcome differences → different hashes. Same shape,
  // but per-field outcomes differ (e.g., section preserved vs section created).
  // Fingerprint must discriminate these — they represent semantically different
  // merge decisions even though the resulting doc shape is identical.
  {
    const doc: SanityDoc = {
      _id: 'wp-page-c1',
      _type: 'guideArticle',
      title: [{ _key: 'en', value: 'Tipping' }],
      section: 'plan-your-trip',
    };
    const fpUpdate = fingerprint(
      [
        { field: 'title', outcome: 'unchanged' },
        { field: 'section', outcome: 'preserved-editorial-only' },
      ],
      doc,
      false,
    );
    const fpCreate = fingerprint(
      [
        { field: 'title', outcome: 'created' },
        { field: 'section', outcome: 'created' },
      ],
      doc,
      true, // createMode is keyed in the hash
    );
    assert(
      fingerprintHash(fpUpdate) !== fingerprintHash(fpCreate),
      'c-guide-1: CREATE vs UPDATE outcomes for same guideArticle shape → different hashes'
    );
    // i18n-merged with localesTouched → different hash than i18n-merged without.
    const fpEnOnly = fingerprint(
      [{ field: 'title', outcome: 'i18n-merged', localesTouched: ['en'] }],
      doc,
      false,
    );
    const fpAllLocales = fingerprint(
      [{ field: 'title', outcome: 'i18n-merged', localesTouched: ['en', 'es', 'ja'] }],
      doc,
      false,
    );
    assert(
      fingerprintHash(fpEnOnly) !== fingerprintHash(fpAllLocales),
      'c-guide-2: localesTouched is part of the hash (i18n discrimination)'
    );
  }

  // c-tip-1: travelTip outcome shape differences → different hashes. The merge
  // engine for travelTip is the same generic engine (mergeCityDoc with a
  // different editorialOnlyFields set), so the fingerprint behavior should be
  // structurally identical to city / article / guideArticle. This test ensures
  // there's nothing travelTip-specific that breaks the discrimination contract.
  {
    const docA: SanityDoc = {
      _id: 'wp-page-c-tip-1',
      _type: 'travelTip',
      title: [{ _key: 'en', value: 'Tipping in Egypt' }],
      category: { _type: 'reference', _ref: 'travelTipCategory-culture-and-money' },
    };
    const docB: SanityDoc = {
      _id: 'wp-page-c-tip-2',
      _type: 'travelTip',
      title: [{ _key: 'en', value: 'Bargaining in Egypt' }],
      category: { _type: 'reference', _ref: 'travelTipCategory-culture-and-money' },
      relatedTips: [{ _type: 'reference', _ref: 'wp-page-other' }],
      seo: { metaTitle: 'X' },
    };
    const fpA = fingerprint(
      [
        { field: 'title', outcome: 'unchanged' },
        { field: 'category', outcome: 'preserved-editorial-only' },
      ],
      docA,
      false,
    );
    const fpB = fingerprint(
      [
        { field: 'title', outcome: 'unchanged' },
        { field: 'category', outcome: 'preserved-editorial-only' },
        { field: 'relatedTips', outcome: 'preserved-editorial-only' },
        { field: 'seo', outcome: 'preserved-editorial-only' },
      ],
      docB,
      false,
    );
    assert(
      fingerprintHash(fpA) !== fingerprintHash(fpB),
      'c-tip-1: different travelTip shapes → different fingerprint hashes'
    );
  }

  // ─── (d) Regression: article mapper translation.metadata _id shape ──────
  // 6.5b sub-phase 6r-1 found Sanity silently drops mutations whose _id starts
  // with `translation.metadata.` (200 + transactionId, no persistence). Lock in
  // the fix that uses the canonical `tmeta-` prefix instead.
  process.stderr.write('\n# (d) Regression — translation.metadata _id namespace (6r-1)\n');
  {
    const mkEntry = (id: number, slug: string, locale: string) => ({
      id, slug, link: `https://example.com/${slug}`,
      date: '2024-01-01T00:00:00', modified: '2024-01-01T00:00:00',
      type: 'post', title: { rendered: `T-${locale}` },
      content: { rendered: '' }, excerpt: { rendered: '' },
    });
    const group: LocaleGroup = {
      en: mkEntry(73355, 'egypt-weather-guide', 'en') as any,
      es: mkEntry(143842, 'guia-del-tiempo-en-egipto', 'es') as any,
      ja: mkEntry(162707, 'エジプトの天候ガイド', 'ja') as any,
      hreflang: { wpId: 73355, links: {} },
      singleton: false,
    };
    const result = await mapArticle({} as any, {} as any, group);
    const metaDoc = result.docs.find((d) => d._type === 'translation.metadata');
    assert(metaDoc !== undefined, 'd-meta-1: article mapper emits a translation.metadata doc for multi-locale group');
    const metaId = metaDoc?._id ?? '';
    assert(
      !metaId.startsWith('translation.metadata.'),
      `d-meta-2: metadata _id must not use Sanity's reserved namespace; got: ${metaId}`
    );
    assert(
      !metaId.startsWith('drafts.'),
      `d-meta-3: metadata _id must not start with drafts.; got: ${metaId}`
    );
    assert(
      !metaId.startsWith('versions.'),
      `d-meta-4: metadata _id must not start with versions.; got: ${metaId}`
    );
    assert(
      metaId.startsWith('tmeta-'),
      `d-meta-5: metadata _id must use the canonical tmeta- prefix; got: ${metaId}`
    );
  }
}

// ─── Run all ────────────────────────────────────────────────────────────

(async () => {
  await runIntegration();
  process.stdout.write(`\nmerge-dispatch tests: pass=${pass} fail=${fail}\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
