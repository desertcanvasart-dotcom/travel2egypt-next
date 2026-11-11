/**
 * Booking cut-off (2026-11-11, owner set 14 days): unbooked departures stop being offered
 * DEPARTURE_CUTOFF_DAYS (14) before their start; booked ones stay until they start.
 * Run: npx tsx src/lib/__tests__/departure-cutoff.test.ts
 */
import assert from 'node:assert/strict';
import { buildDepartures, DEPARTURE_CUTOFF_DAYS, hasBookings, isOffered } from '../../components/tour-system/departures';
import { nextDepartureLabels } from '../../components/small-group/smallGroup';

assert.equal(DEPARTURE_CUTOFF_DAYS, 14);
const now = new Date('2026-11-11T21:30:00Z'); // late evening UTC: still the 11th

// Unbooked: offered at 15+ days, hidden from 14 days before.
assert.equal(isOffered({ startDate: '2026-11-26' }, { now }), true, '15 days away');
assert.equal(isOffered({ startDate: '2026-11-25' }, { now }), false, '14 days away, unbooked');
assert.equal(isOffered({ startDate: '2026-11-12' }, { now }), false, 'tomorrow, unbooked');
assert.equal(isOffered({ startDate: '2026-11-25', status: 'available' }, { now }), false, 'available ≠ booked');
assert.equal(isOffered({ startDate: '2026-11-25', status: 'onrequest' }, { now }), false, 'on request ≠ booked');

// Booked: stays until it starts.
for (const status of ['guaranteed', 'few', 'soldout']) {
  assert.equal(isOffered({ startDate: '2026-11-12', status }, { now }), true, `${status} tomorrow`);
}
assert.equal(isOffered({ startDate: '2026-11-11', status: 'guaranteed' }, { now }), false, 'starts today → gone');
assert.equal(isOffered({ startDate: '2026-11-01', status: 'guaranteed' }, { now }), false, 'past → gone');

// Places left below the cap = booked; at the cap or with no cap = not.
assert.equal(hasBookings({ placesLeft: 9 }, 12), true);
assert.equal(hasBookings({ placesLeft: 12 }, 12), false);
assert.equal(hasBookings({ placesLeft: 3 }, null), false, 'no cap → cannot tell');
assert.equal(isOffered({ startDate: '2026-11-15', placesLeft: 10 }, { now, maxGroup: 12 }), true);

// Product-page table drops past + lapsed rows, keeps booked and far ones.
{
  const m = buildDepartures(
    [
      { startDate: '2026-10-31' }, // past
      { startDate: '2026-11-14' }, // 3 days, unbooked → hidden
      { startDate: '2026-11-15', status: 'few' }, // 4 days, booked → shown
      { startDate: '2026-12-05' }, // far → shown
    ],
    { durationDays: 9, maxGroup: 12, locale: 'en', now },
  );
  assert.deepEqual(m.rows.map((r) => r.startISO), ['2026-11-15', '2026-12-05']);
  assert.equal(m.count, 2);
  assert.equal(m.next?.startISO, '2026-11-15');
}

// Per-date prices (owner Q3/Q4): base = the from price, peak dates +30%.
{
  const m = buildDepartures(
    [{ startDate: '2026-12-05' }, { startDate: '2026-12-26', isPeak: true }],
    { durationDays: 9, basePrice: 1995, peakUpliftPct: 30, locale: 'en', now },
  );
  assert.deepEqual(m.rows.map((r) => r.price), [1995, 2594]);
}

// Small-group card line: same rule; sold-out never listed.
assert.deepEqual(
  nextDepartureLabels(
    [{ startDate: '2026-11-14' }, { startDate: '2026-11-16', status: 'soldout' }, { startDate: '2026-11-17', status: 'guaranteed' }, { startDate: '2026-12-05' }],
    'en',
    now,
  ),
  ['17 Nov', '5 Dec'],
);
assert.deepEqual(nextDepartureLabels([{ startDate: '2026-11-14' }], 'en', now), [], 'only a lapsed date → "ask us"');

console.log('departure-cutoff: all assertions passed');
