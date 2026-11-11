/**
 * Meta-description length guard (Ahrefs "meta description too long",
 * 2026-11-09: 1,829 pages over 160 characters, many cut mid-word at 240 by
 * the WordPress migration).
 *
 * Google shows roughly 155 characters of a description (about 110 for
 * Japanese, whose characters are wider) and rewrites snippets that end
 * badly. This trims the text the page already has; it never adds words:
 *
 * 1. Short enough and ending cleanly → unchanged.
 * 2. Otherwise → cut after the last complete sentence that fits, if that
 *    sentence ends far enough in to still say something (min length).
 * 3. Otherwise → cut at the last whole word (Japanese: the last 、 or ・, or
 *    a hard cut) and add "…".
 *
 * A text that already ends in "…" / "..." (a truncated summary) is treated
 * as unfinished, so a complete sentence inside it is preferred.
 */

const LIMITS: Record<string, { max: number; min: number }> = {
  ja: { max: 110, min: 45 },
  // min 100: a sentence ending earlier gives way to a fuller whole-word cut
  // (Ahrefs flags descriptions under 100 as too short).
  default: { max: 155, min: 100 },
};

const ELLIPSIS = '…';

const count = (s: string, ch: string) => s.split(ch).length - 1;
function insideQuote(s: string): boolean {
  return (
    count(s, '"') % 2 === 1 ||
    count(s, '“') > count(s, '”') ||
    count(s, '«') > count(s, '»') ||
    count(s, '「') > count(s, '」') ||
    count(s, '『') > count(s, '』')
  );
}

export function trimMetaDescription(input: string | null | undefined, locale: string): string {
  if (!input) return '';
  const { max, min } = LIMITS[locale] ?? LIMITS.default;
  const isJa = locale === 'ja';

  let text = input.replace(/\s+/g, ' ').trim();
  const unfinished = /(?:…|\.\.\.)$/.test(text);
  if (unfinished) text = text.replace(/\s*(?:…|\.\.\.)$/, '').trim();

  if (text.length <= max && !unfinished) return text;

  // Last complete sentence within the limit.
  const window = text.slice(0, max);
  const sentenceEnd = isJa ? /[。！？](?=.|$)/g : /[.!?](?=\s|$)/g;
  let cut = -1;
  for (let m = sentenceEnd.exec(window); m; m = sentenceEnd.exec(window)) {
    const end = m.index + 1;
    // Skip common abbreviations ("St.", "c.", "a.C.", "e.g.").
    const head = window.slice(0, end);
    if (!isJa && /\b(?:St|Dr|Mt|vs|etc|e\.g|i\.e|c|a|d|a\.C|d\.C|n)\.$/i.test(head)) continue;
    // Not inside an open quotation (e.g. a "¿…?" title in quotes).
    if (insideQuote(head)) continue;
    cut = end;
  }
  // An already-truncated text accepts a shorter complete sentence: a clean
  // short line beats a visibly unfinished one.
  // (Only when the text already fits: a longer one can give a fuller cut.)
  const lenient = unfinished && text.length <= max - 1;
  if (cut >= (lenient ? Math.round(min * 0.6) : min)) return text.slice(0, cut).trim();

  // The whole (unfinished) text fits: keep it, marked as continuing.
  if (text.length <= max - 1) return `${text}${ELLIPSIS}`;

  // Whole-word cut.
  const room = text.slice(0, max - 1);
  let at = -1;
  if (isJa) {
    at = Math.max(room.lastIndexOf('、'), room.lastIndexOf('・'));
    if (at < min) at = room.length;
  } else {
    at = room.lastIndexOf(' ');
    if (at < min) at = room.length;
  }
  const head = text
    .slice(0, at)
    .replace(/[\s,;:—–\-(（「『、]+$/u, '')
    .trim();
  return `${head}${ELLIPSIS}`;
}
