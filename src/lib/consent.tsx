'use client';

/**
 * Cookie-consent state.
 *
 * The site sets only strictly-necessary cookies and loads no analytics or
 * marketing scripts, so there is nothing to gate — the visible UI is an
 * informational notice, not a consent choice. The cookies are: `NEXT_LOCALE`
 * (remembers the reading language, set site-wide) and `t2e_session_id` (the
 * AI concierge's signed session cookie — set ONLY when a visitor engages the
 * concierge, 30 days, scoped to travel2egypt.org). The concierge additionally
 * processes a keyed one-way HMAC of the visitor's IP / User-Agent for abuse
 * prevention; the raw values are never stored or logged. The notice (Session 8)
 * discloses all of this; full detail is in the cookie + privacy policies.
 *
 * This provider exists for future-proofing: the day a non-essential script
 * is added, a consumer only has to read `useConsent().consent?.categories`
 * before loading it, and `updateConsent` records a granular choice. The
 * storage format already carries the category shape so that change needs
 * no migration.
 *
 * The decision is persisted in localStorage under a versioned key and
 * re-requested after 12 months (ICO / CNIL guidance on consent refresh).
 * Bumping the version suffix re-prompts every visitor (old records ignored) —
 * done at S8 (`v1 → v2`) so the updated disclosure is shown once.
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

/**
 * Optional cookie categories. Nothing is wired to these yet; the field
 * exists so a future analytics/marketing integration can store a granular
 * choice without a storage-format migration.
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

// Versioned key — bump the suffix to cleanly re-prompt every visitor if the
// cookie policy materially changes (old records are then simply ignored).
const STORAGE_KEY = 'consent-v2';
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

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
  /**
   * Future granular setter — for when an analytics/marketing script is
   * added and the notice becomes a real consent choice. Unused today.
   */
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
