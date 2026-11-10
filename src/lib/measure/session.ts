'use client';

import { SESSION_LANDING_KEY, SESSION_REFERRER_KEY, referrerDomain } from './shared';

/**
 * The first page of the visit and where the visitor came from, kept in
 * sessionStorage (cleared when the tab closes; not a cookie, no identifier,
 * needs no consent). Read by the lead form so every lead carries
 * landing_page + referrer_domain.
 */
export function rememberSessionStart(): void {
  try {
    if (sessionStorage.getItem(SESSION_LANDING_KEY) !== null) return;
    sessionStorage.setItem(SESSION_LANDING_KEY, window.location.pathname);
    sessionStorage.setItem(SESSION_REFERRER_KEY, referrerDomain(document.referrer));
  } catch {
    // Storage blocked (private mode on some browsers): attribution stays empty.
  }
}

export function sessionAttribution(): { landingPage: string | null; referrerDomain: string | null } {
  try {
    return {
      landingPage: sessionStorage.getItem(SESSION_LANDING_KEY),
      referrerDomain: sessionStorage.getItem(SESSION_REFERRER_KEY) || null,
    };
  } catch {
    return { landingPage: null, referrerDomain: null };
  }
}
