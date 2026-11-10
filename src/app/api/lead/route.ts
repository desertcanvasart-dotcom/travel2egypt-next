import { NextResponse, type NextRequest } from 'next/server';

import { assertSameOrigin } from '@/lib/http/sameOrigin';
import { enforceExpensive } from '@/lib/concierge/rateLimit';
import { hashedIp } from '@/lib/concierge/ipHash';
import { sendLeadEmail } from '@/lib/email/resend';
import { conciergeDb } from '@/lib/supabase/server';
import { BUDGET_LABELS, leadReference, normalizeLead, type LeadInput } from '@/lib/leads/schema';
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

  // 1. Email the team — the primary channel.
  let emailed = false;
  try {
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
    });
    emailed = true;
  } catch (err) {
    console.error('[lead] team email failed:', err);
  }

  // 2. Store (best-effort).
  let stored = false;
  if (db) {
    const row = {
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
    // journey + style_answer have their own columns (migration 0010). Until
    // 0010 is applied, retry without them so the lead is still stored.
    const journeyCols = lead.journey ? { journey: lead.journey, style_answer: lead.styleAnswer } : {};
    let { error } = await db.from('leads').insert({ ...row, ...journeyCols });
    if (error && lead.journey && /journey|style_answer/.test(error.message)) {
      console.error('[lead] journey columns missing (apply migration 0010):', error.message);
      ({ error } = await db.from('leads').insert(row));
    }
    if (error) console.error('[lead] insert failed (migration 0009 applied?):', error.message);
    else stored = true;
  }

  if (!emailed && !stored) {
    // Nothing reached the team: tell the visitor so they can use WhatsApp.
    return NextResponse.json({ error: 'lead_unavailable' }, { status: 503 });
  }
  return NextResponse.json({ ok: true, reference });
}
