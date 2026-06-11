/**
 * Resume email templates (Session 4). Plain branded HTML — cream surface,
 * serif heading, faience button — no @react-email for v1. EN + ES.
 */

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
