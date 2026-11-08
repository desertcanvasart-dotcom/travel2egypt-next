'use client';

import { useEffect, useState } from 'react';

import { useLocale } from 'next-intl';

import { usePathname } from '@/i18n/navigation';
import { track } from '@/lib/analytics';
import { useConsent } from '@/lib/consent';
import { whatsappUrl } from '@/lib/concierge/constants';

import { prefillFor, useLead } from './leads/LeadProvider';
import { LEAD_COPY, leadLocale } from './leads/copy';

/**
 * Sticky two-button bar on phones (< 768px, CSS) — homepage fix round 1,
 * item 5. All three languages (ES/JA copy added 2026-11-08).
 *
 * Shown on the homepage and on any page that registered a product via
 * <StickyBarProduct> (tour, day-tour and cruise pages). Hidden while: a
 * dialog is open, the homepage's inline itinerary form is in view, or the
 * cookie banner is showing. While visible it adds `has-leadbar` to <body>,
 * which reserves bottom padding so nothing is covered.
 */
export function MobileLeadBar() {
  const pathname = usePathname();
  const locale = leadLocale(useLocale());
  const c = LEAD_COPY[locale];
  const { open, isOpen: dialogOpen, product } = useLead();
  const { isOpen: cookieOpen } = useConsent();
  // Start hidden; the first check (after layout) decides.
  const [formInView, setFormInView] = useState(true);

  const isHome = pathname === '/';
  const isPlan = pathname === '/plan-your-tour';
  // The inline form the bar must not cover: the homepage's #itinerary, the
  // plan page's #plan-form.
  const inlineFormId = isHome ? 'itinerary' : isPlan ? 'plan-form' : null;
  const eligible = isHome || isPlan || product !== null;

  // Hide while the homepage's inline form (#itinerary) is on screen. A plain
  // passive scroll/resize check (one getBoundingClientRect per event) rather
  // than IntersectionObserver or rAF: same result, and it can't be starved
  // by a throttled or backgrounded renderer. React bails out of re-renders
  // when the boolean doesn't change.
  useEffect(() => {
    if (!inlineFormId) {
      setFormInView(false);
      return;
    }
    const check = () => {
      const el = document.getElementById(inlineFormId);
      if (!el || el.hidden) {
        // Plan page with the concierge open: keep the bar off its input.
        setFormInView(isPlan);
        return;
      }
      const r = el.getBoundingClientRect();
      setFormInView(r.top < window.innerHeight && r.bottom > 0);
    };
    check();
    // Layout (fonts, images, the plan page's client view) settles after mount.
    const late = window.setTimeout(check, 400);
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    // The plan page swaps form/concierge without scrolling.
    window.addEventListener('t2e:plan-view', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      window.removeEventListener('t2e:plan-view', check);
      window.clearTimeout(late);
    };
  }, [inlineFormId, isPlan]);

  const visible = eligible && !dialogOpen && !formInView && !cookieOpen;

  useEffect(() => {
    document.body.classList.toggle('has-leadbar', visible);
    return () => document.body.classList.remove('has-leadbar');
  }, [visible]);

  if (!visible) return null;

  const waText = product
    ? c.barWaProduct(product.title, `travel2egypt.org${locale === 'en' ? '' : `/${locale}`}/${product.slug}`)
    : c.barWaGeneric;

  return (
    <div className="t2e-leadbar" role="region" aria-label={c.barLabel}>
      <a
        href={whatsappUrl(waText)}
        target="_blank"
        rel="noopener noreferrer"
        className="t2e-leadbar-wa"
        onClick={() => track('contact', { method: 'whatsapp', location: 'sticky_bar', ...(product ? { tour: product.slug } : {}) })}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
        </svg>
        WhatsApp
      </a>
      <button
        type="button"
        className="t2e-leadbar-cta"
        onClick={() => {
          track('form_open', { location: 'sticky_bar', ...(product ? { tour: product.slug } : {}) });
          open({ source: 'mobile_bar', ...(product ? prefillFor(product) : {}) });
        }}
      >
        {c.barCta}
      </button>
    </div>
  );
}
