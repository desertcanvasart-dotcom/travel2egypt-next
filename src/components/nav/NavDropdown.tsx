'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Link } from '@/i18n/navigation';
import { LeadButton } from '@/components/leads/LeadProvider';
import { track } from '@/lib/analytics';

import { FromPrice, NavLinkItem } from './NavLinkItem';
import type { NavMenu } from './types';

/**
 * Desktop header dropdown (nav rebuild, 2026-11-10). The top-level label is
 * its own link (unchanged target); the chevron button opens the panel.
 * Opens on hover and on Enter/Space (the button), closes on Esc (focus back
 * to the button), outside click, focus leaving the menu, or a link click.
 * Panel: "All …" first, then labelled groups (small caps, not links), prices
 * right-aligned, and an optional closing "Get a free itinerary" action.
 */
export function NavDropdown({ menu, fromTemplate, menuLabel }: { menu: NavMenu; fromTemplate: string; menuLabel: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  let pos = 0;
  const close = () => setOpen(false);

  return (
    <div
      ref={wrapRef}
      className="t2e-dd"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <span className="t2e-dd-trigger">
        <Link
          href={menu.href as never}
          onClick={() => track('nav_click', { menu: 'header', group: menu.id, item: `${menu.id}_label`, position: 0 })}
        >
          {menu.label}
        </Link>
        <button
          ref={btnRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={menuLabel}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={open ? 't2e-dd-chev open' : 't2e-dd-chev'}>
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </span>
      <div id={panelId} className="t2e-dd-panel" hidden={!open}>
        {menu.all && (
          <NavLinkItem item={menu.all} menu="header" group={menu.id} position={pos++} className="t2e-dd-all" onNavigate={close}>
            {menu.all.label} →
          </NavLinkItem>
        )}
        {menu.groups.map((g) => (
          <div key={g.id} className="t2e-dd-group">
            {g.label && <p className="t2e-dd-glabel">{g.label}</p>}
            <ul>
              {g.items.map((item) => (
                <li key={item.id}>
                  <NavLinkItem item={item} menu="header" group={`${menu.id}/${g.id}`} position={pos++} className="t2e-dd-link" onNavigate={close}>
                    <span className="t2e-dd-name">{item.label}</span>
                    {item.fromEur ? (
                      <span className="t2e-dd-price">
                        <FromPrice eur={item.fromEur} template={fromTemplate} />
                      </span>
                    ) : null}
                  </NavLinkItem>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {menu.leadCta && (
          <LeadButton source="nav_menu" className="t2e-dd-lead" openEvent={{ name: 'form_open', params: { location: 'header' } }}>
            {menu.leadCta}
          </LeadButton>
        )}
      </div>
    </div>
  );
}
