/**
 * briefDetection — SESSION 4 IMPLEMENTS THIS. Session 3 ships the surface:
 * the chat route calls gate 1 after every completed assistant message and
 * forwards the result on the SSE `done` event as `briefDetected`.
 *
 * The real implementation is the locked two-gate design:
 *   Gate 1 (here): cheap heuristics — a maintained EN+ES handoff-marker
 *     list checked against the assistant text, AND a captured email on the
 *     session. Each marker must be annotated with its v4.1 source line;
 *     whoever updates the prompt to v5 also reviews this list.
 *   Gate 2 (S4, lib/briefExtraction.ts): a non-streaming extraction call
 *     confirms a minimum brief is assemblable before the panel fires.
 *
 * Until S4, this is a hard false — the UI slot stays dormant.
 */
export function detectBriefMarkers(_assistantText: string, _locale: string): boolean {
  return false;
}
