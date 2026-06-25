/**
 * Admin list-view URL search-params parser (Session 10).
 *
 * Filters and sort live in the URL so a reviewer's view is shareable and
 * back/forward-friendly. Unknown values are silently dropped to their default
 * — the filters object is a closed enumeration; we never echo arbitrary
 * strings from the URL straight into the DB query.
 */

export const PAGE_SIZE = 20;

export type SortKey = 'recent';
export type LocaleKey = 'en' | 'es' | 'ja';

/** flag_reason controlled vocabulary — mirror what `/api/chat` writes. */
export const FLAG_REASONS = [
  'escape_hatch_used',
  'prompt_injection_attempt',
  'hostile_language',
  'off_topic_persistent',
  'repeated_identical',
  'hostile_content',
  'rate_limited',
] as const;

export type FlagReason = (typeof FLAG_REASONS)[number];

export interface ListFilters {
  /** ISO calendar date 'YYYY-MM-DD' (inclusive lower bound), or null. */
  from: string | null;
  /** ISO calendar date 'YYYY-MM-DD' (inclusive upper bound), or null. */
  to: string | null;
  locale: LocaleKey | null;
  briefCompleted: boolean | null;
  flagged: boolean | null;
  flagReason: FlagReason | null;
  reviewed: boolean | null;
  sort: SortKey;
  /** 1-indexed page number. */
  page: number;
}

const LOCALES = new Set<LocaleKey>(['en', 'es', 'ja']);
const FLAG_REASON_SET = new Set<FlagReason>(FLAG_REASONS);

function parseBool(v: string | null): boolean | null {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return null;
}

function parseLocale(v: string | null): LocaleKey | null {
  return v && LOCALES.has(v as LocaleKey) ? (v as LocaleKey) : null;
}

function parseFlagReason(v: string | null): FlagReason | null {
  return v && FLAG_REASON_SET.has(v as FlagReason) ? (v as FlagReason) : null;
}

function parseDate(v: string | null): string | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

function parsePage(v: string | null): number {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function parseFilters(sp: URLSearchParams): ListFilters {
  return {
    from: parseDate(sp.get('from')),
    to: parseDate(sp.get('to')),
    locale: parseLocale(sp.get('locale')),
    briefCompleted: parseBool(sp.get('briefCompleted')),
    flagged: parseBool(sp.get('flagged')),
    flagReason: parseFlagReason(sp.get('flagReason')),
    reviewed: parseBool(sp.get('reviewed')),
    sort: 'recent', // v1: length/tokens sort follows the admin views migration
    page: parsePage(sp.get('page')),
  };
}

/** Encode current filters back into a URLSearchParams (for pagination + filter changes). */
export function encodeFilters(filters: Partial<ListFilters>): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.from) sp.set('from', filters.from);
  if (filters.to) sp.set('to', filters.to);
  if (filters.locale) sp.set('locale', filters.locale);
  if (filters.briefCompleted !== null && filters.briefCompleted !== undefined) {
    sp.set('briefCompleted', String(filters.briefCompleted));
  }
  if (filters.flagged !== null && filters.flagged !== undefined) {
    sp.set('flagged', String(filters.flagged));
  }
  if (filters.flagReason) sp.set('flagReason', filters.flagReason);
  if (filters.reviewed !== null && filters.reviewed !== undefined) {
    sp.set('reviewed', String(filters.reviewed));
  }
  if (filters.page && filters.page > 1) sp.set('page', String(filters.page));
  return sp;
}
