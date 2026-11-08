import { Link } from '@/i18n/navigation';
import { Price } from '@/components/Price';
import { JourneyImage } from '@/components/tour-system/JourneyImage';
import { LeadButton } from '@/components/leads/LeadProvider';
import { LeadForm } from '@/components/leads/LeadForm';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';
import {
  MINISTRY_LICENCE_NUMBER,
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
import { DayToursTabs } from './DayToursTabs';
import { QuickFinder } from './QuickFinder';
import { TrackedLink } from './TrackedLink';
import type { SalesHomeData, SalesProduct } from './query';

import '@/styles/tour-system.css';
import '@/styles/home-sales.css';

/**
 * English sales homepage (owner spec "Travel2Egypt homepage: proposed
 * rebuild", 2026-11-08). Jobs, in order: (1) a multi-day buyer finds a priced
 * trip and asks to customise it; (2) a day-tour buyer picks a city, sees
 * prices and requests a date; (3) a planner enters the guide and is pulled
 * back toward products.
 *
 * English-first: ES/JA keep the editorial HomeView until two weeks of data
 * are in (spec build notes). Copy is in this file for that reason.
 */

const PRICE_BASIS = 'per person, 2 sharing, 4★/5★ hotels';

function minEur(products: Array<SalesProduct | undefined>): number | null {
  const prices = products
    .map((p) => p?.priceFrom)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  return prices.length ? Math.min(...prices) : null;
}

function From({ eur, suffix }: { eur: number | null | undefined; suffix?: string }) {
  if (!eur) return null;
  return (
    <>
      from <Price eur={eur} />
      {suffix ? ` ${suffix}` : ''}
    </>
  );
}

function durationLabel(p: SalesProduct): string | null {
  if (p.type === 'dayTour') {
    if (!p.durationHours) return null;
    return `${p.durationHours} hours`;
  }
  return p.durationDays ? `${p.durationDays} days` : null;
}

export function SalesHomeView({ data }: { data: SalesHomeData }) {
  const bySlug = new Map(data.products.map((p) => [p.slug, p]));
  const featured = FEATURED_TOURS.map((f) => ({ ...f, p: bySlug.get(f.slug) })).filter(
    (f): f is typeof f & { p: SalesProduct } => Boolean(f.p),
  );
  const cities = DAY_TOUR_CITIES.map((c) => {
    const tours = c.tours
      .map((t) => ({ ...t, p: bySlug.get(t.slug) }))
      .filter((t): t is typeof t & { p: SalesProduct } => Boolean(t.p));
    return { ...c, tours, fromEur: minEur(tours.map((t) => t.p)) };
  }).filter((c) => c.tours.length > 0);

  const multiDayFrom = minEur(featured.map((f) => f.p));
  const dayFrom = minEur(cities.map((c) => (c.fromEur ? ({ priceFrom: c.fromEur } as SalesProduct) : undefined)));
  const cruise = bySlug.get(CRUISE_SLUG);
  const conciergeHref = isChatEnabled() ? '/plan-your-tour' : '/contact';

  return (
    <div className="tour-doc lvl-home lvl-sales" lang="en">
      {/* ── 1. HERO ─────────────────────────────────────────────── */}
      <header className="hero sales-hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="kicker">Licensed Egyptian operator · Guiding since 1993</span>
              <h1>Private Egypt tours, planned by the people who guide them.</h1>
              <p className="sub">
                Multi-day tours <From eur={multiDayFrom} /> and day tours <From eur={dayFrom} />, priced openly, built
                around your dates, and run on the ground by our own Cairo team.
              </p>
              <div className="hero-cta">
                <LeadButton source="home_hero" className="btn primary">
                  Get my free itinerary <span className="cta-arrow" aria-hidden>→</span>
                </LeadButton>
                <Link className="btn text" href="/egypt-travel-packages">
                  Browse Egypt tours →
                </Link>
              </div>
              <ul className="proof">
                <li>
                  <a href={TRIPADVISOR_URL} target="_blank" rel="noopener noreferrer">
                    <span aria-hidden>★</span> {TRIPADVISOR_RATING} on Tripadvisor ({TRIPADVISOR_REVIEW_COUNT} reviews)
                  </a>
                </li>
                <li>Ministry of Tourism licence {MINISTRY_LICENCE_NUMBER}</li>
                <li>We reply the same day, 7 days a week</li>
                <li>About 130 private trips a year</li>
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
          <QuickFinder />
        </div>
      </header>

      {/* ── 2. EGYPT TOURS ──────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="sec" id="egypt-tours" aria-labelledby="h-egypt-tours">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">Egypt tours</span>
                <h2 id="h-egypt-tours">Egypt tours to start with</h2>
              </div>
              <p className="lede">Every tour is private and can be changed: dates, hotels, pace and sites.</p>
            </div>
            <ul className="pcards">
              {featured.map(({ slug, badge, route, p }) => (
                <li className="pcard" key={slug}>
                  <TrackedLink href={`/${slug}`} listName="home_egypt_tours" itemId={slug} className="pcard-img">
                    <JourneyImage
                      image={p.heroImage}
                      alt={p.heroImage?.alt || p.title}
                      className=""
                      sizes="(max-width:620px) 85vw, (max-width:980px) 45vw, 380px"
                      widthHint={760}
                      ratio={3 / 2}
                    />
                    <span className="badge">{badge}</span>
                  </TrackedLink>
                  <div className="pcard-body">
                    <h3>
                      <TrackedLink href={`/${slug}`} listName="home_egypt_tours" itemId={slug}>
                        {p.title}
                      </TrackedLink>
                    </h3>
                    <p className="route">
                      {durationLabel(p) && <span className="dur">{durationLabel(p)}</span>} {route}
                    </p>
                    {p.priceFrom ? (
                      <p className="price">
                        <span className="price-from">
                          <From eur={p.priceFrom} />
                        </span>
                        <span className="price-basis">{PRICE_BASIS}</span>
                      </p>
                    ) : (
                      <p className="price">
                        <span className="price-basis">Price on request</span>
                      </p>
                    )}
                    <div className="pcard-actions">
                      <TrackedLink href={`/${slug}`} listName="home_egypt_tours" itemId={slug} className="link">
                        View tour
                      </TrackedLink>
                      <LeadButton
                        source="tour_card"
                        prefill={{ kind: 'trip', tourSlug: slug, tourTitle: p.title }}
                        itemListName="home_egypt_tours"
                        className="btn-outline"
                      >
                        Customise
                      </LeadButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="sec-more">
              <Link className="more" href="/egypt-travel-packages">
                See all Egypt tours →
              </Link>
              <Link className="more" href="/small-group-travel-packages">
                Small-group departures →
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* ── 3. WHAT YOU CAN COUNT ON ────────────────────────────── */}
      <section className="sec warm promises" aria-labelledby="h-promises">
        <div className="wrap">
          <h2 id="h-promises" className="promises-title">
            What you can count on
          </h2>
          <ul className="promise-grid">
            <li>
              <h3>The price before the conversation</h3>
              <p>Every tour shows its starting price. Your quote lists every inclusion, with no surprises on arrival.</p>
            </li>
            <li>
              <h3>A reply the same day</h3>
              <p>Send your dates and we answer the same day, seven days a week, with a day-by-day itinerary and a firm price.</p>
            </li>
            <li>
              <h3>Licensed Egyptologist guides</h3>
              <p>
                Every private and small-group tour is guided by an Egyptologist licensed by the Ministry of Tourism, and
                the team that plans your trip is the team that runs it.
              </p>
            </li>
            <li>
              <h3>People on the ground while you travel</h3>
              <p>A Cairo team on WhatsApp from arrival to departure. If something goes wrong, we fix it the same day.</p>
            </li>
          </ul>
        </div>
      </section>

      {/* ── 4. DAY TOURS BY CITY ────────────────────────────────── */}
      {cities.length > 0 && (
        <section className="sec" id="day-tours" aria-labelledby="h-day-tours">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">Day tours</span>
                <h2 id="h-day-tours">Day tours in Cairo, Luxor and Aswan</h2>
              </div>
              <p className="lede">
                Private or small-group, with an Egyptologist guide, hotel pickup, entry fees, lunch and water. Pick a date
                and we confirm it.
              </p>
            </div>
            <DayToursTabs
              tabs={cities.map((c) => ({
                key: c.key,
                label: c.label,
                from: <From eur={c.fromEur} />,
                panel: (
                  <>
                    <ul className="dcards">
                      {c.tours.map(({ slug, label, format, p }) => (
                        <li className="dcard" key={slug}>
                          <TrackedLink href={`/${slug}`} listName={`home_day_${c.key}`} itemId={slug} className="dcard-img">
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
                              {[format, p.type === 'dayTour' && p.durationHours ? `${p.durationHours} hours` : null]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                            <h3>
                              <TrackedLink href={`/${slug}`} listName={`home_day_${c.key}`} itemId={slug}>
                                {label}
                              </TrackedLink>
                            </h3>
                            <p className="price">
                              {p.priceFrom ? (
                                <span className="price-from">
                                  <From eur={p.priceFrom} suffix="per person" />
                                </span>
                              ) : (
                                <span className="price-basis">Price on request</span>
                              )}
                            </p>
                            <LeadButton
                              source="day_tour_card"
                              prefill={{ kind: 'day_tour', tourSlug: slug, tourTitle: p.title }}
                              itemListName={`home_day_${c.key}`}
                              className="btn-outline"
                            >
                              Check this date
                            </LeadButton>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="sec-more">
                      <Link className="more" href={c.href}>
                        See all {c.label} day tours →
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
              <span className="kicker">On the Nile</span>
              <h2 id="h-cruises">Sail the Nile between Luxor and Aswan</h2>
            </div>
            <p className="lede">Five-star cruise ships or small sailing dahabiyas. We only sell the boats we would put our own families on.</p>
          </div>
          <div className="boats">
            <article className="boat">
              <h3>Nile cruise</h3>
              <dl>
                <div><dt>What it is</dt><dd>A five-star ship with a pool</dd></div>
                <div><dt>Nights</dt><dd>3 or 4</dd></div>
                <div><dt>Best for</dt><dd>A first visit, families, value</dd></div>
                <div>
                  <dt>Starting at</dt>
                  <dd>
                    {cruise?.priceFrom ? (
                      <>
                        <strong><From eur={cruise.priceFrom} /></strong>
                        {cruise.durationDays ? `, ${cruise.durationDays} days Aswan to Luxor` : ''}
                      </>
                    ) : (
                      'Price on request'
                    )}
                  </dd>
                </div>
              </dl>
              <Link className="btn-outline" href="/nile-cruises">
                Compare cruise ships →
              </Link>
            </article>
            <article className="boat">
              <h3>Dahabiya</h3>
              <dl>
                <div><dt>What it is</dt><dd>A small sailing boat with only a few cabins</dd></div>
                <div><dt>Nights</dt><dd>4 to 7</dd></div>
                <div><dt>Best for</dt><dd>Quiet, slow travel, couples</dd></div>
                <div>
                  <dt>Starting at</dt>
                  <dd>
                    {data.dahabiyaFromEur ? (
                      <>
                        <strong><From eur={data.dahabiyaFromEur} /></strong>, 7 days
                      </>
                    ) : (
                      'Price on request'
                    )}
                  </dd>
                </div>
              </dl>
              <Link className="btn-outline" href="/nile-cruises">
                Compare dahabiyas →
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
              <span className="kicker">Travel styles</span>
              <h2 id="h-styles">Not sure which tour? Start with how you travel.</h2>
            </div>
          </div>
          <ul className="styles">
            {STYLE_CARDS.map((s) => {
              const eur = s.priceSlug ? bySlug.get(s.priceSlug)?.priceFrom : s.ownerFromEur;
              return (
                <li key={s.href}>
                  <TrackedLink href={s.href} listName="home_styles" itemId={s.href} className="style">
                    <h3>{s.title}</h3>
                    <p>{s.line}</p>
                    {eur ? (
                      <span className="style-from">
                        <From eur={eur} />
                      </span>
                    ) : null}
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
            <span className="kicker">Planning</span>
            <h2 id="h-guide">Planning your Egypt trip</h2>
            <p className="lede">Straight answers from the people who run the trips.</p>
            <Link className="more" href="/guide">
              Read the full Egypt travel guide →
            </Link>
          </div>
          <ul className="guide-links">
            {GUIDE_LINKS.map((g) => (
              <li key={g.href}>
                <Link href={g.href}>{g.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 9. FINAL CTA + INLINE FORM ──────────────────────────── */}
      <section className="plan sales-close" id="itinerary" aria-labelledby="h-close">
        <div className="wrap close-grid">
          <div>
            <span className="kicker">Free itinerary</span>
            <h2 id="h-close">Tell us your dates. We&rsquo;ll send a plan and a price.</h2>
            <p className="sub">Free, with no obligation. We reply the same day, seven days a week.</p>
            <ul className="close-alt">
              <li>
                Prefer to chat?{' '}
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  WhatsApp +20 155 177 2258
                </a>
              </li>
              <li>
                Still exploring? <Link href={conciergeHref}>Talk it through with our AI concierge →</Link>
              </li>
            </ul>
          </div>
          <LeadForm source="home_footer" tone="dark" headingId="h-close" />
        </div>
      </section>
    </div>
  );
}
