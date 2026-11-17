import { getTranslations } from 'next-intl/server';
import { StickyBarProduct } from '@/components/leads/LeadProvider';
import { getAccreditations, iataItem, licenceShort } from '@/lib/accreditations';
import { PortableText } from '@portabletext/react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Price } from '../Price';
import { JsonLd } from '../JsonLd';
import { LandingFaq, type LandingFaqItem } from './LandingFaq';
import { withStandardFaq } from '@/lib/standardFaq';
import { buildTouristTripSchema, buildBreadcrumbList } from '@/lib/structured-data';

import { JourneyImage } from './JourneyImage';
import { enSlugOf } from '@/lib/products/bySlug';
import { TourProse } from './TourProse';
import { LazyFloatingConcierge } from '../LazyFloatingConcierge';
import { MultiDayPanel, DayHeroFacts, ProductFactsBlock, MidCta, EndBlock, type PanelFact } from '../product/ProductPanels';
import { YourRoute, MakeItYourOwn, CompactStickyCard } from '../product/RightColumn';
import { ItineraryFormat, itineraryFormatReady, type ItineraryFormatData } from '../product/ItineraryFormat';
import { countNights, nightParts } from '@/lib/products/nights';
import { routeStops, type RouteLegRow } from '@/lib/products/routeLabels';
import { ProductLeadButton, ProductViewTracker } from '../product/ProductActions';
import { HOME_COPY, homeLocale } from '../home-sales/copy';
import { buildProductOffer } from '@/lib/productOffer';
import { buildDepartures, type RawDeparture } from './departures';
import '@/styles/tour-system.css';

import { WHATSAPP_LINK as WHATSAPP, waTourTitle } from '@/lib/concierge/constants';

interface CityRef { _id: string; name: string; slug: string }
interface PackageDay {
  dayNumber?: number;
  title?: string;
  accommodation?: string;
  morning?: unknown;
  afternoon?: unknown;
}

export interface PackageDoc {
  _id: string;
  type?: string;
  tourMode?: string;
  title: string;
  slug: string;
  summary?: string;
  durationDays?: number;
  durationLabel?: string;
  priceFrom?: number;
  priceTiers?: Array<{ name?: string; sub?: string; price?: number; unit?: string }> | null;
  priceNote?: string;
  /** ES/JA: priceFrom includes the guide-language supplement. */
  guidePriced?: boolean | null;
  singleSupplement?: number | null;
  basePrice?: number | null;
  peakUpliftPct?: number | null;
  maxGroup?: number | null;
  departures?: RawDeparture[] | null;
  originRegion?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: CityRef[];
  body?: unknown;
  /** Optional section rendered after the day-by-day itinerary (locale-strict). */
  practicalInfo?: unknown[] | null;
  days?: PackageDay[] | null;
  conciergeNote?: string;
  faq?: LandingFaqItem[];
  includedItems?: string[] | null;
  notIncludedItems?: string[] | null;
  accessNoteTitle?: string;
  accessNote?: string;
  audienceNoteTitle?: string;
  audienceNote?: string;
  shapeOfDay?: { where?: string; duration?: string; character?: string } | null;
  theme?: { name?: string; slug?: string } | null;
  themeLanding?: { slug?: string } | null;
  relatedTours?: Array<{ _id: string; title: string; slug: string; durationLabel?: string; priceFrom?: number | null }> | null;
  approvedInclusions?: string[] | null;
  approvedExclusions?: string[] | null;
  approvedExclusionRows?: Array<{ _key?: string; text: string; seeSection?: string | null }> | null;
  /** Approved overnights (every overnight in this language approved), for the Nights count. */
  approvedItinerary?: Array<{ day: number; overnight?: string | null }> | null;
  /** Multi-day itinerary format: intro + days, only when all approved in this language. */
  itineraryFormat?: ItineraryFormatData | null;
  /** Owner-approved route legs (all legs in this language, or none). */
  approvedRoute?: RouteLegRow[] | null;
  approvedOptions?: string[] | null;
  priceUpdatedAt?: string;
  relatedGuides?: Array<{ _id: string; _type?: string; title?: string; slug?: string; parentCity?: { slug?: string } | null }> | null;
  relatedGuideArticles?: Array<{ _id: string; _type?: string; title?: string; slug?: string; parentCity?: { slug?: string } | null }> | null;
  journalRefs?: Array<{ _id: string; title?: string; slug?: string }> | null;
}

export async function PackageView({ tour, locale }: { tour: PackageDoc; locale: Locale }) {
  // Trust line: approved Short licence string + IATA item (fix round 2).
  const accreditations = await getAccreditations();
  const trustCreds = [licenceShort(accreditations, locale), iataItem(accreditations)].filter(Boolean).join(' · ');
  const tNav = await getTranslations('nav');
  const tSub = await getTranslations('subcategory');
  const ts = await getTranslations('tourSystem');
  const tp = await getTranslations('productPanel');
  const waHref = `${WHATSAPP}?text=${encodeURIComponent(ts('waTourText', { title: waTourTitle(tour.title) }))}`;


  const cityNames = (tour.cities ?? []).map((c) => c.name).filter(Boolean);
  const route = cityNames.join(' · ');
  // Panel Route row (2026-11-11): stops only, in order, repeats kept. Once
  // the route legs are approved it reads from their stops; before that from
  // the linked cities. A single-stop route shows no row (never "Cairo" alone).
  const approvedRoute = tour.approvedRoute ?? [];
  const stops = approvedRoute.length ? routeStops(approvedRoute) : cityNames;
  const routeRow = stops.length >= 2 ? stops.join(' · ') : '';
  const days = (tour.days ?? []).filter((d) => d.title || d.morning || d.afternoon || d.dayNumber);
  const durationDays = tour.durationDays ?? days.length;
  const approvedItin = tour.approvedItinerary ?? [];
  const itinCovers = approvedItin.length > 0 && approvedItin.length === durationDays;
  // Nights (2026-11-16): computed from the overnights, grouped hotel / sleeper
  // train / river / camp: the approved per-day overnights when they cover every
  // day, else the legacy days[].accommodation, else days − 1 (all hotel).
  // The legacy list keeps the old total (days − 1); its train, river and camp
  // nights are counted and the rest are hotel nights, as before.
  const legacyStays = days.map((d) => d.accommodation).filter(Boolean) as string[];
  const nightCounts = (() => {
    if (itinCovers) return countNights(approvedItin.map((d) => d.overnight));
    if (legacyStays.length === 0) return null;
    const c = countNights(legacyStays);
    const total = durationDays > 0 ? durationDays - 1 : c.total;
    return { ...c, hotel: Math.max(total - c.train - c.river - c.camp, 0), total };
  })();
  const nights = nightCounts ? nightCounts.total : durationDays > 0 ? durationDays - 1 : 0;

  // ── Group package: the scheduled-departures apparatus. Built deterministically
  // at render/build time so the soonest FUTURE date is selected. ──
  const isGroup = tour.tourMode === 'group';
  // Per-departure base price: the stored base price, else the tour's "from"
  // price (owner, 2026-11-11), so dates are priced instead of "On inquiry".
  const groupBase =
    typeof tour.basePrice === 'number' ? tour.basePrice : typeof tour.priceFrom === 'number' ? tour.priceFrom : null;
  const dep = isGroup
    ? buildDepartures(tour.departures, {
        durationDays,
        basePrice: groupBase,
        peakUpliftPct: tour.peakUpliftPct,
        maxGroup: tour.maxGroup,
        locale,
        now: new Date(),
      })
    : null;
  const STATUS_LABEL: Record<string, string> = {
    guaranteed: ts('pkgGrpStatusGuaranteed'),
    few: ts('pkgGrpStatusFew'),
    available: ts('pkgGrpStatusAvailable'),
    soldout: ts('pkgGrpStatusSoldout'),
    onrequest: ts('pkgGrpStatusOnrequest'),
  };
  const STATUS_CLASS: Record<string, string> = {
    guaranteed: 's-ok',
    few: 's-few',
    available: 's-open',
    soldout: 's-out',
    onrequest: 's-req',
  };
  const reserveHref = (dateRange: string) =>
    `${WHATSAPP}?text=${encodeURIComponent(ts('pkgGrpReserveText', { title: tour.title, date: dateRange }))}`;

  // Nights split: shown when the nights are of more than one kind
  // ("2 hotel · 1 sleeper train · 3 on the river").
  const NIGHT_KEY = { hotel: 'nightsHotel', train: 'nightsTrain', river: 'nightsRiver', camp: 'nightsCamp' } as const;
  const parts = nightCounts ? nightParts(nightCounts) : [];
  const cruiseNights = nightCounts?.river ?? 0;
  const nightsSplit =
    parts.length > 1 ? parts.map((p) => tp(NIGHT_KEY[p.kind], { n: p.n })).join(locale === 'ja' ? '・' : ' · ') : '';
  const itinFormat = itineraryFormatReady(tour.itineraryFormat, durationDays) ? tour.itineraryFormat : null;


  // "From" amount: group packages show the base price (falling back to
  // priceFrom); private packages priceFrom, else the first price tier.
  const fromAmount = isGroup
    ? typeof tour.basePrice === 'number'
      ? tour.basePrice
      : typeof tour.priceFrom === 'number'
        ? tour.priceFrom
        : undefined
    : typeof tour.priceFrom === 'number'
      ? tour.priceFrom
      : tour.priceTiers?.[0]?.price;

  const shape = tour.shapeOfDay;

  const tiers = (tour.priceTiers ?? []).filter((p) => p.name || typeof p.price === 'number');
  const suppValue =
    typeof tour.singleSupplement === 'number'
      ? <>{ts('pkgSuppFrom')} <Price eur={tour.singleSupplement} /></>
      : null;
  // "Why book with us" ticks + licence line, now inside the sticky card
  // (packages, 2026-11-15, same as day tours); the second tick follows tourMode.
  const trustSignals = [
    ts('trustSignal1'),
    isGroup ? ts('trustSignal2Group') : ts('trustSignal2Private'),
    ts('trustSignal3'),
    ts('trustSignal4'),
  ];
  const trustLine = [trustCreds, ts('trustAccred')].filter(Boolean).join(' — ');

  // Approved extracted items (review-gated); a product with none falls back to
  // the lists authored before the template (one quad-bike tour has them).
  const approvedIn = tour.approvedInclusions ?? [];
  const approvedOut = tour.approvedExclusions ?? [];
  const included = approvedIn.length || approvedOut.length ? approvedIn : tour.includedItems ?? [];
  const notIncluded = approvedIn.length || approvedOut.length ? approvedOut : tour.notIncludedItems ?? [];
  const notIncludedRows =
    approvedIn.length || approvedOut.length
      ? tour.approvedExclusionRows ?? approvedOut.map((text) => ({ text }))
      : notIncluded.map((text) => ({ text }));

  const guideItems = [...(tour.relatedGuides ?? []), ...(tour.relatedGuideArticles ?? [])].filter((g) => g.title);
  const journal = (tour.journalRefs ?? []).filter((j) => j.title);
  const moreJourneys = (tour.relatedTours ?? []).filter((r) => r.slug);
  const guideHref = (g: { _type?: string; slug?: string; parentCity?: { slug?: string } | null }) =>
    g._type === 'guideArticle' && g.parentCity?.slug ? `/guide/${g.parentCity.slug}/${g.slug}` : `/guide/${g.slug}`;

  const kicker = isGroup
    ? ts('pkgGrpKicker')
    : `${ts('pkgKicker')}${durationDays > 0 ? ` · ${ts('shapeDaysCount', { count: durationDays })}` : ''}`;

  // Rail "then …" preview line for the next-departure card.
  const thenLine = (() => {
    if (!dep || !dep.next) return '';
    const rest = dep.upcomingAfterNext;
    const shown = rest.slice(0, 3).map((r) => r.shortDate).join(' · ');
    if (rest.length === 0) return '';
    if (rest.length <= 3) return ts('pkgGrpThen', { dates: shown });
    return ts('pkgGrpThen', { dates: ts('pkgGrpAndMore', { dates: shown, count: rest.length - 3 }) });
  })();

  // ── JSON-LD ────────────────────────────────────────────────────────────────
  // The catch-all router renders private/group packages through this view (not
  // the legacy TourPageView), so the TouristTrip + BreadcrumbList structured
  // data must be emitted here. Pricing exposure (group-only, basePrice-gated)
  // is enforced inside the builder: private packages emit no offers; group
  // packages emit an AggregateOffer when a peak uplift exists, else an Offer.
  const tripSchema = buildTouristTripSchema(
    {
      title: tour.title,
      slug: tour.slug,
      type: tour.type,
      tourMode: tour.tourMode,
      summary: tour.summary,
      durationDays: tour.durationDays,
      durationLabel: tour.durationLabel,
      basePrice: isGroup ? groupBase ?? undefined : tour.basePrice ?? undefined,
      peakUpliftPct: tour.peakUpliftPct ?? undefined,
      maxGroup: tour.maxGroup ?? undefined,
      originRegion: tour.originRegion,
      heroImage: tour.heroImage,
      cities: tour.cities,
      offer: await buildProductOffer(fromAmount, tour.slug, locale, tour.priceUpdatedAt),
    },
    locale,
  );
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      ...(isGroup
        ? [{ name: ts('pkgGroupSubBreadcrumb'), path: '/small-group-travel-packages' }]
        : [
            { name: tNav('packages'), path: '/egypt-travel-packages' },
            ...(tour.theme?.name && tour.themeLanding?.slug
              ? [{ name: tour.theme.name, path: `/${tour.themeLanding.slug}` }]
              : []),
          ]),
      { name: tour.title, path: `/${tour.slug}` },
    ],
    locale,
  );

  const L = homeLocale(locale);
  // Hero facts (packages, 2026-11-15, same pattern as day tours): Type +
  // Duration (+ From-price and CTAs in DayHeroFacts). An authored
  // shapeOfDay.duration (e.g. "3 days / 2 nights — extendable") wins.
  const typeLabel = isGroup ? tp('typeSmallGroup') : tp('typePrivate');
  const daysNights = durationDays > 0 ? tp('daysNights', { days: durationDays, nights }) : '';
  const heroFacts: PanelFact[] = [
    { label: tp('type'), value: typeLabel },
    { label: tp('duration'), value: (!isGroup && shape?.duration) || daysNights },
  ];
  const mobileLine = [daysNights, typeLabel].filter(Boolean).join(locale === 'ja' ? '・' : ' · ');
  // The panel under the photo keeps everything the hero does not show,
  // including what the old "shape of the journey" card carried (authored
  // route and character, the hotel/river night split, single supplement),
  // so no detail is lost and nothing is shown twice.
  const panelFacts: PanelFact[] = [
    { label: tp('route'), value: shape?.where || routeRow },
    ...(isGroup
      ? [
          { label: ts('pkgGrpGroupLabel'), value: typeof tour.maxGroup === 'number' ? ts('pkgGrpMaxGroup', { n: tour.maxGroup }) : '' },
          { label: ts('pkgGrpGuideLabel'), value: ts('pkgGrpGuideValue') },
          { label: ts('pkgGrpDeparturesLabel'), value: dep && dep.count > 0 ? ts('pkgGrpPerYear', { count: dep.count }) : '' },
        ]
      : [
          { label: ts('shapeNights'), value: nightsSplit },
          { label: ts('shapeStyle'), value: shape?.character || '' },
        ]),
    { label: tp('cruise'), value: cruiseNights > 0 && !(!isGroup && nightsSplit) ? tp('cruiseNights', { nights: cruiseNights }) : '' },
    { label: ts('pkgSingleSupp'), value: suppValue ?? '' },
  ];
  const nextDeparture = isGroup && dep ? (
    dep.next ? (
      <div className="card rdep">
        <span className="ck">{ts('pkgGrpNextKicker')}</span>
        <div className="nd-date">{dep.next.dateRange}</div>
        {(dep.next.status || typeof dep.next.placesLeft === 'number') && (
          <div className="nd-status">
            {[dep.next.status ? STATUS_LABEL[dep.next.status] : null,
              typeof dep.next.placesLeft === 'number' ? ts('pkgGrpPlaces', { count: dep.next.placesLeft }) : null]
              .filter(Boolean).join(' · ')}
          </div>
        )}
        {thenLine && <div className="nd-next">{thenLine}</div>}
        <a className="nd-btn" href={reserveHref(dep.next.dateRange)} target="_blank" rel="noopener noreferrer">{ts('pkgGrpHoldDateCta')} →</a>
        <a className="nd-all" href="#departures">{ts('pkgGrpSeeAll', { count: dep.count })}</a>
      </div>
    ) : (
      <div className="card rdep">
        <span className="ck">{ts('pkgGrpNextSeasonKicker')}</span>
        <div className="nd-date">{ts('pkgGrpNextSeasonTitle')}</div>
        <div className="nd-next" style={{ borderTop: 0, paddingTop: 0 }}>{ts('pkgGrpNextSeasonBody')}</div>
        <ProductLeadButton
          location="product_panel"
          prefill={{ kind: 'trip', tourSlug: tour.slug, tourTitle: tour.title, durationDays: durationDays || null }}
          className="nd-btn"
        >
          {ts('pkgGrpEnquireDates')}
        </ProductLeadButton>
      </div>
    )
  ) : null;

  // Practical information, scheduled departures and the access note: after
  // the days in either layout.
  const afterDays = (
    <>
      {Array.isArray(tour.practicalInfo) && tour.practicalInfo.length > 0 && (
        <section className="practical" id="practical">
          <TourProse value={tour.practicalInfo} locale={locale} lead={false} />
        </section>
      )}

      {isGroup && dep && dep.rows.length > 0 && (
        <section className="departures" id="departures">
          <h2>{ts('pkgGrpDepTitle')}</h2>
          <p className="dep-sub">{ts('pkgGrpDepSub', { count: dep.count })}</p>
          <div className="dep-table">
            {dep.rows.map((r, i) => {
              const statusCls = r.status ? STATUS_CLASS[r.status] ?? 's-open' : '';
              const joinLabel = r.status === 'soldout'
                ? ts('pkgGrpWaitlist')
                : r.status === 'onrequest'
                  ? ts('pkgGrpEnquire')
                  : ts('pkgGrpHoldDate');
              return (
                <div className={r.isSoldOut ? 'dep-row is-out' : 'dep-row'} key={i}>
                  <div className="dp-date">{r.dateRange}</div>
                  <div className={`dp-status ${statusCls}`}>{r.status ? STATUS_LABEL[r.status] : ''}</div>
                  <div className="dp-places">{typeof r.placesLeft === 'number' ? ts('pkgGrpPlaces', { count: r.placesLeft }) : ''}</div>
                  <div className="dp-price">
                    {r.price != null ? <Price eur={r.price} /> : ts('priceOnInquiry')}
                    {r.price != null && <small>{ts('pkgGrpPerPerson')}</small>}
                  </div>
                  <a
                    className={r.isSoldOut ? 'dp-join is-disabled' : 'dp-join'}
                    href={r.isSoldOut ? undefined : reserveHref(r.dateRange)}
                    target={r.isSoldOut ? undefined : '_blank'}
                    rel="noopener noreferrer"
                  >
                    {joinLabel}
                  </a>
                </div>
              );
            })}
          </div>
          <p className="dep-note">{ts('pkgGrpDepNote')}</p>
        </section>
      )}

      {tour.accessNote && (
        <>
          <h2>{tour.accessNoteTitle ?? ts('accessTitle')}</h2>
          <p>{tour.accessNote}</p>
        </>
      )}

    </>
  );

  return (
    <div className="tour-doc lvl-single">
      <JsonLd data={[tripSchema, breadcrumbSchema]} />
      <ProductViewTracker slug={tour.slug} category="multi_day" priceEur={typeof fromAmount === 'number' ? fromAmount : null} locale={locale} />
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            {isGroup ? (
              <>
                <li><Link href="/small-group-travel-packages">{ts('pkgGroupSubBreadcrumb')}</Link></li>
                <li>{ts('pkgGroupRegionLabel', { region: tour.originRegion ?? '' })}</li>
              </>
            ) : (
              <>
                <li>{tNav('packages')}</li>
                {tour.theme?.name && (
                  <li>{tour.themeLanding?.slug ? <Link href={`/${tour.themeLanding.slug}`}>{tour.theme.name}</Link> : tour.theme.name}</li>
                )}
              </>
            )}
            <li>{tour.title}</li>
          </ol>
        </nav>

        <div className="pdp">
          <header className="head pdp-head">
            <span className="t2e-kicker">{kicker}</span>
            <h1>{tour.title}</h1>
            {tour.summary && <p className="dek">{tour.summary}</p>}
            <DayHeroFacts
              locale={locale}
              slug={tour.slug}
              title={tour.title}
              waHref={waHref}
              facts={heroFacts}
              fromEur={typeof fromAmount === 'number' && fromAmount > 0 ? fromAmount : null}
              guidePriced={tour.guidePriced}
              mobileLine={mobileLine}
              variant="multi"
              durationDays={durationDays || null}
              fromNote={tp('fromGroupNote')}
            />
          </header>

          <figure className="feature pdp-hero">
            <JourneyImage image={tour.heroImage} alt="" widthHint={2400} priority direct />
          </figure>

          <div className="pdp-side">
            <MultiDayPanel
              locale={locale}
              slug={tour.slug}
              title={tour.title}
              waHref={waHref}
              facts={panelFacts}
              fromEur={typeof fromAmount === 'number' && fromAmount > 0 ? fromAmount : null}
              durationDays={durationDays || null}
              tiers={tiers}
              extra={nextDeparture}
              guidePriced={tour.guidePriced}
              enSlug={enSlugOf((tour as { allSlugs?: Array<{ _key: string; current?: string }> }).allSlugs, tour.slug) ?? undefined}
              heroed
              notes={tour.priceNote ? <p className="price-note">{tour.priceNote}</p> : null}
            />
            <YourRoute locale={locale} legs={approvedRoute} />
            <MakeItYourOwn
              locale={locale}
              options={tour.approvedOptions ?? []}
              kind="multi"
              slug={tour.slug}
              title={tour.title}
              durationDays={durationDays || null}
              fromEur={null}
            />
            <CompactStickyCard
              locale={locale}
              kind="multi"
              slug={tour.slug}
              title={tour.title}
              waHref={waHref}
              fromEur={typeof fromAmount === 'number' && fromAmount > 0 ? fromAmount : null}
              durationDays={durationDays || null}
              ticks={trustSignals}
              accred={trustLine}
            />
          </div>

          <div className="pdp-main">
            {!itinFormat && (
              <ProductFactsBlock locale={locale} included={included} excluded={notIncluded} />
            )}

            <article className="body">
              {itinFormat ? (
                <ItineraryFormat
                  locale={locale}
                  slug={tour.slug}
                  data={itinFormat}
                  essay={tour.body}
                  included={included}
                  excluded={notIncludedRows}
                  options={tour.approvedOptions ?? []}
                  beforeMakeItYours={afterDays}
                  cta={
              <MidCta
                locale={locale}
                kind="multi"
                slug={tour.slug}
                title={tour.title}
                waHref={waHref}
                durationDays={durationDays || null}
                fromEur={null}
              />
                  }
                />
              ) : (
                <>
                  <TourProse value={tour.body} locale={locale} />

              {days.length > 0 && (
                <>
                  <h2>{ts('pkgDaysTitle')}</h2>
                  <ol className="days">
                    {days.map((d, i) => (
                      <li className="day" key={i}>
                        <span className="marker">
                          <small>{ts('pkgDayMarker')}</small>
                          <b>{d.dayNumber ?? i + 1}</b>
                        </span>
                        {d.title && <h3>{d.title}</h3>}
                        {d.accommodation && <div className="stay">{ts('pkgStayOvernight')} {d.accommodation}</div>}
                        {(Array.isArray(d.morning) && d.morning.length > 0) && <PortableText value={d.morning as never} />}
                        {(Array.isArray(d.afternoon) && d.afternoon.length > 0) && <PortableText value={d.afternoon as never} />}
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {afterDays}

              {tour.audienceNote && (
                <div className="audience">
                  <span className="t2e-kicker">{tour.audienceNoteTitle ?? ts('audienceTitle')}</span>
                  <p>{tour.audienceNote}</p>
                </div>
              )}

              {tour.conciergeNote && (
                <div className="note">
                  <span className="t2e-kicker">{ts('conciergeNoteLabel')}</span>
                  <p>{tour.conciergeNote}</p>
                </div>
              )}

              <MidCta
                locale={locale}
                kind="multi"
                slug={tour.slug}
                title={tour.title}
                waHref={waHref}
                durationDays={durationDays || null}
                fromEur={null}
              />
                </>
              )}
            </article>
          </div>
        </div>
      </div>

      <EndBlock
        locale={locale}
        kind="multi"
        slug={tour.slug}
        title={tour.title}
        waHref={waHref}
        durationDays={durationDays || null}
        fromEur={null}
      />

      {(moreJourneys.length > 0 || guideItems.length > 0 || journal.length > 0) && (
        <section className="related">
          <div className="t2e-wrap">
            <div className="related-grid">
              {moreJourneys.length > 0 && (
                <div className="related-col">
                  <h3>{ts('pkgMoreJourneys')}</h3>
                  {moreJourneys.slice(0, 3).map((r) => (
                    <Link key={r._id} className="ritem" href={`/${r.slug}`}>
                      {r.durationLabel && <span className="rk">{r.durationLabel}</span>}
                      <span className="rt">{r.title}</span>
                      {typeof r.priceFrom === 'number' && r.priceFrom > 0 && (
                        <span className="rp">{HOME_COPY[L].from(<Price eur={r.priceFrom} />)}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
              {guideItems.length > 0 && (
                <div className="related-col">
                  <h3>{ts('readInGuide')}</h3>
                  {guideItems.slice(0, 3).map((g) => (
                    <Link key={g._id} className="ritem" href={guideHref(g)}><span className="rt">{g.title}</span></Link>
                  ))}
                </div>
              )}
              {journal.length > 0 && (
                <div className="related-col">
                  <h3>{ts('fromJournal')}</h3>
                  {journal.slice(0, 3).map((j) => (
                    <Link key={j._id} className="ritem" href={`/blog/${j.slug}`}><span className="rt">{j.title}</span></Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <LandingFaq items={withStandardFaq(tour.faq, locale)} locale={locale} />

      <section className="t2e-footband">
        <div className="t2e-wrap t2e-footband-grid">
          <div>
            <h4>{tSub('footInSeasonLabel')}</h4>
            <div className="t2e-season"><p>{tSub('footInSeasonBody')}</p></div>
          </div>
          <div>
            <h4>{ts('pkgAround')}</h4>
            <ul>
              {tour.themeLanding?.slug && (
                <li><Link href={`/${tour.themeLanding.slug}`}>{ts('pkgAroundTheme', { theme: tour.theme?.name ?? '' })}<small>{ts('pkgAroundThemeSub')}</small></Link></li>
              )}
              <li><Link href="/nile-cruises">{ts('pkgAroundCruises')}<small>{ts('pkgAroundCruisesSub')}</small></Link></li>
              <li><Link href="/guide">{ts('pkgAroundGuide')}<small>{ts('pkgAroundGuideSub')}</small></Link></li>
            </ul>
          </div>
        </div>
      </section>

      <StickyBarProduct
        product={{
          slug: tour.slug,
          title: tour.title,
          type: tour.type ?? 'package',
          durationDays: tour.durationDays ?? null,
          priceFromEur: typeof tour.priceFrom === 'number' ? tour.priceFrom : null,
        }}
      />
      <LazyFloatingConcierge tourSlug={tour.slug} />
    </div>
  );
}
