/**
 * Sentry PII scrubbing (Session 11).
 *
 * The concierge handles free-text conversations, visitor emails, phone numbers,
 * brief payloads, and raw IPs — none of which may ever leave the app in an error
 * report. This module is the single `beforeSend` / `beforeSendTransaction` hook
 * shared by the client, server, and edge Sentry configs so the policy is
 * identical everywhere.
 *
 * Locked policy (build brief, S11 deliverable 5):
 *   NEVER capture: message content (user/agent), emails/names/phones/contact
 *   details, brief payload contents, raw IPs.
 *   MAY capture: opaque session/conversation IDs, message/token counts, stack
 *   traces + code locations, HTTP/API status codes + response times (no content),
 *   browser/OS.
 *
 * Assume any field is PII unless explicitly known otherwise. The debugging path
 * is "look up conversation_id in the admin panel," NOT "find it in Sentry."
 *
 * Defense in depth: `sendDefaultPii: false` in each init already prevents Sentry
 * from attaching IPs, cookies, and request bodies by default — this hook removes
 * anything that slips through (breadcrumbs, console echoes, query-string tokens,
 * user context) so a future SDK/config change cannot silently start leaking.
 */
import type { ErrorEvent, EventHint } from '@sentry/nextjs';

/** Strip the query string from a URL — `?resume=<token>`, `?tour=`, `?q=` etc. */
function stripQuery(url: unknown): unknown {
  return typeof url === 'string' ? url.split('?')[0].split('#')[0] : url;
}

/**
 * Redact anything that resembles an email or an international/long phone number
 * from a free-text string (exception messages, breadcrumb text). Best-effort —
 * the primary defense is dropping content-bearing fields entirely; this catches
 * PII that leaks into an error *message*.
 */
function redactText(s: string): string {
  return s
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]');
}

/**
 * The shared scrubber. Returns the event with all PII removed, or `null` to drop
 * the event entirely (never used today, but the signature allows it).
 */
export function scrubEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  // 1. User context — the richest PII sink (ip_address, email, username).
  //    We never identify visitors in Sentry; opaque IDs travel as tags/extra.
  delete event.user;

  // 2. Request — no cookies, no body (message content / email / brief payload),
  //    no headers (may carry auth/session), no token-bearing query string.
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data; // POST bodies: chat messages, emails, brief JSON
    delete event.request.headers; // x-forwarded-for (raw IP), cookie, auth
    delete event.request.query_string;
    event.request.url = stripQuery(event.request.url) as string | undefined;
  }

  // 3. Breadcrumbs — fetch/xhr/navigation trails and console echoes can carry
  //    request bodies, response bodies, token URLs, and logged message content.
  if (event.breadcrumbs) {
    for (const b of event.breadcrumbs) {
      if (b.category === 'console') {
        // Console logs frequently echo message content — keep the fact a log
        // happened (level) but drop the text and args.
        b.message = undefined;
        if (b.data) delete b.data.arguments;
      }
      if (b.data) {
        b.data.url = stripQuery(b.data.url);
        delete b.data.request_body;
        delete b.data.response_body;
        delete b.data.body;
      }
      if (typeof b.message === 'string') b.message = redactText(b.message);
    }
  }

  // 4. Exception + top-level message text — redact emails/phones that leaked in.
  if (typeof event.message === 'string') event.message = redactText(event.message);
  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (typeof ex.value === 'string') ex.value = redactText(ex.value);
    }
  }

  // 5. `extra` / `contexts` are opt-in by our own code; still, defensively drop
  //    any obviously content-bearing keys a future caller might attach.
  if (event.extra) {
    for (const k of ['message', 'content', 'email', 'brief', 'payload', 'transcript']) {
      delete event.extra[k];
    }
  }

  return event;
}
