import { getTranslations } from 'next-intl/server';
import { StickyBarProduct } from '@/components/leads/LeadProvider';
import { getAccreditations, iataItem, licenceShort } from '@/lib/accreditations';

import { Link } from '@/i18n/navigation';
import { client } from '@/sanity/lib/client';
import { otherTrackLandingSlugQuery } from '@/sanity/lib/queries';
import type { Locale } from '@/i18n/routing';

import { Price } from '../Price';
import { JsonLd } from '../JsonLd';
import { buildTouristTripSchema, buildBreadcrumbList } from '@/lib/structured-data';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { LazyFloatingConcierge } from '../LazyFloatingConcierge';
import { DayTourPanel, ProductFactsBlock, MidCta, EndBlock, type PanelFact } from '../product/ProductPanels';
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
  includedItems?: string[] | null;
  notIncludedItems?: string[] | null;
  accessNoteTitle?: string;
  accessNote?: string;
  audienceNoteTitle?: string;
  audienceNote?: string;
  shapeOfDay?: { where?: string; duration?: string; character?: string } | null;
  priceTiers?: Array<{ name?: string; sub?: string; price?: number; unit?: string }> | null;
  priceNote?: string;
  trustSignals?: string[] | null;
  accreditations?: string;
  relatedTours?: Array<{ _id: string; title: string; slug: string; durationLabel?: string; cities?: CityRef[]; priceFrom?: number | null }> | null;
  approvedInclusions?: string[] | null;
  approvedExclusions?: string[] | null;
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

  // Shape-of-the-day card ALWAYS renders. When a field isn't explicitly authored,
  // derive it from existing tour data so the rail never shows a blank/broken card.
  const shape = tour.shapeOfDay;
  const derivedWhere =
    shape?.where || (tour.cities ?? []).map((c) => c.name).filter(Boolean).join(' · ') || cityName;
  const derivedDuration =
    shape?.duration ||
    tour.durationLabel ||
    (tour.durationDays && tour.durationDays > 1 ? ts('shapeDaysCount', { count: tour.durationDays }) : '');
  const derivedCharacter =
    shape?.character ||
    [isGroup ? tSub('trackGroup') : tSub('trackPrivate'), tour.groupSize].filter(Boolean).join(' · ');
  const shapeRows = [
    { label: ts('shapeWhere'), value: derivedWhere },
    { label: ts('shapeDuration'), value: derivedDuration },
    { label: ts('shapeCharacter'), value: derivedCharacter },
  ].filter((r) => r.value);

  const tiers = (tour.priceTiers ?? []).filter((p) => p.name || p.price);
  // Trust signals are GLOBAL — identical on every tour, from i18n, not per-tour data.
  const trustSignals = [ts('trustSignal1'), ts('trustSignal2'), ts('trustSignal3'), ts('trustSignal4')];

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
  const hoursText = typeof tour.durationHours === 'number' && tour.durationHours > 0 ? tp('aboutHours', { hours: tour.durationHours }) : '';
  // The band ('Full day', 'Jornada larga', '延長') is the label segment without a number.
  const durationBand = (tour.durationLabel ?? '').split(/[·・]/).map((x) => x.trim()).find((x) => x && !/\d/.test(x)) ?? '';
  const panelFacts: PanelFact[] = [
    { label: tp('type'), value: isGroup ? tp('typeSmallGroup') : tp('typePrivate') },
    // durationLabel is e.g. 'Full day · ~9 hrs': keep its band ('Full day') and
    // state the hours once, in the panel's own wording.
    { label: tp('duration'), value: [hoursText ? durationBand : tour.durationLabel, hoursText].filter(Boolean).join(locale === 'ja' ? '・' : ' · ') },
    { label: tp('startsFrom'), value: tour.departsFrom ?? '' },
  ];
  const fromEur = typeof fromAmount === 'number' && fromAmount > 0 ? fromAmount : null;

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

        <figure className="feature pdp-hero">
          <JourneyImage image={tour.heroImage} alt="" sizes="(max-width: 1024px) 100vw, 1168px" widthHint={2400} priority direct />
        </figure>

        <div className="pdp">
          <header className="head pdp-head">
            <span className="t2e-kicker">{trackKicker}{cityName ? ` · ${cityName}` : ''}</span>
            <h1>{tour.title}</h1>
            {tour.summary && <p className="dek">{tour.summary}</p>}
          </header>

          <div className="pdp-side">
            <DayTourPanel
              locale={locale}
              slug={tour.slug}
              title={tour.title}
              waHref={waHref}
              facts={panelFacts}
              fromEur={fromEur}
              tiers={tiers}
            />
          </div>

          <div className="pdp-main">
            <ProductFactsBlock locale={locale} included={included} excluded={notIncluded} />

            <article className="body">
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

              {tour.accessNote && (
                <>
                  <h2>{tour.accessNoteTitle ?? ts('accessTitle')}</h2>
                  <p>{tour.accessNote}</p>
                </>
              )}

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
            </article>

            <div className="pdp-details">
              {shapeRows.length > 0 && (
                <div className="card">
                  <span className="ck">{ts('shapeTitle')}</span>
                  <ul className="shape">
                    {shapeRows.map((r, i) => (
                      <li key={i}><small>{r.label}</small><span>{r.value}</span></li>
                    ))}
                  </ul>
                  {tour.priceNote && <p className="price-note">{tour.priceNote}</p>}
                </div>
              )}
              <div className="card">
                <span className="ck">{ts('whyBook')}</span>
                <ul className="trust">{trustSignals.map((s, i) => <li key={i}>{s}</li>)}</ul>
                <div className="accred">{[trustCreds, ts('trustAccred')].filter(Boolean).join(' — ')}</div>
              </div>
            </div>
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
