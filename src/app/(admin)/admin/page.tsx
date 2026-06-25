import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/admin/auth';
import {
  getDailyStats,
  listConversations,
  searchConversations,
  type ConversationListRow,
  type DailyStats,
} from '@/lib/admin/conversations';
import {
  FLAG_REASONS,
  PAGE_SIZE,
  encodeFilters,
  parseFilters,
  type ListFilters,
} from '@/lib/admin/filters';
import { formatCairoDateTime } from '@/lib/admin/format';

export const dynamic = 'force-dynamic';

type RawSearchParams = { [k: string]: string | string[] | undefined };

function toUrlParams(sp: RawSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') out.set(k, v);
  }
  return out;
}

export default async function AdminLanding({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const sp = await searchParams;
  const filters = parseFilters(toUrlParams(sp));

  const searchMode = filters.q !== null;
  const [list, stats] = await Promise.all([
    searchMode ? searchConversations(filters.q ?? '') : listConversations(filters),
    getDailyStats(),
  ]);
  const totalPages = searchMode ? 1 : Math.max(1, Math.ceil(list.total / PAGE_SIZE));
  const searchCapped = searchMode && 'capped' in list && (list as { capped: boolean }).capped;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans text-night">
      <Header email={session.email} />
      <StatsStrip stats={stats} />
      <SearchBar q={filters.q ?? ''} />
      {!searchMode && <FilterBar filters={filters} />}
      <ResultsTable rows={list.rows} total={list.total} searchMode={searchMode} searchCapped={searchCapped} q={filters.q} />
      {!searchMode && <Pagination filters={filters} totalPages={totalPages} />}
    </div>
  );
}

function SearchBar({ q }: { q: string }) {
  return (
    <form
      method="get"
      action="/admin"
      className="mb-4 flex items-center gap-2 rounded border border-night/10 bg-paper p-3"
    >
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search transcript content…"
        className="flex-1 rounded border border-night/15 px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        className="rounded bg-night px-4 py-1.5 text-sm text-paper hover:bg-night/85"
      >
        Search
      </button>
      {q ? (
        <Link
          href="/admin"
          className="rounded border border-night/20 px-4 py-1.5 text-sm text-night-soft hover:bg-night/5"
        >
          Clear
        </Link>
      ) : null}
    </form>
  );
}

function Header({ email }: { email: string }) {
  return (
    <header className="mb-6 flex items-baseline justify-between border-b border-night/10 pb-4">
      <h1 className="font-serif text-2xl text-night">Concierge Admin</h1>
      <form
        method="post"
        action="/api/admin/auth/logout"
        className="flex items-center gap-3 text-sm text-night-soft"
      >
        <span>{email}</span>
        <button
          type="submit"
          className="rounded border border-night/20 px-3 py-1 hover:bg-night/5"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}

function StatsStrip({ stats }: { stats: DailyStats }) {
  const items: Array<{ label: string; value: string }> = [
    { label: 'Conversations today', value: String(stats.conversationsToday) },
    { label: 'Briefs today', value: String(stats.briefsToday) },
    { label: 'Flagged today', value: String(stats.flaggedToday) },
    {
      label: `Avg rating · ${stats.ratingsCount} rated`,
      value: stats.avgRating != null ? stats.avgRating.toFixed(2) : '—',
    },
  ];
  return (
    <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded border border-night/10 bg-paper px-4 py-3"
        >
          <div className="text-xs uppercase tracking-wider text-night-soft">{it.label}</div>
          <div className="mt-1 font-serif text-2xl">{it.value}</div>
        </div>
      ))}
    </section>
  );
}

function FilterBar({ filters }: { filters: ListFilters }) {
  // GET form: any change → URL params → server re-render. No client JS.
  return (
    <form
      method="get"
      action="/admin"
      className="mb-6 grid grid-cols-1 gap-3 rounded border border-night/10 bg-paper p-4 md:grid-cols-4"
    >
      <label className="block text-sm">
        <span className="text-night-soft">From</span>
        <input
          type="date"
          name="from"
          defaultValue={filters.from ?? ''}
          className="mt-1 w-full rounded border border-night/15 px-2 py-1"
        />
      </label>
      <label className="block text-sm">
        <span className="text-night-soft">To</span>
        <input
          type="date"
          name="to"
          defaultValue={filters.to ?? ''}
          className="mt-1 w-full rounded border border-night/15 px-2 py-1"
        />
      </label>
      <label className="block text-sm">
        <span className="text-night-soft">Language</span>
        <select
          name="locale"
          defaultValue={filters.locale ?? ''}
          className="mt-1 w-full rounded border border-night/15 px-2 py-1"
        >
          <option value="">Any</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="ja">Japanese</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-night-soft">Brief completed</span>
        <select
          name="briefCompleted"
          defaultValue={filters.briefCompleted === null ? '' : String(filters.briefCompleted)}
          className="mt-1 w-full rounded border border-night/15 px-2 py-1"
        >
          <option value="">Any</option>
          <option value="true">Completed</option>
          <option value="false">Not completed</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-night-soft">Flagged</span>
        <select
          name="flagged"
          defaultValue={filters.flagged === null ? '' : String(filters.flagged)}
          className="mt-1 w-full rounded border border-night/15 px-2 py-1"
        >
          <option value="">Any</option>
          <option value="true">Flagged</option>
          <option value="false">Not flagged</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-night-soft">Flag reason</span>
        <select
          name="flagReason"
          defaultValue={filters.flagReason ?? ''}
          className="mt-1 w-full rounded border border-night/15 px-2 py-1"
        >
          <option value="">Any</option>
          {FLAG_REASONS.map((r) => (
            <option key={r} value={r}>
              {r.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-night-soft">Reviewed</span>
        <select
          name="reviewed"
          defaultValue={filters.reviewed === null ? '' : String(filters.reviewed)}
          className="mt-1 w-full rounded border border-night/15 px-2 py-1"
        >
          <option value="">Any</option>
          <option value="true">Reviewed</option>
          <option value="false">Not reviewed</option>
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded bg-night px-4 py-2 text-sm text-paper hover:bg-night/85"
        >
          Apply
        </button>
        <Link
          href="/admin"
          className="rounded border border-night/20 px-4 py-2 text-sm text-night-soft hover:bg-night/5"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}

function ResultsTable({
  rows,
  total,
  searchMode,
  searchCapped,
  q,
}: {
  rows: ConversationListRow[];
  total: number;
  searchMode: boolean;
  searchCapped: boolean;
  q: string | null;
}) {
  const countLabel = searchMode
    ? `${searchCapped ? '≥' : ''}${total} match${total === 1 ? '' : 'es'} for "${q}"`
    : `${total} conversation${total === 1 ? '' : 's'}`;
  return (
    <section className="mb-4">
      <div className="mb-2 text-sm text-night-soft">{countLabel}</div>
      {rows.length === 0 ? (
        <div className="rounded border border-dashed border-night/15 py-12 text-center text-night-soft">
          {searchMode ? 'No matches.' : 'No conversations match.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-night/10">
          <table className="min-w-full text-sm">
            <thead className="bg-night/5 text-left text-xs uppercase tracking-wider text-night-soft">
              <tr>
                <th className="px-3 py-2">Started (Cairo)</th>
                <th className="px-3 py-2">Lang</th>
                <th className="px-3 py-2">Msgs</th>
                <th className="px-3 py-2">Tokens</th>
                <th className="px-3 py-2">Brief</th>
                <th className="px-3 py-2">Flags</th>
                <th className="px-3 py-2">Reviewed</th>
                <th className="px-3 py-2">State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <ConversationRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ConversationRow({ row }: { row: ConversationListRow }) {
  return (
    <tr className="border-t border-night/10">
      <td className="px-3 py-2">
        <Link
          href={`/admin/conversations/${row.id}`}
          className="text-night underline-offset-2 hover:underline"
        >
          {formatCairoDateTime(row.started_at)}
        </Link>
      </td>
      <td className="px-3 py-2 uppercase">{row.locale || '—'}</td>
      <td className="px-3 py-2 tabular-nums">{row.msg_count}</td>
      <td className="px-3 py-2 tabular-nums">{row.total_tokens.toLocaleString()}</td>
      <td className="px-3 py-2">
        {row.brief_completed ? <Badge tone="positive">Complete</Badge> : <span className="text-night-soft">—</span>}
      </td>
      <td className="px-3 py-2">
        {row.flagged ? (
          <Badge tone="warning">{row.flag_reason?.replaceAll('_', ' ') ?? 'flagged'}</Badge>
        ) : (
          <span className="text-night-soft">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {row.reviewed ? (
          <Badge tone="neutral">
            {row.reviewer_rating != null ? `★ ${row.reviewer_rating}` : 'Reviewed'}
          </Badge>
        ) : (
          <span className="text-night-soft">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {row.anonymized_at ? (
          <Badge tone="muted">Anonymized {formatCairoDateTime(row.anonymized_at)}</Badge>
        ) : row.archived ? (
          <Badge tone="muted">Archived</Badge>
        ) : (
          <span className="text-night-soft">Live</span>
        )}
      </td>
    </tr>
  );
}

function Badge({ tone, children }: { tone: 'positive' | 'warning' | 'neutral' | 'muted'; children: React.ReactNode }) {
  const tones: Record<typeof tone, string> = {
    positive: 'bg-faience/10 text-faience',
    warning: 'bg-orange/10 text-orange',
    neutral: 'bg-night/5 text-night',
    muted: 'bg-night/5 text-night-soft',
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>
  );
}

function Pagination({ filters, totalPages }: { filters: ListFilters; totalPages: number }) {
  if (totalPages <= 1) return null;
  const prev = filters.page > 1 ? filters.page - 1 : null;
  const next = filters.page < totalPages ? filters.page + 1 : null;

  const linkFor = (page: number) => {
    const sp = encodeFilters({ ...filters, page });
    const qs = sp.toString();
    return `/admin${qs ? `?${qs}` : ''}`;
  };

  return (
    <nav className="flex items-center justify-between text-sm text-night-soft" aria-label="Pagination">
      <div>
        Page {filters.page} of {totalPages}
      </div>
      <div className="flex gap-2">
        {prev ? (
          <Link href={linkFor(prev)} className="rounded border border-night/20 px-3 py-1 hover:bg-night/5">
            ← Prev
          </Link>
        ) : (
          <span className="rounded border border-night/10 px-3 py-1 text-night-soft/50">← Prev</span>
        )}
        {next ? (
          <Link href={linkFor(next)} className="rounded border border-night/20 px-3 py-1 hover:bg-night/5">
            Next →
          </Link>
        ) : (
          <span className="rounded border border-night/10 px-3 py-1 text-night-soft/50">Next →</span>
        )}
      </div>
    </nav>
  );
}
