/**
 * TrustStrip — a horizontal row of credibility marks (TripAdvisor rating,
 * Kayak / JATA / IATA / ASTA accreditations, and a "30+ years" badge).
 *
 * Self-contained (Tailwind utilities + brand tokens, sharp/flat) so it can be
 * dropped onto any page — the concierge shell now, the homepage later. Labels
 * are passed in for i18n; the marks themselves are the site's real
 * accreditations (cf. the footer "JATA, IATA, ASTA … accredited").
 *
 * Session 1: ships with glyph/star treatment only — no partner-logo assets,
 * and the items are non-linked (the TripAdvisor URL is a pending soft-gate
 * dependency; wire links when the assets/URL land).
 */

import type { ReactNode } from 'react';

const DM = 'font-[family-name:var(--font-dm-sans)]';

function Mark({ glyph, label }: { glyph: ReactNode; label: string }) {
  return (
    <div
      role="listitem"
      className="flex min-w-[80px] shrink-0 flex-col items-center gap-1.5 px-3 py-2"
    >
      <span className="flex h-9 items-center justify-center text-night">{glyph}</span>
      <span
        className={`${DM} text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted`}
      >
        {label}
      </span>
    </div>
  );
}

export function TrustStrip({
  label,
  yearsLabel,
  yearsValue = '30+',
}: {
  label: string;
  yearsLabel: string;
  yearsValue?: string;
}) {
  return (
    <div className="mx-auto max-w-[920px]">
      <p
        className={`${DM} mb-3 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-ink-muted`}
      >
        {label}
      </p>
      <div
        role="list"
        className="flex items-stretch justify-center gap-5 overflow-x-auto px-6 [scrollbar-width:none] md:gap-7 [&::-webkit-scrollbar]:hidden"
      >
        {/* TripAdvisor — rating + brand-green stars (kept green; it is the mark) */}
        <div
          role="listitem"
          className="flex min-w-[80px] shrink-0 flex-col items-center gap-1.5 px-3 py-2"
        >
          <span className="flex h-9 items-center justify-center text-night">
            <svg width="28" height="28" viewBox="0 0 22 22" fill="currentColor" aria-hidden>
              <circle cx="11" cy="11" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="7.5" cy="11" r="2.5" fill="currentColor" />
              <circle cx="14.5" cy="11" r="2.5" fill="currentColor" />
            </svg>
          </span>
          <span aria-hidden className="text-[14px] leading-none tracking-[-1px] text-[#00B67A]">
            ●●●●●
          </span>
          <span
            className={`${DM} text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted`}
          >
            TripAdvisor
          </span>
        </div>

        <Mark
          label="Kayak"
          glyph={
            <svg width="28" height="28" viewBox="0 0 22 22" aria-hidden>
              <path
                d="M3 7l4 4 4-4 4 4 4-4M3 13l4 4 4-4 4 4 4-4"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <Mark
          label="JATA"
          glyph={
            <svg width="28" height="28" viewBox="0 0 22 22" aria-hidden>
              <rect x="2" y="6" width="18" height="12" rx="0" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          }
        />
        <Mark
          label="IATA"
          glyph={
            <svg width="28" height="28" viewBox="0 0 22 22" aria-hidden>
              <path d="M11 2 L20 11 L11 20 L2 11 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="11" cy="11" r="3" fill="currentColor" />
            </svg>
          }
        />
        <Mark
          label="ASTA"
          glyph={
            <svg width="28" height="28" viewBox="0 0 22 22" aria-hidden>
              <path d="M2 18 L11 4 L20 18 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M11 9 L11 14" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          }
        />

        {/* Years badge — warm gold treatment, sharp/flat */}
        <div
          role="listitem"
          className="flex min-w-[80px] shrink-0 flex-col items-center justify-center gap-1 border border-[#b89456]/40 bg-[#b89456]/[0.07] px-3 py-2"
        >
          <span className="font-serif text-[26px] font-medium italic leading-none text-[#b89456]">
            {yearsValue}
          </span>
          <span
            className={`${DM} text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[#8c6b38]`}
          >
            {yearsLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
