import { NextResponse, type NextRequest } from 'next/server';

import { deliverBrief } from '@/lib/concierge/autoura/deliver';
import { coerceBrand } from '@/lib/concierge/brands';
import { extractBrief, type ExtractionMessage } from '@/lib/briefExtraction';
import { enforceExpensive } from '@/lib/concierge/rateLimit';
import { ensureSession } from '@/lib/concierge/session';
import { conciergeDb } from '@/lib/supabase/server';
import type { Json } from '@/types/concierge-db';
import type { BriefPayload, BriefResponse } from '@/types/concierge';

/**
 * POST /api/brief — Gate 2 of brief detection (Session 4).
 *
 * Called by the client only after the chat `done` event reported
 * briefDetected:true (Gate 1). Runs the expensive Sonnet extraction off the
 * streaming path. If the extraction can assemble a minimum brief
 * (`complete:true`), it persists to conversations.brief_payload + a
 * concierge.briefs row and returns the payload for the completion panel.
 * Otherwise returns { complete:false } and the conversation continues (the
 * client suppresses re-triggering for a few turns).
 *
 * Idempotent: an already-completed conversation returns its stored payload
 * without re-extracting (so a reload re-shows the panel for free).
 *
 * Request:  { conversationId: string }
 * Response: { complete: boolean, payload?: BriefPayload }
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let conversationId: string | null = null;
  let locale: 'en' | 'es' = 'en';
  try {
    const body = (await req.json()) as { conversationId?: unknown; locale?: unknown };
    if (typeof body.conversationId === 'string') conversationId = body.conversationId;
    if (body.locale === 'es') locale = 'es';
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!conversationId) {
    return NextResponse.json({ error: 'conversation_required' }, { status: 400 });
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
      .select('id, brief_completed, brief_payload')
      .eq('id', conversationId)
      .eq('session_id', session.rowId)
      .maybeSingle();
    if (!conversation) {
      return NextResponse.json({ error: 'conversation_not_found' }, { status: 404 });
    }

    // Idempotent: already completed → return stored payload, no re-extract.
    if (conversation.brief_completed && conversation.brief_payload) {
      return NextResponse.json({
        complete: true,
        payload: conversation.brief_payload as unknown as BriefPayload,
      } satisfies BriefResponse);
    }

    const { data: messages, error: msgError } = await db
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true });
    if (msgError) throw new Error(`message load failed: ${msgError.message}`);
    if (!messages || messages.length === 0) {
      return NextResponse.json({ complete: false } satisfies BriefResponse);
    }

    // S7: throttle the expensive Sonnet extraction (post-idempotency, so a
    // cached re-show never counts). Silent to the client — it already
    // suppresses re-firing; a throttled attempt simply doesn't open the panel.
    const limit = await enforceExpensive(db, 'brief', session.cookieId);
    if (!limit.ok) {
      return NextResponse.json({ complete: false } satisfies BriefResponse);
    }

    const transcript: ExtractionMessage[] = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const payload = await extractBrief(transcript, locale);

    if (!payload.complete) {
      // Gate 2 rejected a Gate-1 phrase match — panel does not fire.
      return NextResponse.json({ complete: false } satisfies BriefResponse);
    }

    // S13: the extraction read back the agent's routing decision (default
    // 'travel2egypt' — the anchor — when the agent voiced no sister-brand
    // handoff). It decides what we persist on the conversation AND the Autoura
    // target below. An admin can later override conversations.routed_brand
    // (reversible handoff); this first-completion write seeds it.
    const brand = coerceBrand(payload.routed_brand);

    // Persist: brief state on the conversation + a briefs row (S9 delivers this).
    const nowIso = new Date().toISOString();
    await db
      .from('conversations')
      .update({
        brief_completed: true,
        brief_completed_at: nowIso,
        brief_payload: payload as unknown as Json,
        routed_brand: brand,
        routing_reason: payload.routing_reason,
      })
      .eq('id', conversationId);

    // S9: stamp the revision. A first brief for the conversation is revision 1;
    // a later one (when the S4 material-update trigger is enabled — deferred)
    // increments. Computed from existing rows so it's correct whenever a second
    // row is ever inserted. (Column lands in migration 0005.)
    const { data: prior } = await db
      .from('briefs')
      .select('brief_revision')
      .eq('conversation_id', conversationId)
      .order('brief_revision', { ascending: false })
      .limit(1);
    const briefRevision = (prior?.[0]?.brief_revision ?? 0) + 1;

    // delivered_brand snapshots where THIS brief was sent (immutable per-brief
    // record; a re-route later makes a new revision to the new endpoint).
    const { data: inserted } = await db
      .from('briefs')
      .insert({
        conversation_id: conversationId,
        payload: payload as unknown as Json,
        brief_revision: briefRevision,
        delivered_brand: brand,
      })
      .select('id')
      .single();

    // S9: non-blocking Autoura delivery. Fire-and-forget — the visitor's
    // completion panel must NOT wait on the webhook. `deliverBrief` is designed
    // never to throw, but we wrap the kickoff (sync guard + promise .catch) so a
    // synchronous throw or a rejected promise can never reject this request. On
    // Railway's persistent process the work outlives this response.
    if (inserted?.id) {
      const briefRowId = inserted.id;
      try {
        // S13 multi-tenant pivot: no per-brand endpoint override — the worker
        // loads the brief row's delivered_brand snapshot and puts it on the
        // wire as `brand`; the single getAutoura endpoint routes by it.
        void deliverBrief(briefRowId).catch((err) =>
          console.error('[concierge] autoura delivery worker error:', err),
        );
      } catch (err) {
        console.error('[concierge] autoura delivery kickoff threw:', err);
      }
    }

    return NextResponse.json({ complete: true, payload } satisfies BriefResponse);
  } catch (err) {
    console.error('[concierge] brief extraction failed:', err);
    return NextResponse.json({ error: 'brief_unavailable' }, { status: 500 });
  }
}
