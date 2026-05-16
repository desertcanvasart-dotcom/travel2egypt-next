import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { LocaleSwitcher } from './LocaleSwitcher';
import { Wordmark } from './Wordmark';

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Wordmark size="header" />

        <nav className="hidden items-center gap-9 md:flex">
          <Link href="/tours" className="text-sm text-night-soft transition-colors hover:text-faience">
            {t('tours')}
          </Link>
          <Link href="/packages" className="text-sm text-night-soft transition-colors hover:text-faience">
            {t('packages')}
          </Link>
          <Link href="/guide" className="text-sm text-night-soft transition-colors hover:text-faience">
            {t('guide')}
          </Link>
          {/* Egypt Wiki nav hidden for v1 (session 31 surgical defer):
              only wikiMonument is content-complete; deities/dynasties/people
              await v2 editorial. Monuments stay reachable via the city
              "Places to Go" sidebar. Restore this link when v2 ships. */}
          <Link href="/blog" className="text-sm text-night-soft transition-colors hover:text-faience">
            {t('blog')}
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <LocaleSwitcher currentLocale={locale} />
          {/* Was /plan-your-tour — that AI-concierge route isn't built yet.
              Stopgap (session 37): point at /contact so the CTA lands on a
              real page. Restore the planning route when the concierge ships. */}
          <Link
            href="/contact"
            className="hidden border-b border-rule-strong pb-[2px] text-sm text-night-soft transition-colors hover:border-faience hover:text-faience md:inline-block"
          >
            {t('contact')} →
          </Link>
        </div>
      </div>
    </header>
  );
}
