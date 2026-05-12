'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { Locale } from '@/i18n/routing';

/**
 * Client-side context exposing the locale → slug map for the current
 * translatable detail page. Server components fetch the map via
 * fetchTranslationSlugs() and wrap children with this provider; the
 * LocaleSwitcher consumes it to build correct cross-locale URLs.
 *
 * When the context is absent (non-translatable routes — listings,
 * archives, home), the switcher falls back to its existing prefix-swap
 * + per-route resolver behavior.
 *
 * basePath is the route segment under the locale prefix that holds the
 * slug — e.g. "/blog" for an article at /[locale]/blog/[slug]. The
 * switcher composes the target URL as `${basePath}/${slugs[targetLocale]}`.
 */

export interface TranslationContextValue {
  slugs: Partial<Record<Locale, string>>;
  basePath: string;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

interface Props {
  slugs: Partial<Record<Locale, string>>;
  basePath: string;
  children: ReactNode;
}

export function TranslationProvider({ slugs, basePath, children }: Props) {
  const value = useMemo<TranslationContextValue>(
    () => ({ slugs, basePath }),
    [slugs, basePath]
  );
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext(): TranslationContextValue | null {
  return useContext(TranslationContext);
}
