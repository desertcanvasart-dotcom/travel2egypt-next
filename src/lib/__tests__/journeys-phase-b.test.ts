import assert from 'node:assert/strict';

import { PHASE_B, approvedB } from '../journeys/phaseB';
import { JOURNEY_KEYS, type JourneyKey } from '../journeys/registry';
import { PLACES } from '../places/coords';
import { firstTimeContent } from '../../components/journeys/firstTimeContent';
import { culturalTravellerContent } from '../../components/journeys/culturalTravellerContent';
import { familyContent } from '../../components/journeys/familyContent';
import { desertAndQuietContent } from '../../components/journeys/desertAndQuietContent';
import { travellingInStyleContent } from '../../components/journeys/travellingInStyleContent';
import { comingBackContent } from '../../components/journeys/comingBackContent';

/**
 * Journey pages Phase B gating (B1 2026-11-10, B2 2026-11-11): nothing renders
 * until approved, and an EN approval never leaks into ES/JA (they need their
 * own text). Content rules apply to every journey.
 */
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const LOCALES = ['en', 'es', 'ja'] as const;
const ESSAYS = {
  'first-time': firstTimeContent,
  cultural: culturalTravellerContent,
  family: familyContent,
  desert: desertAndQuietContent,
  style: travellingInStyleContent,
  'coming-back': comingBackContent,
} as const;

const empty = (k: JourneyKey, l: (typeof LOCALES)[number]) => {
  const b = approvedB(k, l);
  return !b.route && !b.daysLine && !b.experiences && b.essayImages.length === 0 && !b.pullQuote && !b.questions;
};

// Before approval (what ships): every journey, every locale renders nothing new.
const snapshot = JSON.stringify(PHASE_B);
const anyApproved = snapshot.includes('"needsReview":false');
if (!anyApproved) for (const k of JOURNEY_KEYS) for (const l of LOCALES) assert.ok(empty(k, l), `${k}/${l} must render nothing before approval`);

const approve = (o: unknown): void => {
  if (Array.isArray(o)) return o.forEach(approve);
  if (o && typeof o === 'object') {
    if ('needsReview' in o) (o as { needsReview: boolean }).needsReview = false;
    Object.values(o).forEach(approve);
  }
};

const essayText = (k: JourneyKey) =>
  ESSAYS[k].en.essay.map((p) => (typeof p === 'string' ? p : p.map((s) => (typeof s === 'string' ? s : s.text)).join(''))).join(' ');

for (const k of JOURNEY_KEYS) {
  const original = clone(PHASE_B[k]);
  const b = PHASE_B[k];
  const paragraphs = ESSAYS[k].en.essay.length;

  // Approve every item of this journey (in memory only).
  approve(b);
  const en = approvedB(k, 'en');
  if (b.route) assert.ok(en.route && en.route.stops.length >= 2, `${k}: route`);
  assert.ok(en.daysLine, `${k}: days line`);
  assert.equal(en.experiences?.items.length, 3, `${k}: three experiences`);
  assert.ok(en.pullQuote, `${k}: pull quote`);
  const nq = en.questions?.items.length ?? 0;
  assert.ok(nq >= (k === 'first-time' ? 4 : 3) && nq <= 5, `${k}: ${nq} questions`);
  // ES/JA have no text yet: still nothing, even with EN approved.
  assert.ok(empty(k, 'es'), `${k}/es leaks`);
  assert.ok(empty(k, 'ja'), `${k}/ja leaks`);

  // Content rules.
  for (const q of b.questions) {
    assert.ok((q.answer.en ?? '').split(/\s+/).length <= 80, `${k}/${q.id} answer over 80 words`);
    assert.ok(q.href.startsWith('/'), `${k}/${q.id} href`);
  }
  for (const e of b.experiences) {
    assert.ok((e.title.en ?? '').split(/\s+/).length <= 6, `${k}/${e.id} title over 6 words`);
    assert.ok(e.image.width >= 1600, `${k}/${e.id} image under 1600px`);
    assert.ok(e.href.startsWith('/'), `${k}/${e.id} href`);
  }
  for (const e of b.essayImages) {
    assert.ok(e.image.width >= 1600, `${k} essay image under 1600px`);
    assert.ok(e.afterParagraph >= 0 && e.afterParagraph < paragraphs, `${k} essay image after a missing paragraph`);
  }
  // Asset ids carry their own dimensions: keep width/height in step with them.
  for (const i of [...b.experiences.map((e) => e.image), ...b.essayImages.map((e) => e.image)]) {
    assert.ok(i.asset.includes(`-${i.width}x${i.height}-`), `${k}: ${i.asset} size mismatch`);
  }
  const ids = [...b.experiences.map((e) => e.id), ...b.questions.map((q) => q.id)];
  assert.equal(new Set(ids).size, ids.length, `${k}: duplicate ids`);
  for (const s of b.route?.stops ?? []) assert.ok(PLACES[s], `${k}: no coords for ${s}`);

  // The pull quote is an exact essay sentence, placed inside the essay.
  assert.ok(essayText(k).includes(b.pullQuote?.text.en ?? '∅'), `${k}: pull quote not found verbatim in the essay`);
  assert.ok((b.pullQuote?.afterParagraph ?? -1) < paragraphs, `${k}: pull quote after a missing paragraph`);

  Object.assign(PHASE_B[k], original);
}

// The approval pass above was in memory only and is fully undone.
assert.equal(JSON.stringify(PHASE_B), snapshot, 'approval leaked out of the test');

// B1 (First time) is untouched by B2.
assert.deepEqual(PHASE_B['first-time'].route?.stops, ['cairo', 'aswan', 'luxor', 'cairo']);
assert.equal(PHASE_B['first-time'].experiences.length, 3);
assert.equal(PHASE_B['first-time'].questions.length, 4);

console.log('journeys-phase-b: ok');
