'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { usePathname } from '@/i18n/navigation';
import { LeadButton } from '@/components/leads/LeadProvider';
import { track } from '@/lib/analytics';

import { FromPrice, NavLinkItem } from './NavLinkItem';
import type { NavChrome } from './types';

/**
 * Mobile menu (<1024px; nav rebuild, 2026-11-10). Open sheet, top to bottom:
 * the free-itinerary button, the WhatsApp button, one accordion per menu
 * (only one open at a time; same items, groups and prices as desktop), then
 * the currency and language switchers. Traps focus while open; closes on Esc
 * (focus returns to the button), on any link click, and on route change.
 */
export function MobileMenu({ chrome, switchers }: { chrome: NavChrome; switchers: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []).filter(
        (el) => el.offsetParent !== null,
      );
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = [btnRef.current!, ...focusables()];
      const i = els.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        els[els.length - 1]?.focus();
      } else if (!e.shiftKey && i === els.length - 1) {
        e.preventDefault();
        els[0]?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="t2e-burger"
        aria-label={open ? chrome.closeMenu : chrome.openMenu}
        aria-expanded={open}
        aria-controls="t2e-mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          {open ? (
            <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          ) : (
            <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <div id="t2e-mobile-menu" ref={panelRef} className="t2e-mm" role="dialog" aria-modal="true" aria-label={chrome.primaryNavLabel}>
          <div className="t2e-mm-actions" onClickCapture={close}>
            <LeadButton source="mobile_menu" className="t2e-mm-lead" openEvent={{ name: 'form_open', params: { location: 'mobile_menu' } }}>
              {chrome.lead}
            </LeadButton>
            <a
              className="t2e-mm-wa"
              href={chrome.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={chrome.whatsappAria}
              onClick={() => track('contact', { method: 'whatsapp', location: 'mobile_menu' })}
            >
              {chrome.whatsappButton}
            </a>
          </div>

          <ul className="t2e-mm-list">
            {chrome.menus.map((m) => {
              const isOpen = section === m.id;
              let pos = 0;
              return (
                <li key={m.id} className="t2e-mm-section">
                  <button
                    type="button"
                    className="t2e-mm-head"
                    aria-expanded={isOpen}
                    aria-controls={`t2e-mm-${m.id}`}
                    onClick={() => setSection(isOpen ? null : m.id)}
                  >
                    <span>{m.label}</span>
                    <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true" className={isOpen ? 't2e-dd-chev open' : 't2e-dd-chev'}>
                      <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div id={`t2e-mm-${m.id}`} className="t2e-mm-body" hidden={!isOpen}>
                    {m.all && (
                      <NavLinkItem item={m.all} menu="mobile" group={m.id} position={pos++} className="t2e-mm-all" onNavigate={close}>
                        {m.all.label} →
                      </NavLinkItem>
                    )}
                    {m.groups.map((g) => (
                      <div key={g.id} className="t2e-mm-group">
                        {g.label && <p className="t2e-dd-glabel">{g.label}</p>}
                        <ul>
                          {g.items.map((item) => (
                            <li key={item.id}>
                              <NavLinkItem item={item} menu="mobile" group={`${m.id}/${g.id}`} position={pos++} className="t2e-mm-link" onNavigate={close}>
                                <span>{item.label}</span>
                                {item.fromEur ? (
                                  <span className="t2e-dd-price">
                                    <FromPrice eur={item.fromEur} template={chrome.fromTemplate} />
                                  </span>
                                ) : null}
                              </NavLinkItem>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {m.leadCta && (
                      <span onClickCapture={close}>
                      <LeadButton source="mobile_menu" className="t2e-dd-lead" openEvent={{ name: 'form_open', params: { location: 'mobile_menu' } }}>
                        {m.leadCta}
                      </LeadButton>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="t2e-mm-switchers">{switchers}</div>
        </div>
      )}
    </>
  );
}
