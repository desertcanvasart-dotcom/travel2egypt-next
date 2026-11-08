'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

/**
 * City tabs for the day-tours section (WAI-ARIA tabs pattern: arrow keys move
 * between tabs, only the active tab is in the tab order). The panels are
 * rendered on the server and passed in, so every card is in the HTML for
 * crawlers; inactive panels are `hidden`, not removed.
 */
export function DayToursTabs({
  tabs,
  label,
}: {
  tabs: Array<{ key: string; label: string; from: ReactNode; panel: ReactNode }>;
  /** Accessible name of the tab list ("Day tours by city"). */
  label: string;
}) {
  const [active, setActive] = useState(0);
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="dt-tabs">
      <div role="tablist" aria-label={label} className="dt-tablist">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${t.key}`}
            aria-selected={active === i}
            aria-controls={`${base}-panel-${t.key}`}
            tabIndex={active === i ? 0 : -1}
            className={active === i ? 'dt-tab on' : 'dt-tab'}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="dt-tab-label">{t.label}</span>
            <span className="dt-tab-from">{t.from}</span>
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`${base}-panel-${t.key}`}
          aria-labelledby={`${base}-tab-${t.key}`}
          hidden={active !== i}
          tabIndex={0}
          className="dt-panel"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
