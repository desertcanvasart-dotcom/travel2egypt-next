'use client';

import { useEffect, type ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { track } from '@/lib/analytics';
import { useCurrency } from '@/lib/currency-context';
import { convertPrice } from '@/lib/currency';
import { LeadForm, type LeadPrefill } from '@/components/leads/LeadForm';
import { useLead } from '@/components/leads/LeadProvider';
import type { LeadSource } from '@/lib/leads/schema';

/**
 * Product page actions (product template, 2026-11-09). Every action reuses the
 * homepage form pipeline: Customise / Check a date open the existing dialog,
 * the day-tour panel embeds the same LeadForm. Analytics per spec §9.
 */
export type ProductLocation = 'product_panel' | 'product_mid' | 'product_end';

/** Opens the existing Customise / Check-a-date dialog. */
export function ProductLeadButton({
  location,
  prefill,
  className,
  children,
}: {
  location: ProductLocation;
  prefill: LeadPrefill;
  className?: string;
  children: ReactNode;
}) {
  const { open } = useLead();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        track('form_open', { location, ...(prefill.tourSlug ? { tour: prefill.tourSlug } : {}) });
        open({ source: location as LeadSource, ...prefill });
      }}
    >
      {children}
    </button>
  );
}

export function ProductWhatsApp({
  href,
  location,
  tourSlug,
  className,
  children,
}: {
  href: string;
  location: ProductLocation;
  tourSlug: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track('contact', { method: 'whatsapp', location, tour: tourSlug })}
    >
      {children}
    </a>
  );
}

/** "Ask our AI concierge about this tour →" — /plan-your-tour?tour=…#concierge. */
export function ProductConciergeLink({ tourSlug, className, children }: { tourSlug: string; className?: string; children: ReactNode }) {
  return (
    <Link
      href={`/plan-your-tour?tour=${encodeURIComponent(tourSlug)}#concierge`}
      rel="nofollow"
      className={className}
      onClick={() => track('concierge_open', { location: 'product', tour: tourSlug })}
    >
      {children}
    </Link>
  );
}

/** GA4 view_item once per page load, in the currency the visitor sees. */
export function ProductViewTracker({
  slug,
  category,
  priceEur,
  locale,
}: {
  slug: string;
  category: 'multi_day' | 'day_tour';
  priceEur: number | null;
  locale: string;
}) {
  const { currency, rates } = useCurrency();
  useEffect(() => {
    track('view_item', {
      item_id: slug,
      item_category: category,
      ...(priceEur ? { price: convertPrice(priceEur, currency, rates), currency } : {}),
      locale,
    });
    // once per page view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  return null;
}

/**
 * Day-tour panel: the Check-a-date form inline on desktop (CSS shows it from
 * 1024px), a single button that opens the same dialog below that.
 */
export function InlineDateCheck({
  locale,
  prefill,
  buttonLabel,
}: {
  locale: string;
  prefill: LeadPrefill;
  buttonLabel: string;
}) {
  return (
    <>
      <div className="pdp-inline-form">
        <LeadForm source="product_panel" locale={locale} tone="light" prefill={{ ...prefill, kind: 'day_tour' }} />
      </div>
      <ProductLeadButton location="product_panel" prefill={{ ...prefill, kind: 'day_tour' }} className="pdp-btn pdp-btn--primary pdp-mobile-only pdp-primary">
        {buttonLabel}
      </ProductLeadButton>
    </>
  );
}
