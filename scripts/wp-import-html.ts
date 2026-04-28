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
    /** Number of `.elementor-cta` widget instances stripped (tour-promo CTAs). */
    tourPromoStripped: number;
    /** Number of `.e-grid` containers stripped because they held only internal-T2E nav links. */
    categoryGridStripped: number;
    /** Number of duplicate paragraph instances removed (backlink widgets). */
    backlinkStripped: number;
    /** Native Elementor `swiper-slide-image` carousels stripped (container-level). */
    carouselSwiperStripped: number;
    /** Royal/Premium Addons `premium-adv-carousel` carousels stripped (container-level). */
    carouselPremiumAdvStripped: number;
    /** Bdthemes/Element Pack `bdt-img` related-tour widgets stripped. */
    bdtImgStripped: number;
    /** First H1 stripped because it duplicated the WP page title. */
    titleH1Stripped: number;
    /** Metadata lines (`Created On…`, `Updated On…`) stripped. */
    metadataLineStripped: number;
    /** Section-navigation blocks (INTRODUCING X / PLAN YOUR TRIP / …) stripped. */
    sectionNavBlockStripped: number;
    // Link-mark normalisation per-`<A>` classification. Flat counters (not
    // nested) so the existing per-mapper aggregator loops still work via
    // `for (const k of Object.keys(htmlStats)) htmlStats[k] += r.stats[k]`.
    /** Internal/relative URLs → `_pendingInternalRef` (relink phase will resolve). */
    linkMarkConvertedToPendingRef: number;
    /** Absolute external URLs (Wikipedia, etc.) kept as `externalLink`. */
    linkMarkKeptAsExternal: number;
    /** Malformed/javascript:/data:/empty hrefs — mark stripped, text kept. */
    linkMarkStrippedMalformed: number;
    /** Anchor-only `#section` hrefs — mark stripped, text kept. */
    linkMarkStrippedAnchor: number;
    /** Bare `mailto:` / `tel:` with no address — mark stripped, text kept. */
    linkMarkStrippedMailto: number;
  };
  /** Sample src URLs from carousels that were stripped. Capped per call. */
  discardedCarouselSrcs: { swiper: string[]; premiumAdv: string[]; bdtImg: string[] };
}

export interface ConversionOptions {
  /** Per-block image references resolved upstream (lazy upload). The pipeline
   * inserts placeholder image blocks; the importer later swaps in the real
   * Sanity asset reference based on the WP attachment URL. */
  attachmentResolver?: (sourceUrl: string) => string | null;
  /** Shape of `alt` / `caption` on emitted image blocks.
   *  - `'i18n'` (default) emits internationalized arrays — for field-level i18n schemas (city/tour/etc).
   *  - `'string'` emits plain strings — for document-level i18n schemas (article).
   * The mismatch is what surfaced as "Expected type String got Array" in Studio. */
  localeShape?: 'string' | 'i18n';
  /** When provided, the first `<h1>`/`<h2>` whose text matches the page title
   * (case-insensitive substring, either direction) is stripped. Removes the
   * title-duplication artifact common on Elementor pages where the body
   * starts with an H1 of the same text as the WP title.
   * Counts in `stats.titleH1Stripped`. */
  pageTitle?: string;
}

// ---------- Entry point ------------------------------------------------

export function htmlToPortableText(html: string, opts: ConversionOptions = {}): ConversionResult {
  const stats = {
    operatorNotes: 0,
    pullQuotes: 0,
    sideImages: 0,
    images: 0,
    tablesFlattened: 0,
    pendingInternalLinks: 0,
    tourPromoStripped: 0,
    categoryGridStripped: 0,
    backlinkStripped: 0,
    carouselSwiperStripped: 0,
    carouselPremiumAdvStripped: 0,
    bdtImgStripped: 0,
    titleH1Stripped: 0,
    metadataLineStripped: 0,
    sectionNavBlockStripped: 0,
    linkMarkConvertedToPendingRef: 0,
    linkMarkKeptAsExternal: 0,
    linkMarkStrippedMalformed: 0,
    linkMarkStrippedAnchor: 0,
    linkMarkStrippedMailto: 0,
  };
  const discardedCarouselSrcs = { swiper: [] as string[], premiumAdv: [] as string[], bdtImg: [] as string[] };
  const decoded = decodeEntities(html);
  const root = parse(decoded, { lowerCaseTagName: false });

  // Promotional widget strip MUST run before liftElementorWrappers — lifting
  // destroys the wrapper ancestry the class detectors need.
  stripPromotionalWidgets(root, stats);
  stripCarouselWidgets(root, stats, discardedCarouselSrcs);
  stripBdtImgWidgets(root, stats, discardedCarouselSrcs);
  // Title-H1 strip runs before liftElementorWrappers so we can find the H1
  // inside its Elementor heading-widget container and remove the whole widget.
  if (opts.pageTitle) stripTitleH1(root, stats, opts.pageTitle);
  // Section-nav blocks run BEFORE liftElementorWrappers because the
  // destination-hub-specific pattern is an `.elementor-widget-toggle` with
  // `INTRODUCING X` / `PLAN YOUR TRIP` toggle titles. Lifting destroys those
  // wrapper classes; we need them intact to identify the widget.
  stripSectionNavBlocks(root, stats);
  stripNoise(root);
  liftElementorWrappers(root);
  // Metadata lines run AFTER lifting because they target bare <p>s, which
  // are easier to match once Elementor wrappers are flattened.
  stripMetadataLines(root, stats);
  // Duplicate-paragraph dedupe (backlink widgets) runs after lifting because
  // text-equality only stabilizes once wrapper variation is gone.
  dedupeDuplicateParagraphs(root, stats);

  const blocks: PtBlock[] = [];
  for (const child of root.childNodes) {
    walkBlock(child as HTMLElement, blocks, stats, opts);
  }

  // Drop trailing empty blocks.
  while (blocks.length && isEmptyBlock(blocks[blocks.length - 1])) blocks.pop();
  return { blocks, stats, discardedCarouselSrcs };
}

// ---------- Stripping passes ------------------------------------------

const NOISE_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'SVG', 'FORM']);
const NOISE_CLASS_HINTS = ['share', 'social-icons', 'addtoany', 'about-author', 'post-author', 'related-posts'];

/**
 * Strip Elementor promotional widgets. Detects by class signature (must run
 * BEFORE liftElementorWrappers, which would destroy the ancestry).
 *
 * Rules:
 *   - tour-promo: `.elementor-cta` containers (Book Now / Learn more cards
 *     with image + button). Always 100% promotional, never editorial.
 *   - category-grid: `.e-grid` containers whose anchors all link to internal
 *     travel2egypt.org URLs (≥2 such anchors). The sitewide "tour categories"
 *     navigation widget. Conservative: skip e-grid blocks with mixed-internal/
 *     external anchors or fewer than 2 anchors, since they may be legit grids.
 */
function stripPromotionalWidgets(root: HTMLElement, stats: ConversionResult['stats']): void {
  // 1. tour-promo CTAs (`<div class="elementor-cta">…</div>` — image + button card).
  for (const el of Array.from(root.querySelectorAll('.elementor-cta'))) {
    el.remove();
    stats.tourPromoStripped++;
  }

  // 1b. Divider widgets are pure presentation (horizontal rule with optional
  // text in the middle, e.g. "AKHMIM Travel Guide"). Strip wholesale —
  // editorial content never lives in dividers, and the text content (when
  // present) is always a duplicate of the page title.
  for (const el of Array.from(root.querySelectorAll('.elementor-widget-divider'))) {
    el.remove();
  }

  // 2. category-grid is rendered two ways:
  //
  //    (a) An `e-grid` container holding `elementor-widget-button` children
  //        all linking to internal T2E URLs.
  //    (b) An `e-con` (e-flex/e-con-boxed) section holding sibling
  //        `elementor-widget-heading` + many `elementor-widget-button` widgets
  //        with internal-T2E anchors and NO paragraph content.
  //
  // Both are structural variants of the same sitewide nav widget. Detector:
  // any `elementor-element` whose only descendants are heading + button widgets
  // and whose buttons all link internally — strip the whole element.
  for (const el of Array.from(root.querySelectorAll('[class]'))) {
    const cls = el.getAttribute('class') ?? '';
    if (!/\belementor-element\b/.test(cls)) continue;
    if (!/\be-(grid|flex|con|con-boxed|con-full)\b/.test(cls)) continue;
    // Skip if this element is nested inside a larger element we'll handle
    // at the parent level — we want the outermost match.
    const parentCls = (el.parentNode as HTMLElement | null)?.getAttribute('class') ?? '';
    if (/\belementor-element\b/.test(parentCls) && /\be-(grid|flex|con)\b/.test(parentCls)) continue;

    const buttons = el.querySelectorAll('.elementor-widget-button');
    if (buttons.length < 2) continue;
    const anchors = buttons.flatMap((b) => b.querySelectorAll('a'));
    if (anchors.length < 2) continue;
    const allInternal = anchors.every((a) => {
      const href = a.getAttribute('href') ?? '';
      return /^https?:\/\/(www\.)?travel2egypt\.org/.test(href);
    });
    if (!allInternal) continue;
    // Reject if there's substantial editorial paragraph text in this element
    // (avoid stripping legit content that happens to contain buttons).
    const paragraphs = el.querySelectorAll('p');
    const hasProse = paragraphs.some((p) => p.text.trim().length > 80);
    if (hasProse) continue;

    el.remove();
    stats.categoryGridStripped++;
  }
}

/**
 * Remove duplicate paragraph nodes within a single body. Some WP "related
 * content" / backlink widgets emit verbatim copies of an article's own
 * paragraphs; the duplicates land at the bottom and look like trailing
 * editorial. Conservative: only paragraphs ≥80 chars qualify, only the
 * second-and-later occurrences are removed.
 */
function dedupeDuplicateParagraphs(root: HTMLElement, stats: ConversionResult['stats']): void {
  const seen = new Set<string>();
  for (const p of Array.from(root.querySelectorAll('p'))) {
    const text = p.text.trim();
    if (text.length < 80) continue;
    if (seen.has(text)) {
      p.remove();
      stats.backlinkStripped++;
    } else {
      seen.add(text);
    }
  }
}

/**
 * Strip Elementor + Royal/Premium-Addons image carousels (container-level).
 *
 * Two distinct widgets caught:
 *   - Elementor native swiper (`<img class="swiper-slide-image">`). Common on
 *     monuments, transfer/operational pages, and some tours.
 *   - Royal/Premium Elementor Addons carousel (`<img class="premium-adv-carousel__item-img">`).
 *     Dominant on hotels and cruises.
 *
 * Both are nav/decoration widgets that don't fit consultation-only architecture.
 * On hotel/cruise/tour entity types these MAY contain editorial property
 * photography — that's a separate per-mapper decision (see known-issues.md
 * "Pre-flight gates"). For posts (this session's blast radius) the post-corpus
 * scan confirmed zero swiper / zero premium-adv carousels — strip is safe.
 *
 * Strategy: walk up from each carousel `<img>` to its nearest swiper/carousel
 * container ancestor (≤8 hops), record sample srcs, remove the container.
 * If no carousel container is found, fall back to removing the `<img>` itself.
 */
function stripCarouselWidgets(
  root: HTMLElement,
  stats: ConversionResult['stats'],
  discarded: { swiper: string[]; premiumAdv: string[]; bdtImg: string[] }
): void {
  const SWIPER_CONTAINERS = /\b(swiper|elementor-widget-image-carousel|elementor-image-carousel)\b/i;
  const PREMIUM_CONTAINERS = /\bpremium-adv-carousel\b/i;
  const SAMPLE_CAP = 20;

  function walkUp(el: HTMLElement, matcher: RegExp): HTMLElement | null {
    let cur: HTMLElement | null = el;
    for (let hop = 0; hop < 8 && cur; hop++) {
      const cls = cur.getAttribute?.('class') ?? '';
      if (matcher.test(cls)) return cur;
      cur = cur.parentNode as HTMLElement | null;
    }
    return null;
  }

  // Pass 1: swiper carousels.
  const stripped = new Set<HTMLElement>();
  for (const img of Array.from(root.querySelectorAll('img'))) {
    const cls = img.getAttribute('class') ?? '';
    if (!/\bswiper-slide-image\b/.test(cls)) continue;
    const container = walkUp(img, SWIPER_CONTAINERS) ?? img;
    if (stripped.has(container)) continue;
    // Collect sample srcs from all <img> within the container.
    for (const inner of container === img ? [img] : Array.from(container.querySelectorAll('img'))) {
      const src = inner.getAttribute('src');
      if (src && discarded.swiper.length < SAMPLE_CAP) discarded.swiper.push(src);
    }
    stats.carouselSwiperStripped++;
    container.remove();
    stripped.add(container);
  }

  // Pass 2: premium-adv carousels.
  const strippedP = new Set<HTMLElement>();
  for (const img of Array.from(root.querySelectorAll('img'))) {
    const cls = img.getAttribute('class') ?? '';
    if (!/\bpremium-adv-carousel__item-img\b/.test(cls)) continue;
    const container = walkUp(img, PREMIUM_CONTAINERS) ?? img;
    if (strippedP.has(container)) continue;
    for (const inner of container === img ? [img] : Array.from(container.querySelectorAll('img'))) {
      const src = inner.getAttribute('src');
      if (src && discarded.premiumAdv.length < SAMPLE_CAP) discarded.premiumAdv.push(src);
    }
    stats.carouselPremiumAdvStripped++;
    container.remove();
    strippedP.add(container);
  }
}

/**
 * Strip Bdthemes/Element Pack `bdt-img` related-tour widgets.
 *
 * These render as <img class="bdt-img"> pointing at unrelated tour-promo
 * imagery (e.g. abu-simbel-travel-guide showed "Memories Eternal: 10-Day
 * Egypt"). Same pattern as `.elementor-cta` and category-grid — third-party
 * promotional widget, not body content. Container ancestry varies; remove
 * the closest `[class*="bdt-"]` ancestor (≤6 hops) or the img itself.
 */
function stripBdtImgWidgets(
  root: HTMLElement,
  stats: ConversionResult['stats'],
  discarded: { swiper: string[]; premiumAdv: string[]; bdtImg: string[] }
): void {
  const SAMPLE_CAP = 20;
  const stripped = new Set<HTMLElement>();
  for (const img of Array.from(root.querySelectorAll('img'))) {
    const cls = img.getAttribute('class') ?? '';
    if (!/\bbdt-img\b/.test(cls)) continue;
    let cur: HTMLElement | null = img;
    let container: HTMLElement = img;
    for (let hop = 0; hop < 6 && cur; hop++) {
      const c = cur.getAttribute?.('class') ?? '';
      if (/\bbdt-(?!img\b)[a-z-]+/.test(c)) { container = cur; break; }
      cur = cur.parentNode as HTMLElement | null;
    }
    if (stripped.has(container)) continue;
    const src = img.getAttribute('src');
    if (src && discarded.bdtImg.length < SAMPLE_CAP) discarded.bdtImg.push(src);
    stats.bdtImgStripped++;
    container.remove();
    stripped.add(container);
  }
}

/**
 * Fix 1 — strip the first H1 (or H2) whose text duplicates the WP page title.
 *
 * Common Elementor pattern: a heading widget renders the page title inside the
 * body, AND the WP title is also used as the doc's `name` field upstream. The
 * body H1 then duplicates the heading rendered by the front-end template.
 *
 * Match is case-insensitive substring, both directions:
 *   - Title contained in H1 (e.g. "Cairo Travel Guide" inside "CAIRO Travel Guide — A Complete Walkthrough")
 *   - H1 contained in title (e.g. "Cairo" body H1 against "Cairo Travel Guide" title)
 *
 * Whitespace and punctuation normalised (lowercased, multi-space collapsed,
 * dashes/punctuation removed) before substring check, so "Akhmim - The Complete
 * Travel Guide" matches "Akhmim Travel Guide".
 *
 * Counts in `stats.titleH1Stripped`. Only the FIRST matching heading is
 * removed; subsequent H1/H2 with the title are left as-is (editorial may
 * reference the title intentionally further down the body).
 */
function stripTitleH1(root: HTMLElement, stats: ConversionResult['stats'], pageTitle: string): void {
  // Normalise: lowercase + diacritic-fold (NFD then strip combining marks) +
  // replace punctuation/dashes with space + collapse whitespace. Diacritic
  // fold catches "Wādī" vs "Wadi" mismatches in WP-rendered headings.
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[‐-―\-_,.;:!?‘’“”]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const titleNorm = norm(pageTitle);
  if (!titleNorm) return;
  const titleTokens = titleNorm.split(' ').filter(Boolean);

  /**
   * Token-subsequence match: does `short`'s token sequence appear within
   * `long`'s tokens IN ORDER (with arbitrary tokens allowed between)?
   * Catches "Akhmim Travel Guide" inside "Akhmim - The Complete Travel Guide"
   * (which substring-match misses because of the inserted "the complete").
   */
  const isSubsequence = (shortTokens: string[], longTokens: string[]): boolean => {
    if (shortTokens.length === 0 || shortTokens.length > longTokens.length) return false;
    let i = 0;
    for (const lt of longTokens) {
      if (shortTokens[i] === lt) i++;
      if (i >= shortTokens.length) return true;
    }
    return false;
  };

  // Scan h1/h2 first (one strip max), then p — the latter catches the
  // "AKHMIM Travel Guide" leading-title duplicate rendered as a paragraph
  // (often a separate elementor-widget-heading with style: normal).
  // For <p> we strip ALL matches under the 60-char guard since multiple
  // duplicate-title paragraphs are common and never legitimate.
  let h1H2Done = false;
  for (const tag of ['h1', 'h2', 'p'] as const) {
    for (const el of Array.from(root.querySelectorAll(tag))) {
      if ((tag === 'h1' || tag === 'h2') && h1H2Done) break;
      const t = norm(el.text);
      if (!t) continue;
      // For <p>, only consider short title-like text (<60 chars) to avoid
      // falsely stripping a prose paragraph that happens to mention the title.
      if (tag === 'p' && t.length > 60) continue;
      const headingTokens = t.split(' ').filter(Boolean);
      // Match either direction: title-tokens-in-heading or heading-tokens-in-title.
      if (
        isSubsequence(titleTokens, headingTokens) ||
        isSubsequence(headingTokens, titleTokens) ||
        t.includes(titleNorm) ||
        titleNorm.includes(t)
      ) {
        // Walk up to the closest `.elementor-widget-heading` wrapper (the
        // specific widget that contains the heading), but STOP there. Do NOT
        // walk further up to `.elementor-element` ancestors — those are
        // column/section containers that also hold sibling widgets like
        // text-editor with the actual prose. Removing the column would
        // delete the prose alongside the heading.
        let target: HTMLElement = el;
        let cur: HTMLElement | null = el.parentNode as HTMLElement | null;
        for (let hop = 0; hop < 4 && cur; hop++) {
          const cls = cur.getAttribute?.('class') ?? '';
          if (/\belementor-widget-heading\b/.test(cls)) {
            target = cur;
            break; // found the heading widget — stop here, do not walk to parent column
          }
          cur = cur.parentNode as HTMLElement | null;
        }
        target.remove();
        stats.titleH1Stripped++;
        if (tag === 'h1' || tag === 'h2') {
          h1H2Done = true;
          break; // h1/h2 strips at most once; continue to p scan
        }
        // p scan continues — strip every matching short paragraph.
      }
    }
  }
}

/**
 * Fix 2 — strip metadata lines (`Created On…`, `Updated On…`, `Last Updated…`,
 * `Published…`).
 *
 * These appear as bare `<p>` nodes (often inside Elementor text-editor
 * widgets) generated by an unknown WP plugin. Always boilerplate, never
 * editorial content. Counts in `stats.metadataLineStripped`.
 */
const METADATA_LINE_RE = /^\s*(Created|Updated|Last\s+Updated|Published)\s+On\s+.+$/i;
function stripMetadataLines(root: HTMLElement, stats: ConversionResult['stats']): void {
  for (const p of Array.from(root.querySelectorAll('p'))) {
    const text = p.text.trim();
    if (text && METADATA_LINE_RE.test(text)) {
      p.remove();
      stats.metadataLineStripped++;
    }
  }
}

/**
 * Fix 3 — strip the section-navigation block.
 *
 * Destination-hub WP pages append a sibling-page navigation block at the
 * bottom of the body. The block consists of ALL-CAPS section headers
 * (`INTRODUCING <CITY>`, `PLAN YOUR TRIP`, `WHILE YOU ARE THERE`,
 * `PLACES TO GO`, `OTHERS`) followed by anchor links to subpage articles.
 *
 * In our schema those subpage articles are separate `guideArticle` docs
 * (linked via `parentCity` + `section`); the nav block here would be a
 * duplicate listing with broken refs.
 *
 * Detector: any `<p>`/`<h1>`/`<h2>`/`<h3>` whose normalised ALL-CAPS text
 * matches one of:
 *   - `INTRODUCING <CITY>` (any uppercase city name)
 *   - `PLAN YOUR TRIP`
 *   - `WHILE YOU ARE THERE`
 *   - `PLACES TO GO`
 *   - `OTHERS`
 *
 * Plus a leading line `<CITY> TRAVEL GUIDE` (e.g. "AKHMIM Travel Guide")
 * that precedes the first section header.
 *
 * Strip from the first match through the last match's following content
 * up to the next non-section-block sibling. Conservative bound: stop at
 * end of body if no other content follows.
 *
 * Counts in `stats.sectionNavBlockStripped` (one increment per block,
 * not per node — block-level metric).
 */
const SECTION_HEADER_PATTERNS: RegExp[] = [
  /^INTRODUCING\s+[A-Z][A-Z\s\-']+$/,
  /^PLAN YOUR TRIP$/,
  /^WHILE YOU ARE THERE$/,
  /^PLACES TO GO$/,
  /^OTHERS$/,
];
// Leading title line allows the city portion to be ALL-CAPS while the
// "Travel Guide" suffix is in title case (the actual WP rendering pattern,
// e.g. "AKHMIM Travel Guide" — observed on multiple destination-hub pages).
const LEADING_TITLE_LINE_RE = /^[A-Z][A-Z\s\-']+\s+(?:TRAVEL\s+GUIDE|Travel\s+Guide)$/;
function stripSectionNavBlocks(root: HTMLElement, stats: ConversionResult['stats']): void {
  const isHeader = (text: string) => SECTION_HEADER_PATTERNS.some((re) => re.test(text));
  const isLeadingTitle = (text: string) => LEADING_TITLE_LINE_RE.test(text);

  // Strategy A: Elementor toggle/accordion widget that contains section-nav
  // titles. Confirmed pattern on destination-hub WP pages — the section-nav
  // is rendered as `.elementor-widget-toggle` with `<a class="elementor-toggle-title">`
  // children whose text matches our SECTION_HEADER_PATTERNS. The whole widget
  // gets stripped.
  //
  // Use ONLY the outer widget wrapper class (`.elementor-widget-toggle`,
  // `.elementor-widget-accordion`) so we don't double-match the inner
  // block-element classes (`.elementor-toggle`) and double-count.
  const stripped = new Set<HTMLElement>();
  for (const widget of Array.from(
    root.querySelectorAll('.elementor-widget-toggle, .elementor-widget-accordion')
  )) {
    if (stripped.has(widget)) continue;
    // Skip if an ancestor was already removed (still attached to detached subtree).
    let parent: HTMLElement | null = widget.parentNode as HTMLElement | null;
    let ancestorRemoved = false;
    while (parent) {
      if (stripped.has(parent)) { ancestorRemoved = true; break; }
      parent = parent.parentNode as HTMLElement | null;
    }
    if (ancestorRemoved) continue;

    const titles = widget.querySelectorAll('.elementor-toggle-title, .elementor-accordion-title, .elementor-tab-title');
    let matchedAny = false;
    for (const t of titles) {
      const txt = t.text.trim();
      if (isHeader(txt)) { matchedAny = true; break; }
    }
    if (matchedAny) {
      widget.remove();
      stripped.add(widget);
      stats.sectionNavBlockStripped++;
    }
  }

  // Strategy B: plain heading/paragraph approach for non-Elementor structures.
  // Walks h1-h4 + p sequentially. Once a section header is found, only
  // consumes CONTIGUOUS nav-pattern nodes (section headers + anchor-only
  // paragraphs). Stops at the first non-matching node — does NOT strip to
  // end of body.
  //
  // "Anchor-only paragraph" = a `<p>` whose entire visible text is the
  // concatenation of its child anchor texts (no editorial prose around them).
  // If the paragraph contains additional prose, the section block is over.
  const allHeadings = Array.from(root.querySelectorAll('h1, h2, h3, h4, p'));

  let firstIdx = -1;
  for (let i = 0; i < allHeadings.length; i++) {
    const txt = allHeadings[i].text.trim();
    if (isHeader(txt)) { firstIdx = i; break; }
  }
  if (firstIdx === -1) return;

  // Walk back to consume any preceding leading-title line.
  let startIdx = firstIdx;
  if (startIdx > 0 && isLeadingTitle(allHeadings[startIdx - 1].text.trim())) startIdx--;

  const toRemove = new Set<HTMLElement>();
  // Add the leading title (if matched) and the first section header.
  for (let i = startIdx; i <= firstIdx; i++) toRemove.add(allHeadings[i]);

  // Walk forward from firstIdx+1 consuming only contiguous nav-pattern nodes.
  for (let i = firstIdx + 1; i < allHeadings.length; i++) {
    const el = allHeadings[i];
    const txt = el.text.trim();
    const tag = (el.tagName ?? '').toLowerCase();
    if (isHeader(txt)) {
      toRemove.add(el);
      continue;
    }
    if (tag === 'p') {
      const anchors = el.querySelectorAll('a');
      if (anchors.length === 0) break;
      // Anchor-only check: paragraph text equals concatenation of anchor
      // texts (with normalised whitespace). If extra prose surrounds the
      // anchors, the nav block is over.
      const anchorText = anchors.map((a) => a.text.trim()).join(' ').replace(/\s+/g, ' ').trim();
      const pText = txt.replace(/\s+/g, ' ').trim();
      if (anchorText !== pText) break;
      toRemove.add(el);
      continue;
    }
    break; // any heading not matching a section pattern → end of nav block
  }

  if (toRemove.size > 0) {
    for (const el of toRemove) el.remove();
    stats.sectionNavBlockStripped++;
  }
}

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
  // WordPress auto-injects emoji SVGs from s.w.org for emoji characters in
  // body text. They're decorative noise, not editorial content — strip them.
  for (const img of Array.from(root.querySelectorAll('img'))) {
    const cls = img.getAttribute('class') ?? '';
    const src = img.getAttribute('src') ?? '';
    if (/\bemoji\b/.test(cls) || /s\.w\.org\/images\/core\/emoji/.test(src)) {
      img.remove();
    }
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
      pushHeading(node, blocks, 'h2', stats);
      return;
    case 'H3':
      pushHeading(node, blocks, 'h3', stats);
      return;
    case 'H4':
    case 'H5':
    case 'H6':
      pushHeading(node, blocks, 'h4', stats);
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

function pushHeading(node: HTMLElement, blocks: PtBlock[], style: 'h2' | 'h3' | 'h4', stats?: ConversionResult['stats']): void {
  const children = inline(node, stats);
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
      body: [textBlock('normal', inline(node, stats))],
    });
    return;
  }

  const children = inline(node, stats);
  if (children.length === 0) return;
  blocks.push(textBlock('normal', children));
}

function pushList(node: HTMLElement, blocks: PtBlock[], listType: 'bullet' | 'number', stats: ConversionResult['stats']): void {
  for (const li of node.querySelectorAll(':scope > li')) {
    const children = inline(li as HTMLElement, stats);
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
    const children = inline(para as HTMLElement, stats);
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

/** Format alt/caption per the configured locale shape. Default 'i18n'. */
function altCaptionShape(value: string, opts: ConversionOptions): string | I18nArray {
  if (opts.localeShape === 'string') return value;
  return [{ _key: 'en', value }];
}
type I18nArray = Array<{ _key: string; value: string }>;

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
      ...(alt ? { alt: altCaptionShape(alt, opts) } : {}),
      ...(caption ? { caption: altCaptionShape(caption, opts) } : {}),
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
    ...(alt ? { alt: altCaptionShape(alt, opts) } : {}),
    ...(caption ? { caption: altCaptionShape(caption, opts) } : {}),
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
      ...(alt ? { alt: altCaptionShape(alt, opts) } : {}),
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
    ...(alt ? { alt: altCaptionShape(alt, opts) } : {}),
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

function inline(node: HTMLElement, stats?: ConversionResult['stats']): PtSpan[] {
  const spans: PtSpan[] = [];
  const markDefs: PtMarkDef[] = [];
  walkInline(node, spans, [], markDefs, stats);
  // Attach markDefs to the parent block via a side channel (we inject into the block builder).
  (spans as PtSpan[] & { __markDefs?: PtMarkDef[] }).__markDefs = markDefs;
  return spans;
}

function walkInline(node: HTMLElement, spans: PtSpan[], activeMarks: string[], markDefs: PtMarkDef[], stats?: ConversionResult['stats']): void {
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
      walkInline(el, spans, [...activeMarks, 'strong'], markDefs, stats);
      continue;
    }
    if (tag === 'EM' || tag === 'I') {
      walkInline(el, spans, [...activeMarks, 'em'], markDefs, stats);
      continue;
    }
    if (tag === 'U') {
      walkInline(el, spans, [...activeMarks, 'underline'], markDefs, stats);
      continue;
    }
    if (tag === 'A') {
      const rawHref = el.getAttribute('href') ?? '';
      const rel = el.getAttribute('rel') ?? '';
      const href = rawHref.trim();
      const markKey = key();
      const newTab = /noopener|_blank/.test(rel);

      // Schema validator (`Rule.uri({ scheme: ['http','https','mailto','tel'] })`)
      // requires absolute URLs in one of those four schemes. Anything else
      // fails Sanity validation and blocks Studio publish. Classification:
      //
      //   - relative-rooted (`/foo`)        → _pendingInternalRef, canonical https://travel2egypt.org/foo
      //   - absolute T2E http(s)            → _pendingInternalRef (existing behaviour)
      //   - absolute external http(s)       → externalLink (Wikipedia, Britannica, etc.)
      //   - mailto:/tel: with address       → externalLink
      //   - bare mailto:/tel: (no address)  → strip mark, keep text
      //   - #anchor-only                    → strip mark, keep text
      //   - empty / malformed scheme        → strip mark, keep text
      //
      // "Strip mark, keep text" means: don't add the markDef AND don't add
      // markKey to activeMarks; recurse into the <a>'s children with the
      // current activeMarks. The visible text survives; the link does not.

      // Empty href.
      if (!href) {
        if (stats) stats.linkMarkStrippedMalformed++;
        walkInline(el, spans, activeMarks, markDefs, stats);
        continue;
      }
      // Anchor-only.
      if (href.startsWith('#')) {
        if (stats) stats.linkMarkStrippedAnchor++;
        walkInline(el, spans, activeMarks, markDefs, stats);
        continue;
      }
      // Relative-rooted (single-leading-slash). Matches /foo and /es/foo;
      // does NOT match // (protocol-relative — those are typically external).
      if (/^\/(?!\/)/.test(href)) {
        const canonical = `https://travel2egypt.org${href}`;
        markDefs.push({
          _key: markKey,
          _type: 'externalLink',
          href: canonical,
          newTab,
          _pendingInternalRef: { wpUrl: canonical, sourceLocale: 'en' as const },
        });
        if (stats) stats.linkMarkConvertedToPendingRef++;
        walkInline(el, spans, [...activeMarks, markKey], markDefs, stats);
        continue;
      }
      // Absolute T2E URLs (existing behavior — already _pendingInternalRef).
      if (/^https?:\/\/(www\.)?travel2egypt\.org/.test(href)) {
        markDefs.push({
          _key: markKey,
          _type: 'externalLink',
          href,
          newTab,
          _pendingInternalRef: { wpUrl: href, sourceLocale: 'en' as const },
        });
        if (stats) stats.linkMarkConvertedToPendingRef++;
        walkInline(el, spans, [...activeMarks, markKey], markDefs, stats);
        continue;
      }
      // Disallowed schemes — strip mark.
      if (/^(javascript|data|file|ftp|vbscript):/i.test(href)) {
        if (stats) stats.linkMarkStrippedMalformed++;
        walkInline(el, spans, activeMarks, markDefs, stats);
        continue;
      }
      // mailto: / tel: — bare scheme strips, with-address keeps.
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        const afterScheme = href.replace(/^(mailto|tel):/, '').trim();
        if (!afterScheme) {
          if (stats) stats.linkMarkStrippedMailto++;
          walkInline(el, spans, activeMarks, markDefs, stats);
          continue;
        }
        markDefs.push({ _key: markKey, _type: 'externalLink', href, newTab });
        if (stats) stats.linkMarkKeptAsExternal++;
        walkInline(el, spans, [...activeMarks, markKey], markDefs, stats);
        continue;
      }
      // Absolute http(s) — keep as external.
      if (/^https?:\/\//.test(href)) {
        markDefs.push({ _key: markKey, _type: 'externalLink', href, newTab });
        if (stats) stats.linkMarkKeptAsExternal++;
        walkInline(el, spans, [...activeMarks, markKey], markDefs, stats);
        continue;
      }
      // Schemeless host (rare but defensible — `example.com/foo`). Prepend https://.
      if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|\?|#|$)/i.test(href)) {
        markDefs.push({
          _key: markKey,
          _type: 'externalLink',
          href: `https://${href}`,
          newTab,
        });
        if (stats) stats.linkMarkKeptAsExternal++;
        walkInline(el, spans, [...activeMarks, markKey], markDefs, stats);
        continue;
      }
      // Catchall — strip mark, log to malformed.
      if (stats) stats.linkMarkStrippedMalformed++;
      walkInline(el, spans, activeMarks, markDefs, stats);
      continue;
    }
    // Span/other inline wrappers: recurse without adding marks.
    walkInline(el, spans, activeMarks, markDefs, stats);
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
  const stats = {
    operatorNotes: 0,
    pullQuotes: 0,
    sideImages: 0,
    images: 0,
    tablesFlattened: 0,
    pendingInternalLinks: 0,
    tourPromoStripped: 0,
    categoryGridStripped: 0,
    backlinkStripped: 0,
    carouselSwiperStripped: 0,
    carouselPremiumAdvStripped: 0,
    bdtImgStripped: 0,
    titleH1Stripped: 0,
    metadataLineStripped: 0,
    sectionNavBlockStripped: 0,
    linkMarkConvertedToPendingRef: 0,
    linkMarkKeptAsExternal: 0,
    linkMarkStrippedMalformed: 0,
    linkMarkStrippedAnchor: 0,
    linkMarkStrippedMailto: 0,
  };

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
      const children = inline(p as HTMLElement, stats);
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
