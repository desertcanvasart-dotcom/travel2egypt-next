/**
 * Autoura payload-transform tests.
 * Run: `npx tsx src/lib/concierge/autoura/__tests__/payload.test.ts`
 * Pure — verifies the five remappings, comfort_level verbatim, follow_up_window
 * derivation, and transcript/context passthrough.
 */
import type { BriefPayload } from '@/types/concierge';

import { buildFollowUpWindow, toAutouraPayload, type AutouraPayloadContext } from '../payload';
import type { AutouraTranscriptMessage } from '../types';

let pass = 0;
let fail = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL: ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  }
}

const brief: BriefPayload = {
  complete: true,
  visitor: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: null,
    preferred_contact: 'email',
    nationality: 'American', // → trip.nationality
    origin_city: 'New York', // → trip.origin_city
    timezone: 'America/New_York',
  },
  trip: {
    travelers_count: 2,
    travelers_detail: '2 adults, honeymoon',
    dates_specific: null,
    dates_window: 'Oct 2026, ~10 days',
    length_days: 10, // → trip.trip_length_days
    international_flights: true,
    destinations: ['Cairo', 'Luxor', 'Aswan'], // → preferences.destinations
  },
  preferences: {
    comfort_level: 'international-5-star', // verbatim, NOT normalized
    interests: ['history', 'food'],
    must_see: ['Abu Simbel'],
    must_avoid: ['crowded markets'],
  },
  constraints: { dietary: 'vegetarian', mobility: null, religious: null, medical: null },
  brief_summary: 'A 10-day deluxe history-and-food honeymoon.',
  follow_up_window: 'by 8 p.m. Cairo time',
};

const ctx: AutouraPayloadContext = {
  sessionId: 'sess-1',
  conversationId: 'conv-1',
  submittedAt: '2026-06-08T08:00:00Z', // 11:00 Cairo (EEST) → before 1pm → today 20:00 Cairo
  promptVersion: 'v4.1',
  language: 'en',
  briefRevision: 1,
  isUpdate: false,
};

const transcript: AutouraTranscriptMessage[] = [
  { role: 'assistant', content: 'Hi!', timestamp: '2026-06-08T07:50:00Z' },
  { role: 'user', content: 'Planning a honeymoon.', timestamp: '2026-06-08T07:51:00Z' },
];

const out = toAutouraPayload(brief, ctx, transcript);

// ── the five remappings ─────────────────────────────────────────────────────
eq(out.trip.nationality, 'American', '(1) visitor.nationality → trip.nationality');
eq(out.trip.origin_city, 'New York', '(2) visitor.origin_city → trip.origin_city');
eq(out.trip.trip_length_days, 10, '(3) trip.length_days → trip.trip_length_days');
eq(out.preferences.destinations, ['Cairo', 'Luxor', 'Aswan'], '(4) trip.destinations → preferences.destinations');
eq(typeof out.follow_up_window, 'object', '(5) follow_up_window string → object');

// visitor object carries ONLY Autoura's visitor fields (no nationality/origin_city leak)
eq(
  Object.keys(out.visitor).sort(),
  ['email', 'name', 'phone', 'preferred_contact', 'timezone'],
  'visitor object has no nationality/origin_city',
);

// ── comfort_level sent verbatim (the receiver-side mapping gap is reported, not patched) ──
eq(out.preferences.comfort_level, 'international-5-star', 'comfort_level passes through verbatim');

// ── follow_up_window derivation ─────────────────────────────────────────────
eq(out.follow_up_window?.cairo_time_label, 'by 8 p.m. Cairo time', 'cairo_time_label = verbatim string');
// committed_response_by is the concrete instant of "today 20:00 Cairo"; assert by
// reformatting back to Cairo wall time (robust to DST/ICU offset specifics).
const committed = out.follow_up_window?.committed_response_by ?? '';
eq(Number.isNaN(new Date(committed).getTime()), false, 'committed_response_by is a valid ISO instant');
eq(
  new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit' }).format(
    new Date(committed),
  ),
  '8:00 PM',
  'committed_response_by reconstructs to 20:00 Cairo (cutoff rule)',
);
eq(out.follow_up_window?.visitor_local_label != null, true, 'visitor_local_label derived when timezone present');

// ── context + passthrough ───────────────────────────────────────────────────
eq(out.session_id, 'sess-1', 'session_id');
eq(out.conversation_id, 'conv-1', 'conversation_id');
eq(out.submitted_at, '2026-06-08T08:00:00Z', 'submitted_at');
eq(out.prompt_version, 'v4.1', 'prompt_version');
eq(out.language, 'en', 'language');
eq(out.brief_revision, 1, 'brief_revision');
eq(out.is_update, false, 'is_update');
eq(out.full_transcript.length, 2, 'full_transcript inlined');
eq(out.brief_summary, 'A 10-day deluxe history-and-food honeymoon.', 'brief_summary passthrough');
eq(out.constraints.dietary, 'vegetarian', 'constraints passthrough');

// ── follow_up_window edge cases ─────────────────────────────────────────────
eq(
  buildFollowUpWindow(null, ctx.submittedAt, brief.visitor.timezone, 'en'),
  null,
  'no commitment (null label) → whole object null (never fabricate an SLA)',
);
eq(
  buildFollowUpWindow('by 8 p.m. Cairo time', 'not-a-date', 'America/New_York', 'en')?.committed_response_by,
  null,
  'invalid submitted_at → committed_response_by null, label still kept',
);
eq(
  buildFollowUpWindow('by 8 p.m. Cairo time', 'not-a-date', 'America/New_York', 'en')?.cairo_time_label,
  'by 8 p.m. Cairo time',
  'invalid submitted_at → cairo_time_label still present',
);
eq(
  buildFollowUpWindow('by 8 p.m. Cairo time', ctx.submittedAt, 'Not/AZone', 'en')?.visitor_local_label,
  null,
  'invalid timezone → visitor_local_label null (committed_response_by unaffected)',
);

console.log(`\nautoura payload: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
