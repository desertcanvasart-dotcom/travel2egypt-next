import assert from 'node:assert/strict';

import { cleanPath, isBot, referrerDomain } from '../measure/shared';
import { countBy, perWeek, ratesByPage, ratesBySection, realLeads, sectionOf, stripLocale, toCsv, weekOf, type LeadRow } from '../admin/reportAgg';
import { isTestEmail, normalizeLead } from '../leads/schema';

// Referrer → domain only; internal and junk dropped.
assert.equal(referrerDomain('https://www.google.com/search?q=egypt'), 'google.com');
assert.equal(referrerDomain('https://travel2egypt.org/guide'), '');
assert.equal(referrerDomain('https://es.travel2egypt.org/x'), '');
assert.equal(referrerDomain(''), '');
assert.equal(referrerDomain('not a url'), '');

// Paths: no query/hash, no trailing slash.
assert.equal(cleanPath('/guide/cairo/?utm_source=x#top'), '/guide/cairo');
assert.equal(cleanPath('/'), '/');
assert.equal(cleanPath('/ja/journeys/hajimete-no-ejiputo'), '/ja/journeys/hajimete-no-ejiputo');
assert.equal(cleanPath('https://evil.example/'), null);
assert.equal(cleanPath('/<script>'), null);

// Bots never counted; real browsers are.
assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
assert.equal(isBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'), false);
assert.equal(isBot(''), true);

// Test mode.
assert.equal(isTestEmail('qa@test.travel2egypt.org'), true);
assert.equal(isTestEmail('QA@TEST.TRAVEL2EGYPT.ORG'), true);
assert.equal(isTestEmail('ana@example.com'), false);

// Attribution fields normalize; bad values dropped, never guessed.
{
  const r = normalizeLead({ email: 'a@example.com', source: 'journey_end', landingPage: '/journeys/desert-and-quiet', referrerDomain: 'google.com', interest: 'cairo' });
  if (r.ok !== true) throw new Error('expected ok');
  assert.equal(r.lead.formLocation, 'journey_end');
  assert.equal(r.lead.landingPage, '/journeys/desert-and-quiet');
  assert.equal(r.lead.referrerDomain, 'google.com');
  assert.equal(r.lead.interest, 'cairo');
  const bad = normalizeLead({ email: 'a@example.com', landingPage: 'https://x.com', referrerDomain: 'not a domain' });
  if (bad.ok !== true) throw new Error('expected ok');
  assert.equal(bad.lead.landingPage, null);
  assert.equal(bad.lead.referrerDomain, null);
}

// Report aggregation.
const L = (o: Partial<LeadRow>): LeadRow => ({ created_at: '2026-11-10T10:00:00Z', source: 'home_hero', locale: 'en', ...o });
const rows = [L({}), L({ source: 'plan_page' }), L({ source: 'plan_page', is_test: true }), L({ landing_page: null })];
assert.equal(realLeads(rows).length, 3, 'test leads excluded');
assert.deepEqual(countBy(realLeads(rows), (r) => r.source), [
  { key: 'home_hero', count: 2 },
  { key: 'plan_page', count: 1 },
]);
assert.deepEqual(countBy([L({})], (r) => r.landing_page), [{ key: '(not set)', count: 1 }], 'old rows shown as not set');
assert.equal(weekOf('2026-11-10'), '2026-11-09', 'Tuesday → Monday');
assert.equal(weekOf('2026-11-09'), '2026-11-09');
assert.deepEqual(perWeek([L({})], '2026-11-02', '2026-11-15').map((w) => w.count), [0, 1]);
assert.equal(stripLocale('/es/guide/el-cairo'), '/guide/el-cairo');
assert.equal(stripLocale('/ja'), '/');

const sets = { products: new Set(['essential-egypt', 'egipto-esencial']), hubs: new Set(['egypt-family-holidays']) };
assert.equal(sectionOf('/', sets), 'home');
assert.equal(sectionOf('/es/egipto-esencial', sets), 'product');
assert.equal(sectionOf('/egypt-family-holidays', sets), 'hub');
assert.equal(sectionOf('/ja/journeys/hajimete-no-ejiputo', sets), 'journey');
assert.equal(sectionOf('/guide/cairo', sets), 'guide');
assert.equal(sectionOf('/blog/x', sets), 'blog');
assert.equal(sectionOf('/contact', sets), 'other');

const views = [{ path: '/essential-egypt', views: 200 }, { path: '/', views: 40 }];
const leads = [L({ page_path: '/essential-egypt' }), L({ page_path: '/essential-egypt' }), L({ page_path: '/' })];
assert.deepEqual(ratesByPage(views, leads, 50), [{ key: '/essential-egypt', views: 200, leads: 2, rate: 1 }], 'pages under 50 views omitted');
assert.deepEqual(
  ratesBySection(views, leads, sets).map((r) => [r.key, r.views, r.leads]),
  [['home', 40, 1], ['product', 200, 2]],
);

assert.equal(toCsv([{ dimension: 'd', header: ['key', 'count'], rows: [['a,b', 1]] }]).split('\n')[1], 'd,"a,b",1');

console.log('measurement: all assertions passed');
