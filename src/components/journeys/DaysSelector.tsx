'use client';

import { useState } from 'react';

import { useLead } from '@/components/leads/LeadProvider';
import { track } from '@/lib/analytics';
import { dayBandFor } from '@/lib/leads/schema';

/**
 * "How many days do you have?" (journey pages Phase B, 2026-11-10). One chip
 * per distinct duration among the approved tour picks — never an invented
 * length. Choosing a chip scrolls to and highlights the matching card(s), and
 * pre-sets "How many days?" in the Plan my trip dialog and the end form.
 */
export function DaysSelector({
  journey,
  heading,
  line,
  chips,
}: {
  journey: string;
  heading: string;
  /** The essay's own length advice (approved facts value). */
  line: string;
  /** Distinct durations, ascending, with the card ids each one maps to. */
  chips: Array<{ days: number; label: string; cardIds: string[] }>;
}) {
  const { setDaysPreset } = useLead();
  const [active, setActive] = useState<number | null>(null);

  const choose = (chip: (typeof chips)[number]) => {
    setActive(chip.days);
    const band = dayBandFor(chip.days) || null;
    setDaysPreset(band);
    // The end form is uncontrolled: set its select directly.
    const sel = document.querySelector<HTMLSelectElement>('.journey-form select[name="days"]');
    if (sel && band) sel.value = band;
    document.querySelectorAll('.pcard.is-picked').forEach((el) => el.classList.remove('is-picked'));
    const cards = chip.cardIds.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    cards.forEach((el) => el.classList.add('is-picked'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Horizontal carousel on mobile: bring the card into view on both axes.
    cards[0]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center', inline: 'center' });
    track('select_days', { journey, days: chip.days });
  };

  return (
    <section className="journey-days" aria-labelledby="h-journey-days">
      <div className="wrap wrap--wide">
        <h2 id="h-journey-days" className="jd-h">
          {heading}
        </h2>
        <div className="jd-chips" role="group" aria-labelledby="h-journey-days">
          {chips.map((c) => (
            <button key={c.days} type="button" className="jd-chip" aria-pressed={active === c.days} onClick={() => choose(c)}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="jd-line">{line}</p>
      </div>
    </section>
  );
}
