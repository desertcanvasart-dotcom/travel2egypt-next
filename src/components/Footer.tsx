import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { CookiePreferencesButton } from './CookiePreferencesButton';

interface FooterProps {
  locale: Locale;
}

// The Travel2Egypt portfolio — four sites, each for a different traveller.
// Travel2Egypt is the site you're on; these are the three sister brands.
const SISTER_BRANDS = [
  { name: 'AffordEgypt', url: 'https://affordegypt.com/', descriptionKey: 'affordegypt' },
  { name: 'Sillage', url: 'https://sillage-egypte.com/', descriptionKey: 'sillage' },
  { name: 'Sawa', url: 'https://sawatours.org/', descriptionKey: 'sawa' },
];

const SISTER_BRAND_DESCRIPTIONS: Record<Locale, Record<string, string>> = {
  en: {
    affordegypt: 'Egypt for budget-conscious travelers.',
    sillage: 'Boutique luxury, Aswan-rooted.',
    sawa: 'Group journeys, together.',
  },
  es: {
    affordegypt: 'Egipto para viajeros con presupuesto.',
    sillage: 'Lujo boutique, con raíces en Asuán.',
    sawa: 'Viajes en grupo, juntos.',
  },
  ja: {
    affordegypt: '予算重視の旅行者のためのエジプト',
    sillage: 'アスワンに根ざしたブティック・ラグジュアリー',
    sawa: 'みんなで一緒に楽しむグループの旅',
  },
};

const LEGAL_LINKS = [
  { href: '/privacy-policy', key: 'privacy' },
  { href: '/terms', key: 'terms' },
  { href: '/cookie-policy', key: 'cookies' },
  { href: '/disclaimer', key: 'disclaimer' },
] as const;

/**
 * Canonical site footer — reconciled to the approved tour-system reference
 * (journey-1/2/3). Accreditation now lives in the brand tagline (matching the
 * reference), so the previous standalone trust-links strip is folded in.
 */
export function Footer({ locale }: FooterProps) {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const year = new Date().getFullYear();
  const descriptions = SISTER_BRAND_DESCRIPTIONS[locale];

  return (
    <footer className="t2e-footer">
      <div className="t2e-wrap">
        <div className="t2e-foot-top">
          <div className="t2e-foot-brand">
            <Link className="t2e-logo" href="/" aria-label="Travel2Egypt — home">
              <img
                src="/logo.png"
                alt="Travel2Egypt"
                width={202}
                height={123}
                style={{ height: '48px', width: 'auto', display: 'block' }}
              />
            </Link>
            <p>{t('tagline')}</p>
          </div>

          <div className="t2e-foot-col">
            <h2>{t('travelLabel')}</h2>
            <ul>
              {/* Packages first (private, group), then the day-tour pair, then
                  hotels / cruises / guide / tips. Moved here from the old
                  header "Services" dropdown. */}
              <li><Link href="/egypt-travel-packages">{tNav('serviceEgyptPackages')}</Link></li>
              <li><Link href="/small-group-travel-packages">{tNav('serviceGroupPackages')}</Link></li>
              <li><Link href="/private-day-tours">{tNav('servicePrivateDayTours')}</Link></li>
              <li><Link href="/group-day-tours">{tNav('serviceGroupDayTours')}</Link></li>
              <li><Link href="/hotels">{tNav('hotels')}</Link></li>
              <li><Link href="/nile-cruises">{tNav('nileCruises')}</Link></li>
            </ul>
          </div>

          <div className="t2e-foot-col">
            <h2>{t('resourcesLabel')}</h2>
            <ul>
              {/* Guides listed in series order; the "all field guides"
                  index always sits at the bottom in italic as the
                  anchor link — new guides slot above it, never below. */}
              <li><Link href="/resources/pyramids-decoded">{t('resourcesPyramids')}</Link></li>
              <li><Link href="/resources/arabic-lightly">{t('resourcesArabic')}</Link></li>
              <li><Link href="/resources/egyptian-cuisine">{t('resourcesCuisine')}</Link></li>
              <li><Link href="/resources/pharaoh-timeline">{t('resourcesTimeline')}</Link></li>
              <li className="t2e-foot-col__all"><Link href="/resources">{t('resourcesIndex')}</Link></li>
            </ul>
          </div>

          <div className="t2e-foot-col">
            <h2>{t('practicalLabel')}</h2>
            <ul>
              {/* Sorted alphabetically by the rendered EN label. */}
              <li><Link href="/faq">{t('faqLabel')}</Link></li>
              <li><Link href="/hotel-grade-concept">{t('hotelGradeConcept')}</Link></li>
              <li><Link href="/travel-tips">{tNav('travelTips')}</Link></li>
              <li><Link href="/your-name-in-hieroglyphs">{t('nameInHieroglyphs')}</Link></li>
            </ul>
          </div>

          <div className="t2e-foot-col">
            <h2>{t('aboutLabel')}</h2>
            <ul>
              <li><Link href="/about">{tNav('about')}</Link></li>
              <li><Link href="/contact">{tNav('contact')}</Link></li>
              <li><Link href="/blog">{tNav('blog')}</Link></li>
              <li><Link href="/responsible-travel">{t('responsibleTravel')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="t2e-foot-brands">
          <span className="t2e-kicker">{t('sisterBrandsLabel')}</span>
          {SISTER_BRANDS.map((brand) => (
            <a
              key={brand.name}
              href={brand.url}
              target="_blank"
              rel="noopener noreferrer"
              className="brand"
            >
              {brand.name}
              <span>{descriptions[brand.descriptionKey]}</span>
            </a>
          ))}
        </div>

        <div className="t2e-foot-legal">
          <span>{t('rights', { year })}</span>
          <span className="legal-links">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {t(link.key)}
              </Link>
            ))}
            <CookiePreferencesButton />
          </span>
        </div>
      </div>
    </footer>
  );
}
