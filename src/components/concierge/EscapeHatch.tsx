'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { whatsappUrl } from '@/lib/concierge/constants';
import { computeFollowUpTimeframe } from '@/lib/concierge/timeframe';
import { Dialog } from '@/components/ui/Dialog';

/**
 * Escape hatch — "Talk to a human" (Session 5). Three options on the shared
 * Dialog primitive: WhatsApp the team, forward the conversation by email, or
 * continue with the AI. Choosing any option records it (POST
 * /api/escape-hatch → escape_hatch_* + flagged); the X / backdrop / Escape
 * close without recording. Sharp, flat, hairline — concierge tokens.
 */

type Action = 'whatsapp' | 'forward' | 'continue';

interface EscapeHatchProps {
  open: boolean;
  onClose: () => void;
  conversationId: string | null;
  sessionRef: string | null;
  locale: 'en' | 'es';
  /** Where focus returns when the dialog closes (the header trigger). */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

type View = 'options' | 'forward' | 'forwarded';

export function EscapeHatch({
  open,
  onClose,
  conversationId,
  sessionRef,
  locale,
  triggerRef,
}: EscapeHatchProps) {
  const t = useTranslations('planYourTour');
  const [view, setView] = useState<View>('options');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  function reset() {
    setView('options');
    setEmail('');
    setSending(false);
    setError(false);
  }

  function close() {
    reset();
    onClose();
  }

  /** Fire-and-forget recording (used by whatsapp + continue). */
  function record(action: Action) {
    if (!conversationId) return;
    void fetch('/api/escape-hatch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ conversationId, action, locale }),
    }).catch(() => {});
  }

  function onWhatsApp() {
    const ref = sessionRef ?? '';
    const text = ref ? t('escapeWhatsappText', { ref }) : t('escapeWhatsappTextNoRef');
    // Open synchronously on the click (avoids popup blockers); record after.
    window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer');
    record('whatsapp');
    close();
  }

  function onContinue() {
    record('continue');
    close();
  }

  async function submitForward() {
    if (sending || !conversationId) return;
    setSending(true);
    setError(false);
    try {
      const res = await fetch('/api/escape-hatch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          action: 'forward',
          locale,
          ...(email.trim() ? { email: email.trim() } : {}),
        }),
      });
      if (!res.ok) {
        setError(true);
        setSending(false);
        return;
      }
      setView('forwarded');
    } catch {
      setError(true);
      setSending(false);
    }
  }

  const tf = computeFollowUpTimeframe(locale);

  return (
    <Dialog
      open={open}
      onClose={close}
      backdrop
      backdropClassName="cnc-escape-overlay"
      className="cnc-escape-modal"
      ariaLabel={t('escapeHeading')}
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

      {view === 'options' && (
        <>
          <h2 className="cnc-escape-modal__heading">{t('escapeHeading')}</h2>
          <p className="cnc-escape-modal__sub">{t('escapeSub')}</p>
          <div className="cnc-escape-options">
            <button type="button" className="cnc-escape-option" onClick={onWhatsApp}>
              <span className="cnc-escape-option__title">{t('escapeWhatsappTitle')}</span>
              <span className="cnc-escape-option__desc">{t('escapeWhatsappDesc')}</span>
            </button>
            <button
              type="button"
              className="cnc-escape-option"
              onClick={() => setView('forward')}
              disabled={!conversationId}
            >
              <span className="cnc-escape-option__title">{t('escapeForwardTitle')}</span>
              <span className="cnc-escape-option__desc">
                {conversationId ? t('escapeForwardDesc') : t('escapeForwardDescEmpty')}
              </span>
            </button>
            <button type="button" className="cnc-escape-option" onClick={onContinue}>
              <span className="cnc-escape-option__title">{t('escapeContinueTitle')}</span>
              <span className="cnc-escape-option__desc">{t('escapeContinueDesc')}</span>
            </button>
          </div>
        </>
      )}

      {view === 'forward' && (
        <>
          <h2 className="cnc-escape-modal__heading">{t('escapeForwardTitle')}</h2>
          <p className="cnc-escape-modal__sub">{t('escapeForwardPrompt')}</p>
          <label className="cnc-escape-field">
            <span className="cnc-escape-field__label">{t('escapeForwardEmailLabel')}</span>
            <input
              type="email"
              className="cnc-escape-field__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('escapeForwardEmailPlaceholder')}
            />
          </label>
          {error && <p className="cnc-escape-error">{t('escapeForwardError')}</p>}
          <div className="cnc-escape-actions">
            <button type="button" className="cnc-textlink" onClick={() => setView('options')}>
              {t('escapeBack')}
            </button>
            <button
              type="button"
              className="cnc-escape-send"
              onClick={() => void submitForward()}
              disabled={sending}
            >
              {sending ? t('escapeForwardSending') : t('escapeForwardSend')}
            </button>
          </div>
        </>
      )}

      {view === 'forwarded' && (
        <>
          <h2 className="cnc-escape-modal__heading">{t('escapeForwardedHeading')}</h2>
          <p className="cnc-escape-modal__sub">
            {t('escapeForwardedBody', {
              cairoTime: tf.cairoTime,
              localTime: tf.localTime,
              day: t(tf.dayKey),
            })}
          </p>
          <div className="cnc-escape-actions">
            <Link href="/contact" className="cnc-textlink">
              {t('fallbackContactCta')}
            </Link>
            <button type="button" className="cnc-escape-send" onClick={close}>
              {t('escapeDone')}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
