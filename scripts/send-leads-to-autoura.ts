/**
 * One-off: send the form leads that were only emailed (before 2026-11-12) to
 * the Autoura app, so they land in the team's CRM too.
 *
 *   npx tsx scripts/send-leads-to-autoura.ts          # dry run: lists them
 *   npx tsx scripts/send-leads-to-autoura.ts --send   # sends them
 *
 * Picks every non-test lead with no Autoura outcome yet (autoura_status IS
 * NULL — needs migration 0013). Safe to re-run: Autoura files a reference
 * once, so a lead sent twice answers duplicate_ignored. Reads .env
 * (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AUTOURA_WEBHOOK_URL,
 * AUTOURA_WEBHOOK_SECRET) — point them at production to backfill production.
 */
import { config as loadEnv } from 'dotenv';

loadEnv();

import { DEFAULT_BRAND } from '../src/lib/concierge/brands';
import { JOURNEYS } from '../src/lib/journeys/registry';
import { sendLeadToAutoura, toAutouraLead, leadWebhookUrl } from '../src/lib/leads/autoura';
import { BUDGET_LABELS, type LeadInput } from '../src/lib/leads/schema';
import { conciergeDb } from '../src/lib/supabase/server';

const SITE = 'https://travel2egypt.org';
const send = process.argv.includes('--send');

type Row = Record<string, unknown>;

/** A stored lead row → the shape toAutouraLead reads. */
function asLead(r: Row): LeadInput {
  const s = (k: string) => (typeof r[k] === 'string' && (r[k] as string).trim() ? (r[k] as string) : null);
  return {
    source: (r.source as LeadInput['source']) ?? 'home_hero',
    kind: (r.kind as LeadInput['kind']) ?? 'trip',
    locale: s('locale') ?? 'en',
    email: s('email') ?? '',
    whatsapp: s('whatsapp'),
    travelMonth: s('travel_month'),
    startDate: s('start_date'),
    endDate: s('end_date'),
    days: (r.days_band as LeadInput['days']) ?? null,
    adults: Number(r.adults ?? 0),
    children: Number(r.children ?? 0),
    childAges: s('child_ages'),
    budget: (r.budget_band as LeadInput['budget']) ?? null,
    notes: s('notes'),
    tourSlug: s('tour_slug'),
    tourTitle: s('tour_title'),
    pagePath: s('page_path'),
    utm: (r.utm as Record<string, string>) ?? {},
    estimatedTotal: null,
    estimatedCurrency: null,
    journey: (r.journey as LeadInput['journey']) ?? null,
    formLocation: s('form_location') ?? '',
    interest: s('interest'),
    landingPage: s('landing_page'),
    referrerDomain: s('referrer_domain'),
    styleAnswer: (r.style_answer as LeadInput['styleAnswer']) ?? null,
    enquiryType: (r.enquiry_type as LeadInput['enquiryType']) ?? null,
    departure: null,
  };
}

async function main() {
  console.log('Autoura lead webhook:', leadWebhookUrl(process.env) ?? '(not set)');
  const db = conciergeDb();
  const { data, error } = await db
    .from('leads')
    .select('*')
    .is('autoura_status' as never, null)
    .or('is_test.is.null,is_test.eq.false')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`reading leads: ${error.message} (is migration 0013 applied?)`);
  const rows = (data ?? []) as Row[];
  console.log(`${rows.length} lead(s) not yet in Autoura${send ? '' : ' — dry run, pass --send to send'}`);
  for (const r of rows) {
    const lead = asLead(r);
    const line = `${String(r.created_at).slice(0, 16)}  ${r.reference}  ${lead.email}`;
    if (!send) { console.log(line); continue; }
    const payload = toAutouraLead(String(r.reference), lead, {
      brand: DEFAULT_BRAND,
      site: SITE,
      budgetLabel: lead.budget ? BUDGET_LABELS[lead.budget] : null,
      journeyLabel: lead.journey && JOURNEYS[lead.journey] ? `${JOURNEYS[lead.journey].label.en} (${lead.journey})` : null,
    });
    const result = await sendLeadToAutoura(payload);
    const status = (result.response as { data?: { status?: string } } | null)?.data?.status ?? '';
    console.log(`${line}  → ${result.status} ${result.httpStatus ?? ''} ${status}`);
    await db.from('leads')
      .update({ autoura_status: result.status, autoura_response: result.response as never, autoura_attempts: result.attempts } as never)
      .eq('id', r.id as string);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
