import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { LocaleSwitcher } from './LocaleSwitcher';

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations('nav');
  const tSite = useTranslations('site');

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-sans text-[11px] font-bold tracking-wider text-orange">
            T2E
          </span>
          <span className="font-serif text-[22px] font-semibold tracking-tight text-ink">
            {tSite('name')}
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/tours" className="text-sm text-ink-soft hover:text-ink transition-colors">
            {t('tours')}
          </Link>
          <Link href="/packages" className="text-sm text-ink-soft hover:text-ink transition-colors">
            {t('packages')}
          </Link>
          <Link href="/guide" className="text-sm text-ink-soft hover:text-ink transition-colors">
            {t('guide')}
          </Link>
          <Link href="/wiki" className="text-sm text-ink-soft hover:text-ink transition-colors">
            {t('wiki')}
          </Link>
          <Link href="/blog" className="text-sm text-ink-soft hover:text-ink transition-colors">
            {t('blog')}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <LocaleSwitcher currentLocale={locale} />
          <Link
            href="/plan-your-tour"
            className="hidden rounded-full bg-orange px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-orange-deep md:inline-block"
          >
            {t('planYourTour')}
          </Link>
        </div>
      </div>
    </header>
  );
}
