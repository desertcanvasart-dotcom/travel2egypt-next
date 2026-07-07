/**
 * Gate 1 marker corpus regression test (Harness Layer 1).
 * Run: `npx tsx src/lib/__tests__/briefDetection.test.ts`
 *
 * WHY THIS EXISTS: Gate 1 is a deterministic substring match over phrases the
 * v4.1 prompt + Sonnet 4.6 happen to emit at wrap-up. Any prompt edit, model
 * upgrade, or plain model drift can silently stop the markers firing — briefs
 * stop flowing and nothing errors. This corpus freezes (a) real calibrated
 * wrap phrasings that MUST keep firing, (b) ordinary mid-conversation turns
 * that MUST NOT fire, and (c) structural invariants on the marker lists.
 *
 * The positive fixtures are grounded in the S4 live-verification wraps quoted
 * in briefDetection.ts's calibration comments. When v4.1 → v5, re-calibrate
 * against real wrap turns FIRST, then update both the markers and this corpus
 * (feedback rule: live testing arbitrates — do not guess-and-ship phrasings).
 */
import { detectBriefMarkers, EN_MARKERS, ES_MARKERS } from '../briefDetection';

let pass = 0;
let fail = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass++;
  else {
    fail++;
    console.log(
      `FAIL: ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`,
    );
  }
}

const withEmail = { email: 'visitor@example.com' };
const noEmail = { email: null };

// ── EN positive corpus — real S4-calibrated wrap turns (must keep firing) ────
const EN_WRAPS: string[] = [
  // The live EN wrap from S4 verification (three markers in one turn).
  "Perfect — I have everything I need. Your brief is on its way to the team, and they'll come back to you by 8 p.m. Cairo time today.",
  // v4.1 L567 phrasing.
  'Let me put together a proper brief for our team.',
  // v4.1 L223 contact-capture turn.
  'Before I pass this to our team, a few practical details.',
  // v4.1 L143 next-morning commitment (matches "the team" and "our team").
  'The team will come back to you by 10 a.m. Cairo time tomorrow morning.',
  // v4.2 calibration — real wrap from the 2026-07-07 v42-reconcile eval run
  // (en-luxury-cues): the commitment with "be" instead of "come", and the
  // Cairo-time figures restructured onto the cutoff rather than the promise.
  "The team will be back to you by this evening if you're reading this before 1 p.m. Cairo time, or first thing tomorrow morning if not.",
  // v4.2 calibration — real commitment recital (runs v42-reconcile + v42-rev2,
  // en-simple-transfer wrap): "Cairo time" rides the cutoff, not the promise.
  'Requests received before 1 p.m. Cairo time are answered the same day by 8 p.m. Since it\'s coming in now, the team will confirm timing when they respond.',
  // v4.2 calibration — real pass-to-team variant (run v42-rev2, en-multi-destination).
  "Almost there — just your partner's name and I'll get this to the team immediately.",
];
for (const [i, text] of EN_WRAPS.entries()) {
  eq(detectBriefMarkers(text, 'en', withEmail), true, `EN wrap #${i + 1} fires`);
}

// ── EN negative corpus — ordinary turns that must stay silent ────────────────
const EN_NON_WRAPS: string[] = [
  'Our Egyptologist guides are the best in Cairo — the team is based there year-round.',
  'Briefly: the Valley of the Kings opens at 6 a.m., so an early start matters.',
  'Could you share your email so the team can follow up with the details?',
  'The sound and light show at Giza starts at 8 p.m. in summer.',
  'For a proper visit you need at least three hours at the Egyptian Museum.',
];
for (const [i, text] of EN_NON_WRAPS.entries()) {
  eq(detectBriefMarkers(text, 'en', withEmail), false, `EN non-wrap #${i + 1} stays silent`);
}

// ── ES positive corpus — real S4-calibrated ES wraps ─────────────────────────
const ES_WRAPS: string[] = [
  'Antes de pasarle el encargo al equipo, un par de detalles prácticos.',
  'El equipo tiene todo lo que necesita y te responderá antes de las 10h, hora de El Cairo.',
  'Te responderemos hoy mismo, antes de las 8h, hora de El Cairo.',
];
for (const [i, text] of ES_WRAPS.entries()) {
  eq(detectBriefMarkers(text, 'es', withEmail), true, `ES wrap #${i + 1} fires`);
}

// ── ES negative corpus ────────────────────────────────────────────────────────
// KNOWN LIMITATION (documented, not asserted): 'antes de las 8' would also
// match a sentence like "¿prefieres visitar antes de las 8 de la mañana?" —
// the email gate plus wrap-stage context makes that acceptable today. If it
// starts firing panels early in live ES traffic, tighten the marker to include
// the Cairo-time phrase.
const ES_NON_WRAPS: string[] = [
  'El equipo de guías estará en Asuán toda la semana.',
  'Las pirámides abren a las 8 de la mañana, así que conviene madrugar.',
  'El encargado del hotel puede organizar el traslado al aeropuerto.',
];
for (const [i, text] of ES_NON_WRAPS.entries()) {
  eq(detectBriefMarkers(text, 'es', withEmail), false, `ES non-wrap #${i + 1} stays silent`);
}

// ── The email gate — a wrap without a captured email never fires ─────────────
eq(detectBriefMarkers(EN_WRAPS[0], 'en', noEmail), false, 'EN wrap without email → gated off');
eq(detectBriefMarkers(ES_WRAPS[0], 'es', noEmail), false, 'ES wrap without email → gated off');

// ── Locale routing — a wrap in the other language's phrasing is a MISS ───────
// This documents current behavior: locale selects ONE marker list. If the
// agent ever code-switches at wrap time (e.g. EN wrap inside an es session),
// Gate 1 misses. A fix would be to scan both lists; until then, this test
// makes the tradeoff visible instead of implicit.
eq(detectBriefMarkers(EN_WRAPS[0], 'es', withEmail), false, 'EN wrap under es locale → miss (documented)');
eq(detectBriefMarkers(ES_WRAPS[0], 'en', withEmail), false, 'ES wrap under en locale → miss (documented)');

// ── Case insensitivity ───────────────────────────────────────────────────────
eq(
  detectBriefMarkers('YOUR BRIEF IS ON ITS WAY TO THE TEAM.', 'en', withEmail),
  true,
  'uppercase wrap still fires (haystack lowercased)',
);

// ── Structural invariants on the marker lists ────────────────────────────────
// hasMarker() lowercases the haystack ONLY — an uppercase character in a
// marker makes that marker permanently dead. Guard the invariant.
for (const m of [...EN_MARKERS, ...ES_MARKERS]) {
  eq(m === m.toLowerCase(), true, `marker "${m}" is all-lowercase (never dead)`);
}

// Completeness: every marker, embedded mid-sentence, must fire the detector.
// Catches a future edit that renames/typos a marker into unreachability.
for (const m of EN_MARKERS) {
  eq(detectBriefMarkers(`Well — ${m}, as promised.`, 'en', withEmail), true, `EN marker "${m}" reachable`);
}
for (const m of ES_MARKERS) {
  eq(detectBriefMarkers(`Bien — ${m}, como prometido.`, 'es', withEmail), true, `ES marker "${m}" reachable`);
}

console.log(`\nbrief detection markers: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
