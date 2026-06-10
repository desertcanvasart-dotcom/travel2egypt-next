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

// EN — grounded in v4.1 (approved S4).
const EN_MARKERS: string[] = [
  'brief for our team', //         L567 "Let me put together a proper brief for our team"
  'proper brief', //               L567 (variant phrasing)
  'pass this to our team', //      L223 "Before I pass this to our team, a few practical details"
  'before i pass this', //         L223 (variant)
  'our team will come back to you', // L143 commitment turn
  'by 8 p.m. cairo', //            L143 same-day commitment ("answered the same day by 8 p.m.")
  'by 10 a.m. cairo', //           L143 next-morning commitment
];

// ES — conceptual translations of the same v4.1 wrap language. CALIBRATE
// against real ES wrap turns in verification before treating as final.
const ES_MARKERS: string[] = [
  'un informe para nuestro equipo', // ≈ "brief for our team"
  'un resumen para nuestro equipo', // ≈ alt rendering of "brief"
  'pasaré esto a nuestro equipo', //   ≈ "pass this to our team"
  'antes de pasar esto', //            ≈ "before I pass this"
  'nuestro equipo se pondrá en contacto', // ≈ "our team will come back to you"
  'antes de las 8 p. m.', //           ≈ "by 8 p.m. Cairo"
  'antes de las 10 a. m.', //          ≈ "by 10 a.m. Cairo"
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
