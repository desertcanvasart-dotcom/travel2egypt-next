'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';

// Same six "Where should your Egypt start?" journeys as the desktop dropdown
// (JourneysMenu). Surfaced inline in the mobile sheet because the desktop
// hover-dropdown has no touch equivalent.
const JOURNEY_LINKS = [
  { key: 'journeyFirstTime', hash: 'first-time-in-egypt' },
  { key: 'journeyCultural', hash: 'the-cultural-traveller' },
  { key: 'journeyFamily', hash: 'travelling-as-a-family' },
  { key: 'journeyDesert', hash: 'desert-and-quiet' },
  { key: 'journeyStyle', hash: 'travelling-in-style' },
  { key: 'journeyReturning', hash: 'coming-back' },
] as const;

/**
 * Hamburger + sheet for the primary nav below the 980px breakpoint, where the
 * desktop `.t2e-nav-links` are hidden. The button stays in the DOM at all
 * widths but CSS only reveals it under 980px; the sheet only renders while
 * open. Closes on Escape, outside-click, route change, and on resize back to
 * desktop. Focus moves into the sheet on open and returns to the button on
 * Escape.
 */
export function MobileNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // Close whenever the route changes (a link inside the sheet was followed).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape + outside-click to close; move focus into the sheet on open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      const node = e.target as Node;
      if (!panelRef.current?.contains(node) && !btnRef.current?.contains(node)) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  // If the viewport grows past the nav breakpoint while the sheet is open, the
  // burger disappears — close so we don't strand an orphaned panel.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 981px)');
    function onChange() {
      if (mq.matches) setOpen(false);
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const hashHref = (hash: string) =>
    locale === 'en' ? `/#${hash}` : `/${locale}#${hash}`;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const cur = (href: string) => (isActive(href) ? 'page' : undefined);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="t2e-burger"
        aria-label={open ? t('closeMenu') : t('openMenu')}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="t2e-mobile-nav"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          {open ? (
            <path
              d="M5 5l12 12M17 5L5 17"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M3 6h16M3 11h16M3 16h16"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {open && (
        <div id="t2e-mobile-nav" ref={panelRef} className="t2e-mobile-sheet">
          <ul>
            <li>
              <Link href="/guide" aria-current={cur('/guide')}>
                {t('guide')}
              </Link>
            </li>
            <li>
              <Link href="/travel-tips" aria-current={cur('/travel-tips')}>
                {t('travelTips')}
              </Link>
            </li>
            <li>
              <span className="ms-heading">{t('journeys')}</span>
              <ul className="ms-sub">
                {JOURNEY_LINKS.map(({ key, hash }) => (
                  <li key={key}>
                    <a href={hashHref(hash)}>{t(key)}</a>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <Link href="/blog" aria-current={cur('/blog')}>
                {t('blog')}
              </Link>
            </li>
            <li>
              <Link href="/about" aria-current={cur('/about')}>
                {t('about')}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
