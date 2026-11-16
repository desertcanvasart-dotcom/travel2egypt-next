import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { client } from '@/sanity/lib/client';
import { otherTrackLandingSlugQuery } from '@/sanity/lib/queries';
import type { Locale } from '@/i18n/routing';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { MastheadStats } from './MastheadStats';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList, buildItemListSchema } from '@/lib/structured-data';
import { LandingFaq, type LandingFaqItem } from './LandingFaq';
import { withStandardFaq } from '@/lib/standardFaq';
import { FloatingConcierge } from '../FloatingConcierge';
import { Price } from '@/components/Price';
import { getRates } from '@/lib/fx';
import { LeadButton } from '@/components/leads/LeadProvider';
import type { LeadPrefill } from '@/components/leads/LeadForm';
import { DayHubList } from '@/components/day-hubs/DayHubList';
import { DayHubEnd } from '@/components/day-hubs/DayHubEnd';
import { buildDayHub, dayCardRenderer, responseTimeFull } from '@/components/day-hubs/buildDayHub';
import { minPrice, type RawHubTour } from '@/components/day-hubs/dayHubData';
import '@/styles/tour-system.css';
import '@/styles/home-sales.css';
import '@/styles/day-hubs.css';
import '@/styles/packages-hub.css';
import '@/styles/theme-hub.css';

/**
 * Day-tour city pages (city × private / small-group track), aligned with the
 * package theme pages (2026-11-15) so every subcategory page shares one look:
 *   breadcrumb → photo hero (+ counters band) → "Days we would not miss"
 *   (the day-tour card) → every {city} day (Length / Budget / sort / count,
 *   URL state) → the city editorial (unchanged text) → FAQ → the closing
 *   form → footband.
 * One layout for the Nile Valley and the Red Sea city pages.
 */

interface RawTour {
  _id: string;
  enSlug?: string;
  title: string;
  slug: string;
  summary?: string;
  tourMode?: string;
  priceFrom?: number | null;
  cities?: Array<{ _id: string; name: string; slug: string; enSlug?: string }> | null;
  durationDays?: number;
  durationHours?: number;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

interface MoodCard {
  eyebrow?: string;
  title?: string;
  body?: string;
  bullets?: string[];
  jumpLabel?: string;
  image?: { asset?: unknown; alt?: string } | null;
}

export interface SubcategoryDoc {
  faq?: LandingFaqItem[];
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  intro?: unknown;
  ctaContext?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  category?: { key?: string } | null;
  destinationCity?: {
    _id: string;
    enSlug?: string;
    name: string;
    slug: string;
    heroImage?: { asset?: unknown; alt?: string } | null;
  } | null;
  facts?: Array<{ label?: string; value?: string }> | null;
  heroNote?: string;
  editorByline?: { kicker?: string; heading?: string; intro?: string; mini?: string } | null;
  moodChooser?: { heading?: string; intro?: string; cards?: MoodCard[] } | null;
  orientation?: {
    baseLabel?: string;
    baseName?: string;
    stops?: Array<{ name?: string; sub?: string; time?: string; effort?: string }>;
    copyKicker?: string;
    copyHeading?: string;
    copyBody?: string;
    effort?: Array<{ label?: string; value?: string }>;
  } | null;
  tourPresentation?: Array<{ tourId?: string; label?: string; featured?: boolean; why?: string }> | null;
  journalRefs?: Array<{ _id: string; _type?: string; title?: string; slug?: string; summary?: string; kicker?: string; parentCity?: { slug?: string } | null }> | null;
  tours?: RawTour[];
}

const OTHER_TRACK: Record<string, string> = {
  'private-day-tour': 'group-day-tour',
  'group-day-tour': 'private-day-tour',
};

/** As on the theme pages: the dek stays in the hero while it fits two lines at 1440px. */
const DEK_MAX_CHARS: Record<string, number> = { en: 195, es: 195, ja: 100 };

const FEATURED_COUNT = 3;

export async function SubcategoryView({ doc, locale }: { doc: SubcategoryDoc; locale: Locale }) {
  const t = await getTranslations('subcategory');
  const tNav = await getTranslations('nav');
  const ts = await getTranslations('tourSystem');
  const tDay = await getTranslations('dayTours');
  const th = await getTranslations('dayHub');
  const tc = await getTranslations('cityHub');
  const tp = await getTranslations('packagesHub');
  const isJa = locale === 'ja';

  const trackKey = doc.category?.key ?? 'private-day-tour';
  const isGroup = trackKey === 'group-day-tour';
  const trackLabel = isGroup ? t('trackGroup') : t('trackPrivate');
  const heroKicker = isGroup ? t('heroKickerGroup') : t('heroKickerPrivate');
  const cityName = doc.destinationCity?.name ?? '';
  const hubPath = isGroup ? '/group-day-tours' : '/private-day-tours';
  const citySlug = doc.destinationCity?.slug ?? '';
  const heroImage = doc.heroImage?.asset ? doc.heroImage : doc.destinationCity?.heroImage ?? null;
  const hub = doc.slug;

  // Other-track landing for the cross-link.
  const otherKey = OTHER_TRACK[trackKey];
  const other =
    otherKey && doc.destinationCity?._id
      ? await client.fetch<{ slug?: string } | null>(otherTrackLandingSlugQuery(locale), {
          otherKey,
          cityId: doc.destinationCity._id,
        })
      : null;

  // No product image: the page hero stands in (never an empty grey box).
  const tours = ((doc.tours ?? []) as RawHubTour[])
    .filter((tr) => tr.slug)
    .map((tr) => (tr.heroImage?.asset || !heroImage ? tr : { ...tr, heroImage: { ...heroImage, alt: tr.title } }));

  const [fx, rtFull, renderCard] = await Promise.all([getRates(), responseTimeFull(locale), dayCardRenderer(locale)]);
  const built = await buildDayHub(tours, {
    locale,
    hub,
    rates: fx.rates,
    showCity: false,
    listName: 'day_hub_index',
    redSeaListName: 'day_hub_index',
  });

  // Featured: the same picks as before (owner, 2026-11-09: "same picks, now
  // priced"): the editor's featured flags first, then the landing's own tour
  // order. Never hand-picked here, and never re-sorted by price (that would
  // lead with e.g. an airport transfer on a Red Sea page).
  const byId = new Map(tours.map((tr) => [tr._id, tr]));
  const flagged = (doc.tourPresentation ?? []).filter((p) => p.featured && p.tourId).map((p) => byId.get(p.tourId!));
  const featured: RawHubTour[] = [];
  for (const tr of [...flagged, ...tours]) {
    if (tr && !featured.some((f) => f._id === tr._id)) featured.push(tr);
  }
  featured.splice(FEATURED_COUNT);

  // Counters: unique titles count once; "from" is the lowest per-person price.
  const uniqueCount = new Set(tours.map((tr) => tr.title.trim().toLowerCase())).size;
  const lowest = minPrice(tours);
  const stats = [
    { label: tc('statDayTours'), value: uniqueCount },
    ...(lowest ? [{ label: tc('statFromPp'), value: isJa ? <><Price eur={lowest} />〜</> : <Price eur={lowest} /> }] : []),
    { label: tp('statSince'), value: tp('statSinceValue') },
  ];

  const dek = doc.summary?.trim() ?? '';
  const dekInHero = dek.length > 0 && dek.length <= (DEK_MAX_CHARS[locale] ?? 170);
  const heroPrefill: LeadPrefill = { hub, notes: th('notesCity', { city: cityName }) };

  const mood = doc.moodChooser;
  const moodCards = (mood?.cards ?? []).filter((c) => c.title);
  const orient = doc.orientation;
  const orientStops = (orient?.stops ?? []).filter((s) => s.name);
  const journal = (doc.journalRefs ?? []).filter((j) => j.title);

  return (
    <div className="tour-doc lvl-subcategory lvl-hub lvl-theme lvl-cityhub" lang={locale}>
      <JsonLd
        data={[
          // Mirrors the visible crumb ("Day Tours" is plain text there and has no page).
          buildBreadcrumbList(
            [
              { name: tNav('home'), path: '/' },
              { name: trackLabel, path: hubPath },
              { name: doc.title, path: `/${doc.slug}` },
            ],
            locale,
          ),
          buildItemListSchema(built.sorted, locale),
        ]}
      />

      {/* 1. Breadcrumb, above the hero. */}
      <div className="t2e-wrap">
        <nav className="t2e-crumb theme-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{t('breadcrumbDayTours')}</li>
            <li><Link href={hubPath}>{trackLabel}</Link></li>
            <li>{cityName}</li>
          </ol>
        </nav>
      </div>

      {/* 2. Photo hero + counters band. */}
      <header className="theme-hero">
        <div className="bg">
          <JourneyImage image={heroImage} alt="" className="" sizes="100vw" widthHint={2560} priority fetchPriority="high" />
        </div>
        <div className="t2e-wrap theme-hero-inner">
          <span className="t2e-kicker">{heroKicker} · {cityName}</span>
          <h1>{doc.title}</h1>
          {dekInHero && <p className="theme-dek">{dek}</p>}
          <div className="hub-cta">
            <LeadButton
              source="city_hub_hero"
              prefill={heroPrefill}
              openEvent={{ name: 'form_open', params: { form_location: 'city_hub_hero', hub } }}
              className="hub-btn"
            >
              {tc('heroCta')} <span aria-hidden>→</span>
            </LeadButton>
            {tours.length > 0 && <a className="hub-text-link" href="#tours">{tc('seeTheTours')}</a>}
          </div>
        </div>
      </header>
      <div className="theme-band">
        <div className="t2e-wrap">
          {!dekInHero && dek && <p className="theme-dek-below">{dek}</p>}
          <MastheadStats stats={stats} />
        </div>
      </div>

      <main>
        {/* 3. Days we would not miss — the day-tour card. */}
        {featured.length > 0 && (
          <section className="hub-sec hub-mb theme-featured" id="tours" aria-labelledby="h-city-featured">
            <div className="t2e-wrap">
              <div className="t2e-section-head">
                <div>
                  <h2 id="h-city-featured">{ts('toursTitle')} <em>{ts('toursTitleEm')}</em></h2>
                </div>
                <p>{ts('toursIntro')}</p>
              </div>
              <div className="lvl-home lvl-sales">
                <ul className="dcards">
                  {featured.map((tr) => renderCard(tr, { listName: 'city_hub_picks', hub, showCity: false }))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 4. Every {city} day — filters, sort, count, URL state. Hidden when
            the page has no tours (no "no match" message without a filter). */}
        {tours.length > 0 && (
        <section className="index" id="every-day" style={{ scrollMarginTop: 80 }}>
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{ts('cityIndexKicker')}</span>
                <h2>{ts('cityIndexTitle', { city: cityName })} <em>{ts('cityIndexTitleEm')}</em></h2>
              </div>
              <p>{ts('cityIndexIntro', { city: cityName })}</p>
            </div>
            <DayHubList
              // One city per page: the hubs' Nile / Red Sea split doesn't
              // apply (the list would otherwise hide a Red Sea city's tours).
              items={built.items.map((it) => ({ ...it, redSea: false }))}
              cards={built.cards}
              budgetEdges={built.budgetEdges}
              showRedSeaSection={false}
              lengthLabels={{
                label: tDay('filterLength'),
                any: tDay('anyLength'),
                half: tDay('lengthHalf'),
                full: tDay('lengthFull'),
                extended: tDay('lengthExtended'),
              }}
              lengthNote={tDay('lengthHint')}
              hub={hub}
            />
          </div>
        </section>
        )}

        {/* 5. City editorial — below the tours, text unchanged. */}
        {(doc.intro || doc.editorByline?.heading) && (
          <section className="editorial theme-editorial">
            <div className="t2e-wrap intro-grid">
              <aside className="byline">
                <span className="t2e-kicker">{doc.editorByline?.kicker ?? ts('editorView')}</span>
                {doc.editorByline?.heading && <h3>{doc.editorByline.heading}</h3>}
                {doc.editorByline?.intro && <p>{doc.editorByline.intro}</p>}
                {doc.editorByline?.mini && <p className="mini">{doc.editorByline.mini}</p>}
              </aside>
              <article className="article">
                <TourProse value={doc.intro} locale={locale} />
              </article>
            </div>
          </section>
        )}

        {moodCards.length > 0 && (
          <section className="choose">
            <div className="t2e-wrap">
              <div className="t2e-section-head">
                <h2>{mood?.heading ?? ts('moodHeading', { city: cityName })}</h2>
                {mood?.intro && <p>{mood.intro}</p>}
              </div>
              <div className="choice-grid">
                {moodCards.map((c, i) => (
                  <a className="choice" href="#every-day" key={i}>
                    <div>
                      <JourneyImage image={c.image} alt="" className="choice-visual" sizes="(max-width:980px) 100vw, 370px" widthHint={740} ratio={4 / 3} />
                      {c.eyebrow && <span className="t2e-eyebrow">{c.eyebrow}</span>}
                      <h3>{c.title}</h3>
                      {c.body && <p>{c.body}</p>}
                    </div>
                    <div>
                      {c.bullets && c.bullets.length > 0 && <ul>{c.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
                      {c.jumpLabel && <div className="jump">{c.jumpLabel}</div>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {orientStops.length > 0 && (
          <section className="orient">
            <div className="t2e-wrap orient-grid">
              <div className="spine">
                {orient?.baseLabel && <div className="base">{orient.baseLabel}</div>}
                {orient?.baseName && <div className="base-name">{orient.baseName}</div>}
                {orientStops.map((s, i) => (
                  <div className="stop" key={i}>
                    <div>
                      <div className="s-name">{s.name}</div>
                      {s.sub && <div className="s-sub">{s.sub}</div>}
                    </div>
                    <div className="s-time">
                      {s.time}
                      {s.effort && <small>{s.effort}</small>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="orient-copy">
                {orient?.copyKicker && <span className="t2e-kicker">{orient.copyKicker}</span>}
                {orient?.copyHeading && <h2>{orient.copyHeading}</h2>}
                {orient?.copyBody && <p>{orient.copyBody}</p>}
                {orient?.effort && orient.effort.length > 0 && (
                  <ul className="effort">
                    {orient.effort.map((e, i) => (
                      <li key={i}>
                        <strong>{e.label}</strong>
                        <span>{e.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        {journal.length > 0 && (
          <section className="journal">
            <div className="t2e-wrap">
              <div className="t2e-section-head">
                <h2>{ts('journalTitle')} <em>{ts('journalTitleEm')}</em></h2>
                <p>{ts('journalIntro')}</p>
              </div>
              <div className="journal-grid">
                {journal.slice(0, 3).map((j) => {
                  const href = j._type === 'guideArticle' ? (j.parentCity?.slug ? `/guide/${j.parentCity.slug}/${j.slug}` : `/guide/${j.slug}`) : `/blog/${j.slug}`;
                  return (
                    <Link key={j._id} href={href}>
                      {j.kicker && <small>{j.kicker}</small>}
                      <h3>{j.title}</h3>
                      {j.summary && <p>{j.summary}</p>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 6. FAQ — unchanged. */}
        <LandingFaq items={withStandardFaq(doc.faq, locale)} locale={locale} />

        {/* 7. The closing form (source day_tour_hub, as before). */}
        <DayHubEnd locale={locale} hub={hub} city={cityName} responseTimeFull={rtFull} />

        <section className="t2e-footband">
          <div className="t2e-wrap t2e-footband-grid">
            <div>
              <h4>{t('footInSeasonLabel')}</h4>
              <div className="t2e-season">
                <p>{t('footInSeasonBody')}</p>
              </div>
            </div>
            <div>
              <h4>{t('aroundCity', { city: cityName })}</h4>
              <ul>
                <li><Link href={citySlug ? `/guide/${citySlug}` : '/guide'}>{t('crosslinkCityGuide', { city: cityName })}<small>{t('crosslinkGuideKicker')}</small></Link></li>
                <li><Link href="/hotels">{t('crosslinkHotels', { city: cityName })}<small>{t('crosslinkHotelsKicker')}</small></Link></li>
                {isGroup && (
                  <li><Link href="/small-group-travel-packages">{ts('grpSeeMultiDay')}</Link></li>
                )}
                {other?.slug && (
                  <li>
                    <Link href={`/${other.slug}`}>
                      {isGroup ? t('crosslinkOtherPrivate', { city: cityName }) : t('crosslinkOtherGroup', { city: cityName })}
                      <small>{t('crosslinkOtherKicker')}</small>
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <FloatingConcierge />
    </div>
  );
}
