/**
 * Send a homepage/tour-form lead to Autoura (2026-11-12).
 *
 * Until now /api/lead only emailed TEAM_INBOX_EMAIL (info@), which the Autoura
 * app does not read, so form leads never reached the team's CRM. Each lead is
 * now also POSTed, signed with the concierge's HMAC (./../concierge/autoura/
 * sign.ts, same secret), to Autoura's /api/webhooks/website-lead, which files
 * it as a lead once per `reference` (a retry or a replay never double-files).
 *
 * Contract:
 *  - NEVER throws. The email stays the primary channel; this is best-effort.
 *  - URL: AUTOURA_LEAD_WEBHOOK_URL, else AUTOURA_WEBHOOK_URL with its
 *    /api/webhooks/concierge path swapped for /api/webhooks/website-lead.
 *    Missing URL or secret → 'skipped', no POST.
 *  - Up to 3 sends (1s, 3s apart) on a network error or 5xx; a 4xx is final.
 *  - Sign over the EXACT bytes sent (serialize once).
 *
 * Every external dependency is injectable so the test runs offline.
 */
import { randomUUID } from 'node:crypto';

import { buildSignedHeaders } from '@/lib/concierge/autoura/sign';
import type { RoutedBrand } from '@/lib/concierge/brands';

import type { LeadInput } from './schema';

export type AutouraLeadStatus = 'sent' | 'failed' | 'skipped';

export interface AutouraLeadResult {
  status: AutouraLeadStatus;
  attempts: number;
  httpStatus: number | null;
  response: unknown;
}

/** The wire body Autoura's validateExternalEnquiry reads (snake_case). */
export function toAutouraLead(
  reference: string,
  lead: LeadInput,
  extra: { brand: RoutedBrand; site: string; budgetLabel: string | null; journeyLabel: string | null },
) {
  const estimate =
    lead.estimatedTotal != null ? `${lead.estimatedTotal} ${lead.estimatedCurrency ?? 'USD'}` : null;
  return {
    brand: extra.brand,
    reference,
    kind: lead.kind,
    email: lead.email,
    whatsapp: lead.whatsapp,
    locale: lead.locale,
    travel_month: lead.travelMonth,
    start_date: lead.startDate,
    end_date: lead.endDate,
    days: lead.days,
    adults: lead.adults,
    children: lead.children,
    child_ages: lead.childAges,
    budget: extra.budgetLabel,
    tour_title: lead.tourTitle ?? lead.tourSlug,
    tour_url: lead.tourSlug ? `${extra.site}/${lead.tourSlug}` : null,
    notes: lead.notes,
    page_url: lead.pagePath ? `${extra.site}${lead.pagePath}` : null,
    utm: lead.utm,
    enquiry_type: lead.enquiryType,
    journey: extra.journeyLabel,
    style_answer: lead.styleAnswer,
    departure: lead.departure,
    estimate,
  };
}

/** Where to send, or null when not configured. */
export function leadWebhookUrl(env: Record<string, string | undefined>): string | null {
  const explicit = env.AUTOURA_LEAD_WEBHOOK_URL?.trim();
  if (explicit) return explicit;
  const brief = env.AUTOURA_WEBHOOK_URL?.trim();
  if (!brief) return null;
  try {
    const u = new URL(brief);
    u.pathname = '/api/webhooks/website-lead';
    u.search = '';
    return u.toString();
  } catch {
    return null;
  }
}

export interface SendDeps {
  url: string | null;
  secret: string | null;
  post: (url: string, headers: Record<string, string>, body: string) => Promise<{ httpStatus: number | null; response: unknown }>;
  sleep: (ms: number) => Promise<void>;
  nowSeconds: () => number;
  requestId: () => string;
}

const TIMEOUT_MS = 10_000;

async function defaultPost(url: string, headers: Record<string, string>, body: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'POST', headers, body, signal: controller.signal });
    let response: unknown = null;
    try {
      response = await res.json();
    } catch {
      response = null;
    }
    return { httpStatus: res.status, response };
  } catch (err) {
    return { httpStatus: null, response: { error: (err as Error).message } };
  } finally {
    clearTimeout(timer);
  }
}

export function defaultSendDeps(): SendDeps {
  return {
    url: leadWebhookUrl(process.env),
    secret: process.env.AUTOURA_WEBHOOK_SECRET?.trim() || null,
    post: defaultPost,
    sleep: ms => new Promise(r => setTimeout(r, ms)),
    nowSeconds: () => Math.floor(Date.now() / 1000),
    requestId: () => randomUUID(),
  };
}

const BACKOFF_MS = [1000, 3000];

/** POST one lead to Autoura. Never throws. */
export async function sendLeadToAutoura(payload: object, deps: SendDeps = defaultSendDeps()): Promise<AutouraLeadResult> {
  if (!deps.url || !deps.secret) return { status: 'skipped', attempts: 0, httpStatus: null, response: { reason: 'AUTOURA webhook URL or secret not set' } };
  const rawBody = JSON.stringify(payload);
  let last: { httpStatus: number | null; response: unknown } = { httpStatus: null, response: null };
  for (let attempt = 1; attempt <= BACKOFF_MS.length + 1; attempt++) {
    try {
      const headers = buildSignedHeaders({ secret: deps.secret, rawBody, nowSeconds: deps.nowSeconds(), requestId: deps.requestId() });
      last = await deps.post(deps.url, headers, rawBody);
    } catch (err) {
      last = { httpStatus: null, response: { error: (err as Error).message } };
    }
    if (last.httpStatus !== null && last.httpStatus >= 200 && last.httpStatus < 300) {
      return { status: 'sent', attempts: attempt, ...last };
    }
    // A 4xx (bad signature, unknown brand, bad body) will not change on retry.
    if (last.httpStatus !== null && last.httpStatus >= 400 && last.httpStatus < 500) {
      return { status: 'failed', attempts: attempt, ...last };
    }
    if (attempt <= BACKOFF_MS.length) await deps.sleep(BACKOFF_MS[attempt - 1]);
  }
  return { status: 'failed', attempts: BACKOFF_MS.length + 1, ...last };
}
