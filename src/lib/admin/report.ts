import 'server-only';

import { groq } from 'next-sanity';

import { client } from '@/sanity/lib/client';
import { conciergeDb } from '@/lib/supabase/server';

import {
  countBy,
  perDay,
  perWeek,
  ratesByPage,
  ratesBySection,
  realLeads,
  type Count,
  type LeadRow,
  type PageRate,
} from './reportAgg';

/**
 * /admin/report data (measurement, 2026-11-10). Leads come from
 * concierge.leads (the source of truth for enquiries, consent-independent),
 * page views from the cookieless concierge.pageviews_daily counts. Test leads
 * are always excluded. Every read is fail-soft: a missing migration shows as
 * a note on the page, never an error.
 */
export interface ReportFilters {
  from: string;
  to: string;
  locale: 'en' | 'es' | 'ja' | null;
}

export interface SiteChange {
  id: number;
  day: string;
  description: string;
}

export interface Report {
  filters: ReportFilters;
  totalLeads: number;
  testLeadsExcluded: number;
  perDay: Count[];
  perWeek: Count[];
  bySource: Count[];
  byLandingPage: Count[];
  byTour: Count[];
  byJourney: Count[];
  byLocale: Count[];
  byReferrer: Count[];
  views: {
    available: boolean;
    total: number;
    perWeek: Count[];
    topPages: Array<{ path: string; views: number }>;
    byReferrer: Count[];
    byDevice: Count[];
    pageRates: PageRate[];
    sectionRates: PageRate[];
  };
  changes: SiteChange[];
  changesAvailable: boolean;
  notes: string[];
}

const MAX_LEADS = 20000;

/** YYYY-MM-DD, defaulting to the last 90 days (UTC). */
export function parseFilters(sp: URLSearchParams): ReportFilters {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const today = new Date().toISOString().slice(0, 10);
  const d90 = new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10);
  const from = iso.test(sp.get('from') ?? '') ? (sp.get('from') as string) : d90;
  const to = iso.test(sp.get('to') ?? '') ? (sp.get('to') as string) : today;
  const l = sp.get('locale');
  return { from: from <= to ? from : to, to, locale: l === 'en' || l === 'es' || l === 'ja' ? l : null };
}

/** Product and hub slugs (every language) for the section split. */
async function slugSets(): Promise<{ products: Set<string>; hubs: Set<string> }> {
  try {
    const r = await client.fetch<{ products: string[]; hubs: string[] }>(groq`{
      "products": *[_type == "tour" && !(_id in path("drafts.**"))].slug[].value.current,
      "hubs": *[_type in ["tourLanding", "tourCategory"] && !(_id in path("drafts.**"))].slug[].value.current
    }`);
    const hubs = new Set(r.hubs.filter(Boolean));
    // Hubs that are code routes, not Sanity docs.
    for (const h of ['egypt-travel-packages', 'paquetes-de-viaje-a-egipto', 'ejiputo-ryoko-pakkeeji', 'private-day-tours', 'group-day-tours', 'small-group-travel-packages', 'nile-cruises', 'hotels', 'packages']) hubs.add(h);
    return { products: new Set(r.products.filter(Boolean)), hubs };
  } catch {
    return { products: new Set(), hubs: new Set() };
  }
}

export async function getReport(filters: ReportFilters): Promise<Report> {
  const db = conciergeDb();
  const notes: string[] = [];
  const { from, to, locale } = filters;
  const toEnd = `${to}T23:59:59.999Z`;

  // Leads — select('*') so the page works before 0010/0011 (missing columns read as undefined).
  let q = db.from('leads').select('*').gte('created_at', `${from}T00:00:00Z`).lte('created_at', toEnd).limit(MAX_LEADS);
  if (locale) q = q.eq('locale', locale);
  const { data: leadData, error: leadErr } = await q;
  if (leadErr) notes.push(`Leads could not be read: ${leadErr.message}`);
  const all = (leadData ?? []) as unknown as LeadRow[];
  if (all.length && !('is_test' in (all[0] as object))) notes.push('Migration 0010 not applied: test leads cannot be told apart yet (journey / is_test columns missing).');
  if (all.length && !('landing_page' in (all[0] as object))) notes.push('Migration 0011 not applied: landing page, referrer and form location are not stored yet.');
  const leads = realLeads(all);

  // Page views.
  const pvArgs = { p_from: from, p_to: to, p_locale: locale };
  const [byPath, byDay, byRef, byDev, sets] = await Promise.all([
    db.rpc('pv_by_path', pvArgs),
    db.rpc('pv_by_day', pvArgs),
    db.rpc('pv_by_referrer', pvArgs),
    db.rpc('pv_by_device', pvArgs),
    slugSets(),
  ]);
  const viewsAvailable = !byPath.error;
  if (!viewsAvailable) notes.push('Page counts unavailable: apply migration 0011 (pageviews_daily). Counting starts once it exists.');
  const pathViews = ((byPath.data ?? []) as Array<{ path: string; views: number }>).map((r) => ({ path: r.path, views: Number(r.views) }));
  const dayViews = ((byDay.data ?? []) as Array<{ day: string; views: number }>).map((r) => ({ day: r.day, views: Number(r.views) }));
  const weekMap = new Map<string, number>();
  for (const w of perWeek([], from, to)) weekMap.set(w.key, 0);
  for (const d of dayViews) {
    const wk = perWeek([{ created_at: `${d.day}T00:00:00Z`, source: null, locale: null }], d.day, d.day)[0]?.key;
    if (wk) weekMap.set(wk, (weekMap.get(wk) ?? 0) + d.views);
  }

  // Change markers.
  const ch = await db.from('site_changes').select('id, day, description').order('day', { ascending: true });
  if (ch.error) notes.push('Change markers unavailable: apply migration 0011 (site_changes).');

  return {
    filters,
    totalLeads: leads.length,
    testLeadsExcluded: all.length - leads.length,
    perDay: perDay(leads, from, to),
    perWeek: perWeek(leads, from, to),
    bySource: countBy(leads, (l) => l.source),
    byLandingPage: countBy(leads, (l) => l.landing_page),
    byTour: countBy(leads, (l) => l.tour_slug),
    byJourney: countBy(leads, (l) => l.journey),
    byLocale: countBy(leads, (l) => l.locale),
    byReferrer: countBy(leads, (l) => (l.landing_page ? l.referrer_domain || '(direct)' : null)),
    views: {
      available: viewsAvailable,
      total: pathViews.reduce((a, r) => a + r.views, 0),
      perWeek: [...weekMap.entries()].map(([key, count]) => ({ key, count })),
      topPages: pathViews.slice(0, 50),
      byReferrer: ((byRef.data ?? []) as Array<{ referrer_domain: string; views: number }>).map((r) => ({ key: r.referrer_domain || '(direct / internal)', count: Number(r.views) })),
      byDevice: ((byDev.data ?? []) as Array<{ device: string; views: number }>).map((r) => ({ key: r.device, count: Number(r.views) })),
      pageRates: ratesByPage(pathViews, leads, 50),
      sectionRates: ratesBySection(pathViews, leads, sets),
    },
    changes: ((ch.data ?? []) as SiteChange[]).filter((c) => c.day >= from && c.day <= to),
    changesAvailable: !ch.error,
    notes,
  };
}
