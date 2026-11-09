import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { allDayToursQuery } from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import { getRates } from '@/lib/fx';
import { JsonLd } from '@/components/JsonLd';
import { Price } from '@/components/Price';
import { buildBreadcrumbList, buildItemListSchema } from '@/lib/structured-data';
import { DayHubList } from '@/components/day-hubs/DayHubList';
import { DayHubEnd } from '@/components/day-hubs/DayHubEnd';
import { buildDayHub, cityOptionsFor, responseTimeFull } from '@/components/day-hubs/buildDayHub';
import { isRedSea, minPrice, primaryCity, type RawHubTour } from '@/components/day-hubs/dayHubData';

import '@/styles/tour-system.css';
import '@/styles/home-sales.css';
import '@/styles/day-hubs.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tours' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/tours',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

/**
 * /tours — every day tour, private and small group (owner spec, 2026-11-09):
 * Mode / City / Length / Budget filters with URL state, Nile Valley first,
 * Red Sea excursions in their own section at the bottom, inline form close.
 * Filtering runs in the browser, so the page stays static.
 */
export default async function ToursLandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const t = await getTranslations('tours');
  const tNav = await getTranslations('nav');
  const tDay = await getTranslations('dayTours');
  const th = await getTranslations('dayHub');

  const [tours, fx, rtFull] = await Promise.all([
    client.fetch<RawHubTour[]>(allDayToursQuery(loc)),
    getRates(),
    responseTimeFull(loc),
  ]);
  const { items, cards, sorted, budgetEdges } = await buildDayHub(tours, { locale: loc, hub: 'tours', rates: fx.rates });
  const cityOpts = await cityOptionsFor(tours, loc);
  const nile = sorted.filter((tr) => !isRedSea(primaryCity(tr).key));
  const lowest = minPrice(nile);
  const [heroBefore, heroAfter] = (th.raw('heroFrom') as string).split('{price}');

  return (
    <div className="tour-doc lvl-category lvl-dayhub">
      <JsonLd
        data={[
          buildBreadcrumbList(
            [
              { name: tNav('home'), path: '/' },
              { name: tNav('tours'), path: '/tours' },
            ],
            loc,
          ),
          buildItemListSchema(nile, loc),
        ]}
      />
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{tNav('tours')}</li>
          </ol>
        </nav>
        <header className="masthead dh-mast">
          <div className="mast-lead">
            <h1 className="mast-title">{t('landingTitle')}</h1>
            <p className="mast-tag">{t('landingDeck')}</p>
            {lowest && (
              <p className="dh-from">
                {heroBefore}
                <Price eur={lowest} />
                {heroAfter}
              </p>
            )}
          </div>
        </header>
      </div>

      <section className="index dh-index" id="every-day">
        <div className="t2e-wrap">
          <DayHubList
            items={items}
            cards={cards}
            budgetEdges={budgetEdges}
            showMode
            cityOptions={{ nile: cityOpts.nile, redSea: cityOpts.redSea }}
            cityAliases={cityOpts.aliases}
            lengthLabels={{
              label: tDay('filterLength'),
              any: tDay('anyLength'),
              half: tDay('lengthHalf'),
              full: tDay('lengthFull'),
              extended: tDay('lengthExtended'),
            }}
            lengthNote={tDay('lengthHint')}
            hub="tours"
          />
        </div>
      </section>

      <DayHubEnd locale={loc} hub="tours" responseTimeFull={rtFull} />
    </div>
  );
}
