'use client';

/**
 * Cookie-consent state.
 *
 * Strictly-necessary cookies: `NEXT_LOCALE` (reading language),
 * `t2e_session_id` (AI concierge session, set only when the concierge is
 * used, 30 days) and `t2e_ccy` (display currency, set only when chosen).
 *
 * Optional: Google Analytics (see lib/analytics.ts). When GA is configured
 * (`ANALYTICS_ENABLED`) the notice becomes a real choice — "Accept
 * analytics" / "Essential only", equally prominent — and the answer drives
 * Consent Mode. When GA is not configured the notice stays informational
 * ("Got it") and records no optional consent.
 *
 * The decision is persisted in localStorage under a versioned key and
 * re-requested after 12 months (ICO / CNIL guidance on consent refresh).
 * `v2 → v3` (GA4 introduction) re-prompts every visitor once, since no
 * earlier record carried an analytics choice. The GA bootstrap script reads
 * the same key so a returning visitor's first page view already honours it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY } from '@/lib/analytics';

/**
 * Optional cookie categories. `analytics` gates Google Analytics storage;
 * `marketing` is unused (the site runs no ads) and always false.
 */
export type ConsentCategories = {
  analytics: boolean;
  marketing: boolean;
};

export type ConsentRecord = {
  /** Epoch ms the notice was acknowledged / the choice recorded. */
  timestamp: number;
  categories: ConsentCategories;
};

// Versioned key — bump the suffix (in lib/analytics.ts) to cleanly re-prompt
// every visitor if the cookie policy materially changes.
const STORAGE_KEY = CONSENT_STORAGE_KEY;
const MAX_AGE_MS = CONSENT_MAX_AGE_MS;

const NO_OPTIONAL: ConsentCategories = { analytics: false, marketing: false };

function readStored(): ConsentRecord | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (
      typeof parsed.timestamp !== 'number' ||
      Date.now() - parsed.timestamp > MAX_AGE_MS ||
      typeof parsed.categories?.analytics !== 'boolean' ||
      typeof parsed.categories?.marketing !== 'boolean'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(categories: ConsentCategories): ConsentRecord {
  const record: ConsentRecord = { timestamp: Date.now(), categories };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // localStorage unavailable (private mode / disabled). Consent is then
    // session-only and the notice reappears next visit — acceptable.
  }
  return record;
}

interface ConsentContextValue {
  /** The stored record, or null if the visitor has not seen the notice. */
  consent: ConsentRecord | null;
  /** Whether the notice is currently visible. */
  isOpen: boolean;
  /** True once localStorage has been read on the client (post-hydration). */
  ready: boolean;
  /** Record that the visitor has seen the notice ("Got it" / Escape). */
  acknowledge: () => void;
  /** Re-open the notice — footer "Cookie preferences" control. */
  openNotice: () => void;
  /** Record a granular choice ("Accept analytics" / "Essential only"). */
  updateConsent: (categories: ConsentCategories) => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setConsent(stored);
    setIsOpen(stored === null);
    setReady(true);
  }, []);

  const commit = useCallback((categories: ConsentCategories) => {
    setConsent(writeStored(categories));
    setIsOpen(false);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      isOpen,
      ready,
      acknowledge: () => commit(consent?.categories ?? NO_OPTIONAL),
      openNotice: () => setIsOpen(true),
      updateConsent: (categories: ConsentCategories) => commit(categories),
    }),
    [consent, isOpen, ready, commit]
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return ctx;
}
