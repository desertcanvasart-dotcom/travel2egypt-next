import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminSession } from '@/lib/admin/guard';
import { getReport, parseFilters } from '@/lib/admin/report';
import { toCsv } from '@/lib/admin/reportAgg';

/**
 * GET /api/admin/report?from&to&locale — the /admin/report data as CSV
 * (aggregates only; no emails or other personal data). Admin-gated.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const gate = await requireAdminSession();
  if (gate instanceof NextResponse) return gate;
  const f = parseFilters(req.nextUrl.searchParams);
  const r = await getReport(f);
  const counts = (dimension: string, rows: Array<{ key: string; count: number }>) => ({
    dimension,
    header: ['key', 'count'],
    rows: rows.map((x) => [x.key, x.count]),
  });
  const rates = (dimension: string, rows: Array<{ key: string; views: number; leads: number; rate: number }>) => ({
    dimension,
    header: ['key', 'views', 'leads', 'leads_per_100_views'],
    rows: rows.map((x) => [x.key, x.views, x.leads, x.rate]),
  });
  const csv = toCsv([
    counts('leads_per_day', r.perDay),
    counts('leads_per_week', r.perWeek),
    counts('leads_by_source', r.bySource),
    counts('leads_by_landing_page', r.byLandingPage),
    counts('leads_by_tour', r.byTour),
    counts('leads_by_journey', r.byJourney),
    counts('leads_by_locale', r.byLocale),
    counts('leads_by_referrer_domain', r.byReferrer),
    counts('views_per_week', r.views.perWeek),
    counts('views_by_page', r.views.topPages.map((p) => ({ key: p.path, count: p.views }))),
    counts('views_by_referrer_domain', r.views.byReferrer),
    counts('views_by_device', r.views.byDevice),
    rates('rate_by_section', r.views.sectionRates),
    rates('rate_by_page', r.views.pageRates),
    { dimension: 'site_changes', header: ['day', 'description'], rows: r.changes.map((c) => [c.day, c.description]) },
  ]);
  const name = `t2e-report_${f.from}_${f.to}${f.locale ? `_${f.locale}` : ''}.csv`;
  return new NextResponse(csv, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store' },
  });
}
