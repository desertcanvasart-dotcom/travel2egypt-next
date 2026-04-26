'use client';

import { useTransition } from 'react';

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

  async function onSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale;
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
    <label className="relative">
      <span className="sr-only">Select language</span>
      <select
        value={currentLocale}
        onChange={onSelect}
        className="cursor-pointer appearance-none rounded-full border border-line bg-transparent py-2 pl-3 pr-7 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        {routing.locales.map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_SHORT[locale as Locale]} — {LOCALE_LABELS[locale as Locale]}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Pages with localized slugs need a server lookup to translate the slug
 * across locales. /guide/cairo (en) ↔ /guide/el-cairo (es). Static paths
 * fall through to the default behavior (just swap the locale prefix).
 */
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
