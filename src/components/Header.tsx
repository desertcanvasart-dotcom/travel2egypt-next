import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { LocaleSwitcher } from './LocaleSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';
import { JourneysMenu } from './JourneysMenu';
import { NavLink } from './NavLink';
import { MobileNav } from './MobileNav';
import { NavMenu } from './NavMenu';
import { LeadButton } from './leads/LeadProvider';
import { SALES_NAV } from './home-sales/nav';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';

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

  // English: product-first nav + "Get a free itinerary" (owner spec,
  // 2026-11-08). ES/JA keep the editorial nav below until translation.
  if (locale === 'en') {
    return (
      <header>
        <nav className="t2e-nav t2e-nav--sales" aria-label={t('primaryNavLabel')}>
          <div className="t2e-wrap t2e-nav-inner">
            <Link className="t2e-logo t2e-logo--wordmark" href="/" aria-label="Travel2Egypt — home">
              Travel<span className="t2e-logo-2">2</span>Egypt
            </Link>
            <ul className="t2e-nav-links">
              {SALES_NAV.map((g) => (
                <li key={g.label}>
                  {g.items ? (
                    <NavMenu label={g.label} href={g.href} items={g.items} />
                  ) : (
                    <NavLink href={g.href ?? '/'}>{g.label}</NavLink>
                  )}
                </li>
              ))}
            </ul>
            <div className="t2e-nav-right">
              <CurrencySwitcher />
              <LocaleSwitcher currentLocale={locale} />
              <a
                className="t2e-nav-wa"
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp us (opens in a new tab)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
                </svg>
              </a>
              <LeadButton source="header" className="t2e-nav-lead">
                Get a free itinerary
              </LeadButton>
              <MobileNav groups={SALES_NAV} />
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header>
      <nav className="t2e-nav" aria-label={t('primaryNavLabel')}>
        <div className="t2e-wrap t2e-nav-inner">
          <Link className="t2e-logo t2e-logo--wordmark" href="/" aria-label="Travel2Egypt — home">
            Travel<span className="t2e-logo-2">2</span>Egypt
          </Link>

          <ul className="t2e-nav-links">
            {/* Visual order, left-to-right: Travel Guide, Journeys, Journal,
                About. (Travel Tips moved to the footer's Practical column.) */}
            <li><NavLink href="/guide">{t('guide')}</NavLink></li>
            {/* Egypt Wiki nav stays hidden for v1 (session 31 defer). */}
            <li><JourneysMenu /></li>
            <li><NavLink href="/blog">{t('blog')}</NavLink></li>
            <li><NavLink href="/about">{t('about')}</NavLink></li>
          </ul>

          <div className="t2e-nav-right">
            <CurrencySwitcher />
            <LocaleSwitcher currentLocale={locale} />
            {/* /plan-your-tour not built yet — point at /contact (session 37 stopgap). */}
            <Link className="t2e-nav-cta" href="/contact">
              {t('contact')} →
            </Link>
            <MobileNav />
          </div>
        </div>
      </nav>
    </header>
  );
}
