'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

// The six "Where should your Egypt start?" reader-types. Order matches the
// homepage card grid (top-left → bottom-right). Labels reuse the same i18n
// strings as the homepage cards so the two stay literally consistent across
// locales.
//
// All six traveller-types now have their own pages and link there directly.
// The item shape stays a route-or-hash union so the render's hashHref branch
// remains valid (no entry uses it now that "Travelling in style" is a route,
// but the branch is left intact rather than refactored away).
type JourneyLink =
  | { readonly key: string; readonly href: string }
  | { readonly key: string; readonly hash: string };

const JOURNEY_LINKS: readonly JourneyLink[] = [
  { key: 'journeyFirstTime', href: '/journeys/first-time-in-egypt' },
  { key: 'journeyCultural', href: '/journeys/the-cultural-traveller' },
  { key: 'journeyFamily', href: '/journeys/travelling-as-a-family' },
  { key: 'journeyDesert', href: '/journeys/desert-and-quiet' },
  { key: 'journeyStyle', href: '/journeys/travelling-in-style' },
  { key: 'journeyReturning', href: '/journeys/coming-back' },
];

export function JourneysMenu() {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Locale-aware homepage hash. Native <a> (not the client Link) so the browser
  // handles the anchor natively: on the homepage it scrolls without a reload;
  // from any other page it navigates to the locale home and scrolls to the
  // card. (App Router's client Link does not reliably scroll to hash targets.)
  // Built via getPathname (not a hand-rolled prefix) so localized pathnames —
  // the journey leaves in routing.ts — resolve per locale; identical output
  // for identity-mapped and unknown paths.
  const hashHref = (hash: string) => `${getPathname({ href: '/', locale })}#${hash}`;
  // A real route (e.g. the first-time page) — localized via getPathname, same
  // rule as hashHref so the link stays within the visitor's locale.
  const routeHref = (path: string) => getPathname({ href: path, locale });

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
        className="flex items-center gap-1.5 text-night-soft transition-colors hover:text-faience"
      >
        <span>{t('journeys')}</span>
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
            className="min-w-[16rem] overflow-hidden border border-rule-strong bg-paper"
          >
            {JOURNEY_LINKS.map((item) => (
              <li key={item.key} role="none">
                <a
                  href={'href' in item ? routeHref(item.href) : hashHref(item.hash)}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block whitespace-nowrap text-night-soft transition-colors hover:bg-limestone hover:text-night"
                >
                  {t(item.key)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
