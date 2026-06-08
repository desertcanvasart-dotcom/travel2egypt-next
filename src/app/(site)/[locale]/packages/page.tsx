import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { packagesByThemeQuery } from '@/sanity/lib/queries';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import { buildStaticMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/structured-data';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'packages' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/packages',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

interface ThemeWithPackages {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  packages: PackageCardData[];
}

export default async function PackagesLandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('packages');
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const themes: ThemeWithPackages[] = await client.fetch(
    packagesByThemeQuery(locale as Locale)
  );

  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: tNav('packages'), path: '/packages' },
    ],
    locale as Locale,
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <JsonLd data={breadcrumbSchema} />
      <header className="mb-16 max-w-3xl">
        <h1 className="mb-4 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
          {t('landingTitle')}
        </h1>
        <p className="font-serif text-xl italic leading-relaxed text-ink-soft">
          {t('landingDeck')}
        </p>
      </header>

      {themes.length === 0 ? (
        <p className="font-serif text-lg italic text-ink-muted">
          {/* Reusing tours' empty-state translation rather than adding a duplicate key. */}
          {/* The site shouldn't ever land here once at least one package is published. */}
          —
        </p>
      ) : (
        <div className="space-y-20">
          {themes.map((theme) => (
            <section key={theme._id} aria-labelledby={`theme-${theme._id}`}>
              <header className="mb-8 border-t border-line pt-8">
                <p className="mb-1 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-deep">
                  {theme.name}
                </p>
                {theme.description && (
                  <p className="max-w-2xl font-serif text-lg italic leading-relaxed text-ink-soft">
                    {theme.description}
                  </p>
                )}
                <h2 id={`theme-${theme._id}`} className="sr-only">
                  {theme.name}
                </h2>
              </header>
              <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2">
                {theme.packages.map((pkg) => (
                  <PackageCard key={pkg._id} pkg={pkg} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
