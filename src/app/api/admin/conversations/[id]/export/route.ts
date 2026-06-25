import { NextResponse, type NextRequest } from 'next/server';

import { getConversationDetail, type ConversationDetail } from '@/lib/admin/conversation-detail';
import { formatCairoDateTime } from '@/lib/admin/format';
import { requireAdminSession } from '@/lib/admin/guard';

/**
 * GET /api/admin/conversations/[id]/export?format=json|md — admin-only
 * transcript export (Session 10).
 *
 * Returns the full conversation, session metadata, brief, Autoura history,
 * and the message-by-message transcript. Two formats:
 *   - `json` (default) — everything as JSON for archival / analysis;
 *   - `md`             — human-readable markdown for sharing in docs / Slack.
 *
 * Gated by `requireAdminSession`. No CSRF surface — read-only GET. The
 * Content-Disposition forces a download in browsers so a clicked link from
 * the panel saves rather than navigating to raw content.
 */
export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminSession();
  if (gate instanceof NextResponse) return gate;

  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const detail = await getConversationDetail(id);
  if (!detail) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const format = req.nextUrl.searchParams.get('format') === 'md' ? 'md' : 'json';

  if (format === 'md') {
    return new NextResponse(toMarkdown(detail), {
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'content-disposition': `attachment; filename="concierge-${id}.md"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(detail, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="concierge-${id}.json"`,
    },
  });
}

function toMarkdown(d: ConversationDetail): string {
  const c = d.conversation;
  const s = d.session;
  const lines: string[] = [];
  lines.push(`# Concierge conversation`);
  lines.push('');
  lines.push(`- **ID:** \`${c.id}\``);
  lines.push(`- **Started (Cairo):** ${formatCairoDateTime(c.started_at)}`);
  lines.push(`- **Last message (Cairo):** ${formatCairoDateTime(c.last_message_at)}`);
  lines.push(`- **Language:** ${s.locale}`);
  lines.push(`- **Prompt version:** ${c.prompt_version}`);
  if (s.email) lines.push(`- **Visitor email:** ${s.email}`);
  if (c.tour_slug) lines.push(`- **Tour context:** ${c.tour_title} (\`${c.tour_slug}\`)`);
  if (s.anonymized_at) {
    lines.push(`- **Anonymized:** ${formatCairoDateTime(s.anonymized_at)}`);
  } else if (c.archived) {
    lines.push(`- **State:** archived`);
  }
  if (c.flagged) lines.push(`- **Flag:** ${c.flag_reason ?? 'flagged'}`);
  if (c.escape_hatch_used) {
    lines.push(
      `- **Escape hatch:** ${c.escape_hatch_action ?? 'used'}${
        c.escape_hatch_at ? ` (${formatCairoDateTime(c.escape_hatch_at)})` : ''
      }`,
    );
  }
  if (c.reviewed) {
    lines.push(
      `- **Reviewed:** yes${c.reviewer_rating != null ? ` · rating ${c.reviewer_rating}/5` : ''}${
        c.reviewer_notes ? ` · notes: ${c.reviewer_notes}` : ''
      }`,
    );
  }

  if (c.brief_completed && c.brief_payload) {
    lines.push('');
    lines.push(`## Brief`);
    lines.push('');
    if (c.brief_completed_at) {
      lines.push(`Completed: ${formatCairoDateTime(c.brief_completed_at)}`);
      lines.push('');
    }
    lines.push('```json');
    lines.push(JSON.stringify(c.brief_payload, null, 2));
    lines.push('```');
  }

  if (d.briefs.length > 0) {
    lines.push('');
    lines.push(`## Autoura delivery`);
    lines.push('');
    for (const b of d.briefs) {
      lines.push(
        `- Revision ${b.brief_revision ?? 1} · ${b.autoura_webhook_status ?? '—'} · attempts ${b.autoura_attempts ?? 0} · ${formatCairoDateTime(b.created_at)}${b.email_fallback_sent ? ' · email fallback sent' : ''}`,
      );
    }
  }

  lines.push('');
  lines.push(`## Transcript (${d.messages.length} messages)`);
  lines.push('');
  for (const m of d.messages) {
    const tokens = (m.token_count_input ?? 0) + (m.token_count_output ?? 0);
    const meta = [
      m.role.toUpperCase(),
      formatCairoDateTime(m.created_at),
      m.response_time_ms != null ? `${m.response_time_ms}ms` : null,
      tokens > 0 ? `${tokens}tk` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    lines.push(`### ${meta}`);
    lines.push('');
    lines.push(m.content);
    lines.push('');
  }

  return lines.join('\n');
}
