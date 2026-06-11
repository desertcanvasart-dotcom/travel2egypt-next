/**
 * Pure entity matching for the concierge link-map post-processor.
 *
 * Given a plain text string and the resolved map, returns the spans to link:
 * longest-match at each position, case-insensitive, whole-word, and only the
 * FIRST occurrence of each entity (per message — the caller threads `linked`
 * across the message's text nodes). No DOM, no markup — just spans, so it is
 * unit-testable in isolation. The actual wrapping (DOM `createElement` +
 * `textContent`) lives in the browser-only renderer.
 */

export interface MatchableEntry {
  /** Resolved in-site URL (the entity identifier for first-occurrence dedupe). */
  url: string;
  /** canonicalName + aliases — the phrases to look for. */
  phrases: string[];
}

export interface EntityMatch {
  start: number;
  end: number;
  url: string;
}

const LETTER_OR_NUM = /[\p{L}\p{N}]/u;
function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && LETTER_OR_NUM.test(ch);
}

/**
 * Non-overlapping matches in document order. Entities already in `linked` are
 * skipped; each entity matches at most once (its first occurrence here).
 */
export function findMatches(
  text: string,
  entries: MatchableEntry[],
  linked: ReadonlySet<string>,
): EntityMatch[] {
  // Flatten to phrases, longest first → longest-match wins at any position.
  const phrases: { lower: string; len: number; url: string }[] = [];
  for (const e of entries) {
    for (const p of e.phrases) {
      const t = (p ?? '').trim();
      if (t) phrases.push({ lower: t.toLowerCase(), len: t.length, url: e.url });
    }
  }
  phrases.sort((a, b) => b.len - a.len);

  const lower = text.toLowerCase();
  const used = new Set<string>(linked);
  const matches: EntityMatch[] = [];

  let i = 0;
  while (i < text.length) {
    let hit: EntityMatch | null = null;
    for (const ph of phrases) {
      if (used.has(ph.url)) continue;
      if (!lower.startsWith(ph.lower, i)) continue;
      const end = i + ph.len;
      // whole-word: boundary on both sides (letters/numbers only count as word chars)
      if (!isWordChar(text[i - 1]) && !isWordChar(text[end])) {
        hit = { start: i, end, url: ph.url };
        break;
      }
    }
    if (hit) {
      matches.push(hit);
      used.add(hit.url);
      i = hit.end;
    } else {
      i++;
    }
  }
  return matches;
}
