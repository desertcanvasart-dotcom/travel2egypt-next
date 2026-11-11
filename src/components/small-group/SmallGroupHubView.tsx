import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Price } from '@/components/Price';
import { JsonLd } from '@/components/JsonLd';
import { LeadButton } from '@/components/leads/LeadProvider';
import { LeadForm, type DepartureOption, type LeadPrefill } from '@/components/leads/LeadForm';
import { buildBreadcrumbList, buildItemListSchema } from '@/lib/structured-data';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import { TourProse } from '@/components/tour-system/TourProse';
import { MastheadStats } from '@/components/tour-system/MastheadStats';
import type { RawDeparture } from '@/components/tour-system/departures';
import { TourCard } from '@/components/home-sales/TourCard';
import { HOME_COPY, type HomeLocale } from '@/components/home-sales/copy';
import type { SalesProduct } from '@/components/home-sales/query';
import { PackagesIndex, type HubRow } from '@/components/packages-hub/PackagesIndex';
import { multiDayOnly } from '@/lib/products/multiDay';

import { nextDepartureLabels, regionLabel, routeFromTitle, type SgLocale } from './smallGroup';

import '@/styles/tour-system.css';
import '@/styles/home-sales.css';
import '@/styles/packages-hub.css';

/**
 * Small-group hub — /small-group-travel-packages (owner spec "small-group
 * page consistency pass", 2026-11-10). The packages hub's template: same
 * hero, counters, card and inline form. Order:
 *   1. hero  2. the departures (one grid, every published small-group tour)
 *   3. why a group departure (the former intro + "How a departure works" +
 *      "Who it suits", text unchanged, moved below)  4. footband links
 *   5. one closing group form.
 * Above GRID_MAX tours the grid becomes the packages index (length filter).
 */

/** More published small-group tours than this → the packages index layout. */
export const GRID_MAX = 6;

/** The list name on every small-group select_item (GA4). */
const LIST = 'small_group_departures';
const TYPE = { type: 'small_group' } as const;

export interface SmallGroupTour extends SalesProduct {
  _id: string;
  originRegion?: string | null;
  maxGroup?: number | null;
  departures?: RawDeparture[] | null;
  enTitle?: string | null;
  enSummary?: string | null;
}

export interface SmallGroupArchive {
  editorByline?: { kicker?: string; heading?: string; intro?: string } | null;
  essay?: unknown;
}

export async function SmallGroupHubView({
  archive,
  tours,
  responseTimeFull,
  budgetRate,
  now,
  locale,
}: {
  archive: SmallGroupArchive | null;
  tours: SmallGroupTour[];
  responseTimeFull?: string | null;
  /** EUR → the budget labels' currency (index layout only). */
  budgetRate: number;
  /** Render time: departures after today only. */
  now: Date;
  locale: Locale;
}) {
  const t = await getTranslations('smallGroupHub');
  const tHub = await getTranslations('packagesHub');
  const ts = await getTranslations('tourSystem');
  const tNav = await getTranslations('nav');
  const isJa = locale === 'ja';
  const L = locale as SgLocale;
  const home = HOME_COPY[locale as HomeLocale];
  const sep = isJa ? '' : ' ';

  // "Which departure?" — one option per region programme, + "Not sure" (form).
  const departureOptions: DepartureOption[] = tours.map((p) => {
    const region = regionLabel(p.originRegion, L);
    const days = p.durationDays ? home.days(p.durationDays) : '';
    return {
      value: p.slug,
      label: [region, days].filter(Boolean).join(' · ') || p.title,
      title: p.title,
    };
  });
  const groupPrefill: LeadPrefill = { kind: 'trip', enquiryType: 'small_group', departureOptions };

  // Hero counters, from the published small-group products.
  const lowest = (() => {
    const v = multiDayOnly(tours).map((p) => p.priceFrom).filter((n): n is number => typeof n === 'number' && n > 0);
    return v.length ? Math.min(...v) : null;
  })();
  const stats = [
    { label: t('statTours'), value: tours.length ? t('statToursValue', { count: tours.length }) : 0 },
    { label: t('statFrom'), value: lowest ? isJa ? <><Price eur={lowest} />〜</> : <Price eur={lowest} /> : 0 },
    { label: t('statSince'), value: t('statSinceValue') },
  ];

  const useIndex = tours.length > GRID_MAX;
  const rows: HubRow[] = tours.map((p) => ({
    id: p._id,
    slug: p.slug,
    name: p.title,
    href: `/${p.href}`,
    days: typeof p.durationDays === 'number' ? p.durationDays : null,
    durLabel: p.durationDays ? ts('pkgCatDayCount', { count: p.durationDays }) : '',
    theme: regionLabel(p.originRegion, L) ?? '',
    eur: p.priceFrom && p.priceFrom > 0 ? p.priceFrom : null,
    budgetValue: p.priceFrom && p.priceFrom > 0 ? p.priceFrom * budgetRate : null,
  }));

  return (
    <div className="tour-doc lvl-category lvl-hub lvl-sg" lang={locale}>
      <JsonLd
        data={[
          buildBreadcrumbList(
            [
              { name: tNav('home'), path: '/' },
              { name: t('crumb'), path: '/small-group-travel-packages' },
            ],
            locale,
          ),
          buildItemListSchema(tours.map((p) => ({ title: p.title, slug: p.href })), locale),
        ]}
      />

      {/* 1. HERO — the packages hub hero. */}
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{tHub('crumbTours')}</li>
            <li>{t('crumb')}</li>
          </ol>
        </nav>
        <header className="masthead hub-mast">
          <div className="mast-lead">
            <span className="t2e-kicker">{ts('pkgGroupCatMastKicker')}</span>
            <h1 className="mast-title">{t('title')}</h1>
            <p className="mast-tag">{t('dek')}</p>
            <div className="hub-cta">
              <LeadButton
                source="small_group_hero"
                prefill={groupPrefill}
                openEvent={{ name: 'form_open', params: { location: 'small_group_hero', ...TYPE } }}
                className="hub-btn"
              >
                {t('primary')} <span aria-hidden>→</span>
              </LeadButton>
              <a className="hub-text-link" href="#departures">{t('secondary')}</a>
            </div>
          </div>
          <MastheadStats stats={stats} />
        </header>
      </div>

      {/* 2. THE DEPARTURES — every published small-group tour, once. */}
      <section className="hub-sec hub-mb" id="departures" aria-labelledby="h-departures" style={{ scrollMarginTop: 80 }}>
        <div className="t2e-wrap">
          <div className="t2e-section-head">
            <div>
              <span className="t2e-kicker">{ts('pkgGroupCatPicksKicker')}</span>
              <h2 id="h-departures">
                {ts('pkgGroupCatIndexTitle')} <em>{ts('pkgGroupCatIndexTitleEm')}</em>
              </h2>
            </div>
            <p>{ts('pkgGroupCatPicksIntro')}</p>
          </div>
          {useIndex ? (
            <PackagesIndex
              rows={rows}
              budgetEdges={isJa ? [250000, 400000, 600000] : [1500, 2500, 4000]}
              labels={{
                lengthLabel: ts('pkgCatLenLabel'),
                anyLength: ts('pkgCatLenAny'),
                lengths: {
                  '3-5': ts('pkgCatLenLe5'),
                  '6-9': ts('pkgCatLen6to9'),
                  '10-14': ts('pkgCatLen10to14'),
                  '15+': ts('pkgCatLen15plus'),
                },
                budgetLabel: tHub('budgetLabel'),
                budgetAny: tHub('budgetAny'),
                budgets: {
                  lt1500: tHub('budgetLt1500'),
                  '1500-2500': tHub('budget1500'),
                  '2500-4000': tHub('budget2500'),
                  '4000+': tHub('budget4000'),
                },
                sortLabel: tHub('sortLabel'),
                sorts: { length: tHub('sortLength'), price_asc: tHub('sortPriceAsc'), price_desc: tHub('sortPriceDesc') },
                rowFrom: tHub.raw('rowFrom') as string,
                priceOnRequest: tHub('priceOnRequest'),
                empty: tHub('empty'),
                emptyAction: tHub('emptyAction'),
              }}
            />
          ) : (
            <div className="lvl-home lvl-sales">
              <ul className="pcards pcards--two">
                {tours.map((p) => {
                  const route = routeFromTitle(p.title).join(' · ');
                  const dates = nextDepartureLabels(p.departures, L, now, 3, p.maxGroup);
                  return (
                    <TourCard
                      key={p._id}
                      slug={p.slug}
                      p={p}
                      locale={locale as HomeLocale}
                      listName={LIST}
                      source="small_group_card"
                      route={route || null}
                      badge={regionLabel(p.originRegion, L)}
                      basis={t('basis')}
                      trackParams={TYPE}
                      extra={
                        <div className="sg-facts">
                          <p className="sg-dates">
                            {dates.length > 0 ? (
                              <>
                                {t('nextDepartures')}
                                {sep}
                                {dates.join(' · ')}
                              </>
                            ) : (
                              t('nextAsk')
                            )}
                          </p>
                          {typeof p.maxGroup === 'number' && p.maxGroup > 0 && (
                            <p className="sg-size">{t('maxGroup', { n: p.maxGroup })}</p>
                          )}
                        </div>
                      }
                      primary={{
                        label: t('askDates'),
                        prefill: { ...groupPrefill, tourSlug: p.slug, tourTitle: p.title, durationDays: p.durationDays },
                        openEvent: { name: 'form_open', params: { location: 'small_group_card', ...TYPE } },
                      }}
                    />
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 3. WHY A GROUP DEPARTURE — the former intro, moved below, unchanged. */}
      <section className="editorial hub-how">
        <div className="t2e-wrap intro-grid">
          <aside className="byline">
            <span className="t2e-kicker">{archive?.editorByline?.kicker ?? ts('pkgGroupCatWhyKicker')}</span>
            <h3>{archive?.editorByline?.heading ?? ts('pkgGroupCatWhyHeading')}</h3>
            <p>{archive?.editorByline?.intro ?? ts('pkgGroupCatWhyNote')}</p>
          </aside>
          <article className="article">
            <TourProse value={archive?.essay} locale={locale} />
          </article>
        </div>
      </section>

      {/* 4. FOOTBAND — unchanged links. */}
      <section className="t2e-footband">
        <div className="t2e-wrap t2e-footband-grid">
          <div>
            <h4>{ts('pkgGroupCatFootSeasonLabel')}</h4>
            <div className="t2e-season">
              <p>{ts('pkgGroupCatFootSeasonBody')}</p>
            </div>
          </div>
          <div>
            <h4>{ts('beforeYouChoose')}</h4>
            <ul>
              <li><Link href="/egypt-travel-packages">{ts('pkgGroupCatFootPrivateGroup')}<small>{ts('pkgGroupCatFootPrivateGroupSub')}</small></Link></li>
              <li><Link href="/guide">{ts('pkgGroupCatFootDays')}<small>{ts('pkgGroupCatFootDaysSub')}</small></Link></li>
              <li><Link href="/nile-cruises">{ts('pkgGroupCatFootCruise')}<small>{ts('pkgGroupCatFootCruiseSub')}</small></Link></li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. ONE CLOSING GROUP FORM — the homepage inline form, small_group. */}
      <section className="hub-close" id="itinerary" aria-labelledby="h-sg-close">
        <div className="lvl-home lvl-sales">
          <div className="plan sales-close">
            <div className="wrap close-grid">
              <div>
                <span className="kicker">{ts('pkgGroupCatCtaKicker')}</span>
                <h2 id="h-sg-close">{t('closeTitle')}</h2>
                <p className="sub">
                  {t('closeFree')}
                  {sep}
                  {responseTimeFull}
                </p>
                <ul className="close-alt">
                  <li>
                    {t('closeChat')}
                    {sep}
                    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                      WhatsApp +20 155 177 2258
                    </a>
                  </li>
                </ul>
              </div>
              <span data-end-form hidden />
              <LeadForm source="small_group_end" prefill={groupPrefill} tone="dark" headingId="h-sg-close" locale={locale} />
            </div>
          </div>
        </div>
      </section>

      <FloatingConcierge />
    </div>
  );
}
