/**
 * Pure matcher tests. Run: `npx tsx src/lib/linkMap/__tests__/match.test.ts`
 */
import { findMatches, type MatchableEntry } from '../match';

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

const KOM: MatchableEntry = { url: '/wiki/monuments/kom-ombo', phrases: ['Kom Ombo', 'Temple of Kom Ombo'] };
const NUBIAN: MatchableEntry = { url: '/wiki/monuments/nubian-museum', phrases: ['Nubian Museum'] };
const entries = [KOM, NUBIAN];
const none = new Set<string>();
const slice = (t: string, m: { start: number; end: number; url: string }) => ({ text: t.slice(m.start, m.end), url: m.url });

// longest-match: "Temple of Kom Ombo" beats "Kom Ombo" at the same position
{
  const t = 'Visit the Temple of Kom Ombo at dawn.';
  const m = findMatches(t, entries, none);
  eq(m.map((x) => slice(t, x)), [{ text: 'Temple of Kom Ombo', url: KOM.url }], 'longest-match wins');
}
// case-insensitive + first-occurrence-per-entity (second "kom ombo" not linked)
{
  const t = 'kom ombo is great; Kom Ombo again.';
  const m = findMatches(t, entries, none);
  eq(m.length, 1, 'first occurrence per entity only');
  eq(slice(t, m[0]), { text: 'kom ombo', url: KOM.url }, 'case-insensitive match keeps original casing');
}
// whole-word: a trailing letter breaks the match ("Museums" ≠ "Museum")
{
  eq(findMatches('The Nubian Museums are nice', entries, none).length, 0, 'plural/trailing-letter not matched (whole-word)');
  const t2 = 'Visit the Nubian Museum today';
  eq(findMatches(t2, entries, none).map((x) => x.url), ['/wiki/monuments/nubian-museum'], 'whole-word match links');
}
// multiple distinct entities both link
{
  const t = 'Kom Ombo and the Nubian Museum.';
  const m = findMatches(t, entries, none);
  eq(m.map((x) => x.url), [KOM.url, NUBIAN.url], 'two entities, two links');
}
// already-linked entity (threaded across nodes) is skipped
{
  const m = findMatches('Kom Ombo once more', entries, new Set([KOM.url]));
  eq(m.length, 0, 'entity already linked in a prior node → skipped');
}
// special chars in an alias match literal text (used for matching only)
{
  const SPECIAL: MatchableEntry = { url: '/wiki/monuments/x', phrases: ['Foo & <Bar>'] };
  const t = 'See Foo & <Bar> here';
  const m = findMatches(t, [SPECIAL], none);
  eq(m.map((x) => slice(t, x)), [{ text: 'Foo & <Bar>', url: '/wiki/monuments/x' }], 'special chars matched literally');
}

console.log(`\nlink-map matcher: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
