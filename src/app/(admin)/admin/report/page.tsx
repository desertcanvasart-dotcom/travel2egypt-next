import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/admin/auth';
import { getReport, parseFilters } from '@/lib/admin/report';
import { ReportView } from '@/components/admin/ReportView';

export const dynamic = 'force-dynamic';

/**
 * /admin/report — enquiries + cookieless traffic (measurement, 2026-11-10).
 * Same gate as the rest of /admin: Supabase Auth session AND ADMIN_EMAILS.
 */
export default async function ReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === 'string') sp.set(k, v);
  const filters = parseFilters(sp);
  const report = await getReport(filters);
  const csv = new URLSearchParams({ from: filters.from, to: filters.to, ...(filters.locale ? { locale: filters.locale } : {}) });
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans text-night">
      <header className="mb-6 flex items-baseline justify-between border-b border-night/10 pb-4">
        <h1 className="font-serif text-2xl">Enquiries &amp; traffic</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="underline">Conversations</Link>
          <Link href="/admin/departures" className="underline">Departures</Link>
          <span className="text-night-soft">{session.email}</span>
        </nav>
      </header>
      <ReportView report={report} csvHref={`/api/admin/report?${csv.toString()}`} />
    </div>
  );
}
