'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

// EN category slugs. The root catch-all's slugLookupQuery falls back to the
// EN slug when a locale slug is null, so these resolve in every locale.
const SERVICE_LINKS = [
  { key: 'servicePrivateDayTours', href: '/private-day-tours' },
  { key: 'serviceGroupDayTours', href: '/group-day-tours' },
  { key: 'serviceEgyptPackages', href: '/egypt-travel-packages' },
  { key: 'serviceGroupPackages', href: '/small-group-travel-packages' },
] as const;

export function ServicesMenu() {
  const t = useTranslations('nav');
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

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-night-soft transition-colors hover:text-faience"
      >
        <span>{t('services')}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        // Wrapper sits flush under the button (top-full) with a transparent
        // pt-2 bridge so the pointer never leaves the hover region while
        // crossing the visual gap to the menu — otherwise onMouseLeave fires
        // and the menu vanishes before it can be clicked.
        <div className="absolute left-0 top-full z-50 pt-2">
          <ul
            role="menu"
            className="min-w-[15rem] overflow-hidden border border-rule-strong bg-paper"
          >
            {SERVICE_LINKS.map(({ key, href }) => (
              <li key={key} role="none">
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 font-serif text-sm text-night-soft transition-colors hover:bg-limestone hover:text-night"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
