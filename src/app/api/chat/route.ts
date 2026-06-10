import Anthropic from '@anthropic-ai/sdk';
import { NextResponse, type NextRequest } from 'next/server';

import { CONCIERGE_MAX_TOKENS, CONCIERGE_MODEL } from '@/lib/concierge/constants';
import { ensureSession, sessionCookie } from '@/lib/concierge/session';
import { CONCIERGE_SYSTEM_PROMPT } from '@/lib/conciergePrompt';
import { conciergeDb } from '@/lib/supabase/server';

/**
 * POST /api/chat — the concierge chat turn (Session 2: backend proof;
 * the UI consumes this from Session 3).
 *
 * Request:  { message: string; conversationId?: string; locale?: string }
 * Response: SSE stream of JSON events:
 *   data: {"type":"start","conversationId":"…"}   — accepted, conversation resolved
 *   data: {"type":"delta","text":"…"}             — streamed v4.1 text
 *   data: {"type":"done"}                         — assistant message persisted
 *   data: {"type":"error","message":"…"}          — stream failed mid-flight
 *
 * Outside the next-intl matcher (middleware excludes /api); robots.ts
 * disallows /api/. Rate limiting lands in Session 7; tour context and the
 * locale hint are injected as runtime context in S3/S6 — the v4.1 system
 * prompt itself is locked and passed verbatim.
 */
export const runtime = 'nodejs';

const MAX_MESSAGE_CHARS = 4000;

interface ChatBody {
  message?: unknown;
  conversationId?: unknown;
  locale?: unknown;
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'message_required' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: 'message_too_long' }, { status: 413 });
  }
  const requestedConversationId =
    typeof body.conversationId === 'string' ? body.conversationId : null;
  const locale = body.locale === 'es' ? 'es' : 'en';

  try {
    const db = conciergeDb();
    const session = await ensureSession(req, { locale });
    if (!session) throw new Error('unreachable: ensureSession with create');

    // Resolve the conversation: an explicitly requested one must belong to
    // this session and be live; otherwise continue the latest live one or
    // start fresh.
    let conversationId: string;
    if (requestedConversationId) {
      const { data } = await db
        .from('conversations')
        .select('id, archived')
        .eq('id', requestedConversationId)
        .eq('session_id', session.rowId)
        .maybeSingle();
      if (!data || data.archived) {
        return NextResponse.json({ error: 'conversation_not_found' }, { status: 404 });
      }
      conversationId = data.id;
    } else {
      const { data } = await db
        .from('conversations')
        .select('id')
        .eq('session_id', session.rowId)
        .eq('archived', false)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        conversationId = data.id;
      } else {
        const { data: created, error } = await db
          .from('conversations')
          .insert({ session_id: session.rowId })
          .select('id')
          .single();
        if (error || !created) {
          throw new Error(`conversation create failed: ${error?.message}`);
        }
        conversationId = created.id;
      }
    }

    // History first, then persist the new user turn.
    const { data: history, error: historyError } = await db
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true });
    if (historyError) throw new Error(`history load failed: ${historyError.message}`);

    const { error: insertError } = await db.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    });
    if (insertError) throw new Error(`user message persist failed: ${insertError.message}`);

    const apiMessages = [
      ...(history ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const anthropic = new Anthropic(); // ANTHROPIC_API_KEY from env, server-only
    const startedAt = Date.now();
    const stream = anthropic.messages.stream({
      model: CONCIERGE_MODEL,
      max_tokens: CONCIERGE_MAX_TOKENS,
      system: CONCIERGE_SYSTEM_PROMPT,
      messages: apiMessages,
    });

    const encoder = new TextEncoder();
    const sse = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: Record<string, unknown>) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        send({ type: 'start', conversationId });
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              send({ type: 'delta', text: event.delta.text });
            }
          }
          const final = await stream.finalMessage();
          const text = final.content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('');
          await db.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: text,
            response_time_ms: Date.now() - startedAt,
            token_count_input: final.usage.input_tokens,
            token_count_output: final.usage.output_tokens,
            model_version: final.model,
          });
          await db
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);
          send({ type: 'done' });
        } catch (err) {
          console.error('[concierge] chat stream failed:', err);
          send({ type: 'error', message: 'stream_failed' });
        } finally {
          controller.close();
        }
      },
    });

    const res = new NextResponse(sse, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
    if (session.isNew) res.cookies.set(sessionCookie(req, session.cookieId));
    return res;
  } catch (err) {
    console.error('[concierge] chat request failed:', err);
    return NextResponse.json({ error: 'chat_unavailable' }, { status: 500 });
  }
}
