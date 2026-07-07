/**
 * Autoura brief delivery worker (Session 9) — the IO orchestrator.
 *
 * `deliverBrief(briefId)` is fired-and-forgotten by `/api/brief` after the
 * briefs row is persisted; the visitor's completion panel never waits on it
 * (Railway's persistent Node process lets the work outlive the response —
 * this would NOT survive serverless). It is also the unit the startup
 * reconciler re-runs for stuck rows.
 *
 * Contract honored here:
 *  - NEVER throws to the caller. Every external effect is wrapped; a failure
 *    degrades to the email fallback, never a crash or a 500.
 *  - Fail-closed on config: missing AUTOURA_WEBHOOK_URL/secret → status 'failed'
 *    + fallback, no POST attempted.
 *  - 3 total sends (initial + 2 retries, 1s/5s) on transient failure, then
 *    fallback. Permanent (4xx) → fallback immediately.
 *  - Idempotent: every send carries (conversation_id, brief_revision); a replay
 *    after a successful-but-unacked receipt resolves to the receiver's
 *    duplicate_ignored (a 2xx) = success. So retries/reconciliation never
 *    double-create downstream.
 *
 * Every external dependency is injectable (`DeliverDeps`) so the whole worker
 * is exercised offline by the unit test against a local mock — no network, no
 * DB, no Resend.
 */
import { conciergeDb } from '@/lib/supabase/server';
import { sendAutouraBriefFallback, sendAutouraFailureAlert } from '@/lib/email/resend';
import type { BriefPayload } from '@/types/concierge';

import { toAutouraPayload, type AutouraPayloadContext } from './payload';
import { buildSignedHeaders } from './sign';
import {
  classifyOutcome,
  resolveDeliveryConfig,
  transition,
  type DeliveryOutcome,
  type WebhookStatus,
} from './stateMachine';
import type { AutouraBriefPayload, AutouraTranscriptMessage } from './types';

/** Everything the worker needs about one brief, loaded once up front. */
export interface DeliveryContext {
  payload: BriefPayload;
  ctx: AutouraPayloadContext;
  transcript: AutouraTranscriptMessage[];
  /** Short ref for email subjects / Gmail filtering. */
  sessionRef: string;
}

export interface PostResult {
  /** HTTP status, or null when the request never completed (network/timeout). */
  httpStatus: number | null;
  /** Parsed response body (stored verbatim), or null. */
  responseJson: unknown;
}

export interface PersistPatch {
  status: WebhookStatus;
  attempts: number;
  response: unknown;
}

export interface DeliverDeps {
  loadContext(briefId: string): Promise<DeliveryContext | null>;
  persist(briefId: string, patch: PersistPatch): Promise<void>;
  markFallbackSent(briefId: string): Promise<void>;
  post(url: string, headers: Record<string, string>, rawBody: string): Promise<PostResult>;
  sleep(ms: number): Promise<void>;
  nowSeconds(): number;
  newRequestId(): string;
  sendFallback(c: DeliveryContext, payload: AutouraBriefPayload): Promise<void>;
  sendAlert(c: DeliveryContext, reason: string, attempts: number, payload: AutouraBriefPayload): Promise<void>;
  env: { url: string | undefined; secret: string | undefined; routingTag?: string };
}

/** Run an effect, swallowing+logging any throw — the worker stays best-effort. */
async function safe(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`[concierge] autoura ${label} failed:`, err);
  }
}

async function fireFallback(
  briefId: string,
  c: DeliveryContext,
  payload: AutouraBriefPayload,
  deps: DeliverDeps,
  reason: string,
  attempts: number,
): Promise<void> {
  await safe('fallback email', () => deps.sendFallback(c, payload));
  await safe('failure alert', () => deps.sendAlert(c, reason, attempts, payload));
  await safe('mark fallback sent', () => deps.markFallbackSent(briefId));
}

/**
 * Deliver one brief. Resolves when the attempt sequence is settled (sent, or
 * failed-with-fallback). Never rejects.
 */
export async function deliverBrief(
  briefId: string,
  depsOverride?: Partial<DeliverDeps>,
): Promise<void> {
  const deps: DeliverDeps = { ...buildDefaultDeps(), ...depsOverride };

  let context: DeliveryContext | null = null;
  try {
    context = await deps.loadContext(briefId);
  } catch (err) {
    console.error('[concierge] autoura loadContext failed:', err);
    return; // can't load → nothing to do; reconciler will retry on next boot
  }
  if (!context) return; // already gone / not found

  const payload = toAutouraPayload(context.payload, context.ctx, context.transcript);

  // Anchor-fallback routing tag (see BrandEnv.routingTag): a sub-brand brief
  // arriving in the shared Travel2Egypt inbox announces its routing in the
  // summary, since the wire payload carries no brand field. Applied BEFORE
  // serialization so the HMAC covers the transmitted bytes.
  if (deps.env.routingTag) {
    payload.brief_summary = payload.brief_summary
      ? `[ROUTED: ${deps.env.routingTag}] ${payload.brief_summary}`
      : `[ROUTED: ${deps.env.routingTag}]`;
  }

  // ── SERIALIZE ONCE ────────────────────────────────────────────────────────
  // `rawBody` is the single source of truth for both the signature AND the POST
  // body. The HMAC is computed over these exact bytes and these exact bytes are
  // transmitted. DO NOT re-stringify, pretty-print, or pass an object body to
  // fetch between here and the send — any re-serialization changes the bytes and
  // the receiver will 401. This invariant is what makes the keystone test hold
  // at runtime. (sign.ts repeats this warning at the signer.)
  const rawBody = JSON.stringify(payload);

  const config = resolveDeliveryConfig(deps.env);
  if (!config) {
    // Fail-closed: no URL/secret → terminal, straight to fallback. No POST.
    await safe('persist (config missing)', () =>
      deps.persist(briefId, { status: 'failed', attempts: 0, response: { error: 'config_missing' } }),
    );
    await fireFallback(briefId, context, payload, deps, 'config_missing', 0);
    return;
  }

  let attemptsMade = 0;
  let lastResponse: unknown = null;

  for (;;) {
    attemptsMade += 1;
    const headers = buildSignedHeaders({
      secret: config.secret,
      rawBody,
      nowSeconds: deps.nowSeconds(),
      requestId: deps.newRequestId(), // new per HTTP attempt — distinguishes a retry
    });

    let outcome: DeliveryOutcome;
    try {
      const res = await deps.post(config.url, headers, rawBody);
      lastResponse = res.responseJson;
      outcome = res.httpStatus == null ? { kind: 'network' } : { kind: 'http', status: res.httpStatus };
    } catch (err) {
      console.error('[concierge] autoura POST threw:', err);
      lastResponse = { error: 'network_exception' };
      outcome = { kind: 'network' };
    }

    const t = transition(classifyOutcome(outcome), attemptsMade);
    await safe('persist attempt', () =>
      deps.persist(briefId, { status: t.status, attempts: attemptsMade, response: lastResponse }),
    );

    if (!t.retry) {
      if (t.status === 'failed') {
        await fireFallback(briefId, context, payload, deps, 'delivery_failed', attemptsMade);
      }
      return;
    }

    if (t.delayMs) await deps.sleep(t.delayMs);
  }
}

// ── default (production) dependencies ───────────────────────────────────────

function buildDefaultDeps(): DeliverDeps {
  return {
    loadContext: loadDeliveryContext,
    persist: persistDelivery,
    markFallbackSent: async (briefId) => {
      await conciergeDb().from('briefs').update({ email_fallback_sent: true }).eq('id', briefId);
    },
    post: defaultPost,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    nowSeconds: () => Math.floor(Date.now() / 1000),
    newRequestId: () => crypto.randomUUID(),
    sendFallback: (c, payload) => sendAutouraBriefFallback({ sessionRef: c.sessionRef, payload }),
    sendAlert: (c, reason, attempts, payload) =>
      sendAutouraFailureAlert({
        sessionRef: c.sessionRef,
        conversationId: c.ctx.conversationId,
        briefRevision: c.ctx.briefRevision,
        attempts,
        reason,
        visitorEmail: payload.visitor.email,
        fallbackEmailed: true,
      }),
    env: {
      url: process.env.AUTOURA_WEBHOOK_URL,
      secret: process.env.AUTOURA_WEBHOOK_SECRET,
    },
  };
}

const POST_TIMEOUT_MS = 10_000;

async function defaultPost(
  url: string,
  headers: Record<string, string>,
  rawBody: string,
): Promise<PostResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'POST', headers, body: rawBody, signal: controller.signal });
    let responseJson: unknown = null;
    try {
      responseJson = await res.json();
    } catch {
      responseJson = null; // non-JSON / empty body — status still classifies the outcome
    }
    return { httpStatus: res.status, responseJson };
  } finally {
    clearTimeout(timer);
  }
}

async function persistDelivery(briefId: string, patch: PersistPatch): Promise<void> {
  await conciergeDb()
    .from('briefs')
    .update({
      autoura_webhook_status: patch.status,
      autoura_attempts: patch.attempts,
      autoura_webhook_response: patch.response as never,
    })
    .eq('id', briefId);
}

/**
 * Load + assemble everything for one brief from the system of record. Reads the
 * briefs row, its conversation (session/prompt/timestamp), the session (locale),
 * and the transcript. Returns null if the brief or conversation is gone.
 */
async function loadDeliveryContext(briefId: string): Promise<DeliveryContext | null> {
  const db = conciergeDb();

  const { data: brief } = await db
    .from('briefs')
    .select('id, conversation_id, payload, brief_revision, created_at')
    .eq('id', briefId)
    .maybeSingle();
  if (!brief) return null;

  const { data: conversation } = await db
    .from('conversations')
    .select('id, session_id, prompt_version, brief_completed_at')
    .eq('id', brief.conversation_id)
    .maybeSingle();
  if (!conversation) return null;

  let locale: 'en' | 'es' = 'en';
  if (conversation.session_id) {
    const { data: session } = await db
      .from('sessions')
      .select('locale')
      .eq('id', conversation.session_id)
      .maybeSingle();
    if (session?.locale === 'es') locale = 'es';
  }

  const { data: messages } = await db
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', brief.conversation_id)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: true });

  const transcript: AutouraTranscriptMessage[] = (messages ?? []).map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.created_at,
  }));

  const briefRevision = brief.brief_revision ?? 1;

  return {
    payload: brief.payload as unknown as BriefPayload,
    transcript,
    sessionRef: brief.conversation_id.slice(0, 8),
    ctx: {
      sessionId: conversation.session_id,
      conversationId: brief.conversation_id,
      submittedAt: conversation.brief_completed_at ?? brief.created_at,
      promptVersion: conversation.prompt_version,
      language: locale,
      briefRevision,
      isUpdate: briefRevision > 1,
    },
  };
}
