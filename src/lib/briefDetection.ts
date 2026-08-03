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
 * Each marker maps to wrap-up language (file/line cited). The prompt is
 * English-authored; the agent renders Spanish at runtime, so the ES markers
 * are translations of the same concepts and are CALIBRATED against real ES
 * wrap turns during verification (not guessed-and-shipped).
 * When the prompt changes: re-read its "WHEN TO WRAP" / contact-capture /
 * commitment language and update BOTH lists. Source:
 * travel-to-egypt-agent-system-prompt-v4.2.md.
 *
 * ── v4.2 PORTFOLIO-TRIAGE REVIEW (Session 13) ────────────────────────────
 * The v4.2 prompt edit TRIGGERED this review (per the locked-prompt
 * contract). Finding: the markers below remain VALID and were left
 * unchanged, because the v4.2 sub-brand handoff (READING DIRECTION) is
 * written to PRESERVE the two route-independent signals every wrap carries —
 * "a proper brief" AND the timed Cairo commitment ("by 8 p.m. cairo" /
 * "by 10 a.m. cairo", ES "hora de el cairo" / "antes de las 8|10"). Those
 * fire on a Travel2Egypt close AND on an AffordEgypt/Sawa/Sillage close, so
 * brief detection does not depend on the brand name appearing.
 * The brand-specific markers ("brief for our team", "team will come back to
 * you") MAY NOT fire when the close instead names a sister-brand team — that
 * is fine; the route-independent markers cover it.
 *
 * CALIBRATION GATE (founder's verification, not yet run): confirm the panel
 * fires on a REAL wrap for EACH route × EACH locale (8 cases) —
 * Travel2Egypt / AffordEgypt / Sawa / Sillage in EN and ES. If any real
 * sub-brand close drops BOTH "proper brief" AND the Cairo-time phrase,
 * recalibrate here the S6 way (add the observed phrasing), never by guessing.
 */

// EN — v4.1-grounded AND calibrated against a real EN wrap (S4 verification).
// The live wrap said "I have everything I need," "Your brief is on its way to
// the team," and "The team will come back to you" (not "our") — so markers
// are broadened from the literal prompt phrasings to match real output.
// Exported for the marker corpus regression test (src/lib/__tests__/) only.
export const EN_MARKERS: string[] = [
  'everything i need', //          live wrap "I have everything I need" (final signal)
  'brief is on its way', //        live wrap "Your brief is on its way to the team"
  // 2026-08-03 narrowing (run s13-final, bat-b-sillage-en turns 0-1): the
  // loose 'proper brief' / 'brief for our team' fired on ASPIRATIONAL
  // narration ("what a proper brief for our team would look like", "Once I
  // have that shape, I can put together a proper brief") turns before any
  // contact existed. Narrowed to the committed-action phrasing of the real
  // L567 wrap; the commitment-time markers below carry the rest.
  'let me put together a proper brief', // L567 "Let me put together a proper brief for our team"
  'pass this to our team', //      L223 "Before I pass this to our team, a few practical details"
  'before i pass this', //         L223 (variant)
  'team will come back to you', // L143 commitment turn (matches "the"/"our team")
  'team will be back to you', //   v4.2 calibration (2026-07-07 eval run v42-reconcile,
  //                               en-luxury-cues live wrap: "The team will be back to
  //                               you by this evening" — same commitment, "be" for "come")
  //                               v4.2 rev-3 (2026-07-17 s13-battery-rev3): the loose
  //                               'before 1 p.m. cairo' NARROWED to the two observed
  //                               wrap phrasings below. Evidence: en-no-email-decline
  //                               volunteered the SLA as a sales teaser ("if you reach
  //                               us before 1 p.m. Cairo time. No obligation") in a
  //                               respectful non-wrap answer — the loose phrase false-
  //                               fired. Both real wraps open with "requests".
  'requests received before 1 p.m. cairo', // "Requests received before 1 p.m. Cairo time
  //                               are answered the same day by 8 p.m." (bat-c-sawa-en)
  'requests in before 1 p.m. cairo', //       "requests in before 1 p.m. Cairo time get a
  //                               reply by 8 p.m. the same day" (bat-d-afford-en)
  'get this to the team', //       v4.2 calibration (run v42-rev2, 3 personas): "I'll
  //                               get this to the team immediately" — pass-to-team variant.
  'by 8 p.m. cairo', //            L143 same-day commitment ("answered the same day by 8 p.m.")
  'by 10 a.m. cairo', //           L143 next-morning commitment
  // 2026-08-03 calibration — the v4.2 routed close converts the commitment to
  // the TRAVELER'S timezone ("by 10 a.m. London time"), so the cairo-anchored
  // markers miss it; its wrap state-phrase is "Your brief is with them now"
  // (bat-b-sillage-en, run s13-final-pre2). Same family observed live in the
  // S11 revision wrap: "brief is with the team". Substring covers both.
  'brief is with', //              observed 2x live: "with them now" / "with the team"
];

// ES — CALIBRATED against real agent wraps (S4 verification, 2 live ES
// conversations to wrap). The agent's actual phrasing differed from the
// initial guesses: it says "pasarle el encargo al equipo" (not "informe"/
// "pasaré esto"), "el equipo tiene todo lo que necesita" (final wrap), and
// states the commitment as "antes de las 10h hora de El Cairo" (not
// "10 a. m."). Re-calibrate the same way if v4.1's Spanish rendering shifts.
// Exported for the marker corpus regression test (src/lib/__tests__/) only.
export const ES_MARKERS: string[] = [
  'pasarle el encargo', // narrowed 2026-08-03 (was 'el encargo al equipo': false-fired on the aspirational "lo incluimos en el encargo al equipo", bat-g-sillage-es turn 0) —                  "Antes de pasarle el encargo al equipo"
  'el equipo tiene todo lo que necesita', //  final-wrap, parallels EN "everything I need"
  'hora de el cairo', //                      the Cairo-time commitment (always present at final wrap)
  // 2026-08-03 narrowing (run s13-final, es-full-lead turn 1): bare
  // 'antes de las 10' fired on temple VISITING HOURS ("hay que visitarlos
  // temprano, antes de las 10") — the exact limitation the corpus had
  // documented. Anchored to the commitment's time formats.
  'antes de las 8h', //                       "antes de las 8h, hora de El Cairo"
  'antes de las 10h', //                      "antes de las 10h, hora de El Cairo"
  'antes de las 8 p.m', //                    "antes de las 8 p.m. — que en Madrid…" (s13 closes)
  'antes de las 10 a.m', //                   "antes de las 10 a.m. hora de El Cairo"
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
