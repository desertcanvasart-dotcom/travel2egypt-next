import { getTranslations } from 'next-intl/server';
import { PortableText } from '@portabletext/react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatPrice } from '@/lib/currency';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { ConciergeOpenButton } from './ConciergeOpenButton';
import { FloatingConcierge } from '../FloatingConcierge';

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

  const cityNames = (tour.cities ?? []).map((c) => c.name).filter(Boolean);
  const route = cityNames.join(' · ');
  const days = (tour.days ?? []).filter((d) => d.title || d.morning || d.afternoon || d.dayNumber);
  const durationDays = tour.durationDays ?? days.length;
  const nights = durationDays > 0 ? durationDays - 1 : 0;
  const styleLabel = ts('pkgStylePrivate');
  const durationMeta = durationDays > 0 ? ts('pkgDurationMeta', { days: durationDays, nights }) : '';

  // Nights split (hotel vs river) — derived from days[].accommodation when present.
  const cruiseNights = days.filter((d) => d.accommodation && CRUISE_RE.test(d.accommodation)).length;
  const nightsSplit =
    cruiseNights > 0 && nights > 0
      ? ts('pkgNightsSplit', { hotel: Math.max(nights - cruiseNights, 0), river: cruiseNights })
      : '';

  // META ROW — omit any cell whose field is empty.
  const fromAmount = typeof tour.priceFrom === 'number' ? tour.priceFrom : tour.priceTiers?.[0]?.price;
  const fromPrice = formatPrice(fromAmount, 'pp');
  const metaItems = [
    { label: ts('metaDuration'), value: durationMeta },
    { label: ts('metaRoute'), value: route },
    { label: ts('metaStyle'), value: styleLabel },
    { label: ts('metaFrom'), value: fromPrice },
  ].filter((m) => m.value);

  // RAIL — shape of the journey (always renders; derived).
  const shape = tour.shapeOfDay;
  const shapeRows = [
    { label: ts('shapeRoute'), value: shape?.where || route },
    { label: ts('shapeLength'), value: shape?.duration || durationMeta },
    { label: ts('shapeNights'), value: nightsSplit },
    { label: ts('shapeStyle'), value: shape?.character || styleLabel },
  ].filter((r) => r.value);

  const tiers = (tour.priceTiers ?? []).filter((p) => p.name || typeof p.price === 'number');
  const suppValue =
    typeof tour.singleSupplement === 'number'
      ? `${ts('pkgSuppFrom')} ${formatPrice(tour.singleSupplement)}`
      : '';
  const trustSignals = [ts('trustSignal1'), ts('trustSignal2'), ts('trustSignal3'), ts('trustSignal4')];

  const included = tour.includedItems ?? [];
  const notIncluded = tour.notIncludedItems ?? [];
  const hasIncl = included.length > 0 || notIncluded.length > 0;

  const guideItems = [...(tour.relatedGuides ?? []), ...(tour.relatedGuideArticles ?? [])].filter((g) => g.title);
  const journal = (tour.journalRefs ?? []).filter((j) => j.title);
  const moreJourneys = (tour.relatedTours ?? []).filter((r) => r.slug);
  const guideHref = (g: { _type?: string; slug?: string; parentCity?: { slug?: string } | null }) =>
    g._type === 'guideArticle' && g.parentCity?.slug ? `/guide/${g.parentCity.slug}/${g.slug}` : `/guide/${g.slug}`;

  const kicker = `${ts('pkgKicker')}${durationDays > 0 ? ` · ${ts('shapeDaysCount', { count: durationDays })}` : ''}`;

  return (
    <div className="tour-doc lvl-single">
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{tNav('packages')}</li>
            {tour.theme?.name && (
              <li>{tour.themeLanding?.slug ? <Link href={`/${tour.themeLanding.slug}`}>{tour.theme.name}</Link> : tour.theme.name}</li>
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
          <JourneyImage image={tour.heroImage} alt={tour.title} sizes="(max-width:980px) 100vw, 1168px" widthHint={2336} priority />
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

            {tour.conciergeNote && (
              <div className="note">
                <span className="t2e-kicker">{ts('conciergeNoteLabel')}</span>
                <p>{tour.conciergeNote}</p>
              </div>
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
            {tour.audienceNote && (
              <>
                <h2>{tour.audienceNoteTitle ?? ts('audienceTitle')}</h2>
                <p>{tour.audienceNote}</p>
              </>
            )}
          </article>

          <aside className="rail">
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
                      <span className="tp">{formatPrice(tier.price)}{tier.unit && <small> {tier.unit}</small>}</span>
                    </li>
                  ))
                ) : (
                  <li>
                    <span className="tn">{ts('priceFromLabel')}</span>
                    <span className="tp">{fromPrice || ts('priceOnInquiry')}</span>
                  </li>
                )}
              </ul>
              {suppValue && (
                <div className="supp"><span>{ts('pkgSingleSupp')}</span><span>{suppValue}</span></div>
              )}
              <p className="price-note">{tour.priceNote || ts('priceNoteOnInquiry')}</p>
              <ConciergeOpenButton className="rail-cta">{ts('pkgPlanThis')} →</ConciergeOpenButton>
              <a className="rail-cta ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">{ts('ctaWhatsapp')} →</a>
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
              <ConciergeOpenButton className="cta-btn cta-btn--primary">{ts('pkgCtaAbout')} →</ConciergeOpenButton>
              <a className="cta-btn cta-btn--ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">{ts('ctaWhatsapp')} →</a>
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
