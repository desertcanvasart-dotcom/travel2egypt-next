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

  function onSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
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
