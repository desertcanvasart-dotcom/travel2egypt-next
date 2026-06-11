import type { SupabaseClient } from '@supabase/supabase-js';

import type { ConciergeDatabase } from '@/types/concierge-db';

/**
 * Rate limiting (Session 7), backed by concierge.rate_limits.
 *
 * Fixed-window counters keyed by (subject, action, window bucket). One generic
 * counter serves four operations via the 0004 `action` column:
 *   • chat          — per-session soft (40 / 10 min → 30 s cooldown) AND
 *                     per-IP hard (100 / hr → 1 h block) share the same rows;
 *                     the IP check SUMs message_count by ip_hash.
 *   • brief         — Sonnet extraction, per-session (5 / hr).
 *   • resume_email  — Resend send, per-session (3 / hr, 5 / day).
 *   • escape_hatch  — Resend handoff, per-session (3 / hr, 5 / day).
 *
 * Thresholds are code defaults with optional env override (Appendix A — set
 * an env var only to deviate). Per-subject cleanup-on-write plus an occasional
 * global sweep keep the table from growing unbounded; a periodic cron sweep
 * can ride the CRON_SECRET admin job later (S10).
 *
 * Decisions are advisory-gated in the routes: a limited chat turn returns 429
 * BEFORE the Anthropic call; a limited expensive op returns 429 BEFORE the
 * Sonnet/Resend call. The raw IP never reaches this module — callers pass the
 * keyed ip_hash (see ipHash.ts).
 */

type Db = SupabaseClient<ConciergeDatabase, 'concierge'>;

export type LimitAction = 'chat' | 'brief' | 'resume_email' | 'escape_hatch';

/** Counter actions stored in rate_limits — the rate limits plus the abuse tally. */
type CounterAction = LimitAction | 'abuse';

/** Session terminates after this many abuse signals within the abuse window. */
export const ABUSE_TERMINATE_AT = envInt('RL_ABUSE_TERMINATE_AT', 3);
const ABUSE_WINDOW_MS = 24 * 60 * 60_000;

export interface LimitDecision {
  ok: boolean;
  /** Which dimension tripped — drives the client's soft vs. hard treatment. */
  scope?: 'session' | 'ip';
  /** Seconds the caller should wait before retrying (0 when ok). */
  retryAfterSeconds: number;
}

const OK: LimitDecision = { ok: true, retryAfterSeconds: 0 };

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Thresholds — code defaults, optional env override. */
export const LIMITS = {
  chatSession: {
    windowMs: envInt('RL_CHAT_SESSION_WINDOW_MIN', 10) * MIN,
    max: envInt('RL_CHAT_SESSION_MAX', 40),
    cooldownSec: envInt('RL_CHAT_SESSION_COOLDOWN_SEC', 30),
  },
  chatIp: {
    windowMs: HOUR,
    max: envInt('RL_CHAT_IP_MAX', 100),
    blockSec: 60 * 60,
  },
  brief: { windowMs: HOUR, max: envInt('RL_BRIEF_MAX', 5) },
  resume_email: {
    windowMs: HOUR,
    max: envInt('RL_RESUME_HOURLY_MAX', 3),
    dailyMax: envInt('RL_RESUME_DAILY_MAX', 5),
  },
  escape_hatch: {
    windowMs: HOUR,
    max: envInt('RL_ESCAPE_HOURLY_MAX', 3),
    dailyMax: envInt('RL_ESCAPE_DAILY_MAX', 5),
  },
} as const;

/**
 * Per-conversation token caps (Session 7). Measured as CONVERSATION CONTEXT
 * SIZE — the latest assistant turn's input_tokens (+ its output), which
 * already includes the full history + cached prompt. Soft → inject a wrap
 * nudge; hard → canned clean wrap instead of another Anthropic call.
 */
export const TOKEN_CAPS = {
  soft: envInt('RL_TOKEN_SOFT_CAP', 50_000),
  hard: envInt('RL_TOKEN_HARD_CAP', 75_000),
} as const;

function bucketStartIso(windowMs: number, now: number): string {
  return new Date(Math.floor(now / windowMs) * windowMs).toISOString();
}

interface RowState {
  id: string | null;
  count: number;
  blockedUntil: string | null;
}

/** The counter row for one (cookie_id, action) in the current window bucket. */
async function readBucket(
  db: Db,
  action: CounterAction,
  cookieId: string,
  windowStartIso: string,
): Promise<RowState> {
  const { data } = await db
    .from('rate_limits')
    .select('id, message_count, blocked_until')
    .eq('cookie_id', cookieId)
    .eq('action', action)
    .eq('window_start', windowStartIso)
    .maybeSingle();
  return {
    id: data?.id ?? null,
    count: data?.message_count ?? 0,
    blockedUntil: data?.blocked_until ?? null,
  };
}

/** Sum of a subject's counts across an action since a cutoff (IP hour / daily). */
async function sumSince(
  db: Db,
  column: 'cookie_id' | 'ip_hash',
  value: string,
  action: CounterAction,
  sinceMs: number,
): Promise<number> {
  const { data } = await db
    .from('rate_limits')
    .select('message_count')
    .eq(column, value)
    .eq('action', action)
    .gte('window_start', new Date(sinceMs).toISOString());
  return (data ?? []).reduce((sum, r) => sum + (r.message_count ?? 0), 0);
}

async function writeBucket(
  db: Db,
  action: CounterAction,
  cookieId: string,
  ipHash: string | null,
  windowStartIso: string,
  row: RowState,
  opts: { increment?: boolean; blockedUntil?: string },
): Promise<void> {
  if (row.id) {
    const patch: { message_count?: number; blocked_until?: string } = {};
    if (opts.increment) patch.message_count = row.count + 1;
    if (opts.blockedUntil !== undefined) patch.blocked_until = opts.blockedUntil;
    if (Object.keys(patch).length === 0) return;
    await db.from('rate_limits').update(patch).eq('id', row.id);
  } else {
    await db.from('rate_limits').insert({
      cookie_id: cookieId,
      action,
      ip_hash: ipHash,
      window_start: windowStartIso,
      message_count: opts.increment ? 1 : 0,
      ...(opts.blockedUntil !== undefined ? { blocked_until: opts.blockedUntil } : {}),
    });
  }
}

/**
 * Best-effort cleanup: drop this subject's stale rows (older than the longest
 * window + margin) on every write, plus an occasional global sweep for the
 * orphaned rows of one-time visitors who never return. Fire-and-forget — a
 * skipped sweep is reclaimed on the next call.
 */
function cleanup(db: Db, cookieId: string, now: number): void {
  const cutoff = new Date(now - 25 * HOUR).toISOString();
  void (async () => {
    try {
      await db.from('rate_limits').delete().eq('cookie_id', cookieId).lt('window_start', cutoff);
      if (Math.random() < 0.02) {
        await db.from('rate_limits').delete().lt('window_start', cutoff);
      }
    } catch {
      /* best-effort */
    }
  })();
}

/**
 * Chat-turn gate. Call after ensureSession, BEFORE the Anthropic call.
 * Evaluates the active session cooldown, the per-IP hard limit, then the
 * per-session soft limit; counts the message only when allowed.
 */
export async function enforceChat(
  db: Db,
  cookieId: string,
  ipHash: string | null,
): Promise<LimitDecision> {
  const now = Date.now();
  cleanup(db, cookieId, now);

  const { windowMs, max, cooldownSec } = LIMITS.chatSession;
  const windowStartIso = bucketStartIso(windowMs, now);
  const row = await readBucket(db, 'chat', cookieId, windowStartIso);

  // 1. Honor an active session cooldown.
  if (row.blockedUntil) {
    const until = Date.parse(row.blockedUntil);
    if (until > now) {
      return { ok: false, scope: 'session', retryAfterSeconds: Math.ceil((until - now) / 1000) };
    }
  }

  // 2. Per-IP hard limit (sum over the hour) — the cross-session backstop.
  if (ipHash) {
    const ipCount = await sumSince(db, 'ip_hash', ipHash, 'chat', now - LIMITS.chatIp.windowMs);
    if (ipCount >= LIMITS.chatIp.max) {
      return { ok: false, scope: 'ip', retryAfterSeconds: LIMITS.chatIp.blockSec };
    }
  }

  // 3. Per-session soft limit → 30 s cooldown (no increment while blocked).
  if (row.count >= max) {
    const blockedUntil = new Date(now + cooldownSec * 1000).toISOString();
    await writeBucket(db, 'chat', cookieId, ipHash, windowStartIso, row, { blockedUntil });
    return { ok: false, scope: 'session', retryAfterSeconds: cooldownSec };
  }

  // 4. Allowed — record it (carrying ip_hash for the per-IP sum).
  await writeBucket(db, 'chat', cookieId, ipHash, windowStartIso, row, { increment: true });
  return OK;
}

/**
 * Expensive-operation gate (brief extraction, resume email, escape-hatch
 * handoff). Call BEFORE the Sonnet/Resend call. Per-session hourly limit, plus
 * a per-session daily cap for the email actions. Counts the op only when
 * allowed.
 */
export async function enforceExpensive(
  db: Db,
  action: 'brief' | 'resume_email' | 'escape_hatch',
  cookieId: string,
): Promise<LimitDecision> {
  const now = Date.now();
  cleanup(db, cookieId, now);

  const cfg = LIMITS[action];
  const windowStartIso = bucketStartIso(cfg.windowMs, now);
  const row = await readBucket(db, action, cookieId, windowStartIso);

  // Hourly window.
  if (row.count >= cfg.max) {
    const resetMs = Date.parse(windowStartIso) + cfg.windowMs - now;
    return { ok: false, scope: 'session', retryAfterSeconds: Math.max(1, Math.ceil(resetMs / 1000)) };
  }

  // Daily cap (email actions only).
  if ('dailyMax' in cfg) {
    const daily = await sumSince(db, 'cookie_id', cookieId, action, now - DAY);
    if (daily >= cfg.dailyMax) {
      return { ok: false, scope: 'session', retryAfterSeconds: HOUR / 1000 };
    }
  }

  await writeBucket(db, action, cookieId, null, windowStartIso, row, { increment: true });
  return OK;
}

/**
 * Abuse-signal tally (Session 7). Stored as an `action='abuse'` counter on a
 * 24 h window — the same generic counter the rate limits use. Recording a
 * signal returns the running total so the route can terminate at
 * ABUSE_TERMINATE_AT; reading it (without recording) gates already-terminated
 * sessions at the start of each turn. Flag-only detection (abuseDetection.ts)
 * feeds this; the count is the only place "how many strikes" lives.
 */
export async function recordAbuseSignal(db: Db, cookieId: string): Promise<number> {
  const now = Date.now();
  const windowStartIso = bucketStartIso(ABUSE_WINDOW_MS, now);
  const row = await readBucket(db, 'abuse', cookieId, windowStartIso);
  await writeBucket(db, 'abuse', cookieId, null, windowStartIso, row, { increment: true });
  return row.count + 1;
}

/** Current abuse-signal total for the session within the 24 h window. */
export async function abuseSignalCount(db: Db, cookieId: string): Promise<number> {
  return sumSince(db, 'cookie_id', cookieId, 'abuse', Date.now() - ABUSE_WINDOW_MS);
}
