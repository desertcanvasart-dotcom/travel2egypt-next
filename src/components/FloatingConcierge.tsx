'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

/**
 * Persistent concierge affordance for the article template: a fixed trigger
 * that opens a focus-trapped panel. There is no concierge backend yet, so the
 * panel hands off to the existing entry points — suggested questions and the
 * free-text box open WhatsApp with the message pre-filled, and a link routes
 * to /contact (the stopgap the rest of the site uses until /plan-your-tour
 * ships). It also opens in response to a `concierge:open` window event, which
 * the in-article sidebar prompt dispatches.
 *
 * Keyboard: Tab is trapped within the panel, Escape closes it, and focus
 * returns to the trigger on close.
 */

const WHATSAPP_BASE = 'https://wa.me/201158011600?text=';

function whatsappHref(message: string) {
  return WHATSAPP_BASE + encodeURIComponent(message);
}

export function FloatingConcierge() {
  const t = useTranslations('floatingConcierge');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const prompts = (t.raw('prompts') as string[]) ?? [];

  // Open in response to the sidebar's "Ask the concierge" button.
  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener('concierge:open', onOpen);
    return () => window.removeEventListener('concierge:open', onOpen);
  }, []);

  // Focus management + trap + Escape, mirroring the CookieConsent dialog.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button, input, textarea, [tabindex]:not([tabindex="-1"])'
      );
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
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[80]">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="flex items-center gap-3 bg-faience px-5 py-3 font-sans text-xs uppercase tracking-[0.16em] text-paper shadow-[0_12px_36px_rgba(20,36,59,0.2)] transition-colors hover:bg-faience-deep"
        >
          <span
            className="h-[7px] w-[7px] rounded-full bg-sand motion-safe:animate-pulse"
            aria-hidden
          />
          {t('trigger')}
        </button>
      </div>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="fixed bottom-24 right-6 z-[79] w-[min(380px,calc(100vw-2rem))] border border-rule-strong bg-paper p-7 shadow-[0_24px_60px_rgba(20,36,59,0.2)]"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={t('close')}
            className="absolute right-4 top-4 font-serif text-lg text-night-soft transition-colors hover:text-night"
          >
            ✕
          </button>
          <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand-warm">
            {t('eyebrow')}
          </p>
          <h2 id={titleId} className="mb-3 font-serif text-2xl font-normal leading-tight text-night">
            {t('title')}
          </h2>
          <p className="mb-5 font-serif text-base italic leading-snug text-night-soft">
            {t('sub')}
          </p>
          {prompts.length > 0 && (
            <ul className="mb-5">
              {prompts.map((prompt) => (
                <li key={prompt} className="border-b border-rule last:border-0">
                  <a
                    href={whatsappHref(prompt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2 py-3 text-left font-sans text-sm leading-snug text-night transition-colors hover:text-faience"
                  >
                    <span aria-hidden className="font-serif text-sand">
                      →
                    </span>
                    {prompt}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const message = draft.trim();
              if (!message) return;
              window.open(whatsappHref(message), '_blank', 'noopener,noreferrer');
            }}
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('inputPlaceholder')}
              className="w-full border border-rule bg-limestone-warm px-3.5 py-3 font-sans text-sm text-night outline-none focus:border-sand"
            />
          </form>
          <Link
            href="/contact"
            className="mt-4 inline-block font-sans text-xs uppercase tracking-[0.06em] text-sand-warm transition-colors hover:text-night"
          >
            {t('contactCta')} <span aria-hidden>→</span>
          </Link>
        </div>
      )}
    </>
  );
}
