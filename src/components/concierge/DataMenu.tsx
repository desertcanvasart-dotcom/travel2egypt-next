'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { PUBLIC_TEAM_EMAIL } from '@/lib/concierge/constants';
import { Dialog } from '@/components/ui/Dialog';

/**
 * "Your data" menu (Session 8) — the visitor's concierge data rights, on the
 * shared Dialog primitive (no new primitive). Two actions:
 *   • Delete my conversation → confirm → POST /api/data-request { delete }
 *     (anonymise this session; server clears the cookie) → onDeleted() resets
 *     the chat to a fresh empty state.
 *   • Request a copy of your data → a mailto to the public team inbox with the
 *     session reference prefilled (lightest v1; no automated export endpoint).
 */

interface DataMenuProps {
  open: boolean;
  onClose: () => void;
  sessionRef: string | null;
  locale: 'en' | 'es';
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Called after a successful anonymise — the parent resets its chat state. */
  onDeleted: () => void;
}

export function DataMenu({ open, onClose, sessionRef, locale, triggerRef, onDeleted }: DataMenuProps) {
  const t = useTranslations('planYourTour');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  function reset() {
    setConfirming(false);
    setSending(false);
    setError(false);
  }

  function close() {
    reset();
    onClose();
  }

  const ref = sessionRef ?? '';
  const mailtoHref =
    `mailto:${PUBLIC_TEAM_EMAIL}` +
    `?subject=${encodeURIComponent(t('dataExportSubject', { ref }))}` +
    `&body=${encodeURIComponent(t('dataExportBody', { ref }))}`;

  async function submitDelete() {
    if (sending) return;
    setSending(true);
    setError(false);
    try {
      const res = await fetch('/api/data-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });
      if (!res.ok) {
        setError(true);
        setSending(false);
        return;
      }
      reset();
      onClose();
      onDeleted();
    } catch {
      setError(true);
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      backdrop
      backdropClassName="cnc-escape-overlay"
      className="cnc-escape-modal"
      ariaLabel={t('dataMenuHeading')}
      returnFocusRef={triggerRef}
    >
      <button
        type="button"
        className="cnc-escape-modal__close"
        aria-label={t('escapeClose')}
        onClick={close}
      >
        ✕
      </button>

      {!confirming ? (
        <>
          <h2 className="cnc-escape-modal__heading">{t('dataMenuHeading')}</h2>
          <p className="cnc-escape-modal__sub">{t('dataMenuSub')}</p>
          <div className="cnc-escape-options">
            <button type="button" className="cnc-escape-option" onClick={() => setConfirming(true)}>
              <span className="cnc-escape-option__title">{t('dataDeleteTitle')}</span>
              <span className="cnc-escape-option__desc">{t('dataDeleteDesc')}</span>
            </button>
            <a
              className="cnc-escape-option"
              href={mailtoHref}
              onClick={() => close()}
            >
              <span className="cnc-escape-option__title">{t('dataExportTitle')}</span>
              <span className="cnc-escape-option__desc">{t('dataExportDesc')}</span>
            </a>
          </div>
        </>
      ) : (
        <>
          <h2 className="cnc-escape-modal__heading">{t('dataDeleteTitle')}</h2>
          <p className="cnc-escape-modal__sub">{t('dataDeleteConfirm')}</p>
          {error && <p className="cnc-escape-error">{t('dataDeleteError')}</p>}
          <div className="cnc-escape-actions">
            <button type="button" className="cnc-textlink" onClick={() => setConfirming(false)}>
              {t('dataDeleteCancel')}
            </button>
            <button
              type="button"
              className="cnc-escape-send cnc-escape-send--danger"
              onClick={() => void submitDelete()}
              disabled={sending}
            >
              {sending ? t('dataDeleting') : t('dataDeleteConfirmBtn')}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
