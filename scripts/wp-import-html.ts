/**
 * HTML → Portable Text pipeline for the WP migration.
 *
 * Implements the rules in migration/MIGRATION_MAPPING.md §4. Pure function:
 * input is a single HTML string (the rendered WP content body), output is a
 * Portable Text array suitable for storing in a Sanity field.
 *
 * Design notes:
 *  - Aggressive Elementor/Royal-Elementor wrapper stripping. ~100% of pages
 *    are Elementor; the structural noise is enormous and the semantic content
 *    underneath is what we want.
 *  - Pull-quote and side-image are detected from class signals + Elementor
 *    widget hints, mapped to the dedicated PT block types in
 *    src/sanity/schemas/portableText.ts.
 *  - Internal links are deferred — captured as `_pendingInternalRef` on the
 *    `externalLink` mark and resolved in the relink phase.
 */

import { parse, type HTMLElement, NodeType } from 'node-html-parser';
import { randomBytes } from 'node:crypto';

// ---------- Public types -----------------------------------------------

export interface PtBlock {
  _key: string;
  _type: string;
  [k: string]: unknown;
}

export interface ConversionResult {
  blocks: PtBlock[];
  /** Counts of detected special blocks for the migration log. */
  stats: {
    operatorNotes: number;
    pullQuotes: number;
    sideImages: number;
    images: number;
    tablesFlattened: number;
    pendingInternalLinks: number;
  };
}

export interface ConversionOptions {
  /** Per-block image references resolved upstream (lazy upload). The pipeline
   * inserts placeholder image blocks; the importer later swaps in the real
   * Sanity asset reference based on the WP attachment URL. */
  attachmentResolver?: (sourceUrl: string) => string | null;
}

// ---------- Entry point ------------------------------------------------

export function htmlToPortableText(html: string, opts: ConversionOptions = {}): ConversionResult {
  const stats = { operatorNotes: 0, pullQuotes: 0, sideImages: 0, images: 0, tablesFlattened: 0, pendingInternalLinks: 0 };
  const decoded = decodeEntities(html);
  const root = parse(decoded, { lowerCaseTagName: false });

  stripNoise(root);
  liftElementorWrappers(root);

  const blocks: PtBlock[] = [];
  for (const child of root.childNodes) {
    walkBlock(child as HTMLElement, blocks, stats, opts);
  }

  // Drop trailing empty blocks.
  while (blocks.length && isEmptyBlock(blocks[blocks.length - 1])) blocks.pop();
  return { blocks, stats };
}

// ---------- Stripping passes ------------------------------------------

const NOISE_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'SVG', 'FORM']);
const NOISE_CLASS_HINTS = ['share', 'social-icons', 'addtoany', 'about-author', 'post-author', 'related-posts'];

function stripNoise(root: HTMLElement): void {
  // Tag-based noise.
  for (const tag of ['style', 'script', 'noscript', 'svg', 'form']) {
    for (const el of Array.from(root.querySelectorAll(tag))) el.remove();
  }
  // Class-based noise.
  for (const el of Array.from(root.querySelectorAll('[class]'))) {
    const cls = el.getAttribute('class')?.toLowerCase() ?? '';
    if (NOISE_CLASS_HINTS.some((h) => cls.includes(h))) {
      el.remove();
    }
  }
  // iframes — keep only YouTube/Vimeo (treated as external links via plain text).
  for (const ifr of Array.from(root.querySelectorAll('iframe'))) {
    const src = ifr.getAttribute('src') ?? '';
    if (!/(youtube|vimeo)\.com/.test(src)) ifr.remove();
  }
  // Strip Link Whisper noise attributes (keep <a href>, drop the monitor data).
  for (const a of Array.from(root.querySelectorAll('a'))) {
    a.removeAttribute('data-wpil-monitor-id');
    a.removeAttribute('data-wpil-keyword-link');
  }
}

const ELEMENTOR_CLASS_PREFIXES = /^(elementor-|e-(?:con|flex|grid|column|row|section|inner|spacer|n-)|wpr-|eael-|elementskit-)/;

/**
 * Iteratively unwrap Elementor wrapper divs/sections/spans, lifting their
 * children up. Stops when no more matches are found.
 */
function liftElementorWrappers(root: HTMLElement): void {
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 20) {
    changed = false;
    iterations++;
    const wrappers = Array.from(root.querySelectorAll('[class]')).filter((el) => {
      const cls = el.getAttribute('class') ?? '';
      return cls.split(/\s+/).some((c) => ELEMENTOR_CLASS_PREFIXES.test(c));
    });
    for (const w of wrappers) {
      // If it's a structural-only wrapper (div/section/span with no semantic value),
      // replace it with its children. Skip if it's actually an <img>, <a>, etc.
      const tag = w.tagName?.toUpperCase();
      if (['DIV', 'SECTION', 'SPAN', 'ARTICLE', 'HEADER', 'FOOTER', 'ASIDE'].includes(tag ?? '')) {
        const html = w.innerHTML;
        // Replace the wrapper node with its inner HTML.
        w.replaceWith(html);
        changed = true;
      } else {
        // Keep the element but strip the elementor classes — preserves <h2>, <p>, <figure> etc.
        const cls = (w.getAttribute('class') ?? '')
          .split(/\s+/)
          .filter((c) => !ELEMENTOR_CLASS_PREFIXES.test(c))
          .join(' ');
        if (cls) w.setAttribute('class', cls);
        else w.removeAttribute('class');
      }
    }
  }
}

// ---------- Walker -----------------------------------------------------

function walkBlock(node: HTMLElement, blocks: PtBlock[], stats: ConversionResult['stats'], opts: ConversionOptions): void {
  if (!node || node.nodeType === NodeType.COMMENT_NODE) return;
  if (node.nodeType === NodeType.TEXT_NODE) {
    const text = node.rawText.trim();
    if (text) blocks.push(textBlock('normal', [{ _type: 'span', _key: key(), text, marks: [] }]));
    return;
  }
  const tag = (node.tagName ?? '').toUpperCase();
  switch (tag) {
    case 'H1':
    case 'H2':
      pushHeading(node, blocks, 'h2');
      return;
    case 'H3':
      pushHeading(node, blocks, 'h3');
      return;
    case 'H4':
    case 'H5':
    case 'H6':
      pushHeading(node, blocks, 'h4');
      return;
    case 'P':
      pushParagraph(node, blocks, stats);
      return;
    case 'UL':
      pushList(node, blocks, 'bullet', stats);
      return;
    case 'OL':
      pushList(node, blocks, 'number', stats);
      return;
    case 'BLOCKQUOTE':
      pushBlockquote(node, blocks, stats);
      return;
    case 'FIGURE':
      pushFigure(node, blocks, stats, opts);
      return;
    case 'IMG':
      pushImage(node, blocks, stats, opts);
      return;
    case 'TABLE':
      pushTable(node, blocks, stats);
      return;
    case 'HR':
    case 'BR':
      return;
    case 'DIV':
    case 'SECTION':
    case 'ARTICLE':
    case 'ASIDE':
    case 'HEADER':
    case 'FOOTER':
      // Recurse into still-remaining wrappers (e.g. WP Gutenberg blocks).
      for (const child of node.childNodes) walkBlock(child as HTMLElement, blocks, stats, opts);
      return;
    case 'IFRAME': {
      const src = node.getAttribute('src') ?? '';
      if (src) blocks.push(textBlock('normal', [{ _type: 'span', _key: key(), text: `[Embed: ${src}]`, marks: [] }]));
      return;
    }
    default:
      // Unknown wrapper: recurse to find blocks inside.
      for (const child of node.childNodes) walkBlock(child as HTMLElement, blocks, stats, opts);
  }
}

// ---------- Block builders --------------------------------------------

function pushHeading(node: HTMLElement, blocks: PtBlock[], style: 'h2' | 'h3' | 'h4'): void {
  const children = inline(node);
  if (children.length === 0) return;
  blocks.push(textBlock(style, children));
}

const OPERATOR_NOTE_TRIGGERS: RegExp[] = [
  /^honestly,/i,
  /^we don't recommend/i,
  /^we do not recommend/i,
  /^watch out for/i,
  /^most travelers don't realize/i,
  /^what we tell our clients/i,
  /^we always tell our guests/i,
  /^frankly,/i,
];

function pushParagraph(node: HTMLElement, blocks: PtBlock[], stats: ConversionResult['stats']): void {
  const text = node.text.trim();
  if (!text) return;

  if (OPERATOR_NOTE_TRIGGERS.some((re) => re.test(text))) {
    stats.operatorNotes++;
    blocks.push({
      _key: key(),
      _type: 'operatorNote',
      tone: 'honest',
      body: [textBlock('normal', inline(node))],
    });
    return;
  }

  const children = inline(node);
  if (children.length === 0) return;
  blocks.push(textBlock('normal', children));
}

function pushList(node: HTMLElement, blocks: PtBlock[], listType: 'bullet' | 'number', stats: ConversionResult['stats']): void {
  for (const li of node.querySelectorAll(':scope > li')) {
    const children = inline(li as HTMLElement);
    if (children.length === 0) continue;
    blocks.push({
      ...textBlock('normal', children),
      listItem: listType,
      level: 1,
    });
  }
  // Recurse for any nested non-list content inside the parent (rare but possible).
  void stats;
}

const PULL_QUOTE_HINTS = /(\bpull(quote)?\b|\bcallout-quote\b|\bhighlight-quote\b|wp-block-pullquote)/i;

function pushBlockquote(node: HTMLElement, blocks: PtBlock[], stats: ConversionResult['stats']): void {
  const cls = node.getAttribute('class') ?? '';
  if (PULL_QUOTE_HINTS.test(cls)) {
    pushPullQuote(node, blocks, stats);
    return;
  }
  // Default blockquote.
  for (const para of node.querySelectorAll(':scope > p')) {
    const children = inline(para as HTMLElement);
    if (children.length) blocks.push(textBlock('blockquote', children));
  }
}

function pushPullQuote(node: HTMLElement, blocks: PtBlock[], stats: ConversionResult['stats']): void {
  // Quote text: prefer first <p>, fall back to whole textContent.
  const firstP = node.querySelector(':scope > p') as HTMLElement | null;
  const quoteText = firstP ? firstP.text.trim() : node.text.trim();
  if (!quoteText) return;
  const cite = node.querySelector('cite') as HTMLElement | null;
  const attribution = cite?.text.trim() ?? extractEmDashAttribution(node);

  // Style inference per MIGRATION_MAPPING §4.5.
  let style: 'literary' | 'historical' | 'traveler' = 'literary';
  if (/^(in the year|an ancient|it is written|according to (herodotus|plutarch|strabo))/i.test(quoteText)) {
    style = 'historical';
  } else if (/^(i |we )(will never|arrived|stood|watched|saw)/i.test(quoteText)) {
    style = 'traveler';
  }

  stats.pullQuotes++;
  blocks.push({
    _key: key(),
    _type: 'pullQuote',
    quote: [{ _key: 'en', value: quoteText }],
    ...(attribution ? { attribution: [{ _key: 'en', value: attribution }] } : {}),
    style,
  });
}

function extractEmDashAttribution(node: HTMLElement): string | null {
  const text = node.text;
  const m = /[—–-]\s*([A-Z][^.\n]+)$/.exec(text);
  return m ? m[1].trim() : null;
}

function pushFigure(node: HTMLElement, blocks: PtBlock[], stats: ConversionResult['stats'], opts: ConversionOptions): void {
  const cls = node.getAttribute('class')?.toLowerCase() ?? '';
  const img = node.querySelector('img') as HTMLElement | null;
  if (!img) return;
  const src = img.getAttribute('src') ?? '';
  const alt = img.getAttribute('alt') ?? '';
  const figcaption = node.querySelector('figcaption') as HTMLElement | null;
  const caption = figcaption?.text.trim() ?? '';

  const alignRight = /\balignright\b/.test(cls);
  const alignLeft = /\balignleft\b/.test(cls);
  const isSide = alignRight || alignLeft;

  const assetRef = opts.attachmentResolver?.(src);

  if (isSide) {
    stats.sideImages++;
    blocks.push({
      _key: key(),
      _type: 'sideImage',
      ...(assetRef
        ? { image: { _type: 'image', asset: { _type: 'reference', _ref: assetRef } } }
        : { _pendingImage: src }),
      ...(alt ? { alt: [{ _key: 'en', value: alt }] } : {}),
      ...(caption ? { caption: [{ _key: 'en', value: caption }] } : {}),
      alignment: alignRight ? 'right' : 'left',
    });
    return;
  }

  stats.images++;
  blocks.push({
    _key: key(),
    _type: 'image',
    ...(assetRef
      ? { asset: { _type: 'reference', _ref: assetRef } }
      : { _pendingImage: src }),
    ...(alt ? { alt: [{ _key: 'en', value: alt }] } : {}),
    ...(caption ? { caption: [{ _key: 'en', value: caption }] } : {}),
  });
}

function pushImage(node: HTMLElement, blocks: PtBlock[], stats: ConversionResult['stats'], opts: ConversionOptions): void {
  // Bare <img> (not inside a <figure>). Style hints can still indicate side-image.
  const style = node.getAttribute('style')?.toLowerCase() ?? '';
  const alignRight = /float:\s*right/.test(style);
  const alignLeft = /float:\s*left/.test(style);
  const src = node.getAttribute('src') ?? '';
  const alt = node.getAttribute('alt') ?? '';
  const assetRef = opts.attachmentResolver?.(src);
  if (alignRight || alignLeft) {
    stats.sideImages++;
    blocks.push({
      _key: key(),
      _type: 'sideImage',
      ...(assetRef
        ? { image: { _type: 'image', asset: { _type: 'reference', _ref: assetRef } } }
        : { _pendingImage: src }),
      ...(alt ? { alt: [{ _key: 'en', value: alt }] } : {}),
      alignment: alignRight ? 'right' : 'left',
    });
    return;
  }
  stats.images++;
  blocks.push({
    _key: key(),
    _type: 'image',
    ...(assetRef
      ? { asset: { _type: 'reference', _ref: assetRef } }
      : { _pendingImage: src }),
    ...(alt ? { alt: [{ _key: 'en', value: alt }] } : {}),
  });
}

function pushTable(node: HTMLElement, blocks: PtBlock[], stats: ConversionResult['stats']): void {
  // Schema has no table block. Flatten as a list and surface a warning.
  stats.tablesFlattened++;
  for (const tr of node.querySelectorAll('tr')) {
    const cells = (tr as HTMLElement).querySelectorAll('td, th').map((c) => (c as HTMLElement).text.trim()).filter(Boolean);
    if (cells.length === 0) continue;
    blocks.push({
      ...textBlock('normal', [{ _type: 'span', _key: key(), text: cells.join(' · '), marks: [] }]),
      listItem: 'bullet',
      level: 1,
    });
  }
}

// ---------- Inline (marks + spans) ------------------------------------

interface PtSpan {
  _type: 'span';
  _key: string;
  text: string;
  marks: string[];
}
interface PtMarkDef {
  _key: string;
  _type: string;
  [k: string]: unknown;
}

function inline(node: HTMLElement): PtSpan[] {
  const spans: PtSpan[] = [];
  const markDefs: PtMarkDef[] = [];
  walkInline(node, spans, [], markDefs);
  // Attach markDefs to the parent block via a side channel (we inject into the block builder).
  (spans as PtSpan[] & { __markDefs?: PtMarkDef[] }).__markDefs = markDefs;
  return spans;
}

function walkInline(node: HTMLElement, spans: PtSpan[], activeMarks: string[], markDefs: PtMarkDef[]): void {
  for (const child of node.childNodes) {
    if (child.nodeType === NodeType.TEXT_NODE) {
      const text = (child as any).rawText.replace(/\s+/g, ' ');
      if (!text) continue;
      spans.push({ _type: 'span', _key: key(), text, marks: [...activeMarks] });
      continue;
    }
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const el = child as HTMLElement;
    const tag = el.tagName?.toUpperCase();
    if (tag === 'BR') {
      spans.push({ _type: 'span', _key: key(), text: '\n', marks: [...activeMarks] });
      continue;
    }
    if (tag === 'STRONG' || tag === 'B') {
      walkInline(el, spans, [...activeMarks, 'strong'], markDefs);
      continue;
    }
    if (tag === 'EM' || tag === 'I') {
      walkInline(el, spans, [...activeMarks, 'em'], markDefs);
      continue;
    }
    if (tag === 'U') {
      walkInline(el, spans, [...activeMarks, 'underline'], markDefs);
      continue;
    }
    if (tag === 'A') {
      const href = el.getAttribute('href') ?? '';
      const rel = el.getAttribute('rel') ?? '';
      const isInternalT2E = /^https?:\/\/(www\.)?travel2egypt\.org/.test(href);
      const isAnchor = href.startsWith('#');
      const markKey = key();
      if (isInternalT2E) {
        // Phase 1 placeholder — relink phase resolves to internalLink.
        markDefs.push({
          _key: markKey,
          _type: 'externalLink',
          href,
          newTab: /noopener|_blank/.test(rel),
          _pendingInternalRef: { wpUrl: href, sourceLocale: 'en' as const },
        });
      } else if (isAnchor) {
        markDefs.push({ _key: markKey, _type: 'externalLink', href, newTab: false });
      } else {
        markDefs.push({
          _key: markKey,
          _type: 'externalLink',
          href,
          newTab: /noopener|_blank/.test(rel),
        });
      }
      walkInline(el, spans, [...activeMarks, markKey], markDefs);
      continue;
    }
    // Span/other inline wrappers: recurse without adding marks.
    walkInline(el, spans, activeMarks, markDefs);
  }
}

// ---------- Helpers ----------------------------------------------------

function textBlock(style: string, children: PtSpan[]): PtBlock {
  const markDefs = (children as PtSpan[] & { __markDefs?: PtMarkDef[] }).__markDefs ?? [];
  return {
    _key: key(),
    _type: 'block',
    style,
    children,
    markDefs,
  };
}

function isEmptyBlock(b: PtBlock): boolean {
  if (b._type !== 'block') return false;
  const children = (b.children as PtSpan[] | undefined) ?? [];
  return children.every((c) => !c.text || c.text.trim() === '');
}

function key(): string {
  return randomBytes(6).toString('hex');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

/**
 * Mine `keyFacts` from a hub-page rendered HTML. Section headers + first
 * sentence of following paragraph. Conservative — returns null fields when
 * detection fails.
 */
export function mineKeyFacts(html: string): {
  bestSeason?: string;
  gettingThere?: string;
  daysNeeded?: string;
} {
  const root = parse(decodeEntities(html), { lowerCaseTagName: false });
  liftElementorWrappers(root);
  const headers = root.querySelectorAll('h2, h3, h4');
  const out: Record<string, string> = {};
  for (const h of headers) {
    const text = (h as HTMLElement).text.trim().toLowerCase();
    const next = (h as HTMLElement).nextElementSibling as HTMLElement | null;
    if (!next || next.tagName !== 'P') continue;
    const body = (next as HTMLElement).text.trim();
    const first = body.split(/(?<=[.!?])\s+/)[0]?.trim();
    if (!first) continue;
    if (!out.bestSeason && /best season|when to (go|visit)|weather|climate/i.test(text)) {
      out.bestSeason = first;
    } else if (!out.gettingThere && /getting (there|here)|how to get to|reach .* by/i.test(text)) {
      out.gettingThere = first;
    } else if (!out.daysNeeded && /how (many )?days|recommended (length|stay)|spend (a |at least )?\d+ days/i.test(text)) {
      out.daysNeeded = first;
    }
  }
  return out;
}

/**
 * Mine wikiMonument visitorInfo from body HTML. Returns matching paragraphs
 * (in order) as Portable Text, or empty array if no signals found.
 */
export function mineVisitorInfo(html: string, opts: ConversionOptions = {}): PtBlock[] {
  const root = parse(decodeEntities(html), { lowerCaseTagName: false });
  liftElementorWrappers(root);

  const out: PtBlock[] = [];
  const stats = { operatorNotes: 0, pullQuotes: 0, sideImages: 0, images: 0, tablesFlattened: 0, pendingInternalLinks: 0 };

  const paragraphs = Array.from(root.querySelectorAll('p'));
  for (const p of paragraphs) {
    const text = p.text.toLowerCase();
    let signals = 0;
    if (/open (from|at)|opening hours|closes at/.test(text)) signals++;
    if (/ticket|entry fee|admission/.test(text)) signals++;
    if (/spend at least|time to spend|allow .* hours/.test(text)) signals++;
    if (/best time to visit/.test(text)) signals++;
    if (/photography is (allowed|forbidden|free)/.test(text)) signals++;
    if (/\b(dress|wear)\b/.test(text)) signals++;
    if (signals >= 2) {
      const children = inline(p as HTMLElement);
      out.push(textBlock('normal', children));
    }
  }

  // Also include sections whose header literally matches "Visitor Info" / "Practical Tips" / "Before You Go" / "Getting In".
  const headers = Array.from(root.querySelectorAll('h2, h3'));
  for (const h of headers) {
    const t = h.text.trim().toLowerCase();
    if (!/^(visitor info|practical tips|before you go|getting in)$/.test(t)) continue;
    let cur = h.nextElementSibling as HTMLElement | null;
    while (cur && !/^H[2-3]$/i.test(cur.tagName ?? '')) {
      walkBlock(cur, out, stats, opts);
      cur = cur.nextElementSibling as HTMLElement | null;
    }
  }
  return out;
}
