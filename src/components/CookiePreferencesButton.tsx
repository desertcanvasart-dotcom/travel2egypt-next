'use client';

import { useTranslations } from 'next-intl';

import { useConsent } from '@/lib/consent';

/**
 * Persistent control to re-open the cookie notice — lets a visitor revisit
 * the statement after dismissing it. Lives in the footer Resources column.
 */
export function CookiePreferencesButton() {
  const t = useTranslations('footer');
  const { openNotice } = useConsent();

  return (
    <button
      type="button"
      onClick={openNotice}
      className="text-left transition-colors hover:text-faience"
    >
      {t('cookiePreferences')}
    </button>
  );
}
