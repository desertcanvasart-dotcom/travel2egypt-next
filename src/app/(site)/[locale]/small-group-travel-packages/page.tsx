import type { Metadata } from 'next';
import { groq } from 'next-sanity';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { packageCategoryQuery } from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import { getRates } from '@/lib/fx';
import { EN_SLUG, LOCAL_SLUG } from '@/lib/products/bySlug';
import { ONE_DAY_CHECK_FIELDS } from '@/lib/products/multiDay';
import {
  SmallGroupHubView,
  type SmallGroupArchive,
  type SmallGroupTour,
} from '@/components/small-group/SmallGroupHubView';

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

/**
 * Every published small-group package (type package, tourMode group), keyed
 * by EN slug with this language's slug for links (bySlug.ts fragments), plus
 * the facts the card shows: region, departures, max group, from price.
 */
const smallGroupToursQuery = groq`{
  "tours": *[_type == "tour" && type == "package" && tourMode == "group" && !(_id in path("drafts.**"))]
    | order(durationDays asc, _createdAt desc){
    _id,
    "slug": ${EN_SLUG},
    "href": ${LOCAL_SLUG},
    "title": coalesce(title[_key==$locale][0].value, title[_key=="en"][0].value, ""),
    type,
    priceFrom,
    durationDays,
    originRegion,
    maxGroup,
    departures[]{ startDate, status },
    ${ONE_DAY_CHECK_FIELDS},
    heroImage{ ..., "alt": coalesce(alt[_key==$locale][0].value, alt[_key=="en"][0].value, "") }
  },
  "responseTime": *[_type == "siteSettings"][0]{
    "full": coalesce(responseTimeFull[_key==$locale][0].value, responseTimeFull[_key=="en"][0].value, "")
  }
}`;

/** The index layout's budget currency per language: $ (en), € (es), ¥ (ja). */
const BUDGET_CCY: Record<string, string> = { en: 'USD', es: 'EUR', ja: 'JPY' };

export default async function SmallGroupTravelPackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const [archive, data, fx] = await Promise.all([
    client.fetch<SmallGroupArchive | null>(packageCategoryQuery(loc, 'group-package')),
    client.fetch<{ tours: SmallGroupTour[]; responseTime?: { full?: string } | null }>(smallGroupToursQuery, { locale }),
    getRates(),
  ]);

  const ccy = BUDGET_CCY[locale] ?? 'USD';
  const budgetRate = ccy === 'EUR' ? 1 : fx.rates[ccy] ?? 1;

  return (
    <SmallGroupHubView
      archive={archive}
      tours={(data?.tours ?? []).filter((p) => p.slug && p.href)}
      responseTimeFull={data?.responseTime?.full}
      budgetRate={budgetRate}
      now={new Date()}
      locale={loc}
    />
  );
}
