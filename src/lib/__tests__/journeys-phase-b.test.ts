import assert from 'node:assert/strict';

import { PHASE_B, approvedB } from '../journeys/phaseB';
import { JOURNEY_KEYS } from '../journeys/registry';
import { PLACES } from '../places/coords';
import { firstTimeContent } from '../../components/journeys/firstTimeContent';

/**
 * Journey pages Phase B gating (2026-11-10): nothing renders until approved,
 * and an EN approval never leaks into ES/JA (they need their own text).
 */
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const original = clone(PHASE_B['first-time']);

const empty = (k: (typeof JOURNEY_KEYS)[number], l: 'en' | 'es' | 'ja') => {
  const b = approvedB(k, l);
  return !b.route && !b.daysLine && !b.experiences && b.essayImages.length === 0 && !b.pullQuote && !b.questions;
};

// Before approval (what ships): every journey, every locale renders nothing new.
const anyApproved = JSON.stringify(PHASE_B).includes('"needsReview":false');
if (!anyApproved) for (const k of JOURNEY_KEYS) for (const l of ['en', 'es', 'ja'] as const) assert.ok(empty(k, l), `${k}/${l} must render nothing before approval`);

// Approve every first-time item (in memory only).
const approve = (o: unknown): void => {
  if (Array.isArray(o)) return o.forEach(approve);
  if (o && typeof o === 'object') {
    if ('needsReview' in o) (o as { needsReview: boolean }).needsReview = false;
    Object.values(o).forEach(approve);
  }
};
approve(PHASE_B['first-time']);

const en = approvedB('first-time', 'en');
assert.ok(en.route && en.route.stops.length >= 2);
assert.ok(en.daysLine);
assert.equal(en.experiences?.items.length, 3);
assert.ok(en.pullQuote);
assert.ok((en.questions?.items.length ?? 0) >= 4 && (en.questions?.items.length ?? 0) <= 5);
// ES/JA have no text yet: still nothing, even with EN approved.
assert.ok(empty('first-time', 'es'));
assert.ok(empty('first-time', 'ja'));

// Content rules.
for (const q of PHASE_B['first-time'].questions) assert.ok((q.answer.en ?? '').split(/\s+/).length <= 80, `${q.id} answer over 80 words`);
for (const e of PHASE_B['first-time'].experiences) {
  assert.ok((e.title.en ?? '').split(/\s+/).length <= 6, `${e.id} title over 6 words`);
  assert.ok(e.image.width >= 1600, `${e.id} image under 1600px`);
}
for (const s of PHASE_B['first-time'].route?.stops ?? []) assert.ok(PLACES[s], `no coords for ${s}`);

// The pull quote is an exact essay sentence.
const essayText = firstTimeContent.en.essay.map((p) => (typeof p === 'string' ? p : p.map((s) => (typeof s === 'string' ? s : s.text)).join(''))).join(' ');
assert.ok(essayText.includes(PHASE_B['first-time'].pullQuote?.text.en ?? '∅'), 'pull quote not found verbatim in the essay');

Object.assign(PHASE_B['first-time'], original);
console.log('journeys-phase-b: ok');
