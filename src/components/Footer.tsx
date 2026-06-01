import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { CookiePreferencesButton } from './CookiePreferencesButton';
import { Wordmark } from './Wordmark';

interface FooterProps {
  locale: Locale;
}

const SISTER_BRANDS = [
  {
    name: 'AffordEgypt',
    url: 'https://affordegypt.com/',
    descriptionKey: 'affordegypt',
  },
  {
    name: 'Soléi',
    url: 'https://xn--soli-dpa.com/',
    descriptionKey: 'solei',
  },
];

const SISTER_BRAND_DESCRIPTIONS: Record<Locale, Record<string, string>> = {
  en: {
    affordegypt: 'Egypt for budget-conscious travelers.',
    solei: 'Boutique luxury, Siwa-rooted.',
  },
  es: {
    affordegypt: 'Egipto para viajeros con presupuesto.',
    solei: 'Lujo boutique, con raíces en Siwa.',
  },
  ja: {
    affordegypt: '予算重視の旅行者のためのエジプト',
    solei: 'シーワに根ざしたブティック・ラグジュアリー',
  },
};

// Accreditation bodies + review profile shown as text links in the footer.
// Swap any href for your specific membership/verification page if preferred.
const TRUST_LINKS = [
  { name: 'TripAdvisor', url: 'https://www.tripadvisor.com/Attraction_Review-g294201-d17406742-Reviews-Travel2Egypt-Cairo_Cairo_Governorate.html' },
  { name: 'IATA', url: 'https://www.iata.org/' },
  { name: 'ASTA', url: 'https://www.asta.org/' },
  { name: 'ETAA', url: 'https://www.etaa-egypt.org/' },
  { name: 'JATA', url: 'https://www.jata-net.or.jp/' },
] as const;

const LEGAL_LINKS = [
  { href: '/privacy-policy', key: 'privacy' },
  { href: '/terms',          key: 'terms' },
  { href: '/cookie-policy',  key: 'cookies' },
  { href: '/disclaimer',     key: 'disclaimer' },
] as const;

export function Footer({ locale }: FooterProps) {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const year = new Date().getFullYear();
  const descriptions = SISTER_BRAND_DESCRIPTIONS[locale];

  return (
    <footer className="mt-24 border-t border-rule bg-limestone-warm">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-5">
          {/* Brand block */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Wordmark size="footer" asHeading />
            </div>
            <p className="max-w-md font-serif text-lg italic leading-relaxed text-night-soft">
              {t('tagline')}
            </p>
          </div>

          {/* Nav columns */}
          <div>
            <h4 className="mb-5 font-sans text-xs font-medium uppercase tracking-[0.16em] text-night-soft">
              {t('travelLabel')}
            </h4>
            <ul className="space-y-2.5 text-[0.9375rem] text-night">
              <li><Link href="/tours" className="transition-colors hover:text-faience">{tNav('tours')}</Link></li>
              <li><Link href="/packages" className="transition-colors hover:text-faience">{tNav('packages')}</Link></li>
              <li><Link href="/hotels" className="transition-colors hover:text-faience">{tNav('hotels')}</Link></li>
              <li><Link href="/nile-cruises" className="transition-colors hover:text-faience">{tNav('nileCruises')}</Link></li>
              <li><Link href="/guide" className="transition-colors hover:text-faience">{tNav('guide')}</Link></li>
              <li><Link href="/travel-tips" className="transition-colors hover:text-faience">{tNav('travelTips')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 font-sans text-xs font-medium uppercase tracking-[0.16em] text-night-soft">
              {t('resourcesLabel')}
            </h4>
            <ul className="space-y-2.5 text-[0.9375rem] text-night">
              <li><Link href="/faq" className="transition-colors hover:text-faience">{t('faqLabel')}</Link></li>
              <li><Link href="/hotel-grade-concept" className="transition-colors hover:text-faience">{t('hotelGradeConcept')}</Link></li>
              <li><Link href="/distance-between-egyptian-cities" className="transition-colors hover:text-faience">{t('cityDistances')}</Link></li>
              <li><Link href="/your-name-in-hieroglyphs" className="transition-colors hover:text-faience">{t('nameInHieroglyphs')}</Link></li>
              <li><CookiePreferencesButton /></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 font-sans text-xs font-medium uppercase tracking-[0.16em] text-night-soft">
              {t('aboutLabel')}
            </h4>
            <ul className="space-y-2.5 text-[0.9375rem] text-night">
              {/* Egypt Wiki nav hidden for v1 (session 31 surgical defer) —
                  see Header.tsx comment. Restore when v2 ships. */}
              <li><Link href="/blog" className="transition-colors hover:text-faience">{tNav('blog')}</Link></li>
              <li><Link href="/about" className="transition-colors hover:text-faience">{tNav('about')}</Link></li>
              <li><Link href="/responsible-travel" className="transition-colors hover:text-faience">{t('responsibleTravel')}</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-faience">{tNav('contact')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Sister brands strip */}
        <div className="mt-12 border-t border-rule-strong pt-8">
          <h4 className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.16em] text-night-soft">
            {t('sisterBrandsLabel')}
          </h4>
          <div className="flex flex-wrap gap-8">
            {SISTER_BRANDS.map((brand) => (
              <a
                key={brand.name}
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-baseline gap-3"
              >
                <span className="font-serif text-lg font-medium text-night transition-colors group-hover:text-faience">
                  {brand.name}
                </span>
                <span className="font-serif text-sm italic text-night-soft">
                  {descriptions[brand.descriptionKey]}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Accreditations & reviews */}
        <div className="mt-12 border-t border-rule-strong pt-8">
          <h4 className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.16em] text-night-soft">
            {t('trustLabel')}
          </h4>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem] text-night">
            {TRUST_LINKS.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="transition-colors hover:text-faience"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-rule pt-8 text-[0.8125rem] text-night-soft md:flex-row md:items-center md:justify-between">
          <p>{t('rights', { year })}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-faience"
              >
                {t(link.key)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
