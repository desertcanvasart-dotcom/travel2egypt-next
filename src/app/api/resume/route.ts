import { NextResponse, type NextRequest } from 'next/server';

import { enforceExpensive } from '@/lib/concierge/rateLimit';
import { ensureSession, sessionCookie } from '@/lib/concierge/session';
import { signResumeToken } from '@/lib/concierge/resumeToken';
import { sendResumeEmail } from '@/lib/email/resend';
import { conciergeDb } from '@/lib/supabase/server';

/**
 * POST /api/resume — "save my conversation" (Session 4).
 *
 * Captures the visitor's email to concierge.sessions.email, mints a 30-day
 * HMAC resume token for the session, and emails a resume link via Resend.
 * Following that link (handled in middleware) re-attaches the session cookie
 * on any device. The GET side of resume is middleware, not here — a route
 * handler can't own the /plan-your-tour?resume= URL shape.
 *
 * Request:  { email: string; locale?: string }
 * Response: { ok: true } | { error }
 */
export const runtime = 'nodejs';

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export async function POST(req: NextRequest) {
  let email = '';
  let locale = 'en';
  try {
    const body = (await req.json()) as { email?: unknown; locale?: unknown };
    if (typeof body.email === 'string') email = body.email.trim().toLowerCase();
    if (body.locale === 'es') locale = 'es';
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  try {
    const db = conciergeDb();
    const session = await ensureSession(req, { locale });
    if (!session) throw new Error('unreachable: ensureSession with create');

    // S7: throttle resume-email sends (Resend cost / inbox spam). A legitimate
    // visitor sends one; repeats hit the per-session hourly/daily cap.
    const limit = await enforceExpensive(db, 'resume_email', session.cookieId);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'rate_limited', retryAfter: limit.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      );
    }

    // Explicit save — set/confirm the email (unlike auto-capture, which is
    // first-wins). Also marks it the verified contact for the resume flow.
    await db.from('sessions').update({ email }).eq('id', session.rowId);

    const token = await signResumeToken(session.cookieId);
    const resumeUrl = `${req.nextUrl.origin}/${locale === 'es' ? 'es/' : ''}plan-your-tour?resume=${encodeURIComponent(token)}`;
    await sendResumeEmail(email, resumeUrl, locale);

    const res = NextResponse.json({ ok: true });
    if (session.isNew) res.cookies.set(await sessionCookie(req, session.cookieId));
    return res;
  } catch (err) {
    console.error('[concierge] resume email failed:', err);
    return NextResponse.json({ error: 'resume_unavailable' }, { status: 500 });
  }
}
