'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { whatsappUrl } from '@/lib/concierge/constants';

/**
 * Persistent floating concierge — reconciled to the approved tour-system
 * reference (journey-1/2/3). Classes/styles live in src/styles/tour-system.css
 * (.t2e-conc*). There is no concierge backend yet, so suggested questions and
 * the free-text box hand off to WhatsApp with the message pre-filled. Opens in
 * response to a `concierge:open` window event dispatched by in-page prompts.
 *
 * Keyboard: Tab is trapped within the panel, Escape closes it, focus returns
 * to the trigger on close.
 */



export function FloatingConcierge() {
  const t = useTranslations('floatingConcierge');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const prompts = (t.raw('prompts') as string[]) ?? [];

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener('concierge:open', onOpen);
    return () => window.removeEventListener('concierge:open', onOpen);
  }, []);

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
      <div className="t2e-conc">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="t2e-conc-trigger"
        >
          <span className="dot" aria-hidden />
          {t('trigger')}
        </button>
      </div>

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-hidden={!open}
        className={open ? 't2e-conc-panel open' : 't2e-conc-panel'}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label={t('close')}
          className="t2e-conc-close"
        >
          ✕
        </button>
        <span className="t2e-kicker">{t('eyebrow')}</span>
        <h4 id={titleId}>{t('title')}</h4>
        <p className="sub">{t('sub')}</p>
        {prompts.length > 0 && (
          <ul className="t2e-conc-list">
            {prompts.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  onClick={() =>
                    window.open(whatsappUrl(prompt), '_blank', 'noopener,noreferrer')
                  }
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const message = draft.trim();
            if (!message) return;
            window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
          }}
        >
          <input
            className="t2e-conc-input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('inputPlaceholder')}
          />
        </form>
      </div>
    </>
  );
}
