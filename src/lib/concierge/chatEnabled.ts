/**
 * The circuit breaker, readable. Server-side ONLY — CHAT_ENABLED must never
 * become NEXT_PUBLIC_ (it would inline at build time and kill runtime
 * toggling). Server-component parents of ConciergeCTA call this and pass
 * `chatEnabled` down as a prop; /plan-your-tour reads it directly.
 * One lever: the chat surface AND every CTA destination flip together.
 */
export function isChatEnabled(): boolean {
  return process.env.CHAT_ENABLED === 'true';
}
