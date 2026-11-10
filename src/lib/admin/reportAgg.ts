/**
 * Pure aggregation for /admin/report (measurement, 2026-11-10). Unit-tested
 * in src/lib/__tests__/report-agg.test.ts. No I/O here.
 */

export interface LeadRow {
  created_at: string;
  source: string | null;
  locale: string | null;
  tour_slug?: string | null;
  journey?: string | null;
  landing_page?: string | null;
  referrer_domain?: string | null;
  page_path?: string | null;
  is_test?: boolean | null;
}

export type Section = 'home' | 'product' | 'hub' | 'journey' | 'guide' | 'blog' | 'plan' | 'other';
export const SECTIONS: Section[] = ['home', 'product', 'hub', 'journey', 'guide', 'blog', 'plan', 'other'];

export interface Count {
  key: string;
  count: number;
}

const NONE = '(not set)';

/** Group + count, biggest first; null/empty → "(not set)" so old rows stay visible, not guessed. */
export function countBy<T>(rows: T[], pick: (r: T) => string | null | undefined): Count[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = pick(r)?.trim() || NONE;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** Test leads never count. Rows from before 0010 have no is_test (→ real). */
export const realLeads = <T extends LeadRow>(rows: T[]) => rows.filter((r) => r.is_test !== true);

/** "2026-11-10T15:30:07Z" → "2026-11-10" (UTC). */
export const dayOf = (iso: string) => iso.slice(0, 10);

/** ISO week start (Monday, UTC) for a YYYY-MM-DD day. */
export function weekOf(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/** Every day in [from, to] (inclusive) — so empty days still show as 0. */
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end && out.length < 1000) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function perDay(rows: LeadRow[], from: string, to: string): Count[] {
  const m = new Map(countBy(rows, (r) => dayOf(r.created_at)).map((c) => [c.key, c.count]));
  return daysBetween(from, to).map((key) => ({ key, count: m.get(key) ?? 0 }));
}

export function perWeek(rows: LeadRow[], from: string, to: string): Count[] {
  const weeks = [...new Set(daysBetween(from, to).map(weekOf))];
  const m = new Map(countBy(rows, (r) => weekOf(dayOf(r.created_at))).map((c) => [c.key, c.count]));
  return weeks.map((key) => ({ key, count: m.get(key) ?? 0 }));
}

/** "/es/guide/el-cairo" → { locale: "es", path: "/guide/el-cairo" }. */
export function stripLocale(path: string): string {
  const m = path.match(/^\/(es|ja)(\/.*)?$/);
  return m ? m[2] || '/' : path || '/';
}

/**
 * Page → section. Products and hubs are told apart by their real slugs
 * (from Sanity, any language), never by URL shape alone.
 */
export function sectionOf(path: string, sets: { products: Set<string>; hubs: Set<string> }): Section {
  const p = stripLocale(path);
  if (p === '/') return 'home';
  if (p === '/journeys' || p.startsWith('/journeys/')) return 'journey';
  if (p.startsWith('/guide')) return 'guide';
  if (p.startsWith('/blog')) return 'blog';
  if (p.startsWith('/plan-your-tour')) return 'plan';
  const seg = p.split('/').filter(Boolean);
  if (seg.length === 1) {
    if (sets.hubs.has(seg[0])) return 'hub';
    if (sets.products.has(seg[0])) return 'product';
  }
  return 'other';
}

export interface PageRate {
  key: string;
  views: number;
  leads: number;
  /** Leads per 100 views. */
  rate: number;
}

/** Leads per 100 views, by page (leads attributed to the page they were sent from). */
export function ratesByPage(views: Array<{ path: string; views: number }>, leads: LeadRow[], minViews = 50): PageRate[] {
  const leadCount = new Map(countBy(leads, (l) => l.page_path).map((c) => [c.key, c.count]));
  return views
    .filter((v) => v.views >= minViews)
    .map((v) => {
      const n = leadCount.get(v.path) ?? 0;
      return { key: v.path, views: v.views, leads: n, rate: Math.round((n / v.views) * 10000) / 100 };
    })
    .sort((a, b) => b.rate - a.rate || b.views - a.views);
}

/** The same by section. */
export function ratesBySection(
  views: Array<{ path: string; views: number }>,
  leads: LeadRow[],
  sets: { products: Set<string>; hubs: Set<string> },
): PageRate[] {
  const v = new Map<Section, number>();
  for (const r of views) v.set(sectionOf(r.path, sets), (v.get(sectionOf(r.path, sets)) ?? 0) + r.views);
  const l = new Map<Section, number>();
  for (const r of leads) {
    if (!r.page_path) continue;
    const s = sectionOf(r.page_path, sets);
    l.set(s, (l.get(s) ?? 0) + 1);
  }
  return SECTIONS.filter((s) => (v.get(s) ?? 0) > 0 || (l.get(s) ?? 0) > 0).map((s) => {
    const views = v.get(s) ?? 0;
    const leads = l.get(s) ?? 0;
    return { key: s, views, leads, rate: views ? Math.round((leads / views) * 10000) / 100 : 0 };
  });
}

/** Long-format CSV: one table per report block (dimension,key,value[,value2]). */
export function toCsv(blocks: Array<{ dimension: string; header: string[]; rows: Array<Array<string | number>> }>): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines: string[] = [];
  for (const b of blocks) {
    lines.push(['dimension', ...b.header].map(esc).join(','));
    for (const r of b.rows) lines.push([b.dimension, ...r].map(esc).join(','));
    lines.push('');
  }
  return lines.join('\n');
}
