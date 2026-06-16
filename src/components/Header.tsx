import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { LocaleSwitcher } from './LocaleSwitcher';
import { JourneysMenu } from './JourneysMenu';

interface HeaderProps {
  locale: Locale;
}

/**
 * Canonical site nav — reconciled to the approved tour-system reference
 * (journey-1/2/3). Classes/styles live in src/styles/tour-system.css. The
 * Journeys dropdown and locale switcher keep their real behaviour; the scoped
 * `.t2e-nav-*` rules restyle their triggers to the reference link look by
 * specificity, so those client components need no edits.
 */
export function Header({ locale }: HeaderProps) {
  const t = useTranslations('nav');

  return (
    <nav className="t2e-nav">
      <div className="t2e-wrap t2e-nav-inner">
        <Link className="t2e-logo" href="/" aria-label="Travel2Egypt — home">
          <img
            src="/logo.png"
            alt="Travel2Egypt"
            width={202}
            height={123}
            style={{ height: '40px', width: 'auto', display: 'block' }}
          />
        </Link>

        <ul className="t2e-nav-links">
          <li><JourneysMenu /></li>
          <li><Link href="/guide">{t('guide')}</Link></li>
          {/* Egypt Wiki nav stays hidden for v1 (session 31 defer). */}
          <li><Link href="/blog">{t('blog')}</Link></li>
          <li><Link href="/travel-tips">{t('travelTips')}</Link></li>
        </ul>

        <div className="t2e-nav-right">
          <LocaleSwitcher currentLocale={locale} />
          {/* /plan-your-tour not built yet — point at /contact (session 37 stopgap). */}
          <Link className="t2e-nav-cta" href="/contact">
            {t('contact')} →
          </Link>
        </div>
      </div>
    </nav>
  );
}
