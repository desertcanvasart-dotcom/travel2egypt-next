import { Resend } from 'resend';

import { resumeEmail } from './templates';

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
