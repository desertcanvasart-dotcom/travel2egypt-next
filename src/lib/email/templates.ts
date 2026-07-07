/**
 * Resume email templates (Session 4). Plain branded HTML — cream surface,
 * serif heading, faience button — no @react-email for v1. EN + ES.
 */
import type { AutouraBriefPayload } from '@/lib/concierge/autoura/types';
import { PRODUCTION_URL } from '@/lib/site';

/**
 * Admin reviewer-panel URL for a given conversation (Session 10). All
 * team-facing emails embed this so reviewers can jump straight from the
 * inbox into the panel. Always points at production — the team accesses the
 * admin from prod, never from a preview host.
 */
function adminConversationUrl(conversationId: string): string {
  return `${PRODUCTION_URL}/admin/conversations/${conversationId}`;
}

interface ResumeEmailContent {
  subject: string;
  html: string;
  text: string;
}

const BRAND = {
  paper: '#faf6f0',
  surface: '#ffffff',
  ink: '#14243b',
  inkSoft: '#5c6675',
  accent: '#1b4965',
  line: '#e7e0d5',
};

function shell(headingHtml: string, bodyHtml: string, buttonLabel: string, url: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${BRAND.paper};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${BRAND.surface};border:1px solid ${BRAND.line};">
        <tr><td style="padding:32px 32px 24px;">
          <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.accent};">Travel2Egypt</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;line-height:1.25;color:${BRAND.ink};">${headingHtml}</h1>
          ${bodyHtml}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr>
            <td style="background:${BRAND.accent};">
              <a href="${url}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#ffffff;text-decoration:none;">${buttonLabel}</a>
            </td>
          </tr></table>
          <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.inkSoft};word-break:break-all;">${url}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

interface TeamHandoffParams {
  sessionRef: string;
  conversationId: string;
  visitorEmail: string | null;
  locale: string;
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function languageLabel(locale: string): string {
  return locale === 'es' ? 'Spanish (es)' : 'English (en)';
}

/**
 * Team-facing handoff notification (Session 5, "Wait for the team" / forward).
 * Internal email — plainer than the visitor resume mail. Reply-To is set to
 * the VISITOR's email by the sender so the team replies straight to the
 * traveler (corrects the brief's "Reply-To → team Gmail" for team-facing
 * mail). Includes the conversation language so the team replies in the right
 * one without scanning the transcript.
 */
export function teamHandoffEmail(p: TeamHandoffParams): { subject: string; html: string; text: string } {
  const subject = `[Concierge — Human Help Requested] — ${p.sessionRef}`;

  const metaRows: Array<[string, string]> = [
    ['Visitor email', p.visitorEmail ?? '(not provided)'],
    ['Language', languageLabel(p.locale)],
    ['Session reference', p.sessionRef],
    ['Conversation ID', p.conversationId],
    ['Flag reason', 'escape_hatch_used'],
    ['Admin link', adminConversationUrl(p.conversationId)],
  ];

  const transcriptLines = p.transcript.map(
    (m) => `${m.role === 'assistant' ? 'Concierge' : 'Visitor'}: ${m.content}`,
  );

  const html = `<!doctype html><html><body style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#14243b;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="font-size:18px;margin:0 0 4px;">A visitor asked to speak with the team</h2>
    <p style="font-size:13px;color:#5c6675;margin:0 0 16px;">Sent from the AI concierge on travel2egypt.org. Reply to this email to reach the visitor directly.</p>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      ${metaRows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:3px 16px 3px 0;color:#5c6675;">${k}</td><td style="padding:3px 0;"><strong>${esc(v)}</strong></td></tr>`,
        )
        .join('')}
    </table>
    <h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Conversation transcript</h3>
    <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${transcriptLines.map(esc).join('\n\n')}</div>
  </div>
</body></html>`;

  const text = [
    'A visitor asked to speak with the team (AI concierge, travel2egypt.org).',
    'Reply to this email to reach the visitor directly.',
    '',
    ...metaRows.map(([k, v]) => `${k}: ${v}`),
    '',
    '--- Transcript ---',
    '',
    ...transcriptLines,
  ].join('\n');

  return { subject, html, text };
}

interface HostileAlertParams {
  sessionRef: string;
  conversationId: string;
  locale: string;
  /** The flagged user message (escaped before display). */
  message: string;
}

/**
 * Hostile-content alert (Session 7) — internal, real-time. Goes to
 * TEAM_INBOX_EMAIL with a distinct subject prefix for Gmail filtering. Not a
 * handoff: there is no visitor reply expected, so no Reply-To. Prompt-injection
 * is NOT alerted here (daily review only) — only `hostile_language`.
 */
export function hostileContentAlert(p: HostileAlertParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Concierge — Hostile Content Flagged] — ${p.sessionRef}`;
  const metaRows: Array<[string, string]> = [
    ['Flag reason', 'hostile_language'],
    ['Language', languageLabel(p.locale)],
    ['Session reference', p.sessionRef],
    ['Conversation ID', p.conversationId],
    ['Admin link', adminConversationUrl(p.conversationId)],
  ];

  const html = `<!doctype html><html><body style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#14243b;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="font-size:18px;margin:0 0 4px;">Hostile content flagged in a concierge conversation</h2>
    <p style="font-size:13px;color:#5c6675;margin:0 0 16px;">Automatic flag from the AI concierge on travel2egypt.org. No action may be needed — the assistant handles the reply; this is for review.</p>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      ${metaRows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:3px 16px 3px 0;color:#5c6675;">${k}</td><td style="padding:3px 0;"><strong>${esc(v)}</strong></td></tr>`,
        )
        .join('')}
    </table>
    <h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Flagged message</h3>
    <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${esc(p.message)}</div>
  </div>
</body></html>`;

  const text = [
    'Hostile content flagged in a concierge conversation (travel2egypt.org).',
    'For review — the assistant handles the reply.',
    '',
    ...metaRows.map(([k, v]) => `${k}: ${v}`),
    '',
    '--- Flagged message ---',
    '',
    p.message,
  ].join('\n');

  return { subject, html, text };
}

interface BriefFallbackParams {
  sessionRef: string;
  payload: AutouraBriefPayload;
}

/**
 * Autoura email FALLBACK (Session 9) — the full brief + transcript when the
 * webhook could not be delivered (retries exhausted or config missing). This is
 * a FULLY HONORED delivery, not a degraded one: the team gets everything they
 * need to act, in the inbox they already work. Reply-To is set by the sender to
 * the VISITOR's email (S5 lesson) so a team member replies straight to the
 * traveler. Distinct subject prefix for Gmail filtering.
 */
export function briefFallbackEmail(p: BriefFallbackParams): { subject: string; html: string; text: string } {
  const pl = p.payload;
  const v = pl.visitor;
  const t = pl.trip;
  const pref = pl.preferences;
  const subject = `[Concierge — Brief (email fallback)] — ${p.sessionRef}`;

  const metaRows: Array<[string, string]> = [
    ['Visitor', v.name ?? '(no name)'],
    ['Email', v.email ?? '(not provided)'],
    ['Phone', v.phone ?? '(not provided)'],
    ['Preferred contact', v.preferred_contact ?? '—'],
    ['Language', languageLabel(pl.language)],
    ['Travelers', t.travelers_count != null ? String(t.travelers_count) : (t.travelers_detail ?? '—')],
    ['Dates', t.dates_specific ?? t.dates_window ?? '—'],
    ['Trip length (days)', t.trip_length_days != null ? String(t.trip_length_days) : '—'],
    ['Destinations', pref.destinations.length ? pref.destinations.join(', ') : '—'],
    ['Comfort level', pref.comfort_level ?? '—'],
    ['Origin / nationality', [t.origin_city, t.nationality].filter(Boolean).join(' / ') || '—'],
    ['Follow-up commitment', pl.follow_up_window?.cairo_time_label ?? '—'],
    ['Conversation ID', pl.conversation_id],
    ['Brief revision', `${pl.brief_revision}${pl.is_update ? ' (update)' : ''}`],
    ['Admin link', adminConversationUrl(pl.conversation_id)],
  ];

  const transcriptLines = pl.full_transcript.map(
    (m) => `${m.role === 'assistant' ? 'Concierge' : 'Visitor'}: ${m.content}`,
  );

  const html = `<!doctype html><html><body style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#14243b;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="font-size:18px;margin:0 0 4px;">A completed planning brief (delivered by email)</h2>
    <p style="font-size:13px;color:#5c6675;margin:0 0 16px;">The AI concierge could not reach Autoura, so the full brief is below. Reply to this email to reach the visitor directly.</p>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      ${metaRows
        .map(
          ([k, val]) =>
            `<tr><td style="padding:3px 16px 3px 0;color:#5c6675;vertical-align:top;">${k}</td><td style="padding:3px 0;"><strong>${esc(val)}</strong></td></tr>`,
        )
        .join('')}
    </table>
    ${
      pl.brief_summary
        ? `<h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Brief summary</h3>
    <div style="font-size:14px;line-height:1.6;margin-bottom:16px;">${esc(pl.brief_summary)}</div>`
        : ''
    }
    <h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Conversation transcript</h3>
    <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${transcriptLines.map(esc).join('\n\n')}</div>
  </div>
</body></html>`;

  const text = [
    'A completed planning brief from the AI concierge (delivered by email — Autoura was unreachable).',
    'Reply to this email to reach the visitor directly.',
    '',
    ...metaRows.map(([k, val]) => `${k}: ${val}`),
    ...(pl.brief_summary ? ['', '--- Brief summary ---', '', pl.brief_summary] : []),
    '',
    '--- Transcript ---',
    '',
    ...transcriptLines,
  ].join('\n');

  return { subject, html, text };
}

export interface AutouraFailureAlertParams {
  sessionRef: string;
  conversationId: string;
  briefRevision: number;
  attempts: number;
  /** 'delivery_failed' (retries exhausted) | 'config_missing' (no URL/secret). */
  reason: string;
  visitorEmail: string | null;
  /** Whether the full-brief fallback email was sent to the team inbox. */
  fallbackEmailed: boolean;
}

/**
 * Autoura delivery FAILURE alert (Session 9) — internal ops signal that the
 * webhook gave up. Goes to TEAM_INBOX_EMAIL + (optional) ALERT_EMAIL (Islam
 * direct). No Reply-To — no visitor reply is expected; this is "go look at the
 * endpoint." The brief itself is NOT in here (the fallback email carries it);
 * this is the distinct, greppable "something broke" prefix.
 */
export function autouraFailureAlertEmail(p: AutouraFailureAlertParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Concierge — Autoura Delivery Failed] — ${p.sessionRef}`;
  const metaRows: Array<[string, string]> = [
    ['Reason', p.reason],
    ['Attempts', String(p.attempts)],
    ['Conversation ID', p.conversationId],
    ['Brief revision', String(p.briefRevision)],
    ['Visitor email', p.visitorEmail ?? '(not provided)'],
    ['Full brief emailed to team', p.fallbackEmailed ? 'yes — see "[Concierge — Brief (email fallback)]"' : 'NO'],
    ['Admin link', adminConversationUrl(p.conversationId)],
  ];

  const html = `<!doctype html><html><body style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#14243b;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="font-size:18px;margin:0 0 4px;">Autoura webhook delivery failed</h2>
    <p style="font-size:13px;color:#5c6675;margin:0 0 16px;">A completed brief could not be delivered to Autoura after retries. The traveler is already served — the full brief went to the team inbox by email. Investigate the Autoura endpoint.</p>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      ${metaRows
        .map(
          ([k, val]) =>
            `<tr><td style="padding:3px 16px 3px 0;color:#5c6675;">${k}</td><td style="padding:3px 0;"><strong>${esc(val)}</strong></td></tr>`,
        )
        .join('')}
    </table>
  </div>
</body></html>`;

  const text = [
    'Autoura webhook delivery failed for a completed brief (travel2egypt.org concierge).',
    'The traveler is served — the full brief went to the team inbox by email. Investigate the endpoint.',
    '',
    ...metaRows.map(([k, val]) => `${k}: ${val}`),
  ].join('\n');

  return { subject, html, text };
}

export interface DigestEmailParams {
  windowStart: string; // ISO; the email formats it locally
  windowEnd: string;
  totals: { conversations: number; briefsCompleted: number; flagged: number };
  briefsCompleted: Array<{
    id: string;
    email: string | null;
    locale: string;
    brief_completed_at: string;
  }>;
  flaggedByReason: Record<
    string,
    Array<{ id: string; email: string | null; locale: string; started_at: string }>
  >;
  topResponseTimes: Array<{ conversation_id: string; response_time_ms: number; created_at: string }>;
  tokenSummary: { inputTokens: number; outputTokens: number; messageCount: number };
  /** Layer 3 — null until migration 0008 is applied (sections then say so). */
  qualityScores: {
    count: number;
    avgPacing: number;
    avgGrounding: number;
    avgTone: number;
    worstNote: string | null;
  } | null;
  cacheHit: { rate: number; turnsMeasured: number; alert: boolean } | null;
}

/**
 * Daily digest email (Session 10) — sent to TEAM_INBOX_EMAIL by Railway cron
 * at 08:00 Cairo. Plain HTML + plain text. Covers the previous Cairo day.
 * Lists are capped (50 briefs / 100 flagged) — overflow links to the admin
 * filter URL for full review.
 */
export function digestEmail(p: DigestEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });

  const dayLabel = fmtDate(p.windowStart);
  const subject = `[Concierge — Daily digest] ${dayLabel}`;

  const totalsHtml = `
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr><td style="padding:3px 16px 3px 0;color:#5c6675;">Conversations</td><td style="padding:3px 0;"><strong>${p.totals.conversations}</strong></td></tr>
      <tr><td style="padding:3px 16px 3px 0;color:#5c6675;">Briefs completed</td><td style="padding:3px 0;"><strong>${p.totals.briefsCompleted}</strong></td></tr>
      <tr><td style="padding:3px 16px 3px 0;color:#5c6675;">Flagged</td><td style="padding:3px 0;"><strong>${p.totals.flagged}</strong></td></tr>
    </table>`;

  const briefListHtml = p.briefsCompleted.length
    ? `<ul style="font-size:14px;line-height:1.7;margin:0 0 16px;padding-left:20px;">
        ${p.briefsCompleted
          .map(
            (b) =>
              `<li><a href="${adminConversationUrl(b.id)}" style="color:#1b4965;">${esc(b.email ?? '(no email)')}</a> · ${esc(b.locale.toUpperCase())} · ${esc(new Date(b.brief_completed_at).toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' }))}</li>`,
          )
          .join('')}
      </ul>`
    : '<p style="font-size:14px;color:#5c6675;margin:0 0 16px;">No briefs completed.</p>';

  const flaggedSections = Object.entries(p.flaggedByReason)
    .map(
      ([reason, items]) =>
        `<h4 style="font-size:13px;margin:12px 0 4px;color:#14243b;">${esc(reason.replaceAll('_', ' '))} · ${items.length}</h4>
         <ul style="font-size:14px;line-height:1.7;margin:0 0 8px;padding-left:20px;">
          ${items
            .map(
              (it) =>
                `<li><a href="${adminConversationUrl(it.id)}" style="color:#1b4965;">${esc(it.email ?? '(no email)')}</a> · ${esc(it.locale.toUpperCase())} · ${esc(new Date(it.started_at).toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' }))}</li>`,
            )
            .join('')}
         </ul>`,
    )
    .join('');
  const flaggedHtml = flaggedSections
    ? flaggedSections
    : '<p style="font-size:14px;color:#5c6675;margin:0 0 16px;">No flagged needing review.</p>';

  const topRtHtml = p.topResponseTimes.length
    ? `<ul style="font-size:14px;line-height:1.7;margin:0 0 16px;padding-left:20px;">
        ${p.topResponseTimes
          .map(
            (r) =>
              `<li><a href="${adminConversationUrl(r.conversation_id)}" style="color:#1b4965;">${r.response_time_ms.toLocaleString()}ms</a> · ${esc(new Date(r.created_at).toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' }))}</li>`,
          )
          .join('')}
      </ul>`
    : '<p style="font-size:14px;color:#5c6675;margin:0 0 16px;">No data.</p>';

  const tokensHtml = `
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr><td style="padding:3px 16px 3px 0;color:#5c6675;">Input tokens</td><td style="padding:3px 0;"><strong>${p.tokenSummary.inputTokens.toLocaleString()}</strong></td></tr>
      <tr><td style="padding:3px 16px 3px 0;color:#5c6675;">Output tokens</td><td style="padding:3px 0;"><strong>${p.tokenSummary.outputTokens.toLocaleString()}</strong></td></tr>
      <tr><td style="padding:3px 16px 3px 0;color:#5c6675;">Messages</td><td style="padding:3px 0;"><strong>${p.tokenSummary.messageCount.toLocaleString()}</strong></td></tr>
    </table>`;

  const qualityHtml = !p.qualityScores
    ? '<p style="font-size:14px;color:#5c6675;margin:0 0 16px;">Telemetry not enabled yet (migration 0008).</p>'
    : p.qualityScores.count === 0
      ? '<p style="font-size:14px;color:#5c6675;margin:0 0 16px;">No conversations sampled for this window.</p>'
      : `<table style="border-collapse:collapse;font-size:14px;margin-bottom:8px;">
          <tr><td style="padding:3px 16px 3px 0;color:#5c6675;">Sampled</td><td style="padding:3px 0;"><strong>${p.qualityScores.count}</strong></td></tr>
          <tr><td style="padding:3px 16px 3px 0;color:#5c6675;">Pacing</td><td style="padding:3px 0;"><strong>${p.qualityScores.avgPacing}</strong> / 5</td></tr>
          <tr><td style="padding:3px 16px 3px 0;color:#5c6675;">Grounding</td><td style="padding:3px 0;"><strong>${p.qualityScores.avgGrounding}</strong> / 5</td></tr>
          <tr><td style="padding:3px 16px 3px 0;color:#5c6675;">Tone</td><td style="padding:3px 0;"><strong>${p.qualityScores.avgTone}</strong> / 5</td></tr>
        </table>${
          p.qualityScores.worstNote
            ? `<p style="font-size:13px;color:#5c6675;margin:0 0 16px;">Lowest-scored note: ${esc(p.qualityScores.worstNote)}</p>`
            : ''
        }`;

  const cacheHtml = !p.cacheHit
    ? '<p style="font-size:14px;color:#5c6675;margin:0 0 16px;">Telemetry not enabled yet (migration 0008).</p>'
    : `<p style="font-size:14px;margin:0 0 16px;">
        Hit rate <strong>${(p.cacheHit.rate * 100).toFixed(1)}%</strong> across ${p.cacheHit.turnsMeasured} turns.${
          p.cacheHit.alert
            ? ' <strong style="color:#b3261e;">⚠ Below 50% — the cached v4.1 prefix may be invalidated (cost/latency spike). Check the deploy diff and usage logs.</strong>'
            : ''
        }
      </p>`;

  const html = `<!doctype html><html><body style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#14243b;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="font-size:18px;margin:0 0 4px;">Concierge digest — ${dayLabel}</h2>
    <p style="font-size:13px;color:#5c6675;margin:0 0 16px;">Previous Cairo day. Click any item to open it in the admin panel.</p>
    <h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Totals</h3>
    ${totalsHtml}
    <h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Briefs completed (${p.briefsCompleted.length})</h3>
    ${briefListHtml}
    <h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Flagged · needs review</h3>
    ${flaggedHtml}
    <h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Top response times</h3>
    ${topRtHtml}
    <h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Token use</h3>
    ${tokensHtml}
    <h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Quality sample (LLM judge)</h3>
    ${qualityHtml}
    <h3 style="font-size:14px;margin:0 0 8px;border-top:1px solid #e7e0d5;padding-top:16px;">Prompt cache</h3>
    ${cacheHtml}
    <p style="font-size:12px;color:#5c6675;margin:20px 0 0;">Admin panel: <a href="${PRODUCTION_URL}/admin" style="color:#1b4965;">${PRODUCTION_URL}/admin</a></p>
  </div>
</body></html>`;

  const textBriefs = p.briefsCompleted.length
    ? p.briefsCompleted
        .map((b) => `  - ${b.email ?? '(no email)'} · ${b.locale} · ${adminConversationUrl(b.id)}`)
        .join('\n')
    : '  (none)';
  const textFlagged = Object.entries(p.flaggedByReason).length
    ? Object.entries(p.flaggedByReason)
        .map(
          ([reason, items]) =>
            `  ${reason} (${items.length}):\n` +
            items
              .map(
                (it) =>
                  `    - ${it.email ?? '(no email)'} · ${it.locale} · ${adminConversationUrl(it.id)}`,
              )
              .join('\n'),
        )
        .join('\n\n')
    : '  (none)';
  const textTopRt = p.topResponseTimes.length
    ? p.topResponseTimes
        .map((r) => `  - ${r.response_time_ms}ms · ${adminConversationUrl(r.conversation_id)}`)
        .join('\n')
    : '  (no data)';

  const text = [
    `Concierge digest — ${dayLabel}`,
    `Previous Cairo day. Admin panel: ${PRODUCTION_URL}/admin`,
    '',
    'Totals:',
    `  Conversations: ${p.totals.conversations}`,
    `  Briefs completed: ${p.totals.briefsCompleted}`,
    `  Flagged: ${p.totals.flagged}`,
    '',
    `Briefs completed (${p.briefsCompleted.length}):`,
    textBriefs,
    '',
    'Flagged · needs review:',
    textFlagged,
    '',
    'Top response times:',
    textTopRt,
    '',
    `Tokens: ${p.tokenSummary.inputTokens.toLocaleString()} in / ${p.tokenSummary.outputTokens.toLocaleString()} out · ${p.tokenSummary.messageCount} messages`,
    '',
    'Quality sample (LLM judge):',
    !p.qualityScores
      ? '  (telemetry not enabled — migration 0008)'
      : p.qualityScores.count === 0
        ? '  (none sampled)'
        : `  ${p.qualityScores.count} sampled · pacing ${p.qualityScores.avgPacing}/5 · grounding ${p.qualityScores.avgGrounding}/5 · tone ${p.qualityScores.avgTone}/5${p.qualityScores.worstNote ? `\n  lowest-scored note: ${p.qualityScores.worstNote}` : ''}`,
    '',
    'Prompt cache:',
    !p.cacheHit
      ? '  (telemetry not enabled — migration 0008)'
      : `  hit rate ${(p.cacheHit.rate * 100).toFixed(1)}% across ${p.cacheHit.turnsMeasured} turns${p.cacheHit.alert ? '\n  ⚠ BELOW 50% — cached v4.1 prefix may be invalidated; check deploy diff + usage logs' : ''}`,
  ].join('\n');

  return { subject, html, text };
}

export function resumeEmail(url: string, locale: string): ResumeEmailContent {
  if (locale === 'es') {
    const heading = 'Retoma tu conversación';
    const body = `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:${BRAND.ink};">Aquí tienes un enlace privado para seguir planificando tu viaje a Egipto con nuestro concierge, desde cualquier dispositivo. El enlace funciona durante 30 días.</p>`;
    return {
      subject: 'Tu conversación con Travel2Egypt — retoma donde lo dejaste',
      html: shell(heading, body, 'Continuar la conversación', url),
      text: `Retoma tu conversación con el concierge de Travel2Egypt (válido 30 días):\n${url}\n\n— El equipo de Travel2Egypt`,
    };
  }
  const heading = 'Pick up where you left off';
  const body = `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:${BRAND.ink};">Here's a private link to continue planning your Egypt trip with our concierge, on any device. This link works for 30 days.</p>`;
  return {
    subject: 'Your Travel2Egypt conversation — pick up where you left off',
    html: shell(heading, body, 'Continue the conversation', url),
    text: `Continue your conversation with the Travel2Egypt concierge (valid 30 days):\n${url}\n\n— The Travel2Egypt team`,
  };
}
