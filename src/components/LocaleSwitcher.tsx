'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  ja: '日本語',
};

const LOCALE_SHORT: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
  ja: 'JA',
};

interface Props {
  currentLocale: Locale;
}

export function LocaleSwitcher({ currentLocale }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function pick(nextLocale: Locale) {
    setOpen(false);
    if (nextLocale === currentLocale) return;
    const nextPathname = await resolveLocalizedPathname(
      pathname,
      currentLocale,
      nextLocale
    );
    startTransition(() => {
      router.replace(nextPathname, { locale: nextLocale });
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select language (currently ${LOCALE_SHORT[currentLocale]})`}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 border-b border-rule-strong bg-transparent pb-[2px] text-xs font-medium uppercase tracking-[0.1em] text-night-soft transition-colors hover:border-faience hover:text-faience"
      >
        <span>{LOCALE_SHORT[currentLocale]}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 min-w-[11rem] overflow-hidden border border-rule-strong bg-paper"
        >
          {routing.locales.map((loc) => {
            const active = loc === currentLocale;
            return (
              <li key={loc} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => pick(loc as Locale)}
                  className={
                    active
                      ? 'flex w-full items-center justify-between bg-limestone px-4 py-2.5 text-left font-serif text-sm text-night'
                      : 'flex w-full items-center justify-between px-4 py-2.5 text-left font-serif text-sm text-night-soft transition-colors hover:bg-limestone hover:text-night'
                  }
                >
                  <span>{LOCALE_LABELS[loc as Locale]}</span>
                  <span className="ml-4 font-sans text-[10px] uppercase tracking-[0.12em] text-night-soft">
                    {LOCALE_SHORT[loc as Locale]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

async function resolveLocalizedPathname(
  pathname: string,
  fromLocale: Locale,
  toLocale: Locale
): Promise<string> {
  if (fromLocale === toLocale) return pathname;

  // Guide article detail: /guide/[citySlug]/[articleSlug]. Two-segment URL;
  // both slugs vary by locale. Single API call resolves both. Matched BEFORE
  // the city regex (which is single-segment) for safety — the city regex's
  // `?$` anchor already enforces no second segment, so order is defensive
  // rather than functionally required.
  // On miss / fetch failure / partial translation: fall back to /guide list.
  const guideArticleMatch = pathname.match(/^\/guide\/([^/]+)\/([^/]+)\/?$/);
  if (guideArticleMatch) {
    const fromArticleSlug = guideArticleMatch[2];
    try {
      const res = await fetch(
        `/api/locale-resolve/guideArticle?fromLocale=${fromLocale}&fromArticleSlug=${encodeURIComponent(fromArticleSlug)}&toLocale=${toLocale}`
      );
      if (res.ok) {
        const { articleSlug, citySlug } = (await res.json()) as {
          articleSlug: string | null;
          citySlug: string | null;
        };
        if (articleSlug && citySlug) return `/guide/${citySlug}/${articleSlug}`;
      }
    } catch {
      // fall through to /guide list
    }
    return '/guide';
  }

  const cityMatch = pathname.match(/^\/guide\/([^/]+)\/?$/);
  if (cityMatch) {
    const fromSlug = cityMatch[1];
    try {
      const res = await fetch(
        `/api/locale-resolve/city?fromLocale=${fromLocale}&fromSlug=${encodeURIComponent(fromSlug)}&toLocale=${toLocale}`
      );
      if (res.ok) {
        const { slug } = (await res.json()) as { slug: string | null };
        if (slug) return `/guide/${slug}`;
      }
    } catch {
      // fall through
    }
  }

  // Article detail: /blog/[slug]. Explicitly NOT /blog (archive) or
  // /blog/category/[slug] — those listing/index routes locale-swap via
  // simple prefix. Look up the locale-specific article slug via the
  // article API route. On miss or fetch failure, fall back to the
  // target locale's /blog archive — keeps the reader in the journal,
  // different locale, instead of a 404.
  const articleMatch = pathname.match(/^\/blog\/(?!category\/)([^/]+)\/?$/);
  if (articleMatch) {
    const fromSlug = articleMatch[1];
    try {
      const res = await fetch(
        `/api/locale-resolve/article?fromLocale=${fromLocale}&fromSlug=${encodeURIComponent(fromSlug)}&toLocale=${toLocale}`
      );
      if (res.ok) {
        const { slug } = (await res.json()) as { slug: string | null };
        if (slug) return `/blog/${slug}`;
      }
    } catch {
      // fall through to /blog archive
    }
    return '/blog';
  }

  // Travel tip detail: /travel-tips/[slug]. Single-segment URL, slug
  // varies by locale (field-level i18n on travelTip). On miss / fetch
  // failure: fall back to /travel-tips list.
  const travelTipMatch = pathname.match(/^\/travel-tips\/([^/]+)\/?$/);
  if (travelTipMatch) {
    const fromSlug = travelTipMatch[1];
    try {
      const res = await fetch(
        `/api/locale-resolve/travelTip?fromLocale=${fromLocale}&fromSlug=${encodeURIComponent(fromSlug)}&toLocale=${toLocale}`
      );
      if (res.ok) {
        const { slug } = (await res.json()) as { slug: string | null };
        if (slug) return `/travel-tips/${slug}`;
      }
    } catch {
      // fall through to /travel-tips list
    }
    return '/travel-tips';
  }

  // Legacy tour detail: /tours/[slug] or /packages/[slug]. These now
  // redirect to the canonical root URL, so resolve the target-locale slug
  // and send the switcher straight to `/<slug>` (skipping the redirect hop).
  // On miss / fetch failure: fall back to the relevant listing.
  const tourMatch = pathname.match(/^\/(tours|packages)\/([^/]+)\/?$/);
  if (tourMatch) {
    const base = tourMatch[1];
    const fromSlug = tourMatch[2];
    try {
      const res = await fetch(
        `/api/locale-resolve/tour?fromLocale=${fromLocale}&fromSlug=${encodeURIComponent(fromSlug)}&toLocale=${toLocale}`
      );
      if (res.ok) {
        const { slug } = (await res.json()) as { slug: string | null };
        if (slug) return `/${slug}`;
      }
    } catch {
      // fall through to listing
    }
    return `/${base}`;
  }

  // Hotel detail: /hotels/[slug]. Single-segment URL, slug varies by
  // locale (field-level i18n on hotel). On miss / fetch failure: fall
  // back to /hotels list.
  const hotelMatch = pathname.match(/^\/hotels\/([^/]+)\/?$/);
  if (hotelMatch) {
    const fromSlug = hotelMatch[1];
    try {
      const res = await fetch(
        `/api/locale-resolve/hotel?fromLocale=${fromLocale}&fromSlug=${encodeURIComponent(fromSlug)}&toLocale=${toLocale}`
      );
      if (res.ok) {
        const { slug } = (await res.json()) as { slug: string | null };
        if (slug) return `/hotels/${slug}`;
      }
    } catch {
      // fall through to /hotels list
    }
    return '/hotels';
  }

  // Nile cruise detail: /nile-cruises/[slug]. Same pattern as hotel.
  const cruiseMatch = pathname.match(/^\/nile-cruises\/([^/]+)\/?$/);
  if (cruiseMatch) {
    const fromSlug = cruiseMatch[1];
    try {
      const res = await fetch(
        `/api/locale-resolve/nileCruise?fromLocale=${fromLocale}&fromSlug=${encodeURIComponent(fromSlug)}&toLocale=${toLocale}`
      );
      if (res.ok) {
        const { slug } = (await res.json()) as { slug: string | null };
        if (slug) return `/nile-cruises/${slug}`;
      }
    } catch {
      // fall through to /nile-cruises list
    }
    return '/nile-cruises';
  }

  // Root-level single-segment slug: tours, tour categories, and tour
  // landings are canonical at `/<slug>` with locale-varying slugs. Matched
  // LAST so all prefixed routes above take precedence. The leading-char
  // class excludes the home page (empty segment). On miss / fetch failure:
  // keep the path unchanged (non-localized roots like a static page slug).
  const rootMatch = pathname.match(/^\/([^/]+)\/?$/);
  if (rootMatch) {
    const fromSlug = rootMatch[1];
    try {
      const res = await fetch(
        `/api/locale-resolve/root?fromLocale=${fromLocale}&fromSlug=${encodeURIComponent(fromSlug)}&toLocale=${toLocale}`
      );
      if (res.ok) {
        const { slug } = (await res.json()) as { slug: string | null };
        if (slug) return `/${slug}`;
      }
    } catch {
      // fall through to unchanged pathname
    }
  }

  return pathname;
}
