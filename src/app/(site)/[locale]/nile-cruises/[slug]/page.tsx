import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/structured-data';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import {
  cruiseBySlugQuery,
  allCruiseSlugsQuery,
  siteSettingsQuery,
} from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { TourCard, type TourCardData } from '@/components/TourCard';
import type { CruiseCardData } from '@/components/CruiseCard';
import { ItineraryDays, type ItineraryDay } from '@/components/ItineraryDays';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

type CityRefLite = { _id: string; name?: string; slug?: string };

type CruiseDay = ItineraryDay;

type CruiseDetail = CruiseCardData & {
  body?: unknown;
  operatorNotes?: unknown;
  poweredBy?: string[];
  durationNights?: number;
  departureCity?: CityRefLite | null;
  returnCity?: CityRefLite | null;
  departureWeekdays?: string[];
  specificDepartureDates?: string[];
  itinerary?: CruiseDay[];
  relatedTours?: TourCardData[];
  gallery?: Array<{ asset?: unknown; alt?: string }>;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: { asset?: unknown; alt?: string } | null;
    noIndex?: boolean;
  };
  allSlugs?: Array<{ _key: string; current: string }>;
};

const POWERED_BY_KEYS: Record<string, string> = {
  engine: 'poweredByEngine',
  wind: 'poweredByWind',
  steam: 'poweredBySteam',
};

const WEEKDAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const TYPE_LABEL: Record<string, string> = {
  'cruise-ship': 'Cruise ship',
  dahabiya: 'Dahabiya',
  felucca: 'Felucca',
};

const TIER_LABEL: Record<string, string> = {
  standard: 'Standard',
  deluxe: 'Deluxe',
  luxury: 'Luxury',
  boutique: 'Boutique',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const cruise: CruiseDetail | null = await client.fetch(
    cruiseBySlugQuery(locale as Locale),
    { slug }
  );
  if (!cruise) return {};
  return buildMetadata(
    {
      title: cruise.name,
      summary: cruise.summary,
      heroImage: cruise.heroImage,
      seo: cruise.seo,
    },
    {
      locale: locale as Locale,
      path: `/nile-cruises/${slug}`,
      pathByLocale: pathByLocaleFromSlugs(
        cruise.allSlugs ?? [],
        (s: string) => `/nile-cruises/${s}`
      ),
    }
  );
}

export async function generateStaticParams() {
  const cruises: Array<{
    slugs: Array<{ _key: string; current: string }>;
  }> = await client.fetch(allCruiseSlugsQuery);

  const params: Array<{ locale: string; slug: string }> = [];
  for (const cruise of cruises) {
    const enSlug = cruise.slugs?.find((s) => s._key === 'en')?.current;
    if (!enSlug) continue;
    for (const locale of routing.locales) {
      const localizedSlug =
        cruise.slugs.find((s) => s._key === locale)?.current ?? enSlug;
      params.push({ locale, slug: localizedSlug });
    }
  }
  return params;
}

export default async function CruisePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('cruise');
  const [cruise, siteSettings] = await Promise.all([
    client.fetch<CruiseDetail | null>(cruiseBySlugQuery(locale as Locale), { slug }),
    client.fetch(siteSettingsQuery(locale as Locale)),
  ]);

  if (!cruise) notFound();

  const heroUrl = cruise.heroImage?.asset
    ? urlFor(cruise.heroImage).width(2400).height(1200).quality(85).url()
    : null;

  const whatsappNumber: string | undefined = siteSettings?.contact?.whatsapp;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
        `Hi — I'd like to ask about sailing on "${cruise.name}"`
      )}`
    : null;

  const typeLabel = cruise.type ? TYPE_LABEL[cruise.type] : null;
  const tierLabel = cruise.tier ? TIER_LABEL[cruise.tier] : null;
  const capacityLabel = cruise.capacity ? `${cruise.capacity} ${t('cabinsUnit')}` : null;

  const poweredByLabels = (cruise.poweredBy ?? [])
    .map((p) => (POWERED_BY_KEYS[p] ? t(POWERED_BY_KEYS[p]) : null))
    .filter((v): v is string => Boolean(v));

  const departureName = cruise.departureCity?.name ?? null;
  const returnName = cruise.returnCity?.name ?? null;
  const routeLabel = departureName
    ? returnName && returnName !== departureName
      ? t('oneWayRoute', { from: departureName, to: returnName })
      : t('roundTripFrom', { city: departureName })
    : null;

  const durationNightsLabel =
    typeof cruise.durationNights === 'number'
      ? t('durationNightsUnit', { count: cruise.durationNights })
      : null;

  const sortedWeekdays = (cruise.departureWeekdays ?? [])
    .slice()
    .sort((a, b) => WEEKDAY_ORDER.indexOf(a as any) - WEEKDAY_ORDER.indexOf(b as any));

  const itinerary = cruise.itinerary ?? [];

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: 'Home', path: '/' },
      { name: t('breadcrumbLabel'), path: '/nile-cruises' },
      { name: cruise.name, path: `/nile-cruises/${slug}` },
    ],
    locale as Locale
  );

  return (
    <article>
      <JsonLd data={[breadcrumbSchema]} />
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-cream-deep">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={cruise.heroImage?.alt || cruise.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1408]/25 via-[#1f1408]/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1f1408]/42 via-[#1f1408]/15 to-transparent pt-32">
          <div className="mx-auto max-w-7xl px-6 pb-12">
            <p className="mb-3 flex flex-wrap items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-soft">
              {typeLabel && <span>{typeLabel}</span>}
              {tierLabel && (
                <>
                  <span className="opacity-60">·</span>
                  <span>{tierLabel}</span>
                </>
              )}
              {capacityLabel && (
                <>
                  <span className="opacity-60">·</span>
                  <span className="text-paper/80">{capacityLabel}</span>
                </>
              )}
            </p>
            <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[1.05] text-paper drop-shadow-[0_2px_8px_rgba(31,20,8,0.45)] md:text-6xl">
              {cruise.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_340px]">
          <div>
            {cruise.summary && (
              <p className="mb-12 font-serif text-2xl italic leading-relaxed text-ink-soft">
                {cruise.summary}
              </p>
            )}

            {Boolean(cruise.body) && (
              <div className="prose-editorial max-w-none">
                <Body value={cruise.body} locale={locale as Locale} />
              </div>
            )}

            {Boolean(cruise.operatorNotes) && (
              <section className="mt-12 border-l-2 border-orange-deep bg-cream-warm/40 p-6">
                <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-deep">
                  {t('operatorNotesLabel')}
                </h2>
                <div className="prose-editorial max-w-none text-ink-soft">
                  <Body value={cruise.operatorNotes} locale={locale as Locale} />
                </div>
              </section>
            )}

            <ItineraryDays
              days={itinerary}
              locale={locale as Locale}
              labels={{
                itinerary: t('itineraryLabel'),
                day: (n) => t('dayLabel', { n }),
                meals: t('mealsLabel'),
                stay: t('overnightLabel'),
              }}
            />


            {cruise.relatedTours && cruise.relatedTours.length > 0 && (
              <section className="mt-20 border-t border-line pt-16">
                <h2 className="mb-8 font-serif text-3xl font-medium text-ink">
                  {t('relatedToursLabel')}
                </h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
                  {cruise.relatedTours.map((related) => (
                    <TourCard key={related._id} tour={related} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-line bg-cream-warm p-6">
              <dl className="space-y-4 text-sm">
                {typeLabel && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('typeLabel')}
                    </dt>
                    <dd className="text-ink-soft">{typeLabel}</dd>
                  </div>
                )}
                {tierLabel && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('tierLabel')}
                    </dt>
                    <dd className="text-ink-soft">{tierLabel}</dd>
                  </div>
                )}
                {capacityLabel && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('capacityLabel')}
                    </dt>
                    <dd className="text-ink-soft">{capacityLabel}</dd>
                  </div>
                )}
                {poweredByLabels.length > 0 && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('poweredByLabel')}
                    </dt>
                    <dd className="text-ink-soft">{poweredByLabels.join(' · ')}</dd>
                  </div>
                )}
                {routeLabel && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('routeLabel')}
                    </dt>
                    <dd className="text-ink-soft">{routeLabel}</dd>
                  </div>
                )}
                {durationNightsLabel && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('durationLabel')}
                    </dt>
                    <dd className="text-ink-soft">{durationNightsLabel}</dd>
                  </div>
                )}
                {(sortedWeekdays.length > 0 || (cruise.specificDepartureDates?.length ?? 0) > 0) && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('departureScheduleLabel')}
                    </dt>
                    <dd className="space-y-1.5 text-ink-soft">
                      {sortedWeekdays.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {sortedWeekdays.map((d) => (
                            <span
                              key={d}
                              className="rounded-full border border-line bg-cream-warm px-2.5 py-0.5 text-xs"
                            >
                              {t(`weekday_${d}` as any)}
                            </span>
                          ))}
                        </div>
                      )}
                      {cruise.specificDepartureDates && cruise.specificDepartureDates.length > 0 && (
                        <ul className="text-xs text-ink-muted">
                          {cruise.specificDepartureDates.slice(0, 8).map((d) => (
                            <li key={d}>{dateFormatter.format(new Date(d))}</li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href={`/plan-your-tour?context=cruise:${slug}`}
                className="block w-full rounded-full bg-orange px-6 py-3.5 text-center text-sm font-medium text-paper transition-colors hover:bg-orange-deep"
              >
                {t('talkToConcierge')}
              </Link>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-full border border-ink px-6 py-3.5 text-center text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  {t('whatsappInquiry')}
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
