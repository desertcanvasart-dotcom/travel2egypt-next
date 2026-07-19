'use client';

import { useEffect, useRef, useState } from 'react';

import { CURRENCIES, CURRENCY_ORDER } from '@/lib/currency';
import { useCurrency } from '@/lib/currency-context';

/**
 * Header currency picker — mirrors LocaleSwitcher. Sets the viewer's display
 * currency (persisted via the CurrencyProvider cookie). Prices across the site
 * re-format client-side on change.
 */
export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = CURRENCIES[currency] ?? CURRENCIES.EUR;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select currency (currently ${current.code})`}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 border-b border-rule-strong bg-transparent pb-[2px] text-xs font-medium uppercase tracking-[0.1em] text-night-soft transition-colors hover:border-faience hover:text-faience"
      >
        <span>{current.code}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul role="listbox" className="absolute right-0 z-50 mt-2 min-w-[9rem] overflow-hidden border border-rule-strong bg-paper">
          {CURRENCY_ORDER.map((code) => {
            const c = CURRENCIES[code];
            const active = code === currency;
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => { setCurrency(code); setOpen(false); }}
                  className={
                    active
                      ? 'flex w-full items-center justify-between bg-limestone px-4 py-2.5 text-left font-serif text-sm text-night'
                      : 'flex w-full items-center justify-between px-4 py-2.5 text-left font-serif text-sm text-night-soft transition-colors hover:bg-limestone hover:text-night'
                  }
                >
                  <span>{c.code}</span>
                  <span className="ml-4 font-sans text-[13px] text-night-soft">{c.symbol}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
