/**
 * Itinerary-request lead (homepage rebuild, 2026-11-08) — the shape the short
 * form posts to /api/lead, and its validation. Pure: unit-tested, and shared
 * by the client form (types) and the route (normalizeLead).
 *
 * The form is deliberately short (spec §9): when, how long, who, budget,
 * contact. A day-tour "Check this date" request reuses it with an exact date
 * and party size instead of the trip-planning fields.
 */

export const LEAD_SOURCES = [
  'home_hero',
  'home_footer',
  'header',
  'mobile_bar',
  'tour_card',
  'day_tour_card',
  'quick_finder',
  'nile_cruises',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const DAY_BANDS = ['3-5', '6-9', '10-14', '15+'] as const;
export type DayBand = (typeof DAY_BANDS)[number];

/** Product length → the form's day band (fix round 1, item 7). Under 3 days → ''. */
export function dayBandFor(days?: number | null): DayBand | '' {
  if (typeof days !== 'number' || !Number.isFinite(days) || days < 3) return '';
  if (days <= 5) return '3-5';
  if (days <= 9) return '6-9';
  if (days <= 14) return '10-14';
  return '15+';
}

export const BUDGET_BANDS = ['lt1500', '1500-2500', '2500-4000', '4000+'] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number];

export const BUDGET_LABELS: Record<BudgetBand, string> = {
  lt1500: 'Under $1,500',
  '1500-2500': '$1,500–2,500',
  '2500-4000': '$2,500–4,000',
  '4000+': '$4,000+',
};

export interface LeadInput {
  source: LeadSource;
  /** 'trip' = plan-a-trip form; 'day_tour' = check a date for one day tour. */
  kind: 'trip' | 'day_tour';
  locale: string;
  email: string;
  whatsapp: string | null;
  /** YYYY-MM when the visitor picked a month. */
  travelMonth: string | null;
  /** YYYY-MM-DD — exact start date (trip) or the tour date (day tour). */
  startDate: string | null;
  endDate: string | null;
  days: DayBand | null;
  adults: number;
  children: number;
  childAges: string | null;
  budget: BudgetBand | null;
  notes: string | null;
  tourSlug: string | null;
  tourTitle: string | null;
  pagePath: string | null;
  utm: Record<string, string>;
  /** Day-tour estimate shown to the visitor (USD), if any. */
  estimatedTotal: number | null;
}

export type LeadValidation =
  | { ok: true; lead: LeadInput }
  | { ok: false; error: string; field?: string }
  /** Honeypot tripped: accept silently, store nothing. */
  | { ok: 'spam' };

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'] as const;

function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/\s+/g, ' ');
  return t ? t.slice(0, max) : null;
}

function longText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function int(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number.parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

/** Only digits, spaces, +, -, (, ) — 6 to 20 digits. */
function phone(v: unknown): string | null {
  const s = str(v, 40);
  if (!s) return null;
  if (!/^[+\d\s()-]+$/.test(s)) return null;
  const digits = s.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 20 ? s : null;
}

export function normalizeLead(body: unknown): LeadValidation {
  if (!body || typeof body !== 'object') return { ok: false, error: 'bad_request' };
  const b = body as Record<string, unknown>;

  // Honeypot: a hidden field humans never fill.
  if (typeof b.company === 'string' && b.company.trim() !== '') return { ok: 'spam' };

  const email = str(b.email, 200)?.toLowerCase() ?? null;
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email', field: 'email' };

  const whatsappRaw = str(b.whatsapp, 40);
  const whatsapp = phone(b.whatsapp);
  if (whatsappRaw && !whatsapp) return { ok: false, error: 'invalid_whatsapp', field: 'whatsapp' };

  const kind = b.kind === 'day_tour' ? 'day_tour' : 'trip';
  const source = oneOf(b.source, LEAD_SOURCES) ?? 'home_footer';

  const travelMonth = typeof b.travelMonth === 'string' && MONTH_RE.test(b.travelMonth) ? b.travelMonth : null;
  const startDate = typeof b.startDate === 'string' && DATE_RE.test(b.startDate) ? b.startDate : null;
  const endDate = typeof b.endDate === 'string' && DATE_RE.test(b.endDate) ? b.endDate : null;
  if (startDate && endDate && endDate < startDate) {
    return { ok: false, error: 'invalid_dates', field: 'endDate' };
  }
  if (kind === 'day_tour' && !startDate) return { ok: false, error: 'missing_date', field: 'startDate' };

  const adults = int(b.adults, 1, 30, 2);
  const children = int(b.children, 0, 20, 0);

  const utm: Record<string, string> = {};
  if (b.utm && typeof b.utm === 'object') {
    for (const k of UTM_KEYS) {
      const v = str((b.utm as Record<string, unknown>)[k], 200);
      if (v) utm[k] = v;
    }
  }

  const pagePath = str(b.pagePath, 300);

  return {
    ok: true,
    lead: {
      source,
      kind,
      locale: oneOf(b.locale, ['en', 'es', 'ja'] as const) ?? 'en',
      email,
      whatsapp,
      travelMonth,
      startDate,
      endDate,
      days: kind === 'trip' ? oneOf(b.days, DAY_BANDS) : null,
      adults,
      children,
      childAges: children > 0 ? str(b.childAges, 80) : null,
      budget: kind === 'trip' ? oneOf(b.budget, BUDGET_BANDS) : null,
      notes: longText(b.notes, 2000),
      tourSlug: str(b.tourSlug, 200),
      tourTitle: str(b.tourTitle, 200),
      pagePath: pagePath && pagePath.startsWith('/') ? pagePath : null,
      utm,
      estimatedTotal:
        typeof b.estimatedTotal === 'number' && Number.isFinite(b.estimatedTotal) && b.estimatedTotal > 0 && b.estimatedTotal < 1_000_000
          ? Math.round(b.estimatedTotal)
          : null,
    },
  };
}

/** Short human reference for the thank-you state and the team email. */
export function leadReference(bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(6))): string {
  // 32 unambiguous characters (no 0/O, 1/I): 6 chars ≈ 1 in a billion.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (const b of Array.from(bytes.slice(0, 6))) out += alphabet[b % 32];
  return `T2E-${out}`;
}
