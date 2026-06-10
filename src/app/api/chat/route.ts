import Anthropic from '@anthropic-ai/sdk';
import { NextResponse, type NextRequest } from 'next/server';

import type { Locale } from '@/i18n/routing';
import { detectBriefMarkers } from '@/lib/briefDetection';
import { CONCIERGE_MAX_TOKENS, CONCIERGE_MODEL } from '@/lib/concierge/constants';
import { ensureSession, sessionCookie } from '@/lib/concierge/session';
import { buildTourContextBlock, resolveTourContext } from '@/lib/concierge/tourContext';
import { CONCIERGE_SYSTEM_PROMPT } from '@/lib/conciergePrompt';
import { conciergeDb } from '@/lib/supabase/server';

/**
 * POST /api/chat — the concierge chat turn (S2 backend, S3 wiring).
 *
 * Request:  { message: string; conversationId?: string; locale?: string;
 *             tourSlug?: string }
 * Response: SSE stream of JSON events:
 *   data: {"type":"start","conversationId":"…"}
 *   data: {"type":"delta","text":"…"}
 *   data: {"type":"done","briefDetected":false}   — briefDetected live in S4
 *   data: {"type":"error","message":"…"}
 *
 * System prompt strategy: the locked v4.1 prompt is system block 1 with a
 * cache_control breakpoint (~13.2k tokens — cached across turns, ~10x input
 * cost cut). Runtime context (tour entry today; locale hint S6, wrap-nudge
 * S7) is system block 2, AFTER the breakpoint, so its variance never
 * invalidates the cached prefix. The v4.1 text itself is never edited.
 *
 * tourSlug is user-controlled: it persists to the conversation only when it
 * resolves to a real Sanity tour (most-recent-wins overwrite); garbage
 * degrades silently to no context. Rate limiting lands in Session 7.
 */
export const runtime = 'nodejs';

const MAX_MESSAGE_CHARS = 4000;

// Reasonable RFC-ish email match (not draconian) for brief-flow auto-capture.
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

interface ChatBody {
  message?: unknown;
  conversationId?: unknown;
  locale?: unknown;
  tourSlug?: unknown;
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
  const locale: Locale = body.locale === 'es' ? 'es' : 'en';
  const rawTourSlug = typeof body.tourSlug === 'string' ? body.tourSlug : null;

  try {
    const db = conciergeDb();
    const session = await ensureSession(req, { locale });
    if (!session) throw new Error('unreachable: ensureSession with create');

    // Resolve the conversation (carrying its persisted tour ref).
    let conversationId: string;
    let storedTour: { slug: string | null; title: string | null } = { slug: null, title: null };
    if (requestedConversationId) {
      const { data } = await db
        .from('conversations')
        .select('id, archived, tour_slug, tour_title')
        .eq('id', requestedConversationId)
        .eq('session_id', session.rowId)
        .maybeSingle();
      if (!data || data.archived) {
        return NextResponse.json({ error: 'conversation_not_found' }, { status: 404 });
      }
      conversationId = data.id;
      storedTour = { slug: data.tour_slug, title: data.tour_title };
    } else {
      const { data } = await db
        .from('conversations')
        .select('id, tour_slug, tour_title')
        .eq('session_id', session.rowId)
        .eq('archived', false)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        conversationId = data.id;
        storedTour = { slug: data.tour_slug, title: data.tour_title };
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

    // Tour context: a fresh ?tour= attaches/overwrites (most recent wins);
    // otherwise the conversation's stored ref keeps the block stable.
    let contextBlock: string | null = null;
    if (rawTourSlug && rawTourSlug !== storedTour.slug) {
      const resolved = await resolveTourContext(rawTourSlug, locale);
      if (resolved) {
        await db
          .from('conversations')
          .update({ tour_slug: resolved.slug, tour_title: resolved.title })
          .eq('id', conversationId);
        contextBlock = buildTourContextBlock(resolved);
      }
    }
    if (!contextBlock && storedTour.title) {
      contextBlock = buildTourContextBlock({ title: storedTour.title });
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

    // Brief-flow email auto-capture (S4): the agent asks for an email in
    // chat (v4.1 L223), so it lands in message content, not sessions.email.
    // Capture the FIRST valid email from a USER message (never the agent's —
    // it may quote one back) so Gate 1's session.email check works in the
    // normal flow. First valid wins; never overwrite an existing value.
    let sessionEmail = session.email;
    if (!sessionEmail) {
      const found = message.match(EMAIL_RE)?.[0];
      if (found) {
        sessionEmail = found.toLowerCase();
        await db.from('sessions').update({ email: sessionEmail }).eq('id', session.rowId);
        console.info(`[concierge] auto-captured email for session ${session.rowId}`);
      }
    }

    const apiMessages = [
      ...(history ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const system: Anthropic.TextBlockParam[] = [
      {
        type: 'text',
        text: CONCIERGE_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
      ...(contextBlock ? [{ type: 'text' as const, text: contextBlock }] : []),
    ];

    const anthropic = new Anthropic(); // ANTHROPIC_API_KEY from env, server-only
    const startedAt = Date.now();
    const stream = anthropic.messages.stream({
      model: CONCIERGE_MODEL,
      max_tokens: CONCIERGE_MAX_TOKENS,
      system,
      messages: apiMessages,
    });

    const encoder = new TextEncoder();
    const sse = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: Record<string, unknown>) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        send({ type: 'start', conversationId, sessionRef: session.cookieId.slice(0, 8) });
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
          const usage = final.usage;
          // Cache verification telemetry (brief S3 addition 1): turn 2+ of a
          // conversation should show cache_read ≈ the v4.1 prompt size.
          console.log(
            `[concierge] usage conv=${conversationId} ms=${Date.now() - startedAt}` +
              ` in=${usage.input_tokens} out=${usage.output_tokens}` +
              ` cache_write=${usage.cache_creation_input_tokens ?? 0}` +
              ` cache_read=${usage.cache_read_input_tokens ?? 0}`,
          );
          await db.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: text,
            response_time_ms: Date.now() - startedAt,
            token_count_input: usage.input_tokens,
            token_count_output: usage.output_tokens,
            model_version: final.model,
          });
          await db
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);
          send({
            type: 'done',
            briefDetected: detectBriefMarkers(text, locale, { email: sessionEmail }),
          });
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
    if (session.isNew) res.cookies.set(await sessionCookie(req, session.cookieId));
    return res;
  } catch (err) {
    console.error('[concierge] chat request failed:', err);
    return NextResponse.json({ error: 'chat_unavailable' }, { status: 500 });
  }
}
