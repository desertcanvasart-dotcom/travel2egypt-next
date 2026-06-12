/**
 * Delivery state machine for the Autoura brief webhook (Session 9) — PURE.
 *
 * No network, no DB, no clock: this module only decides, given an attempt
 * outcome, what the next `briefs.autoura_webhook_status` should be and whether
 * to retry (and after how long). `deliver.ts` owns the IO and drives this.
 *
 * Status values are constrained to the existing CHECK on
 * `concierge.briefs.autoura_webhook_status` — ('pending','sent','failed',
 * 'retried') — so S9 adds NO status migration. The encoding (approved Phase 0):
 *   pending  — row created, not yet attempted (DB default)
 *   retried  — an attempt failed retryably; another is scheduled
 *   sent     — delivered (HTTP 2xx, including the receiver's idempotent
 *              "duplicate_ignored" / "older_revision_filed" — those ARE success)
 *   failed   — terminal: a non-retryable response, or retries exhausted, or
 *              config missing. Pair with `email_fallback_sent` to distinguish
 *              "failed but team emailed" from "failed, team blind" (S10 renders
 *              this; never inferred from email logs).
 *
 * Retry policy is the receiver's contract (§4): 5xx/429 and network errors are
 * transient → retry; 4xx (400/401/422, and 409 if ever used) are permanent →
 * no retry. Backoff is the locked schedule: THREE total sends (initial + 2
 * retries) with waits 1s then 5s, then fallback. The fourth attempt was
 * deliberately dropped (Phase 1 decision): the email fallback is a fully
 * honored delivery, not a degraded one, so a faster path to looping in a human
 * on a persistent outage beats squeezing one more POST. The array length and
 * MAX_ATTEMPTS must keep telling the same story — no dead trailing value.
 */

export type WebhookStatus = 'pending' | 'sent' | 'failed' | 'retried';

/** Delays (ms) BEFORE retry attempts 2 and 3. Initial attempt is immediate. */
export const RETRY_BACKOFF_MS = [1000, 5000] as const;

/** Initial attempt + one per backoff delay = 3 total sends before fallback. */
export const MAX_ATTEMPTS = RETRY_BACKOFF_MS.length + 1; // 3

/** What a single attempt produced. `network` = fetch threw / timed out. */
export type DeliveryOutcome =
  | { kind: 'http'; status: number }
  | { kind: 'network' };

export type OutcomeClass = 'success' | 'retry' | 'permanent';

/**
 * Classify one attempt's outcome against the receiver's response contract.
 * 2xx → success (the body's status label — received/updated/duplicate_ignored
 * /older_revision_filed — is all success). 429 + 5xx + network → retry.
 * Everything else (4xx) → permanent.
 */
export function classifyOutcome(outcome: DeliveryOutcome): OutcomeClass {
  if (outcome.kind === 'network') return 'retry';
  const { status } = outcome;
  if (status >= 200 && status < 300) return 'success';
  if (status === 429 || status >= 500) return 'retry';
  return 'permanent';
}

export interface Transition {
  /** Status to persist after this attempt. */
  status: WebhookStatus;
  /** Whether a further attempt should be scheduled. */
  retry: boolean;
  /** Delay before that retry, or null when not retrying. */
  delayMs: number | null;
}

/**
 * Decide the next state. `attemptsMade` is 1-based and counts the attempt that
 * just produced `cls` (so 1 = the initial send). When a retry is due, the delay
 * is the backoff for the upcoming attempt.
 */
export function transition(cls: OutcomeClass, attemptsMade: number): Transition {
  if (cls === 'success') return { status: 'sent', retry: false, delayMs: null };
  if (cls === 'permanent') return { status: 'failed', retry: false, delayMs: null };

  // retryable
  if (attemptsMade < MAX_ATTEMPTS) {
    // attemptsMade=1 → backoff[0]=1s before attempt 2, etc.
    return { status: 'retried', retry: true, delayMs: RETRY_BACKOFF_MS[attemptsMade - 1] };
  }
  // retries exhausted
  return { status: 'failed', retry: false, delayMs: null };
}

export interface DeliveryConfig {
  url: string;
  secret: string;
}

/**
 * Resolve the delivery config, fail-closed. Missing URL or secret → null, which
 * `deliver.ts` treats as a terminal config failure (status 'failed' + email
 * fallback), never a throw or a 500 — same best-effort posture the brief
 * mandates (cf. IP_HASH_SECRET). Pure: env is passed in, not read here.
 */
export function resolveDeliveryConfig(env: {
  url: string | undefined;
  secret: string | undefined;
}): DeliveryConfig | null {
  if (env.url && env.secret) return { url: env.url, secret: env.secret };
  return null;
}
