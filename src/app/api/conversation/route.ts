import { NextResponse, type NextRequest } from 'next/server';

import { ensureSession, sessionCookie } from '@/lib/concierge/session';
import { conciergeDb } from '@/lib/supabase/server';

/**
 * /api/conversation — load / start (Session 2 skeleton; S3 wires the UI).
 *
 * GET  → the session's latest live conversation + its messages, or
 *        { conversation: null, messages: [] }. Deliberately does NOT mint
 *        a session (crawlers/cold visitors shouldn't create DB rows).
 * POST → archive any live conversations and start a fresh one ("Start new
 *        conversation" = archive, per the locked S3 decision).
 */
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await ensureSession(req, { createIfMissing: false });
    if (!session) {
      return NextResponse.json({ conversation: null, messages: [], sessionRef: null });
    }
    // 8-char session reference for the escape-hatch WhatsApp prefill +
    // admin reverse-lookup (first 8 of the session cookie_id / UUID).
    const sessionRef = session.cookieId.slice(0, 8);
    const db = conciergeDb();
    const { data: conversation } = await db
      .from('conversations')
      .select('id, started_at, last_message_at, tour_slug, tour_title, brief_completed, brief_payload')
      .eq('session_id', session.rowId)
      .eq('archived', false)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!conversation) {
      return NextResponse.json({ conversation: null, messages: [], sessionRef });
    }
    const { data: messages, error } = await db
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversation.id)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        startedAt: conversation.started_at,
        lastMessageAt: conversation.last_message_at,
        tourSlug: conversation.tour_slug,
        tourTitle: conversation.tour_title,
        briefCompleted: conversation.brief_completed ?? false,
        briefPayload: conversation.brief_payload ?? null,
      },
      messages: (messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      })),
      sessionRef,
    });
  } catch (err) {
    console.error('[concierge] conversation load failed:', err);
    return NextResponse.json({ error: 'conversation_unavailable' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let locale: string | undefined;
  try {
    const body = (await req.json()) as { locale?: unknown };
    locale = body.locale === 'es' ? 'es' : 'en';
  } catch {
    locale = 'en';
  }

  try {
    const db = conciergeDb();
    const session = await ensureSession(req, { locale });
    if (!session) throw new Error('unreachable: ensureSession with create');

    await db
      .from('conversations')
      .update({ archived: true })
      .eq('session_id', session.rowId)
      .eq('archived', false);

    const { data, error } = await db
      .from('conversations')
      .insert({ session_id: session.rowId })
      .select('id')
      .single();
    if (error || !data) throw new Error(`conversation create failed: ${error?.message}`);

    const res = NextResponse.json({ conversationId: data.id });
    if (session.isNew) res.cookies.set(await sessionCookie(req, session.cookieId));
    return res;
  } catch (err) {
    console.error('[concierge] conversation start failed:', err);
    return NextResponse.json({ error: 'conversation_unavailable' }, { status: 500 });
  }
}
