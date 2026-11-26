'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useConsent } from '@/lib/consent';
import { ANALYTICS_ENABLED } from '@/lib/analytics';
import { Dialog } from '@/components/ui/Dialog';

/**
 * Cookie notice. Two modes, chosen by `ANALYTICS_ENABLED` (lib/analytics.ts):
 *  - GA configured → a real choice: "Accept analytics" / "Essential only",
 *    equal weight (CNIL: refusing must be as easy as accepting). Escape /
 *    closing counts as "Essential only".
 *  - GA not configured → the informational notice, dismissed with "Got it".
 * Both disclose the essential cookies (language, the concierge's
 * `t2e_session_id` and keyed IP/UA hashing, `t2e_ccy`). It is presented as
 * a slim bar at the bottom of the screen (owner, 19 Nov 2026, design review #1:
 * the old panel covered the whole first screen on phones): one short sentence,
 * the two equal-weight choices, and "Details", which opens the full disclosure
 * in place — the wording is unchanged, only folded. It stays a
 * panel; the shared `Dialog` primitive (Session 5) supplies `role="dialog"` +
 * the focus trap so a keyboard or screen-reader user is taken to it and must
 * act to dismiss. No behaviour change from the pre-S5 hand-rolled version —
 * Dialog was extracted FROM this component's pattern.
 */
const CHOICE =
  'rounded-full bg-faience px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-faience-deep';

export function CookieConsent() {
  const t = useTranslations('consent');
  const { isOpen, ready, acknowledge, updateConsent, consent } = useConsent();
  const [shown, setShown] = useState(false);
  const [details, setDetails] = useState(false);
  const detailsId = useId();
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

  if (!ready || !isOpen) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-6 sm:pb-5">
      <Dialog
        open
        onClose={acknowledge}
        ariaLabelledby={headlineId}
        ariaDescribedby={bodyId}
        initialFocusRef={gotItRef}
        className={`pointer-events-auto mx-auto max-w-4xl rounded-lg border border-rule-strong bg-paper px-4 py-3 shadow-[0_-4px_24px_rgba(19,17,10,0.16)] transition-transform duration-300 ease-out sm:px-5 sm:py-4 ${
          shown ? 'translate-y-0' : 'translate-y-[120%]'
        }`}
      >
        {/* The headline still names the dialog for screen readers; the bar shows one sentence. */}
        <h2 id={headlineId} className="sr-only">
          {ANALYTICS_ENABLED ? t('headlineAnalytics') : t('headline')}
        </h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <p id={bodyId} className="min-w-0 flex-1 font-sans text-sm leading-snug text-night">
            {ANALYTICS_ENABLED ? t('shortAnalytics') : t('short')}{' '}
            <button
              type="button"
              aria-expanded={details}
              aria-controls={detailsId}
              onClick={() => setDetails((d) => !d)}
              className="inline text-faience underline underline-offset-4 transition-colors hover:text-faience-deep"
            >
              {details ? t('hideDetails') : t('details')}
            </button>
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {ANALYTICS_ENABLED ? (
              <>
                <button
                  ref={gotItRef}
                  type="button"
                  onClick={() => updateConsent({ analytics: true, marketing: false })}
                  className={CHOICE}
                >
                  {t('accept')}
                </button>
                <button
                  type="button"
                  onClick={() => updateConsent({ analytics: false, marketing: false })}
                  className={CHOICE}
                >
                  {t('decline')}
                </button>
              </>
            ) : (
              <button ref={gotItRef} type="button" onClick={acknowledge} className={CHOICE}>
                {t('gotIt')}
              </button>
            )}
          </div>
        </div>
        {details && (
          <div id={detailsId} className="mt-3 border-t border-rule pt-3">
            {/* Capped + scrollable so the choices stay on screen on small phones. */}
            <p className="max-h-[35vh] overflow-y-auto font-sans text-sm leading-relaxed text-night-soft">
              {ANALYTICS_ENABLED ? t('bodyAnalytics') : t('body')}
            </p>
            {ANALYTICS_ENABLED && consent && (
              <p className="mt-2 font-sans text-xs text-night-soft">
                {consent.categories.analytics ? t('currentAccepted') : t('currentDeclined')}
              </p>
            )}
            <Link
              href="/cookie-policy"
              className="mt-2 inline-block text-sm text-faience underline underline-offset-4 transition-colors hover:text-faience-deep"
            >
              {t('policyLink')}
            </Link>
          </div>
        )}
      </Dialog>
    </div>
  );
}
