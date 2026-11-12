/**
 * Form leads → Autoura (2026-11-12). Run: `npx tsx src/lib/leads/__tests__/autoura.test.ts`
 * Offline: the POST is injected, so retries, signing and the body are checked
 * with no network.
 */
import { signConciergePayload } from '@/lib/concierge/autoura/sign';

import { leadWebhookUrl, sendLeadToAutoura, toAutouraLead, type SendDeps } from '../autoura';
import type { LeadInput } from '../schema';

let pass = 0;
let fail = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) pass++;
  else {
    fail++;
    console.error(`FAIL ${label}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}

const lead: LeadInput = {
  source: 'home_hero' as LeadInput['source'], kind: 'trip', locale: 'en', email: 'jane@example.com', whatsapp: '+447700900123',
  travelMonth: '2027-03', startDate: null, endDate: null, days: null, adults: 2, children: 1, childAges: '9',
  budget: null, notes: 'Anniversary', tourSlug: 'nile-8', tourTitle: 'Nile 8 days', pagePath: '/en/tours/nile-8',
  utm: { utm_source: 'google' }, estimatedTotal: 1200, estimatedCurrency: 'EUR', journey: null, formLocation: 'home_hero',
  interest: null, landingPage: null, referrerDomain: null, styleAnswer: ['culture', 'relaxed'], enquiryType: null, departure: null,
};

async function run() {
  // The URL: explicit, else the brief URL's host with the lead path.
  eq(leadWebhookUrl({ AUTOURA_WEBHOOK_URL: 'https://getautoura.net/api/webhooks/concierge' }), 'https://getautoura.net/api/webhooks/website-lead', 'derived url');
  eq(leadWebhookUrl({ AUTOURA_LEAD_WEBHOOK_URL: 'https://x.test/hook', AUTOURA_WEBHOOK_URL: 'https://y.test/a' }), 'https://x.test/hook', 'explicit url wins');
  eq(leadWebhookUrl({}), null, 'no url');

  // The body Autoura reads.
  const body = toAutouraLead('T2E-ABC234', lead, { brand: 'travel2egypt', site: 'https://travel2egypt.org', budgetLabel: null, journeyLabel: null });
  eq([body.brand, body.reference, body.email, body.adults, body.children], ['travel2egypt', 'T2E-ABC234', 'jane@example.com', 2, 1], 'body fields');
  eq([body.tour_url, body.page_url, body.estimate], ['https://travel2egypt.org/nile-8', 'https://travel2egypt.org/en/tours/nile-8', '1200 EUR'], 'body urls + estimate');

  // Sending: signed over the exact bytes; retries on 5xx; stops on 4xx.
  const calls: Array<{ headers: Record<string, string>; body: string }> = [];
  const deps = (replies: Array<number | null>): SendDeps => ({
    url: 'https://getautoura.net/api/webhooks/website-lead',
    secret: 's3cret',
    post: async (_u, headers, b) => {
      calls.push({ headers, body: b });
      const status = replies.shift() ?? null;
      return { httpStatus: status, response: status ? { ok: status < 300 } : null };
    },
    sleep: async () => {},
    nowSeconds: () => 1_700_000_000,
    requestId: () => 'req-1',
  });

  const ok = await sendLeadToAutoura(body, deps([200]));
  eq([ok.status, ok.attempts], ['sent', 1], 'sent first time');
  eq(calls[0].headers['X-Autoura-Signature'], `t=1700000000,v1=${signConciergePayload('s3cret', 1_700_000_000, calls[0].body)}`, 'signed over the sent bytes');

  calls.length = 0;
  const retried = await sendLeadToAutoura(body, deps([500, null, 200]));
  eq([retried.status, retried.attempts, calls.length], ['sent', 3, 3], 'retries a 5xx and a network error');

  calls.length = 0;
  const refused = await sendLeadToAutoura(body, deps([422, 200]));
  eq([refused.status, refused.attempts, calls.length], ['failed', 1, 1], 'a 4xx is final');

  calls.length = 0;
  const down = await sendLeadToAutoura(body, deps([503, 503, 503]));
  eq([down.status, down.attempts], ['failed', 3], 'gives up after 3');

  const skipped = await sendLeadToAutoura(body, { ...deps([200]), secret: null });
  eq(skipped.status, 'skipped', 'no secret = no POST');

  console.log(`autoura lead: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

void run();
