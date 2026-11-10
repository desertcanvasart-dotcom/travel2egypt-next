/**
 * Small-group hub helpers + the multi-day "from" rule (2026-11-10).
 * Run: npx tsx src/lib/__tests__/small-group.test.ts
 */
import assert from 'node:assert/strict';
import { nextDepartureLabels, regionLabel, routeFromTitle } from '../../components/small-group/smallGroup';
import { isOneDayProduct, multiDayOnly } from '../products/multiDay';
import { normalizeLead } from '../leads/schema';
import { leadTeamEmail } from '../email/templates';

const now = new Date('2026-11-10T12:00:00Z');
const deps = [
  { startDate: '2026-11-09' }, // past
  { startDate: '2026-11-10' }, // today → not future
  { startDate: '2027-01-14' },
  { startDate: '2027-02-11', status: 'soldout' },
  { startDate: '2027-02-11' }, // duplicate date, one available
  { startDate: '2027-03-18' },
  { startDate: '2027-04-01' },
];

// Next 3 future dates, per language; never past, never sold out.
assert.deepEqual(nextDepartureLabels(deps, 'en', now), ['14 Jan', '11 Feb', '18 Mar']);
assert.deepEqual(nextDepartureLabels(deps, 'es', now), ['14 ene', '11 feb', '18 mar']);
assert.deepEqual(nextDepartureLabels(deps, 'ja', now), ['1月14日', '2月11日', '3月18日']);
assert.deepEqual(nextDepartureLabels([{ startDate: '2026-01-01' }], 'en', now), [], 'all past → ask us');
assert.deepEqual(nextDepartureLabels(null, 'en', now), []);

// Route from the product's own title.
assert.deepEqual(routeFromTitle('9-Day Egypt Group Tour: Cairo, Abu Simbel & the Nile'), ['Cairo', 'Abu Simbel', 'the Nile']);
assert.deepEqual(routeFromTitle('Egipto en armonía: El Cairo, Abu Simbel y el Nilo en 9 días'), ['El Cairo', 'Abu Simbel', 'el Nilo']);
assert.deepEqual(routeFromTitle('9日間エジプト・グループツアー：カイロ、アブ・シンベル、ナイル'), ['カイロ', 'アブ・シンベル', 'ナイル']);
assert.deepEqual(routeFromTitle('まるごとのエジプト12日間——カイロ、ダハビーヤのナイル、そして紅海へ'), ['カイロ', 'ダハビーヤのナイル', '紅海']);
assert.deepEqual(routeFromTitle('Egypt Group Tour: Cairo'), [], 'one stop → no route');
assert.deepEqual(routeFromTitle('No colon here'), []);

// Region badges.
assert.equal(regionLabel('australia-oceania', 'en'), 'Australia & Oceania');
assert.equal(regionLabel('nowhere', 'en'), null);

// One-day products never set a multi-day "from".
assert.equal(isOneDayProduct({ durationDays: 2, enTitle: 'Alexandria in a Day: Catacombs, Columns & the Mediterranean Coast' }), true);
assert.equal(isOneDayProduct({ durationDays: 1, enTitle: 'Anything' }), true);
assert.equal(isOneDayProduct({ durationDays: null, enTitle: 'Anything' }), true);
assert.equal(isOneDayProduct({ durationDays: 2, enTitle: 'Luxor by Air: A Two-Day Tour from Cairo' }), false, '"Two-Day Tour" is not a day tour');
assert.equal(isOneDayProduct({ durationDays: 3, enTitle: 'Cairo', enSummary: 'A private day tour of the pyramids' }), true);
assert.equal(isOneDayProduct({ durationDays: 7, enTitle: '7-Day Egypt Tour: Cairo, the Nile Cruise, Luxor and Aswan' }), false);
assert.equal(multiDayOnly([{ durationDays: 2, enTitle: 'X in a day' }, { durationDays: 2, enTitle: 'Bahariya' }]).length, 1);

// Small-group lead: type + departure kept; days dropped by the form, not the schema.
{
  const r = normalizeLead({ email: 'a@test.travel2egypt.org', source: 'small_group_card', kind: 'trip', enquiryType: 'small_group', departure: 'Japan & East Asia · 9 days' });
  assert.equal(r.ok, true);
  if (r.ok !== true) throw new Error('unreachable');
  assert.equal(r.lead.source, 'small_group_card');
  assert.equal(r.lead.formLocation, 'small_group_card');
  assert.equal(r.lead.enquiryType, 'small_group');
  assert.equal(r.lead.departure, 'Japan & East Asia · 9 days');
  const other = normalizeLead({ email: 'a@b.co', source: 'home_footer', kind: 'trip', enquiryType: 'bogus', departure: 'x' });
  assert.equal(other.ok === true && other.lead.enquiryType, null);
  assert.equal(other.ok === true && other.lead.departure, null);
}

// Team email: "Small-group enquiry" with the departure first.
{
  const e = leadTeamEmail({
    reference: 'T2E-TEST01', kind: 'trip', source: 'small_group_end', locale: 'en', email: 'a@b.co', whatsapp: null,
    when: 'March 2027', days: null, party: '2 adults', budget: null, tour: null, tourUrl: null, notes: null,
    pagePath: '/small-group-travel-packages', utm: {}, enquiryType: 'small_group', departure: 'Not sure',
  });
  assert.match(e.subject, /Small-group enquiry/);
  assert.match(e.text, /^Small-group enquiry from travel2egypt\.org\n\nDeparture: Not sure\n/);
}

console.log('small-group: all assertions passed');
