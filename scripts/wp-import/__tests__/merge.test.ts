/**
 * Unit tests for the Q3 unified merge rule.
 *
 * Five fixture cases per DOC 3 step 2:
 *   (a) full WP coverage all locales
 *   (b) WP missing one field
 *   (c) WP missing one locale (e.g. EN+ES, no JA)
 *   (d) Sanity has editorial-only field WP doesn't know about
 *   (e) seed city not in WP source at all (no-op case — orchestrator-level
 *       rule, exercised here as `existing != null, wp doesn't reach merge`,
 *       which we approximate by passing wp = empty subset)
 *
 * Run via: `npm run test:merge` (script added to package.json).
 *
 * Self-running: process exits non-zero on first assertion failure. Avoiding
 * jest/vitest dependency for a single test module.
 */

import { mergeCityDoc, deepEqual, applyCityMerge, type MergeFetcher, type SanityDoc, CITY_EDITORIAL_ONLY_FIELDS } from '../merge.js';

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
  if (deepEqual(actual, expected)) {
    pass++;
  } else {
    fail++;
    process.stderr.write(`✗ ${msg}\n  actual:   ${JSON.stringify(actual)}\n  expected: ${JSON.stringify(expected)}\n`);
  }
}

// Helpers for fixture construction.
const i18n = (en: string, es?: string, ja?: string) => {
  const out: Array<{ _key: string; value: string }> = [{ _key: 'en', value: en }];
  if (es !== undefined) out.push({ _key: 'es', value: es });
  if (ja !== undefined) out.push({ _key: 'ja', value: ja });
  return out;
};
const i18nSlug = (en: string, es?: string, ja?: string) => {
  const out: Array<{ _key: string; _type: 'object'; value: { _type: 'slug'; current: string } }> = [
    { _key: 'en', _type: 'object', value: { _type: 'slug', current: en } },
  ];
  if (es) out.push({ _key: 'es', _type: 'object', value: { _type: 'slug', current: es } });
  if (ja) out.push({ _key: 'ja', _type: 'object', value: { _type: 'slug', current: ja } });
  return out;
};

// ---------------------------------------------------------------------------
// Case (a) — full WP coverage all locales (CREATE-first scenario)
// ---------------------------------------------------------------------------
{
  const existing: SanityDoc | null = null;
  const wp: SanityDoc = {
    _id: 'wp-page-83284',
    _type: 'city',
    name: i18n('Cairo', 'El Cairo', 'カイロ'),
    slug: i18nSlug('cairo-travel-guide', 'cairo-guia-de-viaje', 'cairo-ryoko-gaido'),
    summary: i18n('Cairo summary', 'Resumen de El Cairo', 'カイロの概要'),
    overview: i18n('overview en', 'overview es', 'overview ja'),
    migration: { wpId: 83284, wpUrl: 'https://travel2egypt.org/cairo-travel-guide/' },
  };

  const { merged, perFieldChanges } = mergeCityDoc(existing, wp);

  assertEqual(merged._id, 'wp-page-83284', '(a) merged keeps wp _id');
  assertEqual(merged.name, wp.name, '(a) all locales of name from wp');
  const allCreated = perFieldChanges.every((c) => c.outcome === 'created');
  assert(allCreated, `(a) all fields outcome=created on first run; got: ${perFieldChanges.map((c) => `${c.field}=${c.outcome}`).join(', ')}`);
}

// ---------------------------------------------------------------------------
// Case (b) — WP missing one field (overview); existing has it
// ---------------------------------------------------------------------------
{
  const existing: SanityDoc = {
    _id: 'wp-page-83284',
    _type: 'city',
    name: i18n('Cairo', 'El Cairo', 'カイロ'),
    overview: i18n('old overview en', 'old overview es', 'old overview ja'),
    summary: i18n('old summary'),
    migration: { wpId: 83284, wpUrl: 'old-url' },
  };
  const wp: SanityDoc = {
    _id: 'wp-page-83284',
    _type: 'city',
    name: i18n('Cairo', 'El Cairo', 'カイロ'),
    summary: i18n('new summary'),
    migration: { wpId: 83284, wpUrl: 'new-url' },
    // overview omitted from WP — should be preserved.
  };

  const { merged, perFieldChanges } = mergeCityDoc(existing, wp);

  assertEqual(merged.overview, existing.overview, '(b) overview preserved when wp omits it');
  const overviewChange = perFieldChanges.find((c) => c.field === 'overview');
  assertEqual(overviewChange?.outcome, 'preserved-no-wp', '(b) overview marked preserved-no-wp');
  // summary is itself an i18n array, so the outcome is i18n-merged (not overwritten),
  // with localesTouched=['en'] capturing the slot WP supplied. The actual value
  // change ('old summary' → 'new summary') lives in `merged.summary` itself.
  const summaryChange = perFieldChanges.find((c) => c.field === 'summary');
  assertEqual(summaryChange?.outcome, 'i18n-merged', '(b) summary marked i18n-merged');
  assertEqual(summaryChange?.localesTouched, ['en'], '(b) summary localesTouched = [en]');
  // And the actual merged value contains the new value.
  const mergedSummary = merged.summary as Array<{ _key: string; value: string }>;
  assertEqual(mergedSummary[0].value, 'new summary', '(b) summary en-slot now holds new value');
}

// ---------------------------------------------------------------------------
// Case (c) — WP missing one locale (EN+ES, no JA); existing has all 3
// ---------------------------------------------------------------------------
{
  const existing: SanityDoc = {
    _id: 'wp-page-83284',
    _type: 'city',
    name: i18n('Cairo old', 'El Cairo old', 'カイロ-old'),
  };
  const wp: SanityDoc = {
    _id: 'wp-page-83284',
    _type: 'city',
    name: i18n('Cairo new', 'El Cairo new'), // no JA entry
  };

  const { merged, perFieldChanges } = mergeCityDoc(existing, wp);

  const mergedName = merged.name as Array<{ _key: string; value: string }>;
  const enEntry = mergedName.find((e) => e._key === 'en');
  const esEntry = mergedName.find((e) => e._key === 'es');
  const jaEntry = mergedName.find((e) => e._key === 'ja');

  assertEqual(enEntry?.value, 'Cairo new', '(c) en locale overwritten by wp');
  assertEqual(esEntry?.value, 'El Cairo new', '(c) es locale overwritten by wp');
  assertEqual(jaEntry?.value, 'カイロ-old', '(c) ja locale preserved (wp had no ja entry)');

  const change = perFieldChanges.find((c) => c.field === 'name');
  assertEqual(change?.outcome, 'i18n-merged', '(c) name outcome = i18n-merged');
  assertEqual(change?.localesTouched?.sort(), ['en', 'es'], '(c) localesTouched = [en, es] only');
}

// ---------------------------------------------------------------------------
// Case (d) — Sanity has editorial-only fields (placesToGo, region, coordinates)
//            that WP doesn't know about; merge must leave them untouched
// ---------------------------------------------------------------------------
{
  const existing: SanityDoc = {
    _id: 'city-cairo',
    _type: 'city',
    name: i18n('Cairo'),
    placesToGo: [{ _ref: 'monument-pyramids', _type: 'reference' }],
    region: 'lower-egypt',
    coordinates: { lat: 30.0444, lng: 31.2357 },
    orderRank: 1,
    gallery: [{ _type: 'localizedImage', alt: 'Cairo skyline' }],
  };
  const wp: SanityDoc = {
    _id: 'city-cairo',
    _type: 'city',
    name: i18n('Cairo updated'),
  };

  const { merged, perFieldChanges } = mergeCityDoc(existing, wp);

  assertEqual(merged.placesToGo, existing.placesToGo, '(d) placesToGo preserved (editorial-only)');
  assertEqual(merged.region, 'lower-egypt', '(d) region preserved (editorial-only)');
  assertEqual(merged.coordinates, existing.coordinates, '(d) coordinates preserved (editorial-only)');
  assertEqual(merged.orderRank, 1, '(d) orderRank preserved (editorial-only)');
  assertEqual(merged.gallery, existing.gallery, '(d) gallery preserved (editorial-only)');

  for (const f of CITY_EDITORIAL_ONLY_FIELDS) {
    const c = perFieldChanges.find((x) => x.field === f);
    assertEqual(c?.outcome, 'preserved-editorial-only', `(d) ${f} outcome = preserved-editorial-only`);
  }

  const nameChange = perFieldChanges.find((c) => c.field === 'name');
  assertEqual(nameChange?.outcome, 'i18n-merged', '(d) name still merged correctly');
}

// ---------------------------------------------------------------------------
// Case (d-defensive) — WP also tries to send placesToGo (it shouldn't, but defensive)
// ---------------------------------------------------------------------------
{
  const existing: SanityDoc = {
    _id: 'city-cairo',
    _type: 'city',
    placesToGo: [{ _ref: 'monument-pyramids', _type: 'reference' }],
  };
  const wp: SanityDoc = {
    _id: 'city-cairo',
    _type: 'city',
    placesToGo: [{ _ref: 'something-different', _type: 'reference' }],
  };
  const { merged, perFieldChanges } = mergeCityDoc(existing, wp);
  assertEqual(merged.placesToGo, existing.placesToGo, '(d-defensive) editorial-only blocks WP overwrite even if WP supplied');
  const c = perFieldChanges.find((x) => x.field === 'placesToGo');
  assertEqual(c?.outcome, 'preserved-editorial-only', '(d-defensive) outcome = preserved-editorial-only');
}

// ---------------------------------------------------------------------------
// Case (e) — seed city not in WP source at all (no-op).
//
// Orchestrator-level rule: if a city is not in WP source, mergeCityDoc isn't
// called for it. This case verifies the function's behaviour when called
// with an empty WP doc (defensive — should preserve existing entirely).
// ---------------------------------------------------------------------------
{
  const existing: SanityDoc = {
    _id: 'city-some-orphan',
    _type: 'city',
    name: i18n('Orphan'),
    overview: i18n('Editorial overview'),
    region: 'sinai',
  };
  const wp: SanityDoc = {
    _id: 'city-some-orphan',
    _type: 'city',
    // No fields — equivalent to "WP has nothing to say about this city".
  };
  const { merged, perFieldChanges } = mergeCityDoc(existing, wp);
  assertEqual(merged.name, existing.name, '(e) name preserved on no-op merge');
  assertEqual(merged.overview, existing.overview, '(e) overview preserved on no-op merge');
  assertEqual(merged.region, 'sinai', '(e) region preserved on no-op merge');

  const allPreserved = perFieldChanges.every((c) =>
    c.outcome === 'preserved-no-wp' || c.outcome === 'preserved-editorial-only',
  );
  assert(allPreserved, `(e) all fields preserved (no overwrites) on no-op merge; got: ${perFieldChanges.map((c) => `${c.field}=${c.outcome}`).join(', ')}`);
}

// ---------------------------------------------------------------------------
// Case (extra) — value identical → 'unchanged' not 'overwritten'
// ---------------------------------------------------------------------------
{
  const existing: SanityDoc = {
    _id: 'wp-page-1',
    _type: 'city',
    name: i18n('Same', 'Same', 'Same'),
  };
  const wp: SanityDoc = {
    _id: 'wp-page-1',
    _type: 'city',
    name: i18n('Same', 'Same', 'Same'),
  };
  const { perFieldChanges } = mergeCityDoc(existing, wp);
  const c = perFieldChanges.find((x) => x.field === 'name');
  assertEqual(c?.outcome, 'unchanged', '(extra) identical i18n values → unchanged');
}

// ---------------------------------------------------------------------------
// applyCityMerge integration tests — the missing coverage that would have
// caught the session-5 bug where mergeCityDoc was wired only to the diff
// path, not the write path. Wrapped in async main() because tsx (cjs
// transform) doesn't support top-level await.
// ---------------------------------------------------------------------------

function mockFetcher(returnValue: unknown): MergeFetcher {
  return {
    fetch: async <T>(_query: string, _params?: Record<string, unknown>): Promise<T> => {
      return returnValue as T;
    },
  };
}

async function runIntegrationTests(): Promise<void> {
  // (i1) UPDATE-mode: existing has editorial region; mapper omits it; merge preserves.
  //      THIS IS THE EXACT SHAPE OF THE BUG. If this assertion fails before
  //      Path A is wired (i.e. the write path uses raw createOrReplace), the
  //      live system would lose region. With Path A, this test passes.
  {
    const existing: SanityDoc = {
      _id: 'wp-page-58090',
      _type: 'city',
      name: i18n('Akhmim Travel Guide'),
      region: 'upper-egypt',
    };
    const mapperDoc: SanityDoc = {
      _id: 'wp-page-58090',
      _type: 'city',
      name: i18n('Akhmim'),
      // NO region — mapper output never carries editorial fields
    };
    const fetcher = mockFetcher(existing);
    const result = await applyCityMerge(fetcher, mapperDoc);
    assertEqual(
      result.merged.region,
      'upper-egypt',
      '(i1) [INTEGRATION — would have caught the session-5 bug] applyCityMerge preserves editorial region when mapper omits it'
    );
    const mergedName = result.merged.name as Array<{ _key: string; value: string }>;
    assertEqual(mergedName[0].value, 'Akhmim', '(i1) name still overwritten (mapper-sourced)');
  }

  // (i2) CREATE-mode: existing is null. applyCityMerge returns mapperDoc verbatim.
  {
    const mapperDoc: SanityDoc = {
      _id: 'wp-page-99999',
      _type: 'city',
      name: i18n('NewCity'),
    };
    const fetcher = mockFetcher(null);
    const result = await applyCityMerge(fetcher, mapperDoc);
    assertEqual(result.merged._id, 'wp-page-99999', '(i2) CREATE mode: id passes through');
    assertEqual(result.merged.region, undefined, '(i2) CREATE mode: no region fabricated');
    const allCreated = result.perFieldChanges.every((c) => c.outcome === 'created');
    assert(allCreated, '(i2) CREATE mode: all per-field outcomes = created');
  }

  // (i3) Non-city _type: applyCityMerge skips the merge logic entirely.
  {
    const articleDoc: SanityDoc = {
      _id: 'wp-post-1-en',
      _type: 'article',
      title: 'Some article',
    };
    const fetcher: MergeFetcher = {
      fetch: async () => {
        throw new Error('fetcher should not be called for non-city _type');
      },
    };
    const result = await applyCityMerge(fetcher, articleDoc);
    assertEqual(result.merged._id, 'wp-post-1-en', '(i3) non-city _type: doc returned verbatim');
    assertEqual(result.perFieldChanges.length, 0, '(i3) non-city _type: no per-field changes');
  }

  // (i4) Missing _id (defensive): applyCityMerge returns mapperDoc verbatim.
  {
    const mapperDoc: SanityDoc = { _type: 'city', name: i18n('Anonymous') } as SanityDoc;
    const fetcher: MergeFetcher = {
      fetch: async () => {
        throw new Error('fetcher should not be called when _id is missing');
      },
    };
    const result = await applyCityMerge(fetcher, mapperDoc);
    assertEqual(result.merged._id, undefined, '(i4) missing _id: doc returned verbatim');
  }
}

runIntegrationTests()
  .then(() => {
    process.stdout.write(`mergeCityDoc tests: pass=${pass} fail=${fail}\n`);
    process.exit(fail === 0 ? 0 : 1);
  })
  .catch((e) => {
    process.stderr.write(`Integration test threw: ${(e as Error).message}\n`);
    process.exit(1);
  });
