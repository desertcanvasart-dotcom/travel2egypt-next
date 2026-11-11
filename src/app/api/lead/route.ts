import { NextResponse, type NextRequest } from 'next/server';

import { assertSameOrigin } from '@/lib/http/sameOrigin';
import { enforceExpensive } from '@/lib/concierge/rateLimit';
import { hashedIp } from '@/lib/concierge/ipHash';
import { sendLeadEmail } from '@/lib/email/resend';
import { conciergeDb } from '@/lib/supabase/server';
import { BUDGET_LABELS, isTestEmail, leadReference, normalizeLead, type LeadInput } from '@/lib/leads/schema';
import { JOURNEYS } from '@/lib/journeys/registry';

/**
 * POST /api/lead — itinerary request / day-tour date request from the new
 * homepage form (2026-11-08).
 *
 * Order: same-origin → validate (honeypot = silent 200) → rate limit by
 * hashed IP → EMAIL the team (primary channel; must succeed) → store in
 * concierge.leads (best-effort: logs if migration 0009 isn't applied yet).
 *
 * Response: { ok: true, reference } | { error, field? }
 */
export const runtime = 'nodejs';

const SITE = 'https://travel2egypt.org';

function whenLabel(l: LeadInput): string {
  if (l.startDate && l.endDate) return `${l.startDate} → ${l.endDate}`;
  if (l.startDate) return l.startDate;
  if (l.travelMonth) {
    const [y, m] = l.travelMonth.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  return 'Not decided yet';
}

function partyLabel(l: LeadInput): string {
  const a = `${l.adults} adult${l.adults === 1 ? '' : 's'}`;
  if (!l.children) return a;
  return `${a}, ${l.children} child${l.children === 1 ? '' : 'ren'}${l.childAges ? ` (ages ${l.childAges})` : ''}`;
}

export async function POST(req: NextRequest) {
  const crossOrigin = assertSameOrigin(req);
  if (crossOrigin) return crossOrigin;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const v = normalizeLead(body);
  const reference = leadReference();
  if (v.ok === 'spam') return NextResponse.json({ ok: true, reference });
  if (!v.ok) return NextResponse.json({ error: v.error, field: v.field }, { status: 422 });
  const lead = v.lead;

  // Test mode: @test.travel2egypt.org addresses, or the X-T2E-Test header
  // carrying T2E_TEST_SECRET. Stored with is_test = true; no team email, no
  // alert, no auto-reply; the client fires `test_lead`, never `generate_lead`.
  const testSecret = process.env.T2E_TEST_SECRET?.trim();
  const isTest =
    isTestEmail(lead.email) || Boolean(testSecret && req.headers.get('x-t2e-test') === testSecret);

  const ipHash = await hashedIp(req).catch(() => null);

  // Rate limit (per hashed IP). If the limiter itself is unavailable, let the
  // lead through — losing a real enquiry costs more than a little spam.
  let db: ReturnType<typeof conciergeDb> | null = null;
  try {
    db = conciergeDb();
    if (ipHash) {
      const limit = await enforceExpensive(db, 'lead', `ip:${ipHash}`);
      if (!limit.ok) {
        return NextResponse.json(
          { error: 'rate_limited', retryAfter: limit.retryAfterSeconds },
          { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
        );
      }
    }
  } catch (err) {
    console.error('[lead] rate limiter unavailable:', err);
  }

  // 1. Email the team — the primary channel (never for test leads).
  let emailed = false;
  if (!isTest) try {
    await sendLeadEmail({
      reference,
      kind: lead.kind,
      source: lead.source,
      locale: lead.locale,
      email: lead.email,
      whatsapp: lead.whatsapp,
      when: whenLabel(lead),
      days: lead.days,
      party: partyLabel(lead),
      budget: lead.budget ? BUDGET_LABELS[lead.budget] : null,
      tour: lead.tourTitle ?? lead.tourSlug,
      tourUrl: lead.tourSlug ? `${SITE}/${lead.tourSlug}` : null,
      notes: lead.notes,
      pagePath: lead.pagePath,
      utm: lead.utm,
      estimatedTotal: lead.estimatedTotal,
      estimatedCurrency: lead.estimatedCurrency,
      journey: lead.journey ? `${JOURNEYS[lead.journey].label.en} (${lead.journey})` : null,
      styleAnswer: Array.isArray(lead.styleAnswer) ? lead.styleAnswer.join(', ') : lead.styleAnswer,
      enquiryType: lead.enquiryType,
      departure: lead.departure,
    });
    emailed = true;
  } catch (err) {
    console.error('[lead] team email failed:', err);
  }

  // 2. Store (best-effort).
  let stored = false;
  if (db) {
    const base = {
      reference,
      kind: lead.kind,
      source: lead.source,
      locale: lead.locale,
      email: lead.email,
      whatsapp: lead.whatsapp,
      travel_month: lead.travelMonth,
      start_date: lead.startDate,
      end_date: lead.endDate,
      days_band: lead.days,
      adults: lead.adults,
      children: lead.children,
      child_ages: lead.childAges,
      budget_band: lead.budget,
      notes: lead.notes,
      tour_slug: lead.tourSlug,
      tour_title: lead.tourTitle,
      page_path: lead.pagePath,
      utm: lead.utm,
      ip_hash: ipHash,
      emailed,
    };
    // Newer columns, by migration. If one isn't applied yet the insert is
    // retried without that tier, so the lead is always stored (logged).
    const m0010 = { journey: lead.journey, style_answer: lead.styleAnswer, is_test: isTest };
    const m0011 = {
      form_location: lead.formLocation,
      interest: lead.interest,
      landing_page: lead.landingPage,
      referrer_domain: lead.referrerDomain,
    };
    // 0012: the enquiry type (small_group). Until it is applied the lead is
    // stored without it (fail-soft); the team email still names it.
    const m0012 = { enquiry_type: lead.enquiryType };
    const tiers = [
      { label: '0012', row: { ...base, ...m0010, ...m0011, ...m0012 } },
      { label: '0011', row: { ...base, ...m0010, ...m0011 } },
      { label: '0010', row: { ...base, ...m0010 } },
      { label: '0009', row: base },
    ];
    for (const [i, tier] of tiers.entries()) {
      // A test lead is never stored without its is_test flag.
      if (isTest && tier.label === '0009') break;
      const { error } = await db.from('leads').insert(tier.row);
      if (!error) {
        stored = true;
        break;
      }
      const missingColumn = /column|schema cache/i.test(error.message);
      console.error(`[lead] insert failed at ${tier.label}${missingColumn && i < tiers.length - 1 ? ' (newer migration not applied; retrying)' : ''}:`, error.message);
      if (!missingColumn) break;
    }
  }

  if (isTest) return NextResponse.json({ ok: true, reference, test: true, stored });
  if (!emailed && !stored) {
    // Nothing reached the team: tell the visitor so they can use WhatsApp.
    return NextResponse.json({ error: 'lead_unavailable' }, { status: 503 });
  }
  return NextResponse.json({ ok: true, reference });
}
