'use client';

import { Link } from '@/i18n/navigation';
import { useLead } from '@/components/leads/LeadProvider';

/**
 * Closing band for /nile-cruises (Nile Cruises rebuild, §9). Same dark band
 * as the shared ConciergeCTA, but the primary button opens the itinerary
 * dialog pre-set with "Interested in: Nile cruise" — plus the boat type when
 * the reader arrived through a ?vessel= filter.
 */
export function NileCruisePlanBlock({
  eyebrow,
  heading,
  bodyLead,
  primaryLabel,
  secondaryLabel,
  whatsappHref,
  conciergeLabel,
  conciergeHref,
  note,
  vesselLabels,
}: {
  eyebrow: string;
  heading: string;
  /** "We'll come back with cabins, sailing dates and a price —" */
  bodyLead: string;
  primaryLabel: string;
  secondaryLabel: string;
  whatsappHref: string;
  conciergeLabel: string;
  conciergeHref: string;
  /** "Interested in: Nile cruise" */
  note: string;
  /** ?vessel= value → localized boat label. */
  vesselLabels: Record<string, string>;
}) {
  const { open, responseTime } = useLead();
  const tail = responseTailFor(responseTime.full);

  function onPrimary() {
    let notes = note;
    try {
      const vessel = new URLSearchParams(window.location.search).get('vessel');
      if (vessel && vesselLabels[vessel]) notes = `${note} · ${vesselLabels[vessel]}`;
    } catch {
      /* no window.location — keep the plain note */
    }
    open({ source: 'nile_cruises', kind: 'trip', notes });
  }

  return (
    <section className="bg-night text-paper">
      <div className="relative mx-auto max-w-[920px] px-6 py-24 md:py-32">
        <p className="mb-8 font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand">{eyebrow}</p>
        <h2 className="mb-8 max-w-[18em] font-serif text-[clamp(2.25rem,4.5vw,3.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-paper">
          {heading}
        </h2>
        <p className="mb-12 max-w-[32em] text-[1.0625rem] leading-[1.7] text-paper/80">
          {tail ? `${bodyLead} ${tail}` : `${bodyLead} ${responseTime.full}`}
        </p>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <button type="button" className="btn-primary" onClick={onPrimary}>
            <span>{primaryLabel}</span>
            <span aria-hidden>→</span>
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <span>{secondaryLabel}</span>
            <span aria-hidden>→</span>
          </a>
        </div>

        <p className="mt-8 font-serif text-lg italic text-paper/80">
          <Link href={conciergeHref} className="border-b border-sand/60 text-paper hover:border-sand">
            {conciergeLabel} <span aria-hidden>→</span>
          </Link>
        </p>
      </div>
    </section>
  );
}

/**
 * The approved responseTimeFull sentence, minus its "We reply" subject, so it
 * can follow "…and a price —" without rewording the approved promise:
 * EN "We reply by 8 PM…" → "by 8 PM…"; ES "Respondemos antes de…" → "antes de…".
 * JA has no separable subject, so the full sentence follows unchanged.
 * Returns null when the sentence has an unexpected shape (caller then shows
 * the full sentence as is).
 */
export function responseTailFor(full: string): string | null {
  const m = full.match(/^(?:We reply|Respondemos)\s+(.+)$/s);
  if (m) return m[1];
  if (/^[^\x00-\x7F]/.test(full)) return full; // JA
  return null;
}
