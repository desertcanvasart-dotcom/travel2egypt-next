/**
 * Group departures calendar (2026-11-24). Run: npx tsx src/lib/__tests__/group-departures.test.ts
 */
import assert from 'node:assert/strict';
import { buildCalendar, type CalendarTour } from '../groupDepartures';

const now = new Date('2026-11-24T12:00:00Z');
const tours: CalendarTour[] = [
  {
    _id: 'a', title: 'Nile Cruise', href: 'nile-cruise', privateGuiding: true, durationDays: 15, priceFrom: 6000, maxGroup: 12,
    departures: [
      { startDate: '2026-11-22' }, // started: gone
      { startDate: '2026-12-02' }, // 8 days away, unbooked: hidden by the 14-day cut-off
      { startDate: '2026-12-02' , status: 'guaranteed' }, // booked: stays
      { startDate: '2027-02-24' },
      { startDate: '2027-02-12', isPeak: true },
    ],
  },
  { _id: 'b', title: 'Egypt at Ease', href: 'egypt-at-ease', durationDays: 11, priceFrom: null, departures: [{ startDate: '2027-02-16', status: 'soldout' }, { startDate: '2027-01-19' }] },
  { _id: 'c', title: 'No dates', href: 'x', departures: null },
  { _id: 'd', title: 'No link', href: '', departures: [{ startDate: '2027-03-01' }] },
];

const cal = buildCalendar(tours, { now, locale: 'en' });
assert.deepEqual(cal.map((m) => m.key), ['2026-12', '2027-01', '2027-02'], 'months in order, none empty');
assert.equal(cal[0].rows.length, 1, 'Dec: only the booked 2 Dec date (the other 2 Dec row duplicates the cut-off rule)');
assert.equal(cal[0].rows[0].status, 'guaranteed');
assert.deepEqual(cal[2].rows.map((r) => r.startISO), ['2027-02-12', '2027-02-16', '2027-02-24'], 'chronological within a month');
const peak = cal[2].rows[0];
assert.equal(peak.isPeak, true);
assert.equal(peak.price, 7800, 'peak date = base + 30%');
assert.equal(cal[2].rows[2].price, 6000);
const out = cal[2].rows[1];
assert.equal(out.isSoldOut, true, 'sold-out stays listed, marked');
assert.equal(out.price, null, 'no base price → on inquiry');
assert.equal(cal[2].label, 'February 2027');
assert.equal(buildCalendar(tours, { now, locale: 'es' })[2].label, 'febrero de 2027');
assert.equal(buildCalendar(tours, { now, locale: 'ja' })[2].label, '2027年2月');
assert.equal(peak.isPrivate, true, 'privateGuiding carries through to the row');
assert.equal(out.isPrivate, false, 'shared-guide tours are not marked private');
assert.deepEqual(buildCalendar([], { now, locale: 'en' }), []);
assert.equal(cal.flatMap((m) => m.rows).some((r) => r.tourId === 'd'), false, 'a tour without a link is skipped');
console.log('group-departures: ok');
