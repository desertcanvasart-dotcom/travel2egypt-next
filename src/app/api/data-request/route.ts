import { NextResponse, type NextRequest } from 'next/server';

import { expireSessionCookie } from '@/lib/concierge/cookie';
import { ensureSession } from '@/lib/concierge/session';
import { conciergeDb } from '@/lib/supabase/server';

/**
 * POST /api/data-request — visitor data rights for the concierge (Session 8).
 *
 * action: 'delete' — ANONYMISE this session's concierge data (not a row
 * delete). Strips PII, keeps a non-identifying skeleton, and RETAINS the keyed
 * ip_hash / user_agent_hash (one-way abuse-prevention pseudonyms — removing
 * them on request would let an abuser reset their standing). Behaviour matches
 * the published privacy-policy copy verbatim. Session-scoped: covers every
 * conversation on the session, not just the active one. Then clears the
 * t2e_session_id cookie so the visitor starts fresh.
 *
 * Data export is intentionally NOT here — it is a client-side mailto to the
 * team inbox (lightest v1; an automated export endpoint is future work).
 *
 * Request:  { action: 'delete' }
 * Response: { ok: true } | { error }
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let action = '';
  try {
    const body = (await req.json()) as { action?: unknown };
    if (typeof body.action === 'string') action = body.action;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (action !== 'delete') {
    return NextResponse.json({ error: 'unsupported_action' }, { status: 400 });
  }

  try {
    const db = conciergeDb();
    const session = await ensureSession(req, { createIfMissing: false });
    if (!session) {
      return NextResponse.json({ error: 'no_session' }, { status: 401 });
    }

    const { data: convs } = await db
      .from('conversations')
      .select('id')
      .eq('session_id', session.rowId);
    const convIds = (convs ?? []).map((c) => c.id);

    // Strip message content + brief copies. Each step is idempotent, so a
    // partial failure is fully repaired by re-running the request.
    if (convIds.length > 0) {
      await db.from('messages').update({ content: '[deleted]' }).in('conversation_id', convIds);
      // briefs.payload is NOT NULL, so we empty it ({}) rather than null it —
      // same effect (PII removed), keeps the row's webhook-status skeleton.
      await db.from('briefs').update({ payload: {} }).in('conversation_id', convIds);
    }
    // conversations.brief_payload IS nullable; archived=true also stops the
    // anonymised conversation from being reloaded (GET filters archived=false).
    await db
      .from('conversations')
      .update({ brief_payload: null, archived: true })
      .eq('session_id', session.rowId);
    await db
      .from('sessions')
      .update({ email: null, anonymized_at: new Date().toISOString() })
      .eq('id', session.rowId);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(expireSessionCookie(req));
    return res;
  } catch (err) {
    console.error('[concierge] data-request delete failed:', err);
    return NextResponse.json({ error: 'data_request_unavailable' }, { status: 500 });
  }
}
