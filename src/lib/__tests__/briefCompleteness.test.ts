/**
 * Gate-2 completeness enforcement (Harness — owner decisions 2026-07-03).
 * Run: `npx tsx src/lib/__tests__/briefCompleteness.test.ts`
 *
 * `passesCompletenessRule` enforces BOTH: the extraction prompt's rule 5
 * (trip substance required — the model marked contact-only transcripts
 * complete, 2/2 reps) AND the v4.1.1 contact policy (full name AND email
 * AND phone, "at both layers" per Islam — deliberately stricter than
 * rule 5's name-or-email). Pure, offline — live behavior is covered by the
 * eval extraction suite.
 */
import { passesCompletenessRule } from '../briefExtraction';
import type { BriefPayload } from '@/types/concierge';

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

/** Minimal empty payload; tests override the fields they exercise. */
function brief(overrides: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  destinations?: string[];
  dates_specific?: string | null;
  dates_window?: string | null;
  length_days?: number | null;
}): BriefPayload {
  return {
    complete: true,
    visitor: {
      name: overrides.name ?? null,
      email: overrides.email ?? null,
      phone: overrides.phone ?? null,
      preferred_contact: null,
      nationality: null,
      origin_city: null,
      timezone: null,
    },
    trip: {
      travelers_count: null,
      travelers_detail: null,
      dates_specific: overrides.dates_specific ?? null,
      dates_window: overrides.dates_window ?? null,
      length_days: overrides.length_days ?? null,
      international_flights: null,
      destinations: overrides.destinations ?? [],
    },
    preferences: { comfort_level: null, interests: [], must_see: [], must_avoid: [] },
    constraints: { dietary: null, mobility: null, religious: null, medical: null },
    brief_summary: null,
    routed_brand: 'travel2egypt',
    routing_reason: null,
    follow_up_window: null,
  };
}

const TRIO = { name: 'Ana Duarte', email: 'a@b.com', phone: '+351 912 555 034' };

// ── the original defect: contact with zero trip substance ───────────────────
eq(passesCompletenessRule(brief({ email: 'a@b.com' })), false, 'email only → fails');
eq(passesCompletenessRule(brief({ name: 'Mark' })), false, 'name only → fails');
eq(passesCompletenessRule(brief({ ...TRIO })), false, 'full trio, no trip → fails');

// ── trip substance without contact also fails ───────────────────────────────
eq(passesCompletenessRule(brief({ destinations: ['Luxor'] })), false, 'destination only → fails');
eq(passesCompletenessRule(brief({ length_days: 7 })), false, 'length only → fails');

// ── v4.1.1 contact trio: any missing member fails, even with substance ──────
eq(
  passesCompletenessRule(brief({ name: 'Ana', email: 'a@b.com', destinations: ['Cairo'] })),
  false,
  'missing phone → fails (v4.1.1, "at both layers")',
);
eq(
  passesCompletenessRule(brief({ name: 'Ana', phone: '+20 100 555', destinations: ['Cairo'] })),
  false,
  'missing email → fails',
);
eq(
  passesCompletenessRule(brief({ email: 'a@b.com', phone: '+20 100 555', destinations: ['Cairo'] })),
  false,
  'missing name → fails',
);

// ── each substance variant passes alongside the full trio ───────────────────
eq(
  passesCompletenessRule(brief({ ...TRIO, destinations: ['Cairo'] })),
  true,
  'trio + destination → passes',
);
eq(
  passesCompletenessRule(brief({ ...TRIO, dates_specific: '2026-03-01' })),
  true,
  'trio + specific date → passes',
);
eq(
  passesCompletenessRule(brief({ ...TRIO, dates_window: 'late October' })),
  true,
  'trio + dates window → passes',
);
eq(passesCompletenessRule(brief({ ...TRIO, length_days: 10 })), true, 'trio + length → passes');

console.log(`\nbrief completeness rule: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
