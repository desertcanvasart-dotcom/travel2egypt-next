/**
 * Concierge constants. Per the build brief these are CONSTANTS, not env:
 * the model string and cookie shape are stable; only tunables (rate-limit
 * thresholds, Session 7) get env overrides.
 */

/**
 * Pinned per brief S2. Current Anthropic model IDs are bare aliases — no
 * date suffix (the original brief's `claude-sonnet-4-5-20250929` was stale).
 * Verified against the Anthropic model catalog 2026-06-10. The S4
 * extraction call reuses this constant.
 */
export const CONCIERGE_MODEL = 'claude-sonnet-4-6';

/**
 * Per-response output ceiling. v4.1 responses are conversational prose —
 * a few paragraphs at most — so 2048 leaves generous headroom without
 * letting a runaway turn burn tokens. Conversation-level caps are S7.
 */
export const CONCIERGE_MAX_TOKENS = 2048;

export const SESSION_COOKIE_NAME = 't2e_session_id';

/** 30 days — locked decision; longer continuity is S4 email-resume. */
export const SESSION_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
