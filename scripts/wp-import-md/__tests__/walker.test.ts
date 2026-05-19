/**
 * File walker tests against the fixture tree.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { walk } from '../walker.js';
import { makeAsserter } from './_assert.js';

const FIX_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__', 'content');

export async function run(): Promise<boolean> {
const { ok, eq, done } = makeAsserter('walker');

const r = walk(FIX_ROOT);

// 7 .md files in fixture tree (3 trilingual + 4 single-file fixtures).
// The README under images/ is excluded by the `images/` directory skip.
eq(r.filesScanned, 7, '7 md files scanned (images/README.md excluded by dir skip)');

// Distinct (city, slug) triplets:
//   luxor/valley-of-the-kings  (3 locales — fm OK)
//   luxor/how-to-reach-luxor   (EN only — fm OK)
//   luxor/orphan-no-en         (ES only — fm OK, fails cross-locale later)
//   aswan/unknown-kind         (fm REJECTED — invalid kind)
//   ouagadougou/foo            (fm OK — fails parentCity lookup later in writer)
// Triplets WITH usable fm = 4 (aswan/unknown-kind dropped by parser).
eq(r.triplets.length, 4, '4 triplets with usable fm');

const vot = r.triplets.find((t) => t.slug === 'valley-of-the-kings');
ok(!!vot, 'valley-of-the-kings triplet present');
eq(Object.keys(vot!.files).sort(), ['en', 'es', 'ja'], 'all three locales for valley-of-the-kings');

const htr = r.triplets.find((t) => t.slug === 'how-to-reach-luxor');
ok(!!htr, 'how-to-reach-luxor present (EN only)');
eq(Object.keys(htr!.files), ['en'], 'how-to-reach-luxor only has EN');

const orphan = r.triplets.find((t) => t.slug === 'orphan-no-en');
ok(!!orphan, 'orphan triplet exists (will skip in cross-locale step)');

// City filter
{
  const aswan = walk(FIX_ROOT, { city: 'aswan' });
  eq(aswan.triplets.length, 0, 'aswan filter: 0 valid triplets (unknown-kind rejected by fm parser)');
  ok(
    aswan.errors.some((e) => e.field === 'kind'),
    'aswan filter still surfaces the kind validation error'
  );
}

// Slug filter
{
  const r2 = walk(FIX_ROOT, { slug: 'valley-of-the-kings' });
  eq(r2.triplets.length, 1, 'slug filter: one triplet');
  eq(Object.keys(r2.triplets[0].files).sort(), ['en', 'es', 'ja'], 'slug filter preserves all locales');
}

return done();
}
