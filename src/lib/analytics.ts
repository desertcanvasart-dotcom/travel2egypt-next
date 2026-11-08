/**
 * Google Analytics 4 — measurement + conversion events, behind Consent Mode v2.
 *
 * Off switch: GA loads only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set at
 * build time. Without it every export here is a no-op and the cookie notice
 * stays the informational "essential cookies only" version, so merging this
 * changes nothing until the ID is added to the deploy environment.
 *
 * Consent: GA starts with every storage type DENIED (Consent Mode v2
 * "advanced"): until a visitor accepts, Google receives only cookieless
 * pings — no `_ga` cookie, no client ID. Accepting grants
 * `analytics_storage` only; the advertising signals (`ad_storage`,
 * `ad_user_data`, `ad_personalization`) stay denied permanently — the site
 * runs no ads.
 *
 * Conversion events (mark the first five as Key events in GA4 Admin):
 *   whatsapp_click            any wa.me / api.whatsapp.com link
 *   email_click               any mailto: link
 *   phone_click               any tel: link
 *   concierge_brief_complete  the concierge confirmed a complete trip brief
 *   concierge_handoff_sent    visitor sent the chat to the team (escape hatch)
 * Funnel / micro events:
 *   plan_tour_click           link into /plan-your-tour (the concierge)
 *   concierge_chat_start      first message of a new concierge conversation
 *   concierge_trip_saved      "email me a link to resume" sent
 * Homepage rebuild (2026-11-08):
 *   generate_lead             itinerary / date-request form submitted (mark as Key event)
 *   lead_form_open            the form pop-up opened (funnel step)
 *   select_item               a product card clicked (item_list_name = section)
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';
export const ANALYTICS_ENABLED = /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID);

/**
 * localStorage key holding the consent record (see lib/consent.tsx). v3
 * arrives with GA, re-prompting everyone once for the analytics choice;
 * while GA is off the old v2 key stays, so nobody is re-prompted for nothing.
 */
export const CONSENT_STORAGE_KEY = ANALYTICS_ENABLED ? 'consent-v3' : 'consent-v2';
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export type AnalyticsEvent =
  | 'whatsapp_click'
  | 'email_click'
  | 'phone_click'
  | 'plan_tour_click'
  | 'concierge_chat_start'
  | 'concierge_brief_complete'
  | 'concierge_handoff_sent'
  | 'concierge_trip_saved'
  // Homepage rebuild (2026-11-08)
  | 'generate_lead'
  | 'lead_form_open'
  | 'select_item'
  // Sticky bar (fix round 1): contact {method, location}, form_open {location}
  | 'contact'
  | 'form_open';

type Params = Record<string, string | number | boolean | undefined>;

type Gtag = (...args: unknown[]) => void;

function gtag(): Gtag | null {
  if (!ANALYTICS_ENABLED || typeof window === 'undefined') return null;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof g === 'function' ? g : null;
}

/** Send a GA4 event. Safe to call anywhere — no-op when GA is off. */
export function track(event: AnalyticsEvent, params: Params = {}): void {
  try {
    gtag()?.('event', event, params);
  } catch {
    // Analytics must never break the page.
  }
}

/** Push the visitor's analytics choice to Consent Mode. */
export function setAnalyticsConsent(granted: boolean): void {
  try {
    gtag()?.('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
    });
  } catch {
    // ignore
  }
}

/**
 * Classify a clicked link into a conversion event. Pure — unit-tested.
 * `pageOrigin` resolves relative hrefs; only same-origin links can be
 * plan_tour_click.
 */
export function classifyLink(
  href: string,
  pageOrigin: string
): { event: AnalyticsEvent; params: Params } | null {
  const raw = href.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  if (lower.startsWith('mailto:')) {
    return { event: 'email_click', params: { link_url: raw.split('?')[0] } };
  }
  if (lower.startsWith('tel:')) {
    return { event: 'phone_click', params: { link_url: raw } };
  }

  let url: URL;
  try {
    url = new URL(raw, pageOrigin);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (
    host === 'wa.me' ||
    host === 'api.whatsapp.com' ||
    host === 'web.whatsapp.com' ||
    host === 'chat.whatsapp.com' ||
    (host === 'whatsapp.com' && url.pathname.startsWith('/send')) ||
    url.protocol === 'whatsapp:'
  ) {
    // Drop the prefilled ?text= — it can carry a session ref.
    return { event: 'whatsapp_click', params: { link_url: `${url.protocol}//${url.host}${url.pathname}` } };
  }

  let origin: string;
  try {
    origin = new URL(pageOrigin).origin;
  } catch {
    return null;
  }
  if (url.origin === origin && /^\/(?:[a-z]{2}\/)?plan-your-tour\/?$/.test(url.pathname)) {
    const tour = url.searchParams.get('tour');
    return { event: 'plan_tour_click', params: { link_url: url.pathname, ...(tour ? { tour } : {}) } };
  }
  return null;
}

/** Inline bootstrap: dataLayer + Consent Mode defaults + config. */
export function gaBootstrapScript(id: string): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
var a='denied';try{var r=JSON.parse(localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)})||'null');if(r&&r.categories&&r.categories.analytics===true&&typeof r.timestamp==='number'&&Date.now()-r.timestamp<${CONSENT_MAX_AGE_MS})a='granted';}catch(e){}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:a,wait_for_update:500});
gtag('set','ads_data_redaction',true);
gtag('js',new Date());
gtag('config',${JSON.stringify(id)},{allow_google_signals:false,allow_ad_personalization_signals:false});`;
}
