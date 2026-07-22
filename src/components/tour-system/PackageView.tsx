import { getTranslations } from 'next-intl/server';
import { PortableText } from '@portabletext/react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Price } from '../Price';
import { CurrencyNote } from '../CurrencyNote';
import { JsonLd } from '../JsonLd';
import { buildTouristTripSchema, buildBreadcrumbList } from '@/lib/structured-data';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { ConciergeOpenButton } from './ConciergeOpenButton';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { FloatingConcierge } from '../FloatingConcierge';
import { buildDepartures, type RawDeparture } from './departures';

const WHATSAPP = 'https://wa.me/201158011600';

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
  singleSupplement?: number | null;
  basePrice?: number | null;
  peakUpliftPct?: number | null;
  maxGroup?: number | null;
  departures?: RawDeparture[] | null;
  originRegion?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: CityRef[];
  body?: unknown;
  days?: PackageDay[] | null;
  conciergeNote?: string;
  includedItems?: string[] | null;
  notIncludedItems?: string[] | null;
  accessNoteTitle?: string;
  accessNote?: string;
  audienceNoteTitle?: string;
  audienceNote?: string;
  shapeOfDay?: { where?: string; duration?: string; character?: string } | null;
  theme?: { name?: string; slug?: string } | null;
  themeLanding?: { slug?: string } | null;
  relatedTours?: Array<{ _id: string; title: string; slug: string; durationLabel?: string }> | null;
  relatedGuides?: Array<{ _id: string; _type?: string; title?: string; slug?: string; parentCity?: { slug?: string } | null }> | null;
  relatedGuideArticles?: Array<{ _id: string; _type?: string; title?: string; slug?: string; parentCity?: { slug?: string } | null }> | null;
  journalRefs?: Array<{ _id: string; title?: string; slug?: string }> | null;
}

const CRUISE_RE = /cruise|nile|dahabiya|river|boat|felucca/i;

export async function PackageView({ tour, locale }: { tour: PackageDoc; locale: Locale }) {
  const tNav = await getTranslations('nav');
  const tSub = await getTranslations('subcategory');
  const ts = await getTranslations('tourSystem');

  // Concierge CTAs ride the site's one lever (CHAT_ENABLED): → /plan-your-tour
  // with this package's context when chat is live, → /contact fail-safe otherwise.
  const conciergeHref = isChatEnabled()
    ? `/plan-your-tour?tour=${encodeURIComponent(tour.slug)}`
    : '/contact';

  const cityNames = (tour.cities ?? []).map((c) => c.name).filter(Boolean);
  const route = cityNames.join(' · ');
  const days = (tour.days ?? []).filter((d) => d.title || d.morning || d.afternoon || d.dayNumber);
  const durationDays = tour.durationDays ?? days.length;
  const nights = durationDays > 0 ? durationDays - 1 : 0;
  const styleLabel = ts('pkgStylePrivate');
  const durationMeta = durationDays > 0 ? ts('pkgDurationMeta', { days: durationDays, nights }) : '';

  // ── Group package: the scheduled-departures apparatus. Built deterministically
  // at render/build time so the soonest FUTURE date is selected. ──
  const isGroup = tour.tourMode === 'group';
  const dep = isGroup
    ? buildDepartures(tour.departures, {
        durationDays,
        basePrice: tour.basePrice,
        peakUpliftPct: tour.peakUpliftPct,
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

  // Nights split (hotel vs river) — derived from days[].accommodation when present.
  const cruiseNights = days.filter((d) => d.accommodation && CRUISE_RE.test(d.accommodation)).length;
  const nightsSplit =
    cruiseNights > 0 && nights > 0
      ? ts('pkgNightsSplit', { hotel: Math.max(nights - cruiseNights, 0), river: cruiseNights })
      : '';

  // META ROW — omit any cell whose field is empty. Group packages swap Style →
  // Group (max N) + Departures (N a year); the From cell shows the base price,
  // or "On inquiry" while no base price is set.
  const fromAmount = isGroup
    ? typeof tour.basePrice === 'number'
      ? tour.basePrice
      : typeof tour.priceFrom === 'number'
        ? tour.priceFrom
        : undefined
    : typeof tour.priceFrom === 'number'
      ? tour.priceFrom
      : tour.priceTiers?.[0]?.price;
  const fromEl = typeof fromAmount === 'number' ? <Price eur={fromAmount} unit="pp" /> : null;
  const metaItems = (
    isGroup
      ? [
          { label: ts('metaDuration'), value: durationMeta },
          { label: ts('metaRoute'), value: route },
          { label: ts('pkgGrpGroupLabel'), value: typeof tour.maxGroup === 'number' ? ts('pkgGrpMaxGroup', { n: tour.maxGroup }) : '' },
          { label: ts('pkgGrpDeparturesLabel'), value: dep && dep.count > 0 ? ts('pkgGrpPerYear', { count: dep.count }) : '' },
          { label: ts('metaFrom'), value: fromEl ?? ts('priceOnInquiry') },
        ]
      : [
          { label: ts('metaDuration'), value: durationMeta },
          { label: ts('metaRoute'), value: route },
          { label: ts('metaStyle'), value: styleLabel },
          { label: ts('metaFrom'), value: fromEl ?? '' },
        ]
  ).filter((m) => m.value);

  // RAIL — shape of the journey (always renders; derived).
  const shape = tour.shapeOfDay;
  const shapeRows = (
    isGroup
      ? [
          { label: ts('shapeRoute'), value: shape?.where || route },
          { label: ts('shapeLength'), value: durationDays > 0 ? ts('shapeDaysCount', { count: durationDays }) : durationMeta },
          { label: ts('pkgGrpGroupLabel'), value: typeof tour.maxGroup === 'number' ? ts('pkgGrpMaxGroup', { n: tour.maxGroup }) : '' },
          { label: ts('pkgGrpGuideLabel'), value: ts('pkgGrpGuideValue') },
        ]
      : [
          { label: ts('shapeRoute'), value: shape?.where || route },
          { label: ts('shapeLength'), value: shape?.duration || durationMeta },
          { label: ts('shapeNights'), value: nightsSplit },
          { label: ts('shapeStyle'), value: shape?.character || styleLabel },
        ]
  ).filter((r) => r.value);

  const tiers = (tour.priceTiers ?? []).filter((p) => p.name || typeof p.price === 'number');
  const suppValue =
    typeof tour.singleSupplement === 'number'
      ? <>{ts('pkgSuppFrom')} <Price eur={tour.singleSupplement} /></>
      : null;
  const trustSignals = [ts('trustSignal1'), ts('trustSignal2'), ts('trustSignal3'), ts('trustSignal4')];

  const included = tour.includedItems ?? [];
  const notIncluded = tour.notIncludedItems ?? [];
  const hasIncl = included.length > 0 || notIncluded.length > 0;

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
      basePrice: tour.basePrice ?? undefined,
      peakUpliftPct: tour.peakUpliftPct ?? undefined,
      maxGroup: tour.maxGroup ?? undefined,
      originRegion: tour.originRegion,
      heroImage: tour.heroImage,
      cities: tour.cities,
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

  return (
    <div className="tour-doc lvl-single">
      <JsonLd data={[tripSchema, breadcrumbSchema]} />
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

        <header className="head">
          <span className="t2e-kicker">{kicker}</span>
          <h1>{tour.title}</h1>
          {tour.summary && <p className="dek">{tour.summary}</p>}
          {metaItems.length > 0 && (
            <div className="head-meta">
              {metaItems.map((m, i) => (
                <div className="m" key={i}><small>{m.label}</small><strong>{m.value}</strong></div>
              ))}
            </div>
          )}
        </header>
      </div>

      <div className="t2e-wrap">
        <figure className="feature">
          <JourneyImage image={tour.heroImage} alt="" sizes="(max-width:980px) 100vw, 1168px" widthHint={2336} ratio={2} priority />
        </figure>
      </div>

      <div className="t2e-wrap">
        <div className="layout">
          <article className="body">
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

            {hasIncl && (
              <>
                <h2>{ts('includedTitle')}</h2>
                <div className="incl">
                  <div>
                    <h4>{ts('includedLabel')}</h4>
                    <ul className="yes">{included.map((it, i) => <li key={i}>{it}</li>)}</ul>
                  </div>
                  <div>
                    <h4>{ts('notIncludedLabel')}</h4>
                    <ul className="no">{notIncluded.map((it, i) => <li key={i}>{it}</li>)}</ul>
                  </div>
                </div>
              </>
            )}

            {tour.accessNote && (
              <>
                <h2>{tour.accessNoteTitle ?? ts('accessTitle')}</h2>
                <p>{tour.accessNote}</p>
              </>
            )}

            {/* "Good for" — audience fit, demoted from a section heading to a
                compact kicker aside and placed just above the closing
                concierge note (orientation → tailoring → CTA). */}
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

            <p className="body-cta">
              <Link href={conciergeHref}>{ts('planThis')} →</Link>
            </p>
          </article>

          <aside className="rail">
            {/* Group packages LEAD with the next-departure card: the soonest
                future date, or a "next season" state if every date has sailed. */}
            {isGroup && dep && (
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
                  <ConciergeOpenButton className="nd-btn">{ts('pkgGrpEnquireDates')}</ConciergeOpenButton>
                </div>
              )
            )}

            {shapeRows.length > 0 && (
              <div className="card">
                <span className="ck">{ts('pkgShapeTitle')}</span>
                <ul className="shape">
                  {shapeRows.map((r, i) => (
                    <li key={i}><small>{r.label}</small><span>{r.value}</span></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card">
              <span className="ck">{tiers.length > 0 ? ts('pkgPriceTitle') : ts('priceTitle')}</span>
              <ul className="tiers">
                {tiers.length > 0 ? (
                  tiers.map((tier, i) => (
                    <li key={i}>
                      <span className="tn">{tier.name}{tier.sub && <small>{tier.sub}</small>}</span>
                      <span className="tp"><Price eur={tier.price} />{tier.unit && <small> {tier.unit}</small>}</span>
                    </li>
                  ))
                ) : (
                  <li>
                    <span className="tn">{ts('priceFromLabel')}</span>
                    <span className="tp">{fromEl ?? ts('priceOnInquiry')}</span>
                  </li>
                )}
              </ul>
              {suppValue && (
                <div className="supp"><span>{ts('pkgSingleSupp')}</span><span>{suppValue}</span></div>
              )}
              <p className="price-note">{tour.priceNote || ts('priceNoteOnInquiry')}</p>
              <CurrencyNote note={ts('priceCurrencyNote')} />
              <Link className="rail-cta" href={conciergeHref}>{ts('pkgPlanThis')} <span className="cta-arrow" aria-hidden>→</span></Link>
              <a className="rail-cta ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">{ts('ctaWhatsapp')} <span className="cta-arrow" aria-hidden>→</span></a>
            </div>

            <div className="card">
              <span className="ck">{ts('whyBook')}</span>
              <ul className="trust">{trustSignals.map((s, i) => <li key={i}>{s}</li>)}</ul>
              <div className="accred">{ts('trustAccred')}</div>
            </div>
          </aside>
        </div>
      </div>

      <section className="concierge-cta">
        <div className="t2e-wrap">
          <div className="cta-inner">
            <span className="t2e-kicker">{ts('ctaKicker')}</span>
            <h2>{ts('pkgCtaTitle')} <em>{ts('pkgCtaTitleEm')}</em></h2>
            <p>{ts('pkgCtaBody')}</p>
            <div className="cta-buttons">
              <Link className="cta-btn cta-btn--primary" href={conciergeHref}>{ts('pkgCtaAbout')} <span className="cta-arrow" aria-hidden>→</span></Link>
              <a className="cta-btn cta-btn--ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">{ts('ctaWhatsapp')} <span className="cta-arrow" aria-hidden>→</span></a>
            </div>
          </div>
        </div>
      </section>

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

      <FloatingConcierge />
    </div>
  );
}
