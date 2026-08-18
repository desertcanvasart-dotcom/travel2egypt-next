'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { CURRENCIES, CURRENCY_COOKIE, DEFAULT_CURRENCY } from './currency';

/**
 * Viewer-selected display currency, persisted to the `t2e_ccy` cookie.
 *
 * SSR renders with `defaultCurrency` (the per-locale default) so the cached HTML
 * is deterministic — no cookie is read on the server, so pages stay cacheable.
 * On mount the client reads the cookie and swaps if a valid currency is stored.
 */
const COOKIE = CURRENCY_COOKIE;

interface Ctx {
  currency: string;
  setCurrency: (code: string) => void;
}

const CurrencyContext = createContext<Ctx>({ currency: DEFAULT_CURRENCY, setCurrency: () => {} });

export function CurrencyProvider({
  defaultCurrency,
  children,
}: {
  defaultCurrency: string;
  children: React.ReactNode;
}) {
  const [currency, setCur] = useState(
    CURRENCIES[defaultCurrency] ? defaultCurrency : DEFAULT_CURRENCY
  );

  useEffect(() => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
    const stored = m && decodeURIComponent(m[1]);
    if (stored && CURRENCIES[stored]) {
      if (stored !== currency) setCur(stored);
      return;
    }
    // No explicit pick stored → ask for the cookie-free geo suggestion and
    // apply it IN MEMORY only (s47 compliance, 2026-08-18: the middleware no
    // longer persists a geo-derived t2e_ccy before any user action; the
    // cookie is written solely in setCurrency below). Fire-and-forget — on
    // failure or `{ currency: null }` (no cf-ipcountry, e.g. local dev) the
    // per-locale SSR default simply stands.
    let cancelled = false;
    fetch('/api/geo-currency')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { currency?: string | null } | null) => {
        const geo = d?.currency;
        if (!cancelled && geo && CURRENCIES[geo]) setCur(geo);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // read once on mount; selection thereafter drives state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrency = useCallback((code: string) => {
    if (!CURRENCIES[code]) return;
    setCur(code);
    document.cookie = `${COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
