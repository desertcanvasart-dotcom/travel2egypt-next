import type { Metadata } from 'next';
import { groq } from 'next-sanity';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { packageCategoryQuery, packageThemeLandingsQuery } from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import { getRates } from '@/lib/fx';
import { salesHomeQuery, type SalesHomeData } from '@/components/home-sales/query';
import { FEATURED_TOURS } from '@/components/home-sales/config';
import {
  PackagesHubView,
  type HubArchive,
  type HubPackage,
  type HubThemeLanding,
} from '@/components/packages-hub/PackagesHubView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ts = await getTranslations({ locale, namespace: 'tourSystem' });
  const t = await getTranslations({ locale, namespace: 'packagesHub' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/egypt-travel-packages',
    title: ts('pkgCatTitle'),
    description: t('metaDescription'),
  });
}

/** Every published private multi-day package, with its "from" price (EUR). */
const hubPackagesQuery = groq`
  *[_type == "tour" && type == "package" && tourMode == "private" && !(_id in path("drafts.**"))]
    | order(durationDays asc, _createdAt desc){
    _id,
    "enSlug": slug[_key=="en"][0].value.current,
    "slug": coalesce(slug[_key==$locale][0].value.current, slug[_key=="en"][0].value.current),
    "title": coalesce(title[_key==$locale][0].value, title[_key=="en"][0].value, ""),
    durationDays,
    "durationLabel": coalesce(durationLabel[_key==$locale][0].value, durationLabel[_key=="en"][0].value),
    priceFrom,
    "theme": theme->{ _id, "name": coalesce(name[_key==$locale][0].value, name[_key=="en"][0].value) }
  }
`;

/** The budget labels' currency per language: $ (en), € (es), ¥ (ja). */
const BUDGET_CCY: Record<string, string> = { en: 'USD', es: 'EUR', ja: 'JPY' };

export default async function EgyptTravelPackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const [archive, packages, themes, home, fx] = await Promise.all([
    client.fetch<HubArchive | null>(packageCategoryQuery(loc, 'private-package')),
    client.fetch<HubPackage[]>(hubPackagesQuery, { locale }),
    client.fetch<HubThemeLanding[]>(packageThemeLandingsQuery(loc)),
    // Same list, same order as the homepage "Egypt tours" section.
    client.fetch<SalesHomeData>(salesHomeQuery, { slugs: FEATURED_TOURS.map((f) => f.slug), locale }),
    getRates(),
  ]);

  const bySlug = new Map((home?.products ?? []).map((p) => [p.slug, p]));
  const featured = FEATURED_TOURS.flatMap((f) => {
    const p = bySlug.get(f.slug);
    return p ? [{ slug: f.slug, p }] : [];
  });

  const ccy = BUDGET_CCY[locale] ?? 'USD';
  const budgetRate = ccy === 'EUR' ? 1 : fx.rates[ccy] ?? 1;

  return (
    <PackagesHubView
      archive={archive}
      packages={packages ?? []}
      themes={themes ?? []}
      featured={featured}
      responseTimeFull={home?.responseTime?.full}
      budgetRate={budgetRate}
      locale={loc}
    />
  );
}
