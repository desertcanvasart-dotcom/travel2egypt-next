import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  packageCategoryQuery,
  groupPackagesQuery,
  packageRegionLandingsQuery,
} from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import {
  PackageCategoryView,
  type PackageCategoryDoc,
  type PackageNavLanding,
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
    path: '/small-group-travel-packages',
    title: ts('pkgGroupCatTitle'),
    description: ts('pkgGroupCatMetaDescription'),
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
  originRegion?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  theme?: { _id: string; name?: string; slug?: string } | null;
}

export default async function SmallGroupTravelPackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [archive, packages, navLandings] = await Promise.all([
    client.fetch<PackageCategoryDoc | null>(packageCategoryQuery(locale as Locale, 'group-package')),
    client.fetch<RawPackage[]>(groupPackagesQuery(locale as Locale)),
    client.fetch<PackageNavLanding[]>(packageRegionLandingsQuery(locale as Locale)),
  ]);

  return (
    <PackageCategoryView
      archive={archive}
      packages={packages}
      navLandings={navLandings}
      mode="group"
      locale={locale as Locale}
    />
  );
}
