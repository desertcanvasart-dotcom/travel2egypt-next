/**
 * MD → HTML → Portable Text bridge.
 *
 * Per phase-2-plan §4.3: `marked` for MD→HTML, then the battle-tested
 * `wp-import-html.ts` pipeline for HTML→PT. The pipeline supports an
 * `attachmentResolver(src) → assetId` hook which we feed from the
 * pre-uploaded image map — so emitted image blocks land with proper
 * Sanity `asset._ref` shapes.
 */

import { marked } from 'marked';

import { htmlToPortableText, type ConversionResult, type PtBlock } from '../wp-import-html.js';
import type { Locale, UploadedImage } from './types.js';

export interface ConvertOpts {
  locale: Locale;
  pageTitle?: string;
  /** Map of `<img src>` values (as they appear in MD/HTML) to their pre-uploaded asset. */
  imageMap: Map<string, UploadedImage>;
}

export interface ConvertResult {
  blocks: PtBlock[];
  stats: ConversionResult['stats'];
}

/** Configure marked once (idempotent — safe to call repeatedly). */
function configureMarked(): void {
  marked.setOptions({
    gfm: true,
    breaks: false,
  });
}

/**
 * Convert one MD body to PT. The output is the per-locale `value` array
 * suitable for `guideArticle.body[].value`.
 */
/**
 * Marked wraps a standalone image line in a `<p>` element. The HTML→PT pipeline
 * drops images that are direct children of `<p>` (treats them as inline noise),
 * so we lift `<p><img …></p>` (with optional whitespace around the img) to a
 * bare `<img …>` at block level before handing off to the pipeline.
 */
function unwrapImageParagraphs(html: string): string {
  return html.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/gi, '$1');
}

export function mdToPortableText(md: string, opts: ConvertOpts): ConvertResult {
  configureMarked();
  let html = marked.parse(md, { async: false }) as string;
  html = unwrapImageParagraphs(html);
  const resolver = (src: string): string | null => {
    const entry = opts.imageMap.get(src);
    return entry ? entry.assetId : null;
  };
  const result = htmlToPortableText(html, {
    attachmentResolver: resolver,
    localeShape: 'i18n',
    locale: opts.locale,
    pageTitle: opts.pageTitle,
  });
  return { blocks: result.blocks, stats: result.stats };
}
