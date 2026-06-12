/**
 * Autoura delivery state-machine tests.
 * Run: `npx tsx src/lib/concierge/autoura/__tests__/stateMachine.test.ts`
 * Pure — classification, backoff schedule, transitions, config fail-closed.
 */
import {
  classifyOutcome,
  resolveDeliveryConfig,
  transition,
  MAX_ATTEMPTS,
  RETRY_BACKOFF_MS,
} from '../stateMachine';

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

// ── backoff schedule (locked: 1s/5s, 3 total sends) ─────────────────────────
eq(RETRY_BACKOFF_MS, [1000, 5000], 'backoff schedule is 1s/5s (no dead trailing value)');
eq(MAX_ATTEMPTS, 3, 'max attempts = initial + 2 retries = 3 sends');
eq(MAX_ATTEMPTS, RETRY_BACKOFF_MS.length + 1, 'constant and array tell the same story (no off-by-one)');

// ── classifyOutcome (receiver response contract §4) ─────────────────────────
eq(classifyOutcome({ kind: 'http', status: 200 }), 'success', '200 → success (updated/duplicate_ignored)');
eq(classifyOutcome({ kind: 'http', status: 201 }), 'success', '201 → success (received)');
eq(classifyOutcome({ kind: 'http', status: 204 }), 'success', '2xx boundary → success');
eq(classifyOutcome({ kind: 'http', status: 400 }), 'permanent', '400 bad JSON → permanent');
eq(classifyOutcome({ kind: 'http', status: 401 }), 'permanent', '401 signature → permanent');
eq(classifyOutcome({ kind: 'http', status: 409 }), 'permanent', '409 → permanent (no retry)');
eq(classifyOutcome({ kind: 'http', status: 422 }), 'permanent', '422 validation → permanent');
eq(classifyOutcome({ kind: 'http', status: 429 }), 'retry', '429 rate limited → retry');
eq(classifyOutcome({ kind: 'http', status: 500 }), 'retry', '500 → retry');
eq(classifyOutcome({ kind: 'http', status: 503 }), 'retry', '503 → retry');
eq(classifyOutcome({ kind: 'network' }), 'retry', 'network error / timeout → retry');

// ── transition: success / permanent terminal regardless of attempt ──────────
eq(transition('success', 1), { status: 'sent', retry: false, delayMs: null }, 'success → sent');
eq(transition('success', 4), { status: 'sent', retry: false, delayMs: null }, 'success late → sent');
eq(transition('permanent', 1), { status: 'failed', retry: false, delayMs: null }, 'permanent → failed, no retry');

// ── transition: retry path walks the backoff then exhausts after 3 sends ─────
eq(transition('retry', 1), { status: 'retried', retry: true, delayMs: 1000 }, 'retry after attempt 1 → wait 1s');
eq(transition('retry', 2), { status: 'retried', retry: true, delayMs: 5000 }, 'retry after attempt 2 → wait 5s');
eq(transition('retry', 3), { status: 'failed', retry: false, delayMs: null }, 'retry after attempt 3 → exhausted (3 sends), failed');

// ── resolveDeliveryConfig: fail-closed on missing url/secret ─────────────────
eq(
  resolveDeliveryConfig({ url: 'https://x/api/webhooks/concierge', secret: 's' }),
  { url: 'https://x/api/webhooks/concierge', secret: 's' },
  'both set → config',
);
eq(resolveDeliveryConfig({ url: undefined, secret: 's' }), null, 'missing url → null (fail closed)');
eq(resolveDeliveryConfig({ url: 'https://x', secret: undefined }), null, 'missing secret → null (fail closed)');
eq(resolveDeliveryConfig({ url: undefined, secret: undefined }), null, 'neither → null');
eq(resolveDeliveryConfig({ url: '', secret: 's' }), null, 'empty url → null (falsy)');

console.log(`\nautoura state machine: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
