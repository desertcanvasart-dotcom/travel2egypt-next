import { Resend } from 'resend';

import { resumeEmail, teamHandoffEmail } from './templates';

/**
 * Resend wrapper (Session 4). The single transactional-mail entry point;
 * S5/S9/S10 add more senders here. Server-only — RESEND_API_KEY never
 * reaches the client.
 *
 * From `concierge@travel2egypt.org` with a recognizable display name;
 * Reply-To → TEAM_INBOX_EMAIL so visitor replies land in the team's Gmail
 * (Resend sends, Gmail handles humans — they coexist via Reply-To).
 */

const FROM = process.env.EMAIL_FROM || 'Travel2Egypt Concierge <concierge@travel2egypt.org>';

function client(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY must be set');
  return new Resend(key);
}

export async function sendResumeEmail(to: string, resumeUrl: string, locale: string): Promise<void> {
  const { subject, html, text } = resumeEmail(resumeUrl, locale);
  const replyTo = process.env.TEAM_INBOX_EMAIL;
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) throw new Error(`resend send failed: ${error.message}`);
}

interface TeamHandoffArgs {
  sessionRef: string;
  conversationId: string;
  visitorEmail: string | null;
  locale: string;
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Team-facing handoff notification (Session 5). Goes to TEAM_INBOX_EMAIL.
 * Reply-To is the VISITOR's email (so the team replies straight to the
 * traveler) — NOT the team Gmail; the brief's "Reply-To → team Gmail" applies
 * to visitor-facing mail only. Throws if TEAM_INBOX_EMAIL is unset so the
 * route can surface a clear failure instead of silently dropping the handoff.
 */
export async function sendTeamHandoffEmail(args: TeamHandoffArgs): Promise<void> {
  const to = process.env.TEAM_INBOX_EMAIL;
  if (!to) throw new Error('TEAM_INBOX_EMAIL must be set for the team handoff email');
  const { subject, html, text } = teamHandoffEmail(args);
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
    ...(args.visitorEmail ? { replyTo: args.visitorEmail } : {}),
  });
  if (error) throw new Error(`resend team handoff failed: ${error.message}`);
}
