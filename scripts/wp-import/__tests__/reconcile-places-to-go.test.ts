/**
 * Tests for `reconcilePlacesToGo` (scripts/wp-import.ts) after Phase 3b
 * refactor.
 *
 * Phase 3b moved reconciliation off `classifyPageBySlug(m.slug)` and onto
 * the existing `wikiMonument.city._ref` forward-ref written by the mapper.
 * Reconciliation is an inversion of that relation, not a re-resolution —
 * reading from Sanity keeps the placesToGo back-edges definitionally
 * consistent with each monument's own city ref.
 *
 * Coverage:
 *   - Single city, single monument → 1 patch with 1 ref
 *   - Single city, 3 monuments → 1 patch with 3 refs
 *   - 3 cities, 5 monuments distributed → 3 patches
 *   - Pre-populated placesToGo + new monument → only new ref appended (dedupe)
 *   - Monument without city field → skipped (defensive GROQ filter)
 *   - Dry-run → counters incremented, no patches issued
 *   - Stats accuracy (citiesUpdated + placesToGoAdded match expected counts)
 *
 * Run via: `npm run test:reconcile`. Self-running.
 */

import { reconcilePlacesToGo } from '../../wp-import.js';
import { emptyStats, type MigrationStats } from '../log.js';
import type { CliOptions, SanityDoc } from '../types.js';

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

// ─── In-memory Sanity mock with reconcile-aware GROQ + patch builder ────

interface PatchOps {
  setIfMissing?: Record<string, unknown>;
  inserts: Array<{ at: 'after' | 'before'; selector: string; items: unknown[] }>;
}

interface MockSanity {
  fetch: <T = unknown>(query: string, params?: Record<string, unknown>) => Promise<T>;
  patch: (id: string) => MockPatch;
  __seedMonument: (id: string, cityId: string | null) => void;
  __seedCity: (id: string, placesToGo?: Array<{ _ref: string; _key?: string; _type?: string }>) => void;
  __getCity: (id: string) => { placesToGo?: Array<{ _ref: string; _key?: string; _type?: string }> } | undefined;
  __patchOpsFor: (id: string) => PatchOps | undefined;
  __patchCount: () => number;
}

interface MockPatch {
  setIfMissing(value: Record<string, unknown>): MockPatch;
  insert(at: 'after' | 'before', selector: string, items: unknown[]): MockPatch;
  commit(): Promise<void>;
}

function makeMockSanity(): MockSanity {
  const monuments = new Map<string, { _id: string; cityId: string | null }>();
  const cities = new Map<string, { _id: string; placesToGo: Array<{ _ref: string; _key?: string; _type?: string }> }>();
  const patchOps = new Map<string, PatchOps>();

  const fetch = (async <T,>(query: string, params?: Record<string, unknown>): Promise<T> => {
    // Reconcile primary query: monument enumeration with city ref projection.
    if (
      query.includes('_type == "wikiMonument"') &&
      query.includes('defined(migration.wpId)') &&
      query.includes('defined(city)') &&
      query.includes('city._ref')
    ) {
      const out = [...monuments.values()]
        .filter((m) => m.cityId !== null)
        .map((m) => ({ _id: m._id, cityId: m.cityId }));
      return out as unknown as T;
    }
    // Reconcile current placesToGo lookup.
    if (query.includes('placesToGo') && params && 'id' in params) {
      const c = cities.get(params.id as string);
      return (c?.placesToGo ?? null) as unknown as T;
    }
    return null as unknown as T;
  }) as MockSanity['fetch'];

  function makePatch(id: string): MockPatch {
    if (!patchOps.has(id)) patchOps.set(id, { inserts: [] });
    const ops = patchOps.get(id)!;
    const builder: MockPatch = {
      setIfMissing(value) {
        ops.setIfMissing = { ...(ops.setIfMissing ?? {}), ...value };
        return builder;
      },
      insert(at, selector, items) {
        ops.inserts.push({ at, selector, items });
        return builder;
      },
      async commit() {
        // Mimic real Sanity behavior: setIfMissing only applies if field absent;
        // insert appends to the placesToGo array.
        const city = cities.get(id);
        if (!city) return;
        if (ops.setIfMissing && 'placesToGo' in ops.setIfMissing && city.placesToGo === undefined) {
          city.placesToGo = [];
        }
        for (const ins of ops.inserts) {
          if (ins.selector.includes('placesToGo')) {
            city.placesToGo.push(...(ins.items as Array<{ _ref: string; _key?: string; _type?: string }>));
          }
        }
      },
    };
    return builder;
  }

  return {
    fetch,
    patch: makePatch,
    __seedMonument: (id, cityId) => monuments.set(id, { _id: id, cityId }),
    __seedCity: (id, placesToGo = []) => cities.set(id, { _id: id, placesToGo: [...placesToGo] }),
    __getCity: (id) => cities.get(id),
    __patchOpsFor: (id) => patchOps.get(id),
    __patchCount: () => patchOps.size,
  };
}

function baseCli(overrides: Partial<CliOptions> = {}): CliOptions {
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
    ...overrides,
  };
}

function freshStats(): MigrationStats {
  return emptyStats([]);
}

// ─── Tests ──────────────────────────────────────────────────────────────

(async () => {
  // (a) Single city, single monument
  process.stderr.write('# (a) Single city, single monument\n');
  {
    const sanity = makeMockSanity();
    sanity.__seedMonument('wp-page-100', 'wp-page-cairo');
    sanity.__seedCity('wp-page-cairo');

    const stats = freshStats();
    await reconcilePlacesToGo(sanity as any, baseCli(), stats);

    assertEqual(stats.reconciliation.citiesUpdated, 1, 'a: citiesUpdated=1');
    assertEqual(stats.reconciliation.placesToGoAdded, 1, 'a: placesToGoAdded=1');
    const cairo = sanity.__getCity('wp-page-cairo')!;
    assertEqual(cairo.placesToGo?.length, 1, 'a: cairo.placesToGo has 1 ref');
    assertEqual(cairo.placesToGo?.[0]._ref, 'wp-page-100', 'a: ref points at the monument');
  }

  // (b) Single city, 3 monuments grouped → 1 patch with 3 refs
  process.stderr.write('\n# (b) Single city, 3 monuments → 1 patch with 3 refs\n');
  {
    const sanity = makeMockSanity();
    sanity.__seedMonument('wp-page-200', 'wp-page-luxor');
    sanity.__seedMonument('wp-page-201', 'wp-page-luxor');
    sanity.__seedMonument('wp-page-202', 'wp-page-luxor');
    sanity.__seedCity('wp-page-luxor');

    const stats = freshStats();
    await reconcilePlacesToGo(sanity as any, baseCli(), stats);

    assertEqual(stats.reconciliation.citiesUpdated, 1, 'b: 1 city updated');
    assertEqual(stats.reconciliation.placesToGoAdded, 3, 'b: 3 refs added');
    const luxor = sanity.__getCity('wp-page-luxor')!;
    assertEqual(luxor.placesToGo?.length, 3, 'b: luxor has 3 placesToGo refs');
    const refSet = new Set((luxor.placesToGo ?? []).map((r) => r._ref));
    assert(refSet.has('wp-page-200') && refSet.has('wp-page-201') && refSet.has('wp-page-202'), 'b: all 3 monument refs present');
  }

  // (c) 3 cities, 5 monuments distributed → 3 patches
  process.stderr.write('\n# (c) 3 cities, 5 monuments distributed → 3 patches\n');
  {
    const sanity = makeMockSanity();
    sanity.__seedMonument('wp-page-300', 'wp-page-cairo');
    sanity.__seedMonument('wp-page-301', 'wp-page-cairo');
    sanity.__seedMonument('wp-page-302', 'wp-page-luxor');
    sanity.__seedMonument('wp-page-303', 'wp-page-aswan');
    sanity.__seedMonument('wp-page-304', 'wp-page-aswan');
    sanity.__seedCity('wp-page-cairo');
    sanity.__seedCity('wp-page-luxor');
    sanity.__seedCity('wp-page-aswan');

    const stats = freshStats();
    await reconcilePlacesToGo(sanity as any, baseCli(), stats);

    assertEqual(stats.reconciliation.citiesUpdated, 3, 'c: 3 cities updated');
    assertEqual(stats.reconciliation.placesToGoAdded, 5, 'c: 5 refs added across cities');
    assertEqual(sanity.__getCity('wp-page-cairo')?.placesToGo?.length, 2, 'c: cairo has 2');
    assertEqual(sanity.__getCity('wp-page-luxor')?.placesToGo?.length, 1, 'c: luxor has 1');
    assertEqual(sanity.__getCity('wp-page-aswan')?.placesToGo?.length, 2, 'c: aswan has 2');
  }

  // (d) Pre-populated placesToGo + new monument → only new ref appended (dedupe)
  process.stderr.write('\n# (d) Pre-populated placesToGo + new monument → dedupe contract\n');
  {
    const sanity = makeMockSanity();
    sanity.__seedMonument('wp-page-400', 'wp-page-cairo'); // already in placesToGo
    sanity.__seedMonument('wp-page-401', 'wp-page-cairo'); // new — should be added
    sanity.__seedCity('wp-page-cairo', [
      { _ref: 'wp-page-400', _key: 'pre1', _type: 'reference' },
    ]);

    const stats = freshStats();
    await reconcilePlacesToGo(sanity as any, baseCli(), stats);

    assertEqual(stats.reconciliation.citiesUpdated, 1, 'd: 1 city updated');
    assertEqual(stats.reconciliation.placesToGoAdded, 1, 'd: only 1 new ref added (existing 400 deduped)');
    const cairo = sanity.__getCity('wp-page-cairo')!;
    assertEqual(cairo.placesToGo?.length, 2, 'd: cairo has 2 refs total (1 pre + 1 new)');
    const refs = (cairo.placesToGo ?? []).map((r) => r._ref).sort();
    assertEqual(refs, ['wp-page-400', 'wp-page-401'], 'd: existing ref preserved + new ref appended');
  }

  // (e) Idempotency: re-running on already-reconciled state produces 0 changes
  process.stderr.write('\n# (e) Idempotency — re-run produces 0 changes\n');
  {
    const sanity = makeMockSanity();
    sanity.__seedMonument('wp-page-500', 'wp-page-giza');
    sanity.__seedMonument('wp-page-501', 'wp-page-giza');
    sanity.__seedCity('wp-page-giza');

    // First run: should add 2 refs.
    const stats1 = freshStats();
    await reconcilePlacesToGo(sanity as any, baseCli(), stats1);
    assertEqual(stats1.reconciliation.placesToGoAdded, 2, 'e: first run adds 2 refs');

    // Second run: dedupe should drop both (already present).
    const stats2 = freshStats();
    await reconcilePlacesToGo(sanity as any, baseCli(), stats2);
    assertEqual(stats2.reconciliation.citiesUpdated, 0, 'e: second run citiesUpdated=0');
    assertEqual(stats2.reconciliation.placesToGoAdded, 0, 'e: second run placesToGoAdded=0');
    assertEqual(sanity.__getCity('wp-page-giza')?.placesToGo?.length, 2, 'e: count unchanged after re-run');
  }

  // (f) Monument without city field is filtered out by GROQ defensive guard
  process.stderr.write('\n# (f) Monument without city field skipped by GROQ filter\n');
  {
    const sanity = makeMockSanity();
    sanity.__seedMonument('wp-page-600', 'wp-page-cairo'); // has city
    sanity.__seedMonument('wp-page-601', null); // missing city — filtered by defined(city)
    sanity.__seedCity('wp-page-cairo');

    const stats = freshStats();
    await reconcilePlacesToGo(sanity as any, baseCli(), stats);

    assertEqual(stats.reconciliation.placesToGoAdded, 1, 'f: only the monument with city is added');
    const cairo = sanity.__getCity('wp-page-cairo')!;
    assertEqual(cairo.placesToGo?.length, 1, 'f: only 1 ref in placesToGo');
    assertEqual(cairo.placesToGo?.[0]._ref, 'wp-page-600', 'f: the monument with city is the one present');
  }

  // (g) Dry-run mode: counters incremented but no patches issued
  process.stderr.write('\n# (g) Dry-run — counters incremented, no patches\n');
  {
    const sanity = makeMockSanity();
    sanity.__seedMonument('wp-page-700', 'wp-page-cairo');
    sanity.__seedMonument('wp-page-701', 'wp-page-cairo');
    sanity.__seedMonument('wp-page-702', 'wp-page-luxor');
    sanity.__seedCity('wp-page-cairo');
    sanity.__seedCity('wp-page-luxor');

    const stats = freshStats();
    await reconcilePlacesToGo(sanity as any, baseCli({ dryRun: true }), stats);

    assertEqual(stats.reconciliation.citiesUpdated, 2, 'g: dry-run counts intent for both cities');
    assertEqual(stats.reconciliation.placesToGoAdded, 3, 'g: dry-run counts 3 refs of intent');
    // No patches actually issued: city placesToGo arrays remain empty.
    assertEqual(sanity.__getCity('wp-page-cairo')?.placesToGo?.length, 0, 'g: cairo unchanged in dry-run');
    assertEqual(sanity.__getCity('wp-page-luxor')?.placesToGo?.length, 0, 'g: luxor unchanged in dry-run');
    assertEqual(sanity.__patchCount(), 0, 'g: no patch builders invoked in dry-run');
  }

  // (h) Empty state: 0 monuments → 0 patches, 0 stats
  process.stderr.write('\n# (h) Empty state — 0 monuments → 0 changes\n');
  {
    const sanity = makeMockSanity();
    const stats = freshStats();
    await reconcilePlacesToGo(sanity as any, baseCli(), stats);
    assertEqual(stats.reconciliation.citiesUpdated, 0, 'h: 0 cities');
    assertEqual(stats.reconciliation.placesToGoAdded, 0, 'h: 0 refs');
    assertEqual(sanity.__patchCount(), 0, 'h: no patches');
  }

  // (i) Patch keys are deterministic / stable from monument _id
  process.stderr.write('\n# (i) Patch ref _key derived from monument _id (stability)\n');
  {
    const sanity = makeMockSanity();
    sanity.__seedMonument('wp-page-800', 'wp-page-cairo');
    sanity.__seedCity('wp-page-cairo');

    const stats = freshStats();
    await reconcilePlacesToGo(sanity as any, baseCli(), stats);

    const cairo = sanity.__getCity('wp-page-cairo')!;
    const ref = cairo.placesToGo?.[0];
    assertEqual(ref?._type, 'reference', 'i: _type=reference');
    assert(typeof ref?._key === 'string' && ref!._key.length > 0, 'i: _key is non-empty string');
    // _key derives from _id with non-word chars stripped, capped at 24.
    assertEqual(ref?._key, 'wppage800', 'i: _key matches deterministic derivation rule');
  }

  // ─── Summary ─────────────────────────────────────────────────────────
  void ({} as SanityDoc); // silence unused import warning if any
  process.stdout.write(`\nreconcile-places-to-go tests: pass=${pass} fail=${fail}\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
