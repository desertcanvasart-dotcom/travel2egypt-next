import { getTranslations } from 'next-intl/server';
import { StickyBarProduct } from '@/components/leads/LeadProvider';
import { getAccreditations, iataItem, licenceShort } from '@/lib/accreditations';

import { Link } from '@/i18n/navigation';
import { client } from '@/sanity/lib/client';
import { otherTrackLandingSlugQuery } from '@/sanity/lib/queries';
import type { Locale } from '@/i18n/routing';

import { Price } from '../Price';
import { JsonLd } from '../JsonLd';
import { LandingFaq, type LandingFaqItem } from './LandingFaq';
import { withStandardFaq } from '@/lib/standardFaq';
import { buildTouristTripSchema, buildBreadcrumbList } from '@/lib/structured-data';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { LazyFloatingConcierge } from '../LazyFloatingConcierge';
import { DayTourPanel, DayHeroFacts, ProductFactsBlock, MidCta, EndBlock, type PanelFact } from '../product/ProductPanels';
import { MakeItYourOwn, CompactStickyCard, YourDayAtAGlance } from '../product/RightColumn';
import { DayTourFormat, dayTourFormatReady, glanceItems, type DayTourFormatData } from '../product/DayTourFormat';
import { ProductViewTracker } from '../product/ProductActions';
import { HOME_COPY, homeLocale } from '../home-sales/copy';
import { buildProductOffer } from '@/lib/productOffer';
import '@/styles/tour-system.css';

import { WHATSAPP_LINK as WHATSAPP, waTourTitle } from '@/lib/concierge/constants';

interface CityRef { _id: string; name: string; slug: string }

export interface SingleTour {
  _id: string;
  type?: string;
  tourMode?: string;
  title: string;
  slug: string;
  summary?: string;
  durationDays?: number;
  durationHours?: number;
  durationLabel?: string;
  // Pricing/audience fields — fetched via tourCardProjection. Day tours
  // carry no basePrice today, so the builder emits no offers; kept so a
  // future group-day-tour price would surface an Offer per decision 1.
  basePrice?: number | null;
  peakUpliftPct?: number | null;
  maxGroup?: number | null;
  originRegion?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: CityRef[];
  body?: unknown;
  groupSize?: string;
  effortLevel?: string;
  departsFrom?: string;
  priceFrom?: number;
  timeline?: Array<{ time?: string; description?: string }> | null;
  conciergeNote?: string;
  faq?: LandingFaqItem[];
  includedItems?: string[] | null;
  notIncludedItems?: string[] | null;
  accessNoteTitle?: string;
  accessNote?: string;
  audienceNoteTitle?: string;
  audienceNote?: string;
  shapeOfDay?: { where?: string; duration?: string; character?: string } | null;
  priceTiers?: Array<{ name?: string; sub?: string; price?: number; unit?: string }> | null;
  priceNote?: string;
  /** ES/JA: priceFrom includes the guide-language supplement. */
  guidePriced?: boolean | null;
  /** Owner, 2026-11-18: transfers and private car (and guide) days are priced per car. */
  priceBasis?: 'perPerson' | 'perCar' | null;
  trustSignals?: string[] | null;
  accreditations?: string;
  relatedTours?: Array<{ _id: string; title: string; slug: string; durationLabel?: string; cities?: CityRef[]; priceFrom?: number | null }> | null;
  approvedInclusions?: string[] | null;
  approvedExclusions?: string[] | null;
  approvedExclusionRows?: Array<{ _key?: string; text: string; seeSection?: string | null }> | null;
  /** Day-tour format: intro + timeline, only when all approved in this language. */
  dayTourFormat?: DayTourFormatData | null;
  /** The cities' EN slugs (owner-rule panel rows key on Cairo / Giza). */
  citySlugsEn?: Array<string | null> | null;
  /** Owner-approved "Make it your own" options (this language). */
  approvedOptions?: string[] | null;
  priceUpdatedAt?: string;
  relatedGuides?: Array<{ _id: string; _type?: string; title?: string; slug?: string; parentCity?: { slug?: string } | null }> | null;
  relatedGuideArticles?: Array<{ _id: string; _type?: string; title?: string; slug?: string; parentCity?: { slug?: string } | null }> | null;
  journalRefs?: Array<{ _id: string; _type?: string; title?: string; slug?: string; parentCity?: { slug?: string } | null }> | null;
}

export async function SingleTourView({ tour, locale }: { tour: SingleTour; locale: Locale }) {
  // Trust line: approved Short licence string + IATA item (fix round 2).
  const accreditations = await getAccreditations();
  const trustCreds = [licenceShort(accreditations, locale), iataItem(accreditations)].filter(Boolean).join(' · ');
  const t = await getTranslations('tour');
  const tSub = await getTranslations('subcategory');
  const tNav = await getTranslations('nav');
  const ts = await getTranslations('tourSystem');
  const tp = await getTranslations('productPanel');
  const waHref = `${WHATSAPP}?text=${encodeURIComponent(ts('waTourText', { title: waTourTitle(tour.title) }))}`;


  const isGroup = tour.tourMode === 'group';
  const trackLabel = isGroup ? tSub('trackGroup') : tSub('trackPrivate');
  const trackKicker = isGroup ? ts('kickerGroup') : ts('kickerPrivate');
  const city = tour.cities?.[0];
  const cityName = city?.name ?? '';
  const dayToursPath = isGroup ? '/group-day-tours' : '/private-day-tours';
  const sameKey = isGroup ? 'group-day-tour' : 'private-day-tour';
  const otherKey = isGroup ? 'private-day-tour' : 'group-day-tour';

  const [sameLanding, otherLanding] = city?._id
    ? await Promise.all([
        client.fetch<{ slug?: string } | null>(otherTrackLandingSlugQuery(locale), { otherKey: sameKey, cityId: city._id }),
        client.fetch<{ slug?: string } | null>(otherTrackLandingSlugQuery(locale), { otherKey, cityId: city._id }),
      ])
    : [null, null];

  // Meta row "from" price (EUR, per person): explicit → first tier. Numeric → formatPrice.
  const tier0 = tour.priceTiers?.[0];
  const fromAmount = typeof tour.priceFrom === 'number' ? tour.priceFrom : tier0?.price;
  const fromEl = typeof fromAmount === 'number' ? <Price eur={fromAmount} unit="pp" /> : null;


  const timeline = (tour.timeline ?? []).filter((s) => s.time || s.description);
  // Approved extracted items (review-gated); a product with none falls back to
  // the lists authored before the template (one quad-bike tour has them).
  const approvedIn = tour.approvedInclusions ?? [];
  const approvedOut = tour.approvedExclusions ?? [];
  const included = approvedIn.length || approvedOut.length ? approvedIn : tour.includedItems ?? [];
  const notIncluded = approvedIn.length || approvedOut.length ? approvedOut : tour.notIncludedItems ?? [];

  const tiers = (tour.priceTiers ?? []).filter((p) => p.name || p.price);
  // Trust signals are GLOBAL — identical on every tour, from i18n, not per-tour
  // data — except the format tick, which follows tourMode (a page never calls
  // itself both private and small group). Shown compact in the sticky card.
  const trustSignals = [
    ts('trustSignal1'),
    isGroup ? ts('trustSignal2Group') : ts('trustSignal2Private'),
    ts('trustSignal3'),
    ts('trustSignal4'),
  ];
  const trustLine = [trustCreds, ts('trustAccred')].filter(Boolean).join(' — ');

  const guideItems = [...(tour.relatedGuides ?? []), ...(tour.relatedGuideArticles ?? [])].filter((g) => g.title);
  const journal = (tour.journalRefs ?? []).filter((j) => j.title);
  const moreDays = (tour.relatedTours ?? []).filter((r) => r.slug);

  const guideHref = (g: { _type?: string; slug?: string; parentCity?: { slug?: string } | null }) =>
    g._type === 'guideArticle' && g.parentCity?.slug ? `/guide/${g.parentCity.slug}/${g.slug}` : `/guide/${g.slug}`;

  // ── JSON-LD ────────────────────────────────────────────────────────────────
  // The catch-all router renders day tours through this view (not the legacy
  // TourPageView), so the TouristTrip + BreadcrumbList structured data must be
  // emitted here. Pricing exposure (group-only, basePrice-gated) is enforced
  // inside the builder: private day tours emit no offers.
  const tripSchema = buildTouristTripSchema(
    {
      title: tour.title,
      slug: tour.slug,
      type: tour.type,
      tourMode: tour.tourMode,
      summary: tour.summary,
      durationDays: tour.durationDays,
      durationHours: tour.durationHours,
      durationLabel: tour.durationLabel,
      basePrice: tour.basePrice ?? undefined,
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
      { name: tSub('breadcrumbDayTours'), path: dayToursPath },
      ...(cityName && sameLanding?.slug
        ? [{ name: cityName, path: `/${sameLanding.slug}` }]
        : []),
      { name: tour.title, path: `/${tour.slug}` },
    ],
    locale,
  );

  const L = homeLocale(locale);
  // Half hours read as ½ ("about 8½ hours"), as the owner's locked panels write them.
  const hoursText =
    typeof tour.durationHours === 'number' && tour.durationHours > 0
      ? tour.durationHours % 1 === 0.5
        ? tp('aboutHoursHalf', { hours: `${Math.floor(tour.durationHours)}½` })
        : tp('aboutHours', { hours: tour.durationHours })
      : '';
  // The band ('Full day', 'Jornada larga', '延長') is the label segment without a number.
  const durationBand = (tour.durationLabel ?? '').split(/[·・]/).map((x) => x.trim()).find((x) => x && !/\d/.test(x)) ?? '';
  const typeLabel = isGroup ? tp('typeSmallGroup') : tp('typePrivate');
  // Hero facts (tour-page Phase 1): Type + Duration (+ From-price and CTAs in
  // DayHeroFacts). durationLabel is e.g. 'Full day · ~9 hrs': keep its band
  // ('Full day') and state the hours once, in the panel's own wording.
  const heroFacts: PanelFact[] = [
    { label: tp('type'), value: typeLabel },
    { label: tp('duration'), value: [hoursText ? durationBand : tour.durationLabel, hoursText].filter(Boolean).join(locale === 'ja' ? '・' : ' · ') },
  ];
  const sep = locale === 'ja' ? '・' : ' · ';
  const mobileLine = [durationBand || tour.durationLabel || '', typeLabel].filter(Boolean).join(sep);
  const fromEur = typeof fromAmount === 'number' && fromAmount > 0 ? fromAmount : null;

  // Day-tour format (2026-11-16). Owner-rule rows (children 50% off, guide
  // language = page language, the Cairo/Giza pickup zones) show on every Cairo
  // and Giza day tour. Elsewhere (owner, 18 Nov: standing rules 8–9) they show
  // once the tour has an approved day-tour intro, with the Pickup row taken
  // whole from intro.pickupLine. Pickup time, Back and Lunch come only from an
  // approved day-tour intro.
  const dayFormat = dayTourFormatReady(tour.dayTourFormat) ? tour.dayTourFormat : null;
  const intro = dayFormat?.intro;
  const cairoGiza = (tour.citySlugsEn ?? []).some((c) => c === 'cairo' || c === 'giza');
  const pickupText = (() => {
    if (!cairoGiza) return '';
    const zone = tp('pickupZoneIncluded');
    const first = intro?.pickupTime
      ? locale === 'ja'
        ? `${intro.pickupTime}に${zone}`
        : `${intro.pickupTime} ${zone}`
      : locale === 'ja'
        ? zone
        : zone.charAt(0).toUpperCase() + zone.slice(1);
    return `${first}${locale === 'ja' ? '。' : '. '}${tp('pickupZoneExtra')}`;
  })();
  // Back (canon II.7): the time comes from the returnTime field; returnNote
  // adds the qualifier. Legacy rows without returnTime keep their full line.
  const backText = intro?.returnTime
    ? `${tp('backAround', { time: intro.returnTime })}${intro.returnNote ? (locale === 'ja' ? intro.returnNote : `, ${intro.returnNote}`) : ''}`
    : intro?.returnNote ?? '';
  // A day tour whose approved intro carries its own panel rows shows them as written, in place
  // of the rule rows: per-car products (owner, 2026-11-18: prices by area, vehicle, arrival,
  // departure, add-ons) and tours whose facts differ from the rules (an English-only specialist
  // guide on every page, binoculars, a choice of waters).
  const perCar = tour.priceBasis === 'perCar';
  const ownRows = intro?.panelRows?.length ? intro.panelRows : null;
  const ruleRows: PanelFact[] = ownRows
    ? ownRows.map((r) => ({ label: r.label ?? '', value: r.text ?? '' }))
    : cairoGiza
    ? [
        { label: tp('children'), value: tp('childrenValue') },
        { label: tp('pickup'), value: pickupText },
        { label: tp('back'), value: backText },
        { label: tp('lunch'), value: intro?.lunch?.text ?? '' },
        { label: tp('guideSpeaks'), value: tp('guideLanguage') },
      ]
    : intro
      ? [
          { label: tp('children'), value: tp('childrenValue') },
          // Plane day trips say whether the flights are in the price (empty rows are not shown).
          { label: tp('flights'), value: intro.flightsLine ?? '' },
          { label: tp('pickup'), value: intro.pickupLine ?? '' },
          { label: tp('back'), value: backText },
          { label: tp('lunch'), value: intro.lunch?.text ?? '' },
          { label: tp('guideSpeaks'), value: tp('guideLanguage') },
        ]
      : [
          // No approved intro: Back and Lunch have nothing to show yet (kept for the layout).
          { label: tp('back'), value: backText },
          { label: tp('lunch'), value: '' },
        ];
  // The header keeps Type, Duration and From only, as on the packages
  // (owner, 2026-11-17); the practical rows sit in the panel under the photo.
  const panelFacts: PanelFact[] = [{ label: tp('startsFrom'), value: tour.departsFrom ?? '' }, ...ruleRows];
  const exclusionRows = (approvedIn.length || approvedOut.length ? tour.approvedExclusionRows : null) ?? notIncluded.map((text) => ({ text }));

  const accessBlock = tour.accessNote ? (
    <>
      <h2>{tour.accessNoteTitle ?? ts('accessTitle')}</h2>
      <p>{tour.accessNote}</p>
    </>
  ) : null;

  return (
    <div className="tour-doc lvl-single">
      <JsonLd data={[tripSchema, breadcrumbSchema]} />
      <ProductViewTracker slug={tour.slug} category="day_tour" priceEur={fromEur} locale={locale} />
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li><Link href={dayToursPath}>{tSub('breadcrumbDayTours')}</Link></li>
            <li>{trackLabel}</li>
            {cityName && (
              <li>{sameLanding?.slug ? <Link href={`/${sameLanding.slug}`}>{cityName}</Link> : cityName}</li>
            )}
            <li>{tour.title}</li>
          </ol>
        </nav>

        <div className="pdp">
          <header className="head pdp-head">
            <span className="t2e-kicker">{trackKicker}{cityName ? ` · ${cityName}` : ''}</span>
            <h1>{tour.title}</h1>
            {tour.summary && <p className="dek">{tour.summary}</p>}
            <DayHeroFacts
              locale={locale}
              slug={tour.slug}
              title={tour.title}
              waHref={waHref}
              facts={heroFacts}
              fromEur={fromEur}
              guidePriced={tour.guidePriced}
              mobileLine={mobileLine}
              fromNote={perCar ? tp('fromCarNote') : tp('fromGroupNote')}
              basis={perCar ? tp('basisCar') : undefined}
            />
          </header>

          <figure className="feature pdp-hero">
            <JourneyImage image={tour.heroImage} alt="" widthHint={2400} priority direct />
          </figure>

          <div className="pdp-side">
            <DayTourPanel locale={locale} facts={panelFacts} tiers={tiers} />
            {dayFormat && <YourDayAtAGlance locale={locale} items={glanceItems(dayFormat)} />}
            <MakeItYourOwn
              locale={locale}
              options={tour.approvedOptions ?? []}
              kind="day"
              slug={tour.slug}
              title={tour.title}
              durationDays={null}
              fromEur={fromEur}
            />
            <CompactStickyCard
              locale={locale}
              kind="day"
              slug={tour.slug}
              title={tour.title}
              waHref={waHref}
              fromEur={fromEur}
              durationDays={null}
              ticks={trustSignals}
              accred={trustLine}
              basis={perCar ? tp('basisCar') : undefined}
            />
          </div>

          <div className="pdp-main">
            {!dayFormat && <ProductFactsBlock locale={locale} included={included} excluded={notIncluded} />}

            <article className="body">
              {dayFormat ? (
                <DayTourFormat
                  locale={locale}
                  slug={tour.slug}
                  data={dayFormat}
                  essay={tour.body}
                  included={included}
                  excluded={exclusionRows}
                  options={tour.approvedOptions ?? []}
                  beforeMakeItYours={accessBlock}
                  cta={
              <MidCta
                locale={locale}
                kind="day"
                slug={tour.slug}
                title={tour.title}
                waHref={waHref}
                durationDays={null}
                fromEur={fromEur}
              />
                  }
                />
              ) : (
                <>
                  <TourProse value={tour.body} locale={locale} />

              {timeline.length > 0 && (
                <>
                  <h2>{ts('timelineTitle')}</h2>
                  <ul className="timeline">
                    {timeline.map((s, i) => (
                      <li key={i}>
                        <span className="t">{s.time}</span>
                        <span className="d">{s.description}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {accessBlock}

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
                kind="day"
                slug={tour.slug}
                title={tour.title}
                waHref={waHref}
                durationDays={null}
                fromEur={fromEur}
              />
                </>
              )}
            </article>

          </div>
        </div>
      </div>

      <EndBlock
        locale={locale}
        kind="day"
        slug={tour.slug}
        title={tour.title}
        waHref={waHref}
        durationDays={null}
        fromEur={fromEur}
      />

      {(moreDays.length > 0 || guideItems.length > 0 || journal.length > 0) && (
        <section className="related">
          <div className="t2e-wrap">
            <div className="related-grid">
              {moreDays.length > 0 && (
                <div className="related-col">
                  <h3>{ts('moreDaysFrom', { city: cityName })}</h3>
                  {moreDays.slice(0, 3).map((r) => (
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
                    <Link key={g._id} className="ritem" href={guideHref(g)}>
                      <span className="rt">{g.title}</span>
                    </Link>
                  ))}
                </div>
              )}
              {journal.length > 0 && (
                <div className="related-col">
                  <h3>{ts('fromJournal')}</h3>
                  {journal.slice(0, 3).map((j) => (
                    <Link key={j._id} className="ritem" href={j._type === 'guideArticle' ? guideHref(j) : `/blog/${j.slug}`}>
                      <span className="rt">{j.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <LandingFaq items={withStandardFaq(tour.faq, locale, tour._id)} locale={locale} />

      <section className="t2e-footband">
        <div className="t2e-wrap t2e-footband-grid">
          <div>
            <h4>{tSub('footInSeasonLabel')}</h4>
            <div className="t2e-season">
              <p>{tSub('footInSeasonBody')}</p>
            </div>
          </div>
          <div>
            <h4>{tSub('aroundCity', { city: cityName })}</h4>
            <ul>
              <li><Link href={city?.slug ? `/guide/${city.slug}` : '/guide'}>{tSub('crosslinkCityGuide', { city: cityName })}<small>{tSub('crosslinkGuideKicker')}</small></Link></li>
              <li><Link href="/hotels">{tSub('crosslinkHotels', { city: cityName })}<small>{tSub('crosslinkHotelsKicker')}</small></Link></li>
              {otherLanding?.slug && (
                <li>
                  <Link href={`/${otherLanding.slug}`}>
                    {isGroup ? tSub('crosslinkOtherPrivate', { city: cityName }) : tSub('crosslinkOtherGroup', { city: cityName })}
                    <small>{tSub('crosslinkOtherKicker')}</small>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <StickyBarProduct
        product={{
          slug: tour.slug,
          title: tour.title,
          type: tour.type ?? 'dayTour',
          durationDays: tour.durationDays ?? null,
          priceFromEur: typeof tour.priceFrom === 'number' ? tour.priceFrom : null,
        }}
      />
      <LazyFloatingConcierge tourSlug={tour.slug} />
    </div>
  );
}
