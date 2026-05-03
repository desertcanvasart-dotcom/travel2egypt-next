/**
 * Tests for the corpus scope-decision layer (--filter-by-template /
 * --type narrowing).
 *
 * Three-test triad per methodology lesson 9:
 *   (a) Unit — decideScope + validateScopeFlags as pure functions, all
 *       --type × --filter-by-template combinations.
 *   (b) Integration — runImportPhase with stub WpClient + SanityClient,
 *       captured stderr asserts per-corpus dispatch matches plan.
 *   (c) Regression-guard — replay the session 5 Step 8 CLI invocation
 *       end-to-end via tsx subprocess and assert the silent-clobber
 *       pattern is now impossible.
 *
 * Run via: `npm run test:scope`. Self-running; non-zero exit on first
 * failure, mirroring scripts/wp-import/__tests__/merge.test.ts.
 */

import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decideScope, validateScopeFlags, ScopeFlagError } from '../scope.js';
import type { CliOptions, WpEntityLite } from '../types.js';
import { runImportPhase } from '../../wp-import.js';
import { emptyStats } from '../log.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

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

function assertThrows(fn: () => void, expectedMessageFragment: string, msg: string): void {
  try {
    fn();
    fail++;
    process.stderr.write(`✗ ${msg} — expected throw, got nothing\n`);
  } catch (e) {
    if (e instanceof Error && e.message.includes(expectedMessageFragment)) {
      pass++;
    } else {
      fail++;
      process.stderr.write(`✗ ${msg} — threw but message mismatch\n  got: ${(e as Error).message}\n  want fragment: ${expectedMessageFragment}\n`);
    }
  }
}

function baseCli(overrides: Partial<CliOptions>): CliOptions {
  return {
    dryRun: true,
    type: 'all',
    language: 'all',
    continueOnError: false,
    verbose: false,
    phase: 'import',
    includeJunk: false,
    rescrapeHreflang: false,
    rate: 4,
    ...overrides,
  };
}

// ─── (a) Unit: decideScope + validateScopeFlags ────────────────────────

process.stderr.write('# (a) Unit — decideScope + validateScopeFlags\n');

// Legacy behavior preserved: no --filter-by-template
{
  const plan = decideScope(baseCli({ type: 'all' }));
  assertEqual(
    [plan.runCategories, plan.runPosts, plan.runPages],
    [true, true, true],
    'a1: --type=all (no template) runs everything'
  );
  assertEqual([plan.postTemplateFilter, plan.pageTemplateFilter], [null, null], 'a1.f: no filters');
}
{
  const plan = decideScope(baseCli({ type: 'category' }));
  assertEqual(
    [plan.runCategories, plan.runPosts, plan.runPages],
    [true, false, false],
    'a2: --type=category runs only categories'
  );
}
{
  const plan = decideScope(baseCli({ type: 'post' }));
  assertEqual(
    [plan.runCategories, plan.runPosts, plan.runPages],
    [false, true, false],
    'a3: --type=post runs only posts'
  );
}
{
  const plan = decideScope(baseCli({ type: 'page' }));
  assertEqual(
    [plan.runCategories, plan.runPosts, plan.runPages],
    [false, false, true],
    'a4: --type=page runs only pages'
  );
}
{
  const plan = decideScope(baseCli({ type: 'both' }));
  assertEqual(
    [plan.runCategories, plan.runPosts, plan.runPages],
    [false, true, true],
    'a5: --type=both (no template) runs pages+posts, no categories'
  );
}

// With --filter-by-template — categories MUST NOT run.
{
  const plan = decideScope(baseCli({ type: 'page', filterByTemplate: 'destination-hub' }));
  assertEqual(
    [plan.runCategories, plan.runPosts, plan.runPages],
    [false, false, true],
    'a6: --filter-by-template + --type=page → only pages'
  );
  assertEqual(plan.pageTemplateFilter, 'destination-hub', 'a6.f: page filter set');
  assertEqual(plan.postTemplateFilter, null, 'a6.f: post filter null (posts disabled)');
}
{
  const plan = decideScope(baseCli({ type: 'post', filterByTemplate: 'article' }));
  assertEqual(
    [plan.runCategories, plan.runPosts, plan.runPages],
    [false, true, false],
    'a7: --filter-by-template + --type=post → only posts'
  );
  assertEqual(plan.postTemplateFilter, 'article', 'a7.f: post filter set');
}
{
  const plan = decideScope(baseCli({ type: 'both', filterByTemplate: 'destination-subpage' }));
  assertEqual(
    [plan.runCategories, plan.runPosts, plan.runPages],
    [false, true, true],
    'a8: --filter-by-template + --type=both → pages+posts'
  );
  assertEqual(
    [plan.postTemplateFilter, plan.pageTemplateFilter],
    ['destination-subpage', 'destination-subpage'],
    'a8.f: both filters set'
  );
}

// Validation gate
{
  validateScopeFlags(baseCli({ type: 'all' })); // ok
  validateScopeFlags(baseCli({ type: 'page', filterByTemplate: 'destination-hub' })); // ok
  pass += 2;
}
assertThrows(
  () => validateScopeFlags(baseCli({ type: 'all', filterByTemplate: 'destination-hub' })),
  'requires --type=page|post|both',
  'a9: --filter-by-template with --type=all is rejected'
);
assertThrows(
  () => validateScopeFlags(baseCli({ type: 'category', filterByTemplate: 'destination-hub' })),
  'requires --type=page|post|both',
  'a10: --filter-by-template with --type=category is rejected'
);
assertThrows(
  () => validateScopeFlags(baseCli({ type: 'attachment', filterByTemplate: 'destination-hub' })),
  'requires --type=page|post|both',
  'a11: --filter-by-template with --type=attachment is rejected'
);

// Summary line shape (light check — full string assertion is brittle)
{
  const plan = decideScope(baseCli({ type: 'page', filterByTemplate: 'destination-hub' }));
  assert(plan.summary.includes('Will iterate'), 'a12: summary mentions Will iterate');
  assert(plan.summary.includes('Will skip'), 'a12: summary mentions Will skip');
  assert(plan.summary.includes('destination-hub'), 'a12: summary mentions template');
  assert(plan.summary.includes('posts'), 'a12: summary mentions posts (in skip line)');
}

// ─── (b) Integration: runImportPhase dispatches per scope plan ─────────

process.stderr.write('\n# (b) Integration — runImportPhase per-corpus dispatch\n');

interface StubCalls {
  getPaginated: Array<{ url: string; params: Record<string, string> }>;
  sanityFetch: Array<{ query: string }>;
  createIfNotExists: Array<{ id: string; type: string }>;
  createOrReplace: Array<{ id: string; type: string }>;
}

function makeStubs(): { wp: any; sanity: any; calls: StubCalls; stderrCapture: string[] } {
  const calls: StubCalls = {
    getPaginated: [],
    sanityFetch: [],
    createIfNotExists: [],
    createOrReplace: [],
  };
  const wp = {
    getPaginated: async (url: string, params: Record<string, string>) => {
      calls.getPaginated.push({ url, params });
      return [] as WpEntityLite[];
    },
    fetchOne: async () => null,
  };
  const sanity = {
    fetch: async (query: string) => {
      calls.sanityFetch.push({ query });
      return [];
    },
    createIfNotExists: async (doc: any) => {
      calls.createIfNotExists.push({ id: doc._id, type: doc._type });
      return doc;
    },
    createOrReplace: async (doc: any) => {
      calls.createOrReplace.push({ id: doc._id, type: doc._type });
      return doc;
    },
    patch: () => ({ commit: async () => null }),
  };
  const stderrCapture: string[] = [];
  return { wp, sanity, calls, stderrCapture };
}

function withCapturedStderr<T>(fn: (sink: string[]) => Promise<T>): Promise<T> {
  const sink: string[] = [];
  const orig = process.stderr.write.bind(process.stderr);
  (process.stderr as any).write = (chunk: any) => {
    sink.push(typeof chunk === 'string' ? chunk : chunk.toString());
    return true;
  };
  return fn(sink).finally(() => {
    (process.stderr as any).write = orig;
  });
}

async function runIntegration(): Promise<void> {
  // b1: --filter-by-template + --type=page → only pages enumerated.
  {
    const { wp, sanity } = makeStubs();
    const cli = baseCli({ type: 'page', filterByTemplate: 'destination-hub', dryRun: true });
    const stats = emptyStats(['--filter-by-template', 'destination-hub', '--type=page', '--dry-run']);
    const sink = await withCapturedStderr(async (s) => {
      await runImportPhase(sanity, wp, cli, stats);
      return s;
    });
    const log = sink.join('');
    assert(log.includes('Will iterate: pages'), 'b1: pages will iterate');
    assert(log.includes('Will skip:') && log.includes('posts'), 'b1: posts will skip');
    assert(log.includes('importing categories...') === false, 'b1: categories pass NOT entered');
    assert(log.includes('enumerating EN posts...') === false, 'b1: posts pass NOT entered');
    assert(log.includes('enumerating EN pages...'), 'b1: pages pass entered');
  }

  // b2: --filter-by-template + --type=both → pages and posts enumerated, no categories.
  {
    const { wp, sanity } = makeStubs();
    const cli = baseCli({ type: 'both', filterByTemplate: 'destination-hub', dryRun: true });
    const stats = emptyStats(['--type=both']);
    const sink = await withCapturedStderr(async (s) => {
      await runImportPhase(sanity, wp, cli, stats);
      return s;
    });
    const log = sink.join('');
    assert(log.includes('importing categories...') === false, 'b2: categories pass NOT entered');
    assert(log.includes('enumerating EN posts...'), 'b2: posts pass entered');
    assert(log.includes('enumerating EN pages...'), 'b2: pages pass entered');
  }

  // b3: legacy --type=all (no template) → all three corpora run.
  {
    const { wp, sanity } = makeStubs();
    const cli = baseCli({ type: 'all', dryRun: true });
    const stats = emptyStats(['--type=all']);
    const sink = await withCapturedStderr(async (s) => {
      await runImportPhase(sanity, wp, cli, stats);
      return s;
    });
    const log = sink.join('');
    assert(log.includes('importing categories...'), 'b3: categories pass entered');
    assert(log.includes('enumerating EN posts...'), 'b3: posts pass entered');
    assert(log.includes('enumerating EN pages...'), 'b3: pages pass entered');
  }

  // b4: --type=category → only categories.
  {
    const { wp, sanity } = makeStubs();
    const cli = baseCli({ type: 'category', dryRun: true });
    const stats = emptyStats(['--type=category']);
    const sink = await withCapturedStderr(async (s) => {
      await runImportPhase(sanity, wp, cli, stats);
      return s;
    });
    const log = sink.join('');
    assert(log.includes('importing categories...'), 'b4: categories pass entered');
    assert(log.includes('enumerating EN posts...') === false, 'b4: posts NOT entered');
    assert(log.includes('enumerating EN pages...') === false, 'b4: pages NOT entered');
  }
}

// ─── (c) Regression-guard: session 5 Step 8 invocation ─────────────────

process.stderr.write('\n# (c) Regression — session 5 Step 8 silent-clobber pattern\n');

function runWpImport(args: string[]): { code: number | null; stdout: string; stderr: string } {
  const r = spawnSync(
    'npx',
    ['--no-install', 'tsx', join(ROOT, 'scripts/wp-import.ts'), ...args],
    { encoding: 'utf8', cwd: ROOT, env: { ...process.env, NEXT_PUBLIC_SANITY_DATASET: 'migration-staging' } }
  );
  return { code: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function runRegression(): void {
  // c1: session 5 Step 8 invocation WITHOUT --type → must error out.
  const r1 = runWpImport([
    '--filter-by-template', 'destination-hub',
    '--slug-pattern', '*-travel-guide',
    '--slug-exclude', 'egypt-travel-guide',
    '--dry-run',
  ]);
  assertEqual(r1.code, 2, 'c1: exit code 2 when --type missing');
  assert(
    r1.stderr.includes('--filter-by-template requires --type=page|post|both'),
    'c1: error message names the requirement'
  );

  // c2: invocation WITH --type=page → validation passes (other failures may
  // occur further downstream because the test env has no live WP endpoint;
  // we only assert validation does NOT reject).
  const r2 = runWpImport([
    '--filter-by-template', 'destination-hub',
    '--slug-pattern', '*-travel-guide',
    '--slug-exclude', 'egypt-travel-guide',
    '--type', 'page',
    '--dry-run',
    '--limit', '0',
  ]);
  assert(
    !r2.stderr.includes('--filter-by-template requires --type='),
    'c2: --type=page passes validation'
  );

  // c3: --type=all with --filter-by-template → must error out (the trap).
  const r3 = runWpImport([
    '--filter-by-template', 'destination-hub',
    '--type', 'all',
    '--dry-run',
  ]);
  assertEqual(r3.code, 2, 'c3: exit code 2 on --type=all + --filter-by-template');
  assert(
    r3.stderr.includes('--filter-by-template requires --type='),
    'c3: error names the requirement'
  );

  // c4: --type=category with --filter-by-template → also rejected.
  const r4 = runWpImport([
    '--filter-by-template', 'destination-hub',
    '--type', 'category',
    '--dry-run',
  ]);
  assertEqual(r4.code, 2, 'c4: exit code 2 on --type=category + --filter-by-template');
}

// ─── Run all ──────────────────────────────────────────────────────────

(async () => {
  await runIntegration();
  runRegression();

  process.stderr.write(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
