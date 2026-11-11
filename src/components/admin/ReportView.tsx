import type { Report } from '@/lib/admin/report';
import type { Count, PageRate } from '@/lib/admin/reportAgg';

/**
 * /admin/report body (measurement, 2026-11-10). Server component, no client
 * JS: the filter is a GET form, change markers are added/removed with plain
 * POST forms to /api/admin/site-changes, CSV is a link.
 */
const SC_PAGES = 'https://search.google.com/search-console/index?resource_id=sc-domain%3Atravel2egypt.org';

export function ReportView({ report: r, csvHref }: { report: Report; csvHref: string }) {
  const f = r.filters;
  return (
    <div className="space-y-10">
      <form method="get" className="flex flex-wrap items-end gap-4 rounded border border-night/10 bg-paper p-4 text-sm">
        <label className="flex flex-col gap-1">
          From
          <input type="date" name="from" defaultValue={f.from} className="rounded border border-night/20 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          To
          <input type="date" name="to" defaultValue={f.to} className="rounded border border-night/20 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          Locale
          <select name="locale" defaultValue={f.locale ?? ''} className="rounded border border-night/20 px-2 py-1">
            <option value="">All</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="ja">JA</option>
          </select>
        </label>
        <button type="submit" className="rounded bg-night px-4 py-1.5 text-white">Apply</button>
        <a href={csvHref} className="ml-auto underline">Download CSV</a>
      </form>

      {r.notes.length > 0 && (
        <ul className="space-y-1 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {r.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Leads (test excluded)" value={r.totalLeads} />
        <Stat label="Test leads excluded" value={r.testLeadsExcluded} />
        <Stat label="Page views" value={r.views.available ? r.views.total : '—'} />
        <Stat label="Leads per 100 views" value={r.views.available && r.views.total ? ((r.totalLeads / r.views.total) * 100).toFixed(2) : '—'} />
      </section>

      <section>
        <h2 className="mb-1 font-serif text-xl">Leads per week</h2>
        <p className="mb-3 text-xs text-night-soft">Gold lines mark site changes (table below). Weeks start Monday (UTC).</p>
        <WeekChart data={r.perWeek} changes={r.changes} />
      </section>
      {r.views.available && (
        <section>
          <h2 className="mb-3 font-serif text-xl">Page views per week</h2>
          <WeekChart data={r.views.perWeek} changes={r.changes} />
        </section>
      )}

      <section>
        <h2 className="mb-3 font-serif text-xl">Leads per day</h2>
        <DayStrip data={r.perDay} />
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <Table title="Leads by source" rows={r.bySource} />
        <Table title="Leads by landing page" rows={r.byLandingPage} />
        <Table title="Leads by tour" rows={r.byTour} />
        <Table title="Leads by journey" rows={r.byJourney} />
        <Table title="Leads by locale" rows={r.byLocale} />
        <Table title="Leads by referrer domain" rows={r.byReferrer} />
      </section>

      {r.views.available && (
        <section className="grid gap-8 md:grid-cols-2">
          <Table title="Top pages by views" rows={r.views.topPages.map((p) => ({ key: p.path, count: p.views }))} unit="views" />
          <div className="space-y-8">
            <Table title="Views by referrer domain" rows={r.views.byReferrer} unit="views" />
            <Table title="Views by device" rows={r.views.byDevice} unit="views" />
          </div>
          <RateTable title="Leads per 100 views, by section" rows={r.views.sectionRates} />
          <RateTable title="Leads per 100 views, by page (≥ 50 views)" rows={r.views.pageRates} />
        </section>
      )}

      <section>
        <h2 className="mb-1 font-serif text-xl">Change dates</h2>
        <p className="mb-3 text-sm text-night-soft">
          Search Console:{' '}
          <a href={SC_PAGES} className="underline" target="_blank" rel="noopener noreferrer">
            Pages report
          </a>
          . Compare same 28-day windows before and after the change dates above.
        </p>
        {r.changesAvailable ? (
          <>
            <form method="post" action="/api/admin/site-changes" className="mb-3 flex flex-wrap gap-2 text-sm">
              <input type="hidden" name="action" value="add" />
              <input type="date" name="day" required className="rounded border border-night/20 px-2 py-1" />
              <input type="text" name="description" required maxLength={300} placeholder="What changed" className="min-w-[280px] flex-1 rounded border border-night/20 px-2 py-1" />
              <button type="submit" className="rounded bg-night px-3 py-1 text-white">Add</button>
            </form>
            <table className="w-full text-sm">
              <tbody>
                {r.changes.map((c) => (
                  <tr key={c.id} className="border-t border-night/10">
                    <td className="w-28 py-1.5 align-top tabular-nums">{c.day}</td>
                    <td className="py-1.5">{c.description}</td>
                    <td className="w-16 py-1.5 text-right">
                      <form method="post" action="/api/admin/site-changes">
                        <input type="hidden" name="action" value="delete" />
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-xs text-night-soft underline">Remove</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="text-sm text-night-soft">Apply migration 0011 to edit change dates.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-night/10 p-4">
      <div className="text-xs uppercase tracking-wide text-night-soft">{label}</div>
      <div className="mt-1 text-2xl tabular-nums">{value}</div>
    </div>
  );
}

function Table({ title, rows, unit = 'leads' }: { title: string; rows: Count[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-night-soft">No data in this range.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.slice(0, 25).map((r) => (
              <tr key={r.key} className="border-t border-night/10">
                <td className="max-w-[16rem] truncate py-1 pr-2" title={r.key}>{r.key}</td>
                <td className="w-1/3 py-1">
                  <div className="h-2 rounded bg-night/70" style={{ width: `${(r.count / max) * 100}%` }} />
                </td>
                <td className="w-16 py-1 text-right tabular-nums" aria-label={`${r.count} ${unit}`}>{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RateTable({ title, rows }: { title: string; rows: PageRate[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-night-soft">Not enough views yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-night-soft">
              <th className="py-1 font-normal">Page / section</th>
              <th className="py-1 text-right font-normal">Views</th>
              <th className="py-1 text-right font-normal">Leads</th>
              <th className="py-1 text-right font-normal">per 100</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 25).map((r) => (
              <tr key={r.key} className="border-t border-night/10">
                <td className="max-w-[16rem] truncate py-1 pr-2" title={r.key}>{r.key}</td>
                <td className="py-1 text-right tabular-nums">{r.views}</td>
                <td className="py-1 text-right tabular-nums">{r.leads}</td>
                <td className="py-1 text-right tabular-nums">{r.rate.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** Weekly bars (inline SVG) with change-date markers. */
function WeekChart({ data, changes }: { data: Count[]; changes: Array<{ day: string; description: string }> }) {
  if (!data.length) return <p className="text-sm text-night-soft">No weeks in this range.</p>;
  const W = 960;
  const H = 180;
  const pad = 24;
  const top = 16; // room for the tallest bar's label
  const bw = (W - pad * 2) / data.length;
  const max = Math.max(1, ...data.map((d) => d.count));
  const xOfDay = (day: string) => {
    const i = data.findIndex((w, j) => day >= w.key && (j === data.length - 1 || day < data[j + 1].key));
    if (i < 0) return null;
    const frac = (Date.parse(day) - Date.parse(data[i].key)) / (7 * 86400000);
    return pad + (i + Math.min(1, Math.max(0, frac))) * bw;
  };
  return (
    <svg viewBox={`0 ${-top} ${W} ${H + 30 + top}`} className="w-full" role="img" aria-label="Weekly totals with change-date markers">
      {data.map((d, i) => {
        const h = (d.count / max) * H;
        return (
          <g key={d.key}>
            <rect x={pad + i * bw + 2} y={H - h} width={Math.max(1, bw - 4)} height={h} fill="#14243b" opacity={0.85}>
              <title>{`Week of ${d.key}: ${d.count}`}</title>
            </rect>
            {d.count > 0 && (
              <text x={pad + i * bw + bw / 2} y={H - h - 4} textAnchor="middle" fontSize="11" fill="#14243b">
                {d.count}
              </text>
            )}
            {(i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && (
              <text x={pad + i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="#5c6675">
                {d.key.slice(5)}
              </text>
            )}
          </g>
        );
      })}
      {changes.map((c) => {
        const x = xOfDay(c.day);
        return x === null ? null : (
          <g key={`${c.day}-${c.description}`}>
            <title>{`${c.day}: ${c.description}`}</title>
            <line x1={x} x2={x} y1={-top} y2={H} stroke="#d4a72c" strokeWidth={2.5} strokeDasharray="5 3" />
            <circle cx={x} cy={-top + 4} r={4} fill="#d4a72c" />
          </g>
        );
      })}
      <line x1={pad} x2={W - pad} y1={H} y2={H} stroke="#d8d2c4" />
    </svg>
  );
}

function DayStrip({ data }: { data: Count[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-16 items-end gap-px" aria-label="Leads per day">
      {data.map((d) => (
        <div key={d.key} title={`${d.key}: ${d.count}`} className="flex-1 bg-night/70" style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 2 : 0 }} />
      ))}
    </div>
  );
}
