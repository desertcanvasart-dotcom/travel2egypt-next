import type { ConciergeSession } from '@/lib/concierge/session';

/**
 * Gate 1 of two-gate brief detection (Session 4). Cheap, runs on every
 * assistant turn in the chat route. Returns true ONLY when both hold:
 *   1. the assistant's latest message contains a wrap-up/handoff marker, AND
 *   2. an email is captured on the session (sessions.email).
 * When true, the client fetches /api/brief, where Gate 2 (the Sonnet
 * extraction call) authoritatively confirms a brief can be assembled.
 *
 * Conservative by design: the email requirement means a stray marker phrase
 * mid-conversation can't fire the panel on its own. Gate 1 stays STATELESS —
 * suppression after a Gate-2 rejection is handled client-side.
 *
 * ── MARKER MAINTENANCE ──────────────────────────────────────────────────
 * Each marker maps to v4.1 wrap-up language (file/line cited). The v4.1
 * prompt is LOCKED and English-only; the agent renders Spanish at runtime,
 * so the ES markers are translations of the same concepts and are CALIBRATED
 * against real ES wrap turns during verification (not guessed-and-shipped).
 * When v4.1 → v5: re-read the prompt's "WHEN TO WRAP" / contact-capture /
 * commitment language and update BOTH lists. Source:
 * travel-to-egypt-agent-system-prompt-v4.1.md.
 */

// EN — v4.1-grounded AND calibrated against a real EN wrap (S4 verification).
// The live wrap said "I have everything I need," "Your brief is on its way to
// the team," and "The team will come back to you" (not "our") — so markers
// are broadened from the literal prompt phrasings to match real output.
const EN_MARKERS: string[] = [
  'everything i need', //          live wrap "I have everything I need" (final signal)
  'brief is on its way', //        live wrap "Your brief is on its way to the team"
  'brief for our team', //         L567 "Let me put together a proper brief for our team"
  'proper brief', //               L567 (variant phrasing)
  'pass this to our team', //      L223 "Before I pass this to our team, a few practical details"
  'before i pass this', //         L223 (variant)
  'team will come back to you', // L143 commitment turn (matches "the"/"our team")
  'by 8 p.m. cairo', //            L143 same-day commitment ("answered the same day by 8 p.m.")
  'by 10 a.m. cairo', //           L143 next-morning commitment
];

// ES — CALIBRATED against real agent wraps (S4 verification, 2 live ES
// conversations to wrap). The agent's actual phrasing differed from the
// initial guesses: it says "pasarle el encargo al equipo" (not "informe"/
// "pasaré esto"), "el equipo tiene todo lo que necesita" (final wrap), and
// states the commitment as "antes de las 10h hora de El Cairo" (not
// "10 a. m."). Re-calibrate the same way if v4.1's Spanish rendering shifts.
const ES_MARKERS: string[] = [
  'el encargo al equipo', //                  "Antes de pasarle el encargo al equipo"
  'el equipo tiene todo lo que necesita', //  final-wrap, parallels EN "everything I need"
  'hora de el cairo', //                      the Cairo-time commitment (always present at final wrap)
  'antes de las 8', //                        "antes de las 8h" same-day commitment
  'antes de las 10', //                       "antes de las 10h" next-morning commitment
];

function hasMarker(text: string, markers: string[]): boolean {
  const haystack = text.toLowerCase();
  return markers.some((m) => haystack.includes(m));
}

export function detectBriefMarkers(
  assistantText: string,
  locale: string,
  session: Pick<ConciergeSession, 'email'>,
): boolean {
  if (!session.email) return false;
  const markers = locale === 'es' ? ES_MARKERS : EN_MARKERS;
  return hasMarker(assistantText, markers);
}
