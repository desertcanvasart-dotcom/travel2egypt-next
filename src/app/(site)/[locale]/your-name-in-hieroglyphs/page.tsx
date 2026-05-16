import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { HieroglyphTranslator } from '@/components/HieroglyphTranslator';
import { buildStaticMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hieroglyphs' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/your-name-in-hieroglyphs',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function NameInHieroglyphsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('hieroglyphs');

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12 text-center">
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
          {t('eyebrow')}
        </p>
        <h1 className="mb-4 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
          {t('heading')}
        </h1>
        <p className="font-serif text-xl italic leading-relaxed text-ink-soft">
          {t('subheading')}
        </p>
      </header>

      <HieroglyphTranslator
        labels={{
          banner: t('banner'),
          inputLabel: t('inputLabel'),
          placeholder: t('placeholder'),
          emptyState: t('emptyState'),
          cartoucheToggle: t('cartoucheToggle'),
          disclaimer: t('disclaimer'),
        }}
      />

      {/* Soft CTAs */}
      <section className="mt-20 border-t border-line pt-12 text-center">
        <p className="mb-6 font-serif text-lg italic text-ink-soft">
          {t('ctaPrompt')}
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/wiki/monuments"
            className="rounded-full border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            {t('ctaMonuments')}
          </Link>
          <Link
            href="/tours"
            className="rounded-full bg-orange px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-orange-deep"
          >
            {t('ctaTours')}
          </Link>
        </div>
      </section>
    </div>
  );
}
