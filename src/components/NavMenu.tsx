'use client';

import { useEffect, useRef, useState } from 'react';

import { Link } from '@/i18n/navigation';

/**
 * Generic header dropdown (English sales nav, 2026-11-08). Same interaction
 * as JourneysMenu: opens on hover and on click, closes on outside click and
 * Escape, with a transparent bridge so the pointer can cross to the menu.
 * An optional `href` makes the label itself a link (the category page),
 * with a separate chevron button toggling the menu.
 */
export function NavMenu({
  label,
  href,
  items,
}: {
  label: string;
  href?: string;
  items: Array<{ label: string; href: string; strong?: boolean }>;
}) {
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

  const chevron = (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div ref={wrapRef} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {href ? (
        <span className="flex items-center gap-1.5">
          <Link href={href}>{label}</Link>
          <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={`${label} menu`} onClick={() => setOpen((v) => !v)}>
            {chevron}
          </button>
        </span>
      ) : (
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5">
          <span>{label}</span>
          {chevron}
        </button>
      )}
      {open && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <ul role="menu" className="min-w-[15rem] overflow-hidden border border-rule-strong bg-paper">
            {items.map((item) => (
              <li key={item.href + item.label} role="none">
                <Link
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`block whitespace-nowrap text-night-soft transition-colors hover:bg-limestone hover:text-night${item.strong ? ' font-semibold' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
