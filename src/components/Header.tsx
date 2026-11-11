import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { LocaleSwitcher } from './LocaleSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';
import { LeadButton } from './leads/LeadProvider';
import { NavDropdown } from './nav/NavDropdown';
import { MobileMenu } from './nav/MobileMenu';
import { TrackedWhatsApp } from './nav/TrackedWhatsApp';
import type { NavChrome } from './nav/types';

interface HeaderProps {
  locale: Locale;
  nav: NavChrome;
}

/** Accessible name for each dropdown's chevron button, per language. */
const MENU_SUFFIX: Record<string, string> = { en: 'menu', es: 'menú', ja: 'メニュー' };

/**
 * Site header (nav rebuild, 2026-11-10):
 *   Logo · Tour Packages ▾ · Day Tours ▾ · Nile Cruises ▾ · Travel Guide ▾ ·
 *   About ▾ · [currency] [language] · WhatsApp · [Get a free itinerary]
 * Desktop ≥1024px; below that the bar is Logo · WhatsApp icon · menu button
 * and everything else lives in the mobile menu. Menu data: src/lib/nav/navData.ts.
 */
export function Header({ locale, nav }: HeaderProps) {
  const suffix = MENU_SUFFIX[locale] ?? MENU_SUFFIX.en;
  return (
    <header>
      <nav className="t2e-nav t2e-nav--sales" aria-label={nav.primaryNavLabel}>
        <div className="t2e-wrap t2e-nav-inner">
          <Link className="t2e-logo t2e-logo--wordmark" href="/" aria-label="Travel2Egypt — home">
            Travel<span className="t2e-logo-2">2</span>Egypt
          </Link>
          <ul className="t2e-nav-links">
            {nav.menus.map((m) => (
              <li key={m.id}>
                <NavDropdown menu={m} fromTemplate={nav.fromTemplate} menuLabel={`${m.label} ${suffix}`} />
              </li>
            ))}
          </ul>
          <div className="t2e-nav-right">
            <div className="t2e-nav-prefs">
              <CurrencySwitcher />
              <LocaleSwitcher currentLocale={locale} />
            </div>
            <TrackedWhatsApp className="t2e-nav-wa" href={nav.whatsappHref} aria={nav.whatsappAria} location="header">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
              </svg>
              <span className="t2e-nav-wa-text">{nav.whatsappLabel}</span>
            </TrackedWhatsApp>
            <LeadButton source="header" className="t2e-nav-lead" openEvent={{ name: 'form_open', params: { location: 'header' } }}>
              {nav.lead}
            </LeadButton>
            <MobileMenu
              chrome={nav}
              switchers={
                <>
                  <CurrencySwitcher />
                  <LocaleSwitcher currentLocale={locale} />
                </>
              }
            />
          </div>
        </div>
      </nav>
    </header>
  );
}
