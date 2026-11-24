import type { Metadata } from 'next';
import { groq } from 'next-sanity';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { guidePriceParam } from '@/sanity/lib/guidePrice';
import { buildStaticMetadata } from '@/lib/seo';
import { LOCAL_SLUG } from '@/lib/products/bySlug';
import { buildCalendar, type CalendarTour } from '@/lib/groupDepartures';
import { GroupDeparturesView } from '@/components/group-departures/GroupDeparturesView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'groupDepartures' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/group-departures',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

/** Every published group tour that has at least one stored departure date. */
const groupDeparturesQuery = groq`*[_type == "tour" && tourMode == "group" && count(departures) > 0 && !(_id in path("drafts.**")) && hidden != true]{
  _id,
  "href": ${LOCAL_SLUG},
  "title": coalesce(title[_key==$locale][0].value, title[_key=="en"][0].value, ""),
  "priceFrom": ${guidePriceParam},
  durationDays,
  peakUpliftPct,
  maxGroup,
  departures[]{ startDate, isPeak, status, placesLeft }
}`;

export default async function GroupDeparturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tours = await client.fetch<CalendarTour[]>(groupDeparturesQuery, { locale });
  const months = buildCalendar(tours ?? [], { now: new Date(), locale });
  return <GroupDeparturesView months={months} locale={locale as Locale} />;
}
