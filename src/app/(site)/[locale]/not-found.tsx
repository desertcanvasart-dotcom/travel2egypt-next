import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

export default async function LocaleNotFound() {
  const t = await getTranslations('notFound');
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
        {t('eyebrow')}
      </p>
      <h1 className="mb-4 font-serif text-4xl font-medium leading-tight text-ink md:text-5xl">
        {t('title')}
      </h1>
      <p className="mb-10 font-serif text-lg italic leading-relaxed text-ink-soft">
        {t('deck')}
      </p>
      <div className="border-t border-line pt-8">
        <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
          {t('linksTitle')}
        </p>
        <ul className="space-y-2 font-serif text-lg">
          <li>
            <Link href="/blog" className="text-ink hover:text-orange-deep">
              {t('journal')} →
            </Link>
          </li>
          <li>
            <Link href="/guide" className="text-ink hover:text-orange-deep">
              {t('guide')} →
            </Link>
          </li>
          <li>
            <Link href="/tours" className="text-ink hover:text-orange-deep">
              {t('tours')} →
            </Link>
          </li>
          <li>
            <Link
              href="/plan-your-tour"
              className="text-ink hover:text-orange-deep"
            >
              {t('concierge')} →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
