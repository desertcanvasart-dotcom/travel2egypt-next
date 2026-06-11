/**
 * Link-map indexability + locale guard tests. Run: `npx tsx src/lib/linkMap/__tests__/guard.test.ts`
 * Pure (no Sanity) — exercises resolve.ts + robotsPolicy.ts only.
 */
import { isRobotsDisallowed } from '@/lib/robotsPolicy';

import { resolveEntryUrl, toLinkMapEntry } from '../resolve';

let pass = 0;
let fail = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL: ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  }
}

// ── resolveEntryUrl ───────────────────────────────────────────────────────
eq(resolveEntryUrl({ type: 'wikiMonument', slug: 'philae' }, 'en'), '/wiki/monuments/philae', 'monument EN');
eq(resolveEntryUrl({ type: 'wikiMonument', slug: 'templo-de-file' }, 'es'), '/es/wiki/monuments/templo-de-file', 'monument ES (locale prefix)');
eq(resolveEntryUrl({ type: 'guideArticle', slug: 'karnak', parentCitySlug: 'luxor' }, 'en'), '/guide/luxor/karnak', 'guideArticle EN (parent city)');
eq(resolveEntryUrl({ type: 'guideArticle', slug: 'karnak', parentCitySlug: 'luxor' }, 'es'), '/es/guide/luxor/karnak', 'guideArticle ES');
eq(resolveEntryUrl({ type: 'guideArticle', slug: 'karnak' }, 'en'), null, 'guideArticle missing parent city → omit');
eq(resolveEntryUrl({ type: 'wikiMonument', slug: null }, 'es'), null, 'no slug in locale → omit (ES, EN-only entry)');
eq(resolveEntryUrl({ type: 'city', slug: 'luxor' }, 'en'), null, 'off-scope type (city) → omit');
eq(resolveEntryUrl({ type: 'wikiPerson', slug: 'cleopatra' }, 'en'), null, 'off-scope type (wikiPerson, noindex) → omit');

// ── isRobotsDisallowed (indexability SSOT) ─────────────────────────────────
eq(isRobotsDisallowed('/wiki/monuments/philae'), false, 'monument path indexable');
eq(isRobotsDisallowed('/guide/luxor/karnak'), false, 'guide path indexable');
eq(isRobotsDisallowed('/wiki/people/cleopatra'), true, 'wiki/people disallowed');
eq(isRobotsDisallowed('/wiki/deities/isis'), true, 'wiki/deities disallowed');
eq(isRobotsDisallowed('/wiki/dynasties/ptolemaic'), true, 'wiki/dynasties disallowed');
eq(isRobotsDisallowed('/api/chat'), true, 'api disallowed');
eq(isRobotsDisallowed('/studio'), true, 'studio disallowed (exact)');
eq(isRobotsDisallowed('/wiki/peopleish/x'), false, 'boundary: peopleish not disallowed');

// ── toLinkMapEntry (shape + alias filtering) ──────────────────────────────
eq(
  toLinkMapEntry({ type: 'wikiMonument', slug: 'philae', canonicalName: 'Philae', aliases: ['Temple of Philae', '', null, '  '] }, 'en'),
  { canonicalName: 'Philae', aliases: ['Temple of Philae'], url: '/wiki/monuments/philae' },
  'valid entry — empty/null aliases filtered',
);
eq(toLinkMapEntry({ type: 'wikiMonument', slug: null, canonicalName: 'Philae' }, 'es'), null, 'omitted entry → null');
eq(toLinkMapEntry({ type: 'wikiMonument', slug: 'philae', canonicalName: '   ' }, 'en'), null, 'blank canonicalName → null');

console.log(`\nlink-map guard: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
