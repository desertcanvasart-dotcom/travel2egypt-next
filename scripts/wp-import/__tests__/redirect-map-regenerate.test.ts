/**
 * Tests for the Phase 3b redirect-map regenerator (s55).
 *
 * Covers:
 *   - CSV round-trip (read → write → read) is byte-identical.
 *   - The three §5.2 rules (a/b/c) produce correct targets against the
 *     stock fixture inventory.
 *   - fromUrlToSource: trailing-slash stripping, URL decoding, edge cases.
 *   - emitGeneratedTs: dedup by source, exported `redirects` array shape.
 *   - applyInventory is idempotent (re-run with same inputs is a no-op).
 *
 * Run via: `npm run test:redirect-map-regenerate`.
 * Self-running; non-zero exit on first failure.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyInventory,
  emitGeneratedTs,
  fromUrlToSource,
  makeStaticSlugLookup,
  readInventoryCsv,
  readRedirectMapComments,
  readRedirectMapCsv,
  toPathToDestination,
  writeRedirectMapCsv,
} from '../redirect-map-regenerate.js';
import type { RedirectEntry } from '../types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const REAL_CSV = join(ROOT, 'migration/redirect-map.csv');
const FIXTURE_INVENTORY = join(ROOT, 'scripts/wp-import/__fixtures__/inventory.sample.csv');

let pass = 0;
let fail = 0;

function assert(cond: unknown, msg: string): void {
  if (cond) pass++;
  else {
    fail++;
    process.stderr.write(`✗ ${msg}\n`);
  }
}

function assertEq<T>(actual: T, expected: T, msg: string): void {
  if (JSON.stringify(actual) === JSON.stringify(expected)) pass++;
  else {
    fail++;
    process.stderr.write(
      `✗ ${msg}\n  actual:   ${JSON.stringify(actual)}\n  expected: ${JSON.stringify(expected)}\n`
    );
  }
}

// ── Path helpers ──────────────────────────────────────────────────────────────

assertEq(fromUrlToSource('https://travel2egypt.org/foo/'), '/foo', 'strip trailing slash');
assertEq(fromUrlToSource('https://travel2egypt.org/foo'), '/foo', 'no trailing slash');
assertEq(fromUrlToSource('https://travel2egypt.org/'), '/', 'root stays root');
assertEq(fromUrlToSource('https://travel2egypt.org/es/foo-bar/'), '/es/foo-bar', 'locale prefix preserved');
assertEq(
  fromUrlToSource('https://travel2egypt.org/ja/%E3%83%8A%E3%82%A4%E3%83%AB/'),
  '/ja/ナイル',
  'percent-encoded JA decoded'
);
assertEq(toPathToDestination('/guide/luxor/'), '/guide/luxor', 'destination trailing slash stripped');
assertEq(toPathToDestination('/'), '/', 'destination root stays');

// ── CSV round-trip ────────────────────────────────────────────────────────────

const baseline = readRedirectMapCsv(REAL_CSV);
// The live CSV grows as redirects are added across sessions; assert it parses
// to a non-trivial row set rather than snapshotting an exact (rotting) count.
assert(baseline.length > 100, `baseline reads >100 rows (got ${baseline.length})`);

const tmp = mkdtempSync(join(tmpdir(), 'redirect-map-test-'));
try {
  const out = join(tmp, 'out.csv');
  writeRedirectMapCsv(out, baseline);
  const rt = readRedirectMapCsv(out);
  assert(rt.length === baseline.length, 'round-trip preserves row count');
  for (let i = 0; i < baseline.length; i++) {
    assertEq(rt[i], baseline[i], `round-trip row ${i} identical`);
  }

  // Comment lines (pending, not-yet-live rows) survive a rewrite and stay out of the data.
  const comments = ['# PENDING: /blog/a,/blog/b,en,301,,0.00', '# note'];
  const withComments = join(tmp, 'with-comments.csv');
  writeRedirectMapCsv(withComments, baseline.slice(0, 3), comments);
  assertEq(readRedirectMapComments(withComments), comments, 'comment lines preserved on write');
  assertEq(readRedirectMapCsv(withComments).length, 3, 'comment lines are not parsed as rows');
  const again = join(tmp, 'again.csv');
  writeRedirectMapCsv(again, readRedirectMapCsv(withComments), readRedirectMapComments(withComments));
  assertEq(readFileSync(again, 'utf8'), readFileSync(withComments, 'utf8'), 'rewrite with comments is byte-identical');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ── Inventory fixture + rule engine ───────────────────────────────────────────

const inv = readInventoryCsv(FIXTURE_INVENTORY);
assert(inv.length === 3, `fixture has 3 rows (got ${inv.length})`);

const slugLookup = makeStaticSlugLookup([
  ['luxor', 'valley-of-the-kings'],
  // 'hidden-tomb-of-foobar' intentionally absent → rule b
]);

const emptyBaseline: RedirectEntry[] = [];
const r1 = applyInventory({ baseline: emptyBaseline, inventory: inv, slugLookup });

assertEq(r1.counts.a_specific, 1, 'rule a fired once');
assertEq(r1.counts.b_fallback, 1, 'rule b fired once');
assertEq(r1.counts.c_parent, 1, 'rule c fired once');
assertEq(r1.skipped, 0, 'nothing skipped');
assertEq(r1.entries.length, 3, '3 entries emitted');

const byFrom = new Map(r1.entries.map((e) => [e.from_url, e]));
assertEq(
  byFrom.get('https://travel2egypt.org/valley-of-the-kings-luxor/')?.to_path,
  '/guide/luxor/valley-of-the-kings',
  'rule a → specific URL'
);
assertEq(
  byFrom.get('https://travel2egypt.org/hidden-tomb-of-foobar/')?.to_path,
  '/guide/luxor',
  'rule b → parent fallback'
);
assertEq(
  byFrom.get('https://travel2egypt.org/cultural-tours-in-taba/')?.to_path,
  '/guide/taba',
  'rule c → parent'
);

// ── Idempotency ───────────────────────────────────────────────────────────────

const r2 = applyInventory({ baseline: r1.entries, inventory: inv, slugLookup });
assertEq(r2.added, 0, 'second run adds nothing');
assertEq(r2.upgraded, 0, 'second run upgrades nothing');
assertEq(r2.entries.length, r1.entries.length, 'second run preserves row count');

// ── Rule b → a upgrade path ───────────────────────────────────────────────────

const slugLookupUpgraded = makeStaticSlugLookup([
  ['luxor', 'valley-of-the-kings'],
  ['luxor', 'hidden-tomb-of-foobar'], // now present
]);
const r3 = applyInventory({ baseline: r1.entries, inventory: inv, slugLookup: slugLookupUpgraded });
assertEq(r3.upgraded, 1, 'parent fallback upgrades to specific URL when Sanity doc lands');
assertEq(
  new Map(r3.entries.map((e) => [e.from_url, e])).get('https://travel2egypt.org/hidden-tomb-of-foobar/')?.to_path,
  '/guide/luxor/hidden-tomb-of-foobar',
  'upgraded target is the specific URL'
);

// ── emitGeneratedTs ───────────────────────────────────────────────────────────

const ts = emitGeneratedTs(baseline);
assert(ts.includes('export const redirects: RedirectRule[]'), 'generated TS exports redirects array');
assert(ts.includes('AUTO-GENERATED'), 'header carries AUTO-GENERATED marker');
assert(/permanent": true/.test(ts), 'all redirects emitted as permanent');

// Dedup: build a baseline with two rows sharing the same from_url and verify
// the generated module collapses them.
const dupBaseline: RedirectEntry[] = [
  { from_url: 'https://travel2egypt.org/x/', to_path: '/a', locale: 'en', status_code: 301, legacy_wp_id: null, priority_score: 10 },
  { from_url: 'https://travel2egypt.org/x/', to_path: '/b', locale: 'en', status_code: 301, legacy_wp_id: null, priority_score: 5 },
];
const dupTs = emitGeneratedTs(dupBaseline);
const matches = dupTs.match(/"source": "\/x"/g) ?? [];
assertEq(matches.length, 1, 'emitGeneratedTs dedupes by source');

// ──  Done ─────────────────────────────────────────────────────────────────────

process.stdout.write(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
