import Anthropic from '@anthropic-ai/sdk';
import { getTranslations } from 'next-intl/server';
import { NextResponse, type NextRequest } from 'next/server';

import { assertSameOrigin } from '@/lib/http/sameOrigin';

import type { Locale } from '@/i18n/routing';
import { detectAbuse, primaryCategory } from '@/lib/abuseDetection';
import { detectBriefMarkers } from '@/lib/briefDetection';
import {
  CONCIERGE_MAX_TOKENS,
  CONCIERGE_MODEL,
  CONCIERGE_PROMPT_VERSION,
} from '@/lib/concierge/constants';
import { hashedIp, hashedUserAgent } from '@/lib/concierge/ipHash';
import {
  ABUSE_TERMINATE_AT,
  abuseSignalCount,
  enforceChat,
  recordAbuseSignal,
  TOKEN_CAPS,
} from '@/lib/concierge/rateLimit';
import { ensureSession, sessionCookie, type ConciergeSession } from '@/lib/concierge/session';
import { buildTourContextBlock, resolveTourContext } from '@/lib/concierge/tourContext';
import { CONCIERGE_SYSTEM_PROMPT } from '@/lib/conciergePrompt';
import { sendHostileContentAlert } from '@/lib/email/resend';
import { conciergeDb } from '@/lib/supabase/server';

/** Best-effort keyed hash — a missing IP_HASH_SECRET degrades to no IP, never a 500. */
async function safeHash(p: Promise<string | null>): Promise<string | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

/** A wrap-nudge injected as system block 2 when the soft token cap is reached. */
const WRAP_NUDGE =
  'SYSTEM CONTEXT (not from the traveler): this conversation has grown long. ' +
  'Following your WHEN TO WRAP guidance, look for a natural moment to consolidate ' +
  'what you have gathered and move toward putting a brief together for the team, ' +
  'capturing the contact essentials first. Do not mention any system or length limit.';

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

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
} as const;

/**
 * Hard token-cap response (S7): stream a canned, localized clean wrap toward
 * brief completion instead of another Anthropic call. Same SSE shape as a real
 * turn, so the client renders it identically; the wrap text carries a Gate-1
 * handoff marker, so once contact details are present the brief still completes
 * via Gate 2 (extraction reads the transcript, no chat call needed).
 */
async function cannedWrapResponse(
  req: NextRequest,
  db: ReturnType<typeof conciergeDb>,
  args: {
    conversationId: string;
    session: ConciergeSession;
    locale: Locale;
    email: string | null;
    /** The context size that tripped the cap — stored so the cap stays tripped. */
    contextTokens: number;
    text: string;
  },
): Promise<NextResponse> {
  const { conversationId, session, locale, email, contextTokens, text } = args;
  const encoder = new TextEncoder();
  const sse = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      send({ type: 'start', conversationId, sessionRef: session.cookieId.slice(0, 8) });
      send({ type: 'delta', text });
      try {
        await db.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: text,
          response_time_ms: 0,
          // Carry the tripping context size forward so the next turn stays
          // capped (a canned wrap makes no API call, so it has no real count).
          token_count_input: contextTokens,
          token_count_output: 0,
          model_version: 'canned-wrap',
        });
        await db
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
      } catch (err) {
        console.error('[concierge] canned wrap persist failed:', err);
      }
      send({ type: 'done', briefDetected: detectBriefMarkers(text, locale, { email }) });
      controller.close();
    },
  });
  const res = new NextResponse(sse, { headers: SSE_HEADERS });
  if (session.isNew) res.cookies.set(await sessionCookie(req, session.cookieId));
  return res;
}

export async function POST(req: NextRequest) {
  const crossOrigin = assertSameOrigin(req);
  if (crossOrigin) return crossOrigin;

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
    const ipHash = await safeHash(hashedIp(req));
    const userAgentHash = await safeHash(hashedUserAgent(req));
    const session = await ensureSession(req, { locale, ipHash, userAgentHash });
    if (!session) throw new Error('unreachable: ensureSession with create');

    // S7 termination: a session past the abuse-signal threshold is shut down
    // until the abuse window rolls. Checked before any work — no Anthropic call.
    if ((await abuseSignalCount(db, session.cookieId)) >= ABUSE_TERMINATE_AT) {
      return NextResponse.json({ error: 'terminated' }, { status: 429 });
    }

    // S7 rate limiting: per-session soft cooldown + per-IP hard block. Gate
    // before the Anthropic call so a throttled turn costs nothing.
    const limit = await enforceChat(db, session.cookieId, ipHash);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'rate_limited', scope: limit.scope, retryAfter: limit.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      );
    }

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
          .insert({ session_id: session.rowId, prompt_version: CONCIERGE_PROMPT_VERSION })
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

    // History first, then persist the new user turn. token_count_* feed the
    // S7 conversation-size measurement (latest assistant turn ≈ context size).
    const { data: history, error: historyError } = await db
      .from('messages')
      .select('role, content, token_count_input, token_count_output')
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

    // S7 abuse detection — FLAG ONLY. v4.1 still writes the reply; we only
    // categorize, tally toward termination, and (hostile only) alert the team.
    const recentUserMessages = (history ?? [])
      .filter((m) => m.role === 'user')
      .map((m) => m.content);
    const abuseCategories = detectAbuse(message, recentUserMessages);
    if (abuseCategories.length > 0) {
      await db
        .from('conversations')
        .update({ flagged: true, flag_reason: primaryCategory(abuseCategories) })
        .eq('id', conversationId);
      const signals = await recordAbuseSignal(db, session.cookieId);
      if (abuseCategories.includes('hostile_language')) {
        // Real-time team alert; prompt-injection is daily-review only (no email).
        void sendHostileContentAlert({
          sessionRef: session.cookieId.slice(0, 8),
          conversationId,
          locale,
          message,
        }).catch((e) => console.error('[concierge] hostile alert failed:', e));
      }
      if (signals >= ABUSE_TERMINATE_AT) {
        return NextResponse.json({ error: 'terminated' }, { status: 429 });
      }
    }

    // S7 token caps — conversation context size = latest assistant turn tokens.
    const lastAssistant = [...(history ?? [])].reverse().find((m) => m.role === 'assistant');
    const contextTokens =
      (lastAssistant?.token_count_input ?? 0) + (lastAssistant?.token_count_output ?? 0);
    if (contextTokens >= TOKEN_CAPS.hard) {
      // Hard cap: a clean localized wrap toward brief completion — no Anthropic
      // call. Reuses the SSE shape so the client renders it as a normal turn.
      console.info(
        `[concierge] token hard-cap conv=${conversationId} contextTokens=${contextTokens} → canned wrap`,
      );
      const t = await getTranslations({ locale, namespace: 'planYourTour' });
      return cannedWrapResponse(req, db, {
        conversationId,
        session,
        locale,
        email: sessionEmail,
        contextTokens,
        text: t('tokenCapWrap'),
      });
    }
    const wrapNudge = contextTokens >= TOKEN_CAPS.soft;
    if (wrapNudge) {
      console.info(
        `[concierge] token soft-cap conv=${conversationId} contextTokens=${contextTokens} → wrap nudge`,
      );
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
      // Both runtime blocks sit AFTER the cache breakpoint — their variance
      // never invalidates the cached v4.1 prefix.
      ...(contextBlock ? [{ type: 'text' as const, text: contextBlock }] : []),
      ...(wrapNudge ? [{ type: 'text' as const, text: WRAP_NUDGE }] : []),
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
          // token_count_input stores the FULL input the model processed —
          // uncached + cache_read + cache_creation. With prompt caching,
          // usage.input_tokens alone is only the uncached delta (the ~13k v4.1
          // prefix lives in the cache fields), so it badly understates context
          // size; the S7 token caps measure conversation size from this column.
          const totalInputTokens =
            usage.input_tokens +
            (usage.cache_read_input_tokens ?? 0) +
            (usage.cache_creation_input_tokens ?? 0);
          // token_count_cache_read (0008): the cached share of the input, so
          // the digest can compute the daily cache-hit rate and flag a v4.1
          // prefix invalidation. Fail-soft until the migration is applied:
          // retry the insert without the column rather than losing the turn.
          const assistantRow = {
            conversation_id: conversationId,
            role: 'assistant' as const,
            content: text,
            response_time_ms: Date.now() - startedAt,
            token_count_input: totalInputTokens,
            token_count_output: usage.output_tokens,
            token_count_cache_read: usage.cache_read_input_tokens ?? 0,
            model_version: final.model,
          };
          let insertRes = await db.from('messages').insert(assistantRow);
          if (insertRes.error && /token_count_cache_read/.test(insertRes.error.message)) {
            console.warn(
              '[concierge] messages.token_count_cache_read missing — apply migration 0008',
            );
            const { token_count_cache_read: _drop, ...withoutCache } = assistantRow;
            insertRes = await db.from('messages').insert(withoutCache);
          }
          if (insertRes.error) {
            console.error('[concierge] assistant message persist failed:', insertRes.error);
          }
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

    const res = new NextResponse(sse, { headers: SSE_HEADERS });
    if (session.isNew) res.cookies.set(await sessionCookie(req, session.cookieId));
    return res;
  } catch (err) {
    console.error('[concierge] chat request failed:', err);
    return NextResponse.json({ error: 'chat_unavailable' }, { status: 500 });
  }
}
