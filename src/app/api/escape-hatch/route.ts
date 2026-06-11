import { NextResponse, type NextRequest } from 'next/server';

import { enforceExpensive } from '@/lib/concierge/rateLimit';
import { ensureSession } from '@/lib/concierge/session';
import { sendTeamHandoffEmail } from '@/lib/email/resend';
import { conciergeDb } from '@/lib/supabase/server';

/**
 * POST /api/escape-hatch — "Talk to a human" handoff (Session 5).
 *
 * Records the chosen option on the conversation and flags it; the `forward`
 * option also emails the team. Called when the visitor picks one of the
 * three options (whatsapp | forward | continue) — NOT on mere panel
 * open/close.
 *
 * Request:  { conversationId: string; action: 'whatsapp'|'forward'|'continue'; email?: string }
 * Response: { ok: true, sessionRef } | { error }
 *
 * Plausible custom events are deferred (Plausible is not wired in the app
 * yet — see the S12 launch checklist); the escape_hatch_* columns are the
 * durable record meanwhile.
 */
export const runtime = 'nodejs';

const ACTIONS = ['whatsapp', 'forward', 'continue'] as const;
type Action = (typeof ACTIONS)[number];

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export async function POST(req: NextRequest) {
  let conversationId = '';
  let action: Action | null = null;
  let providedEmail: string | null = null;
  let locale: 'en' | 'es' = 'en';
  try {
    const body = (await req.json()) as {
      conversationId?: unknown;
      action?: unknown;
      email?: unknown;
      locale?: unknown;
    };
    if (typeof body.conversationId === 'string') conversationId = body.conversationId;
    if (typeof body.action === 'string' && (ACTIONS as readonly string[]).includes(body.action)) {
      action = body.action as Action;
    }
    if (typeof body.email === 'string' && EMAIL_RE.test(body.email.trim())) {
      providedEmail = body.email.trim().toLowerCase();
    }
    if (body.locale === 'es') locale = 'es';
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!conversationId || !action) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  try {
    const db = conciergeDb();
    const session = await ensureSession(req, { createIfMissing: false });
    if (!session) {
      return NextResponse.json({ error: 'no_session' }, { status: 401 });
    }

    // The conversation must belong to this session.
    const { data: conversation } = await db
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('session_id', session.rowId)
      .maybeSingle();
    if (!conversation) {
      return NextResponse.json({ error: 'conversation_not_found' }, { status: 404 });
    }

    // Record + flag (every chosen option, including 'continue').
    await db
      .from('conversations')
      .update({
        escape_hatch_used: true,
        escape_hatch_action: action,
        escape_hatch_at: new Date().toISOString(),
        flagged: true,
        flag_reason: 'escape_hatch_used',
      })
      .eq('id', conversationId);

    const sessionRef = session.cookieId.slice(0, 8);

    if (action === 'forward') {
      // S7: throttle the handoff email (Resend cost / inbox spam). The action
      // is already recorded above; we just decline to send another email.
      const limit = await enforceExpensive(db, 'escape_hatch', session.cookieId);
      if (!limit.ok) {
        return NextResponse.json(
          { error: 'rate_limited', sessionRef, retryAfter: limit.retryAfterSeconds },
          { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
        );
      }

      // Capture the email if newly provided (first-wins, like S4 auto-capture).
      let email = session.email;
      if (!email && providedEmail) {
        email = providedEmail;
        await db.from('sessions').update({ email }).eq('id', session.rowId);
      } else if (providedEmail && session.email && providedEmail !== session.email) {
        email = providedEmail; // visitor corrected it in the forward prompt
      }

      const { data: messages } = await db
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true });

      await sendTeamHandoffEmail({
        sessionRef,
        conversationId,
        visitorEmail: email,
        locale,
        transcript: (messages ?? []).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      });
    }

    return NextResponse.json({ ok: true, sessionRef });
  } catch (err) {
    console.error('[concierge] escape-hatch failed:', err);
    return NextResponse.json({ error: 'escape_hatch_unavailable' }, { status: 500 });
  }
}
