'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { referrerDomain } from '@/lib/measure/shared';
import { rememberSessionStart } from '@/lib/measure/session';

/**
 * Cookieless page counter (2026-11-10). On every page view — the first load
 * and each client-side navigation — sends {path, locale, referrer domain,
 * mobile|desktop} to /api/pv, which adds 1 to an aggregate daily count. No
 * cookie, no storage of the visitor, no identifier, no IP: it needs no
 * consent, so pages are counted for visitors who decline cookies too.
 * Also records the visit's landing page + referrer for lead attribution.
 */
export function PageCounter({ locale }: { locale: string }) {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    rememberSessionStart();
    const body = JSON.stringify({
      path: window.location.pathname,
      locale,
      // Only the first view of a page load carries the external referrer;
      // later client navigations are internal.
      ref: first.current ? referrerDomain(document.referrer) : '',
      device: window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
    });
    first.current = false;
    try {
      if (!navigator.sendBeacon?.('/api/pv', new Blob([body], { type: 'text/plain' }))) {
        void fetch('/api/pv', { method: 'POST', body, keepalive: true, credentials: 'omit' });
      }
    } catch {
      // Counting must never break the page.
    }
  }, [pathname, locale]);

  return null;
}
