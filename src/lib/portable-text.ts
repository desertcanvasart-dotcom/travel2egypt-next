/**
 * Shared helpers for working with Portable Text bodies outside the renderer:
 * stable heading ids (for the in-article TOC + anchor links), reading-time
 * estimation, and plain-text extraction.
 *
 * The heading-id algorithm is deliberately exported as a *generator factory*
 * so the server-side TOC extractor and the client-side <Body> renderer can
 * each build their own instance and arrive at byte-identical ids: both walk
 * the blocks in document order and call `next()` once per h2, so the Nth
 * heading gets the same de-duplicated id in both places.
 */

import type { Locale } from '@/i18n/routing';

type PtBlock = {
  _type?: string;
  style?: string;
  children?: Array<{ _type?: string; text?: string }>;
  body?: PtBlock[];
};

/** Slugify a heading string into an anchor-safe base id. */
export function slugifyHeading(text: string): string {
  const base = (text || '')
    .toLowerCase()
    .trim()
    // NFKD separates diacritics into combining marks; the next replace
    // (anything outside a-z0-9/space/hyphen) drops them, so "Aïr" → "air".
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'section';
}

/**
 * Returns a function that turns successive heading texts into unique ids,
 * appending `-2`, `-3`, … on collision. Instantiate once per render pass.
 */
export function createHeadingIdGenerator(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugifyHeading(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

/** Flatten the text of a single block's children. */
function blockText(block: PtBlock): string {
  if (!Array.isArray(block.children)) return '';
  return block.children
    .map((c) => (typeof c.text === 'string' ? c.text : ''))
    .join('');
}

export interface TocHeading {
  id: string;
  text: string;
}

/**
 * Extract every h2 in document order with a stable, de-duplicated id.
 * Used to build the "In this piece" table of contents. Must walk the same
 * order <Body> renders so the ids line up.
 */
export function extractHeadings(body: unknown): TocHeading[] {
  if (!Array.isArray(body)) return [];
  const nextId = createHeadingIdGenerator();
  const headings: TocHeading[] = [];
  for (const block of body as PtBlock[]) {
    if (block?._type === 'block' && block.style === 'h2') {
      const text = blockText(block).trim();
      if (!text) continue;
      headings.push({ id: nextId(text), text });
    }
  }
  return headings;
}

/** Recursively gather plain text from a Portable Text body for word counting. */
function collectText(body: unknown, acc: string[]): void {
  if (!Array.isArray(body)) return;
  for (const block of body as PtBlock[]) {
    if (!block || typeof block !== 'object') continue;
    if (block._type === 'block') {
      acc.push(blockText(block));
    } else if (Array.isArray(block.body)) {
      // operatorNote / conciergeNote carry a nested body of blocks.
      collectText(block.body, acc);
    }
  }
}

/**
 * Estimate reading time in whole minutes (min 1).
 *
 * Latin scripts: ~200 words/min. Japanese has little whitespace, so we
 * approximate by characters at ~500 chars/min — close enough for a "min
 * read" badge and avoids a one-minute reading appearing as nine.
 */
export function readingTimeMinutes(body: unknown, locale: Locale): number {
  const parts: string[] = [];
  collectText(body, parts);
  const text = parts.join(' ').trim();
  if (!text) return 1;

  if (locale === 'ja') {
    const chars = text.replace(/\s+/g, '').length;
    return Math.max(1, Math.ceil(chars / 500));
  }
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
