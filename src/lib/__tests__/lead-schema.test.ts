/**
 * normalizeLead / leadReference — the homepage lead form's validation.
 * Run: npx tsx src/lib/__tests__/lead-schema.test.ts
 */
import assert from 'node:assert/strict';
import { dayBandFor, leadReference, normalizeLead } from '../leads/schema';

const base = { email: 'Ana@Example.com ', source: 'home_footer', kind: 'trip', locale: 'en' };

// Valid trip lead, normalised.
{
  const r = normalizeLead({ ...base, travelMonth: '2027-03', days: '6-9', adults: '2', children: 1, childAges: '7', budget: '1500-2500', whatsapp: '+44 7700 900123', utm: { utm_source: 'google', junk: 'x' } });
  assert.equal(r.ok, true);
  if (r.ok !== true) throw new Error('unreachable');
  assert.equal(r.lead.email, 'ana@example.com');
  assert.equal(r.lead.days, '6-9');
  assert.equal(r.lead.adults, 2);
  assert.equal(r.lead.childAges, '7');
  assert.deepEqual(r.lead.utm, { utm_source: 'google' }, 'unknown utm keys dropped');
}

// Email required and validated.
assert.deepEqual(normalizeLead({ ...base, email: 'nope' }), { ok: false, error: 'invalid_email', field: 'email' });
assert.deepEqual(normalizeLead({ source: 'home_footer' }), { ok: false, error: 'invalid_email', field: 'email' });

// Bad WhatsApp rejected; empty WhatsApp fine.
assert.equal(normalizeLead({ ...base, whatsapp: 'call me maybe' }).ok, false);
assert.equal(normalizeLead({ ...base, whatsapp: '' }).ok, true);

// Honeypot → spam, accepted silently by the route.
assert.deepEqual(normalizeLead({ ...base, company: 'Acme bots' }), { ok: 'spam' });

// Day tour needs a date; trip-only fields are dropped.
assert.equal(normalizeLead({ ...base, kind: 'day_tour' }).ok, false);
{
  const r = normalizeLead({ ...base, kind: 'day_tour', startDate: '2027-01-15', days: '6-9', budget: '4000+', tourSlug: 'aswan-felucca-adventure' });
  assert.equal(r.ok, true);
  if (r.ok !== true) throw new Error('unreachable');
  assert.equal(r.lead.days, null);
  assert.equal(r.lead.budget, null);
  assert.equal(r.lead.tourSlug, 'aswan-felucca-adventure');
}

// End before start rejected; garbage enums/dates ignored; counts clamped.
assert.equal(normalizeLead({ ...base, startDate: '2027-02-10', endDate: '2027-02-01' }).ok, false);
{
  const r = normalizeLead({ ...base, days: '99', budget: 'rich', travelMonth: '2027-13', adults: 500, children: -3, source: 'evil', pagePath: 'https://x.com' });
  if (r.ok !== true) throw new Error('expected ok');
  assert.equal(r.lead.days, null);
  assert.equal(r.lead.budget, null);
  assert.equal(r.lead.travelMonth, null);
  assert.equal(r.lead.adults, 30);
  assert.equal(r.lead.children, 0);
  assert.equal(r.lead.source, 'home_footer');
  assert.equal(r.lead.pagePath, null, 'only site-relative paths kept');
}

// Reference format.
assert.match(leadReference(), /^T2E-[A-HJ-NP-Z2-9]{6}$/);
assert.equal(leadReference(new Uint8Array([0, 1, 2, 3, 4, 31])), 'T2E-ABCDE9');

// Customise pre-selects the trip length from the product (item 7).
assert.equal(dayBandFor(7), '6-9', '7-Day card → 6–9');
assert.equal(dayBandFor(10), '10-14', '10-day card → 10–14');
assert.equal(dayBandFor(4), '3-5', '4-Day Cairo → 3–5');
assert.equal(dayBandFor(15), '15+');
assert.equal(dayBandFor(2), '', 'under 3 days stays unset');
assert.equal(dayBandFor(null), '');

// The day-tour estimate travels with the submission (item 8).
{
  const r = normalizeLead({ ...base, kind: 'day_tour', startDate: '2027-01-15', adults: 3, children: 2, childAges: '6, 9', estimatedTotal: 360 });
  if (r.ok !== true) throw new Error('expected ok');
  assert.equal(r.lead.estimatedTotal, 360);
  assert.equal(r.lead.children, 2);
  assert.equal(r.lead.childAges, '6, 9');
  assert.equal(normalizeLead({ ...base, estimatedTotal: -5 }).ok === true && (normalizeLead({ ...base, estimatedTotal: -5 }) as { lead: { estimatedTotal: unknown } }).lead.estimatedTotal, null);
}

console.log('lead-schema: all assertions passed');
