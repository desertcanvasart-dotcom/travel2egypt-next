'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useConsent } from '@/lib/consent';

/**
 * Informational cookie notice. The site sets only one essential cookie and
 * runs no tracking, so there is nothing to accept or reject — the notice
 * states that and is dismissed with a single "Got it". It is presented as
 * a non-blocking bottom slide-in panel; `role="dialog"` + focus trap mean a
 * keyboard or screen-reader user is taken to it and must act to dismiss.
 */
export function CookieConsent() {
  const t = useTranslations('consent');
  const { isOpen, ready, acknowledge } = useConsent();
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const gotItRef = useRef<HTMLButtonElement>(null);
  const headlineId = useId();
  const bodyId = useId();

  // Slide-in once open.
  useEffect(() => {
    if (!isOpen) {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  // Move focus to the dismiss button on appear; trap Tab within the notice;
  // Escape dismisses (equivalent to "Got it").
  useEffect(() => {
    if (!isOpen) return;
    gotItRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        acknowledge();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>('a[href], button');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, acknowledge]);

  if (!ready || !isOpen) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headlineId}
        aria-describedby={bodyId}
        className={`pointer-events-auto mx-auto max-w-2xl rounded-lg border border-rule-strong bg-paper p-6 shadow-[0_-4px_24px_rgba(19,17,10,0.16)] transition-transform duration-300 ease-out sm:p-7 ${
          shown ? 'translate-y-0' : 'translate-y-[120%]'
        }`}
      >
        <h2 id={headlineId} className="font-serif text-xl text-night">
          {t('headline')}
        </h2>
        <p
          id={bodyId}
          className="mt-2 font-sans text-sm leading-relaxed text-night-soft"
        >
          {t('body')}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            ref={gotItRef}
            type="button"
            onClick={acknowledge}
            className="rounded-full bg-faience px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-faience-deep"
          >
            {t('gotIt')}
          </button>
          <Link
            href="/cookie-policy"
            className="text-sm text-faience underline underline-offset-4 transition-colors hover:text-faience-deep"
          >
            {t('policyLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}
