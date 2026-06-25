import { Resend } from 'resend';

import type { AutouraBriefPayload } from '@/lib/concierge/autoura/types';

import {
  autouraFailureAlertEmail,
  briefFallbackEmail,
  digestEmail,
  hostileContentAlert,
  resumeEmail,
  teamHandoffEmail,
  type AutouraFailureAlertParams,
  type DigestEmailParams,
} from './templates';

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

interface HostileAlertArgs {
  sessionRef: string;
  conversationId: string;
  locale: string;
  message: string;
}

/**
 * Hostile-content alert (Session 7) → TEAM_INBOX_EMAIL. Best-effort: if the
 * inbox is unset it silently no-ops (abuse alerting must never break the chat
 * turn), unlike the handoff which throws so the visitor sees a clear failure.
 * No Reply-To — internal alert, no visitor reply expected.
 */
export async function sendHostileContentAlert(args: HostileAlertArgs): Promise<void> {
  const to = process.env.TEAM_INBOX_EMAIL;
  if (!to) {
    console.warn('[concierge] TEAM_INBOX_EMAIL unset — hostile alert not sent');
    return;
  }
  const { subject, html, text } = hostileContentAlert(args);
  const { error } = await client().emails.send({ from: FROM, to, subject, html, text });
  if (error) throw new Error(`resend hostile alert failed: ${error.message}`);
}

/**
 * Autoura brief email fallback (Session 9) → TEAM_INBOX_EMAIL with the full
 * brief + transcript. Reply-To = the VISITOR's email (S5 team-facing lesson) so
 * the team replies straight to the traveler. Best-effort: if the inbox is unset
 * it no-ops (delivery must never crash the worker); a Resend error throws and
 * the caller's `safe()` wrapper swallows it.
 */
export async function sendAutouraBriefFallback(args: {
  sessionRef: string;
  payload: AutouraBriefPayload;
}): Promise<void> {
  const to = process.env.TEAM_INBOX_EMAIL;
  if (!to) {
    console.warn('[concierge] TEAM_INBOX_EMAIL unset — Autoura brief fallback not sent');
    return;
  }
  const { subject, html, text } = briefFallbackEmail(args);
  const replyTo = args.payload.visitor.email;
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) throw new Error(`resend autoura brief fallback failed: ${error.message}`);
}

/**
 * Daily digest (Session 10) → DIGEST_EMAIL ?? TEAM_INBOX_EMAIL. No Reply-To —
 * internal ops summary. Throws on send failure so the cron route can surface
 * a non-2xx; Railway will retry/alert on its side.
 */
export async function sendDigestEmail(args: DigestEmailParams): Promise<void> {
  const to = process.env.DIGEST_EMAIL || process.env.TEAM_INBOX_EMAIL;
  if (!to) throw new Error('no DIGEST_EMAIL or TEAM_INBOX_EMAIL set for daily digest');
  const { subject, html, text } = digestEmail(args);
  const { error } = await client().emails.send({ from: FROM, to, subject, html, text });
  if (error) throw new Error(`resend digest failed: ${error.message}`);
}

/**
 * Autoura delivery-failure alert (Session 9) → TEAM_INBOX_EMAIL + optional
 * ALERT_EMAIL (Islam direct; defaults to just the team inbox). No Reply-To —
 * internal ops signal. Best-effort like the fallback above.
 */
export async function sendAutouraFailureAlert(args: AutouraFailureAlertParams): Promise<void> {
  const recipients = [process.env.TEAM_INBOX_EMAIL, process.env.ALERT_EMAIL].filter(
    (x): x is string => !!x,
  );
  const to = [...new Set(recipients)]; // dedup if ALERT_EMAIL === TEAM_INBOX_EMAIL
  if (to.length === 0) {
    console.warn('[concierge] no TEAM_INBOX_EMAIL/ALERT_EMAIL — Autoura failure alert not sent');
    return;
  }
  const { subject, html, text } = autouraFailureAlertEmail(args);
  const { error } = await client().emails.send({ from: FROM, to, subject, html, text });
  if (error) throw new Error(`resend autoura failure alert failed: ${error.message}`);
}
