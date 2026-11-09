import { Link } from '@/i18n/navigation';
import { Price } from '@/components/Price';
import { JourneyImage } from '@/components/tour-system/JourneyImage';
import { LeadButton } from '@/components/leads/LeadProvider';
import { LeadForm } from '@/components/leads/LeadForm';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';
import { licenceShort } from '@/lib/accreditations';
import {
  TRIPADVISOR_RATING,
  TRIPADVISOR_REVIEW_COUNT,
  TRIPADVISOR_URL,
} from '@/lib/company';

import {
  CRUISE_SLUG,
  DAY_TOUR_CITIES,
  FEATURED_TOURS,
  GUIDE_LINKS,
  STYLE_CARDS,
} from './config';
import { HOME_COPY, localHref, type HomeLocale } from './copy';
import { DayToursTabs } from './DayToursTabs';
import { QuickFinder } from './QuickFinder';
import { TrackedLink } from './TrackedLink';
import { TourCard } from './TourCard';
import type { SalesHomeData, SalesProduct } from './query';

import '@/styles/tour-system.css';
import '@/styles/home-sales.css';

/**
 * Sales homepage (owner spec "Travel2Egypt homepage: proposed rebuild",
 * 2026-11-08; ES/JA from the owner's translations the same day). Jobs, in
 * order: (1) a multi-day buyer finds a priced trip and asks to customise it;
 * (2) a day-tour buyer picks a city, sees prices and requests a date; (3) a
 * planner enters the guide and is pulled back toward products.
 *
 * Words come from ./copy.tsx, structure from ./config.ts, prices live from
 * product data via <Price> (formatted per language and display currency).
 */

function minEur(products: Array<SalesProduct | undefined>): number | null {
  const prices = products
    .map((p) => p?.priceFrom)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  return prices.length ? Math.min(...prices) : null;
}

const price = (eur: number | null | undefined) => (eur ? <Price eur={eur} /> : null);

export function SalesHomeView({ data, locale }: { data: SalesHomeData; locale: HomeLocale }) {
  const c = HOME_COPY[locale];
  const bySlug = new Map(data.products.map((p) => [p.slug, p]));
  const featured = FEATURED_TOURS.map((f) => ({ ...f, p: bySlug.get(f.slug) })).filter(
    (f): f is typeof f & { p: SalesProduct } => Boolean(f.p),
  );
  const cities = DAY_TOUR_CITIES.map((city) => {
    const tours = city.tours
      .map((t) => ({ ...t, p: bySlug.get(t.slug) }))
      .filter((t): t is typeof t & { p: SalesProduct } => Boolean(t.p));
    return { ...city, tours, fromEur: minEur(tours.map((t) => t.p)) };
  }).filter((city) => city.tours.length > 0);

  const multiDayFrom = minEur(featured.map((f) => f.p));
  const dayFrom = minEur(cities.map((city) => (city.fromEur ? ({ priceFrom: city.fromEur } as SalesProduct) : undefined)));
  const cruise = bySlug.get(CRUISE_SLUG);
  const conciergeHref = isChatEnabled() ? '/plan-your-tour' : '/contact';
  const formatLabel = (f: 'private' | 'group' | null) =>
    f === 'private' ? c.dayTours.private : f === 'group' ? c.dayTours.smallGroup : null;

  return (
    <div className="tour-doc lvl-home lvl-sales" lang={locale}>
      {/* ── 1. HERO ─────────────────────────────────────────────── */}
      <header className="hero sales-hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="kicker">{c.hero.eyebrow}</span>
              <h1>{c.hero.h1}</h1>
              <p className="sub">{c.hero.sub(price(multiDayFrom), price(dayFrom))}</p>
              <div className="hero-cta">
                <LeadButton source="home_hero" className="btn primary">
                  {c.hero.primary} <span className="cta-arrow" aria-hidden>→</span>
                </LeadButton>
                <Link className="btn text" href="/egypt-travel-packages">
                  {c.hero.secondary}
                </Link>
              </div>
              <ul className="proof">
                <li>
                  <a href={TRIPADVISOR_URL} target="_blank" rel="noopener noreferrer">
                    <span aria-hidden>★</span> {c.hero.tripadvisor(TRIPADVISOR_RATING, TRIPADVISOR_REVIEW_COUNT)}
                  </a>
                </li>
                {licenceShort(data.accreditations, locale) && <li>{licenceShort(data.accreditations, locale)}</li>}
                {data.responseTime?.short && <li>{data.responseTime.short}</li>}
                <li>{c.hero.trips}</li>
              </ul>
            </div>
            <figure className="hero-img">
              <JourneyImage
                image={data.home?.heroImage}
                alt={data.home?.heroImage?.alt ?? ''}
                className=""
                sizes="(max-width:980px) 100vw, 560px"
                widthHint={1100}
                priority
              />
              {data.home?.heroCaption && <figcaption className="img-cap">{data.home.heroCaption}</figcaption>}
            </figure>
          </div>
          <QuickFinder locale={locale} />
        </div>
      </header>

      {/* ── 2. EGYPT TOURS ──────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="sec" id="egypt-tours" aria-labelledby="h-egypt-tours">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">{c.tours.eyebrow}</span>
                <h2 id="h-egypt-tours">{c.tours.h2}</h2>
              </div>
              <p className="lede">{c.tours.intro}</p>
            </div>
            <ul className="pcards">
              {featured.map(({ slug, p }) => (
                <TourCard key={slug} slug={slug} p={p} locale={locale} listName="home_egypt_tours" />
              ))}
            </ul>
            <p className="sec-more">
              <Link className="more" href="/egypt-travel-packages">
                {c.tours.seeAll}
              </Link>
              <Link className="more" href="/small-group-travel-packages">
                {c.tours.smallGroup}
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* ── 3. WHAT YOU CAN COUNT ON ────────────────────────────── */}
      <section className="sec warm promises" aria-labelledby="h-promises">
        <div className="wrap">
          <h2 id="h-promises" className="promises-title">
            {c.promises.h2}
          </h2>
          <ul className="promise-grid">
            {c.promises.items.map((item) => (
              <li key={item.h3}>
                <h3>{item.h3}</h3>
                <p>{item.p}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 4. DAY TOURS BY CITY ────────────────────────────────── */}
      {cities.length > 0 && (
        <section className="sec" id="day-tours" aria-labelledby="h-day-tours">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">{c.dayTours.eyebrow}</span>
                <h2 id="h-day-tours">{c.dayTours.h2}</h2>
              </div>
              <p className="lede">{c.dayTours.intro}</p>
            </div>
            <DayToursTabs
              label={c.dayTours.tabsLabel}
              tabs={cities.map((city) => ({
                key: city.key,
                label: c.dayTours.cities[city.key]?.label ?? city.key,
                from: c.from(price(city.fromEur)),
                panel: (
                  <>
                    <ul className="dcards">
                      {city.tours.map(({ slug, format, p }) => {
                        const label = c.dayTours.labels[slug] ?? p.title;
                        const href = `/${p.href}`;
                        return (
                          <li className="dcard" key={slug}>
                            <TrackedLink href={href} listName={`home_day_${city.key}`} itemId={slug} className="dcard-img">
                              <JourneyImage
                                image={p.heroImage}
                                alt={p.heroImage?.alt || label}
                                className=""
                                sizes="(max-width:980px) 90vw, 380px"
                                widthHint={700}
                                ratio={16 / 10}
                              />
                            </TrackedLink>
                            <div className="dcard-body">
                              <p className="meta">
                                {[formatLabel(format), p.type === 'dayTour' && p.durationHours ? c.hours(p.durationHours) : null]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                              <h3>
                                <TrackedLink href={href} listName={`home_day_${city.key}`} itemId={slug}>
                                  {label}
                                </TrackedLink>
                              </h3>
                              <p className="price">
                                {p.priceFrom ? (
                                  <span className="price-from">{c.fromPerPerson(price(p.priceFrom))}</span>
                                ) : (
                                  <span className="price-basis">{c.priceOnRequest}</span>
                                )}
                              </p>
                              {p.included && p.included.length > 0 && (
                                <ul className="incl">
                                  {p.included.slice(0, 3).map((x) => (
                                    <li key={x}>{x}</li>
                                  ))}
                                </ul>
                              )}
                              <LeadButton
                                source="day_tour_card"
                                prefill={{ kind: 'day_tour', tourSlug: slug, tourTitle: p.title, priceFromEur: p.priceFrom }}
                                itemListName={`home_day_${city.key}`}
                                className="btn-outline"
                              >
                                {c.dayTours.check}
                              </LeadButton>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="sec-more">
                      <Link className="more" href={localHref(c, city.href)}>
                        {c.dayTours.cities[city.key]?.seeAll}
                      </Link>
                    </p>
                  </>
                ),
              }))}
            />
          </div>
        </section>
      )}

      {/* ── 5. NILE CRUISES & DAHABIYAS ─────────────────────────── */}
      <section className="sec warm" id="nile-cruises" aria-labelledby="h-cruises">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="kicker">{c.nile.eyebrow}</span>
              <h2 id="h-cruises">{c.nile.h2}</h2>
            </div>
            <p className="lede">{c.nile.intro}</p>
          </div>
          <div className="boats">
            <article className="boat">
              <h3>{c.nile.ship.name}</h3>
              <dl>
                <div><dt>{c.nile.rows.what}</dt><dd>{c.nile.ship.what}</dd></div>
                <div><dt>{c.nile.rows.nights}</dt><dd>{c.nile.ship.nights}</dd></div>
                <div><dt>{c.nile.rows.bestFor}</dt><dd>{c.nile.ship.bestFor}</dd></div>
                <div>
                  <dt>{c.nile.rows.from}</dt>
                  <dd>
                    {cruise?.priceFrom
                      ? c.nile.shipFrom(price(cruise.priceFrom), cruise.durationDays ?? null)
                      : c.priceOnRequest}
                  </dd>
                </div>
              </dl>
              <Link className="btn-outline" href="/nile-cruises?vessel=ship#cruise-ships">
                {c.nile.ship.compare}
              </Link>
            </article>
            <article className="boat">
              <h3>{c.nile.dahabiya.name}</h3>
              <dl>
                <div><dt>{c.nile.rows.what}</dt><dd>{c.nile.dahabiya.what}</dd></div>
                <div><dt>{c.nile.rows.nights}</dt><dd>{c.nile.dahabiya.nights}</dd></div>
                <div><dt>{c.nile.rows.bestFor}</dt><dd>{c.nile.dahabiya.bestFor}</dd></div>
                <div>
                  <dt>{c.nile.rows.from}</dt>
                  <dd>
                    {data.dahabiya ? (
                      <TrackedLink href={`/${data.dahabiya.href}`} listName="home_cruises" itemId={data.dahabiya.slug}>
                        {c.nile.dahabiyaFrom(price(data.dahabiya.priceFrom), data.dahabiya.durationDays ?? null)}
                      </TrackedLink>
                    ) : (
                      c.priceOnRequest
                    )}
                  </dd>
                </div>
              </dl>
              <Link className="btn-outline" href="/nile-cruises?vessel=dahabiya#dahabiyas">
                {c.nile.dahabiya.compare}
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ── 6. REVIEWS — hidden until the owner supplies three real,
             permissioned reviews (spec §6). Never invent placeholders. */}

      {/* ── 7. PLAN BY TRAVEL STYLE ─────────────────────────────── */}
      <section className="sec" id="where-to-begin" aria-labelledby="h-styles">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="kicker">{c.styles.eyebrow}</span>
              <h2 id="h-styles">{c.styles.h2}</h2>
            </div>
          </div>
          <ul className="styles">
            {STYLE_CARDS.map((s) => {
              const eur = s.priceSlug ? bySlug.get(s.priceSlug)?.priceFrom : s.ownerFromEur;
              const card = c.styles.cards[s.href];
              const href = localHref(c, s.href);
              return (
                <li key={s.href}>
                  <TrackedLink href={href} listName="home_styles" itemId={s.href} className="style">
                    <h3>{card?.title}</h3>
                    <p>{card?.line}</p>
                    {eur ? <span className="style-from">{c.from(price(eur))}</span> : null}
                  </TrackedLink>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── 8. PLANNING GUIDE TEASER ────────────────────────────── */}
      <section className="sec warm" aria-labelledby="h-guide">
        <div className="wrap guide-teaser">
          <div>
            <span className="kicker">{c.planning.eyebrow}</span>
            <h2 id="h-guide">{c.planning.h2}</h2>
            <p className="lede">{c.planning.intro}</p>
            <Link className="more" href="/guide">
              {c.planning.readAll}
            </Link>
          </div>
          <ul className="guide-links">
            {GUIDE_LINKS.map((g) => (
              <li key={g.href}>
                <Link href={localHref(c, g.href)}>{c.planning.links[g.href]}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 9. FINAL CTA + INLINE FORM ──────────────────────────── */}
      <section className="plan sales-close" id="itinerary" aria-labelledby="h-close">
        <div className="wrap close-grid">
          <div>
            <span className="kicker">{c.close.eyebrow}</span>
            <h2 id="h-close">{c.close.h2}</h2>
            <p className="sub">
              {c.close.free}
              {locale === 'ja' ? '' : ' '}
              {data.responseTime?.full}
            </p>
            <ul className="close-alt">
              <li>
                {c.close.preferChat}
                {locale === 'ja' ? '' : ' '}
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  WhatsApp +20 155 177 2258
                </a>
              </li>
              <li>
                {c.close.stillExploring} <Link href={conciergeHref}>{c.close.concierge}</Link>
              </li>
            </ul>
          </div>
          <LeadForm source="home_footer" tone="dark" headingId="h-close" locale={locale} />
        </div>
      </section>
    </div>
  );
}
