import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

interface Props {
  locale: Locale;
  /** Which deferred section the visitor reached. Drives the localized heading. */
  section: 'deities' | 'dynasties' | 'people';
}

/**
 * Placeholder for the three Egypt Wiki sub-sections deferred to v2
 * (deities / dynasties / people). wikiMonument shipped in v1; the others
 * await editorial production. Rendered with noindex meta — search engines
 * see no thin content; robots.txt also disallows these paths.
 */
export async function WikiComingSoon({ locale, section }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('wikiComingSoon');
  const sectionLabel = t(`section.${section}`);

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
        {t('eyebrow')}
      </p>
      <h1 className="mb-6 font-serif text-4xl font-medium leading-tight text-ink md:text-5xl">
        {t('headline', { section: sectionLabel })}
      </h1>
      <p className="mb-10 font-serif text-xl italic leading-relaxed text-ink-soft">
        {t('deck')}
      </p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/wiki/monuments"
          className="rounded-full bg-orange px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-orange-deep"
        >
          {t('ctaMonuments')}
        </Link>
        <Link
          href="/"
          className="rounded-full border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          {t('ctaHome')}
        </Link>
      </div>
    </div>
  );
}

export const wikiComingSoonMetadata = {
  robots: { index: false, follow: true },
};
