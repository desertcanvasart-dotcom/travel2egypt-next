'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import { whatsappUrl } from '@/lib/concierge/constants';
import { useLead } from '@/components/leads/LeadProvider';

/**
 * Persistent floating concierge — reconciled to the approved tour-system
 * reference (journey-1/2/3). Classes/styles live in src/styles/tour-system.css
 * (.t2e-conc*). Opens in response to a `concierge:open` window event
 * dispatched by in-page prompts.
 *
 * Where a question goes (2026-11-09 — this panel predated the AI concierge
 * and sent everything to WhatsApp, even after the copy said "AI concierge"):
 *  - EN/ES with the chat on: the AI concierge on /plan-your-tour#concierge,
 *    with the question pre-filled in its input (?q=) and this page's tour as
 *    context (?tour=).
 *  - JA (the concierge doesn't speak Japanese) or the chat switched off:
 *    WhatsApp with the question pre-filled, and the panel says so.
 *
 * Keyboard: Tab is trapped within the panel, Escape closes it, focus returns
 * to the trigger on close.
 */



export function FloatingConcierge({
  tourSlug,
  initialOpen = false,
}: { tourSlug?: string | null; initialOpen?: boolean } = {}) {
  const t = useTranslations('floatingConcierge');
  const locale = useLocale();
  const router = useRouter();
  const { chatEnabled } = useLead();
  const toConcierge = chatEnabled && (locale === 'en' || locale === 'es');
  const conciergeHref = (q: string) => {
    const qs = new URLSearchParams();
    if (tourSlug) qs.set('tour', tourSlug);
    qs.set('q', q);
    return `/plan-your-tour?${qs.toString()}#concierge`;
  };
  const [open, setOpen] = useState(initialOpen);
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

  // Product template spec (2026-11-09): the concierge is hidden on every
  // Japanese page — it doesn't speak Japanese.
  if (locale === 'ja') return null;

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
        <p className="sub">{toConcierge ? t('sub') : t('subWhatsapp')}</p>
        {prompts.length > 0 && (
          <ul className="t2e-conc-list">
            {prompts.map((prompt) => (
              <li key={prompt}>
                {toConcierge ? (
                  <Link href={conciergeHref(prompt)} rel="nofollow" onClick={() => setOpen(false)}>
                    {prompt}
                  </Link>
                ) : (
                  <a href={whatsappUrl(prompt)} target="_blank" rel="noopener noreferrer">
                    {prompt}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const message = draft.trim();
            if (!message) return;
            if (toConcierge) {
              setOpen(false);
              router.push(conciergeHref(message.slice(0, 500)));
              return;
            }
            // Enter follows a real link (see the list above) rather than
            // window.open, which popup blockers intercept.
            const link = document.createElement('a');
            link.href = whatsappUrl(message);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.click();
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
