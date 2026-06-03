import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  packageCategoryQuery,
  privatePackagesQuery,
  packageThemeLandingsQuery,
} from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import {
  PackageCategoryView,
  type PackageCategoryDoc,
  type PackageThemeLanding,
} from '@/components/tour-system/PackageCategoryView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ts = await getTranslations({ locale, namespace: 'tourSystem' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/egypt-travel-packages',
    title: ts('pkgCatTitle'),
    description: ts('pkgCatMetaDescription'),
  });
}

interface RawPackage {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  tourMode?: string;
  durationDays?: number;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  theme?: { _id: string; name?: string; slug?: string } | null;
}

export default async function EgyptTravelPackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [archive, packages, themeLandings] = await Promise.all([
    client.fetch<PackageCategoryDoc | null>(packageCategoryQuery(locale as Locale)),
    client.fetch<RawPackage[]>(privatePackagesQuery(locale as Locale)),
    client.fetch<PackageThemeLanding[]>(packageThemeLandingsQuery(locale as Locale)),
  ]);

  return (
    <PackageCategoryView
      archive={archive}
      packages={packages}
      themeLandings={themeLandings}
      locale={locale as Locale}
    />
  );
}
