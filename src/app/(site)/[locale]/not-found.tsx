import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

export default async function LocaleNotFound() {
  const t = await getTranslations('notFound');
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-faience">
        {t('eyebrow')}
      </p>
      <h1 className="mb-4 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] text-night md:text-5xl">
        {t('title')}
      </h1>
      <p className="mb-10 font-serif text-lg italic leading-relaxed text-night-soft">
        {t('deck')}
      </p>
      <div className="border-t border-rule-strong pt-8">
        <p className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.16em] text-night-soft">
          {t('linksTitle')}
        </p>
        <ul className="space-y-2 font-serif text-lg">
          <li>
            <Link href="/blog" className="text-night transition-colors hover:text-faience">
              {t('journal')} →
            </Link>
          </li>
          <li>
            <Link href="/guide" className="text-night transition-colors hover:text-faience">
              {t('guide')} →
            </Link>
          </li>
          <li>
            <Link href="/tours" className="text-night transition-colors hover:text-faience">
              {t('tours')} →
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              className="text-night transition-colors hover:text-faience"
            >
              {t('concierge')} →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
