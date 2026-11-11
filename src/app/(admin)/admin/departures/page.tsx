import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/admin/auth';
import { canWrite, DEPARTURE_STATUSES, getGroupTours, siteState, STATUS_LABELS } from '@/lib/admin/departures';
import { DEPARTURE_CUTOFF_DAYS } from '@/components/tour-system/departures';

export const dynamic = 'force-dynamic';

/**
 * /admin/departures — mark scheduled small-group departures as booked, add
 * and remove dates (owner, 2026-11-11). Same gate as the rest of /admin.
 *
 * A date counts as booked when its status is Guaranteed, Few places or Sold
 * out, or Places left is below the tour's max group. Unbooked dates leave the
 * site DEPARTURE_CUTOFF_DAYS before they start; nothing is deleted.
 */
export default async function DeparturesAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  const sp = await searchParams;
  const msg = typeof sp.msg === 'string' ? sp.msg : null;
  const writable = canWrite();
  const tours = await getGroupTours();
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 font-sans text-night">
      <header className="mb-6 flex items-baseline justify-between border-b border-night/10 pb-4">
        <h1 className="font-serif text-2xl">Small-group departures</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="underline">Conversations</Link>
          <Link href="/admin/report" className="underline">Enquiries &amp; traffic</Link>
          <span className="text-night-soft">{session.email}</span>
        </nav>
      </header>

      <p className="mb-2 max-w-3xl text-sm text-night-soft">
        Mark a date as booked when a group has a booking or hold: status <strong>Guaranteed</strong>, <strong>Few places</strong> or{' '}
        <strong>Sold out</strong>, or a <strong>Places left</strong> number below the max group. Unbooked dates disappear from the
        site {DEPARTURE_CUTOFF_DAYS} days before they start (nothing is deleted). Places left is shown to visitors.
      </p>
      {!writable && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          Read-only: the server has no Sanity write token (SANITY_PRODUCTION_API_WRITE_TOKEN). Add it on Railway to save here, or edit in
          Sanity Studio.
        </p>
      )}
      {msg && <p className="mb-4 rounded border border-night/15 bg-white px-3 py-2 text-sm">{msg}</p>}

      {tours.map((t) => (
        <section key={t._id} className="mb-10">
          <h2 className="font-serif text-xl">
            {t.title}{' '}
            <a href={`/${t.slugs.en}`} target="_blank" rel="noreferrer" className="font-sans text-sm underline">
              view
            </a>
          </h2>
          <p className="mb-3 text-sm text-night-soft">
            {t.durationDays ? `${t.durationDays} days · ` : ''}max group {t.maxGroup ?? '— (not set)'} · from €
            {t.basePrice ?? t.priceFrom ?? '—'} per person{t.peakUpliftPct ? ` · peak +${t.peakUpliftPct}%` : ''}
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-night/15 text-left text-night-soft">
                <th className="py-2 pr-3 font-normal">Start date</th>
                <th className="py-2 pr-3 font-normal">On the site today</th>
                <th className="py-2 pr-3 font-normal">Status</th>
                <th className="py-2 pr-3 font-normal">Places left</th>
                <th className="py-2 pr-3 font-normal" />
                <th className="py-2 font-normal" />
              </tr>
            </thead>
            <tbody>
              {t.departures.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-night-soft">No dates yet — the site shows “ask us”.</td>
                </tr>
              )}
              {t.departures.map((d) => {
                const state = siteState(d, t.maxGroup, now);
                const formId = `f-${t._id}-${d._key}`;
                return (
                  <tr key={d._key} className={`border-b border-night/10 ${state.tone === 'past' ? 'opacity-50' : ''}`}>
                    <td className="py-2 pr-3">
                      {d.startDate ? fmt.format(new Date(`${d.startDate.slice(0, 10)}T00:00:00Z`)) : '—'}
                      {d.isPeak ? <span className="ml-2 text-xs uppercase text-gold-ink">peak</span> : null}
                    </td>
                    <td className={`py-2 pr-3 ${state.tone === 'off' ? 'text-red-700' : state.tone === 'on' ? 'text-green-800' : ''}`}>{state.label}</td>
                    <td className="py-2 pr-3">
                      <select name="status" form={formId} defaultValue={d.status ?? ''} disabled={!writable} className="border border-night/20 bg-white px-2 py-1">
                        {DEPARTURE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        name="placesLeft"
                        form={formId}
                        type="number"
                        min={0}
                        max={99}
                        defaultValue={typeof d.placesLeft === 'number' ? d.placesLeft : ''}
                        disabled={!writable}
                        className="w-20 border border-night/20 bg-white px-2 py-1"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <form id={formId} method="post" action="/api/admin/departures">
                        <input type="hidden" name="action" value="update" />
                        <input type="hidden" name="tour" value={t._id} />
                        <input type="hidden" name="key" value={d._key} />
                        <button type="submit" disabled={!writable} className="bg-night px-3 py-1 text-white disabled:opacity-40">
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="py-2">
                      <form method="post" action="/api/admin/departures">
                        <input type="hidden" name="action" value="remove" />
                        <input type="hidden" name="tour" value={t._id} />
                        <input type="hidden" name="key" value={d._key} />
                        <button type="submit" disabled={!writable} className="text-red-700 underline disabled:opacity-40">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <form method="post" action="/api/admin/departures" className="mt-3 flex items-center gap-3 text-sm">
            <input type="hidden" name="action" value="add" />
            <input type="hidden" name="tour" value={t._id} />
            <label className="flex items-center gap-2">
              Add a date <input type="date" name="date" required disabled={!writable} className="border border-night/20 bg-white px-2 py-1" />
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" name="peak" disabled={!writable} /> peak
            </label>
            <button type="submit" disabled={!writable} className="border border-night px-3 py-1 disabled:opacity-40">
              Add
            </button>
          </form>
        </section>
      ))}
    </div>
  );
}
