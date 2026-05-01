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

  return pathname;
}
