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
 * The prompt version stamped on each new conversation (conversations.
 * prompt_version — the DB default 'v4.1' remains as a fallback for rows
 * created outside the chat route). Bump this alongside any owner-approved
 * amendment in conciergePrompt.ts so briefs/exports attribute behavior to
 * the exact prompt that produced it.
 *  - v4.1.1 (2026-07-03): contact capture requires name + email + phone.
 */
export const CONCIERGE_PROMPT_VERSION = 'v4.1.1';

/**
 * Per-response output ceiling. v4.1 responses are conversational prose —
 * a few paragraphs at most — so 2048 leaves generous headroom without
 * letting a runaway turn burn tokens. Conversation-level caps are S7.
 */
export const CONCIERGE_MAX_TOKENS = 2048;

export const SESSION_COOKIE_NAME = 't2e_session_id';

/** 30 days — locked decision; longer continuity is S4 email-resume. */
export const SESSION_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * Team WhatsApp number (constant, not env — brief Appendix A). The single
 * source for every wa.me link: the S1 fallback, the chat error path, and the
 * S5 escape hatch.
 */
export const WHATSAPP_NUMBER = '201158011600';

/** wa.me URL with a prefilled, URL-encoded message. */
export function whatsappUrl(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Public team inbox (constant, not env) — the same address shown in the
 * footer and legal pages. Client-safe: used for the S8 data-export mailto
 * link. The server-side TEAM_INBOX_EMAIL env is a separate concern.
 */
export const PUBLIC_TEAM_EMAIL = 'info@travel2egypt.org';
