'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { computeFollowUpTimeframe } from '@/lib/concierge/timeframe';
import type { BriefPayload } from '@/types/concierge';

/**
 * Brief-completion panel (Session 4). Rendered inline as the last item in
 * the conversation when Gate 2 confirms a brief. Matches the mockup
 * (showBriefPanel) + design spec §4: checkmark, "Your brief is ready,"
 * concrete Cairo+local timeframe, five summary chips, "Continue
 * conversation," and low-emphasis "Save my conversation." While the panel is
 * the active surface the chat input is disabled (handled by the parent);
 * "Continue conversation" re-enables it.
 */

interface BriefPanelProps {
  payload: BriefPayload;
  locale: 'en' | 'es';
  onContinue: () => void;
}

interface Chip {
  label: string;
  value: string;
}

export function BriefPanel({ payload, locale, onContinue }: BriefPanelProps) {
  const t = useTranslations('planYourTour');
  const [saveOpen, setSaveOpen] = useState(false);
  const [email, setEmail] = useState(payload.visitor.email ?? '');
  const [saveState, setSaveState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const tf = computeFollowUpTimeframe(locale);
  const dayWord = t(tf.dayKey);

  // Up to five summary chips — render only those with a value.
  const chips: Chip[] = [];
  const { trip, preferences, visitor } = payload;
  if (trip.travelers_count) {
    chips.push({ label: t('chipTravelers'), value: String(trip.travelers_count) });
  } else if (trip.travelers_detail) {
    chips.push({ label: t('chipTravelers'), value: trip.travelers_detail });
  }
  if (trip.destinations.length) {
    chips.push({ label: t('chipDestinations'), value: trip.destinations.join(', ') });
  }
  const dates = trip.dates_specific ?? trip.dates_window;
  if (dates) chips.push({ label: t('chipDates'), value: dates });
  if (trip.length_days) {
    chips.push({ label: t('chipLength'), value: t('daysValue', { count: trip.length_days }) });
  }
  if (preferences.comfort_level) {
    chips.push({ label: t('chipComfort'), value: preferences.comfort_level });
  }

  async function submitSave() {
    if (saveState === 'sending') return;
    setSaveState('sending');
    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), locale }),
      });
      setSaveState(res.ok ? 'sent' : 'error');
    } catch {
      setSaveState('error');
    }
  }

  return (
    <div className="cnc-msg cnc-msg--agent">
      <span className="cnc-msg__avatar" aria-hidden>
        T2E
      </span>
      <div className="cnc-brief" role="status">
        <div className="cnc-brief__icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 11 L9.5 15 L17 7" />
          </svg>
        </div>
        <h3 className="cnc-brief__heading">{t('briefHeading')}</h3>
        <p className="cnc-brief__body">
          {t('briefBody', {
            email: visitor.email ?? '',
            cairoTime: tf.cairoTime,
            localTime: tf.localTime,
            day: dayWord,
          })}
        </p>

        {chips.length > 0 && (
          <div className="cnc-brief__summary">
            <div className="cnc-brief__summary-label">{t('briefSummaryLabel')}</div>
            <div className="cnc-brief__chips">
              {chips.map((c, i) => (
                <span key={i} className="cnc-brief__chip">
                  <strong>{c.value}</strong> {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="cnc-brief__actions">
          <button type="button" className="cnc-textlink" onClick={onContinue}>
            {t('briefContinue')}
          </button>
          <span aria-hidden className="cnc-brief__dot">
            ·
          </span>
          {!saveOpen ? (
            <button type="button" className="cnc-textlink" onClick={() => setSaveOpen(true)}>
              {t('briefSave')}
            </button>
          ) : saveState === 'sent' ? (
            <span className="cnc-brief__save-ok">{t('briefSaveSuccess')}</span>
          ) : (
            <span className="cnc-brief__save">
              <input
                type="email"
                className="cnc-brief__save-input"
                placeholder={t('briefSavePlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label={t('briefSavePlaceholder')}
              />
              <button
                type="button"
                className="cnc-textlink"
                onClick={() => void submitSave()}
                disabled={saveState === 'sending' || !email.trim()}
              >
                {saveState === 'sending' ? t('briefSaveSending') : t('briefSaveSubmit')}
              </button>
              {saveState === 'error' && (
                <span className="cnc-brief__save-err">{t('briefSaveError')}</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
