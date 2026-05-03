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
  applyMerge,
  isMergeableType,
  ARTICLE_EDITORIAL_ONLY_FIELDS,
  GUIDE_ARTICLE_EDITORIAL_ONLY_FIELDS,
  type MergeFetcher,
} from '../merge.js';
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
  await assertThrowsAsync(
    () => applyMerge(noopFetcher, { _id: 'whatever', _type: 'wikiMonument' } as SanityDoc),
    'no merge handler registered for _type="wikiMonument"',
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
  assert(!isMergeableType('editorialCategory'), 'reg-4: editorialCategory NOT mergeable');
  assert(!isMergeableType('translation.metadata'), 'reg-4: translation.metadata NOT mergeable');
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
}

// ─── Run all ────────────────────────────────────────────────────────────

(async () => {
  await runIntegration();
  process.stdout.write(`\nmerge-dispatch tests: pass=${pass} fail=${fail}\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
