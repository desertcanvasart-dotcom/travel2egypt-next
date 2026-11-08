'use client';

import { useEffect } from 'react';
import Script from 'next/script';

import { useConsent } from '@/lib/consent';
import {
  ANALYTICS_ENABLED,
  GA_MEASUREMENT_ID,
  classifyLink,
  gaBootstrapScript,
  setAnalyticsConsent,
  track,
} from '@/lib/analytics';

/**
 * Loads GA4 (when NEXT_PUBLIC_GA_MEASUREMENT_ID is set), keeps Consent Mode
 * in step with the visitor's cookie choice, and records conversion clicks
 * (WhatsApp / email / phone / concierge entry) with one delegated listener —
 * so links inside Sanity rich text are covered without touching each
 * serializer. Page views come from GA4 enhanced measurement ("page changes
 * based on browser history events", on by default), which catches App
 * Router client navigations.
 */
export function Analytics({ locale }: { locale: string }) {
  const { consent, ready } = useConsent();
  const granted = consent?.categories.analytics === true;

  useEffect(() => {
    if (!ANALYTICS_ENABLED || !ready) return;
    setAnalyticsConsent(granted);
  }, [granted, ready]);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const a = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a) return;
      const hit = classifyLink(a.getAttribute('href') ?? '', window.location.href);
      if (!hit) return;
      track(hit.event, {
        ...hit.params,
        locale,
        link_text: (a.textContent ?? '').trim().slice(0, 100) || undefined,
        placement: a.closest('[data-analytics-placement]')?.getAttribute('data-analytics-placement') ??
          (a.closest('footer') ? 'footer' : a.closest('header') ? 'header' : 'body'),
      });
    }
    // Capture phase: fires before handlers that close dialogs / navigate.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [locale]);

  if (!ANALYTICS_ENABLED) return null;

  return (
    <>
      <Script id="ga-bootstrap" strategy="afterInteractive">
        {gaBootstrapScript(GA_MEASUREMENT_ID)}
      </Script>
      <Script
        id="ga-gtag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
    </>
  );
}
