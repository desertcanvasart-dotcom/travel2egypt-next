/**
 * Autoura delivery worker tests (offline integration).
 * Run: `npx tsx src/lib/concierge/autoura/__tests__/deliver.test.ts`
 *
 * Drives deliverBrief through fully-injected deps — no network, no DB, no
 * Resend — so the whole retry/fallback/idempotency machine is exercised
 * deterministically. Headline assertion: exactly THREE POSTs on permanent
 * failure, then the fallback fires once.
 */
import type { BriefPayload } from '@/types/concierge';

import { deliverBrief, type DeliverDeps, type DeliveryContext, type PersistPatch, type PostResult } from '../deliver';
import { signConciergePayload } from '../sign';

let pass = 0;
let fail = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL: ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  }
}

const SECRET = 'whsec_test';
const NOW = 1735732800;

const brief: BriefPayload = {
  complete: true,
  visitor: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: null,
    preferred_contact: 'email',
    nationality: 'American',
    origin_city: 'New York',
    timezone: 'America/New_York',
  },
  trip: {
    travelers_count: 2,
    travelers_detail: 'honeymoon',
    dates_specific: null,
    dates_window: 'Oct 2026',
    length_days: 10,
    international_flights: true,
    destinations: ['Cairo', 'Luxor'],
  },
  preferences: { comfort_level: 'international-5-star', interests: ['history'], must_see: [], must_avoid: [] },
  constraints: { dietary: null, mobility: null, religious: null, medical: null },
  brief_summary: 'A honeymoon.',
  follow_up_window: 'by 8 p.m. Cairo time',
  routed_brand: 'travel2egypt',
  routing_reason: null,
};

const context: DeliveryContext = {
  payload: brief,
  ctx: {
    sessionId: 'sess-1',
    conversationId: 'conv-abcdef12',
    submittedAt: '2026-06-08T08:00:00Z',
    promptVersion: 'v4.1',
    language: 'en',
    briefRevision: 1,
    isUpdate: false,
    brand: 'travel2egypt',
  },
  transcript: [{ role: 'user', content: 'hi', timestamp: '2026-06-08T07:50:00Z' }],
  sessionRef: 'conv-abc',
};

interface Recorded {
  posts: Array<{ url: string; headers: Record<string, string>; rawBody: string }>;
  persists: PersistPatch[];
  sleeps: number[];
  fallback: number;
  alert: number;
  markFallback: number;
}

function makeDeps(postImpl: (attempt: number) => PostResult): { deps: Partial<DeliverDeps>; calls: Recorded } {
  const calls: Recorded = { posts: [], persists: [], sleeps: [], fallback: 0, alert: 0, markFallback: 0 };
  let reqCounter = 0;
  const deps: Partial<DeliverDeps> = {
    loadContext: async () => context,
    persist: async (_id, patch) => {
      calls.persists.push(patch);
    },
    markFallbackSent: async () => {
      calls.markFallback += 1;
    },
    post: async (url, headers, rawBody) => {
      calls.posts.push({ url, headers, rawBody });
      return postImpl(calls.posts.length); // may throw → worker treats as network error
    },
    sleep: async (ms) => {
      calls.sleeps.push(ms);
    },
    nowSeconds: () => NOW,
    newRequestId: () => `req-${(reqCounter += 1)}`,
    sendFallback: async () => {
      calls.fallback += 1;
    },
    sendAlert: async () => {
      calls.alert += 1;
    },
    env: { url: 'https://staging.example/api/webhooks/concierge', secret: SECRET },
  };
  return { deps, calls };
}

function lastStatus(calls: Recorded): string | undefined {
  return calls.persists[calls.persists.length - 1]?.status;
}

async function main() {
// ── HEADLINE: permanent transient failure → exactly 3 POSTs, fallback once ──
{
  const { deps, calls } = makeDeps(() => ({ httpStatus: 500, responseJson: { error: 'boom' } }));
  await deliverBrief('b1', deps);
  eq(calls.posts.length, 3, 'HEADLINE: 500 always → exactly 3 POSTs');
  eq(calls.fallback, 1, 'HEADLINE: 500 always → fallback fires exactly once');
  eq(calls.alert, 1, '500 always → failure alert fires once');
  eq(calls.markFallback, 1, '500 always → email_fallback_sent marked once');
  eq(calls.sleeps, [1000, 5000], '500 always → backoff waited 1s then 5s (no third wait)');
  eq(calls.persists.map((p) => p.status), ['retried', 'retried', 'failed'], 'status walk: retried→retried→failed');
  // request id changes per attempt (a retry is distinguishable from the original)
  const ids = calls.posts.map((p) => p.headers['X-Request-Id']);
  eq(new Set(ids).size, 3, 'X-Request-Id is unique per attempt');
}

// ── happy path: 201 first → single POST, sent, no fallback ──────────────────
{
  const { deps, calls } = makeDeps(() => ({ httpStatus: 201, responseJson: { success: true, data: { brief_id: 'x' } } }));
  await deliverBrief('b2', deps);
  eq(calls.posts.length, 1, '201 → single POST');
  eq(calls.fallback, 0, '201 → no fallback');
  eq(lastStatus(calls), 'sent', '201 → status sent');
}

// ── recover on the 3rd send: 500,500,201 → 3 POSTs, sent, no fallback ───────
{
  const seq = [500, 500, 201];
  const { deps, calls } = makeDeps((n) => ({ httpStatus: seq[n - 1], responseJson: {} }));
  await deliverBrief('b3', deps);
  eq(calls.posts.length, 3, 'recover on 3rd → 3 POSTs');
  eq(calls.fallback, 0, 'recover → no fallback');
  eq(lastStatus(calls), 'sent', 'recover → sent');
}

// ── permanent 4xx: 422 → no retry, single POST, fallback ────────────────────
{
  const { deps, calls } = makeDeps(() => ({ httpStatus: 422, responseJson: { field: 'conversation_id' } }));
  await deliverBrief('b4', deps);
  eq(calls.posts.length, 1, '422 → no retry, single POST');
  eq(calls.fallback, 1, '422 → fallback once');
  eq(lastStatus(calls), 'failed', '422 → failed');
}

// ── config missing → no POST, straight to fallback (fail-closed) ────────────
{
  const { deps, calls } = makeDeps(() => ({ httpStatus: 201, responseJson: {} }));
  deps.env = { url: undefined, secret: undefined };
  await deliverBrief('b5', deps);
  eq(calls.posts.length, 0, 'config missing → no POST attempted');
  eq(calls.fallback, 1, 'config missing → fallback once');
  eq(calls.persists[0]?.status, 'failed', 'config missing → failed');
}

// ── network error always (post throws) → 3 POSTs, fallback ──────────────────
{
  const { deps, calls } = makeDeps(() => {
    throw new Error('ECONNREFUSED');
  });
  await deliverBrief('b6', deps);
  eq(calls.posts.length, 3, 'network error always → 3 POSTs');
  eq(calls.fallback, 1, 'network error → fallback once');
  eq(lastStatus(calls), 'failed', 'network error → failed');
}

// ── duplicate_ignored (200) is SUCCESS, never a fallback (idempotency) ──────
{
  const { deps, calls } = makeDeps(() => ({
    httpStatus: 200,
    responseJson: { success: true, data: { status: 'duplicate_ignored' } },
  }));
  await deliverBrief('b7', deps);
  eq(calls.posts.length, 1, 'duplicate_ignored → single POST');
  eq(calls.fallback, 0, 'duplicate_ignored → success, no fallback');
  eq(lastStatus(calls), 'sent', 'duplicate_ignored → sent');
}

// ── runtime signature integrity: signed over the EXACT transmitted bytes ────
{
  const { deps, calls } = makeDeps(() => ({ httpStatus: 201, responseJson: {} }));
  await deliverBrief('b8', deps);
  const sent = calls.posts[0];
  const tsHeader = sent.headers['X-Autoura-Timestamp'];
  const sigHeader = sent.headers['X-Autoura-Signature'];
  const v1 = sigHeader.split('v1=')[1];
  eq(sigHeader.startsWith(`t=${tsHeader},v1=`), true, 'signature header: t matches companion timestamp');
  eq(v1, signConciergePayload(SECRET, tsHeader, sent.rawBody), 'signature is over the EXACT posted bytes (serialize-once)');
  // idempotency key is on the wire
  const body = JSON.parse(sent.rawBody);
  eq(body.conversation_id, 'conv-abcdef12', 'idempotency: conversation_id on the wire');
  eq(body.brief_revision, 1, 'idempotency: brief_revision on the wire');
  // transform applied (spot-check one remapping survives serialization)
  eq(body.trip.trip_length_days, 10, 'transform on the wire: length_days → trip_length_days');
  eq(body.preferences.comfort_level, 'international-5-star', 'comfort_level verbatim on the wire');
}

// ── S13 multi-tenant pivot: brand rides top-level on the wire ───────────────
// The single getAutoura endpoint routes by the payload `brand` field (mapped to
// a tenant via concierge_brand_mappings) — there is no per-brand endpoint and
// no summary tag; the summary reaches the tenant untouched.
{
  const { deps, calls } = makeDeps(() => ({ httpStatus: 201, responseJson: {} }));
  deps.loadContext = async () => ({
    ...context,
    ctx: { ...context.ctx, brand: 'sillage' },
  });
  await deliverBrief('b9', deps);
  const sent = calls.posts[0];
  const body = JSON.parse(sent.rawBody);
  eq(body.brand, 'sillage', 'routed brand on the wire as the tenant routing key');
  eq(body.brief_summary, 'A honeymoon.', 'summary untouched — no [ROUTED] tag in the multi-tenant world');
  const sig = sent.headers['X-Autoura-Signature'].split('v1=')[1];
  eq(sig, signConciergePayload(SECRET, sent.headers['X-Autoura-Timestamp'], sent.rawBody), 'signature covers the brand-bearing bytes');
  eq(lastStatus(calls), 'sent', 'routed delivery sends');
}
{
  const { deps, calls } = makeDeps(() => ({ httpStatus: 201, responseJson: {} }));
  await deliverBrief('b10', deps);
  const body = JSON.parse(calls.posts[0].rawBody);
  eq(body.brand, 'travel2egypt', 'anchor brief carries the anchor brand key');
}

  console.log(`\nautoura deliver: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

void main();
