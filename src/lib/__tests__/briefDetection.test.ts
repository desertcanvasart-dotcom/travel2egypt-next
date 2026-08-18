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
  // v4.2 rev-3 (2026-07-17 s13-founder-battery, bat-d-afford-en): the cutoff
  // recited as "requests in before" — second observed wrap phrasing.
  'Same response window applies — requests in before 1 p.m. Cairo time get a reply by 8 p.m. the same day, which is 6 p.m. your time in Bristol.',
  // 2026-08-03 (run s13-final-pre2, bat-b-sillage-en): routed close converts
  // the commitment to the traveler's timezone — no Cairo mention at all; the
  // wrap state-phrase is "brief is with them now".
  "Your brief is with them now. Given your timezone, you'll hear back by 10 a.m. London time tomorrow morning at the latest — they work seven days.",
  // 2026-08-03 (S11 E2E live revision wrap): the terse revision-wrap variant.
  'No matter — brief is with the team. You will hear back within the timeframe I mentioned.',
  // 2026-08-03 (run s13-final-v3, bat-d-afford-en): singular "Request in".
  "The AffordEgypt team (affordegypt.com) will come back to you with specific pricing. Request in before 1 p.m. Cairo time means a response by 8 p.m. today — that's around 6 p.m. your time in Bristol.",
  // 2026-08-03 (run s13-final-v3, en-multi-destination): telegraphic close —
  // the commitment recital drops every prose marker; the address restatement
  // is the reliable signal.
  "Response commitment: The team will reach out at omar.farouk@example.net. Before 1 p.m. Cairo time — same day by 8 p.m. After 1 p.m. — following morning by 10 a.m.",
  // 2026-08-03 (run s13-cal3, en-multi-destination): the agent BOLDS the
  // commitment times — markdown emphasis must not break the marker match.
  'Omar, the team will have a proper proposal back to you by **8 p.m. Cairo time** the same day if your message arrives before 1 p.m. Cairo time — or by **10 a.m. the following morning** if after.',
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
  // v4.2 rev-3 (2026-07-17 s13-battery-rev3, en-no-email-decline): the SLA
  // volunteered as a no-obligation sales teaser in a contact-declined
  // conversation — this is NOT a wrap; the loose 'before 1 p.m. cairo'
  // marker false-fired on it and was narrowed to the requests-… variants.
  'When you are ready to get a proper proposal with specific pricing, we would turn this around the same day if you reach us before 1 p.m. Cairo time. No obligation before then.',
  // 2026-08-03 (run s13-final, bat-b-sillage-en turns 0-1): aspirational
  // brief-narration before any contact exists — the loose 'proper brief' /
  // 'brief for our team' fired here and were narrowed to the committed
  // "let me put together a proper brief".
  'That helps me understand what a proper brief for our team would look like, and whether the proposals you have already seen are actually structured correctly.',
  'Once I have that shape, I can put together a proper brief — and flag to the team the specific access arrangements to pursue alongside it.',
  // 2026-08-03 (run s13-final-v3, en-anniversary-couple): the close-stall turn
  // (a discipline violation, but correctly NOT a wrap for Gate 1).
  "Before I send this, two quick things still missing: Your wife's name — the team will want it for the booking. Once I have those I'll close the brief and give you the response timeframe.",
  // 2026-08-03 (run s13-final-v5, bat-b-sillage-en turn 1): conversational
  // acknowledgment — bare 'everything i need' false-fired; narrowed to
  // 'have everything i need'.
  "That tells me everything I need to know about the level you're operating at — and it maps directly to what you're describing at Giza.",
];

// 2026-08-03 (run s13-final-v7, bat-d-afford-en): the bare requests-cutoff
// variant — third member of the family (received/in/bare).
EN_WRAPS.push(
  'Their team will be in touch with a specific quote. Requests before 1 p.m. Cairo time are answered the same day by 8 p.m. — following morning by 10 a.m. if it lands after that.',
);
eq(detectBriefMarkers(EN_WRAPS[EN_WRAPS.length - 1], 'en', withEmail), true, 'EN wrap (bare requests-cutoff) fires');

// 2026-08-03 (run s13-final-v8, en-anniversary-couple): present-progressive
// send confirmation with the optional question after — discipline-correct
// close, fourth novel wrap paraphrase in four gates.
EN_WRAPS.push(
  "The brief is going to the team now. Before I send it complete, just your wife's name — and whether you'd like the team to suggest the Cairo/dahabiya split?",
);
eq(detectBriefMarkers(EN_WRAPS[EN_WRAPS.length - 1], 'en', withEmail), true, 'EN wrap (brief is going to the team) fires');
for (const [i, text] of EN_NON_WRAPS.entries()) {
  eq(detectBriefMarkers(text, 'en', withEmail), false, `EN non-wrap #${i + 1} stays silent`);
}

// ── ES positive corpus — real S4-calibrated ES wraps ─────────────────────────
const ES_WRAPS: string[] = [
  'Antes de pasarle el encargo al equipo, un par de detalles prácticos.',
  'El equipo tiene todo lo que necesita y te responderá antes de las 10h, hora de El Cairo.',
  'Te responderemos hoy mismo, antes de las 8h, hora de El Cairo.',
  // 2026-08-03 (run s13-final, es-full-lead turn 4): the real v4.2 ES close —
  // cutoff + both converted times.
  'Si la solicitud llega antes de la 1 p.m. hora de El Cairo, tendréis respuesta ese mismo día antes de las 8 p.m. — que en Madrid son las 7 p.m. Si llega después, a la mañana siguiente antes de las 10 a.m. hora de El Cairo.',
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
  // 2026-08-03 (run s13-final-pre2, bat-g-sillage-es turn 0): aspirational
  // mid-conversation mention of the future brief — NOT a wrap; the bare
  // 'el encargo al equipo' marker false-fired here and was narrowed to
  // 'pasarle el encargo'.
  'No son productos de catálogo; requieren coordinación anticipada. Si esto resuena, lo incluimos en el encargo al equipo.',
  // 2026-08-03 (run s13-final, es-full-lead turn 1): temple VISITING HOURS —
  // the documented 'antes de las 8|10' limitation observed live; markers
  // anchored to the commitment time formats (8h / 10h / 8 p.m / 10 a.m).
  'Los templos hay que visitarlos temprano, antes de las 10. ¿Eso os cuadra con vuestro ritmo de viaje?',
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
