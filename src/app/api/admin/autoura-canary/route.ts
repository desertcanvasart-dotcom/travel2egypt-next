import { NextResponse, type NextRequest } from 'next/server';

import { toAutouraPayload } from '@/lib/concierge/autoura/payload';
import { buildSignedHeaders } from '@/lib/concierge/autoura/sign';
import { classifyOutcome, resolveDeliveryConfig } from '@/lib/concierge/autoura/stateMachine';
import type { AutouraTranscriptMessage } from '@/lib/concierge/autoura/types';
import { sendAutouraFailureAlert } from '@/lib/email/resend';
import type { BriefPayload } from '@/types/concierge';

/**
 * GET /api/admin/autoura-canary — scheduled dry-run contract probe (Harness L1).
 *
 * Sends ONE synthetic brief to the real Autoura receiver with
 * `X-Autoura-Dry-Run: true` (receiver verifies signature + validates payload,
 * writes NOTHING — the same mechanism S9 Phase 3 used for the keystone
 * verification). Purpose: catch contract drift — rotated/mismatched secret,
 * URL change, schema tightening — on a schedule, instead of on the next real
 * lead. A failed canary alerts the team inbox; a failed real brief would have
 * already cost a lead.
 *
 * Exercises the exact production path: `toAutouraPayload` for the wire shape
 * and `buildSignedHeaders` over the exact serialized bytes (sign-once
 * contract, see sign.ts). One attempt, no retries — this is a probe, not a
 * delivery; the next scheduled run is the retry.
 *
 * Protected by `Authorization: Bearer ${CRON_SECRET}` like /api/admin/digest.
 * Suggested Railway cron: weekly, e.g. "0 5 * * 1" (Mondays 07:00 Cairo).
 *
 * Defense in depth if the receiver ever ignores the dry-run header: the
 * conversation_id is a fixed canary UUID, so idempotency collapses repeats
 * into one row, and the brief_summary states it is synthetic.
 */
export const runtime = 'nodejs';

const DRY_RUN_HEADER = 'X-Autoura-Dry-Run';
/** Fixed, recognizable id — greppable in receiver logs, idempotent on repeats. */
const CANARY_CONVERSATION_ID = '00000000-0000-4000-8000-00000000c0de';
const CANARY_EMAIL = 'concierge@travel2egypt.org';
const POST_TIMEOUT_MS = 10_000;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function buildCanaryBrief(): BriefPayload {
  return {
    complete: true,
    visitor: {
      name: 'T2E Delivery Canary',
      email: CANARY_EMAIL,
      phone: null,
      preferred_contact: 'email',
      nationality: null,
      origin_city: null,
      timezone: 'Africa/Cairo',
    },
    trip: {
      travelers_count: 1,
      travelers_detail: null,
      dates_specific: null,
      dates_window: null,
      length_days: 1,
      international_flights: null,
      destinations: ['Cairo'],
    },
    preferences: { comfort_level: null, interests: [], must_see: [], must_avoid: [] },
    constraints: { dietary: null, mobility: null, religious: null, medical: null },
    brief_summary:
      'SYNTHETIC CANARY — scheduled dry-run contract probe from travel2egypt.org. Not a real lead; write nothing.',
    follow_up_window: null,
    routed_brand: 'travel2egypt',
    routing_reason: null,
  };
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[admin] /api/admin/autoura-canary invoked but CRON_SECRET unset');
    return NextResponse.json({ error: 'cron_secret_unset' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') ?? '';
  if (!timingSafeEqual(auth, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const config = resolveDeliveryConfig({
    url: process.env.AUTOURA_WEBHOOK_URL,
    secret: process.env.AUTOURA_WEBHOOK_SECRET,
  });
  if (!config) {
    // A canary exists to make silence loud: config missing in the deployed
    // env means EVERY real brief is currently falling back to email.
    await alertCanaryFailure('config_missing');
    return NextResponse.json({ ok: false, error: 'config_missing' }, { status: 503 });
  }

  const submittedAt = new Date().toISOString();
  const transcript: AutouraTranscriptMessage[] = [
    { role: 'user', content: '[canary] synthetic probe turn', timestamp: submittedAt },
    { role: 'assistant', content: '[canary] synthetic probe reply', timestamp: submittedAt },
  ];
  const payload = toAutouraPayload(buildCanaryBrief(), {
    sessionId: null,
    conversationId: CANARY_CONVERSATION_ID,
    submittedAt,
    promptVersion: 'canary',
    language: 'en',
    briefRevision: 1,
    isUpdate: false,
    // Canary probes the anchor tenant — the platform always accepts it.
    brand: 'travel2egypt',
  }, transcript);

  // Sign-once contract: these exact bytes are signed AND transmitted.
  const rawBody = JSON.stringify(payload);
  const headers = {
    ...buildSignedHeaders({
      secret: config.secret,
      rawBody,
      nowSeconds: Math.floor(Date.now() / 1000),
      requestId: crypto.randomUUID(),
    }),
    [DRY_RUN_HEADER]: 'true',
  };

  let httpStatus: number | null = null;
  let responseJson: unknown = null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers,
      body: rawBody,
      signal: controller.signal,
    });
    httpStatus = res.status;
    try {
      responseJson = await res.json();
    } catch {
      responseJson = null;
    }
  } catch (err) {
    console.error('[admin] autoura canary POST threw:', err);
    responseJson = { error: 'network_exception' };
  } finally {
    clearTimeout(timer);
  }

  const outcome = classifyOutcome(
    httpStatus == null ? { kind: 'network' } : { kind: 'http', status: httpStatus },
  );
  const ok = outcome === 'success';
  console.log(
    `[admin] autoura canary: ${ok ? 'OK' : 'FAILED'} status=${httpStatus} outcome=${outcome}`,
  );

  if (!ok) {
    await alertCanaryFailure(`canary_${outcome}_status_${httpStatus ?? 'network'}`);
  }

  return NextResponse.json(
    { ok, dryRun: true, httpStatus, outcome, response: responseJson },
    { status: ok ? 200 : 502 },
  );
}

async function alertCanaryFailure(reason: string): Promise<void> {
  try {
    await sendAutouraFailureAlert({
      sessionRef: 'canary',
      conversationId: CANARY_CONVERSATION_ID,
      briefRevision: 1,
      attempts: 1,
      reason,
      visitorEmail: CANARY_EMAIL,
      fallbackEmailed: false,
    });
  } catch (err) {
    console.error('[admin] autoura canary alert failed:', err);
  }
}
