import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

interface FooterProps {
  locale: Locale;
}

const SISTER_BRANDS = [
  {
    name: 'AffordEgypt',
    url: 'https://affordegypt.com',
    descriptionKey: 'affordegypt',
  },
  {
    name: 'Soléi',
    url: 'https://solei.com',
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

export function Footer({ locale }: FooterProps) {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const year = new Date().getFullYear();
  const descriptions = SISTER_BRAND_DESCRIPTIONS[locale];

  return (
    <footer className="mt-24 border-t border-line bg-cream-warm">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand block */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-sans text-[11px] font-bold tracking-wider text-orange">
                T2E
              </span>
              <span className="font-serif text-2xl font-semibold text-ink">
                Travel2Egypt
              </span>
            </div>
            <p className="max-w-md font-serif text-lg italic text-ink-soft">
              {t('tagline')}
            </p>
          </div>

          {/* Nav columns */}
          <div>
            <h4 className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Travel
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-soft">
              <li><Link href="/tours" className="hover:text-ink transition-colors">{tNav('tours')}</Link></li>
              <li><Link href="/packages" className="hover:text-ink transition-colors">{tNav('packages')}</Link></li>
              <li><Link href="/guide" className="hover:text-ink transition-colors">{tNav('guide')}</Link></li>
              <li><Link href="/travel-tips" className="hover:text-ink transition-colors">{tNav('travelTips')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
              About
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-soft">
              <li><Link href="/wiki" className="hover:text-ink transition-colors">{tNav('wiki')}</Link></li>
              <li><Link href="/blog" className="hover:text-ink transition-colors">{tNav('blog')}</Link></li>
              <li><Link href="/about" className="hover:text-ink transition-colors">{tNav('about')}</Link></li>
              <li><Link href="/contact" className="hover:text-ink transition-colors">{tNav('contact')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Sister brands strip */}
        <div className="mt-12 border-t border-line pt-8">
          <h4 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
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
                <span className="font-serif text-lg font-semibold text-ink transition-colors group-hover:text-orange-deep">
                  {brand.name}
                </span>
                <span className="text-sm text-ink-muted">
                  {descriptions[brand.descriptionKey]}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>{t('rights', { year })}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
