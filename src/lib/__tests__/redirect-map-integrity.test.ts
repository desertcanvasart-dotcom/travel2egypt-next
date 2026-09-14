import assert from 'node:assert/strict';

import { redirects } from '../../../migration/redirect-map.generated';

/**
 * Redirect-map integrity guard.
 *
 * Every redirect must reach its destination in ONE hop. A `destination` that is
 * itself another row's `source` makes a chain: the browser and Googlebot pay an
 * extra round trip, and link signals consolidate one step further from the page
 * that should receive them.
 *
 * This guard exists because the chains come back on their own. The regenerator
 * (`npm run redirect-map:regenerate`) derives a subset of rows from the
 * destination-pages inventory using a same-slug rule, and that rule produces
 * destinations which are themselves redirect sources. On 2026-09-14 a single
 * regenerate run silently reverted 10 hand-verified rows and recreated 10
 * chains — every reverted destination 404'd or 301'd on production while the
 * hand-fixed one returned 200. Nothing failed, so nothing warned.
 *
 * If this test fails after a regenerate run, do NOT re-point the rows to
 * whatever the regenerator produced. Check each destination against the live
 * site and keep the one that answers 200.
 */

/** Sources may be absolute (`https://travel2egypt.org/x`); destinations are always paths. */
const SITE = 'https://travel2egypt.org';
const normalise = (url: string): string => {
  const path = url.startsWith(SITE) ? url.slice(SITE.length) : url;
  // Trailing slashes are normalised away by Next before the redirect is matched,
  // so `/a/` and `/a` are the same target for chain purposes.
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
};

function main(): void {
  assert.ok(redirects.length > 3000, `expected the full redirect map, got ${redirects.length} rows`);

  const sources = redirects.map((r) => normalise(r.source));
  const sourceSet = new Set(sources);

  // 1. No duplicate sources — a second row for the same source is dead config.
  const seen = new Set<string>();
  const duplicates = sources.filter((s) => (seen.has(s) ? true : (seen.add(s), false)));
  assert.deepEqual([...new Set(duplicates)], [], 'duplicate redirect sources');

  // 2. No self-loops — an infinite redirect.
  const selfLoops = redirects
    .filter((r) => normalise(r.source) === normalise(r.destination))
    .map((r) => r.source);
  assert.deepEqual(selfLoops, [], 'redirect rows that point at themselves');

  // 3. No chains — the rule this guard exists for.
  const chains = redirects
    .filter((r) => sourceSet.has(normalise(r.destination)))
    .map((r) => `${normalise(r.source)} -> ${normalise(r.destination)} (which is itself a redirect source)`);
  assert.deepEqual(
    chains,
    [],
    `${chains.length} redirect chain(s); every redirect must resolve in one hop:\n  ${chains.slice(0, 20).join('\n  ')}`,
  );

  console.log(
    `Redirect-map integrity passed (${redirects.length} rows, 0 duplicate sources, 0 self-loops, 0 chains).`,
  );
}

main();
