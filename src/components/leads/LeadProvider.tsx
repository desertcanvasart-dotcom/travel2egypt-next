'use client';

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from 'react';

import { Dialog } from '@/components/ui/Dialog';
import { track } from '@/lib/analytics';
import type { LeadSource } from '@/lib/leads/schema';

import { LeadForm, type LeadPrefill } from './LeadForm';
import { captureUtm } from './utm';
import '@/styles/lead-form.css';

/**
 * One itinerary-form pop-up for the whole page: the header button, the mobile
 * bar, "Customise" on a tour card and "Check this date" on a day-tour card all
 * call `useLead().open(...)`. Mounted once in the locale layout.
 *
 * It also holds the product the current page is about (registered by
 * <StickyBarProduct> on tour / day-tour / cruise pages), so the mobile
 * sticky bar can name and pre-fill it (homepage fix round 1, item 5).
 */
interface OpenArgs extends LeadPrefill {
  source: LeadSource;
}

export interface PageProduct {
  slug: string;
  title: string;
  /** 'dayTour' opens the date request; anything else the trip form. */
  type?: string | null;
  durationDays?: number | null;
  priceFromEur?: number | null;
}

export interface ResponseTime {
  /** Approved short string (hero proof row, badges). */
  short: string;
  /** Approved full string (forms, dialogs, thank-you states). */
  full: string;
}

interface LeadContextValue {
  open: (args: OpenArgs) => void;
  responseTime: ResponseTime;
  isOpen: boolean;
  product: PageProduct | null;
  setProduct: (p: PageProduct | null) => void;
}

const LeadContext = createContext<LeadContextValue | null>(null);

export function LeadProvider({
  locale,
  responseTime,
  children,
}: {
  locale: string;
  responseTime?: ResponseTime;
  children: ReactNode;
}) {
  const rt: ResponseTime = useMemo(
    () => ({ short: responseTime?.short ?? '', full: responseTime?.full ?? '' }),
    [responseTime?.short, responseTime?.full],
  );
  const [current, setCurrent] = useState<OpenArgs | null>(null);
  // Remount the form on every open so a previous thank-you state is cleared.
  const [openCount, setOpenCount] = useState(0);
  const [product, setProduct] = useState<PageProduct | null>(null);
  const headingId = useId();

  useEffect(() => {
    captureUtm();
  }, []);

  const open = useCallback((args: OpenArgs) => {
    setCurrent(args);
    setOpenCount((n) => n + 1);
    track('lead_form_open', {
      form_location: args.source,
      lead_kind: args.kind ?? 'trip',
      ...(args.tourSlug ? { tour: args.tourSlug } : {}),
    });
  }, []);

  const value = useMemo(
    () => ({ open, isOpen: current !== null, product, setProduct, responseTime: rt }),
    [open, current, product, rt],
  );
  const isDay = current?.kind === 'day_tour';

  return (
    <LeadContext.Provider value={value}>
      {children}
      <Dialog
        open={current !== null}
        onClose={() => setCurrent(null)}
        backdrop
        backdropClassName="lead-overlay"
        className="lead-modal"
        ariaLabelledby={headingId}
      >
        <button type="button" className="lead-close" onClick={() => setCurrent(null)} aria-label="Close">
          ×
        </button>
        <h2 id={headingId} className="lead-modal-title">
          {isDay ? 'Check a date' : 'Get your free itinerary'}
        </h2>
        <p className="lead-modal-sub">
          {isDay
            ? 'Tell us the day and how many of you. We confirm availability and the price by email, by 8 PM Cairo time the same day or by 10 AM the next morning.'
            : 'Tell us your dates. We send back a day-by-day plan and a firm price, free and with no obligation.'}
        </p>
        {current && (
          <LeadForm
            key={openCount}
            source={current.source}
            prefill={current}
            locale={locale}
            tone="light"
            headingId={headingId}
          />
        )}
      </Dialog>
    </LeadContext.Provider>
  );
}

export function useLead(): LeadContextValue {
  const ctx = useContext(LeadContext);
  if (!ctx) throw new Error('useLead must be used within a LeadProvider');
  return ctx;
}

/** Product pages call this so the sticky bar can name and pre-fill the tour. */
export function StickyBarProduct({ product }: { product: PageProduct }) {
  const { setProduct } = useLead();
  const { slug, title, type, durationDays, priceFromEur } = product;
  useEffect(() => {
    setProduct({ slug, title, type, durationDays, priceFromEur });
    return () => setProduct(null);
  }, [setProduct, slug, title, type, durationDays, priceFromEur]);
  return null;
}

/** Prefill for a page product: day tours → date request, else trip form. */
export function prefillFor(p: PageProduct): LeadPrefill {
  return p.type === 'dayTour'
    ? { kind: 'day_tour', tourSlug: p.slug, tourTitle: p.title, priceFromEur: p.priceFromEur }
    : { kind: 'trip', tourSlug: p.slug, tourTitle: p.title, durationDays: p.durationDays };
}

/** A button that opens the itinerary pop-up. */
export function LeadButton({
  source,
  prefill,
  className,
  children,
  itemListName,
}: {
  source: LeadSource;
  prefill?: LeadPrefill;
  className?: string;
  children: ReactNode;
  /** For select_item when the button sits on a product card. */
  itemListName?: string;
}) {
  const { open } = useLead();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (itemListName && prefill?.tourSlug) {
          track('select_item', { item_list_name: itemListName, item_id: prefill.tourSlug, action: 'request' });
        }
        open({ source, ...prefill });
      }}
    >
      {children}
    </button>
  );
}
