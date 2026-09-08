import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';

import { JourneyImage } from './JourneyImage';
import '@/styles/tour-system.css';

interface HomeCard {
  title?: string;
  dek?: string;
  href?: string;
}
interface StartingPoint {
  meta?: string;
  title?: string;
  dek?: string;
  tourType?: string;
  tourSlug?: string;
  image?: { asset?: unknown; alt?: string } | null;
}
export interface HomePageData {
  heroImage?: { asset?: unknown; alt?: string } | null;
  heroCaption?: string;
  travellerCards?: HomeCard[];
  guideCards?: HomeCard[];
  startingPoints?: StartingPoint[];
}

/** Build the journey path from a referenced tour's type + slug. */
function tourHref(type?: string, slug?: string): string | null {
  if (!slug) return null;
  return type === 'package' ? `/packages/${slug}` : `/tours/${slug}`;
}

const ROMAN = ['i.', 'ii.', 'iii.', 'iv.'];
import { WHATSAPP_LINK as WHATSAPP } from '@/lib/concierge/constants';

/**
 * Stable, locale-independent anchor ids for the six "Where to begin" cards, in
 * grid order (top-left → bottom-right). The header "Journeys" dropdown links to
 * these (/#<id>). Index-based (not slugified from the localized title) so the
 * ids stay identical across en/es/ja. Order must match the seeded card order.
 */
const TRAVELLER_ANCHORS = [
  'first-time-in-egypt',
  'the-cultural-traveller',
  'travelling-as-a-family',
  'desert-and-quiet',
  'travelling-in-style',
  'coming-back',
] as const;

export async function HomeView({
  data,
  locale,
}: {
  data: HomePageData | null;
  locale: Locale;
}) {
  const t = await getTranslations('home');

  // Concierge CTA destination rides the site's one lever (CHAT_ENABLED):
  // → /plan-your-tour when chat is live, → /contact fail-safe otherwise.
  const conciergeHref = isChatEnabled() ? '/plan-your-tour' : '/contact';

  const traveller = data?.travellerCards ?? [];
  const guideCards = data?.guideCards ?? [];
  const starts = data?.startingPoints ?? [];

  // Inline asset references — the three city heroes that best
  // illustrate each way to travel (Giza for day tours, Luxor for
  // packages, Aswan for cruises). Move to Sanity later if editorial
  // wants per-locale or per-campaign swaps.
  const ways = [
    {
      key: 'way1',
      href: '/private-day-tours',
      image: { asset: { _ref: 'image-b620522286b15ca9299ed5d862c5ad852f856404-3000x2000-jpg' } },
      alt: 'The Giza pyramids at the edge of the desert.',
    },
    {
      key: 'way2',
      href: '/egypt-travel-packages',
      image: { asset: { _ref: 'image-c9d2ecb97c5987daf1b396405039e67f4d5075cc-3000x1989-jpg' } },
      alt: 'Luxor Temple, lit at dusk.',
    },
    {
      key: 'way3',
      href: '/nile-cruises',
      image: { asset: { _ref: 'image-98352fa19f111d00d5204c1dedcf94487bdc3743-3000x1381-jpg' } },
      alt: 'A felucca on the Nile at Aswan.',
    },
  ];
  const steps = ['step1', 'step2', 'step3', 'step4'];

  return (
    <div className="tour-doc lvl-home" lang={locale}>
      {/* ── HERO (headline + statement kept verbatim) ───────────── */}
      <header className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="kicker">{t('eyebrow')}</span>
              <h1>
                {t('heroFirstLine')} <em>{t('heroAccent')}</em>
              </h1>
              <p className="sub">{t('heroLede')}</p>
              <div className="hero-cta">
                <Link className="btn primary" href={conciergeHref}>
                  {t('heroCtaPrimary')} <span className="cta-arrow" aria-hidden>→</span>
                </Link>
                <a className="btn text" href="#where-to-begin">
                  {t('heroCtaSecondary')}
                </a>
              </div>
              <div className="stats">
                <span>
                  <b>{t('heroMetaYears')}</b> {t('heroMetaYearsLabel')}
                </span>
                <span>
                  <b>{t('heroMetaTrips')}</b> {t('heroMetaTripsLabel')}
                </span>
              </div>
            </div>
            <figure className="hero-img">
              <JourneyImage
                image={data?.heroImage}
                alt=""
                className=""
                sizes="(max-width:980px) 100vw, 560px"
                widthHint={1100}
                priority
              />
              {data?.heroCaption && <figcaption className="img-cap">{data.heroCaption}</figcaption>}
            </figure>
          </div>
        </div>
      </header>

      {/* ── WHERE TO BEGIN — traveller-type ─────────────────────── */}
      {/* id="where-to-begin": anchor target for the traveller-type pages'
          "five other places to start" cross-reference (e.g. the first-time
          page). Anchor only — the section content is unchanged. */}
      {traveller.length > 0 && (
        <section className="sec" id="where-to-begin">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">{t('whereKicker')}</span>
                <h2>{t('whereTitle')}</h2>
              </div>
              <p className="lede">{t('whereLede')}</p>
            </div>
            <div className="triage">
              {traveller.map((c, i) =>
                c.href ? (
                  <Link className="tcard" id={TRAVELLER_ANCHORS[i]} href={c.href} key={i}>
                    <h3>{c.title}</h3>
                    <p>{c.dek}</p>
                    <span className="go">{t('startHere')}</span>
                  </Link>
                ) : (
                  <div className="tcard" id={TRAVELLER_ANCHORS[i]} key={i}>
                    <h3>{c.title}</h3>
                    <p>{c.dek}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── WHAT WE DO DIFFERENTLY (statement verbatim) ─────────── */}
      <section className="differ">
        <div className="wrap">
          <div className="differ-grid">
            <span className="kicker">{t('standfirstEyebrow')}</span>
            <div>
              <p className="statement">
                {t('standfirstLine1')} {t('standfirstLine2')}{' '}
                <span className="accent">{t('standfirstAccent')}</span>
              </p>
            </div>
          </div>
          <div className="differ-points">
            {[1, 2, 3].map((n) => (
              <article className="dp" key={n}>
                <h3>{t(`differ${n}Title`)}</h3>
                <p>{t(`differ${n}Body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── WAYS TO TRAVEL ──────────────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="kicker">{t('waysKicker')}</span>
              <h2>{t('waysTitle')}</h2>
            </div>
          </div>
          <div className="ways">
            {ways.map(({ key, href, image, alt }) => (
              <Link className="way" href={href} key={key}>
                <JourneyImage image={image} alt={alt} className="" sizes="(max-width:980px) 100vw, 380px" widthHint={760} ratio={4 / 3} />
                <h3>{t(`${key}Title`)}</h3>
                <p>{t(`${key}Dek`)}</p>
                <span className="go">{t(`${key}Go`)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE EGYPT TRAVEL GUIDE — feature ────────────────────── */}
      <section className="sec warm">
        <div className="wrap">
          <div className="gfeat">
            <div className="gfeat-l">
              <span className="kicker">{t('guideFeatureKicker')}</span>
              <h2>{t('guideFeatureTitle')}</h2>
              <p>{t('guideFeatureBody')}</p>
              <Link className="more" href="/guide">
                {t('guideFeatureMore')}
              </Link>
            </div>
            <div className="gfeat-cards">
              {guideCards.map((c, i) => (
                <Link className="gfc" href={c.href || '/guide'} key={i}>
                  <div className="ix">{ROMAN[i] ?? ''}</div>
                  <h3>{c.title}</h3>
                  <p>{c.dek}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SUGGESTED STARTING POINTS ───────────────────────────── */}
      {starts.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">{t('startsKicker')}</span>
                <h2>{t('startsTitle')}</h2>
              </div>
              <p className="lede">{t('startsLede')}</p>
            </div>
            <div className="starts">
              {starts.map((s, i) => {
                const href = tourHref(s.tourType, s.tourSlug);
                const inner = (
                  <>
                    <JourneyImage image={s.image} alt="" className="" sizes="(max-width:620px) 100vw, (max-width:980px) 50vw, 300px" widthHint={620} ratio={3 / 2} />
                    {s.meta && <div className="meta">{s.meta}</div>}
                    <h3>{s.title}</h3>
                    <p>{s.dek}</p>
                  </>
                );
                return href ? (
                  <Link className="scard" href={href} key={i}>{inner}</Link>
                ) : (
                  <div className="scard" key={i}>{inner}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW THE CONCIERGE WORKS — dark close ────────────────── */}
      <section className="plan">
        <div className="wrap">
          <span className="kicker">{t('planKicker')}</span>
          <h2>
            {t('planTitle')} <em>{t('planTitleAccent')}</em>
          </h2>
          <p className="sub">{t('planSub')}</p>
          <div className="steps">
            {steps.map((key, i) => (
              <div className="step" key={key}>
                <div className="n">{ROMAN[i]}</div>
                <h3>{t(`${key}Title`)}</h3>
                <p>{t(`${key}Body`)}</p>
              </div>
            ))}
          </div>
          <div className="plan-cta">
            <Link className="btn solid" href={conciergeHref}>
              {t('planCtaPrimary')}
            </Link>
            <a className="btn ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              {t('planCtaWhatsApp')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
