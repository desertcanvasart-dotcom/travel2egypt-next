import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/admin/auth';
import { getConversationDetail, type ConversationDetail } from '@/lib/admin/conversation-detail';
import { formatCairoDateTime } from '@/lib/admin/format';
import {
  REVIEW_NOTE_CATEGORIES,
  REVIEW_NOTE_LABELS,
  parseReviewerNotes,
  type ReviewNoteCategory,
} from '@/lib/admin/review';
import type { BriefRow, MessageRow } from '@/types/concierge-db';

export const dynamic = 'force-dynamic';

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const { id } = await params;
  const detail = await getConversationDetail(id);
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 font-sans text-night">
      <Header email={session.email} />
      <MetaStrip detail={detail} />
      <ReviewerPanel detail={detail} />
      <BriefSection detail={detail} />
      <AutouraSection briefs={detail.briefs} />
      <TranscriptSection messages={detail.messages} />
    </div>
  );
}

function Header({ email }: { email: string }) {
  return (
    <header className="mb-6 flex items-baseline justify-between border-b border-night/10 pb-4">
      <div>
        <Link href="/admin" className="text-sm text-night-soft hover:text-night">
          ← Back to list
        </Link>
        <h1 className="mt-1 font-serif text-2xl text-night">Conversation</h1>
      </div>
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

function MetaStrip({ detail }: { detail: ConversationDetail }) {
  const c = detail.conversation;
  const s = detail.session;
  const items: Array<{ label: string; value: React.ReactNode }> = [
    { label: 'Started', value: formatCairoDateTime(c.started_at) },
    { label: 'Last message', value: formatCairoDateTime(c.last_message_at) },
    { label: 'Language', value: <span className="uppercase">{s.locale || '—'}</span> },
    { label: 'Prompt', value: c.prompt_version },
    { label: 'Email', value: s.email ?? <span className="text-night-soft">—</span> },
    {
      label: 'Session ref',
      value: <code className="font-mono text-xs">{s.cookie_id.slice(0, 8)}</code>,
    },
    {
      label: 'IP hash',
      value: s.ip_hash ? (
        <code className="font-mono text-xs">{s.ip_hash.slice(0, 12)}…</code>
      ) : (
        <span className="text-night-soft">—</span>
      ),
    },
    {
      label: 'State',
      value: s.anonymized_at ? (
        <span className="text-orange">Anonymized {formatCairoDateTime(s.anonymized_at)}</span>
      ) : c.archived ? (
        <span className="text-night-soft">Archived</span>
      ) : (
        <span>Live</span>
      ),
    },
  ];
  if (c.tour_slug) {
    items.push({
      label: 'Tour context',
      value: (
        <span>
          {c.tour_title} <code className="ml-1 text-xs text-night-soft">{c.tour_slug}</code>
        </span>
      ),
    });
  }
  if (c.escape_hatch_used) {
    items.push({
      label: 'Escape hatch',
      value: (
        <span className="text-orange">
          {c.escape_hatch_action ?? 'used'}{' '}
          {c.escape_hatch_at ? `· ${formatCairoDateTime(c.escape_hatch_at)}` : ''}
        </span>
      ),
    });
  }
  if (c.flagged) {
    items.push({
      label: 'Flag',
      value: <span className="text-orange">{c.flag_reason?.replaceAll('_', ' ') ?? 'flagged'}</span>,
    });
  }

  return (
    <section className="mb-6 grid grid-cols-2 gap-3 rounded border border-night/10 bg-paper p-4 md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label}>
          <div className="text-xs uppercase tracking-wider text-night-soft">{it.label}</div>
          <div className="mt-1 text-sm">{it.value}</div>
        </div>
      ))}
    </section>
  );
}

function ReviewerPanel({ detail }: { detail: ConversationDetail }) {
  const c = detail.conversation;
  const currentNotes = parseReviewerNotes(c.reviewer_notes);
  const currentNoteSet = new Set<ReviewNoteCategory>(currentNotes);

  return (
    <section className="mb-6 rounded border border-night/10 bg-paper p-4">
      <h2 className="mb-3 font-serif text-lg">Reviewer</h2>
      <form
        method="post"
        action={`/api/admin/conversations/${c.id}/review`}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <fieldset className="md:col-span-1">
          <legend className="mb-2 text-sm text-night-soft">Rating (1–5)</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex flex-col items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  defaultChecked={c.reviewer_rating === n}
                />
                <span>{n}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="md:col-span-2">
          <legend className="mb-2 text-sm text-night-soft">
            Categories (problems / observations)
          </legend>
          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
            {REVIEW_NOTE_CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="noteCategories"
                  value={cat}
                  defaultChecked={currentNoteSet.has(cat)}
                />
                <span>{REVIEW_NOTE_LABELS[cat]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="md:col-span-3 flex items-center justify-between border-t border-night/10 pt-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="markReviewed"
              value="true"
              defaultChecked={c.reviewed === true}
            />
            <span>Mark reviewed</span>
          </label>
          <button
            type="submit"
            className="rounded bg-night px-4 py-2 text-sm text-paper hover:bg-night/85"
          >
            Save review
          </button>
        </div>
      </form>
    </section>
  );
}

function BriefSection({ detail }: { detail: ConversationDetail }) {
  const c = detail.conversation;
  if (!c.brief_completed && !c.brief_payload) {
    return (
      <section className="mb-6 rounded border border-night/10 bg-paper p-4">
        <h2 className="mb-2 font-serif text-lg">Brief</h2>
        <p className="text-sm text-night-soft">Brief not completed.</p>
      </section>
    );
  }
  return (
    <section className="mb-6 rounded border border-night/10 bg-paper p-4">
      <h2 className="mb-2 font-serif text-lg">
        Brief{' '}
        {c.brief_completed_at && (
          <span className="ml-2 text-sm text-night-soft">
            · completed {formatCairoDateTime(c.brief_completed_at)}
          </span>
        )}
      </h2>
      <pre className="overflow-x-auto rounded bg-night/5 p-3 text-xs">
        {JSON.stringify(c.brief_payload, null, 2)}
      </pre>
    </section>
  );
}

function AutouraSection({ briefs }: { briefs: BriefRow[] }) {
  if (briefs.length === 0) {
    return (
      <section className="mb-6 rounded border border-night/10 bg-paper p-4">
        <h2 className="mb-2 font-serif text-lg">Autoura delivery</h2>
        <p className="text-sm text-night-soft">No brief sent yet.</p>
      </section>
    );
  }
  return (
    <section className="mb-6 rounded border border-night/10 bg-paper p-4">
      <h2 className="mb-2 font-serif text-lg">Autoura delivery</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-night-soft">
            <tr>
              <th className="py-2 pr-3">Revision</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Attempts</th>
              <th className="py-2 pr-3">Email fallback</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2 pr-3">Response</th>
            </tr>
          </thead>
          <tbody>
            {briefs.map((b) => (
              <tr key={b.id} className="border-t border-night/10 align-top">
                <td className="py-2 pr-3 tabular-nums">{b.brief_revision ?? 1}</td>
                <td className="py-2 pr-3">
                  <StatusBadge status={b.autoura_webhook_status} />
                </td>
                <td className="py-2 pr-3 tabular-nums">{b.autoura_attempts ?? 0}</td>
                <td className="py-2 pr-3">
                  {b.email_fallback_sent ? 'sent' : <span className="text-night-soft">—</span>}
                </td>
                <td className="py-2 pr-3 text-xs">{formatCairoDateTime(b.created_at)}</td>
                <td className="py-2 pr-3">
                  {b.autoura_webhook_response ? (
                    <details>
                      <summary className="cursor-pointer text-xs text-night-soft">
                        view
                      </summary>
                      <pre className="mt-1 overflow-x-auto rounded bg-night/5 p-2 text-xs">
                        {JSON.stringify(b.autoura_webhook_response, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-night-soft">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({
  status,
}: {
  status: 'pending' | 'sent' | 'failed' | 'retried' | null;
}) {
  const tone =
    status === 'sent'
      ? 'bg-faience/10 text-faience'
      : status === 'failed'
        ? 'bg-orange/10 text-orange'
        : 'bg-night/5 text-night-soft';
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs ${tone}`}>{status ?? '—'}</span>
  );
}

function TranscriptSection({ messages }: { messages: MessageRow[] }) {
  return (
    <section className="mb-6 rounded border border-night/10 bg-paper p-4">
      <h2 className="mb-3 font-serif text-lg">
        Transcript <span className="ml-2 text-sm text-night-soft">· {messages.length} messages</span>
      </h2>
      {messages.length === 0 ? (
        <p className="text-sm text-night-soft">No messages.</p>
      ) : (
        <ol className="space-y-3">
          {messages.map((m) => (
            <MessageItem key={m.id} message={m} />
          ))}
        </ol>
      )}
    </section>
  );
}

function MessageItem({ message }: { message: MessageRow }) {
  const tone =
    message.role === 'user'
      ? 'border-faience/30 bg-faience/5'
      : message.role === 'assistant'
        ? 'border-night/10 bg-night/[0.02]'
        : 'border-orange/30 bg-orange/5';

  const tokenTotal = (message.token_count_input ?? 0) + (message.token_count_output ?? 0);

  return (
    <li className={`rounded border ${tone} p-3`}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-night-soft">
        <div>
          <span className="font-medium uppercase text-night">{message.role}</span>
          <span className="ml-2">{formatCairoDateTime(message.created_at)}</span>
        </div>
        <div className="flex gap-3 tabular-nums">
          {message.response_time_ms != null ? <span>{message.response_time_ms}ms</span> : null}
          {tokenTotal > 0 ? <span>{tokenTotal} tokens</span> : null}
          {message.model_version ? <span>{message.model_version}</span> : null}
        </div>
      </div>
      <pre className="whitespace-pre-wrap break-words font-sans text-sm">{message.content}</pre>
    </li>
  );
}
