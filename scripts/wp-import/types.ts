/**
 * Shared types for the WordPress importer.
 */

import type { Classification, PageType } from '../wp-classifier.js';

export type Locale = 'en' | 'es' | 'ja';
export const LOCALES: readonly Locale[] = ['en', 'es', 'ja'] as const;

/** A WordPress entity slim view (post or page). */
export interface WpEntityLite {
  id: number;
  slug: string;
  link: string;
  date: string;
  modified: string;
  modified_gmt?: string;
  parent?: number;
  template?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  status?: string;
  title?: { rendered: string };
}

export interface WpEntityFull extends WpEntityLite {
  content?: { rendered: string };
  excerpt?: { rendered: string };
  acf?: Record<string, unknown> | unknown[];
  meta?: Record<string, unknown>;
  type: string;
  author?: number;
}

/** A WordPress media (attachment) record. */
export interface WpMedia {
  id: number;
  date: string;
  source_url: string;
  alt_text?: string;
  caption?: { rendered: string };
  description?: { rendered: string };
  media_type: string;
  mime_type: string;
  media_details?: {
    width?: number;
    height?: number;
    file?: string;
    filesize?: number;
    sizes?: Record<string, { source_url: string; width: number; height: number; mime_type?: string }>;
  };
}

/** Hreflang map for one EN entity, indexed by locale. */
export interface HreflangMap {
  wpId: number;
  links: Partial<Record<Locale | 'x-default', string>>;
}

/** A locale group: the EN entity + its translated counterparts (if any). */
export interface LocaleGroup {
  en: WpEntityFull;
  es?: WpEntityFull;
  ja?: WpEntityFull;
  hreflang: HreflangMap;
  /** True when only EN is present (singleton). */
  singleton: boolean;
  /** True when the EN doc is missing but ES or JA exists (orphan). */
  orphan?: boolean;
}

/** Sanity-side internationalized array entry. */
export interface I18nEntry<T = unknown> {
  _key: Locale | string;
  value: T;
}

/** Field-level i18n string field — array of {_key, value}. */
export type I18nString = Array<I18nEntry<string>>;

/** Field-level i18n slug field — array of {_key, value:{current}}. */
export type I18nSlug = Array<I18nEntry<{ _type: 'slug'; current: string }>>;

/** A reference to a Sanity asset (image upload). */
export interface SanityImageRef {
  _type: 'image';
  asset: { _type: 'reference'; _ref: string };
  alt?: I18nString;
  caption?: I18nString;
}

/** Migration provenance object — written to every imported doc. */
export interface MigrationMetadata {
  wpId: number;
  wpUrl: string;
  wpModifiedAt?: string;
  wpTemplate?: string | null;
  migratedAt: string;
  source: 'wp-import';
  reviewFlag?: ReviewFlag;
  wpAuthorId?: number;
  wpAuthorSlug?: string;
  wpCategorySlugs?: string[];
}

export type ReviewFlag =
  | 'section-needs-assignment'
  | 'unclassified-as-article'
  | 'service-deferred'
  | 'interactive-tool'
  | 'promotional-marketing'
  | 'locale-orphan'
  | 'keyfacts-mining-failed'
  | 'hreflang-broken'
  | 'table-flattened'
  | 'multi-category-original'
  | 'wadi-parent-inferred';

/** HTML→PT conversion stats summed across all locales of one entity. */
export interface HtmlPipelineStats {
  operatorNotes: number;
  pullQuotes: number;
  sideImages: number;
  images: number;
  tablesFlattened: number;
  pendingInternalLinks: number;
  tourPromoStripped: number;
  categoryGridStripped: number;
  backlinkStripped: number;
  carouselSwiperStripped: number;
  carouselPremiumAdvStripped: number;
  bdtImgStripped: number;
}

/** Per-locale record of carousel images discarded by strip rules (sample srcs). */
export interface DiscardedCarousel {
  docId: string;
  slug: string;
  locale: Locale;
  widget: 'swiper' | 'premium-adv' | 'bdt-img';
  count: number;
  sampleSrcs: string[];
}

/** Output of a mapper for a single entity. */
export interface MapperResult {
  /** The Sanity document(s) ready to write. May be 1 (field-level i18n) or up to 3 (document-level i18n). */
  docs: SanityDoc[];
  /** Mapped redirect entries (one per locale where applicable). */
  redirects: RedirectEntry[];
  /** Free-form log lines to add to the migration log. */
  logEntries?: LogEntry[];
  /** HTML pipeline detection stats summed across this entity's locales. */
  htmlStats?: HtmlPipelineStats;
  /** Number of media assets uploaded (or "would upload" in dry-run) for this entity. */
  mediaUploaded?: number;
  /** Per-locale discarded-carousel records (sample srcs preserved for editorial). */
  discardedCarousels?: DiscardedCarousel[];
  /** Times a duplicate `<img src>` for the same `wp-image-{ID}` was remapped to the existing asset. */
  duplicateSrcRemappings?: number;
}

/** Generic Sanity doc — typed loosely; mappers carry the burden of correctness. */
export interface SanityDoc {
  _id: string;
  _type: string;
  [key: string]: unknown;
}

export interface RedirectEntry {
  from_url: string;
  to_path: string;
  locale: Locale;
  status_code: 301;
  legacy_wp_id: number | null;
  priority_score: number;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  wpId?: number;
  url?: string;
  message: string;
  data?: unknown;
}

export interface CliOptions {
  dryRun: boolean;
  limit?: number;
  type: 'post' | 'page' | 'attachment' | 'category' | 'all';
  filterByTemplate?: PageType;
  /** Optional slug-pattern filter (glob `*` only — matched as prefix/suffix anchors).
   *  Combines with `--filter-by-template`: page must satisfy both. Used in session 5
   *  to subset destination-hubs to `*-travel-guide` only, sidestepping the
   *  classifier's `*-egypt` overshoot without mutating classifier logic. */
  slugPattern?: string;
  /** Run the city safety-net diff infrastructure (no Sanity writes). Delegates
   *  to scripts/wp-import-diff.ts. Required for the city UPDATE step per
   *  DOC 3 session 5 spec. */
  dryRunDiffOnly?: boolean;
  /** Adversarial sample selection for the diff-only run (cairo + oldest/newest/
   *  longest/shortest). Mirrors --adversarial on wp-import-diff. */
  adversarial?: boolean;
  since?: string;
  language: 'en' | 'es' | 'ja' | 'all';
  continueOnError: boolean;
  verbose: boolean;
  phase: 'import' | 'relink';
  includeJunk: boolean;
  rescrapeHreflang: boolean;
  rate: number;
}

export type { Classification, PageType };
