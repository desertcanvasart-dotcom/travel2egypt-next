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
 */
interface OpenArgs extends LeadPrefill {
  source: LeadSource;
}

interface LeadContextValue {
  open: (args: OpenArgs) => void;
}

const LeadContext = createContext<LeadContextValue | null>(null);

export function LeadProvider({ locale, children }: { locale: string; children: ReactNode }) {
  const [current, setCurrent] = useState<OpenArgs | null>(null);
  // Remount the form on every open so a previous thank-you state is cleared.
  const [openCount, setOpenCount] = useState(0);
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

  const value = useMemo(() => ({ open }), [open]);
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
            ? 'Tell us the day and how many of you. We confirm availability and the price by email, the same day.'
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
